import { UserRole, MembershipTier } from '@issb/types';

/**
 * Navigation item interface for menu structure
 */
export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: React.ComponentType<any>;
  badge?: string | number;
  children?: NavigationItem[];
  roles?: UserRole[];
  tiers?: MembershipTier[];
  permissions?: string[];
  description?: string;
  isExternal?: boolean;
  isNew?: boolean;
  order?: number;
}

/**
 * Navigation configuration by user role
 */
export interface NavigationConfig {
  items: NavigationItem[];
  collapsed?: boolean;
  showLabels?: boolean;
}

/**
 * Navigation state interface
 */
export interface NavigationState {
  activePath: string;
  expandedItems: string[];
  collapsed: boolean;
  mobileMenuOpen: boolean;
}

/**
 * Breadcrumb item interface
 */
export interface BreadcrumbItem {
  label: string;
  path: string;
  isActive?: boolean;
  icon?: React.ComponentType<any>;
}

/**
 * Mobile navigation state
 */
export interface MobileNavigationState {
  isOpen: boolean;
  currentPath: string;
}

/**
 * Navigation helpers and utility functions
 */
export class NavigationHelpers {
  /**
   * Filter navigation items based on user permissions
   */
  static filterByPermissions(
    items: NavigationItem[],
    userRole: UserRole,
    userTier: MembershipTier,
    hasPermission: (permission: string) => boolean
  ): NavigationItem[] {
    return items
      .filter(item => {
        // Check if user has required role
        if (item.roles && !item.roles.includes(userRole)) {
          return false;
        }

        // Check if user has required tier
        if (item.tiers && !item.tiers.includes(userTier)) {
          return false;
        }

        // Check if user has required permissions
        if (item.permissions && !item.permissions.every(perm => hasPermission(perm))) {
          return false;
        }

        return true;
      })
      .map(item => ({
        ...item,
        children: item.children ? this.filterByPermissions(item.children, userRole, userTier, hasPermission) : []
      }))
      .filter(item => item.path || (item.children && item.children.length > 0));
  }

  /**
   * Sort navigation items by order, then by label
   */
  static sortItems(items: NavigationItem[]): NavigationItem[] {
    return [...items].sort((a, b) => {
      // Items with order come first
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;

      // Then sort by label
      return a.label.localeCompare(b.label);
    });
  }

  /**
   * Generate breadcrumb items from current path
   */
  static generateBreadcrumbs(
    path: string,
    navigationItems: NavigationItem[],
    homeLabel: string = 'Home'
  ): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [];
    const pathSegments = path.split('/').filter(Boolean);
    
    // Add home breadcrumb
    if (pathSegments.length > 0) {
      breadcrumbs.push({
        label: homeLabel,
        path: '/',
        isActive: path === '/'
      });
    }

    // Find matching navigation items
    let currentPath = '';
    let matchedItems: NavigationItem[] = navigationItems;

    for (const segment of pathSegments) {
      currentPath += `/${segment}`;
      
      // Try to find in current items
      let foundItem: NavigationItem | undefined;
      
      for (const item of matchedItems) {
        if (item.path === currentPath) {
          foundItem = item;
          break;
        }
        if (item.children) {
          const childMatch = item.children.find(child => child.path === currentPath);
          if (childMatch) {
            foundItem = childMatch;
            matchedItems = item.children;
            break;
          }
        }
      }

      if (foundItem) {
        breadcrumbs.push({
          label: foundItem.label,
          path: foundItem.path,
          isActive: currentPath === path,
          icon: foundItem.icon
        });
      } else {
        // If no match found, use the segment as label
        breadcrumbs.push({
          label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
          path: currentPath,
          isActive: currentPath === path
        });
      }
    }

    return breadcrumbs;
  }

  /**
   * Check if navigation item is active based on current path
   */
  static isItemActive(item: NavigationItem, currentPath: string): boolean {
    if (item.path === currentPath) {
      return true;
    }

    // Check if any child is active
    if (item.children) {
      return item.children.some(child => this.isItemActive(child, currentPath));
    }

    // Check if current path starts with item path (for parent items)
    return currentPath.startsWith(item.path + '/');
  }

  /**
   * Get navigation items for specific role
   */
  static getNavigationByRole(role: UserRole, userTier: MembershipTier): NavigationItem[] {
    const baseItems: NavigationItem[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        icon: () => <span className="nav-icon" aria-hidden="true">🏠</span>,
        roles: [UserRole.MEMBER, UserRole.BOARD, UserRole.ADMIN],
        order: 0
      },
      {
        id: 'profile',
        label: 'Profile',
        path: '/profile',
        icon: () => <span className="nav-icon" aria-hidden="true">👤</span>,
        roles: [UserRole.MEMBER, UserRole.BOARD, UserRole.ADMIN],
        order: 1
      },
      {
        id: 'events',
        label: 'Events',
        path: '/events',
        icon: () => <span className="nav-icon" aria-hidden="true">📅</span>,
        roles: [UserRole.MEMBER, UserRole.BOARD, UserRole.ADMIN],
        order: 2,
        children: [
          {
            id: 'events-list',
            label: 'All Events',
            path: '/events',
            roles: [UserRole.MEMBER, UserRole.BOARD, UserRole.ADMIN]
          },
          {
            id: 'events-register',
            label: 'My Registrations',
            path: '/events/registrations',
            roles: [UserRole.MEMBER, UserRole.BOARD, UserRole.ADMIN]
          }
        ]
      },
      {
        id: 'volunteer',
        label: 'Volunteer',
        path: '/volunteer',
        icon: () => <span className="nav-icon" aria-hidden="true">🤝</span>,
        roles: [UserRole.MEMBER, UserRole.BOARD, UserRole.ADMIN],
        tiers: [MembershipTier.BOARD, MembershipTier.ADMIN],
        order: 3,
        children: [
          {
            id: 'volunteer-opportunities',
            label: 'Opportunities',
            path: '/volunteer/opportunities',
            roles: [UserRole.MEMBER, UserRole.BOARD, UserRole.ADMIN],
            tiers: [MembershipTier.BOARD, MembershipTier.ADMIN]
          },
          {
            id: 'volunteer-applications',
            label: 'My Applications',
            path: '/volunteer/applications',
            roles: [UserRole.MEMBER, UserRole.BOARD, UserRole.ADMIN],
            tiers: [MembershipTier.BOARD, MembershipTier.ADMIN]
          }
        ]
      },
      {
        id: 'members',
        label: 'Members',
        path: '/members',
        icon: () => <span className="nav-icon" aria-hidden="true">👥</span>,
        roles: [UserRole.BOARD, UserRole.ADMIN],
        order: 4,
        children: [
          {
            id: 'members-list',
            label: 'All Members',
            path: '/members',
            roles: [UserRole.BOARD, UserRole.ADMIN]
          },
          {
            id: 'members-directory',
            label: 'Directory',
            path: '/members/directory',
            roles: [UserRole.BOARD, UserRole.ADMIN]
          }
        ]
      },
      {
        id: 'applications',
        label: 'Applications',
        path: '/applications',
        icon: () => <span className="nav-icon" aria-hidden="true">📋</span>,
        roles: [UserRole.BOARD, UserRole.ADMIN],
        order: 5,
        children: [
          {
            id: 'applications-pending',
            label: 'Pending',
            path: '/applications/pending',
            roles: [UserRole.BOARD, UserRole.ADMIN]
          },
          {
            id: 'applications-all',
            label: 'All Applications',
            path: '/applications',
            roles: [UserRole.BOARD, UserRole.ADMIN]
          }
        ]
      },
      {
        id: 'admin',
        label: 'Administration',
        path: '/admin',
        icon: () => <span className="nav-icon" aria-hidden="true">⚙️</span>,
        roles: [UserRole.ADMIN],
        order: 6,
        children: [
          {
            id: 'admin-users',
            label: 'User Management',
            path: '/admin/users',
            roles: [UserRole.ADMIN]
          },
          {
            id: 'admin-settings',
            label: 'Settings',
            path: '/admin/settings',
            roles: [UserRole.ADMIN]
          },
          {
            id: 'admin-reports',
            label: 'Reports',
            path: '/admin/reports',
            roles: [UserRole.ADMIN]
          },
          {
            id: 'admin-audit',
            label: 'Audit Logs',
            path: '/admin/audit',
            roles: [UserRole.ADMIN]
          }
        ]
      }
    ];

    return this.sortItems(baseItems);
  }

  /**
   * Generate unique IDs for navigation elements
   */
  static generateId(prefix: string = 'nav'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get accessible label for navigation item
   */
  static getAccessibleLabel(item: NavigationItem): string {
    let label = item.label;
    
    if (item.badge) {
      label += ` (${item.badge} new)`;
    }
    
    if (item.description) {
      label += `: ${item.description}`;
    }
    
    return label;
  }

  /**
   * Check if navigation item should be highlighted as new
   */
  static isNewItem(item: NavigationItem): boolean {
    // Check if item has isNew flag
    if (item.isNew) return true;
    
    // Check if added within last 7 days (this would typically come from a backend)
    // For now, just check the isNew flag
    return false;
  }

  /**
   * Get navigation item URL based on type
   */
  static getItemUrl(item: NavigationItem): string {
    if (item.isExternal) {
      return item.path;
    }
    
    // Ensure path starts with / for internal routes
    return item.path.startsWith('/') ? item.path : `/${item.path}`;
  }

  /**
   * Check if user can access item based on permissions
   */
  static canAccessItem(
    item: NavigationItem,
    userRole: UserRole,
    userTier: MembershipTier,
    hasPermission: (permission: string) => boolean
  ): boolean {
    // Check role permissions
    if (item.roles && !item.roles.includes(userRole)) {
      return false;
    }
    
    // Check tier permissions
    if (item.tiers && !item.tiers.includes(userTier)) {
      return false;
    }
    
    // Check specific permissions
    if (item.permissions && !item.permissions.every(perm => hasPermission(perm))) {
      return false;
    }
    
    return true;
  }
}

/**
 * Hook for managing navigation state
 */
export const useNavigationState = (initialState?: Partial<NavigationState>) => {
  const [state, setState] = React.useState<NavigationState>({
    activePath: '/',
    expandedItems: [],
    collapsed: false,
    mobileMenuOpen: false,
    ...initialState
  });

  const toggleExpanded = React.useCallback((itemId: string) => {
    setState(prev => ({
      ...prev,
      expandedItems: prev.expandedItems.includes(itemId)
        ? prev.expandedItems.filter(id => id !== itemId)
        : [...prev.expandedItems, itemId]
    }));
  }, []);

  const setActivePath = React.useCallback((path: string) => {
    setState(prev => ({ ...prev, activePath: path }));
  }, []);

  const toggleCollapsed = React.useCallback(() => {
    setState(prev => ({ ...prev, collapsed: !prev.collapsed }));
  }, []);

  const toggleMobileMenu = React.useCallback(() => {
    setState(prev => ({ ...prev, mobileMenuOpen: !prev.mobileMenuOpen }));
  }, []);

  const closeMobileMenu = React.useCallback(() => {
    setState(prev => ({ ...prev, mobileMenuOpen: false }));
  }, []);

  return {
    ...state,
    toggleExpanded,
    setActivePath,
    toggleCollapsed,
    toggleMobileMenu,
    closeMobileMenu
  };
};

/**
 * Custom hook for responsive navigation
 */
export const useResponsiveNavigation = () => {
  const [isMobile, setIsMobile] = React.useState(false);
  const [isTablet, setIsTablet] = React.useState(false);

  React.useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768); // md breakpoint
      setIsTablet(width >= 768 && width < 1024); // md to lg
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet
  };
};

// Import React for hooks
import React from 'react';
