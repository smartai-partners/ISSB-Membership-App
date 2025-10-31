import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { VolunteerOpportunity } from '@/types';

interface HourLogFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function HourLogForm({ onSuccess, onCancel }: HourLogFormProps) {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([]);
  const [form, setForm] = useState({
    opportunityId: '',
    hours: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingOpps, setLoadingOpps] = useState(true);

  useEffect(() => {
    loadOpportunities();
  }, []);

  async function loadOpportunities() {
    try {
      const { data, error } = await supabase
        .from('volunteer_opportunities')
        .select('*')
        .order('title', { ascending: true });

      if (data) {
        setOpportunities(data);
      }
    } catch (error) {
      console.error('Error loading opportunities:', error);
    } finally {
      setLoadingOpps(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('volunteer_hours')
        .insert({
          user_id: user.id,
          opportunity_id: form.opportunityId || null,
          hours: parseFloat(form.hours),
          date: form.date,
          description: form.description,
          status: 'PENDING',
          counts_toward_waiver: true,
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      alert('Volunteer hours logged successfully! Awaiting admin approval.');
      
      // Reset form
      setForm({
        opportunityId: '',
        hours: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error logging hours:', error);
      alert(error.message || 'Failed to log volunteer hours. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center mb-6">
        <Plus className="w-8 h-8 text-green-600 mr-3" />
        <h2 className="text-2xl font-bold text-gray-900">Log Volunteer Hours</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Opportunity Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Related Opportunity (Optional)
          </label>
          <select
            value={form.opportunityId}
            onChange={(e) => setForm({ ...form, opportunityId: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={loadingOpps}
          >
            <option value="">Select an opportunity (or leave blank)</option>
            {opportunities.map((opp) => (
              <option key={opp.id} value={opp.id}>
                {opp.title}
              </option>
            ))}
          </select>
        </div>

        {/* Hours */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Hours Volunteered <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            max="24"
            required
            value={form.hours}
            onChange={(e) => setForm({ ...form, hours: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter hours (e.g., 2.5)"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            required
            value={form.date}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Describe your volunteer work (e.g., Assisted with Friday prayer setup, Taught Quran class to youth, Facility maintenance)"
          />
          <p className="mt-2 text-sm text-gray-500">
            Please provide specific details about your volunteer activities.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !form.hours || !form.description}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? 'Logging...' : 'Log Hours'}
          </button>
        </div>
      </form>

      <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> All volunteer hours are subject to admin approval. 
          Approved hours will count toward your 30-hour membership fee waiver goal.
        </p>
      </div>
    </div>
  );
}
