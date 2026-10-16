-- Migration: Enforce Exclusive Media Gateway (media_id as single source of truth)
-- Date: 2026-10-09
-- Purpose: Eliminate fallback logic; make media_id the ONLY gateway for all media assets
-- Phase 1: Data preparation + schema enforcement

BEGIN;

-- ============================================================
-- PHASE 1.1: NULL out all legacy image_url columns
-- (These columns were fallbacks; now deprecated)
-- ============================================================

UPDATE public.hero_slides SET image_url = NULL WHERE image_url IS NOT NULL;
UPDATE public.gallery SET image_url = NULL WHERE image_url IS NOT NULL;
UPDATE public.services SET image_url = NULL WHERE image_url IS NOT NULL;
UPDATE public.menu_items SET image_url = NULL WHERE image_url IS NOT NULL;
UPDATE public.testimonials SET image_url = NULL WHERE image_url IS NOT NULL;

-- Note: business_settings.image_url also exists but is not actively used
UPDATE public.business_settings SET image_url = NULL WHERE image_url IS NOT NULL;

-- ============================================================
-- PHASE 1.2: Verify all rows have media_id (pre-constraint check)
-- If any of these queries return rows, the migration will fail
-- ============================================================

-- These checks ensure no NULL media_ids exist before adding NOT NULL constraint
-- hero_slides: Should have 2 rows, all with media_id
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.hero_slides WHERE media_id IS NULL) > 0 THEN
    RAISE EXCEPTION 'MIGRATION_BLOCKED: hero_slides has rows with NULL media_id. Migrate or delete these rows first.';
  END IF;
END $$;

-- gallery: Should have 14 rows, all with media_id
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.gallery WHERE media_id IS NULL) > 0 THEN
    RAISE EXCEPTION 'MIGRATION_BLOCKED: gallery has rows with NULL media_id. Migrate or delete these rows first.';
  END IF;
END $$;

-- services: Should have 14 rows, all with media_id (check for the 1 gap)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.services WHERE media_id IS NULL) > 0 THEN
    RAISE EXCEPTION 'MIGRATION_BLOCKED: services has %s row(s) with NULL media_id. Migrate image_url to media_assets or delete.', 
      (SELECT COUNT(*) FROM public.services WHERE media_id IS NULL);
  END IF;
END $$;

-- menu_items: Should have 14 rows, all with media_id
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.menu_items WHERE media_id IS NULL) > 0 THEN
    RAISE EXCEPTION 'MIGRATION_BLOCKED: menu_items has rows with NULL media_id. Migrate or delete these rows first.';
  END IF;
END $$;

-- ============================================================
-- PHASE 2: Add NOT NULL constraints (Enforce exclusive media gateway)
-- ============================================================

ALTER TABLE public.hero_slides ALTER COLUMN media_id SET NOT NULL;
ALTER TABLE public.gallery ALTER COLUMN media_id SET NOT NULL;
ALTER TABLE public.services ALTER COLUMN media_id SET NOT NULL;
ALTER TABLE public.menu_items ALTER COLUMN media_id SET NOT NULL;

-- Testimonials: Add NOT NULL when field is used (optional for now)
-- ALTER TABLE public.testimonials ALTER COLUMN media_id SET NOT NULL;

-- ============================================================
-- PHASE 2B: Add schema documentation (exclusive gateway contract)
-- ============================================================

COMMENT ON COLUMN public.hero_slides.media_id IS 
  'EXCLUSIVE MEDIA GATEWAY: Required FK to media_assets.id. This is the sole source of truth for hero slide images. Legacy image_url column is deprecated.';

COMMENT ON COLUMN public.gallery.media_id IS 
  'EXCLUSIVE MEDIA GATEWAY: Required FK to media_assets.id. This is the sole source of truth for gallery images. Legacy image_url column is deprecated.';

COMMENT ON COLUMN public.services.media_id IS 
  'EXCLUSIVE MEDIA GATEWAY: Required FK to media_assets.id. This is the sole source of truth for service images. Legacy image_url column is deprecated.';

COMMENT ON COLUMN public.menu_items.media_id IS 
  'EXCLUSIVE MEDIA GATEWAY: Required FK to media_assets.id. This is the sole source of truth for menu item images. Legacy image_url column is deprecated.';

COMMENT ON COLUMN public.hero_slides.image_url IS 
  'DEPRECATED: Legacy fallback column. Use media_id → media_assets.public_url exclusively. This column is retained for historical reference only.';

COMMENT ON COLUMN public.gallery.image_url IS 
  'DEPRECATED: Legacy fallback column. Use media_id → media_assets.public_url exclusively. This column is retained for historical reference only.';

COMMENT ON COLUMN public.services.image_url IS 
  'DEPRECATED: Legacy fallback column. Use media_id → media_assets.public_url exclusively. This column is retained for historical reference only.';

COMMENT ON COLUMN public.menu_items.image_url IS 
  'DEPRECATED: Legacy fallback column. Use media_id → media_assets.public_url exclusively. This column is retained for historical reference only.';

-- ============================================================
-- Verification Queries (Run these after migration to confirm)
-- ============================================================
-- SELECT COUNT(*) as hero_with_media FROM public.hero_slides WHERE media_id IS NOT NULL;
-- SELECT COUNT(*) as gallery_with_media FROM public.gallery WHERE media_id IS NOT NULL;
-- SELECT COUNT(*) as services_with_media FROM public.services WHERE media_id IS NOT NULL;
-- SELECT COUNT(*) as menu_with_media FROM public.menu_items WHERE media_id IS NOT NULL;
-- SELECT COUNT(*) as hero_null_image FROM public.hero_slides WHERE image_url IS NOT NULL;
-- SELECT COUNT(*) as gallery_null_image FROM public.gallery WHERE image_url IS NOT NULL;
-- SELECT COUNT(*) as services_null_image FROM public.services WHERE image_url IS NOT NULL;
-- SELECT COUNT(*) as menu_null_image FROM public.menu_items WHERE image_url IS NOT NULL;

COMMIT;
