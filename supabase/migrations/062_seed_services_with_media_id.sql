-- ============================================================
-- Migration 062: Seed services with media_id references
-- Eliminate legacy image_url fallback
-- ============================================================

-- ============================================================
-- 1. CREATE website_pages TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.website_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key TEXT UNIQUE NOT NULL,
  page_name TEXT NOT NULL,
  path TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. SEED website_pages
-- ============================================================

INSERT INTO public.website_pages (page_key, page_name, path, description) VALUES
  ('home', 'Homepage', '/', 'Main landing page'),
  ('restaurant', 'Restaurant', '/pages/experiences/restaurant.html', 'Fine dining experience'),
  ('lounge-bar', 'Lounge & Bar', '/pages/experiences/lounge.html', 'Premium cocktails and entertainment'),
  ('vip-cabins', 'VIP Cabins', '/pages/experiences/vip.html', 'Private dining cabins'),
  ('events', 'Events', '/pages/business/events.html', 'Weddings and celebrations'),
  ('conference', 'Conference', '/pages/business/conference.html', 'Corporate meetings and seminars'),
  ('grooming-care', 'Grooming & Care', '/pages/business/grooming-care.html', 'Barbershop, auto spa, carpet cleaning')
ON CONFLICT (page_key) DO UPDATE SET
  page_name = EXCLUDED.page_name,
  path = EXCLUDED.path,
  description = EXCLUDED.description,
  updated_at = NOW();




-- ============================================================
-- 3. ADD media_id COLUMN TO services (if not exists)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'media_id'
  ) THEN
    ALTER TABLE public.services ADD COLUMN media_id UUID;
    ALTER TABLE public.services ADD COLUMN href TEXT;
    ALTER TABLE public.services
      ADD CONSTRAINT fk_services_media
      FOREIGN KEY (media_id) REFERENCES public.media_assets(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_services_media_id ON public.services(media_id);
    RAISE NOTICE 'Added media_id column to services';
  END IF;
END $$;

-- ============================================================
-- 4. UPDATE page_id TYPE TO UUID (if needed)
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services'
    AND column_name = 'page_id'
    AND data_type = 'text'
  ) THEN
    ALTER TABLE services ADD COLUMN page_id_uuid UUID;

    UPDATE services s
    SET page_id_uuid = wp.id
    FROM website_pages wp
    WHERE s.page_id = wp.page_key;

    ALTER TABLE services DROP COLUMN page_id;
    ALTER TABLE services RENAME COLUMN page_id_uuid TO page_id;

    ALTER TABLE services
      ADD CONSTRAINT fk_services_page
      FOREIGN KEY (page_id) REFERENCES website_pages(id) ON DELETE CASCADE;

    CREATE INDEX IF NOT EXISTS idx_services_page_id ON services(page_id);

    RAISE NOTICE 'Converted services.page_id from TEXT to UUID';
  END IF;
END $$;

-- ============================================================
-- 5. CLEAR EXISTING SERVICES
-- ============================================================

DELETE FROM services;

-- ============================================================
-- 6. SEED HOMEPAGE SERVICES (6 nav cards with media_id)
-- ============================================================

DO $$
DECLARE
  home_page_id UUID;
  restaurant_cat_id UUID;
  lounge_cat_id UUID;
  vip_cat_id UUID;
  events_cat_id UUID;
  conference_cat_id UUID;
  autospa_cat_id UUID;
BEGIN
  SELECT id INTO home_page_id FROM website_pages WHERE page_key = 'home';
  SELECT id INTO restaurant_cat_id FROM service_categories WHERE slug = 'restaurant';
  SELECT id INTO lounge_cat_id FROM service_categories WHERE slug = 'lounge-bar';
  SELECT id INTO vip_cat_id FROM service_categories WHERE slug = 'vip-cabins';
  SELECT id INTO events_cat_id FROM service_categories WHERE slug = 'events';
  SELECT id INTO conference_cat_id FROM service_categories WHERE slug = 'conference';
  SELECT id INTO autospa_cat_id FROM service_categories WHERE slug = 'auto-spa';

  INSERT INTO services (
    name, slug, description, media_id, alt_text, tag, href,
    page_id, category_id, type, display_order, is_active
  ) VALUES
    (
      'Restaurant',
      'restaurant',
      'Fine dining with exquisite cuisine and elegant ambiance',
      '2d837e6f-f53e-4b03-bc88-97585937e9a1'::UUID,
      'Fine dining restaurant at ZT Lounge with elegant table setting and ambient lighting',
      'Ã¢Å“Â¦ Signature',
      'pages/experiences/restaurant.html',
      home_page_id,
      restaurant_cat_id,
      'nav',
      1,
      true
    ),
    (
      'Lounge & Bar',
      'lounge-bar',
      'Premium cocktails, live entertainment, and sophisticated atmosphere',
      '6ed7e810-92e2-4988-b192-82531ce03cb2'::UUID,
      'Luxury lounge and bar at ZT Lounge with premium seating and sophisticated atmosphere',
      'Ã¢Å“Â¦ Nightlife',
      'pages/experiences/lounge.html',
      home_page_id,
      lounge_cat_id,
      'nav',
      2,
      true
    ),
    (
      'VIP Cabins',
      'vip-cabins',
      'Private, exclusive cabins for intimate dining and celebrations',
      '76780f76-860b-4c48-980c-4eb692a80f05'::UUID,
      'Luxury VIP cabin at ZT Lounge with private dining and exclusive amenities',
      'Ã¢Å“Â¦ Private',
      'pages/experiences/vip.html',
      home_page_id,
      vip_cat_id,
      'nav',
      3,
      true
    ),
    (
      'Events',
      'events',
      'Weddings, birthdays, graduations, and private celebrations',
      '1f0d04c1-b58e-44cb-8dd1-8f65c7e8f911'::UUID,
      'Elegant event setup at ZT Lounge with floral arrangements and celebratory decor',
      'Ã¢Å“Â¦ Celebrations',
      'pages/business/events.html',
      home_page_id,
      events_cat_id,
      'nav',
      4,
      true
    ),
    (
      'Conference',
      'conference',
      'State-of-the-art facilities for corporate meetings and seminars',
      '2f270769-d381-4189-93cc-b8285d3ac78a'::UUID,
      'Modern conference hall at ZT Lounge with state-of-the-art audiovisual equipment',
      'Ã¢Å“Â¦ Corporate',
      'pages/business/conference.html',
      home_page_id,
      conference_cat_id,
      'nav',
      5,
      true
    ),
    (
      'Grooming & Care',
      'grooming-care',
      'Premium services: barbershop styling, auto spa car detailing, and carpet cleaning services',
      '25407251-9197-42b1-a2a9-3ab30fbc8e26'::UUID,
      'Grooming & Care services at ZT Lounge - barbershop, auto spa, and carpet cleaning',
      'Ã¢Å“Â¦ Premium',
      'pages/business/grooming-care.html',
      home_page_id,
      autospa_cat_id,
      'nav',
      6,
      true
    );
END $$;

-- ============================================================
-- 7. SEED INFO CARDS (24 info cards with media_id or icons)
-- ============================================================

DO $$
DECLARE
  home_page_id UUID;
  restaurant_cat_id UUID;
  lounge_cat_id UUID;
  vip_cat_id UUID;
  events_cat_id UUID;
  conference_cat_id UUID;
  autospa_cat_id UUID;
BEGIN
  SELECT id INTO home_page_id FROM website_pages WHERE page_key = 'home';
  SELECT id INTO restaurant_cat_id FROM service_categories WHERE slug = 'restaurant';
  SELECT id INTO lounge_cat_id FROM service_categories WHERE slug = 'lounge-bar';
  SELECT id INTO vip_cat_id FROM service_categories WHERE slug = 'vip-cabins';
  SELECT id INTO events_cat_id FROM service_categories WHERE slug = 'events';
  SELECT id INTO conference_cat_id FROM service_categories WHERE slug = 'conference';
  SELECT id INTO autospa_cat_id FROM service_categories WHERE slug = 'auto-spa';

  INSERT INTO services (
    name, slug, description, media_id, alt_text, tag, href,
    page_id, category_id, type, display_order, is_active, icon
  ) VALUES
    -- Restaurant info cards (4)
    (
      'Fine Dining',
      'fine-dining',
      'Exquisite multi-course tasting menu with wine pairings',
      NULL,
      NULL,
      'Ã¢Å“Â¦ Michelin Star',
      'pages/experiences/restaurant.html',
      home_page_id,
      restaurant_cat_id,
      'info',
      1,
      true,
      'utensils'
    ),
    (
      'Wine Cellar',
      'wine-cellar',
      'Curated selection of vintage and rare wines',
      NULL,
      NULL,
      'Ã¢Å“Â¦ Sommelier',
      'pages/experiences/restaurant.html',
      home_page_id,
      restaurant_cat_id,
      'info',
      2,
      true,
      'wine-bottle'
    ),
    (
      'Private Dining',
      'private-dining',
      'Intimate private dining rooms for special occasions',
      NULL,
      NULL,
      'Ã¢Å“Â¦ Exclusive',
      'pages/experiences/restaurant.html',
      home_page_id,
      restaurant_cat_id,
      'info',
      3,
      true,
      'users'
    ),
    (
      'Chef Table',
      'chef-table',
      "Watch the chef's creation up close at the counter",
      NULL,
      NULL,
      'Ã¢Å“Â¦ Interactive',
      'pages/experiences/restaurant.html',
      home_page_id,
      restaurant_cat_id,
      'info',
      4,
      true,
      'hat-chef'
    ),
    -- Lounge & Bar info cards (4)
    (
      'Signature Cocktails',
      'signature-cocktails',
      'Handcrafted cocktails by our expert mixologists',
      NULL,
      NULL,
      'Ã¢Å“Â¦ Craft',
      'pages/experiences/lounge.html',
      home_page_id,
      lounge_cat_id,
      'info',
      1,
      true,
      'glass-martini'
    ),
    (
      'Live Jazz',
      'live-jazz',
      'Weekly live jazz performances in the lounge',
      NULL,
      NULL,
      'Ã¢Å“Â¦ Entertainment',
      'pages/experiences/lounge.html',
      home_page_id,
      lounge_cat_id,
      'info',
      2,
      true,
      'music'
    ),
    (
      'Whiskey Selection',
      'whiskey-selection',
      'Rare and aged whiskeys from around the world',
      NULL,
      NULL,
      'Ã¢Å“Â¦ Premium',
      'pages/experiences/lounge.html',
      home_page_id,
      lounge_cat_id,
      'info',
      3,
      true,
      'bottle'
    ),
    (
      'Late Night Lounge',
      'late-night-lounge',
      'Open until 2 AM for night owls and nightcaps',
      NULL,
      NULL,
      'Ã¢Å“Â¦ 24/7',
      'pages/experiences/lounge.html',
      home_page_id,
      lounge_cat_id,
      'info',
      4,
      true,
      'moon'
    ),
    -- VIP Cabins info cards (4)
    (
      'VIP Cabin 1',
      'vip-cabin-1',
      'Luxury VIP cabin with ocean view and private balcony',
      NULL,
      NULL,
      'Ã¢Å“Â¦ Ocean View',
      'pages/experiences/vip.html',
      home_page_id,
      vip_cat_id,
      'info',
      1,
      true,
      'cabin'
    ),
    (
      'VIP Cabin 2',
      'vip-cabin-2',
      'Intimate VIP cabin for romantic dinners',
      NULL,
      NULL,
      'Ã¢Å“Â¦ Romantic',
      'pages/experiences/vip.html',
      home_page_id,
      vip_cat_id,
      'info',
      2,
      true,
      'heart'
    ),
    (
      'VIP Cabin 3',
      'vip-cabin-3',
      'Spacious VIP cabin for group celebrations',
      NULL,
      NULL,
      'Ã¢Å“Â¦ Group',
      'pages/experiences/vip.html',
      home_page_id,
      vip_cat_id,
      'info',
      3,
      true,
      'users'
    ),
    (
      'VIP Cabin 4',
      'vip-cabin-4',
      'Executive VIP cabin with business amenities',
      NULL,
      NULL,
      'Ã¢Å“Â¦ Executive',
      'pages/experiences/vip.html',
      home_page_id,
      vip_cat_id,
      'info',
      4,
      true,
      'briefcase'
    );
END $$;

-- ============================================================
-- 7b. SEED REMAINING INFO CARDS (events, conference, grooming)
-- ============================================================

DO $$
DECLARE
  home_page_id UUID;
  events_cat_id UUID;
  conference_cat_id UUID;
  autospa_cat_id UUID;
BEGIN
  SELECT id INTO home_page_id FROM website_pages WHERE page_key = 'home';
  SELECT id INTO events_cat_id FROM service_categories WHERE slug = 'events';
  SELECT id INTO conference_cat_id FROM service_categories WHERE slug = 'conference';
  SELECT id INTO autospa_cat_id FROM service_categories WHERE slug = 'auto-spa';

  -- Events info cards (4)
  INSERT INTO services (
    name, slug, description, media_id, alt_text, tag, href,
    page_id, category_id, type, display_order, is_active, icon
  ) VALUES
    (
      'Weddings',
      'weddings',
      'Dream wedding venues with full-service planning',
      NULL,
      NULL,
      'Ã¢Å“Â¦ Ceremony',
      'pages/business/events.html',
      home_page_id,
      events_cat_id,
      'info',
      1,
      true,
      'heart'
    ),
    (
      'Birthdays',
      'birthdays',
      'Memorable birthday celebrations for all ages',
      NULL,
      NULL,
      'Ã¢Å“Â¦ Celebration',
      'pages/business/events.html',
      home_page_id,
      events_cat_id,
      'info',
      2,
      true,
      'gift'
    ),
    (
      'Graduations',
      'graduations',
      'Celebrate academic achievements in style',
      NULL,
      NULL,
      'Ã¢Å“Â¦ Achievement',
      'pages/business/events.html',
      home_page_id,
      events_cat_id,
      'info',
      3,
      true,
      'graduation-cap'
    ),
    (
      'Anniversaries',
      'anniversaries',
      'Romantic anniversary dinners and celebrations',
      NULL,
      NULL,
      'Ã¢Å“Â¦ Romance',
      'pages/business/events.html',
      home_page_id,
      events_cat_id,
      'info',
      4,
      true,
      'ring'
    ),
    -- Conference info cards (4)
    (
      'Board Meetings',
      'board-meetings',
      'Professional boardroom with audiovisual equipment',
      NULL,
      NULL,
      'Ã¢Å“Â¦ Corporate',
      'pages/business/conference.html',
      home_page_id,
      conference_cat_id,
      'info',
      1,
      true,
      'briefcase'
    ),
    (
      'Seminars',
      'seminars',
      'Training and educational seminar facilities',
      NULL,
      NULL,
      'Ã¢Å“Â¦ Learning',
      'pages/business/conference.html',
      home_page_id,
      conference_cat_id,
      'info',
      2,
      true,
      'book'
    ),
    (
      'Workshops',
      'workshops',
      'Interactive workshop spaces for hands-on sessions',
      NULL,
      NULL,
      'Ã¢Å“Â¦ Interactive',
      'pages/business/conference.html',
      home_page_id,
      conference_cat_id,
      'info',
      3,
      true,
      'tool'
    ),
    (
      'Product Launches',
      'product-launches',
      'Stunning venues for product launch events',
      NULL,
      NULL,
      'Ã¢Å“Â¦ Launch',
      'pages/business/conference.html',
      home_page_id,
      conference_cat_id,
      'info',
      4,
      true,
      'rocket'
    ),
    -- Grooming & Care info cards (4)
    (
      'Barbershop',
      'barbershop',
      'Classic barbershop services with modern styling',
      NULL,
      NULL,
      'Ã¢Å“Â¦ Classic',
      'pages/business/grooming-care.html',
      home_page_id,
      autospa_cat_id,
      'info',
      1,
      true,
      'scissors'
    ),
    (
      'Auto Spa',
      'auto-spa',
      'Premium car detailing and spa services',
      NULL,
      NULL,
      'Ã¢Å“Â¦ Automotive',
      'pages/business/grooming-care.html',
      home_page_id,
      autospa_cat_id,
      'info',
      2,
      true,
      'car'
    ),
    (
      'Carpet Cleaning',
      'carpet-cleaning',
      'Professional carpet and upholstery cleaning',
      NULL,
      NULL,
      'Ã¢Å“Â¦ Clean',
      'pages/business/grooming-care.html',
      home_page_id,
      autospa_cat_id,
      'info',
      3,
      true,
      'sponge'
    ),
    (
      'Detailing',
      'detailing',
      'Complete vehicle detailing and protection',
      NULL,
      NULL,
      'Ã¢Å“Â¦ Protection',
      'pages/business/grooming-care.html',
      home_page_id,
      autospa_cat_id,
      'info',
      4,
      true,
      'shield'
    );
END $$;

-- ============================================================
-- 8. ADD INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_services_media_id ON public.services(media_id);
CREATE INDEX IF NOT EXISTS idx_services_href ON public.services(href);
CREATE INDEX IF NOT EXISTS idx_services_page_id ON public.services(page_id);
CREATE INDEX IF NOT EXISTS idx_services_category_id ON public.services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_type ON public.services(type);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);

-- ============================================================
-- 9. ADD FOREIGN KEY CONSTRAINTS
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_services_media'
  ) THEN
    ALTER TABLE public.services
      ADD CONSTRAINT fk_services_media
      FOREIGN KEY (media_id) REFERENCES public.media_assets(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_services_page'
  ) THEN
    ALTER TABLE public.services
      ADD CONSTRAINT fk_services_page
      FOREIGN KEY (page_id) REFERENCES public.website_pages(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================
-- 10. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.website_pages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 11. CREATE RLS POLICIES
-- ============================================================

CREATE POLICY "Public can view website_pages" ON public.website_pages
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage website_pages" ON public.website_pages
  FOR ALL USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      JOIN roles ON roles.id = profiles.role_id
      WHERE profiles.id = auth.uid()
      AND roles.name = 'admin'
    )
  );

-- ============================================================
-- 12. ADD COMMENTS
-- ============================================================

COMMENT ON TABLE public.website_pages IS
  'Website page registry for linking services and content to specific pages';

COMMENT ON COLUMN public.services.media_id IS
  'Reference to media_assets.id - canonical media reference, replaces legacy image_url';

COMMENT ON COLUMN public.services.page_id IS
  'Reference to website_pages.id - page linkage, converted from TEXT to UUID';

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================