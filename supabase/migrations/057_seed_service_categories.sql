-- ============================================================
-- 057_seed_service_categories.sql
-- Seed the canonical service_categories rows used by the public
-- category grids (data-category-grid → ServicesRepository.getByCategory()).
--
-- CONTEXT:
--   The public service pages (restaurant, lounge, vip, events,
--   conference, grooming-care, ...) render their service-card grids
--   from Supabase:
--     1. content-loader.js  populateServiceCardsByCategory(pageId)
--     2. ServicesRepository.getByCategory(slug)
--        → SELECT id FROM service_categories
--          WHERE slug = <slug> AND is_active = true
--        → SELECT * FROM services
--          WHERE category_id = <id> AND is_active AND type = 'service'
--
--   No migration prior to this one seeds service_categories for these
--   slugs (only 036_add_barbershop.sql inserts 'barbershop'), so a
--   freshly provisioned database resolves every category lookup to
--   NULL and every public grid falls back to its empty state. The
--   production project already carries these rows (created via the
--   admin catalog); this migration makes fresh environments match.
--
-- WHAT THIS DOES:
--   Idempotent INSERT: one row per canonical category slug, inserted
--   only when a row with that slug does not already exist (per-slug
--   WHERE NOT EXISTS, same pattern as 036_add_barbershop.sql).
--
-- SAFETY:
--   - Never updates or deletes existing rows → production unaffected.
--   - Safe to re-run any number of times.
--   - Does NOT touch the services table; service card rows remain
--     admin-managed content.
-- ============================================================

BEGIN;

INSERT INTO service_categories (name, slug, description, icon, display_order, is_active)
SELECT v.name, v.slug, v.description, v.icon, v.display_order, v.is_active
FROM (VALUES
    ('Restaurant',      'restaurant',      'Fine dining experiences',                                      'fa-utensils',       0, true),
    ('Lounge & Bar',    'lounge-bar',      'Lounge and bar experiences',                                   'fa-glass-cheers',   1, true),
    ('VIP Cabins',      'vip-cabins',      'Private VIP cabin experiences',                                'fa-crown',          2, true),
    ('Events',          'events',          'Events and celebrations',                                      'fa-calendar-check', 3, true),
    ('Conference',      'conference',      'Conference facilities',                                        'fa-users',          4, true),
    ('Auto Spa',        'auto-spa',        'Auto spa and detailing',                                       'fa-car',            5, true),
    ('Barbershop',      'barbershop',      'Professional barbering and grooming services',                 'fa-cut',            6, true),
    ('Carpet Cleaning', 'carpet-cleaning', 'Professional carpet and upholstery cleaning services. Deep cleaning, stain removal, and fabric protection for homes and offices.', 'fa-solid fa-soap', 7, true)
) AS v(name, slug, description, icon, display_order, is_active)
WHERE NOT EXISTS (
    SELECT 1 FROM service_categories sc
    WHERE sc.slug = v.slug
);

COMMIT;
