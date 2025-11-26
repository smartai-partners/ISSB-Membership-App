import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://lsyimggqennkyxgajzvn.supabase.co';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

// FAQ Management
export async function getFAQs() {
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .eq('is_published', true)
    .order('order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getAllFAQs() {
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .order('order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createFAQ(faq: Partial<FAQ>) {
  const { data, error } = await supabase
    .from('faqs')
    .insert(faq)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateFAQ(id: string, updates: Partial<FAQ>) {
  const { data, error } = await supabase
    .from('faqs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFAQ(id: string) {
  const { error } = await supabase
    .from('faqs')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Conversation Management
export async function getConversations() {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getEscalatedConversations() {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .in('status', ['open', 'in_progress'])
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateConversation(id: string, updates: Partial<Conversation>) {
  const { data, error } = await supabase
    .from('conversations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function assignConversation(id: string, assignedTo: string) {
  const { data, error } = await supabase
    .from('conversations')
    .update({
      assigned_to: assignedTo,
      status: 'in_progress',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function resolveConversation(id: string, resolution: string) {
  const { data, error } = await supabase
    .from('conversations')
    .update({
      status: 'resolved',
      resolution_notes: resolution,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Help Assistant Analytics
export async function getHelpAssistantAnalytics() {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;

  if (!token) {
    return {
      totalConversations: 0,
      resolvedConversations: 0,
      avgResponseTime: 0,
      topCategories: [],
    };
  }

  const { data: conversations } = await supabase
    .from('conversations')
    .select('*');

  const total = conversations?.length || 0;
  const resolved = conversations?.filter(c => c.status === 'resolved').length || 0;

  return {
    totalConversations: total,
    resolvedConversations: resolved,
    avgResponseTime: 0,
    topCategories: [],
  };
}

// Additional missing functions and types
export interface FAQFilters {
  category?: string;
  published?: boolean;
  search?: string;
}

export interface ConversationFilters {
  status?: string;
  priority?: string;
  assigned_to?: string;
}

export async function getFAQCategories() {
  const { data, error } = await supabase
    .from('faqs')
    .select('category')
    .not('category', 'is', null);

  if (error) throw error;

  const categories = [...new Set(data?.map(item => item.category).filter(Boolean))];
  return categories;
}

export async function updateConversationStatus(id: string, status: string) {
  const { data, error } = await supabase
    .from('conversations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteConversation(id: string) {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
