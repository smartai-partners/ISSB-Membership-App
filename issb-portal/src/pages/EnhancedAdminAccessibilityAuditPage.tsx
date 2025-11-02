/**
 * Enhanced Admin Accessibility Audit Page - Phase 3C.2
 * Main page with advanced filtering, bulk operations, and enhanced issue details
 */

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AuditDashboard } from '@/components/admin/accessibility-audit/AuditDashboard';
import { EnhancedFilterPanel } from '@/components/admin/accessibility-audit/EnhancedFilterPanel';
import { BulkOperationsToolbar } from '@/components/admin/accessibility-audit/BulkOperationsToolbar';
import { EnhancedIssueDetailModal } from '@/components/admin/accessibility-audit/EnhancedIssueDetailModal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useEnhancedIssues } from '@/hooks/useAccessibilityAuditEnhanced';
import type { EnhancedIssueFilters } from '@/lib/accessibility-audit-api-enhanced';
import type { AccessibilityIssue, IssueSeverity, IssueStatus } from '@/types';

const severityColors: Record<IssueSeverity, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-blue-100 text-blue-800 border-blue-200',
};

const statusColors: Record<IssueStatus, string> = {
  open: 'bg-red-100 text-red-800',
  assigned: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-blue-100 text-blue-800',
  under_review: 'bg-indigo-100 text-indigo-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
  wont_fix: 'bg-gray-100 text-gray-800',
};

export default function EnhancedAdminAccessibilityAuditPage() {
  const [filters, setFilters] = useState<EnhancedIssueFilters>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<AccessibilityIssue | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, isLoading, refetch } = useEnhancedIssues(filters, pageSize, page * pageSize);

  const issues = data?.issues || [];
  const total = data?.total || 0;
  const pageCount = Math.ceil(total / pageSize);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(issues.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleSuccess = () => {
    refetch();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Accessibility Audit</h1>
        <p className="text-gray-600 mt-1">
          Manage and track WCAG compliance issues across the portal
        </p>
      </div>

      {/* Dashboard Metrics */}
      <AuditDashboard />

      {/* Advanced Filter Panel */}
      <EnhancedFilterPanel onFilterChange={setFilters} initialFilters={filters} />

      {/* Bulk Operations Toolbar */}
      {selectedIds.length > 0 && (
        <BulkOperationsToolbar
          selectedIds={selectedIds}
          onClearSelection={handleClearSelection}
          onSuccess={handleSuccess}
        />
      )}

      {/* Issues Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Issues {total > 0 && `(${total})`}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No issues found. Try adjusting your filters.
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.length === issues.length && issues.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Component</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(issue.id)}
                        onCheckedChange={(checked) =>
                          handleSelectOne(issue.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        <p className="font-medium text-gray-900 truncate">
                          {issue.description}
                        </p>
                        {issue.wcag_criteria && (
                          <p className="text-sm text-gray-500">
                            WCAG {issue.wcag_criteria}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={severityColors[issue.severity]}>
                        {issue.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[issue.status]}>
                        {issue.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {issue.priority && (
                        <Badge variant="outline">{issue.priority}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {issue.component_name || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {issue.assigned_to_name || 'Unassigned'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {formatDate(issue.created_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedIssue(issue)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {pageCount > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {page * pageSize + 1} to{' '}
                  {Math.min((page + 1) * pageSize, total)} of {total} issues
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {page + 1} of {pageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(pageCount - 1, page + 1))}
                    disabled={page >= pageCount - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Enhanced Issue Detail Modal */}
      {selectedIssue && (
        <EnhancedIssueDetailModal
          isOpen={!!selectedIssue}
          onClose={() => setSelectedIssue(null)}
          issue={selectedIssue}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
