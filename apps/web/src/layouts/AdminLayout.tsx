import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { usePermissionStore } from '@/store/permissionStore';
import { UserRole } from '@issb/types';
import Layout from '@/components/layout/Layout';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  const { canManageSystem, isAdmin } = usePermissionStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Only admins can access admin layout
  if (!user || user.role !== UserRole.ADMIN) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Double-check with permission store
  if (!isAdmin(user) || !canManageSystem(user)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Layout>{children}</Layout>;
};

export default AdminLayout;
