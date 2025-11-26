import { supabase } from './supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://lsyimggqennkyxgajzvn.supabase.co';

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender_type: 'user' | 'assistant';
  content: string;
  metadata?: any;
  created_at: string;
}

export interface EscalationRequest {
  id: string;
  requester_id: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'assigned' | 'resolved';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  category?: string;
  access_level: 'public' | 'member' | 'admin';
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

// Chat Sessions
export async function createChatSession() {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;

  if (!token) {
    throw new Error('No authentication token available');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-create-session`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to create chat session');
  }

  return response.json();
}

export async function getChatHistory(sessionId: string) {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;

  if (!token) {
    throw new Error('No authentication token available');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-history?session_id=${sessionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to fetch chat history');
  }

  return response.json();
}

export async function sendChatMessage(sessionId: string, message: string) {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;

  if (!token) {
    throw new Error('No authentication token available');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-message`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session_id: sessionId, message }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to send message');
  }

  return response.json();
}

// Escalations
export async function createEscalation(message: string, priority: string = 'medium') {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;

  if (!token) {
    throw new Error('No authentication token available');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-escalate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, priority }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to create escalation');
  }

  return response.json();
}

export async function getEscalations() {
  const { data, error } = await supabase
    .from('escalation_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateEscalation(id: string, updates: Partial<EscalationRequest>) {
  const { data, error } = await supabase
    .from('escalation_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEscalation(id: string) {
  const { error } = await supabase
    .from('escalation_requests')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Knowledge Base
export async function searchKnowledgeBase(query: string) {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;

  if (!token) {
    throw new Error('No authentication token available');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/knowledge-base-search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to search knowledge base');
  }

  return response.json();
}

export async function getKnowledgeBaseArticles() {
  const { data, error } = await supabase
    .from('knowledge_base_articles')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createKnowledgeBaseArticle(article: Partial<KnowledgeBaseArticle>) {
  const { data, error } = await supabase
    .from('knowledge_base_articles')
    .insert(article)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateKnowledgeBaseArticle(id: string, updates: Partial<KnowledgeBaseArticle>) {
  const { data, error } = await supabase
    .from('knowledge_base_articles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteKnowledgeBaseArticle(id: string) {
  const { error } = await supabase
    .from('knowledge_base_articles')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
