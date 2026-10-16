# GALLERY TESTING & VERIFICATION PLAN
## Complete end-to-end testing for page-scoped galleries

---

## TEST SUITE 1: ADMIN UI FUNCTIONALITY

### Test 1.1: Page Selector
```
GIVEN: Gallery Management opened
WHEN: Click "Homepage" button
THEN: 
  ✓ Button highlights (bg-gold)
  ✓ Gallery loads for homepage only
  ✓ Image count updates (should show 3)
  ✓ Page UUID displayed
```

### Test 1.2: Add Image to Page
```
GIVEN: Admin on Gallery Management, Homepage selected
WHEN: Click "Add Image" → Fill form → Submit
  Title: "Featured Area"
  Category: "Interior"
  MediaId: [valid UUID from media_assets]
  Featured: checked
  Active: checked
THEN:
  ✓ Image appears in homepage gallery grid
  ✓ Marked "Featured" badge visible
  ✓ Database saved with pageId = homepage UUID
  ✓ Not visible on other pages
```

### Test 1.3: Edit Image
```
GIVEN: Gallery showing images
WHEN: Click pencil icon → Change title → Submit
THEN:
  ✓ Title updated in grid
  ✓ Modal closes
  ✓ Database row updated
  ✓ Image stays on same page
```

### Test 1.4: Toggle Featured
```
GIVEN: Image in gallery (Featured=false)
WHEN: Click star icon
THEN:
  ✓ Star fills with gold color
  ✓ "Featured" badge appears
  ✓ is_featured = true in database
WHEN: Click star again
THEN:
  ✓ Star becomes outline
  ✓ "Featured" badge removed
  ✓ is_featured = false in database
```

### Test 1.5: Toggle Active
```
GIVEN: Active image in gallery
WHEN: Click eye icon
THEN:
  ✓ Card opacity reduces (opacity-50)
  ✓ "Hidden" badge appears
  ✓ is_active = false in database
WHEN: Click eye icon again
THEN:
  ✓ Card opacity returns to normal
  ✓ "Hidden" badge removed
  ✓ is_active = true in database
```

### Test 1.6: Reorder Images
```
GIVEN: 3 images in order [1, 2, 3]
WHEN: Click up arrow on image 2
THEN:
  ✓ Images reorder to [2, 1, 3]
  ✓ display_order updated in database
WHEN: Click down arrow on image 2
THEN:
  ✓ Images reorder back to [1, 2, 3]
  ✓ display_order updated correctly
```

### Test 1.7: Delete Image
```
GIVEN: Gallery with 3 images
WHEN: Click trash icon → Confirm delete
THEN:
  ✓ Image removed from grid (shows 2 remaining)
  ✓ Database row deleted
  ✓ Remaining images renumber
```

### Test 1.8: Preview Modal
```
GIVEN: Image in gallery
WHEN: Click image to open preview
THEN:
  ✓ Full image displayed
  ✓ Shows Title, Category, Description, Alt Text
  ✓ Shows Media ID
  ✓ Shows Status (Active/Hidden, Featured/Standard)
  ✓ Close button works
```

---

## TEST SUITE 2: PAGE ISOLATION

### Test 2.1: Homepage vs Restaurant
```
GIVEN: Admin on Gallery Management
WHEN: Select "Homepage"
THEN: Count = 3 images (or your chosen number)

WHEN: Select "Restaurant"
THEN: 
  ✓ Count = 2 images (different from homepage)
  ✓ Images completely different
  ✓ No overlap

WHEN: Select "Gallery"
THEN:
  ✓ Count = 13 images (all originals)
  ✓ Different from both homepage and restaurant
```

### Test 2.2: Add Image to Restaurant Only
```
GIVEN: Homepage selected with 3 images
WHEN: Switch to "Restaurant"
WHEN: Add new image "Restaurant Only"
THEN:
  ✓ New image appears on Restaurant (count = 3)
WHEN: Switch back to Homepage
THEN:
  ✓ Homepage still shows 3 original images
  ✓ "Restaurant Only" image NOT visible
  ✓ Pages are completely isolated
### Query: Valid display_order
```sql
SELECT 
  page_id,
  COUNT(DISTINCT display_order) as unique_orders,
  COUNT(*) as total
FROM gallery
GROUP BY page_id
HAVING COUNT(DISTINCT display_order) < COUNT(*);
```

**Expected:** 0 rows (no duplicate display_order per page)

---

## TEST SUITE 4: FRONTEND RENDERING

### Test 4.1: Homepage Featured Preview
```javascript
// In browser console on homepage
GalleryRepository.getByPage('home').then(items => {
  console.log('Total:', items.length);  // Should be 3
  console.log('Featured:', items.filter(i => i.is_featured).length);  // Should be 3
  console.log('Active:', items.filter(i => i.is_active).length);  // Should be 3
  console.log('First image:', items[0]);
  console.log('Has imageUrl:', !!items[0].imageUrl);
});
```

**Expected:**
- 3 images, all featured, all active, all have resolved imageUrl

### Test 4.2: Gallery Page (Full)
```javascript
GalleryRepository.getByPage('gallery').then(items => {
  console.log('Total:', items.length);  // Should be 13
  console.log('Featured:', items.filter(i => i.is_featured).length);  // Variable
});
```

**Expected:** 13 images, all active

### Test 4.3: Restaurant Preview
```javascript
GalleryRepository.getByPage('restaurant').then(items => {
  console.log('Total:', items.length);  // Should be 2
});
```

**Expected:** 2 images, all active

---

## TEST SUITE 5: TOGGLE VERIFICATION

### Toggle: is_featured
**Action:** Add image → Click star → Click star again
**Database check:**
```sql
SELECT is_featured FROM gallery WHERE title = 'Test Image';
```
**Expected:** false → true → false

### Toggle: is_active
**Action:** Add image → Click eye → Click eye again
**Database check:**
```sql
SELECT is_active FROM gallery WHERE title = 'Test Image';
```
**Expected:** true → false → true

### Toggle: display_order
**Action:** 3 images [1,2,3] → Up on 3 → Up on 3 → Down on 3
**Expected:** [1,2,3] → [1,3,2] → [3,1,2] → [1,3,2]

---

## EXECUTION CHECKLIST (2 hours total)

- [ ] Admin UI Tests (30 min): 1.1-1.8
- [ ] Page Isolation (20 min): 2.1-2.3
- [ ] Database Verification (15 min): All queries
- [ ] Frontend Rendering (20 min): 4.1-4.3
- [ ] Toggle Verification (15 min): All toggles

**PASS:** All tests pass + no images on wrong page
**FAIL:** Any test fails or isolation broken

```

### Test 2.3: Featured Status Per Page
```
GIVEN: Homepage with 3 featured images
WHEN: Switch to Restaurant
WHEN: Click star to feature a restaurant image
THEN:
  ✓ Star fills on restaurant image
  ✓ "Featured" badge appears
WHEN: Switch to Homepage
THEN:
  ✓ Homepage featured images unchanged
  ✓ Restaurant's featured status independent
```

---

## TEST SUITE 3: DATABASE VERIFICATION

### Query: Count by Page
```sql
SELECT 
  p.page_key,
  COUNT(g.id) as total_images,
  SUM(CASE WHEN g.is_featured THEN 1 ELSE 0 END) as featured_count,
  SUM(CASE WHEN g.is_active THEN 1 ELSE 0 END) as active_count
FROM gallery g
JOIN website_pages p ON g.page_id = p.id
GROUP BY p.page_key
ORDER BY p.page_key;
```

**Expected:**
```
conference      1  0  1
events          1  0  1
gallery         13 *  13
grooming-care   1  0  1
home            3  3  3
lounge          2  0  2
restaurant      2  0  2
vip             1  0  1
```

### Query: No Orphaned Media
```sql
SELECT COUNT(*) as orphaned_media
FROM gallery
WHERE media_id NOT IN (SELECT id FROM media_assets);
```

**Expected:** 0 rows

### Query: No NULL page_id
```sql
SELECT COUNT(*) as null_page_ids
FROM gallery
WHERE page_id IS NULL;
```

**Expected:** 0 rows
