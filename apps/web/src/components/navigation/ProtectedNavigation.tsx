import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Shield, Lock, UserX } from 'lucide-react';
import { UserRole, MembershipTier } from '@issb/types';
import { NavigationItem, NavigationHelpers } from './NavigationHelpers';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import { Button } from '../ui/Button';

/**
 * Protected navigation configuration
 */
export interface ProtectedNavigationConfig {
  items: NavigationItem[];
  requiredRole?: UserRole;
  requiredTier?: MembershipTier;
  requiredPermissions?: string[];
  fallbackRedirect?: string;
  showError?: boolean;
}

/**
 * Protected navigation component props
 */
export interface ProtectedNavigationProps {
  children: React.ReactNode;
  config: ProtectedNavigationConfig;
  showLoginPrompt?: boolean;
  showAccessDenied?: boolean;
  customErrorMessage?: string;
  onAccessGranted?: () => void;
  onAccessDenied?: () => void;
  className?: string;
}

/**
 * Access control result
 */
export interface AccessControlResult {
  hasAccess: boolean;
  reason?: string;
  missingRole?: UserRole;
  missingTier?: MembershipTier;
  missingPermissions?: string[];
}

/**
 * Check if user has access to protected content
 */
const checkAccess = (
  user: any,
  config: ProtectedNavigationConfig
): AccessControlResult => {
  if (!user) {
    return {
      hasAccess: false,
      reason: 'Authentication required'
    };
  }

  // Check role requirement
  if (config.requiredRole && user.role !== config.requiredRole) {
    return {
      hasAccess: false,
      reason: `Requires ${config.requiredRole} role`,
      missingRole: config.requiredRole
    };
  }

  // Check tier requirement
  if (config.requiredTier && user.tier !== config.requiredTier) {
    return {
      hasAccess: false,
      reason: `Requires ${config.requiredTier} tier`,
      missingTier: config.requiredTier
    };
  }

  // Check permission requirements
  if (config.requiredPermissions && config.requiredPermissions.length > 0) {
    const hasAllPermissions = config.requiredPermissions.every(permission =>
      user.role === UserRole.ADMIN || // Admins have all permissions
      permission === 'user:read:self' || // Users can always read their own data
      false // Add permission checking logic here
    );

    if (!hasAllPermissions) {
      return {
        hasAccess: false,
        reason: 'Insufficient permissions',
        missingPermissions: config.requiredPermissions
      };
    }
  }

  // Check individual item permissions
  if (config.items) {
    const hasItemAccess = config.items.some(item => {
      return NavigationHelpers.canAccessItem(
        item,
        user.role,
        user.tier,
        (permission: string) => {
          // Implement permission checking logic
          switch (permission) {
            case 'user:read':
              return user.role === UserRole.ADMIN || user.role === UserRole.BOARD;
            case 'user:write':
              return user.role === UserRole.ADMIN;
            case 'admin:manage':
              return user.role === UserRole.ADMIN;
            case 'board:view':
              return user.role === UserRole.ADMIN || user.role === UserRole.BOARD;
            default:
              return false;
          }
        }
      );
    });

    if (!hasItemAccess) {
      return {
        hasAccess: false,
        reason: 'No accessible navigation items'
      };
    }
  }

  return {
    hasAccess: true
  };
};

/**
 * Loading state component
 */
const LoadingState: React.FC<{ message?: string }> = ({ 
  message = 'Checking access permissions...' 
}) => (
  <div className="flex items-center justify-center min-h-[200px] p-8">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  </div>
);

/**
 * Access denied state component
 */
const AccessDeniedState: React.FC<{
  result: AccessControlResult;
  showLoginPrompt?: boolean;
  customMessage?: string;
  onLoginClick?: () => void;
}> = ({ 
  result, 
  showLoginPrompt = true, 
  customMessage,
  onLoginClick 
}) => {
  const getIcon = () => {
    if (result.reason === 'Authentication required') {
      return <UserX className="w-12 h-12 text-yellow-500 mx-auto mb-4" />;
    }
    return <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />;
  };

  const getTitle = () => {
    if (result.reason === 'Authentication required') {
      return 'Authentication Required';
    }
    return 'Access Denied';
  };

  const getMessage = () => {
    if (customMessage) {
      return customMessage;
    }

    switch (result.reason) {
      case 'Authentication required':
        return 'Please log in to access this area.';
      case 'Insufficient permissions':
        return 'You don\'t have the required permissions to view this content.';
      case 'No accessible navigation items':
        return 'You don\'t have access to any items in this navigation.';
      default:
        return result.reason || 'Access denied';
    }
  };

  const getDetails = () => {
    if (result.missingRole) {
      return `Required role: ${result.missingRole}`;
    }
    if (result.missingTier) {
      return `Required tier: ${result.missingTier}`;
    }
    if (result.missingPermissions && result.missingPermissions.length > 0) {
      return `Required permissions: ${result.missingPermissions.join(', ')}`;
    }
    return null;
  };

  return (
    <div className="flex items-center justify-center min-h-[300px] p-8">
      <div className="text-center max-w-md">
        {getIcon()}
        
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {getTitle()}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {getMessage()}
        </p>
        
        {getDetails() && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getDetails()}
            </p>
          </div>
        )}
        
        {showLoginPrompt && (
          <Button
            variant="primary"
            onClick={onLoginClick}
            icon={<Lock className="w-4 h-4" />}
          >
            Log In
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * Protected navigation wrapper component
 */
export const ProtectedNavigation: React.FC<ProtectedNavigationProps> = ({
  children,
  config,
  showLoginPrompt = true,
  showAccessDenied = true,
  customErrorMessage,
  onAccessGranted,
  onAccessDenied,
  className = ''
}) => {
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  // Check access permissions
  const accessResult = React.useMemo(() => {
    return checkAccess(user, config);
  }, [user, config]);

  // Handle loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Handle no authentication
  if (!isAuthenticated || !user) {
    if (showAccessDenied) {
      return (
        <div className={className}>
          <AccessDeniedState
            result={accessResult}
            showLoginPrompt={showLoginPrompt}
            customMessage="Please log in to access this area."
          />
        </div>
      );
    }
    
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Handle access denied
  if (!accessResult.hasAccess) {
    if (onAccessDenied) {
      onAccessDenied();
    }

    if (showAccessDenied) {
      return (
        <div className={className}>
          <AccessDeniedState
            result={accessResult}
            showLoginPrompt={showLoginPrompt}
            customMessage={customErrorMessage}
          />
        </div>
      );
    }

    return (
      <Navigate 
        to={config.fallbackRedirect || '/dashboard'} 
        replace 
      />
    );
  }

  // Access granted
  if (onAccessGranted) {
    onAccessGranted();
  }

  return (
    <div className={className}>
      {children}
    </div>
  );
};

/**
 * Role-based protected navigation
 */
export const RoleBasedNavigation: React.FC<{
  children: React.ReactNode;
  requiredRole: UserRole;
  allowedRoles?: UserRole[];
  fallbackRedirect?: string;
  showError?: boolean;
}> = ({
  children,
  requiredRole,
  allowedRoles,
  fallbackRedirect = '/dashboard',
  showError = true
}) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  const hasRequiredRole = user.role === requiredRole;
  
  // Check if user has any of the allowed roles
  const hasAllowedRole = allowedRoles ? allowedRoles.includes(user.role) : false;

  if (!hasRequiredRole && !hasAllowedRole) {
    if (showError) {
      return (
        <div className="flex items-center justify-center min-h-[300px] p-8">
          <div className="text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Insufficient Role
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This area requires {requiredRole} role access.
            </p>
            <Button
              variant="primary"
              onClick={() => window.location.href = fallbackRedirect}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return <Navigate to={fallbackRedirect} replace />;
  }

  return <>{children}</>;
};

/**
 * Tier-based protected navigation
 */
export const TierBasedNavigation: React.FC<{
  children: React.ReactNode;
  requiredTier: MembershipTier;
  allowedTiers?: MembershipTier[];
  fallbackRedirect?: string;
  showError?: boolean;
}> = ({
  children,
  requiredTier,
  allowedTiers,
  fallbackRedirect = '/dashboard',
  showError = true
}) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required tier
  const hasRequiredTier = user.tier === requiredTier;
  
  // Check if user has any of the allowed tiers
  const hasAllowedTier = allowedTiers ? allowedTiers.includes(user.tier) : false;

  if (!hasRequiredTier && !hasAllowedTier) {
    if (showError) {
      return (
        <div className="flex items-center justify-center min-h-[300px] p-8">
          <div className="text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Insufficient Membership Tier
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This area requires {requiredTier} membership tier access.
            </p>
            <Button
              variant="primary"
              onClick={() => window.location.href = fallbackRedirect}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return <Navigate to={fallbackRedirect} replace />;
  }

  return <>{children}</>;
};

/**
 * Permission-based protected navigation
 */
export const PermissionBasedNavigation: React.FC<{
  children: React.ReactNode;
  requiredPermissions: string[];
  fallbackRedirect?: string;
  showError?: boolean;
}> = ({
  children,
  requiredPermissions,
  fallbackRedirect = '/dashboard',
  showError = true
}) => {
  const { user } = useAuthStore();
  const { hasPermission } = usePermissionStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has all required permissions
  const hasAllPermissions = requiredPermissions.every(permission =>
    hasPermission(user, permission)
  );

  if (!hasAllPermissions) {
    if (showError) {
      return (
        <div className="flex items-center justify-center min-h-[300px] p-8">
          <div className="text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Insufficient Permissions
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You don't have the required permissions to access this area.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Required: {requiredPermissions.join(', ')}
            </p>
            <Button
              variant="primary"
              onClick={() => window.location.href = fallbackRedirect}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return <Navigate to={fallbackRedirect} replace />;
  }

  return <>{children}</>;
};

export default ProtectedNavigation;
