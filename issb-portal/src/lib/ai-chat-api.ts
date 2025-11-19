/**
 * AI Chat API
 * Client-side API layer for interacting with the AI chatbot system
 */

import { supabase } from './supabase';

// ================================================
// TYPES
// ================================================

export interface ChatMessage {
  id: string;
  session_id: string;
  sender_type: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  context_data: Record<string, any>;
  is_active: boolean;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageResponse {
  message: ChatMessage;
  suggestions: string[];
  escalation_suggested: boolean;
}

export interface ChatHistoryResponse {
  session: ChatSession;
  messages: ChatMessage[];
}

export interface EscalationRequest {
  id: string;
  session_id: string;
  user_id: string;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  access_level: 'all' | 'member' | 'board' | 'admin';
}

// ================================================
// API ERROR HANDLING
// ================================================

class ChatAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ChatAPIError';
  }
}

/**
 * Handles API errors and throws ChatAPIError
 */
function handleAPIError(error: any, context: string): never {
  console.error(`Chat API Error (${context}):`, error);

  if (error instanceof ChatAPIError) {
    throw error;
  }

  const message = error?.message || error?.error?.message || 'An unexpected error occurred';
  const statusCode = error?.statusCode || error?.status;
  const code = error?.code || error?.error?.code;

  throw new ChatAPIError(message, statusCode, code);
}

/**
 * Gets the current Supabase session token
 */
async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new ChatAPIError('Not authenticated', 401, 'UNAUTHENTICATED');
  }

  return session.access_token;
}

/**
 * Makes a request to a Supabase Edge Function
 */
async function invokeEdgeFunction<T = any>(
  functionName: string,
  payload: any
): Promise<T> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload
    });

    if (error) {
      throw new ChatAPIError(
        error.message || 'Edge function request failed',
        error.context?.status,
        'EDGE_FUNCTION_ERROR'
      );
    }

    // Check if the response contains an error
    if (data?.error) {
      throw new ChatAPIError(
        data.error.message || 'Request failed',
        data.error.statusCode,
        data.error.code
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ChatAPIError) {
      throw error;
    }
    throw new ChatAPIError(
      'Failed to invoke edge function',
      500,
      'NETWORK_ERROR'
    );
  }
}

// ================================================
// CHAT SESSION MANAGEMENT
// ================================================

/**
 * Creates a new chat session
 */
export async function createChatSession(
  title: string = 'New Conversation',
  contextData: Record<string, any> = {}
): Promise<ChatSession> {
  try {
    const response = await invokeEdgeFunction('chat-create-session', {
      title,
      contextData
    });

    if (!response?.data?.session) {
      throw new ChatAPIError('Invalid response from server', 500, 'INVALID_RESPONSE');
    }

    return response.data.session;
  } catch (error) {
    return handleAPIError(error, 'createChatSession');
  }
}

/**
 * Gets chat history for a session
 */
export async function getChatHistory(sessionId: string): Promise<ChatHistoryResponse> {
  try {
    const response = await invokeEdgeFunction('chat-history', {
      sessionId
    });

    if (!response?.data) {
      throw new ChatAPIError('Invalid response from server', 500, 'INVALID_RESPONSE');
    }

    return {
      session: response.data.session,
      messages: response.data.messages || []
    };
  } catch (error) {
    return handleAPIError(error, 'getChatHistory');
  }
}

/**
 * Gets all chat sessions for the current user
 */
export async function getUserChatSessions(limit: number = 10): Promise<ChatSession[]> {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('is_active', true)
      .order('last_message_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new ChatAPIError(error.message, 500, 'DATABASE_ERROR');
    }

    return data || [];
  } catch (error) {
    return handleAPIError(error, 'getUserChatSessions');
  }
}

/**
 * Deactivates a chat session
 */
export async function closeChatSession(sessionId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);

    if (error) {
      throw new ChatAPIError(error.message, 500, 'DATABASE_ERROR');
    }
  } catch (error) {
    return handleAPIError(error, 'closeChatSession');
  }
}

// ================================================
// CHAT MESSAGES
// ================================================

/**
 * Sends a message to the AI assistant
 */
export async function sendChatMessage(
  sessionId: string,
  message: string
): Promise<ChatMessageResponse> {
  try {
    const response = await invokeEdgeFunction('chat-message', {
      sessionId,
      message
    });

    if (!response?.data?.message) {
      throw new ChatAPIError('Invalid response from server', 500, 'INVALID_RESPONSE');
    }

    return {
      message: response.data.message,
      suggestions: response.data.suggestions || [],
      escalation_suggested: response.data.escalation_suggested || false
    };
  } catch (error) {
    return handleAPIError(error, 'sendChatMessage');
  }
}

/**
 * Gets messages for a specific session
 */
export async function getSessionMessages(
  sessionId: string,
  limit: number = 50
): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw new ChatAPIError(error.message, 500, 'DATABASE_ERROR');
    }

    return data || [];
  } catch (error) {
    return handleAPIError(error, 'getSessionMessages');
  }
}

// ================================================
// ESCALATION
// ================================================

/**
 * Escalates a conversation to a human agent
 */
export async function escalateConversation(
  sessionId: string,
  reason: string,
  priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
): Promise<EscalationRequest> {
  try {
    const response = await invokeEdgeFunction('chat-escalate', {
      sessionId,
      reason,
      priority
    });

    if (!response?.data?.escalation) {
      throw new ChatAPIError('Invalid response from server', 500, 'INVALID_RESPONSE');
    }

    return response.data.escalation;
  } catch (error) {
    return handleAPIError(error, 'escalateConversation');
  }
}

/**
 * Gets escalation requests for the current user
 */
export async function getUserEscalations(): Promise<EscalationRequest[]> {
  try {
    const { data, error } = await supabase
      .from('escalation_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new ChatAPIError(error.message, 500, 'DATABASE_ERROR');
    }

    return data || [];
  } catch (error) {
    return handleAPIError(error, 'getUserEscalations');
  }
}

/**
 * Checks if a session has an active escalation
 */
export async function hasActiveEscalation(sessionId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('escalation_requests')
      .select('id')
      .eq('session_id', sessionId)
      .in('status', ['pending', 'in_progress'])
      .limit(1);

    if (error) {
      throw new ChatAPIError(error.message, 500, 'DATABASE_ERROR');
    }

    return (data?.length || 0) > 0;
  } catch (error) {
    return handleAPIError(error, 'hasActiveEscalation');
  }
}

// ================================================
// KNOWLEDGE BASE
// ================================================

/**
 * Searches the knowledge base
 */
export async function searchKnowledgeBase(
  query: string,
  limit: number = 5
): Promise<KnowledgeBaseArticle[]> {
  try {
    const { data, error } = await supabase
      .from('knowledge_base_articles')
      .select('id, title, content, category, tags, access_level')
      .eq('is_published', true)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(limit);

    if (error) {
      throw new ChatAPIError(error.message, 500, 'DATABASE_ERROR');
    }

    return data || [];
  } catch (error) {
    return handleAPIError(error, 'searchKnowledgeBase');
  }
}

/**
 * Gets a knowledge base article by ID
 */
export async function getKnowledgeBaseArticle(articleId: string): Promise<KnowledgeBaseArticle | null> {
  try {
    const { data, error } = await supabase
      .from('knowledge_base_articles')
      .select('*')
      .eq('id', articleId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new ChatAPIError(error.message, 500, 'DATABASE_ERROR');
    }

    return data;
  } catch (error) {
    return handleAPIError(error, 'getKnowledgeBaseArticle');
  }
}

/**
 * Gets all accessible knowledge base articles
 */
export async function getKnowledgeBaseArticles(category?: string): Promise<KnowledgeBaseArticle[]> {
  try {
    let query = supabase
      .from('knowledge_base_articles')
      .select('*')
      .eq('is_published', true)
      .order('title');

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      throw new ChatAPIError(error.message, 500, 'DATABASE_ERROR');
    }

    return data || [];
  } catch (error) {
    return handleAPIError(error, 'getKnowledgeBaseArticles');
  }
}

// ================================================
// ADMIN FUNCTIONS
// ================================================

/**
 * Gets all pending escalations (admin only)
 */
export async function getPendingEscalations(): Promise<EscalationRequest[]> {
  try {
    const { data, error } = await supabase
      .from('escalation_requests')
      .select(`
        *,
        user:profiles!escalation_requests_user_id_fkey(full_name, email),
        session:chat_sessions(title, created_at)
      `)
      .in('status', ['pending', 'in_progress'])
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      throw new ChatAPIError(error.message, 500, 'DATABASE_ERROR');
    }

    return data || [];
  } catch (error) {
    return handleAPIError(error, 'getPendingEscalations');
  }
}

/**
 * Resolves an escalation request (admin only)
 */
export async function resolveEscalation(
  escalationId: string,
  resolutionNotes: string
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new ChatAPIError('Not authenticated', 401, 'UNAUTHENTICATED');
    }

    const { error } = await supabase
      .from('escalation_requests')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
        resolution_notes: resolutionNotes
      })
      .eq('id', escalationId);

    if (error) {
      throw new ChatAPIError(error.message, 500, 'DATABASE_ERROR');
    }
  } catch (error) {
    return handleAPIError(error, 'resolveEscalation');
  }
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

/**
 * Checks if the chatbot system is available
 */
export async function checkChatbotHealth(): Promise<boolean> {
  try {
    // Try to make a simple query to check if tables exist
    const { error } = await supabase
      .from('knowledge_base_articles')
      .select('id')
      .limit(1);

    return !error;
  } catch (error) {
    console.error('Chatbot health check failed:', error);
    return false;
  }
}

/**
 * Gets chatbot statistics (admin only)
 */
export async function getChatbotStats(): Promise<{
  totalSessions: number;
  activeSessions: number;
  totalMessages: number;
  pendingEscalations: number;
}> {
  try {
    const [sessionsResult, activeSessionsResult, messagesResult, escalationsResult] = await Promise.all([
      supabase.from('chat_sessions').select('id', { count: 'exact', head: true }),
      supabase.from('chat_sessions').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('chat_messages').select('id', { count: 'exact', head: true }),
      supabase.from('escalation_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')
    ]);

    return {
      totalSessions: sessionsResult.count || 0,
      activeSessions: activeSessionsResult.count || 0,
      totalMessages: messagesResult.count || 0,
      pendingEscalations: escalationsResult.count || 0
    };
  } catch (error) {
    return handleAPIError(error, 'getChatbotStats');
  }
}

// Export error class for custom error handling
export { ChatAPIError };
