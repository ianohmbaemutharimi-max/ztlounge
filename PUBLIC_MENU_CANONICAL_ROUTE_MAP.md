# PUBLIC MENU CANONICAL ROUTE MAP

Read-only audit. Branch `feature/membership-tiers-staging-phase1`, HEAD `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c`.
Canonical DB `jczwilrysvnhcjzjztbi`, read-only PostgREST.

## 1. Field-by-field route map

| Field | Restaurant canonical source | Lounge canonical source | Repository | Loader | DOM consumer | Hardcoded copies | Classification |
|---|---|---|---|---|---|---|---|
| Item name | `menu_items.name` (11 rows, `page_id=a3490e73`) | **NONE** - no row for the 4 Lounge offerings | `MenuRepository.mapItemToUI()` (`:33`) | `populateMenu()` (`:1035`) | `.menu-item-card h3` (restaurant-menu.html) | 4 Lounge names hardcoded at `lounge.html:673,678,683,688` | Restaurant CANONICAL / Lounge CANONICAL_DATA_MISSING |
| Description | `menu_items.description` | **NONE** | `mapItemToUI()` (`:34`) | `populateMenu()` (`:1040`) | `.menu-item-card p` | 4 Lounge descriptions at `lounge.html:674,679,684,689` | Restaurant CANONICAL / Lounge CANONICAL_DATA_MISSING |
| Price | `menu_items.price` (11 rows) | **NONE** | `mapItemToUI()` (`:35`) | `populateMenu()` (`:1048`) `"KES " + Number(price).toLocaleString()` | `.price-tag` | **4 Lounge literals** `lounge.html:675,680,685,690` | Restaurant CANONICAL / Lounge COMPETING_AUTHORITY + CANONICAL_DATA_MISSING |
| Category | `menu_items.category_id` -> `menu_categories.id` | `menu_categories` has **no page scoping** | `mapItemToUI()` (`:43`) | `populateMenu()` (`:993-1010`) | `.menu-category-title`, `#menu-nav-container a` | 10 names in `menu.config.js:19-30` (fallback only, matches DB) | CANONICAL (restaurant) / **not separable for Lounge** |
| Image / media | `menu_items.media_id` -> `media_assets.public_url` (11/11 resolve) | Lounge HTML uses a raw URL | `resolveMedia()` (`:53`) via `MediaResolver.resolveCollection()` | `populateMenu()` (`:1026-1028`) `AssetUrl.resolve(item.image_url)` | `.menu-item-image` | `lounge.html:668` raw `public-assets/images/menu/cocktail.webp` | Restaurant CANONICAL / Lounge COMPETING_AUTHORITY |
| Active status | `menu_items.is_active` + `menu_categories.is_active` | not applicable (no rows) | `getMenu()` (`:174`) filters `is_active=true`; `populateMenu()` (`:977-979`) re-filters `cat.is_active !== false` | `populateMenu()` | all `.menu-category` / `.menu-item-card` | none | CANONICAL |
| Ordering | `menu_categories.display_order` ASC; `menu_items.display_order` ASC | not applicable | `getCategories()` / `getMenu()` `orderBy: 'display_order', ascending: true` | `populateMenu()` emits in array order | `.menu-category` DOM order | `menu.config.js` display_order 1-10 (fallback) | CANONICAL |
| Visibility / scope | **NO scope field on either menu table** | **NO scope field** | none | none | n/a | n/a | **SCHEMA_GAP** (for scope-based visibility) |
| Page association | `menu_items.page_id` = `a3490e73` (restaurant) | `menu_items.page_id` = `2ba8a348` (lounge), 2 rows | **`NOT READ** - `mapItemToUI()` maps it (`:45`) but no query filters on it** | n/a | n/a | n/a | CANONICAL in DB, **UNUSED by the public route** |
| Menu separation mechanism | `menu_items.page_id` | `menu_items.page_id` | unsupported | unsupported | n/a | n/a | **present in data, unimplemented in code** |

## 2. Live `menu_items` inventory (14 rows, all `is_active=true`, all `type='item'`)

| # | Name | Price | `page_id` | Page | Category | `media_id` |
|---|---|---|---|---|---|---|
| 1 | Signature Nyama Choma | 1800.00 | `a3490e73` | restaurant | Choma Zone | yes |
| 2 | ZT Signature Pilau | 650.00 | `a3490e73` | restaurant | Choma Zone | yes |
| 3 | Premium Beef Steak | 1650.00 | `a3490e73` | restaurant | Choma Zone | yes |
| 4 | Mixed Grill Platter | 1650.00 | `a3490e73` | restaurant | Choma Zone | yes |
| 5 | Goat Ribs | 1500.00 | `a3490e73` | restaurant | Main Dishes | yes |
| 6 | Grilled Chicken | 1200.00 | `a3490e73` | restaurant | Main Dishes | yes |
| 7 | Premium Sides | 450.00 | `a3490e73` | restaurant | Main Dishes | yes |
| 8 | Fresh Juice | 450.00 | `a3490e73` | restaurant | Specialty Dishes | yes |
| 9 | Loaded Fries | 850.00 | `a3490e73` | restaurant | Quick Bites & Snack | yes |
| 10 | Chicken Tikka | 650.00 | `a3490e73` | restaurant | Quick Bites & Snack | yes |
| 11 | Coffee | 250.00 | `a3490e73` | restaurant | Hot Beverages and Breakfast | yes |
| 12 | **Cocktail Selection** | **850.00** | **`2ba8a348`** | **lounge** | **Fast Foods** | yes |
| 13 | **Signature Cocktail** | **750.00** | **`2ba8a348`** | **lounge** | **Fast Foods** | yes |
| 14 | Half-Day Package | 450.00 | `e5186de1` | home | Choma Zone | yes |

## 3. Public surfaces

| Surface | File | Menu mount | Loader reached? | Rendered source |
|---|---|---|---|---|
| Restaurant Menu | `pages/experiences/restaurant-menu.html` | `#menu-nav-container` (:465), `#menu-container` (:470) | `populateMenu()` | DB, **all 14 items regardless of `page_id`** |
| Restaurant page | `pages/experiences/restaurant.html` | 3x `[data-menu-name]` (:743,753,763) | `populateMenuPrices()` **unreachable** - 0 `[data-charge-name]` | nothing (spans stay empty) |
| Lounge | `pages/experiences/lounge.html` | **none** | none | static HTML only (`:668-691`) |

---

## 4. Restaurant vs Lounge separation decision table

| Question | Evidence | Result |
|---|---|---|
| Can Restaurant items be identified reliably? | 11 of 14 rows carry `page_id = a3490e73` = `website_pages.page_key='restaurant'` | **YES** - in the data |
| Can Lounge items be identified reliably? | 2 rows carry `page_id = 2ba8a348` = `'lounge'`; the other 2 Lounge-page items simply have no rows | **YES** - in the data |
| Can one `menu_items` table represent both? | Both scopes already live in the single `menu_items` table | **YES** - already demonstrated |
| Can `menu_categories` distinguish them? | Live columns: `id, name, slug, description, display_order, is_active, created_at, updated_at`. **No page/scope/type column.** No category name implies a venue | **NO** - categories are global and venue-neutral |
| Does a page association exist? | `menu_items.page_id` column, populated on 14/14 rows with valid `website_pages.id` values | **YES** |
| Does a scope/type field exist? | `menu_items.type` exists but is `'item'` on all 14 rows - it is an item-kind flag, **not** a venue flag | **NO** for venue scope |
| Does the repository support filtering? | `MenuRepository.getMenu()` (`:166-199`) calls `getAll({ eq: [{column:'is_active', value:true}] })` - **no `page_id` predicate**. `getItemsByCategory()` (`:143-160`) filters `type`/`category_id`/`is_active` only. `mapItemToUI()` reads `page_id` into the UI object (`:45`) but nothing consumes it | **NO** - the column is read then discarded |
| Is a schema change required? | `page_id` exists and is populated on every row | **NO** |
| Is a second menu system required? | One table, one repository, one loader already carry both scopes | **NO** |

## 5. Hardcoded menu data register

| Surface | Value | Location | Should be canonical? | Current source | Classification |
|---|---|---|---|---|---|
| Lounge | `House Signature Collection` | `lounge.html:673` | Yes (menu record) | hardcoded `<h4>` | CANONICAL_DATA_MISSING |
| Lounge | `Exclusive blends created by our award-winning mixologists` | `lounge.html:674` | Yes (menu description) | hardcoded `<p>` | CANONICAL_DATA_MISSING |
| Lounge | `From KES 1,200` | `lounge.html:675` | Yes (menu price) | hardcoded `<span class="cocktail-price">` | COMPETING_AUTHORITY + CANONICAL_DATA_MISSING |
| Lounge | `Premium Whiskey Selection` | `lounge.html:678` | Yes | hardcoded `<h4>` | CANONICAL_DATA_MISSING |
| Lounge | `Curated from the world's finest distilleries` | `lounge.html:679` | Yes | hardcoded `<p>` | CANONICAL_DATA_MISSING |
| Lounge | `From KES 1,500` | `lounge.html:680` | Yes | hardcoded `<span>` | COMPETING_AUTHORITY + CANONICAL_DATA_MISSING |
| Lounge | `Vintage Wine Cellar` | `lounge.html:683` | Yes | hardcoded `<h4>` | CANONICAL_DATA_MISSING |
| Lounge | `Exquisite wines from premier vineyards` | `lounge.html:684` | Yes | hardcoded `<p>` | CANONICAL_DATA_MISSING |
| Lounge | `From KES 2,000` | `lounge.html:685` | Yes | hardcoded `<span>` | COMPETING_AUTHORITY + CANONICAL_DATA_MISSING |
| Lounge | `Artisanal Mocktails` | `lounge.html:688` | Yes | hardcoded `<h4>` | CANONICAL_DATA_MISSING |
| Lounge | `Sophisticated non-alcoholic creations` | `lounge.html:689` | Yes | hardcoded `<p>` | CANONICAL_DATA_MISSING |
| Lounge | `From KES 800` | `lounge.html:690` | Yes | hardcoded `<span>` | COMPETING_AUTHORITY + CANONICAL_DATA_MISSING |
| Lounge | `.../public-assets/images/menu/cocktail.webp` | `lounge.html:668` | Yes (media) | raw storage URL in `<img src>` | COMPETING_AUTHORITY |
| Lounge | `Signature Cocktails`, `The Craft`, `Our master mixologists...` | `lounge.html:662-664` | No | section headings | STATIC_PRESENTATION |
| Restaurant | 10 category names | `menu.config.js:19-30` | Yes | fallback only, byte-matches DB | LEGITIMATE_FALLBACK |
| Restaurant | 14 item names/prices in DOM | `restaurant-menu.html` | Yes | generated from DB | CANONICAL |
| Restaurant | `Signature Nyama Choma` / `ZT Signature Pilau` / `Premium Beef Steak` | `restaurant.html:743,753,763` | Yes | `data-menu-name` hooks, **empty at runtime** | CANONICAL (hook) - see report F-2 |

## 6. Media resolution

| Item scope | `media_id` populated | Resolves in `media_assets` | Mechanism |
|---|---|---|---|
| Restaurant (11) | yes | **11 / 11** | `media_id` -> `media_assets.public_url` -> `AssetUrl.resolve()` |
| Lounge (2) | yes | **2 / 2** | same - but **never rendered**, no mount on `lounge.html` |
| Lounge HTML image | n/a | **NOT registered** | `lounge.html:668` points at `public-assets/...`; the registered asset for the same concept is `media_assets.public_url` = `menu-images/cocktail.webp` (`319e829a`) |

---

## 7. CORRECTIONS AND UPDATE (2026-02 implementation phase)

History is preserved. Earlier rows above are **CORRECTED** only where the implementation
changed reality.

### CORRECTED - section 3, "Public surfaces"

The row stating `restaurant.html` renders **"nothing (spans stay empty)"** described the
pre-fix state. `populateMenuPrices()` has since been made an independent bootstrap
subsystem (`runGuarded('MenuPrices', ...)`) and its internal call from
`populateServicePrices()` removed, so those three placeholders now **execute** the
hydration path. Whether they display a value still depends on the repository JS loading.

### CORRECTED - section 1, "Menu separation mechanism"

Still accurate: `menu_items.page_id` remains the mechanism and remains **unimplemented in
code**. Runtime observation after the F-2 fix confirms `restaurant-menu.html` still renders
**10 categories / 14 cards** (all items, unfiltered).

### NEW BLOCKER - section 4, "Does the repository support filtering?"

A second, previously undocumented obstacle exists:

| Surface | Declared page | `website_pages` row | Result |
|---|---|---|---|
| `restaurant.html` | `restaurant` | yes (`a3490e73`) | filterable |
| `lounge.html` | `lounge` | yes (`2ba8a348`) | filterable |
| `restaurant-menu.html` | `restaurant-menu` | **NO - 0 rows** | `missing-page-record`; a filter would render **zero** items |

Menu data for the restaurant is scoped to page_key `restaurant`, but the public menu page
declares `restaurant-menu`. Resolving this requires a page-identity or data decision that
was **not authorized**. See `PUBLIC_MENU_FIX_PROGRESS.md` Entry 3.

### UNCHANGED

All hardcoded-data, media, schema-sufficiency and admin-drift findings above remain valid.
`media_id -> media_assets -> public_url` is untouched for menu images.