# ZT LOUNGE — READ-ONLY AUDIT: LOGO ASSET, TRANSPARENCY & RENDERING

## Phase 1 — Audit Report

**Date:** 2026-10-04
**Repo:** D:\zt lounge\zt-lounge-demo\zt-lounge
**Branch:** feature/membership-tiers-staging-phase1
**HEAD:** d183dda — fix: correct inverted logo colorway-slot mapping in index.html
**Server:** http://localhost:8000 (python -m http.server)
**Browser:** Chromium 153.0.8010.12 (Playwright v1.63.0, headless, deviceScaleFactor=2, 1920×1080)
**Canonical Supabase project:** jczwilrysvnhcjzjztbi
**Canonical DB mapping:** logo_media_id → logo.webp | logo_light_media_id → logo-white.webp

**STATUS: READ-ONLY AUDIT** — No source files, database rows, storage objects, image assets, or migrations were modified. No commits were made during this audit.

---

## Phase 2 — Locate All Logo Assets

All physical logo assets in the repository:

| Asset | Path | Dimensions | Bytes | SHA256 (short) | MIME |
|---|---|---|---|---|---|
| logo.webp | `assets/images/branding/logo.webp` | 1251×1251 | 16,114 | `a42eabf49aeefac7` | image/webp |
| logo-white.webp | `assets/images/branding/logo-white.webp` | 1251×1251 | 14,496 | `2fbf282916818a26` | image/webp |
| logo-opt.webp | `assets/images/branding/logo-opt.webp` | 1251×1251 | 15,410 | `4403f84612fc5870` | image/webp |
| logo-white-opt.webp | `assets/images/branding/logo-white-opt.webp` | 1251×1251 | 14,044 | `05702cffee0a9b65` | image/webp |

**No `logo-opt.webp` or `logo-white-opt.webp` are referenced in source code** — only `logo.webp` and `logo-white.webp` are used.

### Browser-loaded URLs (confirmed via Playwright DOM inspection):

| Slot | CSS Class | DB Column | Browser URL |
|---|---|---|---|
| `.logo-light` (visible in light mode) | `logo-light site-logo` | `logo_media_id` → `resolved_logo_url` | `https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/logos/logo.webp` |
| `.logo-dark` (visible in dark mode) | `logo-dark site-logo` | `logo_light_media_id` → `resolved_logo_light_url` | `https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/logos/logo-white.webp` |

The `u()` function in `shared-components.js:82` (`function u(path) { return PREFIX + path; }`) returns local paths for initial fallback. `branding-init.js` overrides with DB-resolved Supabase URLs at runtime.

---

## Phase 3 — Pixel-Level Image Audit

### logo.webp (DARK colorway — shows on white/light header in light mode)

| Property | Value |
|---|---|
| Pillow mode | **RGB** (no alpha channel) |
| WebP chunk type | **VP8** (lossy, no alpha support) |
| Dimensions | 1251×1251 |
| File size | 16,114 bytes |
| SHA256 | `a42eabf49aeefac7` |
| Has alpha channel | **NO** |
| Transparent pixels | 0 (0.0%) |
| Opaque pixels | 100.0% |
| Near-black pixels (max RGB < 50) | 1,470,267 (93.9%) |
| Near-white pixels (min RGB > 205) | 29,776 (1.9%) |

**Corner pixel values (RGBA):**
| Corner | RGB |
|---|---|
| Top-left | (130, 130, 130) — gray |
| Top-right | (62, 62, 62) — dark gray |
| Bottom-left | (238, 238, 238) — light gray |
| Bottom-right | (234, 234, 234) — light gray |
| Center | (250, 250, 250) — near-white |

### logo-white.webp (LIGHT colorway — shows on dark header in dark mode)

| Property | Value |
|---|---|
| Pillow mode | **RGB** (no alpha channel) |
| WebP chunk type | **VP8** (lossy, no alpha support) |
| Dimensions | 1251×1251 |
| File size | 14,496 bytes |
| SHA256 | `2fbf282916818a26` |
| Has alpha channel | **NO** |
| Transparent pixels | 0 (0.0%) |
| Opaque pixels | 100.0% |
| Near-black pixels | 26,267 (1.7%) |
| Near-white pixels | 1,473,919 (94.2%) |

**Corner pixel values (RGBA):**
| Corner | RGB |
|---|---|
| Top-left | (255, 255, 255) — pure white |
| Top-right | (255, 255, 255) — pure white |
| Bottom-left | (255, 255, 255) — pure white |
| Bottom-right | (255, 255, 255) — pure white |
| Center | (0, 0, 0) — pure black |

### WebP Container Metadata

| File | Chunk type | Alpha possible? | ICC | EXIF | XMP |
|---|---|---|---|---|---|
| logo.webp | **VP8** (lossy) | **No** | No | No | No |
| logo-white.webp | **VP8** (lossy) | **No** | No | No | No |

> WebP VP8 chunk type cannot carry alpha. VP8X or VP8L formats are required for transparency.

### Local vs. Browser-loaded vs. Supabase — Hash comparison

| Asset | Local SHA256 | Browser-downloaded SHA256 | Match |
|---|---|---|---|
| logo.webp | `a42eabf49aeefac7` | `a42eabf49aeefac7` | IDENTICAL |
| logo-white.webp | `2fbf282916818a26` | `2fbf282916818a26` | IDENTICAL |

Browser loads byte-identical images. No CDN transformation.
---

## Phase 4 — Visualization Renders

Generated temporary renders (not modifying originals). Three compositions per asset:

| Render | Observation |
|---|---|
| logo.webp on white | Dark/black rectangle (93.9% near-black) |
| logo.webp on black | Dark rectangle nearly invisible on dark bg |
| logo.webp on checkerboard | Checkerboard **completely obscured** — 0% transparency |
| logo-white.webp on white | White rectangle nearly invisible on white bg |
| logo-white.webp on black | White rectangle on dark background |
| logo-white.webp on checkerboard | Checkerboard **completely obscured** — 0% transparency |

> The checkerboard test is definitive: if the images had transparency, the checkerboard pattern would be visible through transparent areas. Instead, the checkerboard is completely hidden, proving **zero transparency** in both assets.

---

## Phase 5 — Browser-Loaded Image Inspection

### Light Mode (white/light header — the reported scenario)

Triggered via `localStorage.setItem('zt-theme', 'light')` before page load.

#### Visible logo: `.logo-light.site-logo` (shows dark colorway on white header)

| Property | Value |
|---|---|
| Selector | `IMG.logo-light.site-logo` |
| src | `https://...supabase.co/storage/v1/object/public/logos/logo.webp` |
| currentSrc | same |
| naturalWidth / naturalHeight | 1251 / 1251 |
| display | `block` (visible) |
| **filter** | **`none`** — no CSS filter |
| **mixBlendMode** | **`normal`** — no blend mode |
| **backgroundColor** | `rgba(0, 0, 0, 0)` — transparent (no CSS bg on img) |
| **backgroundImage** | `none` — no CSS background image |
| objectFit | `contain` |
| Bounding rect | x=292, y=9, width=54, height=54 (CSS px) |
| **Header background** | **`rgba(255, 255, 255, 0.95)` — white** |
| htmlLightMode | `true` |

#### Hidden logo: `.logo-dark.site-logo`
- display: `none` (hidden in light mode), src: `logo-white.webp`

### Dark Mode (dark header)

Triggered via default theme (no `zt-theme` in localStorage).

#### Visible logo: `.logo-dark.site-logo` (shows light colorway on dark header)

| Property | Value |
|---|---|
| Selector | `IMG.logo-dark.site-logo` |
| src | `https://...supabase.co/storage/v1/object/public/logos/logo-white.webp` |
| display | `block` (visible) |
| **Header background** | **`rgba(10, 10, 10, 0.92)` — black** |
| htmlLightMode | `false` |

#### Hidden logo: `.logo-light.site-logo`
- display: `none` (hidden in dark mode), src: `logo.webp`

---

## Phase 6 — Actual Rendered Screenshots

Captured via Playwright/Chromium at 1920×1080, deviceScaleFactor=2.

| Screenshot | Path | Dimensions | Description |
|---|---|---|---|
| Light mode full page | `_audit_screenshots/light_full.png` | 3840×11146 | Full page, light theme |
| Light mode logo element | `_audit_screenshots/light_logo_element.png` | 108×110 | Cropped `.logo-light` element |
| Light mode logo crop | `_audit_screenshots/evidence_logo_crop_light.png` | 108×108 | Header logo render area |
| Dark mode full page | `_audit_screenshots/dark_full.png` | 3840×11146 | Full page, dark theme |

### Pixel analysis of rendered results:

**Light mode logo render area (108×108 device px):**
| Metric | Value |
|---|---|
| Near-black pixels | 10,828 (92.8%) |
| Transparent pixels | 0 (0.0%) |
| **Result** | **BLACK RECTANGLE CONFIRMED** |

**Dark mode logo render area (108×108 device px):**
| Metric | Value |
|---|---|
| Near-white pixels | 10,831 (92.9%) |
| Transparent pixels | 0 (0.0%) |
| **Result** | **WHITE RECTANGLE CONFIRMED** |

---

## Phase 7 — Compare DOM Source With Actual Image

### Light mode chain (white header → black rectangle):

```
DOM:        .logo-light.site-logo (display:block, visible)
                ↓
src/currentSrc:  .../storage/v1/object/public/logos/logo.webp
                ↓
HTTP response:   200 OK, image/webp, 16,114 bytes
                ↓
Downloaded:      SHA256 = a42eabf49aeefac7 (identical to local file)
                ↓
Pixels:          RGB mode, VP8 chunk, NO alpha, 0% transparent, 93.9% near-black
                ↓
Rendered:        54×54 CSS px, 92.8% near-black → BLACK RECTANGLE on white header
                ↓
Root cause:      ASSET-LEVEL — image has opaque dark background
```

### Dark mode chain (dark header → white rectangle):

```
DOM:        .logo-dark.site-logo (display:block, visible)
                ↓
src/currentSrc:  .../storage/v1/object/public/logos/logo-white.webp
                ↓
HTTP response:   200 OK, image/webp, 14,496 bytes
                ↓
Downloaded:      SHA256 = 2fbf282916818a26 (identical to local file)
                ↓
Pixels:          RGB mode, VP8 chunk, NO alpha, 0% transparent, 94.2% near-white
                ↓
Rendered:        54×54 CSS px, 92.9% near-white → WHITE RECTANGLE on dark header
                ↓
Root cause:      ASSET-LEVEL — image has opaque white background
```

---

## Findings

### 1. CSS slot mapping (.logo-dark/.logo-light) — CORRECT ✅

The slot mapping is NOT the problem:
- `.logo-dark` → `logo-white.webp` (light colorway) — correct for dark header
- `.logo-light` → `logo.webp` (dark colorway) — correct for light/white header
- CSS display rules correct; already fixed in commit `d183dda`.

### 2. CSS rendering properties — NOT the cause ✅

No CSS mechanism produces the rectangle:
- `filter: none`, `mixBlendMode: normal`, `backgroundColor: transparent`
- No pseudo-elements, no overlapping elements, `objectFit: contain` is standard.

### 3. Image assets — ASSET-LEVEL ROOT CAUSE ❌

**Both images have opaque backgrounds with NO alpha channel:**

| Property | logo.webp | logo-white.webp |
|---|---|---|
| WebP chunk type | VP8 (lossy, no alpha) | VP8 (lossy, no alpha) |
| Pillow mode | RGB | RGB |
| Alpha channel | **NO** | **NO** |
| Transparent pixels | 0% | 0% |
| Dominant | 93.9% near-black | 94.2% near-white |

On white/light header: `.logo-light` → `logo.webp` → **black rectangle** (92.8% near-black in screenshot).
On dark header: `.logo-dark` → `logo-white.webp` → **white rectangle** (92.9% near-white in screenshot).

### 4. Transparency was structurally impossible

Both images use WebP **VP8** chunk (lossy). VP8 cannot carry alpha. VP8X or VP8L required for transparency.

### 5. No variant assets with transparency exist

The `-opt` variants are also VP8 (no alpha), same pixel stats, unreferenced in code.

### 6. Existing documentation already identifies the issue

`BRANDING_FIX_IMPLEMENTATION_MAP.md:86`: *"Existing asset qualifies? No. `logo.webp` (opaque black bg), `logo-white.webp` (opaque white bg)"*

---

## Root Cause Statement

**ASSET-LEVEL ROOT CAUSE:** Both logo image files (`logo.webp` and `logo-white.webp`) on the canonical Supabase Storage bucket and in the local repository are encoded as VP8 lossy WebP **without an alpha channel**. They have **opaque backgrounds** (93.9% near-black for `logo.webp`, 94.2% near-white for `logo-white.webp`) rather than transparent backgrounds. When the browser renders `.logo-light` (showing `logo.webp`) on the white/light header, the opaque dark background produces the observed **black rectangle**. No CSS, no HTML, no mapping inversion is causing the rectangle — it is **baked into the pixel data of the image asset itself**.

The fix requires **re-exporting the logo artwork as RGBA/WebP-with-alpha (VP8X or VP8L)** with a transparent background, so only the logo mark/text is visible rather than a solid-color rectangle.

---

## Evidence Files

| File | Description |
|---|---|
| `_audit_screenshots/light_full.png` | Full-page screenshot, light mode |
| `_audit_screenshots/light_logo_element.png` | Cropped logo element, light mode |
| `_audit_screenshots/evidence_logo_crop_light.png` | Header logo render area, light mode |
| `_audit_screenshots/dark_full.png` | Full-page screenshot, dark mode |
| `_audit_screenshots/viz_logo_on_white.png` | logo.webp on white bg |
| `_audit_screenshots/viz_logo_on_black.png` | logo.webp on black bg |
| `_audit_screenshots/viz_logo_on_checkerboard.png` | logo.webp transparency test |
| `_audit_screenshots/viz_logo-white_on_white.png` | logo-white.webp on white bg |
| `_audit_screenshots/viz_logo-white_on_black.png` | logo-white.webp on black bg |
| `_audit_screenshots/viz_logo-white_on_checkerboard.png` | logo-white.webp transparency test |
| `_audit_temp/loaded-light-logo.webp` | Browser-downloaded logo.webp (SHA: a42eabf49aeefac7) |
| `_audit_temp/loaded-dark-logo.webp` | Browser-downloaded logo-white.webp (SHA: 2fbf282916818a26) |

---

## Audit Scripts (temporary)

| File | Purpose |
|---|---|
| `scripts/_audit_playwright.js` | Light + dark mode browser inspection |
| `scripts/_audit_dark.js` | Dark mode browser inspection |
| `scripts/_audit_visualize.py` | Pillow visualization renders |