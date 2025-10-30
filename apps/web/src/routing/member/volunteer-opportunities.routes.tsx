import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { usePermissionStore } from '@/store/permissionStore';

// Layout Components
import MemberLayout from '@/layouts/MemberLayout';

// Page Components
import VolunteerOpportunities from '@/features/member/VolunteerOpportunities';
import NotFoundPage from '@/pages/NotFoundPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';

// Protected Route Component with Volunteer-specific Access
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  allowedTiers?: string[];
  requiresActiveMembership?: boolean;
  requiresVolunteerApproval?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [], 
  allowedTiers = [],
  requiresActiveMembership = false,
  requiresVolunteerApproval = false
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
        message="Active membership required to access volunteer opportunities. Please renew your membership." 
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

// Volunteer Status Guard - Check user's volunteer eligibility
const VolunteerStatusGuard: React.FC<{ 
  children: React.ReactNode; 
  requiredStatuses?: string[];
}> = ({ 
  children, 
  requiredStatuses = ['approved', 'pending', 'active'] 
}) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Suspended users cannot access volunteer features
  if (user.status === 'suspended') {
    return (
      <UnauthorizedPage 
        message="Your account is suspended. You cannot access volunteer opportunities at this time." 
      />
    );
  }

  // Check if user has required volunteer status
  if (requiredStatuses.length > 0) {
    // This would typically check user's volunteer approval status
    // For now, we'll allow access as the component will handle specific validations
  }

  return <>{children}</>;
};

// Volunteer Application Guard - Ensure user can apply for opportunities
const VolunteerApplicationGuard: React.FC<{ children: React.ReactNode; opportunityId?: string }> = ({ 
  children, 
  opportunityId 
}) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Inactive users cannot apply for volunteer opportunities
  if (user.status === 'inactive') {
    return (
      <UnauthorizedPage 
        message="Inactive members cannot apply for volunteer opportunities. Please activate your membership." 
      />
    );
  }

  return <>{children}</>;
};

// Skill-based Access Guard - Check if user has required skills for opportunity
const SkillBasedGuard: React.FC<{ 
  children: React.ReactNode; 
  opportunityId: string;
  requiredSkills?: string[];
}> = ({ children, opportunityId, requiredSkills }) => {
  // This would check if user has the required skills for the opportunity
  // For now, we'll allow the component to handle this validation
  return <>{children}</>;
};

// Time Commitment Guard - Check user's availability against opportunity requirements
const TimeCommitmentGuard: React.FC<{ 
  children: React.ReactNode; 
  opportunityId: string;
  commitmentRequired?: string;
}> = ({ children, opportunityId, commitmentRequired }) => {
  // This would check user's availability against opportunity time commitments
  // For now, we'll allow the component to handle this validation
  return <>{children}</>;
};

const VolunteerOpportunitiesRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Volunteer Opportunities List - View all available opportunities */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <VolunteerStatusGuard>
              <MemberLayout>
                <VolunteerOpportunities viewMode="list" />
              </MemberLayout>
            </VolunteerStatusGuard>
          </ProtectedRoute>
        }
      />

      {/* Active Opportunities - Show only active opportunities */}
      <Route
        path="/active"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <VolunteerStatusGuard>
              <MemberLayout>
                <VolunteerOpportunities viewMode="active" />
              </MemberLayout>
            </VolunteerStatusGuard>
          </ProtectedRoute>
        }
      />

      {/* Urgent Opportunities - High priority opportunities */}
      <Route
        path="/urgent"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <VolunteerStatusGuard>
              <MemberLayout>
                <VolunteerOpportunities viewMode="urgent" />
              </MemberLayout>
            </VolunteerStatusGuard>
          </ProtectedRoute>
        }
      />

      {/* My Volunteer Applications - View user's volunteer applications */}
      <Route
        path="/my-applications"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <VolunteerStatusGuard requiredStatuses={['approved', 'pending', 'rejected', 'active']}>
              <MemberLayout>
                <VolunteerOpportunities viewMode="my-applications" />
              </MemberLayout>
            </VolunteerStatusGuard>
          </ProtectedRoute>
        }
      />

      {/* My Active Volunteer Work - Currently active volunteer engagements */}
      <Route
        path="/my-work"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            requiresVolunteerApproval={true}
          >
            <VolunteerStatusGuard requiredStatuses={['approved', 'active']}>
              <MemberLayout>
                <VolunteerOpportunities viewMode="my-work" />
              </MemberLayout>
            </VolunteerStatusGuard>
          </ProtectedRoute>
        }
      />

      {/* Volunteer Opportunity Details - View specific opportunity details */}
      <Route
        path="/:opportunityId"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <VolunteerStatusGuard>
              <MemberLayout>
                <VolunteerOpportunities viewMode="details" />
              </MemberLayout>
            </VolunteerStatusGuard>
          </ProtectedRoute>
        }
      />

      {/* Apply for Opportunity - Submit volunteer application */}
      <Route
        path="/:opportunityId/apply"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            requiresActiveMembership={true}
          >
            <VolunteerApplicationGuard>
              <MemberLayout>
                <VolunteerOpportunities viewMode="apply" />
              </MemberLayout>
            </VolunteerApplicationGuard>
          </ProtectedRoute>
        }
      />

      {/* Application Form - Detailed volunteer application form */}
      <Route
        path="/:opportunityId/apply/form"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            requiresActiveMembership={true}
          >
            <VolunteerApplicationGuard>
              <SkillBasedGuard opportunityId="">
                <TimeCommitmentGuard opportunityId="">
                  <MemberLayout>
                    <VolunteerOpportunities viewMode="application-form" />
                  </MemberLayout>
                </TimeCommitmentGuard>
              </SkillBasedGuard>
            </VolunteerApplicationGuard>
          </ProtectedRoute>
        }
      />

      {/* Application Confirmation - View application confirmation */}
      <Route
        path="/:opportunityId/apply/confirmation"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            requiresActiveMembership={true}
          >
            <VolunteerApplicationGuard>
              <MemberLayout>
                <VolunteerOpportunities viewMode="application-confirmation" />
              </MemberLayout>
            </VolunteerApplicationGuard>
          </ProtectedRoute>
        }
      />

      {/* Withdraw Application - Cancel volunteer application */}
      <Route
        path="/:opportunityId/withdraw"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <VolunteerStatusGuard requiredStatuses={['pending']}>
              <MemberLayout>
                <VolunteerOpportunities viewMode="withdraw" />
              </MemberLayout>
            </VolunteerStatusGuard>
          </ProtectedRoute>
        }
      />

      {/* Volunteer Skills Matching - Find opportunities matching user's skills */}
      <Route
        path="/skills-match"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <VolunteerStatusGuard>
              <MemberLayout>
                <VolunteerOpportunities viewMode="skills-match" />
              </MemberLayout>
            </VolunteerStatusGuard>
          </ProtectedRoute>
        }
      />

      {/* Volunteer Impact - View user's volunteer impact and hours */}
      <Route
        path="/my-impact"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            requiresVolunteerApproval={true}
          >
            <VolunteerStatusGuard requiredStatuses={['approved', 'active']}>
              <MemberLayout>
                <VolunteerOpportunities viewMode="my-impact" />
              </MemberLayout>
            </VolunteerStatusGuard>
          </ProtectedRoute>
        }
      />

      {/* Volunteer Hours Tracking - Log and track volunteer hours */}
      <Route
        path="/hours"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            requiresVolunteerApproval={true}
          >
            <VolunteerStatusGuard requiredStatuses={['approved', 'active']}>
              <MemberLayout>
                <VolunteerOpportunities viewMode="hours-tracking" />
              </MemberLayout>
            </VolunteerStatusGuard>
          </ProtectedRoute>
        }
      />

      {/* Volunteer Certificate - Download volunteer service certificates */}
      <Route
        path="/certificate"
        element={
          <ProtectedRoute 
            allowedRoles={['member', 'board', 'admin']}
            requiresVolunteerApproval={true}
          >
            <VolunteerStatusGuard requiredStatuses={['approved', 'active']}>
              <MemberLayout>
                <VolunteerOpportunities viewMode="certificate" />
              </MemberLayout>
            </VolunteerStatusGuard>
          </ProtectedRoute>
        }
      />

      {/* Volunteer Application Process - Steps to become a volunteer */}
      <Route
        path="/become-volunteer"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <MemberLayout>
              <VolunteerOpportunities viewMode="become-volunteer" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Volunteer Training - Access volunteer training materials */}
      <Route
        path="/training"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <VolunteerStatusGuard requiredStatuses={['approved', 'pending', 'active']}>
              <MemberLayout>
                <VolunteerOpportunities viewMode="training" />
              </MemberLayout>
            </VolunteerStatusGuard>
          </ProtectedRoute>
        }
      />

      {/* Board: Volunteer Management - Board can manage volunteer programs */}
      <Route
        path="/board/manage"
        element={
          <ProtectedRoute allowedRoles={['board', 'admin']}>
            <MemberLayout>
              <VolunteerOpportunities viewMode="board-management" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Board: Volunteer Applications Review - Review volunteer applications */}
      <Route
        path="/board/applications"
        element={
          <ProtectedRoute allowedRoles={['board', 'admin']}>
            <MemberLayout>
              <VolunteerOpportunities viewMode="board-applications" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin: All Volunteer Data - Admin can view all volunteer data */}
      <Route
        path="/admin/all"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MemberLayout>
              <VolunteerOpportunities viewMode="admin-all" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin: Volunteer Analytics - Admin can view volunteer program analytics */}
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MemberLayout>
              <VolunteerOpportunities viewMode="admin-analytics" />
            </MemberLayout>
          </ProtectedRoute>
        }
      />

      {/* Volunteer Calendar - View volunteer opportunities in calendar format */}
      <Route
        path="/calendar"
        element={
          <ProtectedRoute allowedRoles={['member', 'board', 'admin']}>
            <VolunteerStatusGuard>
              <MemberLayout>
                <VolunteerOpportunities viewMode="calendar" />
              </MemberLayout>
            </VolunteerStatusGuard>
          </ProtectedRoute>
        }
      />

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default VolunteerOpportunitiesRoutes;