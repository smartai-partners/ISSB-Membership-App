// Authentication related types

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  agreeToTerms: boolean;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  password: string;
  confirmPassword: string;
  token: string;
}

export interface EmailVerificationData {
  email: string;
  verificationCode: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user?: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
    token?: string;
    refreshToken?: string;
  };
  error?: string;
}

export interface SocialLoginProvider {
  provider: 'google' | 'facebook' | 'github' | 'linkedin';
  redirectUrl: string;
}

export interface AuthError {
  field?: string;
  message: string;
  code?: string;
}

export interface FormState {
  isLoading: boolean;
  isSuccess: boolean;
  error: AuthError | null;
  successMessage?: string;
}

export interface AuthValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  agreeToTerms?: string;
  verificationCode?: string;
  general?: string;
}
