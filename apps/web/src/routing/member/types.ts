// Member Routes Type Definitions

export interface RouteProtectionConfig {
  allowedRoles?: string[];
  allowedTiers?: string[];
  requiresActiveMembership?: boolean;
  requiresVolunteerApproval?: boolean;
  ownApplicationsOnly?: boolean;
  minimumTier?: string;
  minimumRole?: string;
}

export interface NavigationGuardConfig {
  redirectTo?: string;
  customMessage?: string;
  fallback?: React.ReactNode;
  action?: string;
}

export interface FeatureAccessConfig {
  requiresActiveMembership?: boolean;
  requiresVolunteerApproval?: boolean;
  requiredRoles?: string[];
  requiredTiers?: string[];
  customMessage?: string;
}

// Role definitions
export type UserRole = 'member' | 'board' | 'admin';

// Membership tier definitions
export type MembershipTier = 'bronze' | 'silver' | 'gold' | 'platinum';

// Member status definitions
export type MemberStatus = 'active' | 'inactive' | 'suspended' | 'pending';

// Volunteer status definitions
export type VolunteerStatus = 'pending' | 'approved' | 'rejected' | 'inactive';

// Application status definitions
export type ApplicationStatus = 'draft' | 'submitted' | 'under-review' | 'approved' | 'rejected' | 'withdrawn';

// Event status definitions
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'postponed';

// Route configuration interface
export interface MemberRouteConfig {
  path: string;
  component: React.ComponentType;
  protection: RouteProtectionConfig;
  navigation?: {
    title: string;
    icon?: string;
    badge?: string;
    description?: string;
  };
  children?: MemberRouteConfig[];
}

// Navigation item interface
export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  badge?: string;
  description?: string;
  tierAccess?: MembershipTier[];
  roleAccess?: UserRole[];
  children?: NavigationItem[];
}

// Guard configuration for different access levels
export interface GuardLevelConfig {
  name: string;
  description: string;
  routes: string[];
  requiredRoles: UserRole[];
  requiredTiers?: MembershipTier[];
  membershipRequired?: boolean;
  volunteerApprovalRequired?: boolean;
}

// Access level definitions
export const ACCESS_LEVELS: Record<string, GuardLevelConfig> = {
  BASIC_MEMBER: {
    name: 'Basic Member',
    description: 'Standard member access to personal features',
    routes: ['dashboard', 'profile/*', 'membership/*'],
    requiredRoles: ['member', 'board', 'admin']
  },
  BOARD_MEMBER: {
    name: 'Board Member',
    description: 'Enhanced access with management capabilities',
    routes: ['dashboard/*', 'profile/*', 'membership/*', 'events/*', 'applications/*'],
    requiredRoles: ['board', 'admin']
  },
  ADMIN: {
    name: 'Administrator',
    description: 'Full system access and management',
    routes: ['*'],
    requiredRoles: ['admin']
  },
  PREMIUM_TIER: {
    name: 'Premium Tier',
    description: 'Enhanced features for silver+ members',
    routes: ['directory', 'forums', 'discounts'],
    requiredRoles: ['member', 'board', 'admin'],
    requiredTiers: ['silver', 'gold', 'platinum']
  },
  GOLD_TIER: {
    name: 'Gold Tier',
    description: 'Premium features for gold+ members',
    routes: ['networking'],
    requiredRoles: ['member', 'board', 'admin'],
    requiredTiers: ['gold', 'platinum']
  },
  VOLUNTEER_APPROVED: {
    name: 'Volunteer Approved',
    description: 'Access to volunteer features',
    routes: ['volunteering/*'],
    requiredRoles: ['member', 'board', 'admin'],
    membershipRequired: true,
    volunteerApprovalRequired: true
  }
};

// Member route categories
export const ROUTE_CATEGORIES = {
  DASHBOARD: 'dashboard',
  PROFILE: 'profile',
  MEMBERSHIP: 'membership',
  EVENTS: 'events',
  VOLUNTEERING: 'volunteering',
  APPLICATIONS: 'applications',
  RESOURCES: 'resources',
  SUPPORT: 'support'
} as const;

export type RouteCategory = typeof ROUTE_CATEGORIES[keyof typeof ROUTE_CATEGORIES];

// Error message templates
export const ERROR_MESSAGES = {
  AUTHENTICATION_REQUIRED: 'Please log in to access this feature.',
  INSUFFICIENT_ROLE: 'You do not have the required role to access this feature.',
  INSUFFICIENT_TIER: 'Your membership tier does not include access to this feature. Please upgrade your membership.',
  ACTIVE_MEMBERSHIP_REQUIRED: 'Active membership required to access this feature. Please renew your membership.',
  VOLUNTEER_APPROVAL_REQUIRED: 'Volunteer approval required to access this feature. Please complete the volunteer application.',
  ACCOUNT_SUSPENDED: 'Your account is suspended. Please contact support for assistance.',
  OWNERSHIP_REQUIRED: 'You can only access your own resources.',
  RESOURCE_UNAVAILABLE: 'This resource is currently unavailable.',
  REGISTRATION_CLOSED: 'Registration for this event has closed.',
  FEATURE_UNAVAILABLE: 'This feature is currently unavailable.'
} as const;

// Success message templates
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Your profile has been updated successfully.',
  MEMBERSHIP_RENEWED: 'Your membership has been renewed successfully.',
  EVENT_REGISTERED: 'You have been registered for this event.',
  VOLUNTEER_APPLICATION_SUBMITTED: 'Your volunteer application has been submitted successfully.',
  APPLICATION_SUBMITTED: 'Your application has been submitted for review.'
} as const;

// Navigation configuration
export interface MemberNavigationConfig {
  sections: {
    [key: string]: {
      title: string;
      items: NavigationItem[];
    };
  };
  roleBasedVisibility: {
    [key in UserRole]?: {
      [key in RouteCategory]?: boolean;
    };
  };
  tierBasedVisibility: {
    [key in MembershipTier]?: {
      [key in RouteCategory]?: boolean;
    };
  };
}

// Default navigation configuration
export const DEFAULT_NAVIGATION_CONFIG: MemberNavigationConfig = {
  sections: {
    main: {
      title: 'Main',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          path: '/member/dashboard',
          icon: 'home'
        },
        {
          id: 'profile',
          label: 'Profile',
          path: '/member/profile',
          icon: 'user'
        },
        {
          id: 'membership',
          label: 'Membership',
          path: '/member/membership',
          icon: 'shield'
        }
      ]
    },
    activities: {
      title: 'Activities',
      items: [
        {
          id: 'events',
          label: 'Events',
          path: '/member/events',
          icon: 'calendar'
        },
        {
          id: 'volunteering',
          label: 'Volunteering',
          path: '/member/volunteering',
          icon: 'heart',
          tierAccess: ['bronze', 'silver', 'gold', 'platinum']
        },
        {
          id: 'applications',
          label: 'Applications',
          path: '/member/applications',
          icon: 'file-text'
        }
      ]
    },
    resources: {
      title: 'Resources',
      items: [
        {
          id: 'directory',
          label: 'Directory',
          path: '/member/directory',
          icon: 'users',
          tierAccess: ['silver', 'gold', 'platinum']
        },
        {
          id: 'resources',
          label: 'Resources',
          path: '/member/resources',
          icon: 'book'
        },
        {
          id: 'forums',
          label: 'Forums',
          path: '/member/forums',
          icon: 'message-circle',
          tierAccess: ['silver', 'gold', 'platinum']
        },
        {
          id: 'discounts',
          label: 'Discounts',
          path: '/member/discounts',
          icon: 'percent',
          tierAccess: ['silver', 'gold', 'platinum']
        },
        {
          id: 'networking',
          label: 'Networking',
          path: '/member/networking',
          icon: 'network',
          tierAccess: ['gold', 'platinum']
        }
      ]
    },
    support: {
      title: 'Support',
      items: [
        {
          id: 'support',
          label: 'Support',
          path: '/member/support',
          icon: 'help-circle'
        },
        {
          id: 'announcements',
          label: 'Announcements',
          path: '/member/announcements',
          icon: 'bell'
        }
      ]
    }
  },
  roleBasedVisibility: {
    member: {
      dashboard: true,
      profile: true,
      membership: true,
      events: true,
      volunteering: true,
      applications: true,
      resources: true,
      support: true
    },
    board: {
      dashboard: true,
      profile: true,
      membership: true,
      events: true,
      volunteering: true,
      applications: true,
      resources: true,
      support: true
    },
    admin: {
      dashboard: true,
      profile: true,
      membership: true,
      events: true,
      volunteering: true,
      applications: true,
      resources: true,
      support: true
    }
  },
  tierBasedVisibility: {
    bronze: {
      volunteering: true,
      resources: true,
      support: true
    },
    silver: {
      directory: true,
      forums: true,
      discounts: true,
      volunteering: true,
      resources: true,
      support: true
    },
    gold: {
      directory: true,
      forums: true,
      discounts: true,
      networking: true,
      volunteering: true,
      resources: true,
      support: true
    },
    platinum: {
      directory: true,
      forums: true,
      discounts: true,
      networking: true,
      volunteering: true,
      resources: true,
      support: true
    }
  }
};

// Utility types for route generation
export interface RouteDefinition {
  path: string;
  element: React.ComponentType;
  children?: RouteDefinition[];
  guard?: React.ComponentType<any>;
  protection?: RouteProtectionConfig;
}

// Utility function for creating protected routes
export function createProtectedRoute(
  component: React.ComponentType,
  protection: RouteProtectionConfig,
  guard?: React.ComponentType<any>
): RouteDefinition {
  return {
    path: '',
    element: component,
    guard,
    protection
  };
}

// Type for error handling in routes
export interface RouteError {
  code: string;
  message: string;
  details?: string;
  action?: string;
}

// Type for route metadata
export interface RouteMetadata {
  title: string;
  description: string;
  icon?: string;
  category: RouteCategory;
  accessLevel: keyof typeof ACCESS_LEVELS;
  breadcrumbs?: {
    label: string;
    path: string;
  }[];
}

// Export commonly used types
export type {
  GuardProps,
  RoleBasedGuardProps,
  TierBasedGuardProps,
  MembershipStatusGuardProps
} from './navigation-guards';