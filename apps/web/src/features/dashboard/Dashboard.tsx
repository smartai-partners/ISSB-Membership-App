import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import api from '../../services/api';
import DashboardStats from './DashboardStats';
import RecentActivity from './RecentActivity';
import QuickActions from './QuickActions';
import NotificationCenter from './NotificationCenter';
import { DashboardData, DashboardStats as StatsType, Activity, Notification, QuickAction } from './types';

interface UseDashboardDataReturn {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const useDashboardData = (): UseDashboardDataReturn => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // In a real app, you might have a single endpoint that returns all dashboard data
      // For now, we'll fetch each piece separately
      
      const [statsResponse, activityResponse, notificationsResponse, actionsResponse] = await Promise.allSettled([
        api.get<{ data: StatsType }>('/dashboard/stats'),
        api.get<{ data: Activity[] }>('/dashboard/activity'),
        api.get<{ data: Notification[] }>('/dashboard/notifications'),
        api.get<{ data: QuickAction[] }>('/dashboard/quick-actions'),
      ]);

      const dashboardData: DashboardData = {
        stats: statsResponse.status === 'fulfilled' ? statsResponse.value.data! : {
          totalUsers: 0,
          totalEvents: 0,
          totalApplications: 0,
          totalVolunteerOps: 0,
          recentGrowth: {
            users: 0,
            events: 0,
            applications: 0,
            volunteerOps: 0,
          },
        },
        recentActivity: activityResponse.status === 'fulfilled' ? activityResponse.value.data! : [],
        notifications: notificationsResponse.status === 'fulfilled' ? notificationsResponse.value.data! : [],
        quickActions: actionsResponse.status === 'fulfilled' ? actionsResponse.value.data! : getDefaultQuickActions(),
      };

      setData(dashboardData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch: fetchDashboardData,
  };
};

// Default quick actions that would be fetched from the API in a real app
const getDefaultQuickActions = (): QuickAction[] => [
  {
    id: 'create-event',
    title: 'Create Event',
    description: 'Schedule a new event',
    icon: '📅',
    url: '/events/create',
    roles: ['ADMIN', 'BOARD'],
    color: 'blue',
  },
  {
    id: 'manage-users',
    title: 'Manage Users',
    description: 'View and edit user accounts',
    icon: '👥',
    url: '/users',
    roles: ['ADMIN', 'BOARD'],
    color: 'green',
  },
  {
    id: 'view-applications',
    title: 'Applications',
    description: 'Review pending applications',
    icon: '📝',
    url: '/applications',
    roles: ['ADMIN', 'BOARD'],
    color: 'yellow',
  },
  {
    id: 'volunteer-opportunities',
    title: 'Volunteer Ops',
    description: 'Manage volunteer opportunities',
    icon: '🤝',
    url: '/volunteer',
    roles: ['ADMIN', 'BOARD'],
    tier: 'BOARD',
    color: 'purple',
  },
  {
    id: 'reports',
    title: 'View Reports',
    description: 'Generate and view reports',
    icon: '📊',
    url: '/reports',
    roles: ['ADMIN', 'BOARD'],
    color: 'green',
  },
  {
    id: 'profile',
    title: 'My Profile',
    description: 'Update your profile',
    icon: '👤',
    url: '/profile',
    roles: ['ADMIN', 'BOARD', 'MEMBER'],
    color: 'blue',
  },
];

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { canViewBoardContent, canViewAdminContent } = usePermissionStore();
  const { data, isLoading, error, refetch } = useDashboardData();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      // Update local state
      if (data) {
        setData({
          ...data,
          notifications: data.notifications.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
        });
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      // Update local state
      if (data) {
        setData({
          ...data,
          notifications: data.notifications.map(n => ({ ...n, read: true })),
        });
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please log in to view the dashboard</p>
      </div>
    );
  }

  const shouldShowBoardContent = canViewBoardContent(user);
  const shouldShowAdminContent = canViewAdminContent(user);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-gray-600 mt-1">
            {user.role === 'ADMIN' && 'Administrator Dashboard'}
            {user.role === 'BOARD' && 'Board Member Dashboard'}
            {user.role === 'MEMBER' && 'Member Dashboard'}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Role-based notifications */}
      {!shouldShowBoardContent && user.role === 'MEMBER' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-blue-600">ℹ️</span>
            <p className="text-blue-800 text-sm">
              You have limited access to board content. Contact an administrator for more permissions.
            </p>
          </div>
        </div>
      )}

      {shouldShowAdminContent && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-purple-600">⚡</span>
            <p className="text-purple-800 text-sm">
              You have administrator access. Use caution when making system changes.
            </p>
          </div>
        </div>
      )}

      {/* Dashboard Stats */}
      <DashboardStats
        stats={data?.stats || {
          totalUsers: 0,
          totalEvents: 0,
          totalApplications: 0,
          totalVolunteerOps: 0,
          recentGrowth: { users: 0, events: 0, applications: 0, volunteerOps: 0 },
        }}
        isLoading={isLoading}
        error={error}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity
            activities={data?.recentActivity || []}
            isLoading={isLoading}
            error={error}
            className="h-full"
          />
        </div>

        {/* Right Column - Quick Actions & Notifications */}
        <div className="space-y-6">
          <QuickActions
            actions={data?.quickActions || []}
            isLoading={isLoading}
            error={error}
            className="h-full"
          />
          
          <NotificationCenter
            notifications={data?.notifications || []}
            isLoading={isLoading}
            error={error}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            className="h-full"
          />
        </div>
      </div>

      {/* Role-specific sections */}
      {shouldShowBoardContent && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Board Management</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 border rounded-lg bg-blue-50">
              <h3 className="font-medium text-blue-900">Pending Applications</h3>
              <p className="text-sm text-blue-700 mt-1">
                Review and approve new member applications
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-green-50">
              <h3 className="font-medium text-green-900">Event Planning</h3>
              <p className="text-sm text-green-700 mt-1">
                Manage upcoming events and activities
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-purple-50">
              <h3 className="font-medium text-purple-900">Volunteer Management</h3>
              <p className="text-sm text-purple-700 mt-1">
                Coordinate volunteer opportunities
              </p>
            </div>
          </div>
        </div>
      )}

      {shouldShowAdminContent && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Administration</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 border rounded-lg bg-red-50">
              <h3 className="font-medium text-red-900">User Management</h3>
              <p className="text-sm text-red-700 mt-1">
                Manage user accounts and permissions
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-orange-50">
              <h3 className="font-medium text-orange-900">System Settings</h3>
              <p className="text-sm text-orange-700 mt-1">
                Configure system-wide settings
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium text-gray-900">Audit Logs</h3>
              <p className="text-sm text-gray-700 mt-1">
                View system activity logs
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-indigo-50">
              <h3 className="font-medium text-indigo-900">Data Export</h3>
              <p className="text-sm text-indigo-700 mt-1">
                Export reports and data
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
