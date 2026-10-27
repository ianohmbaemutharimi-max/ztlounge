-- ============================================================
-- 038_membership_baseline.sql
-- Baseline capture for membership tables created out-of-band.
-- Additive/idempotent; does not recreate is_admin_or_above().
-- ============================================================

BEGIN;

-- Guard pre-existing dependencies before creating baseline objects.
DO $$
BEGIN
    IF to_regclass('public.profiles') IS NULL THEN
        RAISE EXCEPTION 'BASELINE_DEPENDENCY_MISSING: public.profiles does not exist';
    END IF;
    IF to_regclass('public.customers') IS NULL THEN
        RAISE EXCEPTION 'BASELINE_DEPENDENCY_MISSING: public.customers does not exist';
    END IF;
    IF to_regclass('public.media_assets') IS NULL THEN
        RAISE EXCEPTION 'BASELINE_DEPENDENCY_MISSING: public.media_assets does not exist';
    END IF;
    IF to_regprocedure('public.current_role()') IS NULL THEN
        RAISE EXCEPTION 'BASELINE_DEPENDENCY_MISSING: public.current_role() does not exist';
    END IF;
    IF to_regprocedure('public.is_admin_or_above()') IS NULL THEN
        RAISE EXCEPTION 'BASELINE_DEPENDENCY_MISSING: public.is_admin_or_above() does not exist';
    END IF;
END
$$;

CREATE SEQUENCE IF NOT EXISTS public.membership_member_number_seq
    START WITH 1
    INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS public.membership_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text NULL,
    annual_price numeric(12,2) NOT NULL CHECK (annual_price >= 0),
    registration_fee numeric(12,2) NOT NULL DEFAULT 0 CHECK (registration_fee >= 0),
    media_id uuid NULL REFERENCES public.media_assets(id) ON DELETE SET NULL,
    display_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    cta_text text NULL,
    cta_link text NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.membership_plan_benefits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid NOT NULL REFERENCES public.membership_plans(id) ON DELETE CASCADE,
    description text NOT NULL CHECK (length(btrim(description)) > 0),
    display_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_memberships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    plan_id uuid NOT NULL REFERENCES public.membership_plans(id) ON DELETE RESTRICT,
    member_number text NOT NULL UNIQUE
        DEFAULT ('ZT-M-' || lpad(nextval('public.membership_member_number_seq')::text, 5, '0')),
    status text NOT NULL DEFAULT 'active'
        CHECK (status = ANY (ARRAY['pending','active','expired','cancelled'])),
    registered_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    annual_price_snapshot numeric(12,2) NOT NULL CHECK (annual_price_snapshot >= 0),
    registration_fee_snapshot numeric(12,2) NOT NULL CHECK (registration_fee_snapshot >= 0),
    notes text NULL,
    created_by uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER SEQUENCE public.membership_member_number_seq OWNED BY public.customer_memberships.member_number;

CREATE INDEX IF NOT EXISTS idx_membership_plans_display_order ON public.membership_plans(display_order);
CREATE INDEX IF NOT EXISTS idx_membership_plans_is_active ON public.membership_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_membership_plan_benefits_plan_id ON public.membership_plan_benefits(plan_id);
CREATE INDEX IF NOT EXISTS idx_membership_plan_benefits_order ON public.membership_plan_benefits(plan_id, display_order);
CREATE INDEX IF NOT EXISTS idx_customer_memberships_customer_id ON public.customer_memberships(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_memberships_plan_id ON public.customer_memberships(plan_id);
CREATE INDEX IF NOT EXISTS idx_customer_memberships_status ON public.customer_memberships(status);

CREATE OR REPLACE FUNCTION public.update_membership_domain_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_membership_plans_updated_at ON public.membership_plans;
CREATE TRIGGER trg_membership_plans_updated_at BEFORE UPDATE ON public.membership_plans FOR EACH ROW EXECUTE FUNCTION public.update_membership_domain_updated_at();
DROP TRIGGER IF EXISTS trg_membership_plan_benefits_updated_at ON public.membership_plan_benefits;
CREATE TRIGGER trg_membership_plan_benefits_updated_at BEFORE UPDATE ON public.membership_plan_benefits FOR EACH ROW EXECUTE FUNCTION public.update_membership_domain_updated_at();
DROP TRIGGER IF EXISTS trg_customer_memberships_updated_at ON public.customer_memberships;
CREATE TRIGGER trg_customer_memberships_updated_at BEFORE UPDATE ON public.customer_memberships FOR EACH ROW EXECUTE FUNCTION public.update_membership_domain_updated_at();

ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_plan_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS membership_plans_public_read ON public.membership_plans;
CREATE POLICY membership_plans_public_read ON public.membership_plans FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS membership_plans_admin_manage ON public.membership_plans;
CREATE POLICY membership_plans_admin_manage ON public.membership_plans FOR ALL USING (public.is_admin_or_above()) WITH CHECK (public.is_admin_or_above());
DROP POLICY IF EXISTS membership_plan_benefits_public_read ON public.membership_plan_benefits;
CREATE POLICY membership_plan_benefits_public_read ON public.membership_plan_benefits FOR SELECT USING (is_active = true AND EXISTS (SELECT 1 FROM public.membership_plans p WHERE p.id = membership_plan_benefits.plan_id AND p.is_active = true));
DROP POLICY IF EXISTS membership_plan_benefits_admin_manage ON public.membership_plan_benefits;
CREATE POLICY membership_plan_benefits_admin_manage ON public.membership_plan_benefits FOR ALL USING (public.is_admin_or_above()) WITH CHECK (public.is_admin_or_above());
DROP POLICY IF EXISTS customer_memberships_admin_manage ON public.customer_memberships;
CREATE POLICY customer_memberships_admin_manage ON public.customer_memberships FOR ALL USING (public.is_admin_or_above()) WITH CHECK (public.is_admin_or_above());

COMMIT;
