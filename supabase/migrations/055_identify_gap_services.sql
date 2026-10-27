-- ============================================================================
-- Migration 055: Identify services with NULL media_id (gap services)
-- ============================================================================
-- Purpose: Identify services that have both media_id NULL and image_url NULL.
-- These rows block migration 046's NOT NULL enforcement on services.media_id.
-- Must be resolved before running migration 046.
-- ============================================================================

BEGIN;

-- Count gap services
DO $$
DECLARE
  gap_count int;
BEGIN
  SELECT COUNT(*) INTO gap_count
  FROM public.services
  WHERE media_id IS NULL;

  IF gap_count > 0 THEN
    RAISE NOTICE 'GAP SERVICES FOUND: % service(s) have NULL media_id', gap_count;
    RAISE NOTICE 'These must be resolved (assign media_asset or delete) before migration 046 can add NOT NULL constraint.';
  ELSE
    RAISE NOTICE 'No gap services found. All services have media_id.';
  END IF;
END $$;

-- List gap services for manual review
SELECT id, name, media_id, image_url, page_id, created_at
FROM public.services
WHERE media_id IS NULL
ORDER BY name;

COMMIT;