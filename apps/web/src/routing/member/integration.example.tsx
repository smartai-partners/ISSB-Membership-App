/**
 * Example Integration with Main App.tsx
 * This file demonstrates how to integrate the member routes with the main application
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { usePermissionStore } from '@/store/permissionStore';

// Import layouts
import MemberLayout from '@/layouts/MemberLayout';
import AuthLayout from '@/layouts/AuthLayout';
import AdminLayout from '@/layouts/AdminLayout';
import BoardLayout from '@/layouts/BoardLayout';

// Import member routes
import MemberRoutes from './index';

// Import page components
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';

// Import error pages
import NotFoundPage from '@/pages/NotFoundPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';

// Example of main App.tsx integration
const App: React.FC = () => {
  const { user } = useAuthStore();

  const getLayout = () => {
    if (!user) return null;

    switch (user.role) {
      case 'admin':
        return AdminLayout;
      case 'board':
        return BoardLayout;
      case 'member':
        return MemberLayout;
      default:
        return MemberLayout;
    }
  };

  const Layout = getLayout();

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <HomePage />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <AuthLayout>
                <LoginPage />
              </AuthLayout>
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <AuthLayout>
                <RegisterPage />
              </AuthLayout>
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <AuthLayout>
                <ForgotPasswordPage />
              </AuthLayout>
            </PublicRoute>
          }
        />

        {/* Enhanced Protected Route Component */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
              {Layout && (
                <Layout>
                  <Navigate to="/member/dashboard" replace />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />

        {/* Member Routes Integration */}
        <Route
          path="/member/*"
          element={
            <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
              {Layout && (
                <Layout>
                  <MemberRoutes />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />

        {/* Legacy Redirects */}
        <Route
          path="/profile"
          element={<Navigate to="/member/profile" replace />}
        />
        <Route
          path="/membership"
          element={<Navigate to="/member/membership" replace />}
        />
        <Route
          path="/events"
          element={<Navigate to="/member/events" replace />}
        />
        <Route
          path="/volunteer"
          element={<Navigate to="/member/volunteering" replace />}
        />
        <Route
          path="/applications"
          element={<Navigate to="/member/applications" replace />}
        />

        {/* Error Routes */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
};

// Enhanced Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  allowedTiers?: string[];
  requiresActiveMembership?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [], 
  allowedTiers = [],
  requiresActiveMembership = false
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const { hasRole, hasTier } = usePermissionStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (user && allowedRoles.length > 0 && !hasRole(user, allowedRoles)) {
    return <UnauthorizedPage />;
  }

  // Check tier-based access
  if (user && allowedTiers.length > 0 && !hasTier(user, allowedTiers)) {
    return <UnauthorizedPage />;
  }

  // Check active membership requirement
  if (requiresActiveMembership && user?.status !== 'active') {
    return (
      <UnauthorizedPage 
        message="Active membership required to access this feature. Please renew your membership." 
      />
    );
  }

  return <>{children}</>;
};

// Public Route Component
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const { user } = useAuthStore();
  
  if (isAuthenticated) {
    // Redirect authenticated users to appropriate dashboard
    if (user) {
      switch (user.role) {
        case 'admin':
          return <Navigate to="/admin" replace />;
        case 'board':
          return <Navigate to="/board" replace />;
        case 'member':
        default:
          return <Navigate to="/member/dashboard" replace />;
      }
    }
  }

  return <>{children}</>;
};

export default App;

/**
 * Alternative Integration with Navigation Guards
 * This approach uses the dedicated navigation guards from the member routing system
 */

import { AuthGuard, RoleGuard, MemberGuard } from './navigation-guards';

const AlternativeApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <AuthGuard redirectTo="/login">
              <HomePage />
            </AuthGuard>
          }
        />
        <Route
          path="/login"
          element={
            <AuthGuard redirectTo="/member/dashboard">
              <AuthLayout>
                <LoginPage />
              </AuthLayout>
            </AuthGuard>
          }
        />

        {/* Member Routes with Enhanced Guards */}
        <Route
          path="/member/*"
          element={
            <MemberGuard>
              <MemberLayout>
                <MemberRoutes />
              </MemberLayout>
            </MemberGuard>
          }
        />

        {/* Error Routes */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
};

/**
 * Configuration for Environment-specific Routes
 * Different environments might have different route configurations
 */

const createRouteConfig = (environment: string) => {
  const configs = {
    development: {
      enableDebugRoutes: true,
      enableRouteLogging: true,
      showAccessDeniedDetails: true
    },
    staging: {
      enableDebugRoutes: false,
      enableRouteLogging: true,
      showAccessDeniedDetails: false
    },
    production: {
      enableDebugRoutes: false,
      enableRouteLogging: false,
      showAccessDeniedDetails: false
    }
  };

  return configs[environment as keyof typeof configs] || configs.development;
};

const EnvironmentSpecificApp: React.FC = () => {
  const routeConfig = createRouteConfig(process.env.NODE_ENV || 'development');
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Main routes with environment-specific configuration */}
        <Route
          path="/member/*"
          element={
            <MemberGuard>
              <MemberLayout>
                <MemberRoutes />
              </MemberLayout>
            </MemberGuard>
          }
        />
        
        {/* Development-only debug routes */}
        {routeConfig.enableDebugRoutes && (
          <Route
            path="/debug/routes"
            element={<RouteDebugPage />}
          />
        )}
        
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
};

/**
 * Route Access Matrix
 * Define who can access what routes and features
 */

export const ROUTE_ACCESS_MATRIX = {
  // Basic member routes - accessible to all members
  BASIC_MEMBER_ROUTES: {
    '/member/dashboard': ['member', 'board', 'admin'],
    '/member/profile': ['member', 'board', 'admin'],
    '/member/membership': ['member', 'board', 'admin'],
    '/member/events': ['member', 'board', 'admin'],
    '/member/applications': ['member', 'board', 'admin']
  },
  
  // Board management routes
  BOARD_ROUTES: {
    '/member/board/*': ['board', 'admin']
  },
  
  // Admin-only routes
  ADMIN_ROUTES: {
    '/member/admin/*': ['admin']
  },
  
  // Tier-based routes
  TIER_BASED_ROUTES: {
    '/member/directory': ['silver', 'gold', 'platinum'],
    '/member/forums': ['silver', 'gold', 'platinum'],
    '/member/discounts': ['silver', 'gold', 'platinum'],
    '/member/networking': ['gold', 'platinum']
  },
  
  // Volunteer-specific routes
  VOLUNTEER_ROUTES: {
    '/member/volunteering/*': ['member', 'board', 'admin']
  }
};

/**
 * Route Validation Function
 * Validate routes against access matrix
 */

const validateRouteAccess = (
  routePath: string, 
  userRole: string, 
  userTier?: string
): boolean => {
  // Check basic member routes
  for (const [path, roles] of Object.entries(ROUTE_ACCESS_MATRIX.BASIC_MEMBER_ROUTES)) {
    if (routePath.startsWith(path) && roles.includes(userRole as any)) {
      return true;
    }
  }
  
  // Check board routes
  for (const [path, roles] of Object.entries(ROUTE_ACCESS_MATRIX.BOARD_ROUTES)) {
    if (routePath.startsWith(path) && roles.includes(userRole as any)) {
      return true;
    }
  }
  
  // Check admin routes
  for (const [path, roles] of Object.entries(ROUTE_ACCESS_MATRIX.ADMIN_ROUTES)) {
    if (routePath.startsWith(path) && roles.includes(userRole as any)) {
      return true;
    }
  }
  
  // Check tier-based routes
  if (userTier) {
    for (const [path, tiers] of Object.entries(ROUTE_ACCESS_MATRIX.TIER_BASED_ROUTES)) {
      if (routePath.startsWith(path) && tiers.includes(userTier as any)) {
        return true;
      }
    }
  }
  
  return false;
};

/**
 * Example Route Debug Page for Development
 */

const RouteDebugPage: React.FC = () => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <div>Please log in to view debug information.</div>;
  }
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Route Access Debug</h1>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Current User</h2>
        <pre className="text-sm bg-gray-100 p-2 rounded">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow mt-4">
        <h2 className="text-lg font-semibold mb-2">Route Access Matrix</h2>
        <pre className="text-sm bg-gray-100 p-2 rounded">
          {JSON.stringify(ROUTE_ACCESS_MATRIX, null, 2)}
        </pre>
      </div>
    </div>
  );
};