-- ============================================================
-- Migration: Populate hero_slides with canonical content
-- Purpose: Migrate all static hero content to database
-- Created: 2026-10-23
-- ============================================================

-- Clear existing hero slides (if any exist for these pages)
DELETE FROM hero_slides WHERE page_id IN ('home', 'restaurant', 'lounge', 'vip', 'restaurant-menu', 'events', 'conference', 'grooming-care', 'contact', 'gallery');

-- ============================================================
-- HOMEPAGE (2 slides)
-- ============================================================

INSERT INTO hero_slides (page_id, badge, title, highlight, subtitle, display_order, is_active, media_id, buttons) VALUES
('home', 'Meru''s Finest', 'ZT Lounge', 'Meru', 'Premium Dining • VIP Cabins • Pool Table • Lounge & Bar • Events • Conference • Grooming & Care', 1, true, '1add06f7-bbb5-423a-9e9f-dec1f35f2138', '[{"text":"Explore Services","href":"#services","style":"primary"},{"text":"Contact Us","href":"pages/contact/contact.html","style":"secondary"}]'::jsonb),

('home', 'Night Experience', 'Unforgettable', 'Evenings', 'From sunset cocktails to late-night entertainment, experience Meru''s finest hospitality.', 2, true, '203d3e83-b242-4e0e-a771-b887f0c00879', '[{"text":"Explore Services","href":"#services","style":"primary"},{"text":"Contact Us","href":"pages/contact/contact.html","style":"secondary"}]'::jsonb);

-- ============================================================
-- RESTAURANT (3 slides)
-- ============================================================

INSERT INTO hero_slides (page_id, badge, title, highlight, subtitle, display_order, is_active, media_id, buttons) VALUES
('restaurant', '★ Meru''s Premier Dining Destination', 'Exceptional', 'Dining', 'Gourmet Cuisine • Elegant Ambiance • Signature Grills • Premium Service', 1, true, '2d837e6f-f53e-4b03-bc88-97585937e9a1', '[{"text":"Book a Table","href":"#reservation","style":"primary"},{"text":"View Menu","href":"restaurant-menu.html","style":"secondary"}]'::jsonb),

('restaurant', '★ Signature Dishes', 'Gourmet', 'Creations', 'Crafted with passion using the finest ingredients', 2, true, 'a72ca00e-42b4-4a81-bcc3-f4b9dff843f5', '[{"text":"Book a Table","href":"#reservation","style":"primary"},{"text":"View Menu","href":"restaurant-menu.html","style":"secondary"}]'::jsonb),

('restaurant', '★ Premium Dining', 'Elegant', 'Ambiance', 'Sophisticated setting for unforgettable dining experiences', 3, true, '7d8f754c-12b8-4754-8fdd-6d962f75723d', '[{"text":"Book a Table","href":"#reservation","style":"primary"},{"text":"View Menu","href":"restaurant-menu.html","style":"secondary"}]'::jsonb);

-- ============================================================
-- LOUNGE (3 slides)
-- ============================================================

INSERT INTO hero_slides (page_id, badge, title, highlight, subtitle, display_order, is_active, media_id, buttons) VALUES
('lounge', 'Meru''s Premier Lounge', 'Luxury', 'Lounge & Bar', 'Signature Cocktails • Live Entertainment • VIP Experiences • Premium Spirits', 1, true, '0f4a6593-c9e7-4670-87f8-ec8a674cfbdd', '[{"text":"Reserve Table","href":"#booking","style":"primary"},{"text":"Explore","href":"#services","style":"secondary"}]'::jsonb),

('lounge', 'Sophisticated Ambiance', 'Elegance', 'Reimagined', 'Plush seating, warm golden lighting, and an atmosphere of refined luxury.', 2, true, '6ed7e810-92e2-4988-b192-82531ce03cb2', '[{"text":"Reserve Table","href":"#booking","style":"primary"},{"text":"Explore","href":"#services","style":"secondary"}]'::jsonb),

('lounge', 'Nightlife', 'Unforgettable', 'Evenings', 'Curated beats, vibrant energy, and Meru''s most sophisticated nightlife destination.', 3, true, '65dd49ad-e0a0-4c80-bf6b-c0c5ef3c67b7', '[{"text":"Reserve Table","href":"#booking","style":"primary"},{"text":"Explore","href":"#services","style":"secondary"}]'::jsonb);

-- ============================================================
-- VIP CABINS (3 slides)
-- ============================================================

INSERT INTO hero_slides (page_id, badge, title, highlight, subtitle, display_order, is_active, media_id, buttons) VALUES
('vip', 'VIP Experience', 'Exclusive', 'VIP Cabins', 'Private Dining • Personal Butler • Luxury Ambiance • Confidential Meetings', 1, true, '90c5dc9f-66d4-48e7-8e11-f35cc50b3251', '[{"text":"Book a Cabin","href":"#booking","style":"primary"},{"text":"Explore","href":"#services","style":"secondary"}]'::jsonb),

('vip', 'Luxury Interior', 'Your Private', 'Sanctuary', 'Elegant furnishings, premium amenities, and unmatched privacy', 2, true, 'c7b49ae4-d612-4402-8d88-e0236cf54219', '[{"text":"Book a Cabin","href":"#booking","style":"primary"},{"text":"Explore","href":"#services","style":"secondary"}]'::jsonb),

('vip', 'Premium Dining', 'In-Cabin', 'Dining', 'Gourmet meals served privately with personalized service', 3, true, 'c0c3d6b7-5387-412d-83df-4efbe2b9b261', '[{"text":"Book a Cabin","href":"#booking","style":"primary"},{"text":"Explore","href":"#services","style":"secondary"}]'::jsonb);

-- ============================================================
-- RESTAURANT MENU (3 slides)
-- ============================================================

INSERT INTO hero_slides (page_id, badge, title, highlight, subtitle, display_order, is_active, media_id, buttons) VALUES
('restaurant-menu', 'Meru''s Finest Dining', 'Culinary', 'Excellence', 'Signature grills, gourmet creations, and an ambiance of refined luxury', 1, true, 'c611e8d6-dea2-4a74-86b2-dbb8b9ff5063', '[{"text":"Explore the Menu","href":"#menu","style":"primary"},{"text":"Reserve a Table","href":"restaurant.html#reservation","style":"secondary"}]'::jsonb),

('restaurant-menu', 'Chef''s Signature', 'Artisanal', 'Creations', 'Each dish crafted with precision, passion, and the finest ingredients', 2, true, '8b6b9ce0-29c4-49f9-abb2-fd81c1c3e67b', '[{"text":"View the Menu","href":"#menu","style":"primary"},{"text":"Reserve Now","href":"restaurant.html#reservation","style":"secondary"}]'::jsonb),

('restaurant-menu', 'Private Dining', 'Exclusive', 'Experiences', 'Intimate gatherings and celebrations in our sophisticated VIP cabins', 3, true, '6f042848-174b-4ca1-ac8d-85047c3efef4', '[{"text":"Discover the Menu","href":"#menu","style":"primary"},{"text":"Explore VIP Dining","href":"vip.html","style":"secondary"}]'::jsonb);

-- ============================================================
-- EVENTS (3 slides)
-- ============================================================

INSERT INTO hero_slides (page_id, badge, title, highlight, subtitle, display_order, is_active, media_id, buttons) VALUES
('events', 'Celebrations', 'Create', 'Unforgettable Memories', 'Weddings • Birthdays • Graduations • Anniversaries • Corporate Events', 1, true, '86aa21fe-9da0-42dd-b9c8-80c66b6136ce', '[{"text":"Plan Your Event","href":"#booking","style":"primary"},{"text":"Explore Services","href":"#services","style":"secondary"}]'::jsonb),

('events', 'Weddings', 'Elegant', 'Weddings in Style', 'Stunning decor, gourmet catering, and dedicated wedding coordination for your perfect day.', 2, true, '1f0d04c1-b58e-44cb-8dd1-8f65c7e8f911', '[{"text":"Plan Your Event","href":"#booking","style":"primary"},{"text":"Explore Services","href":"#services","style":"secondary"}]'::jsonb),

('events', 'Birthdays', 'Celebrate', 'Life''s Milestones', 'Custom birthday parties with catering, decorations, and entertainment for all ages.', 3, true, '65d2dfdc-cdc8-4bd1-8e17-78a201e2d1e5', '[{"text":"Plan Your Event","href":"#booking","style":"primary"},{"text":"Explore Services","href":"#services","style":"secondary"}]'::jsonb);

-- ============================================================
-- CONFERENCE (3 slides)
-- ============================================================

INSERT INTO hero_slides (page_id, badge, title, highlight, subtitle, display_order, is_active, media_id, buttons) VALUES
('conference', 'Corporate Events', 'Premium', 'Conference Hall', 'State-of-the-art facilities • Corporate Meetings • Training • Seminars • Workshops', 1, true, '2f270769-d381-4189-93cc-b8285d3ac78a', '[{"text":"Book Now","href":"#booking","style":"primary"},{"text":"Explore Services","href":"#services","style":"secondary"}]'::jsonb),

('conference', 'Professional Environment', 'Corporate', 'Meetings Redefined', 'Professional business meetings with premium AV equipment, high-speed WiFi, and dedicated support.', 2, true, '55f4fb0d-1625-4f90-98c1-09b66efe7af1', '[{"text":"Book Now","href":"#booking","style":"primary"},{"text":"Explore Services","href":"#services","style":"secondary"}]'::jsonb),

('conference', 'Flexible Spaces', 'Versatile', 'Event Spaces', 'From boardroom meetings to large conferences, our spaces adapt to your needs.', 3, true, '9152ff95-b559-44ae-9b87-248c70b4aca1', '[{"text":"Book Now","href":"#booking","style":"primary"},{"text":"Explore Services","href":"#services","style":"secondary"}]'::jsonb);

-- ============================================================
-- GROOMING & CARE (1 slide)
-- ============================================================

INSERT INTO hero_slides (page_id, badge, title, highlight, subtitle, display_order, is_active, media_id, buttons) VALUES
('grooming-care', 'Premium Grooming & Care', 'Grooming', '& Care', 'Auto Spa • Barbershop • Carpet Cleaning • Premium Service', 1, true, '774bf8d2-1404-4735-b656-786fdd1d9898', '[{"text":"Our Services","href":"#services","style":"primary"},{"text":"Book Now","href":"#booking-cta","style":"secondary"}]'::jsonb);

-- ============================================================
-- CONTACT (3 slides)
-- ============================================================

INSERT INTO hero_slides (page_id, badge, title, highlight, subtitle, display_order, is_active, media_id, buttons) VALUES
('contact', 'Get in Touch', 'Let''s Create Your', 'Perfect Experience', 'Reservations • Inquiries • Events • VIP • Grooming & Care', 1, true, '1add06f7-bbb5-423a-9e9f-dec1f35f2138', '[{"text":"Book Now","href":"#booking","style":"primary"},{"text":"Explore Services","href":"#services","style":"secondary"}]'::jsonb),

('contact', 'Premium Hospitality', 'Welcome to', 'ZT Lounge', 'Experience Meru''s finest hospitality and service', 2, true, '203d3e83-b242-4e0e-a771-b887f0c00879', '[{"text":"Book Now","href":"#booking","style":"primary"},{"text":"Explore Services","href":"#services","style":"secondary"}]'::jsonb),

('contact', 'Events & Conferences', 'Your', 'Event Destination', 'Corporate meetings, weddings, celebrations and more', 3, true, '2f270769-d381-4189-93cc-b8285d3ac78a', '[{"text":"Book Now","href":"#booking","style":"primary"},{"text":"Explore Services","href":"#services","style":"secondary"}]'::jsonb);

-- ============================================================
-- GALLERY (3 slides)
-- ============================================================

INSERT INTO hero_slides (page_id, badge, title, highlight, subtitle, display_order, is_active, media_id, buttons) VALUES
('gallery', 'Visual Journey', 'Our', 'Spaces', 'Fine Dining • VIP Cabins • Lounge • Events • Conference • Grooming & Care', 1, true, '1add06f7-bbb5-423a-9e9f-dec1f35f2138', '[{"text":"Explore Gallery","href":"#gallery","style":"primary"},{"text":"Book Experience","href":"contact.html","style":"secondary"}]'::jsonb),

('gallery', 'Nightlife', 'Vibrant', 'Evenings', 'Experience the energy and elegance of ZT Lounge after dark', 2, true, '203d3e83-b242-4e0e-a771-b887f0c00879', '[{"text":"Explore Gallery","href":"#gallery","style":"primary"},{"text":"Book Experience","href":"contact.html","style":"secondary"}]'::jsonb),

('gallery', 'Luxury Spaces', 'Moments of', 'Luxury', 'Each image captures the essence of ZT Lounge Meru', 3, true, 'e558d226-2b12-421a-a7f5-6208b96b9875', '[{"text":"Explore Gallery","href":"#gallery","style":"primary"},{"text":"Book Experience","href":"contact.html","style":"secondary"}]'::jsonb);
