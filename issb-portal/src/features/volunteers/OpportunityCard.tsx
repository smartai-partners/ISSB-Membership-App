import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { VolunteerOpportunity } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface OpportunityCardProps {
  opportunity: VolunteerOpportunity;
  onSelect?: (opportunity: VolunteerOpportunity) => void;
}

export function OpportunityCard({ opportunity, onSelect }: OpportunityCardProps) {
  const { user } = useAuth();
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [signupStatus, setSignupStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [liveOpportunity, setLiveOpportunity] = useState(opportunity);

  useEffect(() => {
    if (user) {
      checkSignupStatus();
    }
  }, [user, opportunity.id]);

  // Real-time subscription for capacity updates
  useEffect(() => {
    const channel = supabase
      .channel(`opportunity-${opportunity.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'volunteer_opportunities',
          filter: `id=eq.${opportunity.id}`
        },
        (payload) => {
          setLiveOpportunity(payload.new as VolunteerOpportunity);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [opportunity.id]);

  async function checkSignupStatus() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('volunteer_signups')
        .select('*')
        .eq('opportunity_id', opportunity.id)
        .eq('member_id', user.id)
        .maybeSingle();

      if (data) {
        setIsSignedUp(true);
        setSignupStatus(data.status);
      }
    } catch (error) {
      console.error('Error checking signup status:', error);
    }
  }

  async function handleSignup() {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('manage-opportunity-capacity', {
        body: {
          opportunityId: opportunity.id,
          action: 'signup',
          memberId: user.id
        }
      });

      if (error) throw error;

      setIsSignedUp(true);
      setSignupStatus('CONFIRMED');
      alert('Successfully signed up for this opportunity!');
      
      // Reload to update counts
      if (onSelect) {
        onSelect(opportunity);
      }
    } catch (error: any) {
      console.error('Error signing up:', error);
      alert(error.message || 'Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw() {
    if (!user || !confirm('Are you sure you want to withdraw from this opportunity?')) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('manage-opportunity-capacity', {
        body: {
          opportunityId: opportunity.id,
          action: 'withdraw',
          memberId: user.id
        }
      });

      if (error) throw error;

      setIsSignedUp(false);
      setSignupStatus('');
      alert('Successfully withdrawn from this opportunity.');
      
      // Reload to update counts
      if (onSelect) {
        onSelect(opportunity);
      }
    } catch (error: any) {
      console.error('Error withdrawing:', error);
      alert(error.message || 'Failed to withdraw. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const capacity = liveOpportunity.capacity || 0;
  const current = liveOpportunity.current_volunteers || 0;
  const isFull = capacity > 0 && current >= capacity;
  const capacityPercentage = capacity > 0 ? (current / capacity) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-200 overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{liveOpportunity.title}</h3>
            {liveOpportunity.category && (
              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                {liveOpportunity.category}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-4 line-clamp-3">{liveOpportunity.description}</p>

        {/* Details */}
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          {liveOpportunity.start_date && (
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
              <span>{new Date(liveOpportunity.start_date).toLocaleDateString()}</span>
            </div>
          )}
          {liveOpportunity.location && (
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
              <span>{liveOpportunity.location}</span>
            </div>
          )}
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-gray-400" />
            <span>{liveOpportunity.hours_required || liveOpportunity.duration_hours || 0} hours</span>
          </div>
        </div>

        {/* Capacity */}
        {capacity > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1 text-sm">
              <span className="text-gray-600 flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {current} / {capacity} volunteers
              </span>
              <span className="text-gray-500">{Math.round(capacityPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  capacityPercentage >= 100 ? 'bg-red-500' :
                  capacityPercentage >= 80 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action Button */}
        {user ? (
          isSignedUp ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center py-2 bg-green-50 text-green-700 rounded-lg">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-semibold">
                  {signupStatus === 'COMPLETED' ? 'Completed' : 'Signed Up'}
                </span>
              </div>
              {signupStatus !== 'COMPLETED' && (
                <button
                  onClick={handleWithdraw}
                  disabled={loading}
                  className="w-full py-3 border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-50 font-semibold disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Withdraw'}
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleSignup}
              disabled={loading || isFull}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing up...' : isFull ? 'Full - Waitlist' : 'Sign Up'}
            </button>
          )
        ) : (
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold"
          >
            Sign in to volunteer
          </button>
        )}

        {isFull && (
          <div className="mt-2 flex items-center text-sm text-amber-700">
            <AlertCircle className="w-4 h-4 mr-1" />
            This opportunity is at full capacity
          </div>
        )}
      </div>
    </div>
  );
}
