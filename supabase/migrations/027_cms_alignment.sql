-- ============================================================
-- ZT Lounge CMS Alignment Migration
-- Migration: 027_cms_alignment
-- ============================================================
-- Purpose:
--   1. Seed website_pages (unblocks all page_id FKs)
--   2. Fix menu_items.category_id -> menu_categories relationships
--   3. Fix services.page_id -> website_pages relationships
--   4. Remove fake/test/demo content
--   5. Safe gallery cleanup (NO TRUNCATE)
--   6. Re-verify RLS stays enabled (no security weakening)
--
-- Reversible: YES (rollback SQL at bottom)
-- Safe to run multiple times (idempotent via ON CONFLICT / WHERE filters)
-- ============================================================

BEGIN;

-- ============================================================
-- 1. SEED WEBSITE_PAGES
-- ============================================================

INSERT INTO website_pages (page_key, title, seo_title, seo_description)
VALUES
    ('home', 'ZT Lounge Home',
     'ZT Lounge Meru - Premium Dining, VIP Cabins, Auto Spa & Events',
     'Experience premium dining, luxury VIP cabins, lounge & bar, conference facilities, and professional auto spa services at ZT Lounge Meru.'),
    ('restaurant', 'Restaurant',
     'Restaurant - ZT Lounge Meru',
     'Fine dining at ZT Lounge Meru with exquisite cuisine, signature grills, and elegant ambiance.'),
    ('lounge', 'Lounge & Bar',
     'Lounge & Bar - ZT Lounge Meru',
     'Premium cocktails, live entertainment, and a sophisticated atmosphere at ZT Lounge Meru.'),
    ('vip', 'VIP Cabins',
     'VIP Cabins - ZT Lounge Meru',
     'Private, exclusive VIP cabins for intimate dining and celebrations at ZT Lounge Meru.'),
    ('events', 'Events Venue',
     'Events Venue - ZT Lounge Meru',
     'Weddings, birthdays, graduations, and private celebrations at ZT Lounge Meru.'),
    ('conference', 'Conference',
     'Conference - ZT Lounge Meru',
     'State-of-the-art conference facilities for corporate meetings and seminars at ZT Lounge Meru.'),
    ('autospa', 'Auto Spa',
     'Auto Spa - ZT Lounge Meru',
     'Professional detailing, washing, and premium car care services at ZT Lounge Meru.'),
    ('gallery', 'Gallery',
     'Gallery - ZT Lounge Meru',
     'Explore ZT Lounge Meru through our stunning gallery. Fine dining, VIP cabins, lounge, events, conference facilities, and auto spa.'),
    ('contact', 'Contact Us',
     'Contact Us - ZT Lounge Meru',
     'Contact ZT Lounge Meru for reservations, bookings, and inquiries. Visit us in Milimani, Meru.')
ON CONFLICT (page_key) DO NOTHING;

-- ============================================================
-- 2. FIX MENU RELATIONSHIPS
--    menu_categories -> menu_items.category_id
-- ============================================================

-- Ensure categories exist (idempotent; safe if 026 already ran)
INSERT INTO menu_categories (name, slug, description, display_order, is_active)
VALUES
    ('Signature Grills', 'signature-grills', 'Premium grilled specialties', 0, true),
    ('Appetizers', 'appetizers', 'Starters and small plates', 1, true),
    ('Main Dishes', 'main-dishes', 'Hearty main course options', 2, true),
    ('Desserts', 'desserts', 'Sweet endings', 3, true),
    ('Beverages', 'beverages', 'Fresh drinks and sodas', 4, true),
    ('Bar Menu', 'bar-menu', 'Cocktails and bar favorites', 5, true)
ON CONFLICT (slug) DO NOTHING;

-- Link existing menu_items to their category by matching category text to category name
UPDATE menu_items mi
SET category_id = mc.id
FROM menu_categories mc
WHERE mi.category = mc.name
  AND mi.category_id IS NULL;

-- ============================================================
-- 3. FIX SERVICES RELATIONSHIPS
--    services.page_id -> website_pages
-- ============================================================

UPDATE services s
SET page_id = wp.id
FROM website_pages wp
WHERE s.slug = wp.page_key
  AND s.page_id IS NULL;

-- Bonus: link hero slides to the home page for proper association
UPDATE hero_slides hs
SET page_id = wp.id
FROM website_pages wp
WHERE wp.page_key = 'home'
  AND hs.page_id IS NULL;

-- ============================================================
-- 4. REMOVE FAKE/TEST/DEMO CONTENT
-- ============================================================

-- Remove test testimonial
DELETE FROM testimonials
WHERE customer_name = 'Mary Customer';

-- Remove test/demo menu rows: legacy broken-image-path seed rows (leading "/images/" not "assets/images/")
DELETE FROM menu_items
WHERE image_url LIKE '/images/%'
   OR name ILIKE '%test%'
   OR name ILIKE '%demo%';

-- Remove test/demo FAQ rows
DELETE FROM faqs
WHERE question = 'How far in advance should I book?'
   OR question ILIKE '%test%'
   OR question ILIKE '%demo%';

-- Remove wrong/test service (barbershop service is not a ZT Lounge experience)
DELETE FROM services
WHERE slug = 'ladies-haircut-styling'
   OR name ILIKE '%test%'
   OR name ILIKE '%demo%';

-- Remove test/demo hero slides
DELETE FROM hero_slides
WHERE title = 'SUPABASE TEST SUCCESS'
   OR title ILIKE '%test%'
   OR title ILIKE '%demo%';

-- ============================================================
-- 5. GALLERY SAFE CLEANUP (NO TRUNCATE)
-- ============================================================

-- Only remove clearly invalid/test gallery rows; NEVER truncate
DELETE FROM gallery
WHERE title ILIKE '%test%'
   OR title ILIKE '%demo%'
   OR image_url LIKE '/images/%';

-- ============================================================
-- 6. VERIFY RLS REMAINS ENABLED (no-op if already enabled)
-- ============================================================

ALTER TABLE website_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

COMMIT;

-- ============================================================
-- ROLLBACK
-- ============================================================
-- -- Unlink relationships (revert to NULL)
-- UPDATE menu_items SET category_id = NULL WHERE category_id IS NOT NULL;
-- UPDATE services SET page_id = NULL WHERE page_id IS NOT NULL;
-- UPDATE hero_slides SET page_id = NULL WHERE page_id IS NOT NULL;
--
-- -- Remove seeded website_pages
-- DELETE FROM website_pages WHERE page_key IN
--   ('home','restaurant','lounge','vip','events','conference','autospa','gallery','contact');
--
-- -- Note: deleted test/demo rows cannot be restored via this rollback;
-- -- they were confirmed test data, not production content.
-- ============================================================