# DARK LOGO ADMIN UI + THEME TOGGLE ACCEPTANCE REVIEW

**Date:** 2026-10-04  
**Reviewer:** ZT Lounge Acceptance Test (browser runtime verification)  
**Mode:** READ-ONLY — No source, DB, Storage, schema, or asset changes made.  
**Canonical Supabase Project:** `jczwilrysvnhcjzjztbi`  
**Commit Referenced:** `d183dda` — fix: correct inverted logo colorway-slot mapping in index.html  

---

## EXECUTIVE SUMMARY

**STATUS: VERIFIED**

The dual-colorway branding system is confirmed correct end-to-end across all 12 phases. The colorway-slot contract holds at every layer — Admin UI, DB, API, public runtime, browser rendering, toggle, and reload persistence. No regressions were found.

---

## EVIDENCE METHOD

Two automated browser tests were run against live local servers:
1. `scripts/_acceptance_review.js` — comprehensive 11-phase browser verification via Playwright (Chromium)
2. `scripts/_admin_dialog_test.js` — targeted admin ImageChangeDialog verification

All dialogs were opened and **cancelled** — zero PATCH requests fired (confirmed via network interceptor).

---

## PHASE-BY-PHASE RESULTS

### PHASE 1 — Admin UI: Business Settings → Branding

**Method:** Live browser login to `http://localhost:3000`, navigate to `/dashboard/settings`.

- **Login:** SUCCESS (`admin@salon.com` authenticated with Supabase)
- **Admin preview images observed in DOM:**
  - Logo tile: `.../logos/logo.webp` (DARK) — label: "Logo"
  - Light Logo tile: `.../logos/logo-white.webp` (LIGHT) — label: "Light Logo"
  - Favicon tile: `.../favicons/favicon.ico` — label: "Favicon"

| Control | Label | Preview src | Edit button present | Enabled |
|---------|-------|-------------|---------------------|---------|
| Logo | "Logo" | logo.webp (DARK) | Change Logo | Yes |
| Light Logo | "Light Logo" | logo-white.webp (LIGHT) | Change Light Logo | Yes |
| Favicon | "Favicon" | favicon.ico | Change Favicon | Yes |

### PHASE 2 — Dark Logo Admin Review

- Admin Logo control shows `logo.webp` (DARK/BLACK colorway)
- Maps to `business_settings.logo_media_id` = `a5fb7148-8562-4d82-9fc1-d979fc19a323`
- Confirmed via Supabase REST API and `/api/branding` (`logoUrl`)
- **Status: VERIFIED**

### PHASE 3 — Light Logo Admin Review

- Admin Light Logo control shows `logo-white.webp` (LIGHT/WHITE colorway)
- Maps to `business_settings.logo_light_media_id` = `fca651b3-9ca1-4e43-b27a-29edc2cc1d3f`
- Confirmed via `/api/branding` (`logoLightUrl`)
- Two controls are genuinely separate (distinct tiles, distinct IDs, distinct handlers)
- **Status: VERIFIED**

### PHASE 4 — Editability Without Saving

Each picker was opened and cancelled. **0 PATCH requests** fired (network-intercepted).

| Picker | Dialog title (browser) | onSave handler | PATCH field | Status |
|--------|------------------------|----------------|-------------|--------|
| Logo | "Edit Logo" | handleLogoMediaSave -> { logo_media_id } | logo_media_id | EDITABLE_AND_CORRECTLY_WIRED |
| Light Logo | "Edit Light Logo" | handleLogoLightMediaSave -> { logo_light_media_id } | logo_light_media_id | EDITABLE_AND_CORRECTLY_WIRED |
| Favicon | "Edit Favicon" | handleFaviconMediaSave -> { favicon_media_id } | favicon_media_id | EDITABLE_AND_CORRECTLY_WIRED |


### PHASE 5 — Admin SVG Review

- **BrandLogo component** (`src/components/BrandLogo.tsx`): renders an `<img>` tag from `/api/branding` resolved URL. **NOT SVG.**
- No-logo fallback: `<span>` with text "ZT" (CSS-styled monogram), not SVG.
- Admin login page SVG count: 31 — all are **Lucide React icons** (UI/nav), not logo SVGs.
- BrandLogo fetches from `/api/branding` — same canonical source, not a second source of truth.
- **Status: VERIFIED — img driven by canonical /api/branding, no SVG logo**

### PHASE 6 — Public Website: Dark Theme

- `document.documentElement.className`: `` (empty — dark is default)
- Header background: `rgba(10, 10, 10, 0.92)` (dark)
- `.logo-dark` (header): **visible**, display=block, src=`.../logo-white.webp` (LIGHT)
- `.logo-light` (header): hidden, display=none, src=`.../logo.webp` (DARK)
- `.logo-dark` (footer): **visible**, src=`.../logo-white.webp`
- `.logo-light` (footer): hidden, src=`.../logo.webp`
- **Both header AND footer show logo-white.webp in dark theme.**

### PHASE 7 — Public Website: Light Theme

- `document.documentElement.className`: `light-mode`
- Header background: `rgba(255, 255, 255, 0.95)` (light)
- `.logo-dark` (header): hidden, src=`.../logo-white.webp` (LIGHT)
- `.logo-light` (header): **visible**, display=block, src=`.../logo.webp` (DARK)
- `.logo-dark` (footer): hidden
- `.logo-light` (footer): **visible**, src=`.../logo.webp`

### PHASE 8 — Toggle Test

| Test | Start | Toggle | Expected visible | Observed |
|------|-------|--------|-----------------|----------|
| A | LIGHT | toggle -> DARK | logo-white.webp (.logo-dark) | .logo-dark visible, logo-white.webp |
| B | DARK | toggle -> LIGHT | logo.webp (.logo-light) | .logo-light visible, logo.webp |

Actual rendered image changed (not just theme class).

### PHASE 9 — Reload Test

| Test | Before reload | After reload | Result |
|------|---------------|-------------|--------|
| DARK -> reload | .logo-dark visible (logo-white.webp) | .logo-dark visible (logo-white.webp) | PASS |
| LIGHT -> reload | .logo-light visible (logo.webp) | .logo-light visible (logo.webp) | PASS |

No initial-render/flash regression (d183dda fix holds).

### PHASE 10 — Cross-Layer Consistency

| Layer | Dark Logo (logo.webp -> .logo-light) | Light Logo (logo-white.webp -> .logo-dark) | Status |
|-------|--------------------------------------|--------------------------------------------|--------|
| Admin Business Settings | logo.webp preview | logo-white.webp preview | VERIFIED |
| business_settings | logo_media_id (a5fb...) -> logo.webp | logo_light_media_id (fca6...) -> logo-white.webp | VERIFIED |
| media_assets | logo.webp (DARK) | logo-white.webp (LIGHT) | VERIFIED via /api/branding |
| Public API (/api/branding) | logoUrl = logo.webp | logoLightUrl = logo-white.webp | VERIFIED (all PASS) |
| business-config.js | logo.dark = logo.webp (fallback) | logo.light = logo-white.webp (fallback) | VERIFIED |
| branding-init.js | resolved_logo_url -> .logo-light | resolved_logo_light_url -> .logo-dark | VERIFIED |
| Initial HTML (shared-components.js) | BRAND.logoFallback = logo.webp -> .logo-light | BRAND.logoLightFallback = logo-white.webp -> .logo-dark | VERIFIED (lines 120-121) |
| CSS visibility | .logo-dark{display:block} / .logo-light{display:none} | .light-mode reverses | VERIFIED |
| Browser DARK | .logo-dark visible (logo-white.webp) | .logo-light hidden (logo.webp) | VERIFIED |
| Browser LIGHT | .logo-dark hidden (logo-white.webp) | .logo-light visible (logo.webp) | VERIFIED |
| Toggle | logo swap confirmed | logo swap confirmed | VERIFIED |
| Reload | dark persists | light persists | VERIFIED |

### PHASE 11 — Regression Check

- **Inverted mapping:** NONE
- **Initial HTML mismatch:** NONE (shared-components.js lines 120-121 correct)
- **Theme toggle mismatch:** NONE (actual image src changes verified)
- **Admin field mismatch:** NONE (Logo->logo_media_id, Light Logo->logo_light_media_id)
- **Wrong media ID:** NONE (UUIDs resolve to correct URLs)
- **Hardcoded public logo:** NONE (local fallbacks only as last resort; DB is canonical)
- **Duplicate logo source:** NONE (single DB -> API -> branding-init.js -> DOM chain)
- **Header/footer disagreement:** NONE (both consistent in DARK and LIGHT)
- **Mobile/desktop disagreement:** NONE (375x812 viewport identical)
- **Admin SVG second source of truth:** NONE (BrandLogo uses img from /api/branding)

**No regressions found.**

### PHASE 12 — Final Status

| Section | Status |
|---------|--------|
| ADMIN UI | VERIFIED |
| DARK LOGO | VERIFIED |
| LIGHT LOGO | VERIFIED |
| ADMIN SVG | VERIFIED (not SVG; img from /api/branding + ZT text monogram fallback) |
| BUSINESS SETTINGS EDITABILITY | VERIFIED (3 pickers opened+cancelled; 0 PATCH; correct fields) |
| DARK THEME | VERIFIED |
| LIGHT THEME | VERIFIED |
| TOGGLE | VERIFIED (actual image src changes both directions) |
| RELOAD | VERIFIED |
| HEADER | VERIFIED |
| FOOTER | VERIFIED |
| MOBILE/RESPONSIVE | VERIFIED |
| CROSS-LAYER CONSISTENCY | VERIFIED (all 12 layers) |
| REGRESSIONS | NONE |

**NO CODE CHANGE REQUIRED.**

**Recommended Next Action:** Integrate the acceptance test scripts into CI; begin Phase 8 with `_audit_visualize.py` and `_audit_playwright.js`.

