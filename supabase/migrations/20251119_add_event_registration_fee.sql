-- Add Event Registration Fee Support
-- Created: 2025-11-19
-- Purpose: Add registration fee field to events table for paid events

-- Add registration_fee column (in cents)
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_fee INTEGER DEFAULT 0 CHECK (registration_fee >= 0);

-- Add fee description
ALTER TABLE events ADD COLUMN IF NOT EXISTS fee_description TEXT;

-- Add index for paid events queries
CREATE INDEX IF NOT EXISTS idx_events_has_fee ON events(registration_fee) WHERE registration_fee > 0;

-- Update comment
COMMENT ON COLUMN events.registration_fee IS 'Registration fee in cents (100 = $1.00). 0 means free event.';
COMMENT ON COLUMN events.fee_description IS 'Optional description of what the fee covers';

-- Notify
DO $$
BEGIN
  RAISE NOTICE 'Event registration fee support added successfully!';
  RAISE NOTICE 'Events can now have optional registration fees';
END $$;
