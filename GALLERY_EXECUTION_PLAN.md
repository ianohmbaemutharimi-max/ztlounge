# GALLERY MIGRATION & IMPLEMENTATION EXECUTION PLAN
## Complete step-by-step guide for page-scoped gallery distribution

---

## EXECUTIVE SUMMARY

**Current Problem:** 13 gallery images all on 'gallery' page; other pages have NO preview galleries

**Solution:** Distribute gallery images across pages + verify all toggles work

**Timeline:** ~3 hours total (migration + testing + verification)

**Key Insight:** Database already supports page-scoped galleries (page_id column), API mapping already done (pageId → page_id), admin UI just needs confirmation

---

## PHASE 1: PRE-MIGRATION VERIFICATION (15 min)

### Step 1.1: Get Page UUIDs

Execute in Supabase SQL Editor:

```sql
SELECT id, page_key, title FROM website_pages ORDER BY page_key;
```

**Record these UUIDs:**

```
homepage_uuid     = ________________________
restaurant_uuid   = ________________________
lounge_uuid       = ________________________
vip_uuid          = ________________________
events_uuid       = ________________________
conference_uuid   = ________________________
grooming_uuid     = ________________________
gallery_uuid      = ________________________
```

### Step 1.2: Verify Current Gallery State

```sql
SELECT COUNT(*) as total_rows FROM gallery;
SELECT COUNT(*) as with_page_id FROM gallery WHERE page_id IS NOT NULL;
SELECT COUNT(*) as with_media_id FROM gallery WHERE media_id IS NOT NULL;
SELECT id, title, category, media_id, display_order, is_featured, is_active 
FROM gallery ORDER BY display_order;
```

**Expected:** 13 rows, all with page_id and media_id set

### Step 1.3: Backup Current Gallery

```sql
CREATE TABLE gallery_backup_2026_10_08 AS SELECT * FROM gallery;
```

---

## PHASE 2: CREATE PREVIEW GALLERIES (30 min)

Replace UUIDs in all queries below with actual values from Step 1.1

### Step 2.1: Homepage Preview (3 featured images)

```sql
INSERT INTO gallery (title, category, media_id, page_id, display_order, is_featured, is_active)
SELECT 
  'Featured ' || ROW_NUMBER() OVER (ORDER BY display_order),
  category, media_id, 'HOMEPAGE_UUID', 
  ROW_NUMBER() OVER (ORDER BY display_order), true, true
FROM gallery 
WHERE page_id = 'GALLERY_UUID'
ORDER BY display_order LIMIT 3;
```

### Step 2.2: Restaurant Preview (2 images)

```sql
INSERT INTO gallery (title, category, media_id, page_id, display_order, is_featured, is_active)
SELECT 
  'Restaurant ' || ROW_NUMBER() OVER (ORDER BY display_order),
  category, media_id, 'RESTAURANT_UUID',
  ROW_NUMBER() OVER (ORDER BY display_order), false, true
FROM gallery 
WHERE page_id = 'GALLERY_UUID'
ORDER BY display_order OFFSET 3 LIMIT 2;
```

### Step 2.3: Lounge Preview (2 images)

```sql
INSERT INTO gallery (title, category, media_id, page_id, display_order, is_featured, is_active)
SELECT 
  'Lounge ' || ROW_NUMBER() OVER (ORDER BY display_order),
  category, media_id, 'LOUNGE_UUID',
  ROW_NUMBER() OVER (ORDER BY display_order), false, true
FROM gallery 
WHERE page_id = 'GALLERY_UUID'
ORDER BY display_order OFFSET 5 LIMIT 2;
```

### Step 2.4: VIP, Events, Conference, Grooming (1 image each)

```sql
-- VIP
INSERT INTO gallery (title, category, media_id, page_id, display_order, is_featured, is_active)
SELECT 'VIP Cabins', category, media_id, 'VIP_UUID', 1, false, true
FROM gallery WHERE page_id = 'GALLERY_UUID' ORDER BY display_order OFFSET 7 LIMIT 1;

-- Events
INSERT INTO gallery (title, category, media_id, page_id, display_order, is_featured, is_active)
SELECT 'Event Space', category, media_id, 'EVENTS_UUID', 1, false, true
FROM gallery WHERE page_id = 'GALLERY_UUID' ORDER BY display_order OFFSET 8 LIMIT 1;

-- Conference
INSERT INTO gallery (title, category, media_id, page_id, display_order, is_featured, is_active)
SELECT 'Conference Room', category, media_id, 'CONFERENCE_UUID', 1, false, true
FROM gallery WHERE page_id = 'GALLERY_UUID' ORDER BY display_order OFFSET 9 LIMIT 1;

-- Grooming-Care
INSERT INTO gallery (title, category, media_id, page_id, display_order, is_featured, is_active)
SELECT 'Auto Spa', category, media_id, 'GROOMING_UUID', 1, false, true
FROM gallery WHERE page_id = 'GALLERY_UUID' ORDER BY display_order OFFSET 10 LIMIT 1;
```

---

## PHASE 3: POST-MIGRATION VERIFICATION (20 min)

### Step 3.1: Count Distribution

```sql
SELECT 
  p.page_key, COUNT(g.id) as total, 
  SUM(CASE WHEN g.is_featured THEN 1 ELSE 0 END) as featured
FROM gallery g
JOIN website_pages p ON g.page_id = p.id
GROUP BY p.page_key ORDER BY p.page_key;
```

**Expected:** gallery=13, home=3 (featured), restaurant=2, lounge=2, vip=1, events=1, conference=1, grooming-care=1

### Step 3.2: Data Integrity

```sql
-- No NULL page_ids
SELECT COUNT(*) FROM gallery WHERE page_id IS NULL;  -- Expected: 0

-- No orphaned media_ids
SELECT COUNT(*) FROM gallery WHERE media_id NOT IN (SELECT id FROM media_assets);  -- Expected: 0

-- No duplicate display_order per page
SELECT page_id FROM gallery GROUP BY page_id 
HAVING COUNT(DISTINCT display_order) < COUNT(*);  -- Expected: 0 rows
```

