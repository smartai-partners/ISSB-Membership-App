/**
 * Event Management Page
 * Main page for managing all events
 */

import React from 'react';
import { EventManagement } from '@/features/admin';
import { AdminEventGuard } from '@/routing/admin/guards';

const EventManagementPage: React.FC = () => {
  return (
    <AdminEventGuard requiredPermission="event:read">
      <EventManagement />
    </AdminEventGuard>
  );
};

export default EventManagementPage;
