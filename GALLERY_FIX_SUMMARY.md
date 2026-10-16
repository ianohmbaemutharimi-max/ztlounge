## GALLERY IMPLEMENTATION - SUMMARY

### Problem
- Admin UI: Global gallery (all images together, no page filtering)
- Frontend: Page-scoped (filters by page_id UUID)
- Result: New galleries invisible because page_id not set

### Solution
Admin selects PAGE first → Gallery filtered by that page's UUID → New galleries saved with page_id

### Key Changes
1. Add page selector to admin UI (10 pages: home, restaurant, lounge, etc.)
2. Filter gallery query by selected page's UUID
3. Auto-set pageId when creating galleries
4. Use mediaId instead of direct imageUrl

### Contract
**POST /api/admin/gallery:**
```json
{
  "title": "...",
  "category": "...",
  "mediaId": "uuid",
  "pageId": "selected-page-uuid",
  "sortOrder": 1,
  "isFeatured": false,
  "isActive": true
}
```

**GET /api/admin/gallery?pageId=<uuid>**
Returns only that page's galleries

### UI Flow
1. Admin opens Gallery Management
2. Clicks page button (Homepage|Restaurant|Lounge|etc)
3. Gallery loads for that page only
4. Can add/edit/delete/reorder images for that page
5. Different pages have completely separate galleries

### Files
- `gallery-view.tsx` - Replace entire component (page-scoped version)
- `mapping.ts` - Verify pageId mapping (likely no change needed)
- Frontend - No changes (already page-scoped)

### Testing
- Add image to Homepage → appears only on homepage
- Add image to Restaurant → appears only on restaurant
- Pages have independent galleries ✓

---
