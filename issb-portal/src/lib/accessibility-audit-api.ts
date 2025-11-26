import { supabase } from './supabase';

export interface AuditFilters {
  status?: string;
  page?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface IssueFilters {
  status?: string;
  type?: string;
  severity?: string;
  auditId?: string;
}

export async function getAccessibilityAudits(filters?: AuditFilters) {
  let query = supabase
    .from('accessibility_audits')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.page) {
    query = query.eq('page_url', filters.page);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getAuditById(id: string) {
  const { data, error } = await supabase
    .from('accessibility_audits')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getAuditSummaryMetrics() {
  const { data, error } = await supabase
    .from('accessibility_audits')
    .select('*');

  if (error) throw error;

  return {
    total: data?.length || 0,
    passed: data?.filter(a => a.status === 'passed').length || 0,
    failed: data?.filter(a => a.status === 'failed').length || 0,
    pending: data?.filter(a => a.status === 'pending').length || 0,
  };
}

export async function deleteAudit(id: string) {
  const { error } = await supabase
    .from('accessibility_audits')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getAccessibilityIssues(filters?: IssueFilters) {
  let query = supabase
    .from('accessibility_issues')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.type) {
    query = query.eq('type', filters.type);
  }

  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }

  if (filters?.auditId) {
    query = query.eq('audit_id', filters.auditId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function updateIssueStatus(id: string, status: string) {
  const { error } = await supabase
    .from('accessibility_issues')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteIssue(id: string) {
  const { error } = await supabase
    .from('accessibility_issues')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getIssueTypes() {
  const { data, error } = await supabase
    .from('accessibility_issues')
    .select('type')
    .not('type', 'is', null);

  if (error) throw error;

  const types = [...new Set(data?.map(item => item.type))];
  return types;
}

export async function getAuditedPages() {
  const { data, error } = await supabase
    .from('accessibility_audits')
    .select('page_url')
    .not('page_url', 'is', null);

  if (error) throw error;

  const pages = [...new Set(data?.map(item => item.page_url))];
  return pages;
}
