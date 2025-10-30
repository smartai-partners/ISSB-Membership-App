// Login form component with React Hook Form and Zod validation
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { loginSchema, type LoginFormData } from '../validation-schemas';
import type { AuthError, FormState, SocialLoginProvider } from '../types';

// Social login provider configurations
const socialProviders: SocialLoginProvider[] = [
  { provider: 'google', redirectUrl: '/auth/google' },
  { provider: 'facebook', redirectUrl: '/auth/facebook' },
  { provider: 'github', redirectUrl: '/auth/github' },
  { provider: 'linkedin', redirectUrl: '/auth/linkedin' },
];

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  onSocialLogin?: (provider: SocialLoginProvider['provider']) => Promise<void>;
  isLoading?: boolean;
  error?: AuthError | null;
  successMessage?: string;
  redirectUrl?: string;
  showSocialLogin?: boolean;
  showRememberMe?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onSocialLogin,
  isLoading: externalLoading,
  error: externalError,
  successMessage,
  redirectUrl = '/dashboard',
  showSocialLogin = true,
  showRememberMe = true,
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
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const isLoading = externalLoading || formState.isLoading;

  const handleFormSubmit = async (data: LoginFormData) => {
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
        successMessage: 'Login successful! Redirecting...',
      }));
      
      // Redirect after successful login
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 1000);
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
        message: authError.message || 'Login failed. Please try again.',
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
      window.location.href = redirectUrl;
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
        <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          Welcome back! Please sign in to your account.
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
          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
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
              placeholder="Enter your password"
              {...register('password')}
              disabled={isLoading}
              error={errors.password?.message}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me and Forgot Password */}
          <div className="flex items-center justify-between">
            {showRememberMe && (
              <div className="flex items-center space-x-2">
                <input
                  id="rememberMe"
                  type="checkbox"
                  {...register('rememberMe')}
                  disabled={isLoading}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="rememberMe" className="text-sm text-gray-600">
                  Remember me
                </label>
              </div>
            )}
            
            <Link
              to="/auth/forgot-password"
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || isSubmitting}
            className="w-full"
            loading={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
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

        {/* Register Link */}
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Link
            to="/auth/register"
            className="text-blue-600 hover:underline font-medium"
          >
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
