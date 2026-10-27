-- Migration: Fix Classic Haircut service (prepare for exclusive media gateway)
-- Date: 2026-10-09
-- Purpose: Assign media_id to the "Classic Haircut" service which currently has NULL media_id
-- This must complete BEFORE Phase 1 enforcement (046_enforce_exclusive_media_gateway_phase1.sql)

BEGIN;

-- ============================================================
-- STEP 1: Identify the service with NULL media_id
-- ============================================================
-- Query to verify (run to confirm):
-- SELECT id, name, slug, media_id, image_url, price, is_active FROM services WHERE name = 'Classic Haircut';

-- ============================================================
-- STEP 2: Strategy - Assign to existing media or create new one
-- ============================================================
-- The "Classic Haircut" service is part of the "Grooming & Care" category.
-- We have two options:
-- OPTION A: Reuse an existing media_id from a similar service (e.g., "Beard Trim & Shape")
-- OPTION B: Create a placeholder media_id (use a default/fallback media asset)
--
-- For now, we'll use OPTION A: Reuse media_id from "Beard Trim & Shape" service
-- (both are grooming services, so this is semantically appropriate)
-- 
-- If a better media asset exists, update the UUID below.
-- ============================================================

-- Get the media_id from "Beard Trim & Shape" service
-- This serves as a temporary assignment
UPDATE public.services
SET media_id = (
  SELECT media_id 
  FROM public.services 
  WHERE name = 'Beard Trim & Shape' 
  AND media_id IS NOT NULL 
  LIMIT 1
)
WHERE name = 'Classic Haircut' 
AND media_id IS NULL;

-- ============================================================
-- STEP 3: Verify the update succeeded
-- ============================================================
-- Verify that Classic Haircut now has a media_id
DO $$
DECLARE
  haircut_media_id UUID;
BEGIN
  SELECT media_id INTO haircut_media_id 
  FROM public.services 
  WHERE name = 'Classic Haircut' 
  LIMIT 1;
  
  IF haircut_media_id IS NULL THEN
    RAISE EXCEPTION 'MIGRATION_FAILED: Classic Haircut service still has NULL media_id after update';
  ELSE
    RAISE NOTICE 'SUCCESS: Classic Haircut assigned media_id: %', haircut_media_id;
  END IF;
END $$;

-- ============================================================
-- STEP 4: Summary of changes
-- ============================================================
-- This migration:
-- 1. Assigned media_id to "Classic Haircut" service
-- 2. Enables Phase 1 migration to enforce NOT NULL constraint
-- 3. Does NOT delete or modify any other data
--
-- To review what was changed, run:
-- SELECT id, name, slug, media_id, price, is_active FROM services WHERE name = 'Classic Haircut';

COMMIT;
