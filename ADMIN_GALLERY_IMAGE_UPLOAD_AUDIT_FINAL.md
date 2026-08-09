# ZT LOUNGE — ADMIN GALLERY IMAGE UPLOAD AUDIT

## Executive Verdict

🔴 **NOT IMPLEMENTED**

> **Can an administrator currently open the ZT Lounge Admin on a phone, select an image from the phone's gallery/storage, upload it, have it stored correctly in Supabase Storage, have its database record created correctly, and have that image automatically appear on the public ZT Lounge website?**

**Answer: NO**

### Evidence

- The admin dashboard's Gallery UI contains an **"Image URL" text input field** (`<Input>` component), not a `<input type="file">` file picker. The placeholder text reads `https://… (storage upload URL)`, confirming admins are expected to enter a URL, not upload a file.
- The API endpoint directory `src/app/api/admin/upload/` exists but is **completely empty** — there is no `route.ts` file, so no upload handler exists.
- There is **no `<input type="file">` element** anywhere in the admin codebase related to gallery or image management.
- The public ZT Lounge website gallery page (`pages/contact/gallery.html`) uses **hardcoded static HTML** with pre-baked Supabase Storage URLs pointing to the `public-assets` bucket, NOT dynamic queries to the `gallery` database table.
- The database `gallery` table stores **relative paths** (e.g. `assets/images/gallery/gallery-01.webp`), which do not match the hardcoded URLs on the public website (e.g. `https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/gallery/gallery-01.webp`).

---

## Architecture Diagram

```text
ADMIN
  ↓
Gallery UI (gallery-view.tsx)
  ↓
Text URL Input (NOT a file picker) ❌
  ↓
"Add Image" form submission → /api/admin/gallery (generic CRUD) ❌
  ↓
Database INSERT (image_url = relative path string)
  ↓
No Storage upload occurs
  ↓
Public Website (gallery.html) — STATIC HTML, does not query database
  ↓
Hardcoded image URLs in <img> tags — images never change dynamically ❌
```

| Stage | Status | Evidence |
|-------|--------|----------|
| Gallery UI | ⚠️ Partial | Form exists but uses URL text input, not file upload |
| File Picker | ❌ Missing | No `<input type="file">` anywhere; upload/ dir is empty |
| Upload Handler | ❌ Missing | `src/app/api/admin/upload/` directory exists but has no route.ts |
| Supabase Storage | ⚠️ Partial | Bucket `gallery-images` exists, public, but is NOT used by the admin UI; images are stored only as text strings in the database |
| DB Gallery Record | ✅ Working | `public.gallery` table exists with 14 rows, RLS enabled |
| Public Website | ❌ Broken | Static HTML with hardcoded URLs; does not query the database |
| Rendered Image | ⚠️ Partial | Images display on the website, but they are pre-baked static assets, not dynamic from the database |

---

## File Evidence

| Component | File | Status | Evidence |
|-----------|------|--------|----------|
| Gallery UI | `zt-lounge-admin/src/features/gallery/gallery-view.tsx` | ⚠️ Partial | Uses `<Input>` for "Image URL" (line 121); no `<input type="file">`; placeholder says `https://… (storage upload URL)` |
| File picker | (none) | ❌ Missing | No `input type="file"` anywhere in codebase; searched all admin source files |
| Upload handler | `zt-lounge-admin/src/app/api/admin/upload/` | ❌ Missing | Directory exists but contains zero files (no `route.ts`) |
| Storage bucket | `storage.buckets` (live) | ✅ Exists (not used by admin) | `gallery-images` bucket exists, `public=true`, but admin code never calls `supabase.storage.from('gallery-images')` |
| Storage policy | `pg_policies` (live) | ⚠️ Partial | INSERT/UPDATE/DELETE on `gallery-images` bucket restricted to `is_admin_or_above()` — managers would be blocked even if an upload endpoint existed |
| Database table | `public.gallery` (live) | ✅ Exists | 14 rows confirmed; RLS enabled; columns: id, title, description, image_url, category, alt_text, display_order, is_featured, is_active, uploaded_by, type, page_id, created_at, updated_at |
| DB insert | `zt-lounge-admin/src/app/api/admin/[resource]/route.ts` | ✅ Working (for URLs only) | Generic CRUD Repository.create() inserts image_url as a text string; no file processing |
| Website query | `pages/contact/gallery.html` | ❌ Broken | Static HTML with 14 hardcoded `<img>` tags; does NOT query Supabase database |
| Public gallery | `pages/contact/gallery.html` (lines 1005-1145) | ⚠️ Partial | 14 images display, but all use hardcoded `https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/gallery/gallery-0X.webp` URLs |

---

## Mobile Upload Verdict

> Can an admin upload a photo directly from their phone?

**NO**

### Explanation

- The admin gallery "Add Image" modal contains only a text input for an image URL. There is no file input element.
- On a phone, tapping the "Add Image" button opens a modal with a text field labeled "Image URL" and a placeholder `https://… (storage upload URL)`.
- There is no native Android/iOS file/photo picker invocation. No `accept="image/*"` attribute exists.
- No `FileReader`, `FormData`, or `Blob` API usage in the gallery view for file handling.
- The empty `src/app/api/admin/upload/` directory confirms no server-side upload endpoint exists to receive files.

---

## Supabase Storage Verdict

### Bucket
- `gallery-images` — EXISTS in live database, `public = true`
- Also exists: `hero-images`, `logos`, `menu-images`, `public-assets`, `service-images`, `testimonial-photos` (all public)

### Visibility
- **Public** — all listed buckets have `public = true`
- Public read is allowed via `cms_storage_public_read` policy (SELECT for all buckets)

### Upload Permissions
- **INSERT** on `gallery-images` objects: restricted to `is_admin_or_above()` (super_admin + admin only)
- Managers are **DENIED** upload to the `gallery-images` bucket at the storage policy level

### Delete Permissions
- **DELETE** on `gallery-images` objects: restricted to `is_admin_or_above()` (super_admin + admin only)
- Managers are **DENIED** deletion from the `gallery-images` bucket at the storage policy level

### Path Strategy
- No standardized path strategy — the admin UI only stores text URLs; no upload path structure is enforced
- The public website uses paths like: `public-assets/images/gallery/gallery-01.webp`
- The database stores relative paths like: `assets/images/gallery/gallery-01.webp`

### Security Status
- ⚠️ **Medium Concern**: Storage policies are correctly restrictive (admin-only for write/delete), but the admin application layer authorizes managers for gallery CRUD operations, creating an **application/database authorization mismatch** that would result in silent failures if a manager attempts uploads.
- ✅ No anonymous write/delete policies exist
- ✅ No unrestricted public write policies

---

## Database Verdict

### Gallery Table
- **Table:** `public.gallery` — EXISTS, RLS enabled, 14 rows confirmed via live MCP query
- **Columns:**
  - `id` (UUID, PK, default gen_random_uuid())
  - `title` (text)
  - `description` (text, nullable)
  - `image_url` (text, NOT NULL, CHECK: length(TRIM(BOTH FROM image_url)) > 0)
  - `category` (text, nullable)
  - `alt_text` (text, nullable)
  - `display_order` (int4, default 0, CHECK >= 0)
  - `is_featured` (bool, default false)
  - `is_active` (bool, default true)
  - `uploaded_by` (UUID FK → profiles.id, nullable)
  - `created_at` / `updated_at` (timestamptz)
  - `type` (text, nullable)
  - `page_id` (UUID FK → website_pages.id, nullable)

### Relevant Columns
- **Image URL/path column:** `image_url` — stores relative paths like `assets/images/gallery/gallery-01.webp`
- **Title:** `title`
- **Description:** `description`
- **Alt text:** `alt_text`
- **Sort/order:** `display_order`
- **Active/published:** `is_active`
- **Featured:** `is_featured`
- **Timestamps:** `created_at`, `updated_at`
- **Uploaded by:** `uploaded_by` (FK to profiles)
- **Page relationship:** `page_id` (FK to website_pages)

### Source of Truth
- The database `gallery` table exists and contains records, but the public website does NOT read from it. The website uses hardcoded static HTML.
- The `image_url` column stores relative paths that do not correspond to actual Supabase Storage URLs used by the website.
- **PostgreSQL is NOT the effective source of truth for the public website gallery** — static HTML is.

### Relationship to Storage
- Database stores text paths, not Storage object references
- Paths in DB (`assets/images/gallery/gallery-01.webp`) do not match the public website paths (`https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/gallery/gallery-01.webp`)
- The database and website are **disconnected** — DB records exist but are not used by the website

### RLS Status
- ✅ RLS enabled on `gallery` table
- ✅ Public can read `is_active = true` records
- ✅ Managers (and above) can perform ALL operations on `gallery` table
- ⚠️ Storage policies for `gallery-images` bucket restrict to admins only — mismatch with table RLS

### Admin Authorization
- Application layer: `withContentManagerAuth` allows managers ✅
- Database table RLS: `is_manager_or_above()` for ALL operations ✅
- Database storage policies: `is_admin_or_above()` for INSERT/DELETE/UPDATE ⚠️
- **Testimonials table** uses `is_admin_or_above()` for ALL operations — managers are denied ❌

---

## Public Website Verdict

### How the website gets gallery images

**HARDCODED (Category C)**

The public gallery page at `pages/contact/gallery.html` contains 14 `<div class="grid-item">` blocks, each with a hardcoded `<img>` tag pointing to a direct Supabase Storage URL on the `public-assets` bucket:

```html
<img src="https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/gallery/gallery-01.webp" alt="ZT Lounge elegant dining area with premium table settings" loading="lazy" />
```

While the page also loads `GalleryRepository.js`, `gallery.config.js`, and `content-loader.js` via deferred scripts (lines 1685-1702), these scripts are intended to **enhance** existing content, not to dynamically generate the gallery from the database. The gallery images themselves are entirely hardcoded in the HTML.

### Would an admin upload automatically appear?

**NO.** The public website does NOT query the Supabase `gallery` table. Even if an admin:
1. Successfully uploaded an image to Supabase Storage (which is currently impossible since no upload endpoint exists)
2. Created a database record in the `gallery` table via the API
3. The image would **NOT** appear on the public website because the website HTML is static and pre-baked with hardcoded image URLs

The public website would need to be completely re-architected to dynamically fetch and render gallery images from the database.

---

## Security Findings

| Severity | Finding | Details |
|----------|---------|---------|
| 🟡 MEDIUM | Application/Database Authorization Mismatch — Gallery | Application allows managers to manage gallery via `withContentManagerAuth`. Database table RLS allows managers (`is_manager_or_above()`). But storage policies for `gallery-images` bucket restrict write/delete to `is_admin_or_above()`. Managers cannot actually upload files to storage. |
| 🟡 MEDIUM | Application/Database Authorization Mismatch — Testimonials | Application allows managers to manage testimonials via `withContentManagerAuth`. **Database table RLS policy restricts ALL operations to `is_admin_or_above()`** — managers are completely denied at the database level. Any manager attempt to CRUD testimonials would fail with a permission error. |
| 🟢 PASS | Service Role Key Protection | The Service Role key (`SUPABASE_SERVICE_ROLE_KEY`) is only used in `getSupabaseAdmin()` and is NOT exposed to the browser. Server-side API routes use the anon key with session cookies, maintaining RLS enforcement. |
| 🟢 PASS | No Anonymous Upload | No storage policies allow anonymous INSERT to any bucket. All write operations require `is_manager_or_above()` or `is_admin_or_above()`. |
| 🟢 PASS | No Anonymous Delete | No storage policies allow anonymous DELETE on any bucket. |
| 🟢 PASS | No Anonymous Update | No storage policies allow anonymous UPDATE on any bucket. |
| 🟢 PASS | Bucket Visibility | All buckets are public for read, but write/delete is restricted via RLS policies. |
| 🔵 LOW | No File Upload Infrastructure | The `src/app/api/admin/upload/` directory exists but is empty, indicating incomplete implementation. No upload endpoint, no file handling, no MIME validation, no size limits on the server. |
| 🔵 LOW | `.env.local` and `.env.local.bak` Untracked | These files are not in `.gitignore` but are untracked, reducing risk of accidental commit. However, `.gitignore` only contains `node_modules`. |
| 🟢 PASS | Input Validation | Admin API uses `Repository` class with `sanitizePayload()` (allowlist-based) and `validateResource()` to prevent SQL injection and unauthorized field access. |
| 🟢 PASS | Service Role Key Not in Browser Bundle | The service role key is only referenced in server-side code (`@/lib/supabase/server.ts:getSupabaseAdmin()`). Client-side code uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` only. |

---

## Detailed Audit Findings

### 1. TRACE THE COMPLETE IMAGE FLOW

The current implementation does **NOT** follow the intended flow:

```
Admin Dashboard → Gallery → Add Image → [Text URL Input] → Database Record (image_url = relative path string) → [No Storage Upload] → Public Website (Static HTML, does not query DB)
```

The actual flow is:
1. Admin navigates to `/dashboard/gallery`
2. Clicks "Add Image" which opens a modal
3. Fills in **text fields**: Title, Category, Image URL (a text input, not a file picker)
4. Form submits to `/api/admin/gallery` (generic CRUD endpoint)
5. A database record is created in the `gallery` table with `image_url` set to whatever string the admin typed
6. The public website does **NOT** use this record — it uses hardcoded `<img>` tags in HTML

### 2. AUDIT THE ADMIN GALLERY UI

- **File upload control:** ❌ Does not exist
- **Input type="file":** ❌ Not present anywhere in the gallery UI
- **Accept attribute:** ❌ Not applicable (no file input)
- **Multiple selection:** ❌ Not applicable
- **Image preview:** ⚠️ Partial — the UI shows a preview of the URL entered in the text field (line 124-125), but this is a URL preview, not a file upload preview
- **Upload progress:** ❌ Not applicable (no upload mechanism)
- **File type rejection:** ❌ Not applicable
- **File size validation:** ❌ Not applicable
- **Error display:** ✅ Form errors are shown (e.g., `form.formState.errors.imageUrl?.message`)
- **Cancel upload:** ⚠️ Cancel button exists for the modal form, not for an in-progress upload (no upload exists)
- **Replace image:** ⚠️ Image URL can be edited via the generic API (update operation)
- **Delete image:** ✅ Delete button exists (line 95), calls `remove.mutate(g.id)` → `/api/admin/gallery/{id}` DELETE

### 3. AUDIT SUPABASE STORAGE

| Item | Status | Details |
|------|--------|---------|
| Buckets exist | ✅ Yes | `gallery-images`, `hero-images`, `logos`, `menu-images`, `public-assets`, `service-images`, `testimonial-photos` |
| Gallery bucket | ✅ Yes | `gallery-images` bucket exists, `public=true` |
| Public or private | Public | All buckets are public |
| Admin uses bucket | ❌ No | Admin code never calls `supabase.storage.from('gallery-images')` |
| Upload paths | ❌ N/A | No upload path strategy since no uploads occur |
| File naming | ❌ N/A | No upload mechanism |
| Filename collisions | ❌ N/A | No upload mechanism |
| Orphaned files on delete | ❌ N/A | Delete only removes DB record, not storage file (no storage file was ever uploaded) |
| Public URLs | ⚠️ Partial | Public read is allowed via `cms_storage_public_read` policy; public URLs can be generated with `getPublicUrl()` |
| Signed URLs | Not used | No signed URL generation in admin code |
| Storage policies | ✅ Exist | INSERT/UPDATE/DELETE restricted to `is_admin_or_above()` for gallery-images |

### 4. AUDIT DATABASE INTEGRATION

- **Table name:** `public.gallery`
- **Primary key:** `id` (UUID, gen_random_uuid())
- **Image URL column:** `image_url` (text, NOT NULL, CHECK length > 0)
- **Title column:** `title` (text)
- **Description column:** `description` (text, nullable)
- **Category column:** `category` (text, nullable)
- **Alt text column:** `alt_text` (text, nullable)
- **Sort/order column:** `display_order` (int4, default 0, CHECK >= 0)
- **Active column:** `is_active` (bool, default true)
- **Featured column:** `is_featured` (bool, default false)
- **Timestamps:** `created_at`, `updated_at` (timestamptz)
- **Uploaded by:** `uploaded_by` (UUID FK → profiles.id, nullable)
- **Type column:** `type` (text, nullable)
- **Page relationship:** `page_id` (UUID FK → website_pages.id, nullable)

**What the database stores:** Relative paths as text strings (e.g., `assets/images/gallery/gallery-01.webp`)

**Is PostgreSQL the source of truth?** ❌ No — the public website uses hardcoded HTML, not database queries. The database table exists but is disconnected from the website.

**DB insert code path:** `Repository.create('gallery', payload)` in `src/lib/repository.ts` → calls `supabase.from('gallery').insert(sanitized)` → stores `image_url` as a raw text string. No file processing, no storage upload.

### 5. AUDIT WEBSITE DISPLAY

**Category: C (Hardcoded)**

The public website at `pages/contact/gallery.html` contains 14 hardcoded gallery items with full Supabase Storage URLs:

```html
<img src="https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/gallery/gallery-01.webp" alt="..." loading="lazy" />
```

While the page loads `GalleryRepository.js` and `content-loader.js` scripts, these are used to enhance existing page content with dynamic data (e.g., business settings, hero slides, services, menu items) but the gallery images themselves are static HTML.

The database `gallery` table stores relative paths (`assets/images/gallery/gallery-01.webp`) which do not match the hardcoded website URLs (`https://...supabase.co/storage/v1/object/public/public-assets/images/gallery/gallery-01.webp`).

**An admin-uploaded image would NOT automatically appear** on the public website.

### 6. MOBILE DEVICE COMPATIBILITY

- **Android Chrome:** ❌ No file picker support — the admin UI only has a text input for URLs
- **iOS Safari:** ❌ Same — no file input, no photo picker invocation
- **Responsive UI:** ✅ The admin dashboard uses Tailwind/UI components that are responsive
- **input type="file":** ❌ Does not exist in gallery UI
- **accept="image/*":** ❌ Not implemented
- **Camera capture:** ❌ Not implemented (no file input to trigger capture)
- **Upload size limits:** ❌ Not implemented (no upload mechanism exists)
- **MIME type handling:** ❌ Not implemented
- **EXIF/orientation:** ❌ Not applicable (no image uploads)
- **Network interruption handling:** ❌ Not applicable

### 7. SECURITY AUDIT

| Check | Result |
|-------|--------|
| Service-role key in client-side code | ✅ Not exposed |
| Service-role key in browser bundles | ✅ Not exposed |
| Insecure Storage policies | ✅ Policies are restrictive (admin-only write/delete) |
| Unrestricted anonymous uploads | ✅ None exist |
| Unrestricted anonymous deletes | ✅ None exist |
| Unrestricted anonymous updates | ✅ None exist |
| Path traversal risks | ✅ N/A (no file uploads) |
| Malicious file types | ✅ N/A (no file upload mechanism) |
| Spoofed MIME types | ✅ N/A (no file upload mechanism) |
| Oversized uploads | ✅ N/A (no upload mechanism — no size limits, but no uploads possible) |
| Executable file uploads | ✅ N/A (no upload mechanism) |
| Unauthorized gallery modifications | ⚠️ Managers can modify gallery DB records (table RLS allows it) but cannot upload to storage (storage policy restricts to admin) |

**Authentication/RBAC mechanism:** API routes use `withContentManagerAuth()` which:
1. Calls `getServerSession()` to verify the user is authenticated
2. Checks `is_manager_or_above()` via the database `current_role()` function
3. Only allows super_admin, admin, and manager roles to proceed
4. Uses the anon key with session cookies, so RLS is enforced at the database level

### 8. DATABASE AS SOURCE OF TRUTH

| System | Status |
|--------|--------|
| Admin gallery | Reads from DB via API (`api.list('gallery')`) ✅ |
| Supabase database | `gallery` table exists with 14 records ✅ |
| Supabase Storage | `gallery-images` bucket exists but is NOT used by admin |
| Public website | Uses hardcoded static HTML, does NOT query DB ❌ |
| Static image config | Images are hardcoded in `gallery.html` ⚠️ |
| Local image directories | Images are served from Supabase Storage `public-assets` bucket, not local dirs |

**Discrepancy identified:** The admin dashboard can read/gallery from the database, but the public website does not use the database for gallery images. This means an admin could add, edit, or delete gallery records in the database, but those changes would have **zero effect** on the public website.

### 9. ERROR AND EDGE-CASE TESTING

#### Successful flow
Admin enters URL → form submits → database record created ✅ (but image must already exist at that URL; no upload occurs)

#### Upload failure
❌ Not applicable — there is no upload to fail. The only "failure" is entering an invalid/non-existent URL, which would result in a broken image on the website (if the website were to use the database, which it doesn't).

#### Database failure
❌ Not applicable — if storage upload succeeded (which it can't) but DB insert failed, there would be an orphaned storage object. Currently neither happens.

#### Delete flow
Admin clicks delete → `remove.mutate(g.id)` → DELETE `/api/admin/gallery/{id}` → database record deleted. No storage file is deleted because no storage file was associated. The public website (hardcoded HTML) is unaffected.

#### Duplicate filename
❌ N/A — no upload mechanism

#### Large image
❌ N/A — no upload mechanism

#### Unsupported file (PDF, SVG, executable)
❌ N/A — no upload mechanism

### 10. CODE SEARCH

Search terms verified against the entire repository:

| Search Term | Result |
|-------------|--------|
| `supabase.storage` | Not found in admin source code |
| `.storage.from` | Not found in admin source code |
| `.upload(` | Not found in admin source code |
| `.remove(` | Not found in admin source code (storage remove) |
| `getPublicUrl` | Not found in admin source code |
| `createSignedUrl` | Not found in admin source code |
| `input type="file"` | Not found in admin source code |
| `accept="image/` | Not found in admin source code |
| `FileReader` | Not found in admin source code |
| `FormData` | Not found in admin source code (gallery related) |
| `gallery` | Found in `gallery-view.tsx`, `repository.ts`, `resources.ts` (API CRUD only) |
| `image_url` | Found in `repository.ts`, `gallery-view.tsx` (text URL field) |
| `storage_path` | Not found |
| Upload scripts | `scripts/upload-to-storage.js` exists in the zt-lounge root but appears to be a migration utility, not part of the admin application |

### 11. MCP / LIVE DATABASE VERIFICATION

| Fact | Source | Status |
|------|--------|--------|
| `gallery` table exists | Live MCP query | ✅ Confirmed |
| `gallery` table has 14 rows | Live MCP query | ✅ Confirmed |
| `gallery` table has RLS enabled | Live MCP query | ✅ Confirmed |
| Gallery table columns match code | Live MCP query + code review | ✅ Confirmed |
| RBAC functions exist | Live MCP query | ✅ Confirmed (`current_role`, `is_admin`, `is_admin_or_above`, `is_manager_or_above`, `is_employee`, `is_super_admin`) |
| Gallery table RLS policy allows managers | Live MCP query | ✅ Confirmed (`gallery_content_manager_all` with `is_manager_or_above()`) |
| Testimonials table RLS policy allows managers | Live MCP query | ❌ MISMATCH — uses `is_admin_or_above()` |
| `gallery-images` storage bucket exists | Live MCP query | ✅ Confirmed |
| `gallery-images` bucket is public | Live MCP query | ✅ Confirmed (`public=true`) |
| Gallery images have relative paths | Live MCP query | ✅ Confirmed (`assets/images/gallery/gallery-01.webp`) |
| Public website uses hardcoded URLs | Static HTML analysis | ✅ Confirmed (does not query database) |

---

## FINAL VERDICT

**Admin phone-gallery upload: NO**
- No file picker exists in the admin UI
- No upload endpoint exists (empty `upload/` directory)
- Admins enter text URLs, not upload files

**Supabase Storage integration: PARTIAL**
- Storage bucket exists and is public
- Storage policies are correctly configured (admin-only write/delete)
- But the admin application never uses Storage — no upload mechanism exists

**Database integration: PARTIAL**
- Database table exists with correct schema and RLS
- Managers can CRUD gallery records at the database level
- But the public website does not read from the database

**Automatic public website update: NO**
- The public website uses hardcoded static HTML
- Database records have no effect on the website
- Uploaded images would not appear without manual HTML edits

**Production readiness of this feature: NOT READY**

---

## Minimal Exact Changes Required

To make the complete flow production-ready, the following changes are needed:

### 1. Create Upload API Endpoint
Create `zt-lounge-admin/src/app/api/admin/upload/route.ts`:
- Authenticate with `withContentManagerAuth()`
- Accept multipart/form-data file uploads
- Validate MIME type (`image/*`), reject non-image files
- Validate file size (recommended: 5MB max)
- Upload to `gallery-images` bucket with UUID-based filename
- Return the public URL
- Handle upload failures with proper error responses

### 2. Fix Storage Policy Alignment
Either:
- **Option A:** Update `gallery-images` storage policies to use `is_manager_or_above()` for INSERT/UPDATE/DELETE (aligning with table RLS and application auth)
- **Option B:** Keep storage policies admin-only and restrict gallery upload to admins only (change application auth from `withContentManagerAuth` to `withAdminAuth`)

### 3. Fix Testimonials RLS Policy Mismatch
Update the `testimonials` table RLS policy to use `is_manager_or_above()` instead of `is_admin_or_above()` to match the application-layer authorization.

### 4. Update Admin Gallery UI
Modify `gallery-view.tsx`:
- Replace the "Image URL" text input with a file upload control (`<input type="file" accept="image/*" />`)
- Add image preview before upload (using FileReader)
- Add upload progress indicator
- Integrate with the new upload API endpoint
- Handle upload errors with clear user-facing messages

### 5. Create Database-to-Website Connection
For the public website to display dynamically uploaded images:
- **Option A (Static site):** Modify `content-loader.js` or `GalleryRepository.js` on the public website to query the `gallery` table via Supabase anon key and dynamically render images
- **Option B (Build-time):** Modify the website build process to query the gallery table and generate HTML at build time
- **Option C (Hybrid):** Use the existing `GalleryRepository.js` to fetch gallery items and replace the hardcoded HTML gallery with dynamic rendering

### 6. Align Database Image Paths
The database currently stores relative paths (e.g., `assets/images/gallery/gallery-01.webp`). The upload handler should store full Supabase Storage URLs (e.g., `https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/gallery-images/{uuid}.webp`) in the `image_url` column to match what the public website expects.

### 7. Implement Delete Cascade Cleanup
When a gallery record is deleted, also remove the corresponding file from Supabase Storage. This can be done via:
- A Supabase database trigger that calls a stored function to delete the storage object
- Server-side logic in the DELETE API route that removes the storage file before deleting the DB record
