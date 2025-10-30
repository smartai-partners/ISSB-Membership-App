/**
 * Admin Dashboard Page
 * Main dashboard for admin users showing system overview
 */

import React from 'react';
import { AdminDashboard } from '@/features/admin';
import { AdminRouteGuard } from '@/routing/admin/guards';

const AdminDashboardPage: React.FC = () => {
  return (
    <AdminRouteGuard requiredPermission="user:read">
      <AdminDashboard />
    </AdminRouteGuard>
  );
};

export default AdminDashboardPage;
