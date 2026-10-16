-- ============================================================
-- 040_membership_revoke_excess_grants.sql
-- Remove only excess DDL privileges from public roles.
-- RLS remains the authorization boundary for SELECT/INSERT/UPDATE/DELETE.
-- ============================================================

BEGIN;

REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.membership_plans FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.membership_plan_benefits FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.customer_memberships FROM anon, authenticated;

COMMIT;
