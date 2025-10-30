// ============================================================================
// REQUEST AND RESPONSE INTERCEPTORS
// ============================================================================

import { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiErrorType, ApiErrorDetails, RetryConfig } from './types';
import { API_CONFIG } from './config';
import toast from 'react-hot-toast';

// ============================================================================
// INTERCEPTOR ERROR HANDLING
// ============================================================================

/**
 * Handle axios errors and convert to ApiErrorDetails
 */
export const handleAxiosError = (error: AxiosError): ApiErrorDetails => {
  const response = error.response;
  const request = error.request;

  // Network errors (no response received)
  if (!response && request) {
    return {
      type: ApiErrorType.NETWORK_ERROR,
      statusCode: 0,
      code: 'NETWORK_ERROR',
      message: 'Network error occurred. Please check your internet connection.',
      details: { url: request.url, method: request.method },
      timestamp: new Date().toISOString(),
      isRetryable: true,
    };
  }

  // Request timeout
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return {
      type: ApiErrorType.TIMEOUT_ERROR,
      statusCode: 408,
      code: 'TIMEOUT_ERROR',
      message: 'Request timeout. The server is taking too long to respond.',
      timestamp: new Date().toISOString(),
      isRetryable: true,
    };
  }

  // Server response errors
  if (response) {
    const statusCode = response.status as any;
    const data = response.data as any;

    switch (statusCode) {
      case 401:
        return {
          type: ApiErrorType.AUTHENTICATION_ERROR,
          statusCode: statusCode,
          code: data?.code || 'UNAUTHORIZED',
          message: data?.message || 'Authentication required. Please log in.',
          details: data,
          timestamp: new Date().toISOString(),
          isRetryable: false,
        };

      case 403:
        return {
          type: ApiErrorType.AUTHORIZATION_ERROR,
          statusCode: statusCode,
          code: data?.code || 'FORBIDDEN',
          message: data?.message || 'You do not have permission to perform this action.',
          details: data,
          timestamp: new Date().toISOString(),
          isRetryable: false,
        };

      case 404:
        return {
          type: ApiErrorType.NOT_FOUND_ERROR,
          statusCode: statusCode,
          code: data?.code || 'NOT_FOUND',
          message: data?.message || 'The requested resource was not found.',
          details: data,
          timestamp: new Date().toISOString(),
          isRetryable: false,
        };

      case 409:
        return {
          type: ApiErrorType.CONFLICT_ERROR,
          statusCode: statusCode,
          code: data?.code || 'CONFLICT',
          message: data?.message || 'A conflict occurred with the current state.',
          details: data,
          timestamp: new Date().toISOString(),
          isRetryable: true,
        };

      case 422:
        return {
          type: ApiErrorType.VALIDATION_ERROR,
          statusCode: statusCode,
          code: data?.code || 'VALIDATION_ERROR',
          message: data?.message || 'The request data is invalid.',
          details: data,
          field: data?.field,
          timestamp: new Date().toISOString(),
          isRetryable: false,
        };

      case 429:
        return {
          type: ApiErrorType.RATE_LIMIT_ERROR,
          statusCode: statusCode,
          code: data?.code || 'RATE_LIMIT_EXCEEDED',
          message: data?.message || 'Too many requests. Please try again later.',
          details: data,
          timestamp: new Date().toISOString(),
          isRetryable: true,
          retryAfter: parseInt(response.headers['retry-after'] || '60'),
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: ApiErrorType.SERVER_ERROR,
          statusCode: statusCode,
          code: data?.code || 'SERVER_ERROR',
          message: data?.message || 'A server error occurred. Please try again later.',
          details: data,
          timestamp: new Date().toISOString(),
          isRetryable: true,
        };

      default:
        return {
          type: ApiErrorType.UNKNOWN_ERROR,
          statusCode: statusCode,
          code: data?.code || 'UNKNOWN_ERROR',
          message: data?.message || 'An unexpected error occurred.',
          details: data,
          timestamp: new Date().toISOString(),
          isRetryable: statusCode >= 500,
        };
    }
  }

  // Unknown error
  return {
    type: ApiErrorType.UNKNOWN_ERROR,
    statusCode: 0,
    code: 'UNKNOWN_ERROR',
    message: error.message || 'An unknown error occurred.',
    details: { originalError: error.toString() },
    timestamp: new Date().toISOString(),
    isRetryable: false,
  };
};

// ============================================================================
// RETRY MECHANISM
// ============================================================================

/**
 * Calculate delay for exponential backoff
 */
const calculateDelay = (retryCount: number, baseDelay: number, backoffFactor: number = 2): number => {
  return baseDelay * Math.pow(backoffFactor, retryCount);
};

/**
 * Should retry the request based on error and retry count
 */
const shouldRetry = (error: ApiErrorDetails, retryCount: number, config: RetryConfig): boolean => {
  if (retryCount >= config.maxRetries) {
    return false;
  }

  // Check custom retry condition
  if (config.shouldRetry && !config.shouldRetry(error)) {
    return false;
  }

  // Don't retry authentication and authorization errors
  if (error.type === ApiErrorType.AUTHENTICATION_ERROR || 
      error.type === ApiErrorType.AUTHORIZATION_ERROR) {
    return false;
  }

  return error.isRetryable;
};

/**
 * Retry a failed request
 */
const retryRequest = async (
  requestConfig: AxiosRequestConfig,
  instance: AxiosInstance,
  error: ApiErrorDetails,
  retryCount: number = 0,
  retryConfig: RetryConfig
): Promise<AxiosResponse> => {
  const delay = calculateDelay(retryCount, retryConfig.delay, retryConfig.backoffFactor);

  // Call onRetry callback if provided
  if (retryConfig.onRetry) {
    retryConfig.onRetry(error, retryCount);
  }

  // Wait for the delay
  await new Promise(resolve => setTimeout(resolve, delay));

  // Create new request config with updated headers if needed
  const newConfig = {
    ...requestConfig,
    headers: {
      ...requestConfig.headers,
      'X-Request-Retried': 'true',
    },
  };

  try {
    return await instance.request(newConfig);
  } catch (newError) {
    const newErrorDetails = handleAxiosError(newError as AxiosError);
    const nextRetryCount = retryCount + 1;

    if (shouldRetry(newErrorDetails, nextRetryCount, retryConfig)) {
      return retryRequest(newConfig, instance, newErrorDetails, nextRetryCount, retryConfig);
    }

    throw newErrorDetails;
  }
};

// ============================================================================
// REQUEST INTERCEPTOR
// ============================================================================

/**
 * Create request interceptor with authentication and request preparation
 */
export const createRequestInterceptor = () => {
  return async (config: AxiosRequestConfig): Promise<AxiosRequestConfig> => {
    // Add request timestamp for performance monitoring
    config.metadata = config.metadata || {};
    config.metadata.startTime = Date.now();

    // Skip auth for certain endpoints
    const skipAuth = config.headers?.['X-Skip-Auth'] || 
                    config.url?.includes('/auth/') ||
                    config.url?.includes('/public/');

    if (!skipAuth) {
      // Get auth token from storage
      const token = getAuthToken();
      if (token) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`,
        };
      }
    }

    // Add client information
    config.headers = {
      ...config.headers,
      'X-Client-Version': import.meta.env.PACKAGE_VERSION || '1.0.0',
      'X-Request-Id': generateRequestId(),
      'X-User-Agent': navigator.userAgent,
      'X-Platform': 'web',
    };

    // Handle request body for non-GET requests
    if (config.data && typeof config.data === 'object' && 
        !(config.data instanceof FormData) &&
        !(config.data instanceof Blob)) {
      // Ensure proper JSON serialization
      config.data = JSON.stringify(config.data);
    }

    // Add timeout from config or API_CONFIG
    config.timeout = config.timeout || API_CONFIG.timeout;

    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      method: config.method,
      url: config.url,
      data: config.data,
      headers: config.headers,
    });

    return config;
  };
};

// ============================================================================
// RESPONSE INTERCEPTOR
// ============================================================================

/**
 * Create response interceptor with error handling and data extraction
 */
export const createResponseInterceptor = () => {
  return async (response: AxiosResponse): Promise<AxiosResponse> => {
    const duration = Date.now() - (response.config.metadata?.startTime || Date.now());

    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      duration: `${duration}ms`,
      data: response.data,
    });

    // Extract data if response has success/data structure
    if (response.data?.success !== undefined) {
      if (response.data.success) {
        return response;
      } else {
        // API returned error in success structure
        const apiError: ApiErrorDetails = {
          type: ApiErrorType.UNKNOWN_ERROR,
          statusCode: response.status,
          code: response.data.error?.code || 'API_ERROR',
          message: response.data.message || 'API request failed',
          details: response.data,
          timestamp: new Date().toISOString(),
          isRetryable: false,
        };
        throw apiError;
      }
    }

    return response;
  };
};

// ============================================================================
// ERROR INTERCEPTOR
// ============================================================================

/**
 * Create error interceptor with retry mechanism and global error handling
 */
export const createErrorInterceptor = (retryConfig: RetryConfig) => {
  return async (error: AxiosError): Promise<never> => {
    const errorDetails = handleAxiosError(error);
    const duration = error.config?.metadata?.startTime ? 
      Date.now() - error.config.metadata.startTime : 0;

    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: errorDetails.statusCode,
      type: errorDetails.type,
      message: errorDetails.message,
      duration: `${duration}ms`,
      details: errorDetails.details,
    });

    // Try to retry the request if appropriate
    if (shouldRetry(errorDetails, 0, retryConfig) && error.config) {
      try {
        const retryResponse = await retryRequest(error.config, error.config._axiosInstance!, errorDetails, 0, retryConfig);
        return retryResponse;
      } catch (retryError) {
        // Retry also failed, use the original error
        console.error('🔄 Retry failed:', retryError);
      }
    }

    // Handle specific error types globally
    switch (errorDetails.type) {
      case ApiErrorType.AUTHENTICATION_ERROR:
        handleAuthenticationError(errorDetails);
        break;
      
      case ApiErrorType.AUTHORIZATION_ERROR:
        handleAuthorizationError(errorDetails);
        break;
      
      case ApiErrorType.RATE_LIMIT_ERROR:
        handleRateLimitError(errorDetails);
        break;
      
      default:
        handleGenericError(errorDetails);
    }

    throw errorDetails;
  };
};

// ============================================================================
// GLOBAL ERROR HANDLERS
// ============================================================================

/**
 * Handle authentication errors globally
 */
const handleAuthenticationError = (error: ApiErrorDetails): void => {
  // Clear auth storage
  localStorage.removeItem('auth-storage');
  
  // Redirect to login if not already there
  if (window.location.pathname !== '/login') {
    toast.error('Your session has expired. Please log in again.');
    window.location.href = '/login';
  }
};

/**
 * Handle authorization errors globally
 */
const handleAuthorizationError = (error: ApiErrorDetails): void => {
  toast.error('You do not have permission to perform this action.');
  
  // Could redirect to unauthorized page or show modal
  if (window.location.pathname.startsWith('/admin')) {
    window.location.href = '/unauthorized';
  }
};

/**
 * Handle rate limit errors globally
 */
const handleRateLimitError = (error: ApiErrorDetails): void => {
  const message = error.retryAfter ? 
    `Too many requests. Please try again in ${error.retryAfter} seconds.` :
    'Too many requests. Please try again later.';
  
  toast.error(message, { duration: 5000 });
};

/**
 * Handle generic errors globally
 */
const handleGenericError = (error: ApiErrorDetails): void => {
  // Don't show toast for certain errors
  const silentErrors = ['VALIDATION_ERROR']; // Validation errors are usually handled by forms
  
  if (!silentErrors.includes(error.code)) {
    toast.error(error.message);
  }
};

// ============================================================================
// AUTH TOKEN HELPERS
// ============================================================================

/**
 * Get authentication token from storage
 */
const getAuthToken = (): string | null => {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const { state } = JSON.parse(authStorage);
      if (state?.token && state.expiresAt && Date.now() < state.expiresAt) {
        return state.token;
      }
    }
  } catch (error) {
    console.error('Failed to get auth token:', error);
  }
  return null;
};

/**
 * Generate unique request ID for tracking
 */
const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// ============================================================================
// EXPORT INTERCEPTOR CREATORS
// ============================================================================

/**
 * Setup all interceptors for an axios instance
 */
export const setupInterceptors = (
  instance: AxiosInstance,
  retryConfig?: Partial<RetryConfig>
): void => {
  const defaultRetryConfig: RetryConfig = {
    maxRetries: API_CONFIG.retries,
    delay: API_CONFIG.retryDelay,
    backoffFactor: 2,
    ...retryConfig,
  };

  instance.interceptors.request.use(
    createRequestInterceptor(),
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    createResponseInterceptor(),
    createErrorInterceptor(defaultRetryConfig)
  );
};

// Export individual interceptor creators for custom usage
export { createRequestInterceptor, createResponseInterceptor, createErrorInterceptor };