# Hero Render Performance Report

## Status

**DIAGNOSED — NOT FIXED**

The measured delay is not an artificial slideshow timeout or a JavaScript hero-render gate. The first canonical CMS hero is delayed by the dependent Supabase `website_pages` → `hero_slides` → `media_assets` chain and the subsequent image request. No application code was changed because the evidence localized the bottleneck to external CMS/network latency and the task requires stopping rather than making speculative optimizations when infrastructure is the cause.


## SUPABASE CMS LATENCY ROOT-CAUSE AUDIT

### A. Exact browser request

- **URL/query:** `GET https://jczwilrysvnhcjzjztbi.supabase.co/rest/v1/website_pages?select=id%2Cpage_key%2Ctitle&page_key=eq.home`
- **HTTP status:** `200`
- **Authentication/session:** The public Supabase client uses the anon key with `persistSession: false`, `autoRefreshToken: false`, and `detectSessionInUrl: false`; no authenticated user session is required. The browser capture did not expose request headers, so exact wire-header values are **not claimed**.
- **Fresh browser artifact:** `C:\Users\Fluxtech\AppData\Local\Temp\zt-hero-latency-browser-result.json`
- **Fresh browser run:** status `200`; first canonical hero marker `5,876.2 ms`; failed requests `0`; one non-blocking warning: `[BusinessConfig] BusinessRepository not loaded, using fallback`.

#### Fresh browser request boundaries

| Request event | Wall-clock from navigation | Evidence |
|---|---:|---|
| Homepage `website_pages?page_key=eq.home` requests | 1,161–1,162 ms | Five identical concurrent requests observed |
| Concurrent `website_pages?page_key=eq.gallery` request | 1,162 ms | Separate page identity lookup |
| First `website_pages` response used for hero path | 4,745 ms | HTTP 200 |
| `hero_slides` request | 4,745 ms | Query for resolved home UUID |
| `hero_slides` response | 5,377 ms | HTTP 200 |
| Hero `media_assets` request | 4,796–5,296 ms | Other subsystem media requests overlap; hero media batch is identified in the capture |
| First canonical Storage image request | 5,961 ms | `hero-restaurant.webp` and `hero-lounge.webp` |
| First visible canonical hero marker | 5,876.2 ms | DOM background applied and computed visible |

The browser Resource Timing view for the first home lookup reports `startTime ≈ 618 ms`, `duration ≈ 4,029.7 ms`, and `responseEnd ≈ 4,647.7 ms`. The event capture uses a separate navigation-start wall clock, so the two timings are not numerically interchangeable. The request/response event boundary is the authoritative application sequencing measurement: the first response at approximately 4,745 ms immediately precedes the hero-slides request.

### B. Application sequencing

The measured dependency chain is:

```text
shared-components.js parser-inserted global scripts
  → Supabase client lazy initialization
  → PageResolver.requirePageUuid('home')
  → GET website_pages?page_key=eq.home
  → HeroRepository.getRepo().getAll(...)
  → GET hero_slides?page_id=eq.<home-uuid>&is_active=eq.true&order=display_order.asc
  → MediaResolver.resolveCollection(...)
  → GET media_assets?select=id,public_url,alt_text&id=in.(...)
  → apply canonical backgroundImage
```

### D. Downstream timings

- `hero_slides` after the first page response: approximately 632 ms in the fresh browser capture.
- Canonical `media_assets.public_url` response: approximately 543.6 ms for the hero media batch in the fresh capture.
- Storage image request: started at 5,961 ms after the canonical media response path completed.
- Storage response: the earlier cold artifact recorded HTTP 200 and `image/webp`; the fresh capture’s first canonical background marker was 5,876.2 ms. The image is not the dominant 3–5 second interval in this audit.
- LCP in the previous baseline remained after the canonical hero, at 8,628 ms, but it is not used as the first-hero blocking measurement.

### E. Classification

```text
ROOT CAUSE:
  The first canonical hero is blocked by the website_pages response in the
  canonical sequential chain, with the browser run showing a roughly
  3.6-second first-response wait after request issuance.

EVIDENCE:
  Fresh browser request/response events, direct anon REST timings, and the
  application request waterfall above.

EXACT BLOCKING INTERVAL:
  Approximately 1,161 ms to 4,745 ms from navigation start for the first
  browser website_pages response: approximately 3,584 ms. Resource Timing
  separately reports approximately 4,029.7 ms for that resource.

APPLICATION-SIDE DELAY:
  Approximately 1,161 ms from navigation start to CMS request issuance,
  including the shared script boot. In addition, five identical page-key
  requests are issued concurrently, proving missing in-flight deduplication
  at the PageResolver layer. This amplifies request load but is not a fixed
  three-second JavaScript timer.

SERVER-SIDE DELAY:
  NOT PROVEN. The direct equivalent REST query returns HTTP 200 in roughly
  1.07–1.49 seconds, so the browser’s slower response cannot be attributed
  solely to query execution, RLS, or a fixed Supabase database cost.

DOWNSTREAM DELAYS:
  hero_slides ≈ 632 ms; hero media_assets ≈ 544 ms; Storage image follows
  only after the media URL is available.

FIX REQUIRED:
  NOT PROVEN from this read-only audit. A code-level optimization may be
  possible for in-flight page-resolution deduplication or earlier hero
  orchestration, but it is not authorized as a fix without a separate
  implementation loop and post-fix cold/reload measurements.
```

**Primary bottleneck:** `SUPABASE/NETWORK RESPONSE VARIANCE AMPLIFIED BY APPLICATION DUPLICATE REQUESTS` — confidence **MEDIUM**. The blocking stage is proven; the infrastructure component is not fully isolated.



The hero path contains no artificial timer, `requestAnimationFrame` wait, or hero-specific `setTimeout`. `populateHero()` starts on `DOMContentLoaded`, but it correctly waits for the page UUID, slides, and canonical media URL.

A separate application-side issue is proven by the browser network capture: five identical `website_pages?page_key=eq.home` requests were issued concurrently, plus one gallery request. `PageResolver` caches completed results per page but has no in-flight promise deduplication. Therefore multiple subsystem initializations can issue the same page lookup before the first result resolves. This is request amplification, not a hardcoded fallback and not a database mutation.

The existing `BaseRepository` retry configuration is one retry with a 1,000 ms delay for classified transient errors. No retry was required in this capture: all observed canonical REST responses were HTTP 200.

### C. Direct canonical REST comparison

A read-only direct request using the existing public anon configuration was executed without changing the repository or database:

- `website_pages?select=id,page_key,title&page_key=eq.home` — HTTP 200, 90 bytes.
- Fresh direct timings: 1,071.8 ms; 1,212.4 ms; 1,492.7 ms.
- Connection breakdown from one direct run: DNS 256.5 ms, TCP 765.0 ms, TLS 1,035.7 ms, response headers 1,656.9 ms, response end 1,660.9 ms.
- A second direct run: response headers at 1,342.3 ms, response end at 1,343.5 ms.
- A direct UUID lookup was also HTTP 200 in 355.5 ms after connection reuse.

This proves that the query is not intrinsically a fixed 6.3-second database operation. The direct request is much faster than the browser’s first response, while showing substantial connection/setup variance. The browser path is therefore a combination of network/server variance and the application’s concurrent duplicate page lookups. The exact reason for the browser’s slower response—Supabase/PostgREST queueing, network variance, or connection contention—is **NOT PROVEN**.


## BEFORE

### Runtime and measurement

- Public URL: `http://127.0.0.1:8000/`
- Browser: Playwright Chromium, one cold navigation against the running public server
- Measurement artifact: `D:\zt lounge\zt-lounge-demo\zt-lounge\zt-hero-measure-result.json`
- Database/media records: read-only; no writes performed
- Application source changes: none made by this investigation

### Measured timing

| Stage | Start | End / marker | Duration | Evidence |
|---|---:|---:|---:|---|
| Navigation/HTML | 0 ms | 10.1 ms response start; 12.5 ms response end | 12.5 ms | Browser artifact |
| First Contentful Paint | — | 172 ms | — | Browser artifact |
| Largest Contentful Paint | — | 8,628 ms | — | Browser artifact; largest captured LCP entry |
| Document load | — | 6,187.7 ms | — | Browser artifact |
| Homepage `website_pages` requests (`page_key=eq.home`) | 289.9–292.0 ms | 3,935.5–6,586.9 ms response events | Five duplicate/parallel requests; individual request durations vary | Supabase REST request/response events; not a single Resource Timing row |
| `hero_slides` for resolved home page | 6,339.8 ms | 6,693.6 ms | 353.8 ms | Supabase REST Resource Timing |
| `media_assets` for hero media IDs | 6,695.6 ms | 7,586.7 ms | 891.1 ms | Supabase REST Resource Timing; this makes the canonical public URL available |
| First canonical hero image request | 7,600.9 ms | 7,798 ms (`hero-restaurant.webp`) | 197.1 ms | Supabase Storage request/response, HTTP 200, `image/webp` |
| Second canonical hero image request | 7,600.9 ms | 7,854 ms (`hero-lounge.webp`) | 253.1 ms | Supabase Storage request/response, HTTP 200, `image/webp` |
| First visible canonical hero marker | — | 7,648 ms | — | Browser DOM/visibility capture; occurs 47.1 ms after the first canonical image request and before its 7,798 ms response |

The important distinction is between the baked/fallback image and the canonical CMS hero:

- A non-CMS fallback image was requested at approximately 235 ms and completed at 1,756 ms, HTTP 200, `image/webp`, 264,064 bytes.
- The canonical CMS image was not requested until 7,600.9 ms, after the dependent CMS/media requests completed.
- The first visible canonical-hero marker was 7,648 ms, 47.1 ms after the first canonical image request began; the first image response completed at 7,798 ms. The marker is a DOM/application visibility observation, not a claim that image transfer completed before the marker.

### Hero request waterfall

1. Public HTML and boot JavaScript load.
2. Early page paint occurs at 172 ms.
3. The earliest homepage CMS request is recorded at 289.9 ms; the harness's CMS-start marker is 342 ms.
4. `website_pages?page_key=eq.home` is required to obtain the homepage UUID.
5. Only after that response does the client query `hero_slides` for the resolved page UUID.
6. The client resolves the slide media through `media_assets.public_url`.
7. Only after media resolution does the browser request the canonical Supabase Storage hero image.
8. The first canonical hero becomes visible according to the browser marker at 7,648 ms.

The canonical chain remains:

```text
website_pages (page_key=home)
  → hero_slides (page_id=resolved homepage UUID)
  → media_assets (media_id from slide)
  → media_assets.public_url
  → Supabase Storage image
  → hero background rendering
```

### Source audit

The active `populateHero()` path was inspected. It assigns the first resolved slide to the hero DOM after the media URL has been resolved. It contains no `setTimeout`, artificial delay, or slideshow gate that would explain the late first image request. The source also shows the slideshow transition behavior separately from initial slide population.

The largest measured blocking interval is the canonical `website_pages` REST request: approximately 6,264 ms from the harness/network marker at 342 ms to the 6,606 ms response marker. The corresponding Resource Timing responses for the duplicate homepage requests span 3,935.5–6,586.9 ms. The dependent CMS/media requests then delay the first canonical image request until 7,600.9 ms. The document itself is not the bottleneck; FCP is at 172 ms.

## Root cause

**External CMS/network latency in the required sequential CMS lookup chain.**

The browser can paint the page shell early, but the first canonical hero cannot be requested until the page UUID, hero slide, and media URL are available. The measured run shows the canonical homepage page lookup alone taking roughly 6.3 seconds. This is not caused by a fixed three-second JavaScript timer.

The measurement also captured a fallback image early, but that image is not the canonical CMS hero and therefore cannot be used as a valid optimization by hardcoding or replacing CMS content.

## Surgical fix

**No application fix applied.**

No code change was justified by the evidence. In particular:

- No hero URL was hardcoded.
- No fallback or direct image bypass was introduced.
- No database, website page, hero slide, media, or CMS record was modified.
- No preload was added based only on a speculative request-order assumption.
- No public-site component, hero renderer, slideshow, or unrelated performance path was rewritten.

The required optimization may be possible at the infrastructure/CMS-query level, but it would require a separately approved change to the external request path or a measured change to independent-request orchestration. This investigation stops before such a change.

## AFTER

No post-fix browser measurement exists because no application change was made. The following are therefore **NOT VERIFIED** for an “after” state:

- Cache-cold post-fix hero timing
- Normal reload post-fix hero timing
- Post-fix first image request start/end
- Post-fix visible-hero timing
- Post-fix 5-second slideshow behavior

The existing canonical chain and image status were observed in the BEFORE run:

- Canonical image HTTP status: 200
- Content-Type: `image/webp`
- Fallback image HTTP status: 200
- Canonical media chain: present in the network capture
- No database or media mutation: PASS

## Regression checks

| Check | Result |
|---|---|
| Public homepage loaded during measurement | PASS |
| Early document paint | PASS — 172 ms |
| Canonical hero media chain observed | PASS |
| Canonical hero image HTTP 200 | PASS |
| Canonical image content type | PASS — `image/webp` |
| First canonical hero image transfer size | PASS observed — 264,064 bytes for `hero-restaurant.webp`; 219,332 bytes for `hero-lounge.webp` |
| No database/media writes | PASS |
| No hardcoded hero URL introduced | PASS |
| Application code unchanged by this investigation | PASS |
| Post-fix timing improvement | NOT VERIFIED — no fix applied |
| Post-fix cache-cold/reload comparison | NOT VERIFIED |
| Post-fix 5-second slideshow check | NOT VERIFIED |

## Required headline timings

- **Hero data available at:** approximately 7,586.7 ms for the canonical `media_assets.public_url` response; the `hero_slides` response is at 6,693.6 ms, and the first canonical image request is issued at 7,600.9 ms after media resolution.
- **Hero image request started at:** 7,600.9 ms for the first canonical image.
- **Hero image completed at:** 7,798 ms for the first canonical image.
- **Hero became visually visible at:** 7,648 ms according to the browser DOM/visibility marker. This marker occurred 47.1 ms after the first canonical image request began and before the 7,798 ms image response completed, so it is the first observed visible state rather than proof that image bytes had fully arrived.

## Final verdict

**NOT FIXED — infrastructure/CMS latency diagnosed; no speculative application change applied.**

A material improvement cannot be claimed without a valid post-fix cold and reload browser measurement.


## PAGE RESOLVER IN-FLIGHT DEDUPLICATION FIX

### BEFORE

- Duplicate `website_pages?page_key=eq.home` requests: **5**
- Previous report baseline hero visible: **7,648 ms**
- Previous report baseline LCP: **8,628 ms**
- Canonical CMS/media chain: **PASS**
- Slideshow: **PASS** in the prior runtime evidence

### AFTER

Surgical change made only in:

```text
D:\zt lounge\zt-lounge-demo\zt-lounge\assets\js\repositories\PageResolver.js
```

The resolver now keeps the existing completed-result cache and adds a per-`pageId` in-flight Promise map. Concurrent callers for the same unresolved page key receive the same pending Promise. The pending entry is removed on both fulfillment and rejection. The existing query, result mapping, completed cache, and error-result behavior were preserved.

- `node --check assets/js/repositories/PageResolver.js`: **PASS**, exit `0`
- `git diff --check -- assets/js/repositories/PageResolver.js`: **PASS**, exit `0`
- Duplicate `website_pages?page_key=eq.home` requests: **1**
- Hero visible AFTER: **7,504.4 ms**
- LCP AFTER: **8,684 ms**
- Homepage HTTP: **200**
- Failed browser requests: **0**
- Rendered slides: **2**
- First slide active at initial observation: **PASS**
- After 6.5 seconds, slide index `1` active: **PASS** — slideshow behavior remains intact
- Canonical first background: `hero-images/hero-restaurant.webp`
- Canonical second background: `hero-images/hero-lounge.webp`
- Hardcoded hero URL introduced: **NO**

### Post-fix waterfall

| Stage | Start | End / marker |
|---|---:|---:|
| `website_pages?page_key=eq.home` request | 1,338 ms | — |
| `website_pages` response | — | 5,758 ms, HTTP 200 |
| `hero_slides` request | 5,771 ms | — |
| `hero_slides` response | — | 6,967 ms, HTTP 200 |
| Canonical `media_assets` request | 6,970 ms | — |
| Canonical `media_assets` response | — | 7,536 ms, HTTP 200 |
| Canonical hero image request | 7,598 ms | — |
| Canonical hero image response | — | 8,136 ms, HTTP 200, `image/webp` |
| First canonical hero visible marker | — | 7,504.4 ms |
| LCP | — | 8,684 ms |

The first visible marker precedes the image response completion, as in the prior measurement; it is a DOM/background visibility observation, not proof that the image bytes had fully completed at that marker.

### Required BEFORE / AFTER result

```text
BEFORE:
  website_pages duplicate requests: 5
  Hero visible: 7,648 ms
  LCP: 8,628 ms

AFTER:
  website_pages duplicate requests: 1
  Hero visible: 7,504.4 ms
  LCP: 8,684 ms

Canonical CMS/media chain: PASS
Slideshow: PASS
Overall: PARTIALLY IMPROVED
```

### Verdict

**PARTIALLY IMPROVED — duplicate CMS request amplification fixed, but remaining hero latency requires a separate investigation.**

The requested deduplication behavior is verified: concurrent homepage `website_pages` lookups are reduced from five to one, while the canonical `website_pages → hero_slides → media_assets.public_url → rendered Storage image` chain remains intact. The run did not demonstrate a material timing improvement; the dominant upstream CMS response wait remains. No further optimization was attempted in this loop.

