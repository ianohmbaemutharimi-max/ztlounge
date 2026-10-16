# PUBLIC MENU READ-ONLY AUDIT

Lounge + Restaurant menu architecture. **READ-ONLY - no fixes, no data changes, no migrations.**
Public repo `zt-lounge` @ `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c` - Admin repo @ `876b1851fbcd016cf290734498dda66b764afa12`.
Canonical DB `jczwilrysvnhcjzjztbi` (read-only PostgREST; CLI project `jczavwuaiywnhpfigvlw` **not** used).
Verified `2026-10-02T23:13:46+03:00`.

---

## A. AUDIT STATUS

**PARTIALLY VERIFIED**

Architecture, schema, repository, loader, admin and services-domain questions are answered
from current source plus live read-only DB evidence. **Runtime rendering was NOT VERIFIED** -
the dev server refused repository JavaScript on two consecutive attempts (28 and 31
`ERR_CONNECTION_REFUSED` on `restaurant-menu.html`), so probing was stopped per the
two-failure rule. No rendered menu was observed.

---

## B. CURRENT ARCHITECTURE

**Model B - page/scope-based.** `menu_items.page_id` is the venue/scope discriminator.

| Component | Evidence |
|---|---|
| `menu_categories` | 10 rows: `id, name, slug, description, display_order, is_active, created_at, updated_at`. **No page/scope column.** All `is_active=true`. |
| `menu_items` | 14 rows. Columns include `page_id`, `category_id`, `media_id`, `image_url`, `type`, `is_featured`, `alt_text`. `page_id` **populated on all 14**. |
| Scope mapping | `MenuRepository.MENU_PAGE_KEY_BY_SURFACE` (`:142`): `home->home`, `restaurant->restaurant`, **`restaurant-menu->restaurant`**, `lounge->lounge`. |
| UUID resolution | `resolveMenuPageUuid()` (`:160`) uses the **existing** `PageResolver.resolvePageRecord(page_key)`. No UUID hardcoded. |
| Query enforcement | `getMenu(pageUuid)` (`:250`) issues `eq: [is_active=true, page_id=pageUuid]` (`:265-267`) - **server-side**, not post-fetch. |
| Empty-category control | `withoutEmptyCategories()` (`:174`) removes categories with no in-scope items. |
| Global page identity | **Untouched.** `PageIdentity.PAGE_TO_PAGE_KEY['restaurant-menu']` remains `'restaurant-menu'`; the menu mapping lives only in the menu layer. |

`menu_items.type` is `'item'` on all 14 rows - an item-kind flag, **not** a venue flag.
`menu_items.image_url` is a legacy read-only column, unused by the menu route.

---

## C. RESTAURANT MENU PIPELINE

```
DB  menu_items (page_id = a3490e73-ef00-4063-8d25-dcdc2772ddb4, 11 rows)
      + menu_categories (5 categories hold those 11 items)
 -> MenuRepository.getMenuForSurface('restaurant-menu')          [MenuRepository:287]
      -> MENU_PAGE_KEY_BY_SURFACE -> 'restaurant'                [:142]
      -> PageResolver -> a3490e73...                              [:160]
      -> getMenu(...)  eq is_active=true AND page_id=...          [:265-267]
      -> MediaResolver.resolveCollection() -> media_assets.public_url
 -> content-loader.populateMenu()                                 [content-loader:968]
 -> DOM  restaurant-menu.html  #menu-container (:470) / #menu-nav-container (:465)
       .menu-item-card > h3 (name) | p (description) | .price-tag ("KES " + price)
```

Traced item: **`Grilled Chicken`** - description *"Grilled chicken with herb potatoes and
seasonal vegetables"*, `price` `1200.00`, `category_id` -> `f8ae326d...`
("Main Dishes (Wet/Dry Fry)"), `media_id` resolves in `media_assets` -> `public_url`.

**Which records appear:** exactly the 11 rows with `page_id = a3490e73`. Lounge and Home rows
are excluded by the query predicate.

---

## D. LOUNGE MENU PIPELINE

```
DB  menu_items (page_id = 2ba8a348-42a9-4ab6-b4db-1eb1fb67748d, 2 rows)
      both in menu_categories 236a42aa... ("Fast Foods")
 -> MenuRepository.getMenuForSurface('lounge')                   [MenuRepository:287]
      -> MENU_PAGE_KEY_BY_SURFACE -> 'lounge'                    [:142]
      -> PageResolver -> 2ba8a348...  -> getMenu(...)            [:160 / :265]
 -> content-loader.populateMenu()                                 [content-loader:968]
 -> DOM  lounge.html  #menu-container (:680) / #menu-nav-container (:679)
```

| Name | Price | Category | Media |
|---|---|---|---|
| `Signature Cocktail` | 750.00 | `236a42aa` "Fast Foods" | resolves (`menu-images/signature-cocktail.webp`) |
| `Cocktail Selection` | 850.00 | `236a42aa` "Fast Foods" | resolves (`menu-images/cocktail.webp`) |

Both descriptions are populated ("House signature cocktail", "Premium cocktail selection").

---

## E. RESTAURANT FINDINGS

1. Restaurant menu is served entirely from `menu_items` scoped by `page_id=a3490e73`.
2. 11 active items; 5 categories hold them (Choma Zone, Main Dishes (Wet/Dry Fry), Quick
   Bites & Snack, Specialty Dishes, Hot Beverages and Breakfast).
3. Name, description, price and image all originate from the DB row; none is duplicated in HTML.
4. Ordering is `display_order` ASC on both tables.
5. Inactive state is filtered in SQL (`is_active=true`) and re-checked for categories in the loader.
6. Category grouping uses the `category_id` FK, never heading text.
7. `is_featured` is set on 3 Restaurant rows but read by **no public page**
   (`getSignatureItems()` has no public caller) - stored, unused on the public menu path.

---

## F. LOUNGE FINDINGS

1. Lounge menu **is** a canonical consumer today: `lounge.html` mounts `#menu-container`
   (`:680`) and `#menu-nav-container` (`:679`) and links `assets/css/menu.css` (`:85`).
2. It requests `page_id=2ba8a348...` through the same repository and loader as Restaurant.
3. Both Lounge records render with canonical names, descriptions, prices and `media_id`-resolved images.
4. **Category anomaly (fact, not inference):** both Lounge rows reference
   `menu_categories.id = 236a42aa-9559-4a69-ad48-c2ef22bdf5bb`, named **"Fast Foods"**.
   No `menu_categories` row expresses a Lounge/Bar venue.
5. The four previously reported static offerings are **no longer hardcoded** in served source.
   Their names survive only inside an explanatory comment at `lounge.html:674-675`.
6. There is **no canonical record** for `House Signature Collection`, `Premium Whiskey Selection`,
   `Vintage Wine Cellar` or `Artisanal Mocktails` - checked by exact name and by price across all
   14 rows. No approximate match was accepted.

---

## G. RESTAURANT VS LOUNGE SEPARATION

Separated **only** by `menu_items.page_id`, resolved from the serving surface's PageId through
`MENU_PAGE_KEY_BY_SURFACE` and the existing `PageResolver`.

| Surface | Declared `data-page` | Menu page_key | Resolved `page_id` | Items |
|---|---|---|---|---|
| `restaurant-menu.html` | `restaurant-menu` | `restaurant` | `a3490e73-...` | 11 |
| `lounge.html` | `lounge` | `lounge` | `2ba8a348-...` | 2 |
| `index.html` (Home) | `home` | `home` | `e5186de1-...` | 1 |

**Categories do not separate the venues.** `menu_categories` has no page/scope column and
all 10 categories are global.

---

## H. HARDCODED MENU DATA

**None confirmed on either served menu page.** The four historical price literals
(`KES 1,200`, `KES 1,500`, `KES 2,000`, `KES 800`) each return **0** occurrences across all
served `.html`/`.js`. The four offering names occur once each, only inside the documentation
comment at `lounge.html:674-675`.

No hardcoded category names exist on either menu page (`menu.config.js` holds fallback
category names only, used when a category query returns no rows).

---

## I. CANONICAL DATA GAPS

| Gap | Status |
|---|---|
| `House Signature Collection`, `Premium Whiskey Selection`, `Vintage Wine Cellar`, `Artisanal Mocktails` | **CANONICAL_DATA_MISSING** - no `menu_items` row by name or price. No record created. |
| Lounge-specific category | **ARCHITECTURAL_GAP** - both Lounge rows are filed under "Fast Foods"; a venue-scoped category is not expressible today. |
| `Half-Day Package` (`menu_items`, page `home`, category -> Choma Zone) | Data oddity: a *menu item* carrying a conference-package name, empty description, price 450. The same name exists in `service_charges` at 25 000 - cross-domain name collision. Recorded, not changed. |

---

## J. SCHEMA FINDINGS

**The current schema can represent and serve both menus without any schema change.**

- One table holds both scopes, distinguished by `menu_items.page_id` (populated 14/14).
- No `menu_categories.page_id` is needed for *item* scoping - only for category scoping.
- `media_id` exists on all 14 rows and all resolve.

Single schema limitation observed: **categories cannot be scoped to a venue.**

---

## K. ADMIN FINDINGS

Admin menu management is `src/app/dashboard/menu/page.tsx` -> `CatalogManager`
(`src/features/services/catalog-manager.tsx`, shared with Services). Verified in source:

| Capability | Present |
|---|---|
| Venue/page selector for menu | Yes - `isPageFirstCatalog` (`:108`), own storage key `zt-admin:menu-page-scope` (`:32`), **no auto-default page** (`:147`) |
| Server-side list filter by page | Yes - `"filter:page_id"` (`:123`) |
| Page required before loading | Yes - `enabled: !isPageFirstCatalog \|\| Boolean(pageId)` |
| Create requires `page_id` | Yes - client throw (`:199`) + POST guard `body.page_id === scopePageId` |
| Edit preserves `page_id` | Yes - `page_id: row.page_id ?? defaultPageId` (`:263`); Page field disabled |
| Delete carries page context | Yes - `api.remove(cfg.itemResource, id, pageContext)` (`:243`) with venue-labelled confirm |
| Page ownership enforcement | Yes - `assertPageOwnership` + `assertPageAssignment`; `menu-items` in `PAGE_SCOPED_RESOURCES` |
| Price / description / category / media / active / order / featured | Yes - all exposed |

**The admin architecture provides a reliable Restaurant/Lounge distinction via
`menu_items.page_id`, enforced in both directions (UI scope and API ownership check).**

---

## L. MEDIA FINDINGS

```
menu_items.media_id -> media_assets.id -> media_assets.public_url
                    -> MediaResolver.resolveCollection() -> AssetUrl.resolve()
                    -> <img src>
```

- `media_id` populated on **14 / 14** rows; **14 / 14** resolve against `media_assets`.
- `MenuRepository.resolveMedia()` (`:53`) applies `MediaResolver.resolveCollection()`.
- `populateMenu()` writes `img.src` from `item.image_url` via `AssetUrl.resolve()` (`:1026-1028`).
- **No hardcoded menu image URL and no direct bucket reference** on either menu page.
- The raw `public-assets/.../cocktail.webp` URL that previously sat on `lounge.html` is gone
  (0 occurrences); Lounge images now flow through `media_id`.

---

## M. SERVICES SEPARATION

**Correctly separated.** No food dish, cocktail, whiskey, wine or mocktail exists in the
services domain.

| Table | Content |
|---|---|
| `services` (12) | `Conference`, `Lounge & Bar`, `VIP Cabins`, `Auto Spa`, `Events`, `Restaurant` (venue containers) + 6 grooming/cleaning services |
| `service_charges` (12) | Venue packages only - `Silver/Gold Cabin`, `Executive Suite`, `Gold/Premium/Silver Celebration`, `Full-Day/Half-Day/Executive Package`, `Express Wash`, `Premium Detail`, `Ultimate Protection` |

`Lounge & Bar` is a **venue container** at price 0.00, not a drink product. No menu product
is represented as a bookable service.

---

## N. RUNTIME VERIFICATION

**NOT VERIFIED.**

Two attempts, both HTTP 200, both blocked by the same prerequisite: the dev server refused
repository JavaScript (`ERR_CONNECTION_REFUSED` counts 28 and 31 on `restaurant-menu.html`;
4 and 10 on `lounge.html`). Per the two-failure rule, probing stopped.

Confirmed at runtime: both pages respond **HTTP 200**, both expose a `#menu-container` mount,
and `lounge.html` declares `data-page="lounge"`. **No rendered category or item was observed,
so no rendered menu value is claimed.**

**DATABASE VERIFIED:** yes - read-only PostgREST against `jczwilrysvnhcjzjztbi`. No writes.

---

## O. GIT / CHANGE SCOPE

| Field | Value |
|---|---|
| Public branch / HEAD | `feature/membership-tiers-staging-phase1` / `905bd7a11c87a06...` - unchanged |
| Admin branch / HEAD | `clean-rebuild` / `876b1851fbcd016c...` - unchanged |
| Public dirty before / after | 263 / 265 (+2: route map + this report) |
| Admin dirty before / after | 814 / 814 - unchanged |
| Files created | `PUBLIC_MENU_READ_ONLY_ROUTE_MAP.md`, `PUBLIC_MENU_READ_ONLY_AUDIT.md` |
| **Application files changed** | **0** |
| **Database writes** | **0** |
| Migrations / SQL / RLS | **0** |
| `reset`/`clean`/`stash`/`checkout`/`rebase` | none used |

Existing reports were **read but not modified**. Scratch probe files for the runtime attempt
(`_ro_menu_probe.js`, `_ro_menu.json`, `_ro_menu2.json`) were deleted after evidence capture.

---

## P. DECISION GATES

1. **The four missing Lounge offerings** - what are they canonically? No row exists; none created.
2. **Lounge category** - should a venue-scoped category exist (requires `menu_categories.page_id`), or should the two Lounge rows be re-filed under an existing category?
3. **`Half-Day Package`** - a `menu_items` row on page `home` named identically to a `service_charges` row at a different price. Which domain does it belong to?
4. **`is_featured`** - should it have a public consumer, or is it admin-only metadata?
5. **Dev-server stability** - the asset-loading failure is the single blocker preventing runtime verification.
