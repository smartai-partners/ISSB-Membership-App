/**
 * Admin Routes Configuration
 * Protected routes that require admin role or specific permissions
 */

import { lazy } from 'react';
import { Navigate, RouteObject } from 'react-router-dom';
import { UserRole } from '@issb/types';
import { canManageUsers, canManageSystem, canManageApplications, canManageEvents, canViewReports } from './permissions';
import { useAuthStore } from '@/store/authStore';
import { usePermissionStore } from '@/store/permissionStore';
import UnauthorizedPage from '@/pages/UnauthorizedPage';

// Lazy load admin components for better code splitting
const AdminDashboard = lazy(() => import('@/features/admin/AdminDashboard'));
const UserManagement = lazy(() => import('@/features/admin/UserManagement'));
const MembershipManagement = lazy(() => import('@/features/admin/MembershipManagement'));
const EventManagement = lazy(() => import('@/features/admin/EventManagement'));
const ApplicationReview = lazy(() => import('@/features/admin/ApplicationReview'));
const SystemSettings = lazy(() => import('@/features/admin/SystemSettings'));

/**
 * Admin Route Guard Component
 */
export const AdminRouteGuard: React.FC<{
  children: React.ReactNode;
  requiredPermission?: string;
  fallback?: React.ReactNode;
}> = ({ children, requiredPermission, fallback }) => {
  const { user } = useAuthStore();
  const { hasPermission } = usePermissionStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== UserRole.ADMIN) {
    return <UnauthorizedPage />;
  }

  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return fallback || <UnauthorizedPage />;
  }

  return <>{children}</>;
};

/**
 * Admin Routes Configuration
 * All routes require admin role and specific permissions where applicable
 */
export const adminRoutes: RouteObject[] = [
  {
    path: 'admin',
    element: <AdminRouteGuard><AdminDashboard /></AdminRouteGuard>,
    handle: {
      title: 'Admin Dashboard',
      breadcrumb: 'Dashboard',
      requiredRole: UserRole.ADMIN,
    },
  },
  {
    path: 'admin/users',
    element: <AdminRouteGuard requiredPermission="user:read"><UserManagement /></AdminRouteGuard>,
    handle: {
      title: 'User Management',
      breadcrumb: 'Users',
      requiredRole: UserRole.ADMIN,
      requiredPermission: 'user:read',
    },
    children: [
      {
        path: 'create',
        element: <AdminRouteGuard requiredPermission="user:write"><CreateUserPage /></AdminRouteGuard>,
        handle: {
          title: 'Create User',
          breadcrumb: 'Create',
          requiredRole: UserRole.ADMIN,
          requiredPermission: 'user:write',
        },
      },
      {
        path: ':userId',
        element: <AdminRouteGuard requiredPermission="user:read"><UserDetailsPage /></AdminRouteGuard>,
        handle: {
          title: 'User Details',
          breadcrumb: (params: any) => `User ${params.userId}`,
          requiredRole: UserRole.ADMIN,
          requiredPermission: 'user:read',
        },
        children: [
          {
            path: 'edit',
            element: <AdminRouteGuard requiredPermission="user:write"><EditUserPage /></AdminRouteGuard>,
            handle: {
              title: 'Edit User',
              breadcrumb: 'Edit',
              requiredRole: UserRole.ADMIN,
              requiredPermission: 'user:write',
            },
          },
        ],
      },
    ],
  },
  {
    path: 'admin/membership',
    element: <AdminRouteGuard requiredPermission="membership:read"><MembershipManagement /></AdminRouteGuard>,
    handle: {
      title: 'Membership Management',
      breadcrumb: 'Membership',
      requiredRole: UserRole.ADMIN,
      requiredPermission: 'membership:read',
    },
    children: [
      {
        path: 'tiers',
        element: <AdminRouteGuard requiredPermission="membership:read"><MembershipTierPage /></AdminRouteGuard>,
        handle: {
          title: 'Membership Tiers',
          breadcrumb: 'Tiers',
          requiredRole: UserRole.ADMIN,
          requiredPermission: 'membership:read',
        },
        children: [
          {
            path: 'create',
            element: <AdminRouteGuard requiredPermission="membership:write"><CreateMembershipTierPage /></AdminRouteGuard>,
            handle: {
              title: 'Create Membership Tier',
              breadcrumb: 'Create',
              requiredRole: UserRole.ADMIN,
              requiredPermission: 'membership:write',
            },
          },
          {
            path: ':tierId/edit',
            element: <AdminRouteGuard requiredPermission="membership:write"><EditMembershipTierPage /></AdminRouteGuard>,
            handle: {
              title: 'Edit Membership Tier',
              breadcrumb: 'Edit',
              requiredRole: UserRole.ADMIN,
              requiredPermission: 'membership:write',
            },
          },
        ],
      },
    ],
  },
  {
    path: 'admin/events',
    element: <AdminRouteGuard requiredPermission="event:read"><EventManagement /></AdminRouteGuard>,
    handle: {
      title: 'Event Management',
      breadcrumb: 'Events',
      requiredRole: UserRole.ADMIN,
      requiredPermission: 'event:read',
    },
    children: [
      {
        path: 'create',
        element: <AdminRouteGuard requiredPermission="event:write"><CreateEventPage /></AdminRouteGuard>,
        handle: {
          title: 'Create Event',
          breadcrumb: 'Create',
          requiredRole: UserRole.ADMIN,
          requiredPermission: 'event:write',
        },
      },
      {
        path: ':eventId',
        element: <AdminRouteGuard requiredPermission="event:read"><EventDetailsPage /></AdminRouteGuard>,
        handle: {
          title: 'Event Details',
          breadcrumb: (params: any) => `Event ${params.eventId}`,
          requiredRole: UserRole.ADMIN,
          requiredPermission: 'event:read',
        },
        children: [
          {
            path: 'edit',
            element: <AdminRouteGuard requiredPermission="event:write"><EditEventPage /></AdminRouteGuard>,
            handle: {
              title: 'Edit Event',
              breadcrumb: 'Edit',
              requiredRole: UserRole.ADMIN,
              requiredPermission: 'event:write',
            },
          },
        ],
      },
    ],
  },
  {
    path: 'admin/applications',
    element: <AdminRouteGuard requiredPermission="application:read"><ApplicationReview /></AdminRouteGuard>,
    handle: {
      title: 'Application Review',
      breadcrumb: 'Applications',
      requiredRole: UserRole.ADMIN,
      requiredPermission: 'application:read',
    },
    children: [
      {
        path: ':applicationId',
        element: <AdminRouteGuard requiredPermission="application:read"><ApplicationDetailsPage /></AdminRouteGuard>,
        handle: {
          title: 'Application Details',
          breadcrumb: (params: any) => `Application ${params.applicationId}`,
          requiredRole: UserRole.ADMIN,
          requiredPermission: 'application:read',
        },
        children: [
          {
            path: 'review',
            element: <AdminRouteGuard requiredPermission="application:approve"><ReviewApplicationPage /></AdminRouteGuard>,
            handle: {
              title: 'Review Application',
              breadcrumb: 'Review',
              requiredRole: UserRole.ADMIN,
              requiredPermission: 'application:approve',
            },
          },
        ],
      },
    ],
  },
  {
    path: 'admin/settings',
    element: <AdminRouteGuard requiredPermission="settings:read"><SystemSettings /></AdminRouteGuard>,
    handle: {
      title: 'System Settings',
      breadcrumb: 'Settings',
      requiredRole: UserRole.ADMIN,
      requiredPermission: 'settings:read',
    },
    children: [
      {
        path: 'logs',
        element: <AdminRouteGuard requiredPermission="system:manage"><SystemLogsPage /></AdminRouteGuard>,
        handle: {
          title: 'System Logs',
          breadcrumb: 'Logs',
          requiredRole: UserRole.ADMIN,
          requiredPermission: 'system:manage',
        },
      },
      {
        path: 'backup',
        element: <AdminRouteGuard requiredPermission="system:manage"><BackupPage /></AdminRouteGuard>,
        handle: {
          title: 'Backup Management',
          breadcrumb: 'Backup',
          requiredRole: UserRole.ADMIN,
          requiredPermission: 'system:manage',
        },
      },
      {
        path: 'audit',
        element: <AdminRouteGuard requiredPermission="system:manage"><AuditTrailPage /></AdminRouteGuard>,
        handle: {
          title: 'Audit Trail',
          breadcrumb: 'Audit Trail',
          requiredRole: UserRole.ADMIN,
          requiredPermission: 'system:manage',
        },
      },
    ],
  },
];

/**
 * Get admin routes by permission
 */
export const getAdminRoutesByPermission = (user: any, permission: string) => {
  return adminRoutes.filter(route => {
    const handle = route.handle as any;
    if (handle?.requiredPermission) {
      return user?.role === UserRole.ADMIN || 
             user?.permissions?.includes(permission);
    }
    return true;
  });
};

/**
 * Get all admin route paths for navigation
 */
export const getAdminRoutePaths = () => {
  const paths: string[] = [];
  
  const collectPaths = (routes: RouteObject[], basePath = '') => {
    routes.forEach(route => {
      const fullPath = route.path ? `${basePath}/${route.path}`.replace('//', '/') : basePath;
      if (fullPath && fullPath !== '/') {
        paths.push(fullPath);
      }
      if (route.children) {
        collectPaths(route.children, fullPath);
      }
    });
  };
  
  collectPaths(adminRoutes);
  return paths;
};

// Page components
export {
  AdminDashboardPage,
  UserManagementPage,
  UserDetailsPage,
  CreateUserPage,
  EditUserPage,
  MembershipManagementPage,
  MembershipTierPage,
  CreateMembershipTierPage,
  EditMembershipTierPage,
  EventManagementPage,
  EventDetailsPage,
  CreateEventPage,
  EditEventPage,
  ApplicationReviewPage,
  ApplicationDetailsPage,
  ReviewApplicationPage,
  SystemSettingsPage,
  SystemLogsPage,
  BackupPage,
  AuditTrailPage,
} from './pages';

// Utilities
export { getAdminRoutesByPermission, getAdminRoutePaths } from './router';

export default adminRoutes;
