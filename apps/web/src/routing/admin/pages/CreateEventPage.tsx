/**
 * Create Event Page
 * Form for creating a new event
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AdminEventGuard } from '@/routing/admin/guards';

const CreateEventPage: React.FC = () => {
  return (
    <AdminEventGuard requiredPermission="event:write">
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Create a new event with detailed scheduling and configuration.
              </p>
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold mb-2">Event Creation Form</h3>
                <p className="text-sm text-gray-500">
                  This page will contain a comprehensive form for creating new events
                  including scheduling, capacity, registration settings, and notifications.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminEventGuard>
  );
};

export default CreateEventPage;
