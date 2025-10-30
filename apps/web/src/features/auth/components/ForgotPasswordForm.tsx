// Forgot password form component with React Hook Form and Zod validation
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../validation-schemas';
import type { AuthError, FormState } from '../types';

interface ForgotPasswordFormProps {
  onSubmit: (data: ForgotPasswordFormData) => Promise<void>;
  isLoading?: boolean;
  error?: AuthError | null;
  successMessage?: string;
  redirectToLogin?: string;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSubmit,
  isLoading: externalLoading,
  error: externalError,
  successMessage,
  redirectToLogin = '/auth/login',
}) => {
  const [formState, setFormState] = useState<FormState>({
    isLoading: false,
    isSuccess: false,
    error: null,
    successMessage,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const isLoading = externalLoading || formState.isLoading;

  const handleFormSubmit = async (data: ForgotPasswordFormData) => {
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
        successMessage: 'Password reset instructions have been sent to your email address. Please check your inbox.',
      }));
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
        message: authError.message || 'Failed to send password reset email. Please try again.',
      });
    }
  };

  const currentError = externalError || formState.error;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Forgot Password?</CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          No worries! Enter your email address and we'll send you a link to reset your password.
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
                <p className="font-medium">Email Sent!</p>
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

        {!formState.isSuccess ? (
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                {...register('email')}
                disabled={isLoading}
                error={errors.email?.message}
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="w-full"
              loading={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-center text-sm text-gray-600">
              <p>Didn't receive the email?</p>
              <p>Check your spam folder or try again in a few minutes.</p>
            </div>
            
            <Button
              variant="outline"
              onClick={() => {
                setFormState(prev => ({
                  ...prev,
                  isSuccess: false,
                  successMessage: undefined,
                }));
              }}
              className="w-full"
              disabled={isLoading}
            >
              Send Again
            </Button>
          </div>
        )}

        {/* Help Text */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Remember your password?{' '}
            <Link
              to={redirectToLogin}
              className="text-blue-600 hover:underline font-medium"
            >
              Back to sign in
            </Link>
          </p>
        </div>

        {/* Additional Help */}
        <div className="border-t pt-4">
          <div className="text-center text-xs text-gray-500">
            <p>Need help? Contact our{' '}
              <Link to="/support" className="text-blue-600 hover:underline">
                support team
              </Link>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ForgotPasswordForm;
