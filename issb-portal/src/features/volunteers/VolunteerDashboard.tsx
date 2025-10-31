import React, { useState, useEffect } from 'react';
import { Award, Clock, CheckCircle, XCircle, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { VolunteerHours, VolunteerSignup } from '@/types';

export function VolunteerDashboard() {
  const { user, profile } = useAuth();
  const [myHours, setMyHours] = useState<VolunteerHours[]>([]);
  const [mySignups, setMySignups] = useState<any[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [waiverProgress, setWaiverProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load dashboard data only once when user is available
  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  async function loadDashboardData() {
    try {
      setLoading(true);

      // Load volunteer hours
      const { data: hours, error: hoursError } = await supabase
        .from('volunteer_hours')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false });

      if (hours) {
        setMyHours(hours);
        const approved = hours.filter(h => 
          h.status === 'APPROVED' || h.status === 'approved'
        );
        const total = approved.reduce((sum, h) => sum + parseFloat(String(h.hours || 0)), 0);
        setTotalHours(total);
        setWaiverProgress((total / 30) * 100);
      }

      // Load signups with opportunity details
      const { data: signups, error: signupsError } = await supabase
        .from('volunteer_signups')
        .select(`
          *,
          volunteer_opportunities (
            id,
            title,
            description,
            start_date,
            location,
            hours_required,
            duration_hours
          )
        `)
        .eq('member_id', user?.id)
        .order('signed_up_at', { ascending: false });

      if (signups) {
        setMySignups(signups);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
      {/* Waiver Progress */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center mb-4">
          <Award className="w-10 h-10 mr-3" />
          <div>
            <h2 className="text-3xl font-bold">Membership Fee Waiver Progress</h2>
            <p className="text-green-100">Complete 30 hours to waive your $360 annual membership fee</p>
          </div>
        </div>

        {totalHours >= 30 ? (
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 border-2 border-white">
            <div className="flex items-center">
              <CheckCircle className="w-10 h-10 mr-4" />
              <div>
                <p className="text-2xl font-bold">Congratulations!</p>
                <p className="text-green-100 text-lg">You have qualified for membership fee waiver</p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-3xl font-bold">{totalHours.toFixed(1)} / 30 hours</span>
              <span className="text-green-100 text-lg">{Math.round(waiverProgress)}% complete</span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-8 overflow-hidden mb-4">
              <div 
                className="bg-white h-8 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(waiverProgress, 100)}%` }}
              ></div>
            </div>
            <p className="text-green-100 text-xl">
              <span className="font-bold">{(30 - totalHours).toFixed(1)} hours remaining</span> to waive your membership fee
            </p>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 font-semibold">Total Hours</h3>
            <Clock className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-4xl font-bold text-green-600">{totalHours.toFixed(1)}</p>
          <p className="text-sm text-gray-500 mt-1">Approved volunteer hours</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 font-semibold">Opportunities</h3>
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-4xl font-bold text-blue-600">{mySignups.length}</p>
          <p className="text-sm text-gray-500 mt-1">Signed up opportunities</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 font-semibold">Level</h3>
            <TrendingUp className="w-6 h-6 text-amber-600" />
          </div>
          <p className="text-4xl font-bold text-amber-600">
            {totalHours >= 50 ? 'Gold' : totalHours >= 20 ? 'Silver' : 'Bronze'}
          </p>
          <p className="text-sm text-gray-500 mt-1">Volunteer status</p>
        </div>
      </div>

      {/* My Sign-ups */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">My Volunteer Sign-ups</h2>
        {mySignups.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No active sign-ups</p>
            <p className="text-gray-500 mt-2">Browse opportunities and sign up to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {mySignups.map((signup) => (
              <div key={signup.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {signup.volunteer_opportunities?.title || 'Opportunity'}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {signup.volunteer_opportunities?.description || 'No description'}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                      {signup.volunteer_opportunities?.start_date && (
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(signup.volunteer_opportunities.start_date).toLocaleDateString()}
                        </span>
                      )}
                      {signup.volunteer_opportunities?.location && (
                        <span>{signup.volunteer_opportunities.location}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      signup.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      signup.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                      signup.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {signup.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Volunteer Hours Log */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">My Volunteer Hours</h2>
        {myHours.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No hours logged yet</p>
            <p className="text-gray-500 mt-2">Start logging your volunteer hours today!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {myHours.map((hour) => (
                  <tr key={hour.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(hour.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-semibold text-green-600">{hour.hours}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{hour.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        hour.status === 'APPROVED' || hour.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : hour.status === 'PENDING' || hour.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {hour.status === 'APPROVED' || hour.status === 'approved' ? <CheckCircle className="w-3 h-3 mr-1" /> : null}
                        {hour.status === 'REJECTED' || hour.status === 'rejected' ? <XCircle className="w-3 h-3 mr-1" /> : null}
                        {hour.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
