/**
 * System Settings Page
 * Main page for managing system configuration
 */

import React from 'react';
import { SystemSettings } from '@/features/admin';
import { AdminSystemGuard } from '@/routing/admin/guards';

const SystemSettingsPage: React.FC = () => {
  return (
    <AdminSystemGuard requiredPermission="settings:read">
      <SystemSettings />
    </AdminSystemGuard>
  );
};

export default SystemSettingsPage;
