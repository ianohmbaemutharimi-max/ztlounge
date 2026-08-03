-- ============================================================
-- ZT Lounge CMS Cleanup Migration
-- Migration: 028_cleanup_test_data
-- ============================================================
-- Removes leftover test/demo data confirmed safe to delete:
--   1. service_categories "Hair Styling" (0 services reference it)
--   2. customers "Mary Customer" (0 bookings reference it)
--   3. contact_messages "Test User" (test row)
-- RLS remains intact (no policy changes).
-- ============================================================

BEGIN;

-- 1. Remove orphaned "Hair Styling" service category
-- (verified: 0 services reference category_id = this row)
DELETE FROM service_categories
WHERE slug = 'hair-styling';

-- 2. Remove fake test customer "Mary Customer"
-- (verified: 0 bookings reference this customer)
DELETE FROM customers
WHERE full_name = 'Mary Customer';

-- 3. Remove test contact message
DELETE FROM contact_messages
WHERE full_name = 'Test User'
   OR email = 'test@example.com';

COMMIT;