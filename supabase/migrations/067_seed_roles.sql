-- Migration 067: Seed roles table with standard roles
-- Roles needed for team_invitations.role_id FK and ACL system

INSERT INTO public.roles (id, name, description, created_at)
VALUES
  -- Admin: full system access, can manage everything
  ('00000000-0000-4000-8000-000000000001', 'admin', 'System administrator with full access', NOW()),
  -- Manager: can manage staff, view reports, manage bookings
  ('00000000-0000-4000-8000-000000000002', 'manager', 'Branch manager with staff oversight', NOW()),
  -- Staff: can manage services and customer bookings
  ('00000000-0000-4000-8000-000000000003', 'staff', 'Service provider - manages services and customer bookings', NOW()),
  -- Customer: customer account for bookings
  ('00000000-0000-4000-8000-000000000004', 'customer', 'Customer account for booking management', NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  created_at = EXCLUDED.created_at;

-- Verification: confirm roles seeded
SELECT id, name, description FROM public.roles ORDER BY id;