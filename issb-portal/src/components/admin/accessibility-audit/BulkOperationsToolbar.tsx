/**
 * Bulk Operations Toolbar - Phase 3C.2
 * Toolbar for bulk actions on selected issues
 */

import React, { useState } from 'react';
import { Check, Download, Trash2, Users, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useBulkUpdateIssues,
  useBulkDeleteIssues,
  useBulkExportIssues,
  useTeamMembers,
} from '@/hooks/useAccessibilityAuditEnhanced';

interface BulkOperationsToolbarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onSuccess: () => void;
}

export function BulkOperationsToolbar({
  selectedIds,
  onClearSelection,
  onSuccess,
}: BulkOperationsToolbarProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>('');

  const { data: teamMembers } = useTeamMembers();
  const bulkUpdate = useBulkUpdateIssues();
  const bulkDelete = useBulkDeleteIssues();
  const bulkExport = useBulkExportIssues();

  const handleBulkStatusUpdate = async (status: string) => {
    await bulkUpdate.mutateAsync({
      issueIds: selectedIds,
      updates: { status },
    });
    onSuccess();
    onClearSelection();
  };

  const handleBulkPriorityUpdate = async (priority: string) => {
    await bulkUpdate.mutateAsync({
      issueIds: selectedIds,
      updates: { priority },
    });
    onSuccess();
    onClearSelection();
  };

  const handleBulkAssign = async (assigneeId: string, assigneeName: string) => {
    await bulkUpdate.mutateAsync({
      issueIds: selectedIds,
      updates: {
        assigned_to: assigneeId,
        assigned_to_name: assigneeName,
        status: 'assigned',
      },
    });
    onSuccess();
    onClearSelection();
  };

  const handleBulkDelete = async () => {
    await bulkDelete.mutateAsync(selectedIds);
    setShowDeleteConfirm(false);
    onSuccess();
    onClearSelection();
  };

  const handleExport = async (format: 'csv' | 'json') => {
    await bulkExport.mutateAsync({
      issueIds: selectedIds,
      format: { format },
    });
  };

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">
                {selectedIds.length} issue{selectedIds.length !== 1 ? 's' : ''} selected
              </span>
            </div>

            <Button variant="ghost" size="sm" onClick={onClearSelection}>
              Clear Selection
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Update Status */}
            <Select value={bulkAction} onValueChange={(value) => {
              setBulkAction(value);
              if (value.startsWith('status:')) {
                const status = value.replace('status:', '');
                handleBulkStatusUpdate(status);
              } else if (value.startsWith('priority:')) {
                const priority = value.replace('priority:', '');
                handleBulkPriorityUpdate(priority);
              }
            }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Bulk Action..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status:assigned">Mark as Assigned</SelectItem>
                <SelectItem value="status:in_progress">Mark as In Progress</SelectItem>
                <SelectItem value="status:under_review">Mark as Under Review</SelectItem>
                <SelectItem value="status:resolved">Mark as Resolved</SelectItem>
                <SelectItem value="status:closed">Mark as Closed</SelectItem>
                <SelectItem value="priority:critical">Set Priority: Critical</SelectItem>
                <SelectItem value="priority:high">Set Priority: High</SelectItem>
                <SelectItem value="priority:medium">Set Priority: Medium</SelectItem>
                <SelectItem value="priority:low">Set Priority: Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Assign to Team Member */}
            {teamMembers && teamMembers.length > 0 && (
              <Select onValueChange={(value) => {
                const member = teamMembers.find(m => m.id === value);
                if (member) {
                  handleBulkAssign(member.id, member.full_name);
                }
              }}>
                <SelectTrigger className="w-[200px]">
                  <Users className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Assign to..." />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.full_name} ({member.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Export */}
            <Select onValueChange={(value) => {
              if (value === 'csv' || value === 'json') {
                handleExport(value);
              }
            }}>
              <SelectTrigger className="w-[150px]">
                <Download className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Export..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">Export as CSV</SelectItem>
                <SelectItem value="json">Export as JSON</SelectItem>
              </SelectContent>
            </Select>

            {/* Delete */}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Selected
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Confirm Bulk Delete
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.length} issue{selectedIds.length !== 1 ? 's' : ''}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete {selectedIds.length} Issue{selectedIds.length !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
