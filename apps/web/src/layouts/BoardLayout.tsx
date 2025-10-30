import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { usePermissionStore } from '@/store/permissionStore';
import { UserRole } from '@issb/types';
import Layout from '@/components/layout/Layout';

interface BoardLayoutProps {
  children: React.ReactNode;
}

const BoardLayout: React.FC<BoardLayoutProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  const { canViewBoardContent } = usePermissionStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Only board members and admins can access board layout
  if (!user || (user.role !== UserRole.BOARD && user.role !== UserRole.ADMIN)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check if user can view board content
  if (user && !canViewBoardContent(user)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Layout>{children}</Layout>;
};

export default BoardLayout;
