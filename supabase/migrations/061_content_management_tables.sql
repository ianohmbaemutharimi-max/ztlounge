-- ============================================================
-- Migration 061: Content Management Tables
-- Date: 2026-10-25
-- Purpose: Add 7 new tables for database-driven content management
--          All tables are page-scoped for flexible content organization
-- ============================================================

BEGIN;

-- ============================================================
-- 1. PAGE SECTIONS TABLE
-- Purpose: About sections, overviews, page-specific content
-- ============================================================

CREATE TABLE IF NOT EXISTS public.page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id TEXT NOT NULL,
  section_type TEXT NOT NULL,
  heading TEXT,
  subheading TEXT,
  tag_text TEXT,
  body_html TEXT,
  image_url TEXT,
  media_id UUID,
  cta_text TEXT,
  cta_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_page_sections_page_id ON public.page_sections(page_id);
CREATE INDEX idx_page_sections_type ON public.page_sections(section_type);
CREATE INDEX idx_page_sections_active ON public.page_sections(is_active);
CREATE INDEX idx_page_sections_page_type ON public.page_sections(page_id, section_type);

ALTER TABLE public.page_sections
  ADD CONSTRAINT fk_page_sections_media
  FOREIGN KEY (media_id) REFERENCES media_assets(id) ON DELETE SET NULL;

COMMENT ON TABLE public.page_sections IS 
  'Stores page-specific sections like About, Overview, Intro for all pages';

-- ============================================================
-- 2. PRICING PACKAGES TABLE
-- Purpose: VIP cabins, Conference packages, Membership tiers
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pricing_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  package_slug TEXT UNIQUE,
  tagline TEXT,
  price_amount DECIMAL(10,2),
  price_currency TEXT DEFAULT 'KES',
  price_unit TEXT,
  price_display TEXT,
  features JSONB,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pricing_page_id ON public.pricing_packages(page_id);
CREATE INDEX idx_pricing_featured ON public.pricing_packages(is_featured);
CREATE INDEX idx_pricing_active ON public.pricing_packages(is_active);

COMMENT ON TABLE public.pricing_packages IS 
  'Stores pricing packages for VIP cabins, conference hall, and membership plans';

-- ============================================================
-- 3. FEATURED MENU ITEMS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.featured_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL,
  page_id TEXT DEFAULT 'restaurant',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  featured_from DATE,
  featured_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.featured_menu_items
  ADD CONSTRAINT fk_featured_menu_item
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE;

CREATE INDEX idx_featured_menu_page ON public.featured_menu_items(page_id);
CREATE INDEX idx_featured_menu_active ON public.featured_menu_items(is_active);

-- ============================================================
-- 4. ROOM LAYOUTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.room_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id TEXT DEFAULT 'conference',
  layout_name TEXT NOT NULL,
  layout_slug TEXT,
  icon_class TEXT,
  capacity_min INTEGER,
  capacity_max INTEGER,
  capacity_display TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_room_layouts_page ON public.room_layouts(page_id);
CREATE INDEX idx_room_layouts_active ON public.room_layouts(is_active);

-- ============================================================
-- 5. TRUST BADGES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.trust_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_name TEXT NOT NULL,
  icon_class TEXT,
  metric_value TEXT,
  metric_label TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  appears_on_pages TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trust_badges_active ON public.trust_badges(is_active);
CREATE INDEX idx_trust_badges_pages ON public.trust_badges USING GIN(appears_on_pages);

-- ============================================================
-- 6. CROSS-SELL ITEMS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cross_sell_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_page_id TEXT NOT NULL,
  target_page_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  media_id UUID,
  cta_text TEXT DEFAULT 'Learn More',
  cta_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cross_sell_items
  ADD CONSTRAINT fk_cross_sell_media
  FOREIGN KEY (media_id) REFERENCES media_assets(id) ON DELETE SET NULL;

CREATE INDEX idx_cross_sell_source ON public.cross_sell_items(source_page_id);
CREATE INDEX idx_cross_sell_target ON public.cross_sell_items(target_page_id);
CREATE INDEX idx_cross_sell_active ON public.cross_sell_items(is_active);

-- ============================================================
-- 7. BUSINESS INFO TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.business_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  info_type TEXT UNIQUE NOT NULL,
  business_name TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  country TEXT,
  phone_primary TEXT,
  phone_secondary TEXT,
  email TEXT,
  hours_text TEXT,
  hours_structured JSONB,
  google_maps_url TEXT,
  google_maps_embed TEXT,
  image_url TEXT,
  media_id UUID,
  metadata JSONB,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.business_info
  ADD CONSTRAINT fk_business_info_media
  FOREIGN KEY (media_id) REFERENCES media_assets(id) ON DELETE SET NULL;

CREATE INDEX idx_business_info_type ON public.business_info(info_type);
CREATE INDEX idx_business_info_active ON public.business_info(is_active);

-- ============================================================
-- Enable Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_sell_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_info ENABLE ROW LEVEL SECURITY;

-- Public read policies (anon can read active records)
CREATE POLICY "Public can read active page_sections" ON public.page_sections
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read active pricing_packages" ON public.pricing_packages
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read active featured_menu_items" ON public.featured_menu_items
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read active room_layouts" ON public.room_layouts
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read active trust_badges" ON public.trust_badges
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read active cross_sell_items" ON public.cross_sell_items
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read active business_info" ON public.business_info
  FOR SELECT USING (is_active = true);

-- Admin full access policies (authenticated users with admin role)
CREATE POLICY "Admins can manage page_sections" ON public.page_sections
  FOR ALL USING (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage pricing_packages" ON public.pricing_packages
  FOR ALL USING (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage featured_menu_items" ON public.featured_menu_items
  FOR ALL USING (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage room_layouts" ON public.room_layouts
  FOR ALL USING (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage trust_badges" ON public.trust_badges
  FOR ALL USING (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage cross_sell_items" ON public.cross_sell_items
  FOR ALL USING (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage business_info" ON public.business_info
  FOR ALL USING (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

COMMIT;
