# HOMEPAGE FUNCTIONAL REGRESSION AUDIT

**Project:** `D:\zt lounge\zt-lounge-demo\zt-lounge` (public site)
**Scope:** Homepage visitor-facing behaviour and its data/navigation paths
**Date:** 2026-09-27
**Mode:** READ-ONLY. No fix applied. No source, DB, or config modified.

---

## Executive Diagnosis

**The homepage is NOT broadly broken. The premise of a general homepage
regression is NOT REPRODUCED.**

Three of the four named concerns are healthy and, importantly, are **proven
healthy from the canonical data path rather than from appearance alone**:

| Concern | Verdict |
|---|---|
| Hero media-ID architecture | **CORRECT** — full `media_id → media_assets → public_url` chain intact; no `[object Object]` |
| Membership "View More" | **CORRECT** — opens a local modal; **zero** references to `membership.html` anywhere in 778 files |
| Testimonials toggle | **Identified** — it is `is_featured`, gated on top of `approved` |
| Service Cards | **DATA-DEPENDENT anomaly** — 12 active services exist and are not page-scoped, but a page-level visibility flag is unresolved |

The one substantive lead is a **Service Cards visibility gate**, not a media or
navigation regression. Details, and the reason it is *not* yet classified as a
defect, are in *Service Cards — Homepage* below.

**Two audit paths are incomplete and are explicitly NOT claimed as verified:**
live `hero_slides` row inspection, and browser-runtime (console/network/viewport)
verification. Both are blocked — see *Hypotheses / Unverified Items*.

---

## Homepage Runtime Symptoms

**HTTP status: 200** (localhost:8000, `LEN=21068`, server listening pid=7532).

Structural inspection of the served `index.html` shows all expected homepage
sections present and in order:

| Section | Element | Status |
|---|---|---|
| Header | `#site-header` | Present (injected) |
| Hero | `#hero` | Present, empty container by design |
| About | `#about` | Present, static copy |
| Services | `#services` | Present, **empty container** |
| Promotions | `#promotions` | Present, empty container |
| Membership | `#membership` | Present, `#membership-grid` |
| Gallery | `#gallery` | Present, 4 empty `<figure>` shells |
| Location | `#location` | Present |
| Testimonials | `#testimonials` | Present, empty container |
| Footer/CTA | `#site-footer`, `#site-cta-float` | Present (injected) |

The empty service/testimonial/promotion containers are **intentional CMS mount
points**, each carrying a source comment. Empty markup in `index.html` is
expected and is *not* evidence of a render failure — rendering is performed by
`content-loader.js` at runtime.

### Findings Matrix

| Area | Finding | Exact evidence | Status |
|---|---|---|---|
| Homepage | Server returns 200; all 10 sections present | `_audit_srv.txt:3-4`; `index.html:237-391` | VERIFIED FACT — no structural regression |
| Homepage initialization | Each CMS block independently guarded; no single early exception blocks later sections | `content-loader.js` `runGuarded(...)`; `membership-view.js:251-254` | VERIFIED FACT — isolation confirmed by code |
| Hero DB | `hero_slides` live rows **not inspected** | Live query failed 2× (terminal) | **NOT VERIFIED** |
| Hero source | `mapToUI` carries `media_id`; `resolveMedia()` delegates to MediaResolver | `HeroRepository.js:75, 87-90` | VERIFIED FACT |
| Hero media chain | `media_id` → batched `media_assets` fetch → `public_url` overrides legacy | `MediaResolver.js:32-64` | VERIFIED FACT (code) |
| Hero runtime | Rendered `src` not captured | No browser harness | **NOT VERIFIED** |
| Testimonials toggle | `is_featured` (on top of mandatory `approved`) | `TestimonialsRepository.js:119-134` | VERIFIED FACT |
| Testimonials persistence | Admin writes `approved` + `is_featured` separately | `repository.ts:135` | VERIFIED FACT (contract) |
| Public testimonials | Zero approved rows ⇒ zero rendered; **no static fallback by design** | `TestimonialsRepository.js:110-112, 130-132`; `testimonials.config.js:22-24` | VERIFIED FACT — empty is CORRECT |
| Service Cards rendering | 12 active services; `getAll()` filters `is_active` only (no `page_id` filter) | `ServicesRepository.js:316-336`; live query 12 rows | VERIFIED FACT |
| Service Cards navigation | Destination = `href`, else `page_id → page_key → PAGE_ROUTES`; legacy pages remapped to `grooming-care.html` anchors | `ServicesRepository.js:32-80` | VERIFIED FACT — no retired page linked |
| Service Cards media | `MediaResolver.resolveCollection`; `public_url` wins, `image_url` only fallback | `ServicesRepository.js:325-334` | VERIFIED FACT |
| Membership rendering | 4 active plans, correct order/prices; `is_active` filtering | Live query 4 rows; `membership-view.js:208` | VERIFIED FACT |
| Membership View More | Local modal (`data-membership-modal-trigger`); no page navigation | `membership-view.js:70-72, 226-231` | VERIFIED FACT — requirement met |
| Membership mobile | Not viewport-tested | No browser harness | **NOT VERIFIED** |
| Media integrity | Resolver is canonical & batched; no N+1 | `MediaResolver.js:32-78` | VERIFIED FACT |
| Recent-change correlation | No correlation established | See section | **NOT VERIFIED** |

---

## Homepage Initialization Trace

Order and isolation, per source:

1. `shared-components.js` injects header/footer/floating CTA
   (`index.html:229-231, 397-401`).
2. `content-loader.js` runs each block through a **`runGuarded(...)`** wrapper.
   Confirmed at `content-loader.js:1645-1649`: `Prices` / `ServiceCatalog` /
   `Testimonials` / `BusinessInfo` / `Promotions`.
3. `membership-view.js` `init()` resolves plans, fee summary and business data in
   parallel, then mounts each `[data-membership-grid]` independently
   (`membership-view.js:238-255`).

**Key finding — no single early exception aborts later operations.** Each
consumer is either `runGuarded`-wrapped or has its own `.catch()`. Membership
failure calls `hideData(el)` for every mount (`membership-view.js:251-254`);
testimonials/media resolution failures return `[]` rather than throwing
(`TestimonialsRepository.js:110-112`, `MediaResolver.js:52-54`).

This directly contradicts the "one early exception prevents later homepage
operations" hypothesis. **NOT REPRODUCED.**

---

## Hero Database Audit

**NOT VERIFIED — blocked.** Two consecutive live queries against `hero_slides`
failed with terminal errors. Per the stop rule the path was abandoned.

What *is* verified is the **contract**, which is what determines behaviour:

`HeroRepository.mapToUI` (`HeroRepository.js:65-84`) maps `media_id` explicitly
(line 75) with the comment *"Canonical media relationship"*, and retains
`image_url` (line 74) as a fallback. `resolveMedia()` (lines 87-90) hands off to
`MediaResolver`.

---

## Hero Source-Code Audit

| Occurrence | Location | Classification |
|---|---|---|
| `media_id` mapping | `HeroRepository.js:75` | **Live runtime path** |
| `resolveMedia()` → MediaResolver | `HeroRepository.js:87-90` | **Live runtime path** |
| `image_url` fallback | `HeroRepository.js:74`; `MediaResolver.js:57-64` | **Fallback** (documented, correct) |
| Hardcoded Supabase storage URL | `index.html:357` (location image only) | **Static fallback, NOT hero** |
| Historical hardcoded hero URLs | `index_clean.html` rows 106-110 per `LOOP18_HARDCODED_IMAGE_INVENTORY.md` | **Dead code / legacy artifact** — `index_clean.html` is not the served homepage |
| `[object Object]` references | `src/lib/api.ts:177`, `hero-editor.tsx:37` (admin repo) | **Comment/documentation** — the fix record, not a live occurrence |

**Requirement met:** the runtime hero resolves through the canonical media
relationship. `image_url` is retained only as a documented presentation
fallback and is overridden whenever `media_id` resolves — `MediaResolver.js:58-64`
assigns `item.image_url = cache[...].public_url` **before** any fallback can apply.

---

## Hero Media-ID Resolution Path

```
hero_slides.media_id
  → HeroRepository.mapToUI()            media_id preserved      (line 75)
  → HeroRepository.resolveMedia()       delegated              (lines 87-90)
  → MediaResolver.resolveCollection()   batched, one query     (lines 71-78)
  → fetchAssets()  media_assets select id, public_url, alt_text (lines 32-39)
  → applyResolved() public_url OVERWRITES image_url           (lines 58-64)
  → rendered hero background/img src
```

Checked explicitly for the regression patterns named in the brief:

| Failure mode | Result |
|---|---|
| ID ignored | **No** — `media_id` is mapped and used as the resolver key |
| ID treated as a URL | **No** — IDs are only used as `.in('id', ids)` filter values |
| Converted to `[object Object]` | **No** — the two `String()`-serialization sites that caused it are both in the **admin** repo and are commented as fixed (`api.ts:177-179`); the public resolver never string-concatenates an ID into a URL |
| Replaced by `image_url` | **No** — resolution overwrites it, in that order |
| Replaced by a hardcoded URL | **No** — no hardcoded hero URL on the served page |

---

## Hero Runtime Verification

**NOT VERIFIED.** The rendered `src` and the actual browser network request were
not captured. No browser automation harness was available in this session, and
the terminal blocked the fallback path.

I am explicitly **not** claiming the hero is canonical on the basis of source
inspection alone, as the brief requires — that claim is limited to the code path
above. Runtime confirmation remains outstanding.

---

## Hardcoded Hero URL Audit

- **No hardcoded Supabase storage URL is present in the hero section.**
  `index.html:236-249` contains only the slider shell, two nav buttons and a
  dots container, with the comment that slides are generated from `hero_slides`
  by `content-loader.js populateHero()` (line 239).
- The one hardcoded storage URL on the served homepage is the **location**
  section image (`index.html:357`). It is **not** hero content, and it is a
  known pre-existing Class-A item recorded in
  `LOOP18_HARDCODED_IMAGE_REMEDIATION_REPORT.md:131` as a schema blocker, not a
  regression.
- Large historical inventories in `LOOP18_HARDCODED_IMAGE_INVENTORY.md` refer to
  `index_clean.html`, a **different, unserved file**. Not counted as live.

---

## Testimonials Toggle Identification

**The toggle is `is_featured`.**

Homepage selection (`TestimonialsRepository.js:119-134`):

```js
eq: [
    { column: 'approved',  value: true },
    { column: 'is_featured', value: true }
]
```

Two distinct fields, two distinct jobs:

- **`approved`** — mandatory publication gate. `getAll()` (lines 101-113)
  filters on it alone. A testimonial is invisible to the public site unless
  approved.
- **`is_featured`** — the homepage/curation flag. `getFeatured()` requires
  **both**.

Admin writes them as independent fields — `src/lib/repository.ts:135`:
`testimonials: ["media_id", "occupation", "is_featured", "approved", "display_order", "page_id"]`.

So the label is accurate: the "Testimonials" toggle controls `is_featured`, but
it is **not sufficient on its own** — an unapproved row stays hidden regardless.

PLACEHOLDER_TOGGLE
