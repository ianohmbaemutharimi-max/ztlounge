-- ============================================================
-- ZT Lounge Hero Highlight Cleanup
-- Migration: 035_cleanup_hero_highlight
-- ============================================================
-- Purpose:
--   1. Remove the redundant legacy service-list string that was stored
--      in hero_slides.highlight (not subtitle) for the Home Hero:
--         "Premium Dining • VIP Cabins • Pool Table • Lounge & Bar • Events • Conference • Auto Spa"
--      That string is the obsolete "Hero subtitle" the site removed. It has
--      no place in `highlight` (which should hold only a short styled word,
--      e.g. "Meru" per the original static markup <h1>ZT Lounge <span>Meru</span></h1>).
--   2. Restore the intended highlight value "Meru" on the canonical Home Hero.
--   3. Clear any other row still carrying the redundant legacy string in highlight.
--
-- Reversible: YES (rollback at bottom)
-- Idempotent: safe to run repeatedly (WHERE filters).
-- ============================================================

BEGIN;

-- ------------------------------------------------------------------
-- 1. Remove redundant legacy text from hero_slides.highlight wherever present
-- ------------------------------------------------------------------
UPDATE hero_slides
SET highlight = ''
WHERE highlight ILIKE 'Premium Dining%'
   OR highlight ILIKE '%VIP Cabins%'
   OR highlight ILIKE '%Pool Table%'
   OR highlight ILIKE '%Lounge & Bar%'
   OR highlight ILIKE '%Auto Spa%';

-- ------------------------------------------------------------------
-- 2. Restore canonical highlight on the Home hero ("Meru" per static markup)
--     Only touches the row titled "ZT Lounge Meru" (display_order 0) —
--     the exact Hero from which the redundant text was removed.
-- ------------------------------------------------------------------
UPDATE hero_slides
SET highlight = 'Meru'
WHERE title = 'ZT Lounge Meru'
  AND display_order = 0;

COMMIT;

-- ============================================================
-- ROLLBACK (if needed)
-- ============================================================
-- UPDATE hero_slides
-- SET highlight = 'Premium Dining • VIP Cabins • Pool Table • Lounge & Bar • Events • Conference • Auto Spa'
-- WHERE title = 'ZT Lounge Meru' AND display_order = 0;
-- -- (Re-applying the redundant text is NOT recommended; listed only for completeness.)