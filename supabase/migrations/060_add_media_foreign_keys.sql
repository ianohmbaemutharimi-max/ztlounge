-- Migration: Add Foreign Key Constraints for Media References
-- Date: 2026-10-24
-- Purpose: Add FK constraints to prevent future orphaned media references
-- This ensures data integrity by linking media_id columns to media_assets table

BEGIN;

-- ============================================================
-- Add foreign key constraints to all media-referencing tables
-- ============================================================

-- hero_slides: Add FK constraint
ALTER TABLE public.hero_slides
  ADD CONSTRAINT fk_hero_slides_media
  FOREIGN KEY (media_id) REFERENCES media_assets(id) ON DELETE SET NULL;

-- gallery: Add FK constraint
ALTER TABLE public.gallery
  ADD CONSTRAINT fk_gallery_media
  FOREIGN KEY (media_id) REFERENCES media_assets(id) ON DELETE SET NULL;

-- services: Add FK constraint
ALTER TABLE public.services
  ADD CONSTRAINT fk_services_media
  FOREIGN KEY (media_id) REFERENCES media_assets(id) ON DELETE SET NULL;

-- menu_items: Add FK constraint
ALTER TABLE public.menu_items
  ADD CONSTRAINT fk_menu_items_media
  FOREIGN KEY (media_id) REFERENCES media_assets(id) ON DELETE SET NULL;

-- membership_plans: Add FK constraint (for future use when media is attached)
ALTER TABLE public.membership_plans
  ADD CONSTRAINT fk_membership_plans_media
  FOREIGN KEY (media_id) REFERENCES media_assets(id) ON DELETE SET NULL;

-- ============================================================
-- Add indexes for foreign key columns (for performance)
-- ============================================================

CREATE INDEX idx_hero_slides_media_id ON public.hero_slides(media_id);
CREATE INDEX idx_gallery_media_id ON public.gallery(media_id);
CREATE INDEX idx_services_media_id ON public.services(media_id);
CREATE INDEX idx_menu_items_media_id ON public.menu_items(media_id);
CREATE INDEX idx_membership_plans_media_id ON public.membership_plans(media_id);

-- ============================================================
-- Add comments to document the relationships
-- ============================================================

COMMENT ON COLUMN public.hero_slides.media_id IS
  'Foreign key to media_assets.id. On DELETE SET NULL, the media_id will be set to NULL if the media is deleted.';

COMMENT ON COLUMN public.gallery.media_id IS
  'Foreign key to media_assets.id. On DELETE SET NULL, the media_id will be set to NULL if the media is deleted.';

COMMENT ON COLUMN public.services.media_id IS
  'Foreign key to media_assets.id. On DELETE SET NULL, the media_id will be set to NULL if the media is deleted.';

COMMENT ON COLUMN public.menu_items.media_id IS
  'Foreign key to media_assets.id. On DELETE SET NULL, the media_id will be set to NULL if the media is deleted.';

COMMENT ON COLUMN public.membership_plans.media_id IS
  'Foreign key to media_assets.id. On DELETE SET NULL, the media_id will be set to NULL if the media is deleted.';

-- ============================================================
-- Verification Queries
-- ============================================================
-- Run these to verify the constraints were added:
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid IN ('public.hero_slides'::regclass, 'public.gallery'::regclass, 'public.services'::regclass, 'public.menu_items'::regclass, 'public.membership_plans'::regclass);

-- SELECT count(*) as total_orphaned
-- FROM (
--   SELECT media_id FROM public.hero_slides WHERE media_id NOT IN (SELECT id FROM media_assets)
--   UNION ALL
--   SELECT media_id FROM public.gallery WHERE media_id NOT IN (SELECT id FROM media_assets)
--   UNION ALL
--   SELECT media_id FROM public.services WHERE media_id NOT IN (SELECT id FROM media_assets)
--   UNION ALL
--   SELECT media_id FROM public.menu_items WHERE media_id NOT IN (SELECT id FROM media_assets)
-- ) orphaned;

COMMIT;

-- ============================================================
-- Post-Migration Notes
-- ============================================================
-- 1. The ON DELETE SET NULL ensures that deleting a media asset 
--    will automatically set all referencing rows to NULL, preventing
--    orphaned references.
-- 2. The indexes will improve query performance when filtering by media_id.
-- 3. This migration assumes all existing data is already clean (verified).
-- 4. If you need strict enforcement (no NULLs allowed), change ON DELETE SET NULL
--    to ON DELETE CASCADE or use NOT NULL constraint.
