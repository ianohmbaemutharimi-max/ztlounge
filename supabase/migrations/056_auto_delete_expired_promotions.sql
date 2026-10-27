-- 056 — AUTO DELETE EXPIRED PROMOTIONS
-- =================================================
-- Automatically deletes promotions that have been expired for 7+ days
-- Runs daily at 2:00 AM via pg_cron (1 hour after auto-deactivation)
--
-- AUTHOR: System
-- DATE: 2026-10-24

-- ============================================================
-- 1. Create trigger to log promotion deletions
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_promotion_deletion()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_logs (
    action,
    entity,
    entity_id,
    details,
    created_at
  ) VALUES (
    'DELETE',
    'promotions',
    OLD.id::text,
    jsonb_build_object(
      'title', OLD.title,
      'end_date', OLD.end_date,
      'reason', 'auto_expired',
      'days_past_expiry', (CURRENT_DATE - OLD.end_date)
    ),
    NOW()
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_promotion_deletion ON promotions;
CREATE TRIGGER trg_log_promotion_deletion
BEFORE DELETE ON promotions
FOR EACH ROW
EXECUTE FUNCTION public.log_promotion_deletion();

-- ============================================================
-- 2. Create function to auto-delete expired promotions
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_delete_expired_promotions()
RETURNS TABLE(deleted_count INTEGER, deleted_ids UUID[], deleted_titles TEXT[]) AS $$
DECLARE
  v_count INTEGER;
  v_ids UUID[];
  v_titles TEXT[];
BEGIN
  -- Collect details before deletion
  SELECT 
    COUNT(*)::INTEGER,
    ARRAY_AGG(id),
    ARRAY_AGG(title)
  INTO v_count, v_ids, v_titles
  FROM promotions
  WHERE end_date < (CURRENT_DATE - INTERVAL '7 days')
    AND is_active = false;
  
  -- Delete expired promotions (trigger will log each deletion)
  DELETE FROM promotions
  WHERE end_date < (CURRENT_DATE - INTERVAL '7 days')
    AND is_active = false;
  
  RETURN QUERY SELECT 
    COALESCE(v_count, 0),
    COALESCE(v_ids, ARRAY[]::UUID[]),
    COALESCE(v_titles, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. Verify FK constraint on promotions.media_id
-- ============================================================
DO $$
BEGIN
  -- Add FK constraint with SET NULL (keep promotion, clear media)
  ALTER TABLE promotions
  DROP CONSTRAINT IF EXISTS promotions_media_id_fkey;
  
  ALTER TABLE promotions
  ADD CONSTRAINT promotions_media_id_fkey
  FOREIGN KEY (media_id)
  REFERENCES media_assets(id)
  ON DELETE SET NULL;
  
  RAISE NOTICE 'FK constraint configured: promotions.media_id ON DELETE SET NULL';
END $$;

-- ============================================================
-- 4. Schedule with pg_cron (daily at 2 AM)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('auto-delete-expired-promotions');
    PERFORM cron.schedule(
      'auto-delete-expired-promotions',
      '0 2 * * *',
      $$SELECT public.auto_delete_expired_promotions()$$
    );
    RAISE NOTICE 'Scheduled: auto-delete-expired-promotions at 2:00 AM daily';
  ELSE
    RAISE WARNING 'pg_cron not available - enable it in Supabase dashboard';
  END IF;
END $$;
