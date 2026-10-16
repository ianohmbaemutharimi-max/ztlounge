# ZT Lounge Branding Fix Plan

**Plan status:** READ-ONLY ANALYSIS — no source, DB, storage, or media changes; nothing deployed.
**Authoritative Supabase project:** `jczwilrysvnhcjzjztbi` (public anon REST / Storage read-only; **not** the staging CLI project).
**Public repo HEAD:** `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c` (`feature/membership-tiers-staging-phase1`)
**Admin repo HEAD:** `876b1851fbcd016cf290734498dda66b764afa12` (`clean-rebuild`)
**Prerequisite evidence:** `PUBLIC_HEADER_FOOTER_BRANDING_AUDIT.md` (treated as context; every claim below is independently re-verified against source).

> This deliverable is a **plan for approval, not an implementation**. Wherever the investigation reaches a schema migration, a stored-media replacement, a production data change, or a contract change not already supported by the system, it is marked **DECISION REQUIRED**.

## 1. Current Verified Architecture

**Shell (public):** One canonical shared shell — `assets/js/shared-components.js` — consumed by all 10 real public pages. No duplicated headers/footers. Each page provides one `#site-header` and one `#site-footer` mount plus one `<script src="…assets/js/shared-components.js" data-features="…">` tag. `404.html` and `index_clean.html` are bare/unlinked artifacts and out of scope.

**Theme:** `theme-init.js` (blocking, in `<head>`) reads `localStorage['zt-theme']` and adds `.light-mode` pre-paint. `initThemeToggle()` (shared-components.js L431) toggles `.light-mode`, persists `zt-theme`, updates `color-scheme`. Verified across all 10 routes.

**Logo DOM contract (already two-slot):** `shared-components.js` emits, in both header (`headerHTML` L120–121) and footer (`footerHTML` L172–173):
```html
<img src="<logoFallback>"      class="logo-dark site-logo"  ... data-canonical-logo="dark" />
<img src="<logoLightFallback>" class="logo-light site-logo" ... data-canonical-logo="light" />
```
- `BRAND.logoFallback` = `assets/images/branding/logo.webp` (opaque, black background — canonical dark logo)
- `BRAND.logoLightFallback` = `assets/images/branding/logo-white.webp` (white-on-transparent; audited mean luminance 247)
- `BRAND.appleTouchFallback` = `assets/images/branding/apple-touch-icon.webp` (byte-identical to `logo.webp`)
- `BRAND.ogImageFallback` = `assets/images/branding/og-image.webp`

CSS in `theme.css` (L1096–1110): `.logo-light` shown only under `.light-mode`. Slot mechanism is correct and present.

**Branding data chain (canonical):** `business_settings.logo_media_id / favicon_media_id` → `media_assets.public_url` → DOM. Resolved by `BusinessRepository.resolveBranding()` (§8) and applied by `branding-init.js`. HTTP 200 on all 10 routes. `MediaResolver.js` is the single public resolver (`media_id → media_assets.public_url`, batched + cached, non-fatal). `BusinessRepository.resolveMediaId()` duplicates this query but targets the same table/column (minor, flagged).

**Live branding data (canonical DB snapshot):**
| Field | Value |
|---|---|
| `logo_media_id` | `a5fb7148-8562-4d82-9fc1-d979fc19a323` |
| `favicon_media_id` | `a5fb7148-8562-4d82-9fc1-d979fc19a323` ← **SAME row as logo** |
| `logo_url` (legacy) | `…/public-assets/images/branding/logo.webp` |
| `favicon_url` (legacy) | `/favicon.ico` ← **stale/broken** |
| `media_assets.public_url` | `…/logos/logo.webp` (1251×1251; DB metadata says 1920×1080 — stale) |

**Core defect (proven):** `branding-init.js` `updateLogos(logoUrl)` (L88–99) assigns the **same** `logoUrl` to **both** `.logo-dark.site-logo` and `.logo-light.site-logo`. In light mode the visible `.logo-light` shows the opaque black-background logo on a white header → reads as "missing". The correct light asset (`logo-white.webp`) is the *initial* `src` of `.logo-light` and is simply overwritten at runtime.

## 2. Current Favicon Architecture

**Authority chain:** `business_settings.favicon_media_id` → `media_assets.public_url` → runtime DOM. **No public page declares a static favicon** (the `<!-- Favicon - Single Declaration -->` comment at `index.html:45` is followed by no `<link>` tag; only the unlinked `index_clean.html:60` contains a `data:,` placeholder). Real `<link>` elements are **created at runtime** by the shared shell.

**Creation + canonical writers:**
1. **Creator — `shared-components.js` `applyFavicon()` (L286–289)** → `ensureFavicon('icon', BRAND.logoFallback, 'image/webp')` and `ensureFavicon('apple-touch-icon', BRAND.appleTouchFallback, 'image/webp')`. `ensureFavicon(rel, fallback, type)` (L275–284) creates the `<link>` in `document.head` if absent. **Static fallback favicon = `logo.webp`**; **apple-touch-icon fallback = `apple-touch-icon.webp`** (its own file, ≠ logo).
2. **Canonicalizer A — `branding-init.js` `updateFavicon(faviconUrl)` (L108–120):** sets **both** `link[rel="icon"]` and `link[rel="apple-touch-icon"]` `href` to `resolved_favicon_url` (call site L70). Primary writer.
3. **Canonicalizer B — `business-config.js` `initBusinessConfig()` (L153–157):** sets **only** `link[rel="icon"]` `href` to `config.favicon` (= `resolved_favicon_url`). **Does not touch `apple-touch-icon`** → R7 inconsistency.

> **R7 confirmed:** Two active writers for `link[rel="icon"]` (branding-init + business-config), last-writer-wins. `apple-touch-icon` written by only one. Reconcile to a single writer (§18).

**Icon `rel` values:** only `rel="icon"` + `rel="apple-touch-icon"`. **No `rel="shortcut icon"`** (grep: 0 matches).

**Admin control:** `SettingsView` (`settings-view.tsx`) exposes two `ImageChangeDialog` pickers — "Edit Logo" (L290–299) and "Edit Favicon" (L300–309) — both `uploadCategory="branding"`, `allowRemove={false}`. Each → `onSave` → `handleLogoMediaSave`/`handleFaviconMediaSave` → `saveBranding` → `PATCH /api/admin/business-settings/branding`. Picker file input `accept="image/*"` (L355); UI text "PNG, JPG, WebP up to 10MB" (L350).

**API — `PATCH /api/admin/business-settings/branding`** (`branding/route.ts`): auth `withAdminAuth`; body `{ logo_media_id?, favicon_media_id? }` — **already independent**; validates each id exists in `media_assets` and `mime_type.startsWith("image/")`; sets **only** that column; never touches legacy `logo_url`/`favicon_url`.

**API — `GET /api/branding`** (`branding/route.ts`): selects `id, business_name, logo_media_id, favicon_media_id`; resolves via `resolveImageUrls()` (canonical only — "NEVER falls back to legacy"); returns `logoUrl`/`faviconUrl`/`businessName`.

**Upload pipeline (`upload/route.ts` + `processor.ts`):**
- `ACCEPTED_MIME_TYPES` = `image/jpeg`, `image/png`, `image/webp` only (`processor.ts:20-24`). **No `image/x-icon`.**
- Sharp format check (`processor.ts:131-137`): must be `jpeg/png/webp` → `.ico` rejected.
- `upload/route.ts` L149–151: forces `contentType: "image/webp"`. L310: stores `mime_type: declaredMimeType` but bytes are always WebP; declared MIME must pass the whitelist. Net: `.ico` upload **rejected** before storage; stored object always `.webp`.
- Path (`paths.ts:75-79`): `assets/images/{category}/{uuid}.webp`; categories = `hero, gallery, menu, services, testimonials, branding, promotions, memberships`. Bucket `public-assets`. **No `favicon` category.**

**`media_assets` table** (`schema.ts:39-56`): `id, bucket, path, public_url(not null), original_name, mime_type(text), file_size, width, height, alt_text, title, description, content_hash, uploaded_by→profiles, created_at, updated_at`. `mime_type` is free text → *can* hold `image/x-icon` if inserted, but the upload pipeline cannot create such a row.

## 3. Current Logo Architecture

**Resolution:** `BusinessRepository.getAll()` selects `logo_media_id`; `mapToUI` (L73-77) maps it; `resolveOne` (L156) → `resolved_logo_url` via `media_assets.public_url`; legacy `logo_url` used only when `logo_media_id` absent/unresolvable. `background-media-warmer.js:238` registers `logo_media_id` for preload.

**Defect:** `branding-init.js` `updateLogos(logoUrl)` (L88-99) sets `.logo-dark.site-logo` **and** `.logo-light.site-logo` (header+footer = 4 elements) all to the same opaque black-logo URL. Console: `[BrandingInit] Updated 4 logo elements`. Local `logo-white.webp` is the initial `.logo-light` src and is overwritten.

**`business-config.js` compounding:** `logo: { dark: resolved_logo_url||FALLBACK, light: resolved_logo_url||FALLBACK }` (L118-120) — collapses the variant concept at the config layer too.

**No variant mechanism exists:** grep for `logo_dark`, `logo_light`, `dark_logo`, `light_logo`, `logo_variant`, `branding_variant`, `theme_logo`, `media_variant` across the entire Admin+public codebase: **zero matches**. The only light asset is the local `logo-white.webp`, unreachable via Admin/DB.

## 4. Favicon Independence Plan

### 4.1 Current state map
- **Admin favicon control:** single "Edit Favicon" picker → `favicon_media_id` (independent column, currently aliased to the logo row).
- **API endpoint:** `PATCH /api/admin/business-settings/branding` (accepts `favicon_media_id` independently).
- **Request payload:** `{ favicon_media_id: "<uuid>" | null }`.
- **DB column:** `business_settings.favicon_media_id` — `uuid → media_assets.id ON DELETE SET NULL` (`schema.ts:82`).
- **Other DB field for independent favicon?** Not required — the column already exists and is independent; coupling is a data aliasing, not a schema constraint.
- **media_assets workflow:** upload → webp → `media_assets` row → `public_url`.
- **Media upload categories:** `hero, gallery, menu, services, testimonials, branding, promotions, memberships`. **No `favicon` category**; favicon uses `branding`.
- **Existing favicon/icon media category?** None. A favicon is just a media asset under the `branding` path prefix.
- **Public favicon resolver:** `BusinessRepository.resolveBranding` → `resolved_favicon_url` → `branding-init.js updateFavicon()` writes `link[rel=icon"]` + `link[rel=apple-touch-icon"]`; `business-config.js` rewrites `link[rel=icon"]`.
- **Every place that writes an icon link:** exactly three writers — creator `ensureFavicon` (L275), canonicalizer `branding-init updateFavicon` (L108-120), canonicalizer `business-config initBusinessConfig` (L153-157). All three must be reconciled to one during implementation.
- **Every place that derives favicon from logo:** the **data** layer does not — `favicon_media_id` is independent in SQL/API; coupling is only that the current row is the **same UUID** as the logo. No code-level derivation of favicon-from-logo at runtime beyond Admin data entry.
- **Current fallback favicon:** `BRAND.logoFallback` = local `logo.webp` (created by `ensureFavicon`), then overwritten by `resolved_favicon_url`. No `favicon.ico` on disk. `assets/images/branding/` currently contains: `apple-touch-icon.webp, logo-opt.webp, logo-white-opt.webp, logo-white.webp, logo.webp, og-image-opt.webp, og-image.webp`. (`favicon.ico` existed historically but was removed — `final_check_out.txt:84`.)
- **`.ico` already supported anywhere?** Only as a *static-file MIME* in audit/test server tables (`_audit_tmp/server.js:10`, `l3_runtime.js:13`). Not in the public runtime or upload API.
- **Picker can upload/select `.ico`?** Upload: **NO** — `processor.ts` rejects `image/x-icon`; route forces WebP. Browse/select: picker lists `media_assets` rows and PATCH accepts any `mime_type` starting with `image/` (which `image/x-icon` satisfies), **but no such row can be created** via the canonical upload. So `.ico` is **not** supported end-to-end.
- **API validation permits `.ico`?** PATCH route's `startsWith("image/")` would accept `image/x-icon`, but the upload `processor.ts` whitelist does **not** — and that is the only reachable path to create the asset.
- **`media_assets.mime_type` supports `image/x-icon`?** Yes — free-text column. Blocker is the upload pipeline whitelist, not the schema.
- **Favicon should remain in `media_assets`?** **Yes.** It is the canonical registry (`public_url`, `content_hash`, dimensions, audit trail, warming integration).

### 4.2 Desired favicon contract (target)
```
Admin Settings ("Edit Favicon")
   ↓  ImageChangeDialog (uploadCategory="branding") — browse/select/upload
   ↓  PATCH /api/admin/business-settings/branding { favicon_media_id }
   ↓  media_assets.id → public_url  (a dedicated small image asset)
   ↓  BusinessRepository.resolveBranding → resolved_favicon_url
   ↓  branding-init.js updateFavicon → <link rel="icon"> + <link rel="apple-touch-icon">
```
**`.ico` recommendation:** Do **not** require `.ico`. Modern Chromium/Firefox/Safari accept PNG and WebP favicons via `link[rel=icon"]`. The upload pipeline already produces WebP; a small WebP/PNG favicon through `media_assets` is browser-native and avoids touching `processor.ts`. Adopt `.ico` (multi-resolution) **only** if legacy/IE-intranet coverage is explicitly required — a separate enhancement (add `image/x-icon` to `ACCEPTED_MIME_TYPES`; allow Sharp `ico` format; stop forcing `.webp` for an `favicon` category). Neither needs a DB/schema change, but both need source changes → flagged for approval.

**Apple-touch-icon:** Keep a **dedicated** `apple-touch-icon.webp` asset (already independent in fallback). At runtime it is currently overwritten with `resolved_favicon_url` (branding-init L114-117). Decision: if a single favicon asset is used for `rel=icon"`, **also** let it drive `apple-touch-icon` (current behaviour) **unless** a brand-specific touch icon is wanted — then add a third column (e.g., `apple_touch_icon_media_id`) or reuse `favicon_media_id`. Evidence: a dedicated apple-touch file already exists, so the choice is data-level, not architectural.

## 5. Dark/Light Logo Options

### Option A — One transparent logo
- **Mapping:** Admin logo (`logo_media_id`) → a **transparent-background** logo → both `.logo-dark` & `.logo-light`.
- **Can the existing public rendering support this already?** Yes — the two CSS slots + theme toggle already exist; `branding-init.updateLogos` keeps pushing one URL. No slot change needed.
- **Does a suitable transparent local asset exist?** `logo-white.webp` is white-on-transparent, but white-on-transparent is **invisible on dark backgrounds**. The dark logo is opaque black-bg. A *single* transparent logo legible on **both** `#0a0a0a` and `#f5f5f5` requires a brand mark in a mid-tone/brand colour — **not present** in repo. Option A is **blocked on asset availability**.
- **Admin uploader accepts it?** Yes — PNG/WebP transparent sources accepted; stored as WebP.
- **Blast radius:** HIGH (R1). `branding-init.updateOGImage` (L126-138) and `updateJSONLD` (L144-158) fan the logo URL into `og:image`, `twitter:image`, JSON-LD `image`; `content-loader.generateJSONLD` (L1299) sets `schema.logo`. Decoupling favicon first (§4) removes the apple-touch coupling, but OG/Twitter/JSON-LD still follow the logo by design. **Requires approval (media asset change).**
- **Verdict:** Smallest change with **no schema migration**, but requires (a) a new transparent brand asset and (b) acceptance of the OG/JSON-LD ripple. **DECISION REQUIRED** (asset replacement + consumer ripple).

### Option B — Frontend-only light-logo fallback (DB-dark only)
- **Mapping:** `.logo-dark → resolved_logo_url`; `.logo-light →` local `logo-white.webp` only; stop overwriting `.logo-light`.
- **Files:** `branding-init.js` (stop setting `.logo-light` src), `business-config.js` (drop the `light:` collapse).
- **DB authority violated?** **Yes** — Admin logo changes wouldn't update light mode; `logo-white.webp` is repo-local and not Admin-controllable (the drift CMS branding prevents). **Rejected.**
- **Verdict:** Rejected as a durable solution. Listed for completeness.

### Option C — DB/Admin theme-specific logo variants
- **Investigated:** Add `logo_dark_media_id` / `logo_light_media_id`. Grep confirms **no existing variant concept** to reuse (§6).
- **Changes:** schema migration (2 nullable FK columns); Drizzle `schema.ts`; `repository.ts`/`mapping.ts` allowlists; `PATCH /branding` + `GET /api/branding`; `BusinessRepository.resolveBranding` resolves two URLs; `branding-init.updateLogos` fans dark→`.logo-dark`, light→`.logo-light`; `business-config` exposes two logo URLs; shell fallback already has two local assets.
- **Backward compatibility:** additive migration; nullable columns fall back to `logo_media_id` when NULL. Existing logo row untouched.
- **Verdict:** The only option that makes `.logo-light` genuinely **Admin/DB-controlled** and honours the existing two-slot contract end-to-end. Largest surface, most correct. **DECISION REQUIRED** (schema migration).

### Option comparison
| Option | Schema | Code | Asset | DB data | OG/JSON-LD affected? | DB-authoritative light? |
|---|---|---|---|---|---|---|
| A transparent | none | none (slot exists) | **replace** logo asset | repoint `logo_media_id` | yes (fan-out) | yes (one asset, both themes) |
| B frontend-only | none | edit 2 files | none | none | no | **no** (rejected) |
| C variants | **migration** | 6 surfaces | none | add 2 ids | no (decoupled) | yes |

**Recommendation:** Decouple the favicon first (Objective 1 — no schema change). Then: **prefer Option C if the brand wants Admin control of a dark *and* a light logo** (the two slots already exist for this); **prefer Option A only if a single transparent logo is acceptable on both themes and the OG/JSON-LD ripple is approved** (no schema change, but needs a new transparent asset). **Do not** ship Option B.

## 6. Existing Schema / Capability Reuse

Searched the entire Admin + public codebase and the live schema for reuse candidates:
- `logo_media_id` / `favicon_media_id`: **already present and independent** (`schema.ts:81-82`; `repository.ts:53`; `mapping.ts:79-80`; branding PATCH + public `/api/branding` read/write them independently). **Reuse.**
- `logo_dark` / `logo_light` / `dark_logo` / `light_logo` / `logo_variant` / `branding_variant` / `theme_logo` / `media_variant`: **0 matches**. No existing variant mechanism.
- `media_category`: **0 matches** — category is only encoded in the storage `path` prefix (`assets/images/{category}/`), not a schema column.
- `favicon` upload category: none; `branding` is reused. No new category required.
- `rel="shortcut icon"`: 0 matches — only `rel="icon"` + `rel="apple-touch-icon"`.
- Legacy `favicon_url`/`logo_url` columns: exist but **unreachable** (media path wins). Safe to leave stale; cleaning is data-only.

**Conclusion:** No new mechanism is needed for favicon independence. For the logo, no variant mechanism exists to reuse — Option C would be genuinely new schema.

## 7. Branding Consumer Map

**Logo consumers:**
| Consumer | Current source | Must remain logo-driven? | Affected by a logo change? |
|---|---|---|---|
| Header `.logo-dark` / `.logo-light` | `branding-init.updateLogos(resolved_logo_url)` | Yes | Yes |
| Footer `.logo-dark` / `.logo-light` | `branding-init.updateLogos(...)` (4 elements) | Yes | Yes |
| `<link rel="icon">` | `branding-init.updateFavicon(resolved_favicon_url)` (+ `business-config` rewrite) | **Favicon** (decoupled → no) | No, **if** favicon decoupled first |
| `<link rel="apple-touch-icon">` | `branding-init.updateFavicon(resolved_favicon_url)` (fallback: `apple-touch-icon.webp`) | Favicon-derived | No, **if** decoupled; else yes (R1) |
| `<meta property="og:image">` | `branding-init.updateOGImage(logoUrl)` (static: `og-image.webp`, overwritten at runtime) | Logo-driven by design | **Yes (R1)** |
| `<meta name="twitter:image">` | `branding-init.updateOGImage(logoUrl)` (static overwrrtten) | Logo-driven by design | **Yes (R1)** |
| JSON-LD `image`/`logo` | `branding-init.updateJSONLD(logoUrl)` **and** `content-loader.generateJSONLD` L1299 (`schema.logo`) | Logo-driven by design | **Yes (R1)** |
| `background-media-warmer` | `logo_media_id` (`background-media-warmer.js:239`) | Logo | Yes |
| `BusinessConfig.logo.{dark,light}` | `resolved_logo_url \|\| fallback` (`business-config.js:118-120`) | Yes (fallback layer) | Yes |

**Favicon consumers:**
| Consumer | Source | Affected by favicon change? |
|---|---|---|
| `<link rel="icon">` | `resolved_favicon_url` (branding-init + business-config) | Yes (intended) |
| `<link rel="apple-touch-icon">` | `resolved_favicon_url` (branding-init) | Yes (currently = logo; decouple to change) |
| `background-media-warmer` | `favicon_media_id` | Yes (intended) |

**Takeaway:** The logo is over-fanned into SEO/social/JSON-LD (R1). The favicon is **not** over-fanned — decoupling it first means future logo edits stop cascading into the favicon and `apple-touch-icon`.

## 8. Proposed Target Architecture

```
                     ADMIN
                       |
          ┌────────────┴────────────┐
          |                          |
        LOGO                      FAVICON
          |                          |
    logo_media_id            favicon_media_id   (independent FK columns — already exist)
          |                          |
          ▼                          ▼
     media_assets                media_assets   (same registry; path prefix = branding)
          |                          |
          ▼                          ▼
      public_url                  public_url   (Supabase Storage /public-assets)
          |                          |
          ▼                          ▼
   LOGO RESOLVER              FAVICON RESOLVER
   (BusinessRepository)       (BusinessRepository)
          |                          |
     ┌────┴────┐                  ┌───┴───┐
     ▼         ▼                  ▼       ▼
 dark logo  light logo      rel=icon  rel=apple-touch-icon
 .logo-dark  .logo-light   (single writer: branding-init)
```

Two tracks: **Favicon** (Objective 1) is already architecturally possible with **zero schema change** — assign a distinct media asset to `favicon_media_id`. **Logo** (Objective 2) requires either **Option A** (replace the logo asset — media change) or **Option C** (add variant columns — schema migration). No zero-change fix exists for the two-slot logo contract.

## 9. Exact File-Level Change Map

### 9.1 Objective 1 — Independent favicon
| Repository | File | Function | Current | Required | Why | Risk | Verification |
|---|---|---|---|---|---|---|---|
| Admin | (none) | "Edit Favicon" `ImageChangeDialog` | Writes `favicon_media_id` independently | **None** | Column + picker + PATCH route already independent | None (data only) | Assign distinct asset; confirm IDs differ |
| Admin | `processor.ts` + `upload/route.ts` | upload pipeline | Rejects `.ico`; forces WebP | **Only if `.ico` required** | True `.ico` support | Validation widening | Upload `.ico`; row mime `image/x-icon`, `*.ico` |
| Public | `assets/js/branding-init.js` | `updateFavicon` | Sets icon + apple-touch | (Reconcile) keep as sole writer | R7 | Drift removed | grep writers = 1 |
| Public | `assets/js/business-config.js` | `initBusinessConfig` | Also writes `link[rel=icon"]` | (Reconcile) remove the write | R7 | Same | grep writers = 1 |
| Public | `assets/js/shared-components.js` | `applyFavicon`/`ensureFavicon` | Fallback icon = `logo.webp` | Lower static fallback to a local favicon image | Pre-JS correctness | None | href resolves pre-JS |
| DB | `business_settings` | `favicon_media_id` | Aliased to logo row | Repoint to a dedicated small image row | Independence | Legacy `favicon_url` stale (unreached) | `≠ logo_media_id`, both valid |

### 9.2 Objective 2 — Option A (transparent)
| Repo | File | Change | Why | Risk | Verification |
|---|---|---|---|---|---|
| Admin | (none) | Upload transparent logo via "Edit Logo" | Single asset, both themes | OG/JSON-LD ripple (R1) | og:image + JSON-LD = new logo |
| DB | `business_settings.logo_media_id` | Repoint to transparent-logo row | Asset change | Affects all logo consumers | All 10 routes, dark+light |
| Public | **none** (slot already two-variant) | No code change | branding-init pushes single URL; CSS swaps | None | — |

### 9.3 Objective 2 — Option C (variants)
| Repo | File | Change | Why | Risk | Verification |
|---|---|---|---|---|---|
| DB | migration | add `logo_dark_media_id`/`logo_light_media_id` (nullable uuid→media_assets, ON DELETE SET NULL) | Two-theme authority | New columns (additive) | `\d business_settings` shows new cols |
| Admin | `src/db/schema.ts` | add `logoDarkMediaId`/`logoLightMediaId` | Type parity | tsc | `tsc --noEmit`=0 |
| Admin | `repository.ts` / `mapping.ts` | allowlist + map new columns | Read/write | None | Admin reads/writes cols |
| Admin | branding `route.ts` (PATCH + GET) | accept + resolve new keys | Authority | None | PATCH updates; GET returns |
| Admin | `settings-view.tsx` | two logo pickers (dark/light) | Author two variants | UI scope | pickers map to correct columns |
| Public | `BusinessRepository.js` | resolve two URLs, fallback to `logo_media_id` | Two URLs | Resolver logic | JS returns two URLs |
| Public | `branding-init.js` | fan dark→`.logo-dark`, light→`.logo-light` | Fix defect | Fan-out (decouple favicon first) | 4 slots correct |
| Public | `business-config.js` | two logo URLs (stop collapse L118-120) | Stop collapse | None | config reflects two |
| Public | `shared-components.js` | keep two-slot fallback (already present) | None | None | — |

## 10. Exact DB / Schema Changes Required

**Favicon:** **NONE.** `favicon_media_id` already exists as an independent FK (`schema.ts:82`). Independence = data edit only.

**Logo:**
- Option A: **NONE** (data-only repoint of `logo_media_id`).
- Option C: **ONE** additive statement:
  ```sql
  ALTER TABLE business_settings
    ADD COLUMN IF NOT EXISTS logo_dark_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS logo_light_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL;
  ```
  Backward compatible (nullable; resolvers fall back to `logo_media_id`).

**Legacy cleanup (optional, non-required):** `logo_url`/`favicon_url` stale but unreachable. Data-only cleanup.

## 11. Exact Admin UI Changes Required

**Favicon:** None for independence. **If `.ico` required:** extend `ImageChangeDialog`/`processor.ts`/`upload/route.ts` (§9.1).
**Logo:** None (Option A) / two pickers + variant handling (Option C).

## 12. Exact Media / Storage Changes Required

**Favicon:** Upload/select a small (64–128px) PNG/WebP favicon via `branding` category into `public-assets/images/branding/`. No `.ico` unless pipeline changed (§9.1). No new bucket/category.
**Logo:** Option A — new transparent brand mark (cannot reuse `logo-white.webp`; invisible on dark). Option C — two new rows.

## 13. Backward Compatibility

**Favicon:** Repointing `favicon_media_id` leaves legacy `favicon_url = /favicon.ico` stale but unreached (media path wins). If favicon media missing → `resolveImageUrls` returns null → `branding-init` skips `updateFavicon` (the `if (faviconUrl)` guard L69) → static fallback remains; no 404. `ON DELETE SET NULL` nulls FK safely.

**Logo:** Same guard (`if (logoUrl)` L60). If `logo_media_id` null/unresolvable → header/footer keep local `logo.webp`/`logo-white.webp` fallbacks. OG/Twitter/JSON-LD keep static `og-image.webp`/JSON-LD values rather than blanking — acceptable degradation.

**Stale legacy `favicon_url=/favicon.ico` / `logo_url=/.../logo.webp`:** harmless (never read when media path resolves).

## 14. Risks

- **R1** — Logo→favicon/SEO coupling: replacing the logo rewires og:image, twitter:image, JSON-LD image, and (while coupled) apple-touch-icon. Decouple favicon first to isolate apple-touch.
- **R2** — `.ico` MIME/upload: pipeline rejects `image/x-icon`; forces WebP. Use PNG/WebP favicon (browser-native).
- **R3** — Transparent logo appearance: must be legible on both `#0a0a0a` and `#f5f5f5`; current assets do not satisfy both. Requires a new brand asset.
- **R4** — Frontend-only fallback (Option B): violates DB authority. Rejected.
- **R5** — New schema fields (Option C): additive and non-breaking, but broadest change.
- **R6** — Stale legacy fields: `favicon_url=/favicon.ico`, `media_assets` 1920×1080 vs actual 1251×1251. Unreached; optional data-only cleanup.
- **R7** — Multiple favicon writers: `branding-init` + `business-config` both write `link[rel=icon"`. Reconcile to one.
- **R8** — Header/footer structural: must NOT be rebuilt. Options A/C touch only `branding-init.js`, `business-config.js`, `BusinessRepository.js`, Admin pickers — not shell markup. ✅

## 15. Verification Plan (post-approval)

**Admin:**
1. Open Settings → Branding. "Edit Favicon" picker shows the same media list; select/assign a distinct favicon asset. Save.
2. (Option C) "Edit Logo" exposes two pickers (dark/light), each resolving to a different `media_assets` row.
3. Confirm `favicon_media_id ≠ logo_media_id` (and ≠ `logo_dark/light_media_id` when Option C) by inspecting the saved `business_settings` row.

**Database:**
1. `SELECT logo_media_id, favicon_media_id, logo_dark_media_id, logo_light_media_id, logo_url, favicon_url FROM business_settings;` — confirm independence; both media ids join to valid `media_assets`.
2. Confirm favicon row `mime_type` is a served type (`image/webp` or `image/png`).

**Public runtime (all 10 real routes):**
- Dark + Light: logo visible, correct variant (dark slot = dark asset; light slot = light asset), favicon = dedicated favicon asset.
- Toggle dark→light / light→dark, then reload in each state; confirm slots do not regress to the wrong asset.
- Network: logo HTTP 200, favicon HTTP 200, no branding 404, no raw Storage URL leak bypassing `media_assets`.

**Metadata (confirm each asset used):**
- `<link rel="icon">` → favicon asset; `<link rel="apple-touch-icon">` → favicon asset (or dedicated).
- `<meta property="og:image">` and `<meta name="twitter:image">` → logo asset (verify no silent regression to stale `og-image.webp`).
- JSON-LD `image`/`logo` → logo asset.
- Console: `✅ Logo canonicalized`, `✅ Favicon canonicalized`, `Updated 4 logo elements`, `hasResolvedLogo: true`, `hasResolvedFavicon: true`.

**Writer reconciliation (R7):** grep source for `link[rel="icon"]` writers → expect exactly one creator (`ensureFavicon`) + one canonicalizer (`branding-init`); `business-config.js` must no longer write `link[rel="icon"]`.

## 16. Implementation Order

1. **Objective 1 first (favicon independence)** — decouples logo from favicon/fan-out. Data-only (assign dedicated favicon asset) + reconcile the duplicate writer.
2. **Objective 2 (logo)** — choose Option A or C per the decision gates; implement; re-run §15 matrix.
3. **Verification** — run §15 matrix; gate sign-off on all 10 routes + metadata.

## 17. Decision Gates

- **G1:** ✅ `favicon_media_id` already supports an independent favicon **without schema change** — independent FK column (`schema.ts:82`); current coupling is a data aliasing.
- **G2:** ⚠️ Admin picker/API **cannot upload `.ico`** (pipeline rejects `image/x-icon`; forces WebP). It can *select* an existing `media_assets` row whose `mime_type` is `image/x-icon` (PATCH accepts `image/*`), but the upload pipeline cannot *create* such a row.
- **G3:** ✅ `.ico` can live in `media_assets` (`mime_type` is free text), but the upload pipeline prevents it. Recommend PNG/WebP favicon (no pipeline change).
- **G4:** ⚠️ One transparent logo renders both themes (slots exist), but no suitable transparent-on-both-themes asset exists, and replacing the logo ripples to OG/JSON-LD/apple-touch (R1). Requires media change + approval.
- **G5:** ✅ Yes — replacing the logo affects og:image, twitter:image, JSON-LD image, background-warmer, and (while coupled) apple-touch-icon.
- **G6:** ⚠️ Not strictly necessary **if** a single transparent brand mark is acceptable on both themes (Option A); **necessary** if two distinct logos are required (Option C).
- **G7:** ✅ OG/Twitter image and JSON-LD image are coupled to the logo (by `branding-init` + `content-loader`); apple-touch-icon is favicon-coupled. By-design couplings to account for.
- **G8:** ✅ Yes — `branding-init.updateFavicon` and `business-config.initBusinessConfig` both write `link[rel=icon"]`; reconcile to one writer.
- **G9:** ✅ Smallest durable fix: (1) favicon — dedicate a media asset to `favicon_media_id` (no schema/code change + writer reconciliation); (2) logo — Option A or C per decision.
- **G10:** ⚠️ Requires explicit approval: any **schema migration** (Option C); **replacing the canonical logo media asset** (Option A); **upload-pipeline source changes** for `.ico`; **removing the duplicate favicon writer** (runtime change).

### Critical Stop Condition
Investigation reached changes the stop condition flags:
1. **Favicon `.ico` support** — requires source changes to `processor.ts`/`upload/route.ts`. **DECISION REQUIRED.** (Not required if WebP/PNG favicon is accepted.)
2. **Logo dark/light** — Option A requires **replacing a stored media asset** (DECISION REQUIRED); Option C requires a **schema migration** (DECISION REQUIRED). No zero-change fix exists for the two-slot contract.

**Therefore: STOP — DECISION REQUIRED.** This document is the plan; no source/DB/storage changes are made.

## 18. Recommended Surgical Implementation

1. **Favicon independence (no schema change — implementable after approval):**
   - Upload/select a small (64–128px) PNG/WebP favicon via the existing **"Edit Favicon"** picker (category `branding`).
   - Assign it to `favicon_media_id` via `PATCH /api/admin/business-settings/branding`.
   - Confirm `favicon_media_id ≠ logo_media_id`; `/` serves `link[rel=icon"]` → the new favicon with HTTP 200.
   - Reconcile writers: make `branding-init.js updateFavicon` the **sole** writer of `link[rel=icon"]` (remove the write from `business-config.js`); keep it writing `apple-touch-icon` too.
   - Lower the `ensureFavicon` **static fallback** for `rel=icon"` to a local favicon image so pre-JS isn't the 1251×1251 logo.
   - (Defer `.ico` unless legacy coverage is mandated.)

2. **Logo dark/light (DECISION REQUIRED first):**
   - **If the brand accepts one transparent logo:** Option A — author a transparent logo legible on `#0a0a0a` + `#f5f5f5`, upload via "Edit Logo", repoint `logo_media_id`. (Complete §1 first to isolate favicon.)
   - **If the brand requires two distinct logos:** Option C — add `logo_dark_media_id`/`logo_light_media_id` (additive migration) + Admin/resolver/init wiring.

3. **Do not ship Option B** (frontend-only light fallback) — it breaks DB authority.

---

## Final Summary

```
PLAN STATUS:          READ-ONLY PLAN — awaiting approval (no changes made)
FAVICON INDEPENDENCE:  POSSIBLE WITHOUT SCHEMA CHANGE (data + writer reconciliation)
LOGO DARK/LIGHT:       REQUIRES DECISION — Option A (asset replace) or Option C (schema migration)
SCHEMA CHANGE:         NONE for favicon; REQUIRED only if Option C approved
ADMIN CHANGE:          NONE for favicon independence; UI changes only if Option C or .ico required
PUBLIC CHANGE:         Writer reconciliation (R7) + (Option A: none / Option C: init logic)
MEDIA CHANGE:          Dedicated favicon asset assignment; (Option A: new transparent logo asset)
DATABASE DATA CHANGE:  favicon_media_id repointed (data-only); (Option C: 2 new NULL columns)
MAIN RISK:             R1 — logo change fans into og:image/twitter:image/JSON-LD/apple-touch-icon
SMALLEST DURABLE FIX:  (1) decouple favicon (data + drop duplicate writer); (2) Option A or C for logo per decision
DECISION REQUIRED:     (a) Option A vs Option C for logo; (b) whether .ico is truly required; (c) approve logo media replacement (A) or schema migration (C)
```








