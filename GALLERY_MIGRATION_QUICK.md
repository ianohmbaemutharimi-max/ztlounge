# GALLERY MIGRATION STRATEGY
## Distribute 13 gallery rows from global 'gallery' page to page-specific galleries

---

## QUICK SUMMARY

**Current State:** All 13 gallery images on 'gallery' page (page_id = gallery UUID)

**Target State:**
- Gallery page: Keep all 13 (main showcase)
- Homepage: 3 featured images (featured carousel)
- Restaurant: 2 preview images
- Lounge: 2 preview images  
- VIP: 1 preview image
- Events: 1 preview image
- Conference: 1 preview image
- Grooming-Care: 1 preview image

**Method:** Copy/create new gallery rows for preview pages + set `is_featured=true` on homepage

---

## STEP 1: GET PAGE UUIDS

```sql
SELECT id, page_key FROM website_pages;
```

**Record these UUIDs:**
- home = `_______________`
- restaurant = `_______________`
- lounge = `_______________`
- vip = `_______________`
- events = `_______________`
- conference = `_______________`
- grooming-care = `_______________`
- gallery = `_______________`

---

## STEP 2: BACKUP & VERIFY CURRENT GALLERY

```sql
-- Backup
CREATE TABLE gallery_backup AS SELECT * FROM gallery;

-- Check current state
SELECT id, title, category, media_id, page_id, display_order, is_featured, is_active 
FROM gallery ORDER BY display_order;
```

**Expected:** 13 rows, all with same page_id (gallery page UUID)

---

## STEP 3: ADD PREVIEW GALLERIES

Replace UUIDs below with actual values from STEP 1.

```sql
-- HOMEPAGE: 3 featured images (copy titles from existing gallery)
INSERT INTO gallery (title, category, media_id, page_id, display_order, is_featured, is_active)
VALUES
('VIP Booth', 'Interior', (SELECT media_id FROM gallery LIMIT 1), 'HOME_UUID', 1, true, true),
('Main Lounge', 'Interior', (SELECT media_id FROM gallery LIMIT 1 OFFSET 1), 'HOME_UUID', 2, true, true),
('Bar Area', 'Drinks', (SELECT media_id FROM gallery LIMIT 1 OFFSET 2), 'HOME_UUID', 3, true, true);

-- RESTAURANT: 2 preview images
INSERT INTO gallery (title, category, media_id, page_id, display_order, is_featured, is_active)
VALUES
('Restaurant Interior', 'Interior', (SELECT media_id FROM gallery LIMIT 1 OFFSET 3), 'RESTAURANT_UUID', 1, false, true),
('Dining Area', 'Food', (SELECT media_id FROM gallery LIMIT 1 OFFSET 4), 'RESTAURANT_UUID', 2, false, true);

-- LOUNGE: 2 preview images
INSERT INTO gallery (title, category, media_id, page_id, display_order, is_featured, is_active)
VALUES
('Lounge Area', 'Interior', (SELECT media_id FROM gallery LIMIT 1 OFFSET 5), 'LOUNGE_UUID', 1, false, true),
('Lounge Bar', 'Drinks', (SELECT media_id FROM gallery LIMIT 1 OFFSET 6), 'LOUNGE_UUID', 2, false, true);

-- VIP: 1 image
INSERT INTO gallery (title, category, media_id, page_id, display_order, is_featured, is_active)
VALUES
('VIP Cabins', 'Interior', (SELECT media_id FROM gallery LIMIT 1 OFFSET 7), 'VIP_UUID', 1, false, true);

-- EVENTS: 1 image
INSERT INTO gallery (title, category, media_id, page_id, display_order, is_featured, is_active)
VALUES
('Event Space', 'Events', (SELECT media_id FROM gallery LIMIT 1 OFFSET 8), 'EVENTS_UUID', 1, false, true);

-- CONFERENCE: 1 image
INSERT INTO gallery (title, category, media_id, page_id, display_order, is_featured, is_active)
VALUES
('Conference Room', 'Interior', (SELECT media_id FROM gallery LIMIT 1 OFFSET 9), 'CONFERENCE_UUID', 1, false, true);

-- GROOMING-CARE: 1 image
INSERT INTO gallery (title, category, media_id, page_id, display_order, is_featured, is_active)
VALUES
('Auto Spa', 'Services', (SELECT media_id FROM gallery LIMIT 1 OFFSET 10), 'GROOMING_UUID', 1, false, true);
```

---

## STEP 4: VERIFY DISTRIBUTION

```sql
SELECT 
  p.page_key,
  COUNT(g.id) as total,
  SUM(CASE WHEN g.is_featured THEN 1 ELSE 0 END) as featured,
  SUM(CASE WHEN g.is_active THEN 1 ELSE 0 END) as active
FROM gallery g
JOIN website_pages p ON g.page_id = p.id
GROUP BY p.page_key
ORDER BY p.page_key;
```

**Expected result:**
```
conference      | 1 | 0 | 1
events          | 1 | 0 | 1
gallery         | 13| var| 13
grooming-care   | 1 | 0 | 1
home            | 3 | 3 | 3
lounge          | 2 | 0 | 2
restaurant      | 2 | 0 | 2
vip             | 1 | 0 | 1
```

**Total rows:** 24 (13 original + 11 preview)

