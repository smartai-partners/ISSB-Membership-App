import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { usePermissionStore } from '@/store/permissionStore';

// Layout Components
import MemberLayout from '@/layouts/MemberLayout';

// Individual Route Components
import DashboardRoutes from './dashboard.routes';
import ProfileRoutes from './profile.routes';
import MembershipRoutes from './membership.routes';
import EventRegistrationRoutes from './event-registration.routes';
import VolunteerOpportunitiesRoutes from './volunteer-opportunities.routes';
import ApplicationStatusRoutes from './application-status.routes';

// Error Pages
import NotFoundPage from '@/pages/NotFoundPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';

// Protected Route Component with Comprehensive Role-based Access
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  allowedTiers?: string[];
  requiresActiveMembership?: boolean;
  requiresVolunteerApproval?: boolean;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [], 
  allowedTiers = [],
  requiresActiveMembership = false,
  requiresVolunteerApproval = false,
  redirectTo = '/unauthorized'
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const { hasRole, hasTier } = usePermissionStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (user && allowedRoles.length > 0 && !hasRole(user, allowedRoles)) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check tier-based access
  if (user && allowedTiers.length > 0 && !hasTier(user, allowedTiers)) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check active membership requirement
  if (requiresActiveMembership && user?.status !== 'active') {
    return (
      <UnauthorizedPage 
        message="Active membership required to access this feature. Please renew your membership or contact support for assistance." 
      />
    );
  }

  // Check volunteer approval status
  if (requiresVolunteerApproval && user?.volunteerStatus !== 'approved') {
    return (
      <UnauthorizedPage 
        message="Volunteer approval required to access this feature. Please complete the volunteer application process." 
      />
    );
  }

  return <>{children}</>;
};

// Member Navigation Guard - Ensures user has member access
const MemberNavigationGuard: React.FC<{ 
  children: React.ReactNode; 
  minimumRole?: string;
}> = ({ children, minimumRole = 'member' }) => {
  const { user, isAuthenticated } = useAuthStore();
  const { hasRole } = usePermissionStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has at least member role
  if (user && !hasRole(user, [minimumRole, 'board', 'admin'])) {
    return <UnauthorizedPage />;
  }

  return <>{children}</>;
};

// Member Status Guard - Check user's account status for access
const MemberStatusGuard: React.FC<{ 
  children: React.ReactNode; 
  allowedStatuses?: string[];
  action?: string;
}> = ({ 
  children, 
  allowedStatuses = ['active', 'pending', 'inactive'],
  action = 'access this feature'
}) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Suspended users have very limited access
  if (user.status === 'suspended') {
    return (
      <UnauthorizedPage 
        message={`Your account is suspended. You cannot ${action} at this time. Please contact support for assistance.`} 
      />
    );
  }

  // Check if user's status allows the requested action
  if (!allowedStatuses.includes(user.status)) {
    return (
      <UnauthorizedPage 
        message={`Your account status does not allow you to ${action}. Please contact support for assistance.`} 
      />
    );
  }

  return <>{children}</>;
};

// Tier-based Feature Guard - Ensure user has required tier for features
const TierGuard: React.FC<{ 
  children: React.ReactNode; 
  requiredTiers?: string[];
  featureName?: string;
}> = ({ 
  children, 
  requiredTiers = [],
  featureName = 'this feature'
}) => {
  const { user } = useAuthStore();
  const { hasTier } = usePermissionStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required tier
  if (requiredTiers.length > 0 && !hasTier(user, requiredTiers)) {
    return (
      <UnauthorizedPage 
        message={`Your membership tier does not include access to ${featureName}. Please upgrade your membership to access this feature.`} 
      />
    );
  }

  return <>{children}</>;
};

// Main Member Routes Component
const MemberRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root Member Route - Redirect to dashboard */}
      <Route
        index
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberNavigationGuard>
              <Navigate to="/member/dashboard" replace />
            </MemberNavigationGuard>
          </ProtectedRoute>
        }
      />

      {/* Dashboard Routes */}
      <Route
        path="dashboard/*"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberNavigationGuard>
              <DashboardRoutes />
            </MemberNavigationGuard>
          </ProtectedRoute>
        }
      />

      {/* Profile Routes */}
      <Route
        path="profile/*"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberNavigationGuard>
              <MemberStatusGuard action="view or edit profiles">
                <ProfileRoutes />
              </MemberStatusGuard>
            </MemberNavigationGuard>
          </ProtectedRoute>
        }
      />

      {/* Membership Routes */}
      <Route
        path="membership/*"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberNavigationGuard>
              <MemberStatusGuard allowedStatuses={['active', 'pending', 'inactive']} action="manage your membership">
                <MembershipRoutes />
              </MemberStatusGuard>
            </MemberNavigationGuard>
          </ProtectedRoute>
        }
      />

      {/* Event Registration Routes */}
      <Route
        path="events/*"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberNavigationGuard>
              <MemberStatusGuard action="register for events">
                <EventRegistrationRoutes />
              </MemberStatusGuard>
            </MemberNavigationGuard>
          </ProtectedRoute>
        }
      />

      {/* Volunteer Opportunities Routes */}
      <Route
        path="volunteering/*"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            requiresActiveMembership={true}
          >
            <MemberNavigationGuard>
              <TierGuard requiredTiers={['bronze', 'silver', 'gold', 'platinum']} featureName="volunteer opportunities">
                <VolunteerOpportunitiesRoutes />
              </TierGuard>
            </MemberNavigationGuard>
          </ProtectedRoute>
        }
      />

      {/* Application Status Routes */}
      <Route
        path="applications/*"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberNavigationGuard>
              <ApplicationStatusRoutes />
            </MemberNavigationGuard>
          </ProtectedRoute>
        }
      />

      {/* Member Directory - View other members */}
      <Route
        path="directory"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            requiresActiveMembership={true}
          >
            <MemberNavigationGuard>
              <TierGuard requiredTiers={['silver', 'gold', 'platinum']} featureName="the member directory">
                <MemberLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Member Directory</h1>
                    <p className="text-gray-600">Member directory feature coming soon...</p>
                  </div>
                </MemberLayout>
              </TierGuard>
            </MemberNavigationGuard>
          </ProtectedRoute>
        }
      />

      {/* Member Resources - Access member-only resources */}
      <Route
        path="resources"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            requiresActiveMembership={true}
          >
            <MemberNavigationGuard>
              <MemberLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Member Resources</h1>
                  <p className="text-gray-600">Member resources coming soon...</p>
                </div>
              </MemberLayout>
            </MemberNavigationGuard>
          </ProtectedRoute>
        }
      />

      {/* Member Support - Get help and support */}
      <Route
        path="support"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberNavigationGuard>
              <MemberLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Member Support</h1>
                  <p className="text-gray-600">Support center coming soon...</p>
                </div>
              </MemberLayout>
            </MemberNavigationGuard>
          </ProtectedRoute>
        }
      />

      {/* Member Announcements - View member-specific announcements */}
      <Route
        path="announcements"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberNavigationGuard>
              <MemberLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Announcements</h1>
                  <p className="text-gray-600">Member announcements coming soon...</p>
                </div>
              </MemberLayout>
            </MemberNavigationGuard>
          </ProtectedRoute>
        }
      />

      {/* Member Forums - Community discussions */}
      <Route
        path="forums"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            requiresActiveMembership={true}
          >
            <MemberNavigationGuard>
              <TierGuard requiredTiers={['silver', 'gold', 'platinum']} featureName="member forums">
                <MemberLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Member Forums</h1>
                    <p className="text-gray-600">Community forums coming soon...</p>
                  </div>
                </MemberLayout>
              </TierGuard>
            </MemberNavigationGuard>
          </ProtectedRoute>
        }
      />

      {/* Member Discounts - View available member discounts */}
      <Route
        path="discounts"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            requiresActiveMembership={true}
          >
            <MemberNavigationGuard>
              <TierGuard requiredTiers={['silver', 'gold', 'platinum']} featureName="member discounts">
                <MemberLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Member Discounts</h1>
                    <p className="text-gray-600">Member discounts coming soon...</p>
                  </div>
                </MemberLayout>
              </TierGuard>
            </MemberNavigationGuard>
          </ProtectedRoute>
        }
      />

      {/* Member Networking - Professional networking features */}
      <Route
        path="networking"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            requiresActiveMembership={true}
          >
            <MemberNavigationGuard>
              <TierGuard requiredTiers={['gold', 'platinum']} featureName="networking features">
                <MemberLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Professional Networking</h1>
                    <p className="text-gray-600">Networking features coming soon...</p>
                  </div>
                </MemberLayout>
              </TierGuard>
            </MemberNavigationGuard>
          </ProtectedRoute>
        }
      />

      {/* Legacy Route Redirects - Redirect old routes to new structure */}
      <Route
        path="dashboard"
        element={<Navigate to="/member/dashboard" replace />}
      />
      <Route
        path="profile"
        element={<Navigate to="/member/profile" replace />}
      />
      <Route
        path="membership"
        element={<Navigate to="/member/membership" replace />}
      />
      <Route
        path="volunteer"
        element={<Navigate to="/member/volunteering" replace />}
      />

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default MemberRoutes;