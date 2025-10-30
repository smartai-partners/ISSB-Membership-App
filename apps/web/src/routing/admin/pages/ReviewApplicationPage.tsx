/**
 * Review Application Page
 * Page for reviewing and making decisions on applications
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AdminApplicationGuard } from '@/routing/admin/guards';

const ReviewApplicationPage: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();

  return (
    <AdminApplicationGuard requiredPermission="application:approve">
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Review Application - ID: {applicationId}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Review application and make approval/rejection decisions.
              </p>
              <div className="border rounded-lg p-4 bg-purple-50">
                <h3 className="font-semibold mb-2">Application Review Form</h3>
                <p className="text-sm text-gray-500">
                  This page will provide tools for reviewing applications,
                  adding comments, requesting additional information, and making decisions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminApplicationGuard>
  );
};

export default ReviewApplicationPage;
