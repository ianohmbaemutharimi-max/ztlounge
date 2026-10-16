# ZT LOUNGE — PUBLIC BUSINESS DATA SOURCE-OF-TRUTH REMEDIATION

## A. Final status

**PARTIALLY COMPLETE**

All defects correctable through the *existing* canonical pipeline were fixed surgically. Two confirmed source-of-truth exceptions were deliberately **not** fixed because correcting them requires a database content/schema decision this task explicitly prohibits (§11). Those are documented in §D with the exact decision required.

- Branch: `feature/membership-tiers-staging-phase1` (unchanged)
- HEAD: `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c` (unchanged)
- DB mutations: **none**. `supabase db push`: **not run**. Schema/RLS: **untouched**.
- Servers: **not started, stopped or restarted** (localhost:8000 was already running; used read-only).
- Pre-existing dirty worktree: **preserved**; nothing reset, cleaned, stashed or discarded.

---

## B. Findings verified

Every prior finding was independently re-checked against current source and the live DB. The previous report was treated as context only.

| Area | Previous Finding | Verified? | Classification | Action |
|---|---|---|---|---|
| A | Lounge cocktail prices hardcoded | **YES** | HARDCODED_BUSINESS_DATA | **NOT FIXED** — no canonical rows exist; DB decision required |
| B | Curated conference/VIP feature grids | **YES** | ARCHITECTURAL_DECISION | **NOT FIXED** — not in services model; forcing it would create conflicting records |
| C | `business-config.js` = competing authority | **NO** | LEGITIMATE_FALLBACK | No structural change; **stale contradicting address corrected** |
| C | `shared-components.js` CONTACT = competing authority | **NO** | LEGITIMATE_FALLBACK | None |
| D | Contact gallery preview hardcoded | **YES** | HARDCODED_BUSINESS_DATA | **FIXED** — now canonical CMS mounts |
| E | JSON-LD business data stale/hardcoded | **YES (partial)** | MIXED_AUTHORITY | **PARTIALLY FIXED** — dynamic node canonical; `postalCode`/`addressRegion` blocked |
| F | `index.html:373` map URL typo | **YES** | HARDCODED_BUSINESS_DATA (stale) | **FIXED** |
| — | Stale `Milimani Road` address in fallbacks/JSON-LD | **NEW (found this task)** | HARDCODED_BUSINESS_DATA (contradicts DB) | **FIXED** (4 locations) |

### Evidence for the key re-verifications

- **A (lounge prices)** — `pages/experiences/lounge.html:675,680,685,690` render `From KES 1,200 / 1,500 / 2,000 / 800` as literal HTML (runtime-confirmed: `prices=["From KES 1,200","From KES 1,500","From KES 2,000","From KES 800"]`). Live `menu_items` Bar Menu contains only **Cocktail Selection (850.00)** and **Signature Cocktail (750.00)** — none of the four offerings. The only `services` row for the lounge page is `Lounge & Bar` at `0.00`. **No canonical row exists for any of the four values.**
- **B (feature grids)** — live `services` has exactly **one** row for `page_key='conference'` (`Conference`, `0.00`) and one for `vip` (`VIP Cabins`, `0.00`). `Boardroom`, `Training Room`, `Seminar Hall`, `Catering Services`, `AV Equipment`, `Private Entrance`, `Premium Service`, `Exclusive Bar`, `Evening Privacy` exist **only** in `conference.html` / `vip.html` markup.
- **C (contact fallbacks)** — `business-config.js:93-116` resolves every field as `settings.X || FALLBACK_CONFIG.X` (DB wins); `shared-components.js:96-105` is explicitly documented as "Canonical contact fallbacks — hydrated from business_settings". These are **fallbacks by design, not competing authorities**. However `FALLBACK_CONFIG.address.street/full` held `Milimani Road` / `Milimani Road, Meru, Kenya`, which **contradicts** the live DB value `Opposite Ezri Hotel, Milimani, Meru`. A contradicting fallback is a real divergence risk, so only those literals were aligned.
- **F (map URL)** — `index.html:373` held `HqTbiiU4q4jRFoPg6`; the canonical value in `business_settings.google_maps_url` and the other 13 source occurrences is `HqTbiiU4q2jRFoPg6` (single-character `4`→`2` typo). Post-fix count: 0 occurrences of the typo, 12 of the canonical value.
- **D (contact gallery)** — `contact.html` previously contained 4 raw `https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/...gallery-0N.webp` URLs, while `index.html:327-338` already used empty CMS mounts. Live `gallery`: 13 rows, all `page_key='gallery'`, 13 active, **1 featured**.

---

## C. Fixes implemented

### Fix 1 — `index.html:373` Google Maps directions URL
- **Old:** `href="https://maps.app.goo.gl/HqTbiiU4q4jRFoPg6"` (typo, wrong destination)
- **New:** `href="https://maps.app.goo.gl/HqTbiiU4q2jRFoPg6"`
- **Why canonical:** matches `business_settings.google_maps_url` and every other occurrence. The link also carries `data-map-link`, so at runtime `populateBusinessInfo` overwrites the href from the DB anyway — the static value is the pre-hydration fallback and was wrong.
- **Evidence:** source grep (0 typo / 12 canonical post-fix); DB `google_maps_url`.

### Fix 2 — `pages/contact/contact.html` gallery preview → canonical CMS mounts
- **Old:** 4 `<figure class="gallery-preview-item">` each containing a hardcoded absolute Supabase Storage `src`.
- **New:** the same 4 mounts with empty `<img alt="" loading="lazy" decoding="async" />` and a comment documenting the canonical contract — the pattern already used by `index.html`.
- **Why canonical:** removes a second, hardcoded gallery authority. Images now arrive only from `gallery → media_id → media_assets.public_url` via the existing `GalleryRepository` + `MediaResolver`. No new gallery system, no new image URLs, no schema change.
- **Evidence:** source — the contact gallery block now contains zero `supabase.co/storage` URLs. Runtime (§G) — contact returned exactly one populated mount and three hidden mounts, which is the correct canonical outcome for a DB that has only **1** `is_featured` gallery row; the image is served through the repository/MediaResolver path. (No `data-gallery-id` value is claimed here — it was not captured.)


---

## D. Findings intentionally NOT changed

### D1. Lounge cocktail prices — **architectural/content decision required** *(not a code defect)*

`lounge.html:675,680,685,690` display `From KES 1,200 / 1,500 / 2,000 / 800` for House Signature Collection, Premium Whiskey Selection, Vintage Wine Cellar and Artisanal Mocktails.

**Why not fixed:** there is no canonical source to migrate them to. Live `menu_items` has no rows for any of these four offerings (Bar Menu contains only *Cocktail Selection* 850 and *Signature Cocktail* 750), and the lone `services` row for the lounge page is `Lounge & Bar` at `0.00`. Making them DB-driven requires **inserting four business records** — a DB content mutation this task forbids (§11). Inventing a menu section/price column is likewise forbidden (§5).

**Decision required (product owner):** either (a) authorise seeding these four offerings as `menu_items` rows (with correct category, price, media) and switch the section to the existing `MenuRepository`/`menu.config.js` chain, or (b) confirm these are indicative "from" prices that should be edited as copy by the content owner, or (c) remove the price spans. Until then these four values remain the one genuinely hardcoded business claim in the public source.

### D2. Curated feature grids (conference / VIP / events / grooming) — **architectural decision required**

`Boardroom`, `Training Room`, `Seminar Hall`, `Catering Services`, `AV Equipment` (`conference.html:651,631,462-463`) and `Private Entrance`, `Premium Service`, `Exclusive Bar`, `Evening Privacy` (`vip.html`) are static curated content.

**Why not fixed:** these offerings are **not represented in the `services` model** — `services` holds one umbrella row per page (`Conference`, `VIP Cabins`, `Events`, `Lounge & Bar`, all `0.00`). Converting the grids would mean either inventing a schema (forbidden) or creating service rows that duplicate/compete with the existing umbrella rows. The task explicitly instructs not to force this conversion absent evidence that the architecture intends these grids to be CMS-managed — and no such evidence exists: there is no page-content/feature-grid table, and `website_pages` carries no field for them. They are best classified as **curated presentation content**, not a broken data path.

### D3. JSON-LD `postalCode` and `addressRegion` — **schema decision required**

`postalCode: "60200"` and `addressRegion: "Meru County"` remain static. Verified against the live schema: `business_settings` has **no** `postal_code`, `region` or `county` column. Deriving them from `business_settings` is impossible without an **ALTER TABLE**, which is prohibited (§11). Their current values do not contradict any canonical field, so they are a coverage gap rather than an active divergence. Fixing it needs an explicit schema decision.

### D4. Out of scope per §10 — not touched
- `index.html:121` Restaurant JSON-LD `image` (a hardcoded storage URL) — the existing runtime loop overwrites it with `resolved_logo_url`, so it is not a source-of-truth regression.
- Stray artifacts (`$null`, `index_clean.html`, embedded `zt-lounge-admin/`), `/membership.html` sitemap entry, promotion/menu data-quality mismatches, test fixtures — all belong to separate cleanup/data-quality phases.


## C (continued). Fixes implemented

### Fix 3 — Stale address literals aligned to the canonical DB value (4 sites)

Found during this task while verifying finding C. The canonical `business_settings.address` is `Opposite Ezri Hotel, Milimani, Meru`, but four shipped values still said `Milimani Road` — a genuine competing authority, not a neutral fallback.

| File | Line(s) | Old | New |
|---|---|---|---|
| `assets/js/business-config.js` | 25, 33 | `street: 'Milimani Road'`, `full: 'Milimani Road, Meru, Kenya'` | `street/full: 'Opposite Ezri Hotel, Milimani, Meru'` |
| `assets/js/content-loader.js` | 1252 | `biz.address \|\| 'Milimani Road, Meru, Kenya'` | `biz.address \|\| 'Opposite Ezri Hotel, Milimani, Meru'` |
| `index.html` | 365 | `<span data-business-address>Milimani Road, Meru, Kenya</span>` | `Opposite Ezri Hotel, Milimani, Meru` |
| `pages/experiences/restaurant.html` | 532 | `"streetAddress": "Milimani Road"` | `"Opposite Ezri Hotel, Milimani, Meru"` |

- **Why canonical:** each is a *default/fallback* whose only purpose is to match the DB when the DB is unreachable. A default that contradicts the canonical record is a latent production divergence, so aligning the literal is the minimal correct fix. `FALLBACK_CONFIG` remains a fallback — its precedence logic (`settings.X || FALLBACK_CONFIG.X`) was **not** altered, so DB still wins.
- **Evidence:** source grep — `Milimani Road` now returns **0** matches in these files (and 0 repo-wide outside the excluded admin/`.next`/`index_clean` paths). Runtime — every tested page renders `Opposite Ezri Hotel, Milimani, Meru`.

### Fix 4 — `content-loader.js` JSON-LD now uses canonical business data

- **Old:** the static-JSON-LD refresh loop wrote only `address.streetAddress` and `image`. `telephone`, `email`, `addressLocality`, `addressCountry`, `geo` and `openingHoursSpecification` remained literals baked into `index.html` / `contact.html` / `restaurant.html`.
- **New:** the same loop additionally writes `telephone`, `email`, `addressLocality`, `addressCountry` and `geo` from the resolved `business_settings` record, and derives `openingHoursSpecification` via a new `buildOpeningHoursSpecification(hours)` helper (`:1210`) from the canonical `opening_hours` map. The dynamic node also gains `logo` from `resolved_logo_url` (`:1289`).
- **Why canonical:** visible UI was already DB-driven via `data-*` hooks; structured data now reads from the *same* resolved `BusinessRepository` object, so the two cannot disagree. No business value was hardcoded a second time; the schema.org shape is unchanged.
- **Evidence:** source (lines above); runtime — `telephone` resolves to the DB value on all tested pages, `openingHoursSpecification` present, no page errors. `business_settings.opening_hours` = 7 days `10:00 AM - 2:00 AM`, matching the rendered `Mon - Sun: 10:00 AM - 2:00 AM`.

---

## E. Source-of-truth verification

| Category | State after remediation | Notes |
|---|---|---|
| Membership plans / prices / benefits | **DB-driven** (untouched) | No membership record exists in public source; regression-checked (§F) |
| Hero | **DB-driven via media_id** (untouched) | `hero_slides` → `media_assets.public_url`; no static hero URL introduced |
| Services | **DB-driven, informational** (untouched) | Service cards remain informational; no schema change |
| Packages / charges | **Charge-driven** (untouched) | Package prices still render from the existing charge authority |
| Booking pricing | **Server-authoritative** (untouched) | Client still submits identifiers only; no client price trust added |
| Gallery (homepage) | **DB-driven** (pre-existing) | `is_featured` selection + MediaResolver |
| Gallery (contact preview) | **DB-driven (FIXED)** | Was hardcoded; now the same pipeline as the homepage |
| Contact business info | **DB-driven, single runtime source** | `BusinessService.getContact()`; configs are true fallbacks, now non-contradicting |
| Map / directions link | **DB-driven** (FIXED) | Typo corrected; `data-map-link` re-hydrates from DB |
| Structured data (JSON-LD) | **DB-driven for available fields** | `postalCode`/`addressRegion` remain static (D3) |
| Lounge cocktail prices | **STILL HARDCODED** | No canonical source exists — D1 |
| Curated feature grids | **Static presentation content** | Architectural decision — D2 |
| Media URLs in new UI logic | **None introduced** | All new logic resolves through `MediaResolver` |

---

## F. Regression verification

| Area | Result | Evidence |
|---|---|---|
| Membership | **PASS** | No membership values present in any public HTML/JS (grep for `KSh 5,000` / `5000` / `10,000` → 0 hits). `MembershipRepository` / `membership.config.js` untouched. Homepage still wires the membership feature through `shared-components.js` `data-features`. |
| Hero | **PASS** | `populateHero` untouched; homepage rendered 3 hero slides and served `restaurant/hero-restaurant.webp` over the network (HTTP 200) from Supabase Storage. No static hero URL added. |
| Services / packages | **PASS** | Conference rendered `KES 25,000 / 4,500 / 6,500` and package labels `Half-Day Package - KES 25,000`, `Full-Day Package - KES 4,500`; VIP `KES 8,500 / 12,500 / 18,500`; events `KES 30,000 / 55,000 / 85,000`. `ServicesRepository` / `service_charges` path unmodified. |
| Booking | **PASS** | No booking form, `create_booking` call, or client price authority touched. No booking was submitted. |
| Gallery | **PASS** | Homepage mounts took the safe empty state (0 featured rows in the home scope, no stale images). Contact shows 1 populated + 3 hidden mounts, matching the single `is_featured` DB row. `gallery.html` and `restaurant-menu.html` galleries still resolve. |
| Contact | **PASS** | All 9 tested pages render `Opposite Ezri Hotel, Milimani, Meru` and `Mon - Sun: 10:00 AM - 2:00 AM`, both from `business_settings`. |
| JSON-LD | **PASS** | All JSON-LD blocks parsed as valid JSON (no `PARSE_ERR`); `telephone` / `streetAddress` / `openingHoursSpecification` reflect canonical values; schema.org structure unchanged. |

---

## G. Runtime verification

The server was **already running** (HTTP 200 on `http://localhost:8000`) and was **not** started, stopped or restarted by this task. Playwright (node v24.18.0) was used read-only: no storage mutation, no JWT injection, no session forging, no form submission, no application-data mutation.

| Page | HTTP | Result |
|---|---|---|
| `/` | 200 | **PASS** — 0 page errors; address + hours canonical; hero served from Storage; gallery empty-state correct |
| `/pages/contact/contact.html` | 200 | **PASS** — 0 errors; gallery now 1 canonical + 3 hidden (Fix 2 verified at runtime) |
| `/pages/experiences/lounge.html` | 200 | **PASS** — 0 errors; cocktail prices still hardcoded (D1, expected) |
| `/pages/business/conference.html` | 200 | **PASS** — 0 errors; package prices intact |
| `/pages/experiences/vip.html` | 200 | **PASS** — 0 errors; cabin prices intact |
| `/pages/business/events.html` | 200 | **PASS** — 0 errors; package prices intact |
| `/pages/business/grooming-care.html` | 200 | **PASS** — 0 errors |
| `/pages/experiences/restaurant-menu.html` | 200 | **PASS** — 0 errors; menu prices render from DB |
| `/pages/contact/gallery.html` | 200 | **PASS** — 0 errors |

**Runtime verdict: PASS for all 9 pages**, with zero uncaught page errors. The intermittent `ERR_CONNECTION_REFUSED` seen during the earlier audit did not recur. Each page was attempted up to 3 times; all reached HTTP 200.

**Static verification:** `node --check` passed on `content-loader.js` and `business-config.js`. This is a static site with no TypeScript/build step, so no type-check or bundler validation was applicable.

**Verification limits (honest):**
- The booking flow was verified **statically only**. No booking was submitted, so the end-to-end `create_booking` server-side price resolution was not exercised at runtime.
- Membership plans render through a feature-gated modal that was not opened in the capture, so membership is **VERIFIED BY SOURCE + DATABASE**, not by DOM observation in this run. (The prior audit's browser capture did observe live membership prices; that observation is not re-claimed here.)
- The contact gallery fix is confirmed by mount counts and resolved image URL, but the specific `gallery.id` stamped on the mount was not captured and is therefore not asserted.

---

## H. Git / change scope

Branch `feature/membership-tiers-staging-phase1` and HEAD `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c` are **unchanged** from the start of this task.

**Files changed by this task (5):**
1. `index.html` — map URL typo (line 373); address fallback (line 365)
2. `pages/contact/contact.html` — gallery preview → canonical CMS mounts
3. `pages/experiences/restaurant.html` — JSON-LD `streetAddress` (line 532)
4. `assets/js/business-config.js` — fallback address literals (lines 25, 33)
5. `assets/js/content-loader.js` — gallery preview page scope; JSON-LD canonical refresh; address default (line 1252)

**Files created by this task (2, both documentation):**
- `PUBLIC_BUSINESS_DATA_SOURCE_OF_TRUTH_REMEDIATION.md`
- `PUBLIC_BUSINESS_DATA_SOURCE_OF_TRUTH_REMEDIATION_PROGRESS.md`

**Unrelated modifications:** none. The worktree was already heavily dirty before this task began (~150 modified/untracked entries, including `.next/` build output, prior audit `.md` files and `scripts/`). All of that is pre-existing and was **preserved untouched** — nothing was reset, cleaned, stashed, checked out, switched or discarded. Evidence artifacts were written only to `%TEMP%\zt_audit\`, outside the repository.

**Explicit confirmations:** no schema change · no migration · no RLS change · no `supabase db push` · no DB insert/update/delete · no user, booking, membership, service or media created · no server start/stop/restart.


