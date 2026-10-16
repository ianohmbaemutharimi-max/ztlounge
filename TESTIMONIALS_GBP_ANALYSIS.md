# TESTIMONIALS & GBP INTEGRATION ANALYSIS

**Status Date:** 2026-10-09  
**Current Phase:** Database schema complete, UI partially built, sync logic TODO

---

## Part 1: Current State

### ✅ Database Schema (Migration 033)
- `testimonials` table enhanced with Google fields:
  - `source` (manual | google)
  - `external_id` (Google review ID)
  - `external_url` (link to Google review)
  - `author_photo_url` (reviewer's Google profile pic)
  - `reviewed_at` (original Google timestamp)
  - `last_synced_at` (last sync time)

- `google_connections` table created:
  - OAuth tokens (refresh_token, access_token)
  - Location identifiers (google_account_id, google_location_id)
  - Sync status tracking
  - RLS policies for manager-level access

- `google_review_sync_runs` table created:
  - Audit trail for sync operations
  - Success/failure tracking
  - Error logging with details

### ✅ Admin UI - Testimonials View
**File:** `src/features/testimonials/testimonials-view.tsx`

Features:
- List testimonials with star ratings
- Show "pending" vs "approved" status
- Feature/unfeature testimonials
- Approve/unapprove button
- Badge showing featured status

Missing:
- ❌ Source badge (manual vs Google)
- ❌ Link to original Google review
- ❌ Google reviewer avatar
- ❌ Manual/Google filter
- ❌ Sync status indicator
