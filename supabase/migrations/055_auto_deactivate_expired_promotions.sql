-- 055 — AUTO DEACTIVATE EXPIRED PROMOTIONS
-- =================================================
-- Automatically sets is_active = false for expired promotions
-- Runs daily at 1:00 AM via pg_cron
--
-- SCOPE:
--   - Deactivates promotions where end_date < CURRENT_DATE
--   - Keeps promotions in database for historical reference
--   - Logs deactivation count for monitoring
--
-- AUTHOR: System
-- DATE: 2026-10-24

-- ============================================================
-- 1. Create function to auto-deactivate expired promotions
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_deactivate_expired_promotions()
RETURNS TABLE(deactivated_count INTEGER, deactivated_ids UUID[], deactivated_titles TEXT[]) AS $$
DECLARE
  v_count INTEGER;
  v_ids UUID[];
  v_titles TEXT[];
BEGIN
  -- Deactivate expired promotions and collect details
  WITH deactivated AS (
    UPDATE promotions
    SET 
      is_active = false,
      updated_at = NOW()
    WHERE end_date < CURRENT_DATE
      AND is_active = true
    RETURNING id, title
  )
  SELECT 
    COUNT(*)::INTEGER,
    ARRAY_AGG(id),
    ARRAY_AGG(title)
  INTO v_count, v_ids, v_titles
  FROM deactivated;
  
  -- Log the deactivation event if any promotions were deactivated
  IF v_count > 0 THEN
    INSERT INTO activity_logs (
      action,
      entity,
      details,
      created_at
    ) VALUES (
      'AUTO_DEACTIVATE',
      'promotions',
      jsonb_build_object(
        'count', v_count,
        'promotion_ids', v_ids,
        'promotion_titles', v_titles,
        'reason', 'expired',
        'timestamp', NOW()
      ),
      NOW()
    );
  END IF;
  
  -- Return summary
  RETURN QUERY SELECT 
    COALESCE(v_count, 0),
    COALESCE(v_ids, ARRAY[]::UUID[]),
    COALESCE(v_titles, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.auto_deactivate_expired_promotions() IS 
  'Automatically deactivates promotions that have passed their end_date. Runs daily via pg_cron.';

-- ============================================================
-- 2. Schedule daily execution with pg_cron (if available)
-- ============================================================
-- NOTE: pg_cron must be enabled in Supabase dashboard
-- Enable via: Database → Extensions → pg_cron (enable)

-- Schedule for 1:00 AM daily
DO $$
BEGIN
  -- Check if pg_cron is available
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Remove existing schedule if present
    PERFORM cron.unschedule('auto-deactivate-expired-promotions');
    
    -- Create new schedule
    PERFORM cron.schedule(
      'auto-deactivate-expired-promotions',  -- job name
      '0 1 * * *',                           -- cron schedule: daily at 1 AM
      $cron$SELECT public.auto_deactivate_expired_promotions()$cron$
    );
    
    RAISE NOTICE 'pg_cron schedule created: auto-deactivate-expired-promotions runs daily at 1:00 AM';
  ELSE
    RAISE WARNING 'pg_cron extension not found. Please enable it and run: SELECT cron.schedule(''auto-deactivate-expired-promotions'', ''0 1 * * *'', $cron$SELECT public.auto_deactivate_expired_promotions()$cron$);';
  END IF;
END $$;

-- ============================================================
-- 3. Create index to speed up expiry checks
-- ============================================================
-- Note: This index likely already exists from migration 048
CREATE INDEX IF NOT EXISTS idx_promotions_end_date_active 
ON promotions(end_date, is_active) 
WHERE is_active = true;

-- ============================================================
-- 4. Test function (optional - comment out in production)
-- ============================================================
-- Uncomment to test manually:
-- SELECT * FROM public.auto_deactivate_expired_promotions();

-- Expected output:
-- deactivated_count | deactivated_ids | deactivated_titles
-- ------------------+-----------------+-------------------
-- 0                 | {}              | {}
