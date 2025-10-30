/**
 * Forgot Password Page
 * 
 * Handles password reset requests via email
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';
import { useAuth } from '@/features/auth/hooks';
import type { ForgotPasswordFormData } from '@/features/auth/validation-schemas';
import type { AuthError } from '@/features/auth/types';
import { PUBLIC_ROUTES } from '@/routing/public/route-definitions';

const ForgotPasswordPage: React.FC = () => {
  const { forgotPassword, isLoading, error, clearError } = useAuth();

  const handleSubmit = async (data: ForgotPasswordFormData) => {
    try {
      clearError();
      await forgotPassword(data);
      
      // Password reset email sent successfully
      // The form will show a success message
    } catch (err) {
      // Error is handled by the auth store
      console.error('Forgot password request failed:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Forgot Password
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <ForgotPasswordForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
          successMessage="If an account with that email exists, we've sent a password reset link."
        />

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <Link
              to={PUBLIC_ROUTES.LOGIN}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;