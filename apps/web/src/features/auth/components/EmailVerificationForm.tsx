// Email verification form component with React Hook Form and Zod validation
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { emailVerificationSchema, type EmailVerificationFormData } from '../validation-schemas';
import type { AuthError, FormState } from '../types';

interface EmailVerificationFormProps {
  onSubmit: (data: EmailVerificationFormData) => Promise<void>;
  onResendCode?: (email: string) => Promise<void>;
  isLoading?: boolean;
  error?: AuthError | null;
  successMessage?: string;
  redirectToDashboard?: string;
  redirectToLogin?: string;
  autoFillEmail?: string;
}

export const EmailVerificationForm: React.FC<EmailVerificationFormProps> = ({
  onSubmit,
  onResendCode,
  isLoading: externalLoading,
  error: externalError,
  successMessage,
  redirectToDashboard = '/dashboard',
  redirectToLogin = '/auth/login',
  autoFillEmail,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formState, setFormState] = useState<FormState>({
    isLoading: false,
    isSuccess: false,
    error: null,
    successMessage,
  });
  const [resendCooldown, setResendCooldown] = useState(0);
  const [countdown, setCountdown] = useState(0);

  // Extract email from URL parameters or props
  const emailFromUrl = searchParams.get('email') || '';
  const email = autoFillEmail || emailFromUrl;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<EmailVerificationFormData>({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: {
      email: email || '',
      verificationCode: '',
    },
  });

  const isLoading = externalLoading || formState.isLoading;

  // Handle cooldown for resend button
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleFormSubmit = async (data: EmailVerificationFormData) => {
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
        successMessage: 'Email verified successfully! Redirecting...',
      }));

      // Redirect after successful verification
      setTimeout(() => {
        navigate(redirectToDashboard);
      }, 2000);
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
        message: authError.message || 'Verification failed. Please check your code and try again.',
      });
    }
  };

  const handleResendCode = async () => {
    if (!email || !onResendCode || countdown > 0) return;

    setFormState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      await onResendCode(email);
      setFormState(prev => ({
        ...prev,
        isLoading: false,
        successMessage: 'Verification code resent! Please check your email.',
      }));
      
      // Start cooldown
      setCountdown(60);
    } catch (err) {
      const authError = err as AuthError;
      setFormState(prev => ({
        ...prev,
        isLoading: false,
        error: authError,
      }));
    }
  };

  const currentError = externalError || formState.error;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Verify Your Email</CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          We've sent a verification code to{' '}
          {email ? (
            <span className="font-medium text-gray-900">{email}</span>
          ) : (
            'your email address'
          )}
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
                <p className="font-medium">Email Verified!</p>
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
            {/* Email Field (hidden if auto-filled) */}
            {!email && (
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
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            )}

            {/* Verification Code Field */}
            <div className="space-y-2">
              <label htmlFor="verificationCode" className="text-sm font-medium">
                Verification Code
              </label>
              <Input
                id="verificationCode"
                type="text"
                placeholder="Enter 6-digit code"
                {...register('verificationCode')}
                disabled={isLoading}
                error={errors.verificationCode?.message}
                className="text-center text-lg tracking-widest"
                maxLength={6}
              />
              {errors.verificationCode && (
                <p className="text-sm text-red-600">{errors.verificationCode.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="w-full"
              loading={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </Button>
          </form>
        )}

        {/* Resend Code Section */}
        {!formState.isSuccess && (
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Didn't receive the code?
                </span>
              </div>
            </div>

            <div className="text-center space-y-2">
              {countdown > 0 ? (
                <p className="text-sm text-gray-500">
                  Resend available in {formatTime(countdown)}
                </p>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleResendCode}
                  disabled={isLoading || !onResendCode || !email}
                  className="w-full"
                >
                  {isLoading ? 'Sending...' : 'Resend Code'}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <div className="text-center space-y-2">
          <Link
            to={redirectToLogin}
            className="text-sm text-blue-600 hover:underline block"
          >
            ← Back to sign in
          </Link>
        </div>

        {/* Help Text */}
        <div className="border-t pt-4">
          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>Having trouble? Check your spam folder or</p>
            <p>
              <Link to="/support" className="text-blue-600 hover:underline">
                contact support
              </Link>
            </p>
          </div>
        </div>

        {/* Code Format Helper */}
        {!formState.isSuccess && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex">
              <svg
                className="h-5 w-5 text-blue-400 mr-2 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-sm">
                <p className="text-blue-800 font-medium">Code Format</p>
                <p className="text-blue-700">
                  The code should be 6 digits (e.g., 123456)
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};



export default EmailVerificationForm;
