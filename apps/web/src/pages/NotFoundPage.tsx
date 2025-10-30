/**
 * Not Found Page (404)
 * 
 * Displayed when a page is not found
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { PUBLIC_ROUTES } from '@/routing/public/route-definitions';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {/* 404 Icon */}
            <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="h-full w-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.007-5.824-2.562M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>

            <h1 className="text-6xl font-bold text-gray-900 mb-4">
              404
            </h1>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Page Not Found
            </h2>
            
            <p className="text-lg text-gray-600 mb-8">
              Sorry, we couldn't find the page you're looking for. 
              The page may have been moved, deleted, or you may have entered an incorrect URL.
            </p>
            
            <div className="space-y-4 mb-8">
              <Link to={PUBLIC_ROUTES.HOME}>
                <Button className="w-full">
                  Return to Home
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

            {/* Helpful Links */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                You might be looking for:
              </h3>
              <div className="space-y-2 text-sm">
                <Link to={PUBLIC_ROUTES.EVENTS} className="block text-blue-600 hover:text-blue-500">
                  → Browse Events
                </Link>
                <Link to={PUBLIC_ROUTES.ABOUT} className="block text-blue-600 hover:text-blue-500">
                  → Learn About Us
                </Link>
                <Link to={PUBLIC_ROUTES.CONTACT} className="block text-blue-600 hover:text-blue-500">
                  → Contact Us
                </Link>
                <Link to={PUBLIC_ROUTES.REGISTER} className="block text-blue-600 hover:text-blue-500">
                  → Join Our Community
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;