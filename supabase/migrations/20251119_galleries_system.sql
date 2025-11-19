-- Galleries System Migration
-- Created: 2025-11-19
-- Purpose: Add complete gallery management with Pixieset and Google Drive integration

-- ============================================================================
-- 1. CREATE GALLERIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS galleries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,

  -- Gallery metadata
  title TEXT NOT NULL,
  description TEXT,

  -- Gallery type and external integration
  gallery_type TEXT NOT NULL CHECK (gallery_type IN ('pixieset', 'google_drive', 'internal')),
  external_id TEXT, -- Pixieset collection ID or Google Drive folder ID
  external_url TEXT, -- Direct link to external gallery
  thumbnail_url TEXT, -- Representative thumbnail image

  -- Publishing and permissions
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: prevent duplicate external gallery links
  UNIQUE(gallery_type, external_id)
);

-- ============================================================================
-- 2. CREATE GALLERY_PHOTOS TABLE (for internal galleries or cached metadata)
-- ============================================================================

CREATE TABLE IF NOT EXISTS gallery_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,

  -- Photo details
  photo_url TEXT NOT NULL, -- Supabase storage URL or external URL
  thumbnail_url TEXT,
  caption TEXT,
  photographer_name TEXT,

  -- Photo metadata
  taken_at TIMESTAMP WITH TIME ZONE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_index INTEGER DEFAULT 0, -- For sorting photos

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Galleries indexes
CREATE INDEX IF NOT EXISTS idx_galleries_event_id ON galleries(event_id);
CREATE INDEX IF NOT EXISTS idx_galleries_gallery_type ON galleries(gallery_type);
CREATE INDEX IF NOT EXISTS idx_galleries_is_published ON galleries(is_published);
CREATE INDEX IF NOT EXISTS idx_galleries_created_by ON galleries(created_by);
CREATE INDEX IF NOT EXISTS idx_galleries_event_published ON galleries(event_id, is_published);

-- Gallery photos indexes
CREATE INDEX IF NOT EXISTS idx_gallery_photos_gallery_id ON gallery_photos(gallery_id);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_order ON gallery_photos(gallery_id, order_index);

-- ============================================================================
-- 4. CREATE TRIGGER FOR UPDATED_AT
-- ============================================================================

-- Trigger for galleries
DROP TRIGGER IF EXISTS update_galleries_updated_at ON galleries;
CREATE TRIGGER update_galleries_updated_at
BEFORE UPDATE ON galleries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on galleries
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;

-- Policy: Published galleries viewable by all members
CREATE POLICY "Published galleries viewable by members"
  ON galleries
  FOR SELECT
  TO authenticated
  USING (
    is_published = true OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'board')
    )
  );

-- Policy: Only admins and board can create galleries
CREATE POLICY "Admins and board can create galleries"
  ON galleries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'board')
    )
  );

-- Policy: Only admins and board can update galleries
CREATE POLICY "Admins and board can update galleries"
  ON galleries
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'board')
    )
  );

-- Policy: Only admins and board can delete galleries
CREATE POLICY "Admins and board can delete galleries"
  ON galleries
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'board')
    )
  );

-- Enable RLS on gallery_photos
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;

-- Policy: Photos visible if their gallery is visible
CREATE POLICY "Photos visible based on gallery visibility"
  ON gallery_photos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM galleries
      WHERE galleries.id = gallery_photos.gallery_id
        AND (
          galleries.is_published = true OR
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role IN ('admin', 'board')
          )
        )
    )
  );

-- Policy: Only admins and board can add photos
CREATE POLICY "Admins and board can add photos"
  ON gallery_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'board')
    )
  );

-- Policy: Only admins and board can update photos
CREATE POLICY "Admins and board can update photos"
  ON gallery_photos
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'board')
    )
  );

-- Policy: Only admins and board can delete photos
CREATE POLICY "Admins and board can delete photos"
  ON gallery_photos
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'board')
    )
  );

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to get photo count for a gallery
CREATE OR REPLACE FUNCTION get_gallery_photo_count(gallery_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM gallery_photos
    WHERE gallery_id = gallery_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. SAMPLE DATA (Optional - Comment out for production)
-- ============================================================================

-- Uncomment below to add sample galleries for testing
/*
-- Sample internal gallery
INSERT INTO galleries (title, description, gallery_type, is_published, event_id)
SELECT
  'Ramadan 2024 Photos',
  'Beautiful moments from our Ramadan celebrations',
  'internal',
  true,
  e.id
FROM events e
WHERE e.title LIKE '%Ramadan%'
LIMIT 1;

-- Sample Pixieset gallery (requires valid collection ID)
-- INSERT INTO galleries (title, description, gallery_type, external_id, external_url, is_published, event_id)
-- VALUES (
--   'Professional Event Photos',
--   'High-quality photos from our professional photographer',
--   'pixieset',
--   'your-pixieset-collection-id',
--   'https://client.pixieset.com/your-pixieset-collection-id',
--   true,
--   NULL
-- );
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables exist
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'galleries') = 1,
    'galleries table was not created';

  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'gallery_photos') = 1,
    'gallery_photos table was not created';

  RAISE NOTICE 'Galleries Migration completed successfully!';
  RAISE NOTICE 'Tables created: galleries, gallery_photos';
  RAISE NOTICE 'Indexes created: 7 total';
  RAISE NOTICE 'RLS Policies created: 8 total';
  RAISE NOTICE 'Helper functions created: 1 total';
END $$;
