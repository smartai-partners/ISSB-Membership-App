import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { usePermissionStore } from '@/store/permissionStore';

// Layout Components
import MemberLayout from '@/layouts/MemberLayout';

// Page Components
import DashboardPage from '@/pages/member/DashboardPage';
import NotFoundPage from '@/pages/NotFoundPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';

// Protected Route Component with Role-based Access
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  allowedTiers?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [], 
  allowedTiers = [] 
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const { hasRole, hasTier } = usePermissionStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && allowedRoles.length > 0 && !hasRole(user, allowedRoles)) {
    return <UnauthorizedPage />;
  }

  if (user && allowedTiers.length > 0 && !hasTier(user, allowedTiers)) {
    return <UnauthorizedPage />;
  }

  return <>{children}</>;
};

// Navigation Guard for Member Dashboard
const MemberDashboardGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  
  // Ensure user has at least member access
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const DashboardRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Main Dashboard - Accessible to all authenticated users */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MemberDashboardGuard>
              <MemberLayout>
                <DashboardPage />
              </MemberLayout>
            </MemberDashboardGuard>
          </ProtectedRoute>
        }
      />

      {/* Dashboard Analytics - Members only */}
      <Route
        path="/analytics"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberDashboardGuard>
              <MemberLayout>
                <DashboardPage showAnalytics />
              </MemberLayout>
            </MemberDashboardGuard>
          </ProtectedRoute>
        }
      />

      {/* Dashboard Settings - Members can customize their dashboard */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberDashboardGuard>
              <MemberLayout>
                <DashboardPage showSettings />
              </MemberLayout>
            </MemberDashboardGuard>
          </ProtectedRoute>
        }
      />

      {/* Quick Actions - Member tier based access */}
      <Route
        path="/quick-actions"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberDashboardGuard>
              <MemberLayout>
                <DashboardPage showQuickActions />
              </MemberLayout>
            </MemberDashboardGuard>
          </ProtectedRoute>
        }
      />

      {/* Member Stats Dashboard - Enhanced view for active members */}
      <Route
        path="/stats"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberDashboardGuard>
              <MemberLayout>
                <DashboardPage showStats />
              </MemberLayout>
            </MemberDashboardGuard>
          </ProtectedRoute>
        }
      />

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default DashboardRoutes;