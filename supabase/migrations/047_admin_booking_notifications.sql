-- 047 — ADMIN BOOKING NOTIFICATIONS
-- =================================================
-- When a new booking is created, automatically notify all active admins.
-- This ensures that admin dashboard users see new bookings in real-time.
--
-- SCOPE:
--   - Fires for EVERY booking insert (public RPC + admin API)
--   - Creates a notification row for each admin with role 'admin' or 'super_admin'
--   - Notification includes booking details for quick context

CREATE OR REPLACE FUNCTION public.notify_admins_on_new_booking()
RETURNS TRIGGER AS $$
DECLARE
  admin_profile RECORD;
  booking_display_text TEXT;
BEGIN
  -- Build a human-readable notification message
  booking_display_text := COALESCE(
    (SELECT CONCAT(
      COALESCE(c.guest_name, c.full_name, 'Guest'),
      ' • ',
      COALESCE(c.phone, 'No phone'),
      ' • ',
      COALESCE(s.name, 'Service'),
      ' • ',
      TO_CHAR(NEW.booking_date, 'DD MMM YYYY'),
      ' at ',
      TO_CHAR(NEW.start_time::time, 'HH12:MI AM'),
      ' • ',
      NEW.guests,
      ' guest',
      CASE WHEN NEW.guests != 1 THEN 's' ELSE '' END,
      ' • status: ',
      NEW.status,
      ' • ref: ',
      COALESCE(NEW.booking_number, 'TBD')
    ))
    FROM customers c
    LEFT JOIN services s ON s.id = NEW.service_id
    WHERE c.id = NEW.customer_id
    LIMIT 1,
    'New Booking'
  );

  -- Loop through all active admins and create notifications
  FOR admin_profile IN
    SELECT p.id
    FROM profiles p
    JOIN roles r ON r.id = p.role_id
    WHERE r.name IN ('admin', 'super_admin')
      AND p.is_active = true
  LOOP
    INSERT INTO notifications (
      profile_id,
      booking_id,
      title,
      message,
      type,
      is_read,
      created_at
    ) VALUES (
      admin_profile.id,
      NEW.id,
      'New Booking',
      booking_display_text,
      'booking_created',
      false,
      NOW()
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists (to avoid duplicate notifications)
DROP TRIGGER IF EXISTS trg_notify_admins_on_new_booking ON bookings;

-- Create the trigger to fire after a booking is inserted
CREATE TRIGGER trg_notify_admins_on_new_booking
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_new_booking();

-- Index for faster admin profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role_active 
ON profiles(role_id, is_active) 
WHERE is_active = true;
