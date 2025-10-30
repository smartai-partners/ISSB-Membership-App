// ============================================================================
// API CLIENT - ENHANCED AXIOS INSTANCE
// ============================================================================

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, getApiUrl, buildQueryString } from './config';
import { setupInterceptors } from './interceptors';
import { RequestConfig, ExtendedApiResponse, FileUploadResponse, UploadProgress } from './types';
import toast from 'react-hot-toast';

// ============================================================================
// MAIN API CLIENT CLASS
// ============================================================================

class ApiClient {
  private instance: AxiosInstance;
  private defaultConfig: RequestConfig;

  constructor() {
    // Create axios instance with base configuration
    this.instance = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: API_CONFIG.headers,
    });

    // Set default configuration
    this.defaultConfig = {
      timeout: API_CONFIG.timeout,
      retries: API_CONFIG.retries,
      retryDelay: API_CONFIG.retryDelay,
    };

    // Setup interceptors
    setupInterceptors(this.instance);
  }

  // ============================================================================
  // CORE HTTP METHODS
  // ============================================================================

  /**
   * Make a GET request
   */
  async get<T = any>(
    url: string,
    config: RequestConfig = {}
  ): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, this.mergeConfig(config));
  }

  /**
   * Make a POST request
   */
  async post<T = any>(
    url: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data, this.mergeConfig(config));
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(
    url: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<AxiosResponse<T>> {
    return this.instance.put<T>(url, data, this.mergeConfig(config));
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<AxiosResponse<T>> {
    return this.instance.patch<T>(url, data, this.mergeConfig(config));
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(
    url: string,
    config: RequestConfig = {}
  ): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url, this.mergeConfig(config));
  }

  // ============================================================================
  // ENHANCED METHODS WITH DATA EXTRACTION
  // ============================================================================

  /**
   * GET request with automatic data extraction
   */
  async getData<T = any>(
    url: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const response = await this.get<T>(url, config);
    return response.data;
  }

  /**
   * POST request with automatic data extraction
   */
  async postData<T = any>(
    url: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<T> {
    const response = await this.post<T>(url, data, config);
    return response.data;
  }

  /**
   * PUT request with automatic data extraction
   */
  async putData<T = any>(
    url: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<T> {
    const response = await this.put<T>(url, data, config);
    return response.data;
  }

  /**
   * PATCH request with automatic data extraction
   */
  async patchData<T = any>(
    url: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<T> {
    const response = await this.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * DELETE request with automatic data extraction
   */
  async deleteData<T = any>(
    url: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const response = await this.delete<T>(url, config);
    return response.data;
  }

  // ============================================================================
  // PAGINATED REQUESTS
  // ============================================================================

  /**
   * Make a paginated GET request
   */
  async getPaginated<T = any>(
    url: string,
    params: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      search?: string;
      filters?: Record<string, any>;
    } = {},
    config: RequestConfig = {}
  ): Promise<AxiosResponse<ExtendedApiResponse<T[]>>> {
    const queryString = buildQueryString(params);
    const fullUrl = `${url}${queryString}`;
    
    return this.get<ExtendedApiResponse<T[]>>(fullUrl, config);
  }

  /**
   * Get paginated data with metadata
   */
  async getPaginatedData<T = any>(
    url: string,
    params: any = {},
    config: RequestConfig = {}
  ): Promise<{
    data: T[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const response = await this.getPaginated<T>(url, params, config);
    
    return {
      data: response.data.data || [],
      meta: response.data.meta || {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  // ============================================================================
  // FILE UPLOAD
  // ============================================================================

  /**
   * Upload a single file
   */
  async uploadFile<T = FileUploadResponse>(
    url: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void,
    config: RequestConfig = {}
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const uploadConfig = {
      ...config,
      headers: {
        ...config.headers,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const progress: UploadProgress = {
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
          };
          onProgress(progress);
        }
      },
    };

    return this.postData<T>(url, formData, uploadConfig);
  }

  /**
   * Upload multiple files
   */
  async uploadFiles<T = FileUploadResponse[]>(
    url: string,
    files: File[],
    onProgress?: (fileIndex: number, progress: UploadProgress) => void,
    config: RequestConfig = {}
  ): Promise<T> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files`, file);
    });

    const uploadConfig = {
      ...config,
      headers: {
        ...config.headers,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const progress: UploadProgress = {
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
          };
          onProgress(0, progress); // For multiple files, we show overall progress
        }
      },
    };

    return this.postData<T>(url, formData, uploadConfig);
  }

  /**
   * Upload file with metadata
   */
  async uploadFileWithMetadata<T = FileUploadResponse>(
    url: string,
    file: File,
    metadata: Record<string, any>,
    onProgress?: (progress: UploadProgress) => void,
    config: RequestConfig = {}
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    const uploadConfig = {
      ...config,
      headers: {
        ...config.headers,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const progress: UploadProgress = {
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total),
          };
          onProgress(progress);
        }
      },
    };

    return this.postData<T>(url, formData, uploadConfig);
  }

  // ============================================================================
  // SEARCH AND FILTERING
  // ============================================================================

  /**
   * Search with filters and pagination
   */
  async search<T = any>(
    url: string,
    searchParams: {
      query?: string;
      filters?: Record<string, any>;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {},
    config: RequestConfig = {}
  ): Promise<{
    data: T[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
      query?: string;
    };
  }> {
    const response = await this.getPaginatedData<T>(url, searchParams, config);
    return response;
  }

  /**
   * Advanced search with complex filters
   */
  async advancedSearch<T = any>(
    url: string,
    searchQuery: {
      text?: string;
      filters?: Record<string, any[]>;
      dateRange?: { start: string; end: string };
      location?: string;
      tags?: string[];
      [key: string]: any;
    },
    config: RequestConfig = {}
  ): Promise<{
    data: T[];
    meta: any;
    facets?: Record<string, any[]>;
  }> {
    return this.getData(`${url}/search`, { ...config, data: searchQuery });
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Perform bulk operations
   */
  async bulkOperation<T = any>(
    url: string,
    operation: 'create' | 'update' | 'delete',
    data: any[],
    options: {
      validateOnly?: boolean;
      continueOnError?: boolean;
      batchSize?: number;
    } = {},
    config: RequestConfig = {}
  ): Promise<T> {
    return this.postData<T>(`${url}/bulk`, {
      operation,
      data,
      options,
    }, config);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Cancel ongoing requests
   */
  cancelRequest(message?: string): void {
    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();
    source.cancel(message || 'Request cancelled by user');
    
    return source.token;
  }

  /**
   * Check if endpoint is reachable
   */
  async healthCheck(url: string = '/health'): Promise<boolean> {
    try {
      await this.get(url, { timeout: 5000 });
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Get request statistics
   */
  getRequestStats(): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
  } {
    // This would typically be implemented with a metrics collection system
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
    };
  }

  /**
   * Set default headers
   */
  setDefaultHeader(key: string, value: string): void {
    this.instance.defaults.headers.common[key] = value;
  }

  /**
   * Remove default header
   */
  removeDefaultHeader(key: string): void {
    delete this.instance.defaults.headers.common[key];
  }

  /**
   * Get the underlying axios instance
   */
  getInstance(): AxiosInstance {
    return this.instance;
  }

  /**
   * Update base URL
   */
  setBaseURL(baseURL: string): void {
    this.instance.defaults.baseURL = baseURL;
  }

  /**
   * Get current configuration
   */
  getConfig(): AxiosRequestConfig {
    return this.instance.defaults;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Merge custom config with defaults
   */
  private mergeConfig(config: RequestConfig = {}): AxiosRequestConfig {
    const mergedConfig: AxiosRequestConfig = {
      ...this.defaultConfig,
      ...config,
    };

    // Apply request ID if not provided
    if (!mergedConfig.headers?.['X-Request-Id']) {
      mergedConfig.headers = {
        ...mergedConfig.headers,
        'X-Request-Id': `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    }

    return mergedConfig;
  }

  /**
   * Handle API response validation
   */
  private validateApiResponse<T>(response: AxiosResponse<T>): T {
    if (typeof response.data === 'object' && response.data !== null) {
      // Check if response has success/data structure
      if ('success' in response.data && !(response.data as any).success) {
        throw new Error((response.data as any).message || 'API request failed');
      }
    }

    return response.data;
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Export the class for custom instances if needed
export { ApiClient };

// Export convenience methods
export const {
  get,
  getData,
  getPaginated,
  getPaginatedData,
  post,
  postData,
  put,
  putData,
  patch,
  patchData,
  delete: deleteRequest,
  deleteData,
  uploadFile,
  uploadFiles,
  uploadFileWithMetadata,
  search,
  advancedSearch,
  bulkOperation,
} = apiClient;