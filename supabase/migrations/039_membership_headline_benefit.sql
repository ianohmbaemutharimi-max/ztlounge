-- ============================================================
-- 039_membership_headline_benefit.sql
-- Adds teaser headline_benefit values copied from active benefit rows.
-- Bronze description is intentionally not changed. Display order is not
-- renumbered.
-- ============================================================

BEGIN;

ALTER TABLE public.membership_plans
    ADD COLUMN IF NOT EXISTS headline_benefit text;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.membership_plans p
        JOIN public.membership_plan_benefits b
          ON b.plan_id = p.id
         AND b.is_active = true
         AND b.description = '3% discount on selected food and beverage purchases.'
        WHERE p.slug = 'bronze' AND p.is_active = true
    ) THEN
        RAISE EXCEPTION 'HEADLINE_BENEFIT_MISSING: Bronze source benefit is missing or inactive';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.membership_plans p
        JOIN public.membership_plan_benefits b
          ON b.plan_id = p.id
         AND b.is_active = true
         AND b.description = '5% discount on selected food and beverage purchases.'
        WHERE p.slug = 'silver' AND p.is_active = true
    ) THEN
        RAISE EXCEPTION 'HEADLINE_BENEFIT_MISSING: Silver source benefit is missing or inactive';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.membership_plans p
        JOIN public.membership_plan_benefits b
          ON b.plan_id = p.id
         AND b.is_active = true
         AND b.description = '10% discount on selected food and beverage purchases.'
        WHERE p.slug = 'gold' AND p.is_active = true
    ) THEN
        RAISE EXCEPTION 'HEADLINE_BENEFIT_MISSING: Gold source benefit is missing or inactive';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.membership_plans p
        JOIN public.membership_plan_benefits b
          ON b.plan_id = p.id
         AND b.is_active = true
         AND b.description = 'Dedicated contact for reservations and bookings.'
        WHERE p.slug = 'platinum' AND p.is_active = true
    ) THEN
        RAISE EXCEPTION 'HEADLINE_BENEFIT_MISSING: Platinum source benefit is missing or inactive';
    END IF;
END
$$;

UPDATE public.membership_plans
   SET headline_benefit = CASE slug
       WHEN 'bronze' THEN '3% discount on selected food and beverage purchases.'
       WHEN 'silver' THEN '5% discount on selected food and beverage purchases.'
       WHEN 'gold' THEN '10% discount on selected food and beverage purchases.'
       WHEN 'platinum' THEN 'Dedicated contact for reservations and bookings.'
   END
 WHERE slug IN ('bronze', 'silver', 'gold', 'platinum');

-- Guard: every non-null headline must be an active benefit of the same plan.
DO $$
DECLARE
    invalid_count integer;
BEGIN
    SELECT count(*) INTO invalid_count
      FROM public.membership_plans p
     WHERE p.headline_benefit IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
             FROM public.membership_plan_benefits b
            WHERE b.plan_id = p.id
              AND b.is_active = true
              AND b.description = p.headline_benefit
       );
    IF invalid_count <> 0 THEN
        RAISE EXCEPTION 'HEADLINE_NOT_AN_ACTIVE_PLAN_BENEFIT: % invalid headline(s)', invalid_count;
    END IF;
END
$$;

-- Guard: Platinum must not repeat Gold's headline.
DO $$
DECLARE
    gold_headline text;
    platinum_headline text;
BEGIN
    SELECT headline_benefit INTO gold_headline
      FROM public.membership_plans WHERE slug = 'gold';
    SELECT headline_benefit INTO platinum_headline
      FROM public.membership_plans WHERE slug = 'platinum';
    IF gold_headline IS NULL OR platinum_headline IS NULL THEN
        RAISE EXCEPTION 'HEADLINE_TIER_MISSING: Gold or Platinum plan is missing';
    END IF;
    IF gold_headline = platinum_headline THEN
        RAISE EXCEPTION 'HEADLINE_TIER_DUPLICATE: Platinum repeats Gold headline';
    END IF;
END
$$;

COMMIT;
