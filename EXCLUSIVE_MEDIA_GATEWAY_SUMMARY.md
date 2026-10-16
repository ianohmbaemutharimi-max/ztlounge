# 🎯 EXCLUSIVE MEDIA GATEWAY - EXECUTIVE SUMMARY

**Goal:** Transform from fallback model → single source of truth (media_id is ONLY gateway)

---

## 📊 CURRENT STATE

| Table | Status | Gap |
|---|---|---|
| hero_slides | 2/2 with media_id (100%) | ✅ READY |
| gallery | 14/14 with media_id (100%) | ✅ READY |
| services | 13/14 with media_id (93%) | ⚠️ 1 missing |
| menu_items | 14/14 with media_id (100%) | ✅ READY |

**Reality:** 98% of rows already have media_id; only 1 service is gap.

---

## 🚀 5-PHASE IMPLEMENTATION (2 weeks)

### Phase 1: Data (Day 1)
```sql
-- Find the gap
SELECT id, name, slug, media_id, image_url, is_active FROM services WHERE media_id IS NULL;

-- Null-out legacy column across all tables
UPDATE hero_slides SET image_url = NULL WHERE image_url IS NOT NULL;
UPDATE gallery SET image_url = NULL WHERE image_url IS NOT NULL;
UPDATE services SET image_url = NULL WHERE image_url IS NOT NULL;
UPDATE menu_items SET image_url = NULL WHERE image_url IS NOT NULL;

-- Add NOT NULL constraint to media_id
ALTER TABLE hero_slides ALTER COLUMN media_id SET NOT NULL;
ALTER TABLE gallery ALTER COLUMN media_id SET NOT NULL;
ALTER TABLE services ALTER COLUMN media_id SET NOT NULL;
ALTER TABLE menu_items ALTER COLUMN media_id SET NOT NULL;
```

### Phase 2: MediaResolver.js (Week 1)
**Change:** Remove fallback logic; throw errors on missing media_id

```javascript
// OLD: Silently falls back
function applyResolved(item) {
    if (item && item.media_id && cache[item.media_id]) {
        item.image_url = cache[item.media_id].public_url;
    }
    return item;  // Falls back if missing
}

// NEW: Exclusive gateway — errors if missing
function applyResolved(item) {
    if (!item || !item.media_id) throw new Error('INVALID_MEDIA_CONTRACT: media_id required');
    if (!cache[item.media_id]) throw new Error('MEDIA_NOT_FOUND: ' + item.media_id);
    var asset = cache[item.media_id];
    if (!asset.public_url) throw new Error('MEDIA_INVALID: no public_url');
    item.image_url = asset.public_url;
    if (asset.alt_text) item.alt_text = asset.alt_text;
    return item;
}
```

### Phase 3: Update Repositories (Week 1)
Remove fallback chains from 5 repositories:
- HeroRepository.js:74 → remove `|| item.image || ''`
- GalleryRepository.js → remove fallback
- ServicesRepository.js → remove fallback
- MenuRepository.js → remove fallback
- MembershipRepository.js → remove fallback

### Phase 4: Update Admin API (Week 1)
**Admin PATCH endpoints:** Reject any `image_url` writes; require `media_id`

```typescript
if (body.image_url !== undefined) throw BadRequestError('image_url deprecated; use media_id');
if (!body.media_id && !existing.media_id) throw BadRequestError('media_id required');
```

### Phase 5: Update Admin CMS (Week 2)
- Remove "Legacy URL" option from MediaPickerModal
- Remove `image_url` column from Admin tables
- Hide image_url input from all forms

---

## ✅ SUCCESS CRITERIA

1. ✅ Zero rows with `media_id = NULL`
2. ✅ All `image_url` columns = NULL
3. ✅ MediaResolver throws on missing media_id (no silent fallback)
4. ✅ Admin API rejects image_url writes
5. ✅ All render tests pass (images from media_id only)
6. ✅ Production logs: zero INVALID_MEDIA_CONTRACT errors

---

## 📁 FILES MODIFIED (13 total)

**CRITICAL:** MediaResolver.js, 5 Repositories, content-loader.js, Admin API  
**HIGH:** MediaPickerModal.tsx, Admin endpoints  
**MEDIUM:** Schema comments, tests

---

## 🎯 NEXT STEP

**Ready to execute Phase 1?**

Run this query now:
```sql
SELECT id, name, slug, media_id, image_url, is_active FROM services WHERE media_id IS NULL;
```

Once you confirm the gap, we'll proceed with:
1. Migrate the service's image_url to media_assets, OR delete it
2. Execute null-out migrations
3. Add NOT NULL constraints
4. Proceed to Phases 2-5

**Estimated timeline:** 2 weeks start-to-finish. All code changes follow the same pattern across all files.
