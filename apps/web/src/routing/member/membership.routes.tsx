import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { usePermissionStore } from '@/store/permissionStore';

// Layout Components
import MemberLayout from '@/layouts/MemberLayout';

// Page Components
import MembershipPage from '@/pages/member/MembershipPage';
import NotFoundPage from '@/pages/NotFoundPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';

// Protected Route Component with Membership Tier-based Access
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  allowedTiers?: string[];
  requiresActiveMembership?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [], 
  allowedTiers = [],
  requiresActiveMembership = false
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

  // Check active membership requirement
  if (requiresActiveMembership && user?.status !== 'active') {
    return (
      <UnauthorizedPage 
        message="Active membership required to access this feature. Please renew your membership or contact support." 
      />
    );
  }

  return <>{children}</>;
};

// Membership Status Guard
const MembershipStatusGuard: React.FC<{ children: React.ReactNode; requiredStatus?: string[] }> = ({ 
  children, 
  requiredStatus = ['active', 'pending'] 
}) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required membership status
  if (!requiredStatus.includes(user.status)) {
    return (
      <UnauthorizedPage 
        message="Your membership status does not allow access to this feature." 
      />
    );
  }

  return <>{children}</>;
};

// Renewal Guard - Only active members can renew
const RenewalGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.status !== 'active') {
    return (
      <UnauthorizedPage 
        message="Only active members can renew their membership. Please contact support for assistance." 
      />
    );
  }

  return <>{children}</>;
};

// Tier Upgrade Guard - Members can only upgrade tiers
const TierUpgradeGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Members can upgrade tiers, but not downgrade through this interface
  if (user.status === 'suspended' || user.status === 'inactive') {
    return (
      <UnauthorizedPage 
        message="Tier upgrades are not available for suspended or inactive accounts." 
      />
    );
  }

  return <>{children}</>;
};

const MembershipRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Main Membership Overview - All authenticated users */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberLayout>
              <MembershipPage viewMode="overview" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Membership Details - Detailed view of current membership */}
      <Route
        path="/details"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MembershipStatusGuard>
              <MemberLayout>
                <MembershipPage viewMode="details" />
              </MemberLayout>
            </MembershipStatusGuard>
          </ProtectedRoute>
        }
      />

      {/* Membership Benefits - View all available benefits by tier */}
      <Route
        path="/benefits"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberLayout>
              <MembershipPage viewMode="benefits" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Payment History - View past payments and invoices */}
      <Route
        path="/payments"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MembershipStatusGuard>
              <MemberLayout>
                <MembershipPage viewMode="payments" />
              </MemberLayout>
            </MembershipStatusGuard>
          </ProtectedRoute>
        }
      />

      {/* Payment Methods - Manage payment methods */}
      <Route
        path="/payment-methods"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MembershipStatusGuard>
              <MemberLayout>
                <MembershipPage viewMode="payment-methods" />
              </MemberLayout>
            </MembershipStatusGuard>
          </ProtectedRoute>
        }
      />

      {/* Renewal - Renew membership (Active members only) */}
      <Route
        path="/renew"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <RenewalGuard>
              <MemberLayout>
                <MembershipPage viewMode="renew" />
              </MemberLayout>
            </RenewalGuard>
          </ProtectedRoute>
        }
      />

      {/* Upgrade Tier - Upgrade membership tier */}
      <Route
        path="/upgrade"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <TierUpgradeGuard>
              <MemberLayout>
                <MembershipPage viewMode="upgrade" />
              </MemberLayout>
            </TierUpgradeGuard>
          </ProtectedRoute>
        }
      />

      {/* Downgrade Tier - Downgrade membership (with confirmation) */}
      <Route
        path="/downgrade"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <TierUpgradeGuard>
              <MemberLayout>
                <MembershipPage viewMode="downgrade" />
              </MemberLayout>
            </TierUpgradeGuard>
          </ProtectedRoute>
        }
      />

      {/* Auto-Renewal Settings - Configure automatic renewal */}
      <Route
        path="/auto-renew"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <RenewalGuard>
              <MemberLayout>
                <MembershipPage viewMode="auto-renew" />
              </MemberLayout>
            </RenewalGuard>
          </ProtectedRoute>
        }
      />

      {/* Invoices and Receipts - Download invoices and receipts */}
      <Route
        path="/invoices"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MembershipStatusGuard>
              <MemberLayout>
                <MembershipPage viewMode="invoices" />
              </MemberLayout>
            </MembershipStatusGuard>
          </ProtectedRoute>
        }
      />

      {/* Membership Cancellation - Cancel membership (with restrictions) */}
      <Route
        path="/cancel"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MembershipStatusGuard>
              <MemberLayout>
                <MembershipPage viewMode="cancel" />
              </MemberLayout>
            </MembershipStatusGuard>
          </ProtectedRoute>
        }
      />

      {/* Reactivation - Reactivate suspended/inactive membership */}
      <Route
        path="/reactivate"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberLayout>
              <MembershipPage viewMode="reactivate" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin: Member Management - Admin can view and manage all memberships */}
      <Route
        path="/admin/:memberId"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MemberLayout>
              <MembershipPage viewMode="admin-management" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin: Membership Analytics - Admin can view membership analytics */}
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MemberLayout>
              <MembershipPage viewMode="admin-analytics" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Board: Member Tier Changes - Board can approve tier changes */}
      <Route
        path="/board/approvals"
        element={
          <ProtectedRoute allowedRoles={['board', 'admin']}>
            <MemberLayout>
              <MembershipPage viewMode="board-approvals" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default MembershipRoutes;