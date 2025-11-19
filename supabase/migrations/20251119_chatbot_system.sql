-- ================================================
-- AI Chatbot System Migration
-- ================================================
-- Creates comprehensive chatbot infrastructure including:
-- - Chat sessions and messages
-- - Knowledge base articles
-- - Escalation requests
-- - RLS policies for security
-- - Indexes for performance
-- ================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- CHAT SESSIONS TABLE
-- ================================================
-- Stores conversation sessions between users and AI assistant

CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  context_data JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for chat_sessions
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_is_active ON chat_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message_at ON chat_sessions(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at DESC);

-- ================================================
-- CHAT MESSAGES TABLE
-- ================================================
-- Stores individual messages within chat sessions

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_type ON chat_messages(sender_type);

-- ================================================
-- KNOWLEDGE BASE ARTICLES TABLE
-- ================================================
-- Stores articles for AI assistant to reference

CREATE TABLE IF NOT EXISTS knowledge_base_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  access_level TEXT NOT NULL DEFAULT 'all' CHECK (access_level IN ('all', 'member', 'board', 'admin')),
  is_published BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for knowledge_base_articles
CREATE INDEX IF NOT EXISTS idx_kb_articles_is_published ON knowledge_base_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_kb_articles_access_level ON knowledge_base_articles(access_level);
CREATE INDEX IF NOT EXISTS idx_kb_articles_category ON knowledge_base_articles(category);
CREATE INDEX IF NOT EXISTS idx_kb_articles_tags ON knowledge_base_articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_kb_articles_title_search ON knowledge_base_articles USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_kb_articles_content_search ON knowledge_base_articles USING GIN(to_tsvector('english', content));

-- ================================================
-- ESCALATION REQUESTS TABLE
-- ================================================
-- Stores requests for human agent assistance

CREATE TABLE IF NOT EXISTS escalation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for escalation_requests
CREATE INDEX IF NOT EXISTS idx_escalation_requests_session_id ON escalation_requests(session_id);
CREATE INDEX IF NOT EXISTS idx_escalation_requests_user_id ON escalation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_escalation_requests_status ON escalation_requests(status);
CREATE INDEX IF NOT EXISTS idx_escalation_requests_priority ON escalation_requests(priority);
CREATE INDEX IF NOT EXISTS idx_escalation_requests_assigned_to ON escalation_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_escalation_requests_created_at ON escalation_requests(created_at DESC);

-- ================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================

-- Enable RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_requests ENABLE ROW LEVEL SECURITY;

-- ================================================
-- RLS POLICIES: CHAT_SESSIONS
-- ================================================

-- Users can view their own sessions
CREATE POLICY "Users can view own chat sessions"
  ON chat_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can create own chat sessions"
  ON chat_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own chat sessions"
  ON chat_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all sessions
CREATE POLICY "Admins can view all chat sessions"
  ON chat_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ================================================
-- RLS POLICIES: CHAT_MESSAGES
-- ================================================

-- Users can view messages from their sessions
CREATE POLICY "Users can view own chat messages"
  ON chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- Users can insert messages to their sessions
CREATE POLICY "Users can create messages in own sessions"
  ON chat_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- Admins can view all messages
CREATE POLICY "Admins can view all chat messages"
  ON chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ================================================
-- RLS POLICIES: KNOWLEDGE_BASE_ARTICLES
-- ================================================

-- Everyone can read published articles matching their access level
CREATE POLICY "Users can view accessible knowledge base articles"
  ON knowledge_base_articles
  FOR SELECT
  USING (
    is_published = true
    AND (
      access_level = 'all'
      OR (
        access_level = 'member' AND auth.uid() IS NOT NULL
      )
      OR (
        access_level IN ('board', 'admin') AND EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('board', 'admin')
        )
      )
    )
  );

-- Admins can insert articles
CREATE POLICY "Admins can create knowledge base articles"
  ON knowledge_base_articles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update articles
CREATE POLICY "Admins can update knowledge base articles"
  ON knowledge_base_articles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can delete articles
CREATE POLICY "Admins can delete knowledge base articles"
  ON knowledge_base_articles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ================================================
-- RLS POLICIES: ESCALATION_REQUESTS
-- ================================================

-- Users can view their own escalation requests
CREATE POLICY "Users can view own escalation requests"
  ON escalation_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create escalation requests
CREATE POLICY "Users can create escalation requests"
  ON escalation_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins and board members can view all escalation requests
CREATE POLICY "Admins can view all escalation requests"
  ON escalation_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'board')
    )
  );

-- Admins can update escalation requests
CREATE POLICY "Admins can update escalation requests"
  ON escalation_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'board')
    )
  );

-- ================================================
-- TRIGGERS
-- ================================================

-- Update updated_at timestamp on chat_sessions
CREATE OR REPLACE FUNCTION update_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_sessions_updated_at();

-- Update updated_at timestamp on knowledge_base_articles
CREATE TRIGGER kb_articles_updated_at
  BEFORE UPDATE ON knowledge_base_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_sessions_updated_at();

-- Update updated_at timestamp on escalation_requests
CREATE TRIGGER escalation_requests_updated_at
  BEFORE UPDATE ON escalation_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_sessions_updated_at();

-- Update last_message_at on chat_sessions when message is added
CREATE OR REPLACE FUNCTION update_session_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_sessions
  SET last_message_at = NEW.created_at
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chat_messages_update_session
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_session_last_message_at();

-- ================================================
-- HELPER FUNCTIONS
-- ================================================

-- Function to get active escalation count for user
CREATE OR REPLACE FUNCTION get_active_escalation_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM escalation_requests
  WHERE user_id = p_user_id
  AND status IN ('pending', 'in_progress');
$$ LANGUAGE SQL STABLE;

-- Function to get unresolved escalation count (for admins)
CREATE OR REPLACE FUNCTION get_unresolved_escalation_count()
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM escalation_requests
  WHERE status IN ('pending', 'in_progress');
$$ LANGUAGE SQL STABLE;

-- Function to search knowledge base articles
CREATE OR REPLACE FUNCTION search_knowledge_base(
  p_query TEXT,
  p_user_role TEXT DEFAULT 'member',
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  category TEXT,
  relevance_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.title,
    kb.content,
    kb.category,
    ts_rank(
      to_tsvector('english', kb.title || ' ' || kb.content),
      plainto_tsquery('english', p_query)
    ) AS relevance_score
  FROM knowledge_base_articles kb
  WHERE
    kb.is_published = true
    AND (
      kb.access_level = 'all'
      OR (kb.access_level = 'member' AND p_user_role IN ('member', 'board', 'admin'))
      OR (kb.access_level = 'board' AND p_user_role IN ('board', 'admin'))
      OR (kb.access_level = 'admin' AND p_user_role = 'admin')
    )
    AND (
      to_tsvector('english', kb.title || ' ' || kb.content) @@ plainto_tsquery('english', p_query)
      OR kb.title ILIKE '%' || p_query || '%'
      OR kb.content ILIKE '%' || p_query || '%'
    )
  ORDER BY relevance_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ================================================
-- SEED DATA: Sample Knowledge Base Articles
-- ================================================

INSERT INTO knowledge_base_articles (title, content, category, tags, access_level, is_published)
VALUES
  (
    'How to Register for Events',
    'To register for an event, navigate to the Events page, select the event you''re interested in, and click the "Register" button. You''ll be asked to provide details such as the number of guests. If the event has a registration fee, you''ll be directed to complete payment through our secure Stripe integration. Once registered, you''ll receive a confirmation email with event details.',
    'Events',
    ARRAY['events', 'registration', 'how-to'],
    'all',
    true
  ),
  (
    'Understanding the Badge System',
    'Our badge system recognizes member contributions in different areas. Badges are awarded automatically based on your activities: Event Attendance badges for participating in events, Volunteer badges for contributing service hours, and Donation badges for supporting the ISSB. Check your profile to see your earned badges and track your progress toward new ones.',
    'Membership',
    ARRAY['badges', 'membership', 'rewards'],
    'member',
    true
  ),
  (
    'How to Log Volunteer Hours',
    'To log volunteer hours, go to your profile and select "Volunteer Hours". Click "Add Hours" and fill in the date, hours worked, and a brief description of your volunteer work. Your submission will be reviewed by an admin and once approved, the hours will be added to your total. Approved volunteer hours count toward volunteer badges.',
    'Volunteering',
    ARRAY['volunteer', 'hours', 'how-to'],
    'member',
    true
  ),
  (
    'Making Donations',
    'ISSB accepts donations to support our community programs and facilities. Navigate to the Donations page, select a campaign or enter a custom amount, and complete the secure payment process. All donations are tax-deductible and you''ll receive a receipt via email. Thank you for your generosity!',
    'Donations',
    ARRAY['donations', 'giving', 'how-to'],
    'all',
    true
  ),
  (
    'Browsing Photo Galleries',
    'Our photo gallery showcases community events and activities. Visit the Gallery page to browse collections from recent events. You can view photos in full-screen mode and use arrow keys to navigate. Some galleries link to external platforms like Pixieset for high-quality downloads.',
    'Gallery',
    ARRAY['gallery', 'photos', 'events'],
    'all',
    true
  ),
  (
    'Payment and Membership Fees',
    'ISSB membership requires an annual subscription fee. You can pay via credit card through our secure payment system powered by Stripe. Your membership grants access to member-only events, voting rights, and other exclusive benefits. Payment history is available in your profile.',
    'Membership',
    ARRAY['membership', 'payment', 'fees'],
    'all',
    true
  ),
  (
    'Escalating to Human Support',
    'If the AI assistant cannot help with your question, you can escalate to a human admin. Click the "Escalate to Admin" button in the chat interface. An admin will review your conversation and respond via the portal. You''ll receive a notification when an admin has replied.',
    'Support',
    ARRAY['support', 'help', 'escalation'],
    'all',
    true
  ),
  (
    'Admin Report Generation',
    'Admins and board members can generate reports on membership, donations, volunteer hours, events, payments, and gallery activity. Navigate to the Reports section, select the report type and date range, and click Generate. Reports are exported as CSV files and sent via email. This feature helps track organizational metrics and prepare for board meetings.',
    'Admin',
    ARRAY['admin', 'reports', 'analytics'],
    'admin',
    true
  );

-- ================================================
-- COMMENTS
-- ================================================

COMMENT ON TABLE chat_sessions IS 'Stores AI assistant conversation sessions';
COMMENT ON TABLE chat_messages IS 'Stores individual messages within chat sessions';
COMMENT ON TABLE knowledge_base_articles IS 'Articles for AI assistant to reference when answering questions';
COMMENT ON TABLE escalation_requests IS 'Requests for human agent assistance when AI cannot help';

COMMENT ON COLUMN chat_sessions.context_data IS 'Additional context like current page, user state, etc.';
COMMENT ON COLUMN chat_messages.sender_type IS 'user, assistant, or system';
COMMENT ON COLUMN chat_messages.metadata IS 'Additional data like error flags, escalation info, etc.';
COMMENT ON COLUMN knowledge_base_articles.access_level IS 'Controls who can view the article: all, member, board, admin';
COMMENT ON COLUMN escalation_requests.priority IS 'Priority level: low, medium, high, urgent';
COMMENT ON COLUMN escalation_requests.status IS 'Current status: pending, in_progress, resolved, closed';

-- ================================================
-- END OF MIGRATION
-- ================================================
