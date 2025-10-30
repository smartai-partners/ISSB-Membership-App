/**
 * Membership Tier Page
 * Page for managing membership tier configurations
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AdminMembershipGuard } from '@/routing/admin/guards';

const MembershipTierPage: React.FC = () => {
  return (
    <AdminMembershipGuard requiredPermission="membership:read">
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Membership Tiers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Manage membership tier definitions and settings.
              </p>
              <div className="border rounded-lg p-4 bg-green-50">
                <h3 className="font-semibold mb-2">Tier Management</h3>
                <p className="text-sm text-gray-500">
                  This page will display all membership tiers with their settings,
                  pricing, benefits, and member counts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminMembershipGuard>
  );
};

export default MembershipTierPage;
