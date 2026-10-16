-- 048 — ADMIN PROMOTION NOTIFICATIONS
-- =================================================
-- When a promotion is created, updated, or approaching expiry,
-- notify all active admins.
--
-- SCOPE:
--   - Fires on INSERT and UPDATE of promotions
--   - Creates notifications for: promo_created, promo_updated, promo_expiring
--   - Expiry check: promotions expiring within 3 days

-- ============================================================
-- 1. Notify admins when a NEW promotion is created
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_admins_on_promotion_created()
RETURNS TRIGGER AS $$
DECLARE
  admin_profile RECORD;
BEGIN
  FOR admin_profile IN
    SELECT p.id
    FROM profiles p
    JOIN roles r ON r.id = p.role_id
    WHERE r.name IN ('admin', 'super_admin')
      AND p.is_active = true
  LOOP
    INSERT INTO notifications (
      profile_id,
      title,
      message,
      type,
      is_read,
      created_at
    ) VALUES (
      admin_profile.id,
      'New Promotion',
      CONCAT(
        COALESCE(NEW.title, 'Untitled'),
        ' • ',
        CASE 
          WHEN NEW.discount_type = 'percentage' THEN CONCAT(NEW.discount_value, '% off')
          WHEN NEW.discount_type = 'fixed' THEN CONCAT('KSh ', NEW.discount_value, ' off')
          ELSE COALESCE(NEW.discount_value::text, '')
        END,
        ' • valid until ',
        COALESCE(TO_CHAR(NEW.end_date, 'DD MMM YYYY'), 'no end date')
      ),
      'promo_created',
      false,
      NOW()
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_admins_on_promotion_created ON promotions;
CREATE TRIGGER trg_notify_admins_on_promotion_created
AFTER INSERT ON promotions
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_promotion_created();

-- ============================================================
-- 2. Notify admins when a promotion is UPDATED (status change)
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_admins_on_promotion_updated()
RETURNS TRIGGER AS $$
DECLARE
  admin_profile RECORD;
BEGIN
  -- Only notify if is_active status changed
  IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
    FOR admin_profile IN
      SELECT p.id
      FROM profiles p
      JOIN roles r ON r.id = p.role_id
      WHERE r.name IN ('admin', 'super_admin')
        AND p.is_active = true
    LOOP
      INSERT INTO notifications (
        profile_id,
        title,
        message,
        type,
        is_read,
        created_at
      ) VALUES (
        admin_profile.id,
        CASE WHEN NEW.is_active = true THEN 'Promotion Activated' ELSE 'Promotion Deactivated' END,
        CONCAT(
          COALESCE(NEW.title, 'Untitled'),
          ' has been ',
          CASE WHEN NEW.is_active = true THEN 'activated' ELSE 'deactivated' END
        ),
        'promo_updated',
        false,
        NOW()
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_admins_on_promotion_updated ON promotions;
CREATE TRIGGER trg_notify_admins_on_promotion_updated
AFTER UPDATE ON promotions
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_promotion_updated();

-- ============================================================
-- 3. Notify admins about promotions EXPIRING SOON (within 3 days)
-- ============================================================
-- This function can be called by a scheduled job (pg_cron) or manually
-- to alert admins about promotions nearing expiry.
CREATE OR REPLACE FUNCTION public.notify_admins_on_promotion_expiring()
RETURNS void AS $$
DECLARE
  admin_profile RECORD;
  promo_record RECORD;
BEGIN
  -- Find promotions expiring within 3 days that haven't been notified yet
  FOR promo_record IN
    SELECT DISTINCT p.id, p.title, p.end_date, p.discount_type, p.discount_value
    FROM promotions p
    WHERE p.is_active = true
      AND p.end_date IS NOT NULL
      AND p.end_date >= CURRENT_DATE
      AND p.end_date <= CURRENT_DATE + INTERVAL '3 days'
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.type = 'promo_expiring'
          AND n.message LIKE '%' || p.title || '%'
          AND n.created_at >= CURRENT_DATE
      )
  LOOP
    -- Notify all active admins
    FOR admin_profile IN
      SELECT p.id
      FROM profiles p
      JOIN roles r ON r.id = p.role_id
      WHERE r.name IN ('admin', 'super_admin')
        AND p.is_active = true
    LOOP
      INSERT INTO notifications (
        profile_id,
        title,
        message,
        type,
        is_read,
        created_at
      ) VALUES (
        admin_profile.id,
        'Promotion Expiring Soon',
        CONCAT(
          COALESCE(promo_record.title, 'Untitled'),
          ' expires on ',
          TO_CHAR(promo_record.end_date, 'DD MMM YYYY'),
          ' (',
          CASE 
            WHEN promo_record.end_date = CURRENT_DATE THEN 'today'
            WHEN promo_record.end_date = CURRENT_DATE + 1 THEN 'tomorrow'
            ELSE TO_CHAR(promo_record.end_date - CURRENT_DATE, 'DD') || ' days'
          END,
          ')'
        ),
        'promo_expiring',
        false,
        NOW()
      );
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 4. Index for faster admin profile lookups (if not exists)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_promotions_end_date 
ON promotions(end_date) 
WHERE is_active = true AND end_date IS NOT NULL;

-- ============================================================
-- OPTIONAL: Schedule expiry checks with pg_cron (if available)
-- ============================================================
-- SELECT cron.schedule(
--   'check-promo-expiry',
--   '0 9 * * *',  -- Daily at 9 AM
--   'SELECT public.notify_admins_on_promotion_expiring()'
-- );