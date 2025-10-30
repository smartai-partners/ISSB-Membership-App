/**
 * Edit User Page
 * Form for editing an existing user account
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AdminUserManagementGuard } from '@/routing/admin/guards';

const EditUserPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();

  return (
    <AdminUserManagementGuard requiredPermission="user:write">
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Edit User - ID: {userId}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Edit user account information and settings.
              </p>
              <div className="border rounded-lg p-4 bg-yellow-50">
                <h3 className="font-semibold mb-2">User Edit Form</h3>
                <p className="text-sm text-gray-500">
                  This page will allow editing user profile, role, tier, and permissions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminUserManagementGuard>
  );
};

export default EditUserPage;
