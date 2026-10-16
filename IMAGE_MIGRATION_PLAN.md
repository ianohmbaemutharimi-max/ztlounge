# 🖼️ IMAGE MIGRATION & ARRANGEMENT PLAN
**Status:** Ready to Execute  
**Date:** 2026-10-08  
**Target:** Migrate 14 gallery images from database into organized pages

---

## 📊 CURRENT STATE ANALYSIS

### Database Schema (Confirmed)
```typescript
gallery table columns:
  ✅ id (UUID primary key)
  ✅ title, description, image_url (text)
  ✅ display_order (integer, default 0)
  ✅ is_featured (boolean, default false)
  ✅ is_active (boolean, default true)
  ✅ page_id (UUID) - CRITICAL for page isolation
```

### Available Pages
```
conference   → Conference Gallery (PRIORITY - 4 images)
home         → Home (hero carousel)
restaurant   → Restaurant
lounge       → Lounge & Bar
vip          → VIP Cabins
events       → Events Venue
gallery      → Gallery Page
grooming-care → Grooming & Care
contact      → Contact
autospa      → Auto Spa
```

### Current Images
14 gallery images: gallery-01.webp through gallery-14.webp (Supabase storage)

---

## ❌ PROBLEM: Gallery Shows Empty

**Root Causes:**
1. Images in DB but `page_id` not set correctly
2. `display_order` not arranged for carousel
3. `is_active` may be false
4. `image_url` field may be empty
5. No page isolation - images scoped by page_id

**Public Site Expectation:**
- Conference Gallery: 4 featured images visible
- Home: Hero carousel (featured items)
- Each page: Only assigned images visible

---

## ✅ SOLUTION: 5-PHASE EXECUTION PLAN

### Phase 1: Query Current Database State (5 min)
Get page UUIDs and image status:
```sql
-- Get all pages
SELECT id, page_key, title FROM website_pages;

-- Get current gallery items
SELECT id, title, page_id, display_order, is_featured, is_active, image_url 
FROM gallery 
ORDER BY created_at DESC;
```

### Phase 2: Map Page Keys to UUIDs (5 min)
Document the UUID for each page (e.g., conference → uuid-123)

### Phase 3: Arrange Images by Page (10 min)
Example arrangement:
```json
{
  "conference": {
    "pageId": "uuid-here",
    "images": [
      {"title": "Main Conference", "order": 1, "featured": true},
      {"title": "Meeting Room", "order": 2, "featured": true},
      {"title": "Breakout Area", "order": 3, "featured": true},
      {"title": "Setup", "order": 4, "featured": true}
    ]
  },
  "home": {
    "pageId": "uuid-here",
    "images": [
      {"title": "Hero Image 1", "order": 1, "featured": true},
      {"title": "Hero Image 2", "order": 2, "featured": true}
    ]
  }
}
```

### Phase 4: Generate & Execute Update Queries (10 min)
Option A (SQL direct):
```sql
UPDATE gallery SET page_id = 'uuid', display_order = 1, 
  is_featured = true, is_active = true WHERE id = 'image-id-1';
```

Option B (Admin API):
```bash
PATCH /api/admin/gallery/{id}
{ "pageId": "uuid", "displayOrder": 1, "isFeatured": true }
```

### Phase 5: Verify on Public Site (10 min)
- [ ] Conference gallery shows 4 images
- [ ] Images in correct order
- [ ] Featured images highlighted
- [ ] Other pages show their assigned images

---

## 🎯 IMMEDIATE ACTION ITEMS

**I need you to provide:**

1. **Image filenames → Supabase URLs mapping**
   - Example: gallery-01.webp → https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/gallery/gallery-01.webp

2. **Your preferred image arrangement**
   - Which images go to Conference Gallery?
   - Which to Home (featured)?
   - Distribution across other pages?

3. **Page UUID values** (I'll query or you provide)
   - conference → ?
   - home → ?
   - etc.

---

## 🚀 I'M READY TO:

1. ✅ Query your database to get all page UUIDs
2. ✅ Create SQL or API update scripts
3. ✅ Execute migration in batches
4. ✅ Verify images display on public site
5. ✅ Test all toggles and arrangements

**What's your image arrangement preference?**
