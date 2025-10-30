/**
 * Route navigation helpers and utilities
 */

import { NavigateFunction, Location } from 'react-router-dom';
import { 
  RouteDefinition, 
  RouteMatch, 
  BreadcrumbItem, 
  DEFAULT_ROUTES,
  NavigationItem,
  UserRole,
  RoutePermission
} from '../routing-types';
import { getRouteByPath, getNavigationItems } from '../route-config';

// Navigation options interface
export interface NavigationOptions {
  replace?: boolean;
  state?: Record<string, any>;
  skipGuard?: boolean;
  preserveScroll?: boolean;
  preserveQuery?: boolean;
}

// Query parameter utilities
export interface QueryParams {
  [key: string]: string | string[];
}

export interface RouteTransitionConfig {
  duration?: number;
  easing?: string;
  disableAnimations?: boolean;
}

/**
 * Navigate to a route with options
 */
export const navigateTo = (
  navigate: NavigateFunction,
  path: string,
  options: NavigationOptions = {}
): void => {
  const {
    replace = false,
    state,
    skipGuard = false,
  } = options;

  try {
    if (skipGuard) {
      // Use replaceState to bypass guards if needed
      window.history.pushState(state, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } else {
      navigate(path, { replace, state });
    }
  } catch (error) {
    console.error('Navigation error:', error);
    // Fallback to direct navigation
    window.location.href = path;
  }
};

/**
 * Navigate back with error handling
 */
export const navigateBack = (
  navigate: NavigateFunction,
  fallbackPath: string = DEFAULT_ROUTES.DASHBOARD
): void => {
  try {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackPath, { replace: true });
    }
  } catch (error) {
    console.error('Back navigation error:', error);
    navigate(fallbackPath, { replace: true });
  }
};

/**
 * Navigate forward with error handling
 */
export const navigateForward = (
  navigate: NavigateFunction,
  fallbackPath?: string
): void => {
  try {
    if (fallbackPath) {
      navigate(fallbackPath);
    } else if (window.history.length > 1) {
      navigate(1);
    } else {
      navigate(DEFAULT_ROUTES.DASHBOARD);
    }
  } catch (error) {
    console.error('Forward navigation error:', error);
    if (fallbackPath) {
      navigate(fallbackPath);
    }
  }
};

/**
 * Build query string from parameters
 */
export const buildQueryString = (params: QueryParams): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => searchParams.append(key, v));
    } else if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Parse query parameters from URL
 */
export const parseQueryParams = (search: string): QueryParams => {
  const params: QueryParams = {};
  const searchParams = new URLSearchParams(search);

  for (const [key, value] of searchParams.entries()) {
    if (params[key]) {
      // Convert to array if multiple values exist
      if (Array.isArray(params[key])) {
        (params[key] as string[]).push(value);
      } else {
        params[key] = [params[key] as string, value];
      }
    } else {
      params[key] = value;
    }
  }

  return params;
};

/**
 * Get query parameter value
 */
export const getQueryParam = (
  search: string,
  param: string,
  defaultValue: string = ''
): string => {
  const params = new URLSearchParams(search);
  return params.get(param) || defaultValue;
};

/**
 * Update URL with new query parameters
 */
export const updateQueryParams = (
  navigate: NavigateFunction,
  location: Location,
  newParams: Partial<QueryParams>,
  options: NavigationOptions = {}
): void => {
  const currentParams = parseQueryParams(location.search);
  const updatedParams = { ...currentParams, ...newParams };

  // Remove empty values
  Object.keys(updatedParams).forEach(key => {
    const value = updatedParams[key];
    if (value === undefined || value === null || 
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'string' && value.trim() === '')) {
      delete updatedParams[key];
    }
  });

  const queryString = buildQueryString(updatedParams);
  const newPath = `${location.pathname}${queryString}`;

  navigateTo(navigate, newPath, options);
};

/**
 * Clear specific query parameters
 */
export const clearQueryParams = (
  navigate: NavigateFunction,
  location: Location,
  paramsToClear: string[],
  options: NavigationOptions = {}
): void => {
  const currentParams = parseQueryParams(location.search);
  const updatedParams = { ...currentParams };

  paramsToClear.forEach(param => {
    delete updatedParams[param];
  });

  const queryString = buildQueryString(updatedParams);
  const newPath = `${location.pathname}${queryString}`;

  navigateTo(navigate, newPath, options);
};

/**
 * Check if current route matches pattern
 */
export const routeMatches = (
  location: Location,
  pattern: string,
  exact: boolean = false
): boolean => {
  if (exact) {
    return location.pathname === pattern;
  }
  return location.pathname.startsWith(pattern);
};

/**
 * Get route segments from path
 */
export const getRouteSegments = (path: string): string[] => {
  return path.split('/').filter(Boolean);
};

/**
 * Get parent route path
 */
export const getParentRoute = (path: string): string | null => {
  const segments = getRouteSegments(path);
  if (segments.length <= 1) return null;
  
  segments.pop();
  return '/' + segments.join('/');
};

/**
 * Get deep child route from nested routes
 */
export const getDeepestChildRoute = (
  route: RouteDefinition,
  currentPath: string
): RouteDefinition | null => {
  if (!route.children || route.children.length === 0) {
    return null;
  }

  // Find matching child route
  const matchingChild = route.children.find(child => 
    currentPath.startsWith(`${route.path}/${child.path}`)
  );

  if (matchingChild) {
    const deepestChild = getDeepestChildRoute(matchingChild, currentPath);
    return deepestChild || matchingChild;
  }

  return null;
};

/**
 * Build complete path from route segments
 */
export const buildPath = (
  segments: (string | number)[],
  params: Record<string, any> = {}
): string => {
  let path = segments.join('/');

  // Replace parameter placeholders
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`:${key}`, String(value));
  });

  return path.startsWith('/') ? path : `/${path}`;
};

/**
 * Validate route path
 */
export const validateRoutePath = (path: string): { isValid: boolean; error?: string } => {
  if (!path) {
    return { isValid: false, error: 'Path is required' };
  }

  if (!path.startsWith('/')) {
    return { isValid: false, error: 'Path must start with /' };
  }

  if (path.includes('//')) {
    return { isValid: false, error: 'Path cannot contain double slashes' };
  }

  if (path.includes(' ')) {
    return { isValid: false, error: 'Path cannot contain spaces' };
  }

  return { isValid: true };
};

/**
 * Check if user has required role
 */
export const hasRequiredRole = (
  userRole: UserRole | undefined,
  requiredRoles: UserRole[]
): boolean => {
  if (!userRole || !requiredRoles.length) return false;
  return requiredRoles.includes(userRole);
};

/**
 * Check if user has required permissions
 */
export const hasRequiredPermissions = (
  userPermissions: RoutePermission[],
  requiredPermissions: RoutePermission[]
): boolean => {
  if (!requiredPermissions.length) return true;
  if (!userPermissions.length) return false;

  return requiredPermissions.every(required =>
    userPermissions.some(userPerm =>
      userPerm.resource === required.resource &&
      (userPerm.action === required.action || userPerm.action === '*')
    )
  );
};

/**
 * Get accessible navigation items for user role
 */
export const getAccessibleNavigation = (
  userRole: UserRole | undefined,
  userPermissions: RoutePermission[] = []
): NavigationItem[] => {
  const allItems = getNavigationItems();

  const filterByRole = (items: NavigationItem[]): NavigationItem[] => {
    return items.filter(item => {
      // If no role required, show item
      if (!item.roles) return true;
      
      // If user has required role
      if (userRole && item.roles.includes(userRole)) return true;

      return false;
    }).map(item => ({
      ...item,
      children: item.children ? filterByRole(item.children) : undefined,
    }));
  };

  return filterByRole(allItems);
};

/**
 * Prefetch route component
 */
export const prefetchRoute = async (route: RouteDefinition): Promise<void> => {
  try {
    if (route.component) {
      const componentLoader = route.component;
      await componentLoader();
    }
  } catch (error) {
    console.warn(`Failed to prefetch route ${route.path}:`, error);
  }
};

/**
 * Smart navigation with fallbacks
 */
export const smartNavigate = (
  navigate: NavigateFunction,
  location: Location,
  primaryPath: string,
  fallbackPath: string = DEFAULT_ROUTES.DASHBOARD,
  options: NavigationOptions = {}
): void => {
  // Validate primary path
  const validation = validateRoutePath(primaryPath);
  if (!validation.isValid) {
    console.warn(`Invalid primary path: ${validation.error}`);
    navigateTo(navigate, fallbackPath, { ...options, replace: true });
    return;
  }

  // Check if route exists
  const route = getRouteByPath(primaryPath);
  if (!route) {
    console.warn(`Route not found: ${primaryPath}`);
    navigateTo(navigate, fallbackPath, { ...options, replace: true });
    return;
  }

  navigateTo(navigate, primaryPath, options);
};

/**
 * Batch navigation state update
 */
export const updateNavigationState = (
  navigate: NavigateFunction,
  location: Location,
  updates: {
    path?: string;
    query?: Partial<QueryParams>;
    state?: Record<string, any>;
  },
  options: NavigationOptions = {}
): void => {
  let newPath = updates.path || location.pathname;

  // Update query parameters if provided
  if (updates.query) {
    const currentParams = parseQueryParams(location.search);
    const updatedParams = { ...currentParams, ...updates.query };
    const queryString = buildQueryString(updatedParams);
    newPath = `${newPath}${queryString}`;
  }

  navigateTo(navigate, newPath, { ...options, state: updates.state });
};

/**
 * Get route metadata with fallback
 */
export const getRouteMetadata = (
  path: string,
  fallbackMetadata: Partial<any> = {}
): any => {
  const route = getRouteByPath(path);
  return route?.metadata || fallbackMetadata;
};

/**
 * Scroll to element after navigation
 */
export const scrollToElement = (
  elementId: string,
  behavior: ScrollBehavior = 'smooth'
): void => {
  setTimeout(() => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior, block: 'start' });
    }
  }, 0);
};

/**
 * Preserve and restore scroll position
 */
export const preserveScrollPosition = (
  key: string = 'scroll_position'
): { save: () => void; restore: () => void } => {
  const save = () => {
    const scrollData = {
      x: window.scrollX,
      y: window.scrollY,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(key, JSON.stringify(scrollData));
  };

  const restore = () => {
    try {
      const saved = sessionStorage.getItem(key);
      if (saved) {
        const { x, y } = JSON.parse(saved);
        window.scrollTo(x, y);
      }
    } catch (error) {
      console.warn('Failed to restore scroll position:', error);
    }
  };

  return { save, restore };
};

// Export utility types
export type { NavigationOptions, QueryParams, RouteTransitionConfig };
