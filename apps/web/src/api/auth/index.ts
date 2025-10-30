// ============================================================================
// AUTH API INDEX
// Centralized exports for authentication API services
// ============================================================================

// Main API functions
export {
  login,
  register,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  changePassword,
  getCurrentUser,
  updateProfile,
  uploadAvatar,
  removeAvatar,
  checkEmailAvailability,
  validatePassword,
  getActiveSessions,
  revokeSession,
  revokeAllSessions,
  toggleTwoFactor,
  verifyTwoFactor,
  storeTokens,
  getStoredTokens,
  clearStoredTokens,
  isAuthenticated,
} from './authApi';

// Type exports from authApi
export type {
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
} from './authApi';

// Extended types from types.ts
export type {
  ExtendedAuthResponse,
  ProfileUpdateData,
  PasswordValidationResult,
  EmailAvailabilityResult,
  UserSession,
  TwoFactorSetupResult,
  TwoFactorVerificationResult,
  AvatarUploadResult,
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
} from './types';

// Enums from types.ts
export {
  PasswordStrength,
  AuthMethod,
  SessionStatus,
  SecurityEventType,
  AuthErrorCode,
  AuthState,
  AuthEvent,
} from './types';

// Re-export shared types for convenience
export type {
  User,
  AuthResponse,
  UserLogin,
  UserRegistration,
  ApiResponse,
} from '@issb/types';

// Examples and utilities
export { authApiExamples } from './examples';

// Default export
export { default as authApi } from './authApi';