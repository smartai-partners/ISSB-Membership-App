// ============================================================================
// AUTH API TYPES
// Additional type definitions and utilities for the authentication API
// ============================================================================

import {
  User,
  AuthResponse,
  UserLogin,
  UserRegistration,
  ApiResponse,
} from '@issb/types';

// Re-export shared types for convenience
export type {
  User,
  AuthResponse,
  UserLogin,
  UserRegistration,
  ApiResponse,
} from '@issb/types';

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Extended authentication response with additional metadata
 */
export interface ExtendedAuthResponse extends AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
  tokenType?: string;
  scope?: string[];
  metadata?: {
    loginTime: string;
    deviceInfo?: string;
    location?: string;
  };
}

/**
 * User profile update data
 */
export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: Date;
  profile?: {
    bio?: string;
    location?: string;
    occupation?: string;
    organization?: string;
    website?: string;
    socialMedia?: {
      linkedin?: string;
      twitter?: string;
      instagram?: string;
      facebook?: string;
    };
    languages?: string[];
    interests?: string[];
  };
}

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  score: number; // 0-4 strength score
  feedback: {
    warning?: string;
    suggestions?: string[];
  };
}

/**
 * Email availability check result
 */
export interface EmailAvailabilityResult {
  available: boolean;
  domain?: string;
  suggestions?: string[];
}

/**
 * User session information
 */
export interface UserSession {
  id: string;
  device: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
  location: string;
  ipAddress: string;
  lastActive: Date;
  createdAt: Date;
  current: boolean;
  isActive: boolean;
}

/**
 * Two-factor authentication setup result
 */
export interface TwoFactorSetupResult {
  qrCode: string;
  secret: string;
  backupCodes: string[];
  recoveryUrl?: string;
}

/**
 * Two-factor authentication verification result
 */
export interface TwoFactorVerificationResult {
  valid: boolean;
  attemptsRemaining?: number;
  lockedUntil?: Date;
}

/**
 * Avatar upload result
 */
export interface AvatarUploadResult {
  avatarUrl: string;
  avatarThumbnail?: string;
  fileSize: number;
  mimeType: string;
}

/**
 * Password strength levels
 */
export enum PasswordStrength {
  WEAK = 'weak',
  FAIR = 'fair',
  GOOD = 'good',
  STRONG = 'strong',
  VERY_STRONG = 'very_strong',
}

/**
 * Authentication method types
 */
export enum AuthMethod {
  EMAIL_PASSWORD = 'email_password',
  SOCIAL_GOOGLE = 'social_google',
  SOCIAL_FACEBOOK = 'social_facebook',
  SOCIAL_GITHUB = 'social_github',
  SOCIAL_LINKEDIN = 'social_linkedin',
  TWO_FACTOR = 'two_factor',
  BIOMETRIC = 'biometric',
}

/**
 * Session status types
 */
export enum SessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  SUSPENDED = 'suspended',
}

/**
 * Password policy configuration
 */
export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  preventCommonPasswords: boolean;
  preventReuse: number; // number of previous passwords to check
  expirationDays?: number;
}

/**
 * Security event types
 */
export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  EMAIL_VERIFIED = 'email_verified',
  TWO_FACTOR_ENABLED = 'two_factor_enabled',
  TWO_FACTOR_DISABLED = 'two_factor_disabled',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  PROFILE_UPDATED = 'profile_updated',
  AVATAR_UPLOADED = 'avatar_uploaded',
  SESSION_REVOKED = 'session_revoked',
  TOKEN_REFRESHED = 'token_refreshed',
}

/**
 * Security event log entry
 */
export interface SecurityEvent {
  id: string;
  userId: string;
  type: SecurityEventType;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  location?: string;
  deviceInfo?: string;
  success: boolean;
  details?: Record<string, any>;
  riskScore?: number;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Authentication-specific error codes
 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'invalid_credentials',
  ACCOUNT_NOT_FOUND = 'account_not_found',
  ACCOUNT_DISABLED = 'account_disabled',
  ACCOUNT_LOCKED = 'account_locked',
  EMAIL_NOT_VERIFIED = 'email_not_verified',
  WEAK_PASSWORD = 'weak_password',
  PASSWORD_TOO_SHORT = 'password_too_short',
  INVALID_EMAIL = 'invalid_email',
  EMAIL_ALREADY_EXISTS = 'email_already_exists',
  INVALID_TOKEN = 'invalid_token',
  TOKEN_EXPIRED = 'token_expired',
  TOKEN_ALREADY_USED = 'token_already_used',
  INVALID_VERIFICATION_CODE = 'invalid_verification_code',
  VERIFICATION_CODE_EXPIRED = 'verification_code_expired',
  VERIFICATION_CODE_TOO_MANY_ATTEMPTS = 'verification_code_too_many_attempts',
  INVALID_CURRENT_PASSWORD = 'invalid_current_password',
  SAME_AS_OLD_PASSWORD = 'same_as_old_password',
  TWO_FACTOR_REQUIRED = 'two_factor_required',
  TWO_FACTOR_INVALID = 'two_factor_invalid',
  TWO_FACTOR_ALREADY_ENABLED = 'two_factor_already_enabled',
  TWO_FACTOR_ALREADY_DISABLED = 'two_factor_already_disabled',
  SESSION_EXPIRED = 'session_expired',
  SESSION_INVALID = 'session_invalid',
  MAX_LOGIN_ATTEMPTS_EXCEEDED = 'max_login_attempts_exceeded',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  INVALID_REQUEST = 'invalid_request',
  SERVER_ERROR = 'server_error',
  NETWORK_ERROR = 'network_error',
  TIMEOUT = 'timeout',
}

/**
 * Extended authentication error with additional context
 */
export interface AuthApiError extends Error {
  code: AuthErrorCode;
  status?: number;
  field?: string;
  context?: Record<string, any>;
  retryAfter?: number;
  rateLimitRemaining?: number;
  securityEvent?: SecurityEventType;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Authentication configuration
 */
export interface AuthConfig {
  apiUrl: string;
  tokenStorageKey: string;
  refreshTokenStorageKey: string;
  tokenExpirationBuffer: number; // seconds before expiry to refresh
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  sessionTimeout: number; // minutes
  enableTwoFactor: boolean;
  passwordPolicy: PasswordPolicy;
  socialAuthProviders: AuthMethod[];
}

/**
 * API client configuration
 */
export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  headers: Record<string, string>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Generic API result type
 */
export type ApiResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  code?: string;
};

/**
 * Paginated API result
 */
export type PaginatedApiResult<T> = ApiResult<{
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}>;

/**
 * Form state for authentication forms
 */
export interface AuthFormState {
  isLoading: boolean;
  isSubmitting: boolean;
  isSuccess: boolean;
  error: AuthApiError | null;
  successMessage?: string;
  validationErrors?: Record<string, string>;
  touchedFields?: Set<string>;
}

/**
 * Authentication state machine states
 */
export enum AuthState {
  INITIAL = 'initial',
  AUTHENTICATING = 'authenticating',
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
  EXPIRED = 'expired',
  ERROR = 'error',
  LOCKED = 'locked',
}

/**
 * Authentication transition events
 */
export enum AuthEvent {
  LOGIN_START = 'login_start',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  TOKEN_REFRESH = 'token_refresh',
  TOKEN_EXPIRED = 'token_expired',
  SESSION_EXPIRED = 'session_expired',
  ERROR = 'error',
  LOCKOUT = 'lockout',
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Extract only the user data from auth response
 */
export type AuthUser = AuthResponse['user'];

/**
 * Extract only the tokens from auth response
 */
export type AuthTokens = {
  token: AuthResponse['token'];
  refreshToken: AuthResponse['refreshToken'];
  expiresIn: AuthResponse['expiresIn'];
};

/**
 * Optional fields for user profile
 */
export type OptionalProfileFields = Partial<Pick<User, 
  'phone' | 
  'dateOfBirth' | 
  'avatar' | 
  'profile'
>>;

/**
 * Required fields for user registration
 */
export type RequiredRegistrationFields = Pick<UserRegistration, 
  'email' | 
  'password' | 
  'firstName' | 
  'lastName' | 
  'agreeToTerms'
>;

// ============================================================================
// EXPORTS
// ============================================================================

// Re-export all types for easy importing
export * from '@issb/types';

// API Types
export type {
  ExtendedAuthResponse,
  ProfileUpdateData,
  PasswordValidationResult,
  EmailAvailabilityResult,
  UserSession,
  TwoFactorSetupResult,
  TwoFactorVerificationResult,
  AvatarUploadResult,
};

// Enums
export {
  PasswordStrength,
  AuthMethod,
  SessionStatus,
  SecurityEventType,
  AuthErrorCode,
  AuthState,
  AuthEvent,
};

// Interfaces
export type {
  PasswordPolicy,
  SecurityEvent,
  AuthApiError,
  AuthConfig,
  ApiClientConfig,
  ApiResult,
  PaginatedApiResult,
  AuthFormState,
  AuthUser,
  AuthTokens,
  OptionalProfileFields,
  RequiredRegistrationFields,
};