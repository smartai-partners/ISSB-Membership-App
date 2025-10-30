/**
 * Login Page
 * 
 * Handles user authentication with email/password and social login options
 */

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/features/auth/hooks';
import type { LoginFormData } from '@/features/auth/validation-schemas';
import type { AuthError } from '@/features/auth/types';
import { PUBLIC_ROUTES } from '@/routing/public/route-definitions';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  
  const { login, loginWithSocial, isLoading, error, clearError } = useAuth();
  const { handleRedirect } = useAuthStore();

  const handleSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      await login(data);
      
      // Handle redirect after successful login
      const redirectPath = handleRedirect(redirectParam || undefined);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      // Error is handled by the auth store
      console.error('Login failed:', err);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'github' | 'linkedin') => {
    try {
      clearError();
      await loginWithSocial(provider);
      
      // Handle redirect after successful social login
      const redirectPath = handleRedirect(redirectParam || undefined);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      // Error is handled by the auth store
      console.error('Social login failed:', err);
    }
  };

  // Get redirect URL for form
  const redirectUrl = handleRedirect(redirectParam || undefined);

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm
          onSubmit={handleSubmit}
          onSocialLogin={handleSocialLogin}
          isLoading={isLoading}
          error={error}
          redirectUrl={redirectUrl}
          showSocialLogin={true}
          showRememberMe={true}
        />
      </div>
    </div>
  );
};

export default LoginPage;