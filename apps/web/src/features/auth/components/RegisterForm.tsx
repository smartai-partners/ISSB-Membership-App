// Register form component with React Hook Form and Zod validation
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { registerSchema, type RegisterFormData } from '../validation-schemas';
import type { AuthError, FormState, SocialLoginProvider } from '../types';

// Social login provider configurations
const socialProviders: SocialLoginProvider[] = [
  { provider: 'google', redirectUrl: '/auth/google' },
  { provider: 'facebook', redirectUrl: '/auth/facebook' },
  { provider: 'github', redirectUrl: '/auth/github' },
  { provider: 'linkedin', redirectUrl: '/auth/linkedin' },
];

interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => Promise<void>;
  onSocialLogin?: (provider: SocialLoginProvider['provider']) => Promise<void>;
  isLoading?: boolean;
  error?: AuthError | null;
  successMessage?: string;
  redirectUrl?: string;
  showSocialLogin?: boolean;
  requireEmailVerification?: boolean;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  onSocialLogin,
  isLoading: externalLoading,
  error: externalError,
  successMessage,
  redirectUrl = '/auth/verify-email',
  showSocialLogin = true,
  requireEmailVerification = true,
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
    watch,
    setError,
    clearErrors,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      agreeToTerms: false,
    },
  });

  const isLoading = externalLoading || formState.isLoading;
  const password = watch('password');

  const handleFormSubmit = async (data: RegisterFormData) => {
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
        successMessage: requireEmailVerification
          ? 'Registration successful! Please check your email for verification.'
          : 'Registration successful! Redirecting...',
      }));

      // Redirect after successful registration
      setTimeout(() => {
        window.location.href = redirectUrl;
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
        message: authError.message || 'Registration failed. Please try again.',
      });
    }
  };

  const handleSocialLogin = async (provider: SocialLoginProvider['provider']) => {
    if (!onSocialLogin) return;

    setFormState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      await onSocialLogin(provider);
      // Social login success handling
      window.location.href = '/dashboard';
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

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          Join us today! Please fill in your details.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Success Message */}
        {formState.isSuccess && formState.successMessage && (
          <div className="p-3 text-sm bg-green-50 border border-green-200 rounded-md text-green-800">
            {formState.successMessage}
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

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-sm font-medium">
                First Name
              </label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                {...register('firstName')}
                disabled={isLoading}
                error={errors.firstName?.message}
              />
              {errors.firstName && (
                <p className="text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="lastName" className="text-sm font-medium">
                Last Name
              </label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                {...register('lastName')}
                disabled={isLoading}
                error={errors.lastName?.message}
              />
              {errors.lastName && (
                <p className="text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="john.doe@example.com"
              {...register('email')}
              disabled={isLoading}
              error={errors.email?.message}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Create a strong password"
              {...register('password')}
              disabled={isLoading}
              error={errors.password?.message}
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
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              {...register('confirmPassword')}
              disabled={isLoading}
              error={errors.confirmPassword?.message}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-2">
            <input
              id="agreeToTerms"
              type="checkbox"
              {...register('agreeToTerms')}
              disabled={isLoading}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="agreeToTerms" className="text-sm text-gray-600">
              I agree to the{' '}
              <Link to="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>
          {errors.agreeToTerms && (
            <p className="text-sm text-red-600">{errors.agreeToTerms.message}</p>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || isSubmitting}
            className="w-full"
            loading={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        {/* Divider */}
        {showSocialLogin && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
        )}

        {/* Social Login Buttons */}
        {showSocialLogin && (
          <div className="grid grid-cols-2 gap-3">
            {socialProviders.map((provider) => (
              <Button
                key={provider.provider}
                variant="outline"
                disabled={isLoading}
                onClick={() => handleSocialLogin(provider.provider)}
                className="w-full"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  {/* Social provider icons would go here */}
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {provider.provider.charAt(0).toUpperCase() + provider.provider.slice(1)}
              </Button>
            ))}
          </div>
        )}

        {/* Login Link */}
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link
            to="/auth/login"
            className="text-blue-600 hover:underline font-medium"
          >
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default RegisterForm;
