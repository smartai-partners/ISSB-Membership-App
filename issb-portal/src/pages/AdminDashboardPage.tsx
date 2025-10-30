import React, { useEffect, useState } from 'react';
import { Users, FileCheck, Calendar, Heart, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function AdminDashboardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeMembers: 0,
    pendingApplications: 0,
    upcomingEvents: 0,
    totalDonations: 0,
    volunteerHours: 0,
  });

  useEffect(() => {
    if (!profile || !['admin', 'board'].includes(profile.role)) {
      navigate('/');
      return;
    }
    loadStats();
  }, [profile, navigate]);

  async function loadStats() {
    try {
      // Load users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Load active members
      const { count: membersCount } = await supabase
        .from('memberships')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Load pending applications
      const { count: appsCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Load upcoming events
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .gte('start_date', new Date().toISOString());

      // Load total donations
      const { data: donations } = await supabase
        .from('donations')
        .select('amount')
        .eq('payment_status', 'paid');

      const totalDonations = donations?.reduce((sum, d) => sum + d.amount, 0) || 0;

      // Load volunteer hours
      const { data: hours } = await supabase
        .from('volunteer_hours')
        .select('hours')
        .eq('status', 'approved');

      const totalHours = hours?.reduce((sum, h) => sum + h.hours, 0) || 0;

      setStats({
        totalUsers: usersCount || 0,
        activeMembers: membersCount || 0,
        pendingApplications: appsCount || 0,
        upcomingEvents: eventsCount || 0,
        totalDonations,
        volunteerHours: totalHours,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of ISSB membership system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.activeMembers}</div>
          <div className="text-sm text-gray-600">Active Members</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg">
              <FileCheck className="w-6 h-6 text-yellow-600" />
            </div>
            {stats.pendingApplications > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                Action Required
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.pendingApplications}</div>
          <div className="text-sm text-gray-600">Pending Applications</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
            <Calendar className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.upcomingEvents}</div>
          <div className="text-sm text-gray-600">Upcoming Events</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mb-4">
            <Heart className="w-6 h-6 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">${stats.totalDonations.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Total Donations</div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg mb-4">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.volunteerHours}</div>
          <div className="text-sm text-gray-600">Volunteer Hours</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/admin/applications')}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition text-left"
          >
            <FileCheck className="w-6 h-6 text-blue-600 mb-2" />
            <div className="font-medium">Review Applications</div>
            <div className="text-sm text-gray-500">{stats.pendingApplications} pending</div>
          </button>

          <button
            onClick={() => navigate('/admin/users')}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition text-left"
          >
            <Users className="w-6 h-6 text-green-600 mb-2" />
            <div className="font-medium">Manage Users</div>
            <div className="text-sm text-gray-500">{stats.totalUsers} total</div>
          </button>

          <button
            onClick={() => navigate('/admin/events')}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition text-left"
          >
            <Calendar className="w-6 h-6 text-purple-600 mb-2" />
            <div className="font-medium">Manage Events</div>
            <div className="text-sm text-gray-500">{stats.upcomingEvents} upcoming</div>
          </button>

          <button
            onClick={() => navigate('/admin/memberships')}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition text-left"
          >
            <Heart className="w-6 h-6 text-red-600 mb-2" />
            <div className="font-medium">Manage Memberships</div>
            <div className="text-sm text-gray-500">{stats.activeMembers} active</div>
          </button>
        </div>
      </div>
    </div>
  );
}
