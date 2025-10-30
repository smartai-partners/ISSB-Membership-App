import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { Navigate } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-1 flex-col">
        <main className="flex-1">
          <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
              {/* Logo */}
              <div className="flex justify-center">
                <div className="flex items-center gap-2 text-2xl font-bold text-primary-600 dark:text-primary-500">
                  <svg
                    className="h-10 w-10"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  <span>ISSB Portal</span>
                </div>
              </div>
              <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Welcome
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                Sign in to your account or create a new one
              </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
              <div className="bg-white px-6 py-8 shadow sm:rounded-lg sm:px-10 dark:bg-gray-800">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuthLayout;
