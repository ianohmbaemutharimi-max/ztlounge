# GALLERY PAGE-SCOPED IMPLEMENTATION GUIDE

## Problem
- Admin UI: Global gallery (no page filtering)
- Frontend: Expects page-scoped galleries (filters by page_id UUID)
- Database: Schema supports page_id but admin doesn't use it
- Result: New galleries invisible because page_id not set

## Solution
1. Admin selects PAGE first (Homepage, Restaurant, etc.)
2. Gallery filtered by page_id (UUID)
3. All new galleries saved with selected page's UUID
4. Frontend queries work as designed

## Key Changes

### Gallery Form Schema
```typescript
const gallerySchema = z.object({
  title: z.string(),
  mediaId: z.string().uuid(),  // ✅ Links to media_assets
  category: z.string(),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
```

### Admin UI Flow
1. Load pages from `website_pages` table
2. Show page selector buttons
3. Filter gallery by `selectedPage.id` (UUID)
4. When creating/updating: auto-set `pageId = selectedPage.id`

### API Contract
```
POST /api/admin/gallery {
  title, category, mediaId, isFeatured, isActive,
  pageId: string (UUID),     // ✅ From selected page
  sortOrder: number          // ✅ From item count
}
```

## Database Contract
```sql
INSERT INTO gallery (
  title, category, media_id, is_featured, is_active,
  page_id, display_order    -- ✅ Both always set
)
```

## Files Modified
- `src/features/gallery/gallery-view.tsx` - Main implementation
- `src/lib/contract/mapping.ts` - Already supports pageId
- Frontend - No changes needed (already page-scoped)

## Testing
1. Add image to Homepage → only shows on homepage
2. Add image to Restaurant → only shows on restaurant
3. Page isolation verified ✓
