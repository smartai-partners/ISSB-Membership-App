import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGetSubscriptionStatusQuery, useGetVolunteerProgressQuery, useLogVolunteerHoursMutation } from '@/store/api/membershipApi';
import { CheckCircle, Clock, XCircle, Calendar, FileText, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const MembershipDashboardPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const success = searchParams.get('subscription');
  
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useGetSubscriptionStatusQuery();
  const { data: volunteerData, isLoading: isLoadingVolunteer } = useGetVolunteerProgressQuery();
  const [logVolunteerHours] = useLogVolunteerHoursMutation();

  const [formData, setFormData] = useState({
    hours: '',
    date: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const subscription = subscriptionData?.subscription;
  const volunteerProgress = volunteerData?.summary;
  const volunteerHours = volunteerData?.volunteerHours || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      await logVolunteerHours({
        hours: parseFloat(formData.hours),
        date: formData.date,
        description: formData.description
      }).unwrap();

      setSubmitMessage({ type: 'success', text: 'Volunteer hours logged successfully! Awaiting admin approval.' });
      setFormData({ hours: '', date: '', description: '' });
    } catch (error: any) {
      setSubmitMessage({ type: 'error', text: error.data?.error?.message || 'Failed to log volunteer hours' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingSubscription || isLoadingVolunteer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading membership dashboard...</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">No Active Membership</h1>
          <p className="text-gray-600 mb-6">
            You don't have an active membership. Choose your path to get started.
          </p>
          <Button onClick={() => navigate('/membership')}>
            View Membership Plans
          </Button>
        </div>
      </div>
    );
  }

  const activationMethod = subscription?.activation_method || 'none';
  const isPaymentActivated = activationMethod === 'payment';
  const isVolunteerActivated = activationMethod === 'volunteer';
  const hasActiveSubscription = subscription?.status === 'active';

  const progressPercentage = volunteerProgress ? Math.min((volunteerProgress.totalApprovedHours / 30) * 100, 100) : 0;
  const hoursRemaining = Math.max(30 - (volunteerProgress?.totalApprovedHours || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Success Alert */}
        {success === 'success' && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Your membership has been activated successfully! Welcome to ISSB.
            </AlertDescription>
          </Alert>
        )}

        <h1 className="text-4xl font-bold text-gray-900 mb-8">Membership Dashboard</h1>

        {/* Membership Status Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Membership Status</h2>
              <p className="text-gray-600">Individual Annual Membership - $360/year</p>
            </div>
            <div className="flex items-center space-x-2">
              {hasActiveSubscription ? (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">
                  <Clock className="w-4 h-4 mr-2" />
                  Inactive
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm font-medium text-blue-900 mb-1">Activation Method</p>
              <p className="text-lg font-bold text-blue-700">
                {isPaymentActivated && 'Payment ($360)'}
                {isVolunteerActivated && 'Volunteer Hours (30 hrs)'}
                {!hasActiveSubscription && 'Not Activated'}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl">
              <p className="text-sm font-medium text-purple-900 mb-1">Status</p>
              <p className="text-lg font-bold text-purple-700 capitalize">
                {subscription?.status || 'No Subscription'}
              </p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl">
              <p className="text-sm font-medium text-amber-900 mb-1">Member Since</p>
              <p className="text-lg font-bold text-amber-700">
                {subscription?.created_at 
                  ? new Date(subscription.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Volunteer Hours Progress Section */}
        {!isPaymentActivated && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
            <div className="flex items-center mb-6">
              <Award className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Volunteer Hours Progress</h2>
                <p className="text-gray-600">Track your progress toward membership activation</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700">
                  {volunteerProgress?.totalApprovedHours || 0} / 30 hours completed
                </span>
                <span className="text-sm font-semibold text-blue-600">
                  {progressPercentage.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              {progressPercentage >= 100 ? (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-900">Congratulations! Goal Reached!</p>
                    <p className="text-sm text-green-700 mt-1">
                      You've completed 30 hours of volunteering. Your membership has been activated!
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-600">
                  {hoursRemaining} hours remaining to activate your membership
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <p className="text-sm font-medium text-blue-900 mb-1">Approved Hours</p>
                <p className="text-3xl font-bold text-blue-700">{volunteerProgress?.totalApprovedHours || 0}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl">
                <p className="text-sm font-medium text-amber-900 mb-1">Pending Review</p>
                <p className="text-3xl font-bold text-amber-700">{volunteerProgress?.totalPendingHours || 0}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <p className="text-sm font-medium text-purple-900 mb-1">Hours Needed</p>
                <p className="text-3xl font-bold text-purple-700">{hoursRemaining}</p>
              </div>
            </div>
          </div>
        )}

        {/* Log Volunteer Hours Form */}
        {!isPaymentActivated && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Log Volunteer Hours</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="hours" className="block text-sm font-semibold text-gray-700 mb-2">
                    Number of Hours
                  </label>
                  <input
                    type="number"
                    id="hours"
                    min="0.5"
                    step="0.5"
                    max="24"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 4"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-2">
                    Date Completed
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <Calendar className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                  Activity Description
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your volunteer activity (e.g., Event setup, Community outreach, Administrative support)"
                  required
                />
              </div>

              {submitMessage && (
                <div className={`p-4 rounded-lg ${
                  submitMessage.type === 'success' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-sm ${
                    submitMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {submitMessage.text}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Volunteer Hours'}
              </button>
            </form>
          </div>
        )}

        {/* Volunteer Hours History */}
        {!isPaymentActivated && volunteerHours.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Volunteer Hours History</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Hours</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {volunteerHours.map((hour) => (
                    <tr key={hour.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {new Date(hour.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-semibold text-gray-900">{hour.hours} hrs</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-start text-sm text-gray-600 max-w-md">
                          <FileText className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{hour.description}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {hour.status === 'approved' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approved
                          </span>
                        )}
                        {hour.status === 'pending' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </span>
                        )}
                        {hour.status === 'rejected' && (
                          <div>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 mb-2">
                              <XCircle className="w-3 h-3 mr-1" />
                              Rejected
                            </span>
                            {hour.admin_notes && (
                              <p className="text-xs text-red-600 mt-1">Note: {hour.admin_notes}</p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payment-Activated Membership Message */}
        {isPaymentActivated && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-lg p-8 border border-blue-100">
            <div className="flex items-start">
              <CheckCircle className="w-8 h-8 text-blue-600 mr-4 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Active Paid Membership</h3>
                <p className="text-gray-700 mb-4">
                  Your membership has been activated through payment. Thank you for your support!
                </p>
                <p className="text-sm text-gray-600">
                  While volunteer hours tracking is available for volunteer-activated memberships, 
                  you can still contribute to the community through our volunteer opportunities.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
