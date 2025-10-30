/**
 * Social Auth Callback Page
 * 
 * Handles OAuth callback from social providers
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks';
import { useAuthStore } from '@/store/authStore';
import { PUBLIC_ROUTES } from '@/routing/public/route-definitions';
import { Card, CardContent } from '@/components/ui/Card';

const SocialAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { provider } = useParams<{ provider: string }>();
  const { handleSocialAuthCallback, isLoading } = useAuth();
  const { handleRedirect } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setError(null);
        
        // Get the current URL and parameters
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        // Combine search and hash parameters
        const allParams = new URLSearchParams();
        urlParams.forEach((value, key) => allParams.set(key, value));
        hashParams.forEach((value, key) => allParams.set(key, value));

        // Handle the social auth callback
        await handleSocialAuthCallback(provider!, Object.fromEntries(allParams));
        
        // Get stored redirect path from sessionStorage
        const redirectPath = sessionStorage.getItem('auth_redirect_path') || '/dashboard';
        sessionStorage.removeItem('auth_redirect_path');
        
        // Redirect to the intended destination
        navigate(handleRedirect(redirectPath), { replace: true });
      } catch (err) {
        console.error('Social auth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        
        // Redirect to login after a delay
        setTimeout(() => {
          navigate(PUBLIC_ROUTES.LOGIN, { replace: true });
        }, 3000);
      }
    };

    if (provider) {
      handleCallback();
    } else {
      setError('Invalid provider');
      setTimeout(() => {
        navigate(PUBLIC_ROUTES.LOGIN, { replace: true });
      }, 3000);
    }
  }, [provider, handleSocialAuthCallback, navigate, handleRedirect]);

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              {isLoading && !error && (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Completing Authentication
                  </h2>
                  <p className="text-sm text-gray-600">
                    Please wait while we sign you in with {provider}...
                  </p>
                </>
              )}
              
              {error && (
                <>
                  <div className="text-red-600 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Authentication Failed
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    {error}
                  </p>
                  <p className="text-xs text-gray-500">
                    Redirecting to login page...
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SocialAuthCallbackPage;