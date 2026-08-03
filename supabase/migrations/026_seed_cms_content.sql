-- ============================================================
-- ZT Lounge CMS Seed Data Migration
-- Migration: 026_seed_cms_content
-- ============================================================
-- This migration seeds the CMS tables with real content from the website
-- ============================================================

-- ============================================================
-- 1. HERO_SLIDES (2 slides from homepage)
-- ============================================================

-- Slide 1: Main Hero
INSERT INTO hero_slides (page_id, badge, title, highlight, subtitle, image_url, alt_text, cta_text, cta_link, buttons, display_order, is_active, created_at, updated_at) VALUES
('home', 'Meru''s Finest', 'ZT Lounge Meru', 'Premium Dining &bull; VIP Cabins &bull; Pool Table &bull; Lounge & Bar &bull; Events &bull; Conference &bull; Auto Spa', 'Experience premium hospitality at ZT Lounge Meru', 'assets/images/restaurant/hero-restaurant.webp', 'ZT Lounge Meru - Premium Hospitality Logo', 'Explore Services', 'https://ztlounge.co.ke/', '[
    {"text": "Explore Services", "class": "btn btn-primary btn-large"},
    {"text": "Contact Us", "class": "btn btn-secondary btn-large"}
], 0, true, NOW(), NOW()),

('home', 'Night Experience', 'Unforgettable <span>Evenings</span> Await', 'From sunset cocktails to late-night entertainment, experience Meru''s finest hospitality', 'ZT Lounge Meru - Premium Hospitality Logo', 'assets/images/lounge/hero-lounge.webp', 'ZT Lounge Meru - Premium Hospitality Logo', 'Explore Services', 'Contact Us', 1, true, NOW(), NOW());

-- ============================================================
-- 2. MENU_ITEMS (10 items from restaurant.html and business-config.js)
-- ============================================================

-- Signature items (KES 1,800 - 1,650)
INSERT INTO menu_items (name, description, price, image_url, alt_text, category, category_id, type, is_active, is_featured, display_order, page_id, created_at, updated_at) VALUES
('Signature Nyama Choma', 'Slow-grilled premium beef with signature spices', 1800.00, 'assets/images/menu/beef-mishkaki.webp', 'Signature Nyama Chama slow-grilled to perfection', 'restaurant', NULL, 'item', true, false, 0, NULL, NOW(), NOW()),
('Signature Chicken Tikka', 'Marinated chicken with spicy marinade', 1650.00, 'assets/images/menu/chicken-tikka.webp', 'Marinated chicken with spicy marinade', 'restaurant', NULL, 'item', true, false, 1, NULL, NOW(), NOW()),
('Signature Pilau', 'Aromatic pilau rice with signature spices', 650.00, 'assets/images/menu/signature-pilau.webp', 'ZT Signature Pilau with aromatic spices', 'restaurant', NULL, 'item', true, false, 2, NULL, NOW(), NOW()),
('Signature Sides', 'Premium side dishes', 1650.00, 'assets/images/menu/premium-sides.webp', 'Premium side dishes', 'restaurant', NULL, 'item', true, false, 3, NULL, NOW(), NOW()),
('Grilled Chicken', 'Grilled chicken with herb potatoes', 1200.00, 'assets/images/menu/grilled-chicken.webp', 'Grilled chicken with herb potatoes', 'restaurant', NULL, 'item', true, false, 4, NULL, NOW(), NOW()),
('Loaded Fries', 'Loaded with cheese and bacon', 850.00, 'assets/images/menu/loaded-fries.webp', 'Loaded with cheese and bacon', 'restaurant', NULL, 'item', true, false, 5, NULL, NOW(), NOW()),
('Mixed Grill', 'Assorted grilled meats and vegetables', 1500.00, 'assets/images/menu/mixed-grill.webp', 'Assorted grilled meats and vegetables', 'restaurant', NULL, 'item', true, false, 6, NULL, NOW(), NOW()),
('Nyama Choma', 'Traditional Maasai-style grilled meat', 1500.00, 'assets/images/menu/nyama-chama.webp', 'Traditional Maasai-style grilled meat', 'restaurant', NULL, 'item', true, false, 7, NULL, NOW(), NOW()),
('Premium Sides', 'Loaded fries and premium sides', 1650.00, 'assets/images/menu/premium-sides.webp', 'Premium side dishes', 'restaurant', NULL, 'item', true, false, 7, NULL, NOW(), NOW()),
('Signature Cocktail', 'Signature cocktail with premium ingredients', 1800.00, 'assets/images/menu/signature-cocktail.webp', 'Signature cocktail with premium ingredients', 'restaurant', NULL, 'item', true, false, 8, NULL, NOW(), NOW()),
('Signature Pilau', 'Aromatic basmati rice with special spices', 650.00, 'assets/images/menu/signature-pilau.webp', 'Aromatic basmati rice with special spices', 'restaurant', NULL, 'item', true, false, 8, NULL, NOW(), NOW()),

-- Restaurant Menu Items
'Restaurant', 'Fine dining with exquisite cuisine and elegant ambiance', 1800.00, 'assets/images/restaurant/beef-steak.webp', 'Fine dining restaurant at ZT Lounge with elegant table setting and ambient lighting', 'restaurant', 'restaurant', true, false, 0, 'restaurant', NOW(), NOW()),
'Restaurant Menu', 'Restaurant menu with full menu items', 0.00, 'assets/images/restaurant/menu.webp', 'Restaurant menu with full menu items', 'restaurant', 'menu', true, false, 0, 'restaurant', NOW(), NOW(),

-- Lounge & Bar
'Lounge & Bar', 'Premium cocktails, live entertainment, and sophisticated atmosphere', 0.00, 'assets/images/lounge/lounge-interior-main.webp', 'Luxury lounge and bar with premium seating and sophisticated atmosphere', 'lounge', 'lounge', true, false, 0, 'lounge', NOW(), NOW(),

-- VIP Cabins
'VIP Cabin - Private Dining', 'Private dining experience with exclusive amenities', 0.00, 'assets/images/vip/vip-private-dining.webp', 'Luxury VIP cabin for private dining', 'vip', 'item', true, false, 0, 'vip', NOW(), NOW(),

-- Events
'Event Venue', 'Premium event space for weddings, birthdays, and corporate events', 0.00, 'assets/images/events/hero-events.webp', 'Elegant event setup with floral arrangements and celebratory decor', 'events', 'events', true, false, 0, 'events', NOW(), NOW(),

-- Conference
'Conference Hall', 'State-of-the-art conference facilities for meetings and seminars', 0.00, 'assets/images/conference/conference-hall.webp', 'Modern conference hall with professional meeting facilities', 'conference', 'conference', true, false, 0, 'conference', NOW(), NOW(),

-- Auto Spa
'Auto Spa', 'Premium car detailing and spa services', 0.00, 'assets/images/autospa/car-wash.webp', 'Premium car detailing and spa services', 'autospa', 'autospa', true, false, 0, 'autospa', NOW(), NOW(),

-- ============================================================
-- 3. GALLERY (14 items from gallery.html)
-- ============================================================

INSERT INTO gallery (page_id, title, description, image_url, alt_text, category, type, view_count, is_active, display_order, created_at, updated_at) VALUES
('contact', 'Gallery Preview', 'Photo gallery of ZT Lounge facilities', 'assets/images/gallery/gallery-01.webp', 'Luxury dining experience at ZT Lounge Meru featuring gourmet cuisine and elegant table setting', 'general', 'general', 0, true, 0, NOW(), NOW()),
('contact', 'Gallery Preview', 'Photo gallery of ZT Lounge spaces', 'assets/images/gallery/gallery-02.webp', 'Luxury VIP cabin at ZT Lounge Meru with private dining area and premium furnishings', 'general', 'general', 0, true, 1, NOW(), NOW()),
('contact', 'Gallery Preview', 'Photo gallery of ZT Lounge spaces', 'assets/images/gallery/gallery-03.webp', 'Modern conference hall at ZT Lounge Meru with professional meeting facilities', 'general', 'general', 0, true, 2, NOW(), NOW()),
('contact', 'Gallery Preview', 'Photo gallery of ZT Lounge spaces', 'assets/images/gallery/gallery-04.webp', 'Premium lounge area at ZT Lounge Meru with comfortable seating and ambient lighting', 'general', 'general', 0, true, 3, NOW(), NOW()),
('contact', 'Gallery Preview', 'Photo gallery of ZT Lounge spaces', 'assets/images/gallery/gallery-05.webp', 'Elegant dining experience with gourmet cuisine', 'general', 'general', 0, true, 4, NOW(), NOW()),
('contact', 'Gallery Preview', 'Photo gallery of ZT Lounge spaces', 'assets/images/gallery/gallery-05.webp', 'Celebration at ZT Lounge with elegant decorations', 'general', 'general', 0, true, 5, NOW(), NOW()),
('contact', 'Gallery Preview', 'Photo gallery of ZT Lounge spaces', 'assets/images/gallery/gallery-06.webp', 'Exclusive lounge area with comfortable seating', 'general', 'general', 0, true, 6, NOW(), NOW()),
('contact', 'Gallery Preview', 'Photo gallery of ZT Lounge spaces', 'assets/images/gallery/gallery-06.webp', 'VIP cabin interior with premium furnishings', 'general', 'general', 0, true, 7, NOW(), NOW()),
('contact', 'Gallery Preview', 'Photo gallery of ZT Lounge spaces', 'assets/images/gallery/gallery-07.webp', 'Pool table area with lounge atmosphere', 'general', 'general', 0, true, 8, NOW(), NOW()),
('contact', 'Gallery Preview', 'Photo gallery of ZT Lounge spaces', 'assets/images/gallery/gallery-07.webp', 'Pool table and lounge area', 'general', 'general', 0, true, 9, NOW(), NOW()),
('contact', 'Gallery Preview', 'Photo gallery of ZT Lounge spaces', 'assets/images/gallery/gallery-08.webp', 'Cocktails and drinks at the lounge bar', 'general', 'general', 0, true, 10, NOW(), NOW()),
('contact', 'Gallery Preview', 'Photo gallery of ZT Lounge spaces', 'assets/images/gallery/gallery-08.webp', 'Private dining area with elegant table setting', 'general', 'general', 0, true, 11, NOW(), NOW()),
('contact', 'Gallery Preview', 'Photo gallery of ZT Lounge spaces', 'assets/images/gallery/gallery-10.webp', 'Signature restaurant dish with premium presentation', 'general', 'general', 0, true, 12, NOW(), NOW()),
('contact', 'Gallery Preview', 'Photo gallery of ZT Lounge spaces', 'assets/images/gallery/gallery-10.webp', 'Signature cocktail with premium presentation', 'general', 'general', 0, true, 13, NOW(), NOW()),
('contact', 'Gallery Preview', 'Photo gallery of ZT Lounge spaces', 'assets/images/gallery/gallery-10.webp', 'Exclusive lounge seating area', 'general', 'general', 0, true, 14, NOW(), NOW()),
('contact', 'Gallery Preview', 'Photo gallery of ZT Lounge spaces', 'assets/images/gallery/gallery-11.webp', 'Exclusive lounge seating area', 'general', 'general', 0, true, 15, NOW(), NOW()),
('contact', 'Gallery Preview', 'Photo gallery of ZT Lounge spaces', 'assets/images/gallery/gallery-11.webp', 'VIP cabin interior with fireplace', 'general', 'general', 0, true, 16, NOW(), NOW()),
('contact', 'Gallery Preview', 'Photo gallery of ZT Lounge spaces', 'assets/images/gallery/gallery-12.webp', 'VIP cabin interior with fireplace', 'general', 'general', 0, true, 16, NOW(), NOW()),
('contact', 'Gallery Preview', 'Photo gallery of ZT Lounge spaces', 'assets/images/gallery/gallery-13.webp', 'Private dining area with exclusive amenities', 'general', 'general', 0, true, 17, NOW(), NOW()),
('contact', 'Gallery Preview', 'Photo gallery of ZT Lounge spaces', 'assets/images/gallery/gallery-13.webp', 'Private dining area with elegant table setting', 'general', 'general', 0, true, 17, NOW(), NOW()),
('contact', 'Gallery Preview', 'Photo gallery of ZT Lounge spaces', 'assets/images/gallery/gallery-14.webp', 'ZT Lounge exterior showing luxury facade', 'general', 'general', 0, true, 18, NOW(), NOW())
],

-- ============================================================
-- 4. FAQs (5 items from contact.html)
-- ============================================================

INSERT INTO faqs (page_id, question, answer, category, is_featured, view_count) VALUES
('contact', 'Do I need a reservation?', 'While walk-ins are welcome, we recommend reserving in advance, especially for weekends and events.', 'general', false, 0, 'contact', NOW(), NOW()),
('contact', 'Can I book through WhatsApp?', 'Yes! WhatsApp is our preferred booking method for fast and easy reservations.', 'general', false, 0, 'contact', NOW(), NOW()),
('contact', 'Do you host private events?', 'Absolutely. We specialize in weddings, birthdays, corporate events, and private celebrations.', 'general', false, 0, 'contact', NOW(), NOW()),
('contact', 'Is parking available?', 'Yes, we offer secure on-site parking for all our guests.', 'general', false, 0, 'contact', NOW(), NOW()),
('contact', 'What are your operating hours?', 'We are open daily from 10:00 AM to 2:00 AM.', 'general', false, 0, 'contact', NOW(), NOW()),
('contact', 'Can I make a reservation for a large group?', 'Yes, we accommodate groups of 10 or more with special arrangements.', 'general', false, 0, 'contact', NOW(), NOW()),

-- ============================================================
-- 5. TESTIMONIALS (1 item from testimonials.config.js)
-- ============================================================

INSERT INTO testimonials (page_id, customer_name, image_url, occupation, rating, comment, is_featured, is_approved, display_order, created_at) VALUES
('contact', 'Mary Customer', 'assets/images/gallery/gallery-02.webp', 'Celebrity Chef', 5, 'Excellent service! The staff was professional and friendly.', true, true, 0, NOW(), NOW()),

-- ============================================================
-- 6. SEED DATA FOR WEBSITE_PAGES (for reference only)
-- ============================================================

-- This data is already in website_pages table (home, restaurant, lounge, etc.)
-- No changes needed here