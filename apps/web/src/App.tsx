import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { usePermissionStore } from '@/store/permissionStore';

// Layout Components
import AuthLayout from '@/layouts/AuthLayout';
import MemberLayout from '@/layouts/MemberLayout';
import BoardLayout from '@/layouts/BoardLayout';
import AdminLayout from '@/layouts/AdminLayout';

// Page Components
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';

// Member Pages
import DashboardPage from '@/pages/member/DashboardPage';
import ProfilePage from '@/pages/member/ProfilePage';
import MembershipPage from '@/pages/member/MembershipPage';
import VolunteerPage from '@/pages/member/VolunteerPage';

// Board Pages
import BoardDashboardPage from '@/pages/board/BoardDashboardPage';
import MemberManagementPage from '@/pages/board/MemberManagementPage';
import ApplicationsPage from '@/pages/board/ApplicationsPage';

// Admin Pages
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import UserManagementPage from '@/pages/admin/UserManagementPage';
import SystemSettingsPage from '@/pages/admin/SystemSettingsPage';
import ReportsPage from '@/pages/admin/ReportsPage';

// Error Pages
import NotFoundPage from '@/pages/NotFoundPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';

// Protected Route Component
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

// Public Route Component (redirect if authenticated)
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    // Redirect based on user role/tier
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { user } = useAuthStore();

  const getLayout = () => {
    if (!user) return null;

    switch (user.role) {
      case 'admin':
        return AdminLayout;
      case 'board':
        return BoardLayout;
      case 'member':
        return MemberLayout;
      default:
        return MemberLayout;
    }
  };

  const Layout = getLayout();

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <HomePage />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <AuthLayout>
                <LoginPage />
              </AuthLayout>
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <AuthLayout>
                <RegisterPage />
              </AuthLayout>
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <AuthLayout>
                <ForgotPasswordPage />
              </AuthLayout>
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {Layout && (
                <Layout>
                  <DashboardPage />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />
        
        {/* Member Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              {Layout && (
                <Layout>
                  <ProfilePage />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/membership"
          element={
            <ProtectedRoute>
              {Layout && (
                <Layout>
                  <MembershipPage />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/volunteering"
          element={
            <ProtectedRoute allowedTiers={['board', 'admin']}>
              {Layout && (
                <Layout>
                  <VolunteerPage />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />

        {/* Board Routes */}
        <Route
          path="/board"
          element={
            <ProtectedRoute allowedRoles={['board', 'admin']}>
              {Layout && (
                <Layout>
                  <BoardDashboardPage />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/board/members"
          element={
            <ProtectedRoute allowedRoles={['board', 'admin']}>
              {Layout && (
                <Layout>
                  <MemberManagementPage />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/board/applications"
          element={
            <ProtectedRoute allowedRoles={['board', 'admin']}>
              {Layout && (
                <Layout>
                  <ApplicationsPage />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              {Layout && (
                <Layout>
                  <AdminDashboardPage />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              {Layout && (
                <Layout>
                  <UserManagementPage />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              {Layout && (
                <Layout>
                  <SystemSettingsPage />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              {Layout && (
                <Layout>
                  <ReportsPage />
                </Layout>
              )}
            </ProtectedRoute>
          }
        />

        {/* Error Routes */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
};

export default App;