# Public Website (Verified 2026-10-18)

The public site is a **zero-build static web app**: plain HTML + one compiled
CSS bundle + vanilla-JS "ZT Operating System" namespace talking to Supabase
with the anon key, falling back to static config files when the DB is empty.

## Page inventory (17 HTML files)

| Page | DB `page_key` | Notes |
|------|---------------|-------|
| `index.html` | `home` | ~23 sections; 13 JS modules incl. hero/slider/branding/theme/membership-view |
| `pages/experiences/restaurant.html` | `restaurant` | 4 hero slides, menu + booking |
| `pages/experiences/restaurant-menu.html` | `restaurant-menu` | tabbed menu |
| `pages/experiences/lounge.html` | `lounge` | 2 slides, services + gallery + testimonials |
| `pages/experiences/vip.html` | `vip` | 2 slides, packages + FAQ |
| `pages/business/events.html` | `events` | booking (event_date variant) |
| `pages/business/conference.html` | `conference` | booking (event_date variant) |
| `pages/business/autospa.html` | (autospa) | ⚠️ missing from nav + sitemap; `services` has 1 matching row |
| `pages/business/grooming-care.html` | `grooming-care` | category grids — 8 categories seeded, 5 categorized service rows live (see SERVICES.md) |
| `pages/business/barber.html` / `spa.html` | `barbershop` / `spa` | legacy/alternate; ⚠️ those page keys were **removed** from `website_pages` (9 rows as of 2026-10-18) → PageResolver `missing-page-record`, static fallback |
| `pages/contact/contact.html` | `contact` | form writes `contact_messages` (anon INSERT) |
| `pages/contact/gallery.html` | — | gallery grid, media-gateway compliant |
| `pages/home/` + `pages/restaurant/` + test page | — | legacy/auxiliary |
| `404.html` | — | static |

## Runtime architecture

1. **Config:** `assets/js/config/env.js` (prod/preview switch) +
   `supabase.config.js` (anon credentials, `TABLES` object, `tables.*` map of
   ~30 logical names; ⚠️ dead entries: `serviceCards`, `brandingSettings`,
   `seoSettings` point at nonexistent tables; `google_*` fallbacks differ from
   production names).
2. **Client:** lazy `lib/supabase.js` → `SupabaseClient.getClient()`.
3. **Data:** 14 repository modules (Repository pattern; `BaseRepository`
   caching; contract headers — see `ARCHITECTURE.md` §6).
4. **Page identity:** `PageResolver` (UUID gating; see `CMS.md`).
5. **Media:** `MediaResolver` exclusive gateway (see `MEDIA.md`).
6. **Orchestration:** `content-loader.js` `populate*` functions on
   DOMContentLoaded, fail-open philosophy.
7. **Static fallbacks:** 11 `assets/js/*.config.js` files (`window.*Config`)
   keep pages alive when Supabase is unreachable; loaded with `defer` **after**
   the repositories, **before** `content-loader.js`.
8. **Forms:** `forms.js` + `form-core` (booking via
   `BookingRepository.insert()` → `customers` + `bookings` anon inserts with
   client-generated `booking_number` `ZT-XXXXXXXX`; contact via
   `contact_messages`). Success/failure UI contracts in `forms.css`.
9. **Chrome:** `navigation.js` (desktop drawer + mobile sheet + header shrink +
   active states; 14 nav hrefs — autospa absent), `shared-components.js`,
   `theme-init.js`/`theme.js` (dark default + persisted toggle),
   `slider.js` (hero, `window.HERO_*` event contract, 5s autoplay, pause on
   hover/hidden), `branding-init.js` (logo DOM contract), `menu-nav.js`,
   `gallery.js`, `membership-view.js`, `background-media-warper.js`,
   `asset-url.js`, `seo-meta.js`.

## Dead / hazardous code

- **`assets/js/legacy/booking.js` (593 lines):** duplicate of
  `repositories/booking.js`; referenced by NO current page. Deprecation
  recommended.
- **Git ghost filenames:** broken shell redirections left tracked junk files
  (`autospa.html .html`, `2026-10-04…png .png`); safe to `git rm` in a chore
  commit.
- **Root `package.json` `"main": "phase3c_audit.js"`:** file does not exist.

## SEO / crawler surface

- `robots.txt` ✅; `sitemap.xml` lists 13 URLs (drift: 16 pages; autospa missing).
- Titles/descriptions: static `seo.config.js` (see `CMS.md` for the drift).
- `schema.json` (Restaurant JSON-LD) + inline JSON-LD via BusinessService.

## Tests

`tests/`: `website-media-gateway.spec.js`, `admin-media-gateway.spec.js`,
`membership-section.spec.js`, `website-ux.spec.js` — Playwright, root `npm
test`. Legacy artifacts (`test-results/`, `playwright-report/`, `.auth/`) are
gitignored.

## Deployment contract (SETUP.md, verified)

Static host + two env vars (`NEXT_PUBLIC_SUPABASE_URL/ANON_KEY`) injected at
deploy time via `window.__SUPABASE_CONFIG`; `.env.example` exists at root and in
`zt-lounge-admin/` (both verified present).
