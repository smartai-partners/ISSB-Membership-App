// ============================================================================
// API CLIENT INFRASTRUCTURE - MAIN EXPORTS
// ============================================================================

// Core API client infrastructure
export { apiClient, ApiClient } from './apiClient';

// Configuration and endpoints
export { 
  API_CONFIG, 
  API_ENDPOINTS, 
  API_VERSION, 
  getApiUrl, 
  buildQueryString,
  DEFAULT_REQUEST_CONFIG 
} from './config';

// Request and response interceptors
export {
  setupInterceptors,
  createRequestInterceptor,
  createResponseInterceptor,
  createErrorInterceptor,
  handleAxiosError,
} from './interceptors';

// API-specific types
export type {
  ExtendedApiResponse,
  ApiError,
  HttpStatusCode,
  ApiErrorType,
  ApiErrorDetails,
  RequestConfig,
  ResponseInterceptorConfig,
  RetryConfig,
  TokenInfo,
  AuthState,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  PaginationParams,
  SearchParams,
  SortOption,
  FilterOption,
  FileUploadResponse,
  UploadProgress,
  UploadConfig,
  WebSocketMessage,
  WebSocketMessageType,
  CacheEntry,
  CacheConfig,
  RequestMetrics,
  PerformanceMetrics,
  BulkOperationRequest,
  BulkOperationResult,
} from './types';

// Export application and membership API types
export type {
  CreateApplicationRequest,
  UpdateApplicationRequest,
  ApplicationReviewRequest,
  ApplicationWorkflowAction,
  DocumentUploadRequest,
  ReferenceVerificationRequest,
  ApplicationStatistics,
  ApplicationQueryOptions,
} from './applications';

export type {
  CreateMembershipRequest,
  UpdateMembershipRequest,
  MembershipRenewalRequest,
  MembershipUpgradeRequest,
  MembershipCancellationRequest,
  PaymentMethodRequest,
  PaymentRequest,
  MembershipFilter,
  MembershipStatistics,
  MembershipQueryOptions,
  MembershipBenefits,
  TierConfiguration,
} from './membership';

// Re-export common types from @issb/types
export type {
  ApiResponse,
  PaginatedResponse,
  ValidationError,
  User,
  UserRole,
  MembershipTier,
  UserStatus,
  ApplicationStatus,
  EventType,
  EventStatus,
  NotificationType,
  MessageType,
  AuditAction,
  ReportType,
} from '@issb/types';

// ============================================================================
// API SERVICES
// ============================================================================

// Export existing API services
export { volunteerApi } from './volunteer';
export { notificationApi } from './notifications';

// Export new application and membership API services
export { applicationApi } from './applications';
export { membershipApi } from './membership';

// Export users API service
export { userApi } from './users';
export * from './users';

// ============================================================================
// CONVENIENCE IMPORTS
// ============================================================================

// Export commonly used API methods for convenience
export const api = apiClient;

// Export specific endpoint groups for easier access
export const endpoints = API_ENDPOINTS;

// Export configuration (new comprehensive config)
export const config = API_CONFIG;

// Export specific API services for easier access
export const apis = {
  volunteer: volunteerApi,
  notifications: notificationApi,
  applications: applicationApi,
  memberships: membershipApi,
  users: userApi,
};

// Export legacy configuration for backward compatibility
export const apiConfig = {
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  retries: API_CONFIG.retries,
  retryDelay: API_CONFIG.retryDelay,
  headers: API_CONFIG.headers,
};

// Export legacy utility functions for backward compatibility
export { handleApiError, hasPermission };

// Legacy buildQueryString for backward compatibility
export const buildQueryStringLegacy = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, String(item)));
      } else if (typeof value === 'object') {
        searchParams.append(key, JSON.stringify(value));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  return searchParams.toString();
};

// Legacy initializeApiClient function (now handled internally)
export const initializeApiClient = () => {
  // The new API client automatically handles initialization
  console.log('API Client Infrastructure initialized');
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// New comprehensive API client usage:
import { 
  apiClient, 
  endpoints, 
  config,
  ApiErrorType 
} from '@/api';

// GET request
const users = await apiClient.getData(endpoints.users.list);

// POST request
const newUser = await apiClient.postData(endpoints.auth.register, userData);

// With pagination
const { data, meta } = await apiClient.getPaginatedData(endpoints.events.base, {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc'
});

// File upload with progress
const uploadResponse = await apiClient.uploadFile(
  endpoints.upload.avatar, 
  file, 
  (progress) => {
    console.log(`Upload progress: ${progress.percentage}%`);
  }
);

// Search with filters
const { data, meta } = await apiClient.search(endpoints.events.base, {
  query: 'conference',
  filters: { type: ['conference'], status: ['published'] },
  page: 1,
  limit: 20
});

// Using specific endpoints
const user = await apiClient.getData(endpoints.auth.me);
const events = await apiClient.getData(endpoints.events.upcoming);
const myMembership = await apiClient.getData(endpoints.membership.myMembership);

// Error handling
try {
  const result = await apiClient.getData('/some-endpoint');
} catch (error) {
  if (error.type === ApiErrorType.AUTHENTICATION_ERROR) {
    // Handle auth error
  } else if (error.type === ApiErrorType.VALIDATION_ERROR) {
    // Handle validation error
  }
}

// Custom configuration
import { RequestConfig } from '@/api';
const customConfig: RequestConfig = {
  timeout: 10000,
  skipAuth: true,
  headers: { 'X-Custom-Header': 'value' }
};
const result = await apiClient.get('/custom-endpoint', customConfig);

// Direct axios instance if needed
import { apiClient } from '@/api';
const axiosInstance = apiClient.getInstance();

// Legacy API services (still supported)
import { volunteerApi, notificationApi } from '@/api';
const opportunities = await volunteerApi.getOpportunities();
const notifications = await notificationApi.getUnread();

// Application API usage examples
import { applicationApi, CreateApplicationRequest } from '@/api';
const applicationData: CreateApplicationRequest = {
  applicationType: 'regular',
  personalInfo: { location: 'NYC', occupation: 'Developer' },
  professionalInfo: { 
    yearsOfExperience: 5, 
    languages: ['English'], 
    areasOfExpertise: ['Web Development'],
    currentRole: 'Senior Developer',
    reference1: { name: 'John Doe', email: 'john@example.com', phone: '123-456-7890', organization: 'Tech Corp', relationship: 'Manager', yearsKnown: 3, verified: false },
    reference2: { name: 'Jane Smith', email: 'jane@example.com', phone: '987-654-3210', organization: 'Design Studio', relationship: 'Colleague', yearsKnown: 2, verified: false }
  },
  documents: [],
  agreeToTerms: true,
  agreeToPrivacy: true,
};
const application = await applicationApi.createApplication(applicationData);
const updatedApp = await applicationApi.updateApplication(appId, { additionalInfo: 'Updated info' });
await applicationApi.submitApplication(appId, userId);
await applicationApi.uploadDocument({ file, applicationId: appId, documentType: 'certificate' });
const applications = await applicationApi.listApplications({ page: 1, limit: 10 });
await applicationApi.submitReview(reviewData);

// Membership API usage examples
import { membershipApi, CreateMembershipRequest } from '@/api';
const membershipData: CreateMembershipRequest = {
  userId: 'user-id',
  tier: 'regular',
  startDate: new Date(),
  endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
  renewalType: 'annual',
  autoRenew: true,
  amount: 99.99,
  currency: 'USD',
  benefits: ['Member access', 'Newsletter'],
};
const membership = await membershipApi.createMembership(membershipData);
const updatedMembership = await membershipApi.updateMembership(membershipId, { status: 'active' });
await membershipApi.renewMembership({ membershipId, userId, paymentMethodId: 'pm_123', renewalType: 'annual' });
await membershipApi.upgradeMembership({ membershipId, userId, newTier: 'board', upgradeReason: 'Promotion', effectiveDate: new Date(), proRatedAmount: 50.00, paymentMethodId: 'pm_123' });
const memberships = await membershipApi.listMemberships({ status: ['active'], page: 1, limit: 20 });
await membershipApi.processPayment({ membershipId, amount: 99.99, currency: 'USD', paymentMethodId: 'pm_123', description: 'Annual renewal' });
const stats = await membershipApi.getMembershipStatistics();
const tiers = await membershipApi.getMembershipTiers();
*/

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // New API client infrastructure
  apiClient,
  api,
  endpoints,
  config,
  
  // API Services
  volunteerApi,
  notificationApi,
  applicationApi,
  membershipApi,
  userApi,
  apis,
  
  // Legacy exports for backward compatibility
  apiConfig,
  initializeApiClient,
  buildQueryString: buildQueryStringLegacy,
  handleApiError,
  hasPermission,
};