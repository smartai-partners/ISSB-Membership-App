/**
 * Unauthorized Page (403)
 * 
 * Displayed when user doesn't have permission to access a resource
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { PUBLIC_ROUTES } from '@/routing/public/route-definitions';

const UnauthorizedPage: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  const getContactInfo = () => {
    if (user?.role === 'member') {
      return {
        title: 'Member Area',
        description: 'This area is restricted to members only.',
        action: 'Contact a board member for access.',
      };
    }
    if (user?.role === 'board') {
      return {
        title: 'Board Area',
        description: 'This area is restricted to board members only.',
        action: 'Contact the admin for access.',
      };
    }
    if (user?.role === 'admin') {
      return {
        title: 'Admin Area',
        description: 'This area is restricted to administrators only.',
        action: 'Contact the system administrator.',
      };
    }
    return {
      title: 'Restricted Access',
      description: 'This area requires special permissions to access.',
      action: 'Contact the site administrator for access.',
    };
  };

  const contactInfo = getContactInfo();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {/* Access Denied Icon */}
            <div className="mx-auto h-16 w-16 text-red-400 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-full w-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Access Denied
            </h1>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {contactInfo.title}
            </h2>
            
            <p className="text-lg text-gray-600 mb-6">
              {contactInfo.description}
            </p>

            {isAuthenticated ? (
              <div className="space-y-4 mb-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-800">
                        {contactInfo.action}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link to="/dashboard">
                    <Button className="w-full">
                      Go to Dashboard
                    </Button>
                  </Link>
                  
                  <Button
                    variant="outline"
                    onClick={() => window.history.back()}
                    className="w-full"
                  >
                    Go Back
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                <p className="text-gray-600 mb-4">
                  Please sign in to access this area.
                </p>
                
                <div className="space-y-3">
                  <Link to={PUBLIC_ROUTES.LOGIN}>
                    <Button className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  
                  <Link to={PUBLIC_ROUTES.REGISTER}>
                    <Button variant="outline" className="w-full">
                      Create Account
                    </Button>
                  </Link>
                  
                  <Button
                    variant="outline"
                    onClick={() => window.history.back()}
                    className="w-full"
                  >
                    Go Back
                  </Button>
                </div>
              </div>
            )}

            {/* Help Links */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                Need Help?
              </h3>
              <div className="space-y-2 text-sm">
                <Link to={PUBLIC_ROUTES.CONTACT} className="block text-blue-600 hover:text-blue-500">
                  → Contact Support
                </Link>
                <Link to={PUBLIC_ROUTES.HOME} className="block text-blue-600 hover:text-blue-500">
                  → Return to Home
                </Link>
                <Link to={PUBLIC_ROUTES.ABOUT} className="block text-blue-600 hover:text-blue-500">
                  → Learn About Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;