/**
 * Email Verification Page
 * 
 * Handles email verification and resend verification email
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { EmailVerificationForm } from '@/features/auth/components/EmailVerificationForm';
import { useAuth } from '@/features/auth/hooks';
import type { AuthError } from '@/features/auth/types';
import { PUBLIC_ROUTES } from '@/routing/public/route-definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const EmailVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  
  const { verifyEmail, resendVerificationEmail, isLoading, error, clearError } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Clear any existing errors when component mounts
    clearError();
    
    // If token is provided, attempt to verify email
    if (token) {
      handleVerification(token);
    }
  }, [token, clearError]);

  const handleVerification = async (verificationToken: string) => {
    try {
      clearError();
      setVerificationStatus('pending');
      await verifyEmail(verificationToken);
      
      setVerificationStatus('success');
      setMessage('Email verified successfully! Redirecting...');
      
      // Redirect after successful verification
      setTimeout(() => {
        const redirectPath = redirectParam || PUBLIC_ROUTES.DASHBOARD;
        navigate(redirectPath, { replace: true });
      }, 2000);
    } catch (err) {
      setVerificationStatus('error');
      console.error('Email verification failed:', err);
    }
  };

  const handleResendVerification = async () => {
    try {
      clearError();
      await resendVerificationEmail();
      
      setMessage('Verification email sent! Please check your inbox.');
    } catch (err) {
      console.error('Resend verification failed:', err);
    }
  };

  // If token is provided, show verification result
  if (token) {
    return (
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                {verificationStatus === 'success' ? 'Email Verified!' : 'Verifying Email...'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {verificationStatus === 'pending' && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600">
                    Verifying your email address...
                  </p>
                </div>
              )}
              
              {verificationStatus === 'success' && (
                <div className="text-center">
                  <div className="text-green-600 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {message}
                  </p>
                </div>
              )}
              
              {verificationStatus === 'error' && (
                <div className="text-center">
                  <div className="text-red-600 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Verification failed. The link may be invalid or expired.
                  </p>
                  <Button
                    onClick={handleResendVerification}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Resend Verification Email
                  </Button>
                </div>
              )}
              
              {error && (
                <div className="mt-4 p-3 text-sm bg-red-50 border border-red-200 rounded-md text-red-800">
                  {error.message}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // No token - show resend verification form
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Verify Email
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Please check your email and click the verification link to activate your account.
          </p>
        </div>

        <EmailVerificationForm
          onResend={handleResendVerification}
          isLoading={isLoading}
          error={error}
          successMessage={message}
        />

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already verified?{' '}
            <a
              href={PUBLIC_ROUTES.LOGIN}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;