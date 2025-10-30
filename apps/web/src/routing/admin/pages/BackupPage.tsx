/**
 * Backup Management Page
 * Page for managing system backups and recovery
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AdminSystemGuard } from '@/routing/admin/guards';

const BackupPage: React.FC = () => {
  return (
    <AdminSystemGuard requiredPermission="system:manage">
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Backup Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Manage system backups, scheduling, and recovery options.
              </p>
              <div className="border rounded-lg p-4 bg-indigo-50">
                <h3 className="font-semibold mb-2">Backup Tools</h3>
                <p className="text-sm text-gray-500">
                  This page will provide backup management tools including
                  manual backups, scheduling, restore operations, and storage management.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminSystemGuard>
  );
};

export default BackupPage;
