# PUBLIC MENU UI IMPLEMENTATION REPORT

Admin + public menu UI surgical fix. Public repo `zt-lounge` @ `905bd7a11c87a06...`,
Admin repo `zt-lounge-admin` @ `876b1851...`, canonical DB `jczwilrysvnhcjzjztbi`.

---

## A. FINDINGS BEFORE FIX

| # | Finding | Surface | Severity |
|---|---|---|---|
| F-1 | **The public menu could not be runtime-verified at all.** Repository JS failed with `ERR_CONNECTION_REFUSED` (28-31 occurrences) even though every file returns HTTP 200 when fetched directly. | infra | **High (blocked all verification)** |
| F-2 | Admin scope hint stated *"Menu items **and categories** are scoped through menu_items.page_id."* `menu_categories` has no page/scope column, so this misrepresented the data model and implied venue-specific categories. | Admin UI | Medium (Rule 6) |
| F-3 | No hardcoded menu business data on either surface. | public | none |
| F-4 | Exactly one menu repository/renderer. | public | none |

---

## B. ADMIN UI PROBLEMS

One, and only one: **F-2**, the incorrect scoping statement. Everything the task requires was
already implemented and verified in source:

| Requirement | Status | Evidence |
|---|---|---|
| Human-readable page selector | Present | `catalog-manager.tsx:420` `/{p.page_key} — {p.title}` |
| No raw UUID as selector | Pass | UUID is the `value` only, never the label |
| Server-side page filtering | Pass | `:123` `"filter:page_id": eq:${pageId}` |
| Page required before loading | Pass | `:128` `enabled: !isPageFirstCatalog \|\| Boolean(pageId)`; `:147` menu returns early with no default page |
| Create requires `page_id` | Pass | `:199` client throw + POST guard `body.page_id === scopePageId` |
| Edit preserves `page_id` | Pass | `:263` `page_id: row.page_id ?? defaultPageId`; Page field disabled |
| Cross-venue edit/delete blocked | Pass | `assertPageOwnership` + `assertPageAssignment`; `menu-items` in `PAGE_SCOPED_RESOURCES` |
| Venue-aware delete confirm | Pass | `:343` ` from ${pageLabel(selectedPageId)}` |
| Page column | Pass | `:302` `pageLabel(r.page_id)` |
| Price / description / category / media / active / order | Pass | all present in form + list |
| Venue visible while loading/editing/deleting | Pass | scope panel (`:413-434`) always rendered above the table |
| Dead `page_key === "menu"` default | Removed | only an explanatory comment remains |

---

## C. PUBLIC UI PROBLEMS

**None found.** Both surfaces render canonical data correctly. The previously reported hardcoded
Lounge prices (`KES 1,200/1,500/2,000/800`) and the raw `public-assets/.../cocktail.webp` URL
were already removed in an earlier task.

`Signature Cocktail` appears 9 times in `lounge.html`, but every hit is SEO/editorial copy
(`<title>`, meta descriptions, JSON-LD description, a section heading). Classified
**STATIC_PRESENTATION** - not a menu record and not a competing authority.

---

## D. FIXES IMPLEMENTED

**One source line changed, in one file.**

`zt-lounge-admin/src/features/services/catalog-manager.tsx:426`

```
- "Menu items and categories are scoped through menu_items.page_id."
+ "Menu items are scoped through menu_items.page_id. Categories are global and shared across all pages."
```

Rationale: Rule 6 requires the UI not to pretend categories are venue-specific. They are not -
`menu_categories` is a global table of 10 rows with no page column. The corrected copy states the
true model without inventing a schema or filtering categories (filtering would hide legitimate
rows and require the forbidden `menu_categories.page_id`).

**No other source file was modified. No public-site file was modified.**

### Environment root cause (not application code)
The `ERR_CONNECTION_REFUSED` blocker that prevented all previous runtime verification was a
**dev-server concurrency limitation**, not an application defect:

- All 13 loader-chain files exist on disk and return HTTP 200 when fetched directly.
- Playwright traces showed the *same* ~28-31 URLs failing every run, always from the point where
  `shared-components.js` injects the loader chain in parallel.
- Serving the identical, unmodified site from a Node static server (`_srv.js`, a scratch file)
  produced **0 refused requests**, `window.MenuRepository` defined, and a fully rendered menu.

This satisfies requirement 14 (diagnose the asset-loading issue) with **no application change**.

---

## E. CANONICAL DATA FLOW

```
ADMIN (/dashboard/menu)
   CatalogManager, page-first
   select /{page_key} - {title}
   -> api.list("menu-items", { filter:page_id: eq:<uuid> })
   -> POST/PATCH /api/admin/menu-items ?page_id=<uuid>
        assertPageOwnership  (record belongs to the page)
        assertPageAssignment (body.page_id agrees with ?page_id)
   -> menu_items.page_id
        v
MenuRepository.getMenuForSurface(getPageId())
   MENU_PAGE_KEY_BY_SURFACE -> PageResolver -> website_pages.id
   getMenu(uuid): eq is_active=true AND page_id=uuid
   -> MediaResolver -> media_assets.public_url
        v
populateMenu() -> #menu-container .menu-item-card
   h3 = name | p = description | .price-tag = KES + menu_items.price | img = resolved public_url
        v
RESTAURANT (/pages/experiences/restaurant-menu.html, data-page="restaurant-menu")
LOUNGE     (/pages/experiences/lounge.html,          data-page="lounge")
```

One repository, one renderer, one data source. The only difference between the two surfaces is
the resolved `page_id`.

---

## F. RESTAURANT VERIFICATION - RUNTIME PASS

`/pages/experiences/restaurant-menu.html`

- HTTP **200**
- **0** console errors, **0** page errors, **0** failed requests
- **5** categories: Specialty Dishes, Choma Zone, Main Dishes (Wet/Dry Fry),
  Hot Beverages and Breakfast, Quick Bites & Snack
- **11** menu items, matching the 11 `page_id = a3490e73` rows
- **0** empty-category blocks (`withoutEmptyCategories()` working)
- **0** Lounge items leaked
- Prices canonical: 450, 1800, 650, 1650, 1650, 1200, 450, 1500, 250, 850, 650

---

## G. LOUNGE VERIFICATION - RUNTIME PASS

`/pages/experiences/lounge.html`

- HTTP **200**
- **0** console errors, **0** page errors, **0** failed requests
- **1** category: **"Fast Foods"** (the actual category - shown truthfully, not relabelled to an
  invented "Lounge Drinks")
- **2** items: `Signature Cocktail` KES 750, `Cocktail Selection` KES 850
- **0** Restaurant items leaked
- **0** invented items - the four previously reported offerings were not recreated

---

## H. ADMIN EDIT VERIFICATION - BLOCKED

`/dashboard/menu` returns **307** (auth redirect); `/api/admin/menu-items?page_id=...` returns
**401**. No `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`TEST_*` variables exist and no Playwright
`storageState` fixture is present.

Per the task rules I did **not** create users, seed credentials, or bypass authentication.
Therefore **Tests 3-7 (Admin scope, edit round-trip, cross-scope safety, media picker) are
BLOCKED at runtime** and rest on source evidence alone. No DB-mutation test was performed, so no
test mutation could be left behind.

---

## I. MEDIA VERIFICATION - PASS

Every rendered menu image resolved to a Supabase Storage `public_url`:

- `menu_items.media_id` populated on **14/14** rows
- `media_id` resolves to `media_assets` for **14/14**
- Items rendered with a missing image: **0**
- Items whose `img.src` was not a `/storage/v1/object/` URL: **0**
- Lounge: `Signature Cocktail` -> `menu-images/signature-cocktail.webp`,
  `Cocktail Selection` -> `menu-images/cocktail.webp`

No raw Storage URL was hardcoded into a menu card.

---

## J. PRICE VERIFICATION - PASS

Admin writes `menu_items.price`; the public page reads the same column. Runtime prices
(450 / 750 / 850 / 1200 / 1650 / 1800 / 1500 / 250 / 650) match the DB rows exactly. No hardcoded
price literal exists on either menu surface (`KES 750` and `KES 850`: 0 hits). `service_charges`
is not involved in menu pricing.

---

## K. PLAYWRIGHT RESULTS

| Test | Result | Detail |
|---|---|---|
| 1 - Restaurant read | **PASS** | 200, 5 cats, 11 items, 0 errors, 0 Lounge leak |
| 2 - Lounge read | **PASS** | 200, 1 cat, 2 items, 0 errors, 0 Restaurant leak |
| 3 - Admin Restaurant scope | **BLOCKED** | auth required, no credentials |
| 4 - Admin Lounge scope | **BLOCKED** | auth required |
| 5 - Edit existing record | **BLOCKED** | requires authenticated DB mutation; not attempted |
| 6 - Cross-scope safety | **BLOCKED** | source-verified only |
| 7 - Media | **PASS** (public) | 14/14 resolve; Admin picker **BLOCKED** |
| Runtime prerequisite | **RESOLVED** | root cause = Python dev server dropping parallel requests |

---

## L. DATABASE CHANGES

**NONE.** Read-only PostgREST only.

| Check | Result |
|---|---|
| `menu_items` total | 14 (unchanged) |
| Restaurant / Home / Lounge | 11 / 1 / 2 (unchanged) |
| NULL `media_id` | 0 |
| `Cocktail Selection` | 850.00, cat `236a42aa`, media `319e829a` (unchanged) |
| `Signature Cocktail` | 750.00, cat `236a42aa`, media `611ade4f` (unchanged) |
| Records created/deleted/modified | **0** |

---

## M. FILES CHANGED

| File | Change |
|---|---|
| `zt-lounge-admin/src/features/services/catalog-manager.tsx` | 1 string corrected (line 426) |

Created (documentation + scratch): `PUBLIC_MENU_UI_IMPLEMENTATION_REPORT.md`,
`PUBLIC_MENU_UI_IMPLEMENTATION_PROGRESS.md`, and scratch verification artifacts (`_srv.js`,
`_diag_net.js`, `_pubmenu.json`).

**Public application source: 0 changes. Schema/migrations: 0. Admin schema drift: untouched.**

---

## N. REGRESSION RESULTS

| System | Result |
|---|---|
| Hero | Untouched - no public file modified |
| Gallery | Untouched |
| Services | Untouched (changed string is menu-only; `isServiceCatalog` branch text unchanged) |
| Packages / Booking | Untouched |
| Membership | Untouched |
| Promotions | Untouched |
| Business/contact | Untouched |
| Media architecture | Untouched - still `media_id -> media_assets -> public_url` |
| Global page identity | Untouched |

`npx tsc --noEmit` -> **exit 0**.

Git: public branch/HEAD unchanged, dirty 265 -> 268. Admin branch/HEAD unchanged, dirty 814 -> 815.
No reset/clean/stash/checkout/rebase.

---

## O. REMAINING DECISION GATES

1. **The four missing Lounge offerings** - no canonical records exist; not invented.
2. **Lounge category is "Fast Foods"** - shown truthfully. A proper Lounge category would require
   `menu_categories.page_id`, which Rule 4 forbids.
3. **`Half-Day Package` collision** - a `menu_items` row on page `home` at 450 sharing a name with
   a `service_charges` row at 25 000. Documented, untouched.
4. **`is_featured`** - no public consumer.
5. **Admin runtime verification** - needs an authorized credential.
6. **Dev server** - the Python server still drops parallel requests; use a threading/Node server.

---

## P. FINAL STATUS

**PARTIALLY COMPLETE**

The required workflow is verified **end-to-end at runtime on the public side**: both surfaces
render exactly the right records under the same `page_id` contract the Admin UI writes, with
canonical price and media.

It is **not COMPLETE** because the Admin UI itself could not be exercised: authentication is
required and no credentials exist, so Tests 3-7 were not run. Creating users or bypassing auth was
explicitly out of bounds. Per the task's own rule, COMPLETE is not claimed without Playwright
verifying the required workflow.
- **0** invented items - the four previously reported offerings were not recreated