/**
 * Admin Routing Module
 * Complete routing system for admin-only features
 */

// Main exports
export { default as adminRoutes, AdminRouteGuard } from './index';
export { default as adminRouterConfig } from './router';
export * from './permissions';
export * from './guards';
export { default as AdminNavigation } from './AdminNavigation';

// Page components
export * from './pages';

// Router configuration helpers
export { getAdminRoutePaths, getAdminRouteMetadata, getFilteredAdminRoutes } from './router';

// Permission utilities
export {
  canManageUsers,
  canCreateUsers,
  canEditUsers,
  canDeleteUsers,
  canViewUserDetails,
  canManageMembership,
  canManageMembershipTiers,
  canViewMembershipReports,
  canManageEvents,
  canCreateEvents,
  canEditEvents,
  canDeleteEvents,
  canViewEventReports,
  canManageApplications,
  canApproveApplications,
  canRejectApplications,
  canViewApplicationDetails,
  canManageSystem,
  canViewSystemSettings,
  canEditSystemSettings,
  canViewSystemLogs,
  canManageBackup,
  canViewAuditTrail,
  canViewReports,
  canExportReports,
  canGenerateReports,
  canManageNotifications,
  canViewNotifications,
  canManageVolunteerOps,
  canCreateVolunteerOps,
  canEditVolunteerOps,
  canDeleteVolunteerOps,
  isAdmin,
  hasAdminPermission,
  getUserAdminPermissions,
  canAccessAdminSection,
  getAdminRouteMetadata as getAdminRoutePermissionInfo,
} from './permissions';

// Route guard components
export {
  AdminUserManagementGuard,
  AdminMembershipGuard,
  AdminEventGuard,
  AdminApplicationGuard,
  AdminSystemGuard,
  AdminReportGuard,
  AdminNotificationGuard,
  AdminVolunteerGuard,
  withAdminProtection,
  useAdminAccess,
  AdminContent,
  requireAdmin,
  ADMIN_ROUTE_METADATA,
} from './guards';

// Version and metadata
export const ADMIN_ROUTING_VERSION = '1.0.0';
export const ADMIN_ROUTING_DESCRIPTION = 'Admin routing module with role-based access control';

// Default admin routes configuration
export default {
  routes: adminRoutes,
  version: ADMIN_ROUTING_VERSION,
  description: ADMIN_ROUTING_DESCRIPTION,
};
