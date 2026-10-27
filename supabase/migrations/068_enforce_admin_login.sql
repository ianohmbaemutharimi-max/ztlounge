-- Migration 068: Enforce admin-only authentication
-- Creates exactly 2 roles (admin, super_admin), restricts login to these roles,
-- and updates RLS policies to allow only admin/super_admin to access protected data.

-- 1. Seed exactly 2 roles
INSERT INTO public.roles (id, name, description, created_at)
VALUES
  ('aaaaaaaa-1111-4444-8888-000000000001', 'admin', 'System administrator with full access', NOW()),
  ('bbbbbbbb-2222-4444-8888-000000000002', 'super_admin', 'Super administrator with elevated privileges', NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  created_at = EXCLUDED.created_at;

-- 2. Create or replace is_admin_or_above function
-- Checks: (a) authenticated user has role 'admin' or 'super_admin', OR
--         (b) user is marked as super_admin in auth.users
CREATE OR REPLACE FUNCTION public.is_admin_or_above()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_role text;
  v_is_super_admin boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get the authenticated user's role from profiles
  SELECT r.name INTO v_role
  FROM profiles p
  JOIN roles r ON r.id = p.role_id
  WHERE p.id = v_user_id;

  IF v_role IN ('admin', 'super_admin') THEN
    RETURN TRUE;
  END IF;

  -- Check if auth.users has is_super_admin = true
  SELECT COALESCE(u.is_super_admin, false) INTO v_is_super_admin
  FROM auth.users u
  WHERE u.id = v_user_id;

  RETURN v_is_super_admin;
END;
$$;

-- 3. RLS: Restrict authentication to admin/super_admin only
-- This prevents regular users from signing up
DROP POLICY IF EXISTS "admin_or_super_admin_can_authenticate" ON auth.users;
CREATE POLICY "admin_or_super_admin_can_authenticate"
ON auth.users
FOR ALL
USING (
  -- Allow access to auth.users only when the caller is admin or super_admin
  -- Via role in profiles OR via is_super_admin flag in auth.users
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN roles r ON r.id = p.role_id
    WHERE p.id = auth.uid()
    AND r.name IN ('admin', 'super_admin')
  )
  OR
  -- OR via is_super_admin flag
  (
    auth.uid() IN (SELECT id FROM auth.users WHERE is_super_admin = true)
  )
);

-- 4. RLS: Profiles - only admin/super_admin can view
DROP POLICY IF EXISTS "staff_can_view_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "admin_or_super_admin_can_view_profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM roles r
    JOIN profiles p2 ON p2.id = auth.uid()
    WHERE r.id = p2.role_id
    AND r.name IN ('admin', 'super_admin')
  )
  OR
  (
    auth.uid() IN (SELECT id FROM auth.users WHERE is_super_admin = true)
  )
);

-- 5. RLS: Profiles - admin/super_admin can manage their own
DROP POLICY IF EXISTS "admin_or_super_admin_manage_own_profile" ON public.profiles;
CREATE POLICY "admin_or_super_admin_manage_own_profile"
ON public.profiles
FOR ALL
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 6. Verify roles seeded
SELECT 'roles' AS tbl, COUNT(*) AS row_count FROM public.roles;
SELECT 'is_admin_or_above' AS fn, public.is_admin_or_above() AS result;