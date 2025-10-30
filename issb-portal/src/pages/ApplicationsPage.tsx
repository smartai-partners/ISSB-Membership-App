import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Application } from '@/types';

export function ApplicationsPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!profile || !['admin', 'board'].includes(profile.role)) {
      navigate('/');
      return;
    }
    loadApplications();
  }, [profile, navigate]);

  async function loadApplications() {
    try {
      const { data } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setApplications(data);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleProcessApplication(action: 'approve' | 'reject') {
    if (!selectedApp) return;

    try {
      const { error } = await supabase.functions.invoke('process-application', {
        body: {
          applicationId: selectedApp.id,
          action,
          notes: reviewNotes,
          rejectionReason: action === 'reject' ? rejectionReason : null,
        },
      });

      if (error) throw error;

      alert(`Application ${action}d successfully!`);
      setSelectedApp(null);
      setReviewNotes('');
      setRejectionReason('');
      loadApplications();
    } catch (error) {
      console.error('Error processing application:', error);
      alert('Failed to process application. Please try again.');
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading applications...</div>;
  }

  const pendingApps = applications.filter(a => a.status === 'pending');
  const reviewedApps = applications.filter(a => a.status !== 'pending');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Application Review</h1>
        <p className="text-gray-600 mt-2">Review and process membership applications</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600">{pendingApps.length}</div>
          <div className="text-sm text-gray-600">Pending Review</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {applications.filter(a => a.status === 'approved').length}
          </div>
          <div className="text-sm text-gray-600">Approved</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">
            {applications.filter(a => a.status === 'rejected').length}
          </div>
          <div className="text-sm text-gray-600">Rejected</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{applications.length}</div>
          <div className="text-sm text-gray-600">Total Applications</div>
        </div>
      </div>

      {/* Pending Applications */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Pending Applications</h2>
        {pendingApps.length === 0 ? (
          <p className="text-gray-500">No pending applications</p>
        ) : (
          <div className="space-y-4">
            {pendingApps.map((app) => (
              <div key={app.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {app.first_name} {app.last_name}
                      </h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium capitalize">
                        {app.membership_tier}
                      </span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>Email: {app.email}</div>
                      <div>Phone: {app.phone}</div>
                      <div>Location: {app.city}, {app.state}</div>
                      <div>Submitted: {new Date(app.created_at).toLocaleDateString()}</div>
                    </div>
                    {app.reason_for_joining && (
                      <p className="text-sm text-gray-700 mt-2">
                        <span className="font-medium">Reason: </span>
                        {app.reason_for_joining}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedApp(app)}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reviewed Applications */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Recently Reviewed</h2>
        {reviewedApps.length === 0 ? (
          <p className="text-gray-500">No reviewed applications</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reviewed</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reviewedApps.slice(0, 10).map((app) => (
                  <tr key={app.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {app.first_name} {app.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {app.membership_tier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          app.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {app.status === 'approved' ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {app.reviewed_at ? new Date(app.reviewed_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-semibold mb-4">Review Application</h3>
            
            <div className="space-y-4 mb-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <div className="mt-1 text-sm text-gray-900">{selectedApp.first_name} {selectedApp.last_name}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Membership Tier</label>
                  <div className="mt-1 text-sm text-gray-900 capitalize">{selectedApp.membership_tier}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="mt-1 text-sm text-gray-900">{selectedApp.email}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <div className="mt-1 text-sm text-gray-900">{selectedApp.phone}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <div className="mt-1 text-sm text-gray-900">{new Date(selectedApp.date_of_birth).toLocaleDateString()}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Occupation</label>
                  <div className="mt-1 text-sm text-gray-900">{selectedApp.occupation || 'N/A'}</div>
                </div>
              </div>

              {selectedApp.reason_for_joining && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reason for Joining</label>
                  <div className="mt-1 text-sm text-gray-900">{selectedApp.reason_for_joining}</div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review Notes</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Add notes about this application"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason (if rejecting)</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter reason for rejection"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleProcessApplication('reject')}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Reject
              </button>
              <button
                onClick={() => handleProcessApplication('approve')}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
