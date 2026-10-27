-- ============================================================
-- Migration 059: Simplify Service Card Types to Nav/Info Only
-- Date: 2026-10-23
-- Purpose: Clean up service types - only keep nav, info (+ packages in service_charges)
--          Remove unused types: service, experience, feature
-- ============================================================

-- Step 1: Report current type distribution
DO $$
DECLARE
  service_count INTEGER;
  experience_count INTEGER;
  feature_count INTEGER;
  nav_count INTEGER;
  info_count INTEGER;
  packages_count INTEGER;
  other_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO service_count FROM services WHERE type = 'service';
  SELECT COUNT(*) INTO experience_count FROM services WHERE type = 'experience';
  SELECT COUNT(*) INTO feature_count FROM services WHERE type = 'feature';
  SELECT COUNT(*) INTO nav_count FROM services WHERE type = 'nav';
  SELECT COUNT(*) INTO info_count FROM services WHERE type = 'info';
  SELECT COUNT(*) INTO packages_count FROM services WHERE type = 'packages';
  SELECT COUNT(*) INTO other_count FROM services WHERE type NOT IN ('service', 'experience', 'feature', 'nav', 'info', 'packages');
  
  RAISE NOTICE '=== Current Service Type Distribution ===';
  RAISE NOTICE 'service: %', service_count;
  RAISE NOTICE 'experience: %', experience_count;
  RAISE NOTICE 'feature: %', feature_count;
  RAISE NOTICE 'nav: %', nav_count;
  RAISE NOTICE 'info: %', info_count;
  RAISE NOTICE 'packages: %', packages_count;
  RAISE NOTICE 'other: %', other_count;
  RAISE NOTICE '========================================';
END $$;

-- Step 2: Migrate existing cards to nav/info types
-- (Adjust these conversions based on your business logic)

-- Convert 'service' and 'experience' cards to 'nav' (navigation to service pages)
UPDATE services 
SET type = 'nav', 
    updated_at = NOW()
WHERE type IN ('service', 'experience') 
  AND is_active = true;

-- Convert 'feature' cards to 'info' (informational badges)
UPDATE services 
SET type = 'info',
    updated_at = NOW()
WHERE type = 'feature'
  AND is_active = true;

-- Remove any 'packages' type from services table (should be in service_charges)
UPDATE services
SET is_active = false,
    updated_at = NOW()
WHERE type = 'packages';

-- Step 3: Add CHECK constraint to enforce only nav/info types
ALTER TABLE services
DROP CONSTRAINT IF EXISTS services_type_check;

ALTER TABLE services
ADD CONSTRAINT services_type_check 
CHECK (type IN ('nav', 'info'));

-- Step 4: Update default type to 'nav'
ALTER TABLE services
ALTER COLUMN type SET DEFAULT 'nav';

-- Step 5: Add helpful comments
COMMENT ON COLUMN services.type IS 'Card type: nav (navigation cards with links) or info (informational cards/badges). Packages use service_charges table.';
COMMENT ON TABLE services IS 'Navigation and informational cards for pages. Use service_charges for package pricing.';
COMMENT ON TABLE service_charges IS 'Package pricing cards (separate from services). Use media_id for package images if needed.';

-- Step 6: Report final state
DO $$
DECLARE
  nav_count INTEGER;
  info_count INTEGER;
  inactive_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO nav_count FROM services WHERE type = 'nav' AND is_active = true;
  SELECT COUNT(*) INTO info_count FROM services WHERE type = 'info' AND is_active = true;
  SELECT COUNT(*) INTO inactive_count FROM services WHERE is_active = false;
  
  RAISE NOTICE '=== Migration 059 Complete ===';
  RAISE NOTICE 'Active nav cards: %', nav_count;
  RAISE NOTICE 'Active info cards: %', info_count;
  RAISE NOTICE 'Deactivated cards: %', inactive_count;
  RAISE NOTICE 'Use service_charges table for package pricing';
  RAISE NOTICE '===============================';
END $$;
