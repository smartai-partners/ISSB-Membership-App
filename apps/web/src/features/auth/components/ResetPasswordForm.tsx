// Reset password form component with React Hook Form and Zod validation
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { resetPasswordSchema, type ResetPasswordFormData } from '../validation-schemas';
import type { AuthError, FormState } from '../types';

interface ResetPasswordFormProps {
  onSubmit: (data: ResetPasswordFormData) => Promise<void>;
  isLoading?: boolean;
  error?: AuthError | null;
  successMessage?: string;
  redirectToLogin?: string;
  redirectToDashboard?: string;
  requireCurrentPassword?: boolean;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  onSubmit,
  isLoading: externalLoading,
  error: externalError,
  successMessage,
  redirectToLogin = '/auth/login',
  redirectToDashboard = '/dashboard',
  requireCurrentPassword = false,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formState, setFormState] = useState<FormState>({
    isLoading: false,
    isSuccess: false,
    error: null,
    successMessage,
  });

  // Extract token from URL parameters
  const token = searchParams.get('token') || '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setError,
    clearErrors,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      password: '',
      confirmPassword: '',
    },
  });

  const isLoading = externalLoading || formState.isLoading;
  const password = watch('password');

  // Redirect if no token provided
  useEffect(() => {
    if (!token) {
      navigate('/auth/forgot-password', {
        state: {
          error: {
            message: 'Invalid or expired reset token. Please request a new password reset.',
          },
        },
      });
    }
  }, [token, navigate]);

  const handleFormSubmit = async (data: ResetPasswordFormData) => {
    clearErrors();
    setFormState(prev => ({
      ...prev,
      isLoading: true,
      isSuccess: false,
      error: null,
    }));

    try {
      await onSubmit(data);
      setFormState(prev => ({
        ...prev,
        isLoading: false,
        isSuccess: true,
        successMessage: 'Password has been successfully reset! You can now sign in with your new password.',
      }));

      // Redirect after successful password reset
      setTimeout(() => {
        navigate(redirectToLogin, {
          state: {
            message: 'Password reset successful! Please sign in with your new password.',
          },
        });
      }, 3000);
    } catch (err) {
      const authError = err as AuthError;
      setFormState(prev => ({
        ...prev,
        isLoading: false,
        isSuccess: false,
        error: authError,
      }));

      // Set form-level error
      setError('root', {
        type: 'manual',
        message: authError.message || 'Failed to reset password. Please try again.',
      });
    }
  };

  const currentError = externalError || formState.error;

  // Show loading state if token is being validated
  if (!token) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-600">Validating reset token...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          Enter your new password below.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Success Message */}
        {formState.isSuccess && formState.successMessage && (
          <div className="p-4 text-sm bg-green-50 border border-green-200 rounded-md text-green-800">
            <div className="flex items-start space-x-2">
              <svg
                className="h-5 w-5 text-green-400 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="font-medium">Password Reset Successful!</p>
                <p>{formState.successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {currentError && (
          <div className="p-3 text-sm bg-red-50 border border-red-200 rounded-md text-red-800">
            {currentError.message}
          </div>
        )}

        {/* Form Errors */}
        {errors.root && (
          <div className="p-3 text-sm bg-red-50 border border-red-200 rounded-md text-red-800">
            {errors.root.message}
          </div>
        )}

        {!formState.isSuccess && (
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* Hidden Token Field */}
            <input type="hidden" {...register('token')} value={token} />

            {/* New Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                New Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your new password"
                {...register('password')}
                disabled={isLoading}
                error={errors.password?.message}
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
              {password && (
                <div className="text-xs text-gray-500 space-y-1">
                  <p className={password.length >= 8 ? 'text-green-600' : 'text-red-600'}>
                    • At least 8 characters
                  </p>
                  <p className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-red-600'}>
                    • One uppercase letter
                  </p>
                  <p className={/[a-z]/.test(password) ? 'text-green-600' : 'text-red-600'}>
                    • One lowercase letter
                  </p>
                  <p className={/[0-9]/.test(password) ? 'text-green-600' : 'text-red-600'}>
                    • One number
                  </p>
                  <p className={/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : 'text-red-600'}>
                    • One special character
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm New Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your new password"
                {...register('confirmPassword')}
                disabled={isLoading}
                error={errors.confirmPassword?.message}
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="w-full"
              loading={isLoading}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </form>
        )}

        {/* Back to Login Link */}
        <div className="text-center">
          <Link
            to={redirectToLogin}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to sign in
          </Link>
        </div>

        {/* Security Note */}
        <div className="border-t pt-4">
          <div className="text-center text-xs text-gray-500">
            <p className="flex items-center justify-center space-x-1">
              <svg
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Your password is encrypted and secure</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResetPasswordForm;
