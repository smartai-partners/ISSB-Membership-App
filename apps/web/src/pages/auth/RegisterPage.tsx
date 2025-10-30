/**
 * Register Page
 * 
 * Handles user registration with form validation and social login options
 */

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/features/auth/hooks';
import type { RegisterFormData } from '@/features/auth/validation-schemas';
import type { AuthError } from '@/features/auth/types';
import { PUBLIC_ROUTES } from '@/routing/public/route-definitions';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  
  const { register, registerWithSocial, isLoading, error, clearError } = useAuth();
  const { handleRedirect } = useAuthStore();

  const handleSubmit = async (data: RegisterFormData) => {
    try {
      clearError();
      await register(data);
      
      // Registration successful - user will be redirected to email verification
      // or login page based on the auth configuration
      console.log('Registration successful');
    } catch (err) {
      // Error is handled by the auth store
      console.error('Registration failed:', err);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'github' | 'linkedin') => {
    try {
      clearError();
      await registerWithSocial(provider);
      
      // Handle redirect after successful social registration
      const redirectPath = handleRedirect(redirectParam || undefined);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      // Error is handled by the auth store
      console.error('Social registration failed:', err);
    }
  };

  // Get redirect URL for form
  const redirectUrl = PUBLIC_ROUTES.VERIFY_EMAIL;

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <RegisterForm
          onSubmit={handleSubmit}
          onSocialLogin={handleSocialLogin}
          isLoading={isLoading}
          error={error}
          redirectUrl={redirectUrl}
          showSocialLogin={true}
          requireEmailVerification={true}
        />
      </div>
    </div>
  );
};

export default RegisterPage;