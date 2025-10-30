/**
 * Reset Password Page
 * 
 * Handles password reset with token validation
 */

import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';
import { useAuth } from '@/features/auth/hooks';
import type { ResetPasswordFormData } from '@/features/auth/validation-schemas';
import type { AuthError } from '@/features/auth/types';
import { PUBLIC_ROUTES } from '@/routing/public/route-definitions';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  
  const { resetPassword, isLoading, error, clearError } = useAuth();

  useEffect(() => {
    // Clear any existing errors when component mounts
    clearError();
  }, [clearError]);

  const handleSubmit = async (data: ResetPasswordFormData) => {
    try {
      clearError();
      await resetPassword({ ...data, token: token || '' });
      
      // Password reset successful - redirect to login
      navigate(PUBLIC_ROUTES.LOGIN, {
        replace: true,
        state: {
          message: 'Password reset successfully. Please sign in with your new password.',
          type: 'success',
        },
      });
    } catch (err) {
      // Error is handled by the auth store
      console.error('Password reset failed:', err);
    }
  };

  // If no token is provided in URL, show error
  if (!token) {
    return (
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Invalid Reset Link
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                This password reset link is invalid or has expired.
              </p>
              <a
                href={PUBLIC_ROUTES.FORGOT_PASSWORD}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Request New Reset Link
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Reset Password
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password below.
          </p>
        </div>

        <ResetPasswordForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
          token={token}
        />
      </div>
    </div>
  );
};

export default ResetPasswordPage;