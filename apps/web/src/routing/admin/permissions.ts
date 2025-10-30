/**
 * Admin-Specific Permission Utilities
 * Centralizes permission checking for admin routes
 */

import { User, UserRole } from '@issb/types';
import { usePermissionStore } from '@/store/permissionStore';

// User Management Permissions
export const canManageUsers = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'user:read');
};

export const canCreateUsers = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'user:write');
};

export const canEditUsers = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'user:write');
};

export const canDeleteUsers = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'user:delete');
};

export const canViewUserDetails = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'user:read');
};

// Membership Management Permissions
export const canManageMembership = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'membership:read');
};

export const canManageMembershipTiers = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'membership:write');
};

export const canViewMembershipReports = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'membership:read');
};

// Event Management Permissions
export const canManageEvents = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'event:read');
};

export const canCreateEvents = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'event:write');
};

export const canEditEvents = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'event:write');
};

export const canDeleteEvents = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'event:delete');
};

export const canViewEventReports = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'event:read');
};

// Application Management Permissions
export const canManageApplications = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'application:read');
};

export const canApproveApplications = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'application:approve');
};

export const canRejectApplications = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'application:reject');
};

export const canViewApplicationDetails = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'application:read');
};

// System Settings Permissions
export const canManageSystem = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'system:manage');
};

export const canViewSystemSettings = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'settings:read');
};

export const canEditSystemSettings = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'settings:write');
};

export const canViewSystemLogs = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'system:manage');
};

export const canManageBackup = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'system:manage');
};

export const canViewAuditTrail = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'system:manage');
};

// Report Permissions
export const canViewReports = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'report:read');
};

export const canExportReports = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'report:read');
};

export const canGenerateReports = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'report:read');
};

// Notification Permissions
export const canManageNotifications = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'notification:write');
};

export const canViewNotifications = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'notification:read');
};

// Volunteer Management Permissions
export const canManageVolunteerOps = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'volunteer:read');
};

export const canCreateVolunteerOps = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'volunteer:write');
};

export const canEditVolunteerOps = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'volunteer:write');
};

export const canDeleteVolunteerOps = (user: User): boolean => {
  const permissions = usePermissionStore.getState();
  return user.role === UserRole.ADMIN && permissions.hasPermission(user, 'volunteer:delete');
};

/**
 * Check if user has admin role
 */
export const isAdmin = (user: User | null | undefined): boolean => {
  return !!user && user.role === UserRole.ADMIN;
};

/**
 * Check if user has required permission for admin routes
 */
export const hasAdminPermission = (user: User | null | undefined, permission: string): boolean => {
  if (!user || user.role !== UserRole.ADMIN) {
    return false;
  }
  
  const permissions = usePermissionStore.getState();
  return permissions.hasPermission(user, permission);
};

/**
 * Get user's admin permissions as array
 */
export const getUserAdminPermissions = (user: User | null | undefined): string[] => {
  if (!user || user.role !== UserRole.ADMIN) {
    return [];
  }
  
  const permissions = usePermissionStore.getState();
  const adminPermissions = [
    'user:read',
    'user:write',
    'user:delete',
    'application:read',
    'application:approve',
    'application:reject',
    'event:read',
    'event:write',
    'event:delete',
    'volunteer:read',
    'volunteer:write',
    'volunteer:delete',
    'report:read',
    'system:manage',
    'settings:read',
    'settings:write',
    'notification:read',
    'notification:write',
    'membership:read',
    'membership:write',
  ];
  
  return adminPermissions.filter(permission => permissions.hasPermission(user, permission));
};

/**
 * Check if user can access specific admin section
 */
export const canAccessAdminSection = (user: User | null | undefined, section: string): boolean => {
  if (!user || user.role !== UserRole.ADMIN) {
    return false;
  }
  
  const sectionPermissions: Record<string, string[]> = {
    dashboard: ['user:read'],
    users: ['user:read'],
    membership: ['membership:read'],
    events: ['event:read'],
    applications: ['application:read'],
    settings: ['settings:read'],
    reports: ['report:read'],
    notifications: ['notification:read'],
    volunteers: ['volunteer:read'],
  };
  
  const requiredPermissions = sectionPermissions[section] || [];
  const permissions = usePermissionStore.getState();
  
  return requiredPermissions.some(permission => permissions.hasPermission(user, permission));
};

/**
 * Get admin route metadata with permission requirements
 */
export const getAdminRouteMetadata = (routePath: string) => {
  const routeMetadata: Record<string, { 
    requiredPermission: string; 
    title: string; 
    description: string; 
    icon?: string;
  }> = {
    '/admin': {
      requiredPermission: 'user:read',
      title: 'Admin Dashboard',
      description: 'Overview of system statistics and quick actions',
      icon: 'dashboard',
    },
    '/admin/users': {
      requiredPermission: 'user:read',
      title: 'User Management',
      description: 'Manage user accounts, roles, and permissions',
      icon: 'users',
    },
    '/admin/membership': {
      requiredPermission: 'membership:read',
      title: 'Membership Management',
      description: 'Manage membership tiers and member relationships',
      icon: 'membership',
    },
    '/admin/events': {
      requiredPermission: 'event:read',
      title: 'Event Management',
      description: 'Create, edit, and manage events',
      icon: 'events',
    },
    '/admin/applications': {
      requiredPermission: 'application:read',
      title: 'Application Review',
      description: 'Review and process membership applications',
      icon: 'applications',
    },
    '/admin/settings': {
      requiredPermission: 'settings:read',
      title: 'System Settings',
      description: 'Configure system settings and preferences',
      icon: 'settings',
    },
  };
  
  return routeMetadata[routePath];
};
