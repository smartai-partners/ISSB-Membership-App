/**
 * Audit Results Section
 * Display and filter accessibility audit results
 */

import React, { useState } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AuditResultsTable } from '@/components/admin/accessibility-audit/AuditResultsTable';
import { AuditDetailModal } from '@/components/admin/accessibility-audit/AuditDetailModal';
import { useAccessibilityAudits, useAuditedPages } from '@/hooks/useAccessibilityAudit';
import { extractErrorMessage } from '@/lib/error-mapping';
import type { AccessibilityAudit, WCAGLevel } from '@/types';

export function AuditResultsSection() {
  const [pageFilter, setPageFilter] = useState<string>('all');
  const [wcagFilter, setWcagFilter] = useState<WCAGLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAudit, setSelectedAudit] = useState<AccessibilityAudit | null>(null);

  // Fetch data
  const { data, isLoading, error, refetch } = useAccessibilityAudits({
    pageUrl: pageFilter !== 'all' ? pageFilter : undefined,
    wcagLevel: wcagFilter !== 'all' ? wcagFilter : undefined,
  });

  const { data: pagesData } = useAuditedPages();
  const pages = pagesData || [];

  const handleViewDetails = (audit: AccessibilityAudit) => {
    setSelectedAudit(audit);
  };

  const handleCloseModal = () => {
    setSelectedAudit(null);
  };

  const handleSuccess = () => {
    handleCloseModal();
    refetch();
  };

  // Filter audits by search query
  const filteredAudits = data?.audits.filter((audit) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      audit.page_url.toLowerCase().includes(query) ||
      audit.page_title?.toLowerCase().includes(query) ||
      audit.notes?.toLowerCase().includes(query)
    );
  });

  if (error) {
    return (
      <div
        role="alert"
        aria-live="polite"
        className="text-center py-12 bg-white rounded-lg border border-gray-200"
      >
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Audits</h2>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Audit Results</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredAudits?.length || 0} audit{(filteredAudits?.length || 0) !== 1 ? 's' : ''}{' '}
            found
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="audit-search" className="sr-only">
              Search audits
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                aria-hidden="true"
              />
              <Input
                id="audit-search"
                type="text"
                placeholder="Search by page URL or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                aria-label="Search audits by page URL or title"
              />
            </div>
          </div>

          {/* Page Filter */}
          <div>
            <label htmlFor="page-filter" className="sr-only">
              Filter by page
            </label>
            <Select value={pageFilter} onValueChange={setPageFilter}>
              <SelectTrigger id="page-filter" aria-label="Filter by page">
                <SelectValue placeholder="All Pages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pages</SelectItem>
                {pages.map((page) => (
                  <SelectItem key={page} value={page}>
                    {page}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* WCAG Level Filter */}
          <div>
            <label htmlFor="wcag-filter" className="sr-only">
              Filter by WCAG level
            </label>
            <Select value={wcagFilter} onValueChange={(value) => setWcagFilter(value as WCAGLevel | 'all')}>
              <SelectTrigger id="wcag-filter" aria-label="Filter by WCAG level">
                <SelectValue placeholder="All WCAG Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All WCAG Levels</SelectItem>
                <SelectItem value="A">Level A</SelectItem>
                <SelectItem value="AA">Level AA</SelectItem>
                <SelectItem value="AAA">Level AAA</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Audit Results Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <span className="sr-only">Loading audits...</span>
        </div>
      ) : (
        <AuditResultsTable audits={filteredAudits || []} onViewDetails={handleViewDetails} />
      )}

      {/* Audit Detail Modal */}
      {selectedAudit && (
        <AuditDetailModal
          isOpen={!!selectedAudit}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
          audit={selectedAudit}
        />
      )}
    </div>
  );
}
