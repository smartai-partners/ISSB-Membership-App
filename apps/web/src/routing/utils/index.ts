/**
 * Routing utilities and helpers index
 */

// Route helpers
export * from './route-helpers';
export type {
  NavigationOptions,
  QueryParams,
  RouteTransitionConfig,
} from './route-helpers';

// Breadcrumb utilities
export * from './breadcrumb-utils';
export type {
  BreadcrumbConfig,
  BreadcrumbOptions,
  BreadcrumbResolver,
} from './breadcrumb-utils';

// Analytics utilities
export * from './analytics';
export type {
  AnalyticsConfig,
  AnalyticsEvent,
  AnalyticsEventType,
  PerformanceMetrics,
  GuardInfo,
  AnalyticsProvider,
} from './analytics';

// Error boundary utilities
export * from './error-boundaries';
export type {
  ErrorBoundaryConfig,
  RouteErrorInfo,
  RouteErrorType,
  ErrorBoundaryProps,
  ErrorFallbackProps,
} from './error-boundaries';

// Re-export common types from routing-types
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
} from '../routing-types';

export {
  ROUTE_PERMISSIONS,
  DEFAULT_ROUTES,
} from '../routing-types';

// Convenience re-exports from related modules
export { getRouteByPath, getNavigationItems } from '../route-config';

// Helper function to get all routing utilities
export const getRoutingUtilities = () => ({
  // Navigation helpers
  navigateTo: require('./route-helpers').navigateTo,
  navigateBack: require('./route-helpers').navigateBack,
  navigateForward: require('./route-helpers').navigateForward,
  buildQueryString: require('./route-helpers').buildQueryString,
  parseQueryParams: require('./route-helpers').parseQueryParams,
  getQueryParam: require('./route-helpers').getQueryParam,
  updateQueryParams: require('./route-helpers').updateQueryParams,
  clearQueryParams: require('./route-helpers').clearQueryParams,
  routeMatches: require('./route-helpers').routeMatches,
  getRouteSegments: require('./route-helpers').getRouteSegments,
  getParentRoute: require('./route-helpers').getParentRoute,
  buildPath: require('./route-helpers').buildPath,
  validateRoutePath: require('./route-helpers').validateRoutePath,
  hasRequiredRole: require('./route-helpers').hasRequiredRole,
  hasRequiredPermissions: require('./route-helpers').hasRequiredPermissions,
  getAccessibleNavigation: require('./route-helpers').getAccessibleNavigation,
  prefetchRoute: require('./route-helpers').prefetchRoute,
  smartNavigate: require('./route-helpers').smartNavigate,
  updateNavigationState: require('./route-helpers').updateNavigationState,
  getRouteMetadata: require('./route-helpers').getRouteMetadata,
  scrollToElement: require('./route-helpers').scrollToElement,
  preserveScrollPosition: require('./route-helpers').preserveScrollPosition,
  
  // Breadcrumb helpers
  generateBreadcrumbs: require('./breadcrumb-utils').generateBreadcrumbs,
  extractRouteParams: require('./breadcrumb-utils').extractRouteParams,
  buildBreadcrumbPath: require('./breadcrumb-utils').buildBreadcrumbPath,
  getBreadcrumbLabel: require('./breadcrumb-utils').getBreadcrumbLabel,
  validateBreadcrumbConfig: require('./breadcrumb-utils').validateBreadcrumbConfig,
  createBreadcrumbFromRoute: require('./breadcrumb-utils').createBreadcrumbFromRoute,
  generateNestedBreadcrumbs: require('./breadcrumb-utils').generateNestedBreadcrumbs,
  filterBreadcrumbsByRole: require('./breadcrumb-utils').filterBreadcrumbsByRole,
  transformBreadcrumbLabels: require('./breadcrumb-utils').transformBreadcrumbLabels,
  createBreadcrumbsFromNavigation: require('./breadcrumb-utils').createBreadcrumbsFromNavigation,
  getBreadcrumbForRoute: require('./breadcrumb-utils').getBreadcrumbForRoute,
  generateContextualBreadcrumbs: require('./breadcrumb-utils').generateContextualBreadcrumbs,
  createDynamicBreadcrumbs: require('./breadcrumb-utils').createDynamicBreadcrumbs,
  
  // Analytics helpers
  analytics: require('./analytics').analytics,
  useAnalytics: require('./analytics').useAnalytics,
  withAnalytics: require('./analytics').withAnalytics,
  RoutePerformanceTracker: require('./analytics').RoutePerformanceTracker,
  createAnalyticsProvider: require('./analytics').createAnalyticsProvider,
  configureAnalytics: require('./analytics').configureAnalytics,
  
  // Error boundary helpers
  RouteErrorBoundary: require('./error-boundaries').RouteErrorBoundary,
  NavigationErrorBoundary: require('./error-boundaries').NavigationErrorBoundary,
  ComponentErrorBoundary: require('./error-boundaries').ComponentErrorBoundary,
  GuardErrorBoundary: require('./error-boundaries').GuardErrorBoundary,
  PermissionErrorBoundary: require('./error-boundaries').PermissionErrorBoundary,
  NetworkErrorBoundary: require('./error-boundaries').NetworkErrorBoundary,
  ErrorBoundaryProvider: require('./error-boundaries').ErrorBoundaryProvider,
  useErrorBoundary: require('./error-boundaries').useErrorBoundary,
  RouteError: require('./error-boundaries').RouteError,
  createRouteError: require('./error-boundaries').createRouteError,
  isRecoverableError: require('./error-boundaries').isRecoverableError,
  getErrorTypeFromError: require('./error-boundaries').getErrorTypeFromError,
  withErrorBoundary: require('./error-boundaries').withErrorBoundary,
});

// Version information
export const ROUTING_UTILS_VERSION = '1.0.0';
