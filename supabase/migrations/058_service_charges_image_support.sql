-- ============================================================
-- Migration 058: Service Charges Image Support + Services Canonicalization
-- Date: 2026-10-23
-- Purpose: Add media_id to service_charges for package cards with images
--          and ensure all services are truly page-canonical
-- ============================================================

-- Add media_id column to service_charges for image support
ALTER TABLE service_charges 
ADD COLUMN IF NOT EXISTS media_id UUID REFERENCES media_assets(id) ON DELETE SET NULL;

-- Add alt_text for accessibility
ALTER TABLE service_charges 
ADD COLUMN IF NOT EXISTS alt_text TEXT DEFAULT '';

-- Add display metadata
ALTER TABLE service_charges 
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '';

COMMENT ON COLUMN service_charges.media_id IS 'FK to media_assets for package card images';
COMMENT ON COLUMN service_charges.alt_text IS 'Accessibility text for package images';
COMMENT ON COLUMN service_charges.icon IS 'Font Awesome icon class for text-only package cards';

-- Create index for media lookup
CREATE INDEX IF NOT EXISTS idx_service_charges_media_id ON service_charges(media_id);

-- Ensure service_id has proper index for joins
CREATE INDEX IF NOT EXISTS idx_service_charges_service_id ON service_charges(service_id);

-- ============================================================
-- Data Integrity: Verify all services have proper page assignment
-- ============================================================

-- Report services without page_id (these should be assigned or categorized)
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count 
  FROM services 
  WHERE page_id IS NULL AND is_active = true;
  
  IF orphan_count > 0 THEN
    RAISE NOTICE 'Found % active services without page_id - consider assigning them', orphan_count;
  END IF;
END $$;

-- ============================================================
-- Admin RLS: Ensure service_charges respects same policies as services
-- ============================================================

-- Anon users can read active service_charges
DROP POLICY IF EXISTS "anon_read_active_service_charges" ON service_charges;
CREATE POLICY "anon_read_active_service_charges" ON service_charges
  FOR SELECT
  USING (status = 'active');

-- ============================================================
-- Migration Verification
-- ============================================================

DO $$
BEGIN
  -- Verify column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_charges' 
    AND column_name = 'media_id'
  ) THEN
    RAISE EXCEPTION 'Migration failed: media_id column not created';
  END IF;
  
  -- Verify FK constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'service_charges' 
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%media_id%'
  ) THEN
    RAISE NOTICE 'Warning: media_id FK constraint may not be properly named';
  END IF;
  
  RAISE NOTICE 'Migration 058 completed successfully';
END $$;
