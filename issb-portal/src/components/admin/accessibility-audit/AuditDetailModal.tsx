/**
 * Audit Detail Modal
 * View full audit details with all associated issues
 */

import React, { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle, FileText, Calendar, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuditById, useUpdateIssueStatus, useDeleteAudit } from '@/hooks/useAccessibilityAudit';
import type { AccessibilityAudit, IssueSeverity, IssueStatus, WCAGLevel } from '@/types';

interface AuditDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  audit: AccessibilityAudit;
}

const severityColors: Record<IssueSeverity, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-blue-100 text-blue-800 border-blue-200',
};

const statusColors: Record<IssueStatus, string> = {
  open: 'bg-red-100 text-red-800 border-red-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  wont_fix: 'bg-gray-100 text-gray-800 border-gray-200',
};

const wcagColors: Record<WCAGLevel, string> = {
  A: 'bg-blue-100 text-blue-800 border-blue-200',
  AA: 'bg-green-100 text-green-800 border-green-200',
  AAA: 'bg-purple-100 text-purple-800 border-purple-200',
};

export function AuditDetailModal({ isOpen, onClose, onSuccess, audit }: AuditDetailModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const { data, isLoading, error } = useAuditById(audit.id);
  const updateStatusMutation = useUpdateIssueStatus();
  const deleteAuditMutation = useDeleteAudit();

  const handleUpdateIssueStatus = async (issueId: string, newStatus: IssueStatus) => {
    await updateStatusMutation.mutateAsync({ id: issueId, status: newStatus });
    // Refresh will happen via query invalidation
  };

  const handleDeleteAudit = async () => {
    await deleteAuditMutation.mutateAsync(audit.id);
    onSuccess();
  };

  if (showDeleteConfirm) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Delete Audit</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this audit? This action cannot be undone and will
              also delete all associated issues.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="text-sm">
              <p className="font-semibold text-gray-900 mb-2">Audit:</p>
              <p className="text-gray-700">{audit.page_title || audit.page_url}</p>
              <p className="text-gray-600 mt-2">
                This will delete {audit.total_issues} issue{audit.total_issues !== 1 ? 's' : ''}.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleteAuditMutation.isPending}
              className="focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAudit}
              disabled={deleteAuditMutation.isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              {deleteAuditMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Audit'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Audit Details</DialogTitle>
          <DialogDescription>
            View audit results and manage accessibility issues
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12" role="status">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              <span className="sr-only">Loading audit details...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4" role="alert">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <strong>Error loading audit details</strong>
                  <p className="mt-1">Please try again or contact support if the problem persists.</p>
                </div>
              </div>
            </div>
          )}

          {/* Audit Details */}
          {data && (
            <>
              {/* Audit Metadata */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Page
                  </p>
                  <p className="text-sm text-gray-900 mt-1 font-semibold">
                    {data.page_title || 'Untitled'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{data.page_url}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Compliance Score
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-2xl font-bold text-gray-900">{data.compliance_score}%</p>
                    <Badge className={`${wcagColors[data.wcag_level]} border`} variant="secondary">
                      WCAG {data.wcag_level}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Audit Date
                  </p>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(data.audit_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Total Issues
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{data.total_issues}</p>
                </div>
              </div>

              {/* Issue Summary */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Issues by Severity</h4>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">{data.critical_issues}</p>
                    <p className="text-xs text-gray-600 mt-1">Critical</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-orange-600">{data.high_issues}</p>
                    <p className="text-xs text-gray-600 mt-1">High</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{data.medium_issues}</p>
                    <p className="text-xs text-gray-600 mt-1">Medium</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{data.low_issues}</p>
                    <p className="text-xs text-gray-600 mt-1">Low</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {data.notes && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Audit Notes</p>
                  <p className="text-sm text-gray-700">{data.notes}</p>
                </div>
              )}

              {/* Issues Table */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Detailed Issues ({data.issues.length})
                </h4>
                {data.issues.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                    <p className="text-gray-600">No issues found. This page has excellent accessibility!</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Issue</TableHead>
                          <TableHead className="w-24">Severity</TableHead>
                          <TableHead className="w-28">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.issues.map((issue) => (
                          <TableRow key={issue.id}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-start gap-2">
                                  <Badge className="bg-gray-100 text-gray-700 border-gray-200 border text-xs">
                                    {issue.issue_type}
                                  </Badge>
                                  {issue.wcag_criterion && (
                                    <Badge className="bg-purple-100 text-purple-700 border-purple-200 border text-xs">
                                      {issue.wcag_criterion}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm font-medium text-gray-900">{issue.description}</p>
                                {issue.affected_component && (
                                  <p className="text-xs text-gray-600">
                                    Affected: {issue.affected_component}
                                  </p>
                                )}
                                {issue.recommended_fix && (
                                  <p className="text-xs text-green-700 bg-green-50 p-2 rounded">
                                    Fix: {issue.recommended_fix}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`${severityColors[issue.severity]} border capitalize`}
                                variant="secondary"
                              >
                                {issue.severity}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={issue.status}
                                onValueChange={(value) => handleUpdateIssueStatus(issue.id, value as IssueStatus)}
                                disabled={updateStatusMutation.isPending}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                  <SelectItem value="wont_fix">Won't Fix</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteAuditMutation.isPending}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Delete Audit
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            onClick={onClose}
            className="focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
