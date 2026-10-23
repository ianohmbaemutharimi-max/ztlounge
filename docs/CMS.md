# CMS Mini-System (Verified 2026-10-18)

The CMS is not a page-builder: it is a **page registry** (`website_pages`) plus a
**resolver/orchestrator layer** in the vanilla-JS site that keys every content
table to a canonical page.

## Tables

- **`website_pages`** — 9 live rows as of 2026-10-18 (12 at audit time;
  `restaurant-menu`, `barbershop`, `spa` removed and `gallery` added during
  out-of-band work). Canonical page keys (production):
  `home, restaurant, events, lounge, vip, conference, contact, grooming-care,
  gallery`. Columns include `meta_title`, `meta_description` and the
  Phase-2C section toggles `service_cards_enabled` /
  `service_packages_enabled` (migration `043`; `PageResolver`'s projection
  fallback degrades gracefully if absent).
- **Content tables keyed by `page_id` (UUID FK):** hero_slides, gallery, faqs,
  promotions, services, testimonials*, menu_*.
  (*) live `testimonials` currently exposes **no `page_id`** column.
- **History:** `026_seed_cms_content.sql` created the initial rows; `027` aligned
  the schema; `043` added per-page section toggles.

## PageResolver — the canonical page contract

`assets/js/repositories/PageResolver.js` (verified against header):

- **The only** component allowed to convert a page key → `website_pages` UUID.
- Five explicit states, never collapsed to silent `[]`:
  `resolved` | `missing-page-record` | `invalid-page` | `dependency-missing` | `db-error`.
- Per-document caching (`cache`, `inFlight`, `byIdCache`); no timeouts.
- Projection fallback: queries Phase-2C columns
  (`id,page_key,title,service_cards_enabled,service_packages_enabled`); if `043`
  isn't applied, retries with the legacy projection (`id,page_key,title`) so
  toggles default ON.
- **Outbound direction:** `resolvePageKeysByIds()` maps
  `website_pages.id → page_key` (e.g. `promotions.page_id` → public page name).

## content-loader orchestrator

`assets/js/content-loader.js` (~15 `populate*` functions) runs on DOMContentLoaded:
hero, service cards (+by category), packages, gallery, menu, FAQ, testimonials,
promotions, membership, business info/hours, Google-review link, JSON-LD. The
standing rule is **fail-open**: any resolver failure renders sections with
static/default content rather than hiding them.

## SEO drift (important)

- Public `<title>`/description come from the **static** `assets/js/seo.config.js`
  via `SEORepository` (`window.SeoConfig[pageId]`) — verified: only 2 references,
  both config-side.
- `website_pages.meta_title` / `meta_description` are therefore **admin-facing
  data that the public site never reads**. SEO on the public site is not
  DB-driven despite the columns existing.

## Admin

`website_pages` is a full admin resource (create/read/update/delete, sort) under
the service_role/`POSTGRES_MAGIC` elevation. The admin's resource-config maps the
table's real columns.

## Contract verdict

| Item | Status |
|------|--------|
| PageResolver header == implementation | ✅ |
| Fail-open section gating | ✅ verified in code paths |
| `website_pages` public read tier | ✅ 12 rows anon |
| Public SEO driven by CMS columns | ❌ static `seo.config.js` wins; DB columns unused publicly |
| Toggle columns live | ⚠️ unverified (network); code tolerates absence |
