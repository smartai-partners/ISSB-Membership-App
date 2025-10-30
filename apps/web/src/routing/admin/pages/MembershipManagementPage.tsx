/**
 * Membership Management Page
 * Main page for managing membership tiers and relationships
 */

import React from 'react';
import { MembershipManagement } from '@/features/admin';
import { AdminMembershipGuard } from '@/routing/admin/guards';

const MembershipManagementPage: React.FC = () => {
  return (
    <AdminMembershipGuard requiredPermission="membership:read">
      <MembershipManagement />
    </AdminMembershipGuard>
  );
};

export default MembershipManagementPage;
