/**
 * Application Details Page
 * Shows detailed information about a specific application
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AdminApplicationGuard } from '@/routing/admin/guards';

const ApplicationDetailsPage: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();

  return (
    <AdminApplicationGuard requiredPermission="application:read">
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Application Details - ID: {applicationId}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Detailed application information and review history.
              </p>
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-2">Application ID: {applicationId}</h3>
                <p className="text-sm text-gray-500">
                  This page will show comprehensive application details including
                  submitted documents, reference information, review status, and history.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminApplicationGuard>
  );
};

export default ApplicationDetailsPage;
