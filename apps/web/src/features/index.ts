// ============================================================================
// FEATURE MODULE INDEX
// ============================================================================

// ============================================================================
// AUTHENTICATION FEATURES
// ============================================================================

export * from '../features/auth/types';
export * from '../features/auth/validation-schemas';
export * from '../features/auth/hooks';

// Components
export * from '../features/auth/LoginForm';
export * from '../features/auth/RegisterForm';
export * from '../features/auth/ForgotPasswordForm';
export * from '../features/auth/ResetPasswordForm';
export * from '../features/auth/EmailVerificationForm';

// ============================================================================
// DASHBOARD FEATURES
// ============================================================================

export * from '../features/dashboard/types';

// Components
export * from '../features/dashboard/Dashboard';
export * from '../features/dashboard/DashboardStats';
export * from '../features/dashboard/RecentActivity';
export * from '../features/dashboard/QuickActions';
export * from '../features/dashboard/NotificationCenter';

// ============================================================================
// MEMBER PORTAL FEATURES
// ============================================================================

export * from '../features/member/types';

// Components
export * from '../features/member/MemberProfile';
export * from '../features/member/MembershipDetails';
export * from '../features/member/EventList';
export * from '../features/member/VolunteerOpportunities';
export * from '../features/member/ApplicationStatus';

// ============================================================================
// ADMIN PORTAL FEATURES
// ============================================================================

export * from '../features/admin/types';

// Components
export * from '../features/admin/AdminDashboard';
export * from '../features/admin/UserManagement';
export * from '../features/admin/MembershipManagement';
export * from '../features/admin/EventManagement';
export * from '../features/admin/ApplicationReview';
export * from '../features/admin/SystemSettings';

// ============================================================================
// EVENT FEATURES
// ============================================================================

export * from '../features/events/types';

// Components
export * from '../features/events/EventList';
export * from '../features/events/EventCard';
export * from '../features/events/EventDetails';
export * from '../features/events/EventRegistration';
export * from '../features/events/EventCreation';
export * from '../features/events/EventManagement';

// State Management
export * from '../features/events/EventStore';

// ============================================================================
// APPLICATION FEATURES
// ============================================================================

export * from '../features/applications/types';

// Components
export * from '../features/applications/ApplicationForm';
export * from '../features/applications/ApplicationReview';
export * from '../features/applications/ApplicationStatus';
export * from '../features/applications/DocumentUpload';
export * from '../features/applications/ReferenceForm';

// ============================================================================
// FEATURE HOOKS AND UTILITIES
// ============================================================================

/**
 * Common feature hooks for data fetching and state management
 */
export const useFeature = {
  auth: () => import('../features/auth/hooks').then(m => m.useAuth),
  dashboard: () => import('../features/dashboard/types').then(m => m),
  member: () => import('../features/member/types').then(m => m),
  admin: () => import('../features/admin/types').then(m => m),
  events: () => import('../features/events/EventStore').then(m => m.useEventStore),
  applications: () => import('../features/applications/types').then(m => m),
} as const;

/**
 * Feature configuration
 */
export const FEATURE_CONFIG = {
  // Authentication
  auth: {
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireEmailVerification: true,
    socialLoginEnabled: true,
  },
  
  // Dashboard
  dashboard: {
    autoRefreshInterval: 5 * 60 * 1000, // 5 minutes
    maxActivityItems: 50,
    notificationsLimit: 20,
  },
  
  // Events
  events: {
    maxRegistrationDays: 30,
    minEventDuration: 30, // minutes
    maxEventCapacity: 1000,
    registrationDeadlineBuffer: 24, // hours
  },
  
  // Applications
  applications: {
    maxDocuments: 10,
    maxDocumentSize: 10 * 1024 * 1024, // 10MB
    minReferences: 2,
    maxReferences: 5,
    autoSaveInterval: 30 * 1000, // 30 seconds
  },
  
  // Member Portal
  member: {
    profileCompletionThreshold: 80, // percentage
    maxVolunteerApplications: 10,
    eventRegistrationLimit: 5,
  },
  
  // Admin Portal
  admin: {
    maxBulkOperations: 100,
    systemHealthCheckInterval: 5 * 60 * 1000, // 5 minutes
    logRetentionDays: 90,
  },
} as const;

// ============================================================================
// ROUTE CONFIGURATIONS
// ============================================================================

/**
 * Feature-based route configurations
 */
export const ROUTE_CONFIGS = {
  public: [
    '/login',
    '/register', 
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/events',
    '/about',
    '/contact',
  ],
  
  protected: [
    '/dashboard',
    '/profile',
    '/membership',
    '/events',
    '/volunteer',
    '/applications',
  ],
  
  member: [
    '/member/*',
    '/volunteer/opportunities',
    '/events/my-events',
    '/applications/my-applications',
  ],
  
  board: [
    '/board/*',
    '/admin/users',
    '/admin/events',
    '/admin/applications/review',
  ],
  
  admin: [
    '/admin/*',
    '/system/*',
    '/settings/*',
  ],
} as const;

// ============================================================================
// PERMISSION MAPPINGS
// ============================================================================

/**
 * Feature-based permission mappings
 */
export const FEATURE_PERMISSIONS = {
  // Authentication features
  auth: {
    canLogin: true,
    canRegister: true,
    canResetPassword: true,
  },
  
  // Dashboard features
  dashboard: {
    canViewStats: ['admin', 'board', 'member'],
    canManageNotifications: ['admin', 'board'],
    canExportData: ['admin', 'board'],
  },
  
  // Member portal features
  member: {
    canEditProfile: ['admin', 'board', 'member'],
    canViewMembership: ['admin', 'board', 'member'],
    canManageMembership: ['admin', 'board'],
    canJoinEvents: ['admin', 'board', 'member'],
    canVolunteer: ['admin', 'board', 'member'],
    canSubmitApplications: ['admin', 'board', 'member'],
  },
  
  // Admin portal features
  admin: {
    canManageUsers: ['admin'],
    canManageMemberships: ['admin', 'board'],
    canManageEvents: ['admin', 'board'],
    canReviewApplications: ['admin', 'board'],
    canViewSystemSettings: ['admin'],
    canManageSystem: ['admin'],
  },
  
  // Event features
  events: {
    canCreateEvents: ['admin', 'board'],
    canEditEvents: ['admin', 'board'],
    canDeleteEvents: ['admin'],
    canViewAnalytics: ['admin', 'board'],
    canRegister: ['admin', 'board', 'member'],
  },
  
  // Application features
  applications: {
    canSubmitApplications: ['admin', 'board', 'member'],
    canReviewApplications: ['admin', 'board'],
    canApproveApplications: ['admin', 'board'],
    canManageApplications: ['admin'],
  },
} as const;