/**
 * Route guards for protected and role-based access control
 */

import React, { createContext, useContext, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks';
import { 
  ProtectedRouteProps, 
  RoleRouteProps, 
  RouteGuardContext, 
  UserRole, 
  ROUTE_PERMISSIONS,
  DEFAULT_ROUTES 
} from './routing-types';

// Auth context for route guards
const RouteGuardContext = createContext<RouteGuardContext>({
  user: null,
  userRole: undefined,
  permissions: [],
  isLoading: true,
  isAuthenticated: false,
});

export const useRouteGuard = () => useContext(RouteGuardContext);

// Loading spinner component
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
);

// Not authorized component
const NotAuthorized: React.FC<{ message?: string }> = ({ message = "You don't have permission to access this page." }) => (
  <div className="flex flex-col items-center justify-center min-h-screen">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-900">403</h1>
      <p className="text-xl text-gray-600 mt-4">{message}</p>
      <p className="text-sm text-gray-500 mt-2">
        Contact your administrator if you believe this is an error.
      </p>
    </div>
  </div>
);

// Authentication required component
const AuthRequired: React.FC = () => {
  const location = useLocation();
  
  return (
    <Navigate 
      to={DEFAULT_ROUTES.LOGIN} 
      state={{ from: location }} 
      replace 
    />
  );
};

// Permission checker hook
const usePermissions = (userRole?: UserRole) => {
  return useMemo(() => {
    if (!userRole) return [];
    
    const rolePermissions = ROUTE_PERMISSIONS[userRole] || [];
    
    // Add common permissions for all authenticated users
    const commonPermissions = [
      { action: 'read', resource: 'profile' },
      { action: 'update', resource: 'profile' },
    ];
    
    return [...rolePermissions, ...commonPermissions];
  }, [userRole]);
};

// Main Protected Route component
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback = <NotAuthorized />,
  loadingFallback = <LoadingSpinner />,
  requireAll = false,
}) => {
  const { user, userRole, isLoading, isAuthenticated } = useAuth();
  const permissions = usePermissions(userRole);
  
  const contextValue: RouteGuardContext = useMemo(() => ({
    user,
    userRole,
    permissions,
    isLoading,
    isAuthenticated,
  }), [user, userRole, permissions, isLoading, isAuthenticated]);

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (!isAuthenticated) {
    return <AuthRequired />;
  }

  if (requireAll && userRole && !userRole) {
    return <>{fallback}</>;
  }

  return (
    <RouteGuardContext.Provider value={contextValue}>
      {children}
    </RouteGuardContext.Provider>
  );
};

// Role-based route component
export const RoleRoute: React.FC<RoleRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = DEFAULT_ROUTES.DASHBOARD,
  permissionMessage = "You don't have the required role to access this page.",
  fallback = <NotAuthorized message={permissionMessage} />,
  loadingFallback = <LoadingSpinner />,
  requireAll = false,
}) => {
  const { user, userRole, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();
  const permissions = usePermissions(userRole);

  const contextValue: RouteGuardContext = useMemo(() => ({
    user,
    userRole,
    permissions,
    isLoading,
    isAuthenticated,
  }), [user, userRole, permissions, isLoading, isAuthenticated]);

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (!isAuthenticated) {
    return <AuthRequired />;
  }

  // Check if user has any of the required roles
  const hasRequiredRole = userRole && allowedRoles.includes(userRole);
  
  if (!hasRequiredRole) {
    // If user is authenticated but doesn't have the role, redirect or show unauthorized
    return (
      <RouteGuardContext.Provider value={contextValue}>
        {fallback}
      </RouteGuardContext.Provider>
    );
  }

  return (
    <RouteGuardContext.Provider value={contextValue}>
      {children}
    </RouteGuardContext.Provider>
  );
};

// Permission-based route component
interface PermissionRouteProps extends Omit<RoleRouteProps, 'allowedRoles'> {
  requiredPermissions: Array<{ action: string; resource: string }>;
}

export const PermissionRoute: React.FC<PermissionRouteProps> = ({
  children,
  requiredPermissions,
  fallback = <NotAuthorized />,
  loadingFallback = <LoadingSpinner />,
  requireAll = true,
}) => {
  const { user, userRole, permissions, isLoading, isAuthenticated } = useAuth();
  const permissions = usePermissions(userRole);

  const contextValue: RouteGuardContext = useMemo(() => ({
    user,
    userRole,
    permissions,
    isLoading,
    isAuthenticated,
  }), [user, userRole, permissions, isLoading, isAuthenticated]);

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (!isAuthenticated) {
    return <AuthRequired />;
  }

  // Check permissions
  const hasPermission = (action: string, resource: string) => {
    return permissions.some(p => p.action === action && p.resource === resource);
  };

  const hasAllPermissions = requiredPermissions.every(p => hasPermission(p.action, p.resource));
  const hasAnyPermission = requiredPermissions.some(p => hasPermission(p.action, p.resource));

  const hasRequiredPermissions = requireAll ? hasAllPermissions : hasAnyPermission;

  if (!hasRequiredPermissions) {
    return (
      <RouteGuardContext.Provider value={contextValue}>
        {fallback}
      </RouteGuardContext.Provider>
    );
  }

  return (
    <RouteGuardContext.Provider value={contextValue}>
      {children}
    </RouteGuardContext.Provider>
  );
};

// Subscription-based route component
interface SubscriptionRouteProps extends Omit<ProtectedRouteProps, 'children'> {
  requiredPlans?: string[];
  children: React.ReactNode;
}

export const SubscriptionRoute: React.FC<SubscriptionRouteProps> = ({
  children,
  requiredPlans = [],
  fallback = <NotAuthorized message="This feature requires a subscription." />,
  loadingFallback = <LoadingSpinner />,
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const subscription = user?.subscription;

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (!isAuthenticated) {
    return <AuthRequired />;
  }

  // Check if user has required subscription
  const hasRequiredPlan = subscription && requiredPlans.includes(subscription.plan);
  
  if (!hasRequiredPlan) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Age verification route component
interface AgeVerificationRouteProps {
  minimumAge?: number;
  children: React.ReactNode;
  fallback?: React.ComponentType | React.ReactNode;
}

export const AgeVerificationRoute: React.FC<AgeVerificationRouteProps> = ({
  minimumAge = 18,
  children,
  fallback = <NotAuthorized message="You must be at least 18 years old to access this content." />,
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <AuthRequired />;
  }

  const birthDate = user?.profile?.birthDate;
  if (!birthDate) {
    return <>{fallback}</>;
  }

  const age = calculateAge(birthDate);
  
  if (age < minimumAge) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Helper function to calculate age
const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

// Composite route guard that combines multiple conditions
interface CompositeRouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: UserRole[];
  requirePermissions?: Array<{ action: string; resource: string }>;
  requireSubscription?: string[];
  minimumAge?: number;
  fallback?: React.ComponentType | React.ReactNode;
  loadingFallback?: React.ComponentType | React.ReactNode;
}

export const CompositeRouteGuard: React.FC<CompositeRouteGuardProps> = ({
  children,
  requireAuth = true,
  requireRole,
  requirePermissions,
  requireSubscription,
  minimumAge,
  fallback = <NotAuthorized />,
  loadingFallback = <LoadingSpinner />,
}) => {
  const { user, userRole, permissions, isLoading, isAuthenticated } = useAuth();
  const subscription = user?.subscription;

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    return <AuthRequired />;
  }

  // Check role
  if (requireRole && userRole && !requireRole.includes(userRole)) {
    return <>{fallback}</>;
  }

  // Check permissions
  if (requirePermissions) {
    const hasPermission = (action: string, resource: string) => {
      return permissions.some(p => p.action === action && p.resource === resource);
    };

    const hasAllPermissions = requirePermissions.every(p => hasPermission(p.action, p.resource));
    
    if (!hasAllPermissions) {
      return <>{fallback}</>;
    }
  }

  // Check subscription
  if (requireSubscription && subscription && !requireSubscription.includes(subscription.plan)) {
    return <>{fallback}</>;
  }

  // Check age
  if (minimumAge) {
    const birthDate = user?.profile?.birthDate;
    if (birthDate) {
      const age = calculateAge(birthDate);
      if (age < minimumAge) {
        return <>{fallback}</>;
      }
    } else {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

// HOC for wrapping components with route guards
export const withRouteGuard = <P extends object>(
  Component: React.ComponentType<P>,
  guardProps: Omit<CompositeRouteGuardProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <CompositeRouteGuard {...guardProps}>
      <Component {...props} />
    </CompositeRouteGuard>
  );

  WrappedComponent.displayName = `withRouteGuard(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default {
  ProtectedRoute,
  RoleRoute,
  PermissionRoute,
  SubscriptionRoute,
  AgeVerificationRoute,
  CompositeRouteGuard,
  withRouteGuard,
};