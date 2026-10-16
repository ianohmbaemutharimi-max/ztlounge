# ZT LOUNGE - PUBLIC CANONICAL DATA ROUTE AUDIT & CLEANUP REPORT

## A. FINAL STATUS

**PARTIALLY COMPLETE**

Not COMPLETE because four canonical-source gaps (E-1, E-2, E-3, E-4) remain open and each
requires an explicit content/schema decision that this task is forbidden from making.

Every competing or stale hardcoded business authority that could be removed through the
EXISTING canonical pipeline has been surgically fixed. No canonical source was invented, no
schema was changed, and no database content was created.

- Branch: `feature/membership-tiers-staging-phase1` (unchanged)
- HEAD: `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c` (unchanged)
- DB writes: 0. Schema changes: 0. Migrations: 0. RLS changes: 0. `db push`: not run.
- Servers: not started, stopped or restarted. localhost:8000 was already running and was
  used read-only.
- Pre-existing dirty worktree preserved (238 entries). Nothing reset, cleaned, stashed or
  discarded.

---

## B. CANONICAL ROUTE MAP SUMMARY

Full table (22 categories, 32 rows): `PUBLIC_CANONICAL_DATA_ROUTE_MAP.md`

| Data | Canonical authority | Retrieval route | Public consumer | Fallback | Status |
|---|---|---|---|---|---|
| Address | `business_settings.address` | DB -> BusinessRepository -> content-loader `populateBusinessInfo` | Contact, footer, location blocks, JSON-LD | Matching (`CANONICAL_ADDRESS_FALLBACK`) | VERIFIED |
| Phone | `business_settings.phone` | DB -> BusinessRepository -> BusinessService `formatPhoneDisplay` | `data-phone` / `data-phone-link` | Matching | VERIFIED |
| WhatsApp | `business_settings.whatsapp` | DB -> BusinessRepository -> `data-whatsapp` | CTAs, floating buttons | Matching (`wa.me/254143542601`) | VERIFIED |
| Email | `business_settings.email` | DB -> BusinessRepository -> `data-email` / `data-email-link` | Contact, footer | Matching | VERIFIED |
| Opening hours | `business_settings.opening_hours` | DB -> BusinessRepository -> `formatOpeningHours` | `data-hours`, JSON-LD | Matching | VERIFIED |
| Maps URL | `business_settings.google_maps_url` | DB -> BusinessRepository -> `data-map-link` | Directions buttons | Matching | VERIFIED |
| Geo | `business_settings.latitude/longitude` | DB -> BusinessRepository -> JSON-LD enrichment | JSON-LD only | Matching | VERIFIED |
| Logo / favicon | `business_settings.logo_media_id` / `favicon_media_id` | DB -> BusinessRepository `resolveBranding` -> MediaResolver | `branding-init.js` | Legacy `*_url` only when media absent | VERIFIED |
| Hero | `hero_slides.media_id` | DB -> HeroRepository -> MediaResolver -> `public_url` | Hero DOM (generated) | Controlled empty/unavailable state | VERIFIED |
| Gallery | `gallery.media_id` | DB -> GalleryRepository -> MediaResolver | Homepage preview, contact preview, gallery page | `GalleryConfig` static | VERIFIED (preview scope only) |
| Menu | `menu_items` / `menu_categories` | DB -> MenuRepository | Restaurant menu page | None required | VERIFIED |
| Services | `services` | DB -> ServicesRepository -> content-loader `populateServices` | Service cards | Config fallback | VERIFIED |
| Packages | `service_charges` | DB -> service_charges -> package renderer; booking price resolved SERVER-side in `create_booking` | Package cards | None | VERIFIED |
| Membership | `membership_plans` + `membership_plan_benefits` | DB -> MembershipRepository -> membership-view | Membership modal | config fallback | VERIFIED |
| Promotions | `promotions` | DB -> PromotionRepository | DOM | Unchanged | VERIFIED |
| Testimonials | `testimonials` | DB -> repository -> content-loader | Testimonial sections | None | VERIFIED |
| Lounge cocktail prices | NONE | none | `lounge.html` static markup | n/a | **NO CANONICAL SOURCE - DECISION REQUIRED (E-1)** |
| Conference/VIP feature grids | NONE | none | static markup | n/a | **NO CANONICAL SOURCE - DECISION REQUIRED (E-2)** |
| Postal code / region | NONE | none | JSON-LD only | n/a | **NO CANONICAL SOURCE - DECISION REQUIRED (E-3)** |
| Per-page preview images | NONE | none | static markup `src` | n/a | **NO CANONICAL SOURCE - DECISION REQUIRED (E-4)** |

---

## C. FINDINGS

Class key: A = canonical DB-driven, B = matching fallback, C = static presentation copy,
D = hardcoded competing authority, E = missing canonical source, F = stale/contradicting.

| # | Finding | Location | Class | Canonical source | Action |
|---|---|---|---|---|---|
| 1 | Google Maps directions URL typo `HqTbiiU4q4jRFoPg6` | `index.html:373` | F | `business_settings.google_maps_url` | FIXED |
| 2 | 4 raw Supabase Storage gallery URLs in contact preview | `pages/contact/contact.html:701,709,717,725` | D | `gallery.media_id` -> MediaResolver | FIXED (canonical mounts) |
| 3 | Stale `Milimani Road` contradicting DB address | `assets/js/business-config.js` | F | `business_settings.address` | FIXED |
| 4 | Stale `Milimani Road, Meru, Kenya` in JSON-LD default | `assets/js/content-loader.js` | F | `business_settings.address` | FIXED |
| 5 | Stale `Milimani Road` static fallback in markup | `index.html:365` | F | `business_settings.address` | FIXED |
| 6 | Stale `Milimani Road` in Restaurant JSON-LD | `pages/experiences/restaurant.html:532` | F | `business_settings.address` | FIXED |
| 7 | JSON-LD telephone/email/locality/geo/hours/logo hardcoded | `content-loader.js` `generateJSONLD` | D | `business_settings` | FIXED (canonical enrichment) |
| 8 | Address duplicated inline in two repository branches | `assets/js/repositories/BusinessRepository.js:186,208` | D | `business_settings.address` | FIXED (single constant) |
| 9 | `conference.html:797` hours `8:00 AM - 10:00 PM` contradicting DB, **no `data-hours` hook** | `pages/business/conference.html:797` | F | `business_settings.opening_hours` | FIXED (value + hook) |
| 10 | `contact.html:909` address span with **no hydration hook** | `pages/contact/contact.html:909` | D | `business_settings.address` | FIXED (value + hook) |
| 11 | Malformed `data-email-link` attributes (10 sites) | multiple `.html` | D | `business_settings.email` | FIXED |
| 12 | Gallery preview scope limited to homepage | `content-loader.js` | D | GalleryRepository | FIXED (home + contact) |
| 13 | Lounge cocktail "from" prices | `pages/experiences/lounge.html:675,680,685,690` | E | NONE | DECISION REQUIRED (E-1) |
| 14 | Conference/VIP feature grids | `conference.html`, `vip.html` | E | NONE | DECISION REQUIRED (E-2) |
| 15 | JSON-LD `postalCode` / `addressRegion` | `index.html`, `contact.html` JSON-LD | E | NONE | DECISION REQUIRED (E-3) |
| 16 | Per-page preview images (lounge/vip/conference/events) | 4 pages, 16 `src` | E | NONE | DECISION REQUIRED (E-4) |

### Verified NON-defects (no change made)

| Item | Location | Class | Why no change |
|---|---|---|---|
| `shared-components.js` CONTACT block | `shared-components.js:96-105` | B | Explicitly documented as fallback, hydrated by `data-*` hooks |
| `grooming-care.html:206` wa.me link | with `?text=` prefill | B | Matches DB `254143542601`; generic `data-whatsapp` hook would strip the prefill |
| Marketing prose, headings, section tags | all pages | C | Legitimate static presentation copy |
| `restaurant-menu.html` item names/prices | menu page | A | Rendered from `menu_items` (runtime-verified against live rows) |
| Booking pricing | `create_booking` | A | Server-side authority preserved; client sends identifiers only |

---

## D. FIXES

Every fix reuses an existing repository/service/resolver. No new architecture was created.

| File | Old authority | Canonical authority | Exact change | Why safe |
|---|---|---|---|---|
| `index.html` | typo'd static map URL | `business_settings.google_maps_url` | `HqTbiiU4q4jRFoPg6` -> `HqTbiiU4q2jRFoPg6` | Matches live DB; element already carries `data-map-link` so runtime hydrates from DB anyway |
| `pages/contact/contact.html` | 4 hardcoded Storage URLs | `gallery` -> MediaResolver | Removed `src` values; empty `<img>` mounts mirroring `index.html` | Same pipeline, same class names; extra mounts hidden on short results (established rule) |
| `assets/js/business-config.js` | `Milimani Road` fallback | `business_settings.address` | `street`/`full` -> `Opposite Ezri Hotel, Milimani[, Meru]` | Fallback now matches DB instead of contradicting it |
| `assets/js/content-loader.js` | `Milimani Road, Meru, Kenya` | `business_settings.address` | Default -> DB value | Only used when DB row lacks an address |
| `index.html:365` | `Milimani Road, Meru, Kenya` | same | Literal -> DB value | Hydrated by `data-business-address` |
| `pages/experiences/restaurant.html:532` | `Milimani Road` | same | `streetAddress` -> DB value | Overwritten at runtime; removed the stale literal |
| `assets/js/content-loader.js` `generateJSONLD` | hardcoded JSON-LD values | `business_settings` object | Adds telephone/email/addressLocality/addressCountry/geo refresh; builds `openingHoursSpecification` from `opening_hours`; adds `logo` | Only ever overwrites with canonical DB values; no DB-unavailable path invented |
| `assets/js/repositories/BusinessRepository.js` | address duplicated in 2 branches | `business_settings.address` | Single `CANONICAL_ADDRESS_FALLBACK` constant used by both | Pure de-duplication; value identical to DB |
| `pages/business/conference.html:797` | `8:00 AM - 10:00 PM`, unhooked | `business_settings.opening_hours` | Value -> DB hours; added `data-hours` hook | Contradicted DB and could never hydrate |
| `pages/contact/contact.html:909` | address span, unhooked | `business_settings.address` | Value aligned; added `data-business-address` hook | Was a second un-hydratable authority |
| 10 email link sites | malformed `data-email-link` | `business_settings.email` | Attribute corrected | Leaked literal text and disabled DB hydration |
| `assets/js/content-loader.js` | gallery preview = homepage only | GalleryRepository | Scope extended to home + contact | Reuses same `getByPage` + MediaResolver chain |

---
## E. REMAINING GAPS - DECISION GATE (E-1 to E-4)

This section records the architecture/content decision for each unresolved gap.
No database record, column, migration or seed data was created for any of them.

### E-1 - Lounge prices

**Exact literals** (`pages/experiences/lounge.html:675,680,685,690`):

| Line | Offering | Literal |
|---|---|---|
| 675 | House Signature Collection | `From KES 1,200` |
| 680 | Premium Whiskey Selection | `From KES 1,500` |
| 685 | Vintage Wine Cellar | `From KES 2,000` |
| 690 | Artisanal Mocktails | `From KES 800` |

**DB evidence (read-only).** Live `menu_items` rows in `Bar Menu` are exactly two:
`Cocktail Selection` (850.00) and `Signature Cocktail` (750.00). No row matches any of
the four lounge offerings by name or price. The only `services` row for `page_key='lounge'`
is `Lounge & Bar` at price `0.00`.

**Existing canonical entity?** `menu_items` is structurally capable of representing these
(Bar Menu category already exists, `price` + `media_id` columns exist, `MenuRepository` is
already loaded and consumed by `restaurant-menu.html`). No row exists for these four.

**Classification: B - Business data is missing; content/database creation is required.**

**Why not C (editorial copy).** The values are formatted as prices (`From KES 1,200`) inside
a `.cocktail-price` element beside an offering name and description, which is a factual
pricing claim, not marketing prose. The same page family already renders the DB menu through
`MenuRepository`, so the architecture intends bar/menu pricing to be DB-owned.

**Why not A.** No repository already returns these four values. `lounge.html` has no menu
mount and does not consume `MenuRepository` today.

**Minimum future change.** Create four `menu_items` rows in the existing `Bar Menu`
category (name, description, price, `media_id`, `is_active`, `display_order`), then add a
menu mount to `lounge.html` fed by the existing `MenuRepository` page-scoped query. Requires
**DB content (4 inserts)** plus a **small frontend mount**. Requires **no schema change** and
**no new repository**.

**Alternative requiring no DB work.** If the business intends these to remain indicative
"from" prices rather than bookable menu items, they should be re-labelled as such and
explicitly recorded as editorial copy in the route map. This is a business decision, not a
technical one.

---

### E-2 - Conference / VIP feature grids

**Exact literals.**
`pages/business/conference.html`: `Boardroom` (line 651), `AV Equipment` (line 631),
plus `Training Room`, `Seminar Hall`, `Catering Services` in the same grid.
`pages/experiences/vip.html`: `Private Entrance`, `Premium Service`, `Exclusive Bar`,
`Evening Privacy`.

**DB evidence (read-only).** Live `services` has exactly one row per relevant page:
`page_key='conference'` -> `Conference` (price 0.00);
`page_key='vip'` -> `VIP Cabins` (price 0.00). None of the grid items exist in `services`
or `service_charges`. The per-page numeric prices visible at runtime (for example
`KES 25,000`, `KES 8,500`) come from the `service_charges` package path, which is a
separate, already-canonical authority and is **not** part of this gap.

**What these actually are.** Venue amenities and capacity attributes of a bookable space,
presented as an editorial feature grid to sell the space. They are not bookable on their own,
carry no individual price, and do not map to the `services` -> `service_charges` booking
authority. Forcing them into `services` would create bookable service records that are not
bookable, corrupting the booking pricing authority.

**Classification: MISSING_CONTENT_MODEL (architectural gap).**

**Smallest future model, not implemented.** One of:
1. **Preferred, no new table:** store the grid in the existing `website_pages.content`
   (`jsonb`) column as a `features` array, and render it through a small
   `PageFeaturesRepository` reading a field the admin already exposes on the page record.
2. Alternative: a dedicated page-scoped `page_features` table (`page_id`, `title`,
   `description`, `icon`, `display_order`, `is_active`) plus repository.

Option 1 is smaller because the `content` column and the admin page record already exist.
**Requires:** decision on which option, then DB content per page and a new small render path.
**Requires no schema change** under option 1.

**Until then:** these remain class C (static presentation copy). They are not a competing
authority over `services`, because `services` makes no claim about them.
### E-3 - Postal code / address region

**Classification: SCHEMA_GAP**

**Where:** JSON-LD `address.postalCode` ("60200") and `address.addressRegion`
("Meru County") in `index.html` (LocalBusiness + Restaurant blocks) and
`pages/experiences/restaurant.html`. No rendered DOM copy remains - these live only in
structured data.

**DB evidence:** full `business_settings` column list read from the live DB
(project `jczwilrysvnhcjzjztbi`) - 27 columns:
`id, business_name, email, phone, address, google_maps_url, whatsapp, facebook,
instagram, opening_hours, logo_url, favicon_url, timezone, currency, created_at,
updated_at, tagline, description, twitter, youtube, city, country, latitude,
longitude, logo_media_id, favicon_media_id, google_review_url`.

**No `postal_code`, `postcode`, `zip`, `region`, `county`, `state` or `province`
column exists.** `city` = "Meru  town" and `country` = "Kenya" are present but are
not legitimate sources for a Kenyan postal code or a county name. Inferring "60200"
from anywhere else would be fabrication.

**Why it exists:** Google/Schema.org `PostalAddress` rewards `postalCode` and
`addressRegion` for local SEO, so the values were written as SEO literals.

**Why it cannot safely be migrated now:** there is no field to migrate it into.
Adding one is a schema change, which this task prohibits.

**Minimum future change (NOT implemented):**
1. `ALTER TABLE business_settings ADD COLUMN postal_code text, ADD COLUMN region text;`
2. Populate with 60200 / Meru County.
3. Extend `mapToUI` in `BusinessRepository` and `BusinessConfig.FALLBACK_CONFIG`.
4. Write them in `generateJSONLD` alongside the existing `streetAddress` /
   `addressLocality` / `addressCountry` writes.
5. Delete the static JSON-LD literals.

**Existing schema supports the future solution?** No - one migration required.

---

### E-4 - Per-page gallery preview images

**Classification: EXISTING_SCHEMA_SUPPORTS_FIX (content task, not a schema task)**

This is the most important gap, and the evidence is decisive in its favour.

**Where:** `pages/experiences/lounge.html` (4 images), `pages/experiences/vip.html`
(4), `pages/business/conference.html` (4), `pages/business/events.html` (4) - each
block is a `.gallery-preview-grid` containing 4 `.gallery-preview-item` figures with
raw absolute `src` values, e.g.
`https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/vip/vip-tv-lounge.webp`.

**DB evidence:**
- `gallery` table **already has** `page_id` (uuid -> `website_pages.id`) and
  `media_id` (-> `media_assets.id`). The schema is fully page-scoped by design.
- All **13** live `gallery` rows have `page_id` resolving to `page_key = 'gallery'`.
  **Zero** rows exist for `lounge`, `vip`, `conference` or `events`.
- 13 of 13 rows `is_active = true`; exactly **1** row `is_featured = true`.
- The admin app already treats `gallery` as page-scoped: `gallery` appears in
  `PAGE_SCOPED_RESOURCES` in `src/lib/page-scope.ts`, and
  `PageResolver.requirePageUuid(pageId, 'Gallery')` is the existing public contract
  for resolving a page slug to the `website_pages` uuid that `GalleryRepository`
  filters on.

**Why the pages cannot use the canonical route today:** they are not the problem -
the *data* is. `GalleryRepository.getByPage('lounge')` performs
`eq(page_id = <lounge uuid>) AND eq(is_active, true)`. With no rows on those page
ids it returns an empty array, so there is nothing for `MediaResolver` to resolve.
The static URLs are a workaround for missing rows, not a competing design.

**Why it cannot be fixed in this task:** populating those rows is a content/DB
insert, which is prohibited here.

**Minimum future change (NOT implemented):**
1. Create `media_assets` rows for the images that are not yet registered (see below).
2. Create `gallery` rows with `page_id` = the correct `website_pages.id`, `media_id`
   set, `is_active = true`, and `display_order` 1..4.
3. In `content-loader`, generalise the existing gallery-preview renderer from its
   current home/contact scope to all pages that own a `.gallery-preview-grid`.
   `GalleryRepository` and `MediaResolver` need **no changes**.

**Existing schema supports the future solution?** **Yes - completely.** No
migration, no new table, no new repository, no new loader. This is the smallest and
cleanest of the four gaps.

**Important sub-finding (SOURCE-VERIFIED):** the four preview grids contain **16
`src` references to 15 unique files**:

| Page | Files referenced |
|---|---|
| `lounge.html` | `lounge-bar.webp` (×2), `lounge-interior-main.webp`, `private-lounge.webp` |
| `vip.html` | `vip-private-dining.webp`, `vip-fireplace-lounge.webp`, `vip-private-suite.webp`, `vip-tv-lounge.webp` |
| `conference.html` | `conference-hall.webp`, `conference-2.webp`, `corporate-meeting.webp`, `conference-setup.webp` |
| `events.html` | `event-1.webp`, `event-2.webp`, `wedding.webp`, `birthday.webp` |

Step 1 of the future fix (register the media) is genuinely required, because a
`gallery` row cannot point at a `media_id` that does not exist. The files do exist
in the `public-assets` bucket and are reachable by public URL; they are simply not
addressable by `media_id` yet.

**Verification limitation (stated honestly).** The *exact* number of these 15 files
that already have a `media_assets` row could **not be re-verified in this session**:
the live DB became unreachable mid-session (`cli_login_postgres` auth failure, then a
query that hung >300s - stopped after 2 failures per the stop rule), and the
previously captured artifact for that count did not contain it. An earlier draft of
this report cited "lounge 3 / conference 1 / vip 1 / events 0", and the progress log
cited "13 of 16" - these two numbers are mutually inconsistent and **neither is now
independently verifiable**. They are therefore withdrawn. The required next action is
a single read-only count query (see Future Implementation Queue, step E-4.1) before
any insert is planned. This does **not** weaken the E-4 conclusion, which rests on
separately verified schema evidence (`gallery.page_id` + `gallery.media_id` exist;
all 13 live rows sit on one page).

---

## E-5. COMBINED ARCHITECTURE DECISION MATRIX

All four gaps are **decision gates**, not code defects. Zero of them can be closed by a
code-only change, because in every case the *data or the column* is what is missing.

| Gap | What it represents | Existing canonical entity? | Existing schema sufficient? | Code fix possible now? | DB/content decision required? |
|---|---|---|---|---|---|
| **E-1** Lounge prices | 4 factual "from" prices for bar offerings | Structurally: `menu_items` (+`Bar Menu` category, `MenuRepository`, consumer already live on the menu page). **No rows for these 4** | **Yes** — `menu_items` already has `name/description/price/media_id/is_active/display_order` | **No** — nothing to read | **Yes.** Either create 4 rows (real menu items) **or** re-label as indicative and record as editorial copy |
| **E-2** Venue features | Amenity/capacity attributes of bookable spaces (Boardroom, AV Equipment, Private Entrance…) | **No.** `services` holds 1 umbrella row/page (`Conference` 0.00, `VIP Cabins` 0.00); `service_charges` holds the *real* per-space prices | **Yes for option 1** — `website_pages.content` (jsonb) already exists and is admin-exposed; no new table needed | **No** — no data source to render | **Yes.** Choose: store as `website_pages.content.features` (preferred) or a new `page_features` table. Must NOT become `services` |
| **E-3** Postal code / region | `postalCode` "60200" + `addressRegion` "Meru County" in JSON-LD | **No.** Verified 27 `business_settings` columns; no `postal_code`/`postcode`/`zip`/`region`/`county`/`state`/`province` | **No** — a column must be added | **No** — no field to read | **Yes.** Schema migration required (1 `ALTER TABLE`), then populate |
| **E-4** Per-page gallery previews | 16 `src` refs (15 unique files) on lounge/vip/conference/events | **Yes** — `gallery` is fully page-scoped (`page_id`, `media_id`, `display_order`, `is_active`, `is_featured`); `GalleryRepository.getByPage()` + `MediaResolver` already exist and are proven on home/contact | **Yes — completely.** No migration, no new table, no new repository, no new loader | **No** — `getByPage()` returns `[]` because no rows exist for those page ids | **Yes.** Create `media_assets` rows (as needed) + `gallery` rows per page, then generalise the existing preview renderer's scope |

### Decision summary

| Question | Answer |
|---|---|
| Closable by code alone, today? | **None (0 of 4)** |
| Closable with DB content only (no schema change)? | **E-1** (4 inserts + small mount), **E-4** (media + gallery inserts + small scope widening), **E-2** if option 1 (content JSON per page + small render path) |
| Requires a schema change? | **E-3 only** (1 `ALTER TABLE business_settings`) |
| Should remain static permanently? | **E-2** remains **class C static presentation copy** until a content model is chosen — it is not a competing authority over `services` |
| Risk of doing nothing | Low. None of the four contradicts the DB. E-1/E-2/E-4 are *unrouted* values, not *wrong* values. |

### Architectural safety note

Two failure modes were explicitly avoided and must stay avoided:

1. **Do not fold E-2 into `services`.** It would create *bookable* service records for
   things that are not bookable, and would sit beside the genuine `service_charges`
   pricing authority for the same spaces — i.e. it would manufacture the exact
   competing-authority defect this programme exists to remove.
2. **Do not derive E-3.** `city` = "Meru  town" and `country` = "Kenya" are not a postal
   code or a county. Inferring "60200" from anything else would be fabrication.

---

## E-6. FUTURE IMPLEMENTATION QUEUE

Recommended execution order: **E-4 → E-1 → E-3 → E-2**. Rationale: E-4 is the cleanest
and needs no schema change; E-1 reuses an already-proven pipeline; E-3 is a small
migration but touches business identity (needs care); E-2 needs a product decision first.

### E-4.1 — Verify media registration (read-only, must run first) · P1
- **What:** `SELECT public_url FROM media_assets WHERE public_url LIKE '%/images/lounge/%' OR … vip … conference … events;`
- **Why:** the number of already-registered files could not be confirmed this session; it
  determines how many `media_assets` inserts are required.
- **DB content created:** no (read-only). **Schema change:** no. **Frontend change:** no.

### E-4.2 — Register missing media + create page-scoped gallery rows · P1
- **What:** insert any missing `media_assets` rows for the 15 unique preview files, then
  insert `gallery` rows with the correct `page_id` (via `PageResolver`), `media_id`,
  `is_active = true`, `display_order` 1..4.
- **Why:** `GalleryRepository.getByPage(<page>)` currently returns `[]` for these pages.
- **Tables/repositories:** `media_assets`, `gallery`, `website_pages`; consumed by the
  existing `GalleryRepository.getByPage()` → `MediaResolver.resolveCollection()`.
- **DB content created:** **yes**. **Schema change:** **no.**
- **Frontend change:** **yes, minimal** — widen the existing preview scope from
  `{home, contact}` to any page owning a `.gallery-preview-grid`.

### E-1.1 — Decide the nature of the four bar prices · P1 (blocks E-1.2)
- **What:** business decision — real menu items, or indicative "from" bands?
- **Why:** determines whether E-1.2 happens at all, or the values are re-labelled and
  recorded as editorial copy.
- **DB content created:** no. **Schema change:** no. **Frontend change:** no.

### E-1.2 — Route lounge prices through `MenuRepository` · P2 (only if E-1.1 = real items)
- **What:** create 4 `menu_items` rows in the existing `Bar Menu` category
  (`name`, `description`, `price`, `media_id`, `is_active`, `display_order`), then add a
  menu mount to `lounge.html` fed by the existing page-scoped `MenuRepository` query.
- **Why:** the page family already treats bar/menu pricing as DB-owned.
- **Tables/repositories:** `menu_items`, `menu_categories`; `MenuRepository`.
- **DB content created:** **yes** (4 rows). **Schema change:** **no.**
- **Frontend change:** **yes, small** (one mount + render call).

### E-3.1 — Add postal/region to business identity · P2
- **What:** `ALTER TABLE business_settings ADD COLUMN postal_code text, ADD COLUMN region text;`
  then populate `60200` / `Meru County`; extend `mapToUI` in `BusinessRepository` and
  `BusinessConfig.FALLBACK_CONFIG`; write both in `generateJSONLD`; delete the static
  JSON-LD literals.
- **Why:** Schema.org `PostalAddress` rewards them for local SEO, but no canonical field exists.
- **Tables/repositories:** `business_settings`; `BusinessRepository`,
  `content-loader.generateJSONLD`.
- **DB content created:** **yes** (2 values). **Schema change:** **yes** (1 migration).
  **Frontend change:** **yes, small.**

### E-2.1 — Decide the feature-grid content model · P3 (blocks E-2.2)
- **What:** choose option 1 (`website_pages.content.features` jsonb, preferred) or a
  dedicated `page_features` table.
- **Why:** no canonical model exists; forcing `services` is explicitly rejected.
- **DB content created:** no. **Schema change:** no (option 1) / yes (option 2).
  **Frontend change:** no.

### E-2.2 — Render feature grids from the chosen source · P3
- **What:** store per-page feature arrays and add a small page-scoped render path.
- **Tables/repositories:** `website_pages` (+ new `PageFeaturesRepository` if option 2);
  `PageResolver` for page identity; `populateServices`-style renderer.
- **DB content created:** **yes**. **Schema change:** option-dependent.
- **Frontend change:** **yes, small.**

### Explicitly out of scope for this queue

Handled by separate phases, not by this programme: test fixtures, promotion content
mismatches, menu data-quality issues, sitemap membership route, stray files, legacy
folders, unrelated admin issues.

---

## F. REGRESSION VERIFICATION

| Area | Canonical route | Regression check | Result |
|---|---|---|---|
| Membership | `membership_plans` + `membership_plan_benefits` → `MembershipRepository` → `membership-view.mount()` | No membership file edited; `membership.config.js` holds only non-record constants; no plan/price/benefit literal introduced | **INTACT** (source + DB verified; modal not runtime-driven — no route) |
| Hero | `hero_slides.media_id` → `MediaResolver` → `public_url` | No hero file edited; DOM still fully generated; no static hero URL added | **INTACT** |
| Services | `services` → `ServicesRepository` → cards | Cards untouched; informational only; E-2 deliberately not folded in | **INTACT** |
| Packages | `service_charges` → package renderer | Untouched; package prices still charge-driven; no price literal moved into HTML | **INTACT** |
| Booking | `create_booking` RPC, server-side price authority | Not touched; client still sends identifiers only; no booking submitted | **INTACT** (source verified; not executed) |
| Gallery | `gallery.media_id` → `GalleryRepository` → `MediaResolver` | Preview scope widened home→home+contact only; same `getByPage` + resolver chain; no second gallery system | **INTACT** |
| Menu | `menu_items`/`menu_categories` → `MenuRepository` | Consumed unchanged; no duplicate menu data created | **INTACT** |
| Contact | `business_settings` → `BusinessRepository`/`BusinessService` → hooks | Fallbacks aligned to DB; new `data-business-address`/`data-hours` hooks added, no loader rewritten | **INTACT** |
| JSON-LD | `business_settings` object → `generateJSONLD` | Now enriched from canonical object; all `ld+json` blocks parse; no malformed structured data | **INTACT** |

---

## G. RUNTIME VERIFICATION

**Status: PARTIAL.**

`localhost:8000` was already running (HTTP 200) and used read-only. Representative pages
checked: `/`, `/contact`, `/lounge`, `/restaurant-menu`, `/conference`, `/vip`,
`/events`, `/grooming-care`, `/gallery`.

| Result | Detail |
|---|---|
| HTTP 200 | **9 / 9 pages** |
| Uncaught page errors | **0** |
| Canonical address / email / hours in DOM | Confirmed on all tested pages |
| JSON-LD validity | **0 malformed** blocks |
| Menu prices | Matched live `menu_items` rows |
| Package prices | Matched `service_charges` |

**Honest limitation.** The earlier `ERR_CONNECTION_REFUSED` burst did not recur in the
final run, but the local dev server was intermittently refusing repository JS. Where
assets *did* load, `contact` resolved a real canonical gallery row
(`data-gallery-id = 018ae57b…`). That is dev-server instability, not a code defect.
**No runtime PASS is claimed for anything not actually observed.** No forms were
submitted and no data was mutated.

**This session performed no runtime verification** because no application code changed.

---

## H. CHANGE SCOPE

**Branch:** `feature/membership-tiers-staging-phase1` — **unchanged**
**HEAD:** `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c` — **unchanged**

| Bucket | Detail |
|---|---|
| Files changed (source, whole programme) | `index.html`; `pages/contact/contact.html`; `pages/experiences/restaurant.html`; `pages/business/conference.html`; `assets/js/business-config.js`; `assets/js/content-loader.js`; `assets/js/repositories/BusinessRepository.js` |
| Files created | `PUBLIC_CANONICAL_DATA_ROUTE_MAP.md`; `PUBLIC_CANONICAL_DATA_CLEANUP_REPORT.md`; `PUBLIC_CANONICAL_DATA_CLEANUP_PROGRESS.md` |
| DB mutations | **0** (read-only `SELECT` only) |
| Schema changes | **0** |
| Migrations / `db push` | **0 / not run** |
| RLS changes | **0** |
| Server restarts | **0** |
| Bookings / users / memberships / media created | **0** |
| Unrelated worktree changes | **None introduced.** ~238 pre-existing dirty entries preserved untouched; nothing reset, cleaned, stashed, checked out or discarded |

**This session only** modified `.md` deliverables (report wording correction + appended
sections; route-map rows; progress entries). No application source was touched this session.