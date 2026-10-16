# HOME INITIAL HERO DELAY REPORT

## 1. STATUS

**NOT VERIFIED**

The active source path was inspected, but fresh runtime timing could not be collected. The command channel failed twice:

1. The initial static/server command returned `Command completion could not be observed`.
2. After one corrected attempt to prepare a short Playwright harness, the harness creation timed out; a minimal corrected Node execution also returned `Command completion could not be observed`.

Per the two-failure rule, Playwright and further command execution were stopped. No prior browser artifact was used as fresh evidence.

## 2. STATIC DEPENDENCY CHAIN — OBSERVED

The current active Home path is:

```text
index.html
  body[data-page="home"]
  → .hero-slider shell (no baked hero slides)
  → shared-components.js emits deferred CMS scripts in order
  → content-loader.js DOMContentLoaded initialization
  → populateHero()
  → HeroRepository.getByPage('home')
  → PageResolver.requirePageUuid('home', 'Hero')
  → website_pages?page_key=eq.home
  → hero_slides filtered by resolved page UUID + is_active=true
  → MediaResolver.resolveCollection()
  → media_assets queried by media_id
  → media_assets.public_url assigned to slide.image_url
  → slideEl.style.backgroundImage = url(...)
  → hero:rendered
  → shared slider receives control
  → background-media-warmer.js observes hero:rendered
  → first background image settlement
  → requestIdleCallback
  → warmer discovery/fetch activity
```

Relevant active files:

- `index.html:224-249`
- `assets/js/shared-components.js:314-391`
- `assets/js/content-loader.js:301-428`
- `assets/js/repositories/PageResolver.js:42-119`
- `assets/js/repositories/HeroRepository.js:129-163`
- `assets/js/repositories/MediaResolver.js:32-77`
- `assets/js/background-media-warmer.js:395-437`

Branding initialization (`assets/js/branding-init.js`) runs independently on DOMContentLoaded through `BusinessRepository`. It updates logo/favicon metadata and is not an awaited prerequisite in `populateHero()`.

## 3. STATIC RENDERING GATE — OBSERVED

- The initial HTML contains only the `.hero-slider` shell and controls.
- `populateHero()` clears any existing slide markup, then creates slides only after the repository/media promises resolve.
- The canonical first background is assigned at `content-loader.js:357`.
- `hero:rendered` is dispatched at `content-loader.js:428`.
- The warmer subscribes to `hero:rendered` and then waits for first background settlement before scheduling idle work.
- No artificial first-slide timeout was observed in the inspected hero path.
- Fresh runtime proof that no unrelated initialization or CSS paint gate adds delay is **NOT VERIFIED**.

## 4. TIMING TABLE

All values require fresh browser evidence and are unavailable because Playwright could not be launched through the failed command path.

| Stage | Start | End | Duration | Result |
|---|---:|---:|---:|---|
| Home navigation | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| DOMContentLoaded | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| `website_pages?page_key=eq.home` | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| `hero_slides` | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| `media_assets` | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| Canonical hero image | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| Background assignment / `hero:rendered` | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| First hero settled | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| Warmer start | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| First visually usable hero | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |

## 5. BOTTLENECK

**NOT VERIFIED.**

Source proves a sequential CMS/media dependency exists, but it does not prove where the observed delay is consumed. No choice among website_pages, hero_slides, media_assets, Storage image transfer, JavaScript scheduling, CSS paint, or another runtime factor is made without fresh measurements.

## 6. DUPLICATES

Fresh request counts are **NOT VERIFIED** for:

| Request | Count |
|---|---:|
| Home `website_pages` | NOT VERIFIED |
| Home `hero_slides` | NOT VERIFIED |
| Home `media_assets` | NOT VERIFIED |
| Canonical first hero image | NOT VERIFIED |

Static source confirms PageResolver has a completed-result cache and an `inFlight` Promise map keyed by page ID. Runtime regression status is **NOT VERIFIED**.

## 7. WARMER ORDERING

Required ordering:

```text
hero rendered
→ first hero settled
→ warmer start
```

Static source supports this ordering, but measured timestamps are **NOT VERIFIED**. Therefore there is no runtime proof that the warmer starts before the first usable hero, and no source change was made to the warmer.

## 8. REGRESSION

| Check | Result |
|---|---|
| Fresh Home HTTP status | NOT VERIFIED |
| Canonical hero URL | NOT VERIFIED |
| Rendered hero slide count | NOT VERIFIED |
| Hero visible | NOT VERIFIED |
| Slideshow transition | NOT VERIFIED |
| Console errors | NOT VERIFIED |
| Failed requests | NOT VERIFIED |

No prior run was promoted to fresh evidence.

## 9. CONSTRAINED NETWORK

The requested 400 Kbps / 200 Kbps test was not launched because the command path failed twice. Home-vs-warmer ordering under constrained network is **NOT VERIFIED**.

## 10. CHANGES

- Created this report: `HOME_INITIAL_HERO_DELAY_REPORT.md`.
- No application source changed.
- No media-warmer source changed.
- No database, schema, RLS, CMS, hero, media, cache, preload, or service-worker change occurred.

**NO SOURCE CHANGES — verification could not identify a concrete implementation defect because fresh runtime evidence was unavailable.**

## 11. REMAINING UNCERTAINTY

Every timing, duplicate-count, request-health, warmer-ordering, slideshow, cache, and constrained-network result is **NOT VERIFIED**. The exact stage consuming the observed Home hero delay remains **NOT VERIFIED**. The two-failure rule requires a future loop with restored command/Playwright execution before selecting a bottleneck or proposing an optimization.

