# PUBLIC MENU AUDIT REPORT

Lounge + Restaurant menu architecture. **READ-ONLY AUDIT.**
Branch `feature/membership-tiers-staging-phase1` · HEAD `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c`
Canonical DB `jczwilrysvnhcjzjztbi` (read-only PostgREST).

---

## A. FINAL STATUS

**PARTIALLY VERIFIED**

Every structural, source, and database question is answered from current source plus
read-only canonical DB evidence. One question could not be closed: **runtime rendering of
the DB-driven Restaurant menu**, because the local dev server failed the same prerequisite
twice and probing was stopped. No runtime PASS is claimed.

No fixes were made. No schema change is proposed as necessary.

---

## B. CURRENT MENU ARCHITECTURE

Single canonical pair of tables, one repository, two loaders:

```
menu_categories (10 rows, no page scope)
        |
        | menu_items.category_id -> menu_categories.id
        v
menu_items (14 rows, HAS page_id, all populated)
        |
        v
MenuRepository  (BaseRepository.create over SupabaseConfig.tables.menuItems / .menuCategories)
   getCategories() | getSignatureItems() | getItemsByCategory() | getMenu()
        |
        +--> content-loader.populateMenu()        -> #menu-container .menu-item-card
        +--> content-loader.populateMenuPrices()  -> [data-menu-name]
                |
                v
        MediaResolver.resolveCollection() -> media_assets.public_url -> <img>
```

`menu.config.js` is a frozen fallback only (`fullMenu: {}`, `signatureCollection: []`),
used when a query returns zero rows.

**The `page_id` column exists on `menu_items` and is populated on all 14 rows.** This is
the single most important structural fact in this audit.

---

## C. RESTAURANT MENU DATA FLOW

| Step | File / function | Query or field | Consumer |
|---|---|---|---|
| 1 | `config/supabase.config.js:40-41` | `menuItems: 'menu_items'`, `menuCategories: 'menu_categories'` | repo construction |
| 2 | `MenuRepository.js:88-97` `getCategoryRepo()` | `BaseRepository.create('menu_categories')`, `cacheTTL 300000` | `getCategories()` |
| 3 | `MenuRepository.js:103-115` `getCategories()` | query result if non-empty, else `MenuConfig.categories` | category list |
| 4 | `MenuRepository.js:77-86` `getItemRepo()` | `BaseRepository.create('menu_items')` | `getMenu()` |
| 5 | `MenuRepository.js:166-199` `getMenu()` | `getAll({ eq: [{column:'is_active', value:true}], orderBy:'display_order', ascending:true })` | categories + items |
| 6 | `MenuRepository.js:53-58` `resolveMedia()` | `MediaResolver.resolveCollection(items)` | `public_url` |
| 7 | `MenuRepository.js:29-47` `mapItemToUI()` | `name`, `description`, `price`, `image_url`, `media_id`, `alt_text`, `is_active`, `display_order`, `type`, `category_id`, `page_id` | UI object |
| 8 | `content-loader.js:968-1067` `populateMenu()` | needs `#menu-container` | DOM |
| 9 | `content-loader.js:1035` | `item.name` | `.menu-item-card h3` |
| 10 | `content-loader.js:1040` | `item.description` | `.menu-item-card p` |
| 11 | `content-loader.js:1046-1051` | `"KES " + Number(item.price).toLocaleString()`; renders `KES 0` when price <= 0 | `.price-tag` |
| 12 | `content-loader.js:1026-1028` | `item.image_url` via `AssetUrl.resolve()` | `.menu-item-image` |
| 13 | `content-loader.js:984-990` | category `slug` / `name` | `#menu-nav-container a` |
| 14 | `menu-nav.js:32-34` | `.menu-category` elements | scroll-spy nav |

**Answers to the specific questions:**

- **Which records appear?** All 14 active rows - **including the 2 `page_id=lounge` rows
  and the 1 `page_id=home` row**. There is no page predicate anywhere in the query.
- **How are categories selected?** `getCategories()` returns the query result if non-empty,
  else `MenuConfig.categories`. `populateMenu()` re-filters `cat.is_active !== false`.
- **How are items selected?** `is_active = true`, ordered by `display_order` ASC, then
  grouped in memory by `item.category_id === cat.id` (`MenuRepository.js:182-184`).
- **How are prices selected?** `menu_items.price`, formatted by the loader. No lookup table.
- **How are descriptions/images selected?** Same row: `description`; image from
  `image_url` (via `AssetUrl.resolve`) with `media_id` / `alt_text` available.

---

## D. LOUNGE MENU DATA FLOW

**There is no Lounge data flow.** The path terminates at the database.

| Step | Finding |
|---|---|
| Lounge HTML menu mount | **NONE.** `lounge.html` contains no `#menu-container`, no `#menu-nav-container`, no `[data-menu-name]` |
| `populateMenu()` on lounge | never renders (no container) |
| `populateMenuPrices()` on lounge | never runs (no placeholders) |
| Lounge item names | hardcoded `<h4>` at `lounge.html:673, 678, 683, 688` |
| Lounge prices | hardcoded at `lounge.html:675, 680, 685, 690` |
| Lounge descriptions | hardcoded at `lounge.html:674, 679, 684, 689` |
| Lounge image | raw storage URL at `lounge.html:668` |
| Separate data source | **None.** Not a second system - simply no system at all |
| Competing authority | **Yes** - the HTML defines the entire public Lounge menu |

**The 2 `page_id=lounge` rows (`Cocktail Selection` 850, `Signature Cocktail` 750) exist in
the database, resolve their media correctly, and are displayed nowhere.** They are also
rendered on the Restaurant Menu page as a side effect of the missing page filter (F-1).

---

## E. RESTAURANT FINDINGS

| # | Finding | Severity | Evidence |
|---|---|---|---|
| **F-1** | **`getMenu()` does not filter by `page_id`.** All 14 active items render on the Restaurant Menu page, including 2 Lounge-scoped rows (`Cocktail Selection`, `Signature Cocktail`) and 1 Home-scoped row (`Half-Day Package`). `Cocktail Selection` is filed under category **"Fast Foods"**, so it renders inside that grid | Cross-venue data leak | `MenuRepository.js:173-176` (`eq` contains only `is_active`); `mapItemToUI():45` reads `page_id` but nothing consumes it |
| **F-2** | **`populateMenuPrices()` is unreachable on `restaurant.html`.** It is called only from `populateServicePrices()` (`:1363`), which returns early at `:1358` when no `[data-charge-name]` exists. `restaurant.html` has 3 `[data-menu-name]` spans and **0** `[data-charge-name]`, so the 3 signature prices never render | Broken canonical route | `content-loader.js:1357-1363`; `restaurant.html:743,753,763`; charge-placeholder count = 0 |
| **F-3** | `menu_categories` has no venue scoping, so a Lounge-only category cannot be expressed | Limitation, not a defect | Live columns contain no `page_id` / scope / type |
| **F-4** | `populateMenu()` renders `KES 0` when `price <= 0` instead of omitting the price tag | Cosmetic / data-quality | `content-loader.js:1049-1050` |
| **F-5** | Empty categories render "No items available in this category." for every category with no items on this page - amplified by F-1 mixing venues | Presentation | `content-loader.js:1011-1015` |

---

## F. LOUNGE FINDINGS

| # | Finding | Classification | Evidence |
|---|---|---|---|
| **F-6** | 4 Lounge offerings have **no** `menu_items` row (any `page_id`) | CANONICAL_DATA_MISSING | all 14 rows enumerated; no name or price match |
| **F-7** | 4 hardcoded prices on a live commercial page, with no DB record and no hydration hook | COMPETING_AUTHORITY | `lounge.html:675,680,685,690` |
| **F-8** | Hardcoded item names + descriptions (8 literals) | CANONICAL_DATA_MISSING | `lounge.html:673-689` |
| **F-9** | Raw Supabase Storage URL in `<img src>`, unregistered in `media_assets`, while an equivalent asset (`menu-images/cocktail.webp`, `319e829a`) **is** registered | COMPETING_AUTHORITY | `lounge.html:668` |
| **F-10** | 2 valid Lounge-scoped `menu_items` rows exist but are unreachable from the Lounge page | Unused canonical data | `page_id=2ba8a348`, 2 rows |

---

## G. RESTAURANT VS LOUNGE SEPARATION

**The separation mechanism is `menu_items.page_id`, a reference to `website_pages.id`. It
exists in the schema and is populated on 14/14 rows. It is NOT read by any query.**

Proof, not inference:

- Live `menu_items` columns include `page_id`; live `website_pages` has 9 rows with real UUIDs.
- Grouping the 14 items by `page_id` yields exactly three venue buckets:
  `a3490e73` = 11 items = `restaurant`; `2ba8a348` = 2 items = `lounge`;
  `e5186de1` = 1 item = `home`.
- `MenuRepository.mapItemToUI()` (`:45`) maps `page_id: item.page_id || ''`, so the value
  reaches the UI object - and is then dropped.
- `MenuRepository.getMenu()` (`:173-176`) issues `eq: [{column:'is_active', value:true}]`
  and nothing else.
- `content-loader.populateMenu()` receives no page context: it takes no argument and never
  calls `getPageId()`.

**Contrast with the sibling systems.** `ServicesRepository`, `GalleryRepository`,
`HeroRepository`, and `TestimonialsRepository` all take a `pageId` and filter on it. The
menu route is the only one that omits it - strong evidence the omission is a gap, not a
deliberate design choice.

**Two distinct problems must not be conflated:**

1. **F-1 (code):** the page filter is missing, so venues bleed into each other. The data
   already supports the correct behaviour.
2. **F-6 (data):** the four Lounge offerings have no rows. Fixing F-1 alone does **not**
   populate the Lounge menu.

---

## H. HARD-CODED MENU DATA

Full register in `PUBLIC_MENU_CANONICAL_ROUTE_MAP.md` section 5. Summary:

| Class | Count | Where |
|---|---|---|
| COMPETING_AUTHORITY | **5** | 4 Lounge prices + 1 Lounge image URL |
| CANONICAL_DATA_MISSING | **12** | 4 Lounge names + 4 descriptions + 4 prices (no DB row) |
| STATIC_PRESENTATION | 3 | Lounge section headings / tag / subtitle |
| LEGITIMATE_FALLBACK | 10 | `menu.config.js` category names, byte-match DB |
| CANONICAL | - | Restaurant Menu page (fully generated) |

**Explicitly NOT classified as business data:** `KES` prefix, `Our Menu`, `View Menu`,
`Popular`, `Reserve Your Table`, `Signature Cocktails`, `The Craft` - UI/editorial.

**Note on the 4 prices.** None of `1,200 / 1,500 / 2,000 / 800` matches any Lounge-scoped DB
row. `Cocktail Selection` is 850 and `Signature Cocktail` is 750 - different values,
different names. No match was inferred from wording similarity.

---

---

## I. MEDIA RESOLUTION

Contract is `menu_items.media_id -> media_assets.public_url -> AssetUrl.resolve() -> <img>`.

| Scope | `media_id` populated | Resolves | Notes |
|---|---|---|---|
| Restaurant (11 items) | 11 / 11 | **11 / 11** | canonical contract intact |
| Lounge (2 items) | 2 / 2 | **2 / 2** | contract intact, but never rendered |
| `lounge.html:668` image | n/a | **NOT registered** | `public-assets/images/menu/cocktail.webp`; registered equivalent is `menu-images/cocktail.webp` (`media_id 319e829a`) |

`MediaResolver.resolveCollection()` is applied at `MenuRepository.js:131`, `:154`, `:178`.
`populateMenu()` then reads `item.image_url` (not `public_url`) at `:1026` - if
`MediaResolver` writes to a different key than `image_url`, the `<img>` falls through
silently. Flagged for the follow-up task; not resolvable without a working runtime.
- **Ordering?** `display_order` ASC on both tables.
- **Active state?** Filtered in SQL and re-checked in the loader.
- **Duplicated business info?** No item name, price, or description is hardcoded on the
  Restaurant Menu page. `menu.config.js` holds 10 category names as fallback only, and each
  byte-matches the DB row.
- **Competing source?** Yes - see finding **F-1**.


---

## J. ADMIN / PUBLIC CONSISTENCY

Admin writes the **same canonical tables** (`menu_items`, `menu_categories`) via generic
resource config. Read-only inspection:

| Aspect | Finding |
|---|---|
| Where items are managed | `resource-config.ts` key `menu-items` -> `table: "menu_items"`, `defaultSort display_order` |
| Where categories are managed | key `menu-categories` -> `table: "menu_categories"` |
| Same canonical tables as public | **YES** |
| Admin column list | `repository.ts:60` and `:96` include `page_id` **and** `media_id` - matches live DB |
| Validation / indexing | `validation/admin.ts:99` indexes `menu-items` on `category_id, is_active, is_featured, page_id` |
| Pricing stored canonically | **YES** - `price numeric notNull` on `menu_items`; admin writes it directly |
| Media uses `media_id` | **YES** in the admin column list |
| Restaurant/Lounge distinction exposed | `page_id` is in the admin field set, so the raw capability exists; `resource-config.ts` declares no venue-specific filter |

**Admin schema drift (documentation-only; no change made):**

- `db/schema.ts` `menuCategories` declares `pageId: uuid("page_id")` - **this column does
  not exist on the live `menu_categories` table.**
- `db/schema.ts` `menuItems` does **not** declare `mediaId` - **this column does exist live.**

The Drizzle schema disagrees with the live database in both directions. `repository.ts` is
the accurate one. A maintenance risk, not a public-facing defect.

---

## K. SCHEMA SUFFICIENCY

**A schema change is NOT required** to represent Restaurant and Lounge menus in one system.

| Requirement | Already available? |
|---|---|
| One table for both venues | Yes - `menu_items` holds both scopes today |
| Venue discrimination | Yes - `menu_items.page_id`, populated 14/14, indexed in admin validation |
| Item name / description / price | Yes |
| Ordering | Yes - `display_order` |
| Active / visibility | Yes - `is_active` |
| Media | Yes - `media_id` -> `media_assets` |
| Category grouping | Yes - `category_id` FK |
| Category-level venue scoping | **No** - `menu_categories` has no page column |

The only thing not expressible today is a *category* restricted to one venue. A Lounge-only
category (e.g. "Cocktails") would render on the Restaurant page too, because categories are

---


---

## L. ARCHITECTURAL GAPS

**A second menu system is NOT required.** The existing single-table, single-repository,
single-loader architecture already carries both venues in the data.

Gaps recorded (no fixes proposed here):

| Gap | Nature |
|---|---|
| **L-1** | Repository/loader never filter by `page_id` (F-1) - code gap |
| **L-2** | `populateMenuPrices()` coupling to `[data-charge-name]` (F-2) - code gap |
| **L-3** | Lounge has no DOM mount, so no canonical route can reach it - code gap |
| **L-4** | `menu_categories` cannot be venue-scoped - schema limitation (optional) |
| **L-5** | Admin Drizzle schema drifts from live DB in two places - maintenance risk |
## M. DATABASE VERIFICATION

Source: read-only PostgREST `https://jczwilrysvnhcjzjztbi.supabase.co/rest/v1` with the
public anon key (the same path the browser uses). RLS-scoped to what `anon` can read -
exactly the public view.

**The Supabase CLI was deliberately NOT used.** `supabase/.temp/project-ref` =
`jczavwuaiywnhpfigvlw`, a staging project with only 6 tables and no CMS tables; a CLI query
against `gallery` returned `ERROR 42P01: relation "gallery" does not exist`. Using it as
evidence would have been wrong.

| Check | Result |
|---|---|
| `menu_categories` row count | 10 |
| `menu_categories` columns | `id, name, slug, description, display_order, is_active, created_at, updated_at` |
| `menu_categories.page_id` | **ABSENT** |
| All categories active | yes (10/10), `display_order` 1-10, contiguous |
| `menu_items` row count | 14 |
| `menu_items` columns | `id, page_id, category_id, name, description, price, image_url, display_order, is_active, created_at, updated_at, slug, alt_text, category, type, is_featured, media_id` |
| `menu_items.page_id` | **PRESENT, populated 14/14** |
| `page_id` -> `website_pages` | all 3 distinct values resolve to real page rows |
| All items active | yes (14/14) |
| `type` values | `'item'` on all 14 (item-kind flag, not a venue flag) |
| `menu_items.media_id` populated | 14/14 |
| `media_id` resolves in `media_assets` | **14/14** |
| Lounge item names matching lounge.html | **0 of 4** |
| Lounge prices matching 1200/1500/2000/800 | **0** |
| Writes performed | **NONE** - all requests were `GET` |

---

## N. STATIC VERIFICATION

| Check | Result |
|---|---|
| `#menu-container` mounts | 1 - `restaurant-menu.html:470` |
| `#menu-nav-container` mounts | 1 - `restaurant-menu.html:465` |
| `[data-menu-name]` hooks | 3 - all on `restaurant.html:743,753,763` |
| `[data-charge-name]` on `restaurant.html` | **0** (this is what breaks F-2) |
| `[data-charge-name]` on `restaurant-menu.html` | **0** |
| Any menu mount on `lounge.html` | **0** |
| Lounge `KES` literals | **4** - `lounge.html:675,680,685,690` |
| Lounge raw storage `<img>` | **1** - `lounge.html:668` |
| `menu.config.js` categories vs DB | 10 vs 10, names/slugs/orders byte-match |
| `MenuRepository.getMenu()` page predicate | **absent** |
| `populateMenuPrices()` reachable on restaurant pages | **NO** (early return at `:1358`) |

---

## O. RUNTIME VERIFICATION

**PARTIAL - the DB-driven Restaurant menu was NOT VERIFIED.**

| Attempt | restaurant-menu | restaurant | lounge |
|---|---|---|---|
| Run 1 | HTTP 200, 29 conn-refused errors, **0 categories rendered** | HTTP 200, 9 errors + 1 HTTP 400 | HTTP 200, 12 errors, **4 `.cocktail-item` blocks rendered** |
| Run 2 | HTTP 200, 30 conn-refused errors, **0 categories rendered** | HTTP 200, 3 errors | HTTP 200, 30 conn-refused, 0 |

Failure detail: every error is `net::ERR_CONNECTION_REFUSED` against
`/assets/js/lib/*`, `/assets/js/repositories/*`, `business-config.js`. The cascade
(`MISSING_DEPENDENCY: window.BaseRepository`,
`Cannot read properties of undefined (reading 'create')`) is caused by repository JS never
loading, so `populateMenu()` never receives data.

**Same prerequisite failed twice -> STOPPED**, per the audit rules. The server was never
restarted. **No runtime PASS is claimed for the Restaurant menu.**

What *was* observed: the Lounge `.cocktail-item` blocks render, because they are static HTML
that does not depend on any script.

---

## P. GIT / CHANGE SCOPE

| Field | Value |
|---|---|
| Starting branch | `feature/membership-tiers-staging-phase1` |
| Ending branch | `feature/membership-tiers-staging-phase1` (unchanged) |
| Starting HEAD | `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c` |
| Ending HEAD | `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c` (unchanged) |
| Starting dirty entries | 243 |
| Ending dirty entries | 249 (243 + 6 files created by this audit) |
| Application source changed | **NONE** |
| DB changes | **NONE** |
| Migrations | **NONE** |
| RLS changes | **NONE** |
| `supabase db push` | **NOT RUN** |
| Media uploaded / registered | **NONE** |
| Servers restarted | **NONE** |
| Packages installed | **NONE** |
| Destructive git ops | **NONE** (`reset`/`clean`/`stash`/`checkout`/`restore`/`rebase` all unused) |

Files created by this audit: `PUBLIC_MENU_AUDIT_REPORT.md`,
`PUBLIC_MENU_CANONICAL_ROUTE_MAP.md`, `PUBLIC_MENU_AUDIT_PROGRESS.md`,
`_menu_audit_probe.js`, `_menu_probe.json`, `_menu_probe2.json`.

---

## Q. DECISION GATES

The following must be answered before any surgical fix is justified. **Nothing below is
implemented or recommended here.**

| # | Gate | Why it must be answered first |
|---|---|---|
| **Q1** | Are the 4 Lounge offerings real, orderable menu items, or editorial "from" bands? | Determines whether the fix creates DB rows or reclassifies copy. Cannot be assumed. |
| **Q2** | If they become menu items, which `page_id`? | `2ba8a348` (lounge) is the only evidenced value |
| **Q3** | Which category? `Fast Foods` (`236a42aa`) is where the 2 existing lounge rows sit, but that grouping is semantically wrong for cocktails | No Lounge-appropriate category exists |
| **Q4** | Should a Lounge-only category be created, requiring `menu_categories.page_id`? | This is the only decision that would force a schema change |
| **Q5** | Should `Half-Day Package` (`page_id=home`, sitting in "Choma Zone") be excluded from the Restaurant menu? | Consequence of adding the page filter |
| **Q6** | Should `restaurant.html`'s 3 signature prices hydrate? | Fixing F-2 changes that page's visible output |
| **Q7** | Should the Lounge page gain a CMS mount, or should the 4 items move into the existing Lounge rows? | Two different architectures |
| **Q8** | Should `lounge.html:668` point at the registered `menu-images/cocktail.webp`? | Requires confirming intent for that hero image |
| **Q9** | Should the admin Drizzle schema drift (L-5) be corrected? | Out of menu scope but confirmed |
fetched globally. Whether that matters is a product decision, not a proven requirement.

---

---

# APPENDIX - IMPLEMENTATION LOG (added 2026-10-02, after the read-only audit)

This appendix records what was changed **after** the audit above. The audit findings
(A-Q) are historical and are **not** rewritten.

## Implementation status

| Item | Audit ref | Status |
|---|---|---|
| F-2 menu-price hydration | E / F-2 | **IMPLEMENTED** |
| F-1 page-scoped query | E / F-1 | **NOT IMPLEMENTED - blocked** (see below) |
| L-3 Lounge consumer | L / L-3 | **NOT IMPLEMENTED - blocked** (see below) |

## F-2 - IMPLEMENTED

`assets/js/content-loader.js`, two edits:

1. Removed `populateMenuPrices();` from inside `populateServicePrices()` (it sat after
   `if (chargePlaceholders.length === 0) return;`, so it never ran on a page with
   `[data-menu-name]` but no `[data-charge-name]`).
2. Added `runGuarded('MenuPrices', populateMenuPrices);` to the bootstrap subsystem list.

`populateMenuPrices()` now has exactly **one** call site. Service pricing and menu pricing
can no longer gate one another. No pricing rule, price source, table, hardcoded value or
schema was touched. `node --check` passes.

**Effect:** `restaurant.html`'s three `[data-menu-name]` placeholders now execute the
hydration path instead of being silently skipped.

**Runtime: NOT VERIFIED.** The dev server refused repository JS on that page in both
attempts (30 and 32 `ERR_CONNECTION_REFUSED`), so `window.MenuRepository` was undefined.
Verified structurally only; no runtime PASS claimed.

## F-1 - BLOCKED, NOT IMPLEMENTED

**New evidence discovered during implementation:**

- `restaurant-menu.html` declares `<body data-page="restaurant-menu">`.
- `PageIdentity.pageKeyForPageId('restaurant-menu')` returns `'restaurant-menu'`
  (`page-identity.js:76`).
- Live `website_pages` contains **9 rows and no `restaurant-menu` row** - a direct query
  for `page_key=eq.restaurant-menu` returned **0 rows**.
- All 11 Restaurant menu rows are scoped to `page_id = a3490e73`, whose page_key is
  **`restaurant`**, not `restaurant-menu`.

Therefore `PageResolver.requirePageUuid('restaurant-menu')` yields
`missing-page-record`, and adding the mandatory `page_id` filter would make
`restaurant-menu.html` render **zero menu items** - a hard regression of that page's
primary function.

This audit's earlier statement that "no schema change is required" remains **true**, but
it is not by itself sufficient: a page-identity decision is also required.

Note: `assets/js/forms.js:199` already aliases `restaurant-menu` -> `restaurant`, but for
`services.slug`, which is a **different namespace** from `website_pages.page_key`. It
cannot be reused directly for menu scoping without duplicating that mapping.

**Runtime confirmation that the leak persists:** on the one attempt where the repository
loaded, `restaurant-menu.html` still rendered **10 categories / 14 cards** - all items,
unfiltered.

## L-3 - BLOCKED, NOT IMPLEMENTED

- Lounge page resolution **works** (`lounge` -> `2ba8a348`, 2 rows exist).
- But `lounge.html` contains **none** of the menu CSS; `.menu-item-card`,
  `.menu-category`, `.price-tag` and the rest exist only in the inline `<style>` of
  `restaurant-menu.html`. No shared stylesheet defines them.
- The 2 Lounge rows are filed under category **"Fast Foods"** - a content/model issue this
  task forbids changing silently.
- The Lounge page already presents **4 different offerings** in a static `cocktail-grid`.
  A canonical menu section would add a **third, different** set (2 cocktails), duplicating
  menu information on one page.

Adding the mount is therefore a page redesign plus a business decision, not a surgical fix.

## Four missing Lounge offerings - UNTOUCHED

`House Signature Collection` (1,200), `Premium Whiskey Selection` (1,500),
`Vintage Wine Cellar` (2,000), `Artisanal Mocktails` (800).

**NO DATABASE RECORDS CREATED.** No prices, descriptions, categories, media or page ids
invented. Classified `CANONICAL_DATA_MISSING` and left exactly as found.

## Database

**NO DATABASE WRITES.** Read-only `GET` only. `menu_items` still holds 14 rows split
restaurant 11 / home 1 / lounge 2; `Cocktail Selection` 850.00 and `Signature Cocktail`
750.00 are unchanged, still in category `236a42aa`.

## Schema

**NO SCHEMA CHANGES.** Admin schema drift (L-5) was observed and deliberately left
untouched, per RULE 6.
