import React, { useState } from 'react';
import {
  useGetVolunteerProgressQuery,
  useApproveVolunteerHoursMutation,
  VolunteerHour
} from '@/store/api/membershipApi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

export const AdminVolunteerHoursPage: React.FC = () => {
  const { data: allVolunteerData, isLoading, refetch } = useGetVolunteerProgressQuery();
  const [approveHours, { isLoading: approving }] = useApproveVolunteerHoursMutation();
  const [selectedHour, setSelectedHour] = useState<VolunteerHour | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const handleApprove = async (hourId: string) => {
    try {
      await approveHours({
        volunteerHourId: hourId,
        action: 'approve',
        adminNotes
      }).unwrap();
      alert('Volunteer hours approved successfully');
      setAdminNotes('');
      refetch();
    } catch (error: any) {
      alert(error.error || 'Failed to approve hours');
    }
  };

  const handleReject = async (hourId: string) => {
    if (!rejectionReason) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      await approveHours({
        volunteerHourId: hourId,
        action: 'reject',
        rejectionReason,
        adminNotes
      }).unwrap();
      alert('Volunteer hours rejected');
      setRejectionReason('');
      setAdminNotes('');
      setSelectedHour(null);
      refetch();
    } catch (error: any) {
      alert(error.error || 'Failed to reject hours');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingHours = allVolunteerData?.volunteerHours?.filter(h => h.status === 'pending') || [];
  const approvedHours = allVolunteerData?.volunteerHours?.filter(h => h.status === 'approved') || [];
  const rejectedHours = allVolunteerData?.volunteerHours?.filter(h => h.status === 'rejected') || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Volunteer Hours Management
          </h1>
          <p className="text-gray-600">
            Approve or reject volunteer hour submissions
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Approval</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingHours.length}</p>
              </div>
              <Clock className="h-12 w-12 text-yellow-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Approved</p>
                <p className="text-3xl font-bold text-green-600">{approvedHours.length}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{rejectedHours.length}</p>
              </div>
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
          </Card>
        </div>

        {/* Pending Hours */}
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Pending Approvals</h2>
          {pendingHours.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No pending volunteer hours to review
            </p>
          ) : (
            <div className="space-y-4">
              {pendingHours.map((hour) => (
                <div
                  key={hour.id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <Badge className="bg-yellow-600 mr-2">Pending</Badge>
                      <span className="font-semibold text-lg">{hour.hours} hours</span>
                    </div>
                    <p className="text-gray-700 mb-1"><strong>Date:</strong> {new Date(hour.date).toLocaleDateString()}</p>
                    <p className="text-gray-700 mb-1"><strong>Description:</strong> {hour.description}</p>
                    <p className="text-sm text-gray-500">
                      Submitted: {new Date(hour.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col space-y-2 ml-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            setSelectedHour(hour);
                            setAdminNotes('');
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Approve Volunteer Hours</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <p><strong>Hours:</strong> {hour.hours}</p>
                            <p><strong>Date:</strong> {new Date(hour.date).toLocaleDateString()}</p>
                            <p><strong>Description:</strong> {hour.description}</p>
                          </div>
                          <div>
                            <Label htmlFor="admin_notes">Admin Notes (Optional)</Label>
                            <Input
                              id="admin_notes"
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              placeholder="Add any notes..."
                            />
                          </div>
                          <Button
                            onClick={() => handleApprove(hour.id)}
                            disabled={approving}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            {approving ? 'Approving...' : 'Confirm Approval'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-600 text-red-600 hover:bg-red-50"
                          onClick={() => {
                            setSelectedHour(hour);
                            setRejectionReason('');
                            setAdminNotes('');
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject Volunteer Hours</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <p><strong>Hours:</strong> {hour.hours}</p>
                            <p><strong>Date:</strong> {new Date(hour.date).toLocaleDateString()}</p>
                            <p><strong>Description:</strong> {hour.description}</p>
                          </div>
                          <div>
                            <Label htmlFor="rejection_reason">Rejection Reason *</Label>
                            <Input
                              id="rejection_reason"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Reason for rejection..."
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="admin_notes_reject">Admin Notes (Optional)</Label>
                            <Input
                              id="admin_notes_reject"
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              placeholder="Add any notes..."
                            />
                          </div>
                          <Button
                            onClick={() => handleReject(hour.id)}
                            disabled={approving || !rejectionReason}
                            className="w-full bg-red-600 hover:bg-red-700"
                          >
                            {approving ? 'Rejecting...' : 'Confirm Rejection'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Approved Hours */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Recently Approved</h2>
          {approvedHours.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No approved volunteer hours yet
            </p>
          ) : (
            <div className="space-y-3">
              {approvedHours.slice(0, 10).map((hour) => (
                <div
                  key={hour.id}
                  className="flex items-center justify-between p-3 bg-green-50 rounded"
                >
                  <div>
                    <span className="font-semibold">{hour.hours} hours</span>
                    <span className="text-gray-600 ml-4">{new Date(hour.date).toLocaleDateString()}</span>
                    <p className="text-sm text-gray-600">{hour.description}</p>
                  </div>
                  <Badge className="bg-green-600">Approved</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
