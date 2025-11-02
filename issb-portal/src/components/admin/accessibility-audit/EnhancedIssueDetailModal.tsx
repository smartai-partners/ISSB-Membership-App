/**
 * Enhanced Issue Detail Modal - Phase 3C.2
 * Detailed view of issue with timeline, assignment, and enhanced fields
 */

import React, { useState } from 'react';
import { X, Clock, User, Calendar, AlertCircle, CheckCircle, Code, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  useIssueTimeline,
  useUpdateIssue,
  useTeamMembers,
} from '@/hooks/useAccessibilityAuditEnhanced';
import type { AccessibilityIssue, IssueSeverity, IssueStatus } from '@/types';

interface EnhancedIssueDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: AccessibilityIssue;
  onSuccess: () => void;
}

const severityColors: Record<IssueSeverity, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-blue-100 text-blue-800 border-blue-200',
};

const statusColors: Record<IssueStatus, string> = {
  open: 'bg-red-100 text-red-800 border-red-200',
  assigned: 'bg-purple-100 text-purple-800 border-purple-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  under_review: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200',
  wont_fix: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function EnhancedIssueDetailModal({
  isOpen,
  onClose,
  issue,
  onSuccess,
}: EnhancedIssueDetailModalProps) {
  const [resolutionNotes, setResolutionNotes] = useState(issue.resolution_notes || '');

  const { data: timeline, isLoading: timelineLoading } = useIssueTimeline(issue.id);
  const { data: teamMembers } = useTeamMembers();
  const updateIssue = useUpdateIssue();

  const handleUpdateStatus = async (status: IssueStatus) => {
    await updateIssue.mutateAsync({
      id: issue.id,
      updates: { status },
    });
    onSuccess();
  };

  const handleUpdateAssignee = async (assigneeId: string) => {
    const member = teamMembers?.find(m => m.id === assigneeId);
    if (member) {
      await updateIssue.mutateAsync({
        id: issue.id,
        updates: {
          assigned_to: member.id,
          assigned_to_name: member.full_name,
          status: 'assigned',
        },
      });
      onSuccess();
    }
  };

  const handleUpdatePriority = async (priority: string) => {
    await updateIssue.mutateAsync({
      id: issue.id,
      updates: { priority },
    });
    onSuccess();
  };

  const handleSaveResolution = async () => {
    await updateIssue.mutateAsync({
      id: issue.id,
      updates: {
        resolution_notes: resolutionNotes,
        status: 'resolved',
      },
    });
    onSuccess();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl">{issue.description}</DialogTitle>
              <DialogDescription className="mt-2 flex items-center gap-2 flex-wrap">
                <Badge className={severityColors[issue.severity]}>
                  {issue.severity}
                </Badge>
                <Badge className={statusColors[issue.status]}>
                  {issue.status.replace('_', ' ')}
                </Badge>
                {issue.wcag_criteria && (
                  <Badge variant="outline">WCAG {issue.wcag_criteria}</Badge>
                )}
                {issue.component_name && (
                  <Badge variant="outline">{issue.component_name}</Badge>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="resolution">Resolution</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-4">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label>Status</Label>
                <Select value={issue.status} onValueChange={handleUpdateStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="wont_fix">Won't Fix</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Assigned To</Label>
                <Select
                  value={issue.assigned_to || 'unassigned'}
                  onValueChange={handleUpdateAssignee}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {teamMembers?.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Priority</Label>
                <Select
                  value={issue.priority || 'medium'}
                  onValueChange={handleUpdatePriority}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Issue Information */}
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1">Issue Type</h4>
                <p className="text-gray-900">{issue.issue_type}</p>
              </div>

              {issue.wcag_criteria && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-1">WCAG Criteria</h4>
                  <p className="text-gray-900">{issue.wcag_criteria}</p>
                </div>
              )}

              {issue.element_selector && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-1">Affected Element</h4>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {issue.element_selector}
                  </code>
                </div>
              )}

              {issue.affected_users && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-1 flex items-center gap-1">
                    <UsersIcon className="h-4 w-4" />
                    Affected Users
                  </h4>
                  <p className="text-gray-900">{issue.affected_users}</p>
                </div>
              )}

              {issue.estimated_effort && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-1 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Estimated Effort
                  </h4>
                  <p className="text-gray-900">{issue.estimated_effort}</p>
                </div>
              )}

              {issue.deadline && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-1 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Deadline
                  </h4>
                  <p className="text-gray-900">{formatDate(issue.deadline)}</p>
                </div>
              )}

              {issue.recommendation && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-1">Recommended Fix</h4>
                  <p className="text-gray-900">{issue.recommendation}</p>
                </div>
              )}

              {issue.code_example && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-1 flex items-center gap-1">
                    <Code className="h-4 w-4" />
                    Code Example
                  </h4>
                  <pre className="text-sm bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                    <code>{issue.code_example}</code>
                  </pre>
                </div>
              )}

              {issue.verification_status && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-1">Verification Status</h4>
                  <Badge
                    variant={
                      issue.verification_status === 'verified'
                        ? 'default'
                        : issue.verification_status === 'failed'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {issue.verification_status}
                  </Badge>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="mt-4">
            {timelineLoading ? (
              <div className="text-center py-8 text-gray-500">Loading timeline...</div>
            ) : timeline && timeline.length > 0 ? (
              <div className="space-y-3">
                {timeline.map((entry) => (
                  <div
                    key={entry.id}
                    className="border-l-2 border-gray-300 pl-4 pb-4 relative"
                  >
                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {entry.action_type.replace('_', ' ')}
                        </p>
                        {entry.old_value && entry.new_value && (
                          <p className="text-sm text-gray-600">
                            {entry.old_value} → {entry.new_value}
                          </p>
                        )}
                        {entry.notes && (
                          <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>{entry.changed_by_name || 'System'}</p>
                        <p>{formatDate(entry.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No timeline entries yet
              </div>
            )}
          </TabsContent>

          {/* Resolution Tab */}
          <TabsContent value="resolution" className="mt-4 space-y-4">
            <div>
              <Label htmlFor="resolution">Resolution Notes</Label>
              <Textarea
                id="resolution"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe how this issue was resolved..."
                rows={6}
                className="mt-1"
              />
            </div>

            {issue.status !== 'resolved' && issue.status !== 'closed' && (
              <Button
                onClick={handleSaveResolution}
                disabled={!resolutionNotes.trim()}
                className="w-full"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Resolved
              </Button>
            )}

            {issue.resolution_notes && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Previous Resolution</h4>
                <p className="text-gray-700">{issue.resolution_notes}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
