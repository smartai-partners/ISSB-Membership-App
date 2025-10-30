// ============================================================================
// API CONFIGURATION AND ENDPOINTS
// ============================================================================

export interface APIConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  headers: Record<string, string>;
}

// Environment configuration
const getEnvConfig = (): Partial<APIConfig> => {
  const env = import.meta.env.MODE || 'development';
  
  switch (env) {
    case 'production':
      return {
        timeout: 10000,
        retries: 3,
        retryDelay: 1000,
      };
    case 'staging':
      return {
        timeout: 15000,
        retries: 2,
        retryDelay: 800,
      };
    case 'development':
    default:
      return {
        timeout: 30000,
        retries: 1,
        retryDelay: 500,
      };
  }
};

// Base API configuration
export const API_CONFIG: APIConfig = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: getEnvConfig().timeout || 30000,
  retries: getEnvConfig().retries || 1,
  retryDelay: getEnvConfig().retryDelay || 500,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// API Version
export const API_VERSION = 'v1';

// ============================================================================
// ENDPOINT DEFINITIONS
// ============================================================================

export const API_ENDPOINTS = {
  // Authentication endpoints
  auth: {
    login: `${API_VERSION}/auth/login`,
    register: `${API_VERSION}/auth/register`,
    logout: `${API_VERSION}/auth/logout`,
    refresh: `${API_VERSION}/auth/refresh`,
    me: `${API_VERSION}/auth/me`,
    profile: `${API_VERSION}/auth/profile`,
    changePassword: `${API_VERSION}/auth/change-password`,
    forgotPassword: `${API_VERSION}/auth/forgot-password`,
    resetPassword: `${API_VERSION}/auth/reset-password`,
    verifyEmail: `${API_VERSION}/auth/verify-email`,
    resendVerification: `${API_VERSION}/auth/resend-verification`,
  },

  // User management endpoints
  users: {
    base: `${API_VERSION}/users`,
    profile: (id: string) => `${API_VERSION}/users/${id}/profile`,
    update: (id: string) => `${API_VERSION}/users/${id}`,
    delete: (id: string) => `${API_VERSION}/users/${id}`,
    list: `${API_VERSION}/users/list`,
    search: `${API_VERSION}/users/search`,
    activate: (id: string) => `${API_VERSION}/users/${id}/activate`,
    deactivate: (id: string) => `${API_VERSION}/users/${id}/deactivate`,
    suspend: (id: string) => `${API_VERSION}/users/${id}/suspend`,
  },

  // Membership endpoints
  membership: {
    base: `${API_VERSION}/membership`,
    applications: `${API_VERSION}/membership/applications`,
    application: (id: string) => `${API_VERSION}/membership/applications/${id}`,
    applicationStatus: (id: string) => `${API_VERSION}/membership/applications/${id}/status`,
    myMembership: `${API_VERSION}/membership/me`,
    tiers: `${API_VERSION}/membership/tiers`,
    benefits: `${API_VERSION}/membership/benefits`,
    upgrade: `${API_VERSION}/membership/upgrade`,
    renew: `${API_VERSION}/membership/renew`,
    cancel: `${API_VERSION}/membership/cancel`,
  },

  // Event endpoints
  events: {
    base: `${API_VERSION}/events`,
    list: `${API_VERSION}/events/list`,
    upcoming: `${API_VERSION}/events/upcoming`,
    past: `${API_VERSION}/events/past`,
    register: (id: string) => `${API_VERSION}/events/${id}/register`,
    unregister: (id: string) => `${API_VERSION}/events/${id}/unregister`,
    checkIn: (id: string) => `${API_VERSION}/events/${id}/check-in`,
    checkOut: (id: string) => `${API_VERSION}/events/${id}/check-out`,
    myRegistrations: `${API_VERSION}/events/my-registrations`,
    search: `${API_VERSION}/events/search`,
  },

  // Volunteer opportunity endpoints
  volunteer: {
    base: `${API_VERSION}/volunteer`,
    opportunities: `${API_VERSION}/volunteer/opportunities`,
    opportunity: (id: string) => `${API_VERSION}/volunteer/opportunities/${id}`,
    apply: (id: string) => `${API_VERSION}/volunteer/opportunities/${id}/apply`,
    myApplications: `${API_VERSION}/volunteer/applications`,
    application: (id: string) => `${API_VERSION}/volunteer/applications/${id}`,
  },

  // Communication endpoints
  communication: {
    messages: {
      base: `${API_VERSION}/messages`,
      send: `${API_VERSION}/messages/send`,
      inbox: `${API_VERSION}/messages/inbox`,
      sent: `${API_VERSION}/messages/sent`,
      draft: (id: string) => `${API_VERSION}/messages/draft/${id}`,
      markAsRead: (id: string) => `${API_VERSION}/messages/${id}/read`,
      markAsUnread: (id: string) => `${API_VERSION}/messages/${id}/unread`,
      delete: (id: string) => `${API_VERSION}/messages/${id}`,
      thread: (id: string) => `${API_VERSION}/messages/thread/${id}`,
    },
    notifications: {
      base: `${API_VERSION}/notifications`,
      unread: `${API_VERSION}/notifications/unread`,
      markAsRead: (id: string) => `${API_VERSION}/notifications/${id}/read`,
      markAllAsRead: `${API_VERSION}/notifications/read-all`,
      delete: (id: string) => `${API_VERSION}/notifications/${id}`,
      settings: `${API_VERSION}/notifications/settings`,
    },
  },

  // Admin endpoints
  admin: {
    dashboard: `${API_VERSION}/admin/dashboard`,
    users: `${API_VERSION}/admin/users`,
    applications: `${API_VERSION}/admin/applications`,
    events: `${API_VERSION}/admin/events`,
    volunteer: `${API_VERSION}/admin/volunteer`,
    messages: `${API_VERSION}/admin/messages`,
    reports: `${API_VERSION}/admin/reports`,
    settings: `${API_VERSION}/admin/settings`,
    audit: `${API_VERSION}/admin/audit`,
    
    // User management
    user: {
      activate: (id: string) => `${API_VERSION}/admin/users/${id}/activate`,
      deactivate: (id: string) => `${API_VERSION}/admin/users/${id}/deactivate`,
      suspend: (id: string) => `${API_VERSION}/admin/users/${id}/suspend`,
      resetPassword: (id: string) => `${API_VERSION}/admin/users/${id}/reset-password`,
    },

    // Application management
    application: {
      approve: (id: string) => `${API_VERSION}/admin/applications/${id}/approve`,
      reject: (id: string) => `${API_VERSION}/admin/applications/${id}/reject`,
      requestMoreInfo: (id: string) => `${API_VERSION}/admin/applications/${id}/request-info`,
      review: (id: string) => `${API_VERSION}/admin/applications/${id}/review`,
    },

    // Event management
    event: {
      create: `${API_VERSION}/admin/events`,
      update: (id: string) => `${API_VERSION}/admin/events/${id}`,
      delete: (id: string) => `${API_VERSION}/admin/events/${id}`,
      publish: (id: string) => `${API_VERSION}/admin/events/${id}/publish`,
      cancel: (id: string) => `${API_VERSION}/admin/events/${id}/cancel`,
      attendees: (id: string) => `${API_VERSION}/admin/events/${id}/attendees`,
    },

    // Volunteer management
    volunteerOpportunity: {
      create: `${API_VERSION}/admin/volunteer/opportunities`,
      update: (id: string) => `${API_VERSION}/admin/volunteer/opportunities/${id}`,
      delete: (id: string) => `${API_VERSION}/admin/volunteer/opportunities/${id}`,
      publish: (id: string) => `${API_VERSION}/admin/volunteer/opportunities/${id}/publish`,
      applications: (id: string) => `${API_VERSION}/admin/volunteer/opportunities/${id}/applications`,
    },

    // Report generation
    reports: {
      membership: `${API_VERSION}/admin/reports/membership`,
      applications: `${API_VERSION}/admin/reports/applications`,
      events: `${API_VERSION}/admin/reports/events`,
      volunteers: `${API_VERSION}/admin/reports/volunteers`,
      financial: `${API_VERSION}/admin/reports/financial`,
      audit: `${API_VERSION}/admin/reports/audit`,
      generate: `${API_VERSION}/admin/reports/generate`,
      download: (id: string) => `${API_VERSION}/admin/reports/${id}/download`,
    },
  },

  // File upload endpoints
  upload: {
    avatar: `${API_VERSION}/upload/avatar`,
    document: `${API_VERSION}/upload/document`,
    eventAttachment: `${API_VERSION}/upload/event-attachment`,
    bulk: `${API_VERSION}/upload/bulk`,
  },

  // Search endpoints
  search: {
    global: `${API_VERSION}/search/global`,
    users: `${API_VERSION}/search/users`,
    events: `${API_VERSION}/search/events`,
    volunteerOps: `${API_VERSION}/search/volunteer`,
  },
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the full API URL for an endpoint
 */
export const getApiUrl = (endpoint: string): string => {
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  
  const cleanBase = API_CONFIG.baseURL.replace(/\/$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${cleanBase}${cleanEndpoint}`;
};

/**
 * Build query string from parameters
 */
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, String(item)));
      } else if (typeof value === 'object') {
        searchParams.append(key, JSON.stringify(value));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Default request configuration
 */
export const DEFAULT_REQUEST_CONFIG = {
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers,
} as const;