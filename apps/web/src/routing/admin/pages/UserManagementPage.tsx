/**
 * User Management Page
 * Main page for managing all users in the system
 */

import React from 'react';
import { UserManagement } from '@/features/admin';
import { AdminUserManagementGuard } from '@/routing/admin/guards';

const UserManagementPage: React.FC = () => {
  return (
    <AdminUserManagementGuard requiredPermission="user:read">
      <UserManagement />
    </AdminUserManagementGuard>
  );
};

export default UserManagementPage;
