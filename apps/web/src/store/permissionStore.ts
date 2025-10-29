import { create } from 'zustand';
import { User, UserRole, MembershipTier } from '@issb/types';

interface PermissionState {
  // Permission checking functions
  hasRole: (user: User, roles: string[]) => boolean;
  hasTier: (user: User, tiers: string[]) => boolean;
  hasPermission: (user: User, permission: string) => boolean;
  canAccess: (user: User, resource: string, action: string) => boolean;
  canAccessResource: (user: User, resource: string) => boolean;
  canPerformAction: (user: User, action: string) => boolean;
  
  // Role-based permissions
  isAdmin: (user: User) => boolean;
  isBoard: (user: User) => boolean;
  isMember: (user: User) => boolean;
  
  // Tier-based permissions
  canViewBoardContent: (user: User) => boolean;
  canViewAdminContent: (user: User) => boolean;
  canVolunteer: (user: User) => boolean;
  canManageMembers: (user: User) => boolean;
  
  // Resource-specific permissions
  canEditUser: (currentUser: User, targetUser: User) => boolean;
  canDeleteUser: (currentUser: User, targetUser: User) => boolean;
  canManageApplications: (user: User) => boolean;
  canApproveApplications: (user: User) => boolean;
  canManageEvents: (user: User) => boolean;
  canManageVolunteerOps: (user: User) => boolean;
  canViewReports: (user: User) => boolean;
  canManageSystem: (user: User) => boolean;
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  hasRole: (user: User, roles: string[]) => {
    return roles.includes(user.role);
  },

  hasTier: (user: User, tiers: string[]) => {
    return tiers.includes(user.tier);
  },

  hasPermission: (user: User, permission: string) => {
    // Define role-based permissions
    const rolePermissions = {
      [UserRole.ADMIN]: [
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
      ],
      [UserRole.BOARD]: [
        'user:read',
        'application:read',
        'application:approve',
        'application:reject',
        'event:read',
        'event:write',
        'volunteer:read',
        'volunteer:write',
        'report:read',
        'notification:read',
        'notification:write',
      ],
      [UserRole.MEMBER]: [
        'user:read:self',
        'user:write:self',
        'event:read',
        'event:register',
        'volunteer:read',
        'volunteer:apply',
        'profile:read',
        'profile:write',
      ],
    };

    return rolePermissions[user.role]?.includes(permission) || false;
  },

  canAccess: (user: User, resource: string, action: string) => {
    const permission = `${resource}:${action}`;
    return get().hasPermission(user, permission);
  },

  canAccessResource: (user: User, resource: string) => {
    return user.role === UserRole.ADMIN || 
           user.role === UserRole.BOARD || 
           (resource === 'profile' && user.id === user.id);
  },

  canPerformAction: (user: User, action: string) => {
    switch (action) {
      case 'manage_users':
        return user.role === UserRole.ADMIN;
      case 'manage_applications':
        return user.role === UserRole.ADMIN || user.role === UserRole.BOARD;
      case 'manage_events':
        return user.role === UserRole.ADMIN || user.role === UserRole.BOARD;
      case 'view_reports':
        return user.role === UserRole.ADMIN || user.role === UserRole.BOARD;
      case 'manage_system':
        return user.role === UserRole.ADMIN;
      case 'volunteer':
        return user.tier === MembershipTier.BOARD || user.tier === MembershipTier.ADMIN;
      default:
        return false;
    }
  },

  isAdmin: (user: User) => {
    return user.role === UserRole.ADMIN;
  },

  isBoard: (user: User) => {
    return user.role === UserRole.BOARD;
  },

  isMember: (user: User) => {
    return user.role === UserRole.MEMBER;
  },

  canViewBoardContent: (user: User) => {
    return user.tier === MembershipTier.BOARD || user.tier === MembershipTier.ADMIN;
  },

  canViewAdminContent: (user: User) => {
    return user.tier === MembershipTier.ADMIN;
  },

  canVolunteer: (user: User) => {
    return user.tier === MembershipTier.BOARD || user.tier === MembershipTier.ADMIN;
  },

  canManageMembers: (user: User) => {
    return user.role === UserRole.ADMIN || user.role === UserRole.BOARD;
  },

  canEditUser: (currentUser: User, targetUser: User) => {
    // Users can edit their own profile
    if (currentUser.id === targetUser.id) {
      return true;
    }
    
    // Admins can edit any user
    if (currentUser.role === UserRole.ADMIN) {
      return true;
    }
    
    // Board members can edit regular members
    if (currentUser.role === UserRole.BOARD && targetUser.role === UserRole.MEMBER) {
      return true;
    }
    
    return false;
  },

  canDeleteUser: (currentUser: User, targetUser: User) => {
    // Admins can delete any user except themselves
    if (currentUser.role === UserRole.ADMIN && currentUser.id !== targetUser.id) {
      return true;
    }
    
    // Board members can delete regular members
    if (currentUser.role === UserRole.BOARD && targetUser.role === UserRole.MEMBER) {
      return true;
    }
    
    return false;
  },

  canManageApplications: (user: User) => {
    return user.role === UserRole.ADMIN || user.role === UserRole.BOARD;
  },

  canApproveApplications: (user: User) => {
    return user.role === UserRole.ADMIN || user.role === UserRole.BOARD;
  },

  canManageEvents: (user: User) => {
    return user.role === UserRole.ADMIN || user.role === UserRole.BOARD;
  },

  canManageVolunteerOps: (user: User) => {
    return user.tier === MembershipTier.BOARD || user.tier === MembershipTier.ADMIN;
  },

  canViewReports: (user: User) => {
    return user.role === UserRole.ADMIN || user.role === UserRole.BOARD;
  },

  canManageSystem: (user: User) => {
    return user.role === UserRole.ADMIN;
  },
}));

// Utility functions for permission checking
export const hasRole = (user: User, roles: string[]): boolean => {
  return usePermissionStore.getState().hasRole(user, roles);
};

export const hasTier = (user: User, tiers: string[]): boolean => {
  return usePermissionStore.getState().hasTier(user, tiers);
};

export const canPerformAction = (user: User, action: string): boolean => {
  return usePermissionStore.getState().canPerformAction(user, action);
};

export const canAccessResource = (user: User, resource: string): boolean => {
  return usePermissionStore.getState().canAccessResource(user, resource);
};

export const isAdmin = (user: User): boolean => {
  return usePermissionStore.getState().isAdmin(user);
};

export const isBoard = (user: User): boolean => {
  return usePermissionStore.getState().isBoard(user);
};

export const isMember = (user: User): boolean => {
  return usePermissionStore.getState().isMember(user);
};