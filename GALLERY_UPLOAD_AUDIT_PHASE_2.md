# ZT LOUNGE — GALLERY UPLOAD AUDIT — PHASE 2: TRACE FILE UPLOAD

## Objective
Search the entire codebase for any file upload implementation and determine whether an administrator can select and upload images from their device.

---

## SEARCH METHODOLOGY

### Search 1: Admin Dashboard (React/TypeScript)
**Location:** `../zt-lounge-admin/src/`

**Patterns Searched:**
```regex
type=["']file["']|accept=["']image|<input[^>]*file|FileReader|FormData.*File|\.upload\(|storage\.from
```

**Result:** **ZERO matches found**

**Conclusion:** The admin dashboard contains NO file upload controls, NO FileReader API usage, NO FormData file handling, and NO Supabase Storage upload operations.

---

### Search 2: Scripts Directory
**Location:** `scripts/`

**File Found:** `scripts/upload-to-storage.js`

**Purpose:** This is a **developer-only Node.js script** for bulk uploading local `assets/images/` files to Supabase Storage.

**Key Details:**
- **Line 5:** Usage: `node scripts/upload-to-storage.js`
- **Lines 12-16:** Configuration with hardcoded credentials
- **Lines 34-73:** `uploadFile()` function that uploads via HTTPS POST to Supabase Storage API
- **Lines 76-100:** `getAllFiles()` recursively scans local filesystem
- **Lines 103-159:** Main function that uploads files sequentially

**Critical Analysis:**
1. This is a **command-line developer tool**, NOT a browser-accessible feature
2. Requires Node.js and filesystem access
3. **Cannot be run from a phone or browser**
4. Uploads from `assets/images/` directory on the developer's machine
5. Uses anon key for authentication (line 14)
6. Target bucket: `public-assets` (line 15)
7. Preserves folder structure: `assets/images/autospa/file.webp` → `public-assets/images/autospa/file.webp`

**Verdict:** This script is for **initial setup/migration only**, not for end-user admin functionality.

---

## DETAILED CODE ANALYSIS

### Admin Gallery Component
**File:** `../zt-lounge-admin/src/features/gallery/gallery-view.tsx`

**Lines 115-136:** Add Image Modal Form
```tsx
<Modal open={open} onClose={() => setOpen(false)} title="Add Gallery Image">
  <form onSubmit={form.handleSubmit((v) => add.mutate(v))} className="space-y-4">
    <Field label="Title" error={form.formState.errors.title?.message}>
      <Input placeholder="e.g. VIP Booth" {...form.register("title")} />
    </Field>
    <Field label="Category" error={form.formState.errors.category?.message}>
      <Input placeholder="Interior, Food, Drinks, Events…" {...form.register("category")} />
    </Field>
    <Field label="Image URL" error={form.formState.errors.imageUrl?.message}>
      <Input placeholder="https://… (storage upload URL)" {...form.register("imageUrl")} />
    </Field>
    {watchedUrl && !form.formState.errors.imageUrl && (
      <img src={watchedUrl} alt="Preview" className="h-40 w-full rounded-xl object-cover" 
           onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
    )}
    {add.isError && <p className="text-sm text-rose-400">{(add.error as Error).message}</p>}
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      <Button type="submit" disabled={add.isPending}>{add.isPending ? "Adding…" : "Add Image"}</Button>
    </div>
  </form>
</Modal>
```

**What's MISSING:**
```tsx
// ❌ NO file input field like this:
<input 
  type="file" 
  accept="image/*" 
  onChange={handleFileSelect}
/>

// ❌ NO file upload handler like this:
const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  const formData = new FormData();
  formData.append('file', file);
  
  const { data, error } = await supabase.storage
    .from('public-assets')
    .upload(`images/gallery/${file.name}`, file);
    
  if (data) {
    form.setValue('imageUrl', getPublicUrl(data.path));
  }
};

// ❌ NO Supabase Storage client usage
```

**What EXISTS:**
- Text input field for manually entering image URLs
- Image preview that displays when a valid URL is entered
- Form validation requiring a valid URL string
- Database mutation to save the URL

---

### Validation Schema
**File:** `../zt-lounge-admin/src/features/gallery/gallery-view.tsx` (Lines 17-22)

```tsx
const imageSchema = z.object({
  title: z.string().min(2, "Title is required"),
  imageUrl: z.string().url("Enter a valid image URL"),  // ← Expects STRING, not File
  category: z.string().min(2, "Category is required"),
});
```

**Analysis:**
- `imageUrl` is validated as `z.string().url()`
- This means it **MUST be a text string** containing a valid HTTP(S) URL
- A `File` object would fail this validation
- No file-specific validation exists (MIME type, file size, dimensions, etc.)

---

### Database Schema
**File:** `../zt-lounge-admin/src/db/schema.ts` (Lines 306-321)

```typescript
export const gallery = pgTable("gallery", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title"),
  description: text("description"),
  imageUrl: text("image_url").notNull(),  // ← TEXT field, not BYTEA
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

**Analysis:**
- `imageUrl` column is `text("image_url").notNull()`
- Stores URL strings, NOT binary image data
- No blob/bytea column for file storage
- Database expects a reference (URL) to an image, not the image itself

---

### File Upload Table (Metadata Only)
**File:** `../zt-lounge-admin/src/db/schema.ts` (Lines 323-336)

```typescript
export const fileUploads = pgTable("file_uploads", {
  id: uuid("id").primaryKey().defaultRandom(),
  bucket: text("bucket").notNull(),
  path: text("path").notNull(),
  originalName: text("original_name"),
  mimeType: text("mime_type"),
  fileSize: integer("file_size"),
  contentHash: text("content_hash"),
  uploadedBy: uuid("uploaded_by"),
  uploadedFilename: text("uploaded_filename"),
  uploadedMimeType: text("uploaded_mime_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

**Analysis:**
- A `file_uploads` table exists for tracking upload metadata
- This table is **NOT USED** anywhere in the gallery feature
- It's designed to store:
  - Bucket name
  - Storage path
  - Original filename
  - MIME type
  - File size
  - Content hash
  - Who uploaded it
- The table exists but is **not integrated** with the gallery workflow

---

## CURRENT WORKFLOW REALITY

### What an Admin MUST Do Today:

1. **Obtain an Image Somehow** (outside the application)
   - Take a photo with their phone
   - Download an image from somewhere
   - Create/edit an image

2. **Manually Upload to Supabase** (outside the application)
   - Log into Supabase dashboard separately
   - Navigate to Storage
   - Navigate to `public-assets` bucket
   - Navigate to `images/gallery/` folder
   - Click "Upload file"
   - Select the image file
   - Wait for upload to complete
   - Copy the generated public URL

3. **Return to Admin Dashboard**
   - Navigate to Gallery page
   - Click "Add Image"
   - **Paste the copied URL** into the "Image URL" field
   - Enter title and category
   - Submit form

### Problems with This Workflow:

❌ **Not phone-friendly** — requires switching between apps and copy/paste  
❌ **Requires Supabase dashboard access** — admin needs separate credentials  
❌ **Error-prone** — manual URL copying can introduce typos  
❌ **No validation** — admin could paste any URL, including broken links  
❌ **Poor UX** — 10+ steps vs. a single "Upload Photo" button  
❌ **No metadata capture** — file size, dimensions, etc. not recorded  
❌ **No compression** — large images uploaded as-is, no optimization  
❌ **No access control** — anyone with the bucket name can upload  

---

## WHAT A PROPER IMPLEMENTATION WOULD LOOK LIKE

### Expected User Flow:
```
Phone/Computer
  ↓
Admin Dashboard Gallery Page
  ↓
"Add Image" button clicked
  ↓
Native file/photo picker opens
  ↓
User selects image from device
  ↓
Browser reads File object
  ↓
(Optional) Client-side image validation/compression
  ↓
Upload to Supabase Storage via authenticated API
  ↓
Supabase returns storage path
  ↓
Generate public URL
  ↓
Create database record with URL
  ↓
Image immediately visible in gallery list
  ↓
Public website automatically shows new image
```

### Required Components (MISSING):

1. **File Input Component**
```tsx
<input
  type="file"
  accept="image/*"
  capture="environment"  // For mobile camera
  onChange={handleFileChange}
/>
```

2. **File Upload Handler**
```tsx
const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  // Validate
  if (!file.type.startsWith('image/')) {
    toast.error('Please select an image file');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Image must be under 5MB');
    return;
  }
  
  // Upload
  setUploading(true);
  const filename = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('public-assets')
    .upload(`images/gallery/${filename}`, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    toast.error('Upload failed: ' + error.message);
    setUploading(false);
    return;
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('public-assets')
    .getPublicUrl(data.path);
  
  // Set form field
  form.setValue('imageUrl', publicUrl);
  setUploading(false);
  toast.success('Image uploaded successfully');
};
```

3. **Supabase Storage Client**
```tsx
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

4. **Storage Policies** (to be verified in Phase 3)
```sql
-- Allow authenticated users to upload to gallery folder
CREATE POLICY "Authenticated users can upload gallery images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'public-assets' AND
  (storage.foldername(name))[1] = 'images' AND
  (storage.foldername(name))[2] = 'gallery'
);
```

---

## PHASE 2 ANSWER

### **Can the admin currently select a photo from phone/computer storage?**

# **NO**

---

## EVIDENCE

1. ✅ **Search completed:** Zero matches for file upload patterns in admin codebase
2. ✅ **Gallery component inspected:** Uses text `<Input>` for manual URL entry, NOT `<input type="file">`
3. ✅ **Form schema verified:** Validates `imageUrl` as string URL, NOT File object
4. ✅ **Database schema verified:** Stores text URLs, NOT binary data
5. ✅ **Upload script found:** Developer CLI tool only, not browser-accessible
6. ✅ **No Supabase Storage client usage:** No `.storage.from()` or `.upload()` calls in admin code

---

## PHONE WORKFLOW VERDICT

**Current State:** An administrator **CANNOT** use their phone to:
- Open the admin dashboard
- Click "Add Image"
- Select a photo from their phone's gallery
- Upload it
- Have it automatically appear on the website

**Required Action:** They must:
- Open Supabase dashboard (separate app/browser)
- Log in with developer credentials
- Navigate to Storage bucket
- Upload the image manually
- Copy the generated URL
- Return to admin dashboard
- Paste the URL into the text field

**Mobile Usability:** ❌ **BROKEN** — This workflow is impractical on a phone.

---

## NEXT: PHASE 3

Verify Supabase Storage configuration using MCP to determine:
- Which Storage buckets exist
- Whether `public-assets` bucket is configured
- Bucket visibility (public vs private)
- Upload/delete policies
- Admin access controls
