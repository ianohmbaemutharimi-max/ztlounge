-- ============================================================
-- 039_041_membership_headline_benefit_squashed.sql
-- REVIEW ONLY — DO NOT APPLY TO PRODUCTION OR STAGING.
--
-- This is the proposed production migration that combines the
-- original 039 headline-text seed and 041 same-plan benefit FK.
-- The production rollout should use this single reviewed file,
-- while staging continues to exercise 039 then 041.
-- ============================================================

BEGIN;

ALTER TABLE public.membership_plans
    ADD COLUMN IF NOT EXISTS headline_benefit text;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM public.membership_plans p
          JOIN public.membership_plan_benefits b
            ON b.plan_id = p.id
           AND b.is_active = true
           AND b.description = '3% discount on selected food and beverage purchases.'
         WHERE p.slug = 'bronze' AND p.is_active = true
    ) THEN
        RAISE EXCEPTION 'HEADLINE_BENEFIT_MISSING: Bronze source benefit is missing or inactive';
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM public.membership_plans p
          JOIN public.membership_plan_benefits b
            ON b.plan_id = p.id
           AND b.is_active = true
           AND b.description = '5% discount on selected food and beverage purchases.'
         WHERE p.slug = 'silver' AND p.is_active = true
    ) THEN
        RAISE EXCEPTION 'HEADLINE_BENEFIT_MISSING: Silver source benefit is missing or inactive';
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM public.membership_plans p
          JOIN public.membership_plan_benefits b
            ON b.plan_id = p.id
           AND b.is_active = true
           AND b.description = '10% discount on selected food and beverage purchases.'
         WHERE p.slug = 'gold' AND p.is_active = true
    ) THEN
        RAISE EXCEPTION 'HEADLINE_BENEFIT_MISSING: Gold source benefit is missing or inactive';
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM public.membership_plans p
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

    IF EXISTS (
        SELECT 1
          FROM public.membership_plans p
          JOIN public.membership_plans other ON other.slug = 'gold'
         WHERE p.slug = 'platinum'
           AND p.headline_benefit = other.headline_benefit
    ) THEN
        RAISE EXCEPTION 'HEADLINE_TIER_DUPLICATE: Platinum repeats Gold headline';
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conrelid = 'public.membership_plan_benefits'::regclass
           AND conname = 'membership_plan_benefits_id_plan_id_key'
    ) THEN
        ALTER TABLE public.membership_plan_benefits
            ADD CONSTRAINT membership_plan_benefits_id_plan_id_key
            UNIQUE (id, plan_id);
    END IF;
END
$$;

ALTER TABLE public.membership_plans
    ADD COLUMN IF NOT EXISTS headline_benefit_id uuid;

UPDATE public.membership_plans p
   SET headline_benefit_id = b.id
  FROM public.membership_plan_benefits b
 WHERE b.plan_id = p.id
   AND b.is_active = true
   AND b.description = p.headline_benefit;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conrelid = 'public.membership_plans'::regclass
           AND conname = 'membership_plans_headline_benefit_fk'
    ) THEN
        ALTER TABLE public.membership_plans
            ADD CONSTRAINT membership_plans_headline_benefit_fk
            FOREIGN KEY (headline_benefit_id, id)
            REFERENCES public.membership_plan_benefits(id, plan_id)
            ON UPDATE CASCADE
            ON DELETE SET NULL (headline_benefit_id);
    END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.guard_membership_headline_deactivation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.is_active = true AND NEW.is_active = false
       AND EXISTS (
           SELECT 1 FROM public.membership_plans p
            WHERE p.headline_benefit_id = NEW.id
       ) THEN
        RAISE EXCEPTION
            'HEADLINE_BENEFIT_REQUIRED: benefit % is the selected headline for a membership plan',
            NEW.id;
    END IF;
    RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_guard_membership_headline_deactivation
    ON public.membership_plan_benefits;

CREATE TRIGGER trg_guard_membership_headline_deactivation
    BEFORE UPDATE OF is_active ON public.membership_plan_benefits
    FOR EACH ROW
    EXECUTE FUNCTION public.guard_membership_headline_deactivation();

ALTER TABLE public.membership_plans
    DROP COLUMN IF EXISTS headline_benefit;

COMMIT;
