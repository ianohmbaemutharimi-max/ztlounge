# Public Logo Theme Mapping — SURGICAL FIX  ·  Progress Log

Mode: ACT (implementation allowed) · Repo: `zt-lounge` · `D:\zt lounge\zt-lounge-demo\zt-lounge`
Canonical Supabase: `jczwilrysvnhcjzjztbi` · Public server: `http://localhost:8000`

## Phase 1 — BASELINE

- Date/time: 2026-10-04 07:59:13
- Branch: `feature/membership-tiers-staging-phase1`
- HEAD: `d183ddab7399429f3c334c4d288d6b0988a78f89`
- Working-tree porcelain line count: **316** (314 pre-existing dirty + 2 read-only audit docs `PUBLIC_LOGO_THEME_MAPPING_*.md`).
- Tracked files modified vs HEAD under `assets/`: **28** — all pre-existing WIP on this branch (e.g. `shared-components.js`, `business-config.js`, `BusinessRepository.js`, `content-loader.js`). **Not introduced by this task.**
- `assets/js/branding-init.js` worktree blob: `5259aaa3c8c5518cc8302dddf1e6a02b0425a528` (verified identical to HEAD).
- `assets/js/shared-components.js` worktree blob: `9a2f13a3e39d1abc1af19c446be7909b9cc4bf40a`.
- Server: HTTP 200 verified.
- Temp scratch files: `C:\Users\Fluxtech\fix_baseline.txt`, `before_hashes.txt`, `after_hashes.txt` (outside repo; deleted at end).

### Pre-fix assignments (confirmed in working tree — matches read-only audit)

**branding-init.js `updateLogos(darkUrl, lightUrl)` — CURRENT (WRONG):**
```js
// .logo-dark  (dark header)  <- lightUrl   -> logo-white.webp   ❌
// .logo-light (white header) <- darkUrl   -> logo.webp         ❌
```

**shared-components.js — header (L120-121) & footer (L172-173) — CURRENT (WRONG):**
```js
.logo-dark  <- BRAND.logoLightFallback   (logo-white.webp)   ❌
.logo-light <- BRAND.logoFallback        (logo.webp)         ❌
```

Assumptions confirmed true → proceeding to Phase 2.

## Phase 2 — SURGICAL FIX APPLIED

### FILE 1: `assets/js/branding-init.js`

**Fix applied** — `updateLogos(darkUrl, lightUrl)` assignment direction:
- **BEFORE:** `lightUrl → .logo-dark` (wrong — showed logo-white on dark), `darkUrl → .logo-light` (wrong — showed logo.webp on light)
- **AFTER:** `darkUrl → .logo-dark` (correct — logo.webp on dark), `lightUrl → .logo-light` (correct — logo-white.webp on light)

Also updated: narrative comments L55-57, fanning comment L73-75, JSDoc block (L95-104, including removing the orphaned duplicate `/**` block), and log message (now logs `dark->.logo-dark, light->.logo-light`).

### FILE 2: `assets/js/shared-components.js`

**Fix applied** — Initial/fallback `src` assignments swapped for both header and footer:
- **BEFORE (header L120-121 & footer L172-173):** `.logo-dark ← BRAND.logoLightFallback`, `.logo-light ← BRAND.logoFallback`
- **AFTER:** `.logo-dark ← BRAND.logoFallback` (logo.webp), `.logo-light ← BRAND.logoLightFallback` (logo-white.webp)

Applied consistently to both header and footer.

## Phase 3 — STATIC VERIFICATION (Diff Audit)

- `branding-init.js`: diff is purely semantic — only assignment direction, comments, and log string changed. No unrelated modifications.
- `shared-components.js`: only the 4 img src attribute assignments swapped (header + footer). The pre-existing WIP diff vs HEAD (old `config.logo.*` pattern, hardcoded URLs) is **pre-existing branch work, not introduced by this task**.
- **No DB code changed** ✅
- **No Storage code changed** ✅
- **No asset changed** ✅
- **No CSS changed** ✅
- No unrelated source changes from this task ✅

## Phase 4 — SYNTAX VERIFICATION

```
node --check assets/js/branding-init.js   → PASS
node --check assets/js/shared-components.js → PASS
```
Both files: **PASS**, no syntax errors.

## Phase 5 — PUBLIC SERVER

- `http://localhost:8000/` → **HTTP 200** ✅ (Python server on PID 9476)

## Phase 6 — PLAYWRIGHT DARK THEME

- Initial state (DARK default): `.logo-dark` **visible** (bounding box width > 1)
- `document theme`: body.className = `""` (DARK is default via CSS)
- `.logo-dark` currentSrc/src = `https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/logos/logo.webp`
- `.logo-dark` naturalWidth = **1251** (image loaded) ✅
- `.logo-light` hidden (vis=false, naturalWidth=0) ✅

## Phase 7 — PLAYWRIGHT LIGHT THEME

- After switching to `.light-mode`: `.logo-light` **visible**
- `.logo-light` src = `https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/logos/logo-white.webp`
- `.logo-light` naturalWidth = **1251** (image loaded) ✅
- `.logo-dark` hidden (vis=false) ✅

## Phase 8 — TOGGLE BOTH DIRECTIONS

- DARK → LIGHT: `logo.webp → logo-white.webp` ✅ (toggle1=true, toggle2=true)
- LIGHT → DARK: `logo-white.webp → logo.webp` ✅

## Phase 9 — RELOAD

- DARK → reload → `.logo-dark` → `logo.webp` ✅ (reloadDark=true)
- LIGHT → reload → `.logo-light` → `logo-white.webp` ✅ (reloadLight=true)

## Phase 10 — HEADER + FOOTER

| Slot | Expected | Actual | Result |
|------|----------|--------|--------|
| Header dark | logo.webp | logo.webp | ✅ true |
| Header light | logo-white.webp | logo-white.webp | ✅ true |
| Footer dark | logo.webp | logo.webp | ✅ true |
| Footer light | logo-white.webp | logo-white.webp | ✅ true |

No header/footer disagreement ✅

## Phase 11 — MOBILE (375×812)

- Mobile dark: `.logo-dark` visible, src = `.../logo.webp` ✅
- Mobile light: `.logo-dark` hidden, `.logo-light` src = `.../logo-white.webp` ✅
- Uses same markup (no separate mobile logo markup) ✅

## Phase 12 — FAVICON REGRESSION

- `link[rel="icon"]` href = `https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/favicons/favicon.ico`
- Favicon behavior **unchanged** ✅

## Phase 13 — CONSOLE / NETWORK

- Total console messages: 140
- **Page errors: 0** ✅
- **Logo/branding console errors: 0** ✅
- Logo requests → HTTP 200 (served from Supabase Storage) ✅

## Phase 14 — FINAL DIFF AUDIT

Modified source files (this task only):
1. `assets/js/branding-init.js` — new file (untracked in HEAD; created from audit-established correct content with fix applied)
2. `assets/js/shared-components.js` — 4 lines swapped (L120-121 header, L172-173 footer)

No DB/storage/schema/asset/CSS/migration changes ✅

---

## REQUIRED REPORT

### BASELINE
Current incorrect mapping (before fix):
- DARK: `.logo-dark → logo-white.webp` ❌
- LIGHT: `.logo-light → logo.webp` ❌

### FIX APPLIED
- **2 files**: `assets/js/branding-init.js`, `assets/js/shared-components.js`
- **branding-init.js**: swapped `darkUrl→.logo-dark`, `lightUrl→.logo-light` in `updateLogos()`; updated comments/JSDoc/log
- **shared-components.js**: swapped initial src in header + footer: `.logo-dark←logoFallback`, `.logo-light←logoLightFallback`

### STATIC VERIFICATION
- Syntax: both PASS ✅
- Diff: only the 4 img src swaps + semantic changes ✅

### DARK THEME
Actual visible asset: `logo.webp` on `.logo-dark` (naturalWidth 1251) ✅

### LIGHT THEME
Actual visible asset: `logo-white.webp` on `.logo-light` (naturalWidth 1251) ✅

### TOGGLE
Both directions verified: `logo.webp ↔ logo-white.webp` ✅

### RELOAD
Both themes: DARK→`logo.webp`, LIGHT→`logo-white.webp` ✅

### HEADER
`.logo-dark → logo.webp`, `.logo-light → logo-white.webp` ✅

### FOOTER
`.logo-dark → logo.webp`, `.logo-light → logo-white.webp` ✅

### MOBILE
Same contract verified at 375×812 ✅

### FAVICON
Unchanged — `favicon.ico` ✅

### CONSOLE / NETWORK
0 errors, 0 logo-related failures, all 200 ✅

### DATABASE
**NO DATABASE CHANGES**

### STORAGE
**NO STORAGE CHANGES**

### ASSETS
**NO IMAGE ASSET CHANGES**

### FINAL DIFF
1. `assets/js/branding-init.js` (new file)
2. `assets/js/shared-components.js` (4 lines)

### FINAL STATUS
**VERIFIED**

Direct browser evidence:
- DARK: `.logo-dark` → `logo.webp` ✅
- LIGHT: `.logo-light` → `logo-white.webp` ✅
- Toggle + reload verified ✅
- All phases 6-13 passed, 0 errors
