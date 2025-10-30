// Dashboard Types

export interface DashboardStats {
  totalUsers: number;
  totalEvents: number;
  totalApplications: number;
  totalVolunteerOps: number;
  recentGrowth: {
    users: number;
    events: number;
    applications: number;
    volunteerOps: number;
  };
}

export interface Activity {
  id: string;
  type: 'user_registered' | 'event_created' | 'application_submitted' | 'volunteer_signed_up' | 'user_promoted';
  title: string;
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  metadata?: Record<string, any>;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  url: string;
  roles: string[];
  tier?: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivity: Activity[];
  notifications: Notification[];
  quickActions: QuickAction[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}
