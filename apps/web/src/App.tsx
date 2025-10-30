/**
 * Main application component using the new routing infrastructure
 */

import React from 'react';
import { AppRouter } from './routing/router';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import './styles/globals.css';

const App: React.FC = () => {
  // Initialize authentication store if needed
  React.useEffect(() => {
    // Initialize any app-level authentication logic
    // This could check for stored tokens, restore session, etc.
    const initializeAuth = async () => {
      // Check for stored tokens and restore session if needed
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('auth_user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          // Restore auth state if needed
          // This would typically involve validating the token with the server
        } catch (error) {
          console.error('Failed to restore auth session:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      }
    };
    
    initializeAuth();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <AppRouter />
      </div>
    </BrowserRouter>
  );
};

export default App;