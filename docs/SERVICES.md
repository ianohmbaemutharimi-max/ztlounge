# Services Mini-System (Verified 2026-10-18)

## Declared contract (`assets/js/repositories/ServicesRepository.js` header)

- `ServicesRepository.getByPage(pageId)`
- `ServicesRepository.getServices()`
- `ServicesRepository.getExperiences(pageId)`
- `ServicesRepository.getFeatures(pageId)`
- Data source: Supabase `services` table with local config fallback.

## Actual implementation

Exports (verified): the four above **plus** `getAll()`, `getPackages()`,
`getByCategory(categorySlug)` — **undeclared in the header (drift)**.

| Method | Behavior (verified) |
|--------|---------------------|
| `getByPage(pageId)` | Accepts UUID or page key (resolves via `PageResolver.requirePageUuid`); queries `services` where `page_id = uuid AND is_active = true`, ordered by `display_order`; splits into `{services, experiences, features}` by `type`; falls back to `window.ServicesConfig[pageId]` |
| `getExperiences/getFeatures` | Thin wrappers over `getByPage` |
| `getAll()` | All active services, no page filter |
| `getPackages()` | `type = 'packages'` active rows |
| `getByCategory(slug)` | Resolves slug → id via `service_categories` (active only), then `services` where `category_id = id AND is_active AND type='service'`; **no page filter** (content-loader re-filters by page UUID) |
| `mapToUI()` | Passes through `image_url`, `alt_text`, `tag`, `href`, `icon`, `category_id`… |

## Data (production, anon-verified)

- **`services`: 45 rows** (audit snapshot saw 16 across 7 page_ids; catalog
  expanded during 2026-10-18). Mixed `type` values (`service`, `experience`,
  `informational`) — only **5 active `type='service'` rows**, all on page
  `grooming-care`: barbershop × 3 (Beard Trim & Shape, Haircut & Beard
  Grooming, Classic Haircut), auto-spa × 2 (Auto Spa, Grooming and Care).
- **`media_id` and `image_url` columns both exist live** (the earlier "neither
  column exists" reading came from an endpoint-instability window). All 5
  service rows carry `media_id`; `image_url` is set on only 1 of them.
  `mapToUI()` still passes `image_url` through and does **not** map
  `media_id`, so service cards are not yet on the MediaResolver gateway.
- **`service_categories`: 8 active rows seeded** (auto-spa, barbershop,
  carpet-cleaning, conference, events, lounge-bar, restaurant, vip-cabins) —
  `057_seed_service_categories.sql` content is live; category grids no longer
  hit the empty-state placeholder.
- **`service_charges`: 8 package-price rows** (restaurant 3, vip 3, events 2),
  anon-readable; no media columns.

## Rendering path

`content-loader.js`:
1. `populateServiceCards()` — legacy `.service-cards-grid` path.
2. `populateServiceCardsByCategory(pageId)` — discovers `[data-category-grid]`
   containers, calls `getByCategory(slug)` per category, filters by page UUID,
   toggles `[data-category-empty]` visibility.
3. `populatePackages()` — package pricing cards.
All three are **gated by PageResolver toggles** (`service_cards_enabled`,
`service_packages_enabled` from migration `043`) and **fail open** (DB error /
missing record / missing resolver ⇒ sections still render).

## Admin

Full CRUD for `services` / `service_charges` / `service_categories` (admin
resources list; elevated via `POSTGRES_MAGIC` cookie).

## Contract verdict

| Item | Status |
|------|--------|
| Declared 4 methods exist | ✅ |
| Header lists all exports | ❌ 3 undeclared (`getAll`, `getPackages`, `getByCategory`) |
| DB-backed with static fallback | ✅ |
| Page gating via `page_id` UUID | ✅ |
| Category pipeline (`057`) | ✅ 8 categories seeded; 5 categorized service rows live on grooming-care (grids render) |
| Media contract | ⚠️ `media_id` live on all service rows but unmapped by `mapToUI`; `image_url` set on only 1/45 |

## Known debris

- `assets/js/legacy/` — legacy copies; canonical repo lives in `repositories/`.
