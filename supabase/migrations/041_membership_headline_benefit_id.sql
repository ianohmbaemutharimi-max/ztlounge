-- ============================================================
-- 041_membership_headline_benefit_id.sql
-- Staging-only migration. Replaces headline_benefit text with a
-- reference to a benefit belonging to the same plan.
--
-- This migration follows 039 on staging. It is not intended to be
-- applied to production as a separate migration; the production
-- release will use the reviewed 039+041 squash.
-- ============================================================

BEGIN;

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

DO $$
DECLARE
    unmatched integer;
    ambiguous integer;
BEGIN
    SELECT count(*) INTO unmatched
      FROM public.membership_plans p
     WHERE p.headline_benefit IS NOT NULL
       AND NOT EXISTS (
           SELECT 1 FROM public.membership_plan_benefits b
            WHERE b.plan_id = p.id
              AND b.is_active = true
              AND b.description = p.headline_benefit
       );

    SELECT count(*) INTO ambiguous
      FROM (
          SELECT p.id
            FROM public.membership_plans p
            JOIN public.membership_plan_benefits b
              ON b.plan_id = p.id
             AND b.is_active = true
             AND b.description = p.headline_benefit
           GROUP BY p.id
          HAVING count(*) <> 1
      ) duplicates;

    IF unmatched > 0 OR ambiguous > 0 THEN
        RAISE EXCEPTION 'HEADLINE_BACKFILL_FAILED: unmatched=%, ambiguous=%', unmatched, ambiguous;
    END IF;
END
$$;

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
