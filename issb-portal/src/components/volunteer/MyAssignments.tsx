import { useState } from 'react';
import { useGetMemberAssignmentsQuery, useWithdrawFromOpportunityMutation } from '@/store/api/membershipApi';
import { Calendar, MapPin, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const MyAssignments = () => {
  const { data, isLoading, refetch } = useGetMemberAssignmentsQuery({});
  const [withdrawFromOpportunity] = useWithdrawFromOpportunityMutation();
  const [withdrawState, setWithdrawState] = useState<{ [key: string]: { loading: boolean; message?: string; type?: 'success' | 'error' } }>({});

  const assignments = data?.assignments || [];

  const handleWithdraw = async (opportunityId: string, assignmentId: string) => {
    if (!confirm('Are you sure you want to withdraw from this opportunity?')) {
      return;
    }

    setWithdrawState({ ...withdrawState, [assignmentId]: { loading: true } });
    
    try {
      await withdrawFromOpportunity(opportunityId).unwrap();
      setWithdrawState({ 
        ...withdrawState, 
        [assignmentId]: { 
          loading: false, 
          message: 'Successfully withdrawn', 
          type: 'success' 
        } 
      });
      refetch();
      
      setTimeout(() => {
        setWithdrawState({ ...withdrawState, [assignmentId]: { loading: false } });
      }, 3000);
    } catch (error: any) {
      setWithdrawState({ 
        ...withdrawState, 
        [assignmentId]: { 
          loading: false, 
          message: error.data?.error?.message || 'Failed to withdraw', 
          type: 'error' 
        } 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent mx-auto mb-3"></div>
          <p className="text-gray-600">Loading your assignments...</p>
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 mb-2">You haven't signed up for any opportunities yet.</p>
        <p className="text-sm text-gray-500">Browse available opportunities below to get started!</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-6">My Volunteer Assignments</h3>
      
      <div className="grid grid-cols-1 gap-6">
        {assignments.map((assignment) => {
          const opportunity = assignment.volunteer_opportunities;
          const state = withdrawState[assignment.id] || { loading: false };

          if (!opportunity) return null;

          return (
            <div
              key={assignment.id}
              className="bg-white border border-gray-200 rounded-xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-bold text-gray-900">{opportunity.title}</h4>
                    {assignment.status === 'confirmed' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </span>
                    )}
                    {assignment.status === 'completed' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-success-light text-primary-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                      </span>
                    )}
                    {assignment.status === 'cancelled' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                        <XCircle className="w-3 h-3 mr-1" />
                        Cancelled
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-4">{opportunity.description}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {opportunity.start_date && (
                      <div className="flex items-center text-sm text-gray-700">
                        <Calendar className="w-4 h-4 mr-2 text-primary-600" />
                        <span>
                          {new Date(opportunity.start_date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                    )}
                    
                    {opportunity.location && (
                      <div className="flex items-center text-sm text-gray-700">
                        <MapPin className="w-4 h-4 mr-2 text-primary-600" />
                        <span>{opportunity.location}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-700">
                      <Clock className="w-4 h-4 mr-2 text-primary-600" />
                      <span>{opportunity.hours_required} hours required</span>
                    </div>
                    
                    {assignment.total_approved_hours !== undefined && assignment.total_approved_hours > 0 && (
                      <div className="flex items-center text-sm text-gray-700">
                        <TrendingUp className="w-4 h-4 mr-2 text-primary-600" />
                        <span className="font-semibold">{assignment.total_approved_hours} hours logged</span>
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">Signed up:</span>{' '}
                    {new Date(assignment.assigned_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </div>
                </div>
              </div>

              {state.message && (
                <Alert className={`mb-4 ${state.type === 'success' ? 'bg-success-light border-primary-200' : 'bg-error-light border-red-200'}`}>
                  <AlertDescription className={state.type === 'success' ? 'text-primary-900' : 'text-red-800'}>
                    {state.message}
                  </AlertDescription>
                </Alert>
              )}

              {assignment.status === 'confirmed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleWithdraw(opportunity.id, assignment.id)}
                  disabled={state.loading}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  {state.loading ? 'Withdrawing...' : 'Withdraw from Opportunity'}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
