# MEDIA LOADING ARCHITECTURE AUDIT

## 1. CURRENT ARCHITECTURE

### PROVEN entrypoint and boot

Public entrypoint: `D:\zt lounge\zt-lounge-demo\zt-lounge\index.html`.

`index.html` loads `assets/js/shared-components.js`. The shell emits the global CMS script layer during parsing: Supabase client/config, PageIdentity, CMSReport, PageResolver, MediaResolver, BaseRepository, BusinessRepository, branding-init, repositories, and `content-loader.js`. Optional feature scripts are controlled by `data-features`; the homepage requests membership.

`content-loader.js` starts on `DOMContentLoaded` through `runGuarded()` and independently invokes Hero, Gallery, HomepageGallery, FAQ, Services, CategoryServices, Menu, ServicesPage, Prices, ServiceCatalog, Testimonials, BusinessInfo, Promotions, Membership, and JSONLD initializers. A subsystem failure is intended not to abort other initializers.

### PROVEN hero path

```text
DOMContentLoaded
 → populateHero()
 → HeroRepository.getByPage(pageId)
 → PageResolver.requirePageUuid(pageId)
 → website_pages.id
 → hero_slides (page_id + is_active)
 → MediaResolver.resolveCollection()
 → media_assets.public_url
 → slide.style.backgroundImage
 → Storage image request
 → visible CSS hero slide
```

The existing PageResolver completed cache and in-flight deduplication are treated as current state and were not modified.

### PROVEN shared branding path

```text
BusinessRepository.getAll()
 → business_settings.logo_media_id / favicon_media_id
 → BusinessRepository media resolution
 → branding-init.js updates shared logo/favicon DOM
```

`shared-components.js` inserts fallback branding first; `branding-init.js` then canonicalizes it.

### Dependency map

| Subsystem | Repository | Page identity | Media resolver | Rendering |
|---|---|---|---|---|
| Hero | `HeroRepository` | `PageResolver` | `MediaResolver` | CSS background |
| Services | `ServicesRepository` | page-specific methods | `MediaResolver` | lazy `<img>` |
| Menu | `MenuRepository` | CMS category/page data | `MediaResolver` | menu `<img>` |
| Gallery | `GalleryRepository` | `PageResolver` | `MediaResolver` | gallery `<img>` |
| Promotions | `PromotionRepository` | current-page UUID for destinations | `MediaResolver` | lazy `<img>` |
| Testimonials | `TestimonialsRepository` | no page resolver in approved/featured query | `MediaResolver` | testimonial renderer |
| Branding | `BusinessRepository` + `branding-init.js` | not page-linked | BusinessRepository | logos/favicon/meta |
| Membership | `MembershipRepository` | no page resolver in plan query | `MediaResolver` | optional lazy `<img>` |

## 2. CMS MEDIA CATEGORIES

### Heroes — PROVEN

- Source: `hero_slides`
- Repository: `assets/js/repositories/HeroRepository.js`
- Relationship: `hero_slides.media_id → media_assets.id → public_url`
- Browser request: Supabase Storage image as CSS background
- Priority: first hero is above-the-fold
- Observed: 9 hero rows total; homepage 2; Lounge 1; Restaurant 2; Grooming Care 1

### Services — PROVEN

- Source: `services`
- Repository: `ServicesRepository`
- Relationship: `services.media_id → media_assets.public_url`
- Browser request: generated service-card `<img>` with `loading="lazy" decoding="async"`
- Priority: below hero
- Observed: 12 services; 11 with media relationships

### Menu — PROVEN

- Source: `menu_items` and `menu_categories`
- Repository: `MenuRepository`
- Relationship: `menu_items.media_id → media_assets.public_url`
- Browser request: menu item images
- Priority: page/viewport dependent
- Observed: 14 menu items; all with media relationships

### Gallery — PROVEN

- Source: `gallery`
- Repository: `GalleryRepository`
- Relationship: `gallery.media_id → media_assets.public_url`
- Browser request: gallery images
- Priority: below hero on homepage
- Observed: 13 gallery rows; all with media relationships



#### Promotions — PROVEN

- Source: `promotions`
- Repository: `PromotionRepository`
- Relationship: `promotions.media_id → media_assets.public_url`
- Browser request: promotion `<img loading="lazy" decoding="async">`
- Priority: below hero
- Observed: 1 active homepage promotion

#### Business/logo/favicon — PROVEN

- Source: `business_settings`
- Repository/resolver: `BusinessRepository` + `branding-init.js`
- Relationship: `logo_media_id` and `favicon_media_id → media_assets.public_url`
- Browser request: shared header/footer logo, favicon, OG/Twitter image
- Priority: shared-shell media; active logo markup uses `fetchpriority="high"`

#### Grooming Care — PROVEN page-specific surface

Canonical page: `/pages/business/grooming-care.html`; CMS page key: `grooming-care`. The page uses the Hero path plus service/category media. One hero and Barbershop/Carpet Cleaning service images were observed.

### Non-CMS presentation media — OBSERVED separately

Static HTML/CSS also contains section backgrounds, location imagery, and fallback assets. They are not all represented by `media_id` and are not treated as CMS-controlled warming targets.

## 3. HOMEPAGE REQUEST WATERFALL

Runtime URL: `http://127.0.0.1:8000/`

Artifact: `C:\Users\Fluxtech\AppData\Local\Temp\zt-media-architecture-runtime.json`

Observed homepage: HTTP **200**; first canonical hero visible marker **6,522.9 ms**; hero state `ok` with 2 slides; browser media requests **11**; failed browser requests **0**.

| Relative time | Observed behavior |
|---:|---|
| ~0 ms | Local document request |
| ~168 ms | HTML response completes |
| ~588 ms | Theme CSS/initializer and shared-components requests |
| ~1,057 ms | Global CMS/repository scripts |
| ~1,300–1,400 ms | Supabase REST requests begin; independent subsystems start |
| ~2,600–3,000 ms | Multiple `media_assets` requests overlap |
| ~3,391 ms | Canonical hero image request starts |
| ~3,400–3,900 ms | Additional service/gallery/location media requests overlap |
| ~6,522.9 ms | First canonical hero visibility marker |

The ordering is proven; exact wall-clock times vary with Supabase/Storage latency. Hero Storage discovery waits for the canonical page/slide/media chain while unrelated CMS/media work runs concurrently. No site-wide background warmer exists.

## 4. PAGE NAVIGATION BEHAVIOR

All requested destinations exist and returned HTTP 200:

| Destination | First hero marker | Hero count | Media requests | Failed |
|---|---:|---:|---:|---:|
| Homepage | 6,522.9 ms | 2 | 11 | 0 |
| Lounge | 4,018.7 ms | 1 | 6 | 0 |
| Restaurant | 3,408.8 ms | 2 | 13 | 0 |
| Grooming Care | 3,249.9 ms | 1 | 7 | 0 |

The site uses static HTML documents rather than an SPA router. The capture used fresh document navigations in one browser context, which matches the public route architecture. Storage responses expose `max-age=3600`/`public, max-age=3600`; exact memory-cache versus disk-cache selection is **NOT VERIFIED**. No proactive destination-media warming was observed.

## 5. CURRENT CACHING

### Browser HTTP cache — PROVEN

Storage responses include `max-age=3600` or `public, max-age=3600`. Some non-CMS/static resources returned `no-cache` or did not expose equivalent policy. Exact browser memory/disk selection is **NOT VERIFIED**.

### Application caches — PROVEN

- `PageResolver`: completed `cache[pageId]` plus in-flight `inFlight[pageId]`; completed results last for the document lifetime; pending entries clear on settlement.
- `BaseRepository`: filter-aware in-memory result cache with a default 300,000 ms TTL, plus in-flight Promise deduplication.
- `MediaResolver`: in-memory `cache[media_asset_id]`; resolved media is shared across subsystems in the document lifetime. It has no expiry and no cross-document persistence.
- `BusinessRepository`: module-level `cachedData` and an in-flight dedup path.
- Supabase client: one lazy client instance; public auth persistence is disabled.

No public-runtime `localStorage` media cache, `sessionStorage` media cache, Cache API media store, IndexedDB media store, or service-worker media cache was found.

## 6. PRELOAD/PREFETCH MECHANISMS

### FOUND

- `index.html` has `preconnect`/`dns-prefetch` hints for fonts/CDN, but no active public media `<link rel="preload" as="image">` mechanism.
- Shared logo markup uses `fetchpriority="high"` and `decoding="async"` in `shared-components.js`.
- Generated service, promotion, membership, and other CMS `<img>` elements use `loading="lazy"` and `decoding="async"`.

### NOT FOUND in active public runtime

- `new Image()` media warmer
- `requestIdleCallback()` media queue
- `IntersectionObserver` media warmer
- `fetch()`-based media warming
- `rel="prefetch"` for destination media
- Cache API / service-worker media warming
- A priority queue for background media

`index_clean.html` and `_runtime_home.html` contain `fetchpriority="high"` references, but they are not the active served `index.html` path and are not counted as active runtime behavior.

## 7. MEDIA VOLUME

Read-only public REST inventory:

| Entity | Observed count |
|---|---:|
| `media_assets` | 50 total; query range `0-49/50` |
| `website_pages` | 9 |
| `hero_slides` | 9; 9 with media relationships |
| `services` | 12; 11 with media relationships |
| `menu_items` | 14; 14 with media relationships |
| `gallery` | 13; 13 with media relationships |
| `promotions` | 1; active and shown on homepage |
| `business_settings` | 1 |
| `membership_plans` | 4; all observed without media relationships |

A complete page-to-unique-media graph and complete per-page media counts are **NOT VERIFIED**. Observed browser media requests are recorded in Sections 3 and 4.

## 8. MEDIA PAYLOAD SIZES

Representative live Storage responses exposed `content-length` and `content-type`:

| Media | Format | Bytes observed |
|---|---|---:|
| `hero-images/hero-restaurant.webp` | `image/webp` | 264,064 |
| `hero-images/hero-lounge.webp` | `image/webp` | 219,332 |
| `service-images/lounge-interior-main.webp` | `image/webp` | 190,290 |
| `service-images/car-detailing.webp` | `image/webp` | 267,646 |
| `service-images/interior.webp` | `image/webp` | 167,644 |
| `service-images/conference-hall.webp` | `image/webp` | 90,026 |
| `service-images/wedding.webp` | `image/webp` | 374,260 |
| `service-images/vip-fireplace-lounge.webp` | `image/webp` | 101,762 |
| `service-images/barbershop/haircut-beard-grooming.webp` | `image/webp` | 226,741 |
| `gallery-images/gallery-02.webp` | `image/webp` | 172,938 |
| `logos/logo.webp` | `image/webp` | 16,114 |

Observed hero CSS box was approximately 1280×446. Intrinsic dimensions for every representative asset are **NOT VERIFIED**.

## 9. WEAK-NETWORK OBSERVATION

Playwright CDP profile: 150 ms latency, 400 Kbps download, 200 Kbps upload.

Observed homepage: HTTP **200**; first canonical hero visible marker **25,109 ms**; media requests **10**; failed requests **0**. The shared logo completed early, while hero and other canonical Storage media competed on the constrained connection. Multiple service/category `<img>` elements had `loading="lazy"` but were still in the viewport and remained incomplete at observation time. No priority queue or connection-capacity reservation protected the hero.

This proves weak-network contention can delay the first hero. It does not prove a bandwidth-optimal fix.

## 10. CURRENT DEPENDENCY MAP

```text
VISITOR ENTERS HOMEPAGE
        │
        ├── HTML + theme CSS/initializer + shared-components.js
        ├── shared shell markup
        │     ├── fallback branding
        │     ├── BusinessRepository → business_settings
        │     └── branding-init → logo/favicon media resolution
        ├── content-loader DOMContentLoaded initializers
        │     ├── HeroRepository → PageResolver → hero_slides → MediaResolver → Storage
        │     ├── ServicesRepository → services → MediaResolver → lazy service images
        │     ├── GalleryRepository → gallery → MediaResolver → gallery images
        │     ├── MenuRepository → menu data → MediaResolver → menu images
        │     ├── PromotionRepository → promotions → MediaResolver → lazy promotion images
        │     ├── MembershipRepository → plans/benefits → MediaResolver
        │     ├── TestimonialsRepository → testimonials → MediaResolver
        │     └── BusinessInfo/JSONLD
        └── lower-page/static presentation media
              ├── location image
              ├── CSS/section backgrounds
              └── other non-CMS presentation/fallback assets

VISITOR NAVIGATES TO ANOTHER STATIC PAGE
        │
        ├── new HTML document and shared script layer
        ├── new PageResolver page UUID lookup
        ├── page-specific hero_slides query
        ├── page-specific media_assets query
        ├── new Storage hero request unless HTTP cache already satisfies it
        └── page-specific services/gallery/menu/etc. requests
```



## 11. PROVEN BOTTLENECKS

1. **Canonical hero discovery is sequential.** The browser cannot request the hero Storage URL until page UUID, active slide, and `media_assets.public_url` resolve.
2. **Homepage startup launches many independent CMS initializers.** This creates concurrent REST/media work rather than an isolated critical-media queue.
3. **Lower-page media can compete with the hero on constrained connections.** The weak-network run showed incomplete secondary images while the hero was pending.
4. **The hero is a CSS background.** It has no native `<img>` loading semantics; the image is requested after JavaScript resolves and applies `backgroundImage`.
5. **No proactive destination warming exists.** A new static page starts its own page-specific chain; no earlier destination preparation was observed.
6. **MediaResolver is document-scoped and in-memory only.** It reduces repeated resolution within one document but does not persist media across full page navigations.

INFERRED: a future bounded priority-aware warmer could improve navigation preparation, but it must not compete with current-page critical work. This is a hypothesis, not a proven performance result.

## 12. POSSIBLE WARMING MECHANISMS

| Candidate | Classification | Assessment |
|---|---|---|
| `<link rel="preload">` | **POSSIBLE BUT REQUIRES ARCHITECTURAL CHANGE** | No active media preload exists; dynamic CMS URLs require resolution unless generated server-side. Preloading too much can consume constrained bandwidth. |
| `<link rel="prefetch">` | **POSSIBLE BUT REQUIRES ARCHITECTURAL CHANGE** | No active mechanism found. Could prepare likely next-page resources, but needs controlled triggering. |
| `fetch()` | **SUPPORTED BY CURRENT ARCHITECTURE** | Supabase requests and public Storage URLs already exist; a bounded fetcher could warm selected canonical URLs. |
| `new Image()` | **SUPPORTED BY CURRENT ARCHITECTURE** | Can populate the browser HTTP cache, but requires bounded concurrency and priority control. |
| Browser HTTP cache warming | **SUPPORTED BY CURRENT ARCHITECTURE** | Storage responses expose one-hour cache headers; this is the natural effect of bounded image/fetch warming. |
| Application-level media cache | **PARTIALLY SUPPORTED** | MediaResolver/BaseRepository have document-scoped in-memory caches; no cross-document media cache exists. |
| Priority queue | **POSSIBLE BUT REQUIRES ARCHITECTURAL CHANGE** | No queue exists; one is required to prevent background media starving the current page. |
| Connection-aware/background loading | **POSSIBLE BUT REQUIRES ARCHITECTURAL CHANGE** | Weak-network contention is observed, but connection information APIs/policy are not used. `navigator.connection` is **NOT VERIFIED**. |
| Warm every media immediately | **NOT SUITABLE** | It would worsen weak Wi-Fi and violates the requirement for controlled concurrency. |

## 13. RECOMMENDED IMPLEMENTATION DIRECTION

**Recommendation only — no implementation performed.**

A future warmer should use a bounded, priority-aware scheduler:

```text
Current page critical CMS/media
        → priority 1
Important next-page media
        → priority 2
Lower-value/speculative media
        → priority 3
```

Required properties:

1. Resolve destination media only through CMS repositories and `media_assets.public_url`; do not maintain a second hardcoded URL list.
2. Let current-page hero, shell branding, and required CMS data complete first.
3. Select a small number of likely next-page media rather than warming the entire site.
4. Enforce a low maximum background concurrency.
5. Use `fetch()` or `new Image()` only after canonical CMS resolution.
6. Stop or deprioritize warming on constrained connections, visibility changes, or navigation.
7. Measure cold and warm navigation separately.
8. Keep slideshow and current-page canonical hero behavior unchanged.

This addresses observed contention without turning the homepage into “download every image immediately.”



## 14. RISKS

- Bandwidth risk: background media can delay the current hero on weak Wi-Fi.
- Priority inversion: speculative next-page assets could outrank current-page work.
- Stale warming: media can change between resolution and navigation.
- Duplicate work: application and browser caches may both be active.
- Connection variance: Supabase/Storage latency varies across runs.
- Static/non-CMS boundary: warming every visible URL would include presentation/fallback assets outside the canonical media relationship.
- Navigation interruption: a document navigation can cancel in-memory warming; only HTTP-cache benefits reliably survive.
- Cache policy differences: observed Storage assets use one-hour caching, while some other resources are `no-cache`.

## 15. NOT VERIFIED ITEMS

- Complete page-to-unique-media graph and total unique media per page: **NOT VERIFIED**.
- Intrinsic dimensions for every representative asset: **NOT VERIFIED**.
- Exact browser memory-cache versus disk-cache classification for every response: **NOT VERIFIED**.
- `navigator.connection` availability and effectiveType values: **NOT VERIFIED**.
- Click-driven navigation using the exact homepage link elements: **NOT VERIFIED**; route audit used actual static document navigation.
- Whether repeated navigation is served from memory cache, disk cache, or revalidation: **NOT VERIFIED**.
- Server-side cache configuration beyond observed response headers: **NOT VERIFIED**.
- Future warming performance improvement: **NOT VERIFIED**; no implementation performed.

## FINAL RUNTIME VERIFICATION

| Check | Result |
|---|---|
| Homepage HTTP | **PASS** — 200 |
| Lounge HTTP | **PASS** — 200 |
| Restaurant HTTP | **PASS** — 200 |
| Grooming Care HTTP | **PASS** — 200 |
| Playwright homepage capture | **PASS** |
| Playwright destination captures | **PASS** |
| Constrained-network Playwright capture | **PASS** |
| Failed browser requests in measured pages | **PASS** — 0 |
| Database writes | **PASS** — none performed |
| Source files modified by this audit | **PASS** — none |
| Report file | **PASS** — created |
| Warming system implementation | **NOT VERIFIED / not performed by design** |


