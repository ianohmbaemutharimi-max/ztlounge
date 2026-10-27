-- ============================================================
-- Migration 063: Create page_seo table
-- Date: 2026-10-26
-- Purpose: Store SEO metadata per page in Supabase
-- ============================================================

BEGIN;

-- ============================================================
-- 1. PAGE SEO TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.page_seo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_page_seo_page_id ON public.page_seo(page_id);
CREATE INDEX idx_page_seo_active ON public.page_seo(is_active);

COMMENT ON TABLE public.page_seo IS
  'Stores SEO metadata (title, description) for each public page';

-- ============================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.page_seo ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can read active SEO records
CREATE POLICY "Public can read active page_seo" ON public.page_seo
  FOR SELECT USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage page_seo" ON public.page_seo
  FOR ALL USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

COMMIT;