import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Clock, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { VolunteerOpportunity, VolunteerHours } from '@/types';

export function AdminVolunteerManagement() {
  const { user, profile } = useAuth();
  const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([]);
  const [pendingHours, setPendingHours] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'opportunities' | 'hours' | 'analytics'>('opportunities');
  const [showOpportunityForm, setShowOpportunityForm] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<VolunteerOpportunity | null>(null);

  const [opportunityForm, setOpportunityForm] = useState({
    title: '',
    description: '',
    category: '',
    date_time: '',
    duration_hours: '',
    location: '',
    max_volunteers: '',
    required_skills: '',
    status: 'DRAFT',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      // Load opportunities
      const { data: opps, error: oppsError } = await supabase
        .from('volunteer_opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (opps) setOpportunities(opps);

      // Load pending hours for approval
      const { data: hours, error: hoursError } = await supabase
        .from('volunteer_hours')
        .select(`
          *,
          profiles!volunteer_hours_user_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: true });

      if (hours) setPendingHours(hours);

      // Load analytics
      const { data: analyticsData, error: analyticsError } = await supabase.functions.invoke('volunteer-analytics');
      if (analyticsData?.data) {
        setAnalytics(analyticsData.data);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateOpportunity(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('volunteer_opportunities')
        .insert({
          ...opportunityForm,
          duration_hours: parseFloat(opportunityForm.duration_hours),
          capacity: parseInt(opportunityForm.max_volunteers) || null,
          max_volunteers: parseInt(opportunityForm.max_volunteers) || null,
          current_volunteers: 0,
          required_skills: opportunityForm.required_skills ? opportunityForm.required_skills.split(',').map(s => s.trim()) : [],
          created_by: user.id,
          hours_required: parseFloat(opportunityForm.duration_hours),
          opportunity_type: 'event',
        });

      if (error) throw error;

      alert('Opportunity created successfully!');
      setShowOpportunityForm(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Error creating opportunity:', error);
      alert(error.message || 'Failed to create opportunity.');
    }
  }

  async function handleDeleteOpportunity(id: string) {
    if (!confirm('Are you sure you want to delete this opportunity?')) return;

    try {
      const { error } = await supabase
        .from('volunteer_opportunities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Opportunity deleted successfully.');
      loadData();
    } catch (error: any) {
      console.error('Error deleting opportunity:', error);
      alert(error.message || 'Failed to delete opportunity.');
    }
  }

  async function handleApproveHours(hourLog: any, action: 'APPROVE' | 'REJECT', rejectionReason?: string) {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('approve-volunteer-hours', {
        body: {
          hourLogId: hourLog.id,
          action,
          adminId: user.id,
          adminNotes: '',
          rejectionReason: rejectionReason || '',
        }
      });

      if (error) throw error;

      alert(`Hours ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully!`);
      loadData();
    } catch (error: any) {
      console.error('Error processing hours:', error);
      alert(error.message || 'Failed to process hours.');
    }
  }

  function resetForm() {
    setOpportunityForm({
      title: '',
      description: '',
      category: '',
      date_time: '',
      duration_hours: '',
      location: '',
      max_volunteers: '',
      required_skills: '',
      status: 'DRAFT',
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Volunteer Management</h1>
          <p className="text-gray-600 mt-1">Manage opportunities and approve volunteer hours</p>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {analytics && (
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 font-semibold">Total Opportunities</h3>
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">{analytics.overview.totalOpportunities}</p>
            <p className="text-sm text-gray-500 mt-1">{analytics.overview.activeOpportunities} active</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 font-semibold">Total Sign-ups</h3>
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-600">{analytics.overview.totalSignups}</p>
            <p className="text-sm text-gray-500 mt-1">{analytics.overview.confirmedSignups} confirmed</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 font-semibold">Total Hours</h3>
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-600">{analytics.hours.totalApprovedHours.toFixed(1)}</p>
            <p className="text-sm text-gray-500 mt-1">{analytics.hours.pendingApprovals} pending approval</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 font-semibold">Waiver Eligible</h3>
              <CheckCircle className="w-6 h-6 text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-amber-600">{analytics.overview.waiverEligibleMembers}</p>
            <p className="text-sm text-gray-500 mt-1">Members with 30+ hours</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('opportunities')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'opportunities'
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Opportunities ({opportunities.length})
            </button>
            <button
              onClick={() => setActiveTab('hours')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'hours'
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Pending Approvals ({pendingHours.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'analytics'
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Opportunities Tab */}
          {activeTab === 'opportunities' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Volunteer Opportunities</h2>
                <button
                  onClick={() => setShowOpportunityForm(!showOpportunityForm)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Opportunity
                </button>
              </div>

              {showOpportunityForm && (
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-bold mb-4">Create New Opportunity</h3>
                  <form onSubmit={handleCreateOpportunity} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Title *"
                        required
                        value={opportunityForm.title}
                        onChange={(e) => setOpportunityForm({ ...opportunityForm, title: e.target.value })}
                        className="px-4 py-2 border rounded-lg"
                      />
                      <select
                        value={opportunityForm.category}
                        onChange={(e) => setOpportunityForm({ ...opportunityForm, category: e.target.value })}
                        className="px-4 py-2 border rounded-lg"
                      >
                        <option value="">Select Category</option>
                        <option value="Education">Education</option>
                        <option value="Community Service">Community Service</option>
                        <option value="Events">Events</option>
                        <option value="Facility">Facility Maintenance</option>
                        <option value="Youth">Youth Programs</option>
                      </select>
                    </div>
                    <textarea
                      placeholder="Description *"
                      required
                      value={opportunityForm.description}
                      onChange={(e) => setOpportunityForm({ ...opportunityForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <div className="grid md:grid-cols-3 gap-4">
                      <input
                        type="datetime-local"
                        value={opportunityForm.date_time}
                        onChange={(e) => setOpportunityForm({ ...opportunityForm, date_time: e.target.value })}
                        className="px-4 py-2 border rounded-lg"
                      />
                      <input
                        type="number"
                        placeholder="Duration (hours) *"
                        required
                        step="0.5"
                        value={opportunityForm.duration_hours}
                        onChange={(e) => setOpportunityForm({ ...opportunityForm, duration_hours: e.target.value })}
                        className="px-4 py-2 border rounded-lg"
                      />
                      <input
                        type="number"
                        placeholder="Max Volunteers"
                        value={opportunityForm.max_volunteers}
                        onChange={(e) => setOpportunityForm({ ...opportunityForm, max_volunteers: e.target.value })}
                        className="px-4 py-2 border rounded-lg"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Location"
                      value={opportunityForm.location}
                      onChange={(e) => setOpportunityForm({ ...opportunityForm, location: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Required Skills (comma separated)"
                      value={opportunityForm.required_skills}
                      onChange={(e) => setOpportunityForm({ ...opportunityForm, required_skills: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <select
                      value={opportunityForm.status}
                      onChange={(e) => setOpportunityForm({ ...opportunityForm, status: e.target.value })}
                      className="px-4 py-2 border rounded-lg"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="ACTIVE">Active</option>
                      <option value="closed">Closed</option>
                    </select>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => { setShowOpportunityForm(false); resetForm(); }}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Create
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="space-y-3">
                {opportunities.map((opp) => (
                  <div key={opp.id} className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{opp.title}</h3>
                        <p className="text-gray-600 mt-1">{opp.description}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                          {opp.category && <span className="bg-green-100 text-green-800 px-2 py-1 rounded">{opp.category}</span>}
                          {opp.location && <span>{opp.location}</span>}
                          <span>{opp.current_volunteers || 0} / {opp.capacity || opp.max_volunteers || '∞'} volunteers</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          opp.status === 'ACTIVE' || opp.status === 'open' ? 'bg-green-100 text-green-800' :
                          opp.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {opp.status}
                        </span>
                        <button
                          onClick={() => handleDeleteOpportunity(opp.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hours Approval Tab */}
          {activeTab === 'hours' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Pending Hour Approvals</h2>
              {pendingHours.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-xl text-gray-600">No pending approvals</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingHours.map((hour) => (
                    <div key={hour.id} className="border rounded-lg p-6 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900">
                            {hour.profiles?.first_name} {hour.profiles?.last_name}
                          </h3>
                          <p className="text-gray-600">{hour.profiles?.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">{hour.hours} hours</p>
                          <p className="text-sm text-gray-500">{new Date(hour.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-4">{hour.description}</p>
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => {
                            const reason = prompt('Reason for rejection (optional):');
                            handleApproveHours(hour, 'REJECT', reason || '');
                          }}
                          className="inline-flex items-center px-4 py-2 border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-50 font-semibold"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleApproveHours(hour, 'APPROVE')}
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && analytics && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Volunteer Program Analytics</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Overview</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Unique Volunteers:</span>
                      <span className="font-semibold">{analytics.overview.uniqueVolunteers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Hours per Volunteer:</span>
                      <span className="font-semibold">{analytics.hours.avgHoursPerVolunteer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Capacity Utilization:</span>
                      <span className="font-semibold">{analytics.capacity.avgUtilization}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Recent Activity (7 days)</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">New Sign-ups:</span>
                      <span className="font-semibold">{analytics.recentActivity.last7DaysSignups}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hours Logged:</span>
                      <span className="font-semibold">{analytics.recentActivity.last7DaysHoursLogged}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-4">Top Opportunities by Sign-ups</h3>
                {analytics.topOpportunities.length === 0 ? (
                  <p className="text-gray-600">No data available</p>
                ) : (
                  <div className="space-y-3">
                    {analytics.topOpportunities.map((opp: any, index: number) => (
                      <div key={opp.id} className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="font-bold text-gray-400 mr-3">#{index + 1}</span>
                          <span className="font-semibold">{opp.title}</span>
                        </div>
                        <span className="text-green-600 font-bold">{opp.signups} sign-ups</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
