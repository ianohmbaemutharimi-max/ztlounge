# ZT LOUNGE — GOOGLE REVIEWS INTEGRATION AUDIT

## PHASE 1: AUDIT RESULTS

### 1. Existing Testimonials Table

**Status:** ✅ Exists but needs enhancement

**Schema:**
- `id` (UUID, PK)
- `customer_name` (text, NOT NULL)
- `image_url` (text, nullable)
- `occupation` (text, nullable)
- `rating` (smallint 1-5, NOT NULL) ✅
- `comment` (text, NOT NULL)
- `is_featured` (bool, default false)
- `approved` (bool, default false)
- `is_approved` (bool, default null) — DUPLICATE/INCONSISTENT FIELD
- `created_at` (timestamptz)
- `display_order` (int, default 0)
- `page_id` (UUID FK → website_pages)

**Issues Identified:**
1. ❌ Column naming inconsistency: `approved` vs `is_approved` (both exist, both nullable/default false)
2. ❌ Missing Google integration fields: `source`, `source_review_id`, `review_url`, `author_photo_url`, `reviewed_at`
3. ❌ Admin UI references `status` field (line 22: `t.status === "pending"`) but database has `approved`/`is_approved` — MISMATCH

**Current Data:** 0 rows

### 2. RLS Policies

**Current policies:**
- `public can read approved testimonials` (SELECT WHERE approved = true)
- `public_read_approved_testimonials` (SELECT WHERE approved = true OR is_approved IS NULL)
- `testimonials_admin_manage` (ALL WHERE is_admin_or_above())

**Issue:** ❌ RLS policy uses `is_admin_or_above()` for ALL operations. Application auth uses `withContentManagerAuth()` (allows managers). **Authorization mismatch** — managers can request CRUD but will be denied at database level.

### 3. Admin Dashboard

**File:** `src/features/testimonials/testimonials-view.tsx`

**Current features:**
- ✅ List testimonials with rating stars
- ✅ Show "pending" vs "approved" status
- ✅ Feature/unfeature testimonials
- ✅ Approve/Reject testimonials
- ❌ NO manual refresh/sync functionality
- ❌ NO Google source indication
- ❌ NO upload/add new testimonials UI

**Code issues:**
- Line 22: `t.status === "pending"` but database has `approved` boolean
- Line 39: `t.customerName` but database has `customer_name`
- Line 52: `t.content` but database has `comment`
- These field names suggest the UI expects a different schema than what exists

### 4. Public Website

**File:** `pages/contact/gallery.html` (referenced as contact page but actually gallery)

**Status:** ❌ No testimonials/reviews section on public website
- Checked main pages, no testimonials widget found
- No database queries for testimonials in public site code
- No testimonials configuration files found

### 5. Google Integration

**Google API Status:** ⛔ **NO INTEGRATION EXISTS**
- ❌ No Google Places API implementation
- ❌ No Google Business Profile sync
- ❌ No Place ID stored in database/config
- ❌ No Google API credentials environment variables
- ❌ No OAuth/authentication for Google APIs

**Required to proceed:**
- Google Place ID for ZT Lounge
- Google Places API key (or OAuth credentials for restricted access)
- Confirmed permission to access reviews via Google APIs

---

## PHASE 2: IMPLEMENTATION PLAN

### Step 1: Fix Database Schema (Migration Required)

```sql
-- Add Google reviews integration fields
ALTER TABLE testimonials ADD COLUMN source TEXT DEFAULT 'manual';
ALTER TABLE testimonials ADD COLUMN source_review_id TEXT;
ALTER TABLE testimonials ADD COLUMN review_url TEXT;
ALTER TABLE testimonials ADD COLUMN author_photo_url TEXT;
ALTER TABLE testimonials ADD COLUMN reviewed_at TIMESTAMPTZ;
ALTER TABLE testimonials ADD COLUMN synced_at TIMESTAMPTZ;
ALTER TABLE testimonials ADD CONSTRAINT unique_source_review UNIQUE(source, source_review_id) WHERE source_review_id IS NOT NULL;

-- Consolidate approved/is_approved (keep approved, deprecate is_approved)
-- Update RLS to use consistent field
-- Keep is_featured for backward compatibility
```

### Step 2: Fix Admin UI Mismatch

The testimonials-view.tsx UI expects different field names than the database provides:
- UI: `status` → DB: `approved` 
- UI: `customerName` → DB: `customer_name`
- UI: `content` → DB: `comment`

**Options:**
A. Update database column names to match UI (breaking change)
B. Update UI to use database column names
C. Add a database view with aliased columns

**Recommended:** Option C (database view) to preserve backward compatibility

### Step 3: Create Google Review Sync API

Create `zt-lounge-admin/src/app/api/google/sync-reviews/route.ts`:
- Authenticate with `withAdminAuth()` (admin-only, since managers are denied by storage policies)
- Call Google Places API using Place ID (must be configured in env)
- Fetch reviews from Google
- Insert/update testimonials table
- Handle duplicates via UNIQUE(source, source_review_id)
- Return sync status

### Step 4: Update RLS Policy

Fix authorization mismatch:
- Change `testimonials_admin_manage` from `is_admin_or_above()` to `is_manager_or_above()`
- OR restrict Google sync to admins only (recommended for external data)

### Step 5: Public Website Integration

Add testimonials widget to public website:
- Query approved testimonials via Supabase anon key
- Display with source badge (e.g., "Google" vs "Manual")
- Show reviewer name, rating, date, text
- Link to Google review where applicable
- Mobile-responsive layout

---

## BLOCKERS & REQUIREMENTS

**🔴 CRITICAL - Cannot proceed without:**

1. **Google Place ID** — What is the exact Place ID for ZT Lounge on Google Business Profile?
   - Can be found in Google Business Profile URL: `https://www.google.com/maps/place/...`
   - Or via: `https://developers.google.com/maps/documentation/places/web-service/overview`

2. **Google API Access** — Which authentication method?
   - Option A: Google Places API key (public, but limited)
   - Option B: Google OAuth 2.0 (restricted, requires user consent)
   - Option C: Google My Business API (requires special setup)

3. **Verification** — Current Google Business Profile status
   - Does it have published reviews?
   - What is the current review count and average rating?
   - Are you (the developer) authenticated as owner/manager in Google Business Profile?

**Without these, I can build the infrastructure but cannot activate the sync.**

---

## RECOMMENDATION

I recommend:

1. **Fix database schema** (add Google fields, fix approved/is_approved mismatch)
2. **Fix admin UI** (align field names with database)
3. **Fix RLS policies** (allow managers or restrict to admins)
4. **Build sync infrastructure** (Google Places API integration, ready to activate)
5. **Implement public website widget** (display approved testimonials)
6. **Staging mode** (sync works but displays test data until Google credentials are provided)

**Once you provide the Place ID and Google API access method, I can activate the sync.**

---

## STATUS

- ✅ Existing testimonials table: PRESENT but schema needs enhancement
- ❌ Google integration: ABSENT
- ❌ Public website testimonials: ABSENT
- ⚠️ Admin UI: PRESENT but has field mismatches
- ❌ Google Places API: NOT CONFIGURED
