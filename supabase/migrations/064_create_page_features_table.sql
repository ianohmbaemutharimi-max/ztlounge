-- ============================================================
-- Migration 064: Create page_features table
-- Date: 2026-10-26
-- Purpose: Store feature card content per page in Supabase
-- ============================================================

BEGIN;

-- ============================================================
-- 1. PAGE FEATURES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.page_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  icon TEXT DEFAULT 'fas fa-star',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_page_features_page_id ON public.page_features(page_id);
CREATE INDEX idx_page_features_active ON public.page_features(is_active);
CREATE INDEX idx_page_features_page_active ON public.page_features(page_id, is_active);

COMMENT ON TABLE public.page_features IS
  'Stores feature card content (title, description, icon) for each public page';

-- ============================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.page_features ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can read active feature records
CREATE POLICY "Public can read active page_features" ON public.page_features
  FOR SELECT USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage page_features" ON public.page_features
  FOR ALL USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

COMMIT;