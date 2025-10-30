// ============================================================================
// API-SPECIFIC TYPES AND INTERFACES
// ============================================================================

import { ApiResponse, PaginatedResponse, ValidationError } from '@issb/types';

// ============================================================================
// CORE API TYPES
// ============================================================================

/**
 * Extended API response with additional metadata
 */
export interface ExtendedApiResponse<T = any> extends ApiResponse<T> {
  timestamp: string;
  requestId: string;
  version: string;
  cacheControl?: string;
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: number;
  };
}

/**
 * API error response structure
 */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    field?: string;
    timestamp: string;
    requestId: string;
  };
  validationErrors?: ValidationError[];
}

/**
 * HTTP status code types for better type safety
 */
export type HttpStatusCode = 
  | 200 // OK
  | 201 // Created
  | 202 // Accepted
  | 204 // No Content
  | 400 // Bad Request
  | 401 // Unauthorized
  | 403 // Forbidden
  | 404 // Not Found
  | 409 // Conflict
  | 422 // Unprocessable Entity
  | 429 // Too Many Requests
  | 500 // Internal Server Error
  | 502 // Bad Gateway
  | 503 // Service Unavailable
  | 504 // Gateway Timeout;

/**
 * Error types for different scenarios
 */
export enum ApiErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Detailed API error information
 */
export interface ApiErrorDetails {
  type: ApiErrorType;
  statusCode: HttpStatusCode;
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
  timestamp: string;
  requestId?: string;
  isRetryable: boolean;
  retryAfter?: number;
}

/**
 * Request configuration interface
 */
export interface RequestConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  withCredentials?: boolean;
  responseType?: 'json' | 'blob' | 'text' | 'arraybuffer';
  skipAuth?: boolean;
  skipErrorHandling?: boolean;
}

/**
 * Enhanced response interceptor configuration
 */
export interface ResponseInterceptorConfig {
  handleAuth?: boolean;
  handleErrors?: boolean;
  handleRateLimit?: boolean;
  customHandler?: (response: any) => any;
  errorHandler?: (error: any) => Promise<never>;
}

/**
 * Request retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  delay: number;
  backoffFactor: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (error: any, retryCount: number) => void;
}

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

/**
 * Token information
 */
export interface TokenInfo {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
  scope?: string;
}

/**
 * Authentication state
 */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  refreshToken: string | null;
  user: any | null;
  error: string | null;
  expiresAt: number | null;
}

/**
 * Login request
 */
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: {
    deviceId: string;
    platform: string;
    userAgent: string;
  };
}

/**
 * Register request
 */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

/**
 * Token refresh request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

// ============================================================================
// PAGINATION AND FILTERING TYPES
// ============================================================================

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Search parameters
 */
export interface SearchParams extends PaginationParams {
  query?: string;
  filters?: Record<string, any>;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Sort options
 */
export interface SortOption {
  label: string;
  value: string;
  direction?: 'asc' | 'desc';
}

/**
 * Filter option
 */
export interface FilterOption {
  label: string;
  value: any;
  count?: number;
}

// ============================================================================
// FILE UPLOAD TYPES
// ============================================================================

/**
 * File upload response
 */
export interface FileUploadResponse {
  fileId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

/**
 * File upload progress
 */
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * File upload configuration
 */
export interface UploadConfig {
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  multiple?: boolean;
  onProgress?: (progress: UploadProgress) => void;
  onError?: (error: any) => void;
}

// ============================================================================
// WEBSOCKET TYPES
// ============================================================================

/**
 * WebSocket message types
 */
export enum WebSocketMessageType {
  NOTIFICATION = 'notification',
  MESSAGE = 'message',
  EVENT_UPDATE = 'event_update',
  USER_STATUS = 'user_status',
  HEARTBEAT = 'heartbeat',
}

/**
 * WebSocket message
 */
export interface WebSocketMessage<T = any> {
  type: WebSocketMessageType;
  data: T;
  timestamp: string;
  userId?: string;
}

// ============================================================================
// CACHE TYPES
// ============================================================================

/**
 * Cache entry
 */
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  tags?: string[];
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  strategy?: 'lru' | 'fifo' | 'ttl';
}

// ============================================================================
// MONITORING AND ANALYTICS TYPES
// ============================================================================

/**
 * API request metrics
 */
export interface RequestMetrics {
  url: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: number;
  userId?: string;
  error?: string;
}

/**
 * API performance metrics
 */
export interface PerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  slowestEndpoint: string;
  mostUsedEndpoint: string;
  errorRate: number;
}

// ============================================================================
// BULK OPERATION TYPES
// ============================================================================

/**
 * Bulk operation request
 */
export interface BulkOperationRequest {
  operation: 'create' | 'update' | 'delete';
  resource: string;
  ids?: string[];
  data?: any[];
  options?: {
    validateOnly?: boolean;
    continueOnError?: boolean;
    batchSize?: number;
  };
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult {
  operation: string;
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    id?: string;
    index?: number;
    error: string;
    details?: any;
  }>;
  data?: any[];
}

// ============================================================================
// EXPORT ENUMS FOR EASY ACCESS
// ============================================================================

export { ApiErrorType as ErrorType };