import React, { useEffect, useState } from 'react';
import { Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { VolunteerOpportunity, VolunteerHours } from '@/types';

export function VolunteersPage() {
  const { user, profile } = useAuth();
  const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([]);
  const [myHours, setMyHours] = useState<VolunteerHours[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logForm, setLogForm] = useState({
    hours: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    try {
      // Load opportunities
      const { data: opps } = await supabase
        .from('volunteer_opportunities')
        .select('*')
        .eq('status', 'open')
        .order('start_date', { ascending: true });

      if (opps) setOpportunities(opps);

      // Load my hours
      if (user) {
        const { data: hours } = await supabase
          .from('volunteer_hours')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (hours) {
          setMyHours(hours);
          const approved = hours.filter(h => h.status === 'approved');
          const total = approved.reduce((sum, h) => sum + h.hours, 0);
          setTotalHours(total);
        }
      }
    } catch (error) {
      console.error('Error loading volunteer data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogHours() {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('log-volunteer-hours', {
        body: {
          hours: parseFloat(logForm.hours),
          date: logForm.date,
          description: logForm.description,
        },
      });

      if (error) throw error;

      setShowLogModal(false);
      setLogForm({ hours: '', date: new Date().toISOString().split('T')[0], description: '' });
      loadData();
    } catch (error) {
      console.error('Error logging hours:', error);
      alert('Failed to log volunteer hours. Please try again.');
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Please sign in to access the Volunteers Portal</h2>
        <p className="text-gray-600">You need to be logged in to view volunteer opportunities and track your hours.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Volunteers Portal</h1>
          <p className="text-gray-600 mt-2">Find opportunities and track your volunteer hours</p>
        </div>
        <button
          onClick={() => setShowLogModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Log Hours
        </button>
      </div>

      {/* Hours Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Your Volunteer Summary</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{totalHours}</div>
            <div className="text-sm text-gray-600">Total Hours (Approved)</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {myHours.filter(h => h.status === 'approved').length}
            </div>
            <div className="text-sm text-gray-600">Approved Entries</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {myHours.filter(h => h.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending Approval</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{opportunities.length}</div>
            <div className="text-sm text-gray-600">Open Opportunities</div>
          </div>
        </div>
      </div>

      {/* Volunteer Opportunities */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Open Opportunities</h2>
        {opportunities.length === 0 ? (
          <p className="text-gray-500">No open volunteer opportunities at this time.</p>
        ) : (
          <div className="space-y-4">
            {opportunities.map((opp) => (
              <div key={opp.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">{opp.title}</h3>
                    <p className="text-gray-600 mt-1">{opp.description}</p>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {opp.hours_required} hours required
                      </div>
                      {opp.location && <div>Location: {opp.location}</div>}
                      {opp.start_date && <div>Start: {new Date(opp.start_date).toLocaleDateString()}</div>}
                    </div>
                  </div>
                  <span className="ml-4 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium capitalize">
                    {opp.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Hours Log */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">My Hours Log</h2>
        {myHours.length === 0 ? (
          <p className="text-gray-500">No volunteer hours logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {myHours.map((hour) => (
                  <tr key={hour.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(hour.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{hour.hours}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{hour.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          hour.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : hour.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {hour.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {hour.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                        {hour.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Hours Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Log Volunteer Hours</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={logForm.hours}
                  onChange={(e) => setLogForm({ ...logForm, hours: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter hours worked"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={logForm.date}
                  onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={logForm.description}
                  onChange={(e) => setLogForm({ ...logForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Describe what you did"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogHours}
                  disabled={!logForm.hours || !logForm.description}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  Log Hours
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
