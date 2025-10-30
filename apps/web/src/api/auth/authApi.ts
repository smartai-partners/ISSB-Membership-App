// ============================================================================
// AUTHENTICATION API SERVICE
// Centralized API functions for all authentication operations
// ============================================================================

import {
  User,
  AuthResponse as AuthResponseType,
  UserLogin,
  UserRegistration,
  RefreshTokenRequest,
  PasswordReset,
  PasswordChange,
  ApiResponse,
  User as UserType,
} from '@issb/types';
import api from '../../services/api';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

export interface LogoutRequest {
  refreshToken?: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  password: string;
  confirmPassword: string;
  token: string;
}

export interface EmailVerificationRequest {
  email: string;
  verificationCode: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface AuthError {
  message: string;
  code?: string;
  field?: string;
  details?: Record<string, any>;
}

export interface ApiError extends Error {
  status?: number;
  errors?: AuthError[];
  response?: any;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

const handleApiError = (error: any): ApiError => {
  const apiError: ApiError = new Error(
    error.response?.data?.message || 
    error.message || 
    'An unexpected error occurred'
  );
  
  apiError.status = error.response?.status;
  apiError.errors = error.response?.data?.errors || [];
  apiError.response = error.response;
  
  return apiError;
};

// ============================================================================
// AUTHENTICATION API METHODS
// ============================================================================

/**
 * Authenticate user with email and password
 */
export const login = async (credentials: LoginRequest): Promise<AuthResponseType> => {
  try {
    const response = await api.post<AuthResponseType>('/auth/login', {
      email: credentials.email,
      password: credentials.password,
      rememberMe: credentials.rememberMe || false,
    });

    // Set authorization header for future requests
    if (response.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
    }

    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Register a new user account
 */
export const register = async (userData: RegisterRequest): Promise<AuthResponseType> => {
  try {
    const response = await api.post<AuthResponseType>('/auth/register', {
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      dateOfBirth: userData.dateOfBirth,
      agreeToTerms: userData.agreeToTerms,
      agreeToPrivacy: userData.agreeToPrivacy,
    });

    // Set authorization header for future requests
    if (response.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
    }

    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Logout user and invalidate tokens
 */
export const logout = async (refreshToken?: string): Promise<void> => {
  try {
    await api.post('/auth/logout', {
      refreshToken,
    });
  } catch (error) {
    // Don't throw logout errors - we still want to clear local state
    console.warn('Logout API call failed:', error);
  } finally {
    // Always clear authorization header
    delete api.defaults.headers.common['Authorization'];
  }
};

/**
 * Refresh authentication token
 */
export const refreshToken = async (refreshToken: string): Promise<RefreshTokenResponse> => {
  try {
    const response = await api.post<ApiResponse<RefreshTokenResponse>>('/auth/refresh', {
      refreshToken,
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Token refresh failed');
    }

    // Update authorization header
    api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Request password reset email
 */
export const forgotPassword = async (request: ForgotPasswordRequest): Promise<ApiResponse> => {
  try {
    const response = await api.post<ApiResponse>('/auth/forgot-password', {
      email: request.email,
    });

    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (request: ResetPasswordRequest): Promise<ApiResponse> => {
  try {
    const response = await api.post<ApiResponse>('/auth/reset-password', {
      password: request.password,
      confirmPassword: request.confirmPassword,
      token: request.token,
    });

    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Verify email address with verification code
 */
export const verifyEmail = async (request: EmailVerificationRequest): Promise<ApiResponse> => {
  try {
    const response = await api.post<ApiResponse>('/auth/verify-email', {
      email: request.email,
      verificationCode: request.verificationCode,
    });

    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Resend email verification code
 */
export const resendVerification = async (request: ResendVerificationRequest): Promise<ApiResponse> => {
  try {
    const response = await api.post<ApiResponse>('/auth/resend-verification', {
      email: request.email,
    });

    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Change password for authenticated user
 */
export const changePassword = async (request: ChangePasswordRequest): Promise<ApiResponse> => {
  try {
    const response = await api.post<ApiResponse>('/auth/change-password', {
      currentPassword: request.currentPassword,
      newPassword: request.newPassword,
      confirmPassword: request.confirmPassword,
    });

    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get current authenticated user profile
 */
export const getCurrentUser = async (): Promise<UserType> => {
  try {
    const response = await api.get<ApiResponse<{ user: UserType }>>('/auth/me');

    if (!response.success || !response.data?.user) {
      throw new Error(response.message || 'Failed to fetch user profile');
    }

    return response.data.user;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (userData: Partial<UserType>): Promise<UserType> => {
  try {
    const response = await api.patch<ApiResponse<{ user: UserType }>>('/auth/profile', userData);

    if (!response.success || !response.data?.user) {
      throw new Error(response.message || 'Failed to update profile');
    }

    return response.data.user;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Upload user avatar/profile picture
 */
export const uploadAvatar = async (file: File): Promise<{ avatarUrl: string }> => {
  try {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post<ApiResponse<{ avatarUrl: string }>>('/auth/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.success || !response.data?.avatarUrl) {
      throw new Error(response.message || 'Failed to upload avatar');
    }

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Remove user avatar/profile picture
 */
export const removeAvatar = async (): Promise<void> => {
  try {
    await api.delete('/auth/avatar');
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Check if email is available for registration
 */
export const checkEmailAvailability = async (email: string): Promise<{ available: boolean }> => {
  try {
    const response = await api.get<ApiResponse<{ available: boolean }>>('/auth/check-email', {
      params: { email },
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to check email availability');
    }

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Validate password strength
 */
export const validatePassword = async (password: string): Promise<{ valid: boolean; errors: string[] }> => {
  try {
    const response = await api.post<ApiResponse<{ valid: boolean; errors: string[] }>>('/auth/validate-password', {
      password,
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to validate password');
    }

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get active user sessions
 */
export const getActiveSessions = async (): Promise<Array<{
  id: string;
  device: string;
  location: string;
  lastActive: Date;
  current: boolean;
}>> => {
  try {
    const response = await api.get<ApiResponse<Array<{
      id: string;
      device: string;
      location: string;
      lastActive: Date;
      current: boolean;
    }>>>('/auth/sessions');

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch active sessions');
    }

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Revoke a specific session
 */
export const revokeSession = async (sessionId: string): Promise<void> => {
  try {
    await api.delete(`/auth/sessions/${sessionId}`);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Revoke all other sessions (keep current)
 */
export const revokeAllSessions = async (): Promise<void> => {
  try {
    await api.delete('/auth/sessions/all');
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Enable/disable two-factor authentication
 */
export const toggleTwoFactor = async (enabled: boolean, code?: string): Promise<{ qrCode?: string; backupCodes: string[] }> => {
  try {
    const response = await api.post<ApiResponse<{ qrCode?: string; backupCodes: string[] }>>('/auth/2fa', {
      enabled,
      code,
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to toggle two-factor authentication');
    }

    return response.data || { backupCodes: [] };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Verify two-factor authentication code
 */
export const verifyTwoFactor = async (code: string): Promise<{ valid: boolean }> => {
  try {
    const response = await api.post<ApiResponse<{ valid: boolean }>>('/auth/2fa/verify', {
      code,
    });

    if (!response.success) {
      throw new Error(response.message || 'Invalid verification code');
    }

    return response.data || { valid: false };
  } catch (error) {
    throw handleApiError(error);
  }
};

// ============================================================================
// TOKEN MANAGEMENT HELPERS
// ============================================================================

/**
 * Store authentication tokens securely
 */
export const storeTokens = (token: string, refreshToken: string): void => {
  if (typeof window !== 'undefined') {
    // Store in memory only for better security
    // The auth store will persist to localStorage with encryption
    sessionStorage.setItem('auth_token', token);
    sessionStorage.setItem('refresh_token', refreshToken);
  }
};

/**
 * Retrieve stored authentication tokens
 */
export const getStoredTokens = (): { token: string | null; refreshToken: string | null } => {
  if (typeof window === 'undefined') {
    return { token: null, refreshToken: null };
  }

  return {
    token: sessionStorage.getItem('auth_token'),
    refreshToken: sessionStorage.getItem('refresh_token'),
  };
};

/**
 * Clear stored authentication tokens
 */
export const clearStoredTokens = (): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('refresh_token');
  }
};

/**
 * Check if user is authenticated based on token
 */
export const isAuthenticated = (): boolean => {
  const { token } = getStoredTokens();
  return !!token;
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Authentication
  login,
  register,
  logout,
  refreshToken,
  
  // Password Management
  forgotPassword,
  resetPassword,
  changePassword,
  
  // Email Verification
  verifyEmail,
  resendVerification,
  
  // User Profile
  getCurrentUser,
  updateProfile,
  uploadAvatar,
  removeAvatar,
  
  // Utilities
  checkEmailAvailability,
  validatePassword,
  
  // Session Management
  getActiveSessions,
  revokeSession,
  revokeAllSessions,
  
  // Two-Factor Authentication
  toggleTwoFactor,
  verifyTwoFactor,
  
  // Token Management
  storeTokens,
  getStoredTokens,
  clearStoredTokens,
  isAuthenticated,
  
  // Types
  LoginRequest,
  RegisterRequest,
  LogoutRequest,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  EmailVerificationRequest,
  ChangePasswordRequest,
  ResendVerificationRequest,
  AuthError,
  ApiError,
};