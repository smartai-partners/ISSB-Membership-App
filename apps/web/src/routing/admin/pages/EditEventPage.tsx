/**
 * Edit Event Page
 * Form for editing an existing event
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AdminEventGuard } from '@/routing/admin/guards';

const EditEventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  return (
    <AdminEventGuard requiredPermission="event:write">
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Edit Event - ID: {eventId}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Edit event details, scheduling, and configuration.
              </p>
              <div className="border rounded-lg p-4 bg-yellow-50">
                <h3 className="font-semibold mb-2">Event Edit Form</h3>
                <p className="text-sm text-gray-500">
                  This page will allow updating event information, schedule changes,
                  capacity adjustments, and registration settings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminEventGuard>
  );
};

export default EditEventPage;
