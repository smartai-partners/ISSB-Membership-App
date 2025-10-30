/**
 * Application Review Page
 * Main page for reviewing and managing membership applications
 */

import React from 'react';
import { ApplicationReview } from '@/features/admin';
import { AdminApplicationGuard } from '@/routing/admin/guards';

const ApplicationReviewPage: React.FC = () => {
  return (
    <AdminApplicationGuard requiredPermission="application:read">
      <ApplicationReview />
    </AdminApplicationGuard>
  );
};

export default ApplicationReviewPage;
