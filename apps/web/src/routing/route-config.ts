/**
 * Route configuration with metadata definitions
 */

import { RouteDefinition, RouteMetadata, DEFAULT_ROUTES, UserRole } from './routing-types';

// Lazy load components for better performance
const lazyLoad = (component: string) => () => import(`../features/${component}`);

export const routeConfig: RouteDefinition[] = [
  // Public routes
  {
    path: DEFAULT_ROUTES.ROOT,
    component: lazyLoad('dashboard/Dashboard'),
    metadata: {
      title: 'Dashboard',
      description: 'Main dashboard page',
      icon: 'dashboard',
      breadcrumb: 'Home',
      layout: 'public',
      requiresAuth: true,
    },
  },
  {
    path: '/welcome',
    component: lazyLoad('dashboard/Welcome'),
    metadata: {
      title: 'Welcome',
      description: 'Welcome page for new members',
      icon: 'welcome',
      breadcrumb: 'Welcome',
      layout: 'public',
      requiresAuth: false,
    },
  },

  // Authentication routes
  {
    path: DEFAULT_ROUTES.LOGIN,
    component: lazyLoad('auth/components/LoginForm'),
    metadata: {
      title: 'Sign In',
      description: 'Sign in to your account',
      breadcrumb: 'Sign In',
      layout: 'auth',
      requiresAuth: false,
      hideInNavigation: true,
    },
  },
  {
    path: DEFAULT_ROUTES.REGISTER,
    component: lazyLoad('auth/components/RegistrationForm'),
    metadata: {
      title: 'Register',
      description: 'Create a new account',
      breadcrumb: 'Register',
      layout: 'auth',
      requiresAuth: false,
      hideInNavigation: true,
    },
  },
  {
    path: '/forgot-password',
    component: lazyLoad('auth/components/ForgotPasswordForm'),
    metadata: {
      title: 'Forgot Password',
      description: 'Reset your password',
      breadcrumb: 'Forgot Password',
      layout: 'auth',
      requiresAuth: false,
      hideInNavigation: true,
    },
  },
  {
    path: '/reset-password',
    component: lazyLoad('auth/components/ResetPasswordForm'),
    metadata: {
      title: 'Reset Password',
      description: 'Set your new password',
      breadcrumb: 'Reset Password',
      layout: 'auth',
      requiresAuth: false,
      hideInNavigation: true,
    },
  },

  // Member routes
  {
    path: DEFAULT_ROUTES.DASHBOARD,
    component: lazyLoad('dashboard/Dashboard'),
    metadata: {
      title: 'My Dashboard',
      description: 'Your personal dashboard',
      icon: 'dashboard',
      breadcrumb: 'Dashboard',
      layout: 'member',
      requiresAuth: true,
    },
  },
  {
    path: DEFAULT_ROUTES.PROFILE,
    component: lazyLoad('member/MemberProfile'),
    metadata: {
      title: 'My Profile',
      description: 'Manage your profile information',
      icon: 'user',
      breadcrumb: 'Profile',
      layout: 'member',
      requiresAuth: true,
      allowedRoles: ['member', 'volunteer', 'board', 'admin'] as UserRole[],
    },
  },
  {
    path: '/membership',
    component: lazyLoad('member/MembershipDetails'),
    metadata: {
      title: 'Membership Details',
      description: 'View your membership information',
      icon: 'membership',
      breadcrumb: 'Membership',
      layout: 'member',
      requiresAuth: true,
      allowedRoles: ['member', 'volunteer', 'board', 'admin'] as UserRole[],
    },
  },
  {
    path: '/membership/status',
    component: lazyLoad('member/ApplicationStatus'),
    metadata: {
      title: 'Application Status',
      description: 'Check your application status',
      icon: 'application-status',
      breadcrumb: 'Application Status',
      layout: 'member',
      requiresAuth: true,
      hideInNavigation: false,
    },
  },
  {
    path: '/events',
    component: lazyLoad('events/EventList'),
    metadata: {
      title: 'Events',
      description: 'Browse and register for events',
      icon: 'calendar',
      breadcrumb: 'Events',
      layout: 'member',
      requiresAuth: true,
    },
  },
  {
    path: '/events/:id',
    component: lazyLoad('events/EventDetails'),
    metadata: {
      title: 'Event Details',
      description: 'View event information',
      breadcrumb: 'Event Details',
      layout: 'member',
      requiresAuth: true,
      exactMatch: false,
    },
  },
  {
    path: '/events/create',
    component: lazyLoad('events/EventCreation'),
    metadata: {
      title: 'Create Event',
      description: 'Create a new event',
      icon: 'plus',
      breadcrumb: 'Create Event',
      layout: 'member',
      requiresAuth: true,
      allowedRoles: ['member', 'volunteer', 'board', 'admin'] as UserRole[],
    },
  },
  {
    path: '/volunteer',
    component: lazyLoad('member/VolunteerOpportunities'),
    metadata: {
      title: 'Volunteer Opportunities',
      description: 'Find volunteer opportunities',
      icon: 'volunteer',
      breadcrumb: 'Volunteer',
      layout: 'member',
      requiresAuth: true,
    },
  },

  // Application routes
  {
    path: DEFAULT_ROUTES.APPLICATIONS,
    component: lazyLoad('applications/ApplicationForm'),
    metadata: {
      title: 'Membership Application',
      description: 'Apply for membership',
      icon: 'application',
      breadcrumb: 'Apply',
      layout: 'public',
      requiresAuth: true,
      hideInNavigation: true,
    },
  },
  {
    path: '/applications/review',
    component: lazyLoad('applications/ApplicationReview'),
    metadata: {
      title: 'Review Applications',
      description: 'Review pending applications',
      icon: 'review',
      breadcrumb: 'Review Applications',
      layout: 'board',
      requiresAuth: true,
      allowedRoles: ['board', 'admin'] as UserRole[],
    },
  },
  {
    path: '/applications/:id',
    component: lazyLoad('applications/ApplicationStatus'),
    metadata: {
      title: 'Application Details',
      description: 'View application details',
      breadcrumb: 'Application Details',
      layout: 'board',
      requiresAuth: true,
      exactMatch: false,
      allowedRoles: ['board', 'admin'] as UserRole[],
    },
  },

  // Member management routes (Board/Admin)
  {
    path: DEFAULT_ROUTES.MEMBERS,
    component: lazyLoad('member/MemberList'),
    metadata: {
      title: 'Member Directory',
      description: 'View all members',
      icon: 'users',
      breadcrumb: 'Members',
      layout: 'board',
      requiresAuth: true,
      allowedRoles: ['board', 'admin'] as UserRole[],
    },
  },

  // Admin routes
  {
    path: DEFAULT_ROUTES.ADMIN,
    component: lazyLoad('admin/AdminDashboard'),
    metadata: {
      title: 'Admin Dashboard',
      description: 'Administrative dashboard',
      icon: 'admin',
      breadcrumb: 'Admin',
      layout: 'admin',
      requiresAuth: true,
      allowedRoles: ['admin'] as UserRole[],
    },
    children: [
      {
        path: 'users',
        component: lazyLoad('admin/UserManagement'),
        metadata: {
          title: 'User Management',
          description: 'Manage system users',
          icon: 'users',
          breadcrumb: 'Users',
          layout: 'admin',
          requiresAuth: true,
          allowedRoles: ['admin'] as UserRole[],
        },
      },
      {
        path: 'applications',
        component: lazyLoad('admin/ApplicationReview'),
        metadata: {
          title: 'Application Management',
          description: 'Review and manage applications',
          icon: 'application',
          breadcrumb: 'Applications',
          layout: 'admin',
          requiresAuth: true,
          allowedRoles: ['admin'] as UserRole[],
        },
      },
      {
        path: 'events',
        component: lazyLoad('admin/EventManagement'),
        metadata: {
          title: 'Event Management',
          description: 'Manage all events',
          icon: 'calendar',
          breadcrumb: 'Events',
          layout: 'admin',
          requiresAuth: true,
          allowedRoles: ['admin'] as UserRole[],
        },
      },
      {
        path: 'membership',
        component: lazyLoad('admin/MembershipManagement'),
        metadata: {
          title: 'Membership Management',
          description: 'Manage member relationships',
          icon: 'membership',
          breadcrumb: 'Membership',
          layout: 'admin',
          requiresAuth: true,
          allowedRoles: ['admin'] as UserRole[],
        },
      },
      {
        path: 'settings',
        component: lazyLoad('admin/SystemSettings'),
        metadata: {
          title: 'System Settings',
          description: 'Configure system settings',
          icon: 'settings',
          breadcrumb: 'Settings',
          layout: 'admin',
          requiresAuth: true,
          allowedRoles: ['admin'] as UserRole[],
        },
      },
    ],
  },

  // Board routes
  {
    path: '/board',
    component: lazyLoad('board/BoardDashboard'),
    metadata: {
      title: 'Board Dashboard',
      description: 'Board member dashboard',
      icon: 'board',
      breadcrumb: 'Board',
      layout: 'board',
      requiresAuth: true,
      allowedRoles: ['board', 'admin'] as UserRole[],
    },
    children: [
      {
        path: 'reports',
        component: lazyLoad('board/Reports'),
        metadata: {
          title: 'Reports',
          description: 'View organizational reports',
          icon: 'reports',
          breadcrumb: 'Reports',
          layout: 'board',
          requiresAuth: true,
          allowedRoles: ['board', 'admin'] as UserRole[],
        },
      },
      {
        path: 'approvals',
        component: lazyLoad('board/Approvals'),
        metadata: {
          title: 'Pending Approvals',
          description: 'Review items requiring approval',
          icon: 'approval',
          breadcrumb: 'Approvals',
          layout: 'board',
          requiresAuth: true,
          allowedRoles: ['board', 'admin'] as UserRole[],
        },
      },
    ],
  },

  // Utility routes
  {
    path: '/notifications',
    component: lazyLoad('dashboard/NotificationCenter'),
    metadata: {
      title: 'Notifications',
      description: 'View your notifications',
      icon: 'bell',
      breadcrumb: 'Notifications',
      layout: 'member',
      requiresAuth: true,
      hideInNavigation: false,
    },
  },
  {
    path: DEFAULT_ROUTES.NOT_FOUND,
    component: () => import('../components/ui/NotFound'),
    metadata: {
      title: 'Page Not Found',
      description: 'The requested page could not be found',
      breadcrumb: '404',
      layout: 'public',
      requiresAuth: false,
      hideInNavigation: true,
    },
  },
];

// Export route metadata for easy access
export const getRouteMetadata = (path: string): RouteMetadata | undefined => {
  const findRouteMetadata = (routes: RouteDefinition[]): RouteMetadata | undefined => {
    for (const route of routes) {
      if (route.path === path) {
        return route.metadata;
      }
      if (route.children) {
        const childMetadata = findRouteMetadata(route.children);
        if (childMetadata) return childMetadata;
      }
    }
    return undefined;
  };
  
  return findRouteMetadata(routeConfig);
};

// Export navigation items
export const getNavigationItems = (userRole?: UserRole) => {
  const getVisibleRoutes = (routes: RouteDefinition[]): RouteDefinition[] => {
    return routes
      .filter(route => {
        if (route.metadata?.hideInNavigation) return false;
        if (route.metadata?.allowedRoles && userRole) {
          return route.metadata.allowedRoles.includes(userRole);
        }
        return true;
      })
      .map(route => ({
        ...route,
        children: route.children ? getVisibleRoutes(route.children) : undefined,
      }));
  };

  return getVisibleRoutes(routeConfig);
};

// Export route by path helper
export const getRouteByPath = (path: string): RouteDefinition | undefined => {
  const findRoute = (routes: RouteDefinition[]): RouteDefinition | undefined => {
    for (const route of routes) {
      if (route.path === path) {
        return route;
      }
      if (route.children) {
        const childRoute = findRoute(route.children);
        if (childRoute) return childRoute;
      }
    }
    return undefined;
  };
  
  return findRoute(routeConfig);
};