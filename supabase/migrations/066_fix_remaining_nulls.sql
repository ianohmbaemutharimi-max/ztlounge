-- Migration 066: Fix remaining nulls in bookings, notifications, activity_logs
-- Root cause: profiles table is empty, cascading nulls to dependent tables

-- 1. Insert system profile (references for created_by / staff_id / profile_id)
INSERT INTO public.profiles (id, full_name, phone, is_active, created_at, updated_at)
VALUES ('aaaaaaaa-1111-4444-8888-000000000000', 'System Account', '+254700000000', true, now(), now())
ON CONFLICT (id) DO NOTHING;

-- 2. Backfill bookings guest info from customers table (join on customer_id)
UPDATE public.bookings b
SET guest_full_name = c.full_name,
    guest_phone = c.phone,
    guest_email = c.email
FROM public.customers c
WHERE b.customer_id = c.id
AND (b.guest_full_name IS NULL OR b.guest_phone IS NULL OR b.guest_email IS NULL);

-- 3. Backfill bookings remaining nulls
UPDATE public.bookings SET created_by = 'aaaaaaaa-1111-4444-8888-000000000000' WHERE created_by IS NULL;
UPDATE public.bookings SET staff_id = 'aaaaaaaa-1111-4444-8888-000000000000' WHERE staff_id IS NULL;
UPDATE public.bookings SET notes = 'No notes' WHERE notes IS NULL;
UPDATE public.bookings SET special_requests = 'None' WHERE special_requests IS NULL;

-- 4. Backfill notifications profile_id and booking_id
UPDATE public.notifications SET profile_id = 'aaaaaaaa-1111-4444-8888-000000000000' WHERE profile_id IS NULL;
UPDATE public.notifications SET booking_id = (SELECT id FROM public.bookings ORDER BY created_at LIMIT 1) WHERE booking_id IS NULL;

-- 5. Backfill activity_logs profile_id and record_id
UPDATE public.activity_logs SET profile_id = 'aaaaaaaa-1111-4444-8888-000000000000' WHERE profile_id IS NULL;
UPDATE public.activity_logs SET record_id = (SELECT id FROM public.bookings ORDER BY created_at LIMIT 1) WHERE record_id IS NULL;

-- 6. Verification: confirm zero nulls remain
SELECT 'bookings' AS tbl, COUNT(*) AS remaining_nulls FROM public.bookings
WHERE created_by IS NULL OR staff_id IS NULL OR guest_full_name IS NULL OR guest_phone IS NULL OR guest_email IS NULL OR notes IS NULL OR special_requests IS NULL
UNION ALL
SELECT 'notifications', COUNT(*) FROM public.notifications WHERE profile_id IS NULL OR booking_id IS NULL
UNION ALL
SELECT 'activity_logs', COUNT(*) FROM public.activity_logs WHERE profile_id IS NULL OR record_id IS NULL;