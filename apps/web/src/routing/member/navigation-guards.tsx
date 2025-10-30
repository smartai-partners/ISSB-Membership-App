import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { usePermissionStore } from '@/store/permissionStore';
import UnauthorizedPage from '@/pages/UnauthorizedPage';

// Base guard interface
interface GuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

// Role-based access interface
interface RoleBasedGuardProps extends GuardProps {
  allowedRoles: string[];
  requireAllRoles?: boolean; // If true, user must have ALL roles, if false (default), any role is sufficient
}

// Tier-based access interface
interface TierBasedGuardProps extends GuardProps {
  allowedTiers: string[];
  requireAllTiers?: boolean; // If true, user must have ALL tiers, if false (default), any tier is sufficient
}

// Membership status guard interface
interface MembershipStatusGuardProps extends GuardProps {
  allowedStatuses: string[];
  action?: string;
  customMessage?: string;
}

/**
 * Base Authentication Guard
 * Ensures user is authenticated before allowing access
 */
export const AuthGuard: React.FC<GuardProps> = ({ 
  children, 
  redirectTo = '/login',
  fallback 
}) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }
  
  return <>{children}</>;
};

/**
 * Role-based Access Guard
 * Restricts access based on user roles
 */
export const RoleGuard: React.FC<RoleBasedGuardProps> = ({ 
  children, 
  allowedRoles,
  requireAllRoles = false,
  redirectTo = '/unauthorized',
  fallback 
}) => {
  const { user } = useAuthStore();
  const { hasRole } = usePermissionStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  let hasAccess = false;
  
  if (requireAllRoles) {
    // User must have ALL specified roles
    hasAccess = allowedRoles.every(role => hasRole(user, [role]));
  } else {
    // User must have AT LEAST ONE of the specified roles
    hasAccess = hasRole(user, allowedRoles);
  }
  
  if (!hasAccess) {
    return fallback || <UnauthorizedPage />;
  }
  
  return <>{children}</>;
};

/**
 * Tier-based Access Guard
 * Restricts access based on membership tiers
 */
export const TierGuard: React.FC<TierBasedGuardProps> = ({ 
  children, 
  allowedTiers,
  requireAllTiers = false,
  redirectTo = '/unauthorized',
  fallback 
}) => {
  const { user } = useAuthStore();
  const { hasTier } = usePermissionStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  let hasAccess = false;
  
  if (requireAllTiers) {
    // User must have ALL specified tiers
    hasAccess = allowedTiers.every(tier => hasTier(user, [tier]));
  } else {
    // User must have AT LEAST ONE of the specified tiers
    hasAccess = hasTier(user, allowedTiers);
  }
  
  if (!hasAccess) {
    return fallback || <UnauthorizedPage />;
  }
  
  return <>{children}</>;
};

/**
 * Membership Status Guard
 * Restricts access based on account status
 */
export const MembershipStatusGuard: React.FC<MembershipStatusGuardProps> = ({ 
  children, 
  allowedStatuses,
  action = 'access this feature',
  customMessage,
  fallback 
}) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Suspended users have very limited access
  if (user.status === 'suspended') {
    const message = customMessage || `Your account is suspended. You cannot ${action} at this time. Please contact support for assistance.`;
    return fallback || <UnauthorizedPage message={message} />;
  }
  
  // Check if user's status is in the allowed list
  if (!allowedStatuses.includes(user.status)) {
    const message = customMessage || `Your account status does not allow you to ${action}. Please contact support for assistance.`;
    return fallback || <UnauthorizedPage message={message} />;
  }
  
  return <>{children}</>;
};

/**
 * Active Membership Guard
 * Ensures user has active membership for specific features
 */
export const ActiveMembershipGuard: React.FC<GuardProps> = ({ 
  children, 
  action = 'access this feature',
  customMessage,
  fallback 
}) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.status !== 'active') {
    const message = customMessage || `Active membership required to ${action}. Please renew your membership or contact support.`;
    return fallback || <UnauthorizedPage message={message} />;
  }
  
  return <>{children}</>;
};

/**
 * Volunteer Approval Guard
 * Ensures user has volunteer approval status
 */
export const VolunteerApprovalGuard: React.FC<GuardProps> = ({ 
  children, 
  action = 'access volunteer features',
  customMessage,
  fallback 
}) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.volunteerStatus !== 'approved') {
    const message = customMessage || `Volunteer approval required to ${action}. Please complete the volunteer application process.`;
    return fallback || <UnauthorizedPage message={message} />;
  }
  
  return <>{children}</>;
};

/**
 * Ownership Guard
 * Ensures user can only access their own resources
 */
export const OwnershipGuard: React.FC<{
  children: React.ReactNode;
  ownerId: string;
  currentUserId?: string;
  fallback?: React.ReactNode;
}> = ({ 
  children, 
  ownerId, 
  currentUserId,
  fallback 
}) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Use provided currentUserId or fall back to store user
  const userId = currentUserId || user.id;
  
  // Check if user owns the resource
  if (userId !== ownerId) {
    // Check if user has admin/board role to bypass ownership check
    const { hasRole } = usePermissionStore();
    const hasElevatedAccess = hasRole(user, ['admin', 'board']);
    
    if (!hasElevatedAccess) {
      return fallback || <UnauthorizedPage message="You can only access your own resources." />;
    }
  }
  
  return <>{children}</>;
};

/**
 * Feature Availability Guard
 * Checks if a feature is available based on multiple criteria
 */
export const FeatureGuard: React.FC<{
  children: React.ReactNode;
  requiresActiveMembership?: boolean;
  requiresVolunteerApproval?: boolean;
  requiredRoles?: string[];
  requiredTiers?: string[];
  customMessage?: string;
  fallback?: React.ReactNode;
}> = ({
  children,
  requiresActiveMembership = false,
  requiresVolunteerApproval = false,
  requiredRoles = [],
  requiredTiers = [],
  customMessage,
  fallback
}) => {
  const { user } = useAuthStore();
  const { hasRole, hasTier } = usePermissionStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Check active membership
  if (requiresActiveMembership && user.status !== 'active') {
    const message = customMessage || 'Active membership required for this feature.';
    return fallback || <UnauthorizedPage message={message} />;
  }
  
  // Check volunteer approval
  if (requiresVolunteerApproval && user.volunteerStatus !== 'approved') {
    const message = customMessage || 'Volunteer approval required for this feature.';
    return fallback || <UnauthorizedPage message={message} />;
  }
  
  // Check roles
  if (requiredRoles.length > 0 && !hasRole(user, requiredRoles)) {
    const message = customMessage || 'Insufficient role permissions for this feature.';
    return fallback || <UnauthorizedPage message={message} />;
  }
  
  // Check tiers
  if (requiredTiers.length > 0 && !hasTier(user, requiredTiers)) {
    const message = customMessage || 'Insufficient membership tier for this feature.';
    return fallback || <UnauthorizedPage message={message} />;
  }
  
  return <>{children}</>;
};

/**
 * Time-based Guard
 * Checks if access is allowed based on time constraints
 */
export const TimeBasedGuard: React.FC<{
  children: React.ReactNode;
  startDate?: Date;
  endDate?: Date;
  timezone?: string;
  customMessage?: string;
  fallback?: React.ReactNode;
}> = ({
  children,
  startDate,
  endDate,
  timezone = 'UTC',
  customMessage,
  fallback
}) => {
  const now = new Date();
  
  // Check start date
  if (startDate && now < startDate) {
    const message = customMessage || `This feature will be available starting from ${startDate.toLocaleDateString()}.`;
    return fallback || <UnauthorizedPage message={message} />;
  }
  
  // Check end date
  if (endDate && now > endDate) {
    const message = customMessage || `This feature is no longer available after ${endDate.toLocaleDateString()}.`;
    return fallback || <UnauthorizedPage message={message} />;
  }
  
  return <>{children}</>;
};

/**
 * Resource Availability Guard
 * Checks if a resource (like an event) has available spots/capacity
 */
export const ResourceAvailabilityGuard: React.FC<{
  children: React.ReactNode;
  totalCapacity?: number;
  currentCount: number;
  customMessage?: string;
  fallback?: React.ReactNode;
}> = ({
  children,
  totalCapacity,
  currentCount,
  customMessage,
  fallback
}) => {
  // If there's a capacity limit and we're at or over capacity
  if (totalCapacity !== undefined && currentCount >= totalCapacity) {
    const message = customMessage || 'This resource is currently at full capacity.';
    return fallback || <UnauthorizedPage message={message} />;
  }
  
  return <>{children}</>;
};

/**
 * Registration Deadline Guard
 * Checks if registration is still open for time-sensitive resources
 */
export const RegistrationDeadlineGuard: React.FC<{
  children: React.ReactNode;
  deadline?: Date;
  customMessage?: string;
  fallback?: React.ReactNode;
}> = ({
  children,
  deadline,
  customMessage,
  fallback
}) => {
  const now = new Date();
  
  // If there's a deadline and we've passed it
  if (deadline && now > deadline) {
    const message = customMessage || `Registration deadline has passed. Registrations closed on ${deadline.toLocaleDateString()}.`;
    return fallback || <UnauthorizedPage message={message} />;
  }
  
  return <>{children}</>;
};

// Convenience guards for common use cases
export const MemberGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <RoleGuard allowedRoles={['member', 'board', 'admin']} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const BoardGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <RoleGuard allowedRoles={['board', 'admin']} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const AdminGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <RoleGuard allowedRoles={['admin']} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const PremiumGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <TierGuard allowedTiers={['silver', 'gold', 'platinum']} fallback={fallback}>
    {children}
  </TierGuard>
);

export const GoldMemberGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <TierGuard allowedTiers={['gold', 'platinum']} fallback={fallback}>
    {children}
  </TierGuard>
);

export const PlatinumGuard: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <TierGuard allowedTiers={['platinum']} fallback={fallback}>
    {children}
  </TierGuard>
);