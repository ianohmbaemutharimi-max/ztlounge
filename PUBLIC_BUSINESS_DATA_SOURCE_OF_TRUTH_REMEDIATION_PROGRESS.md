# PUBLIC BUSINESS DATA SOURCE-OF-TRUTH REMEDIATION — PROGRESS

## Start state
- Branch: `feature/membership-tiers-staging-phase1`
- HEAD: `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c`
- Worktree: heavily dirty (pre-existing). Preserved. Not reset/cleaned.
- Public runtime: `http://localhost:8000` ALREADY RUNNING (HTTP 200). Not started/restarted by this task.
- Playwright: available (`node_modules\playwright`), node v24.18.0
- DB: `jczwilrysvnhcjzjztbi` reachable read-only via `supabase db query --linked` (positional SQL arg; `--query` is not a valid flag). No `db push`.

## Audit findings — independently verified
| Area | Previous finding | Verified? | Evidence |
|---|---|---|---|
| A. Lounge cocktail prices | Hardcoded KES 1,200/1,500/2,000/800 | **YES — confirmed hardcoded** | `pages/experiences/lounge.html:675,680,685,690` |
| A. Lounge prices — canonical owner? | — | **NO canonical rows exist** | live `menu_items`: Bar Menu has only "Cocktail Selection" 850, "Signature Cocktail" 750. None of the 4 lounge offerings exist. `services` lounge row = "Lounge & Bar" price 0.00 |
| B. Curated feature grids (conference/vip) | Static business offerings | **YES, but not in services model** | `conference.html:651 Boardroom`, `:631 AV Equipment`; live `services` page_key=conference = 1 row ("Conference", 0.00) |
| C. business-config.js duplication | Duplicated authority | **NO — legitimate documented fallback** | `business-config.js:18-67` FALLBACK_CONFIG, explicitly `settings.X \|\| FALLBACK_CONFIG.X`; DB is canonical |
| C. shared-components CONTACT | Duplicated authority | **NO — legitimate documented fallback** | `shared-components.js:96-105`, hydrated by `populateBusinessInfo` `data-*` hooks |
| D. Contact gallery preview | Hardcoded storage URLs | **YES — confirmed** | `contact.html:701,709,717,725` raw storage URLs; `index.html:327-338` uses empty mounts |
| E. JSON-LD business data | Stale hardcoded values | **YES — confirmed (partial)** | `content-loader.js:1224-1235` refreshes only `address.streetAddress` + `image`; `telephone/email/locality/geo/hours` stay hardcoded in `index.html:84-151`, `contact.html:487-521` |
| F. index.html:373 map URL | Typo | **YES — confirmed 1-char typo** | `HqTbiiU4q4jRFoPg6` vs canonical `HqTbiiU4q2jRFoPg6` (13 other occurrences + live `business_settings.google_maps_url` agree) |

## DB baseline used
- `business_settings`: 1 row — ZT Lounge Meru, +254143542601, ztloungemeru@gmail.com, "Opposite Ezri Hotel, Milimani, Meru", city "Meru  town", country "Kenya", google_maps_url `HqTbiiU4q2jRFoPg6`, lat 0.0476 lng 37.6822, opening_hours map (7 days 10:00 AM-2:00 AM), logo_media_id + favicon_media_id set.
- **`business_settings` has NO `postal_code` and NO `region`/county column** (columns: id,business_name,email,phone,address,google_maps_url,whatsapp,facebook,instagram,opening_hours,logo_url,favicon_url,timezone,currency,created_at,updated_at,tagline,description,twitter,youtube,city,country,latitude,longitude,logo_media_id,favicon_media_id,google_review_url).
- `menu_items` categories: (blank), Appetizers, Bar Menu, Beverages, Desserts, Main Dishes, Signature Grills.
- `services`: 12 rows; conference page has exactly 1 ("Conference", 0.00).
- `gallery`: 13 rows, all on page_key=gallery, 13 active, **1 featured**.

## Fixes made
1. `index.html:373` — map URL typo corrected to canonical `HqTbiiU4q2jRFoPg6`.
2. `pages/contact/contact.html` — 4 hardcoded Supabase Storage gallery URLs replaced with canonical empty mounts (mirrors index.html).
3. `assets/js/content-loader.js` — `populateHomepageGalleryPreview` now also serves the `contact` page scope (same `.gallery-preview-grid` contract), reusing the existing GalleryRepository → MediaResolver chain. No new gallery system.
4. `assets/js/content-loader.js` — `generateJSONLD` extended so the existing static-JSON-LD refresh loop also writes canonical telephone/email/addressLocality/addressCountry/geo, and derives `openingHoursSpecification` from `business_settings.opening_hours`; dynamic schema gains `logo` + `openingHoursSpecification`.

## Findings intentionally NOT changed
- **Lounge cocktail prices** — no canonical DB rows exist for the 4 offerings. Creating rows = DB mutation (prohibited) and inventing schema is explicitly forbidden. → architectural/content decision required.
- **Curated feature grids** (conference Boardroom/Training Room/Seminar Hall/Catering/AV; vip Private Entrance/Premium Service/Exclusive Bar/Evening Privacy) — not represented in `services`; converting would create duplicate/conflicting business records. → architectural decision required.
- **JSON-LD `postalCode` / `addressRegion`** — no `business_settings` column exists; cannot be DB-driven without a schema change (prohibited).
- `index.html:121` Restaurant JSON-LD `image` hardcoded; pre-existing loop overwrites it with `biz.resolved_logo_url`. Not a source-of-truth regression; out of scope.
- All other prior P2/P3 items (stray files, sitemap route, promotion/menu data quality, test fixtures) — explicitly out of scope per task §10.

## Verification
- Source/static: targeted searches after each edit.
- Runtime: Playwright against localhost:8000 (see final report §G).

## Blocked verification
- Creating the missing lounge menu rows / a price column for postal code — BLOCKED (DB mutation prohibited).

---

# PHASE 2 (RE-AUDIT) — appended, not overwritten

## Phase 1 — Baseline (re-established)
- Branch: `feature/membership-tiers-staging-phase1` · HEAD: `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c`
- Dirty worktree: **237 entries, pre-existing**. Preserved; nothing reset/cleaned/stashed.
- Public server: `localhost:8000` **already running** (HTTP 200). Not started/restarted.
- Live DB: reachable read-only (`supabase db query --linked --project-ref jczwilrysvnhcjzjztbi`). 0 writes.
- Note: `assets/js/repositories/BusinessRepository.js` already contained large pre-existing work (inFlight dedup, resolveMediaId, getHours, canonicalWhatsAppUrl, logo_media_id). Those are **not** mine. My change there = 3 lines.

## Phase 2 — Route audit result
Every category traced through actual source. Business identity/contact, hero, gallery, services, packages, menu, membership, promotions all have working canonical routes (see route map). No architectural break found.

## Phase 3 — E-1 / E-2 / E-3 resolved with evidence
| Item | Classification | Evidence |
|---|---|---|
| **E-1** Lounge cocktail prices (`lounge.html:675,680,685,690`) | **CANONICAL_DATA_MISSING — DECISION REQUIRED** | Live `menu_items` has no row for House Signature Collection / Premium Whiskey Selection / Vintage Wine Cellar / Artisanal Mocktails. Bar Menu contains only Cocktail Selection (850) + Signature Cocktail (750). Only lounge `services` row is "Lounge & Bar" @ 0.00. Values are "From KES X" *editorial* framing with no matching entity. No rows inserted. |
| **E-2** Conference/VIP feature grids | **ARCHITECTURAL_GAP — DECISION REQUIRED** | `conference.html:651` Boardroom, `:631` AV Equipment; vip Private Entrance etc. Live `services`: exactly **1** row/page (`conference`→"Conference" 0.00, `vip`→"VIP Cabins" 0.00). These are venue amenities, not bookable services. No model exists; no records created. |
| **E-3** `postalCode` / `addressRegion` | **SCHEMA GAP — DECISION REQUIRED** | Live `business_settings` columns: id,business_name,email,phone,address,google_maps_url,whatsapp,facebook,instagram,twitter,youtube,opening_hours,logo_url,favicon_url,timezone,currency,created_at,updated_at,tagline,description,city,country,latitude,longitude,logo_media_id,favicon_media_id,google_review_url. **No postal-code or county/region column.** No column added. |

## Phase 4 — New D/F defects found this re-audit
| Finding | Location | Class | Evidence |
|---|---|---|---|
| **Stale hours 8:00 AM–10:00 PM** contradicts DB 10:00 AM–2:00 AM | `conference.html:797` | F | live `business_settings.opening_hours` = all 7 days 10:00 AM-2:00 AM |
| **Unhooked address span** (no `data-address`) so never hydrated | `contact.html:909` | D | span lacked the hook `populateBusinessInfo` queries |
| **Address fallback drift** — two branches appended `, Kenya`, contradicting canonical | `BusinessRepository.js:186,208` | F | DB address = "Opposite Ezri Hotel, Milimani, Meru" (no ", Kenya") |

## Phase 5 — Surgical fixes applied (existing pipeline only)
1. `conference.html:797` — stale 8AM–10PM → canonical `10:00 AM - 2:00 AM`.
2. `contact.html:909` — added missing `data-address` hydration hook.
3. `BusinessRepository.js` — introduced single `CANONICAL_ADDRESS_FALLBACK` constant (line 41), used at both fallback sites (199, 221), eliminating the `", Kenya"` drift.

## Phase 6 — Route map + report updated
`PUBLIC_CANONICAL_DATA_ROUTE_MAP.md` and `PUBLIC_CANONICAL_DATA_CLEANUP_REPORT.md` updated; E-1/E-2/E-3 recorded as **NO CANONICAL SOURCE — DECISION REQUIRED** (not "fixed").

## Phase 7 — Verification
- Static: `node --check` on all modified JS = OK. 0 stale 8AM/10PM. 0 `, Kenya` drift literals. 0 map-URL typos.
- Raw storage URL count did **not increase** (gallery-preview grids remain the only raw URLs, and those pages have no CMS gallery rows — confirmed: all 13 live rows are `page_key='gallery'`).
- Runtime (Playwright, read-only): 9/9 pages HTTP 200, no uncaught page errors.

## Blockers / limitations
- Runtime gallery-image observation limited by dev-server asset refusals (`ERR_CONNECTION_REFUSED` on some `/assets/...` requests). Probed twice, then stopped per the 2-failure rule. Not a code defect: where assets load, mounts resolve canonical gallery rows.
- Membership modal has no public route → source-verified only, not runtime-verified.

## Final state
- Files changed by this task: `pages/business/conference.html`, `pages/contact/contact.html`, `assets/js/repositories/BusinessRepository.js`.
- 0 DB writes, 0 migrations, 0 schema changes, 0 RLS changes, 0 server restarts, no bookings submitted.
- Branch and HEAD unchanged; 237 pre-existing dirty entries intact.
