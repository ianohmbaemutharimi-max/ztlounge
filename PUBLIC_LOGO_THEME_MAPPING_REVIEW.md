# PUBLIC LOGO / THEME MAPPING — READ-ONLY AUDIT REPORT

**Mode:** AUDIT ONLY (read-only) · **Repo:** `zt-lounge` · `D:\zt lounge\zt-lounge-demo\zt-lounge`
**Branch:** `feature/membership-tiers-staging-phase1` · **HEAD:** `d183ddab7399429f3c334c4d288d6b0988a78f89`
**Dev server:** `http://localhost:8000` (HTTP 200) · **Canonical Supabase:** `jczwilrysvnhcjzjztbi` (anon role; verified in `assets/js/config/env.js` and reachable via PostgREST REST)
**Method:** static source trace + live read-only PostgREST DB reads + Playwright (system Chrome, headless) against the live server. Temp probes were written to `%TEMP%` (outside the repo) and deleted.

## REQUIRED CONTRACT (authoritative — not reinterpreted)
| Theme / background | Visible slot | Required asset |
|---|---|---|
| DARK | `.logo-dark` | `logo.webp` |
| LIGHT | `.logo-light` | `logo-white.webp` |

`.logo-dark` / `.logo-light` denote the **theme/background slot**, not the visual color of the asset.

## 1. EXECUTIVE STATUS — MISMATCH FOUND

The current implementation renders the **opposite** filename in each theme:
| Theme | Slot visible | Asset actually rendered (runtime) | Asset required | Result |
|---|---|---|---|---|
| DARK | `.logo-dark` | `logo-white.webp` | `logo.webp` | **MISMATCH** |
| LIGHT | `.logo-light` | `logo.webp` | `logo-white.webp` | **MISMATCH** |

This is **consistent** across initial HTML, the JS runtime writer, and the live browser — not a transient artifact. (A prior audit on this repo recorded an *earlier* defect where `logo.webp` was written to **both** slots because `logo_light_media_id` did not yet exist; the code has since evolved, so this report is based on fresh evidence at the current HEAD, not that prior report.)

## 2. STATIC SOURCE TRACE

### 2.1 CSS visibility (which slot is visible per theme) — CORRECT
`assets/css/theme.css:1096-1110` and `assets/css/components/navbar.css:37-42`:
```css
.logo .logo-light { display:none; }   /* default = DARK */
.logo .logo-dark  { display:block; }
.light-mode .logo .logo-light { display:block; }
.light-mode .logo .logo-dark  { display:none; }
```
Default (no `.light-mode`) = **DARK**, `.logo-dark` visible; `.light-mode` = **LIGHT**, `.logo-light` visible. ✅ Correct mechanism.

### 2.2 Initial HTML (pre-JS paint) — INVERTED
`assets/js/shared-components.js` emits header (`headerHTML` L119-121) and footer (`footerHTML` L171-173) logos from `BRAND` (L87-91):
```js
var BRAND = {
    logoFallback:      u('assets/images/branding/logo.webp'),          // logo.webp
    logoLightFallback: u('assets/images/branding/logo-white.webp'),    // logo-white.webp
    ...
};
// headerHTML L120-121 / footerHTML L172-173 — IDENTICAL pattern:
'<img src="'+BRAND.logoLightFallback+'" ... class="logo-dark site-logo" ... />'   // .logo-dark  <- logo-white.webp  ❌
'<img src="'+BRAND.logoFallback+'"      ... class="logo-light site-logo" ... />'   // .logo-light <- logo.webp        ❌
```
So the **initial** paint already inverts the contract.

### 2.3 JS runtime writer — `branding-init.js updateLogos()` — INVERTED (final runtime authority)
`assets/js/branding-init.js:76-78` calls `updateLogos(logoUrl, logoLightUrl)` where (L58-59) `logoUrl`=resolved_logo_url→**logo.webp** (dark), `logoLightUrl`=resolved_logo_light_url→**logo-white.webp** (light).
`updateLogos(darkUrl, lightUrl)` at `assets/js/branding-init.js:106-121`:
```js
function updateLogos(darkUrl, lightUrl) {
    document.querySelectorAll('.logo-dark.site-logo')   // .logo-dark  <- lightUrl (logo-white.webp)  ❌
      .forEach(img => { if (lightUrl) img.src = lightUrl; });
    document.querySelectorAll('.logo-light.site-logo')  // .logo-light <- darkUrl  (logo.webp)      ❌
      .forEach(img => { if (darkUrl) img.src = darkUrl; });
}
```
`querySelectorAll` runs document-wide, so it updates header **and** footer. This is the **final runtime authority** for `img.src` after DB resolution.

### 2.4 Who else writes logo `src`? — nobody (confined to 2.2 + 2.3)
Grep of the whole codebase for `logo-dark site-logo` / `logo-light site-logo` returns `src` writes only in `shared-components.js` (initial HTML) and `branding-init.js` (`updateLogos`). `background-media-warmer.js:238-243` only *registers* media for warm-up (no DOM `src` write). `business-config.js:118-124` builds a `logo.dark`/`logo.light` object used by its own fallback; `branding-init` does **not** consume it (it reads `resolved_logo_url`/`resolved_logo_light_url` directly). So the only two `src` writers are 2.2 and 2.3.

## 3. DATABASE / MEDIA TRACE (canonical chain, verified read-only)
Via PostgREST (anon key from `env.js`) → `https://jczwilrysvnhcjzjztbi.supabase.co/rest/v1`.

### 3.1 `business_settings`
| Column | Value |
|---|---|
| `logo_media_id` | `a5fb7148-8562-4d82-9fc1-d979fc19a323` |
| `logo_light_media_id` | `fca651b3-9ca1-4e43-b27a-29edc2cc1d3f` |
| `favicon_media_id` | (separate FK — decoupled from logo) |
| `logo_url` (legacy) | `…/logos/logo.webp` |
| `favicon_url` (legacy) | `…/favicons/favicon.ico` |

### 3.2 Resolve `media_id → media_assets.public_url`
`media_assets` columns: `id, bucket, path, public_url, original_name, mime_type, file_size, width, height, alt_text, title, content_hash, uploaded_by, created_at, updated_at, description`. (`BusinessRepository.resolveMediaId`, `assets/js/repositories/BusinessRepository.js:86-116`, queries `public_url`.)
| media_id | bucket | path | public_url | Resolved filename | Colorway |
|---|---|---|---|---|---|
| `a5fb7148…` (`logo_media_id`) | `logos` | `logo.webp` | `…/storage/v1/object/public/logos/logo.webp` | **logo.webp** | DARK/black (L=0.035) |
| `fca651b3…` (`logo_light_media_id`) | `logos` | `logo-white.webp` | `…/storage/v1/object/public/logos/logo-white.webp` | **logo-white.webp** | LIGHT/white (L=0.958) |

### 3.3 Resolution in `BusinessRepository.resolveBranding` (`Assets/js/repositories/BusinessRepository.js:146-166`)
- `resolved_logo_url` = `media_assets.public_url` for `logo_media_id` → **logo.webp** ✅ matches its name.
- `resolved_logo_light_url` = `media_assets.public_url` for `logo_light_media_id` → **logo-white.webp** ✅ matches its name.

**DB conclusion:** the chain is **correct**; no schema/database/Storage change is required.

## 4. RUNTIME EVIDENCE (Playwright, system Chrome headless, live server)
Probe observed `currentSrc` + `getComputedStyle().display` of `.logo-dark`/`.logo-light` in header & footer per theme. branding-init logged `Updated 4 logo elements (light->.logo-dark, dark->.logo-light)`.

| Phase | Theme state | Slot visible (CSS) | Actual visible `currentSrc` | Expected asset | Result |
|---|---|---|---|---|---|
| Initial load | DARK (none saved→dark) | `.logo-dark` (display:block) | `…/logos/logo-white.webp` | `logo.webp` | **MISMATCH** |
| After toggle | LIGHT (`.light-mode`, saved=`light`) | `.logo-light` (display:block) | `…/logos/logo.webp` | `logo-white.webp` | **MISMATCH** |
| Toggle back | DARK | `.logo-dark` (display:block) | `…/logos/logo-white.webp` | `logo.webp` | **MISMATCH** |
| After reload | DARK (persisted `dark`) | `.logo-dark` (display:block) | `…/logos/logo-white.webp` | `logo.webp` | **MISMATCH** |
| Mobile 375×812 | DARK (persisted) | `.logo-dark` (display:block) | `…/logos/logo-white.webp` | `logo.webp` | **MISMATCH** |

Per-slot detail (DARK): `img.logo-dark` display=block, currentSrc=`…/logos/logo-white.webp`, naturalWidth=1251, complete=true; `img.logo-light` display=none(currentSrc=`…/logos/logo.webp`). (LIGHT): `img.logo-light` display=block, currentSrc=`…/logos/logo.webp`; `img.logo-dark` display=none. All assets return HTTP 200 (both local fallback `/assets/images/branding/*` **and** storage `…/logos/*`).

**Asset color (fresh, `<canvas>` luminance sampling, independent of prior audits):** `logo.webp` mean luminance 0.035 (≈1.49M dark / 1.57M px; fully opaque) → **DARK/BLACK**; `logo-white.webp` mean luminance 0.958 (≈1.47M white px; fully opaque) → **WHITE/LIGHT**.

**Toggle/persistence:** `#themeToggle` flips `light-mode` and writes `localStorage['zt-theme']`; reload restores it; the *visible* `currentSrc` changes (logo-white.webp↔logo.webp), not merely the CSS class. **Header & footer agree; mobile matches desktop.**
**Errors/404s:** no logo/branding 404s. One unrelated 404 — browser preflight `GET /favicon.ico` before the shell injects `<link rel=icon>`; cosmetic, pre-existing, non-logo.

## 5. CONFLICT ANALYSIS — full chain & final runtime authority
```
Initial HTML  (shared-components.js L120-121): .logo-dark<-logo-white.webp, .logo-light<-logo.webp   ⤷ INVERTED
DB resolution (BusinessRepository L146-166):    logo_media_id(a5fb7148)->resolved_logo_url       =.../logo.webp      ✅
                                               logo_light_media_id(fca651b3)->resolved_logo_light_url=.../logo-white.webp ✅
branding-init updateLogos(L106-121) [FINAL AUTHORITY]: .logo-dark<-lightUrl(logo-white.webp), .logo-light<-darkUrl(logo.webp) ⤷ INVERTED
CSS visibility (theme.css:1096-1110 / navbar.css:37-42): DARK->.logo-dark visible; LIGHT->.logo-light visible  ✅ mechanism
Browser renders:  DARK -> .logo-dark -> logo-white.webp  ❌ (contract: logo.webp)
                  LIGHT -> .logo-light -> logo.webp      ❌ (contract: logo-white.webp)
```
**Earliest static layer introducing the mismatch:** `shared-components.js` header/footer `img` initial `src` (L120-121 / L172-173). **Final runtime authority:** `branding-init.js updateLogos()` (L106-121) — the last writer of `img.src` after DB resolution, re-imposing the same inverted pairing. **The DB/media chain is correct and is NOT the cause.**

## 6. HEADER / FOOTER COMPARISON — AGREE
`querySelectorAll('.logo-dark.site-logo')` / `('.logo-light.site-logo')` in `updateLogos` are document-wide, so header + footer are updated identically. Runtime confirmed: both surfaces render the same visible asset per theme. ✔

## 7. MOBILE COMPARISON — AGREE
375×812 viewport: same theme (DARK, persisted) → `.logo-dark` visible → `logo-white.webp`. Matches desktop. No mobile-specific logo override exists (grep: none). ✔

## 8. ROOT CAUSE
A single, consistent (and comment-reinforced) **inverted colorway→slot pairing**, in two src-writers and their comments:
1. `assets/js/shared-components.js:120-121` (header) & `:172-173` (footer) — initial HTML: `.logo-dark`↔`logo-white.webp`, `.logo-light`↔`logo.webp`.
2. `assets/js/branding-init.js:106-121` (`updateLogos`) — final runtime writer: `.logo-dark`←`lightUrl`(logo-white.webp), `.logo-light`←`darkUrl`(logo.webp).

Reinforced by matching comments in `branding-init.js:56-57,73-75,101-104`, `BusinessRepository.js:157-158`, `business-config.js:117-122`, `background-media-warmer.js:241`. The DB/media layer (`logo_media_id`→`logo.webp`, `logo_light_media_id`→`logo-white.webp`) is **correct**; no schema/database/Storage/asset change is needed.

## 9. RECOMMENDED SURGICAL FIX (NOT IMPLEMENTED — AUDIT ONLY)
No DB/Storage/Schema change required. Realign the two src-writers with the contract:

**(a) `assets/js/branding-init.js` `updateLogos()` (L106-121):**
```js
function updateLogos(darkUrl, lightUrl) {
    document.querySelectorAll('.logo-dark.site-logo')   // DARK slot (visible on dark bg)
      .forEach(img => { if (darkUrl)  img.src = darkUrl; });     // <- logo.webp        ✅
    document.querySelectorAll('.logo-light.site-logo')  // LIGHT slot (visible on light bg)
     .forEach(img => { if (lightUrl) img.src = lightUrl; });   // <- logo-white.webp  ✅
}
```

**(b) `assets/js/shared-components.js` headerHTML (L120-121) & footerHTML (L172-173) — swap initial `src` so first paint also satisfies the contract (no inverted pre-brand flash):**
```js
'<img src="'+BRAND.logoFallback+'"       ... class="logo-dark site-logo" ... />'   // .logo-dark  <- logo.webp
'<img src="'+BRAND.logoLightFallback+'"  ... class="logo-light site-logo" ... />'   // .logo-light <- logo-white.webp
```

**(c) (comments only, optional)** — correct the now-misleading direction comments in `branding-init.js:56-57,73-75,101-104`, `BusinessRepository.js:157-158`, `business-config.js:117-122`, `background-media-warmer.js:241`.
`business-config.js` fallback `logo.dark=logo.webp` / `logo.light=logo-white.webp` (L51-54) is already contract-correct; no change.

## 10. FILES CHANGED (this audit)
| Category | Count |
|---|---|
| Source files changed (edits) | **0** |
| Database writes | **0** |
| Storage writes | **0** |
| Schema / migration changes | **0** |
| Asset replacement | **0** |
Created only (untracked docs): `PUBLIC_LOGO_THEME_MAPPING_REVIEW.md`, `PUBLIC_LOGO_THEME_MAPPING_REVIEW_PROGRESS.md`. Temp `%TEMP%` probes deleted. Dirty-file count unchanged (314 pre-existing untracked docs); **no source delta introduced.**

## Final answer
**No.** The current implementation does **not** satisfy the contract. On a **DARK** background, `.logo-dark` (the visible slot) renders `…/logos/logo-white.webp` — the **white/light** asset — not `logo.webp`. On a **LIGHT** background, `.logo-light` renders `…/logos/logo.webp` — the **black/dark** asset — not `logo-white.webp`. The two colorways are wired to the **opposite** slots.

The DB/media chain is already correct (`logo_media_id`→`logo.webp`, `logo_light_media_id`→`logo-white.webp`), so the defect is purely the **src-assignment direction**. The single smallest required change is in `assets/js/branding-init.js` `updateLogos()` (L106-121): make `.logo-dark` receive `darkUrl` (`logo.webp`) and `.logo-light` receive `lightUrl` (`logo-white.webp`), plus the matching swap to the initial `<img>` markup in `assets/js/shared-components.js` (header L120-121, footer L172-173). No database, storage, or schema change is necessary.




