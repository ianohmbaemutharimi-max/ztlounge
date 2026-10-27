-- ============================================================
-- ZT Lounge CMS Seed Data Migration
-- Migration: 026_seed_cms_content
-- ============================================================
-- Seeds CMS tables with real content from the public website.
-- Uses INSERT ... ON CONFLICT DO NOTHING to be re-runnable.
-- Reversible: DELETE FROM <table> WHERE <condition>
-- ============================================================

BEGIN;

-- ============================================================
-- 1. HERO_SLIDES (2 slides from index.html)
-- ============================================================

-- Slide 1: Main Hero
INSERT INTO hero_slides (badge, title, highlight, subtitle, image_url, alt_text, cta_text, cta_link, buttons, display_order, is_active)
VALUES (
    'Meru''s Finest',
    'ZT Lounge Meru',
    'Premium Dining &bull; VIP Cabins &bull; Pool Table &bull; Lounge & Bar &bull; Events &bull; Conference &bull; Auto Spa',
    'Experience premium hospitality at ZT Lounge Meru',
    'assets/images/restaurant/hero-restaurant.webp',
    'ZT Lounge Meru - Premium Hospitality Logo',
    'Explore Services',
    'pages/contact/contact.html',
    '[{"text": "Explore Services", "link": "#services", "type": "btn btn-primary"}, {"text": "Contact Us", "link": "pages/contact/contact.html", "type": "btn btn-secondary"}]',
    0, true
)
ON CONFLICT DO NOTHING;

-- Slide 2: Night Experience
INSERT INTO hero_slides (badge, title, highlight, subtitle, image_url, alt_text, cta_text, cta_link, buttons, display_order, is_active)
VALUES (
    'Night Experience',
    'Unforgettable Evenings Await',
    'From sunset cocktails to late-night entertainment',
    'Experience Meru''s finest hospitality',
    'assets/images/lounge/hero-lounge.webp',
    'ZT Lounge Nightlife Experience',
    'Explore Services',
    'pages/contact/contact.html',
    '[{"text": "Explore Services", "link": "#services", "type": "btn btn-primary"}, {"text": "Contact Us", "link": "pages/contact/contact.html", "type": "btn btn-secondary"}]',
    1, true
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. MENU_CATEGORIES (categories matching site config)
-- ============================================================

INSERT INTO menu_categories (name, slug, description, display_order, is_active)
VALUES
    ('Signature Grills', 'signature-grills', 'Premium grilled specialties', 0, true),
    ('Appetizers', 'appetizers', 'Starters and small plates', 1, true),
    ('Main Dishes', 'main-dishes', 'Hearty main course options', 2, true),
    ('Desserts', 'desserts', 'Sweet endings', 3, true),
    ('Beverages', 'beverages', 'Fresh drinks and sodas', 4, true),
    ('Bar Menu', 'bar-menu', 'Cocktails and bar favorites', 5, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. MENU_ITEMS (replaces any existing seed/test items)
-- ============================================================

-- Clear existing test items first (only items from the old test seed)
DELETE FROM menu_items WHERE name IN ('Nyama Choma Platter', 'SUPABASE TEST SUCCESS');

INSERT INTO menu_items (name, description, price, image_url, alt_text, category, type, is_active, is_featured, display_order)
VALUES
    -- Signature Grills
    ('Signature Nyama Choma', 'Slow-grilled premium beef with signature spices', 1800.00, 'assets/images/menu/nyama-choma.webp', 'Signature Nyama Choma slow-grilled to perfection', 'Signature Grills', 'item', true, true, 0),
    ('ZT Signature Pilau', 'Aromatic basmati rice cooked with special spices and herbs', 650.00, 'assets/images/menu/signature-pilau.webp', 'ZT Signature Pilau aromatic basmati rice', 'Signature Grills', 'item', true, true, 1),
    ('Premium Beef Steak', 'Prime cuts grilled to your preference. Tender & juicy.', 1650.00, 'assets/images/menu/beef-steak.webp', 'Premium Beef Steak prime cuts grilled to preference', 'Signature Grills', 'item', true, false, 2),
    ('Mixed Grill Platter', 'Assorted grilled meats with traditional accompaniments', 1650.00, 'assets/images/menu/mixed-grill.webp', 'Mixed grill platter with assorted meats', 'Signature Grills', 'item', true, false, 3),

    -- Appetizers
    ('Loaded Fries', 'Loaded with cheese and signature toppings', 850.00, 'assets/images/menu/loaded-fries.webp', 'Loaded fries with cheese and toppings', 'Appetizers', 'item', true, false, 0),
    ('Chicken Tikka', 'Marinated chicken pieces with aromatic spices', 650.00, 'assets/images/menu/chicken-tikka.webp', 'Chicken tikka with aromatic spices', 'Appetizers', 'item', true, false, 1),

    -- Main Dishes
    ('Grilled Chicken', 'Grilled chicken with herb potatoes and seasonal vegetables', 1200.00, 'assets/images/menu/grilled-chicken.webp', 'Grilled chicken with herb potatoes', 'Main Dishes', 'item', true, false, 0),
    ('Premium Sides', 'Selection of premium side dishes', 450.00, 'assets/images/menu/premium-sides.webp', 'Premium side dishes selection', 'Main Dishes', 'item', true, false, 1),
    ('Goat Ribs', 'Tender grilled goat ribs with signature marinade', 1500.00, 'assets/images/menu/goat-ribs.webp', 'Tender grilled goat ribs', 'Main Dishes', 'item', true, false, 2),

    -- Desserts
    ('Fresh Juice', 'Fresh tropical fruit juices', 450.00, 'assets/images/menu/fresh-juice.webp', 'Fresh tropical fruit juice', 'Desserts', 'item', true, false, 0),

    -- Beverages
    ('Coffee', 'Premium brewed coffee', 250.00, 'assets/images/menu/coffee.webp', 'Premium brewed coffee', 'Beverages', 'item', true, false, 0),
    ('Signature Cocktail', 'House signature cocktail', 750.00, 'assets/images/menu/signature-cocktail.webp', 'House signature cocktail', 'Bar Menu', 'item', true, false, 0),
    ('Cocktail Selection', 'Premium cocktail selection', 850.00, 'assets/images/menu/cocktail.webp', 'Premium cocktail selection', 'Bar Menu', 'item', true, false, 1)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. SERVICES (6 service cards from index.html / contact.html)
-- ============================================================

-- Clear any non-matching test data
DELETE FROM services WHERE name = 'Ladies Haircut & Styling';

INSERT INTO services (name, slug, description, image_url, alt_text, tag, href, display_order, is_active, type, featured)
VALUES
    ('Restaurant', 'restaurant', 'Fine dining with exquisite cuisine and elegant ambiance', 'assets/images/restaurant/interior.webp', 'Fine dining restaurant at ZT Lounge with elegant table setting and ambient lighting', 'Signature', 'pages/experiences/restaurant.html', 0, true, 'experience', true),
    ('Lounge & Bar', 'lounge-bar', 'Premium cocktails, live entertainment, and sophisticated atmosphere', 'assets/images/lounge/lounge-interior-main.webp', 'Luxury lounge and bar at ZT Lounge with premium seating and sophisticated atmosphere', 'Nightlife', 'pages/experiences/lounge.html', 1, true, 'experience', true),
    ('VIP Cabins', 'vip-cabins', 'Private, exclusive cabins for intimate dining and celebrations', 'assets/images/vip/vip-fireplace-lounge.webp', 'Luxury VIP cabin at ZT Lounge with private dining and exclusive amenities', 'Private', 'pages/experiences/vip.html', 2, true, 'experience', true),
    ('Events', 'events', 'Weddings, birthdays, graduations, and private celebrations', 'assets/images/events/wedding.webp', 'Elegant event setup at ZT Lounge with floral arrangements and celebratory decor', 'Celebrations', 'pages/business/events.html', 3, true, 'experience', false),
    ('Conference', 'conference', 'State-of-the-art facilities for corporate meetings and seminars', 'assets/images/conference/conference-hall.webp', 'Modern conference hall at ZT Lounge with state-of-the-art audiovisual equipment', 'Corporate', 'pages/business/conference.html', 4, true, 'experience', false),
    ('Auto Spa', 'auto-spa', 'Professional detailing, washing, and premium car care services', 'assets/images/autospa/car-detailing.webp', 'Professional auto detailing at ZT Lounge with premium car care services', 'Premium', 'pages/business/autospa.html', 5, true, 'experience', false)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 5. GALLERY (14 items from gallery.html)
-- ============================================================

-- Clear existing gallery (empty table, safe to truncate)
TRUNCATE TABLE gallery RESTART IDENTITY;

INSERT INTO gallery (title, description, image_url, alt_text, category, display_order, is_active, type)
VALUES
    ('Elegant Dining', 'ZT Lounge elegant dining area with premium table settings', 'assets/images/gallery/gallery-01.webp', 'ZT Lounge elegant dining area with premium table settings', 'dining', 0, true, 'general'),
    ('VIP Cabin', 'Luxurious VIP cabin with modern amenities', 'assets/images/gallery/gallery-02.webp', 'Luxurious VIP cabin with modern amenities', 'vip', 1, true, 'general'),
    ('Conference Hall', 'Modern conference hall with AV equipment', 'assets/images/gallery/gallery-03.webp', 'Modern conference hall with AV equipment', 'conference', 2, true, 'general'),
    ('Premium Lounge', 'Premium lounge area with stylish seating', 'assets/images/gallery/gallery-04.webp', 'Premium lounge area with stylish seating', 'lounge', 3, true, 'general'),
    ('Event Setup', 'Elegant event setup with floral decorations', 'assets/images/gallery/gallery-05.webp', 'Elegant event setup with floral decorations', 'events', 4, true, 'general'),
    ('Nightlife', 'Vibrant nightlife experience at the lounge bar', 'assets/images/gallery/gallery-06.webp', 'Vibrant nightlife experience at the lounge bar', 'lounge', 5, true, 'general'),
    ('Auto Spa', 'Professional car detailing at the auto spa', 'assets/images/gallery/gallery-07.webp', 'Professional car detailing at the auto spa', 'autospa', 6, true, 'general'),
    ('Restaurant Interior', 'Restaurant interior showcasing premium dining atmosphere', 'assets/images/gallery/gallery-08.webp', 'Restaurant interior showcasing premium dining atmosphere', 'dining', 7, true, 'general'),
    ('VIP Suite', 'VIP cabin with premium amenities and luxury furnishings', 'assets/images/gallery/gallery-09.webp', 'VIP cabin with premium amenities and luxury furnishings', 'vip', 8, true, 'general'),
    ('Conference Tech', 'Conference room setup with modern presentation technology', 'assets/images/gallery/gallery-10.webp', 'Conference room setup with modern presentation technology', 'conference', 9, true, 'general'),
    ('Outdoor Patio', 'Outdoor patio and lounge seating area', 'assets/images/gallery/gallery-11.webp', 'Outdoor patio and lounge seating area', 'lounge', 10, true, 'general'),
    ('Private Dining', 'Private event dining setup with elegant table decor', 'assets/images/gallery/gallery-12.webp', 'Private event dining setup with elegant table decor', 'dining', 11, true, 'general'),
    ('Car Detailing', 'Auto spa premium detailing service in progress', 'assets/images/gallery/gallery-13.webp', 'Auto spa premium detailing service in progress', 'autospa', 12, true, 'general'),
    ('Exterior', 'ZT Lounge exterior showing the luxury facade and entrance', 'assets/images/gallery/gallery-14.webp', 'ZT Lounge exterior showing the luxury facade and entrance', 'general', 13, true, 'general');

-- ============================================================
-- 6. FAQS (5 items from contact.html)
-- ============================================================

-- Clear any seed/test FAQ data
DELETE FROM faqs WHERE question IN ('How far in advance should I book?');

INSERT INTO faqs (question, answer, category, display_order, is_active, is_featured)
VALUES
    ('Do I need a reservation?', 'While walk-ins are welcome, we recommend reserving in advance, especially for weekends and events.', 'general', 0, true, false),
    ('Can I book through WhatsApp?', 'Yes! WhatsApp is our preferred booking method for fast and easy reservations.', 'general', 1, true, false),
    ('Do you host private events?', 'Absolutely. We specialize in weddings, birthdays, corporate events, and private celebrations.', 'general', 2, true, false),
    ('Is parking available?', 'Yes, we offer secure on-site parking for all our guests.', 'general', 3, true, false),
    ('What are your operating hours?', 'We are open daily from 10:00 AM to 2:00 AM.', 'general', 4, true, false)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. TESTIMONIALS (1 item found in testimonials config)
-- ============================================================

-- Keep existing testimonial data, add realistic data from site if available
INSERT INTO testimonials (customer_name, occupation, rating, comment, is_featured, approved, display_order)
VALUES
    ('Mary Customer', 'Restaurant Guest', 5, 'Excellent service! The staff was professional and friendly.', true, true, 0)
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================
-- ROLLBACK (if needed)
-- ============================================================
-- DELETE FROM hero_slides WHERE title IN ('ZT Lounge Meru', 'Unforgettable Evenings Await');
-- DELETE FROM menu_categories WHERE slug IN ('signature-grills', 'appetizers', 'main-dishes', 'desserts', 'beverages', 'bar-menu');
-- DELETE FROM menu_items WHERE name IN ('Signature Nyama Choma', 'ZT Signature Pilau', 'Premium Beef Steak', 'Mixed Grill Platter', 'Loaded Fries', 'Chicken Tikka', 'Grilled Chicken', 'Premium Sides', 'Goat Ribs', 'Fresh Juice', 'Coffee', 'Signature Cocktail', 'Cocktail Selection');
-- DELETE FROM services WHERE slug IN ('restaurant', 'lounge-bar', 'vip-cabins', 'events', 'conference', 'auto-spa');
-- TRUNCATE TABLE gallery;
-- DELETE FROM faqs WHERE question IN ('Do I need a reservation?', 'Can I book through WhatsApp?', 'Do you host private events?', 'Is parking available?', 'What are your operating hours?');
-- DELETE FROM testimonials WHERE customer_name = 'Mary Customer';