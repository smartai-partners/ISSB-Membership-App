import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle, Clock, DollarSign, HandHeart, Award, Calendar, 
  TrendingUp, AlertCircle, FileCheck, Users, Heart 
} from 'lucide-react';

interface MembershipStatus {
  membership_id: string;
  status: string;
  start_date: string;
  end_date: string;
  original_amount: number;
  donation_amount_applied: number;
  balance_due: number;
  waived_through_volunteering: boolean;
  waiver_volunteer_hours: number;
  total_volunteer_hours: number;
  membership_fee_waived: boolean;
  payment_status_description: string;
  hours_until_waiver: number;
}

export function MemberDashboardPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentHours, setRecentHours] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadMembershipData();
  }, [user, navigate]);

  async function loadMembershipData() {
    if (!user) return;

    try {
      // Load membership status from the view
      const { data: statusData } = await supabase
        .from('membership_status_view')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (statusData) {
        setMembershipStatus(statusData);
      }

      // Load recent volunteer hours
      const { data: hoursData } = await supabase
        .from('volunteer_hours')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(5);

      if (hoursData) {
        setRecentHours(hoursData);
      }
    } catch (error) {
      console.error('Error loading membership data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const membershipFee = 360;
  const totalHours = profile?.total_volunteer_hours || 0;
  const hoursProgress = Math.min((totalHours / 30) * 100, 100);
  const valueEarned = Math.min((totalHours / 30) * membershipFee, membershipFee);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome, {profile?.first_name}!</h1>
        <p className="text-green-100">Your ISSB Community Membership Dashboard</p>
      </div>

      {/* Membership Status Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Membership Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Membership Status</h3>
            {membershipStatus?.status === 'active' ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <Clock className="w-6 h-6 text-amber-600" />
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  membershipStatus?.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : membershipStatus?.status === 'expired'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {membershipStatus?.status?.toUpperCase() || 'PENDING'}
              </span>
            </div>
            {membershipStatus && (
              <div className="text-sm text-gray-600 mt-4 space-y-1">
                <div>Valid until: {new Date(membershipStatus.end_date).toLocaleDateString()}</div>
                <div className="text-xs">Started: {new Date(membershipStatus.start_date).toLocaleDateString()}</div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Payment Status</h3>
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                ${membershipStatus?.balance_due?.toFixed(2) || '360.00'}
              </div>
              <div className="text-sm text-gray-600">Balance Due</div>
            </div>
            {membershipStatus?.donation_amount_applied && membershipStatus.donation_amount_applied > 0 && (
              <div className="bg-green-50 border border-green-200 rounded p-2 text-sm">
                <div className="text-green-700 font-medium">
                  ${membershipStatus.donation_amount_applied.toFixed(2)} donation applied
                </div>
              </div>
            )}
            {membershipStatus?.waived_through_volunteering && (
              <div className="bg-emerald-50 border border-emerald-200 rounded p-2">
                <div className="flex items-center text-emerald-700 text-sm font-medium">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Waived through Volunteering
                </div>
                <div className="text-xs text-emerald-600 mt-1">
                  {membershipStatus.waiver_volunteer_hours} hours completed
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {membershipStatus && membershipStatus.balance_due > 0 && (
              <Link
                to="/donations"
                className="flex items-center justify-between w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                <span>Make Payment</span>
                <DollarSign className="w-4 h-4" />
              </Link>
            )}
            <Link
              to="/volunteers"
              className="flex items-center justify-between w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
            >
              <span>Log Volunteer Hours</span>
              <HandHeart className="w-4 h-4" />
            </Link>
            <Link
              to="/events"
              className="flex items-center justify-between w-full px-4 py-2 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50 text-sm font-medium"
            >
              <span>Browse Events</span>
              <Calendar className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Volunteer Waiver Progress */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl shadow-xl p-8 text-white">
        <div className="flex items-center mb-4">
          <HandHeart className="w-8 h-8 mr-3" />
          <div>
            <h2 className="text-2xl font-bold">Membership Fee Waiver Progress</h2>
            <p className="text-green-100">Complete 30 volunteer hours to waive your $360 annual fee</p>
          </div>
        </div>

        {totalHours >= 30 ? (
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 border-2 border-white">
            <div className="flex items-center">
              <CheckCircle className="w-12 h-12 mr-4" />
              <div>
                <p className="text-2xl font-bold">Congratulations!</p>
                <p className="text-green-100 text-lg">You have qualified for membership fee waiver</p>
                <p className="text-green-200 text-sm mt-1">{totalHours} hours completed</p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xl font-bold">{totalHours} / 30 hours</span>
              <span className="text-green-100">{Math.round(hoursProgress)}% complete</span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-6 overflow-hidden mb-3">
              <div
                className="bg-white h-6 rounded-full transition-all duration-500"
                style={{ width: `${hoursProgress}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">${valueEarned.toFixed(0)}</div>
                <div className="text-green-100 text-sm">Value Earned</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">{(30 - totalHours).toFixed(1)}</div>
                <div className="text-green-100 text-sm">Hours Remaining</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Volunteer Hours */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Volunteer Contributions</h2>
          <Link to="/volunteers" className="text-green-600 hover:text-green-700 text-sm font-medium">
            View All
          </Link>
        </div>
        {recentHours.length > 0 ? (
          <div className="space-y-3">
            {recentHours.map((hour) => (
              <div key={hour.id} className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{hour.description}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(hour.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{hour.hours} hrs</div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      hour.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : hour.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {hour.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <HandHeart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No volunteer hours logged yet</p>
            <Link
              to="/volunteers"
              className="inline-flex items-center mt-3 text-green-600 hover:text-green-700 font-medium"
            >
              Start Volunteering
              <Award className="w-4 h-4 ml-1" />
            </Link>
          </div>
        )}
      </div>

      {/* Membership Benefits Reminder */}
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-3">Your Membership Benefits</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
            <div>
              <div className="font-medium text-gray-900">Full Facility Access</div>
              <div className="text-sm text-gray-600">Access to all mosque facilities and amenities</div>
            </div>
          </div>
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
            <div>
              <div className="font-medium text-gray-900">Priority Registration</div>
              <div className="text-sm text-gray-600">Early access to event registrations</div>
            </div>
          </div>
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
            <div>
              <div className="font-medium text-gray-900">Voting Rights</div>
              <div className="text-sm text-gray-600">Voice in community decisions and elections</div>
            </div>
          </div>
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
            <div>
              <div className="font-medium text-gray-900">All Programs</div>
              <div className="text-sm text-gray-600">Access to educational and community programs</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
