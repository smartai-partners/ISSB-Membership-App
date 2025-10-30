import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table, { TableColumn } from '../../components/ui/Table';
import {
  Users,
  UserCheck,
  Calendar,
  FileText,
  TrendingUp,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Settings,
  Shield
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  pendingApplications: number;
  activeEvents: number;
  totalMemberships: number;
  activeMemberships: number;
}

interface RecentActivity {
  id: string;
  type: 'user_registered' | 'application_submitted' | 'event_created' | 'application_approved' | 'user_suspended';
  message: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  permission?: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const permissions = usePermissionStore();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    pendingApplications: 0,
    activeEvents: 0,
    totalMemberships: 0,
    activeMemberships: 0
  });
  
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Simulate API calls - replace with actual API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      setStats({
        totalUsers: 1247,
        activeUsers: 1089,
        pendingApplications: 23,
        activeEvents: 12,
        totalMemberships: 856,
        activeMemberships: 743
      });
      
      setRecentActivities([
        {
          id: '1',
          type: 'user_registered',
          message: 'New user registration: Sarah Johnson',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          userId: 'user-1',
          userName: 'Sarah Johnson'
        },
        {
          id: '2',
          type: 'application_submitted',
          message: 'New membership application submitted',
          timestamp: new Date(Date.now() - 45 * 60 * 1000)
        },
        {
          id: '3',
          type: 'application_approved',
          message: 'Application approved: Michael Chen',
          timestamp: new Date(Date.now() - 60 * 60 * 1000),
          userId: 'user-2',
          userName: 'Michael Chen'
        },
        {
          id: '4',
          type: 'event_created',
          message: 'New event created: Winter Workshop 2024',
          timestamp: new Date(Date.now() - 90 * 60 * 1000)
        },
        {
          id: '5',
          type: 'user_suspended',
          message: 'User suspended for policy violation',
          timestamp: new Date(Date.now() - 120 * 60 * 1000),
          userId: 'user-3',
          userName: 'Anonymous User'
        }
      ]);
      
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_registered':
        return <Users className="w-4 h-4 text-green-500" />;
      case 'application_submitted':
      case 'application_approved':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'event_created':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      case 'user_suspended':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const quickActions: QuickAction[] = [
    {
      id: 'manage-users',
      title: 'Manage Users',
      description: 'Add, edit, or remove user accounts',
      icon: <Users className="w-6 h-6" />,
      action: () => console.log('Navigate to user management'),
      permission: 'user:read'
    },
    {
      id: 'review-applications',
      title: 'Review Applications',
      description: 'Process pending membership applications',
      icon: <FileText className="w-6 h-6" />,
      action: () => console.log('Navigate to applications'),
      permission: 'application:read'
    },
    {
      id: 'create-event',
      title: 'Create Event',
      description: 'Add a new event or workshop',
      icon: <Calendar className="w-6 h-6" />,
      action: () => console.log('Navigate to event creation'),
      permission: 'event:write'
    },
    {
      id: 'system-settings',
      title: 'System Settings',
      description: 'Configure system preferences',
      icon: <Settings className="w-6 h-6" />,
      action: () => console.log('Navigate to settings'),
      permission: 'system:manage'
    }
  ].filter(action => !action.permission || permissions.hasPermission(user!, action.permission));

  const activityColumns: TableColumn<RecentActivity>[] = [
    {
      key: 'type',
      title: '',
      width: '40px',
      render: (_, record) => getActivityIcon(record.type)
    },
    {
      key: 'message',
      title: 'Activity',
      dataIndex: 'message',
      ellipsis: true
    },
    {
      key: 'timestamp',
      title: 'Time',
      dataIndex: 'timestamp',
      render: (timestamp) => formatTimeAgo(timestamp),
      width: '120px'
    }
  ];

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user.firstName}! Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" icon={<Shield className="w-4 h-4" />}>
            Security Center
          </Button>
          <Button 
            variant="outline" 
            icon={<TrendingUp className="w-4 h-4" />}
            onClick={loadDashboardData}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              <p className="text-sm text-green-600 mt-1">
                +{Math.floor(stats.totalUsers * 0.12)} this month
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeUsers}</p>
              <p className="text-sm text-green-600 mt-1">
                {Math.round((stats.activeUsers / stats.totalUsers) * 100)}% active rate
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Applications</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingApplications}</p>
              <p className="text-sm text-orange-600 mt-1">
                Requires attention
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Events</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeEvents}</p>
              <p className="text-sm text-purple-600 mt-1">
                {stats.totalMemberships} total memberships
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <div
              key={action.id}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              onClick={action.action}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  {action.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activities</h2>
            <Button variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />}>
              View All
            </Button>
          </div>
          <Table
            data={recentActivities}
            columns={activityColumns}
            pagination={false}
            className="border-none"
          />
        </Card>

        {/* System Alerts */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Alerts</h2>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">High CPU Usage</p>
                <p className="text-sm text-yellow-700">Server load at 85%</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Failed Login Attempts</p>
                <p className="text-sm text-red-700">15 failed attempts in last hour</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">Backup Completed</p>
                <p className="text-sm text-green-700">Daily backup completed successfully</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;