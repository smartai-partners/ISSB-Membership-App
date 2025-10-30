// Example authentication hook showing how to integrate the auth forms
import { useState, useCallback } from 'react';
import type {
  LoginFormData,
  RegisterFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
  EmailVerificationFormData,
  AuthError,
  AuthResponse,
} from '../types';

// Example auth service (replace with your actual implementation)
const authService = {
  login: async (data: LoginFormData): Promise<AuthResponse> => {
    // Replace with your actual API call
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  register: async (data: RegisterFormData): Promise<AuthResponse> => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  requestPasswordReset: async (data: ForgotPasswordFormData): Promise<AuthResponse> => {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  resetPassword: async (data: ResetPasswordFormData): Promise<AuthResponse> => {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  verifyEmail: async (data: EmailVerificationFormData): Promise<AuthResponse> => {
    const response = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  resendVerificationCode: async (email: string): Promise<AuthResponse> => {
    const response = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return response.json();
  },

  socialLogin: async (provider: 'google' | 'facebook' | 'github' | 'linkedin'): Promise<AuthResponse> => {
    // Redirect to social login provider
    window.location.href = `/api/auth/social/${provider}`;
    return { success: true };
  },
};

// Custom hook for authentication forms
export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const handleLogin = useCallback(async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login(data);
      
      if (!response.success) {
        throw {
          message: response.error || 'Login failed',
          code: 'LOGIN_FAILED',
        };
      }

      // Store authentication tokens if provided
      if (response.data?.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      if (response.data?.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }

      return response;
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRegister = useCallback(async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.register(data);
      
      if (!response.success) {
        throw {
          message: response.error || 'Registration failed',
          code: 'REGISTRATION_FAILED',
        };
      }

      return response;
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleForgotPassword = useCallback(async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.requestPasswordReset(data);
      
      if (!response.success) {
        throw {
          message: response.error || 'Failed to send reset email',
          code: 'RESET_EMAIL_FAILED',
        };
      }

      return response;
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleResetPassword = useCallback(async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.resetPassword(data);
      
      if (!response.success) {
        throw {
          message: response.error || 'Password reset failed',
          code: 'RESET_PASSWORD_FAILED',
        };
      }

      return response;
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleEmailVerification = useCallback(async (data: EmailVerificationFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.verifyEmail(data);
      
      if (!response.success) {
        throw {
          message: response.error || 'Email verification failed',
          code: 'EMAIL_VERIFICATION_FAILED',
        };
      }

      return response;
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleResendVerification = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.resendVerificationCode(email);
      
      if (!response.success) {
        throw {
          message: response.error || 'Failed to resend verification code',
          code: 'RESEND_FAILED',
        };
      }

      return response;
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSocialLogin = useCallback(async (provider: 'google' | 'facebook' | 'github' | 'linkedin') => {
    try {
      await authService.socialLogin(provider);
      // Note: This will redirect, so the function may not complete
    } catch (err) {
      const authError = err as AuthError;
      setError(authError);
      throw authError;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/auth/login';
  }, []);

  const isAuthenticated = useCallback(() => {
    return !!localStorage.getItem('authToken');
  }, []);

  return {
    // State
    isLoading,
    error,
    
    // Actions
    handleLogin,
    handleRegister,
    handleForgotPassword,
    handleResetPassword,
    handleEmailVerification,
    handleResendVerification,
    handleSocialLogin,
    logout,
    isAuthenticated,
    
    // Clear error
    clearError: () => setError(null),
  };
};

// Example usage in a component
export const AuthExample: React.FC = () => {
  const {
    isLoading,
    error,
    handleLogin,
    handleRegister,
    handleForgotPassword,
    handleResetPassword,
    handleEmailVerification,
    handleResendVerification,
    handleSocialLogin,
    clearError,
  } = useAuth();

  // You can now use these handlers with the auth forms:
  // <LoginForm onSubmit={handleLogin} onSocialLogin={handleSocialLogin} isLoading={isLoading} error={error} />
  // <RegisterForm onSubmit={handleRegister} onSocialLogin={handleSocialLogin} isLoading={isLoading} error={error} />
  // <ForgotPasswordForm onSubmit={handleForgotPassword} isLoading={isLoading} error={error} />
  // <ResetPasswordForm onSubmit={handleResetPassword} isLoading={isLoading} error={error} />
  // <EmailVerificationForm onSubmit={handleEmailVerification} onResendCode={handleResendVerification} isLoading={isLoading} error={error} />

  return null; // This is just a usage example
};
