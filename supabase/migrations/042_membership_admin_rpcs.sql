-- ============================================================
-- 042_membership_admin_rpcs.sql
-- Staging-only migration. SECURITY INVOKER keeps the existing membership
-- RLS policies as the authorization boundary.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.reorder_membership_plans(
    ordered_plan_ids uuid[]
)
RETURNS SETOF public.membership_plans
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    expected_count integer;
BEGIN
    IF NOT public.is_admin_or_above() THEN
        RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
    END IF;

    IF ordered_plan_ids IS NULL
       OR array_length(ordered_plan_ids, 1) IS NULL THEN
        RAISE EXCEPTION 'REORDER_EMPTY';
    END IF;

    SELECT count(*) INTO expected_count
      FROM public.membership_plans;

    IF expected_count <> array_length(ordered_plan_ids, 1)
       OR EXISTS (
           SELECT 1
             FROM unnest(ordered_plan_ids) AS requested(id)
            GROUP BY requested.id
           HAVING count(*) > 1
       )
       OR EXISTS (
           SELECT id
             FROM public.membership_plans
            WHERE id NOT IN (SELECT unnest(ordered_plan_ids))
       ) THEN
        RAISE EXCEPTION 'REORDER_ID_SET_MISMATCH';
    END IF;

    UPDATE public.membership_plans p
       SET display_order = requested.position - 1,
           updated_by = (
               SELECT id
                 FROM public.profiles
                WHERE user_id = auth.uid()
           )
      FROM unnest(ordered_plan_ids)
           WITH ORDINALITY AS requested(id, position)
     WHERE p.id = requested.id;

    RETURN QUERY
        SELECT *
          FROM public.membership_plans
         ORDER BY display_order ASC, id ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_membership_registration_fee(
    fee numeric,
    expected_updated_at jsonb
)
RETURNS SETOF public.membership_plans
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    plan_row public.membership_plans%ROWTYPE;
BEGIN
    IF NOT public.is_admin_or_above() THEN
        RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
    END IF;

    IF fee IS NULL OR fee < 0 THEN
        RAISE EXCEPTION 'REGISTRATION_FEE_INVALID';
    END IF;

    FOR plan_row IN
        SELECT *
          FROM public.membership_plans
         ORDER BY display_order ASC, id ASC
    LOOP
        IF (expected_updated_at ->> plan_row.id::text)::timestamptz
           IS DISTINCT FROM plan_row.updated_at THEN
            RAISE EXCEPTION 'CONCURRENT_MEMBERSHIP_UPDATE:%', plan_row.id;
        END IF;
    END LOOP;

    UPDATE public.membership_plans
       SET registration_fee = fee,
           updated_by = (
               SELECT id
                 FROM public.profiles
                WHERE user_id = auth.uid()
           )
     WHERE true;

    RETURN QUERY
        SELECT *
          FROM public.membership_plans
         ORDER BY display_order ASC, id ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.reorder_membership_plans(uuid[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_membership_registration_fee(numeric, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reorder_membership_plans(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_membership_registration_fee(numeric, jsonb) TO authenticated;

COMMIT;
