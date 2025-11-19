-- Reports System Migration
-- Created: 2025-11-19
-- Purpose: Automated report generation with scheduling support

-- ============================================================================
-- 1. CREATE REPORTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Job tracking
  job_id TEXT UNIQUE, -- External job queue ID (BullMQ, etc.)

  -- Report configuration
  report_type TEXT NOT NULL CHECK (
    report_type IN (
      'membershipSummary',
      'volunteerHours',
      'donationsOverview',
      'eventAttendance',
      'financialSummary',
      'sponsorMonthlyPacket',
      'galleryActivity',
      'paymentTransactions'
    )
  ),

  format TEXT NOT NULL CHECK (format IN ('PDF', 'CSV', 'GOOGLE_SLIDES', 'EXCEL')),

  -- Report parameters (date ranges, filters, etc.)
  parameters JSONB DEFAULT '{}'::jsonb,

  -- Branding options
  branding_options JSONB DEFAULT '{}'::jsonb,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (
    status IN ('QUEUED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED')
  ),

  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),

  -- File storage
  file_path TEXT, -- Path in object storage (e.g., reports/2024/membership-summary-123.pdf)
  file_size INTEGER, -- File size in bytes
  download_url TEXT, -- Pre-signed URL for download
  download_url_expires_at TIMESTAMP WITH TIME ZONE,

  -- Result metadata
  row_count INTEGER, -- For data reports (number of records)
  summary_data JSONB, -- Key metrics/summary for quick access

  -- Error tracking
  error_code TEXT,
  error_message TEXT,
  error_details JSONB,

  -- User tracking
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- User-specific reports

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,

  -- Audit
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. CREATE REPORT_SCHEDULES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Schedule configuration
  name TEXT NOT NULL,
  description TEXT,

  -- Report configuration
  report_type TEXT NOT NULL,
  format TEXT NOT NULL,
  parameters JSONB DEFAULT '{}'::jsonb,
  branding_options JSONB DEFAULT '{}'::jsonb,

  -- Schedule timing
  frequency TEXT NOT NULL CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY')),
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31), -- For monthly
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- For weekly (0=Sunday)
  time_of_day TEXT NOT NULL, -- HH:MM in UTC (e.g., "02:00")

  -- Recipients
  recipients JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {type: 'user'|'email', id?: string, address?: string}

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Execution tracking
  last_generated_at TIMESTAMP WITH TIME ZONE,
  last_report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
  next_generation_at TIMESTAMP WITH TIME ZONE,
  execution_count INTEGER DEFAULT 0,

  -- User tracking
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. CREATE REPORT_RECIPIENTS TABLE (for tracking who received reports)
-- ============================================================================

CREATE TABLE IF NOT EXISTS report_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,

  -- Recipient info
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('user', 'email')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_address TEXT,

  -- Delivery tracking
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    delivery_status IN ('pending', 'sent', 'failed', 'bounced')
  ),
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  downloaded_at TIMESTAMP WITH TIME ZONE,

  -- Error tracking
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CHECK (
    (recipient_type = 'user' AND user_id IS NOT NULL) OR
    (recipient_type = 'email' AND email_address IS NOT NULL)
  )
);

-- ============================================================================
-- 4. CREATE INDEXES
-- ============================================================================

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_report_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by);
CREATE INDEX IF NOT EXISTS idx_reports_owner_id ON reports(owner_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_job_id ON reports(job_id);
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON reports(status, created_at DESC);

-- Report schedules indexes
CREATE INDEX IF NOT EXISTS idx_report_schedules_is_active ON report_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_generation ON report_schedules(next_generation_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_report_schedules_created_by ON report_schedules(created_by);
CREATE INDEX IF NOT EXISTS idx_report_schedules_frequency ON report_schedules(frequency);

-- Report recipients indexes
CREATE INDEX IF NOT EXISTS idx_report_recipients_report_id ON report_recipients(report_id);
CREATE INDEX IF NOT EXISTS idx_report_recipients_user_id ON report_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_report_recipients_delivery_status ON report_recipients(delivery_status);

-- ============================================================================
-- 5. CREATE TRIGGERS
-- ============================================================================

-- Trigger for reports updated_at
DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON reports
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for report_schedules updated_at
DROP TRIGGER IF EXISTS update_report_schedules_updated_at ON report_schedules;
CREATE TRIGGER update_report_schedules_updated_at
BEFORE UPDATE ON report_schedules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for report_recipients updated_at
DROP TRIGGER IF EXISTS update_report_recipients_updated_at ON report_recipients;
CREATE TRIGGER update_report_recipients_updated_at
BEFORE UPDATE ON report_recipients
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update schedule execution count
CREATE OR REPLACE FUNCTION update_schedule_execution_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_generated_at IS NOT NULL AND (OLD.last_generated_at IS NULL OR NEW.last_generated_at > OLD.last_generated_at) THEN
    NEW.execution_count := OLD.execution_count + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_schedule_execution_count ON report_schedules;
CREATE TRIGGER trigger_update_schedule_execution_count
BEFORE UPDATE ON report_schedules
FOR EACH ROW
EXECUTE FUNCTION update_schedule_execution_count();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_recipients ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- REPORTS POLICIES
-- ============================================================================

-- Admins and Board Members can view all reports
CREATE POLICY "Admins and Board can view all reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'board')
    )
  );

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid() OR created_by = auth.uid());

-- Only service role can insert reports (via Edge Functions)
CREATE POLICY "Only service role can insert reports"
  ON reports
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Only service role can update reports
CREATE POLICY "Only service role can update reports"
  ON reports
  FOR UPDATE
  TO authenticated
  USING (false);

-- Only admins can delete reports
CREATE POLICY "Only admins can delete reports"
  ON reports
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- REPORT_SCHEDULES POLICIES
-- ============================================================================

-- Admins and Board Members can view all schedules
CREATE POLICY "Admins and Board can view all schedules"
  ON report_schedules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'board')
    )
  );

-- Only admins and board can manage schedules
CREATE POLICY "Admins and Board can manage schedules"
  ON report_schedules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'board')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'board')
    )
  );

-- ============================================================================
-- REPORT_RECIPIENTS POLICIES
-- ============================================================================

-- Users can view reports sent to them
CREATE POLICY "Users can view their received reports"
  ON report_recipients
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all recipients
CREATE POLICY "Admins can view all recipients"
  ON report_recipients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Only service role can manage recipients
CREATE POLICY "Only service role can manage recipients"
  ON report_recipients
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate next generation time for a schedule
CREATE OR REPLACE FUNCTION calculate_next_generation_time(
  p_frequency TEXT,
  p_day_of_month INTEGER,
  p_day_of_week INTEGER,
  p_time_of_day TEXT,
  p_from_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  v_next_time TIMESTAMP WITH TIME ZONE;
  v_hour INTEGER;
  v_minute INTEGER;
BEGIN
  -- Parse time of day
  v_hour := CAST(SPLIT_PART(p_time_of_day, ':', 1) AS INTEGER);
  v_minute := CAST(SPLIT_PART(p_time_of_day, ':', 2) AS INTEGER);

  CASE p_frequency
    WHEN 'DAILY' THEN
      v_next_time := DATE_TRUNC('day', p_from_time) + INTERVAL '1 day' +
                     MAKE_INTERVAL(hours => v_hour, mins => v_minute);

    WHEN 'WEEKLY' THEN
      v_next_time := DATE_TRUNC('week', p_from_time) +
                     INTERVAL '1 week' +
                     MAKE_INTERVAL(days => p_day_of_week, hours => v_hour, mins => v_minute);

    WHEN 'MONTHLY' THEN
      v_next_time := DATE_TRUNC('month', p_from_time) + INTERVAL '1 month';
      v_next_time := v_next_time + MAKE_INTERVAL(days => p_day_of_month - 1, hours => v_hour, mins => v_minute);

    WHEN 'QUARTERLY' THEN
      v_next_time := DATE_TRUNC('quarter', p_from_time) + INTERVAL '3 months';
      v_next_time := v_next_time + MAKE_INTERVAL(days => p_day_of_month - 1, hours => v_hour, mins => v_minute);

    WHEN 'YEARLY' THEN
      v_next_time := DATE_TRUNC('year', p_from_time) + INTERVAL '1 year';
      v_next_time := v_next_time + MAKE_INTERVAL(days => p_day_of_month - 1, hours => v_hour, mins => v_minute);

    ELSE
      RAISE EXCEPTION 'Invalid frequency: %', p_frequency;
  END CASE;

  -- If calculated time is in the past, move to next occurrence
  WHILE v_next_time <= p_from_time LOOP
    CASE p_frequency
      WHEN 'DAILY' THEN v_next_time := v_next_time + INTERVAL '1 day';
      WHEN 'WEEKLY' THEN v_next_time := v_next_time + INTERVAL '1 week';
      WHEN 'MONTHLY' THEN v_next_time := v_next_time + INTERVAL '1 month';
      WHEN 'QUARTERLY' THEN v_next_time := v_next_time + INTERVAL '3 months';
      WHEN 'YEARLY' THEN v_next_time := v_next_time + INTERVAL '1 year';
    END CASE;
  END LOOP;

  RETURN v_next_time;
END;
$$ LANGUAGE plpgsql;

-- Function to get active schedules that need to run
CREATE OR REPLACE FUNCTION get_due_report_schedules()
RETURNS SETOF report_schedules AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM report_schedules
  WHERE is_active = true
    AND (next_generation_at IS NULL OR next_generation_at <= NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Reports System Migration completed successfully!';
  RAISE NOTICE 'Tables created: reports, report_schedules, report_recipients';
  RAISE NOTICE 'Indexes created: 14 total';
  RAISE NOTICE 'RLS Policies created: 10 total';
  RAISE NOTICE 'Helper functions created: 2 total';
  RAISE NOTICE 'Triggers created: 4 total';
END $$;
