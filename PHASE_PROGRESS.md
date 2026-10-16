# PHASE PROGRESS LOG

Append-only. Historical entries are never overwritten.

## Entry 1 - Menu Admin UI + Toggles Audit (2026-10-02T15:21:52+03:00)

**Mode:** READ-ONLY. No application source, schema, migration or DB content changed.

| Repo | Branch | HEAD | Dirty (start) |
|---|---|---|---|
| Public `zt-lounge` | `feature/membership-tiers-staging-phase1` | `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c` | 257 |
| Admin `zt-lounge-admin` | `clean-rebuild` | `876b1851fbcd016cf290734498dda66b764afa12` | 809 |

| Phase | Result |
|---|---|
| Baseline | Both worktrees already dirty; preserved untouched |
| Admin menu UI | Found at `/dashboard/menu` -> `menu/page.tsx` -> shared `CatalogManager` |
| Venue scoping | `isServiceCatalog` gates every page-scoping branch; for `menu-items` it is false, so `selectedPageId` is `""`, the list is unfiltered, and `pageContext` is `undefined` |
| `page_id` persistence | **WORKS.** form -> api -> sanitizePayload allowlist -> PostgREST; edit seeds existing `page_id` |
| Media | **WORKS.** `media_id` only; `image_url` not writable; `ImageChangeDialog` reused; upload category `menu` |
| Toggles | **No menu-visibility toggle exists** in UI, API, DB or public loader. `service_cards_enabled` / `service_packages_enabled` are services-only |
| Live schema | `menu_items` has `page_id` + `media_id`; `menu_categories` has **no** `page_id`; `website_pages` has only the two services toggles |
| Drift re-check | `menu_categories.pageId` drift **PERSISTS**; `menu_items.mediaId` drift is **RESOLVED** (schema.ts now declares it) |
| Authorization | `withAdminAuth` for both menu resources; `ADMIN_ROLES = [super_admin, admin]`; all three role arrays identical |
| Black-box (anon) | `/dashboard/menu` -> login redirect; all menu APIs -> **401**. **PASS** |
| Black-box (authenticated) | **BLOCKED** - no credentials available; UI findings are source-verified only |
| Public cross-check | **RUNTIME BLOCKED** - dev server refused repository JS (30 / 26 `ERR_CONNECTION_REFUSED`); not retried per stop rule. DB-level query returns 11 / 2 / 1 |
| Deliverable | `MENU_ADMIN_UI_TOGGLES_AUDIT.md` |
| Files changed | **NONE** (4 throwaway probe artifacts created and disclosed) |

**Net conclusion:** the public page-ID architecture is intact and correctly persisted by
Admin, but Admin does not *expose* venue on the menu screen, and there is no menu
visibility control anywhere. 13 findings classified A-F. 7 defects and 4 business decisions
carried forward. No fixes implemented.