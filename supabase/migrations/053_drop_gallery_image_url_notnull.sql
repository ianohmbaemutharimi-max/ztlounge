-- ============================================================================
-- Migration 053: Drop NOT NULL constraint on gallery.image_url
-- ============================================================================
-- Purpose: Remove the NOT NULL constraint on gallery.image_url so that
-- migration 046 (NULL out legacy image_url) can be applied.
-- Blocker: gallery.image_url has a column-level NOT NULL constraint that
-- prevents setting it to NULL, even when media_id is valid.
-- ============================================================================

BEGIN;

-- Drop the NOT NULL constraint on gallery.image_url
ALTER TABLE public.gallery ALTER COLUMN image_url DROP NOT NULL;

-- Verify the constraint was dropped
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'gallery'
      AND column_name = 'image_url'
      AND is_nullable = 'NO'
  ) THEN
    RAISE EXCEPTION 'gallery.image_url still has NOT NULL constraint after DROP';
  END IF;
END $$;

COMMIT;

-- Verification query (run manually after migration):
-- SELECT column_name, is_nullable FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'gallery' AND column_name = 'image_url';