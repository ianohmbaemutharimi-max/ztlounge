-- ============================================================================
-- Migration 054: NULL out legacy image_url columns (gallery, services, menu_items)
-- ============================================================================
-- Purpose: Complete Phase 1 of migration 046 by setting image_url = NULL
-- on rows that have a valid media_id. This must run AFTER migration 053
-- (which drops the NOT NULL constraint on gallery.image_url).
-- ============================================================================

BEGIN;

-- Gallery: NULL out image_url where media_id is valid (52 rows)
UPDATE public.gallery
SET image_url = NULL
WHERE image_url IS NOT NULL
  AND media_id IS NOT NULL;

-- Services: NULL out image_url where media_id is valid (13 rows)
UPDATE public.services
SET image_url = NULL
WHERE image_url IS NOT NULL
  AND media_id IS NOT NULL;

-- Menu items: NULL out image_url where media_id is valid (remaining rows)
UPDATE public.menu_items
SET image_url = NULL
WHERE image_url IS NOT NULL
  AND media_id IS NOT NULL;

-- Verification: report any remaining non-NULL image_url values
DO $$
DECLARE
  gallery_remaining int;
  services_remaining int;
  menu_remaining int;
BEGIN
  SELECT COUNT(*) INTO gallery_remaining FROM public.gallery WHERE image_url IS NOT NULL;
  SELECT COUNT(*) INTO services_remaining FROM public.services WHERE image_url IS NOT NULL;
  SELECT COUNT(*) INTO menu_remaining FROM public.menu_items WHERE image_url IS NOT NULL;

  RAISE NOTICE 'Remaining non-NULL image_url: gallery=%, services=%, menu_items=%',
    gallery_remaining, services_remaining, menu_remaining;
END $$;

COMMIT;

-- Verification queries (run manually after migration):
-- SELECT COUNT(*) FROM public.gallery WHERE image_url IS NOT NULL;        -- expect 0
-- SELECT COUNT(*) FROM public.services WHERE image_url IS NOT NULL;       -- expect 32+ (gap services)
-- SELECT COUNT(*) FROM public.menu_items WHERE image_url IS NOT NULL;     -- expect 0