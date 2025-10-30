/**
 * Create Membership Tier Page
 * Form for creating a new membership tier
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AdminMembershipGuard } from '@/routing/admin/guards';

const CreateMembershipTierPage: React.FC = () => {
  return (
    <AdminMembershipGuard requiredPermission="membership:write">
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Membership Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Create a new membership tier with custom benefits and pricing.
              </p>
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold mb-2">Tier Creation Form</h3>
                <p className="text-sm text-gray-500">
                  This page will contain a comprehensive form for defining new membership tiers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminMembershipGuard>
  );
};

export default CreateMembershipTierPage;
