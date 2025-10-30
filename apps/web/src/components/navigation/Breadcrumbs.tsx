import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { NavigationItem, BreadcrumbItem, NavigationHelpers } from './NavigationHelpers';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';

/**
 * Breadcrumb navigation component with accessibility features
 */
export interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  navigationItems?: NavigationItem[];
  homeLabel?: string;
  showHome?: boolean;
  separator?: React.ComponentType<any>;
  maxItems?: number;
  className?: string;
  onItemClick?: (item: BreadcrumbItem) => void;
  'aria-label'?: string;
}

/**
 * Default breadcrumb separator component
 */
const DefaultSeparator: React.FC<{ className?: string }> = ({ className }) => (
  <ChevronRight className={`w-4 h-4 text-gray-400 ${className || ''}`} aria-hidden="true" />
);

/**
 * Breadcrumbs component with full accessibility support
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  navigationItems,
  homeLabel = 'Home',
  showHome = true,
  separator: Separator = DefaultSeparator,
  maxItems,
  className = '',
  onItemClick,
  'aria-label': ariaLabel = 'Breadcrumb navigation',
  ...props
}) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { hasPermission } = usePermissionStore();

  // Generate breadcrumbs from current path if items not provided
  const breadcrumbItems = React.useMemo(() => {
    if (items) {
      return items;
    }

    if (navigationItems && user) {
      return NavigationHelpers.generateBreadcrumbs(
        location.pathname,
        navigationItems,
        homeLabel
      );
    }

    // Fallback: generate basic breadcrumbs from path
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const fallbackItems: BreadcrumbItem[] = [];

    if (showHome && pathSegments.length > 0) {
      fallbackItems.push({
        label: homeLabel,
        path: '/',
        isActive: location.pathname === '/'
      });
    }

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      fallbackItems.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
        path: currentPath,
        isActive: index === pathSegments.length - 1
      });
    });

    return fallbackItems;
  }, [items, navigationItems, user, location.pathname, homeLabel, showHome]);

  // Truncate items if maxItems is specified
  const displayedItems = React.useMemo(() => {
    if (!maxItems || breadcrumbItems.length <= maxItems) {
      return breadcrumbItems;
    }

    const firstItem = breadcrumbItems[0];
    const lastItems = breadcrumbItems.slice(-(maxItems - 1));
    return [firstItem, { label: '...', path: '#', isActive: false }, ...lastItems];
  }, [breadcrumbItems, maxItems]);

  // Skip rendering if no items or only one item (home)
  if (!displayedItems.length || 
      (displayedItems.length === 1 && displayedItems[0].path === '/')) {
    return null;
  }

  const handleItemClick = (item: BreadcrumbItem, index: number) => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, item: BreadcrumbItem, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleItemClick(item, index);
    }
  };

  return (
    <nav 
      aria-label={ariaLabel}
      className={`breadcrumbs ${className}`}
      {...props}
    >
      <ol className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        {displayedItems.map((item, index) => {
          const isLast = index === displayedItems.length - 1;
          const isFirst = index === 0;
          const isEllipsis = item.label === '...';

          return (
            <li key={`${item.path}-${index}`} className="flex items-center">
              {!isFirst && !isEllipsis && (
                <Separator className="mx-2 flex-shrink-0" />
              )}
              
              {isEllipsis ? (
                <span 
                  className="px-2 py-1 text-gray-400 cursor-default"
                  aria-disabled="true"
                  aria-hidden="true"
                >
                  {item.label}
                </span>
              ) : isLast || isFirst && item.path === '/' ? (
                // Current page or home (no link)
                <span
                  className={`flex items-center px-2 py-1 rounded-md transition-colors ${
                    isLast 
                      ? 'text-gray-900 dark:text-gray-100 font-medium bg-gray-100 dark:bg-gray-800' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon && (
                    <item.icon className="w-4 h-4 mr-1.5" aria-hidden="true" />
                  )}
                  {item.label}
                </span>
              ) : (
                // Navigation link
                <Link
                  to={item.path}
                  onClick={() => handleItemClick(item, index)}
                  onKeyDown={(e) => handleKeyDown(e, item, index)}
                  className="flex items-center px-2 py-1 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                  aria-label={`Navigate to ${item.label} ${isLast ? '(current page)' : ''}`}
                >
                  {item.icon && (
                    <item.icon className="w-4 h-4 mr-1.5" aria-hidden="true" />
                  )}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

/**
 * Breadcrumb item component for custom implementations
 */
export interface BreadcrumbItemComponentProps {
  item: BreadcrumbItem;
  index: number;
  isLast: boolean;
  separator?: React.ComponentType<any>;
  onItemClick?: (item: BreadcrumbItem) => void;
  className?: string;
}

export const BreadcrumbItemComponent: React.FC<BreadcrumbItemComponentProps> = ({
  item,
  index,
  isLast,
  separator: Separator = DefaultSeparator,
  onItemClick,
  className = ''
}) => {
  const isFirst = index === 0;

  const handleClick = () => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <li className={`breadcrumb-item ${className}`}>
      {!isFirst && <Separator className="mx-2" />}
      {isLast ? (
        <span
          className="current-page font-medium text-gray-900 dark:text-gray-100"
          aria-current="page"
        >
          {item.icon && <item.icon className="w-4 h-4 inline mr-1" aria-hidden="true" />}
          {item.label}
        </span>
      ) : (
        <Link
          to={item.path}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className="navigation-link text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          {item.icon && <item.icon className="w-4 h-4 inline mr-1" aria-hidden="true" />}
          {item.label}
        </Link>
      )}
    </li>
  );
};

/**
 * Hook for breadcrumb state management
 */
export const useBreadcrumbs = (items?: BreadcrumbItem[]) => {
  const location = useLocation();
  const [breadcrumbItems, setBreadcrumbItems] = React.useState<BreadcrumbItem[]>(items || []);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (items) {
      setBreadcrumbItems(items);
      return;
    }

    setIsLoading(true);
    
    // Simulate loading or fetch breadcrumb data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname, items]);

  const updateBreadcrumbs = React.useCallback((newItems: BreadcrumbItem[]) => {
    setBreadcrumbItems(newItems);
  }, []);

  const addBreadcrumb = React.useCallback((item: BreadcrumbItem) => {
    setBreadcrumbItems(prev => [...prev, item]);
  }, []);

  const removeBreadcrumb = React.useCallback((path: string) => {
    setBreadcrumbItems(prev => prev.filter(item => item.path !== path));
  }, []);

  return {
    breadcrumbItems,
    isLoading,
    updateBreadcrumbs,
    addBreadcrumb,
    removeBreadcrumb
  };
};

/**
 * Breadcrumbs with loading state
 */
export const BreadcrumbsWithLoader: React.FC<BreadcrumbsProps & { isLoading?: boolean }> = ({
  isLoading = false,
  ...props
}) => {
  if (isLoading) {
    return (
      <nav aria-label="Loading breadcrumbs" className="breadcrumbs breadcrumbs-loading">
        <ol className="flex items-center space-x-2">
          <li className="animate-pulse">
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </li>
          <li className="animate-pulse">
            <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded mx-2"></div>
          </li>
          <li className="animate-pulse">
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </li>
        </ol>
      </nav>
    );
  }

  return <Breadcrumbs {...props} />;
};

export default Breadcrumbs;
