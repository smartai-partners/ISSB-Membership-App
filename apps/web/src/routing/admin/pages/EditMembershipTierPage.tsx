/**
 * Edit Membership Tier Page
 * Form for editing an existing membership tier
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AdminMembershipGuard } from '@/routing/admin/guards';

const EditMembershipTierPage: React.FC = () => {
  const { tierId } = useParams<{ tierId: string }>();

  return (
    <AdminMembershipGuard requiredPermission="membership:write">
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Edit Membership Tier - ID: {tierId}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Edit membership tier configuration and settings.
              </p>
              <div className="border rounded-lg p-4 bg-yellow-50">
                <h3 className="font-semibold mb-2">Tier Edit Form</h3>
                <p className="text-sm text-gray-500">
                  This page will allow editing tier properties, benefits, and pricing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminMembershipGuard>
  );
};

export default EditMembershipTierPage;
