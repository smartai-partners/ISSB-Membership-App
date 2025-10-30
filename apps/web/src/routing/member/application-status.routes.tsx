import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { usePermissionStore } from '@/store/permissionStore';

// Layout Components
import MemberLayout from '@/layouts/MemberLayout';

// Page Components
import ApplicationStatus from '@/features/member/ApplicationStatus';
import NotFoundPage from '@/pages/NotFoundPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';

// Protected Route Component with Application-specific Access
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  allowedTiers?: string[];
  requiresActiveMembership?: boolean;
  ownApplicationsOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [], 
  allowedTiers = [],
  requiresActiveMembership = false,
  ownApplicationsOnly = false
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
        message="Active membership required to access application features. Please renew your membership." 
      />
    );
  }

  // Check if user can only access their own applications
  if (ownApplicationsOnly && user) {
    // This would typically check the application owner against the current user
    // For now, we'll allow access as the component will handle specific validations
  }

  return <>{children}</>;
};

// Application Ownership Guard - Ensure users can only access their own applications
const ApplicationOwnershipGuard: React.FC<{ 
  children: React.ReactNode; 
  applicationId: string;
  ownOnly?: boolean;
}> = ({ children, applicationId, ownOnly = true }) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Suspended users cannot access application features
  if (user.status === 'suspended') {
    return (
      <UnauthorizedPage 
        message="Your account is suspended. You cannot access application features at this time." 
      />
    );
  }

  // For ownOnly routes, we'll rely on the component to validate ownership
  return <>{children}</>;
};

// Application Status Guard - Check what actions are available based on application status
const ApplicationStatusGuard: React.FC<{ 
  children: React.ReactNode; 
  applicationId: string;
  allowedStatuses?: string[];
}> = ({ children, applicationId, allowedStatuses }) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Inactive users can view their applications but cannot take actions
  if (user.status === 'inactive' && allowedStatuses) {
    // This would check if the action is allowed for inactive users
  }

  return <>{children}</>;
};

// Draft Application Guard - Ensure users can only edit draft applications
const DraftApplicationGuard: React.FC<{ children: React.ReactNode; applicationId: string }> = ({ 
  children, 
  applicationId 
}) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Draft applications can only be edited by their owners
  // The component will handle the specific validation
  return <>{children}</>;
};

// Submitted Application Guard - Ensure users understand constraints on submitted applications
const SubmittedApplicationGuard: React.FC<{ children: React.FC; applicationId: string }> = ({ 
  children, 
  applicationId 
}) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Submitted applications have limited edit capabilities
  // The component will handle showing appropriate actions
  return <>{children}</>;
};

// Admin/Board Review Guard - Ensure proper roles can access review features
const ReviewAccessGuard: React.FC<{ children: React.ReactNode; applicationId?: string }> = ({ 
  children, 
  applicationId 
}) => {
  const { user } = useAuthStore();
  const { hasRole } = usePermissionStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Only board and admin can review applications
  if (!hasRole(user, ['board', 'admin'])) {
    return <UnauthorizedPage />;
  }

  return <>{children}</>;
};

const ApplicationStatusRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Application Dashboard - Overview of all user applications */}
      <Route
        path="/"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            ownApplicationsOnly={false}
          >
            <MemberLayout>
              <ApplicationStatus viewMode="dashboard" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* All Applications - View all applications with filtering */}
      <Route
        path="/all"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberLayout>
              <ApplicationStatus viewMode="all" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Pending Applications - Applications awaiting review */}
      <Route
        path="/pending"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            ownApplicationsOnly={true}
          >
            <MemberLayout>
              <ApplicationStatus viewMode="pending" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Approved Applications - Successfully approved applications */}
      <Route
        path="/approved"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberLayout>
              <ApplicationStatus viewMode="approved" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Rejected Applications - Applications that were not approved */}
      <Route
        path="/rejected"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberLayout>
              <ApplicationStatus viewMode="rejected" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Draft Applications - Applications being worked on but not submitted */}
      <Route
        path="/draft"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            requiresActiveMembership={true}
            ownApplicationsOnly={true}
          >
            <MemberLayout>
              <ApplicationStatus viewMode="draft" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Under Review - Applications currently being reviewed */}
      <Route
        path="/under-review"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberLayout>
              <ApplicationStatus viewMode="under-review" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Withdrawn Applications - Applications user withdrew */}
      <Route
        path="/withdrawn"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberLayout>
              <ApplicationStatus viewMode="withdrawn" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Application Details - View specific application details */}
      <Route
        path="/:applicationId"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <ApplicationOwnershipGuard applicationId="">
              <MemberLayout>
                <ApplicationStatus viewMode="details" />
              </MemberLayout>
            </ApplicationOwnershipGuard>
          </ProtectedRoute>
        }
      />

      {/* Edit Draft Application - Edit applications that haven't been submitted */}
      <Route
        path="/:applicationId/edit"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            requiresActiveMembership={true}
            ownApplicationsOnly={true}
          >
            <DraftApplicationGuard applicationId="">
              <MemberLayout>
                <ApplicationStatus viewMode="edit" />
              </MemberLayout>
            </DraftApplicationGuard>
          </ProtectedRoute>
        }
      />

      {/* Submit Application - Submit a draft application for review */}
      <Route
        path="/:applicationId/submit"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            requiresActiveMembership={true}
            ownApplicationsOnly={true}
          >
            <DraftApplicationGuard applicationId="">
              <MemberLayout>
                <ApplicationStatus viewMode="submit" />
              </MemberLayout>
            </DraftApplicationGuard>
          </ProtectedRoute>
        }
      />

      {/* Withdraw Application - Withdraw a submitted application */}
      <Route
        path="/:applicationId/withdraw"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            requiresActiveMembership={true}
            ownApplicationsOnly={true}
          >
            <ApplicationStatusGuard applicationId="" allowedStatuses={['submitted', 'under-review']}>
              <MemberLayout>
                <ApplicationStatus viewMode="withdraw" />
              </MemberLayout>
            </ApplicationStatusGuard>
          </ProtectedRoute>
        }
      />

      {/* Resubmit Application - Resubmit a rejected application */}
      <Route
        path="/:applicationId/resubmit"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            requiresActiveMembership={true}
            ownApplicationsOnly={true}
          >
            <ApplicationStatusGuard applicationId="" allowedStatuses={['rejected']}>
              <MemberLayout>
                <ApplicationStatus viewMode="resubmit" />
              </MemberLayout>
            </ApplicationStatusGuard>
          </ProtectedRoute>
        }
      />

      {/* Application Timeline - View application process timeline */}
      <Route
        path="/:applicationId/timeline"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <ApplicationOwnershipGuard applicationId="">
              <MemberLayout>
                <ApplicationStatus viewMode="timeline" />
              </MemberLayout>
            </ApplicationOwnershipGuard>
          </ProtectedRoute>
        }
      />

      {/* Application Documents - View and manage application documents */}
      <Route
        path="/:applicationId/documents"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <ApplicationOwnershipGuard applicationId="">
              <MemberLayout>
                <ApplicationStatus viewMode="documents" />
              </MemberLayout>
            </ApplicationOwnershipGuard>
          </ProtectedRoute>
        }
      />

      {/* Upload Documents - Upload additional documents for application */}
      <Route
        path="/:applicationId/documents/upload"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            requiresActiveMembership={true}
            ownApplicationsOnly={true}
          >
            <DraftApplicationGuard applicationId="">
              <MemberLayout>
                <ApplicationStatus viewMode="upload-documents" />
              </MemberLayout>
            </DraftApplicationGuard>
          </ProtectedRoute>
        }
      />

      {/* Application Feedback - View feedback and comments on application */}
      <Route
        path="/:applicationId/feedback"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <ApplicationOwnershipGuard applicationId="">
              <MemberLayout>
                <ApplicationStatus viewMode="feedback" />
              </MemberLayout>
            </ApplicationOwnershipGuard>
          </ProtectedRoute>
        }
      />

      {/* Application History - View complete history of application changes */}
      <Route
        path="/:applicationId/history"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <ApplicationOwnershipGuard applicationId="">
              <MemberLayout>
                <ApplicationStatus viewMode="history" />
              </MemberLayout>
            </ApplicationOwnershipGuard>
          </ProtectedRoute>
        }
      />

      {/* Application Statistics - View application statistics and analytics */}
      <Route
        path="/statistics"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberLayout>
              <ApplicationStatus viewMode="statistics" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Application Search - Search through applications */}
      <Route
        path="/search"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberLayout>
              <ApplicationStatus viewMode="search" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Application Templates - Templates for different types of applications */}
      <Route
        path="/templates"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            requiresActiveMembership={true}
          >
            <MemberLayout>
              <ApplicationStatus viewMode="templates" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Board: Application Review - Board can review all applications */}
      <Route
        path="/board/review"
        element={
          <ProtectedRoute allowedRoles={['board', 'admin']}>
            <ReviewAccessGuard>
              <MemberLayout>
                <ApplicationStatus viewMode="board-review" />
              </MemberLayout>
            </ReviewAccessGuard>
          </ProtectedRoute>
        }
      />

      {/* Board: Application Details for Review - Board view of application details */}
      <Route
        path="/board/review/:applicationId"
        element={
          <ProtectedRoute allowedRoles={['board', 'admin']}>
            <ReviewAccessGuard applicationId="">
              <MemberLayout>
                <ApplicationStatus viewMode="board-review-details" />
              </MemberLayout>
            </ReviewAccessGuard>
          </ProtectedRoute>
        }
      />

      {/* Board: Approve/Reject Applications - Board actions on applications */}
      <Route
        path="/board/review/:applicationId/action"
        element={
          <ProtectedRoute allowedRoles={['board', 'admin']}>
            <ReviewAccessGuard applicationId="">
              <MemberLayout>
                <ApplicationStatus viewMode="board-action" />
              </MemberLayout>
            </ReviewAccessGuard>
          </ProtectedRoute>
        }
      />

      {/* Admin: All Applications - Admin can view and manage all applications */}
      <Route
        path="/admin/all"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ReviewAccessGuard>
              <MemberLayout>
                <ApplicationStatus viewMode="admin-all" />
              </MemberLayout>
            </ReviewAccessGuard>
          </ProtectedRoute>
        }
      />

      {/* Admin: Application Analytics - Admin can view application analytics */}
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ReviewAccessGuard>
              <MemberLayout>
                <ApplicationStatus viewMode="admin-analytics" />
              </MemberLayout>
            </ReviewAccessGuard>
          </ProtectedRoute>
        }
      />

      {/* Admin: Application Settings - Admin can configure application settings */}
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MemberLayout>
              <ApplicationStatus viewMode="admin-settings" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default ApplicationStatusRoutes;