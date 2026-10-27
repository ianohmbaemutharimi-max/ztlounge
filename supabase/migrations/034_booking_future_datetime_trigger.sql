-- ============================================================
-- 034 — BOOKING TEMPORAL VALIDATION (server-authoritative)
-- ============================================================
-- BUSINESS INVARIANT (mandatory):
--   No booking may be accepted for a date/time already in the past.
--
-- Canonical business timezone: Africa/Nairobi (Kenya, UTC+3, no DST).
-- The comparison converts the COMBINED requested instant
--   booking_date + start_time            -> timestamp (Nairobi wall time)
--   ... AT TIME ZONE 'Africa/Nairobi'    -> timestamptz (absolute instant)
-- against now() (timestamptz, transaction start). Both sides are
-- absolute instants, so no UTC/local mismatch is possible and the
-- check never depends on the session TimeZone setting.
--
-- ERROR CONTRACT:
--   Past datetime  -> ERRA 'PAST_DATETIME: ...' (this trigger)
--   Occupied slot  -> existing conflict protection UNCHANGED
--                     (create_booking RPC availability check +
--                      idx_bookings_unique_customer_date, migration 031).
-- Temporal rejections are NEVER reported as booking conflicts:
-- the message text and the CONSTRAINT name are distinct.
--
-- SCOPE: fires for EVERY insert path (public create_booking RPC,
-- admin API, manual SQL) — the invariant has no client-side bypass.
-- UPDATEs are only checked when booking_date/start_time actually
-- change, so status transitions on historical rows keep working.
--
-- Rollback:
--   DROP TRIGGER IF EXISTS bookings_future_datetime_guard ON bookings;
--   DROP FUNCTION IF EXISTS zt_enforce_future_booking_datetime();
-- ============================================================

CREATE OR REPLACE FUNCTION zt_enforce_future_booking_datetime()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Structural NOT NULL constraints own missing-value cases.
  IF NEW.booking_date IS NULL OR NEW.start_time IS NULL THEN
    RETURN NEW;
  END IF;

  -- Combined instant in the canonical business timezone vs server now().
  IF ((NEW.booking_date + NEW.start_time) AT TIME ZONE 'Africa/Nairobi')
       <= now()
  THEN
    RAISE EXCEPTION
      'PAST_DATETIME: The selected date and time has already passed. Please choose a future time.'
      USING ERRCODE = 'P0001',
            CONSTRAINT = 'bookings_future_datetime_guard',
            DETAIL = format(
              'requested %s %s (Africa/Nairobi) <= server time',
              NEW.booking_date, NEW.start_time
            );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_future_datetime_guard ON bookings;

CREATE TRIGGER bookings_future_datetime_guard
BEFORE INSERT OR UPDATE OF booking_date, start_time
ON bookings
FOR EACH ROW
EXECUTE FUNCTION zt_enforce_future_booking_datetime();

-- ============================================================
-- VERIFICATION QUERIES (run manually after applying; READ-ONLY checks
-- of trigger presence — do NOT insert test rows in production):
--
-- Trigger exists:
--   SELECT tgname FROM pg_trigger
--   WHERE tgrelid = 'bookings'::regclass AND tgname = 'bookings_future_datetime_guard';
--
-- Function source present:
--   SELECT prosrc FROM pg_proc WHERE proname = 'zt_enforce_future_booking_datetime';
--
-- Behaviour matrix (execute ONLY inside a transaction you ROLL BACK):
--   BEGIN;
--     -- yesterday -> expect PAST_DATETIME error
--     INSERT INTO bookings (booking_number, customer_id, service_id, booking_date,
--                           start_time, end_time, guests, status)
--     VALUES ('ZT-TEST000', NULL, NULL, CURRENT_DATE - 1, '09:00', '10:00', 2, 'pending');
--   ROLLBACK;
--   BEGIN;
--     -- today + past time -> expect PAST_DATETIME error
--     INSERT INTO bookings (booking_number, customer_id, service_id, booking_date,
--                           start_time, end_time, guests, status)
--     VALUES ('ZT-TEST001', NULL, NULL, (now() AT TIME ZONE 'Africa/Nairobi')::date,
--             '00:01', '01:00', 2, 'pending');
--   ROLLBACK;
--   BEGIN;
--     -- today + future time / tomorrow -> expect INSERT to proceed to other
--     -- constraints (FK/NOT NULL), i.e. NO PAST_DATETIME error
--   ROLLBACK;
-- ============================================================
