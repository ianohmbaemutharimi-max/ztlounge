# Business Settings & Branding Mini-System (Verified 2026-10-18)

## Declared contract (`BusinessRepository.js` header)

- `getAll()` / `getSettings()` / `getBusinessInfo()` / `updateSettings()` (admin-ready)
- Data source: Supabase `business_settings` with local config fallback.

## Implementation (verified — all four methods exist)

- `getAll()` reads **one row** (`limit: 1`), maps to canonical snake_case with
  camelCase aliases (`businessName`, `hours`, `logo`…), then calls
  `resolveMediaIds()` which resolves `logo_media_id` / `logo_light_media_id` /
  `favicon_media_id` through `MediaResolver` into `resolved_logo_url` /
  `resolved_logo_light_url` / `resolved_favicon_url`. Media failure keeps the
  branding fallbacks (catch-and-keep). Static fallback: `business-config.js`
  (`window.BusinessConfig`) on empty result or query error.
- `getSettings()` = alias of `getAll()`; `getBusinessInfo()` projects a contact
  subset; `updateSettings()` performs an authenticated update path (admin-ready,
  anon blocked by RLS).

## Live production state (anon-verified)

- Single row (id `5da16a48-…`): ZT Lounge Meru, +254 143 542 601,
  ztloungemeru@gmail.com, Opposite Ezri Hotel Milimani Meru, lat/long
  0.047567/37.6822, socials fb/ig/x/yt, whatsapp, google maps + review URLs,
  7-entry opening_hours, and the three `*_media_id` branding FKs.
- **Branding contract verified live:** `logo_media_id → logo-dark.png`,
  `logo_light_media_id → logo-light.png`, `favicon_media_id → favicon.png`;
  `media_assets.public_url` values already correct (no `/storage/v1` prefix), so
  the resolver passes them through unchanged and `branding-init.js` applies
  `.logo-dark.site-logo` / `.logo-light.site-logo` / favicon per its documented
  DOM contract.

## Consumption

- `services/BusinessService.js` (loaded on every page): `getBusiness`,
  `getContact`, `getHours`, `getTrust`, JSON-LD generation — used by
  `content-loader.js` (footer business info, hours, Google-review link) and
  `membership-view.js`.
- `contact.config.js` / `seo.config.js` hold **static duplicates** of contact
  fields (see `CMS.md` for the SEO drift).

## Drift / findings

| Item | Status |
|------|--------|
| Header == exports | ✅ |
| Branding media resolution end-to-end | ✅ live-verified |
| `updateSettings` anon blocked | ✅ (RLS; untested write) |
| `supabase.config.js` `brandingSettings: 'branding_settings'` | ❌ table does not exist — dead registry entry |
| `google_review_settings` fallback name in config | ⚠️ production table is `google_review_settings`? — production has `google_reviews`/`google_review_settings` per admin; **service_role-only**, needs key dump to confirm |
| Static `contact.config.js` vs DB contact fields | ⚠️ duplication; DB is authoritative for branding, static for contact page hero |
