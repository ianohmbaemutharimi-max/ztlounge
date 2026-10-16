# 🧪 PHASE 1-3 VERIFICATION - MANUAL TESTING GUIDE

**Status:** Phases 1-3 complete, ready for manual testing  
**Website:** http://localhost:8000  
**Admin:** http://localhost:3000

---

## QUICK VERIFICATION CHECKLIST

### ✅ STEP 1: Home Page (http://localhost:8000)

**Verify:**
- [ ] 2 hero slides visible
- [ ] Both slides have images
- [ ] Open DevTools (F12) → Console
- [ ] NO errors: INVALID_MEDIA_CONTRACT, MEDIA_NOT_FOUND, MEDIA_INVALID
- [ ] Images loading from media_assets (check Network tab)

---

### ✅ STEP 2: Gallery Page (http://localhost:8000/pages/public/gallery.html)

**Verify:**
- [ ] 14 gallery items visible
- [ ] ALL items have images (100%)
- [ ] Console: NO contract errors

---

### ✅ STEP 3: Services Page (http://localhost:8000/pages/business/grooming-care.html)

**Verify:**
- [ ] Classic Haircut service visible
- [ ] Classic Haircut has an image (THIS WAS THE GAP - FIXED BY MIGRATION 045a)
- [ ] All other services have images
- [ ] Console: NO contract errors

---

### ✅ STEP 4: Menu/Lounge Page (http://localhost:8000/pages/public/lounge.html)

**Verify:**
- [ ] Menu items load with images
- [ ] Console: NO contract errors

---

### ✅ STEP 5: Admin Dashboard (http://localhost:3000)

**Verify:**
- [ ] Admin loads without errors
- [ ] Can navigate to hero, gallery, services sections

---

### ✅ STEP 6: Admin Services (http://localhost:3000/services)

**Verify:**
- [ ] Classic Haircut appears in list
- [ ] Classic Haircut has media_id assigned
- [ ] NO legacy image_url field visible (should be hidden)

---

## CONSOLE TEST (Run in DevTools Console)

```javascript
// Test MediaResolver v2.0.0 contract enforcement
if (window.MediaResolver) {
  try {
    window.MediaResolver.resolveCollection([{ id: 'test', media_id: null }]);
  } catch (err) {
    console.log('✅ Contract works:', err.message);
    // Should show: INVALID_MEDIA_CONTRACT: media_id required
  }
} else {
  console.log('❌ MediaResolver not loaded');
}
```

**Expected:** `INVALID_MEDIA_CONTRACT: media_id required`

---

## DATABASE QUERIES (If you have DB access)

```sql
-- All media_ids populated?
SELECT COUNT(*) FROM services WHERE media_id IS NULL;
-- Expected: 0

-- Classic Haircut has media_id?
SELECT media_id FROM services WHERE name = 'Classic Haircut';
-- Expected: [UUID value, NOT NULL]

-- NOT NULL constraint active?
SELECT is_nullable FROM information_schema.columns 
WHERE table_name = 'services' AND column_name = 'media_id';
-- Expected: NO
```

---

## ✅ SUCCESS CRITERIA

**All green = Phase 1-3 verified ✅**

- [x] All pages load without errors
- [x] All items have images  
- [x] Classic Haircut has image (gap fixed)
- [x] Console: NO contract violations
- [x] Admin: NO legacy fields visible
- [x] Database: All media_ids NOT NULL
- [x] MediaResolver v2.0.0 working

---

## ❌ FAILURE TROUBLESHOOTING

| Symptom | Cause | Fix |
|---------|-------|-----|
| Classic Haircut no image | Migration 045a not run | Execute 045a |
| INVALID_MEDIA_CONTRACT error | Some item has NULL media_id | Run 045a, then 046 |
| MEDIA_NOT_FOUND error | media_id not in DB | Create missing asset |
| Images not loading | Migration 046 not run | Execute 046 |
| Fallback warnings | Code not deployed | Redeploy MediaResolver.js |

---

## DONE? 

✅ All tests pass → Ready for Phase 4 (Admin API)  
❌ Tests fail → Fix and retry

**Status:** Manual testing ready now
