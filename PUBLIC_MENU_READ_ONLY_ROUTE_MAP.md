# PUBLIC MENU READ-ONLY ROUTE MAP

Read-only audit. Public repo `zt-lounge` @ `905bd7a11c87a06...`, Admin repo @ `876b1851...`.
Canonical DB `jczwilrysvnhcjzjztbi`, read-only PostgREST.

DB identifiers used below (exact, from live rows):
`restaurant` = `a3490e73-ef00-4063-8d25-dcdc2772ddb4` (11 items) ·
`lounge` = `2ba8a348-42a9-4ab6-b4db-1eb1fb67748d` (2 items) ·
`home` = `e5186de1-a199-476f-abe2-a3f8b21c6120` (1 item).
Category `Fast Foods` = `236a42aa-9559-4a69-ad48-c2ef22bdf5bb`.

## Field-level route map

| Field | Restaurant source | Lounge source | Repository | Loader | DOM consumer | Hardcoded copy | Classification |
|---|---|---|---|---|---|---|---|
| **Item name** | `menu_items.name` where `page_id=a3490e73` (11 rows) | `menu_items.name` where `page_id=2ba8a348` (2 rows: `Signature Cocktail`, `Cocktail Selection`) | `MenuRepository.mapItemToUI()` `:29-47` | `populateMenu()` `content-loader.js:968` → `getMenuForSurface(getPageId())` `:975` | `#menu-container .menu-item-card h3` | **none** on either page | **CANONICAL** (both) |
| **Description** | `menu_items.description` (populated on all 11) | `menu_items.description` (`House signature cocktail`, `Premium cocktail selection`) | `mapItemToUI()` `:34` | `populateMenu()` `:1038-1042` | `.menu-item-card p` | **none** | **CANONICAL** (both) |
| **Price** | `menu_items.price` (250–1800) | `menu_items.price` (750, 850) | `mapItemToUI()` `:35` | `populateMenu()` `:1046-1051` `"KES " + Number(price).toLocaleString()` | `.price-tag` | **none** (the 4 former literals are gone) | **CANONICAL** (both) |
| **Category** | `menu_items.category_id` → `menu_categories` (Choma Zone, Main Dishes, Quick Bites & Snack, Specialty Dishes, Hot Beverages and Breakfast) | both Lounge items sit in `236a42aa` **"Fast Foods"** — no Lounge category exists | `mapItemToUI()` `:43`; grouping in `withoutEmptyCategories()` `:174` | `populateMenu()` `:993-1010` | `.menu-category-title`, `#menu-nav-container a` | **none** | **CANONICAL** for grouping; **ARCHITECTURAL_GAP** — categories cannot express venue scope |
| **Image/media** | `menu_items.media_id` → `media_assets.public_url` (11/11 resolve) | `media_id` → `public_url` (2/2 resolve, `menu-images/`) | `resolveMedia()` `:53` via `MediaResolver.resolveCollection()` | `populateMenu()` `:1026-1028` `AssetUrl.resolve(item.image_url)` | `.menu-item-image` | **none** | **CANONICAL** (both) |
| **Active status** | `menu_items.is_active` (11 true) + `menu_categories.is_active` | `is_active` (2 true) | `getMenu()` `:265-267` `eq is_active=true`; `getCategories()` | `populateMenu()` re-filters `cat.is_active !== false` `:977-979` | row presence | none | **CANONICAL** (both) |
| **Ordering** | `menu_categories.display_order` ASC, `menu_items.display_order` ASC | same, within the Lounge scope | `getMenu()` `orderBy display_order ASC` | array order → DOM order | `.menu-category` sequence | none | **CANONICAL** (both) |
| **Menu scope** | `menu_items.page_id = a3490e73` | `menu_items.page_id = 2ba8a348` | `getMenu(pageUuid)` `:267` `eq page_id`; `getMenuForSurface()` `:287`; `MENU_PAGE_KEY_BY_SURFACE` `:142` maps surface PageId to menu page_key; UUID resolved via existing `PageResolver` `:160` | `getPageId()` → `getMenuForSurface()` | both mount the same `#menu-container` | none | **CANONICAL** (both) — **Model B, page/scope-based** |
| **Surface identity** | `restaurant-menu.html` declares `data-page="restaurant-menu"`, mapped to menu page_key `restaurant` at `MenuRepository:142` | `lounge.html` declares `data-page="lounge"` → `lounge` | same | same | same | none | **CANONICAL** — menu-layer mapping only; global `PageIdentity` untouched |
| **Former Lounge offerings** | n/a | **No canonical record exists** for `House Signature Collection`, `Premium Whiskey Selection`, `Vintage Wine Cellar`, `Artisanal Mocktails` | — | — | removed from `lounge.html` | names survive only in a comment at `lounge.html:674-675` | **CANONICAL_DATA_MISSING** |
| **`is_featured`** | 3 rows true (`Signature Nyama Choma`, `ZT Signature Pilau`, `Goat Ribs`) | 0 rows true | `getSignatureItems()` `:188` — **never called by any public page** | none | none | none | **DEAD/UNUSED** on the public menu path |

## Cross-surface summary

| Aspect | Restaurant Menu | Lounge Menu |
|---|---|---|
| Page file | `pages/experiences/restaurant-menu.html` | `pages/experiences/lounge.html` |
| Menu mount | `#menu-nav-container` `:465`, `#menu-container` `:470` | `#menu-nav-container` `:679`, `#menu-container` `:680` |
| Stylesheet | inline `<style>` + `theme.css` | `assets/css/menu.css` `:85` + `theme.css` |
| Repository method | `MenuRepository.getMenuForSurface('restaurant-menu')` | `MenuRepository.getMenuForSurface('lounge')` |
| Resolved `page_id` | `a3490e73…` | `2ba8a348…` |
| Categories rendered | 5 (only those with Restaurant items) | 1 (`Fast Foods`) |
| Items rendered | 11 | 2 |
| Hardcoded menu data | none | none |

---

## Verified pipeline (both surfaces, identical)

```
menu_categories (10 rows, no page/scope column)
        |  menu_items.category_id = menu_categories.id
        v
menu_items (14 rows; page_id present and populated on all 14)
        |  MenuRepository.getMenuForSurface(surfacePageId)
        |    -> MENU_PAGE_KEY_BY_SURFACE (surface PageId -> menu page_key)
        |    -> PageResolver.resolvePageRecord(page_key) -> website_pages.id
        |    -> getMenu(pageUuid):  eq is_active=true AND page_id=<uuid>
        v
MediaResolver.resolveCollection()  ->  media_assets.public_url
        v
content-loader.populateMenu()  ->  #menu-container .menu-item-card
                                    h3 = name, p = description,
                                    .price-tag = "KES " + price,
                                    img = AssetUrl.resolve(image_url)
```

`withoutEmptyCategories()` (`MenuRepository:174`) drops categories holding no item inside
the requested scope, so a page never renders another venue's empty sections.

## Hardcoded menu data - current scan result

| Previously reported literal | Current occurrences | Location |
|---|---|---|
| `KES 1,200` | **0** | removed |
| `KES 1,500` | **0** | removed |
| `KES 2,000` | **0** | removed |
| `KES 800` | **0** | removed |
| `House Signature Collection` | 1 | `lounge.html:674` - **documentation comment only** |
| `Premium Whiskey Selection` | 1 | `lounge.html:675` - documentation comment only |
| `Vintage Wine Cellar` | 1 | `lounge.html:675` - documentation comment only |
| `Artisanal Mocktails` | 1 | `lounge.html:675` - documentation comment only |

**No hardcoded menu business data exists on either served menu page.**