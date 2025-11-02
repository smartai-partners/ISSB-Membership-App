/**
 * Phase 3C.3: Analytics & Automated Testing Hooks
 * React Query hooks for automated accessibility testing, analytics, and quality gates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  AuditSchedule,
  TestRun,
  ComplianceMetrics,
  AnalyticsSnapshot,
  QualityGate,
  QualityGateResult,
  ComprehensiveAnalytics,
} from '@/types';
import * as analyticsApi from '@/lib/analytics-api';

// ===== Audit Schedules Hooks =====

export function useAuditSchedules() {
  return useQuery({
    queryKey: ['audit-schedules'],
    queryFn: analyticsApi.getAuditSchedules,
  });
}

export function useActiveAuditSchedules() {
  return useQuery({
    queryKey: ['audit-schedules', 'active'],
    queryFn: analyticsApi.getActiveAuditSchedules,
  });
}

export function useAuditSchedule(id: string | null) {
  return useQuery({
    queryKey: ['audit-schedule', id],
    queryFn: () => (id ? analyticsApi.getAuditScheduleById(id) : null),
    enabled: !!id,
  });
}

export function useCreateAuditSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: analyticsApi.createAuditSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-schedules'] });
    },
  });
}

export function useUpdateAuditSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AuditSchedule> }) =>
      analyticsApi.updateAuditSchedule(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['audit-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['audit-schedule', variables.id] });
    },
  });
}

export function useDeleteAuditSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: analyticsApi.deleteAuditSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-schedules'] });
    },
  });
}

// ===== Test Runs Hooks =====

export function useTestRuns(limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['test-runs', limit, offset],
    queryFn: () => analyticsApi.getTestRuns(limit, offset),
  });
}

export function useTestRun(id: string | null) {
  return useQuery({
    queryKey: ['test-run', id],
    queryFn: () => (id ? analyticsApi.getTestRunById(id) : null),
    enabled: !!id,
  });
}

export function useTestRunsBySchedule(scheduleId: string | null) {
  return useQuery({
    queryKey: ['test-runs', 'schedule', scheduleId],
    queryFn: () => (scheduleId ? analyticsApi.getTestRunsBySchedule(scheduleId) : []),
    enabled: !!scheduleId,
  });
}

export function useRunAccessibilityTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: analyticsApi.runAccessibilityTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-runs'] });
      queryClient.invalidateQueries({ queryKey: ['accessibility-audits'] });
      queryClient.invalidateQueries({ queryKey: ['accessibility-issues'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

// ===== Compliance Metrics Hooks =====

export function useComplianceMetrics(
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  limit = 30
) {
  return useQuery({
    queryKey: ['compliance-metrics', period, limit],
    queryFn: () => analyticsApi.getComplianceMetrics(period, limit),
  });
}

export function useComplianceMetricsByDateRange(
  startDate: string,
  endDate: string,
  period: 'daily' | 'weekly' | 'monthly' = 'daily'
) {
  return useQuery({
    queryKey: ['compliance-metrics', period, startDate, endDate],
    queryFn: () => analyticsApi.getComplianceMetricsByDateRange(startDate, endDate, period),
  });
}

export function useCalculateAnalytics() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ period, date }: { period: 'daily' | 'weekly' | 'monthly'; date?: string }) =>
      analyticsApi.calculateAnalytics(period, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-snapshots'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

// ===== Analytics Snapshots Hooks =====

export function useAnalyticsSnapshots(
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' = 'weekly',
  limit = 10
) {
  return useQuery({
    queryKey: ['analytics-snapshots', type, limit],
    queryFn: () => analyticsApi.getAnalyticsSnapshots(type, limit),
  });
}

export function useLatestAnalyticsSnapshot(
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' = 'weekly'
) {
  return useQuery({
    queryKey: ['analytics-snapshot', 'latest', type],
    queryFn: () => analyticsApi.getLatestAnalyticsSnapshot(type),
  });
}

// ===== Quality Gates Hooks =====

export function useQualityGates() {
  return useQuery({
    queryKey: ['quality-gates'],
    queryFn: analyticsApi.getQualityGates,
  });
}

export function useQualityGate(id: string | null) {
  return useQuery({
    queryKey: ['quality-gate', id],
    queryFn: () => (id ? analyticsApi.getQualityGateById(id) : null),
    enabled: !!id,
  });
}

export function useCreateQualityGate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: analyticsApi.createQualityGate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-gates'] });
    },
  });
}

export function useUpdateQualityGate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<QualityGate> }) =>
      analyticsApi.updateQualityGate(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quality-gates'] });
      queryClient.invalidateQueries({ queryKey: ['quality-gate', variables.id] });
    },
  });
}

export function useDeleteQualityGate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: analyticsApi.deleteQualityGate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-gates'] });
    },
  });
}

export function useCheckQualityGate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gateId, testRunId, metadata }: { gateId: string; testRunId: string; metadata?: any }) =>
      analyticsApi.checkQualityGate(gateId, testRunId, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-gate-results'] });
      queryClient.invalidateQueries({ queryKey: ['quality-gates'] });
    },
  });
}

// ===== Quality Gate Results Hooks =====

export function useQualityGateResults(gateId?: string, limit = 50) {
  return useQuery({
    queryKey: ['quality-gate-results', gateId, limit],
    queryFn: () => analyticsApi.getQualityGateResults(gateId, limit),
  });
}

// ===== Comprehensive Analytics Hook =====

export function useComprehensiveAnalytics(period: 'week' | 'month' | 'quarter' = 'week') {
  return useQuery({
    queryKey: ['analytics', 'comprehensive', period],
    queryFn: () => analyticsApi.getComprehensiveAnalytics(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
