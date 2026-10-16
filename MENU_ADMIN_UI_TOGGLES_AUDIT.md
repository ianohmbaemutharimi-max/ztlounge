# MENU ADMIN UI + TOGGLES AUDIT

Read-only audit. Public repo `D:\zt lounge\zt-lounge-demo\zt-lounge`,
Admin repo `D:\zt lounge\zt-lounge-demo\zt-lounge-admin`.
Canonical CMS DB `jczwilrysvnhcjzjztbi`.

---

## 1. EXECUTIVE SUMMARY

The public menu architecture (scope by `menu_items.page_id`) is **correct and enforced in
the public repository**. The Admin UI **persists that same column correctly**, but
**does not expose it**: an administrator looking at the Menu screen sees every venue's
items mixed in one table with no venue column, no venue filter and no venue label.

Separately, **there is no menu visibility toggle anywhere** - not in the Admin UI, not in
the API, not in the database, not in the public loader. `website_pages` carries only
`service_cards_enabled` and `service_packages_enabled`, which gate **services** sections
only. Switching "the menu off" in Admin is therefore **not possible**, so the audit question
"if I switch the menu OFF does the public site stop showing it?" has a definitive answer:
**there is no control to switch**.

Authorization is **correct and verified black-box**: the Menu page redirects anonymous
visitors to login and every menu API returns `401`.

---

## 2. WORKTREE BASELINE

| Repo | Branch | HEAD | Dirty |
|---|---|---|---|
| Public `zt-lounge` | `feature/membership-tiers-staging-phase1` | `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c` | **257** |
| Admin `zt-lounge-admin` | `clean-rebuild` | `876b1851fbcd016cf290734498dda66b764afa12` | **809** |

Both worktrees were already heavily dirty. Nothing was cleaned, reset, stashed, restored,
checked out or rebased. Recorded at `2026-10-02T15:21:52+03:00`.

---

## 3. ADMIN MENU ROUTE

| Layer | Location |
|---|---|
| Route | `/dashboard/menu` |
| Page component | `src/app/dashboard/menu/page.tsx` |
| Editor component | `src/features/services/catalog-manager.tsx` (**shared** with Services) |
| API (collection) | `src/app/api/admin/[resource]/route.ts` |
| API (item) | `src/app/api/admin/[resource]/[id]/route.ts` |
| Resource map | `src/app/api/admin/resources.ts` |
| Data layer | `src/lib/repository.ts` (`Repository`, `sanitizePayload`, `WRITABLE_FIELDS`) |
| Validation | `src/lib/validation/admin.ts` |
| Media | `src/features/media/image-change-dialog.tsx` |
| Schema (types) | `src/db/schema.ts` |

`menu/page.tsx` renders `CatalogManager` with `itemResource="menu-items"`,
`categoryResource="menu-categories"`, `activeField="is_active"`, `showFeatured`.
`RESOURCE_MAP["menu-items"] = schema.menuItems`, `["menu-categories"] = schema.menuCategories`.

---

## 4. COMPONENT MAP - THE SHARED-COMPONENT PROBLEM

`CatalogManager` serves **both** Services and Menu, branching on:

```ts
const isServiceCatalog = cfg.itemResource === "services";   // :94
```

Every page-scoping behaviour is gated on that flag:

| Line | Expression | Effect on the **Menu** screen |
|---|---|---|
| `148` | `const selectedPageId = isServiceCatalog ? (pageId ?? "") : "";` | **always `""`** |
| `102-108` | list query adds `filter:page_id` only `if (isServiceCatalog && pageId)` | **no page filter** |
| `152-154` | `pageScopedItems = selectedPageId ? filter(...) : items.data` | **all items, unfiltered** |
| `155-157` | `scopedCats` filtered by scoped items | **all categories** |
| `171` | `pageContext = isServiceCatalog ? {...} : undefined` | **no ownership context** |
| `371` | `{isServiceCatalog && ( <page scope panel + toggles> )}` | **panel not rendered** |
| `538-544` | `<Field label="Page"><Select {...register("page_id")} disabled={isServiceCatalog}>` | **enabled** - venue assignable |
| `345` | "New Item" disabled only when `isServiceCatalog && !selectedPageId` | **enabled** |

Net effect: the Menu screen has a venue selector **only inside the create/edit modal**, and
nothing at all on the list.

---

## 5. API / REPOSITORY MAP

| Concern | Implementation | Verified |

---

## 6. DATABASE SCHEMA EVIDENCE (canonical, live)

| Table | Live columns |
|---|---|
| `menu_items` | `id, page_id, category_id, name, description, price, image_url, display_order, is_active, created_at, updated_at, slug, alt_text, category, type, is_featured, media_id` |
| `menu_categories` | `id, name, slug, description, display_order, is_active, created_at, updated_at` |
| `website_pages` | `id, page_key, title, subtitle, content, seo_title, seo_description, updated_by, created_at, updated_at, service_cards_enabled, service_packages_enabled` |

`menu_items` holds **14 active rows**: Restaurant **11** (`a3490e73`), Lounge **2**
(`2ba8a348`), Home **1** (`e5186de1`). All 14 have `media_id`; all 14 resolve in
`media_assets`.

**No menu-visibility column exists on any of the three tables.**

### Schema drift status (re-checked, not assumed)

| Drift | Still present? |
|---|---|
| Drizzle `menuCategories.pageId` vs live **absent** `page_id` | **YES - STILL DRIFTED** |
| Drizzle `menuItems` omitting `media_id` | **NO - RESOLVED.** `schema.ts` now declares `mediaId: uuid("media_id").references(() => mediaAssets.id, { onDelete: "set null" })` |

This corrects the premise in the task brief: the `media_id` half of the drift has since been
fixed. The remaining drift is **type-level only** - `Repository` executes through
`this.supabase.from(...)`, never the Drizzle query builder, so a phantom `page_id` on
`menuCategories` cannot break a runtime query today. Latent misdirection, not a live defect.

---

## 7. PAGE / VENUE SCOPING (Phase 3 answers)

**A. Human-readable venue selector?** **YES, but only in the item form.**
`catalog-manager.tsx:538-544` renders a `Page` `<Select>` whose options are
`/{page_key} - {title}` (e.g. `/restaurant - ZT Lounge Meru`). It is **not** rendered on the
list, and for Services it is `disabled` (page-first). For Menu it is **enabled** with a
`"Select a page..."` option that submits `null`.

---

## 8. TOGGLE INVENTORY (Phase 4)

Searched both repos for `menu_enabled`, `show_menu`, `menus_enabled`, `menu_visible`,
`menu_visibility`, `enable_menu`, `menuEnabled`, `menuVisible`, plus `menu_items`,
`menu_categories`, `service_cards_enabled`, `service_packages_enabled`, `website_pages`.

| Toggle | Where stored | Admin UI | API write | Public read | Actual effect | Class |
|---|---|---|---|---|---|---|
| **menu visibility** | **nowhere** | **absent** | **absent** | **absent** | **none** | **NOT PRESENT** |
| `service_cards_enabled` | `website_pages` | Services panel only (`:403-425`), gated `isServiceCatalog` | `api.update("website-pages", ...)` | `getPageSectionToggles()` -> `populateServiceCards()` | Hides the **services card grid** | REAL AND WIRED (services) |
| `service_packages_enabled` | `website_pages` | Services panel only | same | `getPageSectionToggles()` -> `populateServicePrices()` / `populateServiceCatalog()` | Hides the **pricing/package** section | REAL AND WIRED (services) |
| `menu_items.is_active` | `menu_items` | per-row Power button + Status badge | `api.update("menu-items", id, {is_active})` | `MenuRepository.getMenu()` `eq: is_active=true` | Removes the item from every public menu | REAL AND WIRED |
| `menu_items.is_featured` | `menu_items` | per-row Star (`showFeatured`) | `api.update(... {is_featured})` | none in the public menu path | **No public effect found** | DEAD/UNUSED |
| `menu_categories.is_active` | `menu_categories` | category Status badge | `api.update("menu-categories", ...)` | `getCategories()` -> `populateMenu()` re-filters `cat.is_active !== false` | Removes the whole category section | REAL AND WIRED |

**Both `website_pages` toggles are `= true` on all 9 pages** (verified live).

`is_featured` note: the public `getSignatureItems()` reads it, but **no public page calls
that method** (only `getMenu`, `getCategories`, `getMenuForSurface` are called). The Star
button currently changes data nothing displays.

---

## 9. TOGGLE END-TO-END TRACING (Phase 5)

**Question: "If I switch the menu OFF in Admin, does the public site stop displaying it?"**

**Answer: the question has no referent - there is no menu switch.** Verified by absence of
the concept in all four layers:

| Layer | Menu-visibility control |
|---|---|
| Admin UI | none (0 hits for any `menu_*enabled` pattern) |
| API route | none - `[resource]` is generic, no menu-specific branch |
| Database | none - no such column on `menu_items`, `menu_categories` or `website_pages` |
| Public loader | none - `populateMenu()` only branches on `#menu-container` presence and `is_active` |

The **only** end-to-end switches that gate a menu are per-record, and both are fully wired:

```
Admin Power button
  -> saveItem/toggleActive mutation -> api.update("menu-items", id, {is_active:false})
  -> PATCH /api/admin/menu-items -> Repository.update -> sanitizePayload
  -> menu_items.is_active = false
  -> public MenuRepository.getMenu(pageUuid) eq: is_active=true  -> row not returned
  -> populateMenu() renders one card fewer
```

```
Admin category Status toggle
  -> api.update("menu-categories", id, {is_active:false})
  -> menu_categories.is_active = false
  -> public getCategories() -> populateMenu() filter `cat.is_active !== false`
  -> whole category section disappears
```

Both chains were traced to source. Neither was exercised end-to-end at runtime, because
doing so requires writing to the database, which this task prohibits.

**What menu visibility *does* depend on today: the presence of `#menu-container` in the HTML.**
`populateMenu()` returns early if the element is absent (`:975`). That is a code-level mount
decision, not an editable control.

---

## 10. PAGE-LEVEL TOGGLES - RESTAURANT vs LOUNGE (Phase 6)

| | Restaurant | Lounge |
|---|---|---|
| page ID | `a3490e73-ef00-4063-8d25-dcdc2772ddb4` | `2ba8a348-42a9-4ab6-b4db-1eb1fb67748d` |
| page key | `restaurant` | `lounge` |
| menu configuration | none (no menu column) | none (no menu column) |

---

## 11. CRUD AUDIT (Phase 7)

### CREATE - supported
`openItem()` -> modal -> `itemSchema` validates `name` (min 2), `price` (>= 0),
`category_id` (required), `media_id` (UUID|null), `page_id` (UUID|null), `display_order`.
`saveItem` -> `api.create("menu-items", payload)` -> `POST /api/admin/menu-items` ->
`Repository.create`. **All fields the public site consumes are settable**, including
`page_id`. Venue is a free choice with **no default and no validation against the venue the
admin intends**.

### READ - supported, but unfiltered
The items query is `api.list(cfg.itemResource, { limit: 100 })` with **no `filter:page_id`**
for menu. The admin **cannot** see "Restaurant only", "Lounge only" or "Home only".
There is **no way to answer "show me the Lounge menu" from the Admin screen.**

### UPDATE - supported; venue preserved, venue changeable
`openItem()` seeds `page_id: row.page_id ?? defaultPageId`, so a plain edit preserves venue.
An admin **can** move an item between venues by changing the Page select - no warning, no
confirmation, no server-side check.

### DELETE - hard delete, unguarded
`removeItem` -> `api.remove("menu-items", id, pageContext)` with `pageContext === undefined`
-> `DELETE /api/admin/menu-items/[id]`. There is **no soft-delete column** and **no
cross-page guard**. The UI offers a plain Trash button with no venue-aware confirmation, so
an item belonging to another venue can be permanently deleted from a list that does not even
label it with a venue.

### CATEGORY CRUD - separate scope, no page linkage
Categories are managed in the same component's "Categories" tab against `menu_categories`.
`WRITABLE_FIELDS['menu_categories']` has **no `page_id`**, and the live table has none either.
**Categories are global and shared by every venue** - which is why the public Lounge menu
renders its two cocktails under a category named **"Fast Foods"**. Scoping a category to a
venue would require a schema change.

---

## 12. MEDIA AUDIT (Phase 8)

**The Admin menu media path is canonical and correct.**

| Step | Evidence |
|---|---|
| Schema | `media_id: z.string().uuid().nullable().optional()` with the comment *"Canonical media reference ONLY - no legacy image_url"* (`catalog-manager.tsx:42`) |
| Picker | `ImageChangeDialog` with `uploadCategory="menu"` (mapped from `RESOURCE_UPLOAD_CATEGORY["menu-items"]`) |
| On save | `onSave={async ({ media_id }) => itemForm.setValue("media_id", media_id)}` - **media_id only** |
| Inline image edit | `saveItem.mutateAsync({ ... media_id, page_id, ... })` - **no `image_url`** |
| Write allowlist | `WRITABLE_FIELDS['menu_items']` **excludes `image_url`** - not writable even by a crafted request |
| Read resolution | `MEDIA_RESOURCES` includes `menu-items` -> `resolveImageUrls()` supplies `resolved_image_url` |
| Upload category | `RESOURCE_UPLOAD_CATEGORY` maps `menu-items` -> `"menu"` (validated by `/api/admin/upload`) |

**No raw Supabase Storage URL, hardcoded image URL or raw UUID text field was found in the
menu editor.** The legacy `image_url` column exists live and in the Drizzle schema, but is
**not writable through the API and not exposed in the UI**. It is inert.

---

## 13. AUTHORIZATION AUDIT (Phase 12)

`menu-items` and `menu-categories` are in **neither** `SUPER_ADMIN_RESOURCES` nor
`CONTENT_RESOURCES`, so `getAuthWrapper()` returns **`withAdminAuth`** for both.

| Role array | Value |
|---|---|
| `ADMIN_ROLES` | `["super_admin", "admin"]` |

---

## 14. PLAYWRIGHT RESULTS (Phase 9)

Admin **is running** at `http://localhost:3000` (`/login` -> HTTP 200).

| Test | Result |
|---|---|
| Unauthenticated `/dashboard/menu` | **PASS** - redirected to login |
| Unauthenticated menu APIs | **PASS** - all 401 |
| Authenticated Menu UI (item list, venue column, venue filter, media picker, toggles) | **NOT TESTED - BLOCKED** |
| Category filtering in the UI | **NOT TESTED - BLOCKED** |
| Any mutation test | **NOT ATTEMPTED - would require a DB write** |

**Blocker:** reaching the authenticated Menu UI requires valid `super_admin`/`admin`
credentials. I have none, and creating an account or seeding credentials is outside this
read-only task. The UI findings in sections 7 and 11 are therefore **white-box
source-verified**, not black-box observed. Authentication bypass was not attempted.

---

## 15. PUBLIC CROSS-CHECK (Phase 10)

**RUNTIME BLOCKED this session.** One attempt per page; both hit the known dev-server asset
failure (`restaurant-menu` 30 and `lounge` 26 `ERR_CONNECTION_REFUSED` on repository JS), so
no DOM was produced. This is the same prerequisite that already failed twice in the
immediately preceding task, so per the stop rule it was not retried.

| Source | Result |
|---|---|
| **DB level (this session)** | the exact public query `is_active=eq.true&page_id=eq.<uuid>` returns **11 / 2 / 1** for restaurant / lounge / home, with no cross-venue rows |
| **Runtime (previous task, same HEAD + same changes)** | `lounge.html` rendered exactly **2** cards - `Signature Cocktail` KES 750, `Cocktail Selection` KES 850 - images from `menu-images/` via `media_id` |

---

## 16. FINDINGS CLASSIFIED

| ID | Finding | Class |
|---|---|---|
| M-1 | Menu UI does **not** display or filter by venue: `selectedPageId` is forced to `""` for menu, so all venues appear in one unlabelled table | **B - UI defect** |
| M-2 | No venue column in the items table (`showMenuColumn` is services-only), so an admin cannot tell which venue an item belongs to | **B - UI defect** |
| M-3 | No server-side ownership context for menu mutations (`pageContext === undefined`); the comment "Menu items are NOT page-scoped" is now **stale** - the public site **is** page-scoped | **C - Workflow defect** |
| M-4 | A menu item can be created with `page_id = null` (placeholder option is offered for menu), making it invisible on every public menu page | **C - Workflow defect** |
| M-5 | Cross-venue move and cross-venue hard delete are possible with no guard or confirmation | **C - Workflow defect** |
| M-6 | `openItem()` defaults menu venue from `page_key === "menu"`, a page that **does not exist** - dead default logic | **C - Workflow defect** |
| M-7 | No menu-visibility toggle exists in UI / API / DB / public loader | **E - Missing capability** |
| M-8 | `menu_categories` cannot be venue-scoped (no column), so the Lounge menu renders cocktails under "Fast Foods" | **E - Missing capability** |
| M-9 | `menu_items.is_featured` is editable in Admin but read by no public consumer (`getSignatureItems()` is never called) | **B - UI defect** (data with no effect) |
| M-10 | Drizzle declares `menu_categories.page_id`; the live column does not exist (type-level only) | **D - Data/schema drift** |
| M-11 | Whether the Lounge menu should appear at all on the Lounge page is a product question no control expresses | **F - Decision required** |
| M-12 | Admin authorization, `page_id` persistence, `media_id`-only media handling, partial-update safety | **A - Correct** |
| M-13 | `menu_items.media_id` Drizzle drift | **RESOLVED** (no longer a finding) |

---

## 17. EXACT DEFECTS REQUIRING FIXES

1. **M-1 / M-2** - surface venue in the Admin menu list: a `Page` column and a page-scope
   filter for `menu-items`, mirroring the existing services behaviour.
2. **M-3** - send `pageContext` for menu mutations so the server can reject foreign-venue
   updates/deletes, and correct the stale code comment.
3. **M-4** - disallow `page_id = null` on create (or warn explicitly), since a null-scoped
   item can never appear publicly.
4. **M-5** - venue-aware confirmation before delete.
5. **M-6** - remove or correct the dead `page_key === "menu"` default.
6. **M-9** - either wire `is_featured` to a public consumer or remove the Star from the menu
   editor so it stops implying an effect that does not exist.
7. **M-10** - reconcile `menuCategories` in `schema.ts` (documentation only; no migration).

---

## 18. EXACT BUSINESS DECISIONS REQUIRED

1. **Should a menu be switchable at all?** A toggle requires a new column
   (`website_pages.menu_enabled` or equivalent) - a schema change this audit cannot assume.
2. **Should categories be venue-scoped?** `menu_categories.page_id` is the only way; today
   the Lounge inherits "Fast Foods".
3. **Should `page_id = null` be legal?** It currently means "belongs to no menu" = invisible.
4. **Should `is_featured` do anything on the public menu?** (Signature/featured strip?)

---

## 19. RUNTIME BLOCKERS

| Blocker | Detail |
|---|---|
| Admin authenticated UI | Requires `super_admin`/`admin` credentials; none available; creating them is out of scope. UI findings are source-verified only |
| Public menu DOM | Dev server refused repository JS on both pages (30 / 26 `ERR_CONNECTION_REFUSED`); same prerequisite already failed twice previously, so not retried. Restaurant scoping proven at DB level |
| Toggle end-to-end | Exercising a toggle requires a DB write, which this task prohibits. Both chains traced statically |

---

## 20. RECOMMENDED NEXT SURGICAL TASK

**Add venue scoping to the Admin menu screen only** - a `Page` column plus a page-scope
filter for `menu-items`, and pass `pageContext` on menu mutations so foreign-venue
update/delete is rejected server-side. No schema change, no new toggle, no change to the
public pipeline, no change to global page identity.

---

## 21. FILES INSPECTED

**Public:** `assets/js/repositories/MenuRepository.js`, `content-loader.js`,
`lib/page-identity.js`, `lib/PageResolver.js`, `lib/BaseRepository.js`,
`background-media-warmer.js`, `menu.config.js`, `pages/experiences/lounge.html`,
`pages/experiences/restaurant-menu.html`, `pages/experiences/restaurant.html`

**Admin:** `src/app/dashboard/menu/page.tsx`, `src/features/services/catalog-manager.tsx`,
`src/features/media/image-change-dialog.tsx`, `src/app/api/admin/[resource]/route.ts`,
`src/app/api/admin/[resource]/[id]/route.ts`, `src/app/api/admin/resources.ts`,
`src/lib/repository.ts`, `src/lib/validation/admin.ts`, `src/lib/auth/server.ts`,
`src/lib/resource-config.ts`, `src/db/schema.ts`, `playwright.config.ts`

## 22. FILES CHANGED

**NONE.**

No application source, schema, migration or database content was modified in either
repository. The only additions are audit artifacts created in the public repo root for
evidence capture, disclosed here:

`_admin_menu_probe.js`, `_admin_probe.json`, `_public_crosscheck.js`, `_crosscheck.json`

All four are throwaway probe scripts; no application file was touched.
| `menu_items.page_id` distribution | 11 / 2 / 1, unchanged |

The filename still does **not** determine scope, and `page-identity.js` remains untouched
(`PAGE_TO_PAGE_KEY['restaurant-menu']` is still `'restaurant-menu'`).
| `CONTENT_MANAGER_ROLES` | `["super_admin", "admin"]` (identical) |
| `EMPLOYEE_ROLES` | `["super_admin", "admin"]` (identical) |

All three arrays are the same, so for menus there is effectively **one permission tier**:
`super_admin` or `admin` for read, create, update, delete, category management and
`website_pages` toggles. There is **no separate content-manager, manager or employee tier**
capable of menu access.

**Verified black-box** (anonymous, no credentials):

| Probe | Result |
|---|---|
| `GET /login` | 200 |
| `GET /dashboard` | -> `/login?redirect=%2Fdashboard` |
| `GET /dashboard/menu` | -> `/login?redirect=%2Fdashboard%2Fmenu` |
| `GET /dashboard/services` | -> `/login?redirect=%2Fdashboard%2Fservices` |
| `GET /api/admin/menu-items` | **401** `{"error":"Unauthorized"}` |
| `GET /api/admin/menu-categories` | **401** `{"error":"Unauthorized"}` |
| `GET /api/admin/website-pages` | **401** `{"error":"Unauthorized"}` |

Authorization is sound. No role was changed.
| menu toggle | **none** | **none** |
| public consumer | `restaurant-menu.html` -> `populateMenu()` via `getMenuForSurface('restaurant-menu')` -> menu page `restaurant` | `lounge.html` -> `populateMenu()` via `getMenuForSurface('lounge')` |
| active menu items | **11** | **2** |

The two venues are **structurally identical**: same pipeline, same component, same
repository, no per-venue configuration of any kind.
**B. Raw UUIDs exposed?** **NO.** The `<option value>` carries the UUID, but the visible
label is always `/{page_key} - {title}`. No UUID is rendered as text.

**C. Is `menu_items.page_id` persisted?** **YES.** Proof chain: `itemForm` (`page_id`,
validated UUID-or-null, `:49-52`) -> `saveItem` payload (`:175`) -> `api.create/update` ->
`PATCH/POST /api/admin/menu-items` -> `Repository.create/update` -> `sanitizePayload`
(allowlist includes `page_id`, `:116`) -> PostgREST. `openItem()` (`:242`) pre-populates
`page_id: row.page_id ?? defaultPageId` so an edit does not blank it, and the inline
image-edit path (`:639`) re-sends `page_id`.

**D. Can an admin accidentally create a Restaurant item under Lounge?** **YES.**
For menu items `selectedPageId` is always `""`, `pageContext` is `undefined`, and the Page
select is a free choice including `null`. There is **no default and no guard**.
`openItem()` looks for a page with `page_key === "menu"` (`:236-238`) as a default - **no such
page exists** (`website_pages` keys are home, restaurant, lounge, vip, events, conference,
gallery, contact, grooming-care), so the default is always `undefined` and the item is created
with whatever the admin picks, or `null` if left blank. A `null` `page_id` item is **invisible
on every public menu page**.

**E. Can an admin accidentally edit another venue's item?** **YES.** The list is unfiltered
(`:152-154`), so Restaurant, Lounge and Home items are all listed together with no venue
column. Any can be opened, edited or deleted. `pageContext` is `undefined` for menu, so unlike
Services there is **no server-side ownership re-check**. The code comment at `:169-170` says so
explicitly: *"Menu items are NOT page-scoped and keep the unscoped contract."* That contract
is now **stale** - the public site **is** page-scoped.

**F. Does the UI filter by `page_id` before display?** **NO.** Proven by `:148`
(`selectedPageId` forced to `""`) and `:152-154` (the filter branch is unreachable for menu).
|---|---|---|
| Read | `Repository.list()` -> `this.supabase.from(table).select(...)` | PostgREST, **not** Drizzle |
| Create | `Repository.create()` -> `.insert(sanitized)` | `sanitizePayload` allowlist applies |
| Update | `Repository.update()` -> `sanitizePayload(...)` then update | **partial** (Supabase `.update`) |
| Delete | `Repository.delete()` -> delete by id | **hard delete**, no soft-delete column |
| Allowlist | `WRITABLE_FIELDS['menu_items']` = `page_id, category_id, name, description, price, media_id, display_order, is_active, slug, alt_text, category, type, is_featured` | `page_id` **is** writable; `image_url` is **not** |
| Allowlist | `WRITABLE_FIELDS['menu_categories']` = `name, slug, description, display_order, is_active` | no `page_id` |
| ID validation | `validateRecordId()` accepts a UUID **or** digits | menu UUIDs pass |
| Media resolve | `MEDIA_RESOURCES` includes `menu-items` -> `resolveImageUrls()` | `resolved_image_url` for the thumbnail |

Because `sanitizePayload` filters keys and Supabase `.update()` is partial, the inline
toggles that send only `{is_active}` / `{is_featured}` **cannot wipe `page_id`** - verified
by source.