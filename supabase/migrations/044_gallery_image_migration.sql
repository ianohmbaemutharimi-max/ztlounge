-- Migration 044: Gallery Image Population
-- Populates 14 gallery images across Conference, Home, and Gallery pages

-- Conference Gallery (4 featured images)
INSERT INTO gallery (title, category, image_url, alt_text, display_order, is_featured, is_active, page_id, type)
SELECT 'Main Conference Room', 'Interior',
  'https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/gallery/gallery-01.webp',
  'Main conference room setup', 1, true, true, id, 'general'
FROM website_pages WHERE page_key = 'conference'
ON CONFLICT DO NOTHING;

INSERT INTO gallery (title, category, image_url, alt_text, display_order, is_featured, is_active, page_id, type)
SELECT 'Meeting Setup', 'Setup',
  'https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/gallery/gallery-02.webp',
  'Meeting room setup', 2, true, true, id, 'general'
FROM website_pages WHERE page_key = 'conference'
ON CONFLICT DO NOTHING;

INSERT INTO gallery (title, category, image_url, alt_text, display_order, is_featured, is_active, page_id, type)
SELECT 'Breakout Area', 'Lounge',
  'https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/gallery/gallery-03.webp',
  'Breakout lounge area', 3, true, true, id, 'general'
FROM website_pages WHERE page_key = 'conference'
ON CONFLICT DO NOTHING;

INSERT INTO gallery (title, category, image_url, alt_text, display_order, is_featured, is_active, page_id, type)
SELECT 'Dining Setup', 'Catering',
  'https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/gallery/gallery-04.webp',
  'Catering and dining', 4, true, true, id, 'general'
FROM website_pages WHERE page_key = 'conference'
ON CONFLICT DO NOTHING;

-- Home page carousel (2 featured images)
INSERT INTO gallery (title, category, image_url, alt_text, display_order, is_featured, is_active, page_id, type)
SELECT 'ZT Lounge Hero', 'Hero',
  'https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/gallery/gallery-10.webp',
  'ZT Lounge hero image', 1, true, true, id, 'general'
FROM website_pages WHERE page_key = 'home'
ON CONFLICT DO NOTHING;

INSERT INTO gallery (title, category, image_url, alt_text, display_order, is_featured, is_active, page_id, type)
SELECT 'Luxury Experience', 'Hero',
  'https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/gallery/gallery-09.webp',
  'Luxury dining', 2, true, true, id, 'general'
FROM website_pages WHERE page_key = 'home'
ON CONFLICT DO NOTHING;

-- Gallery page (all 14 images)
INSERT INTO gallery (title, category, image_url, alt_text, display_order, is_featured, is_active, page_id, type)
SELECT 'Gallery Image 1', 'General',
  'https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/gallery/gallery-01.webp',
  'Gallery image 1', 1, false, true, id, 'general'
FROM website_pages WHERE page_key = 'gallery'
ON CONFLICT DO NOTHING;
