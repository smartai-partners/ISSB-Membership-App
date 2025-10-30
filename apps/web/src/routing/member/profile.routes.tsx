import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { usePermissionStore } from '@/store/permissionStore';

// Layout Components
import MemberLayout from '@/layouts/MemberLayout';

// Page Components
import ProfilePage from '@/pages/member/ProfilePage';
import NotFoundPage from '@/pages/NotFoundPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';

// Protected Route Component with Enhanced Role-based Access
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  allowedTiers?: string[];
  requiresOwnership?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [], 
  allowedTiers = [],
  requiresOwnership = false
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const { hasRole, hasTier } = usePermissionStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (user && allowedRoles.length > 0 && !hasRole(user, allowedRoles)) {
    return <UnauthorizedPage />;
  }

  // Check tier-based access
  if (user && allowedTiers.length > 0 && !hasTier(user, allowedTiers)) {
    return <UnauthorizedPage />;
  }

  // Check ownership requirement (for viewing/editing own profile)
  if (requiresOwnership && user?.id !== user?.id) {
    // This would be extended to check URL params or props for actual user ID
    return <UnauthorizedPage />;
  }

  return <>{children}</>;
};

// Profile-specific Navigation Guard
const ProfileGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Edit Mode Guard - Prevents access to edit mode for suspended/inactive users
const EditModeGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Suspended or inactive users cannot edit their profiles
  if (user.status === 'suspended' || user.status === 'inactive') {
    return (
      <UnauthorizedPage 
        message="Your account status does not allow profile modifications. Please contact support for assistance." 
      />
    );
  }

  return <>{children}</>;
};

// Admin View Guard - Allows admins to view any profile
const AdminViewGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  const { hasRole } = usePermissionStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin can view any profile
  return <>{children}</>;
};

const ProfileRoutes: React.FC = () => {
  return (
    <Routes>
      {/* View Own Profile - Members can only view their own profile */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <ProfileGuard>
              <MemberLayout>
                <ProfilePage viewMode="view" />
              </MemberLayout>
            </ProfileGuard>
          </ProtectedRoute>
        }
      />

      {/* Edit Own Profile - Members can edit their own profile */}
      <Route
        path="/edit"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <ProfileGuard>
              <EditModeGuard>
                <MemberLayout>
                  <ProfilePage viewMode="edit" />
                </MemberLayout>
              </EditModeGuard>
            </ProfileGuard>
          </ProtectedRoute>
        }
      />

      {/* Profile Picture Upload - Members can upload/change their profile picture */}
      <Route
        path="/photo"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <ProfileGuard>
              <EditModeGuard>
                <MemberLayout>
                  <ProfilePage viewMode="photo-upload" />
                </MemberLayout>
              </EditModeGuard>
            </ProfileGuard>
          </ProtectedRoute>
        }
      />

      {/* Profile Privacy Settings - Members can manage privacy preferences */}
      <Route
        path="/privacy"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <ProfileGuard>
              <MemberLayout>
                <ProfilePage viewMode="privacy" />
              </MemberLayout>
            </ProfileGuard>
          </ProtectedRoute>
        }
      />

      {/* Security Settings - Password and 2FA management */}
      <Route
        path="/security"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <ProfileGuard>
              <MemberLayout>
                <ProfilePage viewMode="security" />
              </MemberLayout>
            </ProfileGuard>
          </ProtectedRoute>
        }
      />

      {/* Notification Preferences - Manage notification settings */}
      <Route
        path="/notifications"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <ProfileGuard>
              <MemberLayout>
                <ProfilePage viewMode="notifications" />
              </MemberLayout>
            </ProfileGuard>
          </ProtectedRoute>
        }
      />

      {/* Admin Profile Management - Admin can view and edit any profile */}
      <Route
        path="/admin/:userId"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminViewGuard>
              <MemberLayout>
                <ProfilePage viewMode="admin" />
              </MemberLayout>
            </AdminViewGuard>
          </ProtectedRoute>
        }
      />

      {/* Admin Profile Management - Board can view member profiles */}
      <Route
        path="/board/:userId"
        element={
          <ProtectedRoute allowedRoles={['board', 'admin']}>
            <AdminViewGuard>
              <MemberLayout>
                <ProfilePage viewMode="board" />
              </MemberLayout>
            </AdminViewGuard>
          </ProtectedRoute>
        }
      />

      {/* Member Directory Entry - View other members (if public) */}
      <Route
        path="/directory/:userId"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberLayout>
              <ProfilePage viewMode="directory" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default ProfileRoutes;