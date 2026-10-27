-- ============================================================
-- 058_add_lounge_cocktails_category.sql
-- Add 'lounge' category for signature cocktails section
--
-- CONTEXT:
--   pages/experiences/lounge.html has two service grids:
--     1. Line 658: data-category-slug="lounge-bar" (general lounge services)
--     2. Line 671: data-category-slug="lounge" (signature cocktails)
--
--   Migration 057 only created 'lounge-bar', so the cocktails
--   section falls back to empty state. This adds the missing
--   'lounge' category for cocktail-specific services.
--
-- WHAT THIS DOES:
--   Idempotent INSERT: one row for 'lounge' slug
--
-- SAFETY:
--   - Never updates or deletes existing rows
--   - Safe to re-run any number of times
-- ============================================================

BEGIN;

INSERT INTO service_categories (name, slug, description, icon, display_order, is_active)
SELECT v.name, v.slug, v.description, v.icon, v.display_order, v.is_active
FROM (VALUES
    ('Signature Cocktails', 'lounge', 'Signature cocktails and premium beverages crafted by our master mixologists', 'fa-cocktail', 8, true)
) AS v(name, slug, description, icon, display_order, is_active)
WHERE NOT EXISTS (
    SELECT 1 FROM service_categories sc
    WHERE sc.slug = v.slug
);

COMMIT;
