# PUBLIC MENU UI IMPLEMENTATION PROGRESS

Append-only log. Public repo `zt-lounge` @ `905bd7a11c87a06...` (dirty 265 at start).
Admin repo `zt-lounge-admin` @ `876b1851fbcd016c...` (dirty 814 at start).

---

## Entry 1 - 2026-10-02T23:40:39+03:00 - BASELINE

- Public branch/HEAD: `feature/membership-tiers-staging-phase1` / `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c`, dirty 265
- Admin branch/HEAD: `clean-rebuild` / `876b1851fbcd016cf290734498dda66b764afa12`, dirty 814
- Admin dev server already running on :3000. Public site served by a Python server on :8000 (PID 21008).
- DB target confirmed as canonical `jczwilrysvnhcjzjztbi`.

---

## Entry 2 - 2026-10-02T23:45 - RUNTIME BLOCKER DIAGNOSED (task requirement 14)

The previous audit could not verify the public menu because repository JavaScript failed with
`ERR_CONNECTION_REFUSED`. Task 14 required diagnosing this before concluding anything.

Findings:

- All 13 loader-chain files exist on disk and return HTTP 200 when fetched directly
  (`supabase-js.js`, `env.js`, `supabase.config.js`, `asset-url.js`, `supabase.js`,
  `page-identity.js`, `cms-report.js`, `PageResolver.js`, `MediaResolver.js`,
  `BaseRepository.js`, `business-config.js`, `MenuRepository.js`, `content-loader.js`).
- Playwright network trace showed the **same** set failing every run, always from the point
  where `shared-components.js` injects the loader chain in parallel:
  `logo.webp`, `page-identity.js`, `cms-report.js`, `PageResolver.js`, `MediaResolver.js`,
  `BaseRepository.js`, `business-config.js` ... ~28-31 refusals.
- **Conclusion: NOT an application defect.** The Python `http.server` serving the site drops
  a parallel request burst. Confirmed by running the identical site under a Node static
  server on :8021: same HTML, same JS -> `MenuRepository` loaded, 0 refused requests.

No application file was changed to achieve this.

---

## Entry 3 - 2026-10-02T23:52 - PUBLIC PLAYWRIGHT VERIFICATION (READ-ONLY)

| Surface | HTTP | data-page | Categories | Items | Empty cat blocks | Lounge leak | Missing media | Non-storage img | Console errors | Failed requests |
|---|---|---|---|---|---|---|---|---|---|---|
| `restaurant-menu.html` | 200 | `restaurant-menu` | 5 | 11 | 0 | 0 | 0 | 0 | 0 | 0 |
| `lounge.html` | 200 | `lounge` | 1 | 2 | 0 | n/a (expected) | 0 | 0 | 0 | 0 |

Restaurant rendered: Fresh Juice 450, Signature Nyama Choma 1800, ZT Signature Pilau 650,
Premium Beef Steak 1650, Mixed Grill Platter 1650, Grilled Chicken 1200, Premium Sides 450,
Goat Ribs 1500, Coffee 250, Loaded Fries 850, Chicken Tikka 650.

Lounge rendered: Signature Cocktail 750, Cocktail Selection 850 (category "Fast Foods").

**No cross-venue leakage. Every image resolved through a Storage `public_url`.**

---

## Entry 4 - 2026-10-02T23:56 - ADMIN AUDIT (SOURCE) + FINDING

Source audit of `CatalogManager` confirmed the required Admin workflow already exists:
human-readable page selector `/{page_key} — {title}`, server-side `filter:page_id`, page
required before loading, create requires `page_id`, edit preserves `page_id` (Page field
disabled), delete carries page context with a venue-labelled confirm, and
`assertPageOwnership` + `assertPageAssignment` on PATCH/DELETE.

**Defect found (UI accuracy, Rule 6):** the scope hint read
`"Menu items and categories are scoped through menu_items.page_id."`
`menu_categories` has **no** page/scope column, so the statement was factually wrong and
implied categories are venue-specific. Corrected to state that items are scoped via
`menu_items.page_id` and that categories are global and shared.

---

## Entry 5 - 2026-10-02T23:58 - ADMIN RUNTIME BLOCKED

`/dashboard/menu` -> HTTP 307 (auth redirect). `/api/admin/menu-items?page_id=...` -> HTTP 401.
No `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`TEST_*` environment variables, no `.env.local` credential
values usable for login, and no Playwright `storageState` fixture exists in the repo.

Per the task rules I did **not** create users, seed credentials, or bypass authentication.
Admin scope behaviour (Tests 3-7) is therefore **BLOCKED on runtime** and verified by source
only. This blocks any DB-mutation round-trip test.

---

## Entry 6 - 2026-10-02T23:59 - STATIC + DB VERIFICATION

- `npx tsc --noEmit` -> **exit 0**.
- Hardcoded menu prices (`KES 750`, `KES 850`) on menu surfaces: **0 occurrences**.
- Hardcoded menu item names (`Grilled Chicken`, `Goat Ribs`, `Cocktail Selection`): **0**.
- `Signature Cocktail` 9 hits - all SEO/editorial copy ("Signature Cocktails & VIP
  Nightlife", section heading). Classified STATIC_PRESENTATION, not menu record data.
- Exactly one menu repository (`assets/js/repositories/MenuRepository.js`) plus `menu.config.js`
  and `menu-nav.js`. No second renderer, no static menu data store.
- DB read-only re-check: `menu_items` = 14 (restaurant 11 / home 1 / lounge 2), 0 NULL `media_id`,
  Lounge rows unchanged (`Cocktail Selection` 850 cat `236a42aa` media `319e829a`;
  `Signature Cocktail` 750 cat `236a42aa` media `611ade4f`).