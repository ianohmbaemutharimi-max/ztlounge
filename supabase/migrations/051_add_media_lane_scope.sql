-- ============================================================================
-- Migration 051: Add page-lane scope + active toggle to media_assets
-- ============================================================================
-- SUPERSEDED FOR PRODUCTION: columns page_id and is_active were applied to the
-- live production database (project ref jczwilrysvnhcjzjztbi) on 2026-10-15
-- via migration 054 (media_assets_schema_reconcile.sql), which records the
-- final state. Do NOT re-run this or migration 050 against production — the
-- production history branch (media_fix_step3_4_register_and_link_gallery)
-- already contains the equivalent changes. This file remains for fresh
-- environment rebuilds only.
-- ============================================================================
-- Migration 051: Add page-lane scope + active toggle to media_assets
-- ============================================================================
-- WHY THIS EXISTS  (Option A — Scoped Lanes, Layer 1)
-- --------------------------------------------------
-- The target architecture is a single, well-categorized media library whose
-- assets are SCOPED TO A PAGE ("lane"), so a page-owner only sees and edits
-- the images that belong to their page (e.g. grooming-care / barbershop) and
-- cannot collide with promotions / gallery / menu lanes.
--
-- `media_assets` (reconstructed in 050) has none of this yet. This migration
-- adds the two columns that enable the model:
--
--   1. page_id    uuid NULL -> website_pages(id)   the owning lane
--   2. is_active  boolean NOT NULL DEFAULT true   powers the activate toggle
--
-- and backfills what can be derived safely and deterministically:
--   * category  <- parsed from the storage `path` (real, correct data)
--   * page_id   <- derived from ACTUAL USAGE, only when unambiguous
--
-- SAFETY / IDEMPOTENCY
-- --------------------
--   * ADD COLUMN IF NOT EXISTS            -> safe re-run; no live data touched
--   * FK added via guarded DO block       -> no duplicate-constraint error
--   * category backfill                  -> deterministic from `path`, allowlist
--   * page_id backfill                   -> guarded per-table, sets only NULLs,
--                                           only where usage is unanimous (1 page)
--   * is_active DEFAULT true             -> existing assets stay visible; the
--                                           public MediaResolver does NOT filter
--                                           on is_active yet, so public output is
--                                           unchanged by this migration.
--
-- IMPORTANT — the deliberate NON-guess on page_id
-- -----------------------------------------------
-- Storage `category` (hero/gallery/menu/services/branding/...) is a
-- content-TYPE bucket, NOT a page lane. A `services` image could belong to
-- barbershop, autospa, OR home. Auto-mapping category->page would invent
-- ownership and RE-CREATE the collision we are removing. Therefore page_id is
-- derived only from real content-row usage, and left NULL when an asset is
-- referenced by more than one page (ambiguous) or by none (unused) — those
-- are assigned manually in the Layer 3/4 library UI. This defers the open
-- A1 (single-owner) vs A2 (owned+shared) decision rather than pre-empting it.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add the scoping columns (additive, non-destructive)
-- ---------------------------------------------------------------------------

ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS page_id uuid;

ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.media_assets.page_id IS
  'Owning page lane (Option A). NULL = unassigned or cross-page/ambiguous; '
  'assign manually in the library UI. FK -> website_pages(id), SET NULL on delete.';
COMMENT ON COLUMN public.media_assets.is_active IS
  'Activate toggle for the media library. DEFAULT true. Public MediaResolver '
  'does not filter on this yet (added in a later layer).';
-- ---------------------------------------------------------------------------
-- 2. Foreign key + index, guarded so a re-run cannot fail
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'media_assets_page_id_fkey'
  ) THEN
    ALTER TABLE public.media_assets
      ADD CONSTRAINT media_assets_page_id_fkey
      FOREIGN KEY (page_id)
      REFERENCES public.website_pages(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS media_assets_page_id_idx
  ON public.media_assets (page_id);

CREATE INDEX IF NOT EXISTS media_assets_is_active_idx
  ON public.media_assets (is_active);

-- ---------------------------------------------------------------------------
-- 3. Backfill `category` from the storage path (deterministic + allowlisted)
-- ---------------------------------------------------------------------------
-- Real stored paths look like: assets/images/<category>/<uuid>.webp
-- Some legacy rows may omit the `assets/` prefix (images/<category>/...),
-- so the pattern tolerates both. Only known categories are written, so no
-- junk strings land in the column.

UPDATE public.media_assets
SET category = (regexp_match(path, '^(?:assets/)?images/([^/]+)/'))[1]
WHERE category IS NULL
  AND path ~ '^(assets/)?images/';


-- ---------------------------------------------------------------------------
-- 4. Backfill `page_id` from ACTUAL USAGE — unanimous page only
-- ---------------------------------------------------------------------------
-- For each media asset, look at every content row that references it
-- (hero_slides / services / gallery / menu_items — the tables that carry BOTH
-- media_id and page_id). If all referencing rows resolve to exactly ONE page,
-- assign that page. If the asset is referenced by multiple pages (shared) or
-- by none, leave page_id NULL for manual assignment.
--
-- Each table is guarded by to_regclass + column existence checks, so a table
-- missing in the live DB is skipped rather than aborting the migration.
-- Idempotent: only touches rows where page_id IS NULL.

DO $do$
DECLARE
  ref_tables  text[] := ARRAY['hero_slides','services','gallery','menu_items'];
  t           text;
  missing_mid boolean;
  missing_pid boolean;
BEGIN
  FOREACH t IN ARRAY ref_tables LOOP
    IF to_regclass('public.' || quote_ident(t)) IS NULL THEN
      RAISE NOTICE 'skip %: table does not exist', t;
      CONTINUE;
    END IF;

    SELECT
      NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name=t AND column_name='media_id'),
      NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name=t AND column_name='page_id')
    INTO missing_mid, missing_pid;

    IF missing_mid OR missing_pid THEN
      RAISE NOTICE 'skip %: missing media_id/page_id column', t;
      CONTINUE;
    END IF;

    EXECUTE format($sql$
      UPDATE public.media_assets m
      SET page_id = agg.page_id
      FROM (
        SELECT r.media_id,
               (array_agg(DISTINCT r.page_id))[1] AS page_id,
               COUNT(DISTINCT r.page_id)              AS n
        FROM public.%I r
        WHERE r.media_id IS NOT NULL
          AND r.page_id  IS NOT NULL
        GROUP BY r.media_id
      ) agg
      WHERE m.id = agg.media_id
        AND m.page_id IS NULL
        AND agg.n = 1
    $sql$, t);
  END LOOP;
END
$do$;

-- ---------------------------------------------------------------------------
-- 5. Post-migration verification (run manually; read-only)
-- ---------------------------------------------------------------------------
--   SELECT
--     COUNT(*)                                    AS total,
--     COUNT(category)                             AS with_category,
--     COUNT(page_id)                              AS with_page_lane,
--     COUNT(*) FILTER (WHERE page_id IS NULL)     AS needs_manual_lane
--   FROM public.media_assets;
--
--   -- Which referenced assets are still ambiguous (shared across pages)?
--   -- These are the A1/A2 candidates — assign lanes manually in the library UI.
-- ============================================================================

