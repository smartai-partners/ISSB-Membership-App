/**
 * Admin Router Configuration
 * Complete routing setup for admin features
 */

import { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import { 
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

// Loading component for lazy-loaded routes
const AdminLoading: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

/**
 * Suspense wrapper for admin routes
 */
const withSuspense = (Component: React.ComponentType) => (props: any) => (
  <Suspense fallback={<AdminLoading />}>
    <Component {...props} />
  </Suspense>
);

/**
 * Complete Admin Routes Configuration
 * Includes all admin routes with proper nesting and guards
 */
export const adminRouterConfig: RouteObject[] = [
  {
    path: 'admin',
    children: [
      // Dashboard
      {
        index: true,
        element: withSuspense(AdminDashboardPage),
        handle: {
          title: 'Admin Dashboard',
          breadcrumb: 'Dashboard',
          requiredRole: 'admin',
          requiredPermission: 'user:read',
        },
      },
      
      // User Management Routes
      {
        path: 'users',
        element: withSuspense(UserManagementPage),
        handle: {
          title: 'User Management',
          breadcrumb: 'Users',
          requiredRole: 'admin',
          requiredPermission: 'user:read',
        },
        children: [
          {
            path: 'create',
            element: withSuspense(CreateUserPage),
            handle: {
              title: 'Create User',
              breadcrumb: 'Create',
              requiredRole: 'admin',
              requiredPermission: 'user:write',
            },
          },
          {
            path: ':userId',
            element: withSuspense(UserDetailsPage),
            handle: {
              title: 'User Details',
              breadcrumb: (params: any) => `User ${params.userId}`,
              requiredRole: 'admin',
              requiredPermission: 'user:read',
            },
            children: [
              {
                path: 'edit',
                element: withSuspense(EditUserPage),
                handle: {
                  title: 'Edit User',
                  breadcrumb: 'Edit',
                  requiredRole: 'admin',
                  requiredPermission: 'user:write',
                },
              },
            ],
          },
        ],
      },
      
      // Membership Management Routes
      {
        path: 'membership',
        element: withSuspense(MembershipManagementPage),
        handle: {
          title: 'Membership Management',
          breadcrumb: 'Membership',
          requiredRole: 'admin',
          requiredPermission: 'membership:read',
        },
        children: [
          {
            path: 'tiers',
            element: withSuspense(MembershipTierPage),
            handle: {
              title: 'Membership Tiers',
              breadcrumb: 'Tiers',
              requiredRole: 'admin',
              requiredPermission: 'membership:read',
            },
            children: [
              {
                path: 'create',
                element: withSuspense(CreateMembershipTierPage),
                handle: {
                  title: 'Create Membership Tier',
                  breadcrumb: 'Create',
                  requiredRole: 'admin',
                  requiredPermission: 'membership:write',
                },
              },
              {
                path: ':tierId/edit',
                element: withSuspense(EditMembershipTierPage),
                handle: {
                  title: 'Edit Membership Tier',
                  breadcrumb: 'Edit',
                  requiredRole: 'admin',
                  requiredPermission: 'membership:write',
                },
              },
            ],
          },
        ],
      },
      
      // Event Management Routes
      {
        path: 'events',
        element: withSuspense(EventManagementPage),
        handle: {
          title: 'Event Management',
          breadcrumb: 'Events',
          requiredRole: 'admin',
          requiredPermission: 'event:read',
        },
        children: [
          {
            path: 'create',
            element: withSuspense(CreateEventPage),
            handle: {
              title: 'Create Event',
              breadcrumb: 'Create',
              requiredRole: 'admin',
              requiredPermission: 'event:write',
            },
          },
          {
            path: ':eventId',
            element: withSuspense(EventDetailsPage),
            handle: {
              title: 'Event Details',
              breadcrumb: (params: any) => `Event ${params.eventId}`,
              requiredRole: 'admin',
              requiredPermission: 'event:read',
            },
            children: [
              {
                path: 'edit',
                element: withSuspense(EditEventPage),
                handle: {
                  title: 'Edit Event',
                  breadcrumb: 'Edit',
                  requiredRole: 'admin',
                  requiredPermission: 'event:write',
                },
              },
            ],
          },
        ],
      },
      
      // Application Review Routes
      {
        path: 'applications',
        element: withSuspense(ApplicationReviewPage),
        handle: {
          title: 'Application Review',
          breadcrumb: 'Applications',
          requiredRole: 'admin',
          requiredPermission: 'application:read',
        },
        children: [
          {
            path: ':applicationId',
            element: withSuspense(ApplicationDetailsPage),
            handle: {
              title: 'Application Details',
              breadcrumb: (params: any) => `Application ${params.applicationId}`,
              requiredRole: 'admin',
              requiredPermission: 'application:read',
            },
            children: [
              {
                path: 'review',
                element: withSuspense(ReviewApplicationPage),
                handle: {
                  title: 'Review Application',
                  breadcrumb: 'Review',
                  requiredRole: 'admin',
                  requiredPermission: 'application:approve',
                },
              },
            ],
          },
        ],
      },
      
      // System Settings Routes
      {
        path: 'settings',
        element: withSuspense(SystemSettingsPage),
        handle: {
          title: 'System Settings',
          breadcrumb: 'Settings',
          requiredRole: 'admin',
          requiredPermission: 'settings:read',
        },
        children: [
          {
            path: 'logs',
            element: withSuspense(SystemLogsPage),
            handle: {
              title: 'System Logs',
              breadcrumb: 'Logs',
              requiredRole: 'admin',
              requiredPermission: 'system:manage',
            },
          },
          {
            path: 'backup',
            element: withSuspense(BackupPage),
            handle: {
              title: 'Backup Management',
              breadcrumb: 'Backup',
              requiredRole: 'admin',
              requiredPermission: 'system:manage',
            },
          },
          {
            path: 'audit',
            element: withSuspense(AuditTrailPage),
            handle: {
              title: 'Audit Trail',
              breadcrumb: 'Audit Trail',
              requiredRole: 'admin',
              requiredPermission: 'system:manage',
            },
          },
        ],
      },
    ],
  },
];

/**
 * Get admin route paths for navigation
 */
export const getAdminRoutePaths = (): string[] => {
  const paths: string[] = [];
  
  const collectPaths = (routes: RouteObject[], basePath = '') => {
    routes.forEach(route => {
      const fullPath = route.path ? `${basePath}/${route.path}`.replace('//', '/') : basePath;
      if (fullPath && fullPath !== '/' && fullPath !== '/admin') {
        paths.push(fullPath);
      }
      if (route.children) {
        collectPaths(route.children, fullPath);
      }
    });
  };
  
  collectPaths(adminRouterConfig);
  return paths;
};

/**
 * Get admin route metadata
 */
export const getAdminRouteMetadata = () => {
  const metadata: Record<string, any> = {};
  
  const collectMetadata = (routes: RouteObject[]) => {
    routes.forEach(route => {
      if (route.path && route.handle) {
        const fullPath = `/admin/${route.path}`.replace('//', '/');
        metadata[fullPath] = {
          ...route.handle,
          path: fullPath,
        };
      }
      if (route.children) {
        collectMetadata(route.children);
      }
    });
  };
  
  collectMetadata(adminRouterConfig);
  return metadata;
};

/**
 * Filter routes by user permissions
 */
export const getFilteredAdminRoutes = (user: any, permission: string) => {
  return adminRouterConfig.filter(route => {
    const handle = route.handle as any;
    if (handle?.requiredPermission) {
      return user?.role === 'admin' && user?.permissions?.includes(permission);
    }
    return true;
  });
};

export default adminRouterConfig;
