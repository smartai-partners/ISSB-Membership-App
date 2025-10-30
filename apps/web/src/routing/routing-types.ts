/**
 * TypeScript types for routing infrastructure
 */

export type UserRole = 'admin' | 'board' | 'member' | 'volunteer' | 'prospective_member';

export type RouteAuthLevel = 'public' | 'authenticated' | 'role-based';

export interface RoutePermission {
  action: string;
  resource: string;
}

export interface RouteMetadata {
  title?: string;
  description?: string;
  icon?: string;
  breadcrumb?: string;
  requiresAuth?: boolean;
  allowedRoles?: UserRole[];
  requiredPermissions?: RoutePermission[];
  hideInNavigation?: boolean;
  exactMatch?: boolean;
  loadingComponent?: string;
  errorComponent?: string;
  layout?: 'auth' | 'admin' | 'board' | 'member' | 'public';
}

export interface RouteDefinition {
  path: string;
  component: () => Promise<any>;
  metadata?: RouteMetadata;
  children?: RouteDefinition[];
  parent?: string;
}

export interface RouteMatch {
  route: RouteDefinition;
  params: Record<string, string>;
  query: Record<string, string>;
  isActive: boolean;
  isExactMatch: boolean;
}

export interface NavigationItem {
  label: string;
  path: string;
  icon?: string;
  badge?: string | number;
  children?: NavigationItem[];
  visible?: boolean;
  disabled?: boolean;
}

export interface RouterConfig {
  basePath?: string;
  notFoundPath?: string;
  defaultRedirect?: string;
  enableLogging?: boolean;
  scrollToTop?: boolean;
  contextProviders?: Array<{
    provider: React.ComponentType<any>;
    props?: Record<string, any>;
  }>;
}

export interface RouteGuardContext {
  user: any | null;
  userRole?: UserRole;
  permissions: RoutePermission[];
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ComponentType | React.ReactNode;
  loadingFallback?: React.ComponentType | React.ReactNode;
  requireAll?: boolean; // If true, user must have all roles/permissions
}

export interface RoleRouteProps extends ProtectedRouteProps {
  allowedRoles: UserRole[];
  redirectTo?: string;
  permissionMessage?: string;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: string;
}

export interface RouteState {
  currentRoute: RouteMatch | null;
  breadcrumbs: BreadcrumbItem[];
  previousRoute: RouteMatch | null;
  isLoading: boolean;
  error: Error | null;
}

export interface NavigationState {
  items: NavigationItem[];
  collapsed: boolean;
  activeItem: string | null;
}

export const ROUTE_PERMISSIONS: Record<string, RoutePermission[]> = {
  admin: [
    { action: 'manage', resource: 'users' },
    { action: 'manage', resource: 'applications' },
    { action: 'manage', resource: 'events' },
    { action: 'manage', resource: 'system' },
  ],
  board: [
    { action: 'read', resource: 'reports' },
    { action: 'approve', resource: 'applications' },
    { action: 'manage', resource: 'events' },
  ],
  member: [
    { action: 'read', resource: 'profile' },
    { action: 'read', resource: 'events' },
    { action: 'register', resource: 'events' },
    { action: 'volunteer', resource: 'opportunities' },
  ],
  volunteer: [
    { action: 'read', resource: 'opportunities' },
    { action: 'apply', resource: 'volunteer_roles' },
  ],
} as const;

export const DEFAULT_ROUTES = {
  ROOT: '/',
  DASHBOARD: '/dashboard',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  NOT_FOUND: '/404',
  ADMIN: '/admin',
  EVENTS: '/events',
  APPLICATIONS: '/applications',
  MEMBERS: '/members',
  VOLUNTEER: '/volunteer',
} as const;

export type DefaultRoute = typeof DEFAULT_ROUTES[keyof typeof DEFAULT_ROUTES];