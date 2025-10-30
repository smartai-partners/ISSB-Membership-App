/**
 * Breadcrumb generation utilities
 */

import { Location } from 'react-router-dom';
import { 
  BreadcrumbItem, 
  RouteDefinition, 
  RouteMatch,
  DEFAULT_ROUTES,
  UserRole
} from '../routing-types';
import { getRouteByPath, getNavigationItems } from '../route-config';

// Custom breadcrumb configuration
export interface BreadcrumbConfig {
  showHome?: boolean;
  showCurrent?: boolean;
  homeLabel?: string;
  homePath?: string;
  separator?: string;
  maxLength?: number;
  truncateLength?: number;
  enableClick?: boolean;
  customLabels?: Record<string, string>;
  transformLabel?: (label: string, route?: RouteDefinition) => string;
}

// Breadcrumb generation options
export interface BreadcrumbOptions {
  includeHome?: boolean;
  includeCurrent?: boolean;
  transformLabels?: boolean;
  maxItems?: number;
  customBreadcrumbs?: BreadcrumbItem[];
}

// Dynamic breadcrumb resolver
export type BreadcrumbResolver = (
  route: RouteDefinition,
  params: Record<string, string>,
  query: Record<string, string>
) => BreadcrumbItem | null;

/**
 * Default breadcrumb resolver
 */
const defaultBreadcrumbResolver: BreadcrumbResolver = (route, params, query) => {
  const metadata = route.metadata;
  
  if (!metadata?.breadcrumb) {
    return null;
  }

  // Replace params in breadcrumb label
  let label = metadata.breadcrumb;
  Object.entries(params).forEach(([key, value]) => {
    label = label.replace(`:${key}`, value);
  });

  // Replace query params in breadcrumb label
  Object.entries(query).forEach(([key, value]) => {
    label = label.replace(`{${key}}`, value);
  });

  return {
    label,
    path: route.path,
    icon: metadata.icon,
  };
};

/**
 * Generate breadcrumbs from current location
 */
export const generateBreadcrumbs = (
  location: Location,
  options: BreadcrumbOptions = {},
  config: BreadcrumbConfig = {}
): BreadcrumbItem[] => {
  const {
    includeHome = true,
    includeCurrent = true,
    transformLabels = true,
    maxItems,
    customBreadcrumbs = [],
  } = options;

  const {
    showHome = true,
    showCurrent = true,
    homeLabel = 'Home',
    homePath = DEFAULT_ROUTES.ROOT,
    separator = '/',
    maxLength,
    truncateLength,
    enableClick = true,
    customLabels,
    transformLabel,
  } = config;

  let breadcrumbs: BreadcrumbItem[] = [...customBreadcrumbs];

  // Parse path segments
  const pathSegments = location.pathname.split('/').filter(Boolean);
  let currentPath = '';

  // Add home breadcrumb
  if (includeHome && showHome && location.pathname !== homePath) {
    breadcrumbs.push({
      label: homeLabel,
      path: enableClick ? homePath : undefined,
      icon: 'home',
    });
  }

  // Generate breadcrumbs for each path segment
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const route = getRouteByPath(currentPath);
    
    if (!route) {
      // Fallback for unmatched segments
      const label = customLabels?.[segment] || 
                   segment.charAt(0).toUpperCase() + segment.slice(1);
      
      breadcrumbs.push({
        label: transformLabel ? transformLabel(label, route) : label,
        path: enableClick && index !== pathSegments.length - 1 ? currentPath : undefined,
      });
      return;
    }

    // Parse route parameters and query
    const params = extractRouteParams(currentPath, route.path);
    const query = Object.fromEntries(new URLSearchParams(location.search));

    // Get breadcrumb from resolver
    const breadcrumb = defaultBreadcrumbResolver(route, params, query) ||
                      route.metadata?.breadcrumb ? {
                        label: route.metadata.breadcrumb,
                        path: enableClick && index !== pathSegments.length - 1 ? currentPath : undefined,
                        icon: route.metadata.icon,
                      } : null;

    if (breadcrumb) {
      let label = breadcrumb.label;

      // Apply transformations
      if (transformLabel) {
        label = transformLabel(label, route);
      }

      // Apply max length
      if (maxLength && label.length > maxLength) {
        label = label.substring(0, maxLength - 3) + '...';
      }

      // Apply truncate length
      if (truncateLength && label.length > truncateLength) {
        label = label.substring(0, truncateLength) + '...';
      }

      breadcrumbs.push({
        ...breadcrumb,
        label,
      });
    }
  });

  // Add current page indicator if enabled and not already included
  if (includeCurrent && showCurrent && pathSegments.length > 0) {
    const lastSegment = pathSegments[pathSegments.length - 1];
    const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
    
    if (!lastBreadcrumb || lastBreadcrumb.path !== location.pathname) {
      const currentLabel = customLabels?.[lastSegment] || 
                          lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
      
      breadcrumbs.push({
        label: transformLabel ? transformLabel(currentLabel) : currentLabel,
        path: undefined, // Current page is not clickable
      });
    }
  }

  // Limit number of breadcrumb items
  if (maxItems && breadcrumbs.length > maxItems) {
    const start = breadcrumbs.length - maxItems;
    breadcrumbs = breadcrumbs.slice(start);
    
    // Add ellipsis indicator
    if (start > 0) {
      breadcrumbs.unshift({
        label: '...',
        path: undefined,
      });
    }
  }

  return breadcrumbs;
};

/**
 * Extract route parameters from path
 */
export const extractRouteParams = (actualPath: string, patternPath: string): Record<string, string> => {
  const params: Record<string, string> = {};
  const actualSegments = actualPath.split('/').filter(Boolean);
  const patternSegments = patternPath.split('/').filter(Boolean);

  patternSegments.forEach((segment, index) => {
    if (segment.startsWith(':')) {
      const paramName = segment.substring(1);
      params[paramName] = actualSegments[index] || '';
    }
  });

  return params;
};

/**
 * Build breadcrumb path from segments
 */
export const buildBreadcrumbPath = (segments: string[]): string => {
  return '/' + segments.join('/');
};

/**
 * Get breadcrumb label with fallback
 */
export const getBreadcrumbLabel = (
  path: string,
  fallbackLabel: string = 'Unknown',
  customLabels?: Record<string, string>
): string => {
  const route = getRouteByPath(path);
  
  if (route?.metadata?.breadcrumb) {
    return route.metadata.breadcrumb;
  }

  // Try custom labels
  const segment = path.split('/').pop();
  if (segment && customLabels?.[segment]) {
    return customLabels[segment];
  }

  // Fallback to capitalized segment
  return segment ? 
    segment.charAt(0).toUpperCase() + segment.slice(1) : 
    fallbackLabel;
};

/**
 * Validate breadcrumb configuration
 */
export const validateBreadcrumbConfig = (
  config: BreadcrumbConfig
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (config.maxLength && config.maxLength < 0) {
    errors.push('maxLength must be non-negative');
  }

  if (config.truncateLength && config.truncateLength < 0) {
    errors.push('truncateLength must be non-negative');
  }

  if (config.maxLength && config.truncateLength && 
      config.truncateLength > config.maxLength) {
    errors.push('truncateLength cannot be greater than maxLength');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Create breadcrumb from route definition
 */
export const createBreadcrumbFromRoute = (
  route: RouteDefinition,
  params: Record<string, string> = {},
  query: Record<string, string> = {}
): BreadcrumbItem | null => {
  const metadata = route.metadata;
  
  if (!metadata?.breadcrumb) {
    return null;
  }

  let label = metadata.breadcrumb;

  // Replace parameters
  Object.entries(params).forEach(([key, value]) => {
    label = label.replace(`:${key}`, value);
  });

  Object.entries(query).forEach(([key, value]) => {
    label = label.replace(`{${key}}`, value);
  });

  return {
    label,
    path: route.path,
    icon: metadata.icon,
  };
};

/**
 * Generate breadcrumb trail for nested routes
 */
export const generateNestedBreadcrumbs = (
  route: RouteDefinition,
  currentPath: string,
  location: Location
): BreadcrumbItem[] => {
  const breadcrumbs: BreadcrumbItem[] = [];
  const segments = currentPath.split('/').filter(Boolean);
  
  let pathSoFar = '';
  
  segments.forEach((segment, index) => {
    pathSoFar += `/${segment}`;
    const matchingRoute = route.children?.find(child => 
      child.path === segment || 
      `${route.path}/${child.path}` === pathSoFar
    );
    
    if (matchingRoute) {
      const breadcrumb = createBreadcrumbFromRoute(
        matchingRoute,
        extractRouteParams(pathSoFar, `${route.path}/${matchingRoute.path}`),
        Object.fromEntries(new URLSearchParams(location.search))
      );
      
      if (breadcrumb) {
        breadcrumbs.push(breadcrumb);
      }
    }
  });

  return breadcrumbs;
};

/**
 * Filter breadcrumbs by user role
 */
export const filterBreadcrumbsByRole = (
  breadcrumbs: BreadcrumbItem[],
  userRole?: UserRole,
  allowedRoles?: UserRole[]
): BreadcrumbItem[] => {
  if (!userRole || !allowedRoles?.length) {
    return breadcrumbs;
  }

  return breadcrumbs.filter(breadcrumb => {
    // Allow breadcrumbs without role restrictions
    if (!breadcrumb.roles || !breadcrumb.roles.length) {
      return true;
    }

    return breadcrumb.roles.includes(userRole);
  });
};

/**
 * Transform breadcrumb labels
 */
export const transformBreadcrumbLabels = (
  breadcrumbs: BreadcrumbItem[],
  transformations: {
    uppercase?: boolean;
    lowercase?: boolean;
    capitalize?: boolean;
    custom?: (label: string) => string;
  }
): BreadcrumbItem[] => {
  const { uppercase, lowercase, capitalize, custom } = transformations;

  return breadcrumbs.map(breadcrumb => {
    let label = breadcrumb.label;

    if (custom) {
      label = custom(label);
    } else if (uppercase) {
      label = label.toUpperCase();
    } else if (lowercase) {
      label = label.toLowerCase();
    } else if (capitalize) {
      label = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
    }

    return {
      ...breadcrumb,
      label,
    };
  });
};

/**
 * Create breadcrumb from navigation items
 */
export const createBreadcrumbsFromNavigation = (
  navigationItems: any[],
  currentPath: string
): BreadcrumbItem[] => {
  const breadcrumbs: BreadcrumbItem[] = [];
  
  const findNavigationPath = (items: any[], targetPath: string, path: string[] = []): string[] | null => {
    for (const item of items) {
      const currentPath = [...path, item.label];
      
      if (item.path === targetPath) {
        return currentPath;
      }
      
      if (item.children) {
        const result = findNavigationPath(item.children, targetPath, currentPath);
        if (result) {
          return result;
        }
      }
    }
    return null;
  };

  const breadcrumbPath = findNavigationPath(navigationItems, currentPath);
  
  if (breadcrumbPath) {
    breadcrumbPath.forEach((label, index) => {
      breadcrumbs.push({
        label,
        path: index < breadcrumbPath.length - 1 ? currentPath : undefined,
      });
    });
  }

  return breadcrumbs;
};

/**
 * Get breadcrumb for specific route
 */
export const getBreadcrumbForRoute = (
  path: string,
  params?: Record<string, string>,
  query?: Record<string, string>
): BreadcrumbItem | null => {
  const route = getRouteByPath(path);
  
  if (!route) {
    return null;
  }

  return createBreadcrumbFromRoute(
    route,
    params,
    query
  );
};

/**
 * Generate breadcrumbs with context
 */
export const generateContextualBreadcrumbs = (
  location: Location,
  context: {
    userRole?: UserRole;
    customLabels?: Record<string, string>;
    showHome?: boolean;
    maxItems?: number;
    transformations?: {
      uppercase?: boolean;
      capitalize?: boolean;
    };
  }
): BreadcrumbItem[] => {
  const {
    userRole,
    customLabels,
    showHome = true,
    maxItems,
    transformations,
  } = context;

  let breadcrumbs = generateBreadcrumbs(location, {
    includeHome: showHome,
    maxItems,
  }, {
    customLabels,
  });

  // Apply role-based filtering
  breadcrumbs = filterBreadcrumbsByRole(breadcrumbs, userRole);

  // Apply transformations
  if (transformations) {
    breadcrumbs = transformBreadcrumbLabels(breadcrumbs, transformations);
  }

  return breadcrumbs;
};

/**
 * Create dynamic breadcrumbs based on route data
 */
export const createDynamicBreadcrumbs = (
  routes: RouteDefinition[],
  currentPath: string,
  routeData: Record<string, any> = {}
): BreadcrumbItem[] => {
  const breadcrumbs: BreadcrumbItem[] = [];

  const findRouteInTree = (routeList: RouteDefinition[], path: string): RouteDefinition | null => {
    for (const route of routeList) {
      if (route.path === path) {
        return route;
      }
      
      if (route.children) {
        const found = findRouteInTree(route.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  const currentRoute = findRouteInTree(routes, currentPath);
  
  if (currentRoute && currentRoute.metadata?.breadcrumb) {
    // Use route data to populate breadcrumb
    let label = currentRoute.metadata.breadcrumb;
    
    Object.entries(routeData).forEach(([key, value]) => {
      label = label.replace(`{${key}}`, String(value));
    });

    breadcrumbs.push({
      label,
      path: currentPath,
      icon: currentRoute.metadata.icon,
    });
  }

  return breadcrumbs;
};

// Export types
export type { BreadcrumbConfig, BreadcrumbOptions, BreadcrumbResolver };
