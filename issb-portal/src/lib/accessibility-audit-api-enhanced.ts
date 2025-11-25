import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://lsyimggqennkyxgajzvn.supabase.co';

export interface EnhancedIssueFilters {
  status?: string;
  type?: string;
  severity?: string;
  auditId?: string;
  dateFrom?: string;
  dateTo?: string;
  assignedTo?: string;
}

export async function getAccessibilityAuditsEnhanced(filters?: any) {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;

  if (!token) {
    throw new Error('No authentication token available');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/get-accessibility-audits`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filters }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to fetch audits');
  }

  return response.json();
}

export async function getAuditSummaryMetricsEnhanced() {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;

  if (!token) {
    throw new Error('No authentication token available');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/get-audit-summary`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to fetch audit summary');
  }

  return response.json();
}

export async function createAccessibilityAudit(auditData: any) {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;

  if (!token) {
    throw new Error('No authentication token available');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/create-accessibility-audit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(auditData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to create audit');
  }

  return response.json();
}

export async function exportAuditResults(format: 'csv' | 'json' | 'pdf') {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;

  if (!token) {
    throw new Error('No authentication token available');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/export-audit-results`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ format }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to export results');
  }

  return response.blob();
}
