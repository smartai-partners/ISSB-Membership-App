/**
 * Event Details Page
 * Shows detailed information about a specific event
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AdminEventGuard } from '@/routing/admin/guards';

const EventDetailsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  return (
    <AdminEventGuard requiredPermission="event:read">
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Event Details - ID: {eventId}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Detailed event information and management options.
              </p>
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-2">Event ID: {eventId}</h3>
                <p className="text-sm text-gray-500">
                  This page will show comprehensive event details including schedule,
                  attendees, registration status, and management tools.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminEventGuard>
  );
};

export default EventDetailsPage;
