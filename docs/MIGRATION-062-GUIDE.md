## Migration 062: Services with media_id - Complete Solution

### Date: 2026-10-26
### Status: ✅ READY TO APPLY

---

## Overview

This migration completely eliminates the legacy `image_url` fallback by:
1. Creating the missing `website_pages` table
2. Adding `media_id` column to services table
3. Seeding all services with proper media references
4. Converting `page_id` from TEXT to UUID foreign key

After this migration, **all homepage service cards will use `media_id`** and the legacy fallback can be safely removed from `ServicesRepository.js`.

---

## What This Migration Does

### 1. Creates `website_pages` Table
```sql
CREATE TABLE website_pages (
  id UUID PRIMARY KEY,
  page_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true
);
```

Seeds 8 pages: home, restaurant, lounge, vip, events, conference, grooming-care, autospa

### 2. Adds `media_id` to Services
- Adds `media_id UUID` column to services table
- Creates foreign key constraint to `media_assets(id)`
- Adds index for performance

### 3. Converts `page_id` from TEXT to UUID
- Migrates existing TEXT page_id values to UUID via lookup
- Adds foreign key constraint to `website_pages(id)`
- Ensures referential integrity

### 4. Seeds 30 Services

#### Homepage Navigation Cards (6)
All with `media_id` references:
- **Restaurant** → `2d837e6f-f53e-4b03-bc88-97585937e9a1`
- **Lounge & Bar** → `6ed7e810-92e2-4988-b192-82531ce03cb2`
- **VIP Cabins** → `76780f76-860b-4c48-980c-4eb692a80f05`
- **Events** → `1f0d04c1-b58e-44cb-8dd1-8f65c7e8f911`
- **Conference** → `2f270769-d381-4189-93cc-b8285d3ac78a`
- **Grooming & Care** → `25407251-9197-42b1-a2a9-3ab30fbc8e26`

#### Page-Specific Info Cards (24)
All with `icon` (Font Awesome icons):
- Restaurant page: 4 info cards
- VIP page: 4 info cards
- Events page: 4 info cards
- Conference page: 4 info cards
- Grooming & Care page: 4 info cards

---

## How to Apply

### Option A: Via Supabase CLI (Recommended)
```bash
cd "d:/zt lounge/zt-lounge-demo/zt-lounge"
supabase migration up
```

### Option B: Via SQL Editor in Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Copy entire contents of `062_seed_services_with_media_id.sql`
3. Run the migration
4. Check NOTICES for verification output

### Option C: Via Node.js Script
```javascript
const { readFileSync } = require('fs');
const { createClient } = require('@supabase/supabase-js');

const sql = readFileSync('./supabase/migrations/062_seed_services_with_media_id.sql', 'utf-8');
const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

await client.rpc('exec', { sql });
```

---

## Verification

After applying the migration, run these queries:

### Check service counts by type:
```sql
SELECT 
  type,
  COUNT(*) as count,
  COUNT(media_id) as with_media,
  COUNT(icon) as with_icon
FROM services
WHERE is_active = true
GROUP BY type;
```

**Expected output:**
```
type | count | with_media | with_icon
-----|-------|------------|----------
nav  |   6   |     6      |     0
info |  24   |     0      |    24
```

### Check homepage services:
```sql
SELECT 
  s.name,
  s.media_id IS NOT NULL as has_media,
  wp.page_key
FROM services s
JOIN website_pages wp ON s.page_id = wp.id
WHERE wp.page_key = 'home'
ORDER BY s.display_order;
```

**Expected output:**
```
name             | has_media | page_key
-----------------|-----------|----------
Restaurant       | true      | home
Lounge & Bar     | true      | home
VIP Cabins       | true      | home
Events           | true      | home
Conference       | true      | home
Grooming & Care  | true      | home
```

---

## Next Steps After Migration

### 1. Update ServicesRepository.js
Remove the legacy fallback:

```javascript
// ❌ REMOVE THIS:
const imageUrl = service.media_id 
  ? await MediaResolver.resolve(service.media_id)
  : service.image_url; // Legacy fallback

// ✅ REPLACE WITH:
const imageUrl = service.media_id 
  ? await MediaResolver.resolve(service.media_id)
  : null; // No fallback needed - all nav cards have media_id
```

### 2. Run Tests
```bash
npm test -- services.spec.js
```

### 3. Test Frontend
- Load homepage → verify all 6 service cards display correctly
- Check browser console for any errors
- Verify no "legacy fallback" warnings

---

## Rollback Plan

If needed, rollback with:
```sql
BEGIN;
DELETE FROM services;
DROP TABLE IF EXISTS website_pages CASCADE;
ALTER TABLE services DROP COLUMN IF EXISTS media_id;
COMMIT;
```

Then re-run migration 026 to restore previous seed data.

---

## Migration Safety

✅ **Safe to run multiple times** (uses `ON CONFLICT DO NOTHING` and `IF NOT EXISTS`)  
✅ **Idempotent** (clears services before seeding)  
✅ **RLS enabled** (proper security policies)  
✅ **Foreign keys** (referential integrity maintained)  
✅ **Indexed** (performance optimized)  
⚠️ **Destructive** (deletes existing services - ensure you have backups)

---

## Technical Details

### Schema Changes
- `website_pages` table created
- `services.media_id` column added (nullable UUID)
- `services.page_id` converted from TEXT to UUID
- Foreign key constraints added
- Indexes created for performance

### Data Seeded
- 8 website pages
- 6 homepage nav cards (all with media_id)
- 24 page-specific info cards (all with icons)

### Performance Impact
- Minimal (all columns properly indexed)
- Query performance improved with foreign key indexes

---

## Related Files
- Migration: `supabase/migrations/062_seed_services_with_media_id.sql`
- Repository: `assets/js/repositories/ServicesRepository.js`
- Tests: `tests/services.spec.js`

