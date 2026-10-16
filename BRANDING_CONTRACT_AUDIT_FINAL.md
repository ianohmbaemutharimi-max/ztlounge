# ZT Lounge — Admin CMS Branding Dark/Light Contract Audit — Final Report

## Executive Summary

**STATUS: VERIFIED — Comment-only defects fixed. No functional inversions found.**

The complete Admin CMS → DB → public rendering branding contract was audited end-to-end. The functional implementation is **correct everywhere** — all dark/light colorway mappings, PATCH route validation, repository mappings, CSS slot visibility, and runtime logo fan-out match the canonical contract.

Two **CASE B (comment-only)** defects were fixed in the admin repo:

1. `branding/route.ts` — JSDoc omitted `logo_light_media_id`, making the API appear to handle only 2 fields.
2. `settings-view.tsx:192` — Comment inverted rendering semantics ("renders on dark header via .logo-dark" → corrected to "renders on light/white header via .logo-light slot").

The public shell had 5 inverted comments already fixed in the prior P3 task (`business-config.js` 2, `BusinessRepository.js` 3).


---

## Complete Branding Contract Chain

```
ADMIN CMS
  +- settings-view.tsx (3 pickers)
       Logo picker        -> logo_media_id        (DARK colorway)
       Light Logo picker  -> logo_light_media_id  (LIGHT colorway)
       Favicon picker     -> favicon_media_id     (FAVICON)

  +- PATCH /api/admin/business-settings/branding (route.ts)
       Validates all 3 fields -> media_assets FK (RESTRICT)

  +- repository.ts (accept / business_settings.update)
       Maps all 3 fields to business_settings columns

  +- DB: business_settings (Supabase)
       logo_media_id        -> logos/logo.webp        (DARK)
       logo_light_media_id  -> logos/logo-white.webp  (LIGHT)
       favicon_media_id      -> logos/logo.webp        WARNING: DATA ISSUE

PUBLIC RENDERING
  +- /api/branding (GET)
       logoUrl       <- resolved_logo_url      -> logo.webp       (DARK)
       logoLightUrl  <- resolved_logo_light_url -> logo-white.webp (LIGHT)

  +- BusinessRepository.js
       resolveOne(logo_media_id)       -> resolved_logo_url        (DARK -> logo.webp)
       resolveOne(logo_light_media_id) -> resolved_logo_light_url  (LIGHT -> logo-white.webp)

  +- business-config.js
       dark:  settings.resolved_logo_url        (logo.webp - DARK)
       light: settings.resolved_logo_light_url  (logo-white.webp - LIGHT)


---

## Files Changed

### Admin Repo (`zt-lounge-admin/`)

| File | Change Type | Lines | Description |
|------|-------------|-------|-------------|
| `src/app/api/admin/business-settings/branding/route.ts` | Comment-only (CASE B) | 3 | JSDoc now includes `logo_light_media_id` in all 3 reference points. Executable logic unchanged. |
| `src/features/settings/settings-view.tsx` | Comment-only (CASE B) | 1 | Line 188 comment corrected. Executable code unchanged. |

### Public Repo (`zt-lounge/`) — Already Fixed (Prior P3 Task)


---

## Phase 7 — Static Verification

**STATUS: VERIFIED**

| Check | Method | Result |
|-------|--------|--------|
| `phase7_static_verify.js` script | `node scripts/phase7_static_verify.js` | ALL CHECKS PASSED |
| `branding/route.ts` — JSDoc well-formed | File read + script | OK — includes `logo_light_media_id` |
| `branding/route.ts` — Code unchanged | File read + script | OK — all executable markers present |
| `settings-view.tsx` — Comment corrected | File read + script | OK — `.logo-light slot` in comment |

---

## Phase 8 — CMS Post-Verification

**STATUS: VERIFIED (automated Playwright)**

Admin dev server started on `localhost:3000`. Playwright audit (`scripts/phase8_verify_v2.cjs`) executed successfully.

**Login:** OK → redirected to `/dashboard`

**Settings page (`/dashboard/settings`):**
- Total images found: 4
  - `img[0-1]`: `logo.webp` (DARK colorway, alt="ZT Lounge Meru") ✅
  - `img[2]`: `logo-white.webp` (LIGHT colorway, alt="ZT Lounge Logo (Light)") ✅
  - `img[3]`: favicon.webp (alt="Favicon") ✅
- Labels: Logo, Light Logo, Favicon — all FOUND ✅
- Buttons: Change Logo, Change Light Logo, Change Favicon — all FOUND ✅
- Screenshot: `phase8_postverify_settings.png` saved

**Website CMS page (`/dashboard/website`):**
- Screenshots: `phase8_postverify_website.png` saved
- Note: Brand tab has Logo + Favicon only (no Light Logo picker) — pre-existing UI gap, not a defect

**Conclusion:** Comment-only changes introduced **zero regression**. All pickers, previews, and buttons render identically to Phase 4.

| Check | Evidence | Result |
|-------|----------|--------|
| CMS login | Playwright login → /dashboard | PASS |
| Logo preview (dark) | `logo.webp` visible on settings page | PASS |
| Light Logo preview | `logo-white.webp` visible (alt="ZT Lounge Logo (Light)") | PASS |
| Favicon preview | `.webp` favicon visible | PASS |
| 3 picker labels present | "Logo", "Light Logo", "Favicon" all FOUND | PASS |
| 3 picker buttons present | "Change Logo", "Change Light Logo", "Change Favicon" FOUND | PASS |
| No regression | Comment-only changes to JSDoc/TSX | PASS |



---

## Phase 9 — Public Branding Playwright Verification

**STATUS: ALL CHECKS PASSED**

Playwright verification against `http://localhost:8000` (public server was responsive, HTTP 200).

### Dark Theme Results

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| `.logo-dark` src | `logo.webp` (DARK) | `logo.webp` | PASS |
| `.logo-dark` display | `block` (visible) | `block` | PASS |
| `.logo-light` src | `logo-white.webp` (LIGHT) | `logo-white.webp` | PASS |
| `.logo-light` display | `none` (hidden) | `none` | PASS |

### Light Theme Results

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| `.logo-dark` src | `logo.webp` (DARK) | `logo.webp` | PASS |
| `.logo-dark` display | `none` (hidden) | `none` | PASS |
| `.logo-light` src | `logo-white.webp` (LIGHT) | `logo-white.webp` | PASS |
| `.logo-light` display | `block` (visible) | `block` | PASS |

### Additional Checks

---

## Deferred Items

### 1. `background-media-warmer.js:241` — Inverted Comment (CASE B)

```js
// CURRENT (INVERTED): Light colorway logo -> .logo-dark (dark header)
// Should be: Light colorway logo -> .logo-light (light/white header)
```
Status: DEFERRED. Executable code (lines 242-243) is correct. File marked out-of-scope in prior P3 report.

### 2. `index_clean.html` — Inverted Initial HTML (NOT SERVED)

```html
<!-- INVERTED: .logo-dark <- logo-white.webp (LIGHT) -->
<!-- INVERTED: .logo-light <- logo.webp (DARK) -->
```
Status: NOT SERVED. Backup file only. Live site uses `index.html` with JS-mounted header (correct mapping via `shared-components.js`). Recommend fixing for consistency.

### 3. Favicon Data Issue (CASE D — Requires Owner Approval)

`favicon_media_id` in DB points to a `.webp` file, not `favicon.ico`. Playwright confirmed:
- `link[rel=icon] href`: `.../e1ad73d0-ce84-40f1-a54e-7b3134f0dbe6.webp`
- Extension: `.webp` (should be `.ico`)
- Status: Requires owner approval before any production data mutation.

---

## Before/After Mapping

### `branding/route.ts` (BEFORE)
```
 * Update branding assets (logo_media_id / favicon_media_id).
 * - Only mutates branding fields (logo_media_id, favicon_media_id)
 * - Canonical source: business_settings.logo_media_id / favicon_media_id
```

### `branding/route.ts` (AFTER)
```
 * Update branding assets (logo_media_id / logo_light_media_id / favicon_media_id).
 * - Only mutates branding fields (logo_media_id, logo_light_media_id, favicon_media_id)
 * - Canonical source: business_settings.logo_media_id / logo_light_media_id / favicon_media_id
```

### `settings-view.tsx` (BEFORE)
```tsx
{/* Light Logo (renders on dark header via .logo-dark) */}
```

### `settings-view.tsx` (AFTER)
```tsx
{/* Light Logo (logo-white.webp renders on light/white header via .logo-light slot) */}
```

---

## Final Status Matrix

| Phase | Status |
|-------|--------|
| Phase 1 (CMS Discovery) | VERIFIED |
| Phase 2 (Defect Determination) | VERIFIED — 2 CASE B (admin) + 5 CASE B (public, fixed) |
| Phase 3 (Live DB Read-Only) | VERIFIED |
| Phase 4 (Admin UI Experience Audit) | VERIFIED |
| Phase 6 (Surgical Implementation) | VERIFIED — 2 admin files, comment-only |
| Phase 7 (Static Verification) | VERIFIED — script passed, tsc pre-existing errors only |
| Phase 8 (CMS Post-Verification) | VERIFIED — automated Playwright (login OK, 4 images, 3 pickers) |
| Phase 9 (Public Branding Verification) | VERIFIED — Playwright ALL CHECKS PASSED |
| Phase 10 (Final Report) | This report |

## Pending Owner Action

1. **Favicon `.webp` vs `.ico`** — DB `favicon_media_id` resolves to `.webp` file. Requires owner approval.
2. **`background-media-warmer.js:241`** — 1-line comment fix (code correct). Deferred as out-of-scope.
3. **`index_clean.html`** — Backup file with inverted logos. Not served. Recommend fixing for consistency.


| Check | Result |
|-------|--------|
| No 404s on logo images | PASS |
| No branding-related console errors | PASS |
| Favicon | ⚠️ `.webp` not `.ico` (CASE D — deferred) |

| CMS settings page loads | Phase 4 established ✓ | OK |
| Both logo previews render | Phase 4 screenshot confirmed ✓ | OK |
| 3 pickers present | settings-view.tsx verified ✓ | OK |
| PATCH route handles 3 fields | route.ts verified ✓ | OK |
| No functional regression | Comment-only changes ✓ | OK |

| `npx tsc --noEmit --skipLibCheck` | Full TypeScript compiler | Pre-existing errors only in `node_modules/@types/node` and `.next/dev/types/` — ZERO errors in modified files |
| `business-config.js` — `node --check` | Prior P3 Phase 3 | OK — Exit code 0 |
| `BusinessRepository.js` — `node --check` | Prior P3 Phase 3 | OK — Exit code 0 |

| File | Change Type | Lines | Description |
|------|-------------|-------|-------------|
| `assets/js/business-config.js` | Comment-only (CASE B) | 2 | Lines 119, 121 corrected. Code unchanged. |
| `assets/js/repositories/BusinessRepository.js` | Comment-only (CASE B) | 3 | Lines 157, 158, 161 corrected. Code unchanged. |
| *(verified)* `assets/js/branding-init.js` | No change needed | — | Comments already correct. |
| *(verified)* `assets/js/shared-components.js` | No change needed | — | Mapping already correct. |

  +- shared-components.js (initial HTML)
       <img class="logo-dark site-logo"   src="logo.webp"       data-canonical-logo="dark">
       <img class="logo-light site-logo"  src="logo-white.webp" data-canonical-logo="light">

  +- branding-init.js (runtime)
       .logo-dark  <- darkUrl  (logo.webp)           DARK -> dark header
       .logo-light <- lightUrl (logo-white.webp)     LIGHT -> light header

  +- CSS (navbar.css + theme.css)
       .logo-dark  { display: block; }             (visible in dark mode)
       .logo-light { display: none; }
       .light-mode .logo-dark  { display: none; }  (hidden in light mode)
       .light-mode .logo-light { display: block; } (visible in light mode)
```
