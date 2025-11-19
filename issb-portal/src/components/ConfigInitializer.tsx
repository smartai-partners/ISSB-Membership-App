/**
 * ConfigInitializer Component
 * Initializes application configuration before rendering child components
 */

import React from 'react';
import { useAppConfig } from '@/hooks/useAppConfig';
import { Loader2, AlertCircle } from 'lucide-react';

interface ConfigInitializerProps {
  children: React.ReactNode;
}

export const ConfigInitializer: React.FC<ConfigInitializerProps> = ({ children }) => {
  const { isLoading, isError, error, initialized, refetch } = useAppConfig();

  // Loading state
  if (isLoading || !initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Your Experience</h2>
          <p className="text-gray-600 text-sm">Personalizing your ISSB dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900">Configuration Error</h2>
          </div>
          <p className="text-gray-700 mb-6">
            We encountered an issue loading your personalized settings. You can continue with default
            settings or try again.
          </p>
          <div className="text-sm text-gray-600 mb-6 bg-gray-50 p-3 rounded border border-gray-200">
            <p className="font-mono text-xs break-words">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => refetch()}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Config loaded successfully, render children
  return <>{children}</>;
};
