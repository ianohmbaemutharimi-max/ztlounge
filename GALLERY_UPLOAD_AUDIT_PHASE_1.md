# ZT LOUNGE — GALLERY UPLOAD AUDIT — PHASE 1: LOCATE THE GALLERY

## Objective
Identify all files responsible for gallery management in the admin dashboard and public website.

---

## ADMIN DASHBOARD GALLERY

### 1. Gallery Page Component
**File:** `../zt-lounge-admin/src/app/dashboard/gallery/page.tsx`

```tsx
import { GalleryView } from "@/features/gallery/gallery-view";

export default function GalleryPage() {
  return <GalleryView />;
}
```

**Purpose:** Route component that renders the Gallery management interface.

---

### 2. Gallery View Component (PRIMARY)
**File:** `../zt-lounge-admin/src/features/gallery/gallery-view.tsx`

**Key Functions:**

- **Lines 24-38:** Main GalleryView component with state management
- **Line 29:** Queries gallery items: `useQuery<GalleryItem[]>({ queryKey: queryKeys.gallery.all(), queryFn: () => api.list<GalleryItem>("gallery") })`
- **Lines 35-39:** Add mutation that creates gallery records
- **Lines 40-47:** Update/delete mutations
- **Lines 115-136:** Add Image Modal form

**Current Implementation:**
```tsx
<Field label="Image URL" error={form.formState.errors.imageUrl?.message}>
  <Input placeholder="https://… (storage upload URL)" {...form.register("imageUrl")} />
</Field>
```

**Critical Finding:** The form accepts **manual URL input only** via a text `<Input>` field, NOT a file upload control.

**No file picker exists.** Lines 117-125 show:
- Title field (text input)
- Category field (text input) 
- Image URL field (text input with placeholder "https://… (storage upload URL)")

**Schema Validation (Lines 17-22):**
```tsx
const imageSchema = z.object({
  title: z.string().min(2, "Title is required"),
  imageUrl: z.string().url("Enter a valid image URL"),
  category: z.string().min(2, "Category is required"),
});
```

The schema **requires a valid URL string**, not a File object.

---

### 3. Gallery API Integration
**File:** `../zt-lounge-admin/src/lib/api.ts` (referenced, not read yet)

**Usage in gallery-view.tsx:**
- `api.list<GalleryItem>("gallery")` - fetch all gallery items
- `api.create("gallery", {...})` - create new gallery record
- `api.update<GalleryItem>("gallery", id, body)` - update gallery record
- `api.remove("gallery", id)` - delete gallery record

---

### 4. Database Schema Definition
**File:** `../zt-lounge-admin/src/db/schema.ts`

**Lines 306-321:** Gallery table schema
```typescript
export const gallery = pgTable("gallery", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title"),
  description: text("description"),
  imageUrl: text("image_url").notNull(),  // ← Stores the image URL
  category: text("category"),
  altText: text("alt_text"),
  displayOrder: integer("display_order").default(0).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  uploadedBy: uuid("uploaded_by"),
  type: text("type").default("general"),
  pageId: uuid("page_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
```

**Key Field:** `imageUrl: text("image_url").notNull()` - stores the image URL as text, NOT binary data.

---

## PUBLIC WEBSITE GALLERY

### 5. Public Gallery HTML Page
**File:** `pages/contact/gallery.html`

**Lines 1005-1145:** Static HTML gallery grid with hardcoded image URLs

Example (Lines 1007-1014):
```html
<div class="grid-item featured" data-index="0">
  <img src="https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/gallery/gallery-01.webp" 
       alt="ZT Lounge elegant dining area with premium table settings" loading="lazy" />
  <div class="zoom-icon"><i class="fas fa-expand"></i></div>
  <div class="overlay">
    <h4>Fine Dining</h4>
    <span>Elegant dining with premium table settings</span>
  </div>
</div>
```

**Finding:** Currently **14 hardcoded gallery items** (gallery-01.webp through gallery-14.webp) from Supabase Storage.

---

### 6. Gallery Repository (Public Website Data Layer)
**File:** `assets/js/repositories/GalleryRepository.js`

**Lines 22-117:** Repository abstraction for gallery data

**Key Functions:**
- **Lines 73-91:** `getByPage(pageId)` - fetches gallery items by page_id from Supabase
- **Lines 97-111:** `getAll()` - fetches all active gallery items from Supabase
- **Lines 32-49:** `mapToUI(item)` - maps database fields to UI fields

**Data Source Priority:**
1. **Primary:** Supabase `gallery` table (via BaseRepository)
2. **Fallback:** Local `GalleryConfig` static configuration

**Lines 54-66:**
```javascript
var config = window.SupabaseConfig || {};
var tableName = config.tables && config.tables.gallery ? config.tables.gallery : 'gallery';
repo = window.BaseRepository.create(
    tableName,
    function() {
        // Fallback to local config
        var localConfig = window.GalleryConfig || { gallery: [] };
        return localConfig.gallery || [];
    },
    { cacheTTL: 300000 }
);
```

---

### 7. Gallery Static Configuration (Fallback)
**File:** `assets/js/gallery.config.js`

**Lines 1-250+:** Static gallery configuration with hardcoded image URLs

**Structure:**
```javascript
window.GalleryConfig = Object.freeze({
    home: {
        title: "Photo",
        highlight: "Gallery",
        images: [
            "https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/gallery/gallery-01.webp",
            // ... more hardcoded URLs
        ]
    },
    gallery: {
        // Full gallery configuration
    }
});
```

**Finding:** All image URLs point to Supabase Storage `public-assets` bucket.

---

### 8. Content Loader (Dynamic Gallery Population)
**File:** `assets/js/content-loader.js`

**Lines 180-200 (approx):** `populateGallery()` function

```javascript
function populateGallery() {
    var pageId = getPageId();
    if (!window.GalleryRepository) return;
    
    window.GalleryRepository.getByPage(pageId).then(function(galleryData) {
        if (!galleryData) return;
        if (galleryData.items) {
            galleryData.items.forEach(function(item, index) {
                var gridItem = document.querySelector('.grid-item[data-index="' + index + '"]');
                // Updates existing grid items with database data
            });
        }
    });
}
```

**Purpose:** Dynamically updates gallery HTML with data from Supabase database.

---

## PHASE 1 SUMMARY

### Admin Dashboard Files:
1. **Page Route:** `../zt-lounge-admin/src/app/dashboard/gallery/page.tsx`
2. **Main Component:** `../zt-lounge-admin/src/features/gallery/gallery-view.tsx` ← **CRITICAL**
3. **Database Schema:** `../zt-lounge-admin/src/db/schema.ts` (lines 306-321)
4. **API Layer:** Referenced via `@/lib/api` (not yet inspected)

### Public Website Files:
1. **HTML Page:** `pages/contact/gallery.html`
2. **Data Repository:** `assets/js/repositories/GalleryRepository.js`
3. **Static Config:** `assets/js/gallery.config.js`
4. **Content Loader:** `assets/js/content-loader.js`

### How They Currently Work:

**Admin Dashboard:**
1. Admin navigates to `/dashboard/gallery`
2. `GalleryView` component loads gallery items from database via `api.list("gallery")`
3. Admin clicks "Add Image" button
4. Modal opens with a form containing **three text input fields**: title, category, and **image URL**
5. Admin must **manually type or paste a URL** (e.g., from Supabase Storage)
6. Form validates that imageUrl is a valid URL string
7. On submit, creates a new database record in the `gallery` table with the provided URL
8. **No file selection. No file upload. No Supabase Storage integration.**

**Public Website:**
1. Page loads with hardcoded gallery HTML (14 static items)
2. `content-loader.js` runs `populateGallery()` on page load
3. Queries Supabase `gallery` table via `GalleryRepository`
4. If database records exist, updates the DOM with database data
5. If no database records, falls back to static `GalleryConfig`
6. Images are rendered from their stored URLs (all currently pointing to Supabase Storage `public-assets` bucket)

---

## ❌ CRITICAL FINDING

**The admin dashboard does NOT have a file upload component.**

The "Add Image" form requires manual URL entry. An administrator cannot:
- Select an image from their phone gallery
- Select an image from their computer file system
- Upload a file through the interface
- Automatically generate a Supabase Storage URL

The current workflow requires:
1. Admin manually uploads image to Supabase Storage (outside the app)
2. Admin copies the generated public URL
3. Admin pastes URL into the "Image URL" text field
4. Admin submits the form

**This is NOT a phone-friendly workflow.**

---

## NEXT: PHASE 2

Search for any file upload implementation that may exist elsewhere in the codebase.
