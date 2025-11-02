import { useState } from 'react';
import { useListOpportunitiesQuery, useSignupForOpportunityMutation } from '@/store/api/membershipApi';
import { Calendar, MapPin, Users, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const OpportunitiesBrowse = () => {
  const [filter, setFilter] = useState<string>('active');
  const { data, isLoading, refetch } = useListOpportunitiesQuery({ 
    status: filter === 'all' ? undefined : filter,
    includeUserAssignments: true 
  });
  const [signupForOpportunity] = useSignupForOpportunityMutation();
  const [signupState, setSignupState] = useState<{ [key: string]: { loading: boolean; message?: string; type?: 'success' | 'error' } }>({});

  const opportunities = data?.opportunities || [];

  const handleSignup = async (opportunityId: string) => {
    setSignupState({ ...signupState, [opportunityId]: { loading: true } });
    
    try {
      await signupForOpportunity(opportunityId).unwrap();
      setSignupState({ 
        ...signupState, 
        [opportunityId]: { 
          loading: false, 
          message: 'Successfully signed up!', 
          type: 'success' 
        } 
      });
      refetch();
      
      setTimeout(() => {
        setSignupState({ ...signupState, [opportunityId]: { loading: false } });
      }, 3000);
    } catch (error: any) {
      setSignupState({ 
        ...signupState, 
        [opportunityId]: { 
          loading: false, 
          message: error.data?.error?.message || 'Failed to sign up', 
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
          <p className="text-gray-600">Loading opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Browse Volunteer Opportunities</h3>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="open">Open</option>
          <option value="all">All</option>
        </select>
      </div>

      {opportunities.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No volunteer opportunities available at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {opportunities.map((opportunity) => {
            const isFull = opportunity.capacity && opportunity.current_volunteers >= opportunity.capacity;
            const isSignedUp = opportunity.userAssignmentStatus === 'confirmed';
            const state = signupState[opportunity.id] || { loading: false };

            return (
              <div
                key={opportunity.id}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 mb-2">{opportunity.title}</h4>
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
                      
                      {opportunity.capacity && (
                        <div className="flex items-center text-sm text-gray-700">
                          <Users className="w-4 h-4 mr-2 text-primary-600" />
                          <span>
                            {opportunity.current_volunteers || 0} / {opportunity.capacity} volunteers
                          </span>
                        </div>
                      )}
                    </div>

                    {opportunity.required_skills && opportunity.required_skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {opportunity.required_skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    {isSignedUp ? (
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-success-light text-primary-800 border border-primary-200">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Signed Up
                      </span>
                    ) : isFull ? (
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                        <XCircle className="w-4 h-4 mr-2" />
                        Full
                      </span>
                    ) : null}
                  </div>
                </div>

                {state.message && (
                  <Alert className={`mb-4 ${state.type === 'success' ? 'bg-success-light border-primary-200' : 'bg-error-light border-red-200'}`}>
                    <AlertDescription className={state.type === 'success' ? 'text-primary-900' : 'text-red-800'}>
                      {state.message}
                    </AlertDescription>
                  </Alert>
                )}

                {!isSignedUp && !isFull && opportunity.status === 'open' && (
                  <Button
                    onClick={() => handleSignup(opportunity.id)}
                    disabled={state.loading}
                    className="w-full sm:w-auto"
                  >
                    {state.loading ? 'Signing up...' : 'Sign Up for This Opportunity'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
