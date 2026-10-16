# MEDIA LIBRARY ARCHITECTURE REPORT
**READ-ONLY ANALYSIS | v1.0.0 | October 9, 2026**

## 🎯 EXECUTIVE SUMMARY

**Single Source of Truth:** `media_assets` table (Supabase database)  
**Resolution Path:** `media_id` (UUID) → `media_assets.public_url` via `MediaResolver`  
**Pattern:** All content uses identical media_id FK pattern  
**Status:** ✅ Fully Implemented (127 media assets, active in production)

---

## 🏗️ ARCHITECTURE LAYERS

```
LAYER 4: Admin Dashboard
  └─ Upload + CMS Editors
       ↓
LAYER 3: Content Tables
  └─ hero_slides, gallery, services, menu_items (all use media_id FK)
       ↓
LAYER 2: Resolution (Browser)
  └─ MediaResolver.js (batched queries, in-memory cache)
       ↓
LAYER 1: Storage
  └─ media_assets table + Storage bucket (public-assets)
```

---

## 🎯 KEY COMPONENTS

### 1. MediaResolver.js
**File:** `assets/js/repositories/MediaResolver.js` | **Lines:** 91 | **Version:** 1.0.0

**API:**
- `resolveCollection(items)` → Promise<Array>
- `resolveSingle(item)` → Promise<Object>
- `clearCache()` → void

**Behavior:**
- Batches ALL missing media_ids into ONE database query
- Caches result in-memory for session
- Non-fatal: falls back to legacy image_url if resolution fails
- Rule: `if (media_id ∈ cache) { image_url = media_assets.public_url }`

### 2. Upload Endpoint
**Endpoint:** `POST /api/admin/upload`  
**File:** `zt-lounge-admin/src/app/api/admin/upload/route.ts`

**Process:**
1. Verify content manager role
2. Validate MIME type (declared + actual)
3. Check file size (<10MB)
4. Sharp: Resize → Convert to WebP → Compress (quality 80)
5. Store: `/public-assets/images/{category}/{uuid}.webp`
6. Create media_assets row
7. Return: { id, public_url, width, height, mime_type }

### 3. Media Library API
**Endpoint:** `GET /api/admin/media-assets`  
**File:** `zt-lounge-admin/src/app/api/admin/media-assets/route.ts`

**Response:** `{ data: [...], pagination: { page, limit, total, totalPages, hasNext, hasPrev } }`

### 4. Media Picker Modal
**File:** `zt-lounge-admin/src/components/MediaPickerModal.tsx`  
**Used By:** Hero editor, Gallery editor, Services editor, Menu editor, Branding settings

---

## 📊 DATA MODEL

### media_assets (Canonical)
```
id UUID PRIMARY KEY
public_url TEXT              ← ✅ AUTHORITATIVE
original_name TEXT
category TEXT               (gallery, homepage, menu, services, branding)
media_type TEXT            (image)
mime_type TEXT             (image/webp after processing)
alt_text TEXT
width, height INTEGER
file_size INTEGER
bucket, path TEXT
created_at, updated_at
```

### Content Tables (All Use Same Pattern)
```
hero_slides.media_id → media_assets.id
gallery.media_id → media_assets.id
services.media_id → media_assets.id
menu_items.media_id → media_assets.id
testimonials.media_id → media_assets.id (available)
business_settings.logo_media_id → media_assets.id
business_settings.favicon_media_id → media_assets.id
```

---

## 📋 CONTENT INTEGRATION

| Content | Table | Status | Notes |
|---------|-------|--------|-------|
| **Hero Slides** | hero_slides | ✅ Active | Resolved via MediaResolver |
| **Gallery** | gallery | ✅ Active | Full v3.0.0 migration |
| **Services** | services | ✅ Active | Catalog manager |
| **Menu Items** | menu_items | ✅ Active | Catalog manager |
| **Testimonials** | testimonials | ⏳ Available | Field exists |
| **Logo** | business_settings | ✅ Active | branding-init.js |
| **Favicon** | business_settings | ✅ Active | Independent |
