/**
 * Create User Page
 * Form for creating a new user account
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AdminUserManagementGuard } from '@/routing/admin/guards';

const CreateUserPage: React.FC = () => {
  return (
    <AdminUserManagementGuard requiredPermission="user:write">
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Create a new user account with this form.
              </p>
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold mb-2">User Creation Form</h3>
                <p className="text-sm text-gray-500">
                  This page will contain a comprehensive form for creating new users
                  including role assignment, tier selection, and initial settings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminUserManagementGuard>
  );
};

export default CreateUserPage;
