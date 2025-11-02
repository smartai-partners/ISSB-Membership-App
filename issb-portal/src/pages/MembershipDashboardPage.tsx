import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGetSubscriptionStatusQuery, useGetVolunteerProgressQuery, useLogVolunteerHoursMutation, useGetMemberAssignmentsQuery } from '@/store/api/membershipApi';
import { CheckCircle, Clock, XCircle, Calendar, FileText, Award, AlertCircle, TrendingUp, Users, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OpportunitiesBrowse } from '@/components/volunteer/OpportunitiesBrowse';
import { MyAssignments } from '@/components/volunteer/MyAssignments';

export const MembershipDashboardPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const success = searchParams.get('subscription');
  
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useGetSubscriptionStatusQuery();
  const { data: volunteerData, isLoading: isLoadingVolunteer } = useGetVolunteerProgressQuery();
  const { data: assignmentsData } = useGetMemberAssignmentsQuery({});
  const [logVolunteerHours] = useLogVolunteerHoursMutation();

  const [activeTab, setActiveTab] = useState<'progress' | 'opportunities' | 'assignments' | 'log'>('progress');
  const [formData, setFormData] = useState({
    hours: '',
    date: '',
    description: '',
    assignmentId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const subscription = subscriptionData?.subscription;
  const volunteerProgress = volunteerData?.summary;
  const volunteerHours = volunteerData?.volunteerHours || [];
  const assignments = assignmentsData?.assignments || [];
  const upcomingOpportunities = volunteerData?.upcomingOpportunities || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Find the assignment to get its opportunity_id
      const selectedAssignment = assignments.find(a => a.id === formData.assignmentId);
      const opportunityId = selectedAssignment?.opportunity_id;

      await logVolunteerHours({
        hours: parseFloat(formData.hours),
        date: formData.date,
        description: formData.description,
        opportunityId: opportunityId
      }).unwrap();

      setSubmitMessage({ type: 'success', text: 'Volunteer hours logged successfully! Awaiting admin approval.' });
      setFormData({ hours: '', date: '', description: '', assignmentId: '' });
    } catch (error: any) {
      setSubmitMessage({ type: 'error', text: error.data?.error?.message || 'Failed to log volunteer hours' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingSubscription || isLoadingVolunteer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading membership dashboard...</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-md p-12 border border-gray-100">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">No Active Membership</h1>
            <p className="text-gray-600 mb-8 text-lg">
              You don't have an active membership. Choose your path to get started.
            </p>
            <Button size="lg" onClick={() => navigate('/membership')}>
              View Membership Plans
            </Button>
          </div>
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Success Alert */}
        {success === 'success' && (
          <Alert className="mb-8 bg-success-light border-primary-500 animate-fade-in">
            <CheckCircle className="h-5 w-5 text-primary-700" />
            <AlertDescription className="text-primary-900 font-medium">
              Your membership has been activated successfully! Welcome to ISSB.
            </AlertDescription>
          </Alert>
        )}

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Membership Dashboard</h1>
          <p className="text-lg text-gray-600">Manage your membership and track your progress</p>
        </div>

        {/* Membership Status Card */}
        <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Membership Status</h2>
              <p className="text-gray-600">Individual Annual Membership - $360/year</p>
            </div>
            <div className="flex items-center">
              {hasActiveSubscription ? (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-success-light text-primary-800 border border-primary-200">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                  <Clock className="w-4 h-4 mr-2" />
                  Pending
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200">
              <p className="text-sm font-semibold text-primary-900 mb-2">Activation Method</p>
              <p className="text-xl font-bold text-primary-700">
                {isPaymentActivated && 'Payment ($360)'}
                {isVolunteerActivated && 'Volunteer (30 hrs)'}
                {!isPaymentActivated && !isVolunteerActivated && 'Not Activated'}
              </p>
            </div>
            <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <p className="text-sm font-semibold text-gray-900 mb-2">Status</p>
              <p className="text-xl font-bold text-gray-700 capitalize">
                {subscription?.status || 'No Subscription'}
              </p>
            </div>
            <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-2">Member Since</p>
              <p className="text-xl font-bold text-blue-700">
                {subscription?.created_at 
                  ? new Date(subscription.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Volunteer Section (only for volunteer-activated or pending activation) */}
        {!isPaymentActivated && (
          <>
            {/* Volunteer Progress Overview */}
            <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 mb-8 border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-primary-100 rounded-xl mr-4">
                  <Award className="w-8 h-8 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Volunteer Hours Progress</h2>
                  <p className="text-gray-600">Track your progress toward membership activation</p>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-900">
                    {volunteerProgress?.totalApprovedHours || 0} of 30 hours completed
                  </span>
                  <span className="text-sm font-semibold text-primary-600 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {progressPercentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                {progressPercentage >= 100 ? (
                  <div className="mt-4 p-4 bg-success-light border border-primary-200 rounded-xl flex items-start">
                    <CheckCircle className="w-5 h-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-primary-900">Congratulations! Goal Reached!</p>
                      <p className="text-sm text-primary-700 mt-1">
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

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-5 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200">
                  <p className="text-sm font-semibold text-primary-900 mb-1">Approved Hours</p>
                  <p className="text-3xl font-bold text-primary-700">{volunteerProgress?.totalApprovedHours || 0}</p>
                </div>
                <div className="p-5 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200">
                  <p className="text-sm font-semibold text-amber-900 mb-1">Pending Review</p>
                  <p className="text-3xl font-bold text-amber-700">{volunteerProgress?.totalPendingHours || 0}</p>
                </div>
                <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900 mb-1">Active Assignments</p>
                  <p className="text-3xl font-bold text-blue-700">{volunteerProgress?.activeAssignments || 0}</p>
                </div>
                <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                  <p className="text-sm font-semibold text-gray-900 mb-1">Hours Needed</p>
                  <p className="text-3xl font-bold text-gray-700">{hoursRemaining}</p>
                </div>
              </div>
            </div>

            {/* Tabbed Interface for Volunteer Activities */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden mb-8">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('opportunities')}
                    className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                      activeTab === 'opportunities'
                        ? 'border-b-2 border-primary-600 text-primary-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Users className="w-5 h-5 inline mr-2" />
                    Browse Opportunities
                  </button>
                  <button
                    onClick={() => setActiveTab('assignments')}
                    className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                      activeTab === 'assignments'
                        ? 'border-b-2 border-primary-600 text-primary-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Target className="w-5 h-5 inline mr-2" />
                    My Assignments
                  </button>
                  <button
                    onClick={() => setActiveTab('log')}
                    className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                      activeTab === 'log'
                        ? 'border-b-2 border-primary-600 text-primary-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <FileText className="w-5 h-5 inline mr-2" />
                    Log Hours
                  </button>
                  <button
                    onClick={() => setActiveTab('progress')}
                    className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${
                      activeTab === 'progress'
                        ? 'border-b-2 border-primary-600 text-primary-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <TrendingUp className="w-5 h-5 inline mr-2" />
                    History
                  </button>
                </nav>
              </div>

              <div className="p-6 sm:p-8">
                {activeTab === 'opportunities' && <OpportunitiesBrowse />}
                
                {activeTab === 'assignments' && <MyAssignments />}
                
                {activeTab === 'log' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Log Volunteer Hours</h3>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="hours" className="label-modern">
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
                            className="input-modern"
                            placeholder="e.g., 4"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="date" className="label-modern">
                            Date Completed
                          </label>
                          <div className="relative">
                            <input
                              type="date"
                              id="date"
                              value={formData.date}
                              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                              max={new Date().toISOString().split('T')[0]}
                              className="input-modern pr-10"
                              required
                            />
                            <Calendar className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="assignment" className="label-modern">
                          Link to Assignment (Optional)
                        </label>
                        <select
                          id="assignment"
                          value={formData.assignmentId}
                          onChange={(e) => setFormData({ ...formData, assignmentId: e.target.value })}
                          className="input-modern"
                        >
                          <option value="">General Volunteer Work (No specific assignment)</option>
                          {assignments
                            .filter(a => a.status === 'confirmed')
                            .map(assignment => (
                              <option key={assignment.id} value={assignment.id}>
                                {assignment.volunteer_opportunities?.title || 'Unknown Opportunity'}
                              </option>
                            ))}
                        </select>
                        <p className="text-sm text-gray-500 mt-1">
                          Link hours to a specific opportunity you signed up for, or log general volunteer work.
                        </p>
                      </div>

                      <div>
                        <label htmlFor="description" className="label-modern">
                          Activity Description
                        </label>
                        <textarea
                          id="description"
                          rows={4}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="textarea-modern"
                          placeholder="Describe your volunteer activity (e.g., Event setup, Community outreach, Administrative support)"
                          required
                        />
                      </div>

                      {submitMessage && (
                        <div className={`p-4 rounded-xl border ${
                          submitMessage.type === 'success' 
                            ? 'bg-success-light border-primary-200' 
                            : 'bg-error-light border-red-200'
                        }`}>
                          <p className={`text-sm font-medium ${
                            submitMessage.type === 'success' ? 'text-primary-900' : 'text-red-800'
                          }`}>
                            {submitMessage.text}
                          </p>
                        </div>
                      )}

                      <Button
                        type="submit"
                        size="lg"
                        disabled={isSubmitting}
                        className="w-full"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Volunteer Hours'}
                      </Button>
                    </form>
                  </div>
                )}
                
                {activeTab === 'progress' && volunteerHours.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Volunteer Hours History</h3>
                    
                    <div className="overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-4 px-4 text-sm font-semibold text-gray-900">Date</th>
                            <th className="text-left py-4 px-4 text-sm font-semibold text-gray-900">Hours</th>
                            <th className="text-left py-4 px-4 text-sm font-semibold text-gray-900">Description</th>
                            <th className="text-left py-4 px-4 text-sm font-semibold text-gray-900">Status</th>
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
                                  <span className="badge-success">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Approved
                                  </span>
                                )}
                                {hour.status === 'pending' && (
                                  <span className="badge-warning">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Pending
                                  </span>
                                )}
                                {hour.status === 'rejected' && (
                                  <div>
                                    <span className="badge-error">
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

                {activeTab === 'progress' && volunteerHours.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No volunteer hours logged yet.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Payment-Activated Membership Message */}
        {isPaymentActivated && (
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl shadow-md p-8 border border-primary-200">
            <div className="flex items-start">
              <div className="p-3 bg-primary-500 rounded-xl mr-4 flex-shrink-0">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Active Paid Membership</h3>
                <p className="text-gray-700 mb-4 text-lg">
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
