// Export all authentication components and utilities
export { LoginForm } from './components/LoginForm';
export { RegisterForm } from './components/RegisterForm';
export { ForgotPasswordForm } from './components/ForgotPasswordForm';
export { ResetPasswordForm } from './components/ResetPasswordForm';
export { EmailVerificationForm } from './components/EmailVerificationForm';

// Export custom hooks
export { useAuth } from './hooks';

// Export types
export type {
  LoginCredentials,
  RegisterCredentials,
  ForgotPasswordData,
  ResetPasswordData,
  EmailVerificationData,
  AuthResponse,
  SocialLoginProvider,
  AuthError,
  FormState,
  AuthValidationErrors,
} from './types';

// Export validation schemas
export {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  emailVerificationSchema,
  type LoginFormData,
  type RegisterFormData,
  type ForgotPasswordFormData,
  type ResetPasswordFormData,
  type EmailVerificationFormData,
} from './validation-schemas';
