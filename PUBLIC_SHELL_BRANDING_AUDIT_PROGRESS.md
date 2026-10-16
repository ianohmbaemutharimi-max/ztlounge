# PUBLIC SHELL & BRANDING AUDIT — PROGRESS LOG

**Task type:** READ-ONLY AUDIT (no source, DB, storage, or config modifications)
**Started:** 2026-10-03
**Audit window:** 2026-10-03 09:00 → 09:26 (+03:00)

---

## Entry 1 — Baseline & Route Inventory

**Timestamp:** 2026-10-03 09:02 (+03:00)
**Repository (public):** `D:\zt lounge\zt-lounge-demo\zt-lounge`
**Branch / HEAD:** `feature/membership-tiers-staging-phase1` @ `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c`

**Repository (admin):** `D:\zt lounge\zt-lounge-demo\zt-lounge-admin`
**Branch / HEAD:** `clean-rebuild` @ `876b1851fbcd016cf290734498dda66b764afa12`

> NOTE: a **nested copy** of the admin app also exists at
> `zt-lounge/zt-lounge-admin/`. This audit used the canonical sibling path
> `D:\zt lounge\zt-lounge-demo\zt-lounge-admin`.

**Files inspected so far:**
- `index.html`, `404.html`, `index_clean.html`
- `pages/business/{conference,events,grooming-care}.html`
- `pages/contact/{contact,gallery}.html`
- `pages/experiences/{lounge,restaurant,restaurant-menu,vip}.html`
- `assets/js/shared-components.js`
## Entry 2 — Shared Header / Footer / Favicon Trace

**Timestamp:** 2026-10-03 09:08 (+03:00)
**Files inspected:** `assets/js/shared-components.js` (full, 705 lines), `assets/js/theme-init.js`, `assets/css/theme.css` (relevant blocks)

**DB verification status:** AVAILABLE
**Runtime verification status:** PENDING
**Blockers:** none

**Findings:**
- Canonical shell = `assets/js/shared-components.js` v2.0.0 (`window.__ZT_PUBLIC_SHELL__`, idempotent guard line 66).
- Header markup built by `headerHTML()` (line 114), footer by `footerHTML()` (line 165), CTA by `ctaHTML()` (line 249).
- Header injected **synchronously during body parsing** (`injectShellMarkup()`, lines 415/695). Footer/CTA injected at `DOMContentLoaded` (`initSharedBehaviour()`, line 674).
- Two logo slots per shell instance (header AND footer):
  - `img.logo-dark.site-logo` → `BRAND.logoFallback` = `assets/images/branding/logo.webp`
  - `img.logo-light.site-logo` → `BRAND.logoLightFallback` = `assets/images/branding/logo-white.webp`
- Theme toggle rendered in `headerHTML()` line 153 (`#themeToggle`).
- Favicon applied by `applyFavicon()` (line 286) → `ensureFavicon('icon', BRAND.logoFallback)` and `ensureFavicon('apple-touch-icon', BRAND.appleTouchFallback)`. Pages declare **no** static `<link rel="icon">` in HTML.
- Theme CSS in `theme.css`:
  - `.logo .logo-dark { display:block }` / `.logo .logo-light { display:none }` (1096–1102)
  - `.light-mode .logo .logo-light { display:block }` / `.light-mode .logo .logo-dark { display:none }` (1104–1110)
- `initThemeToggle()` (line 431) toggles `.light-mode` on `<html>`, persists `localStorage['zt-theme']`, sets `colorScheme`.
- `theme-init.js` re-applies `.light-mode` pre-paint from `localStorage['zt-theme']`.
- **No** logo-variant field exists anywhere in the public branding path.
- Legacy duplicate theme implementations exist but are **NOT loaded** by any public page: `assets/js/theme.js`, `assets/js/core/app.js`, `assets/js/navigation.js`. Verified by grep — zero `<script>` references.

**Next step:** Trace Admin → DB → media_assets → public_url chain.
## Entry 3 — Logo Data Authority Chain (Admin → DOM)

**Timestamp:** 2026-10-03 09:14 (+03:00)
**Files inspected:**
- Admin: `src/features/settings/settings-view.tsx`
- Admin: `src/app/api/admin/business-settings/branding/route.ts`
- Admin: `src/app/api/branding/route.ts`
- Admin: `src/lib/contract/mapping.ts`, `src/lib/repository.ts`, `src/db/schema.ts`
- Public: `assets/js/repositories/BusinessRepository.js`, `assets/js/branding-init.js`

**DB verification status:** VERIFIED (live read-only query)
**Runtime verification status:** PENDING
**Blockers:** none

**Live DB read (`business_settings`, project `jczwilrysvnhcjzjztbi`):**
```
id                   = 1
business_name        = ZT Lounge Meru
logo_media_id        = a5fb7148-8562-4d82-9fc1-d979fc19a323
favicon_media_id     = a5fb7148-8562-4d82-9fc1-d979fc19a323   <-- SAME id as logo
logo_url (legacy)    = .../storage/v1/object/public/logos/logo.webp
favicon_url (legacy) = /favicon.ico                              <-- broken legacy value
```

**Live DB read (`media_assets` for that id):**
```
id         = a5fb7148-8562-4d82-9fc1-d979fc19a323
bucket     = logos
path       = logo.webp
public_url = https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/logos/logo.webp
mime_type  = image/webp
width x h  = 1920 x 1080    <-- metadata; actual file is 1251x1251
title      = ZT Lounge Logo
```

**Chain established (canonical, as designed):**
```
Admin SettingsView (settings-view.tsx)
  → ImageChangeDialog (media picker, uploadCategory="branding")
  → PATCH /api/admin/business-settings/branding  (withAdminAuth, validates image mime)
  → business_settings.logo_media_id / favicon_media_id
  → media_assets.id → media_assets.public_url
  → BusinessRepository.resolveBranding()          (public)
  → resolved_logo_url / resolved_favicon_url
  → branding-init.js updateLogos() / updateFavicon()
  → <img class="logo-dark|logo-light site-logo">, <link rel="icon">
```
This matches the expected architecture. No bypass found.

**Findings:**
## Entry 4 — Asset Analysis (logo byte-level)

**Timestamp:** 2026-10-03 09:18 (+03:00)
**Files inspected:** `assets/images/branding/{logo,logo-white,apple-touch-icon}.webp`, live Storage object `logos/logo.webp`

**DB verification status:** VERIFIED
**Runtime verification status:** PENDING
**Blockers:** none

**SHA-256 comparison:**
| Asset | Bytes | SHA-256 |
|---|---|---|
| `assets/images/branding/logo.webp` | 16114 | `A42EABF4…39D9A` |
| `assets/images/branding/apple-touch-icon.webp` | 16114 | `A42EABF4…39D9A` (identical to logo) |
| Storage `logos/logo.webp` (canonical) | 16114 | `A42EABF4…39D9A` (identical to local) |
| `assets/images/branding/logo-white.webp` | 14496 | `2FBF2829…C910BD` (different) |

**Pixel analysis (PIL):**
| File | Size | Transparent % | Mean luminance |
|---|---|---|---|
| `logo.webp` (= DB canonical) | 1251×1251 | **0.0%** | **11.9** (near-black) |
| `logo-white.webp` | 1251×1251 | 0.0% | **247.0** (near-white) |

**Visual confirmation (rendered):**
- `logo.webp` = logo artwork on a **solid BLACK** background (gold mark + white "Lounge" wordmark).
- `logo-white.webp` = same artwork on a **solid WHITE** background (gold mark + black "Lounge" wordmark).

## Entry 5 — Runtime Verification

**Timestamp:** 2026-10-03 09:24 (+03:00)
**Blockers encountered:** 2 (both resolved)

**Blocker 1 (RESOLVED):** `start_pub_server.cjs` references `_public_server.js`, which does not exist → `MODULE_NOT_FOUND`. Worked around with a read-only static server on port 8123 (`_audit_tmp/server.js`).

**Blocker 2 (RESOLVED):** Port 8000 was already occupied by a pre-existing unstable server (PID 21008); early runs produced 174 spurious `ERR_CONNECTION_REFUSED` failures. Re-ran against dedicated port 8123 → only 6 failures remained, all `ERR_ABORTED` on lazy gallery images (unrelated to branding).

**Files inspected (runtime):** all 10 public pages via Playwright/Chromium, 1440×900.

**Runtime verification status:** VERIFIED on all 10 routes × 4 phases (40 page-states). DOM attributes, computed styles, `naturalWidth/Height`, `localStorage`, header background, and screenshots captured.

**Findings — the defect reproduces deterministically:**

Fresh dark load, all 10 routes:
```
html.class             = (none)
#themeToggle           = present
header background      = rgba(10,10,10,0.92)
img.logo-dark  display=block   naturalWidth=1251   src=.../logos/logo.webp
img.logo-light display=none    naturalWidth=1251   src=.../logos/logo.webp
```
Toggle to light, all 10 routes:
```
html.class             = light-mode
localStorage zt-theme  = light
header background      = rgba(255,255,255,0.95)
img.logo-dark  display=none
img.logo-light display=block    src=.../logos/logo.webp   <-- BLACK-BACKGROUND ASSET ON WHITE
```
Reload in light / toggle back to dark: identical behaviour, no state divergence.

**Key observation:** after `branding-init.js` runs, `.logo-dark` and `.logo-light` have the **identical `src`**. The theme-variant mechanism is fully collapsed at runtime.

**Screenshot evidence** (`_audit_tmp/shot_home_dark.png` vs `shot_home_lightreload.png`):
- Dark: black header, black logo square blends seamlessly → looks correct.
- Light: white header with an **opaque black square** where the logo should be → logo reads as "missing/broken".

**Footer** identical across all 10 routes: `footer.footer` present, `#site-footer` populated (4870–4966 chars), both footer logo slots = same canonical DB URL.

**Next step:** Write deliverables.

---

## Entry 6 — Deliverables Written

**Timestamp:** 2026-10-03 09:26 (+03:00)
**Blockers:** none

Created:
- `PUBLIC_SHELL_BRANDING_AUDIT_PROGRESS.md` (this file)
- `PUBLIC_HEADER_FOOTER_BRANDING_AUDIT.md` (final report)

**Final status:** Audit complete. Root cause of the light-mode logo failure is **proven**, not inferred. No fixes applied.

**Findings:**
- The canonical DB logo is a **fully opaque, black-background image** — it is a *dark-theme* asset.
- Neither logo asset has transparency; both are baked-on-background squares.
- `media_assets.width/height` (1920×1080) **disagree** with the actual file (1251×1251) — metadata drift, cosmetic only.

**Next step:** Runtime verification in dark and light themes.

<!-- APPEND-MARKER -->

- Admin exposes **exactly ONE logo** and **ONE favicon**. There is **no dark/light variant field, no variant picker, and no theme/appearance settings screen**.
- Admin `mapping.ts` maps `logoMediaId`/`faviconMediaId`; `repository.ts` read-column allowlist includes them. `src/db/schema.ts` (Drizzle) declares only `logoUrl`/`faviconUrl` — the `*_media_id` columns are absent from the typed schema (type-level gap only; the runtime read path in `settings-view.tsx` uses `biz?.logo_media_id` successfully).
- `business-config.js` lines 118–121 hard-collapse the variant concept:
  `dark: settings.resolved_logo_url || FALLBACK`, `light: settings.resolved_logo_url || FALLBACK` — **both keys resolve to the same URL**.
- `branding-init.js` `updateLogos()` (lines 88–102) sets `.logo-dark` **and** `.logo-light` to the **same** `resolved_logo_url`.

**Next step:** Asset analysis + runtime verification of the dark/light failure.

<!-- APPEND-MARKER -->


<!-- APPEND-MARKER -->

- `assets/js/branding-init.js`
- `assets/js/business-config.js`
- `assets/js/theme-init.js`
- `assets/js/repositories/BusinessRepository.js`
- `assets/js/repositories/MediaResolver.js`
- `assets/js/config/supabase.config.js`
- `assets/css/theme.css`, `assets/css/components/navbar.css`
- `assets/images/branding/*`
- `.env.local`

**DB verification status:** AVAILABLE (anon REST read against canonical project `jczwilrysvnhcjzjztbi`)
**Runtime verification status:** PENDING
**Blockers:** none

**Findings:**
- 10 canonical public pages exist. **All 10** reference `shared-components.js`, contain exactly one `#site-header` and one `#site-footer` placeholder, and load `theme-init.js` in `<head>`.
- `404.html` and `index_clean.html` do NOT use the shell. `404.html` is a bare 13-line stub; `index_clean.html` is an unlinked artifact.
- `assets/css/components/navbar.css` is **never linked** by any page (only `theme.css` is linked). It is dead CSS.

**Next step:** Trace canonical header implementation and logo rendering.

## Entry 7 — Branding Fix Plan (read-only)

**Timestamp:** 2026-10-03 (planning phase)
**Task type:** READ-ONLY IMPLEMENTATION PLAN (no source, DB, storage, or config changes)

**Files re-inspected for the plan:** `assets/js/branding-init.js` (updateLogos L88-99 forces one URL into both `.logo-dark`/`.logo-light`; updateFavicon L108-120 writes both `rel=icon` + `apple-touch-icon`; updateOGImage/updateJSONLD fan logoUrl into og:image/twitter:image/JSON-LD), `assets/js/business-config.js` (L118-120 collapses logo.dark/light; L153-157 is a **second** `link[rel=icon"]` writer), `assets/js/shared-components.js` (applyFavicon/ensureFavicon creator; two-slot fallback already present), `assets/js/repositories/BusinessRepository.js` (resolveOne L156-157 resolves logo_media_id + favicon_media_id independently), `assets/js/repositories/MediaResolver.js`, `assets/js/background-media-warmer.js` (L238-242 warms logo + favicon), Admin `src/app/api/admin/business-settings/branding/route.ts` (PATCH accepts `logo_media_id`/`favicon_media_id` independently; validates `mime_type.startsWith("image/")`), Admin `src/app/api/branding/route.ts` (public GET resolves both), Admin `src/lib/images/processor.ts` (ACCEPTED_MIME_TYPES = jpeg/png/webp only; Sharp format check jpeg/png/webp only), Admin `src/app/api/admin/upload/route.ts` (forces `contentType:"image/webp"`; path `assets/images/{category}/{uuid}.webp`), Admin `src/lib/storage/paths.ts` (`PUBLIC_ASSETS_BUCKET="public-assets"`; categories include `branding`, none `favicon`), Admin `src/db/schema.ts` (`mediaAssets.mime_type` free text; `businessSettings.logo_media_id`/`favicon_media_id` are independent uuid FKs → mediaAssets.id ON DELETE SET NULL), Admin `src/features/settings/settings-view.tsx` (two independent pickers: "Edit Logo", "Edit Favicon"), Admin `src/lib/contract/mapping.ts` + `repository.ts` (allowlists include both media ids), Admin `src/lib/media/resolver.ts` (canonical-only `resolveImageUrls`).

**Files modified:** none (read-only).

**Decision gates answered:**
- G1 ✅ `favicon_media_id` already independent without schema change (FK column `schema.ts:82`; coupling is data aliasing).
- G2 ⚠️ Admin picker/API **cannot upload `.ico`** — `processor.ts` rejects `image/x-icon`, Sharp allowlist excludes it, upload route forces `.webp`. It *can select* an existing row whose `mime_type` is `image/x-icon` (PATCH accepts `image/*`), but no such row can be **created** via canonical upload.
- G3 ✅ `.ico` can be stored in `media_assets` (free-text `mime_type`), but the upload pipeline prevents it; recommend PNG/WebP favicon.
- G4 ⚠️ A single transparent logo renders both themes (slots exist), but no suitable transparent-on-both-themes asset exists (`logo-white.webp` invisible on dark); replacing also fans into og:image/JSON-LD/apple-touch (R1).
- G5 ✅ Replacing the logo affects og:image, twitter:image, JSON-LD `image`/`logo`, background-warmer, and (while coupled) apple-touch-icon.
- G6 ⚠️ `logo_light_media_id` unnecessary **if** one transparent brand mark is acceptable (Option A); **necessary** if two distinct logos required (Option C).
- G7 ✅ OG/Twitter image and JSON-LD image are coupled to the logo (by `branding-init` + `content-loader`); apple-touch-icon is favicon-coupled.
- G8 ✅ Yes — `branding-init.updateFavicon` and `business-config.initBusinessConfig` both write `link[rel="icon"]` (R7); reconcile to one writer.
- G9 ✅ Smallest durable: (1) favicon — dedicate a media asset to `favicon_media_id` + drop duplicate writer (no schema code change); (2) logo — Option A or C per approval.
- G10 ⚠️ Requires approval: schema migration (Option C); replacing canonical logo asset (Option A); upload-pipeline source changes for `.ico`; runtime writer reconciliation.

**Critical Stop Condition reached:**
- Logo dark/light fix has **no zero-change path**: Option A requires replacing a stored media asset; Option C requires a schema migration. **DECISION REQUIRED.**
- True `.ico` support requires source changes to the upload pipeline (`processor.ts` + `upload/route.ts`). **DECISION REQUIRED.**
- This task produced only `BRANDING_FIX_PLAN.md` (and this log entry). No source/DB/storage/media changes were made.

**Recommendation summary:** Decouple the favicon first (data-only, no schema change: assign a dedicated media asset to `favicon_media_id` and make `branding-init.js` the sole `link[rel=icon"]` writer). Then, for the logo, choose Option C (theme-specific columns — full Admin/DB authority, additive migration) if the brand needs two distinct logos, or Option A (one transparent logo) only if a brand mark legible on both `#0a0a0a` and `#f5f5f5` is acceptable and the OG/JSON-LD fan-out is approved.

**Plan artifact:** `BRANDING_FIX_PLAN.md`.

<!-- APPEND-MARKER -->

## Entry 8 — Branding Fix Implementation Map (read-only verification)

**Timestamp:** 2026-10-03 (fresh mapping task)
**Task type:** READ-ONLY IMPLEMENTATION MAPPING ONLY (no source, DB, storage, schema, migration, media, .env, or config changes)

**Files re-inspected (canonical, at baseline `905bd7a`/`876b185`):**
- Public: `index.html`; `assets/js/branding-init.js`, `business-config.js`, `shared-components.js`, `repositories/BusinessRepository.js`, `repositories/MediaResolver.js`, `background-media-warmer.js`, `content-loader.js`; `assets/css/theme.css`.
- Admin: `src/db/schema.ts`, `src/lib/images/processor.ts`, `src/app/api/admin/upload/route.ts`, `src/lib/storage/paths.ts`, `src/app/api/admin/business-settings/branding/route.ts`, `src/app/api/branding/route.ts`, `src/lib/media/resolver.ts` (+ `src/lib/contract/mapping.ts`, `src/lib/repository.ts`, `src/features/settings/settings-view.tsx`, `src/features/media/image-change-dialog.tsx`), `src/app/api/media/route.ts`.

**DB verification status:** VERIFIED — read-only anon REST query of canonical project `jczwilrysvnhcjzjztbi`. `business_settings`: `logo_media_id`=`a5fb7148-8562-4d82-9fc1-d979fc19a323`, `favicon_media_id`=`a5fb7148-8562-4d82-9fc1-d979fc19a323` (aliased), `logo_url=…/logos/logo.webp`, `favicon_url=/favicon.ico`. `media_assets` for that id: `bucket=logos`, `path=logo.webp`, `mime_type=image/webp`, 1920×1080. **Zero `image/x-icon` rows** in `media_assets`.

**Runtime verification status:** PENDING for live browser favicon (NOT TESTABLE from this sandbox — `https://ztlounge.co.ke/favicon.ico` returned HTTP 000; apex-domain egress unavailable). Supabase Storage egress confirmed reachable (canonical `logo.webp` → HTTP 200 / `image/webp`).

**.ico pipeline findings:**
- `processor.ts:20-24` `ACCEPTED_MIME_TYPES = jpeg/png/webp` ⟵ rejects `image/x-icon`.
- `processor.ts:132` Sharp format allowlist `["jpeg","png","webp"]` ⟵ rejects ico.
- `paths.ts:79` `generateStoragePath` always emits `.webp`; `route.ts:240,274` `contentType:"image/webp"`; `route.ts:206` `declaredMimeType = file.type`; `route.ts:310` `mime_type: declaredMimeType`.
- `/api/media` selects `media_assets.*` with **no MIME filter** (`media/route.ts:199,200`) ⟹ picker can select an ico row if one existed.
- `image-change-dialog.tsx:355` `accept="image/*"` (text says "PNG, JPG, WebP").
- `branding/route.ts:57,84` PATCH accepts any `image/*` ⟹ would accept `image/x-icon` for favicon.
- Storage serves object Content-Type metadata; `public-assets` bucket public ⟹ no storage-policy change needed; only object `contentType` must be `image/x-icon` (currently hardcoded `image/webp`).

**Favicon writer findings (3 confirmed):** (1) `shared-components.js` `applyFavicon()` boot-seeds `link[rel=icon"]=logo.webp` + `apple-touch-icon.webp`, both `type=image/webp`; (2) `business-config.js` DCL overwrites `link[rel=icon"]` href only (duplicate); (3) `branding-init.js` DCL (last/authoritative) overwrites `link[rel=icon"]` + `link[rel=apple-touch-icon"]` to the SAME `resolved_favicon_url` ⟹ couples apple-touch to favicon; sets no `type`.

**Logo findings:** One-logo assumption enforced in `BusinessRepository.resolveBranding` (single `resolved_logo_url`), `branding-init.updateLogos` (writes same URL into `.logo-dark`+`.logo-light`, L90-99), `business-config.js` (L119-120). CSS slot toggle exists at `theme.css:1096-1108` (`.light-mode .logo-dark{display:none}` / `.logo .logo-light{display:none}`) on header bg `--color-bg`=`#0a0a0a` (L21) / `#f5f5f5` (L201). Current assets opaque: `logo.webp` (black), `logo-white.webp` (white), `apple-touch-icon.webp`, `og-image.webp`; no transparent-on-both asset exists.

**Decision gates (F1–F11): F1 VERIFIED · F2 BLOCKED · F3 VERIFIED · F4 VERIFIED(cond) · F5 VERIFIED · F6 VERIFIED · F7 VERIFIED/REQUIRES-APPROVAL · F8 VERIFIED · F9 VERIFIED · F10 VERIFIED · F11 REQUIRES-APPROVAL.**

**Files that would require modification (if approved):**
- Favicon `.ico`: `src/lib/images/processor.ts`, `src/app/api/admin/upload/route.ts`, `src/lib/storage/paths.ts`, `src/features/media/image-change-dialog.tsx` (cosmetic), `assets/js/branding-init.js`, `assets/js/business-config.js`, `assets/js/shared-components.js` + upload a dedicated `.ico` asset + assign `favicon_media_id`.
- Logo Option A: new transparent asset + assign `logo_media_id` (no code). Option B: `src/db/schema.ts` (+migration), `src/app/api/admin/business-settings/branding/route.ts`, `src/lib/repository.ts`, `src/app/api/branding/route.ts`, `src/lib/media/resolver.ts`, `assets/js/repositories/BusinessRepository.js`, `assets/js/business-config.js`, `assets/js/branding-init.js`, `src/features/settings/settings-view.tsx`, `src/lib/contract/mapping.ts` (if mapped).

**Explicit statement:** No implementation was performed. No source/DB/schema/migration/storage/media/.env/config changes were made. The only artifacts produced are this progress entry and `BRANDING_FIX_IMPLEMENTATION_MAP.md`.

**Next approval gate:** Owner must (1) approve a logo path — **Option A** (one transparent canonical logo) vs **Option B** (two DB-controlled theme logos + `logo_light_media_id` migration); and (2) confirm the `.ico` requirement is green-lit (which authorizes the `processor.ts` + `upload/route.ts` + `paths.ts` source changes and uploading a real `.ico` favicon asset).

<!-- APPEND-MARKER -->

## Entry 9 - Decision audit appended (this audit session)

**Timestamp:** 2026-10-03
**Scope:** Focused Dark/Light logo decision audit (Option A vs B). **No implementation.**
**Deliverable:** `PUBLIC_LOGO_DARK_LIGHT_DECISION_AUDIT.md` (Sec 1-15: baseline, DB read-only, sharp asset scan, public+admin authority chain, Playwright runtime, root cause, Option A/B comparison, recommendation, approval gate).
**Re-verification:** DB read confirmed `logo_light_media_id` ABSENT; `logo_media_id=a5fb7148`->`logos/logo.webp` (opaque, alpha 0%); sharp scan: NO transparent asset on any candidate; Playwright runtime reproduced light-mode defect (lightSrc=.../logo.webp dark colorway on #f5f5f5 header). Root cause: single `resolved_logo_url` written to BOTH `.logo-dark` and `.logo-light` by `branding-init`; `business-config` collapses dark+light; `navbar.css` is display-only.
**Decision:** Option A (single transparent dual-purpose logo -> set `logo_media_id`) = smallest durable change; Option B (`logo_light_media_id` schema + migration + Admin/public wiring + light asset) preserves two-colorway design. Recommendation: attempt A first, escalate to B only if distinct per-theme colorways must be retained. Artwork legibility on backgrounds DEFERRED to owner.
**Cross-ref:** prior report `PUBLIC_HEADER_FOOTER_BRANDING_AUDIT.md` (Entry 6) + `BRANDING_FIX_IMPLEMENTATION_MAP.md`. Favicon re-verified decoupled: runtime `link[rel=icon]`=.../favicons/favicon.ico image/x-icon, `apple-touch-icon`=webp; `favicon_media_id != logo_media_id`.
**Stop:** Audit complete. Awaiting owner approval (Sec 15) before any schema/Admin/public change.
<!-- APPEND-MARKER -->
## Entry 10 - Phase 1 read-only audit (Option B implementation)

**Phase:** 2026-10-03, Phase 1 - READ-ONLY AUDIT (no implementation).
**Env inspected:** admin `.env.local` exists; `NEXT_PUBLIC_SUPABASE_URL=https://jczwilrysvnhcjzjztbi.supabase.co` (CANONICAL confirmed), `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` both present.
**Live canonical DB read (read-only, anon key; keys never echoed):** VERIFIED.
- `business_settings` row id=1: `logo_media_id=a5fb7148-8562-4d82-9fc1-d979fc19a323` (-> `logos/logo.webp`); `favicon_media_id=032f8b83-b0e1-47af-91d2-31fab05c1bd3` (-> `favicons/favicon.ico`); legacy `logo_url`/`favicon_url` consistent; `updated_at=2026-10-03T09:41:26Z`.
- `logo_light_media_id` column: ABSENT (PostgREST 400: "column business_settings.logo_light_media_id does not exist"). CONFIRMED absent in schema AND live DB.
- `logos` bucket `media_assets`: only `logo.webp` (dark/black colorway, image/webp). No light-colorway asset in any `media_assets` row.
**CSS semantics (theme.css 1096-1110 + 36/216):** default (dark) theme -> header `rgba(10,10,10,.92)` dark; `.logo .logo-dark{display:block}`, `.logo .logo-light{display:none}`. `.light-mode` -> header `rgba(255,255,255,.95)` white; `.logo-light{display:block}`, `.logo-dark{display:none}`. => `.logo-dark` renders on the DARK header; `.logo-light` on the WHITE header. (Class name = theme displayed, so the visible colorway must be the OPPOSITE of the bg.)
**Authority chain (source-verified + DB):** schema.ts `logoMediaId`/`faviconMediaId` FK->media_assets (no light); repository.ts RESPONSE_ALLOWLIST has no `logo_light_media_id`; Admin PATCH `/api/admin/business-settings/branding` accepts only `{logo_media_id, favicon_media_id}`; public GET `/api/branding` returns only `{logoUrl, faviconUrl}`; `resolver.ts` resolves only logo/favicon; `BusinessRepository.mapToUI` maps only logo/favicon (search_codebase confirms `logo_light`/`logoLight`/`resolved_logo_light` appear ONLY in .md audits, zero in any .js/.ts source); `business-config.js` L118-120 collapses `logo.dark`+`logo.light` to single `resolved_logo_url`; `branding-init.js` L88-99 `updateLogos()` writes that single URL to BOTH `.logo-dark` & `.logo-light` (comment L95 "use same URL - theme handled by CSS display") => root cause confirmed end-to-end.
**Defect:** current `logo_media_id`=dark-colorway `logo.webp` written to both slots; `.logo-dark` on dark header => dark-on-dark invisible (contrast 1.18). Favicon decoupled (separate `favicon_media_id`+`favicons` bucket) => unaffected.
**Files that must change for Option B:** migration `supabase/migrations/YYYYMMDD_add_logo_light_media_id.sql`; `src/db/schema.ts` (+`logoLightMediaId`); `src/lib/repository.ts` (allowlist + PATCH body); `src/app/api/admin/business-settings/branding/route.ts` (PATCH accept+validate); `src/app/api/branding/route.ts` (GET select+resolve->`logoLightUrl`); `src/lib/media/resolver.ts` (resolve light); `src/features/settings/settings-view.tsx` (+light picker via `ImageChangeDialog`); `assets/js/repositories/BusinessRepository.js` (emit `resolved_logo_light_url`); `assets/js/business-config.js` (split dark/light); `assets/js/branding-init.js` (write distinct URLs); `assets/js/background-media-warmer.js` (register light media). Navbar/theme CSS already expose both slots => NO change.
**Migration convention:** `supabase/migrations/YYYYMMDD_name.sql`; `ALTER TABLE business_settings ADD COLUMN ... logo_light_media_id uuid REFERENCES media_assets(id) ON DELETE <...>` + `CREATE INDEX IF NOT EXISTS`. Existing 20260822 uses `ON DELETE RESTRICT`; schema.ts Drizzle declares `onDelete:"set null"` (pre-existing drift noted).
**STOP-condition triggers:** (1) NO light-colorway asset in `logos` bucket - only static fallback `assets/images/branding/logo-white.webp`; (2) colorway<->slot mapping ambiguity - brief says `logo_media_id`->`.logo-dark` (dark header) but current `logo_media_id` is the dark colorway (invisible on dark header) => would need repointing; (3) artwork legibility DEFERRED to owner; (4) production data reassignment requires owner approval via Admin PATCH.
**Conclusion:** Phase 1 AUDIT COMPLETE. Implementation PAUSED pending owner decision (colorway mapping + light-asset sourcing + data reassignment). No migration/code/DB/write performed this session.
<!-- APPEND-MARKER -->