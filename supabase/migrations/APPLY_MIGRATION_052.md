# Apply Migration 052: Populate Hero Slides

## Purpose
This migration populates the `hero_slides` table with canonical content for all 10 pages, migrating from static HTML to database-driven heroes.

## How to Apply

### Option 1: Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard
2. Select your project: `jczwilrysvnhcjzjztbi`
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy the entire contents of `052_populate_hero_slides_canonical.sql`
6. Paste into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)

### Option 2: Supabase CLI
```bash
cd "d:/zt lounge/zt-lounge-demo/zt-lounge"
supabase db push
```

### Option 3: psql Command
```bash
psql postgresql://postgres:[password]@db.jczwilrysvnhcjzjztbi.supabase.co:5432/postgres < supabase/migrations/052_populate_hero_slides_canonical.sql
```

## What This Does
- Deletes existing hero slides for these 10 pages (if any)
- Inserts 26 total hero slides:
  - **home**: 2 slides
  - **restaurant**: 3 slides
  - **lounge**: 3 slides
  - **vip**: 3 slides
  - **restaurant-menu**: 3 slides
  - **events**: 3 slides
  - **conference**: 3 slides
  - **grooming-care**: 1 slide
  - **contact**: 3 slides
  - **gallery**: 3 slides

## Verification
After applying, verify with:
```sql
SELECT page_id, COUNT(*) as slide_count 
FROM hero_slides 
WHERE page_id IN ('home', 'restaurant', 'lounge', 'vip', 'restaurant-menu', 'events', 'conference', 'grooming-care', 'contact', 'gallery')
GROUP BY page_id
ORDER BY page_id;
```

Expected output:
```
page_id          | slide_count
-----------------|------------
conference       | 3
contact          | 3
events           | 3
gallery          | 3
grooming-care    | 1
home             | 2
lounge           | 3
restaurant       | 3
restaurant-menu  | 3
vip              | 3
```

## Next Steps
After applying this migration:
1. ✅ Update all HTML files to use placeholder hero shells
2. ✅ Verify content-loader.js is loaded on all pages
3. ✅ Test each page to ensure heroes load from database
4. ✅ Remove static hero content from HTML
