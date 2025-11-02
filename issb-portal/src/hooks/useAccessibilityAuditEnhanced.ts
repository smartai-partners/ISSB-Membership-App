/**
 * Phase 3C.2: Enhanced Accessibility Audit Hooks
 * TanStack Query hooks for advanced filtering, bulk operations, and team management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as api from '@/lib/accessibility-audit-api-enhanced';
import type {
  TeamMember,
  FilterPreset,
  AuditTimeline,
  BulkUpdateResult,
  AuditAnalytics,
} from '@/types';

// Query Keys
export const queryKeys = {
  teamMembers: ['team-members'] as const,
  teamMember: (id: string) => ['team-member', id] as const,
  filterPresets: ['filter-presets'] as const,
  auditTimeline: (auditId: string) => ['audit-timeline', auditId] as const,
  issueTimeline: (issueId: string) => ['issue-timeline', issueId] as const,
  analytics: ['audit-analytics'] as const,
  enhancedIssues: (filters?: any) => ['enhanced-issues', filters] as const,
  components: ['components'] as const,
  assignees: ['assignees'] as const,
};

// ===== Team Members Hooks =====

export function useTeamMembers() {
  return useQuery({
    queryKey: queryKeys.teamMembers,
    queryFn: api.getTeamMembers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTeamMember(id: string) {
  return useQuery({
    queryKey: queryKeys.teamMember(id),
    queryFn: () => api.getTeamMemberById(id),
    enabled: !!id,
  });
}

export function useCreateTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (member: Omit<TeamMember, 'id' | 'created_at' | 'updated_at'>) =>
      api.createTeamMember(member),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teamMembers });
      toast.success('Team member added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add team member: ${error.message}`);
    },
  });
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TeamMember> }) =>
      api.updateTeamMember(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teamMembers });
      queryClient.invalidateQueries({ queryKey: queryKeys.teamMember(variables.id) });
      toast.success('Team member updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update team member: ${error.message}`);
    },
  });
}

export function useDeleteTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.deleteTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teamMembers });
      toast.success('Team member removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove team member: ${error.message}`);
    },
  });
}

// ===== Enhanced Issues Hooks =====

export function useEnhancedIssues(filters?: any, limit = 100, offset = 0) {
  return useQuery({
    queryKey: queryKeys.enhancedIssues({ filters, limit, offset }),
    queryFn: () => api.getEnhancedIssues(filters, limit, offset),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useUpdateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<any> }) =>
      api.updateIssue(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-issues'] });
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
      toast.success('Issue updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update issue: ${error.message}`);
    },
  });
}

// ===== Bulk Operations Hooks =====

export function useBulkUpdateIssues() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.bulkUpdateIssues,
    onSuccess: (result: BulkUpdateResult) => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-issues'] });
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
      
      if (result.failed > 0) {
        toast.warning(
          `Bulk update completed: ${result.success} succeeded, ${result.failed} failed`
        );
      } else {
        toast.success(`Successfully updated ${result.success} issues`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Bulk update failed: ${error.message}`);
    },
  });
}

export function useBulkDeleteIssues() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.bulkDeleteIssues,
    onSuccess: (result: BulkUpdateResult) => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-issues'] });
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
      
      if (result.failed > 0) {
        toast.warning(
          `Bulk delete completed: ${result.success} succeeded, ${result.failed} failed`
        );
      } else {
        toast.success(`Successfully deleted ${result.success} issues`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Bulk delete failed: ${error.message}`);
    },
  });
}

// ===== Timeline Hooks =====

export function useAuditTimeline(auditId: string) {
  return useQuery({
    queryKey: queryKeys.auditTimeline(auditId),
    queryFn: () => api.getAuditTimeline(auditId),
    enabled: !!auditId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useIssueTimeline(issueId: string) {
  return useQuery({
    queryKey: queryKeys.issueTimeline(issueId),
    queryFn: () => api.getIssueTimeline(issueId),
    enabled: !!issueId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useCreateTimelineEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createTimelineEntry,
    onSuccess: (_, variables) => {
      if (variables.audit_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.auditTimeline(variables.audit_id),
        });
      }
      if (variables.issue_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.issueTimeline(variables.issue_id),
        });
      }
    },
  });
}

// ===== Filter Presets Hooks =====

export function useFilterPresets() {
  return useQuery({
    queryKey: queryKeys.filterPresets,
    queryFn: api.getFilterPresets,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateFilterPreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preset: Omit<FilterPreset, 'id' | 'user_id' | 'created_at' | 'updated_at'>) =>
      api.createFilterPreset(preset),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.filterPresets });
      toast.success('Filter preset saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save filter preset: ${error.message}`);
    },
  });
}

export function useUpdateFilterPreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<FilterPreset> }) =>
      api.updateFilterPreset(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.filterPresets });
      toast.success('Filter preset updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update filter preset: ${error.message}`);
    },
  });
}

export function useDeleteFilterPreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.deleteFilterPreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.filterPresets });
      toast.success('Filter preset deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete filter preset: ${error.message}`);
    },
  });
}

// ===== Analytics Hooks =====

export function useAuditAnalytics() {
  return useQuery({
    queryKey: queryKeys.analytics,
    queryFn: api.getAuditAnalytics,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useIssuesByAssignee(assigneeId: string) {
  return useQuery({
    queryKey: ['issues-by-assignee', assigneeId],
    queryFn: () => api.getIssuesByAssignee(assigneeId),
    enabled: !!assigneeId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useOverdueIssues() {
  return useQuery({
    queryKey: ['overdue-issues'],
    queryFn: api.getOverdueIssues,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// ===== Utility Hooks =====

export function useComponents() {
  return useQuery({
    queryKey: queryKeys.components,
    queryFn: api.getComponents,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useAssignees() {
  return useQuery({
    queryKey: queryKeys.assignees,
    queryFn: api.getAssignees,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}


// ===== Bulk Export Hooks =====

export function useBulkExportIssues() {
  return useMutation({
    mutationFn: ({ issueIds, format }: { issueIds: string[]; format?: api.ExportFormat }) =>
      api.bulkExportIssues(issueIds, format),
    onSuccess: (result) => {
      const mimeType = result.filename.endsWith('.csv') 
        ? 'text/csv;charset=utf-8;'
        : 'application/json';
      
      api.downloadExportFile(result.data, result.filename, mimeType);
      toast.success(`Exported ${result.filename} successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Export failed: ${error.message}`);
    },
  });
}
