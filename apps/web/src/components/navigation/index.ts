// ============================================================================
// NAVIGATION COMPONENTS EXPORTS
// ============================================================================

// Main navigation components
export { Navigation, default as NavigationComponent } from './Navigation';
export { ProtectedNavigation, RoleBasedNavigation, TierBasedNavigation, PermissionBasedNavigation } from './ProtectedNavigation';
export { RoleBasedMenu, AdminMenu, BoardMenu, MemberMenu, MobileMenu } from './RoleBasedMenu';
export { Breadcrumbs, BreadcrumbsWithLoader } from './Breadcrumbs';

// Utility functions and helpers
export { 
  NavigationHelpers, 
  NavigationItem, 
  NavigationConfig, 
  NavigationState, 
  BreadcrumbItem,
  MobileNavigationState,
  useNavigationState,
  useResponsiveNavigation 
} from './NavigationHelpers';

// Component interfaces and props
export type { 
  NavigationProps,
  NavigationItem,
  NavigationConfig,
  NavigationState,
  BreadcrumbItem 
} from './NavigationHelpers';

export type { 
  BreadcrumbsProps,
  BreadcrumbItemComponentProps 
} from './Breadcrumbs';

export type { 
  RoleBasedMenuProps,
  MenuItemProps 
} from './RoleBasedMenu';

export type { 
  ProtectedNavigationConfig,
  ProtectedNavigationProps,
  AccessControlResult 
} from './ProtectedNavigation';

// Hook exports
export { useBreadcrumbs } from './Breadcrumbs';

// Re-export utility functions for convenience
export { 
  NavigationHelpers as NavHelpers,
  useNavigationState as useNavState,
  useResponsiveNavigation as useResponsiveNav
} from './NavigationHelpers';
