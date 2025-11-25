import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://lsyimggqennkyxgajzvn.supabase.co';

export async function getAnalytics(startDate?: string, endDate?: string) {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;

  if (!token) {
    throw new Error('No authentication token available');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/calculate-analytics`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ startDate, endDate }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to fetch analytics');
  }

  return response.json();
}

export async function getMembershipAnalytics() {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;

  if (!token) {
    throw new Error('No authentication token available');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/membership-analytics`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to fetch membership analytics');
  }

  return response.json();
}

export async function getVolunteerAnalytics() {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;

  if (!token) {
    throw new Error('No authentication token available');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/volunteer-analytics`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to fetch volunteer analytics');
  }

  return response.json();
}

export async function trackPageView(page: string) {
  const { data: session } = await supabase.auth.getSession();

  await supabase.from('analytics_events').insert({
    event_type: 'page_view',
    page_url: page,
    user_id: session?.session?.user?.id,
    created_at: new Date().toISOString(),
  });
}

export async function trackEvent(eventName: string, eventData?: any) {
  const { data: session } = await supabase.auth.getSession();

  await supabase.from('analytics_events').insert({
    event_type: eventName,
    event_data: eventData,
    user_id: session?.session?.user?.id,
    created_at: new Date().toISOString(),
  });
}

// Audit Schedules
export async function getAuditSchedules() {
  const { data, error } = await supabase.from('audit_schedules').select('*');
  if (error) throw error;
  return data || [];
}

export async function getActiveAuditSchedules() {
  const { data, error } = await supabase.from('audit_schedules').select('*').eq('is_active', true);
  if (error) throw error;
  return data || [];
}

export async function getAuditScheduleById(id: string) {
  const { data, error } = await supabase.from('audit_schedules').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createAuditSchedule(schedule: any) {
  const { data, error } = await supabase.from('audit_schedules').insert(schedule).select().single();
  if (error) throw error;
  return data;
}

export async function updateAuditSchedule(id: string, updates: any) {
  const { data, error} = await supabase.from('audit_schedules').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteAuditSchedule(id: string) {
  const { error } = await supabase.from('audit_schedules').delete().eq('id', id);
  if (error) throw error;
}

// Test Runs
export async function getTestRuns() {
  const { data, error } = await supabase.from('test_runs').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getTestRunById(id: string) {
  const { data, error } = await supabase.from('test_runs').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function getTestRunsBySchedule(scheduleId: string) {
  const { data, error } = await supabase.from('test_runs').select('*').eq('schedule_id', scheduleId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function runAccessibilityTest(scheduleId: string) {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;
  if (!token) throw new Error('No authentication token available');
  const response = await fetch(`${SUPABASE_URL}/functions/v1/run-accessibility-test`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ scheduleId }),
  });
  if (!response.ok) throw new Error('Failed to run accessibility test');
  return response.json();
}

// Compliance Metrics
export async function getComplianceMetrics() {
  const { data, error } = await supabase.from('compliance_metrics').select('*').order('created_at', { ascending: false }).limit(1).single();
  if (error) throw error;
  return data;
}

export async function getComplianceMetricsByDateRange(startDate: string, endDate: string) {
  const { data, error } = await supabase.from('compliance_metrics').select('*').gte('created_at', startDate).lte('created_at', endDate).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function calculateAnalytics() {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;
  if (!token) throw new Error('No authentication token available');
  const response = await fetch(`${SUPABASE_URL}/functions/v1/calculate-analytics`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to calculate analytics');
  return response.json();
}

// Analytics Snapshots
export async function getAnalyticsSnapshots() {
  const { data, error } = await supabase.from('analytics_snapshots').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getLatestAnalyticsSnapshot() {
  const { data, error } = await supabase.from('analytics_snapshots').select('*').order('created_at', { ascending: false }).limit(1).single();
  if (error) throw error;
  return data;
}

// Quality Gates
export async function getQualityGates() {
  const { data, error } = await supabase.from('quality_gates').select('*');
  if (error) throw error;
  return data || [];
}

export async function getQualityGateById(id: string) {
  const { data, error } = await supabase.from('quality_gates').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createQualityGate(gate: any) {
  const { data, error } = await supabase.from('quality_gates').insert(gate).select().single();
  if (error) throw error;
  return data;
}

export async function updateQualityGate(id: string, updates: any) {
  const { data, error } = await supabase.from('quality_gates').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteQualityGate(id: string) {
  const { error } = await supabase.from('quality_gates').delete().eq('id', id);
  if (error) throw error;
}

export async function checkQualityGate(testRunId: string, gateId: string) {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;
  if (!token) throw new Error('No authentication token available');
  const response = await fetch(`${SUPABASE_URL}/functions/v1/check-quality-gate`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ testRunId, gateId }),
  });
  if (!response.ok) throw new Error('Failed to check quality gate');
  return response.json();
}

export async function getQualityGateResults(testRunId: string) {
  const { data, error } = await supabase.from('quality_gate_results').select('*').eq('test_run_id', testRunId);
  if (error) throw error;
  return data || [];
}

export async function getComprehensiveAnalytics() {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;
  if (!token) throw new Error('No authentication token available');
  const response = await fetch(`${SUPABASE_URL}/functions/v1/comprehensive-analytics`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to fetch comprehensive analytics');
  return response.json();
}
