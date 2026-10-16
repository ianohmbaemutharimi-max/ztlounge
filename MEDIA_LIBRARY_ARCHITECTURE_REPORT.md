# 📚 MEDIA LIBRARY ARCHITECTURE REPORT
**READ-ONLY ANALYSIS | v1.0.0 | October 9, 2026**

## 🎯 EXECUTIVE SUMMARY

**Single Source of Truth:** `media_assets` table (Supabase database)  
**Resolution Path:** `media_id` (UUID) → `media_assets.public_url` via `MediaResolver`  
**Pattern:** All content (hero, gallery, services, menu, branding) uses identical resolution  
**Key Principle:** No hardcoded URLs. No media-specific fallbacks. Database is authoritative.

**Status:** ✅ Fully Implemented & Active (127 media assets in library)

---

## 🏗️ ARCHITECTURE LAYERS

### Layer 1: Storage (Supabase Storage + Database)
```
Supabase Storage Bucket: public-assets/
  ├── images/branding/      (logos, favicons)
  ├── images/homepage/      (hero, featured content)
  ├── images/gallery/       (photo gallery)
  ├── images/menu/          (food/beverage items)
  ├── images/services/      (service photos)
  └── images/[other]/       (testimonials, events, etc.)

Supabase Database: media_assets table
  └── Canonical metadata: id, public_url, mime_type, dimensions, category
```

### Layer 2: Resolution (Client-Side)
```
MediaResolver.js (browser)
  ├── Cache: { media_id → { public_url, alt_text } }
  ├── Batched loading: loadMissing(ids) → single DB query per page
  └── Override rule: media_id wins over legacy image_url
```

### Layer 3: Content (Repositories)
```
All repositories share same pattern:
  ├── GalleryRepository.getByPage()
  ├── HeroRepository.getByPage()
  ├── ServicesRepository.getByPage()
  ├── MenuRepository.getByPage()
  ├── TestimonialsRepository.getByPage()
  ├── BusinessRepository.getSettings()
  └── All use → MediaResolver.resolveCollection()
```

### Layer 4: Admin (API + UI)
```
POST /api/admin/upload
  └── Upload image → Sharp process (JPEG/PNG/WebP)
      └── Supabase Storage write
      └── media_assets table INSERT (canonical metadata)

GET /api/admin/media-assets
  └── Returns paginated media_assets records
  └── MediaPickerModal consumes this endpoint

PATCH /api/admin/[entity]/[id]
  └── Accept media_id (UUID)
  └── Store in entity table: hero_slides.media_id, services.media_id, etc.
```

---

## 📊 DATA MODEL

### media_assets Table (Canonical)
```sql
CREATE TABLE media_assets (
  id UUID PRIMARY KEY,                    -- Unique media identifier
  bucket TEXT,                             -- Storage bucket (public-assets)
  path TEXT,                               -- Storage path (/images/...)
  public_url TEXT,                         -- Canonical public URL ✅ AUTHORITATIVE
  original_name TEXT,                      -- Filename (e.g., "restaurant.jpg")
  category TEXT,                           -- gallery, homepage, menu, services, branding
  media_type TEXT,                         -- image, video (currently image only)
  mime_type TEXT,                          -- image/jpeg, image/webp, etc.
  alt_text TEXT,                           -- Accessibility: alt text for <img>
  width INTEGER,                           -- Image dimensions
  height INTEGER,
  file_size INTEGER,                       -- Bytes
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Content Tables (Reference media_id as FK)
```sql
-- Example: hero_slides table
CREATE TABLE hero_slides (
  id UUID PRIMARY KEY,
  page_id UUID,
  media_id UUID REFERENCES media_assets(id),  -- ← FK to canonical media
  image_url TEXT,                              -- ← Legacy fallback (overridden if media_id resolves)
  alt_text TEXT,
  ...other fields
);

-- Pattern repeats for all content:
-- gallery: gallery.media_id → media_assets
-- services: services.media_id → media_assets
-- menu_items: menu_items.media_id → media_assets
-- testimonials: testimonials.media_id → media_assets (if enabled)
-- hero_slides: hero_slides.media_id → media_assets
-- business_settings: logo_media_id, favicon_media_id → media_assets
```

---

## 🔄 REQUEST FLOW: HOW MEDIA IS RESOLVED


### Admin Upload Example
```
1. Admin clicks "Upload Image" in dashboard

2. Browser opens file picker, selects image

3. FormData sent: POST /api/admin/upload
   {
     file: <File>,
     category: "gallery",
     entityType: "gallery",
     entityId: "img-123"
   }

4. Server processes:
   a) Validate: File type (JPEG/PNG/WebP), size (<10MB)
   b) Sharp processing: Resize, optimize, convert to WebP
   c) Generate storage path: /public-assets/images/gallery/{uuid}.webp
   d) Upload to Supabase Storage
   e) Generate public_url: https://cdn.../images/gallery/{uuid}.webp

5. Create canonical media_assets record:
   INSERT INTO media_assets (
     id, bucket, path, public_url, original_name, 
     category, mime_type, width, height, file_size, alt_text
   ) VALUES (...)

6. Response to admin:
   {
     success: true,
     data: {
       id: "{media_uuid}",
       public_url: "https://cdn.../images/gallery/{uuid}.webp",
       original_name: "my-photo.jpg",
       width: 1200,
       height: 800,
       file_size: 45000,
       mime_type: "image/webp"
     }
   }

7. Admin clicks "Choose from Media Library" in gallery item form

8. MediaPickerModal fetches: GET /api/admin/media-assets

9. Admin selects the just-uploaded image

10. Selected media_id stored in: gallery.media_id = "{media_uuid}"

11. Admin saves gallery item

12. Website automatically shows new image (MediaResolver resolves media_id)
```

---

## 🎯 KEY COMPONENTS

### 1. MediaResolver.js (Browser)
**Location:** `assets/js/repositories/MediaResolver.js`  
**Version:** 1.0.0  
**Size:** 91 lines

**API:**
```javascript
window.MediaResolver = {
  // Resolve array of items in one batch query
  resolveCollection(items) → Promise<Array>,
  
  // Resolve single item
  resolveSingle(item) → Promise<Object>,
  
  // Clear in-memory cache
  clearCache() → void
}
```

**Behavior:**
- Batches all missing media_ids into single Supabase query
- Caches result in-memory for session
- Non-fatal: if media_id cannot resolve, legacy image_url remains
- Canonical rule: `if (media_id resolves) { image_url = media_assets.public_url }`

**Cache Pattern:**
```javascript
cache = {
  "media-id-1": { public_url: "https://...", alt_text: "..." },
  "media-id-2": { public_url: "https://...", alt_text: "..." }
}
```

**No N+1 Problem:** Single batch query per content type per page load

### 2. Media Upload Pipeline
**Location:** `zt-lounge-admin/src/app/api/admin/upload/route.ts`  
**Purpose:** Secure image upload, processing, storage, database registration

**Flow:**
```
1. withContentManagerAuth() → Verify super_admin/admin/manager role
2. Parse multipart FormData → Extract file, category, metadata
3. validateImage() → Check MIME type, size, actual content (Sharp)
4. processImage() → Resize, optimize, convert to WebP (Sharp)
5. generateStoragePath() → /public-assets/images/{category}/{uuid}.webp
6. Supabase Storage upload → Write processed image
7. getPublicUrl() → Generate canonical public_url
8. media_assets INSERT → Create canonical metadata row
9. Return: { id, public_url, width, height, mime_type, ... }
```

**Security:**
- Only content managers can upload
- MIME type validated (declared + actual content via Sharp)
- File size enforced (<10MB)
- Path sanitization (UUID + verified category)
- Storage bucket isolation


### Public Website Example (Hero Slides)
```
1. User visits homepage (index.html)

2. Browser executes content-loader.js on DOMContentLoaded

3. HeroRepository.getByPage('home') is called
   └── Query: SELECT * FROM hero_slides 
       WHERE page_id = <home_uuid> AND is_active = true
       ORDER BY display_order ASC

4. Result: Array of slides with fields:
   [
     { id, page_id, media_id: "abc123", image_url: null, alt_text, title, ... },
     { id, page_id, media_id: "def456", image_url: null, alt_text, title, ... }
   ]

5. HeroRepository passes results to MediaResolver.resolveCollection()

6. MediaResolver executes:
   a) Collect missing media_ids: ["abc123", "def456"]
   b) Query (once): SELECT * FROM media_assets WHERE id IN (abc123, def456)
   c) Cache result: { 
       "abc123": { public_url: "https://cdn.../hero-1.webp", alt_text: "Restaurant" },
       "def456": { public_url: "https://cdn.../hero-2.webp", alt_text: "Lounge" }
     }
   d) Apply to items: slide.image_url = media_assets.public_url (override)

7. Result returned to content-loader:
   [
     { ...slide, image_url: "https://cdn.../hero-1.webp", alt_text: "Restaurant" },
     { ...slide, image_url: "https://cdn.../hero-2.webp", alt_text: "Lounge" }
   ]

8. content-loader.js renders:
   <div style="background-image: url('https://cdn.../hero-1.webp')"></div>

9. Browser fetches image from Supabase Storage via CDN
```

