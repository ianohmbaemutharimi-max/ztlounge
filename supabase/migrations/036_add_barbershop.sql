-- ============================================================
-- 036_add_barbershop.sql
-- Barbershop as a first-class service category.
-- Source architecture: BARBERSHOP_AUTOSPA_FORENSIC_REVIEW.md (§11)
--
-- ADDITIVE ONLY — no schema changes, no new tables:
--   service_categories  (category row)
--   website_pages       (CMS page anchor)
--   services            (the offering row)
--
-- Explicitly NOT created (duplicate-subsystem rule):
--   barbershop_services / barbershop_bookings / barbershop_media
--
-- OWNER DATA BOUNDARY (safe to replace once the owner supplies
-- the final commercial catalogue):
--   * The Barbershop service row is seeded INACTIVE
--     (is_active = false) — no owner-approved prices/durations
--     exist yet, so nothing is publicly bookable or displayed.
--   * duration_minutes = 30 is a PROVISIONAL booking-slot default
--     (create_booking derives end_time from it). Owner to confirm.
--   * NO service_charges rows are seeded — prices are never
--     invented. The public page renders the canonical
--     service_charges source once the owner adds packages.
--   * media_id / image_url intentionally NULL — imagery must be
--     assigned through the admin Media Library
--     (media_assets → services.media_id → MediaResolver),
--     never hardcoded.
--
-- Idempotent: every insert is guarded by WHERE NOT EXISTS, so the
-- migration can be re-applied safely.
-- ============================================================

-- 1. Category -------------------------------------------------
INSERT INTO service_categories (name, slug, description, icon, display_order, is_active)
SELECT 'Barbershop', 'barbershop',
       'Professional barbering and grooming services',
       'fa-cut', 6, true
WHERE NOT EXISTS (SELECT 1 FROM service_categories WHERE slug = 'barbershop');

-- 2. Website page (CMS anchor for page-scoped content) --------
INSERT INTO website_pages (page_key, title, subtitle, seo_title, seo_description)
SELECT 'barbershop', 'Barbershop',
       'Premium grooming services at ZT Lounge.',
       'Barbershop - ZT Lounge Meru',
       'Premium barbering and grooming services at ZT Lounge Meru. Haircuts, beard trims, shaves and styling.'
WHERE NOT EXISTS (SELECT 1 FROM website_pages WHERE page_key = 'barbershop');

-- 3. The Barbershop offering (single service row, same model
--    as the Auto Spa offering: one services row + service_charges
--    packages beneath it) --------------------------------------
INSERT INTO services (
    category_id, name, slug, description, duration_minutes, price,
    image_url, alt_text, tag, href, type, display_order,
    page_id, icon, featured, is_active
)
SELECT
    c.id,
    'Barbershop',
    'barbershop',
    'Premium barbering and grooming services at ZT Lounge. Final service catalogue and pricing to be confirmed.',
    30,                                  -- PROVISIONAL: owner to confirm
    0,                                   -- catalog price 0: real prices live in service_charges
    NULL,                                -- no fabricated imagery (Media Library only)
    '',
    'Grooming',
    'pages/business/barbershop.html',
    'service',                           -- catalogue bucket in ServicesRepository.getByPage
    6,
    p.id,
    'fa-cut',
    false,
    false                                -- INACTIVE until the owner finalises the catalogue
FROM service_categories c
CROSS JOIN website_pages p
WHERE c.slug = 'barbershop'
  AND p.page_key = 'barbershop'
  AND NOT EXISTS (SELECT 1 FROM services WHERE slug = 'barbershop');
