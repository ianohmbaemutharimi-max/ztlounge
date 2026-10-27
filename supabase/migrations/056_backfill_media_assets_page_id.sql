-- ============================================================================
-- Migration 056: Backfill media_assets.page_id from actual usage
-- ============================================================================
-- Purpose: Populate media_assets.page_id by deriving it from content-row usage.
-- Every media asset referenced by gallery/services/menu_items/hero_slides should
-- have a page_id pointing to the owning page.
-- ============================================================================

BEGIN;

-- Backfill page_id from gallery (assets referenced by exactly one gallery page)
DO $do$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['hero_slides','services','gallery','menu_items'] LOOP
    IF to_regclass('public.' || quote_ident(t)) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format($sql$
      UPDATE public.media_assets m
      SET page_id = agg.page_id
      FROM (
        SELECT r.media_id,
               (array_agg(DISTINCT r.page_id ORDER BY r.page_id))[1] AS page_id,
               COUNT(DISTINCT r.page_id) AS n
        FROM public.%I r
        WHERE r.media_id IS NOT NULL
          AND r.page_id IS NOT NULL
        GROUP BY r.media_id
      ) agg
      WHERE m.id = agg.media_id
        AND m.page_id IS NULL
        AND agg.n = 1
    $sql$, t);
  END LOOP;
END
$do$;

-- Report results
DO $$
DECLARE
  total_assets int;
  with_page_id int;
  null_page_id int;
  by_category record;
BEGIN
  SELECT COUNT(*) INTO total_assets FROM public.media_assets;
  SELECT COUNT(*) INTO with_page_id FROM public.media_assets WHERE page_id IS NOT NULL;
  SELECT COUNT(*) INTO null_page_id FROM public.media_assets WHERE page_id IS NULL;

  RAISE NOTICE 'media_assets: total=%, with_page_id=%, null_page_id=%',
    total_assets, with_page_id, null_page_id;

  RAISE NOTICE 'Assets still needing manual page_id assignment:';
  FOR by_category IN
    SELECT category, COUNT(*) AS cnt
    FROM public.media_assets
    WHERE page_id IS NULL
    GROUP BY category
    ORDER BY category
  LOOP
    RAISE NOTICE '  %: % asset(s)', by_category.category, by_category.cnt;
  END LOOP;
END $$;

COMMIT;

-- Verification queries (run manually after migration):
-- SELECT COUNT(*) FROM public.media_assets WHERE page_id IS NULL;  -- expect 0
-- SELECT category, COUNT(*) FROM public.media_assets WHERE page_id IS NULL GROUP BY category;