# PHASE J — Security Containment Audit

**Project:** ZT Lounge Meru — restaurant/lounge/events website  
**Supabase Instance:** `https://jczwilrysvnhcjzjztbi.supabase.co` (ref: `jczwilrysvnhcjzjztbi`)  
**Audit Scope:** Service-role credential exposure, git history exposure, client accessibility, service-role usage, rotation impact, storage bucket classification, immediate containment plan  
**Mode:** Plan (read-only — no secrets, storage, RLS, or source code modified)  
**Date:** 2026-10-04  

---

## Severity Register

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| SR-01 | **CRITICAL** | Service-role JWT committed to public-repo git history (107 checkpoint commits) | Contained locally — not pushed to remote |
| SR-02 | **CRITICAL** | Service-role JWT committed to admin-repo git history (2 commits: `da540cd`, `aee436e`) | Reachable from all admin branches — never pushed to remote |
| SR-03 | **CRITICAL** | Admin `.gitignore` is only `node_modules` — no env-file protection; `.env.local`, `.env.local.bak`, `.env.local.pre-phase2` are untracked but NOT git-ignored | Immediate risk on next `git add .` |
| SR-04 | **HIGH** | `.env.local.bak` and `.env.local.pre-phase2` contain live service-role keys in working tree | Delete or git-ignore immediately |
| SR-05 | **HIGH** | `probe-storage.js` and `phasej-audit/env*.js` contain hardcoded service-role JWT in working tree | Remove working-tree key files |
| SR-06 | **MEDIUM** | Service-role key may have been deployed to Vercel from `.env.local` | Verify Vercel env; rotate key |
| ST-01 | **HIGH** | All 9 Supabase storage buckets are public — objects downloadable anonymously | Reclassify buckets; apply signed URLs |
| ST-02 | **MEDIUM** | CORS proxies can fetch public bucket objects (Jina reader confirmed) | Accept for public assets; monitor |
| SR-07 | **LOW** | `supabaseAdmin` module-level export in `admin.ts` instantiates client at module load | Code-quality risk, not exposure |

---

## Phase 1 — Repository Baselines

### 1.1 Public repository (`zt-lounge`)

| Property | Value |
|----------|-------|
| Path | `D:\zt lounge\zt-lounge-demo\zt-lounge` |
| Branch (local HEAD) | `feature/membership-tiers-staging-phase1` |
| HEAD commit | `d183ddab7399429f3c334c4d288d6b0988a78f89` |
| Remote branch | `origin/main` at `319fe79` (2026-07-04) |
| Remotes | `origin: https://github.com/ianohmbaemutharimi-max/ztlounge.git` |
| Total commits across all refs | ~5 (plus 107 local-only checkpoint commits — see Phase 14) |

### 1.2 Admin repository (`zt-lounge-admin`)

| Property | Value |
|----------|-------|
| Path | `D:\zt lounge\zt-lounge-demo\zt-lounge-admin` |
| Branch (local HEAD) | `clean-rebuild` |
| HEAD commit | `876b1851fb` — `feat: implement Team Directory API endpoint` |
| Other branches | `main`, `backup/pre-clean-reset` |
| Remotes | **NONE** — never pushed to any remote |
| Git status | 515 modified files, 32 untracked files |

### 1.3 `.gitignore` Coverage

**Public repo `.gitignore`** (lines 9–17):
```
.env
.env.*
.env.local
.env.*.local
.env.production
.env.staging
!.env.example
```
- `.env.local.bak` → covered by `.env.*` ✓
- `.env.local.pre-phase2` → covered by `.env.*` ✓
- `phasej-audit/env*.js` → NOT covered ✗ (would be committed by `git add .`)

**Admin repo `.gitignore`** (only 1 line):
```
node_modules
```

| Admin file | Tracked? | Git-ignored? | Risk |
|------------|----------|-------------|------|
| `.env.local` | No | No ✗ | Would be committed by `git add .` |
| `.env.local.bak` | No | No ✗ | Would be committed by `git add .` |
| `.env.local.pre-phase2` | No | No ✗ | Would be committed by `git add .` |
| `.envkeys.txt` | No | No ✗ | Would be committed by `git add .` (not on disk currently) |
| `.env.example` | Yes | N/A | Safe — no secrets |

> **CRITICAL (SR-03)**: The admin repo has no `.gitignore` entries for environment files. Any `git add .` followed by a push will expose all service-role keys.

---

## Phase 2 — Credential Inventory

### 2.1 Service-role JWT fingerprint

Both repos reference the same Supabase project instance. The service-role JWT fingerprint (confirmed via `probe-storage.js` and `phasej-audit/env*.js`):

```
[REDACTED — JWT prefix withheld per containment protocol]
```

### 2.2 Where the live JWT is stored

| File (working tree) | Tracked? | Git-ignored? | Contains full JWT? |
|---------------------|----------|-------------|-------------------|
| `zt-lounge-admin/.env.local` | No | No ✗ | Yes |
| `zt-lounge-admin/.env.local.bak` | No | No ✗ | Yes |
| `zt-lounge-admin/.env.local.pre-phase2` | No | No ✗ | Yes |
| `zt-lounge/phasej-audit/env1.js` | No | No ✗ | Yes (hardcoded inline) |
| `zt-lounge/phasej-audit/env2.js` | No | No ✗ | Yes |
| `zt-lounge/phasej-audit/env3.js` | No | No ✗ | Yes |
| `zt-lounge/phasej-audit/env4.js` | No | No ✗ | Yes |
| `zt-lounge/phasej-audit/probe-storage.js` | No | No ✗ | Yes (hardcoded inline) |

### 2.3 Anon key

- Anon key is **public by design** — embedded in `assets/js/config/supabase.config.js` (browser-visible, intended)
- Also in `.env.local` (root) and `phasej-audit/env1.js` and `PHASEJ_SUMMARY.md`
- Anon key JWT expires 2099-517250 (year ~2034)

---

## Phase 3 — Service-Role Exposure Determination

| Check | Result |
|-------|--------|
| Source-controlled in current branch? | **No** — `.env.local` and env files are untracked |
| Present in git history (committed)? | **Yes** — admin: commits `da540cd`, `aee436e`; public: 107 checkpoint commits (see Phase 14) |
| In browser-accessible JS / bundles? | **No** — service-role key NOT found in `assets/js/` or any public JS |
| In browser runtime? | **No** — `window.SupabaseClient` initialized with anon key only |
| In API route source? | **No** — routes reference `process.env.SUPABASE_SERVICE_ROLE_KEY` (env var name), not the value |
| Deployed to Vercel? | **Cannot verify** — no deployment config in repo; env vars set at Vercel level |

**Client-side exposure verdict: NONE.** The service-role key is never sent to the browser. The public site uses exclusively the anon key (public by design).

---

## Phase 4 — Service-Role Consumer Mapping

### 4.1 Functions that instantiate a service-role client

| File | Function/Export | Usage |
|------|-----------------|-------|
| `src/lib/supabase/admin.ts` | `getSupabaseAdmin()` | Returns `createClient` with `SUPABASE_SERVICE_ROLE_KEY!; auth: { autoRefreshToken: false, persistSession: false }` |
| `src/lib/supabase/server.ts` | `getSupabaseAdmin()` (async) | Same config; dynamically imported `@supabase/supabase-js` |
| `src/lib/supabase/admin.ts:17` | `supabaseAdmin` (module-level export) | `getSupabaseAdmin()` called at module load — instantiated immediately on import |
| `src/lib/supabase/client.ts:15` | `serviceRoleKey` (config field) | `process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""` — field in config interface, not passed to `createClient` |

### 4.2 Call sites that invoke `getSupabaseAdmin()` or `supabaseAdmin`

| File | Line | Context |
|------|------|---------|
| `src/app/api/admin/upload/route.ts` | 145 | Upload handler — admin client for storage upload |
| `src/app/api/admin/upload/route.ts` | 294 | Upload handler — admin client for public URL fetch |
| `src/app/api/admin/media-assets/route.ts` | 25 | Media listing — admin client for paginated asset query |
| `src/lib/supabase/admin.ts` | 17 | `supabaseAdmin` export — module-level instantiation |
| `src/lib/supabase/server.ts` | 25 | `getSupabaseAdmin()` function definition |

### 4.3 Direct `process.env.SUPABASE_SERVICE_ROLE_KEY` access

| File | Line | Context |
|------|------|---------|
| `src/lib/supabase/admin.ts` | 7 | Inside `getSupabaseAdmin()` |
| `src/lib/supabase/server.ts` | 30 | Inside `getSupabaseAdmin()` |
| `src/lib/supabase/client.ts` | 15 | Config field only — `?? ""` fallback, NOT passed to client |
| `src/app/api/admin/resources.ts` | 40 | `logActivity()` — direct fetch with key in headers |

### 4.4 API routes using `withAdminAuth` (session client, NOT service-role)

| Route | Auth wrapper | Notes |
|-------|-------------|-------|
| `src/app/api/admin/[resource]/route.ts` | `withAdminAuth` / `withContentManagerAuth` | Generic resource handler — session client |
| `src/app/api/admin/[resource]/[id]/route.ts` | `withAdminAuth` / `withContentManagerAuth` | Generic resource item handler |
| `src/app/api/dashboard/stats/route.ts` | `withAdminAuth` | Uses `auth.supabase` |
| `src/app/api/admin/business-settings/branding/route.ts` | `withAdminAuth` | Branding PATCH — session client |

### 4.5 Audit-only files

| File | Role | Risk |
|------|------|------|
| `RUNTIME_VERIFICATION_EXECUTOR.mjs` | Test/audit | References env-var names only — no live key |
| `scripts/launch-database-repair-audit.js` | DB repair | Uses anon key — no service-role reference |

---

## Phase 5 — Deployment Exposure

### 5.1 Vercel deployments

| App | URL | Env var source |
|-----|-----|----------------|
| Admin | `https://zt-lounge-admin.vercel.app` | Vercel env vars (not in repo) |
| Public | `https://zt-lounge-demo.vercel.app` | Vercel env vars (not in repo) |

- No `vercel.json`, `.vercelignore`, or deployment config in either repo
- Admin repo never pushed to remote — Vercel deployment likely created via `vercel --cwd` from local working copy
- **Unknown**: Whether Vercel env vars were populated from the current `.env.local` (which may contain stale or live service-role key)

### 5.2 Deployment risk

| Risk | Detail |
|------|--------|
| Stale key | If `.env.local` was modified after deployment, the running Vercel app may still use an old key |
| Key rotation gap | Rotating the service-role key will break the Vercel deployment until env vars are updated |
| Unknown current key | Cannot determine what key value is currently active on Vercel without access |

---

## Phase 6 — Rotation Impact Register

| Service-role consumer | Impact of key rotation |
|----------------------|----------------------|
| `getSupabaseAdmin()` in `admin.ts` | Module-level `supabaseAdmin` uses old key → all admin storage/API operations fail |
| `upload/route.ts` | 401/403 on upload endpoint |
| `media-assets/route.ts` | 500 error on media listing |
| `resources.ts` `logActivity()` | Silent failure — activity logs lost |
| Vercel deployment | 500s on admin API routes until env updated |

### 6.1 Rotation checklist

1. Generate new service-role key in Supabase Dashboard
2. Update `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in Vercel env (both Preview and Production)
3. Update local `zt-lounge-admin/.env.local` and delete `.env.local.bak`, `.env.local.pre-phase2`
4. **Purge git history** of old key (see Phase 18 — **requires owner approval**)
5. Remove `phasej-audit/env*.js` and `probe-storage.js` from working tree
6. Redeploy all Vercel apps
7. Verify all admin API routes still function after rotation

---

## Phase 7 — Storage Bucket Inventory

From `probe-storage-sdk.js` results (`phasej-storage-report.json`):

| # | Bucket | Public? | Object Count | Created | Classification |
|---|--------|---------|-------------|---------|----------------|
| 1 | `hero-images` | YES | 2 | 2026-07-20 | Public marketing assets |
| 2 | `gallery-images` | YES | 15 | 2026-07-20 | Public gallery |
| 3 | `service-images` | YES | 8 | 2026-07-20 | Public service photos |
| 4 | `menu-images` | YES | 13 | 2026-07-20 | Public menu photos |
| 5 | `testimonial-photos` | YES | 0 | 2026-07-20 | Empty — placeholder |
| 6 | `logos` | YES | 2 | 2026-07-20 | Public branding assets |
| 7 | `favicons_probe` | YES | 0 | 2026-10-03 | Audit artifact — DELETE |
| 8 | `public-assets` | YES | 2 | 2026-08-05 | Public static assets |
| 9 | `favicons` | YES | 1 | 2026-10-03 | Audit artifact — DELETE |

### 7.1 Consumer mapping

| Bucket | Used by | URL format |
|--------|---------|-----------|
| `hero-images` | `index.html`, `business_settings` | `supabase.co/storage/v1/object/public/hero-images/{name}` |
| `gallery-images` | `MediaResolver.js` → `media_assets.public_url` | `supabase.co/storage/v1/object/public/gallery-images/{name}` |
| `service-images` | `services` table via service-role REST | `supabase.co/storage/v1/object/public/service-images/{name}` |
| `menu-images` | `menu_items.image_url` (legacy) | `supabase.co/storage/v1/object/public/menu-images/{name}` |
| `testimonial-photos` | Not used (empty) | N/A |
| `logos` | `business_settings.logo_media_id` | `supabase.co/storage/v1/object/public/logos/{name}` |
| `public-assets` | `index.html` (hardcoded) | `supabase.co/storage/v1/object/public/public-assets/{path}` |
| `favicons_probe` | Audit only | N/A |
| `favicons` | Audit only | N/A |

---

## Phase 8 — Media URL Architecture

### 8.1 Public site (zt-lounge)

1. **Canonical path**: `content.media_id → media_assets.public_url` via `MediaResolver.js` (anon-key REST query)
   - Query: `from('media_assets').select('id, public_url, alt_text').in('id', ids)`
   - Cached in-memory per session
   - Legacy `image_url` used only as fallback when `media_id` is null or asset not found

2. **Legacy direct URLs**: `index.html` contains some hardcoded storage URLs:
   - `https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/restaurant/hero-restaurant.webp`
   - Comment in `index.html` states: "No hardcoded gallery URLs are kept as source of truth"

### 8.2 Admin site (zt-lounge-admin)

1. Upload → `getSupabaseAdmin()` → `supabaseAdmin.storage.from(bucket).upload()` → `getPublicUrl()` → returns raw `storage/v1/object/public/{bucket}/{path}` URL
2. Creates `media_assets` row with `bucket`, `path`, `mime_type`, `public_url`
3. `src/lib/media/resolver.ts` — server-side canonical resolver (same pattern as client)

### 8.3 URL exposure matrix

| URL pattern | Anon can fetch? | Risk |
|-------------|-----------------|------|
| `storage/v1/object/public/{bucket}/{path}` | **Yes** | All objects downloadable without auth |
| `media_assets.public_url` | **Yes** (via anon REST) | Reveals internal paths |
| `storage/v1/object/list/{bucket}` | **Yes** (public buckets) | Full directory listing |
| `storage/v1/bucket` | No (401) | Anon blocked from bucket list |

---

## Phase 9 — Live Storage Access Test

### 9.1 Anon GET on representative public assets

| Bucket | Object | HTTP Status | Content-Type | Size | Accessible? |
|--------|--------|-------------|-------------|------|-------------|
| `public-assets` | `images/restaurant/hero-restaurant.webp` | 200 | image/webp | 264,064 | ✅ |
| `menu-images` | `grilled-chicken.webp` | 200 | image/webp | 220,606 | ✅ |
| `gallery-images` | `gallery-02.webp` | 200 | image/webp | 172,938 | ✅ |
| `logos` | `logo.webp` | 200 | image/webp | 16,114 | ✅ |

### 9.2 Anon capability test

| Test | Method | Result |
|------|--------|--------|
| List ALL buckets | `GET /storage/v1/bucket` (anon) | **401 Unauthorized** |
| List objects per bucket | `POST /storage/v1/object/list/{bucket}` (anon) | **200 OK** — listing allowed |
| Download object | `GET /storage/v1/object/public/{bucket}/{path}` (anon) | **200 OK** — download allowed |

### 9.3 Summary

- **All 9 buckets are public** — objects downloadable anonymously
- Bucket **listing** is blocked for anon (requires service-role)
- Object **listing per bucket** is allowed for anon on public buckets
- **No access control** exists on any storage bucket

---

## Phase 10 — Client-Side Accessibility (Browser Bundles)

### 10.1 Browser bundle audit

| Location checked | Service-role key found? |
|-----------------|----------------------|
| `assets/js/config/env.js` | ❌ No |
| `assets/js/config/supabase.config.js` | ❌ No (anon key only) |
| `assets/js/repositories/MediaResolver.js` | ❌ No |
| `assets/js/lib/supabase-js.js` | ❌ No |
| `assets/js/` (recursive) | ❌ No |
| `index.html` | ❌ No |
| `index_clean.html` | ❌ No |
| `supabase.config.js` (root) | ❌ No (anon key only) |

### 10.2 Browser initialization

- `window.SupabaseConfig` → anon key only (public by design)
- `window.env` → `NEXT_PUBLIC_SUPABASE_ANON_KEY` only
- `MediaResolver.js` → queries `media_assets` table with anon key
- No `serviceRoleKey` or `SUPABASE_SERVICE_ROLE_KEY` injected into browser environment

### 10.3 CORS proxy test

| Target | Via CORS proxy | Result |
|--------|---------------|--------|
| REST API (requires `apikey`) | Jina reader | 401 — no apikey header |
| REST API (requires `apikey`) | corsproxy.io | 403 — requires API key |
| Storage bucket list | Jina reader | 400 — needs authorization header |
| Public storage object | Jina reader | **200** — content returned |

**Verdict**: CORS proxies cannot inject service-role or anon keys. Only public storage objects are fetchable through public CORS proxies. No escalation path exists.

---

## Phase 11 — Anon Key & RLS Status

### 11.1 RLS enforcement

- **RLS: ENABLED** on all tables — anon key gets 401/400 on protected endpoints
- Public tables (anon-accessible): `menu_categories`, `menu_items`, `services`, `business_settings`, `hero_slides`, `gallery`, `media_assets`, `website_pages`, `faqs`, `promotions`
- Protected tables (require auth): `profiles`, `customers`

### 11.2 Key facts

| Property | Anon key | Service-role key |
|----------|---------|-----------------|
| Role | `anon` | `service_role` |
| JWT secret in codebase? | N/A | No |
| Can forge JWTs? | No | No |
| Bypasses RLS? | No | **Yes** |
| Embeddable in browser? | Yes (by design) | No |
| Expires | 2099 (~2034) | 2099 (~2034) |

JWT decoded payloads:
- Anon: `{"iss":"supabase","ref":"jczwilrysvnhcjzjztbi","role":"anon","iat":1783941250,"exp":2099517250}`
- Service-role: `{"iss":"supabase","ref":"jczwilrysvnhcjzjztbi","role":"service_role","iat":1783941250,"exp":2099517250}`

---

## Phase 12 — User Enumeration

Using `supabase.auth.admin.listUsers()` (env4.js), 13 accounts enumerated:

| # | Email | Type |
|---|-------|------|
| 1 | e2e-forensic-superadmin@zt-lounge.test | E2E test |
| 2 | e2e-super-admin@zt-lounge.test | E2E test |
| 3 | e2e-sync-admin@test.local | E2E test |
| 4 | reset-verify-1787783492931@ztl-reset-test.invalid | Reset test |
| 5-10 | Various test accounts | Test |
| 11 | ianohmbaemutharimi@gmail.com | **Real** |
| 12 | manager@salon.com | **Real** |
| 13 | admin@salon.com | **Real** |

Brute-force: 130 combos — **0 valid passwords found**. UI login test (`manager@test.com`/`Manager123!`) — **FAILED**.

---

## Phase 13 — Auth Architecture & Session Handling

### 13.1 Admin auth flow

1. **Middleware**: Intercepts requests, reads session cookie via `@supabase/ssr`
2. **`getSupabase(req?)`** in `src/lib/auth/server.ts`: Creates server client with anon key + cookie support
3. **`getServerSession()`**: Queries `profiles` by `auth.uid()` with anon key — RLS enforced
4. **`withAdminAuth`** / **`withContentManagerAuth`**: Decorator wrappers that call `getServerSession()` → check role → pass `{ session, supabase }` to handler

### 13.2 Architectural boundary

| Operation | Client | Key |
|-----------|--------|-----|
| Regular CRUD, queries | Session client | Anon key (RLS enforced) |
| Storage uploads | `getSupabaseAdmin()` | Service-role key |
| Media listing | `getSupabaseAdmin()` | Service-role key |
| Activity logging | Direct fetch (`resources.ts`) | Service-role key |
| Auth/session mgmt | `getSupabaseServer()` | Anon key |

The service-role bypass is used **only** for storage operations and admin system functions.

---

## Phase 14 — Git History Exposure Detail

### 14.1 Public repo (zt-lounge)

| Commit | Date | File |
|--------|------|------|
| `ad06bd1` | 2026-09-22 11:45:46 +0300 | `phasej-audit/env*.js` |
| `4352790` | 2026-09-22 11:25:55 +0300 | `phasej-audit/env*.js` |
| `7ebc0e5` | 2026-09-22 11:18:53 +0300 | `phasej-audit/env*.js` |
| `840da95` | 2026-09-19 11:07:09 +0300 | `phasej-audit/env*.js` |

- **107 checkpoint commits** (2026-09-19 → 2026-09-22), all "untracked files on cline checkpoint"
- Files: `env1.js`–`env4.js` with hardcoded service-role JWT
- `origin/main` (`319fe79`, 2026-07-04) is an ancestor of HEAD — checkpoint commits are NOT ancestors of origin/main
- Checkpoint commits are **NOT ancestors of HEAD** — orphaned objects
- **Never pushed** to GitHub

### 14.2 Admin repo (zt-lounge-admin)

| Commit | Date | Message |
|--------|------|---------|
| `da540cd` | 2026-09-06 13:43:56 +0300 | untracked files on clean-rebuild: cb43103 fix(media)... |
| `aee436e` | 2026-08-24 13:01:26 +0300 | backup before clean architecture reset |

- Both contain `.env.tmp` with service-role JWT
- Both are **ancestors of HEAD** (`876b185` on `clean-rebuild`)
- Reachable from: `clean-rebuild`, `main`, `backup/pre-clean-reset`
- **Never pushed** to any remote (no remotes configured)
- Stash `{0}`: "On clean-rebuild: WIP: branding work before Auto Spa + Barbershop consolidation" (separate from compromised commits)

---

## Phase 15 — Client Accessibility Matrix

| Check | Public site | Admin site |
|-------|------------|-----------|
| Service-role key in JS bundles | ❌ Not found | ❌ Not found |
| Service-role key in `process.env` client config | N/A | ❌ Not exposed |
| Service-role key in `window.*` globals | ❌ Not found | ❌ Not found |
| Anon key in client | ✅ Yes (by design) | ✅ Yes |
| CORS proxy fetches API | ❌ 401 (no apikey) | ❌ 401 (no apikey) |
| CORS proxy fetches public objects | ✅ Yes | N/A |
| Browser can list buckets | ❌ No | ❌ No |
| Browser can list objects | ✅ Yes (public buckets) | ❌ No |

---

## Phase 16 — Service-Role Usage Impact

### What breaks immediately if key is rotated without updating env

| Component | Failure mode | Severity |
|-----------|-------------|----------|
| `supabaseAdmin` (module-level, `admin.ts`) | Uses old key → all admin storage/API ops fail | **Critical** |
| `upload/route.ts` | 401/403 on upload | **Critical** |
| `media-assets/route.ts` | 500 on media listing | High |
| `resources.ts` `logActivity()` | Silent failure — logs lost | Medium |
| Vercel deployment | 500s on admin API until env updated | **Critical** |

---

## Phase 17 — Storage Remediation Plan

> ⚠️ **OWNER-APPROVAL REQUIRED** — No remediation changes made without explicit sign-off.

### 17.1 Immediate containment (Phase A)

| # | Action | Owner | Status |
|---|--------|-------|--------|
| A1 | Set all 9 buckets to **private** | Supabase admin | ⏳ Pending approval |
| A2 | Update public site to use `getSignedUrls()` | Developer | ⏳ Pending approval |
| A3 | Update admin upload handler to generate signed URLs | Developer | ⏳ Pending approval |
| A4 | Update `MediaResolver.js` to use `media_assets.signed_url` | Developer | ⏳ Pending approval |

### 17.2 Bucket classification recommendations

| Bucket | Current | Recommended | Rationale |
|--------|---------|-------------|-----------|
| `hero-images` | Public | **Signed URL** | Cacheable marketing images |
| `gallery-images` | Public | **Signed URL** | Gallery images |
| `service-images` | Public | **Signed URL** | Service photos |
| `menu-images` | Public | **Signed URL** | Menu photos |
| `testimonial-photos` | Public | **Private/Deleted** | Empty — no objects |
| `logos` | Public | **Signed URL** | Branding assets |
| `favicons_probe` | Public | **Deleted** | Audit artifact |
| `public-assets` | Public | **Private + CDN** | Static assets — Vercel static |
| `favicons` | Public | **Private + Vercel static** | Favicon embedding |

### 17.3 Remediation sequence

1. **[APPROVAL REQUIRED] A1** — Delete `favicons_probe` bucket (audit artifact, empty)
2. **[APPROVAL REQUIRED] A2** — Delete `testimonial-photos` bucket (empty, never used)
3. **[APPROVAL REQUIRED] A3** — Set all remaining buckets to private
4. **[APPROVAL REQUIRED] A4** — Implement signed URL generation in upload flow
5. **[APPROVAL REQUIRED] A5** — Update all consumers before bucket recategorization (avoid downtime)
6. **[APPROVAL REQUIRED] A6** — Monitor for 403 errors post-change

---

## Phase 18 — Git History Purge Plan

> ⚠️ **OWNER-APPROVAL REQUIRED** — History rewrite is destructive.

### 18.1 Public repo (zt-lounge)

**Current state**: 107 orphaned checkpoint commits in object DB. Not on any branch. Never pushed.

**Recommended action** (zero-downtime, zero-risk):
```bash
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```
This destroys unreachable objects (the 107 checkpoint commits). **No risk** — they cannot be cloned or pushed anyway.

### 18.2 Admin repo (zt-lounge-admin)

**Current state**: 2 commits (`da540cd`, `aee436e`) are **ancestors of HEAD** on all branches. Never pushed. Must rewrite history.

**Staged approach**:
1. **[APPROVAL REQUIRED]** Backup: `git clone --mirror . zt-lounge-admin-backup.git`
2. **Purge** using `git filter-repo --force --path .env.tmp --invert-paths` (removes `.env.tmp` from all history)
3. Verify old key not in any commit: `git log --all -S "<old_jwt_prefix>" --oneline` → should be empty
4. Force-push all branches: `git push --all --force-with-lease` (only after confirming no remote)
5. Notify all team members to re-clone

### 18.3 Post-purge verification

```bash
# Key must be gone from all commits
# Search using a placeholder — never paste the full JWT here
git log --all -S "eyJhbGci" --oneline | head -5
# .env.tmp must not appear
git log --all --name-only --oneline | grep ".env.tmp"
```

---

## Phase 19 — Immediate Containment Sequence

> **ALL ACTIONS REQUIRE OWNER APPROVAL. NO MODIFICATIONS MADE DURING THIS READ-ONLY AUDIT.**

### Step 1 — Immediate (within 24 hours)

| # | Action | Type |
|---|--------|------|
| 1.1 | Delete working-tree key files: `phasej-audit/env1-4.js`, `probe-storage.js` | **Working-tree deletion** [APPROVAL] |
| 1.2 | Delete or secure admin backups: `.env.local.bak`, `.env.local.pre-phase2` | **Working-tree deletion** [APPROVAL] |
| 1.3 | Add env-file patterns to admin `.gitignore` (`node_modules`, `.env`, `.env.*`, `!.env.example`) | **Code-adjacent** [APPROVAL] |
| 1.4 | Add `*.env*` and `phasej-audit/env*.js` to public `.gitignore` | **Code-adjacent** [APPROVAL] |

### Step 2 — Short-term (within 7 days)

| # | Action | Type |
|---|--------|------|
| 2.1 | Rotate service-role key in Supabase Dashboard | **Supabase UI** [APPROVAL] |
| 2.2 | Update Vercel env vars for both apps (Preview + Production) | **Vercel UI** [APPROVAL] |
| 2.3 | Purge git history (Phase 18 — public: gc; admin: filter-repo) | **History rewrite** [APPROVAL] |
| 2.4 | Update local `.env.local` with new key | **Working-tree** [APPROVAL] |

### Step 3 — Medium-term (within 30 days)

| # | Action | Type |
|---|--------|------|
| 3.1 | Reclassify storage buckets (Phase 17) | **Supabase + code** [APPROVAL] |
| 3.2 | Remove test E2E accounts | **Supabase UI** [APPROVAL] |
| 3.3 | Implement signed URL infrastructure | **Code change** [APPROVAL] |

### Step 4 — Ongoing (continuous)

| # | Action | Frequency |
|---|--------|-----------|
| 4.1 | Pre-commit hook: `trufflehog` / `git-secrets` for key detection | Continuous |
| 4.2 | Quarterly `.gitignore` review | Quarterly |
| 4.3 | Quarterly storage bucket access audit | Quarterly |

---

## Appendix A — Artifacts Reviewed

| Artifact | Role |
|----------|------|
| `phasej-audit/env1.js`–`env5.js` | Audit scripts with keys, user enum, brute-force |
| `phasej-audit/probe-storage.js` | Storage API probe (hardcoded service-role key) |
| `phasej-audit/probe-cors.js` | CORS proxy probe |
| `phasej-audit/phasej-storage-report.json` | Storage bucket listing results |
| `phasej-audit/phasej-cors-report.json` | CORS proxy results |
| `phasej-audit/PHASEJ_SUMMARY.md` | Phase J prior summary |
| `assets/js/config/supabase.config.js` | Browser config (anon key only) |
| `assets/js/config/env.js` | Browser env (anon key only) |
| `assets/js/repositories/MediaResolver.js` | Canonical media resolver (anon-key REST) |
| `src/lib/supabase/admin.ts` | Server-side admin client factory |
| `src/lib/supabase/server.ts` | Async admin client factory |
| `src/lib/supabase/client.ts` | Client config interface |
| `src/app/api/admin/upload/route.ts` | Upload endpoint (service-role) |
| `src/app/api/admin/media-assets/route.ts` | Media listing (service-role) |
| `src/app/api/admin/resources.ts` | Activity logging (direct env var) |
| `src/app/api/admin/[resource]/route.ts` | Generic resource handler (session client) |
| `src/app/api/dashboard/stats/route.ts` | Dashboard stats (withAdminAuth) |
| `RUNTIME_VERIFICATION_EXECUTOR.mjs` | Test/audit (env var names only) |
| `test-results/500-error-fix-runtime.json` | Runtime test results |

---

## Appendix B — Key Values (truncated, not full)

**Service-role JWT** (prefix only — REDACTED):
```
[REDACTED — JWT not reproduced in this report]
```

**Anon key JWT** (prefix only — REDACTED):
```
[REDACTED — JWT not reproduced in this report]
```

Both share project ref `jczwilrysvnhcjzjztbi` and same iat/exp. Only the `role` claim differs.

**Supabase URL**: `https://jczwilrysvnhcjzjztbi.supabase.co`
[REDACTED — all JWT material fully removed from this line]
```

*Note: All JWT values (service-role and anon) have been redacted from this report. No credential values are reproduced in the appendices.*


---

## Appendix C — What Was NOT Modified

To preserve forensic integrity, the following were **not touched**:

- `.env.local`, `.env.local.bak`, `.env.local.pre-phase2` (admin)
- `phasej-audit/env*.js`, `probe-storage.js`
- Git history (no rewrite performed)
- Storage buckets (not reclassified)
- RLS policies (not modified)
- Source code (not modified)
- `.gitignore` files (not modified)

---

*This report is a point-in-time forensic artifact as of 2026-10-04. No secrets, storage, RLS policies, or source code were modified during the audit. All actions in Phase 19 require explicit owner approval before execution.*


