-- ============================================================
-- Google Business Profile Reviews Integration
-- Migration 033
-- 
-- This migration adds Google Business Profile OAuth and review
-- synchronization capabilities. No hard-coded credentials or
-- business identifiers - all configuration is database-driven.
-- ============================================================

-- ============================================================
-- PART 1: Enhance testimonials table for Google integration
-- ============================================================

-- Add Google integration fields
ALTER TABLE testimonials 
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual' CHECK (source IN ('manual', 'google')),
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS external_url text,
  ADD COLUMN IF NOT EXISTS author_photo_url text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

-- Add unique constraint: prevent duplicate Google reviews
-- This ensures idempotent sync - same review can be synced multiple times
CREATE UNIQUE INDEX IF NOT EXISTS idx_testimonials_source_external_id
  ON testimonials(source, external_id)
  WHERE external_id IS NOT NULL;

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_testimonials_source 
  ON testimonials(source) WHERE source = 'google';

CREATE INDEX IF NOT EXISTS idx_testimonials_last_synced 
  ON testimonials(last_synced_at) WHERE source = 'google';

-- Documentation
COMMENT ON COLUMN testimonials.source IS 'Origin of testimonial: manual (created in admin) or google (synced from Google Business Profile)';
COMMENT ON COLUMN testimonials.external_id IS 'Google review ID for idempotent sync. Must be unique per source.';
COMMENT ON COLUMN testimonials.external_url IS 'Link to original Google review for user reference';
COMMENT ON COLUMN testimonials.author_photo_url IS 'Google reviewer profile photo URL';
COMMENT ON COLUMN testimonials.reviewed_at IS 'Original review timestamp from Google (may differ from created_at)';
COMMENT ON COLUMN testimonials.last_synced_at IS 'Last time this Google review was synced/updated';

-- ============================================================
-- PART 2: Create google_connections table
-- Stores OAuth tokens and Google account/location identifiers
-- NO HARD-CODED CREDENTIALS - all business-specific data here
-- ============================================================

CREATE TABLE IF NOT EXISTS google_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- OAuth tokens (ENCRYPTED at rest by Supabase, server-side only)
  -- Never expose these to the browser
  refresh_token text NOT NULL,
  access_token text,
  token_expires_at timestamptz,
  
  -- Google Business Profile identifiers (resolved dynamically after OAuth)
  -- NOT hard-coded in application code
  google_account_id text,
  google_location_id text NOT NULL,
  google_location_name text, -- Human-readable location name
  
  -- Connection metadata
  connected_at timestamptz DEFAULT now(),
  connected_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  last_sync_at timestamptz,
  sync_enabled boolean DEFAULT true,
  
  -- Audit fields
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure only one active connection per location
  CONSTRAINT unique_google_location UNIQUE(google_location_id)
);

-- RLS: Only managers and above can view/manage Google connections
ALTER TABLE google_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "google_connections_manager_manage"
  ON google_connections
  FOR ALL
  USING (is_manager_or_above())
  WITH CHECK (is_manager_or_above());

-- Indexes for efficient lookups
CREATE INDEX idx_google_connections_location_id ON google_connections(google_location_id);
CREATE INDEX idx_google_connections_sync_enabled ON google_connections(sync_enabled) WHERE sync_enabled = true;
CREATE INDEX idx_google_connections_last_sync ON google_connections(last_sync_at DESC);

-- Table documentation
COMMENT ON TABLE google_connections IS 'Business-specific Google Business Profile OAuth connections. Tokens and identifiers stored here, NOT hard-coded in application code.';
COMMENT ON COLUMN google_connections.refresh_token IS 'OAuth refresh token (encrypted, server-side only). Used to obtain new access tokens.';
COMMENT ON COLUMN google_connections.access_token IS 'OAuth access token (encrypted, short-lived ~1 hour). Refreshed automatically.';
COMMENT ON COLUMN google_connections.google_location_id IS 'Google Business Profile location ID (e.g., locations/12345). Resolved dynamically after OAuth.';

-- ============================================================
-- PART 3: Create google_review_sync_runs table
-- Provides sync observability and audit trail
-- ============================================================

CREATE TABLE IF NOT EXISTS google_review_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES google_connections(id) ON DELETE CASCADE,
  
  -- Sync execution metadata
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL CHECK (status IN ('running', 'completed', 'failed')) DEFAULT 'running',
  
  -- Sync results (counters)
  reviews_fetched integer DEFAULT 0,      -- Total reviews returned by Google API
  reviews_created integer DEFAULT 0,      -- New testimonials inserted
  reviews_updated integer DEFAULT 0,      -- Existing testimonials updated
  reviews_skipped integer DEFAULT 0,      -- Reviews ignored (e.g., deleted by Google)
  
  -- Error tracking
  error_message text,
  error_details jsonb,
  
  -- Audit
  triggered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS: Managers can view sync runs
ALTER TABLE google_review_sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "google_sync_runs_manager_read"
  ON google_review_sync_runs
  FOR SELECT
  USING (is_manager_or_above());

-- Indexes for efficient queries
CREATE INDEX idx_sync_runs_connection_id ON google_review_sync_runs(connection_id);
CREATE INDEX idx_sync_runs_status ON google_review_sync_runs(status);
CREATE INDEX idx_sync_runs_started_at ON google_review_sync_runs(started_at DESC);

-- Table documentation
COMMENT ON TABLE google_review_sync_runs IS 'Audit trail and observability for Google review sync operations. Tracks success/failure rates and sync history.';
COMMENT ON COLUMN google_review_sync_runs.reviews_created IS 'Number of new Google reviews inserted as testimonials (always with status=pending)';
COMMENT ON COLUMN google_review_sync_runs.reviews_updated IS 'Number of existing Google reviews updated (e.g., comment edits, rating changes)';

-- ============================================================
-- PART 4: Update RLS policies for cross-source queries
-- ============================================================

-- Public can read approved testimonials regardless of source
-- (This should already exist, but ensure it covers Google reviews)
DROP POLICY IF EXISTS "public_read_approved_testimonials_with_source" ON testimonials;

CREATE POLICY "public_read_approved_testimonials_with_source"
  ON testimonials
  FOR SELECT
  USING (
    (status = 'approved' OR (approved = true AND status IS NULL))
    AND (source = 'manual' OR source = 'google')
  );

-- ============================================================
-- PART 5: Create helper function for token refresh
-- ============================================================

CREATE OR REPLACE FUNCTION update_google_connection_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER google_connections_updated_at
  BEFORE UPDATE ON google_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_google_connection_timestamp();

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================

-- Summary:
-- ✅ Added Google integration fields to testimonials (source, external_id, etc.)
-- ✅ Created google_connections table (OAuth tokens, NO hard-coded credentials)
-- ✅ Created google_review_sync_runs table (observability)
-- ✅ Added RLS policies (manager-level access, public reads approved only)
-- ✅ Added indexes for efficient queries
-- ✅ Set up constraints for idempotent sync (unique source+external_id)
-- 
-- Next steps:
-- 1. Implement Google OAuth flow in admin application
-- 2. Implement review sync logic
-- 3. Update admin UI to show Google/manual badges
-- 4. Test with real Google Business Profile account
