/**
 * Audit Results Table Component
 * Displays accessibility audits with view details action
 */

import React from 'react';
import { Eye, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AccessibilityAudit, WCAGLevel } from '@/types';

interface AuditResultsTableProps {
  audits: AccessibilityAudit[];
  onViewDetails: (audit: AccessibilityAudit) => void;
}

const wcagColors: Record<WCAGLevel, string> = {
  A: 'bg-blue-100 text-blue-800 border-blue-200',
  AA: 'bg-green-100 text-green-800 border-green-200',
  AAA: 'bg-purple-100 text-purple-800 border-purple-200',
};

const getScoreColor = (score: number): string => {
  if (score >= 90) return 'text-green-600';
  if (score >= 75) return 'text-yellow-600';
  return 'text-red-600';
};

const getScoreBadgeColor = (score: number): string => {
  if (score >= 90) return 'bg-green-100 text-green-800 border-green-200';
  if (score >= 75) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  return 'bg-red-100 text-red-800 border-red-200';
};

export function AuditResultsTable({ audits, onViewDetails }: AuditResultsTableProps) {
  if (audits.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-600">
          No audits found. Accessibility audits will appear here once conducted.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/4">Page</TableHead>
            <TableHead className="w-1/6">WCAG Level</TableHead>
            <TableHead className="w-1/6">Compliance Score</TableHead>
            <TableHead className="w-1/6">Issues</TableHead>
            <TableHead className="w-1/6">Audit Date</TableHead>
            <TableHead className="w-24 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {audits.map((audit) => (
            <TableRow key={audit.id} className="hover:bg-gray-50">
              <TableCell className="font-medium">
                <div>
                  <div className="font-semibold text-gray-900">{audit.page_title || 'Untitled'}</div>
                  <div className="text-sm text-gray-500 truncate max-w-xs" title={audit.page_url}>
                    {audit.page_url}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  className={`${wcagColors[audit.wcag_level]} border`}
                  variant="secondary"
                >
                  WCAG {audit.wcag_level}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge
                    className={`${getScoreBadgeColor(Number(audit.compliance_score))} border`}
                    variant="secondary"
                  >
                    {audit.compliance_score}%
                  </Badge>
                  <TrendingUp
                    className={`h-4 w-4 ${getScoreColor(Number(audit.compliance_score))}`}
                    aria-hidden="true"
                  />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{audit.total_issues}</span>
                  {audit.critical_issues > 0 && (
                    <div className="flex items-center gap-1 text-red-600" title="Critical issues">
                      <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                      <span className="text-xs font-medium">{audit.critical_issues}</span>
                    </div>
                  )}
                  {audit.high_issues > 0 && (
                    <div className="flex items-center gap-1 text-orange-600" title="High severity issues">
                      <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                      <span className="text-xs font-medium">{audit.high_issues}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {new Date(audit.audit_date).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onViewDetails(audit)}
                  aria-label={`View details for ${audit.page_title || audit.page_url}`}
                  className="hover:bg-gray-100 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
