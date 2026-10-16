# Branding Fix — Implementation Map (READ-ONLY)

Status: `IMPLEMENTATION MAP COMPLETE — APPROVAL REQUIRED`
Baseline verified: public `905bd7a` (branch `feature/membership-tiers-staging-phase1`), admin `876b185` (branch `clean-rebuild`).
Canonical Supabase DB: `jczwilrysvnhcjzjztbi` (anon-key REST read-only inspection).

> This is a mapping-only artifact. **No source, DB, schema, migration, storage, media, .env, or config changes were made** by producing it. All claims are VERIFIED against source at baseline or via read-only DB inspection. Runtime evidence that could not be obtained is marked `NOT TESTABLE`.

## 1. Executive summary

Two independent branding defects were re-verified against the current source and canonical DB:

1. **Favicon–logo coupling is data aliasing, not a schema flaw.** `business_settings.favicon_media_id` and `logo_media_id` are separate FK columns (`schema.ts:81-82`) but both currently point to the **same** `media_assets` row (`a5fb7148…`, `logos/logo.webp`, `image/webp`). The relationship is already correct; decoupling = assign a dedicated asset to `favicon_media_id` (no schema change). The harder blocker is **.ico support**: the canonical upload pipeline cannot create/store a `.ico` (it hard-forces WebP), and `link[rel="icon"]` carries no explicit `type`.
2. **Dark/light logos are the same URL.** One canonical `resolved_logo_url` is written into both `.logo-dark` and `.logo-light` slots (`branding-init.js:90-99`; `business-config.js:119-120`; `BusinessRepository.resolveBranding`). The CSS slot toggle exists (`theme.css:1096/1104`) so *one transparent asset would satisfy both themes* — but no such asset exists today.

Favicon independence = **zero DB/schema changes** (assign a dedicated asset via the existing Admin UI). The `.ico` target additionally requires **upload-pipeline source changes** and an owner decision. The logo fix has **no zero-change path**: Option A needs a new asset; Option B needs a schema migration.

## 2. Current verified state

| Surface | Authority | Current behavior | Source |
|---|---|---|---|
| DB columns | `business_settings` | `logo_media_id` & `favicon_media_id` both = `a5fb7148` (aliased) | `schema.ts:81-82`; DB read |
| Shared row | `media_assets` | `bucket=logos`, `path=logo.webp`, `mime=image/webp`, 1920×1080 | DB read |
| Legacy urls | `business_settings` | `logo_url=.../logos/logo.webp`, `favicon_url=/favicon.ico` | DB read |
| Upload accept | `processor.ts` | `ACCEPTED_MIME_TYPES = jpeg/png/webp` only | `processor.ts:20-24` |
| Upload transform | `processor.ts`+`route.ts` | Sharp→always WebP; `contentType:"image/webp"`; `.webp` | `processor.ts:132,150`; `route.ts:206,240,274,310` |
| Storage path | `paths.ts` | `assets/images/{category}/{uuid}.webp` (hardcoded ext) | `paths.ts:79,99` |
| Media picker | `/api/media` | selects `media_assets.*`, **no MIME filter**, bucket only | `media/route.ts:199,200` |
| Picker file input | `image-change-dialog.tsx` | `accept="image/*"` (text says "PNG, JPG, WebP") | `image-change-dialog.tsx:355` |
| Admin PATCH | branding route | accepts `logo_media_id`/`favicon_media_id`; `mime_type.startsWith("image/")` | `business-settings/branding/route.ts:57,84` |
| Public resolver | `/api/branding` + `resolver.ts` + `BusinessRepository` | returns `faviconUrl` from `public_url`, no MIME check | `branding/route.ts:44-64`; `resolver.ts:50-52`; `BusinessRepository.js` resolveMediaId |
| Favicon writers | **3** | shared-components (boot); business-config (DCL); branding-init (DCL, last) | `shared-components.js:286,696`; `business-config.js:153-157`; `branding-init.js:108-120` |
| apple-touch writer | branding-init (coupled) | overwritten to same URL as favicon | `branding-init.js:114-117` |
| Static favicon (HTML) | `index.html` | **no** `<link rel="icon">`/`apple-touch-icon` (comment only) | `index.html:45` |
| Static fallbacks | `assets/images/branding/` | `logo.webp`,`logo-white.webp`,`apple-touch-icon.webp`,`og-image.webp` (+`-opt`); **no `favicon.ico`** | filesystem |
| JSON-LD logo/image | content-loader | `schema.image`/`schema.logo` = `resolved_logo_url` | `content-loader.js:1299,1321-1324` |

## 3. Favicon `.ico` architecture

`image/x-icon` is storable in `media_assets.mime_type` (free text — `schema.ts:45`) and `favicon_media_id` already accepts it (`branding/route.ts:84` `startsWith("image/")`). **The DB layer is not the blocker.** The blocker is the upload pipeline: it (a) rejects `image/x-icon` before storage and (b) hard-forces `.webp` bytes + `image/webp` on every object. A `.ico` is a multi-resolution container → store **byte-for-byte** (pass-through, no Sharp) with `content_type=image/x-icon`. Supabase Storage serves object Content-Type metadata; the `public-assets` bucket is public-read, so **no storage policy change** is required — only correct object content-type at upload.

## 4. Favicon upload pipeline map

```
[Admin input accept="image/*"] -> POST /api/admin/upload        route.ts:69-180
  sanitizeCategory            route.ts:179 -> "branding"
  declaredMimeType = file.type route.ts:206 -> "image/x-icon"  REJECTED @ processor.ts:100
  processImage(buf, mime)     route.ts:211 -> processor.ts:20-24 (no ico) ; Sharp fmt check ts:132 ; .webp() out ts:150
  generateStoragePath(cat)    route.ts:240 -> paths.ts:79  -> ".../{uuid}.webp"
  storage.upload(path,webpBuf,{contentType:"image/webp"}) route.ts:273-274
  media_assets.insert({path, mime_type: declaredMimeType,...}) route.ts:305-316
```
`.ico` cannot traverse this path. Required branch: detect `image/x-icon` → skip `processImage`/Sharp → keep original bytes → `assets/images/branding/{uuid}.ico` → storage `contentType="image/x-icon"` → `mime_type="image/x-icon"`.

## 5. Favicon writer map (every `link[rel="icon"]` / apple-touch writer)

1. **shared-components.js `applyFavicon()` (boot, synchronous)** — `ensureFavicon('icon', BRAND.logoFallback, 'image/webp')` + `ensureFavicon('apple-touch-icon', BRAND.appleTouchFallback, 'image/webp')` (`shared-components.js:286-290`). `ensureFavicon` (275-285) creates `<link>` if absent, sets `rel`,`type`(when given),`href`. Icon seeded to the **logo** fallback (`logo.webp`); apple-touch to `apple-touch-icon.webp`. Runs first.
2. **business-config.js `initBusinessConfig()` (DOMContentLoaded)** — `link[rel="icon"].href = config.favicon` (= `resolved_favicon_url`); icon only, no `type`. **Duplicate** of branding-init (`business-config.js:153-157`).
3. **branding-init.js `updateFavicon()` (DOMContentLoaded, last)** — sets `link[rel="icon"].href` **and** `link[rel="apple-touch-icon"].href` to the **same** `resolved_favicon_url` → **couples apple-touch-icon to the favicon** (defect) (`branding-init.js:108-120`).

Script order (defer, `document.write`): `business-config.js`(11) → `BusinessRepository.js`(12) → `branding-init.js`(13) → … `content-loader.js` (core). DCL listeners fire in registration order → **branding-init is the authoritative writer** (last touch). `ensureFavicon` already accepts a `type`, so `type="image/x-icon"` is a one-line change there.

## 6. Favicon independence map (Objective B)

- `logo_media_id` → `logos/logo.webp` (media row `a5fb7148`)
- `favicon_media_id` → dedicated `.ico` media row (must be created; none exists)
- The `business_settings.favicon_media_id` FK is already independent (`schema.ts:82`) and the Admin UI has a dedicated **"Edit Favicon"** picker (`settings-view.tsx:300-309`) → `favicon_media_id` via PATCH. So **assignment needs no UI/API/DB change** — only a dedicated `.ico` row must exist first.
- Independence therefore requires: (source) `.ico` upload-pipeline branch + (data) a dedicated `.ico` asset row + (source) writer reconciliation. Decoupling itself is non-destructive and needs **no schema change**.

## 7. Logo architecture map (Objective C)

Logo data flow: `business_settings.logo_media_id` → `BusinessRepository.resolveBranding` (`resolveOne(raw.logo_media_id, mapped.logo_url, 'resolved_logo_url')`) → single `resolved_logo_url` → `media_assets.public_url`. Consumers of that **one** URL (verified):

- Header `.logo-dark.site-logo` + `.logo-light.site-logo` — same `src` (`branding-init.js:90-99`; `business-config.js:119-120`; seeded in `shared-components.js:120-121,172-173`).
- Footer `.logo-dark` + `.logo-light` — same `src` (`shared-components.js:172-173`; `branding-init.updateLogos`).
- `og:image` (`branding-init.js:127-129`), `twitter:image` (`branding-init.js:132-134`).
- JSON-LD `image` + `logo` (`content-loader.js:1299,1321-1324`).
- `background-media-warmer.js` (warms referenced public URLs).
- **apple-touch-icon** (currently coupled — `branding-init.js:114-117`).

**Where the one-logo assumption is enforced:** `BusinessRepository.resolveBranding` emits a single `resolved_logo_url`; `branding-init.updateLogos` writes that one value into both `.logo-dark` and `.logo-light`; `business-config.js` sets `logo.dark` and `logo.light` to the same `resolved_logo_url`. The CSS slot toggle (`.light-mode .logo-dark{display:none}` / `.logo .logo-light{display:none}` — `theme.css:1096,1104`) proves the *infrastructure for two assets already exists*; only the JS supplies one. Current logo asset (`logos/logo.webp`) is opaque black-on-#0a0a0a (fine on dark) but illegible on #f5f5f5 (light). `logo-white.webp` is opaque white (invisible on dark). Neither qualifies; `logo-*-opt.webp` are optimized equivalents of the same opaque assets.

## 8. Option A analysis — one transparent canonical logo

- **Required asset characteristics:** transparent background; mark/logotype legible on **#0a0a0a** (dark) and **#f5f5f5** (light). The CSS slot toggle means a single asset in both `.logo-dark`/`.logo-light` works automatically.
- **Existing asset qualifies?** No. `logo.webp` (opaque black bg), `logo-white.webp` (opaque white bg), `logo-opt.webp`/`logo-white-opt.webp` (same opaque bases). A **new transparent asset is required.**
- **Downstream consumers affected:** all six logo consumers above (header×2, footer×2, og:image, twitter:image, JSON-LD×2, warmer). Because every consumer fans out from the single `logo_media_id`/`resolved_logo_url`, a single DB reassignment propagates everywhere — **no per-consumer code change**.
- **OG/Twitter/JSON-LD change?** The OG/Twitter image and JSON-LD image would reference the new transparent logo URL. Transparent logo renders acceptably on OG/Twitter default canvases; JSON-LD image/logo acceptably. Acceptable for current branding architecture.
- **Verdict:** zero source/DB/schema change to *wire* it — only upload a new transparent asset and assign it to `logo_media_id` via the existing Admin UI. The **STOP condition** ("new logo asset must be uploaded") applies → READ-ONLY task cannot perform it; awaits approval.

## 9. Option B analysis — two DB-controlled theme logos

- **Schema/API/UI surfaces requiring change:** `schema.ts` add `logo_light_media_id uuid→mediaAssets.id (set null)`; new migration; Admin PATCH `branding/route.ts` to accept & validate `logo_light_media_id`; `repository.ts` RESPONSE_ALLOWLISTS add `logo_light_media_id`; public `/api/branding` return `logoLightUrl`; `MediaResolver`/`resolver.ts` resolve the second id; `BusinessRepository.resolveBranding` emit `resolved_logo_light_url`; `business-config.js` split `logo.dark`/`logo.light`; `branding-init.updateLogos` write different URLs to `.logo-dark`/`.logo-light`; Admin `settings-view.tsx`+picker add a second asset picker. OG/Twitter image + warmer stay single-logo (only JSON-LD image stays single); apple-touch-icon separate.
- **Surface count:** ≥10 wiring surfaces (matches "6+" from prior plan; this audit confirms 10+).
- **Do two assets satisfy a real brand requirement?** That is the owner's call; the architecture supports it via the existing slot CSS, but Option B is strictly more invasive.
- **Verdict:** REQUIRES schema migration → STOP condition ("schema migration required") → awaits approval.

## 10. Required route map (per surface)

| Surface | Current authority | Current behavior | Defect | Required change | DB? | Source? |
|---|---|---|---|---|---|---|
| Admin branding settings | `settings-view.tsx` | "Edit Logo" & "Edit Favicon" pickers | favicon picker blocked by upload pipeline | assign dedicated ico (after pipeline fix) | no | no (picker already independent) |
| Admin logo picker | `settings-view.tsx:290-299` | sets `logo_media_id` | N/A | Option A: no change; Option B: 2nd picker | Opt B: yes | Opt B: yes |
| Admin favicon picker | `settings-view.tsx:300-309` | sets `favicon_media_id` | cannot create ico | none for assignment | no | no |
| upload processor | `processor.ts` | reject x-icon; force webp | cannot store .ico | ico pass-through branch; extend allowlist | no | **yes** |
| upload API | `route.ts` | path `.webp`; `contentType:"image/webp"`; `mime_type=declared` | cannot store .ico | ico branch: path `.ico`; `contentType=image/x-icon` | no | **yes** |
| Storage path | `paths.ts:79,99` | hardcoded `.webp` | cannot name .ico | extension branch per format | no | **yes** |
| media_assets | `media_assets` | `mime_type` free text | no x-icon row | insert ico row | no | no (via upload API) |
| business_settings | `business_settings` | both ids aliased | data aliasing | set favicon_media_id → ico row | data-only | no |
| Admin branding PATCH | `branding/route.ts` | accepts image/* | none | none (already accepts ico MIME) | no | no |
| public branding API | `branding/route.ts` | returns `faviconUrl` | none | none | no | no |
| BusinessRepository | `BusinessRepository.js` | single `resolved_favicon_url` | none | none | no | no |
| business-config.js | public runtime | writer #2 (DCL) | duplicate icon writer | remove icon write; split logo dark/light (Opt B) | no | Opt B: **yes** |
| branding-init.js | public runtime | writer #3 + couples apple-touch | wrong `type`; couples apple-touch | `type=image/x-icon`; decouple apple-touch; split logos (Opt B) | no | **yes** (both opts) |
| shared-components.js | public runtime | writes icon=logo.webp; apple-touch seed | icon seeded to logo; couples ownership | let branding-init own icon; keep apple-touch separate | no | **yes** |
| header logo | `shared-components.js` | .logo-dark/.logo-light same src | same URL both themes | Opt A: none; Opt B: write two URLs | no | Opt B: yes |
| footer logo | `shared-components.js:172-173` | same as header | same | same as header | no | Opt B: yes |
| favicon (runtime) | `branding-init` | `link[rel=icon"]` no type; =logo | not .ico; no type attr | ico + `type=image/x-icon` | no | **yes** |
| apple-touch-icon | `branding-init` | =favicon (coupled) | coupled to .ico | keep separate raster (webp) | no | **yes** |
| og:image | `branding-init.js:127-129` | =logo | none for .ico | Opt A: follows logo change | no | no |
| twitter:image | `branding-init.js:132-134` | =logo | none | same | no | no |
| JSON-LD | `content-loader.js:1299,1321-1324` | image+logo=resolved_logo_url | none | Opt A: follows logo change | no | no |
| warmer | `background-media-warmer.js` | warms referenced URLs | none | follow URL changes | no | no |

## 11. DB / schema impact

- **Favicon .ico (independence):** NO schema change. `favicon_media_id` FK already exists (`schema.ts:82`). Only a new `media_assets` row + reassignment of `favicon_media_id` (DML, not schema).
- **Favicon .ico (creation):** NO schema change. `media_assets.mime_type` is free text and already accepts `image/x-icon`.
- **Option A (logo):** NO schema change (reassign `logo_media_id`).
- **Option B (logo):** REQUIRES new column `logo_light_media_id uuid → mediaAssets.id ON DELETE SET NULL` + migration. → STOP condition (schema migration).
- **No destructive/replacement ops** in the map itself.

## 12. Storage / media impact

- Bucket `public-assets` is public-read; no policy change needed.
- `.ico` objects stored at `assets/images/branding/{uuid}.ico` with `Content-Type: image/x-icon` (object metadata) and `media_assets.mime_type='image/x-icon'`.
- Existing `logos/logo.webp` (current aliased row) is **not overwritten**; decoupling leaves it as the logo asset. Apple-touch stays on its own `apple-touch-icon.webp`.

## 13. API / Admin UI / Public runtime / Metadata impact

- **API impact:** Favicon independence = none (PATCH `/admin/business-settings/branding` already accepts independent ids, validates `image/*`). `.ico` creation = none to the PATCH/resolver; only the upload `POST /api/admin/upload` gains an ico branch. Option B = add `logo_light_media_id` to PATCH + public `/api/branding` response.
- **Admin UI impact:** `settings-view.tsx` already has independent Logo & Favicon pickers. No new picker for favicon independence. Cosmetic: picker `accept`/label → include `.ico`. Option B = second logo picker + state.
- **Public runtime impact:** Writers in `shared-components.js` (boot), `business-config.js` (DCL), `branding-init.js` (DCL). `.ico` requires: `branding-init.updateFavicon` set `type="image/x-icon"`; decouple apple-touch; remove business-config's duplicate icon write. Option A = none beyond logo reassignment. Option B = split `logo.dark`/`logo.light`.
- **Metadata impact:** Logo change fans to header/footer logos, `og:image`, `twitter:image`, JSON-LD `image`+`logo` (by design). Favicon decoupling keeps `og:image`/JSON-LD tied to the **logo**; ico is independent of apple-touch.

## 14. Decision gates (F1–F11)

| Gate | Answer | Evidence |
|---|---|---|
| F1 Real .ico without schema change? | **VERIFIED** | `favicon_media_id` FK already independent (`schema.ts:82`) |
| F2 Pipeline store .ico byte-for-byte? | **BLOCKED** | `processor.ts:20-24,132`; `paths.ts:79`; `route.ts:206,240,274` |
| F3 Picker select .ico? | **VERIFIED** | `/api/media` selects `*` no MIME filter (`media/route.ts:199`); `accept="image/*"` |
| F4 Storage serve .ico w/ correct type? | **VERIFIED** (conditional) | bucket public; object Content-Type must be `image/x-icon` (route hardcodes `image/webp`) |
| F5 favicon_media_id → dedicated ico? | **VERIFIED** | PATCH validates `image/*` (`branding/route.ts:84`) |
| F6 Remove duplicate writer (no DB change)? | **VERIFIED** | writers are client JS only |
| F7 Logo fixed by one transparent asset? | **VERIFIED** (arch.) / **REQUIRES APPROVAL** (asset) | CSS slot toggle exists (`theme.css:1096,1104`); no qualifying asset |
| F8 Two-logo = schema migration? | **VERIFIED** | needs `logo_light_media_id` column |
| F9 Metadata change if logo changes? | **VERIFIED** | header×2, footer×2, og:image, twitter:image, JSON-LD ×2, warmer |
| F10 Favicon independent of logo+apple-touch? | **VERIFIED** | favicon=.ico(rel=icon); apple-touch=separate webp; coupled in `branding-init.js:114-117` |
| F11 Smallest durable implementation? | **REQUIRES APPROVAL** | needs owner sign-off on .ico sources + logo path |

## 15. Proposed implementation order (do not execute)

**Phase 1 — Favicon `.ico`**
1. `processor.ts`: add `image/x-icon` to `ACCEPTED_MIME_TYPES`; pass-through branch (skip Sharp, return original bytes, `format="ico"`).
2. `paths.ts`: `generateStoragePath`/`buildStoragePath` → extension branch (`.ico`).
3. `upload/route.ts`: ico branch → `contentType="image/x-icon"`, `.ico` path, `mime_type="image/x-icon"`.
4. `image-change-dialog.tsx`: cosmetic `accept`/label → include `.ico`.
5. Upload a dedicated `.ico` asset & assign to `favicon_media_id` (Admin UI PATCH; **requires uploading the asset**).
6. `shared-components.js`: stop seeding `link[rel=icon"]` with the logo fallback; keep apple-touch as its own webp.
7. `business-config.js`: remove duplicate `link[rel=icon"]` write.
8. `branding-init.js`: set `type="image/x-icon"`; **decouple** apple-touch-icon to its own raster.
9. Runtime verify `<link rel="icon" type="image/x-icon" href="…ico">` + apple-touch separate.

**Phase 2 — Logo** (awaiting Option A vs B decision)
- Option A: upload transparent logo → assign `logo_media_id` (no code).
- Option B: `schema.ts`+migration → PATCH → repository allowlist → public API → resolver → BusinessRepository → business-config → branding-init → settings-view + picker.

**Phase 3 — Regression** (all 10 public-shell pages): dark, light, fresh load, reload, favicon, header/footer logo, OG/Twitter, JSON-LD, warmer, cache.

## 16. Verification matrix

| Check | Pre | Target | Method |
|---|---|---|---|
| favicon row ≠ logo row | aliased (both `a5fb7148`) | distinct | DB read |
| `media_assets` has `image/x-icon` row | none | ≥1 | DB read |
| Upload accepts `.ico` | rejects | stores bytes | upload API probe |
| Storage object content-type | `image/webp` | `image/x-icon` | HEAD on public_url |
| `link[rel=icon"]` | no `type`, href=logo | `type=image/x-icon`, href=`.ico` | DOM inspect |
| apple-touch-icon | =favicon (coupled) | separate webp raster | DOM inspect |
| logo dark/light | identical | Opt A identical transparent / Opt B distinct | DOM inspect |
| OG/Twitter/JSON-LD | =logo | follows logo | DOM inspect |

**Live `https://ztlounge.co.ke/favicon.ico`: NOT TESTABLE** — sandbox returned HTTP 000 (no egress to the apex domain). Supabase Storage egress works (canonical `logo.webp` → HTTP 200/`image/webp`). Remaining evidence is VERIFIED via source + DB.

## 17. Risks and edge cases

- Browser favicon cache: switching to `.ico` may need a cache-bust (`?v=…`) so stale `image/webp` favicon isn't reused under one URL.
- `ensureFavicon` sets `type` only when supplied; `branding-init.updateFavicon` sets `href` but never `type` — must be added there or removed upstream.
- Storage content-type is set at upload (`route.ts:274`); a `.ico` uploaded via any non-canonical path without `contentType=image/x-icon` is mis-served as webp.
- Apple-touch-icon must NOT be `.ico` (Apple wants PNG/WebP raster) — repo ships `apple-touch-icon.webp`.
- Option A transparent-logo legibility on BOTH `#0a0a0a` and `#f5f5f5` is a brand decision, not technical.

## 18. Explicit approval gates

1. **Logo path:** Option A (one transparent logo) vs Option B (two theme logos + migration).
2. **Option A:** approval to create/upload a new transparent logo asset (read-only task cannot upload it).
3. **Option B:** approval for the `logo_light_media_id` schema migration.
4. **`.ico` upload-pipeline source changes** (`processor.ts`, `paths.ts`, `upload/route.ts`, picker UX).
5. **Writer reconciliation:** decommission `business-config.js` `link[rel=icon"]` write + decouple apple-touch-icon from favicon.

## 19. Final status

**STATUS: `IMPLEMENTATION MAP COMPLETE — APPROVAL REQUIRED`**

**Findings (verified defects):** (1) `favicon_media_id` is data-aliased to `logo_media_id` — independent FK, but shared `a5fb7148` row (`logos/logo.webp`, webp); (2) no `.ico` capability in the upload pipeline (reject + force-WebP + `.webp` path + `image/webp` content-type); (3) `link[rel=icon"]` has no `type` and apple-touch-icon is coupled to the favicon; (4) dark/light logos share one `resolved_logo_url`; (5) no transparent-on-both-themes logo asset exists.

**Required changes:** Favicon `.ico` — `processor.ts`, `paths.ts`, `upload/route.ts`, `branding-init.js`, `business-config.js`, `shared-components.js` (writer reconciliation + decoupling); upload a dedicated `.ico` asset; assign to `favicon_media_id`. Logo — Option A: new transparent asset + assign `logo_media_id`; Option B: `schema.ts`+migration + ≥10 surfaces.

**No-change areas:** `business_settings` schema, `media_assets` schema, storage bucket policy, `resolver.ts` / `BusinessRepository.resolveMediaId` / `/api/branding` contract, `/api/media` picker filter, `repository.ts` logo allowlist (for the .ico path).

**Next task:** a separate fresh implementation task **after** owner approves (a) logo path and (b) `.ico` requirement. No implementation performed in this task.





