# PUBLIC MENU FIX PROGRESS LOG

Append-only. Findings recorded BEFORE fixes.

---

## Entry 1 - Baseline (2026-10-02T14:20:46+03:00)

| Field | Value |
|---|---|
| Branch | `feature/membership-tiers-staging-phase1` |
| HEAD | `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c` (unchanged) |
| Dirty entries at start | **249** (243 pre-existing + 6 from the read-only audit) |
| Canonical DB | `jczwilrysvnhcjzjztbi` (read-only PostgREST only; CLI `--linked` = staging, NOT used) |

---

## Entry 2 - Source re-verification against current files

| Claim | Verified? | Current evidence |
|---|---|---|
| `getMenu()` has no `page_id` filter | **TRUE** | `MenuRepository.js:173-176` `eq: [{column:'is_active', value:true}]` only |
| `mapItemToUI()` maps `page_id` | **TRUE** | `MenuRepository.js:45` |
| `populateMenuPrices()` unreachable without charges | **TRUE** | `content-loader.js:1358` early-returns; `:1363` calls it after that return |
| Bootstrap invokes only `populateServicePrices` | **TRUE** | `:1927` - `populateMenuPrices` appears in no `runGuarded` entry |
| `restaurant.html` has 0 `[data-charge-name]` | **TRUE** | count = 0; it has 3 `[data-menu-name]` |
| `lounge.html` has no menu mount | **TRUE** | 0 matches for `menu-container` / `data-menu-name` |

---

## Entry 3 - NEW BLOCKER FOUND (F-1 cannot be completed safely)

`restaurant-menu.html` declares `<body data-page="restaurant-menu">`.

- `PageIdentity.pageKeyForPageId('restaurant-menu')` -> `'restaurant-menu'` (`page-identity.js:76`).
- Live `website_pages` has **9 rows and NO `restaurant-menu` row** (verified:
  `?page_key=eq.restaurant-menu` returned **0 rows**).
- All 11 Restaurant menu rows are scoped to `page_id = a3490e73` = page_key **`restaurant`**.
- Therefore `PageResolver.requirePageUuid('restaurant-menu')` returns
  `missing-page-record`.

**Consequence:** adding the page filter REQUIRED by F-1 would make
`restaurant-menu.html` resolve to nothing and render **zero menu items** - a hard
regression of the page's primary function.

Three ways out, none authorized by this task:

| Option | Mechanism | Why it is blocked |
|---|---|---|
| A | Change `data-page` to `restaurant` on `restaurant-menu.html`, or map `restaurant-menu -> restaurant` in `PageIdentity.PAGE_TO_PAGE_KEY` | Single-line, but changes page identity for **hero, services, gallery, promotions, testimonials, FAQ** on that page too. Outside menu scope; task forbids broad changes |
| B | Insert a `restaurant-menu` row into `website_pages` | **DB WRITE - prohibited** |
| C | Add a restaurant-menu -> restaurant alias inside `MenuRepository` | "Do not invent another resolver"; duplicates the alias that already exists in `forms.js:199` for a *different* namespace (`services.slug`) |

**Existing precedent found (context only):** `forms.js:199` already returns
`'restaurant'` for `pageId === 'restaurant-menu'`, commented
*"menu belongs to the restaurant domain"*. That map resolves `services.slug`, **not**
`website_pages.page_key`, so it cannot be reused directly for menu scoping.

**Status: STOP CONDITION invoked** - "A canonical page ID cannot be resolved safely".

---

## Entry 4 - NEW BLOCKER FOUND (L-3)

- `lounge.html` page resolution **works** (`lounge` -> `2ba8a348`, 2 rows exist), so the
  technical page filter is feasible for Lounge.
- But `lounge.html` contains **none** of the menu CSS. `.menu-item-card`,
  `.menu-category`, `.price-tag` etc. exist only in the inline `<style>` of
  `restaurant-menu.html`; no shared stylesheet defines them (verified across `assets/css`).
- Adding the mount therefore also requires copying/relocating the menu stylesheet.
- The 2 existing Lounge rows sit in category **"Fast Foods"** (a content/model issue this
  task forbids changing silently).
- The Lounge page already has a `cocktail-grid` static section listing **4 different**
  offerings. A canonical menu section would render a **third, different** set (2 cocktails),
  producing on-page duplication.

**Status: STOP CONDITION invoked** - "Removing Lounge static content would require a
business decision" / "Do not redesign the page".

---

## Entry 5 - F-2 is safe and in scope

`populateMenuPrices()` is **name-keyed and has no page dependency**
(`content-loader.js:1435-1451`: builds `byName` from `getMenu()` and matches
`data-menu-name`). Decoupling it changes no pricing rule and no data source.

Planned minimal change:
1. Add an independent bootstrap entry `runGuarded('MenuPrices', populateMenuPrices);`
   next to the other subsystem entries.
2. Remove the internal `populateMenuPrices();` call from `populateServicePrices()` so
   service and menu hydration are genuinely independent and never double-run.

**Status: PROCEEDING.**

---

## Entry 6 - FIX F-2 APPLIED (2026-10-02)

**File changed: `assets/js/content-loader.js` only. Two edits.**

### Edit 1 - decouple menu pricing from service pricing

Removed the internal call (was `:1363`):

```js
// 1. Service package/charge prices (service_charges)
var chargePlaceholders = document.querySelectorAll('[data-charge-name]');
if (chargePlaceholders.length === 0) return;      // <-- used to skip menu prices too
populateMenuPrices();                             // <-- REMOVED
```

replaced with a comment explaining that menu pricing is no longer handled here.

### Edit 2 - independent bootstrap subsystem (`:1931-1936`)

```js
runGuarded('Prices',       populateServicePrices);
// Menu pricing is independent of service/package pricing ...
runGuarded('MenuPrices',   populateMenuPrices);
```

**Result:** `populateMenuPrices()` now has exactly **one** call site (`:1936`). Verified by
grep - `populateMenuPrices` appears at `:1361` (comment), `:1436` (definition), `:1936`
(the only invocation). Service and menu hydration can no longer gate each other.

**Nothing else changed.** No pricing rule, no price source, no table, no hardcoded value,
no schema, no DB write, no new repository, no new loader, no page filter.

### Double-run safety

| Page | `[data-menu-name]` | `[data-charge-name]` | Effect |
|---|---|---|---|
| `restaurant.html` | 3 | 0 | menu prices now hydrate (previously empty) |
| `restaurant-menu.html` | 0 | 0 | no-op |
| `conference.html` | 0 | 5 | service prices unchanged |
| `vip.html` | 0 | 3 | service prices unchanged |
| `events.html` | 0 | 3 | service prices unchanged |

No page carries both types, so the change cannot double-hydrate anything. Pages with
charge-only placeholders still call `populateMenuPrices()`, which no-ops on its
`menuPlaceholders.length > 0` guard.

---

## Entry 7 - Verification (2026-10-02)

| Check | Result |
|---|---|
| `node --check assets/js/content-loader.js` | **PASS** |
| `populateMenuPrices` call sites | exactly 1 (`:1936`) |
| Hardcoded UUIDs introduced | **0** (`a3490e73` / `2ba8a348` counts = 0) |
| `menu_type` / `menu_scope` introduced | **0** |
| Second menu repository | **none** - only `MenuRepository.js` references `menu_items`/`menu_categories` |
| `menu_items` row count | **14** (unchanged) |
| `page_id` split | restaurant 11 / home 1 / lounge 2 (unchanged) |
| Lounge rows | `Cocktail Selection` 850.00 cat `236a42aa`; `Signature Cocktail` 750.00 cat `236a42aa` - **unchanged** |
| DB writes | **NONE** (read-only `GET` only) |

### Runtime

| Attempt | Result |
|---|---|
| 1 | HTTP 200 x4. `restaurant.html` 30 conn-refused -> its 3 spans stayed empty. `restaurant-menu` 13 conn-refused, 0 cards. |
| 2 | HTTP 200 x4. **`restaurant-menu` rendered 10 categories / 14 cards** (repository loaded). `restaurant.html` 32 conn-refused -> spans still empty. |
| Decision | **STOPPED** - the same prerequisite (dev-server asset loading on `restaurant.html`) failed twice |

**What attempt 2 proved:** `restaurant-menu.html` still renders **14 cards / 10
categories**, i.e. every active item with no page scoping. This is direct runtime
confirmation that the **F-1 leak is still present and unchanged** - expected, because F-1
was not implemented.

**F-2 runtime outcome: NOT VERIFIED.** `restaurant.html` could not load repository JS in
either attempt, so `window.MenuRepository` was undefined and the loader correctly no-opped.
The fix is verified structurally (single call site, independent bootstrap) but **no runtime
PASS is claimed** for the price hydration itself.

---

## Entry 8 - STOPPED BEFORE F-1 AND L-3 (2026-10-02)

Both were left unimplemented. Reasons are recorded in Entries 3 and 4.

| Item | Status | Reason |
|---|---|---|
| F-1 page-scoped query | **NOT IMPLEMENTED** | `restaurant-menu.html` resolves to page key `restaurant-menu`, which has **no** `website_pages` row. Applying the filter would render **zero** items - a hard regression. Requires a page-identity decision (see Entry 3 options A/B/C) |
| L-3 Lounge consumer | **NOT IMPLEMENTED** | Lounge page resolution works, but the page has **no menu CSS**, the 2 Lounge rows sit in category "Fast Foods", and the page already shows 4 different offerings statically. Adding a menu section is a page redesign + business decision (Entry 4) |
| Four missing Lounge offerings | **UNTOUCHED** | `CANONICAL_DATA_MISSING` - no rows created, no prices invented |

**Awaiting authorization before proceeding.**

---

# SESSION - PAGE-ID-ONLY MENU ARCHITECTURE (2026-10-02T14:44:15+03:00)

Append-only. Entries 1-8 above are historical and unchanged.

## Entry 9 - Baseline

| Field | Value |
|---|---|
| Branch | `feature/membership-tiers-staging-phase1` |
| HEAD | `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c` |
| Dirty at start | **253** |
| Canonical DB | `jczwilrysvnhcjzjztbi` (read-only PostgREST; CLI `--linked` NOT used) |

## Entry 10 - Source inspection

| Finding | Evidence |
|---|---|
| `BaseRepository.getAll(queryOptions)` supports chained `.eq()` and keys its cache on `queryOptions` | `BaseRepository.js:230-252` |
| 3 `getMenu()` callers existed | `content-loader.js:971` (populateMenu), `content-loader.js:1439` (populateMenuPrices), `background-media-warmer.js:271` |
| Every page already loads the whole menu pipeline | `shared-components.js` injects `content-loader.js`; `menu-nav.js` is a post-CMS feature script. Lounge therefore already had the JS - only the DOM mount was missing |
| Menu CSS existed only inline in `restaurant-menu.html` (lines 117-247 + menu rules in the 768px media block); `lounge.html` had none | verified across `assets/css` |

## Entry 11 - PAGE-ID ARCHITECTURE DECISION

Menu scope = `menu_items.page_id`, resolved from the surface PageId through a
**menu-layer-only** map, then through the existing `PageResolver`:

```js
var MENU_PAGE_KEY_BY_SURFACE = {
    'home':            'home',
    'restaurant':      'restaurant',
    'restaurant-menu': 'restaurant',   // the restaurant MENU SURFACE
    'lounge':          'lounge'
};
```

Rationale:
- It lives in `MenuRepository`, so it can only affect **menu** retrieval.
- `window.PageIdentity.PAGE_TO_PAGE_KEY['restaurant-menu']` is **unchanged** (verified

---

## Entry 13 - VERIFICATION

### Static / white-box

| Check | Result |
|---|---|
| `node --check` on all 3 JS files | **PASS** |
| `getMenu()` enforces `page_id` in the query | **YES** (`MenuRepository.js:267`) |
| Unscoped `getMenu()` call sites remaining | **0** |
| `menuPageKeyForSurface('restaurant-menu')` | `'restaurant'` |
| `menuPageKeyForSurface('lounge')` | `'lounge'` |
| `menuPageKeyForSurface('vip'/'events'/'contact'/...)` | `null` -> empty menu, no leak |
| Global page identity modified | **NO** |
| `services` / `service_charges` used as menu source | **NO** (only mention is a doc comment) |
| Hardcoded Lounge prices remaining | **0** |
| Hardcoded Lounge raw storage URL | **0** |
| `.cocktail-item` / `.cocktail-price` in live markup | **0** (CSS rules + one documentation comment only) |

### Database (read-only, canonical project)

| Query | Result |
|---|---|
| `menu_items` total | **14** (unchanged) |
| split by `page_id` | restaurant **11**, lounge **2**, home **1** |
| Lounge rows | `Cocktail Selection` 850.00 cat `236a42aa` media `319e829a`; `Signature Cocktail` 750.00 cat `236a42aa` media `611ade4f` - **identical to baseline** |
| Writes | **NONE** |
| Invented records | **NONE** |

The **exact query the repository issues** was executed directly against the canonical DB:

| Scope | Rows returned |
|---|---|
| `is_active=eq.true&page_id=eq.a3490e73...` | **11** - no cocktails, no Half-Day Package |
| `is_active=eq.true&page_id=eq.2ba8a348...` | **2** - Cocktail Selection, Signature Cocktail |
| `is_active=eq.true&page_id=eq.e5186de1...` | **1** - Half-Day Package |

### Runtime

| Surface | Result |
|---|---|
| `lounge.html` | **VERIFIED.** HTTP 200, 1 category (**Fast Foods**), **2 items**: `Signature Cocktail` KES 750, `Cocktail Selection` KES 850; images `menu-images/signature-cocktail.webp` and `menu-images/cocktail.webp` (resolved via `media_id -> media_assets.public_url`, **not** the removed raw `public-assets` URL); **0** empty-category blocks |
| `restaurant.html` | HTTP 200, 0 menu cards (no menu container on the page) - expected |
| `index.html` | HTTP 200, 0 menu cards - expected |
| `restaurant-menu.html` | **RUNTIME BLOCKED.** Two attempts (29 then 30 `ERR_CONNECTION_REFUSED` on repository JS) -> stopped per the 2-failure rule. **No runtime PASS claimed for the Restaurant Menu.** Its 11-row scoping is proven at DB level, not at runtime |

## Entry 14 - DEFERRED / DECISION GATES

1. The **four missing Lounge offerings** (House Signature Collection 1,200 / Premium Whiskey
   Selection 1,500 / Vintage Wine Cellar 2,000 / Artisanal Mocktails 800) were **removed from
   the Lounge page** as competing menu data and **NOT recreated**. They have no
   `menu_items` records. Their CMS representation is a business/content decision.
2. The Lounge menu now renders under the category **"Fast Foods"** because both existing
   Lounge rows are filed there. Category was **not** changed, per instruction.
3. `restaurant-menu.html` still carries its own inline copy of the menu CSS; consolidating
   it onto `assets/css/menu.css` was deliberately not done (regression risk, out of scope).
4. The now-unused `.cocktail-*` CSS rules remain in `lounge.html` (harmless dead CSS).
5. Admin Drizzle schema drift (`menu_categories.page_id`, `menu_items.media_id`) observed,
   **not touched**.
6. `menuPageKeyForSurface` has no entry for `vip`/`events`/`conference`/`contact`/`gallery`/
   `grooming-care`. They render an empty menu if a container ever appears - deliberate, so no
   venue can inherit another's records.
  still `'restaurant-menu'` at `page-identity.js:76`), so hero / services / gallery /
  promotions / testimonials / FAQ on `restaurant-menu.html` are untouched.
- No UUID is hardcoded; the UUID comes from `PageResolver.resolvePageRecord(page_key)`.
- No new resolver class, no schema column, no second repository.

## Entry 12 - IMPLEMENTATION

| # | File | Change |
|---|---|---|
| 1 | `assets/js/repositories/MenuRepository.js` | `getMenu(pageUuid)` now enforces `is_active=true AND page_id=pageUuid` **in the query**; returns `{categories:[]}` (never all venues) when no pageUuid. Added `getMenuForSurface(surfacePageId)`, `menuPageKeyForSurface()`, `resolveMenuPageUuid()`, `withoutEmptyCategories()`. `getSignatureItems(pageUuid?)` / `getItemsByCategory(categoryId, pageUuid?)` gained optional scoping |
| 2 | `assets/js/content-loader.js` | `populateMenu()` and `populateMenuPrices()` now call `getMenuForSurface(getPageId())`. **F-2 untouched** |
| 3 | `assets/js/background-media-warmer.js` | unscoped `getMenu([])` replaced by explicit `getMenuForSurface('restaurant')` + `getMenuForSurface('lounge')` |
| 4 | `assets/css/menu.css` | **NEW** shared stylesheet (menu nav, categories, item cards, price tag, menu-only responsive rules). Extracted verbatim from `restaurant-menu.html`. Presentation only - no data |
| 5 | `pages/experiences/lounge.html` | links `menu.css`; the static `cocktail-grid` (raw storage `<img>` + 4 hardcoded offerings) replaced by `<nav id="menu-nav-container">` + `<section id="menu-container">`; section heading/tag/subtitle and the "Reserve Your Table" CTA preserved |

**Not touched:** `page-identity.js`, `restaurant-menu.html`, `menu.config.js`, any schema,
any migration, any admin file.