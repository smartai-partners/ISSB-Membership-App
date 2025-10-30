import React, { useEffect, useState } from 'react';
import { Users, FileCheck, Calendar, Heart, TrendingUp, DollarSign, AlertTriangle, Target, BarChart3, Clock } from 'lucide-react';
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
        <p className="text-gray-600 mt-2">ISSB Mosque Management & Strategic Plan Monitoring</p>
      </div>

      {/* Strategic Plan 2025-2035 Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg shadow-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Strategic Plan 2025-2035</h2>
        <p className="text-green-100">Comprehensive monitoring and control system for ISSB's strategic initiatives</p>
      </div>

      {/* Key Performance Indicators */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Key Performance Indicators (KPIs)</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="border-l-4 border-green-500 bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-6 h-6 text-green-600" />
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
            <div className="text-sm text-gray-600">Total Community Members</div>
          </div>

          <div className="border-l-4 border-emerald-500 bg-emerald-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-6 h-6 text-emerald-600" />
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.activeMembers}</div>
            <div className="text-sm text-gray-600">Active Memberships</div>
          </div>

          <div className="border-l-4 border-yellow-500 bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <FileCheck className="w-6 h-6 text-yellow-600" />
              {stats.pendingApplications > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                  Action Required
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.pendingApplications}</div>
            <div className="text-sm text-gray-600">Pending Applications</div>
          </div>

          <div className="border-l-4 border-purple-500 bg-purple-50 rounded-lg p-4">
            <Calendar className="w-6 h-6 text-purple-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.upcomingEvents}</div>
            <div className="text-sm text-gray-600">Upcoming Events & Programs</div>
          </div>

          <div className="border-l-4 border-amber-500 bg-amber-50 rounded-lg p-4">
            <Heart className="w-6 h-6 text-amber-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">${stats.totalDonations.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Total Donations Received</div>
          </div>

          <div className="border-l-4 border-blue-500 bg-blue-50 rounded-lg p-4">
            <Clock className="w-6 h-6 text-blue-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.volunteerHours}</div>
            <div className="text-sm text-gray-600">Community Service Hours</div>
          </div>
        </div>
      </div>

      {/* Strategic Plan Dashboard Components */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Budget Monitoring */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg mr-3">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Budget Monitoring</h3>
              <p className="text-sm text-gray-500">Financial oversight and controls</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">YTD Revenue</span>
              <span className="font-semibold text-gray-900">${stats.totalDonations.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '68%' }}></div>
            </div>
            <div className="text-xs text-gray-500">68% of annual target</div>
          </div>
        </div>

        {/* Risk Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg mr-3">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Risk Management</h3>
              <p className="text-sm text-gray-500">Proactive risk identification</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-green-50 rounded">
              <span className="text-sm text-gray-700">Financial Risks</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Low</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
              <span className="text-sm text-gray-700">Operational Risks</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">Medium</span>
            </div>
          </div>
        </div>

        {/* Community Engagement */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mr-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Community Engagement</h3>
              <p className="text-sm text-gray-500">Member participation metrics</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 rounded">
              <div className="text-xl font-bold text-blue-900">{stats.upcomingEvents}</div>
              <div className="text-xs text-gray-600">Active Programs</div>
            </div>
            <div className="p-3 bg-blue-50 rounded">
              <div className="text-xl font-bold text-blue-900">{stats.volunteerHours}</div>
              <div className="text-xs text-gray-600">Service Hours</div>
            </div>
          </div>
        </div>

        {/* Timeline & Milestones */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg mr-3">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Timeline & Milestones</h3>
              <p className="text-sm text-gray-500">Strategic plan progress</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-700">Q1 2025 Goals - Completed</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm text-gray-700">Q2 2025 Goals - In Progress</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
              <span className="text-sm text-gray-700">Q3 2025 Goals - Planned</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/admin/applications')}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 transition text-left"
          >
            <FileCheck className="w-6 h-6 text-green-600 mb-2" />
            <div className="font-medium">Review Applications</div>
            <div className="text-sm text-gray-500">{stats.pendingApplications} pending</div>
          </button>

          <button
            onClick={() => navigate('/admin/users')}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 transition text-left"
          >
            <Users className="w-6 h-6 text-emerald-600 mb-2" />
            <div className="font-medium">Manage Members</div>
            <div className="text-sm text-gray-500">{stats.totalUsers} total</div>
          </button>

          <button
            onClick={() => navigate('/admin/events')}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 transition text-left"
          >
            <Calendar className="w-6 h-6 text-purple-600 mb-2" />
            <div className="font-medium">Manage Events</div>
            <div className="text-sm text-gray-500">{stats.upcomingEvents} upcoming</div>
          </button>

          <button
            onClick={() => navigate('/admin/memberships')}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 transition text-left"
          >
            <BarChart3 className="w-6 h-6 text-amber-600 mb-2" />
            <div className="font-medium">Manage Memberships</div>
            <div className="text-sm text-gray-500">{stats.activeMembers} active</div>
          </button>
        </div>
      </div>
    </div>
  );
}
