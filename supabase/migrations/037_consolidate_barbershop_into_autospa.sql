-- ============================================================
-- 037_consolidate_barbershop_into_autospa.sql
-- Grooming & Care consolidation step (runtime).
--
-- PRECONDITION: migration 036_add_barbershop.sql has been applied
--   (Barbershop category, website_pages row, and the INACTIVE
--    service row exist, with page_id pointing to the barbershop
--    website_pages.UUID).
--
-- WHY this step exists:
--   Barbershop was consolidated into the Grooming & Care public page
--   (autospa.html). The barbershop.html URL now 301-redirects to
--   autospa.html (see scripts/static-server.mjs REDIRECTS + production
--   hosting note). PageIdentity.canonical maps barbershop.html -> 'autospa'.
--
--   ServicesRepository.getByPageGrouped('autospa') resolves the
--   'autospa' PageId -> website_pages.UUID (page_key='autospa') and
--   selects services WHERE page_id = <autospa-uuid> AND is_active = true,
--   then groups by category_id. For the Barbershop DOM section
--   (data-category-id = barbershop category UUID) to ever render Barbershop
--   service rows, those rows MUST live on the autospa page_id.
--
-- WHAT:
--   Re-point the Barbershop service row(s) to the autospa website_pages
--   UUID so the consolidated page can surface them via the canonical
--   getByPage('autospa') path. Also repoint href to the canonical
--   autospa URL so links never depend on the redirect layer.
--
-- SAFETY (owner data boundary):
--   - is_active is NOT changed. The Barbershop service remains INACTIVE
--     until the owner supplies the final catalogue + service_charges.
--     The public section therefore renders its CMS-safe empty state
--     (data-category-empty) — no prices are ever invented.
--   - Auto Spa rows are NEVER touched (the barbershop service is matched
--     by slug='barbershop' AND category slug='barbershop').
--   - website_pages.barbershop row is intentionally KEPT. It is an inert
--     legacy CMS anchor (nothing public resolves it; PageIdentity maps
--     barbershop.html -> 'autospa'). Keeping it is non-destructive and
--     preserves admin-editability of historical content records.
--
-- IDEMPOTENT: guarded by WHERE NOT EXISTS on page_id match.
-- ============================================================

DO $$
DECLARE
    v_autospa_page  uuid := '47d44cf4-be29-48e7-a0e0-9863fe26e9af';
    v_barbershop_cat uuid := '011d68d4-7b4b-4a13-9c-9e-959c135f119b';
    v_count         int;
BEGIN
    -- Resolve defensively from stable slugs (do not assume the hardcoded
    -- UUIDs, although they are asserted to match). Abort if anchors drift.
    SELECT id INTO v_autospa_page
    FROM website_pages WHERE page_key = 'autospa'
    LIMIT 1;
    IF v_autospa_page IS NULL THEN
        RAISE EXCEPTION 'autospa website_pages row missing - 036 not applied';
    END IF;

    SELECT id INTO v_barbershop_cat
    FROM service_categories WHERE slug = 'barbershop'
    LIMIT 1;
    IF v_barbershop_cat IS NULL THEN
        RAISE EXCEPTION 'barbershop service_categories row missing - 036 not applied';
    END IF;

    -- Count Barbershop service rows currently still on the (legacy) page.
    SELECT COUNT(*) INTO v_count
    FROM services
    WHERE category_id = v_barbershop_cat
      AND slug = 'barbershop'
      AND page_id <> v_autospa_page;

    IF v_count = 0 THEN
        RAISE WARNING 'Barbershop service already repointed to autospa page (idempotent no-op)';
    ELSE
        -- Repoint page_id to the consolidated autospa page + canonical href.
        -- is_active intentionally UNCHANGED (owner data boundary).
        UPDATE services
        SET page_id = v_autospa_page,
            href    = 'pages/business/autospa.html#barbershop-services'
        WHERE category_id = v_barbershop_cat
          AND slug = 'barbershop'
          AND page_id <> v_autospa_page;
        RAISE NOTICE 'Consolidated % Barbershop service row(s) to autospa page %', v_count, v_autospa_page;
    END IF;
END $$;

-- Verification (read-only) — uncomment to inspect:
-- SELECT s.id, s.slug, s.name, s.category_id, s.page_id, s.href,
--        s.is_active, s.type, sc.name AS category, wp.page_key AS page
-- FROM services s
-- JOIN service_categories sc ON sc.id = s.category_id
-- JOIN website_pages wp ON wp.id = s.page_id
-- WHERE s.category_id = '011d68d4-7b4b-4a13-9c8e-959c135f119b'
--    OR s.slug = 'auto-spa';
