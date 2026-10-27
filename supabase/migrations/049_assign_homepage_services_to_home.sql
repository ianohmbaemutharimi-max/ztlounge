-- ============================================================
-- 049_assign_homepage_services_to_grooming_care.sql
-- Phase 2C: Assign the 6 homepage navigation services to grooming-care page.
-- 
-- CONTEXT:
--   The public homepage (/) renders 6 active service cards (navigation cards
--   with href values). Auto Spa already belongs to grooming-care page, and
--   the other 5 are currently orphaned (page_id = NULL). This migration 
--   assigns all 6 to the grooming-care page for consolidated ownership.
--
-- SERVICES TO ASSIGN (by slug):
--   1. auto-spa          → Auto Spa (already page_id = grooming-care)
--   2. restaurant        → Restaurant (currently NULL)
--   3. lounge            → Lounge & Bar (currently NULL)
--   4. vip               → VIP Cabins (currently NULL)
--   5. conference        → Conference (currently NULL)
--   6. events            → Events (currently NULL)
--
-- NOTE: 
--   "Gallery" is NOT a navigation card on the homepage (no href).
--
-- RATIONALE:
--   Grouping all homepage navigation cards under grooming-care page
--   creates a single admin view for homepage service management.
--
-- SAFETY:
--   - Uses slug (the canonical service identifier) for matching
--   - Idempotent: safe to run multiple times
--   - Transaction-wrapped for atomicity
-- ============================================================

BEGIN;

-- Assign the 6 homepage navigation services to the grooming-care page
UPDATE public.services
SET page_id = (SELECT id FROM public.website_pages WHERE page_key = 'grooming-care')
WHERE slug IN (
    'auto-spa',
    'restaurant',
    'lounge',
    'vip',
    'conference',
    'events'
)
AND type = 'service'
AND href IS NOT NULL;

COMMIT;
