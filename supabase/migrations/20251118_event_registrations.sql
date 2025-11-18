-- Event Registrations System Migration
-- Created: 2025-11-18
-- Purpose: Add event registration capability with capacity management

-- ============================================================================
-- 1. ENHANCE EVENTS TABLE
-- ============================================================================

-- Add new columns to events table for registration support
ALTER TABLE events ADD COLUMN IF NOT EXISTS capacity INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS current_registrations INTEGER DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_required BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS featured_image_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_rule JSONB;
ALTER TABLE events ADD COLUMN IF NOT EXISTS allow_waitlist BOOLEAN DEFAULT true;

-- Add check constraint for capacity
ALTER TABLE events ADD CONSTRAINT events_capacity_positive CHECK (capacity IS NULL OR capacity > 0);
ALTER TABLE events ADD CONSTRAINT events_registrations_within_capacity CHECK (current_registrations <= COALESCE(capacity, 999999));

-- ============================================================================
-- 2. CREATE EVENT_REGISTRATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Registration details
  registration_status TEXT NOT NULL DEFAULT 'registered'
    CHECK (registration_status IN ('registered', 'waitlisted', 'cancelled', 'attended', 'no_show')),

  -- Timestamps
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  attended_at TIMESTAMP WITH TIME ZONE,

  -- Additional info
  notes TEXT,
  guest_count INTEGER DEFAULT 0 CHECK (guest_count >= 0),
  dietary_restrictions TEXT,
  emergency_contact TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one registration per user per event
  UNIQUE(event_id, user_id)
);

-- ============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date_status ON events(event_date, status);
CREATE INDEX IF NOT EXISTS idx_events_registration_deadline ON events(registration_deadline) WHERE registration_required = true;
CREATE INDEX IF NOT EXISTS idx_events_tags ON events USING GIN(tags);

-- Event registrations indexes
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(registration_status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_status ON event_registrations(event_id, registration_status);

-- ============================================================================
-- 4. CREATE TRIGGER FOR UPDATING CURRENT_REGISTRATIONS
-- ============================================================================

-- Function to update current_registrations count
CREATE OR REPLACE FUNCTION update_event_registration_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the events table with current registration count
  UPDATE events
  SET current_registrations = (
    SELECT COUNT(*)
    FROM event_registrations
    WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
      AND registration_status = 'registered'
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger on INSERT, UPDATE, DELETE
DROP TRIGGER IF EXISTS trigger_update_event_registration_count ON event_registrations;
CREATE TRIGGER trigger_update_event_registration_count
AFTER INSERT OR UPDATE OR DELETE ON event_registrations
FOR EACH ROW
EXECUTE FUNCTION update_event_registration_count();

-- ============================================================================
-- 5. CREATE TRIGGER FOR UPDATED_AT TIMESTAMP
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for event_registrations
DROP TRIGGER IF EXISTS update_event_registrations_updated_at ON event_registrations;
CREATE TRIGGER update_event_registrations_updated_at
BEFORE UPDATE ON event_registrations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on event_registrations
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own registrations
CREATE POLICY "Users can view own event registrations"
  ON event_registrations
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'board')
    )
  );

-- Policy: Users can create their own registrations
CREATE POLICY "Users can create event registrations"
  ON event_registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    -- Ensure event exists and registration is allowed
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_id
        AND events.status = 'published'
        AND (
          events.registration_deadline IS NULL OR
          events.registration_deadline > NOW()
        )
    )
  );

-- Policy: Users can update their own registrations (mainly for cancellation)
CREATE POLICY "Users can update own event registrations"
  ON event_registrations
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'board')
    )
  );

-- Policy: Users can delete their own registrations
CREATE POLICY "Users can delete own event registrations"
  ON event_registrations
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'board')
    )
  );

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user can register for event
CREATE OR REPLACE FUNCTION can_register_for_event(
  p_event_id UUID,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_event RECORD;
  v_registration_count INTEGER;
  v_result JSONB;
BEGIN
  -- Get event details
  SELECT * INTO v_event
  FROM events
  WHERE id = p_event_id;

  -- Check if event exists
  IF v_event IS NULL THEN
    RETURN jsonb_build_object(
      'can_register', false,
      'reason', 'event_not_found',
      'message', 'Event does not exist'
    );
  END IF;

  -- Check if event is published
  IF v_event.status != 'published' THEN
    RETURN jsonb_build_object(
      'can_register', false,
      'reason', 'event_not_published',
      'message', 'Event is not open for registration'
    );
  END IF;

  -- Check registration deadline
  IF v_event.registration_deadline IS NOT NULL AND v_event.registration_deadline < NOW() THEN
    RETURN jsonb_build_object(
      'can_register', false,
      'reason', 'registration_closed',
      'message', 'Registration deadline has passed'
    );
  END IF;

  -- Check if user already registered
  IF EXISTS (
    SELECT 1 FROM event_registrations
    WHERE event_id = p_event_id
      AND user_id = p_user_id
      AND registration_status IN ('registered', 'waitlisted')
  ) THEN
    RETURN jsonb_build_object(
      'can_register', false,
      'reason', 'already_registered',
      'message', 'You are already registered for this event'
    );
  END IF;

  -- Check capacity
  IF v_event.capacity IS NOT NULL THEN
    SELECT COUNT(*) INTO v_registration_count
    FROM event_registrations
    WHERE event_id = p_event_id
      AND registration_status = 'registered';

    IF v_registration_count >= v_event.capacity THEN
      IF v_event.allow_waitlist THEN
        RETURN jsonb_build_object(
          'can_register', true,
          'reason', 'waitlist_available',
          'message', 'Event is full, but you can join the waitlist',
          'will_be_waitlisted', true
        );
      ELSE
        RETURN jsonb_build_object(
          'can_register', false,
          'reason', 'event_full',
          'message', 'Event is at full capacity'
        );
      END IF;
    END IF;
  END IF;

  -- All checks passed
  RETURN jsonb_build_object(
    'can_register', true,
    'reason', 'ok',
    'message', 'You can register for this event',
    'will_be_waitlisted', false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. SAMPLE DATA (Optional - Comment out for production)
-- ============================================================================

-- Uncomment below to add sample registrations for testing
/*
INSERT INTO event_registrations (event_id, user_id, registration_status, notes)
SELECT
  e.id,
  p.id,
  'registered',
  'Sample registration for testing'
FROM events e
CROSS JOIN profiles p
WHERE e.status = 'published'
LIMIT 5;
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables exist
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'event_registrations') = 1,
    'event_registrations table was not created';

  RAISE NOTICE 'Event Registrations Migration completed successfully!';
  RAISE NOTICE 'Tables created: event_registrations';
  RAISE NOTICE 'Indexes created: 9 total';
  RAISE NOTICE 'Triggers created: 2 total';
  RAISE NOTICE 'RLS Policies created: 4 total';
  RAISE NOTICE 'Helper functions created: 1 total';
END $$;
