# PUBLIC LOGO DARK/LIGHT DECISION AUDIT
**Purpose:** Read-only audit (Option A vs Option B). **No fixes implemented.** No source/DB/schema/migration/storage/`.env`/config/media was created/modified/deleted/renamed. No `git reset/stash/checkout/commit`.
**Scope:** public `zt-lounge` (branch `feature/membership-tiers-staging-phase1` @ `905bd7a`) + canonical admin `zt-lounge-admin` (`clean-rebuild` @ `876b185`). Canonical Supabase: `jczwilrysvnhcjzjztbi` → `https://jczwilrysvnhcjzjztbi.supabase.co`. Nested `zt-lounge/zt-lounge-admin/.next` ignored.
**Method:** file reads + read-only SQL (`supabase-js` service_role from canonical `zt-lounge-admin/.env.local`, keys never echoed) + `sharp` byte/pixel + Playwright headless (chromium 1243) on a local `python -m http.server`.
**Recorded blockers:** public-repo-wide `git grep` times out (300s, ×2) due to a tracked nested `zt-lounge-admin/.next` (BLOCKED for repo-wide grep) — workaround: scoped `git grep -- 'assets'/'src'` + direct file reads; all conclusions still verified. Screenshots are PNG-only (not inline) → DOM-state JSON is the authoritative runtime evidence (`%TEMP%\ztlogo_runtime\*.png`). Artwork legibility on a background = DEFERRED to owner (luminance proxy given).

## 1. Baseline — VERIFIED
Favicon already fixed & decoupled (prior work, baseline): `favicon.ico` in bucket `favicons` (4-entry ICO, `image/x-icon`, 13697B, sha `cebbc969…`). DB `favicon_media_id (032f8b83) ≠ logo_media_id (a5fb7148)` → not aliased. Static `index.html` has **no** `<link rel="icon">` (runtime-injected); `apple-touch-icon` written by `shared-components.js` as `image/webp` (HARD RULE 2).

## 2. Current DB state — VERIFIED (live canonical, read-only)
`business_settings` columns: `id, business_name, email, phone, address, google_maps_url, whatsapp, facebook, instagram, opening_hours, logo_url, favicon_url, timezone, currency, created_at, updated_at, tagline, description, twitter, youtube, city, country, latitude, longitude, logo_media_id, favicon_media_id, google_review_url`. → **`logo_light_media_id` ABSENT**.
Row id=1: `logo_media_id=a5fb7148…`→`logos/logo.webp`; `favicon_media_id=032f8b83…`→`favicons/favicon.ico`; legacy `logo_url=…/logos/logo.webp`; `favicon_url=…/favicons/favicon.ico`; `updated_at=2026-10-03T09:41:26Z`.
logo media_asset: bucket=`logos`, path=`logo.webp`, mime=`image/webp`, **DB `width/height=1920×1080`, `file_size=NULL`, `content_hash=NULL` — INACCURATE** (actual file 1251×1251, see §3). favicon media_asset: bucket=`favicons`, mime=`image/x-icon`, 13697B, 256×256, hash `cebbc969…`. `…/logos/logo-white.webp`→HTTP 400 (absent). Total `media_assets`=51; transparency scan empty.

## 3. Current asset state — VERIFIED (sharp + live fetch)
| asset | bytes | sha | dims | ch | alpha% | meanRGB | colorway |
|---|---|---|---|---|---|---|---|
| `logos/logo.webp` (rendered) | 16114 | a42eabf4 | 1251×1251 | 3 | 0.00 | 12,12,9 | DARK |
| `branding/logo.webp` (fallback) | 16114 | a42eabf4 | 1251×1251 | 3 | 0.00 | 12,12,9 | DARK (identical) |
| `logo-white.webp` (fallback) | 14496 | 2fbf28 | 1251×1251 | 3 | 0.00 | 247,247,244 | LIGHT/WHITE |
| `logo-opt.webp` | 15410 | 4403f8 | 1251×1251 | 3 | 0.00 | ~132 | grey |
| `logo-white-opt.webp` | 14044 | 05702c | 1251×1251 | 3 | 0.00 | ~247 | WHITE |
| `apple-touch-icon.webp` | 16114 | a42eabf4 | 1251×1251 | 3 | 0.00 | 12,12,9 | DARK (== logo.webp) |
| `public-assets/2480ca41.webp` | 10082 | fdab2c5e | 800×800 | 3 | 0.00 | ~84 | dark/grey |
| `public-assets/94245887.webp` | 9174 | 600d4371 | 800×800 | 3 | 0.00 | 255,255,255 | WHITE |
→ **No transparent logo asset exists anywhere** (all `channels=3`, `hasAlpha=false`, `alpha%=0.00`; not filename-inferred). Luminance proxy (WCAG): dark colorway L≈11.8 — HIGH vs white header (L=245, ratio≈20.7), LOW vs dark header `#0a0a0a` (L=10, ratio≈1.18). Light colorway L≈247.1 — HIGH vs dark header (ratio≈24.6), low vs white (ratio≈0.99). Fine legibility = DEFERRED to owner. favicon.ico: 4 entries {16×16,32×32,48×48,256×256}, sha `cebbc969…`.

## 4. Current public authority chain — VERIFIED
`index.html`: `theme-color #0a0a0a/#f5f5f5`; `og:image`/`twitter:image`=static `og-image.webp`; two JSON-LD (`image=""`, `hero-restaurant.webp`); **no static favicon link**; `<script src="shared-components.js" data-features="membership">`. `shared-components.js` `headerHTML()`: `.logo-dark.site-logo` src=`BRAND.logoFallback`(=`…/public-assets/assets/images/branding/logo.webp`); `.logo-light.site-logo` src=`BRAND.logoLightFallback`(=`…/logo-white.webp`); `applyFavicon()` writes ONLY `apple-touch-icon` (`image/webp`); `fillEmptyOgImages()` fills only empty og/twitter. GLOBAL_SCRIPTS order: asset-url→lib/supabase.js→env→supabase.config→BaseRepository→**business-config**→**BusinessRepository**→**branding-init**→…→content-loader→background-media-warmer. `BusinessRepository.resolveBranding()`: `resolveOne(logo_media_id, logo_url, 'resolved_logo_url')`→singleton (no light variant). `business-config.js` L118-122: `logo.dark = resolved_logo_url || …; logo.light = resolved_logo_url || …` → **collapse**. `branding-init.updateLogos()` L56,88-99: writes the single URL to BOTH `.logo-dark` & `.logo-light` (4 elements). Navbar CSS (37-41): `.logo-dark{block}/.logo-light{none}`; `.light-mode .logo-dark{none}/.logo-light{block}`. theme.css: `:root --header-bg=rgba(10,10,10,.92)`; `html.light-mode --header-bg=rgba(255,255,255,.95)`. No `logo.ts`/`logo-light.css` on active path (prior hypothesis absent).

## 5. Current Admin authority chain — VERIFIED
`schema.ts`: `logo_media_id`/`favicon_media_id` FK->`media_assets`; `logo_url`/`favicon_url`; **no `logo_light_media_id`**. PATCH `/api/admin/business-settings/branding`: accepts `{logo_media_id?, favicon_media_id?}`, validates exists + `image/`. GET `/api/branding`: returns single `{logoUrl,faviconUrl,businessName}`. `mapping.ts`: `business_settings` has NO field map (passthrough). `repository.ts` allowlist: `logo_media_id, favicon_media_id, logo_url, favicon_url` (no light). `settings-view.tsx`: two pickers (logo, favicon). `background-media-warmer.js`: `registerMedia({media_id:logo_media_id, image_url:resolved_logo_url},...,'branding')` (+ favicon).

## 6. Runtime evidence — VERIFIED
Playwright (localhost serve + live canonical DB): **dark** fresh -> `darkSrc=lightSrc=.../logos/logo.webp`, `darkVisible=block`, `lightVisible=none`; `headerBg=rgba(10,10,10,0.92)`; favicon=`.../favicons/favicon.ico` `image/x-icon`; `ogImage=twitterImage=jsonLdImage=.../logos/logo.webp`; natural 1251x1251. **light** (`zt-theme=light`+reload) -> `theme=light`, `darkVisible=none`, `lightVisible=block`, `lightSrc=.../logos/logo.webp` (dark colorway) on `headerBg=rgba(255,255,255,0.95)` (WHITE) = defect reproduced. Toggle back -> dark. Console: `Updated 4 logo elements`; `Logo canonicalized: .../logos/logo.webp`; `Favicon canonicalized: .../favicon.ico`. Screenshots: `%TEMP%\ztlogo_runtime\{dark_fresh,light,light_clean,light_toggle,dark2}.png`.

## 7. Confirmed root cause — VERIFIED
`resolveBranding()` resolves the single `logo_media_id`->single `resolved_logo_url`; `business-config` writes it to `logo.dark` AND `logo.light`; `branding-init.updateLogos()` writes it to BOTH `.logo-dark` & `.logo-light` (4 elements); CSS toggles display only. Light mode renders the dark colorway on the white header. DB has no `logo_light_media_id`; no transparent asset; static 2-URL fallback is overridden at runtime. Favicon decoupled (separate `favicon_media_id`+`favicons` bucket) — not re-coupled.

## 8. Option A — one transparent canonical logo
- Suitable existing transparent asset? **NO** (§3: all candidates channels=3, alpha 0.00%).
- New asset required? YES — a transparent, theme-agnostic logo legible on BOTH `#0a0a0a` (dark) and `#f5f5f5/#ffffff` (light) headers.
- Replace `logo_media_id` alone fixes both themes? YES — branding-init already writes the single logo URL to both `.logo-dark`/`.logo-light` (4 elements); a transparent asset renders on both via the existing CSS display toggle. **Zero code, zero schema.** Change = `UPDATE business_settings SET logo_media_id=<new_id> WHERE id=1` (Admin: upload -> Picker -> PATCH `{logo_media_id}`); NO source edits.
- Metadata/fan-out: unchanged (logo_media_id already feeds all 8 logo consumers, §11). og:image/twitter:image/JSON-LD also point to the new logo.
- Admin workflow already supported? YES (PATCH `/api/admin/business-settings/branding` + media picker + `ImageChangeDialog` accept `logo_media_id`).
- Migration? **NO.** Admin code changes? **NO.** Public code changes? **NO.**
- Risks: (1) the current dark colorway is near-invisible on the dark header (contrast 1.18) -> the asset MUST be re-authored as a dual-purpose mark (e.g., gold `var(--color-gold)` mono-color, or artwork carrying contrast on both `#0a0a0a` and `#ffffff`)) — this is asset re-authoring, not a transparency toggle; (2) transparent logo on default-white social cards; (3) DB logo row metadata unreliable (`file_size`/`content_hash` NULL, dims `1920x1080` vs actual `1251x1251`).
- Legibility verdict: depends on artwork -> **DEFERRED** to owner.
## 9. Option B — two DB-controlled theme logos (smallest additive = +1 column + light asset + wiring)
- **DB/Schema/Migration:** add nullable `logo_light_media_id uuid -> media_assets(id) ON DELETE SET NULL`; `src/db/schema.ts` add `logoLightMediaId`; `src/lib/repository.ts` add `logo_light_media_id` to the `business_settings` RESPONSE_ALLOWLIST.
- **Admin API:** PATCH `/api/admin/business-settings/branding` accept `logo_light_media_id` (+ image-mime validation `image/`); public GET `/api/branding` select `logo_light_media_id` + resolve via `resolveImageUrls` -> `logoLightUrl`.
- **Public JS:** `BusinessRepository.resolveBranding` add `resolveOne(logo_light_media_id, logo_url, 'resolved_logo_light_url')`; `business-config.js` set `logo.light = resolved_logo_light_url || resolved_logo_url || fallback.light`; `branding-init.js` `updateLogos` write `resolved_logo_url`->`.logo-dark`, `resolved_logo_light_url`->`.logo-light`; `background-media-warmer.js` register the light media.
- **Admin UI:** `src/features/settings/settings-view.tsx` add a second "Edit Light Logo" `ImageChangeDialog` + save handler -> PATCH `{logo_light_media_id}`. (`shared-components.js` `headerHTML`/`footerHTML` + `navbar.css` already expose two slots -> NO change.)
- **New asset:** a light-theme logo (reuse on-disk `logo-white.webp` uploaded to the `logos` bucket, or author a new colorway).
- **Fallback:** if `logo_light_media_id` null/unresolvable -> light slot falls back to `resolved_logo_url` (dark) so the light header still shows a visible logo.
- **OG/Twitter/JSON-LD:** theme-agnostic -> keep using `logo_media_id` (dark); document. **Favicon:** unchanged (decoupled).
- Migration required? **YES** (nullable FK, backward compatible). Admin code? **YES** (schema, PATCH route, Settings UI, allowlist). Public code? **YES** (branding API, BusinessRepository, business-config, branding-init, warmer). New asset? **YES** (light logo).
## 10. Comparison
| dimension | A | B |
|---|---|---|
| New schema/migration | NO | YES (`logo_light_media_id`) |
| Admin code changes | NO | YES (PATCH route, schema, Settings UI, allowlist) |
| Public code changes | NO | YES (branding API, BusinessRepository, business-config, branding-init, warmer) |
| New media asset | YES (transparent, dual-purpose) | YES (light colorway) |
| Preserves two-colorway design | NO | YES |
| Smallest change | YES (if single transparent mark OK) | smallest preserving two colorways |
## 11. Fan-out (logo_media_id ->) header `.logo-dark`, header `.logo-light`, footer `.logo-dark`, footer `.logo-light`, `og:image`, `twitter:image`, JSON-LD `image`, `background-media-warmer` (8 consumers). `favicon_media_id` -> `link[rel=icon]` + warmer(favicon) — DECOUPLED. `apple-touch-icon` (static webp) — DECOUPLED, never `.ico`. Changing `logo_media_id` updates all 8 logo consumers; never touches favicon/apple-touch.
## 12. Data/schema implications: A — none (reuse `logo_media_id`). B — +1 nullable FK `logo_light_media_id` -> `media_assets(id)` ON DELETE SET NULL; `media_assets` unchanged; backward compatible. (Migration NOT written — approval gate.)
## 13. Risks: A — dark colorway invisible on dark header (ratio 1.18) -> re-author dual-purpose mark; transparent-on-white social cards; stale DB logo metadata. B — production migration + blast radius (sync light/dark in warmer/cache; OG stays dark — doc'd); fallback required. Both: never alias favicon<->logo; never hardcode URLs; resolve via media_id chain.
## 14. Recommendation (architecture, not preference): **Option A is the smallest durable change** if the owner accepts a single theme-agnostic transparent logo (no schema/migration/code — only new asset + `logo_media_id` swap). **However**, the artwork is two colorways (dark L~11.8, light L~247.1) and the shell already has two slots + two fallback colorways -> architected for two logos; a single transparent logo can't be "dark-on-dark + light-on-light" (dark invisible on `#0a0a0a`, ratio 1.18). So if preserving the two-colorway design is required, **Option B is the only correct path**. Guidance: attempt **Option A first** (transparent dual-purpose logo -> set `logo_media_id`); escalate to **Option B** only if two distinct per-theme colorways must be retained (§9 list).
## 15. Approval gate — REQUIRES APPROVAL: No fix in this task. Before any change: (1) owner selects **A** or **B**; (2) provide/art-direct asset (transparent dual-purpose for A; light colorway for B); (3) for B approve `logo_light_media_id` schema+migration + §9 change list. Re-audit after implementation.
<!--CHUNK3_END-->