/**
 * Audit Dashboard Component
 * Summary metrics and KPIs for accessibility audits
 */

import React from 'react';
import { AlertCircle, CheckCircle, TrendingUp, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuditSummaryMetrics } from '@/hooks/useAccessibilityAudit';
import { extractErrorMessage } from '@/lib/error-mapping';
import { Button } from '@/components/ui/button';

export function AuditDashboard() {
  const { data, isLoading, error, refetch } = useAuditSummaryMetrics();

  if (error) {
    return (
      <div
        role="alert"
        aria-live="polite"
        className="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
      >
        <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-600 mb-4">{extractErrorMessage(error)}</p>
        <Button
          onClick={() => refetch()}
          className="bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="sr-only">Loading dashboard metrics...</span>
      </div>
    );
  }

  const metrics = data || {
    totalAudits: 0,
    averageComplianceScore: 0,
    totalIssues: 0,
    criticalIssues: 0,
    highIssues: 0,
    mediumIssues: 0,
    lowIssues: 0,
    resolvedIssues: 0,
    openIssues: 0,
  };

  const complianceColor =
    metrics.averageComplianceScore >= 90
      ? 'text-green-600'
      : metrics.averageComplianceScore >= 75
      ? 'text-yellow-600'
      : 'text-red-600';

  return (
    <div className="space-y-6">
      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Audits */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Audits</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.totalAudits}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <FileText className="h-6 w-6 text-blue-600" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Average Compliance Score */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Compliance</p>
              <p className={`text-3xl font-bold mt-2 ${complianceColor}`}>
                {metrics.averageComplianceScore.toFixed(1)}%
              </p>
            </div>
            <div className={`${complianceColor.replace('text-', 'bg-').replace('600', '100')} rounded-full p-3`}>
              <TrendingUp className={`h-6 w-6 ${complianceColor}`} aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Total Issues */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Issues</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.totalIssues}</p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.criticalIssues} critical, {metrics.highIssues} high
              </p>
            </div>
            <div className="bg-orange-100 rounded-full p-3">
              <AlertTriangle className="h-6 w-6 text-orange-600" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Resolved vs Open */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Issue Status</p>
              <div className="flex items-center gap-4 mt-2">
                <div>
                  <p className="text-2xl font-bold text-green-600">{metrics.resolvedIssues}</p>
                  <p className="text-xs text-gray-500">Resolved</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{metrics.openIssues}</p>
                  <p className="text-xs text-gray-500">Open</p>
                </div>
              </div>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      {/* Issue Breakdown by Severity */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Issues by Severity</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="bg-red-100 rounded-lg p-4 mb-2">
              <p className="text-3xl font-bold text-red-600">{metrics.criticalIssues}</p>
            </div>
            <p className="text-sm font-medium text-gray-700">Critical</p>
          </div>
          <div className="text-center">
            <div className="bg-orange-100 rounded-lg p-4 mb-2">
              <p className="text-3xl font-bold text-orange-600">{metrics.highIssues}</p>
            </div>
            <p className="text-sm font-medium text-gray-700">High</p>
          </div>
          <div className="text-center">
            <div className="bg-yellow-100 rounded-lg p-4 mb-2">
              <p className="text-3xl font-bold text-yellow-600">{metrics.mediumIssues}</p>
            </div>
            <p className="text-sm font-medium text-gray-700">Medium</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 rounded-lg p-4 mb-2">
              <p className="text-3xl font-bold text-blue-600">{metrics.lowIssues}</p>
            </div>
            <p className="text-sm font-medium text-gray-700">Low</p>
          </div>
        </div>
      </div>
    </div>
  );
}
