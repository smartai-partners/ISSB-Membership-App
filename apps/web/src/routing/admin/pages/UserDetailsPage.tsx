/**
 * User Details Page
 * Shows detailed information about a specific user
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AdminUserManagementGuard } from '@/routing/admin/guards';

const UserDetailsPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();

  return (
    <AdminUserManagementGuard requiredPermission="user:read">
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>User Details - ID: {userId}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Detailed user information will be displayed here.
              </p>
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-2">User ID: {userId}</h3>
                <p className="text-sm text-gray-500">
                  This page will show comprehensive user details including profile information, 
                  membership status, activity history, and permissions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminUserManagementGuard>
  );
};

export default UserDetailsPage;
