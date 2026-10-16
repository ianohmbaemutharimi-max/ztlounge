# PUBLIC HEADER, FOOTER & BRANDING IDENTITY AUDIT

**Status:** READ-ONLY AUDIT — no fixes applied
**Date:** 2026-10-03
**Public repo:** `D:\zt lounge\zt-lounge-demo\zt-lounge` @ `905bd7a1` (`feature/membership-tiers-staging-phase1`)
**Admin repo:** `D:\zt lounge\zt-lounge-demo\zt-lounge-admin` @ `876b1851` (`clean-rebuild`)
**Canonical Supabase:** `jczwilrysvnhcjzjztbi`

---

## 1. Executive Summary

The shared shell architecture is **sound and genuinely shared**. All 10 public pages consume one canonical implementation (`assets/js/shared-components.js`), there are no duplicated headers or footers, and the branding chain from Admin UI → `business_settings` → `media_assets` → `public_url` → DOM is **canonical and unbroken**.

The light-theme logo failure is **NOT** an architectural drift problem and **NOT** a data/media problem. It is a **theme-asset design defect**, precisely localized:

> The canonical DB logo is a single **fully opaque, black-background** image. The public shell renders **two** logo slots (`.logo-dark`, `.logo-light`) and correctly swaps them via CSS. However `branding-init.js` assigns the **same single DB URL to both slots**, collapsing the variant mechanism. In light mode the visible slot therefore displays a black-background image on a white header — an opaque black square that reads as a "missing" logo.

Critically, **the correct light asset already exists** (`assets/images/branding/logo-white.webp`, verified mean luminance 247) and **the correct slot already exists** (`.logo-light`). They are simply never wired together after DB canonicalization. This is a **wiring defect, not a missing capability**.

A second, related finding: the **Admin UI exposes only one logo**, so the public frontend's two-variant contract is **not satisfiable through the Admin UI as currently built**. This is an architectural mismatch between Admin capability and frontend expectation.

---

## 2. Scope

In scope: shared header, shared footer, logo authority, favicon authority, dark/light theme behaviour, theme toggle flow, cross-page consistency, Admin branding surface.

Out of scope (not audited): unrelated footer copy/content quality, membership/menu/service architecture, performance, SEO beyond branding meta.

No source files, database rows, storage objects, branding records, media records, or theme configuration were modified. No migrations created. Nothing deployed.

---

## 3. Repository / Environment Baseline

| Item | Value |
|---|---|
| Public repo HEAD | `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c` |
| Public branch | `feature/membership-tiers-staging-phase1` |
| Admin repo HEAD | `876b1851fbcd016cf290734498dda66b764afa12` |
| Admin branch | `clean-rebuild` |
| Supabase project | `jczwilrysvnhcjzjztbi` (canonical — confirmed in `.env.local` and `supabase.config.js`) |
| DB access | Anon REST, read-only — **AVAILABLE** |
| Runtime access | Playwright/Chromium — **AVAILABLE** |

**Environment notes:**
- The admin app exists at **two** paths: `zt-lounge-admin\` (sibling, audited) and `zt-lounge\zt-lounge-admin\` (nested copy). The sibling path was treated as canonical.
- `start_pub_server.cjs` is **broken** — it spawns `_public_server.js`, which does not exist (`MODULE_NOT_FOUND`).
- Port 8000 is occupied by an unrelated pre-existing process (PID 21008). Verification used a dedicated read-only static server on **port 8123**.

---

## 4. Public Route Inventory

| Route | Header | Footer | Logo | Favicon | Theme toggle | Shared impl.? |
|---|---|---|---|---|---|---|
| `/index.html` (home) | `headerHTML()` | `footerHTML()` | 2 slots + branding-init | `applyFavicon()` | Yes | **Yes** |
| `/pages/experiences/lounge.html` | same | same | same | same | Yes | **Yes** |
| `/pages/experiences/restaurant.html` | same | same | same | same | Yes | **Yes** |
| `/pages/experiences/restaurant-menu.html` | same | same | same | same | Yes | **Yes** |
| `/pages/experiences/vip.html` | same | same | same | same | Yes | **Yes** |
## 5. Shared Header Architecture

**Location:** `assets/js/shared-components.js` (v2.0.0, 705 lines)

**Injection model — dynamically injected, not static markup:**
- Pages contain only `<div id="site-header"></div>` + `<script src=".../shared-components.js" data-features="..."></script>`.
- `injectShellMarkup()` (line 415) writes `headerHTML()` into the placeholder **synchronously during body parsing**, so it is parser-blocking and present before first paint.
- If the placeholder is missing it falls back to `insertAdjacentHTML('afterbegin', ...)` — no page relies on this path.
- Idempotency guard: `if (window.__ZT_PUBLIC_SHELL__) return;` (line 66).
- Marker `window.ZTPublicShell = { version: '2.0.0', source: '...' }` (lines 70–73), confirmed present at runtime on all 10 routes.

**Ownership:** logo slots, navigation, dropdowns, mobile hamburger + focus trap, theme toggle, header phone CTA, favicon links, OG fill, global script layer emission, active-nav marking, copyright year, fixed-chrome measurement.

**Overrides:** none. No page injects or replaces header markup.

**Logo rendering:** two `<img>` inside `<a class="logo">` — `headerHTML()` lines 120–121.

**Theme toggle rendering:** `headerHTML()` line 153, `<button class="theme-toggle" id="themeToggle">` with `fa-moon` + `fa-sun`.

**Theme detection:** `assets/js/theme-init.js`, blocking in `<head>`, reads `localStorage['zt-theme']`, adds `.light-mode` pre-paint. Confirmed on all 10 pages.

**Theme change:** `initThemeToggle()` (line 431) toggles `.light-mode`, persists `zt-theme`, updates `colorScheme`.

**Does the logo change when the theme changes?** The *visible element* changes (CSS `display` swap). The *asset URL does not change* once branding-init has run — both slots hold the same DB URL.

---

## 6. Shared Footer Architecture

**Location:** same file, `footerHTML()` (line 165). Injected into `<div id="site-footer"></div>` at `DOMContentLoaded` (`initSharedBehaviour()`, line 675).

**Every public route receives it** — verified at runtime on all 10 routes: `footer.footer` present, `#site-footer` populated (4870–4966 chars).

**Custom footers:** none.

**Branding source parity:** footer uses the **identical** logo slots and `data-canonical-logo` attributes as the header (lines 172–173), and `branding-init.js` queries `.logo-dark.site-logo` / `.logo-light.site-logo` globally — so header and footer resolve from the **same** canonical source. Confirmed at runtime: footer and header logo `src` identical on all 10 routes.

**Hardcoded footer content (flagged, non-blocking):** social URLs, the brand blurb, and the quick-links/services lists are **static strings in `shared-components.js`**, not DB-driven. Contact info (address, phone, WhatsApp, email, hours) uses `data-*` hydration hooks (`data-footer-address`, `data-phone-link`, `data-whatsapp`, `data-email-link`, `data-hours`) fed by `content-loader` from `business_settings`.

## 7. Logo Data Authority

**The chain is canonical and unbroken. No bypass, no raw Storage URL hardcoded in a page, no duplicated resolver.**

```
Admin UI — SettingsView (zt-lounge-admin/src/features/settings/settings-view.tsx)
   ↓ ImageChangeDialog (media picker / upload, uploadCategory="branding")
   ↓ handleLogoMediaSave → saveBranding mutation
PATCH /api/admin/business-settings/branding
   ↓ withAdminAuth; validates media_assets row exists and mime_type startsWith "image/"
   ↓ writes ONLY logo_media_id / favicon_media_id (legacy logo_url/favicon_url untouched)
business_settings.logo_media_id
   ↓ BusinessRepository.resolveMediaId()  (public)
media_assets.id → media_assets.public_url
   ↓ BusinessRepository.resolveBranding() → resolved_logo_url
   ↓ business-config.js → BusinessConfig.logo.{dark,light}
branding-init.js updateLogos()
   ↓ <img class="logo-dark site-logo"> and <img class="logo-light site-logo">
DOM
```

**Live DB state (read-only, project `jczwilrysvnhcjzjztbi`):**
```
business_settings.id              = 1
business_settings.business_name   = ZT Lounge Meru
business_settings.logo_media_id   = a5fb7148-8562-4d82-9fc1-d979fc19a323
business_settings.favicon_media_id= a5fb7148-8562-4d82-9fc1-d979fc19a323   (same id)
business_settings.logo_url        = .../storage/v1/object/public/logos/logo.webp   (legacy)
business_settings.favicon_url     = /favicon.ico                                      (legacy, stale)

media_assets (that id):
  bucket      = logos
  path        = logo.webp
  public_url  = https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/logos/logo.webp
  mime_type   = image/webp
  width×height= 1920 × 1080     <-- metadata; actual bytes decode to 1251 × 1251
  title       = ZT Lounge Logo
```

**Findings:**
- **Verified:** `favicon_media_id` is intentionally the **same** media row as `logo_media_id`. Documented as deliberate in `shared-components.js` lines 36–38 and 271–273. Not a defect, but noted.
- **Verified:** legacy `logo_url` equals the resolved `public_url` (same object), so the legacy path is not currently producing a divergent result. `favicon_url = /favicon.ico` **is** stale/broken, but is never reached because `favicon_media_id` resolves successfully and wins (`resolveBranding`, lines 145–159).
- **Verified:** there is **no** `logo_dark_media_id` / `logo_light_media_id` / variant column anywhere in `business_settings`.
- **Flagged:** `assets/js/business-config.js` lines 118–121 collapse the variant contract:
  ```js
  logo: {
## 9. Dark Theme Rendering

**Status: VERIFIED — renders correctly.**

```
html.class              = (none)          [no .light-mode]
header background       = rgba(10,10,10,0.92)
img.logo-dark  display  = block     naturalWidth = 1251
img.logo-light display  = none
```

The canonical DB logo (`logo.webp`, mean luminance **11.9**, solid black background) sits on a near-black header. The black square blends into the background, so the gold mark and white "Lounge" wordmark read correctly.

**This is exactly why the defect is invisible in dark mode:** the opaque black background is *camouflaged* by the dark header. Visual correctness here does **not** prove branding correctness — the same asset is equally wrong for light mode.

---

## 10. Light Theme Rendering

**Status: VERIFIED — defect reproduced on all 10 routes.**

```
html.class              = light-mode
localStorage['zt-theme']= light
header background       = rgba(255,255,255,0.95)
img.logo-dark  display  = none
img.logo-light display  = block     src = .../logos/logo.webp   <-- BLACK-BACKGROUND ASSET
img.logo-light naturalWidth = 1251                             <-- loads fine, HTTP 200
```

**The image is NOT missing and NOT broken.** It loads successfully (`naturalWidth=1251`, no failed requests, no console error). It is **visually unsuitable**: an opaque, fully-black 1251×1251 square rendered on a near-white header, producing a black block where the logo should be.

**Screenshot proof:** `_audit_tmp/shot_home_dark.png` (black header, logo blends, correct) vs `_audit_tmp/shot_home_lightreload.png` (white header, opaque black square, reads as broken).

### Exact failure layer

| Layer | Verdict |
|---|---|
| DATA | ✅ Correct — `logo_media_id` resolves to a valid `media_assets` row |
| MEDIA | ✅ Correct — `public_url` valid, returns HTTP 200 |
| RESOLUTION | ⚠️ **DEFECT** — `branding-init.js:96–99` assigns the *same* single URL to `.logo-light` as `.logo-dark`, discarding the correct light variant |
| DOM | ✅ Correct — both slots present and rendered |
| CSS | ✅ Correct — `.light-mode .logo .logo-light { display:block }` (theme.css:1104–1110) swaps correctly |
| THEME | ✅ Correct — class toggle, `localStorage` persistence, `colorScheme` all correct |
| ASSET | ⚠️ **ROOT CAUSE** — the only DB-backed asset is an opaque black-background image; no light-theme asset exists in the media system |
| ROUTING | ✅ Correct — single canonical shell, no routing divergence |
| DUPLICATION | ⚠️ Contributing — dead `navbar.css` rules, `BusinessRepository` duplicate media query, `business-config.js` collapsing `logo.dark`/`logo.light` |
| RUNTIME | ✅ Correct — no JS exceptions in the branding path on the stable server |

**Root cause statement:**
> The branding architecture supports **only one** logo, but the public shell renders **two** theme slots and expects **two** assets. `branding-init.js` resolves this mismatch by forcing one URL into both slots. The DB-backed asset happens to be a dark-theme asset, so the light slot renders a black square on white. The correct light asset (`logo-white.webp`) exists in the repo but is **overwritten** by `branding-init.js` and is **unreachable** through the Admin UI or DB.

**Asset evidence table:**

| Asset | Bytes | SHA-256 | Size | Transparency | Mean luminance | Role |
|---|---|---|---|---|---|---|
| `assets/images/branding/logo.webp` | 16114 | `A42EABF4…` | 1251×1251 | 0.0% | **11.9** | dark-bg asset |
| Storage `logos/logo.webp` (canonical) | 16114 | `A42EABF4…` | 1251×1251 | 0.0% | **11.9** | **same bytes as local** |
| `assets/images/branding/logo-white.webp` | 14496 | `2FBF2829…` | 1251×1251 | 0.0% | **247.0** | light-bg asset (**orphaned**) |
## 11. Theme Toggle Flow

**Status: VERIFIED — correct and consistent.**

```
<HEAD, blocking>
  assets/js/theme-init.js
    savedTheme = localStorage.getItem('zt-theme')
    'light' → documentElement.classList.add('light-mode'); colorScheme = 'light'
    else    → colorScheme = 'dark'
      ↓  (pre-paint, prevents theme FOUC)

<BODY, parser-blocking>
  assets/js/shared-components.js
    injectShellMarkup()  → header (incl. #themeToggle) + CTA
    applyFavicon()       → link[rel=icon], link[rel=apple-touch-icon]
    fillEmptyOgImages()
    emitScriptLayer()    → 30 GLOBAL_SCRIPTS + features + core, all `defer`
      ↓
  DOMContentLoaded → initSharedBehaviour()
    injectIntoPlaceholder('site-footer', footerHTML())
    initThemeToggle()
      ↓
  #themeToggle click →
    documentElement.classList.toggle('light-mode')
    localStorage.setItem('zt-theme', isLight ? 'light' : 'dark')
    documentElement.style.colorScheme = isLight ? 'light' : 'dark'
```

**Verified at runtime (all 10 routes, 4 phases):** class toggles correctly, `localStorage` persists, `colorScheme` updates, reload restores the persisted theme, toggling back returns to dark with no state divergence.

**Icon swap:** `.theme-toggle .fa-sun { display:none }` / `.light-mode .theme-toggle .fa-moon { display:none }` / `.light-mode .theme-toggle .fa-sun { display:inline-block }` (theme.css:1314–1323). Confirmed visually (moon in dark, sun in light).

**Initialization order:** correct. Header is parser-injected before paint, so `#themeToggle` always exists when `initThemeToggle()` runs at DOMContentLoaded.

**Critical observation:** the theme toggle changes **only** the `light-mode` class. There is **no hook that re-resolves or swaps the logo asset on theme change.** Logo visibility is CSS-only. This is correct design *if* two distinct assets existed — but only one DB asset exists, so the swap has nothing to swap to.

**Legacy duplicate theme code exists but is inert:** `assets/js/theme.js`, `assets/js/core/app.js` (lines 21–31 implement a second `zt-theme` toggle), and `assets/js/navigation.js`. Verified via grep that **no page loads any of them.** Dead code — a drift risk, not an active defect.

---

## 12. Favicon Authority

**Status: VERIFIED — DB/media controlled, single source.**

**Configuration path:** `shared-components.js` `applyFavicon()` (line 286) → `ensureFavicon('icon', BRAND.logoFallback)` and `ensureFavicon('apple-touch-icon', BRAND.appleTouchFallback)`. `ensureFavicon()` (lines 275–284) **creates** the `<link>` if absent — always the case, since **no page declares a favicon in HTML**.

**Canonicalization:** `branding-init.js` `updateFavicon(faviconUrl)` (lines 108–120) sets **both** `link[rel="icon"]` and `link[rel="apple-touch-icon"]` to `resolved_favicon_url`. Console-verified: `[BrandingInit] ✅ Favicon canonicalized: .../logos/logo.webp`.
## 13. Admin UI Branding Controls

**Status: VERIFIED.**

**Screen:** `zt-lounge-admin/src/features/settings/settings-view.tsx` — "Settings" page, "Branding" section (line 143).

| Control | Present | Detail |
|---|---|---|
| Business identity (name, description, phone, WhatsApp, email, address, city, country, maps, lat/long) | ✅ Yes | `saveBiz` mutation |
| **One logo** | ✅ Yes | `ImageChangeDialog` title="Edit Logo", `uploadCategory="branding"`, `allowRemove={false}` |
| **One favicon** | ✅ Yes | `ImageChangeDialog` title="Edit Favicon", same workflow |
| **Dark logo** | ❌ **No** | No field, no variant picker |
| **Light logo** | ❌ **No** | No field, no variant picker |
| Logo variants / theme variants | ❌ **No** | No such concept in the schema |
| Theme / appearance settings | ❌ **No** | Only currency + timezone + generic system-settings key/value |
| Fallback assets | ⚠️ Partial | Only the local repo fallbacks in `shared-components.js` |

**Save path:** `handleLogoMediaSave` / `handleFaviconMediaSave` → `saveBranding` → `PATCH /api/admin/business-settings/branding` → `withAdminAuth` handler → validates the `media_assets` row exists and `mime_type` starts with `image/` → updates **only** `logo_media_id` / `favicon_media_id`. Correctly does **not** touch legacy `logo_url` / `favicon_url`.

**What an administrator can control vs. what is hardcoded on the public site:**

| Item | Admin-controlled? |
|---|---|
| Logo image (single asset) | ✅ Yes |
| Favicon image (single asset, currently same asset) | ✅ Yes |
| Light-theme logo variant | ❌ **No** — hardcoded to the same single asset |
| Header/footer structure | ❌ No — canonical shell |
| Footer social URLs | ❌ **No** — hardcoded strings in `shared-components.js` |
| Footer brand blurb | ❌ **No** — hardcoded |
| Footer link lists | ❌ **No** — hardcoded |
| Footer contact info | ✅ Yes — DB-driven via `data-*` hooks |

**Architectural mismatch (flagged):** the public frontend is **built around two logo slots** (`.logo-dark` / `.logo-light`), while the Admin UI and `business_settings` schema expose **exactly one** logo. The frontend behaves as though two variants exist; the backend can only ever supply one.

**Flagged (minor, type-level):** `zt-lounge-admin/src/db/schema.ts` declares `logoUrl` / `faviconUrl` but **not** `logoMediaId` / `faviconMediaId`, despite `src/lib/contract/mapping.ts` mapping them and `src/lib/repository.ts` including them in the read allowlist. The typed Drizzle model is out of sync with the actual DB columns.

---

## 14. Runtime Verification

**Status: VERIFIED.** All 10 public routes × 4 phases = 40 page-states, via Playwright/Chromium at 1440×900.

**Per route, the following was recorded:** `html.className`, `localStorage['zt-theme']`, `colorScheme`, `window.ZTPublicShell.version`, header/footer element counts, header background colour, both header logo slots and both footer logo slots (`src`, `naturalWidth/Height`, `display`, `visibility`, `opacity`, `filter`, bounding box), `link[rel="icon"]`, `link[rel="apple-touch-icon"]`, `#themeToggle` presence — plus console errors/warnings and failed network requests.

**Phase sequence per route:** (1) fresh load in dark → (2) toggle to light → (3) reload while light → (4) toggle back to dark.

**Result summary:**

| Measurement | Dark | Light |
|---|---|---|
| `html.class` | none | `light-mode` |
| Header background | `rgba(10,10,10,0.92)` | `rgba(255,255,255,0.95)` |
| `.logo-dark` display | `block` | `none` |
| `.logo-light` display | `none` | `block` |
| Logo `naturalWidth` | 1251 | 1251 |
| Logo `src` (both slots) | `.../logos/logo.webp` | `.../logos/logo.webp` (**identical**) |
| Favicon | `.../logos/logo.webp` | same |
| `ZTPublicShell.version` | 2.0.0 | 2.0.0 |

**Consistency:** identical behaviour on all 10 routes — no route deviates.

**Network:** 6 failed requests total, all `net::ERR_ABORTED` on lazy gallery images on `/pages/contact/gallery.html`. **Zero** branding-related failures. Zero 404s on logo or favicon.

**Screenshots captured:** `_audit_tmp/shot_{home,lounge,restaurant-menu}_{dark,light,lightreload}.png`.

## 15. Cross-Page Consistency

| Surface | Header impl. | Footer impl. | Logo source | Favicon source | Theme behaviour | Status |
|---|---|---|---|---|---|---|
| `/index.html` | `shared-components.js` | same | DB canonical + 2 slots | DB canonical | correct swap, wrong asset | **VERIFIED** |
| `/pages/experiences/lounge.html` | same | same | same | same | same | **VERIFIED** |
| `/pages/experiences/restaurant.html` | same | same | same | same | same | **VERIFIED** |
| `/pages/experiences/restaurant-menu.html` | same | same | same | same | same | **VERIFIED** |
| `/pages/experiences/vip.html` | same | same | same | same | same | **VERIFIED** |
| `/pages/business/events.html` | same | same | same | same | same | **VERIFIED** |
| `/pages/business/conference.html` | same | same | same | same | same | **VERIFIED** |
| `/pages/business/grooming-care.html` | same | same | same | same | same | **VERIFIED** |
| `/pages/contact/contact.html` | same | same | same | same | same | **VERIFIED** |
| `/pages/contact/gallery.html` | same | same | same | same | same | **VERIFIED** |

**Reuse model:** **genuinely shared, dynamically injected.** One implementation (`shared-components.js`), injected at runtime into placeholder `<div>`s. No static copy of header/footer markup exists in any page. No page overrides the shell.

**Consistency verdict:** header, footer, logo, favicon, and theme behaviour are **fully consistent across all 10 public pages** — including in being consistently wrong for the light-theme logo.

**No rewrite is warranted or recommended.**

---

## 16. Findings

### F1 — Light-theme logo renders a black square (PRIMARY DEFECT)
- **ID:** F1
- **Area:** Logo / Theme
- **Status:** VERIFIED
- **Severity:** HIGH (user-visible branding failure on every public page in light mode)
- **Classification:** RESOLUTION + ASSET (contributed to by DUPLICATION)
- **Evidence:** `shared-components.js:120–121` (header), `:172–173` (footer) render `.logo-dark` + `.logo-light`. `branding-init.js:96–99` sets both to the same `resolved_logo_url`. DB `logo_media_id` → `logos/logo.webp` = opaque black 1251×1251, mean luminance 11.9, 0% transparent. Runtime: light header `rgba(255,255,255,0.95)`, `.logo-light` `display:block`, `naturalWidth=1251`. Screenshot `shot_home_lightreload.png`.
- **Expected:** Light mode shows a light-background logo variant.
- **Actual:** Light mode shows the dark-background logo as an opaque black square.
- **Root Cause:** One DB-backed logo asset is forced into two theme slots. The correct light asset `logo-white.webp` (mean luminance 247) exists in-repo but is overwritten by `branding-init.js` and is unreachable via DB/Admin.
- **Affected Routes:** All 10 public pages, header **and** footer.
- **Runtime Proof:** Reproduced deterministically on 10/10 routes × 2 light phases. Image loads HTTP 200 — this is **not** a missing-asset or bad-URL bug.
- **Recommended Next Action:** See §20 G9.

### F2 — Admin UI cannot supply a light-theme logo
- **ID:** F2
- **Area:** Admin UI / Branding
- **Status:** VERIFIED
- **Severity:** HIGH (blocks a durable data-layer fix)
- **Classification:** DATA / ARCHITECTURE
- **Evidence:** `settings-view.tsx` exposes exactly two `ImageChangeDialog` instances ("Edit Logo" lines 290–299, "Edit Favicon" lines 300–309). No variant field. `business_settings` has only `logo_media_id` / `favicon_media_id`. `PATCH /api/admin/business-settings/branding` accepts only those two keys.
- **Expected:** If the renderer expects two variants, the Admin UI must be able to set two.
- **Actual:** One logo only.
### F4 — Favicon written by two competing code paths
- **ID:** F4  **Area:** Favicon  **Status:** VERIFIED  **Severity:** LOW  **Classification:** DUPLICATION
- **Evidence:** `shared-components.js applyFavicon()` (line 286) and `business-config.js initBusinessConfig()` (lines 153–158) both write `link[rel="icon"]`.
- **Expected:** One writer.  **Actual:** Two writers; last-write-wins. Both currently yield the same URL.
- **Root Cause:** Overlapping responsibilities.  **Affected Routes:** All 10.
- **Runtime Proof:** Final DOM value correct on all routes; no observed conflict.
- **Recommended Next Action:** Defer — not causing the reported defect.

### F5 — `BusinessRepository` duplicates the media resolution query
- **ID:** F5  **Area:** Media resolution  **Status:** VERIFIED  **Severity:** LOW  **Classification:** DUPLICATION
- **Evidence:** `BusinessRepository.resolveMediaId()` (lines 85–115) queries `media_assets` directly instead of using `MediaResolver`, documented as "The SINGLE public media resolution path".
- **Expected:** One resolver.  **Actual:** Two paths to the same table/column.
- **Root Cause:** Branding resolution implemented outside `MediaResolver`.  **Affected Routes:** All 10.
- **Runtime Proof:** Source-verified; results agree.
- **Recommended Next Action:** Defer — does not cause the defect.

### F6 — Dead duplicate CSS and theme code
- **ID:** F6  **Area:** CSS / Theme  **Status:** VERIFIED  **Severity:** LOW (drift risk)  **Classification:** DUPLICATION
- **Evidence:** `assets/css/components/navbar.css:37–41` duplicates the `.logo-dark`/`.logo-light` rules but is **never linked**. `assets/js/theme.js`, `assets/js/core/app.js:21–31`, `assets/js/navigation.js` implement a second theme toggle but are **never loaded**.
- **Expected:** Single source.  **Actual:** Inert duplicates present.
- **Root Cause:** Leftovers from the pre-shell implementation.  **Affected Routes:** None currently.
- **Runtime Proof:** Grep confirms zero references; `theme.css` is the only linked stylesheet.
- **Recommended Next Action:** Defer — do not touch during the F1 fix.

### F7 — Footer CSS class mismatch
- **ID:** F7  **Area:** Footer / CSS  **Status:** VERIFIED  **Severity:** LOW (cosmetic)  **Classification:** CSS
- **Evidence:** `footerHTML()` emits `<footer class="footer">`; `theme.css:1877–1878` target `.site-footer`.
- **Expected:** Matching selectors.  **Actual:** Those two padding rules never apply.
- **Root Cause:** Class renamed during shell consolidation; CSS not updated.  **Affected Routes:** All 10.
- **Runtime Proof:** Runtime `querySelectorAll('.site-footer').length === 0` on every route, while `footer.footer` is present.
- **Recommended Next Action:** Defer — unrelated to branding.

### F8 — Stale legacy branding columns and metadata drift
- **ID:** F8  **Area:** Data  **Status:** VERIFIED  **Severity:** LOW  **Classification:** DATA
- **Evidence:** `business_settings.favicon_url = "/favicon.ico"` (no such file). `media_assets.width/height = 1920×1080` but the object decodes to 1251×1251.
- **Expected:** Legacy fields valid or unused; metadata accurate.  **Actual:** Stale values present but currently unreached.
- **Root Cause:** Legacy columns never cleaned up.  **Affected Routes:** None currently (media path wins).
- **Runtime Proof:** Live DB read + byte-level asset decode.
- **Recommended Next Action:** Defer — do not modify DB in this task.

<!-- APPEND-MARKER -->

- **Root Cause:** Frontend contract (two slots) exceeds backend capability (one asset).
- **Affected Routes:** All (governs what any route can display).
## 17. Risks

| # | Risk | Severity | Note |
|---|---|---|---|
| R1 | Fixing only the frontend leaves no DB path for a light logo — the defect silently returns on the next admin logo change | HIGH | Any fix must decide the G9 option explicitly |
| R2 | Adding a second branding table / resolver / media path would create architectural drift | HIGH | Explicitly out of bounds |
| R3 | Uploading a transparent-background logo would fix both themes at once but changes the canonical asset and could affect favicon/OG/JSON-LD | MEDIUM | Favicon, OG image, and JSON-LD all reuse the same `resolved_logo_url` (`branding-init.js` lines 61–63, 69–71) |
| R4 | Touching dead files (`navbar.css`, `theme.js`, `core/app.js`) during the fix risks re-introducing a second theme system | MEDIUM | Leave inert files alone |
| R5 | `favicon_media_id` shares the logo asset; changing the logo asset changes the favicon simultaneously | MEDIUM | Admin cannot currently set them independently in effect |
| R6 | A DB migration for a variant column would be a schema change, out of scope for a surgical fix | MEDIUM | Requires explicit approval |

---

## 18. Decision Gates

**G1 — Shared Header:** One canonical header implementation used by all public pages?
**YES.** `assets/js/shared-components.js` → `headerHTML()`. All 10 public pages inject via `<div id="site-header">`. No duplicates, no overrides. `404.html`/`index_clean.html` are not content pages.

**G2 — Shared Footer:** One canonical footer implementation used by all public pages?
**YES.** `footerHTML()` in the same file. Runtime-confirmed present on all 10 routes.

**G3 — Logo Authority:** Does the public logo ultimately come from the canonical Admin/DB/media system?
**YES.** Admin → `PATCH /api/admin/business-settings/branding` → `business_settings.logo_media_id` → `media_assets.public_url` → `resolved_logo_url` → DOM. No hardcoded Storage URL in any page. The local `logo.webp` fallback is byte-identical to the canonical asset, so there is no visible divergence — but it is a **fallback**, not the authority.

**G4 — Favicon Authority:** Does the public favicon ultimately come from the canonical Admin/DB/media system?
**YES.** `business_settings.favicon_media_id` → `media_assets.public_url` → `<link rel="icon">` + `<link rel="apple-touch-icon">`. No page declares a static favicon.

**G5 — Theme Support:** Does the current branding architecture explicitly support both dark and light themes?
**PARTIALLY — this is the core architectural gap.** The *rendering* layer supports both themes fully (two slots, CSS swap, persisted toggle, light/dark CSS variables). The *branding data* layer does **not**: exactly one logo asset, one `logo_media_id`, one Admin picker. Theme support is **half-implemented** — the shell is variant-aware, the data model is not.

**G6 — Light Logo Failure:** What exact layer causes the logo to disappear or become incorrect in light mode?
**The RESOLUTION layer, driven by the ASSET layer.** `branding-init.js:96–99` assigns the single canonical DB URL to the `.logo-light` slot, destroying the intended variant distinction. Because the one canonical asset (`logos/logo.webp`) is a fully opaque **black-background** image, the light slot renders a black square on the near-white header. CSS, DOM, theme class, persistence, and asset loading are all **correct** — the image loads successfully (HTTP 200, `naturalWidth=1251`). It is not missing, not null, not a stale path, not a bad media ID, and not a CSS bug. It is a **wrong-asset-for-slot** defect.

**G7 — Admin Control:** Can an administrator control the branding identity required by the public renderer?
**NO — not fully.** An administrator controls one logo and one favicon. The public renderer requires a light-theme logo variant for which the Admin UI, the API, and the DB schema have **no field**.

**G8 — Cross-Page Consistency:** Are header, footer, logo, favicon, and theme behavior consistent across all public pages?
**YES — fully consistent**, verified at runtime on all 10 routes across 4 phases each. Consistency is not the problem; the shared implementation reproduces the same defect everywhere by design.

**G9 — Surgical Fix:** Smallest safe change to correct the confirmed defect?
## 19. Deferred / Blocked Items

**DEFERRED** (real, but not causing the reported defect — deliberately not actioned):
- F4 — duplicate favicon writer (`business-config.js` vs `shared-components.js`).
- F5 — `BusinessRepository` bypassing `MediaResolver`.
- F6 — dead `navbar.css` logo rules; dead `theme.js` / `core/app.js` / `navigation.js`.
- F7 — `.site-footer` vs `.footer` CSS class mismatch (sticky-CTA padding rules inert).
- F8 — stale `favicon_url = "/favicon.ico"`; `media_assets` 1920×1080 vs actual 1251×1251.
- Admin Drizzle `schema.ts` missing `logoMediaId` / `faviconMediaId` (type-level only).
- Footer social URLs / blurb / link lists are hardcoded rather than DB-driven.
- `favicon_media_id` and `logo_media_id` intentionally point at the same asset.
- `start_pub_server.cjs` references a non-existent `_public_server.js`.

**BLOCKED:** none. Both encountered blockers (missing server module, occupied port 8000) were resolved by using a dedicated read-only static server on port 8123. No verification item remains blocked.

**NOT TESTABLE in this environment:**
- Whether a **real** light-theme logo asset exists anywhere in Supabase Storage (only the DB-referenced row was queried; a bucket listing was not performed, and none is referenced by `business_settings`).
- Behaviour of the Admin UI's branding picker in a running browser (no Admin credentials / dev server were started). The Admin surface was audited by source + live DB read only.
- Cross-browser rendering (Chromium only).
- Production/deployed behaviour (`https://ztlounge.co.ke` was not fetched or tested).

---

## 20. Recommended Next Surgical Fix

**Nothing below has been implemented. This is a recommendation for review only.**

The defect has **two independent halves**, and the fix must address both or it will regress:

**Half 1 — the frontend must stop collapsing the variants.**
`branding-init.js:88–102` currently forces one URL into both slots. The minimal correction is to stop overwriting `.logo-light` with the dark-theme URL, so the shell's existing `logo-light` fallback (`assets/images/branding/logo-white.webp`) survives. Likewise `business-config.js:118–121` should stop aliasing `logo.light` to `logo.dark`.

**Half 2 — the data layer must be able to carry a light logo, or the fix is cosmetic and temporary.**
There are three candidate directions; **the choice is a product decision, not a technical one:**

| Option | Change | Pros | Cons |
|---|---|---|---|
| **A. Single transparent asset** | Replace the canonical logo with a **transparent-background** logo via the existing Admin picker | Zero schema change; zero code change; fixes both themes permanently; uses the existing single-asset architecture as designed | Requires uploading a replacement asset; affects favicon/OG/JSON-LD which reuse the same URL |
| **B. Reuse the existing local fallback** | Frontend-only: stop overwriting `.logo-light` | Smallest possible diff; no DB/asset change | `logo-white.webp` is repo-local, **not** admin-controllable — drifts from the canonical media system; contradicts the DB-driven branding principle |
| **C. Add a variant field** | Add `logo_light_media_id` (or a variant table) to `business_settings`, expose it in the Admin UI, resolve it in `BusinessRepository` | Fully honours the existing two-slot architecture; admin-controllable | Requires a **schema migration** and Admin work; larger blast radius |

**Audit recommendation:** Option **A** is the smallest change that is *durable* and stays inside the existing single-asset architecture — provided the replacement asset is a transparent-background logo and the favicon/OG side effects (R3) are accepted. Option **C** is the only one that makes the existing `.logo-light` slot genuinely DB-driven, but it requires explicit approval for a schema change.

**Regardless of option chosen:**
- Do **not** modify `shared-components.js` header/footer structure, the shell, the theme system, or `theme.css` logo rules — all are correct.
- Do **not** touch the dead files (F6).
- Do **not** create a second branding table, resolver, media path, or header/footer.
- Re-verify on all 10 routes with the same 4-phase runtime sequence used in this audit.

---

## Appendix — Files Inspected

**Public repo:** `index.html`, `404.html`, `index_clean.html`; `pages/business/{conference,events,grooming-care}.html`; `pages/contact/{contact,gallery}.html`; `pages/experiences/{lounge,restaurant,restaurant-menu,vip}.html`; `assets/js/shared-components.js`, `branding-init.js`, `business-config.js`, `theme-init.js`, `theme.js`, `navigation.js`, `core/app.js`; `assets/js/repositories/BusinessRepository.js`, `MediaResolver.js`; `assets/js/config/supabase.config.js`; `assets/css/theme.css`, `assets/css/components/navbar.css`; `assets/images/branding/*`; `.env.local`; `start_pub_server.cjs`.

**Admin repo:** `src/features/settings/settings-view.tsx`; `src/app/api/admin/business-settings/branding/route.ts`; `src/app/api/branding/route.ts`; `src/lib/contract/mapping.ts`; `src/lib/repository.ts`; `src/db/schema.ts`.

**Runtime artifacts (audit-only, untracked):** `_audit_tmp/` — `server.js`, `runtime_audit.js`, `shots.js`, `runtime_results.json`, screenshots, and asset-analysis PNGs.

See §20. **Not implemented in this task.**

<!-- APPEND-MARKER -->

- **Runtime Proof:** Source-verified against live DB columns.
- **Recommended Next Action:** Decide the G9 option before any fix.

### F3 — `business-config.js` collapses `logo.dark` / `logo.light`
- **ID:** F3
- **Area:** Logo resolution
- **Status:** VERIFIED
- **Severity:** MEDIUM
- **Classification:** RESOLUTION / DUPLICATION
- **Evidence:** `business-config.js:118–121` — `dark:` and `light:` both resolve to `settings.resolved_logo_url`.
- **Expected:** Distinct values per theme.
- **Actual:** Identical values.
- **Root Cause:** Written as a single-asset assumption; mirrors the one-asset DB.
- **Affected Routes:** All 10.
- **Runtime Proof:** Source + runtime (`BusinessConfig.logo.dark === logo.light` after load).
- **Recommended Next Action:** Resolve together with F1/F2.

<!-- APPEND-MARKER -->

**Earlier blocker (resolved, noted for transparency):** the first two runs were executed against a flaky pre-existing server on port 8000 and produced spurious `ERR_CONNECTION_REFUSED` results. Those runs were **discarded** and the audit re-run against a dedicated read-only server on port 8123. Only the port-8123 results are reported above.

**Note on an observed but non-branding console error:** on some early loads `[BrandingInit] BusinessRepository not available — using static fallback` appeared due to the crashed server truncating the deferred script layer. On the stable server this did not occur — branding resolved on all 10 routes.

<!-- APPEND-MARKER -->


**Chain:** `business_settings.favicon_media_id` → `media_assets.public_url` → `<link rel="icon">` + `<link rel="apple-touch-icon">`. **Canonical — matches the expected architecture.**

**Consistency across pages:** verified identical on all 10 routes — no page declares its own favicon, so there is nothing to diverge.

**Theme-specific favicon behaviour:** none. Not required by the architecture.

**Flagged (minor):**
- `favicon_media_id` points at the **same** 1251×1251 logo asset as the logo. Documented as intentional, but a 1251×1251 image is oversized for a favicon.
- `assets/js/business-config.js` `initBusinessConfig()` (lines 153–158) **also** writes `link[rel="icon"]` from `config.favicon` — a **second writer** competing with `branding-init.js`. Both resolve to the same value, so no observed conflict, but it is a duplicated write path.
- `business_settings.favicon_url = "/favicon.ico"` is a stale legacy value (no such file in the repo). Currently unreachable because the media path wins.
- `assets/images/branding/apple-touch-icon.webp` is byte-identical to `logo.webp`.

<!-- APPEND-MARKER -->

| `assets/images/branding/apple-touch-icon.webp` | 16114 | `A42EABF4…` | — | — | — | byte-identical to logo |

The canonical DB object and the local `logo.webp` fallback are **byte-identical** — so the pre-hydration fallback and the post-hydration canonical value are visually the same. The defect therefore exists **both before and after** DB hydration; it is **not** a hydration race.

<!-- APPEND-MARKER -->

    dark:  settings.resolved_logo_url || FALLBACK_CONFIG.logo.dark,
    light: settings.resolved_logo_url || FALLBACK_CONFIG.logo.light,
  }
  ```
  Both keys resolve to the same canonical URL whenever the DB resolves.

---

## 8. Logo Media Resolution

**Single canonical public resolver:** `assets/js/repositories/MediaResolver.js` — documented as "The SINGLE public media resolution path: `content.media_id → media_assets.public_url`". Batched, cached, non-fatal on failure.

**Exception (flagged, minor):** `BusinessRepository.resolveMediaId()` (lines 85–115) performs its **own** `.from('media_assets').select('public_url').eq('id',...).single()` query rather than going through `MediaResolver`. This is a **second, duplicated media-resolution path** — though it targets the same canonical table/column and produces the same result. It does not bypass the media chain; it duplicates it.

**Resolution outcome (verified at runtime):** `resolved_logo_url` resolves successfully on all 10 routes. Console confirms:
```
[BrandingInit] Settings loaded: {businessName: ZT Lounge Meru, hasResolvedLogo: true, hasResolvedFavicon: true}
[BrandingInit] ✅ Logo canonicalized: https://.../storage/v1/object/public/logos/logo.webp
[BrandingInit] Updated 4 logo elements
```
"4 logo elements" = 2 slots × (header + footer). Confirms **both slots** are rewritten.

**No 404s, no nulls, no empty strings** on the logo path. The image loads successfully (`naturalWidth = 1251`).

<!-- APPEND-MARKER -->

**Theme behaviour:** no theme-specific selectors except `.light-mode .footer-social a` (theme.css:2192). Footer logo is subject to the **same defect** as the header (§10).

**CSS class note:** `footerHTML()` emits `<footer class="footer">`, but `theme.css` lines 1877–1878 target `.site-footer`. Those padding rules **never match**. Cosmetic only.

<!-- APPEND-MARKER -->

| `/pages/business/events.html` | same | same | same | same | Yes | **Yes** |
| `/pages/business/conference.html` | same | same | same | same | Yes | **Yes** |
| `/pages/business/grooming-care.html` | same | same | same | same | Yes | **Yes** |
| `/pages/contact/contact.html` | same | same | same | same | Yes | **Yes** |
| `/pages/contact/gallery.html` | same | same | same | same | Yes | **Yes** |
| `/404.html` | **none** | **none** | none | none | **No** | **No** — bare stub |
| `/index_clean.html` | **none** | **none** | none | `data:,` | inline | **No** — unlinked artifact |

**Membership surfaces** are not standalone pages: a home-page section (`data-features="membership"` on `index.html`) plus modal views from `membership-view.js`. Booking surfaces are forms via `data-features="booking"` on service pages. Contact page exists and uses the shell.

**Flagged:**
- No duplicated headers. No duplicated footers. No page-specific shell markup.
- No inconsistent imports (all 10 use the identical script tag + placeholder pair).
- No differing favicon sources — no page declares a static favicon at all.
- `404.html` and `index_clean.html` lack the shell — **acceptable**; neither is a real content page (`index_clean.html` is unlinked).
- `assets/css/components/navbar.css` contains a **duplicate** set of `.logo-dark`/`.logo-light` rules (lines 37–41) but is **never loaded**. Dead code, not an active conflict.

<!-- APPEND-MARKER -->
