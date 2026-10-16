### ❌ Backend - Google OAuth Flow (NOT IMPLEMENTED)
**Expected location:** `src/app/api/admin/google/auth/...`

Missing:
- ❌ OAuth initiation endpoint
- ❌ Callback handler
- ❌ Token storage
- ❌ Token refresh logic

### ❌ Backend - Review Sync Logic (NOT IMPLEMENTED)
**Expected location:** `src/app/api/admin/google/reviews/sync/route.ts`

Missing:
- ❌ Fetch reviews from Google API
- ❌ Map to testimonials schema
- ❌ Idempotent upsert logic
- ❌ Error handling & retry
- ❌ Rate limiting

### ❌ Admin UI - Google Connection Setup (NOT IMPLEMENTED)
**Expected location:** `src/features/testimonials/google-connection-settings.tsx`

Missing:
- ❌ Connect to Google button
- ❌ OAuth flow UI
- ❌ Connection status display
- ❌ Disconnect button
- ❌ Manual sync trigger

---

## Part 2: Data Flow Architecture

### Current Manual Workflow
```
Admin creates review → Save to DB → Display on public site
```

### Target GBP Integration Workflow
```
┌─────────────────────────────────────────────┐
│  Admin Dashboard (testimonials-view.tsx)    │
│                                             │
│  [Connect Google] [Manual Sync] [Settings]  │
└──────────────┬──────────────────────────────┘
               │
               ├─→ OAuth Flow (Phase 1)
               │   • Initiate
               │   • Callback
               │   • Store tokens
               │
               └─→ Manual Sync (Phase 2)
                   • Fetch from Google API
                   • Map to testimonials
                   • Idempotent upsert
                   • Log results
```

---

## Part 3: Implementation Roadmap

### Phase 1: Google OAuth Setup (2-3 hours)
**Goal:** Enable admin to connect Google Business Profile

Files to create:
```
src/app/api/admin/google/auth/start/route.ts
src/app/api/admin/google/auth/callback/route.ts
src/features/testimonials/google-connection-settings.tsx
src/lib/google/oauth.ts
```

### Phase 2: Review Sync Logic (3-4 hours)
**Goal:** Fetch reviews from Google and store locally

Files to create:
```
src/app/api/admin/google/reviews/sync/route.ts
src/lib/google/reviews-sync.ts
src/lib/google/my-business-api.ts
```

### Phase 3: UI Enhancements (2 hours)
**Goal:** Display Google reviews with source information

Enhancements:
- Source badge (Manual/Google)
- Link to original review
- Reviewer avatar
- Filter by source
- Sync history

### Phase 4: Automation (2 hours)
**Goal:** Keep reviews synced automatically

Options:
- Daily background sync
- Manual trigger UI
- Monitoring dashboard
