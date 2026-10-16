# ZT LOUNGE — PUBLIC BUSINESS DATA SOURCE-OF-TRUTH AUDIT

> READ-ONLY audit. No application source, schema, rows, migrations, config, seed,
> or content were modified. No server was started/stopped/reconfigured. No
> business data was created. `supabase db push` was not run. The pre-existing
> dirty worktree was preserved. Only this report (and transient read-only query
> output written to the OS temp directory, outside the repo) were produced.

## 1. Executive Summary

The public ZT Lounge site is an **unbuilt static HTML/CSS/JS application** served
from `http://localhost:8000` (workspace `d:\zt lounge\zt-lounge-demo\zt-lounge`).
Its business data is loaded at runtime in the browser from the canonical Supabase
project `jczwilrysvnhcjzjztbi` through a repository → resolver → renderer chain
(`BaseRepository → PageResolver → MediaResolver → *Repository → content-loader.js
→ DOM`).

Key conclusions, each backed by source + live-DB + browser evidence:

- **Canonical dynamic categories are genuinely DB-driven at runtime**: services,
  service charges/packages, hero slides, gallery, menu, membership plans +
  benefits, promotions, business/contact info, page toggles, and booking charges.
  Confirmed in source and by observing live browser DOM values that match live DB
  rows (home, conference, vip, restaurant-menu, gallery, grooming-care).
- **Static fallbacks exist for nearly every dynamic category** (business-config,
  contact.config, gallery.config, menu.config, services.config, booking.config,
  faq.config, seo.config, and baked HTML). Most are documented intentional
  presentation fallbacks or are overwritten by hydration at runtime. A few are
  **not** overwritten and therefore remain displayed business content.
- **Real findings are narrow and specific** (not "everything is hardcoded"):
  - `P2` — **Lounge signature-cocktail prices are hardcoded** in
    `pages/experiences/lounge.html` ("From KES 1,200 / 1,500 / 2,000 / 800") with
    no `data-*` hook; browser-verified as static (no DB request drives them).
  - `P2` — **Curated service/feature card grids on internal pages are hardcoded
    HTML** (e.g. `conference.html` "Boardroom/Training Room/…"; `vip.html`
    "Private Entrance/…") and are intentionally **not** replaced by the DB path
    (page-specific grid classes). Curated marketing content, but also business
    facts (offerings) duplicated outside the CMS.
  - `P2` — **Duplicate business contact data** (phone/email/address/hours), a
    Supabase Storage logo URL, Google Maps URL, and social links exist in
    `business-config.js` FALLBACK_CONFIG, `contact.config.js`,
    `shared-components.js` CONTACT, `membership-view.js`, and baked JSON-LD /
    footer HTML. Most are overwritten by `populateBusinessInfo()`, but several
    are **not** (see §16).
  - `P2` — The **contact page gallery-preview** retains baked hardcoded
    `public-assets/images/gallery/*` images (browser-verified) because the
    homepage-preview hydrator only runs on `/`.
  - `P3` — The live **`services` table contains obvious test/e2e fixture rows**
    (`Restaurant` description "ZT BLACKBOX DESCRIPTION 1788269588211",
    price 7777.00; `Classic Haircut` "(E2E 204-contract fixture)"). Served by the
    DB, not source — a data-quality issue, not a source-of-truth defect.
  - `P3` — Stray/inert artifacts in the repo root: `$null` (27 KB untracked HTML
    copy), `index_clean.html`, `null` (0 bytes), an embedded `zt-lounge-admin/`
    copy, and many audit `.md` files. None are referenced by the served site.
  - `P3` — `sitemap.xml` lists `https://ztlounge.co.ke/membership.html`, a page
    that **does not exist** in the repo.
- **Membership is DB-driven** (names/prices/benefits). Browser-verified plan
  prices `KSh 5,000 / 10,000 / 20,000 / 30,000 per year` match live
  `membership_plans.annual_price`. No plan name/price/benefit is hardcoded in
  public source (config holds only UI constants).
- **Price authority is two-tier by design**: `service_charges.price` is the
  displayed package price and, when a package is selected, the booking price;
  `services.price` is the base booking price (0 for several services).
  `create_booking` resolves price server-side from `service_charges` (if a charge
  id is supplied) else `services.price`. The client never sends an amount.

Overall classification: **MOSTLY CANONICAL WITH IDENTIFIED EXCEPTIONS.**

## 2. Scope and Safety

- Mode: read-only audit only. No writes to code, schema, rows, migrations, config,
  seed, or content.
- No server start/stop/restart/reconfigure. The already-running dev server on
  `localhost:8000` was used read-only for browser verification.
- No business entity created. No booking submitted. Playwright loaded pages and
  read the DOM only — no form submit, no booking CTA click, no localStorage/
  session mutation, no JWT injection.
- `supabase db query --linked --project-ref jczwilrysvnhcjzjztbi` used for
  read-only SQL. `supabase db push` never run.
- Git worktree was not cleaned/stashed/checked-out; no branch switch, commit, or
  discard. Pre-existing dirty changes preserved.

## 3. Git / Environment Baseline

| Item | Baseline (start) | Final (end) |
|---|---|---|
| Branch | `feature/membership-tiers-staging-phase1` | `feature/membership-tiers-staging-phase1` |
| HEAD | `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c` | `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c` |
| `git status --short` line count | 232 | 233 (only the new audit report added) |

Pre-existing dirty state (preserved, not touched): modified `.gitignore`,
`assets/css/theme.css`, many `assets/js/*` files, several `pages/**/*.html`,
`sitemap.xml`, `supabase/migrations/026_seed_cms_content.sql`; deleted `.next/*`
cache plus many audit `.md` and helper scripts, `assets/js/hero.config.js`,
`assets/js/main.js`, `assets/js/slider.js`; untracked `$null`, `null`,
`index_clean.html`, `assets/js/repositories/{PageResolver,MediaResolver,
MembershipRepository,PromotionRepository}.js`, `assets/js/membership-view.js`,
`assets/js/booking.js`, `zt-lounge-admin/`, `phasej-audit/`, and numerous audit
reports.

## 4. Canonical Database Baseline

Read-only SQL against `jczwilrysvnhcjzjztbi`. Public-schema tables discovered
include: `activity_logs, booking_history, booking_notes, bookings,
business_closures, business_settings, contact_messages, customer_memberships,
customers, faqs, file_uploads, gallery, google_connections, hero_slides,
invitations, media_assets, media_usage, membership_plan_benefits,
membership_plans, menu_categories, menu_items, notification_queue,
notifications, profiles, promotions, roles, service_categories, service_charges,
services, staff, staff_availability, staff_leave, system_settings, testimonials,
v_* views, website_pages`.

**membership_plans** (all `is_active=true`, all `media_id=null`):

| name | slug | annual_price | registration_fee | display_order |
|---|---|---|---|---|
| Bronze | bronze | 5000.00 | 1000.00 | 0 |
| Silver | silver | 10000.00 | 1000.00 | 1 |
| Gold | gold | 20000.00 | 1000.00 | 2 |
| Platinum | platinum | 30000.00 | 1000.00 | 3 |

`membership_plan_benefits`: 35 active rows (Bronze 6, Silver 8, Gold 10,
Platinum 11) — e.g. 3%/5%/10%/10% F&B discounts,
standard/priority/highest-priority reservations, VIP-lounge priority booking,
birthday benefits, recognition.

**services** (12 active rows; note fixture rows):

| name | slug | type | price | media_id | page_id |
|---|---|---|---|---|---|
| Restaurant | restaurant | experience | 7777.00 | set | restaurant |
| Lounge & Bar | lounge-bar | experience | 0.00 | set | lounge |
| VIP Cabins | vip-cabins | experience | 0.00 | set | vip |
| Events | events | experience | 0.00 | set | events |
| Conference | conference | experience | 0.00 | set | conference |
| Auto Spa | auto-spa | service | 0.00 | set | grooming-care |
| Classic Haircut | classic-haircut | service | 800.00 | **null** | grooming-care |
| Beard Trim & Shape | beard-trim-shape | service | 500.00 | set | grooming-care |
| Haircut & Beard Grooming | haircut-beard-grooming | service | 1200.00 | set | grooming-care |
| Carpet Deep Cleaning | carpet-deep-cleaning | service | 1500.00 | set | grooming-care |
| Sofa & Upholstery Cleaning | sofa-upholstery-cleaning | service | 1200.00 | set | grooming-care |
| Mattress Cleaning | mattress-cleaning | service | 1000.00 | set | grooming-care |

**service_charges** (12 active rows):

| service | package name | price | unit |
|---|---|---|---|
| Events | Silver Celebration | 30000.00 | per event |
| Events | Gold Celebration | 55000.00 | per event |
| Events | Premium Wedding | 85000.00 | per event |
| VIP Cabins | Silver Cabin | 8500.00 | per cabin |
| VIP Cabins | Gold Cabin | 12500.00 | per cabin |
| VIP Cabins | Executive Suite | 18500.00 | per cabin |
| Conference | Half-Day Package | 25000.00 | per day |
| Conference | Full-Day Package | 4500.00 | per day |
| Conference | Executive Package | 6500.00 | per day |
| Auto Spa | Express Wash | 1500.00 | per vehicle |
| Auto Spa | Premium Detail | 3500.00 | per vehicle |
| Auto Spa | Ultimate Protection | 7500.00 | per vehicle |

**website_pages** (9 rows): `conference, contact, events, gallery,
grooming-care, home, lounge, restaurant, vip`. Both `service_cards_enabled` and
`service_packages_enabled` are `true` for all. **No `restaurant-menu` row** and no
`autospa`/`barbershop` rows exist.

**hero_slides** (9 active rows): home×2 ("ZT Lounge Meru", "best place"),
restaurant×2 ("Culinary Excellence", "a better ambience"), lounge×1
("Unwind & Connect"), vip×1 ("Exclusive Elegance"), events×1 ("Celebrate
Moments"), conference×1 ("Conference Excellence"), grooming-care×1
("Grooming & Care"). All have `media_id`; several have empty `cta_link` with
`cta_text` "Learn More".

**promotions** (1 active row): title `barbershop`, `description` "20% off this
week!", `discount_percent` 10.00, dates 2026-09-18 → 2026-10-07,
`show_on_homepage=true`, `page_id`=grooming-care. (Description/percent mismatch —
data-quality note.)

**gallery**: 13 active rows, all `page_id`=gallery page, all with `media_id`.

**menu_categories**: 16 rows (10 active). **menu_items**: 14 rows — Fresh Juice,
Signature Nyama Choma, Half-Day Package, ZT Signature Pilau, Premium Beef Steak,
Mixed Grill Platter, Grilled Chicken, Premium Sides, Goat Ribs, Coffee, Loaded
Fries, Chicken Tikka, Signature Cocktail, Cocktail Selection.

**business_settings** (id=1): business_name "ZT Lounge Meru", tagline "Premium
Lounge Experience in Meru", phone "+254143542601", whatsapp "+254143542601",
email "ztloungemeru@gmail.com", address "Opposite Ezri Hotel, Milimani, Meru",
city "Meru  town", country Kenya, currency "KES", timezone "Africa/Nairobi",
opening_hours all days "10:00 AM - 2:00 AM", logo_media_id = favicon_media_id =
`a5fb7148-8562-4d82-9fc1-d979fc19a323`, google_maps_url
"https://maps.app.goo.gl/HqTbiiU4q2jRFoPg6".

**testimonials**: **0 rows** (0 approved, 0 featured, 0 google).

**RLS (public/anon) `SELECT` confirmed** on: `business_settings`, `services`,
`service_charges`, `membership_plans`, `membership_plan_benefits`, `hero_slides`,
`promotions`, `gallery`, `menu_items`, `menu_categories`, `testimonials`,
`website_pages`, `media_assets`. (`customer_memberships` has no public read.)

> Note: the `supabase` CLI intermittently failed with
> `LegacyDbConfigConnectTempRoleError` (temp-role password/timeout on the shared
> pooler). Failed queries were retried; every result above is from a successful
> run. This is a tool-level flake, not a DB availability problem.

## 5. Public Runtime Status

- `http://localhost:8000/` responded **HTTP 200** — the public runtime **was
  already running** and was used read-only. It was not started, stopped, or
  reconfigured.
- Playwright (installed locally, `node_modules/playwright`) was used to load the
  ten public routes and read the DOM + network. No form was submitted and no
  booking CTA was clicked.
- **Caveat — the local dev server intermittently refused asset connections.**
  Repeated rapid page loads produced `net::ERR_CONNECTION_REFUSED` for static
  `.js`/image assets and occasional 30 s navigation timeouts (e.g. an entire run
  where `content-loader.js` and `page-identity.js` were refused for the home
  page). This caused run-to-run variance. Where a page loaded fully, its dynamic
  values were captured and compared to DB; where it did not, the result is marked
  PARTIAL rather than fabricated. This is an environment flake, not a site defect.
- Because of the above, public runtime verification is reported **PARTIALLY
  VERIFIED** (strong on home/gallery/conference/vip/restaurant-menu/
  grooming-care; partial on restaurant/lounge/contact/events), never claimed as a
  full clean pass.

## 6. Public Architecture / Data Flow

The canonical chain (verified in source) is:

```
shared-components.js (top of <body>, synchronous)
  → emits GLOBAL_SCRIPTS (deferred): supabase-js → page-identity → cms-report →
    BaseRepository → MediaResolver → PageResolver → BusinessRepository →
    Services/Hero/Gallery/Menu/FAQ/Testimonials/Promotion/Booking/Contact/SEORepository
    → BusinessService → *.config.js
  → emits FEATURE_SCRIPTS per data-features: membership → MembershipRepository +
    membership.config + membership-view;  booking → booking-time + forms.js
  → emits CORE_SCRIPTS (deferred): content-loader.js, background-media-warmer.js
  → emits POST_CMS: menu-nav.js (data-features="menu-nav")

content-loader.js  (DOMContentLoaded)
  → runGuarded('Hero'|'Gallery'|'HomepageGallery'|'FAQ'|'Services'|
    'CategoryServices'|'Menu'|'ServicesPage'|'Prices'|'ServiceCatalog'|
    'Testimonials'|'BusinessInfo'|'Promotions'|'Membership'|'JSONLD')
  → each subsystem → repository → Supabase (anon key, RLS) → resolver/mapper → DOM
```

Evidence: `assets/js/shared-components.js:63-403` (script registry + emitter),
`assets/js/content-loader.js:1824-1867` (boot, guarded subsystem list). Each
subsystem is wrapped by `runGuarded()` so one failure cannot abort the others
(`content-loader.js:57-76`).

Data-access building blocks:
- `BaseRepository` — generic cached Supabase queries (filter/order), in-flight
  de-dup, 300 s TTL default.
- `PageResolver` — the ONLY component converting a PageId → `website_pages` UUID
  (via `page_key`), plus the inverse UUID → `page_key`; states: `resolved`,
  `missing-page-record`, `invalid-page`, `dependency-missing`, `db-error`.
- `MediaResolver` — the single `media_id → media_assets.public_url` path (batched,
  session-cached). Resolved asset **wins over** legacy `image_url`.

Config files (`business-config.js`, `contact.config.js`, `gallery.config.js`,
`menu.config.js`, `services.config.js`, `booking.config.js`, `faq.config.js`,
`seo.config.js`, `testimonials.config.js`, `membership.config.js`) provide
**fallback/presentation** data only; the repositories query the DB first.

## 7. Membership Plans

**Chain** (all verified in source):
```
membership_plans (name, slug, description, annual_price, registration_fee,
                  media_id, display_order, is_active, cta_text, cta_link)
        ↓  RLS membership_plans_public_read (is_active = true)
MembershipRepository.getPublicPlans()   (assets/js/repositories/MembershipRepository.js)
        ↓  + membership_plan_benefits (is_active AND plan active)
        ↓  sortByDisplayOrder; MediaResolver.resolveCollection (media_id → public_url)
MembershipView.init()                    (assets/js/membership-view.js)
        ↓  [data-membership-grid]  (index.html:302; data-membership-mode="teaser")
DOM  (.zt-member-card ... .zt-member-price)
```

- `membership.config.js` holds only UI constants (currency `KSh`, locale `en-KE`,
  "per year", teaser limit 4, CTA fallback text) — **no plan records, empty
  fallback**.
- `MembershipRepository` has an explicit `function(){ return []; }` fallback →
  **DB-only, no fabricated plans/benefits**.
- The membership view loads only where the shell requests
  `data-features="membership"` (index.html home).

**Live DB vs source vs DOM:** No plan name, price, description, or benefit string
from the DB appears hardcoded in public source. DOM (browser, home) showed
`.zt-member-price` = `KSh 5,000 per year`, `KSh 10,000 per year`,
`KSh 20,000 per year`, `KSh 30,000 per year`, matching
`membership_plans.annual_price` (5000/10000/20000/30000). The fee banner uses
`registration_fee` (1000).

Membership result:
- Membership source of truth: **DB**
- Plan names: **DB-driven**
- Prices: **DB-driven** (browser-verified on home)
- Benefits: **DB-driven**
- Registration fee: **DB-driven** (plan-level `registration_fee`)

Caveat: all four plans have `media_id = null`, so no plan images render — expected,
not a defect. `membership-view.js:147-149` contains a **hardcoded phone/email
inside the plan modal** (`tel:254143542601`, `mailto:ztloungemeru@gmail.com`) as a
presentation fallback — see §16.

## 8. Services

**Chain:**
```
services (name, slug, description, category_id, page_id, type, is_active,
          display_order, price, image_url, media_id, href, tag, icon)
        ↓  RLS "public can read active services"
ServicesRepository.getByPage(pageId):
        PageResolver.requirePageUuid(pageId) → website_pages UUID
        → services WHERE page_id=uuid AND is_active=true ORDER BY display_order
        → group by type: services[] / experiences[] / features[]
        → MediaResolver.resolveCollection (media_id → public_url)
        → (DB empty) fallback: services.config.js[pageId]
        ↓  applyCanonicalDestinations (href repair; page_id → PAGE_ROUTES)
content-loader.populateServiceCards()/populateCategoryServices()/populateServices()
        ↓  .service-cards-grid / [data-category-grid] / .service-card h3
DOM
```

- `ServicesRepository.getAll()` (home navigation grid) filters `is_active=true`
  and resolves media via `MediaResolver`; it never uses `services.image_url`
  directly when `media_id` resolves.
- The service cards do **not** render a price. Price is rendered only through the
  charges path (§9) and the booking flow (§19).

**Live DB vs source vs DOM:**
- `index.html`, all `pages/**/*.html`, and `index_clean.html` contain baked
  `.service-cards-grid` markup with hardcoded names + Supabase `public-assets`
  image URLs (index.html:269-373). On pages using the shared
  `.service-cards-grid` (home/contact/gallery), `populateServiceCards()` **replaces
  the grid innerHTML from `services.getAll()`** when the DB returns rows
  (content-loader.js:785-810). Browser (home, contact, gallery) showed the 12 DB
  service names (`Restaurant, Classic Haircut, Carpet Deep Cleaning, Lounge & Bar,
  Beard Trim & Shape, VIP Cabins, Sofa & Upholstery Cleaning, Haircut & Beard
  Grooming, Events, Mattress Cleaning, Conference, Auto Spa`) — DB-driven.
- Grooming-care renders DB services **grouped by `category_id`** via
  `getByPageGrouped` (+ `service_categories` for slug→UUID); browser showed the 7
  DB grooming services.
- **Exception:** internal pages using page-specific grid classes are NOT
  overwritten — e.g. `conference.html` `.service-cards-grid-conference`
  ("Boardroom, Training Room, Seminar Hall, Conference Hall, Catering Services,
  AV Equipment") and `vip.html` feature cards ("Private Entrance, Premium Service,
  Exclusive Bar, Evening Privacy"). `conference.html` comments the grid as
  deliberately "curated, static". Browser showed these static cards rendered →
  **HARDCODED curated content that is displayed** (not replaced by DB).
- `services.config.js` supplies experience/feature groupings used when a page has
  no DB rows (`vip.experiences`, `conference.features`, `autospa.features`).

## 9. Service Packages / Charges

**Chain:**
```
service_charges (service_id, name, description, price, unit, status, sort_order)
        ↓  RLS service_charges_public_read
ServicesRepository.getChargesBySlug(slug)  (active services row → charges status='active')
        ↓
content-loader.populateServicePrices():  [data-charge-name] → charge.price (by name)
content-loader.populateServiceCatalog(): [data-service-catalog] / #service-packages select
DOM  (.price, .catalog-price, booking <option data-charge-id>)
```

- `[data-charge-name]` placeholders in `vip.html` (Silver/Gold/Executive Cabin),
  `events.html` (Silver/Gold Celebration, Premium Wedding), `conference.html`
  (Half-/Full-Day, Executive), plus the booking `<select data-charge-options>`, are
  filled from `service_charges.price` by name. Unmatched names are left empty with
  a console warning (no invented prices).
- **Browser-verified:** conference `[data-charge-name]` →
  `KES 25,000`, `KES 4,500`, `KES 6,500` (and `<option>` text
  `Half-Day Package - KES 25,000`, `Full-Day Package - KES 4,500`); vip →
  `KES 8,500`, `KES 12,500`, `KES 18,500` (`Silver Cabin - KES 8,500`, …). All
  match live `service_charges`.
- Phase 2C gate: when a page's `service_packages_enabled = false`, `#pricing` is
  hidden and the charge fetch skipped (all 9 pages are currently `true`).

Package prices are **DB-driven** (no hardcoded package prices found in source).

## 10. Hero Content

**Chain:**
```
hero_slides (page_id, badge, title, highlight, subtitle, media_id, image_url,
             cta_text, cta_link, display_order, is_active)
        ↓  RLS "Public can read active hero slides"
HeroRepository.getByPage(pageId):
        PageResolver.requirePageUuid(pageId) → website_pages UUID
        → hero_slides WHERE page_id=uuid AND is_active=true ORDER BY display_order
        → MediaResolver (media_id → public_url)
        states: {ok, slides[]} | {empty, []} | {unavailable, []}
        ↓
content-loader.populateHero()  → generates slides + dots + CTA buttons into .hero-slider
DOM (background-image = canonical public_url; hero-title/hero-subtitle/hero-badge)
```

- HTML holds only the `.hero-slider` shell; **no baked hero slides** (the deleted
  `hero.config.js` is explicitly no longer a public hero source — HeroRepository
  header, content-loader.js:278-287). DB empty → controlled "empty" state; page/
  dependency error → "unavailable" state; a stale static hero can never mask a CMS
  problem.
- **Browser-verified:** gallery page `data-hero-state="empty"` (no hero rows for
  gallery); grooming-care `data-hero-state="ok"`, count 1, title "Grooming & Care"
  (matches live `hero_slides`). `background-image` values resolve to
  `media_assets.public_url` (e.g. `public-assets/assets/images/branding/…`,
  `hero-images/hero-lounge.webp`).
- `cta_text` "Learn More" with empty `cta_link` on several rows yields a
  label-only button whose href falls back to page logic — a **DB content gap**,
  not hardcoding.
- `background-media-warmer.js` owns no URL/media logic; it consumes resolved URLs
  only.
- **No hardcoded hero titles/descriptions/images were found that reach the DOM**
  on a page with active DB slides. Braces `\u0026`/`\u2022` in DB values are
  HTML-entity-safe strings decoded by `decodeHeroText()`.

## 11. Website Pages / CMS Content

**Chain:**
```
website_pages (id, page_key, title, subtitle, content jsonb, seo_title,
               seo_description, service_cards_enabled, service_packages_enabled)
        ↓  RLS "public can read website pages"
PageResolver.resolvePageRecord(pageId):
        PageId (body[data-page] or exact basename) → page_key → website_pages row
        (Phase 2C projection; legacy projection retried if 043 not applied)
        ↓
content-loader.getPageSectionToggles() → {serviceCardsEnabled, servicePackagesEnabled}
```

- `page-identity.js` is the single public page-identity source: `PAGE_IDS`
  (home, restaurant, restaurant-menu, lounge, vip, events, conference, autospa,
  grooming-care, gallery, contact), exact-basename `FILENAME_MAP`, `PAGE_ROUTES`
  (page_key → served HTML), and `PAGE_TO_SERVICE_SLUG`.
- `PageResolver` converts PageId → `website_pages` UUID via `page_key`, never
  guessing from URL substrings/directories. It fails **open** on toggles
  (missing/false-y → enabled).
- Public site consumes `page_key` → row (DB). No hardcoded page records.
- **Gap:** `restaurant-menu` is a valid PageId with a served page, but there is
  **no `website_pages` row** for it → `PageResolver` state `missing-page-record`
  → Gallery/FAQ fall back to static config; hero is "unavailable". `autospa`/
  `barbershop` are legacy ids with no rows (by design — consolidated into
  `grooming-care`).
- Browser: page toggles resolved (all true) and service/package sections rendered;
  contact logged `[CMS][Gallery] …MISSING_DEPENDENCY window.PageResolver` and
  `[CMS][FAQ] …MISSING_DEPENDENCY window.PageResolver` in one run — a **script
  load-order/timing** observation under the flaky server, not a data issue.

## 12. Media / Images

**Canonical chain:** `*.media_id → media_assets.public_url →
media_assets_public_read → MediaResolver.resolveCollection()` (batched,
session-cached; resolved asset wins over legacy `image_url`).

| Category | Media source | Classification |
|---|---|---|
| Branding (logo/favicon/og/apple-touch) | `business_settings.logo_media_id`/`favicon_media_id` → `media_assets` via `branding-init.js`; local `assets/images/branding/*` fallback | CANONICAL_DYNAMIC + LEGITIMATE_STATIC |
| Hero backgrounds | `hero_slides.media_id` → `media_assets` | CANONICAL_DYNAMIC (browser-verified) |
| Service/gallery/menu/promotion/membership images | `media_id` → `media_assets` | CANONICAL_DYNAMIC |
| Baked page imagery | hardcoded `…supabase.co/storage/v1/object/public/public-assets/…` in HTML | LEGACY_FALLBACK (overwritten) or STATIC where not |
| Stray/inert | gallery.config.js `public-assets` URLs; `$null`/`index_clean.html` | LEGITIMATE_STATIC / DEAD_OR_INERT |

- `MediaResolver` is the only public `media_id → public_url` path. Direct
  `/storage/v1/object/public/...` URLs do appear **in HTML/config**, but the DB
  `media_assets.public_url` **canonically overrides** them for rows with a
  `media_id`.
- **Browser-verified:** gallery `.grid-item img` srcs are
  `…/storage/v1/object/public/gallery-images/gallery-0X.webp` (DB `media_assets`)
  in DB order; home preview = canonical `gallery-images/gallery-02.webp`. One
  residual hardcoded `public-assets/.../gallery-14.webp` occupied the orphan 14th
  mount (13 DB rows vs 14 baked mounts) but is hidden by the renderer.
- `public-assets` vs `gallery-images`/`hero-images`/`service-images` buckets are
  both in use; `media_assets.public_url` is authoritative.
- `Classic Haircut` has `media_id = null` (only service without media) → its card
  renders without an image (browser + DB agree).

## 13. Promotions

**Chain:**
```
promotions (title, description, discount_percent, start_date, end_date,
            is_active, page_id, media_id, show_on_homepage, display_order)
        ↓  RLS public_can_read_active_promotions
PromotionRepository.getEligible()  → status() 'active' only
        (Africa/Nairobi business date; is_active AND start<=today<=end; NULL dates = not eligible)
        ↓  MediaResolver (media_id → public_url)
content-loader.populatePromotions():
        → global .zt-promo-sticker (every page)
        → #promotions-grid homepage group (show_on_homepage)
        → destination: promotion.page_id → website_pages.page_key → PAGE_ROUTES
DOM
```

- **No promotion text is hardcoded.** The only literal is the derived
  `${discount}% OFF` label and generic chrome ("View this offer", dates).
  `PromotionRepository` fallback is an explicit empty array.
- **Browser-verified:** global sticker `10% OFF barbershop` rendered on gallery and
  contact; matches the single live `promotions` row (`discount_percent` 10, title
  "barbershop").
- **Data inconsistency (DB content, not a source defect):** the row's
  `description` says "20% off this week!" while `discount_percent` = 10, so the
  sticker shows 10% but the card body would show "20% off this week!".
- Homepage promo group did not appear within 4 s in one capture (server flake);
  the global sticker mechanism itself is DB-driven.

## 14. Gallery

**Chain:**
```
gallery (title, description, image_url, media_id, category, alt_text,
         display_order, is_featured, is_active, type, page_id)
        ↓  RLS gallery_public_read
GalleryRepository.getByPage('gallery')  → PageResolver UUID → gallery rows
        → MediaResolver (media_id → public_url)
        ↓   (missing page record) fallback: gallery.config.js
content-loader.populateGallery() (paged) / populateHomepageGalleryPreview() (home, is_featured→4)
DOM (.grid-item img by data-index; orphan mounts hidden)
```

- **DB-driven, browser-verified:** 13 live gallery rows (`page_id`=gallery) → 13
  canonical `gallery-images/*.webp` DOM srcs; `gallery.html` bakes 14 mounts
  (hardcoded `public-assets` URLs) with `data-index`, and the renderer maps DB rows
  by index and **hides** any mount with no DB item.
- **Home preview:** `populateHomepageGalleryPreview()` runs only on `/`; browser
  showed one canonical `gallery-images/gallery-02.webp` (few `is_featured` rows).
- **Legacy fallback `gallery.config.js`** holds 14 hardcoded `public-assets`
  gallery images + labels (used only if DB rows and page record are absent).
- **Finding (P2):** the **contact page** `.gallery-preview-item img` retains baked
  hardcoded `public-assets/images/gallery/gallery-01..04.webp` (browser-verified)
  because the preview hydrator is home-only and contact's preview mounts are not
  targeted by any hydrator.

## 15. Menu

**Chain:**
```
menu_categories (name, slug, description, display_order, is_active)
menu_items      (name, description, price, image_url, media_id, alt_text,
                 is_active, is_featured, display_order, type, category_id, page_id)
        ↓  RLS "Public can read active menu categories/items"
MenuRepository.getMenu()/getCategories()/getSignatureItems()/getItemsByCategory()
        → group items under categories by category_id; MediaResolver
        → (DB empty) fallback: menu.config.js (categories/signatureCollection/fullMenu)
        ↓
content-loader.populateMenu() → .menu-item-card (name, description, price, image)
content-loader.populateMenuPrices() → [data-menu-name] → menu_items.price
DOM
```

- **DB-driven, browser-verified (restaurant-menu):** 14 `.menu-item-card h3`
  matching live `menu_items` names; driven by `populateMenu()`.
- `restaurant.html` signature cards use empty `<span class="price"
  data-menu-name="…">` filled from `menu_items.price` (non-package; always runs).
- `menu.config.js` fallback holds 10 hardcoded category names and empty
  items/signature/fullMenu. Because the DB has categories/items, the fallback is
  not the production source.
- **Data-quality (DB, not source):** category↔item mismatches (e.g. menu item
  "Half-Day Package" under "Choma Zone"; "Signature Cocktail"/"Cocktail
  Selection" under "Fast Foods"). Several active categories have 0 items.
- **Finding (P2):** `lounge.html` signature-cocktail prices are **hardcoded**
  (`From KES 1,200 / 1,500 / 2,000 / 800`) with no `data-menu-name` hook; browser
  confirmed these render statically (no menu price request drives them).

## 16. Business / Contact Information

**Canonical source:** `business_settings` (id=1). **Chain:**
```
business_settings (business_name, phone, whatsapp, email, address, city, country,
                   currency, timezone, opening_hours, logo_media_id, favicon_media_id,
                   google_maps_url, facebook, instagram, twitter, youtube)
        ↓  RLS business_settings_public_read
BusinessRepository.getAll()/getContact()  (also resolves logo/favicon media_id → media_assets)
        ↓  BusinessService (services/BusinessService.js)
business-config.js loader → window.BusinessConfig (FROZEN) — merges CMS over FALLBACK_CONFIG
        ↓
content-loader.populateBusinessInfo() → [data-business-name|-address|phone|phone-link|
        email|email-link|whatsapp|hours|map-link] and branding-init.js (logo/favicon)
DOM
```

**Hydration is real, browser-verified:** on home/contact the DOM showed phone
`+254 143 542 601`, address `Opposite Ezri Hotel, Milimani, Meru` (DB value,
overwriting baked `Milimani Road, Meru, Kenya`), and hours `Mon - Sun: 10:00 AM -
2:00 AM` (DB) — all from `business_settings`, not the baked HTML.

**Duplicated business data in source (all flagged):**

| Location | Values | Overwritten at runtime? | Classification |
|---|---|---|---|
| `business-config.js:18-67` FALLBACK_CONFIG | name, phone, phoneRaw, email, address(+postalCode 60200, region "Meru County"), hours, all social URLs, Google Maps, **hardcoded Supabase Storage logo URLs**, seo.url | Only if DB unreachable; if used it can diverge (postalCode/region exist only here) | LEGITIMATE_FALLBACK (stale-risk) |
| `contact.config.js:20-30` | phone, whatsapp URL, email, address, hours, "Secure on-site parking" | Config-driven sections; some elements lack `data-*` hooks | HARDCODED_BUSINESS_DATA (low reach) |
| `shared-components.js:96-109` CONTACT + footer/CTA | phoneDisplay, phoneRaw, email, whatsapp, `tel:+254143542601`, `wa.me/254143542601` | Footer hydrated only where `data-phone-link`/`data-whatsapp` present | MIXED_AUTHORITY |
| `membership-view.js:147-149` | tel/mailto fallback in plan modal | Overwritten only when `BusinessConfig` resolves | LEGITIMATE_FALLBACK |
| `forms.js:462` | `phoneRaw || '254143542601'` WhatsApp fallback | Fallback only | LEGITIMATE_FALLBACK |
| `index.html` / `pages/**.html` baked JSON-LD + footer | telephone `+254143542601`, email, address, opening hours, image URL | `generateJSONLD()` rewrites **streetAddress** + **image** only; telephone/email/openingHoursSpecification NOT rewritten | HARDCODED_BUSINESS_DATA (metadata) |
| `content-loader.js:1187-1194` `generateJSONLD()` defaults | name/phone/email/address/city/country/lat/lng | Defaults only when `BusinessService`/DB missing | LEGITIMATE_FALLBACK |

- **Numeric anomaly:** `index.html:373` "Get Directions" href uses
  `…/HqTbiiU4q4jRFoPg6` while the DB and other links use `…/HqTbiiU4q2jRFoPg6` — a
  likely typo in a baked link (`data-map-link` present, may be overwritten).
- **Opening hours** are DB-driven (`opening_hours` jsonb, grouped by
  `formatOpeningHours`); baked value matches DB.
- **Favicon:** `business_settings.favicon_media_id` points at the **logo** asset
  (`a5fb7148…`), so favicon equals logo (data note; intentional per comments).
- `FALLBACK_CONFIG.trust` counters (200+/500+) and `seo.url` are static marketing
  copy — STATIC_PRESENTATION.

## 17. Testimonials

**Chain:**
```
testimonials (customer_name, comment, rating, image_url, media_id, occupation,
              is_featured, approved, source, author_photo_url, display_order)
        ↓  RLS public_read_approved_by_status
TestimonialsRepository.getAll()/getFeatured()  → approved = true (featured where flagged)
        → MediaResolver; author_photo_url only from Google (source='google')
content-loader.populateTestimonials()  (page scope: home + contact ONLY)
DOM (.testimonial-item)
```

- **Explicit no-fallback design:** `TestimonialsRepository` returns `[]` when the
  DB is empty; `testimonials.config.js` was reduced to `{ items: [] }` (hardcoded
  "James M./Sarah K./David O." removed 2026-09-21).
- **Live DB has 0 testimonials** → the public site renders **zero** testimonials
  (browser confirmed an empty list). No static testimonial content remains.
- Classification: **DB_DRIVEN (currently empty)**; no hardcoded testimonials reach
  the DOM.

## 18. Navigation / Page Configuration

- Header/navigation markup is generated by `shared-components.js` (Home, an
  "Experiences" dropdown [Restaurant, Restaurant Menu, Lounge, VIP Cabins], other
  nav, theme toggle, header phone CTA) with hrefs consistent with `PAGE_ROUTES`.
  Active-nav highlighting is computed from the current path.
- Navigation is **code-defined** (static route list), not sourced from
  `website_pages`. `page-identity.js.PAGE_ROUTES` is the single map from
  `page_key` → served HTML and the only place a page becomes a link target; a key
  absent from it (e.g. `autospa`, `barbershop`) is never offered.
- Service/promotion destinations DO use the DB:
  `services.page_id → page_key → PAGE_ROUTES` and
  `promotion.page_id → page_key → PAGE_ROUTES`.
- **Finding (P3):** `sitemap.xml` lists `/membership.html` — no such file exists;
  membership is a homepage section (`#membership`). Broken sitemap entry.
- Classification: navigation presentation = STATIC_PRESENTATION (acceptable);
  destinations = DB-derived. Page visibility (which pages exist) is not driven by
  `website_pages` — it is code/HTML-defined.

## 19. Booking Data Chain

**Chain (traced statically; no booking submitted):**
```
public service selection (pageId → services.slug via PageIdentity)
        ↓
package <select data-charge-options> option { value='charge-<uuid>', data-charge-id }
        ↓  (forms.js bindBookingForm → BookingRepository.insert)
create_booking RPC (SECURITY DEFINER):
        p_service_slug, p_full_name, p_phone, p_booking_date, p_start_time, p_guests,
        p_email, p_special_requests, p_service_charge_id
        → services.price (base) ; if p_service_charge_id supplied AND belongs to service
          AND status='active' → v_price := service_charges.price
        → validates date, availability, creates/finds customer, generates booking_number
        → INSERT bookings (price = v_price, service_charge_id)
canonical DB pricing (authoritative)
```

- The client sends **identifiers only** — never a price amount
  (`BookingRepository.js:180-191`). `p_service_charge_id` is optional
  (`create_booking` accepts `NULL`).
- Live `create_booking` confirms price resolution: base price from
  `services.price` for the slug, **overridden** by `service_charges.price` when a
  valid active charge belonging to that service is supplied; a mismatched/inactive
  charge raises "Selected package is not available for this service".
- Past-datetime rejection is enforced server-side (RPC + trigger, migration 034);
  client validation (`booking-time.js`/`forms.js`) is UX only, using the same
  Africa/Nairobi clock.
- **Browser-verified (no submit):** the booking `<select data-charge-options>` on
  conference showed options `Half-Day Package - KES 25,000`, `Full-Day Package -
  KES 4,500` (from `service_charges`). The booking UI contains no hardcoded prices
  that could diverge from `service_charges`.

## 20. Hardcoded Business-Data Scan

Systematic searches across HTML/JS/JSON/config for prices, currency, contact
values, address, hours, business/domain names, and membership terminology.
Representative results (traced, not merely counted):

| Pattern | Where found | Reaches DOM? | Classification |
|---|---|---|---|
| `KES 1,200/1,500/2,000/800` | `pages/experiences/lounge.html:675-690` | **YES** (browser-verified) | HARDCODED_BUSINESS_DATA |
| Hardcoded curated service cards | `conference.html:530-560`, `vip.html:529,770`, static grids on events/grooming | **YES** | HARDCODED_BUSINESS_DATA (curated) |
| `+254143542601` / `+254 143 542 601` | JSON-LD + footer in index/pages; `business-config.js`, `contact.config.js`, `shared-components.js`, `membership-view.js` | Partly (JSON-LD telephone not rewritten; footer partly hydrated) | MIXED_AUTHORITY |
| `ztloungemeru@gmail.com` | JSON-LD + footer; business/contact/membership configs | Partly (footer `data-email-link` hydrated; JSON-LD email not) | MIXED_AUTHORITY |
| `Milimani`/`Ezri`/`60200` | JSON-LD, footer, about copy, contact config | Partly (address spans hydrated; JSON-LD address rewritten) | MIXED_AUTHORITY |
| `10:00 AM - 2:00 AM` | JSON-LD, footer, faq.config, contact.config | Partly (JSON-LD hours not rewritten) | MIXED_AUTHORITY |
| Supabase Storage URLs | baked hero/gallery/service/menu images in HTML + configs | Overwritten for `media_id` rows | LEGACY_FALLBACK / STATIC |
| `% OFF` / `20% off` | `content-loader.js:1567` (derived); `promotions` row description | Derived label only | STATIC_PRESENTATION / DB |
| Membership `Silver/Gold/VIP/plan` | labels in `booking.config.js`, `faq.config.js`, `seo.config.js`; `membership.config.js` UI constants | Labels only; plan records from DB | STATIC_PRESENTATION |
| "Book Now"/"Explore"/"Membership"/CTAs | throughout | Yes | STATIC_PRESENTATION |
| Test/fixture strings | `services` DB rows ("ZT BLACKBOX DESCRIPTION…", "(E2E 204-contract fixture)") | **YES** (DB) | DB content (data-quality) |
| `20% off this week!` | `promotions.description` (DB) vs `discount_percent`=10 | Yes | DB content (inconsistency) |

Dead/inert (not served/referenced): `$null` (27 KB HTML copy), `index_clean.html`,
`null` (0 bytes), `zt-lounge-admin/` embedded copy, `phasej-audit/`, helper
`.js/.txt/.sql/.diff` files, and numerous audit `.md` reports.

## 21. Database vs Source Cross-Check

| Category | Live DB value (authoritative) | Public source value | Public data-loading path | Match? |
|---|---|---|---|---|
| Membership plans | Bronze/Silver/Gold/Platinum; 5000/10000/20000/30000 | none hardcoded (UI constants only) | MembershipRepository → MembershipView | ✅ (browser) |
| Membership benefits | 35 active rows | none hardcoded | MembershipRepository | ✅ |
| Services | 12 active rows (incl. fixture rows) | baked fallback cards (overwritten where shared grid) | ServicesRepository.getByPage/getAll | ✅ where shared grid |
| Service charges | 12 active rows | none hardcoded | getChargesBySlug → [data-charge-name] | ✅ (browser: conference/vip) |
| Hero | 9 active rows | none (hero.config.js deleted) | HeroRepository.getByPage | ✅ (browser: grooming/gallery) |
| Website pages | 9 rows, toggles true | static page HTML | PageResolver + getPageSectionToggles | ✅ (restaurant-menu row absent) |
| Media | media_assets.public_url | direct storage URLs in HTML (fallback) | MediaResolver | ✅ (browser) |
| Promotions | 1 active row | none hardcoded | PromotionRepository | ✅ (browser sticker) |
| Gallery | 13 active rows | 14 baked mounts + gallery.config fallback | GalleryRepository | ✅ page; ✗ contact preview (static) |
| Menu | 16 categories / 14 items | menu.config categories only | MenuRepository | ✅ (browser restaurant-menu) |
| Contact info | business_settings id=1 | duplicated in configs + baked HTML/JSON-LD | populateBusinessInfo | ✅ core; ✗ JSON-LD telephone/email/hours |
| Opening hours | all days 10:00-02:00 | baked (matches) | formatOpeningHours | ✅ |
| Testimonials | 0 rows | empty config | TestimonialsRepository | ✅ (renders none) |

## 22. Playwright Runtime Evidence

Runtime available and used (read-only). Captures stored as evidence artifacts in
the OS temp directory (`%TEMP%\zt_audit\pub_runtime*.json`); not committed.

| Route | HTTP | Hero state | Notable DOM values observed | DB request(s) |
|---|---|---|---|---|
| `/` | 200 | not settled in some captures (server flake) | 12 DB service card names; `.zt-member-price` = KSh 5,000/10,000/20,000/30,000 per year; phone +254 143 542 601; address "Opposite Ezri Hotel, Milimani, Meru"; hours 10 AM-2 AM; 1 canonical gallery-preview image | business_settings, membership_plans, membership_plan_benefits, website_pages, services, gallery, media_assets |
| `/pages/business/conference.html` | 200 | unavailable | `[data-charge-name]` = KES 25,000 / 4,500 / 6,500; options "Half-Day Package - KES 25,000", "Full-Day Package - KES 4,500"; **static** cards Boardroom/Training Room/Seminar Hall/Conference Hall/Catering/AV | business_settings, website_pages, services, service_charges |
| `/pages/experiences/vip.html` | 200 | unavailable | `[data-charge-name]` = KES 8,500 / 12,500 / 18,500; options "Silver Cabin - KES 8,500", "Gold Cabin - KES 12,500", "Executive Suite - KES 18,500"; **static** feature cards Private Entrance/Premium Service/Exclusive Bar/Evening Privacy | website_pages, services, service_charges |
| `/pages/experiences/lounge.html` | 200 | unavailable | `cocktailPrices` = "From KES 1,200 / 1,500 / 2,000 / 800" (**hardcoded**) | menu_categories, menu_items, promotions, media_assets |
| `/pages/experiences/restaurant-menu.html` | 200 | unavailable | 14 menu item names matching DB menu_items | menu_categories, menu_items, website_pages, promotions |
| `/pages/contact/gallery.html` | 200 (one run timed out) | **empty** | 13 `.grid-item img` = canonical `gallery-images/*.webp`; sticker "10% OFF barbershop" | gallery, hero_slides, services, promotions, menu_items, media_assets |
| `/pages/business/grooming-care.html` | 200 | **ok**, count 1 | hero title "Grooming & Care"; 7 DB services grouped by category | services, service_categories, hero_slides, gallery, faqs, promotions, menu_items |
| `/pages/contact/contact.html` | 200 | — | 12 DB service card names; `.gallery-preview-item img` = **hardcoded** public-assets gallery-01..04 | business_settings, services, testimonials, promotions, menu_items, media_assets |
| `/pages/experiences/restaurant.html` | 200 | — | (partial; server flake) baked signature price spans `[data-menu-name]` (DB-hooked) | business_settings, media_assets (partial) |
| `/pages/business/events.html` | 200 | — | (partial; server flake) `[data-charge-name]` placeholders present | business_settings, media_assets (partial) |

Supplementary routes discovered from the router/source: `/` (home),
`pages/experiences/{restaurant,restaurant-menu,lounge,vip}.html`,
`pages/business/{events,conference,grooming-care}.html`,
`pages/contact/{gallery,contact}.html`, plus `404.html`. No `membership.html`
(sitemap lists it erroneously).

Runtime caveats: repeated rapid loads produced `net::ERR_CONNECTION_REFUSED` on
static JS/asset requests and occasional 30 s navigation timeouts, so some pages
rendered only partially in some captures. Values above are reported only where a
page captured successfully; nothing was fabricated. No console *data* errors
(other than missing-dependency/branding errors caused by the refused scripts)
were observed when assets loaded.

## 23. Cross-Layer Workflow Matrix

| Business data | Canonical DB | Public loader | Public UI | Hardcoded duplicate? | Runtime verified? | Classification |
|---|---|---|---|---|---|---|
| Membership plans | `membership_plans` | `MembershipRepository.getPublicPlans` | `membership-view.js` `.zt-member-card` | No | VERIFIED | DB_DRIVEN |
| Membership benefits | `membership_plan_benefits` | `MembershipRepository` | modal `.zt-member-benefits` | No | PARTIALLY VERIFIED | DB_DRIVEN |
| Services | `services` | `ServicesRepository.getByPage/getAll` | `.service-card` | Baked fallback cards + static curated grids on some pages | PARTIALLY VERIFIED | MIXED_AUTHORITY |
| Service charges | `service_charges` | `getChargesBySlug` → `populateServicePrices/Catalog` | `.price`, `<option>` | No | VERIFIED | DB_DRIVEN |
| Hero | `hero_slides` + `media_assets` | `HeroRepository.getByPage` → `populateHero` | `.hero-slider` | No (hero.config deleted) | VERIFIED | DB_DRIVEN |
| Promotions | `promotions` + `media_assets` | `PromotionRepository` → `populatePromotions` | `.zt-promo-sticker`/`#promotions-grid` | No | VERIFIED | DB_DRIVEN |
| Gallery | `gallery` + `media_assets` | `GalleryRepository.getByPage` | `.grid-item img` | Baked mounts + `gallery.config` | VERIFIED (page); contact preview static | DB_DRIVEN (page) / MIXED (contact preview) |
| Menu | `menu_categories`/`menu_items` | `MenuRepository` → `populateMenu/populateMenuPrices` | `.menu-item-card`, `.price` | `menu.config` categories; lounge cocktail prices | VERIFIED (menu); VERIFIED hardcoded (lounge) | DB_DRIVEN + HARDCODED (lounge) |
| Contact info | `business_settings` | `BusinessRepository` → `populateBusinessInfo` | `data-*` hooks, footer, JSON-LD | Yes (configs + baked HTML/JSON-LD) | VERIFIED (core) | MIXED_AUTHORITY |
| Opening hours | `business_settings.opening_hours` | `BusinessRepository` → `formatOpeningHours` | `[data-hours]` | Yes (baked, matches) | VERIFIED | DB_DRIVEN (+ static duplicate) |
| Testimonials | `testimonials` | `TestimonialsRepository` | `.testimonial-item` | No | VERIFIED (empty) | DB_DRIVEN (empty) |
| Website pages | `website_pages` | `PageResolver` + toggles | section gating | Static page HTML | PARTIALLY VERIFIED | DB_DRIVEN (toggles) |
| Media | `media_assets` | `MediaResolver` | all images | Direct storage URLs (fallback) | VERIFIED | DB_DRIVEN |
| Booking data | `services`,`service_charges` via `create_booking` | `BookingRepository` | booking form | No | NOT SUBMITTED (static+DB-confirmed) | DB_DRIVEN |

## 24. Findings

**P0 — Critical: none.** No public business information was found to be *actively
served from hardcoded data that contradicts canonical DB data* in a way that
breaks the canonical chain.

**P1 — High: none confirmed.** No dynamic business-data path was found where
equivalent values are both dynamically fetched and independently hardcoded *and*
both compete as the displayed authority (the config fallbacks are documented as
fallbacks and the DB wins when reachable).

**P2 — Medium (legacy/fallback hardcoding that could become an accidental source
of truth, or static business content actually displayed):**
1. `lounge.html:675-690` — hardcoded signature-cocktail prices ("From KES
   1,200/1,500/2,000/800"). Browser-verified as displayed and not DB-driven.
2. Curated static service/feature grids on internal pages (`conference.html`
   "Boardroom/…"; `vip.html` "Private Entrance/…"; event/grooming static grids)
   rendered from HTML, not the CMS.
3. Duplicate contact data in `business-config.js` FALLBACK_CONFIG,
   `contact.config.js`, `shared-components.js` CONTACT, `membership-view.js`, and
   baked JSON-LD/footer. `FALLBACK_CONFIG` additionally carries address fields
   (`postalCode 60200`, `region "Meru County"`) that exist **only** there, and a
   hardcoded Supabase Storage logo URL.
4. `index.html:373` "Get Directions" href `HqTbiiU4q4jRFoPg6` vs canonical
   `HqTbiiU4q2jRFoPg6` (likely typo).
5. Contact page gallery-preview images remain hardcoded `public-assets` URLs
   (home-only hydrator).
6. JSON-LD (`telephone`, `email`, `openingHoursSpecification`) is not refreshed by
   `generateJSONLD()` and can diverge from `business_settings`.

**P3 — Low (inert/dead or documentation-only duplication):**
1. Stray untracked artifacts: `$null` (27 KB HTML copy), `index_clean.html`,
   `null` (0 bytes), embedded `zt-lounge-admin/`, `phasej-audit/`, helper
   scripts, and many audit `.md` files.
2. `sitemap.xml` lists a non-existent `/membership.html`.
3. DB data-quality (not source): e2e fixture rows in `services`; `promotions`
   description/percent mismatch; menu category↔item mismatches.
4. `TestimonialsConfig` reduced to `{ items: [] }` (kept only for
   backward-compat; inert).
5. `gallery.config.js` hardcoded `public-assets` gallery arrays (fallback only).

## 25. Blockers / Verification Limits

- **Server flakiness (primary limit).** The local dev server on `localhost:8000`
  intermittently refused static asset connections (`net::ERR_CONNECTION_REFUSED`)
  and occasionally timed out navigations. Consequently: (a) the home hero did not
  settle in some captures; (b) restaurant/events pages returned only partial DB
  requests in some runs; (c) one gallery navigation timed out. These were not
  worked around (no server restart). Affected browser rows are PARTIAL.
- **No booking submitted.** The booking chain is verified statically and by DB
  inspection of `create_booking` plus browser-observed charge options; end-to-end
  booking creation was intentionally not performed.
- **RLS write/RPC bodies beyond `create_booking`** (storage bucket policies, admin
  RPCs) were not probed (would require writes).
- **supabase CLI temp-role flake** required retries; a couple of queries returned
  `LegacyDbConfigConnectTempRoleError` before succeeding. No query result was
  invented; only successful results are reported.
- Prior workflow-audit caveat preserved: the **earlier** audit's public-site
  conclusions were white-box + live-DB only (localhost:8000 was not running then).
  **This** audit upgrades a subset (home/conference/vip/lounge/restaurant-menu/
  gallery/grooming-care/contact) to browser-observed, while explicitly marking the
  rest PARTIAL. No conclusion was silently upgraded.

## 26. Required Decisions

1. **Lounge cocktail prices** — CMS-manage (e.g. `menu_items`/`data-menu-name`) or
   intentionally static? Today hardcoded and displayed.
2. **Curated internal-page grids** (conference/vip/etc.) — intentional permanent
   static content, or migrate to `services`?
3. **`services.price` vs `service_charges.price` authority** — confirm the policy:
   base booking price = `services.price` (0 for several services), packages from
   `service_charges`. If `services.price = 0` is not an intended bookable base
   price, resolve as a design/data decision.
4. **Contact-data duplication** — trim FALLBACK_CONFIG / contact.config / baked
   JSON-LD to a single source, and refresh JSON-LD
   `telephone`/`email`/`openingHoursSpecification` from DB.
5. **`restaurant-menu` page row** — add a `website_pages` row (currently absent)
   so hero/FAQ/gallery resolve instead of falling back.
6. **Data hygiene** — remove e2e fixture `services` rows; reconcile the
   `promotions` description/percent mismatch; fix menu category↔item mismatches;
   fix the `sitemap.xml` `/membership.html` entry; investigate the
   `HqTbiiU4q4jRFoPg6` typo.
7. **Repo hygiene** — decide whether stray `$null`/`index_clean.html`/`null` and
   the embedded `zt-lounge-admin/` copy should remain (untracked, not served).

## 27. Final Source-of-Truth Classification

### Final Decision Table

| Category | Source of truth | Public path | Hardcoded? | Risk | Status |
|---|---|---|---|---|---|
| Membership | `membership_plans` + benefits | MembershipRepository → MembershipView | No (UI constants only) | Low | DB-driven |
| Services | `services` | ServicesRepository → populateServiceCards/Category | Fallback cards + curated static grids | Medium | Mixed |
| Packages | `service_charges` | getChargesBySlug → [data-charge-name] | No | Low | DB-driven |
| Hero | `hero_slides` + `media_assets` | HeroRepository → populateHero | No | Low | DB-driven |
| Pages | `website_pages` | PageResolver + toggles | Static HTML | Low | DB-driven (toggles) |
| Media | `media_assets` | MediaResolver | Direct storage URLs (fallback) | Low | DB-driven |
| Promotions | `promotions` + `media_assets` | PromotionRepository → populatePromotions | No | Low | DB-driven |
| Gallery | `gallery` + `media_assets` | GalleryRepository | Baked mounts + config fallback | Medium (contact preview) | Mixed |
| Menu | `menu_categories`/`menu_items` | MenuRepository | Config categories; lounge cocktail prices | Medium (lounge) | Mixed |
| Contact | `business_settings` | BusinessRepository → populateBusinessInfo | Yes (configs + JSON-LD) | Medium | Mixed |
| Testimonials | `testimonials` | TestimonialsRepository | No | Low | DB-driven (empty) |
| Booking data | `services` + `service_charges` via `create_booking` | BookingRepository | No | Low | DB-driven |

### Overall Conclusion

The public ZT Lounge website is **MOSTLY CANONICAL WITH IDENTIFIED EXCEPTIONS**.

- Genuinely DB-driven (source + live DB + browser): membership (names/prices/
  benefits), service charges/packages, hero, promotions, gallery (page), menu
  (restaurant-menu), testimonials (empty), booking pricing authority, and core
  business/contact identity (phone/email/address/hours) for elements with `data-*`
  hydration hooks.
- Exceptions (static business content displayed or at risk of divergence): lounge
  cocktail prices; curated static service/feature grids on some internal pages;
  duplicated contact data across configs and baked JSON-LD/footer; contact-page
  gallery preview images.
- Neither "everything database-driven" nor "significantly hardcoded". Exceptions
  are enumerated and traceable above.

## 28. Evidence Index

**Source files (read):**
- `assets/js/shared-components.js` (script registry + header/footer/CONTACT)
- `assets/js/content-loader.js` (subsystem boot; hero/gallery/FAQ/services/
  category/prices/catalog/testimonials/business/promotions/membership/JSON-LD
  renderers; price + business hydration)
- `assets/js/lib/page-identity.js`, `assets/js/lib/BaseRepository.js`
- `assets/js/repositories/{PageResolver,ServicesRepository,MediaResolver,
  HeroRepository,PromotionRepository,GalleryRepository,MenuRepository,
  TestimonialsRepository,MembershipRepository,BusinessRepository,BookingRepository}.js`
- `assets/js/{membership-view,membership.config,business-config,contact.config,
  gallery.config,testimonials.config,menu.config,services.config,booking.config,
  faq.config,seo.config,forms}.js`
- `assets/js/config/{supabase.config,env}.js`
- `index.html`; `pages/experiences/{restaurant,restaurant-menu,lounge,vip}.html`;
  `pages/business/{conference,events,grooming-care}.html`;
  `pages/contact/{gallery,contact}.html`; `sitemap.xml`

**DB evidence (read-only SQL via `supabase db query --linked --project-ref
jczwilrysvnhcjzjztbi`):** information_schema tables/columns; `membership_plans`;
`membership_plan_benefits`; `services`; `service_charges`; `website_pages`;
`hero_slides`; `promotions`; `gallery` (counts); `menu_categories`+`menu_items`;
`business_settings`; `testimonials` (counts); `pg_policies`; `pg_get_functiondef`
(`create_booking`).

**Runtime evidence:** `localhost:8000` HTTP 200; Playwright DOM/network captures
(home, conference, vip, lounge, restaurant-menu, gallery, grooming-care, contact)
stored as `%TEMP%\zt_audit\pub_runtime*.json`.

**Constraint evidence:** `git status --short`, `git branch --show-current`,
`git rev-parse HEAD` at start and end (unchanged).

---

*End of audit. No application source, database, or configuration was modified; no
server was restarted; no business data was created; no booking was submitted;
`supabase db push` was not run.*
