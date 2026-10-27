-- ============================================================
-- 043_website_pages_section_toggles.sql
-- Phase 2C: independent per-page section visibility toggles.
--   service_cards_enabled    -> #services (service card section)
--   service_packages_enabled -> #pricing  (package/pricing section)
-- Additive and idempotent; DEFAULT true preserves current rendering
-- for every existing row (no behavior change on apply).
-- ============================================================

BEGIN;

ALTER TABLE public.website_pages
    ADD COLUMN IF NOT EXISTS service_cards_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE public.website_pages
    ADD COLUMN IF NOT EXISTS service_packages_enabled boolean NOT NULL DEFAULT true;

COMMIT;