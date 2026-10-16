-- ============================================================================
-- Migration 050: Reconstruct media_assets DDL
-- ============================================================================
-- WHY THIS EXISTS
-- --------------
-- `media_assets` is the canonical media registry that every content table
-- (hero_slides, gallery, services, menu_items) points at via `media_id`, and
-- that the public site's MediaResolver reads via the anon key. Yet it has
-- NO `CREATE TABLE` in any versioned migration: the repo's migrations start at
-- 026 and this table was created directly in the live database (dashboard or a
-- lost early migration). No generated types file documents it either.
--
-- This migration brings the table definition under source control so the schema
-- is no longer a phantom.
--
-- SAFETY / IDEMPOTENCY
-- --------------------
-- This is a BEST-EFFORT reconstruction derived from the application code that
-- reads and writes the table. It is intentionally non-destructive:
--   * CREATE TABLE IF NOT EXISTS  -> no-op in live (table already exists).
--   * The live table is NEVER altered by this migration.
--   * ENABLE ROW LEVEL SECURITY   -> no-op (already enabled in live).
--   * Policy is additively named and guarded by DROP POLICY IF EXISTS.
--
-- IMPORTANT: Before relying on this as the full schema, verify the live column
-- set. Run this against the live DB (psql) and reconcile any columns this
-- reconstruction is missing (e.g. updated_at, or any seeded columns):
--
--     SELECT column_name, data_type, is_nullable, column_default
--     FROM information_schema.columns
--     WHERE table_schema = 'public' AND table_name = 'media_assets'
--     ORDER BY ordinal_position;
--
-- Columns below are ONLY those evidenced by the codebase:
--   * src/app/api/admin/upload/route.ts        (INSERT)
--   * src/app/api/admin/media-assets/route.ts  (SELECT)
--   * public site MediaResolver                (anon SELECT)
-- Do NOT add columns here that the code does not reference.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.media_assets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket        text NOT NULL,
  path          text NOT NULL,
  public_url    text NOT NULL,
  original_name text,
  -- Coarse library bucket (services, gallery, menu, branding, ...).
  -- NOTE: the upload route validates this category for the STORAGE PATH but
  -- does NOT currently write it here, so admin uploads land with category NULL.
  -- A later migration should populate it (backfill from the path + accept it on
  -- upload). Kept nullable to match current behaviour.
  category      text,
  media_type    text,
  mime_type     text,
  alt_text      text,
  width         integer,
  height        integer,
  file_size     integer,
  -- FK to profiles/auth.users is intentionally omitted (matches file_uploads,
  -- which also stores uploaded_by as a bare uuid) to avoid coupling this
  -- reconstruction to a specific users table in live.
  uploaded_by   uuid,
  -- Reserved for dedup. Upload route currently hardcodes NULL.
  content_hash  text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.media_assets IS
  'Canonical media registry. Content rows reference it via media_id; the public '
  'site resolves media_id -> public_url. Created in live only; reconstructed '
  'here for source control (migration 050).';

-- Helpful index for category filtering (used by the admin library lane).
-- IF NOT EXISTS keeps this a no-op if an equivalent index already exists.
CREATE INDEX IF NOT EXISTS media_assets_category_idx
  ON public.media_assets (category);

CREATE INDEX IF NOT EXISTS media_assets_created_at_idx
  ON public.media_assets (created_at DESC);

-- RLS is expected to already be enabled in live; stating it here documents the
-- security posture and makes fresh environments correct.
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Public (anon) read: the public website's MediaResolver selects
-- (id, public_url, alt_text) with the anon key, so SELECT must be open.
-- Uniquely named + guarded so this migration is safely re-runnable and does
-- not collide with any pre-existing policy name in live.
DROP POLICY IF EXISTS "media_assets_public_read" ON public.media_assets;
CREATE POLICY "media_assets_public_read"
  ON public.media_assets
  FOR SELECT
  USING (true);

-- Writes (INSERT/UPDATE/DELETE) go through the service-role key
-- (getSupabaseAdmin in the upload route), which BYPASSES RLS, so no write
-- policy is required for the current architecture. When session-client writes
-- are introduced (e.g. an authenticated PATCH for alt_text/is_active in the
-- Option A work), an additional authenticated write policy will be needed.
