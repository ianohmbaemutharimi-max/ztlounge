-- Fix Bronze membership description
-- Run this in Supabase SQL Editor or via psql

-- First, check current state
SELECT 
    name,
    slug,
    COALESCE(description, '(missing)') as description,
    annual_price,
    registration_fee
FROM membership_plans
WHERE is_active = true
ORDER BY annual_price;

-- Add Bronze description if missing
UPDATE membership_plans
SET 
    description = 'Perfect for occasional visitors who want to enjoy membership perks and start experiencing the ZT Lounge lifestyle.',
    updated_at = NOW()
WHERE slug = 'bronze' 
  AND (description IS NULL OR description = '');

-- Verify the fix
SELECT 
    name,
    slug,
    description,
    annual_price,
    registration_fee
FROM membership_plans
WHERE is_active = true
ORDER BY annual_price;
