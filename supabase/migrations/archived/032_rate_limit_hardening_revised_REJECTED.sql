-- ZT Lounge Hardening Migration: Rate Limit Hardening (REVISED)
-- Date: 2026-08-06
-- Purpose: Verified hardening after review of migration 032
--
-- KEY FINDING: inet_client_addr() returns the Supabase PROXY IP,
-- NOT the browser visitor IP. Verified live: returned 2a05:d018:...
-- (MCP infrastructure address). Therefore get_client_ip() inside
-- PostgreSQL is USELESS and DANGEROUS — all users would share the
-- same IP and collectively hit the IP limit, blocking real customers.
--
-- DECISION: Keep the existing customer_id-based rate limiting (WORKING).
-- Do NOT add IP-based rate limiting without a proper server layer.
-- This migration only adds an optional ip_address column for a FUTURE
-- server-layer implementation (Edge Function / Next.js API route).

-- ============================================================
-- STEP 1: Add ip_address column (nullable, optional)
-- ============================================================
-- Purpose: Future-proofing. When a server layer is added, it can
-- populate this column with the REAL visitor IP from x-forwarded-for.
-- No trigger or function sets this automatically.
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS ip_address INET;

COMMENT ON COLUMN bookings.ip_address IS 
  'Optional: real visitor IP set by a server-side layer (Edge Function/API route). Do NOT use inet_client_addr().';

-- ============================================================
-- STEP 2: Confirm existing trigger is healthy (no change)
-- ============================================================
-- The existing prevent_public_booking_spam function already works:
-- - Uses customer_id (set by create_booking RPC before INSERT fires)
-- - Counts bookings in last 60 min excluding cancelled
-- - Blocks at >= 3 per customer_id
-- - Skips staff bookings (staff_id IS NOT NULL)
-- VERIFIED LIVE: function source confirms correct logic.
-- No change required.

-- ============================================================
-- STEP 3: Document the correct IP architecture for the future
-- ============================================================
-- Browser/client
--   ↓
-- Next.js server / Edge Function
--   ↓ extracts real IP from x-forwarded-for header
--   ↓
-- create_booking RPC (p_ip_address parameter, future)
--   ↓
-- bookings.ip_address
--
-- Note: The public site is currently static HTML/JS calling Supabase
-- directly. There is NO server layer. Adding IP-based rate limiting
-- requires EITHER:
--   A) A Supabase Edge Function proxy for booking submissions
--   B) Client-side anti-bot (Cloudflare Turnstile) + existing
--      customer_id rate limiting (recommended, simpler)

-- ============================================================
-- VERIFICATION
-- ============================================================
-- 1. Column added:
--    SELECT column_name, data_type FROM information_schema.columns
--    WHERE table_name = 'bookings' AND column_name = 'ip_address';
--
-- 2. Existing trigger healthy:
--    SELECT tgname FROM pg_trigger WHERE tgrelid = 'bookings'::regclass
--    AND tgname = 'trg_prevent_public_booking_spam';
--
-- 3. Existing function healthy:
--    SELECT prosrc FROM pg_proc WHERE proname = 'prevent_public_booking_spam';

-- ============================================================
-- ROLLBACK
-- ============================================================
-- ALTER TABLE bookings DROP COLUMN IF EXISTS ip_address;