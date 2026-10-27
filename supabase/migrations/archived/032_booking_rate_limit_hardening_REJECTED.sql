-- ZT Lounge Hardening Migration: Booking Rate Limit Hardening
-- Date: 2026-08-06
-- Purpose: Strengthen public booking spam protection for anonymous users

-- ============================================================
-- ANALYSIS OF CURRENT STATE
-- ============================================================
-- Current function: prevent_public_booking_spam
-- - Uses customer_id for rate limiting (CORRECT)
-- - Works for anon users because create_booking RPC sets customer_id before INSERT
-- - Limit: 3 bookings per 60 minutes per customer
--
-- Issue: For truly anonymous users (no auth), the rate limit is based solely
-- on customer_id. While this works, it can be circumvented by using different
-- phone numbers. We add IP-based rate limiting as an additional layer.
--
-- IMPORTANT: We do NOT modify create_booking RPC or booking schema.
-- ============================================================

-- ============================================================
-- STEP 1: Add ip_address column to bookings (nullable)
-- ============================================================
-- This allows tracking the IP address of public bookings for rate limiting.
-- The column is nullable to avoid breaking existing bookings.

ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS ip_address INET;

-- Add index for IP-based queries
CREATE INDEX IF NOT EXISTS idx_bookings_ip_address 
  ON bookings(ip_address) 
  WHERE ip_address IS NOT NULL;

-- ============================================================
-- STEP 2: Replace prevent_public_booking_spam function
-- ============================================================
-- Enhanced version that:
-- - Uses customer_id as primary identifier (existing behavior)
-- - Adds IP address as secondary identifier for anon users
-- - Limits: 3 per 60 min per customer_id OR 5 per 60 min per IP
-- - Preserves SECURITY DEFINER
-- - Does NOT break admin/staff booking flow

CREATE OR REPLACE FUNCTION prevent_public_booking_spam()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id uuid;
  v_customer_count integer;
  v_ip_count integer;
  v_client_ip inet;
BEGIN
  -- Only rate-limit the public self-booking path (unassigned bookings)
  -- Staff-created bookings (staff_id IS NOT NULL) are never limited here
  IF NEW.staff_id IS NULL THEN
    
    -- Primary check: customer_id-based rate limiting
    -- This is the main identifier returned by create_booking RPC
    v_customer_id := NEW.customer_id;
    
    IF v_customer_id IS NOT NULL THEN
      SELECT count(*) INTO v_customer_count
      FROM bookings
      WHERE customer_id = v_customer_id
        AND created_at > now() - interval '60 minutes'
        AND status <> 'cancelled';
      
      IF v_customer_count >= 3 THEN
        RAISE EXCEPTION 'Too many booking requests from this phone number. Please wait 60 minutes or contact us directly.'
          USING ERRCODE = 'P0001';
      END IF;
    END IF;
    
    -- Secondary check: IP-based rate limiting (for anon users)
    -- This catches users trying to circumvent customer_id limits
    -- by using different phone numbers from the same IP
    IF NEW.ip_address IS NOT NULL THEN
      v_client_ip := NEW.ip_address;
      
      SELECT count(*) INTO v_ip_count
      FROM bookings
      WHERE ip_address = v_client_ip
        AND created_at > now() - interval '60 minutes'
        AND status <> 'cancelled'
        AND staff_id IS NULL;  -- Only count public bookings
      
      IF v_ip_count >= 5 THEN
        RAISE EXCEPTION 'Too many booking requests from this location. Please wait 60 minutes or contact us directly.'
          USING ERRCODE = 'P0001';
      END IF;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 3: Add helper function to get client IP
-- ============================================================
-- This function extracts the client IP from Supabase's connection
-- It can be called from the application layer to set ip_address

CREATE OR REPLACE FUNCTION get_client_ip()
RETURNS INET AS $$
BEGIN
  -- Supabase sets this automatically for anon requests
  -- For authenticated users, it returns the authenticated IP
  RETURN COALESCE(
    inet_client_addr(),
    inet_server_addr()
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- STEP 4: Grant permissions
-- ============================================================
-- Allow anon and authenticated users to call get_client_ip
GRANT EXECUTE ON FUNCTION get_client_ip() TO anon, authenticated;

-- ============================================================
-- STEP 5: Add comment for documentation
-- ============================================================
COMMENT ON FUNCTION prevent_public_booking_spam() IS 
  'Rate limits public bookings (staff_id IS NULL). 
   Limits: 3 per 60 min per customer_id, 5 per 60 min per IP.
   Skips admin/staff bookings (staff_id IS NOT NULL).';

COMMENT ON COLUMN bookings.ip_address IS 
  'IP address of the client who created the booking. Used for rate limiting public bookings.';

-- ============================================================
-- VERIFICATION QUERIES (Run manually to verify)
-- ============================================================
-- 1. Check function was updated:
--    SELECT proname, prosrc FROM pg_proc WHERE proname = 'prevent_public_booking_spam';
--
-- 2. Check trigger is still attached:
--    SELECT tgname FROM pg_trigger WHERE tgrelid = 'bookings'::regclass AND tgname = 'trg_prevent_public_booking_spam';
--
-- 3. Check column was added:
--    SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'ip_address';
--
-- ============================================================
-- ROLLBACK (Run if issues occur)
-- ============================================================
-- To rollback this migration:
--
-- -- Remove the IP address column
-- ALTER TABLE bookings DROP COLUMN IF EXISTS ip_address;
-- DROP INDEX IF EXISTS idx_bookings_ip_address;
--
-- -- Restore original function
-- CREATE OR REPLACE FUNCTION prevent_public_booking_spam()
-- RETURNS TRIGGER AS $$
-- DECLARE
--   recent_count integer;
-- BEGIN
--   IF NEW.staff_id IS NULL THEN
--     SELECT count(*) INTO recent_count
--     FROM public.bookings
--     WHERE customer_id = NEW.customer_id
--       AND created_at > now() - interval '60 minutes';
--
--     IF recent_count >= 3 THEN
--       RAISE EXCEPTION 'Too many booking requests submitted recently. Please wait a while or contact us directly.'
--         USING ERRCODE = 'P0001';
--     END IF;
--   END IF;
--
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
--
-- -- Remove helper function
-- DROP FUNCTION IF EXISTS get_client_ip();
--
-- -- Remove comments
-- COMMENT ON FUNCTION prevent_public_booking_spam() IS NULL;
-- COMMENT ON COLUMN bookings.ip_address IS NULL;