/**
 * Accessibility Audit Hooks
 * TanStack Query hooks for accessibility audit and issue management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAccessibilityAudits,
  getAuditById,
  getAuditSummaryMetrics,
  deleteAudit,
  getAccessibilityIssues,
  updateIssueStatus,
  deleteIssue,
  getIssueTypes,
  getAuditedPages,
  type AuditFilters,
  type IssueFilters,
} from '@/lib/accessibility-audit-api';
import type { IssueStatus } from '@/types';
import { toastSuccess, toastError, toastLoading, dismissToast } from '@/lib/toast-service';
import { mapSupabaseError } from '@/lib/error-mapping';

// ===== Accessibility Audits Hooks =====

export function useAccessibilityAudits(filters?: AuditFilters) {
  return useQuery({
    queryKey: ['accessibility-audits', filters],
    queryFn: () => getAccessibilityAudits(filters),
  });
}

export function useAuditById(id: string) {
  return useQuery({
    queryKey: ['accessibility-audit', id],
    queryFn: () => getAuditById(id),
    enabled: !!id,
  });
}

export function useAuditSummaryMetrics() {
  return useQuery({
    queryKey: ['audit-summary-metrics'],
    queryFn: getAuditSummaryMetrics,
  });
}

export function useAuditedPages() {
  return useQuery({
    queryKey: ['audited-pages'],
    queryFn: getAuditedPages,
  });
}

export function useDeleteAudit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      const toastId = toastLoading.deleting();
      return deleteAudit(id).finally(() => dismissToast(toastId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accessibility-audits'] });
      queryClient.invalidateQueries({ queryKey: ['audit-summary-metrics'] });
      toastSuccess.userDeleted();
    },
    onError: (error: any) => {
      const mappedError = mapSupabaseError(error);
      toastError.deleteFailed(mappedError.message);
    },
  });
}

// ===== Accessibility Issues Hooks =====

export function useAccessibilityIssues(filters?: IssueFilters) {
  return useQuery({
    queryKey: ['accessibility-issues', filters],
    queryFn: () => getAccessibilityIssues(filters),
  });
}

export function useIssueTypes() {
  return useQuery({
    queryKey: ['issue-types'],
    queryFn: getIssueTypes,
  });
}

export function useUpdateIssueStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: IssueStatus }) => {
      const toastId = toastLoading.saving();
      return updateIssueStatus(id, status).finally(() => dismissToast(toastId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accessibility-issues'] });
      queryClient.invalidateQueries({ queryKey: ['accessibility-audit'] });
      queryClient.invalidateQueries({ queryKey: ['audit-summary-metrics'] });
      toastSuccess.statusUpdated('Issue', 'updated');
    },
    onError: (error: any) => {
      const mappedError = mapSupabaseError(error);
      toastError.updateFailed(mappedError.message);
    },
  });
}

export function useDeleteIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      const toastId = toastLoading.deleting();
      return deleteIssue(id).finally(() => dismissToast(toastId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accessibility-issues'] });
      queryClient.invalidateQueries({ queryKey: ['accessibility-audit'] });
      queryClient.invalidateQueries({ queryKey: ['audit-summary-metrics'] });
      toastSuccess.userDeleted();
    },
    onError: (error: any) => {
      const mappedError = mapSupabaseError(error);
      toastError.deleteFailed(mappedError.message);
    },
  });
}
