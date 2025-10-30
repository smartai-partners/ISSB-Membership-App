/**
 * Admin Route Guards
 * Protected route components for admin-only access with permission checking
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { User, UserRole } from '@issb/types';
import { useAuthStore } from '@/store/authStore';
import { usePermissionStore } from '@/store/permissionStore';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import { hasAdminPermission } from './permissions';

/**
 * Admin Route Guard Props
 */
interface AdminGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
  fallbackPath?: string;
  showUnauthorized?: boolean;
}

/**
 * AdminRouteGuard Component
 * Ensures only admin users can access the route
 * Optionally checks for specific permissions
 */
export const AdminRouteGuard: React.FC<AdminGuardProps> = ({
  children,
  requiredPermission,
  fallbackPath = '/unauthorized',
  showUnauthorized = true,
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Not admin - redirect or show unauthorized
  if (user.role !== UserRole.ADMIN) {
    if (showUnauthorized) {
      return <UnauthorizedPage />;
    }
    return <Navigate to={fallbackPath} replace />;
  }

  // Check specific permission if required
  if (requiredPermission && !hasAdminPermission(user, requiredPermission)) {
    if (showUnauthorized) {
      return <UnauthorizedPage />;
    }
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

/**
 * AdminUserManagementGuard
 * Specific guard for user management routes
 */
export const AdminUserManagementGuard: React.FC<AdminGuardProps> = ({
  children,
  requiredPermission = 'user:read',
  fallbackPath,
}) => {
  return (
    <AdminRouteGuard requiredPermission={requiredPermission} fallbackPath={fallbackPath}>
      {children}
    </AdminRouteGuard>
  );
};

/**
 * AdminMembershipGuard
 * Specific guard for membership management routes
 */
export const AdminMembershipGuard: React.FC<AdminGuardProps> = ({
  children,
  requiredPermission = 'membership:read',
  fallbackPath,
}) => {
  return (
    <AdminRouteGuard requiredPermission={requiredPermission} fallbackPath={fallbackPath}>
      {children}
    </AdminRouteGuard>
  );
};

/**
 * AdminEventGuard
 * Specific guard for event management routes
 */
export const AdminEventGuard: React.FC<AdminGuardProps> = ({
  children,
  requiredPermission = 'event:read',
  fallbackPath,
}) => {
  return (
    <AdminRouteGuard requiredPermission={requiredPermission} fallbackPath={fallbackPath}>
      {children}
    </AdminRouteGuard>
  );
};

/**
 * AdminApplicationGuard
 * Specific guard for application review routes
 */
export const AdminApplicationGuard: React.FC<AdminGuardProps> = ({
  children,
  requiredPermission = 'application:read',
  fallbackPath,
}) => {
  return (
    <AdminRouteGuard requiredPermission={requiredPermission} fallbackPath={fallbackPath}>
      {children}
    </AdminRouteGuard>
  );
};

/**
 * AdminSystemGuard
 * Specific guard for system settings routes
 */
export const AdminSystemGuard: React.FC<AdminGuardProps> = ({
  children,
  requiredPermission = 'settings:read',
  fallbackPath,
}) => {
  return (
    <AdminRouteGuard requiredPermission={requiredPermission} fallbackPath={fallbackPath}>
      {children}
    </AdminRouteGuard>
  );
};

/**
 * AdminReportGuard
 * Specific guard for report routes
 */
export const AdminReportGuard: React.FC<AdminGuardProps> = ({
  children,
  requiredPermission = 'report:read',
  fallbackPath,
}) => {
  return (
    <AdminRouteGuard requiredPermission={requiredPermission} fallbackPath={fallbackPath}>
      {children}
    </AdminRouteGuard>
  );
};

/**
 * AdminNotificationGuard
 * Specific guard for notification management routes
 */
export const AdminNotificationGuard: React.FC<AdminGuardProps> = ({
  children,
  requiredPermission = 'notification:read',
  fallbackPath,
}) => {
  return (
    <AdminRouteGuard requiredPermission={requiredPermission} fallbackPath={fallbackPath}>
      {children}
    </AdminRouteGuard>
  );
};

/**
 * AdminVolunteerGuard
 * Specific guard for volunteer management routes
 */
export const AdminVolunteerGuard: React.FC<AdminGuardProps> = ({
  children,
  requiredPermission = 'volunteer:read',
  fallbackPath,
}) => {
  return (
    <AdminRouteGuard requiredPermission={requiredPermission} fallbackPath={fallbackPath}>
      {children}
    </AdminRouteGuard>
  );
};

/**
 * HOC for protecting components with admin access
 */
export const withAdminProtection = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermission?: string
) => {
  return (props: P) => (
    <AdminRouteGuard requiredPermission={requiredPermission}>
      <WrappedComponent {...props} />
    </AdminRouteGuard>
  );
};

/**
 * Hook for checking admin access
 */
export const useAdminAccess = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { hasPermission } = usePermissionStore();

  const isAdminUser = isAuthenticated && user?.role === UserRole.ADMIN;

  const hasPermissionCheck = (permission: string): boolean => {
    return isAdminUser && !!user && hasPermission(user, permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return isAdminUser && !!user && permissions.some(permission => hasPermission(user, permission));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return isAdminUser && !!user && permissions.every(permission => hasPermission(user, permission));
  };

  return {
    isAdminUser,
    hasPermission: hasPermissionCheck,
    hasAnyPermission,
    hasAllPermissions,
    user,
  };
};

/**
 * Component for conditionally rendering admin content
 */
export const AdminContent: React.FC<{
  children: React.ReactNode;
  requiredPermission?: string;
  fallback?: React.ReactNode;
  showForBoard?: boolean;
}> = ({ children, requiredPermission, fallback = null, showForBoard = false }) => {
  const { user } = useAuthStore();
  const { hasPermission } = usePermissionStore();

  if (!user) return fallback;

  const hasAccess = showForBoard 
    ? (user.role === UserRole.ADMIN || user.role === UserRole.BOARD)
    : user.role === UserRole.ADMIN;

  if (!hasAccess) return fallback;

  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return fallback;
  }

  return <>{children}</>;
};

/**
 * Higher-order component for conditional admin rendering
 */
export const requireAdmin = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermission?: string,
  fallback?: React.ComponentType
) => {
  const FallbackComponent = fallback || (() => null);
  
  return (props: P) => {
    const { user } = useAuthStore();
    const { hasPermission } = usePermissionStore();

    if (!user || user.role !== UserRole.ADMIN) {
      return <FallbackComponent />;
    }

    if (requiredPermission && !hasPermission(user, requiredPermission)) {
      return <FallbackComponent />;
    }

    return <WrappedComponent {...props} />;
  };
};

/**
 * Route metadata with permission requirements
 */
export const ADMIN_ROUTE_METADATA = {
  DASHBOARD: {
    path: '/admin',
    requiredPermission: 'user:read',
    title: 'Admin Dashboard',
  },
  USERS: {
    path: '/admin/users',
    requiredPermission: 'user:read',
    title: 'User Management',
  },
  MEMBERSHIP: {
    path: '/admin/membership',
    requiredPermission: 'membership:read',
    title: 'Membership Management',
  },
  EVENTS: {
    path: '/admin/events',
    requiredPermission: 'event:read',
    title: 'Event Management',
  },
  APPLICATIONS: {
    path: '/admin/applications',
    requiredPermission: 'application:read',
    title: 'Application Review',
  },
  SETTINGS: {
    path: '/admin/settings',
    requiredPermission: 'settings:read',
    title: 'System Settings',
  },
} as const;

export default AdminRouteGuard;
