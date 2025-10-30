/**
 * Routing infrastructure exports
 */

// Main router
export { AppRouter, useRouter, withRouter, getRouteConfiguration } from './router';

// Route guards
export {
  ProtectedRoute,
  RoleRoute,
  PermissionRoute,
  SubscriptionRoute,
  AgeVerificationRoute,
  CompositeRouteGuard,
  withRouteGuard,
} from './route-guards';

// Route configuration
export { 
  routeConfig, 
  getRouteMetadata, 
  getNavigationItems, 
  getRouteByPath 
} from './route-config';

// Types
export type {
  UserRole,
  RouteAuthLevel,
  RoutePermission,
  RouteMetadata,
  RouteDefinition,
  RouteMatch,
  NavigationItem,
  RouterConfig,
  RouteGuardContext,
  ProtectedRouteProps,
  RoleRouteProps,
  BreadcrumbItem,
  RouteState,
  NavigationState,
  DefaultRoute,
} from './routing-types';

// Constants
export { 
  ROUTE_PERMISSIONS, 
  DEFAULT_ROUTES 
} from './routing-types';

// Re-export commonly used components
export { Layout } from '../components/layout/Layout';
export { AuthLayout } from '../layouts/AuthLayout';
export { AdminLayout } from '../layouts/AdminLayout';
export { BoardLayout } from '../layouts/BoardLayout';
export { MemberLayout } from '../layouts/MemberLayout';

// Utility hooks and components
export { useAuth } from '../features/auth/hooks';

// ============================================================================
// NAVIGATION COMPONENTS
// ============================================================================

export * from '../components/navigation/Navigation';
export * from '../components/navigation/ProtectedNavigation';
export * from '../components/navigation/RoleBasedMenu';
export * from '../components/navigation/Breadcrumbs';
export * from '../components/navigation/NavigationHelpers';

// ============================================================================
// ROUTING UTILITIES
// ============================================================================

export * from './utils/route-helpers';
export * from './utils/breadcrumb-utils';
export * from './utils/analytics';
export * from './utils/error-boundaries';

// ============================================================================
// ROUTE CATEGORIES
// ============================================================================

// Public/Authentication Routes
export * from './public';

// Member/Authenticated Routes
export * from './member';

// Admin/Board Routes  
export * from './admin';

// ============================================================================
// ROUTING HELPERS AND CONFIGURATION
// ============================================================================

/**
 * Quick access to routing helpers
 */
export const routingHelpers = {
  // Navigation helpers
  navigate: (await import('./utils/route-helpers')).NavigationHelpers.navigate,
  buildPath: (await import('./utils/route-helpers')).NavigationHelpers.buildPath,
  buildQuery: (await import('./utils/route-helpers')).NavigationHelpers.buildQuery,
  
  // Breadcrumb generation
  getBreadcrumbs: (await import('./utils/breadcrumb-utils')).BreadcrumbGenerator.generate,
  
  // Analytics
  trackRouteChange: (await import('./utils/analytics')).RouteAnalytics.trackRouteChange,
  
  // Error handling
  getErrorBoundary: (await import('./utils/error-boundaries')).RouteErrorBoundary,
} as const;

/**
 * Common navigation configurations
 */
export const NAVIGATION_CONFIG = {
  // Default navigation items by role
  items: {
    public: [
      { name: 'Home', path: '/', icon: 'Home' },
      { name: 'About', path: '/about', icon: 'Info' },
      { name: 'Events', path: '/events', icon: 'Calendar' },
      { name: 'Contact', path: '/contact', icon: 'Mail' },
    ],
    member: [
      { name: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
      { name: 'Profile', path: '/member/profile', icon: 'User' },
      { name: 'Membership', path: '/member/membership', icon: 'CreditCard' },
      { name: 'Events', path: '/events', icon: 'Calendar' },
      { name: 'Volunteer', path: '/volunteer/opportunities', icon: 'Heart' },
      { name: 'Applications', path: '/member/applications', icon: 'FileText' },
    ],
    board: [
      { name: 'Board Dashboard', path: '/board/dashboard', icon: 'Users' },
      { name: 'Member Directory', path: '/board/members', icon: 'Users' },
      { name: 'Reports', path: '/board/reports', icon: 'BarChart' },
      { name: 'Approvals', path: '/board/approvals', icon: 'CheckCircle' },
    ],
    admin: [
      { name: 'Admin Dashboard', path: '/admin', icon: 'Shield' },
      { name: 'User Management', path: '/admin/users', icon: 'Users' },
      { name: 'Membership Admin', path: '/admin/membership', icon: 'CreditCard' },
      { name: 'Event Management', path: '/admin/events', icon: 'Calendar' },
      { name: 'Application Review', path: '/admin/applications', icon: 'FileCheck' },
      { name: 'System Settings', path: '/admin/settings', icon: 'Settings' },
    ],
  },
  
  // Route access by role
  roleAccess: {
    admin: ['/admin/*', '/board/*', '/member/*', '/events/*', '/volunteer/*', '/applications/*'],
    board: ['/board/*', '/member/*', '/events/*', '/volunteer/*', '/applications/*'],
    member: ['/member/*', '/events/*', '/volunteer/*', '/applications/*'],
  },
  
  // Default redirects
  redirects: {
    unauthenticated: '/login',
    unauthorized: '/403',
    notFound: '/404',
    maintenance: '/maintenance',
  },
} as const;

/**
 * Version information
 */
export const ROUTING_VERSION = '1.0.0';