# PUBLIC MENU AUDIT PROGRESS LOG

Read-only audit. Append-only. Historical claims are never silently overwritten.

## Entry 1 - Baseline (2026-10-02T13:50:57+03:00)

| Field | Value |
|---|---|
| Branch | `feature/membership-tiers-staging-phase1` |
| HEAD | `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c` (40 chars, unchanged) |
| Dirty worktree at start | **243** entries |
| Canonical DB | `jczwilrysvnhcjzjztbi` |
| Mode | READ-ONLY - no source, DB, config, or git mutation |

**Note on the task prompt HEAD.** The prompt recorded `905bd7a1c87a06fbfe6a6fc90d15c3e2769850c`,
which is **39 characters** - a SHA-1 is 40. The real repository HEAD is
`905bd7a11c87a06fbfe6a6fc90d15c3e2769850c` (an extra `1` at position 10). The
repository HEAD is **unchanged** from the baseline recorded in the previous task; the
prompt string was a transcription typo. Not a repo change.

**Note on dirty count.** 243 = 238 pre-existing + 5 files created by the *previous*
read-only audit task. Those 5 are preserved untouched.

---

## Entry 2 - Source architecture (2026-10-02)

| Operation | Evidence | Conclusion |
|---|---|---|
| Read `MenuRepository.js` (207 lines) | `getCategories()`, `getSignatureItems()`, `getItemsByCategory()`, `getMenu()` | **No method accepts or filters by page/scope.** `getMenu()` fetches ALL active items then groups by `category_id` only |
| Read `menu.config.js` | 10 fallback categories, `signatureCollection: []`, `fullMenu: {}` | Fallback mirrors DB category names; contains **no Lounge/Bar category** |
| Read `content-loader.populateMenu()` (968-1067) | Requires `#menu-container`; builds nav + category sections from `menuData.categories` | Renders whatever `getMenu()` returns - **no page filtering at this layer either** |
| Read `populateMenuPrices()` (1432-1456) | Fills `[data-menu-name]` by exact item name match | Name-keyed, page-agnostic |
| Read `populateServicePrices()` (1353-1363) | `if (chargePlaceholders.length === 0) return;` **precedes** `populateMenuPrices()` | **Latent defect**: menu prices only render on pages that also have `[data-charge-name]` |
| Located mounts | `restaurant-menu.html:465` `#menu-nav-container`, `:470` `#menu-container`; `restaurant.html:743,753,763` `[data-menu-name]` | `lounge.html` has **zero** menu mounts |

---

## Entry 3 - Database audit, canonical `jczwilrysvnhcjzjztbi` (2026-10-02)

Read-only PostgREST (`/rest/v1`, anon key). **No writes.** CLI `--linked` deliberately
not used (it resolves staging `jczavwuaiywnhpfigvlw`).

| Object | Result |
|---|---|
| `menu_categories` | **10 rows**. Columns: `id, name, slug, description, display_order, is_active, created_at, updated_at`. **No `page_id`, no scope, no menu_type.** All `is_active=true`, orders 1-10 |
| `menu_items` | **14 rows**. Columns: `id, page_id, category_id, name, description, price, image_url, display_order, is_active, created_at, updated_at, slug, alt_text, category, type, is_featured, media_id` |
| `page_id` distribution | restaurant `a3490e73` = **11**, lounge `2ba8a348` = **2**, home `e5186de1` = **1** |
| Active state | all 14 `is_active=true`, all `type='item'` |
| Media | all 14 have `media_id`; **all 14 resolve** to a `media_assets` row |
| Relationship | `menu_items.category_id` -> `menu_categories.id` (admin schema declares `onDelete: "set null"`). No junction table |

**Key evidence:** `menu_items.page_id` EXISTS and IS POPULATED with real `website_pages.id`
values. This is a working page-association mechanism at the data layer.

---

## Entry 4 - RETRACTED / CORRECTED PRIOR CLAIM (2026-10-02)

**RETRACTED (in part).** `PUBLIC_CANONICAL_DATA_CLEANUP_PROGRESS.md` entry #2 and
`PUBLIC_CANONICAL_DATA_CLEANUP_REPORT.md` E-1 stated:

> "E-1 Lounge prices: `menu_items` Bar Menu contains only Cocktail Selection (850) +
> Signature Cocktail (750). No row for any of the four lounge offerings."

**Correction.** Two separate claims were conflated:

1. **STILL TRUE:** there is no `menu_items` row matching any of the four Lounge HTML
   offerings (House Signature Collection, Premium Whiskey Selection, Vintage Wine
   Cellar, Artisanal Mocktails). Verified against all 14 rows.
2. **MISLEADING:** the report described those rows as living in a **"Bar Menu" category**.
   The live data shows they belong to category `236a42aa...`, which is named
   **"Fast Foods"**. There is **no "Bar Menu" category in the database at all**.
3. **NEW, NOT PREVIOUSLY RECORDED:** those 2 rows carry `page_id = 2ba8a348 = lounge`.
   The separation mechanism was already present in the data and was missed because the
   report described the rows by an incorrect category name.

---

## Entry 5 - Admin audit (2026-10-02)

| Operation | Evidence | Conclusion |
|---|---|---|
| Located admin menu resources | `resource-config.ts` keys `menu-items`, `menu-categories`; generic CMS at `features/cms/website-cms.tsx` | Admin writes the **same canonical tables** |
| `repository.ts:60,96` | `menu_items` field list **includes `page_id` and `media_id`** | Admin column list matches live DB |
| `db/schema.ts` `menuItems` | Declares `pageId`; **does NOT declare `mediaId`** | Drift: omits a live column |
| `db/schema.ts` `menuCategories` | Declares `pageId: uuid("page_id")` | **Drift: this column does NOT exist on the live table** |
| `validation/admin.ts:99` | `"menu-items": [..., "page_id"]` | Page association is an indexed/validated field |

---

## Entry 6 - Runtime verification (2026-10-02) - STOPPED

| Attempt | Result |
|---|---|
| Run 1 | HTTP 200 x3. `restaurant-menu` 29 conn-refused errors, 0 categories rendered. `restaurant` 9. `lounge` 12 + 7 cascade. `lounge` **4 `.cocktail-item` blocks rendered** (static HTML). |
| Run 2 | HTTP 200 x3. `restaurant-menu` 30 conn-refused, 0 categories. `restaurant` 3. `lounge` 30 conn-refused. |
| Decision | **STOPPED** - same prerequisite (`ERR_CONNECTION_REFUSED` on repository JS) failed twice, per the 2-failure rule |

**Restaurant DB-driven menu rendering = NOT VERIFIED at runtime.** No runtime PASS claimed.
The Lounge static cocktail block was observed in both runs because it is plain HTML.

---

## Entry 7 - Deliverables written (2026-10-02)

| File | Purpose |
|---|---|
| `PUBLIC_MENU_AUDIT_PROGRESS.md` | This log |
| `PUBLIC_MENU_CANONICAL_ROUTE_MAP.md` | Required route map |
| `PUBLIC_MENU_AUDIT_REPORT.md` | Required audit report |
| `_menu_audit_probe.js` | Read-only Playwright observation script |
| `_menu_probe.json`, `_menu_probe2.json` | Raw runtime captures |

No application source file was created or modified by this audit.