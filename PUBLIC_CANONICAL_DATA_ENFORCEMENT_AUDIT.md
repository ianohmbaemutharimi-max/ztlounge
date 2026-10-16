# PUBLIC_CANONICAL_DATA_ROUTE_ENFORCEMENT_AUDIT

Branch `feature/membership-tiers-staging-phase1` - HEAD `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c`
Canonical DB `jczwilrysvnhcjzjztbi` (read-only).

---

## 1. FINAL STATUS

**PARTIALLY COMPLETE.**

Four unresolved canonical-source gaps remain open by design (**E-1, E-2, E-3, E-4**). Each
requires DB content, schema, or a product decision that this task explicitly prohibits.
Three genuine Class D code defects were found and fixed this task (see section 5).
Nothing was invented, no schema was touched, and no DB row was created.

This audit **overturns one prior conclusion**: the previous report recorded E-4 media
coverage as unverified and implied `generateJSONLD()` canonical enrichment was working.
Fresh evidence shows the JSON-LD enrichment was **broken end-to-end** (Class D, now fixed)
and E-4 coverage is **0 of 15**, not "13 of 16" or "3/1/1/0".

---

## 2. BASELINE

| Item | Value |
|---|---|
| Branch | `feature/membership-tiers-staging-phase1` (unchanged) |
| HEAD | `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c` (unchanged) |
| Pre-existing dirty entries | **238** at baseline - not mine, preserved untouched |
| Canonical DB | `jczwilrysvnhcjzjztbi` |
| Application source changed | `assets/js/services/BusinessService.js` **only** |

### Critical environment discovery (new finding)

`supabase db query --linked` resolves `supabase/.temp/project-ref` = **`jczavwuaiywnhpfigvlw`**
- a **staging** project whose `public` schema holds only **6 tables**
(`customers`, `profiles`, `membership_plans`, `membership_plan_benefits`,
`media_assets`, `customer_memberships`).

It contains **no `business_settings`, `gallery`, `menu_items`, `services`, `hero_slides`,
or `website_pages`**. An early CLI query returned
`ERROR 42P01: relation "gallery" does not exist`.

`assets/js/config/env.js` documents this exact trap: the staging project "has no CMS
tables, so every query issued against it failed". **The CLI and the app read different
databases.** All DB evidence in this audit was therefore gathered through the read-only
PostgREST endpoint the browser itself uses (`/rest/v1`, anon key, RLS-protected) against
`jczwilrysvnhcjzjztbi`.

**Any prior conclusion derived from `supabase db query --linked` is unreliable and should
be re-verified.** No writes were issued by either path.

---

## 3. CANONICAL ARCHITECTURE (verified, not assumed)

```
business_settings -> BusinessRepository.getAll()/mapToUI() -> BusinessService.getContact()
                            |
        +-------------------+-------------------+
        |                                       |
        v                                       v
content-loader.populateBusinessInfo()   content-loader.generateJSONLD()
[data-business-name] [data-phone]      static ld+json blocks
[data-phone-link] [data-email]         + dynamic LocalBusiness
[data-email-link] [data-whatsapp]
[data-address] [data-business-address] [data-footer-address]
[data-hours] [data-map-link]
        |
        v
business-config.js -> window.BusinessConfig (shell, logo, favicon, social)
```

Other routes verified present and unmodified: `hero_slides` -> `HeroRepository` ->
`populateHero()`; `gallery` -> `GalleryRepository.getByPage()` -> `MediaResolver` ->
`populateGallery()`; `menu_items`/`menu_categories` -> `MenuRepository` -> `populateMenu()`;
`services`/`service_charges` -> `ServicesRepository` -> price/catalog loaders;
`membership_plans` + `membership_plan_benefits` -> `MembershipRepository` ->
`membership-view.js`.

**Media contract (unchanged, must be preserved):** `media_id` -> `media_assets.public_url`.
HTML `src` strings are *not* a DB source and must never be copied into records. Live
`services.image_url` values exist but are presentation attributes, not the media contract.

---

## 4. FINDINGS BY CATEGORY (Phase 2 enumeration + Phase 3 classification)

Every literal received exactly one class. Counts are per distinct finding, not per file.

| # | Finding | Locations | Class | Evidence |
|---|---|---|---|---|
| 1 | `getBusiness()` guarded on `data.name`, a key `mapToUI()` never returns, so it always returned a 2-field hardcoded object | `services/BusinessService.js:31` | **D** | `mapToUI()` returns `business_name` (`:54`); `getAll()` sets a `businessName` alias (`:181`) |
| 2 | Consequence of #1: `generateJSONLD()` got no `address`/`city`/`country`/`opening_hours`/`resolved_logo_url`/`google_maps_url`, and wrote the display-formatted phone into `telephone` | `content-loader.js:1246-1335` | **D** | fixed and verified: JSON-LD now shows `addressLocality="Meru  town"`, `hasMap=true`, `hasLogo=true` |
| 3 | `getTrust()` called `repository.getTrust()`, which does not exist | `services/BusinessService.js:110` | **D** | `BusinessRepository` export list has no `getTrust` (`:354-362`) |
| 4 | 4 raw Supabase Storage business-media URLs in preview grids, not `media_id`-addressable | lounge/vip/conference/events `.gallery-preview-grid` (16 refs / 15 unique files) | **E** | 0 of 15 registered in `media_assets`; 0 rows in `gallery` for those page ids |
| 5 | 4 lounge "from" prices in HTML, no `menu_items` rows | `lounge.html:675,680,685,690` | **E** | live `menu_items` = 14 rows; only Cocktail Selection 850 + Signature Cocktail 750 |
| 6 | Conference/VIP amenity grids have no representing entity | `conference.html`, `vip.html` | **H** | 12 `services` rows, 1 per page, price 0.00; amenities are not service records |
| 7 | `postalCode` / `addressRegion` literals in every static JSON-LD block | 9 served pages, 9 blocks each | **G** | live `business_settings` has no `postal_code`/`region`/`county`/`state` column |
| 8 | `business-config.js` fallback address components, incl. `region`/`postalCode` | `business-config.js:24-37` | **B** | each matches the canonical DB string exactly |
| 9 | `shared-components.js` `CONTACT` fallbacks (phone/phoneRaw/email/whatsapp) | `shared-components.js:96-106` | **B** | match DB (`+254143542601`, `ztloungemeru@gmail.com`) |
| 10 | `FALLBACK_CONFIG` phone/email/social/maps/logo/hours | `business-config.js:18-71` | **B** | phone/email/social/maps match DB; hours `Mon - Sun: 10:00 AM - 2:00 AM` matches DB |
| 11 | Trust-badge claims (`200+`, `500+`, response time) | `business-config.js:66-70`, `contact.config.js:31-35` | **C** | marketing presentation, no business record |
| 12 | `membership-view.js` modal tel/mailto/wa literals | `membership-view.js:147-149` | **B** | overwritten from `BusinessConfig` when available; values match DB |
| 13 | Static `[data-hours]`/`[data-phone]`/`[data-email]` text in markup | 9 served pages | **B** | proper hooks present; overwrite on hydration; values match DB |
| 14 | `john@example.com` / `you@example.com` | served HTML (7) | **C** | form `placeholder` attributes, not business data |
| 15 | Headline / body / heading / marketing copy | served HTML | **C** | presentation, not records |
| 16 | Hero DOM, gallery DOM, menu DOM, service cards, packages | 9 served pages | **A** | generated from DB; no literals |

### Classification totals

| Class | Count |
|---|---|
| A - Canonical | 1 |
| B - Legitimate fallback | 5 |
| C - Static presentation | 3 |
| D - Competing authority | **3** (findings #1-#3) |
| E - Canonical data missing | 2 |
| F - Stale/contradictory | **0** |
| G - Schema gap | 1 |
| H - Architectural gap | 1 |

**Zero Class F findings.** Every static fallback verified byte-equal to its canonical DB
value; the earlier stale-hours and stale-address defects remain fixed.

---

## 5. FIXES IMPLEMENTED

Exactly **one** application file changed: `assets/js/services/BusinessService.js`.
No HTML, no repository, no loader, no schema, no DB. No new mechanism was introduced;
both fixes restore the *existing* documented canonical route.

### Fix 1 - `getBusiness()` no longer discards the canonical record (Class D)

```js
// BEFORE - guard on a key mapToUI() never produces
if (!data || !data.name) {
    return { name: 'ZT Lounge Meru', phone: '+254 143 542 601' };   // always taken
}

// AFTER - guard on the canonical key names
var canonicalName = data && (data.business_name || data.businessName);
if (!data || !canonicalName) {
    return { name: 'ZT Lounge Meru', business_name: 'ZT Lounge Meru',
             phone: '+254 143 542 601' };
}
return data;
```

`mapToUI()` returns `business_name`; `getAll()` adds a `businessName` alias. Neither is
`name`, so the old guard was **always true** and the canonical row was always thrown away.
The fallback is retained for genuine DB failure, now with `business_name` populated so
downstream `biz.business_name` reads stay consistent, and its values still match the DB.

**Restores:** `generateJSONLD()` now receives `address`, `city`, `country`,
`opening_hours`, `resolved_logo_url` and `google_maps_url`, so static `ld+json` blocks and
the dynamic `LocalBusiness` block carry real canonical values instead of literals.

### Fix 2 - `getTrust()` no longer calls a nonexistent repository method (Class D)

```js
// BEFORE - BusinessRepository has no getTrust(); this threw
return repository.getTrust();

// AFTER - trust badges are presentation copy, not business_settings records
return Promise.resolve(
    (window.BusinessConfig && window.BusinessConfig.trust) ||
    (window.ContactConfig && window.ContactConfig.trustBadges) || {}
);
```

No DB route was invented; the existing config objects (finding #11) are the true source.
This method currently has **no live caller**, so the fix removes a latent trap rather
than a user-visible break.

### Deliberately NOT changed

| Item | Why left alone |
|---|---|
| `contact.html:914` en-dash hours fallback | Hook present and correct; Class B. Only shows when its JS fails to load. |
| `membership-view.js` contact literals | Class B, overwritten on hydration. |
| Preview-grid `<img src>` URLs | Class E - cannot route without DB rows (E-4 gate). |
| Lounge prices | Class E - cannot route without `menu_items` rows (E-1 gate). |
| Feature grids | Class H - no content model exists (E-2 gate). |
| `postalCode` / `addressRegion` JSON-LD | Class G - no column exists (E-3 gate). |

---

## 6. STATIC VERIFICATION (Phase 7)

Exact counts across the 10 served HTML files.

| Check | Result |
|---|---|
| `Milimani Road` (stale address) | **0** |
| `Opposite Ezri Hotel, Milimani, Kenya` (over-suffixed address) | **0** |
| `P.O. Box` | **0** |
| `8:00 AM - 10:00 PM` (stale hours) | **0** |
| `9:00 AM - 11:00 PM` (stale hours) | **0** |
| `maps.google.com` (wrong maps URL) | **0** |
| Canonical maps URL `maps.app.goo.gl/HqTbiiU4q2jRFoPg6` | **11** (all correct/hooked) |
| `[object Object]` (hours rendering bug) | **0** |
| JSON-LD blocks parsed | **20 / 20 valid, 0 malformed** (2 per page x 10 pages) |
| `KES <n>` price literals | **4** - all E-1 (`lounge.html:675,680,685,690`) |
| Business phone literals | present but every site hooked -> Class B |
| Business email literals | `ztloungemeru@gmail.com` x28 (hooked) + 7 placeholder-only -> Class B/C |
| Raw Supabase Storage business-media URLs | 48 refs; **16 refs / 15 unique files are preview business media** -> Class E (E-4) |
| `node --check` on the 1 changed file | **PASS** |
| Live `data.name` / `repository.getTrust` in code | **0** (only explanatory comments) |
`services.image_url` values exist but are presentation attributes, not the media contract.


---

## 7. RUNTIME VERIFICATION (Phase 8) - PARTIAL, WITH EXACT FAILURE

**Read-only Playwright against `localhost:8000` (HTTP 200). No form submitted, no data mutated.**

| Metric | Result |
|---|---|
| Pages tested | **10 / 10** (home, contact, restaurant, menu, lounge, conference, vip, events, grooming, gallery) |
| HTTP 200 | **10 / 10** |
| `[object Object]` in DOM | **0 on all pages** (hours formatter confirmed working) |
| Address hydrated to canonical | **10 / 10** - `Opposite Ezri Hotel, Milimani, Meru` |
| Hours hydrated to canonical | **10 / 10** - `Mon - Sun: 10:00 AM - 2:00 AM` |
| Canonical enrichment in JSON-LD | **Verified where the repo loaded**: `menu`, `lounge`, `events` show `addressLocality="Meru  town"`, `hasMap=true`, `hasLogo=true` - observable proof Fix 1 works |

### Exact runtime blocker (documented, not retried further)

Console/network errors are **environmental, not code defects**. A focused probe recorded
**31 failed requests**, all `net::ERR_CONNECTION_REFUSED`, including:

```
/assets/js/lib/page-identity.js               :: ERR_CONNECTION_REFUSED
/assets/js/lib/cms-report.js                  :: ERR_CONNECTION_REFUSED
/assets/js/repositories/PageResolver.js       :: ERR_CONNECTION_REFUSED
/assets/js/repositories/MediaResolver.js      :: ERR_CONNECTION_REFUSED
/assets/js/business-config.js                 :: ERR_CONNECTION_REFUSED
/assets/js/repositories/BusinessRepository.js :: ERR_CONNECTION_REFUSED
/assets/images/branding/logo.webp             :: ERR_CONNECTION_REFUSED   <-- a static IMAGE
```

The dev server refuses **static images** as well as JS. When `BusinessRepository.js`
fails, `BusinessService`, `BaseRepository`, `supabaseClient` and `BusinessConfig` are all
`undefined`, producing the whole cascade (`MISSING_DEPENDENCY`,
`Cannot read properties of undefined (reading 'create' / 'getContact' / 'getBusiness')`).
Those are **downstream symptoms of the load failure**, not independent defects.

**Intermittency confirmed:** two identical full runs gave different counts - `lounge` had
4 errors in run 1 and **0** in run 2; `home` had 25 then 32.

**Stop condition invoked:** the same runtime prerequisite (dev-server asset loading)
failed twice. Per instructions, runtime probing was stopped and the blocker recorded
rather than retried. **No runtime PASS is claimed** for pages whose repository JS did not
load, and no claim is made that the suite is error-free in a healthy environment.

---

## 8. REGRESSION VERIFICATION (Phase 9)

| Canonical system | Route | Result |
|---|---|---|
| Membership plans | `membership_plans` -> `MembershipRepository` -> `membership-view.js` | **INTACT** - untouched; `getTrust` fix does not alter it |
| Membership benefits | `membership_plan_benefits` -> same | **INTACT** |
| Hero | `hero_slides` -> `HeroRepository` -> `populateHero()` | **INTACT** - untouched |
| Services | `services` -> `ServicesRepository` -> cards | **INTACT** - untouched |
| Service charges / packages | `service_charges` -> price loaders | **INTACT** - untouched |
| Booking price authority | server-side `create_booking` RPC | **INTACT** - untouched; no booking submitted |
| Gallery | `gallery` -> `GalleryRepository` -> `MediaResolver` | **INTACT** - untouched |
| Menu | `menu_items`/`menu_categories` -> `MenuRepository` | **INTACT** - untouched |
| Promotions | `promotions` -> loader | **INTACT** - untouched |
| Testimonials | `testimonials` -> loader | **INTACT** - untouched |
| FAQ | `faqs` -> loader | **INTACT** - untouched |
| Business contact data | `business_settings` -> `BusinessRepository`/`BusinessService` | **IMPROVED** - canonical record now reaches JSON-LD |
| Page toggles | `website_pages.service_*_enabled` | **INTACT** - untouched |
| BusinessConfig shell | `business-config.js` | **INTACT** - untouched |
| `shared-components.js` footer | `CONTACT` fallbacks | **INTACT** - untouched |

**Blast radius of the change:** `BusinessService.getBusiness()` / `getTrust()` only.

---

## 9. GIT / CHANGE SCOPE

| Bucket | Detail |
|---|---|
| Branch / HEAD | unchanged (`905bd7a1...`) |
| Application files changed | **1** - `assets/js/services/BusinessService.js` |
| Documentation created | `PUBLIC_CANONICAL_DATA_ENFORCEMENT_AUDIT.md`, route map update |
| Scratch files created (not app source) | `_runtime_verify_enforcement.js`, `_rt_result.json`, `_rt_result2.json`, `_rt_probe.json` |
| DB writes | **0** - read-only `GET` on PostgREST only |
| Schema / migrations / `db push` | **0 / not run** |
| RLS changes | **0** |
| Seed / admin mutations | **0** |
| Server restarts | **0** |
| Forms submitted / bookings | **0** |
| Pre-existing dirty worktree | **preserved** - nothing reset, cleaned, stashed, checked out or discarded |
| Lounge prices | Class E - cannot route without `menu_items` rows (E-1 gate). |
| Feature grids | Class H - no content model exists (E-2 gate). |
| `postalCode` / `addressRegion` JSON-LD | Class G - no column exists (E-3 gate). |

---

---

## 10. EVIDENCE LIMITATIONS

1. **The CLI is linked to the wrong database.** `supabase db query --linked` targets
   staging `jczavwuaiywnhpfigvlw`, not the canonical `jczwilrysvnhcjzjztbi`. All findings
   here use read-only PostgREST against the canonical project. Prior reports built on CLI
   output should be treated as unverified.
2. **Runtime is only PARTIAL.** The dev server intermittently refused JS *and* static
   images (31 failed requests), so full-suite runtime verification is not possible. Two
   runs, then stopped per the 2-failure rule. Verification of the fix rests on the pages
   where the repository layer did load (`menu`, `lounge`, `events`).
3. **`contact.html:914` en-dash hours** was not observed hydrated (its JS failed to load),
   though the hook is present and correct in source. Not independently runtime-confirmed.
4. **Media coverage = 0 of 15** was measured by matching the 15 preview paths against
   `media_assets.public_url`. Registration could in principle exist under a different
   path string, but `media_assets` holds 50 rows, 47 `.webp`, in `gallery-images/` and
   `menu-images/` buckets - none under `public-assets/images/{lounge,vip,conference,events}`.
5. **RLS-scoped reads.** PostgREST returns what the `anon` role may see, which is exactly
   what the public browser sees - appropriate here, but not a privileged view.
6. Counts in section 6 are literal-match counts across the 10 served files; they measure
   *occurrence*, not rendered correctness.

---

## 11. RECOMMENDED NEXT PHASE

1. **Fix the dev server.** The `ERR_CONNECTION_REFUSED` cascade is the single biggest
   obstacle to runtime verification and masks real defects. Re-run the 10-page suite once
   it is stable, and expect genuine counts to change.
2. **Re-verify prior reports** that cite `supabase db query --linked`.
3. **Product decisions on E-1..E-4** - none may be implemented without explicit
   authorization.
4. Re-check `BusinessService.getTrust()` if a consumer is added; it now returns
   presentation copy, correct for trust badges, but must not become a DB route.

---

## 12. E-1 DECISION GATE - Lounge prices

**Classification: E - CANONICAL_DATA_MISSING.** Left untouched. Nothing inserted.

**Where the values are:** `pages/experiences/lounge.html:675, 680, 685, 690` - 4 `KES`
price literals (the only price literals anywhere in the served site).

**Fresh DB evidence** (read-only, `jczwilrysvnhcjzjztbi`):
- `menu_items` = **14 rows** total.
- Only 2 are bar-related: `Cocktail Selection` 850.00 and `Signature Cocktail` 750.00
  (both in category `236a42aa...`, named **"Fast Foods"**, not a bar category).
- `services` has `Lounge & Bar` at price **0.00** - an umbrella row, not an item.
- **No row exists for any of the 4 offerings shown on the page.**
- `lounge.html` has **no menu mount** and does not consume `MenuRepository`.

**Schema sufficiency:** **Yes.** `menu_items` already carries
`name / description / price / media_id / is_active / display_order`, and
`MenuRepository` -> `populateMenu()` is proven on the restaurant menu page. No schema
change and no new repository would be needed.

**Required product decision (not made here):**
1. Real, orderable menu items? -> create 4 `menu_items` rows + add a menu mount.
2. Indicative "from" bands? -> re-label as editorial copy (Class C).
3. Remove the price claims?

---
## 13. E-2 DECISION GATE - Conference / VIP feature grids

**Classification: H - ARCHITECTURAL_GAP.** Left untouched. No service rows created.

**Where the values are:** amenity grids on `pages/business/conference.html` and
`pages/experiences/vip.html` (Boardroom, AV Equipment, Private Entrance, Personal Butler,
In-Cabin Dining, ...).

**Fresh DB evidence:** `services` = **12 rows**, exactly **one umbrella row per page**
(`Conference` 0.00, `VIP Cabins` 0.00, `Lounge & Bar` 0.00, `Events` 0.00, ...). Real
per-space pricing lives in `service_charges`. **No table represents amenities.** No
`page_features` / amenities entity exists.

**Why they must NOT go into `services`:** `services` drives **booking**. Adding amenity
rows there would create fake *bookable* services for things that cannot be booked, and
would sit beside the genuine `service_charges` pricing authority for the same spaces -
manufacturing the exact competing-authority defect this programme exists to remove.

**Schema sufficiency:** **Partially.** For option 1, `website_pages.content` (jsonb)
already exists and is admin-exposed - no new table needed. Option 2 (a dedicated
`page_features` table) would require new schema.

**Required product decision (not made here):** choose `website_pages.content.features`
(preferred, no schema change) vs a new content model; then a page-scoped render path.

**Code-only fix possible now? NO.** No data source exists to render from.

## 14. E-3 DECISION GATE - Postal code / address region

**Classification: G - SCHEMA_GAP.** Left untouched. No migration written.

**Where the values are:** `"postalCode": "60200"` and `"addressRegion": "Meru County"` in
the static JSON-LD of all 9 pages (9 occurrences each).

**Fresh DB evidence:** the single `business_settings` row returns these columns -
`id, business_name, email, phone, address, google_maps_url, whatsapp, facebook,
instagram, opening_hours, logo_url, favicon_url, timezone, currency, created_at,
updated_at, tagline, description, twitter, youtube, city, country, latitude, longitude,
logo_media_id, favicon_media_id, google_review_url`.

There is **no `postal_code`, `postcode`, `zip`, `region`, `county`, `state` or
`province` column.** `generateJSONLD()` never writes these fields (absent from both its
schema object and its static-refresh list), so the literals can never be DB-driven today.

**They must not be derived:** `city` = `"Meru  town"` and `country` = `"Kenya"` are not a
postal code or a county. Inferring `60200` from anything else would be fabrication.

**Schema sufficiency:** **NO** - one migration would be required.

**Required future decision (not made here):**
`ALTER TABLE business_settings ADD COLUMN postal_code text, ADD COLUMN region text;`
then populate, extend `mapToUI()` and `FALLBACK_CONFIG`, write both in `generateJSONLD()`,
and delete the static literals.

**Code-only fix possible now? NO.** The field does not exist.

---

## 15. E-4 DECISION GATE - Per-page preview images

**Classification: E - CANONICAL_DATA_MISSING.** Left untouched. No rows created.
The withdrawn figures were **not** reused; this is a fresh measurement.

**Fresh DB evidence** (read-only):

| Measurement | Result |
|---|---|
| Preview `src` refs in the 4 `.gallery-preview-grid` blocks | **16** (lounge 4, vip 4, conference 4, events 4) |
| Unique files | **15** (`lounge-bar.webp` appears twice) |
| Those files present in `media_assets` | **0 of 15** |
| `media_assets` total rows | **50** (47 `.webp`), in `gallery-images/` and `menu-images/` buckets |
| `gallery` rows total | **13** |
| `gallery` rows for lounge/vip/conference/events | **0** |
| `gallery` rows for page `c6817473...` (`gallery`) | **13 of 13** |

Method: extracted every `gallery-preview-item` storage URL from the 4 HTML files, then
matched each against `media_assets.public_url`.

**Withdrawn figures, explicitly not reused:** neither "3 lounge / 1 conference / 1 vip /
0 events" nor "13 of 16" was used. The measured answer is **0 of 15** - a third,
different number that contradicts both. Any earlier plan built on those figures should be
discarded.

**Schema sufficiency:** **Yes - completely.** `gallery` already has `page_id` and
`media_id`; `GalleryRepository.getByPage()` + `MediaResolver` already implement the route
and are proven on home + contact. **No schema change, no new table, no new repository, no
new loader is required.** Only content is missing.

**Required future decisions (not made here):**
1. Register the 15 files in `media_assets` (or map them to existing assets).
2. Create page-scoped `gallery` rows with correct `page_id` and `display_order`.
3. Widen the existing preview renderer's scope beyond `{home, contact}`.

**Media contract reminder:** any future rows must reference `media_id`; HTML `src`
strings must never be copied into the DB.

**Code-only fix possible now? NO.** `getByPage()` correctly returns `[]` because no rows
exist. Creating rows is prohibited without authorization.

---

## 16. OPEN DECISIONS SUMMARY

| Gap | Class | Code-only fix? | Schema sufficient? | Awaiting |
|---|---|---|---|---|
| **E-1** Lounge prices | E | No | Yes | Product decision: real menu items vs editorial copy vs removal |
| **E-2** Feature grids | H | No | Partially | Content-model decision (`website_pages.content.features` vs new table) |
| **E-3** Postal / region | G | No | No | Authorization for a 2-column migration |
| **E-4** Preview images | E | No | Yes (fully) | Authorization to create `media_assets` + `gallery` rows |

**None of these were implemented. All four remain open decision gates.**
**Code-only fix possible now? NO.** There is no row to read; inventing one is prohibited.

---

