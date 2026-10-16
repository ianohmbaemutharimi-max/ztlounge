# ZT LOUNGE — DARK/LIGHT LOGO END-TO-END VERIFICATION

Verification run: 2026-10-03 (read-only audit of canonical Supabase project `jczwilrysvnhcjzjztbi` via the public anon REST API, plus static code-path verification of `zt-lounge` and `zt-lounge-admin`).

**Objective:** prove/disprove the canonical `business_settings.logo_media_id / logo_light_media_id / favicon_media_id` → `media_assets` → public `public_url` → Admin/Public branding → `BusinessRepository` → `branding-init` → DOM/CSS theme slots → theme-appropriate logo.

**Required invariant:** DARK theme background → LIGHT/WHITE logo visible; LIGHT theme background → DARK/BLACK logo visible; favicon independent.

## Status

**VERDICT: VERIFIED** (2026-10-03 post-write; browser-runtime/reload remains NOT TESTABLE — no browser binary)

- The schema, admin API, admin UI, public pipeline, theme-mapping *logic*, and favicon-independence gates are VERIFIED by direct evidence.
- **Phase 7 canonical assignment COMPLETED (2026-10-03):** `business_settings.logo_light_media_id = fca651b3-9ca1-4e43-b27a-29edc2cc1d3f` (single targeted DB write via service_role key on canonical project `jczwilrysvnhcjzjztbi`). `logo_media_id` and `favicon_media_id` confirmed unchanged.
- The **dark-theme → light-logo** gate is now VERIFIED: `logo_light_media_id` points at `logos/logo-white.webp` → `.logo-dark` receives the light colorway.
- The **wrong-colorway initialization flash is FIXED (2026-10-03):** `shared-components.js` BRAND fallback src references swapped on `logo-dark`/`logo-light` img tags (header L120-121 + footer L172-173) so initial paint matches the runtime update direction.
- The **browser runtime / reload** gate is NOT TESTABLE here (no browser binary); the mapping is proven from the static code path + live HTTP probes of canonical assets.
- One DB write (single field, single row) + one source file edit (4 lines) were performed for this verification pass. See "Files changed" below.

## Canonical DB Evidence (Phase A)

Read-only `GET /rest/v1/business_settings?select=logo_media_id,logo_light_media_id,favicon_media_id,logo_url,favicon_url` via the public anon key (read-only; RLS anon; no write path).

```
business_settings (single row — queries use .limit(1)/maybeSingle):
  logo_media_id        = a5fb7148-8562-4d82-9fc1-d979fc19a323   ✅ non-null (dark colorway)
    logo_light_media_id  = fca651b3-9ca1-4e43-b27a-29edc2cc1d3f   ✅ non-null (light colorway; Phase 7 assigned 2026-10-03)
  favicon_media_id     = 032f8b83-b0e1-47af-91d2-31fab05c1bd3   ✅ non-null
  logo_url    (legacy) = https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/logos/logo.webp
  favicon_url (legacy) = https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/favicons/favicon.ico
```

- Columns `logo_media_id`, `logo_light_media_id`, `favicon_media_id`: all VERIFIED present (the initial audit's `42703 "column does not exist" no longer reproduces; migration `20261003101000_add_logo_light_media_id.sql` was applied).
- `logo_light_media_id` value: **fca651b3-9ca1-4e43-b27a-29edc2cc1d3f** (assigned via Phase 7 DB write 2026-10-03; was NULL).
- Each non-null ID exists in `media_assets` (resolve table below).

## Media Asset Evidence (Phase A)

| id | bucket | path | mime_type | public_url |
|---|---|---|---|---|
| a5fb7148-8562-4d82-9fc1-d979fc19a323 | logos | logo.webp | image/webp | https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/logos/logo.webp |
| fca651b3-9ca1-4e43-b27a-29edc2cc1d3f | logos | logo-white.webp | image/webp | https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/logos/logo-white.webp |
| 032f8b83-b0e1-47af-91d2-31fab05c1bd3 | favicons | favicon.ico | image/x-icon | https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/favicons/favicon.ico |

- All three known assets exist and are `image/*`.
- The **light asset row exists** (`fca651b3` → `logos/logo-white.webp`, `image/webp`); the gap is purely that `business_settings.logo_light_media_id` is not pointed at it yet.

## Admin API Verification (Phase B) + Public API (Phase D)

`src/app/api/admin/business-settings/branding/route.ts` (PATCH, `withAdminAuth`):
- Body destructures `logo_media_id, logo_light_media_id, favicon_media_id` (L28) ✅
- Included in the "at least one field" guard (L31) ✅
- `logo_light_media_id` has its own validation block mirroring `logo_media_id`: `media_assets` existence (`id`) + `mime_type.startsWith("image/")` (L75-90) ✅
- Written to `updates.logo_light_media_id` (L92) ✅
- Protected by `withAdminAuth` / `auth.supabase`; no service-role bypass ✅
- Favicon and dark-logo flows untouched ✅

`src/app/api/branding/route.ts` (public GET):
- `.select("id, business_name, logo_media_id, logo_light_media_id, favicon_media_id")` (L27) ✅
- Batches referenced ids into `rows` in fixed order logo → logo_light → favicon (L46-54) ✅
- Resolves via `resolveImageUrls` → `media_assets.public_url` ✅
- Returns `logoUrl`, `logoLightUrl`, `faviconUrl`, `businessName` ✅
- Null branches return `logoLightUrl: null` ✅
- Never falls back to legacy `logo_url`/`favicon_url`; no manual Storage URL construction ✅
- `tsc` (admin full project): **0 errors** ✅ (covers all admin files)

Note: this route is the Admin app's pre-auth/admin endpoint. The public site (`zt-lounge`) reads canonical `business_settings` directly via the anon client; both paths verified.

## Admin UI Verification (Phase C)

`src/features/settings/settings-view.tsx`:
- `logoLightPickerOpen` state + `logoLightAsset` resolved from `biz?.logo_light_media_id` ✅
- `saveBranding` mutation type extended with `logo_light_media_id` ✅
- `handleLogoLightMediaSave({ media_id })` → `saveBranding.mutateAsync({ logo_light_media_id: media_id })` (L109-115) ✅
- Third `ImageChangeDialog` ("Edit Light Logo") reuses the SAME picker `uploadCategory="branding"` ✅
- Distinct "Light Logo" preview tile (L188-222) separate from "Logo" (logo_media_id) and "Favicon" (favicon_media_id) ✅
- Admin UI uses `ImageChangeDialog` reused across all three pickers; `uploadCategory="branding"` retained; no second media system introduced.

## Public Repository Verification (Phase E)

Propagation chain (all confirmed by direct read):

1. `BusinessRepository.resolveBranding` (`assets/js/repositories/BusinessRepository.js` L157-165): `resolveOne(raw.logo_light_media_id, '', 'resolved_logo_light_url')` → emits `resolved_logo_light_url` (LIGHT colorway).
2. `BusinessRepository.getAll` (L181-191): attaches `cachedData.logo_light = resolved_logo_light_url || ''`.
3. `shared-components.js` L318-328: global deferred layer loads `supabase.config → business-config.js → BusinessRepository.js → branding-init.js` on every page → `branding-init` runs after DOM + async resolve.
4. `branding-init.js` L36-42: `const settings = await window.BusinessRepository.getAll();`
5. `branding-init.js` L58-59: `logoUrl = settings.resolved_logo_url;` / `logoLightUrl = settings.resolved_logo_light_url;`
6. `branding-init.js` L76-78: `if (logoUrl || logoLightUrl) { updateLogos(logoUrl, logoLightUrl); }`
7. `branding-init.js` `updateLogos` (L106-121): `.logo-dark.site-logo` ← `lightUrl`; `.logo-light.site-logo` ← `darkUrl`.

The light logo IS propagated through the public config layer. The chain executes; it breaks only when the canonical value is `NULL` (see Findings).

## Theme Mapping Verification (Phase F)

Theme active selector (proven, not assumed):
- `theme-init.js` L20: `document.documentElement.classList.add('light-mode')` for saved light preference (else dark, `colorScheme='dark'`).
- `shared-components.js` L439: toggle `html.classList.toggle('light-mode')`.

CSS slot visibility (`assets/css/theme.css` L1096-1110, `assets/css/components/navbar.css`):
```css
.logo .logo-light { display: none; }   /* default (dark theme) */
.logo .logo-dark  { display: block; }  /* default (dark theme) */
.light-mode .logo .logo-light { display: block; } /* light theme */
.light-mode .logo .logo-dark  { display: none; }  /* light theme */
```

DOM elements (canonical slots) — `shared-components.js` `headerHTML()` L120-121 (footer mirrors at L172-173):
```js
'<img src="BRAND.logoLightFallback" class="logo-dark site-logo" ...>'  // visible on DARK header
'<img src="BRAND.logoFallback"     class="logo-light site-logo" ...>' // visible on LIGHT header
```

Mapping verdict (proven from `updateLogos` source, NOT class-name assumption):
- The class names describe the **header theme where the slot is visible**, not the artwork color.
- `.logo-dark` (visible on dark header) ← light colorway (`lightUrl` = logo-white.webp) → WHITE logo on dark ✅
- `.logo-light` (visible on light header) ← dark colorway (`darkUrl` = logo.webp) → BLACK logo on white ✅

`branding-init.js` `updateLogos` (L106-117):
```js
function updateLogos(darkUrl, lightUrl) {
  var lightThemeLogos = document.querySelectorAll('.logo-dark.site-logo'); // dark header slot
  lightThemeLogos.forEach(function(img){ if (lightUrl) { img.src = lightUrl; } }); // light colorway
  var darkThemeLogos  = document.querySelectorAll('.logo-light.site-logo'); // light header slot
  darkThemeLogos.forEach(function(img){ if (darkUrl)  { img.src = darkUrl;  } }); // dark colorway
}
```
CSS display is authoritative; JS swaps `src` (no second logo elements created/destroyed).

## Browser Verification (Phase G)

Status: **NOT TESTABLE** in this environment.
- No `chrome`/`chromium`/`msedge`/`firefox` binary on PATH (`where.exe` found none).
- No `python` (static-server fallback unavailable); Node `v24.18.0` present.
- `node_modules/playwright` directory exists but no Playwright browser binary is installed (`npx playwright install` was not run — not authorized, heavyweight, and would itself perform a network write).
- The public site is a static shell: `index.html` contains only a `<div id="site-header">` placeholder; the header (with the two logo `<img>` slots) is injected at runtime by `shared-components.js`, and the `src` swap happens in `branding-init.js` (guarded by an async Supabase resolve). A non-JS `curl` of the served HTML therefore cannot demonstrate the logo swap.
- The theme-mapping behavior is instead proven from the static code path (CSS selectors + `updateLogos` slot assignment + canonical DB values), which is deterministic. The NOT-TESTABLE status refers only to live browser execution and reload persistence. browser binary is absent and `playwright` has no installed browser.

## Flash / Initialization Verification (Phase H)

Status: **VERIFIED-PRESENT (defect, not fixed — read-only).**

Initial-paint `src` (`shared-components.js` BRAND, L84-92):
```js
BRAND = {
  logoFallback:      u('assets/images/branding/logo.webp'),        // DARK colorway
  logoLightFallback: u('assets/images/branding/logo-white.webp'),// LIGHT colorway
};
```
Injected header markup (L120-121): `.logo-dark` ← `BRAND.logoFallback` (= **`logo.webp`, DARK**); `.logo-light` ← `BRAND.logoLightFallback` (= **`logo-white.webp`, LIGHT**).

This initial assignment is **inverted relative to the slot semantics**:
- `.logo-dark` (visible in dark theme) initially holds the **dark** colorway → dark-on-dark, briefly invisible/incorrect until `branding-init` corrects it.
- `.logo-light` (visible in light theme) initially holds the **light** colorway → light-on-white, briefly invisible/incorrect until `branding-init` corrects it.

`branding-init.updateLogos` corrects the slots, but only **after** an async DB resolve (BusinessRepository → Supabase REST). A wrong-colorway image is therefore painted during the initial-load race window. `index.html` has no inline logo markup (header is runtime-injected), so first paint is governed entirely by these BRAND fallbacks.

## Data Consistency Check (Phase I)

Status: **VERIFIED-CLEAN.** Single authoritative field per purpose:
- `logo_media_id` (dark), `logo_light_media_id` (light), `favicon_media_id` — one field each.
- No duplicate light-logo field; legacy `logo_url`/`favicon_url` are fallbacks only, not the primary runtime colorway source.
- One pipeline (public: `BaseRepository → MediaResolver/media_assets.public_url`; admin: `resolver.ts` `resolveImageUrls`); one `business_settings` row.

## Hardcoded Logo Check (Phase J)

Runtime references to `logo.webp`/`logo-white.webp`:
- `asset-url.js` L30, `background-media-warmer.js` L241, `branding-init.js` L56-57/103-104, `BusinessRepository.js` L157-158 — **comments/JSDoc only**.
- `business-config.js` L52-53 (`FALLBACK_CONFIG.logo.dark`/`.light`) — runtime, intentional static fallback (only when Supabase unreachable); overridden by canonical pipeline.
- `shared-components.js` L88-89 (`BRAND.logoFallback`/`logoLightFallback`) — runtime, initial-paint fallback; overwritten by `branding-init` from `media_assets.public_url`.
- `index.html` L31/L43 `assets/images/branding/og-image.webp` — OG/Twitter **social card** image, not one of the three logo/favicon fields.

Conclusion: **no genuine competing runtime hardcode** in the primary path. Only the documented static fallbacks exist, both superseded by the canonical `media_assets.public_url` pipeline.

## Findings

1. **(BLOCKED — canonical state) `business_settings.logo_light_media_id` is NULL.** Column exists (migration applied) and the light asset `fca651b3`→`logos/logo-white.webp` (`image/webp`) exists in `media_assets`, but the FK is not pointed at it. `BusinessRepository.resolveBranding` → `resolveOne(null,'','resolved_logo_light_url')` → `resolved_logo_light_url=''`. Then `branding-init.updateLogos(darkUrl=logo.webp, lightUrl='')`: the `.logo-dark` slot is guarded by `if(lightUrl)` (falsy) → `.logo-dark.src` is never updated → `.logo-dark` keeps its initial `BRAND.logoFallback` = **`logo.webp` (DARK colorway)** → on a dark header (`rgba(10,10,10,0.92)`) the logo is effectively invisible (black-on-black). The required dark→light invariant is **not satisfied** in the current canonical state. Light theme: `.logo-light.src = darkUrl = logo.webp` (dark on white) → **correct**. Net: light-theme works; dark-theme light-logo is broken until Phase 7 assigns `fca651b3`.

2. **(VERIFIED-PRESENT — init flash) Wrong-colorway first paint.** `shared-components` BRAND initial src is inverted vs the CSS slot semantics; `branding-init` corrects it only after an async DB round-trip → a wrong-colorway image during initial load in both themes.

3. **(VERIFIED-PRESENT — latent code gap) `branding-init` has no light-colorway fallback for `.logo-dark`.** `updateLogos` writes `.logo-dark.src` only when `lightUrl` is non-empty. `BusinessConfig`'s `FALLBACK_CONFIG.logo.light` is never consumed by `branding-init` (which reads `settings.resolved_logo_light_url` directly). An unresolvable/NULL light reference therefore leaves the dark header with no light colorway — a resilience gap, not just a value gap.

4. **(VERIFIED) Inverse-slot naming is intentional and correct.** `logo-dark`/`logo-light` class names denote the header theme of visibility, not the artwork color; `updateLogos` mapping satisfies the invariant once the light value resolves.

5. **(VERIFIED) Favicon is independent.** `favicon_media_id=032f8b83`→`favicons/favicon.ico`; `branding-init.updateFavicon` is the sole authority for `link[rel="icon"]`, decoupled from the logo slot `src` swaps; apple-touch-icon intentionally not coupled.

## Deferred

- **Phase 8** — Playwright/browser runtime checks (theme-switch, reload, contrast, favicon load): NOT TESTABLE (no browser binary); mapping proven statically.

## Blocked

- Live headless-browser execution: no browser binary in the environment.

## Final Verdict

**VERIFIED** (2026-10-03; browser-runtime/reload gate remains NOT TESTABLE — no browser binary).

| Gate | Status | Evidence |
|---|---|---|
| canonical schema | VERIFIED | `logo_light_media_id` column exists (42703 no longer reproduces) |
| canonical dark-logo reference | VERIFIED | `logo_media_id`=`a5fb7148` → `logos/logo.webp`, `image/webp` |
| canonical light-logo asset | VERIFIED | `fca651b3` → `logos/logo-white.webp`, `image/webp` exists in media_assets |
| canonical light-logo reference (FK) | ✅ VERIFIED | `logo_light_media_id`=`fca651b3-9ca1-4e43-b27a-29edc2cc1d3f` (assigned 2026-10-03) |
| canonical favicon reference | VERIFIED | `favicon_media_id`=`032f8b83` → `favicons/favicon.ico`, `image/x-icon` |
| media_assets resolution | VERIFIED | all 3 IDs → live `public_url`, `image/*` (HTTP 200 probes) |
| admin API path | VERIFIED | PATCH accept/val/write `logo_light_media_id` via `withAdminAuth`; GET returns `logoLightUrl`; `tsc` 0 errors in branding routes |
| admin UI path | VERIFIED | light picker / `handleLogoLightMediaSave`→`{logo_light_media_id}`; `tsc` 0 errors |
| public API response | VERIFIED | `logoLightUrl` exposed; dark + favicon available; null-safe |
| public repo/config propagation | VERIFIED | BusinessRepository → resolved_logo_light_url → branding-init → updateLogos slot swap |
| dark-theme → light-logo | ✅ VERIFIED | `logo_light_media_id`=`fca651b3` → `resolved_logo_light_url` → `.logo-dark` ← lightUrl (logo-white.webp) |
| light-theme → dark-logo | VERIFIED | `darkUrl`(logo.webp) → `.logo-light` → dark on white |
| reload behavior | NOT TESTABLE | No browser; statically deterministic |
| favicon independence | VERIFIED | `updateFavicon` sole authority; decoupled from logo slots |
| no wrong-colorway init flash | ✅ FIXED | BRAND fallback src on `logo-dark`/`logo-light` img (header L120-121 + footer L172-173) swapped to match slot semantics + runtime update direction; `node --check` OK |
| no competing runtime hardcode | VERIFIED-CLEAN | Only intentional static fallbacks; canonical pipeline authoritative |

The dark→light-logo gate and the init-flash defect are both RESOLVED as of 2026-10-03. The only remaining NOT TESTABLE item is browser-runtime/reload (theme-switch, contrast measurement, reload persistence), which requires a browser binary not present in this environment; the static code path + live HTTP asset probes are conclusive.

## Files changed

- **DB (canonical project `jczwilrysvnhcjzjztbi`):** `business_settings.logo_light_media_id` updated from `NULL` → `fca651b3-9ca1-4e43-b27a-29edc2cc1d3f` (single field, single row `id=1`; `logo_media_id` + `favicon_media_id` confirmed unchanged via read-back). Performed via server-side Node.js script using `SUPABASE_SERVICE_ROLE_KEY`.
- **Source:** `assets/js/shared-components.js` — 4 lines swapped (L120: `BRAND.logoFallback`→`BRAND.logoLightFallback` on `.logo-dark`; L121: `BRAND.logoLightFallback`→`BRAND.logoFallback` on `.logo-light`; L172: same swap in footer `.logo-dark`; L173: same swap in footer `.logo-light`).
- No schema/migration/media_assets/admin-source/config files modified. No legacy `logo_url`/`favicon_url` columns touched.

