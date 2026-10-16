# PUBLIC IMAGE INTEGRITY FIX — REPORT

F-1 / F-2 from `ARCHITECTURE_FLOW_AUDIT.md`. Public repo `zt-lounge`,
branch `feature/membership-tiers-staging-phase1`, HEAD `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c`.

Server under test: Node static server `127.0.0.1:8021` (the Python server drops parallel requests
and was previously proven unreliable).

---

## Status

**PARTIALLY FIXED** — F-1 fixed and verified. **F-2 RETRACTED**: proven to be a measurement
artifact, not a defect. No user-visible broken images remain on any tested page.

---

## F-1 — missing placeholder

### Root cause
`assets/js/content-loader.js:795` emitted, for any service with no resolved media:

```js
: '<img class="card-image" src="/assets/images/placeholder-service.webp" ... />';
```

That asset **does not exist** anywhere in the repository (verified: `placeholder-service.webp`,
`placeholder.webp`, `placeholder.jpg` are all absent from `assets/images/`), so the reference 404s
and produces a broken image on every page that renders service cards.

Triggered by exactly one record: **`Classic Haircut`** (`media_id` NULL, `image_url` null).

### Which fix shape the evidence supports
The candidate shapes were evaluated against source evidence, not preference:

- **A — an intended placeholder exists elsewhere.** **Ruled out.** No placeholder asset exists in
  the repo under any name.
- **B — add the missing asset.** **Ruled out.** The same file already states the opposite rule,
  twice, in the gallery-preview code path:
  > "Missing/invalid media: hide mount, **never a broken src / undefined / [object Object] /
  > fabricated URL**."
  >
  > "zero valid featured rows must NOT leave stale baked gallery images visible ... **No
  > placeholder art is invented.**"

  Adding placeholder art would directly contradict the established site rule.
- **C — omit the image when media is absent.** **Confirmed.** This is the existing architecture's
  own behaviour for the identical condition, applied a few hundred lines away in the same file.

**Chosen fix: C** — render the service card with no `<img>` when there is no canonical media.

### Files changed
`assets/js/content-loader.js` — one conditional (lines 792-802). No asset added. No CSS change
(`.service-cards-grid` is an `auto-fit` grid with no image-dependent rows, so card layout is
unaffected).

### Before / after evidence

| Metric (home / contact / gallery) | Before | After |
|---|---|---|
| `placeholder-service.webp` 404 | **1 / 1 / 1** | **0 / 0 / 0** |
---

## F-2 — empty `img` src

### RETRACTED — reason

The audit reported "7 `<img>` elements render with an empty `src`". Browser evidence shows all
seven are **never rendered at all**:

| Page | Element | `display` | rendered height | `offsetParent` | src |
|---|---|---|---|---|---|
| home, contact (×3 each) | `.gallery-preview-grid > .gallery-preview-item > img` | **`none`** | **0** | **null** | no `src` attribute |
| gallery (×1) | `#lightboxImg` | parent **`none`** | **0** | null | `src=""` |

Root causes, both correct and intentional:

1. **Six gallery-preview mounts (home + contact).** Only **1 of 13** gallery rows is
   `is_active AND is_featured`, but the static markup provides **4** preview mounts. The surplus
   three are intentionally hidden by `populateGalleryPreview()`, which sets
   `mount.style.display = 'none'` when *"Fewer canonical rows than preview mounts"*, explicitly so
   that *"a stale hardcoded image cannot compete with canonical media"*. The `<img>` inside a
   hidden mount is inert.
2. **`#lightboxImg` (gallery).** A lightbox image element with `src=""` in static markup; it is
   populated only when a visitor opens an image. Its container is `display:none` until then.

My earlier probe classified these as broken because it tested `naturalWidth === 0`, which is true
for any `display:none` image. The "7 empty src" finding was a **measurement artifact of my own
probe**, not a product defect. Recorded as RETRACTED with evidence.

**No change was made for F-2**, because there is nothing to change.

---

## Runtime

Pages tested (Node server `:8021`, read-only, no form submission): `/`, `restaurant.html`,
`restaurant-menu.html`, `lounge.html`, `gallery.html`, `contact.html`, `conference.html`,
`vip.html`.

| Page | HTTP | 404s | Console errors | Failed requests | Visible broken images |
|---|---|---|---|---|---|
| home | 200 | 0 | 0 | 0 | 0 |
| restaurant | 200 | 0 | 0 | 0 | 0 |
| restaurant-menu | 200 | 0 | 0 | 0 | 0 |
| lounge | 200 | 0 | 0 | 0 | 0 |
| gallery | 200 | 0 | 0 | 0 | 0 |
| contact | 200 | 0 | 0 | 0 | 0 |
| conference | 200 | 0 | 0 | 0 | 0 |
| vip | 200 | 0 | 0 | 0 | 0 |

`node --check assets/js/content-loader.js` → **SYNTAX OK**.
Remaining `placeholder-service` references in source: **0**.

---

## Regression

| Surface | Before | After | Verdict |
|---|---|---|---|
| Service cards | 12 (home/gallery/contact) | **12** | unchanged |
| Service card images | 12 (1 broken) | **11** (0 broken) | intended |
| Gallery grid (`#galleryGrid`) | 13 visible | **13** | unchanged |
| Gallery preview | 1 visible | **1** | unchanged |
| Menu (restaurant / lounge) | 11 / 2 | **11 / 2** | unchanged |
| Hero | renders on all hosting pages | unchanged | unchanged |
| Membership | 4 plans (home) | **4** | unchanged |
| Promotions | 1 banner (home) | **1** | unchanged |
| DB rows (menu / services / gallery / categories) | 14 / 12 / 13 / 10 | identical | unchanged |
| Admin repo | untouched | untouched | unchanged |

Canonical media integrity preserved: every **visible** image on all 8 pages resolves through a
`/storage/v1/object/` `public_url`; non-Storage visible images = **0** on every page. No hardcoded
Storage URL was introduced and no `media_id` reference was converted to a static URL.

Verified scope: the eight public surfaces listed above. No authenticated Admin surface was tested
(no authorized session; not required, not attempted).

---

## Change scope

- **Application files changed: 1** — `assets/js/content-loader.js`
- **Asset files changed: 0** — no placeholder asset was created
- **Database writes: 0**
- **Schema changes: 0** · migrations: 0 · RLS: 0
- Admin repo, auth, roles, hero/menu/membership/booking/promotions, page-scope architecture and
  media authorization: **untouched**

## Git safety

- Public HEAD `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c` — **unchanged**
- Branch `feature/membership-tiers-staging-phase1` — unchanged
- No `reset` / `clean` / `stash` / `restore` / `checkout` / `rebase`
- All pre-existing dirty work preserved; the edit was a targeted single-block replacement
| Console errors | 1 / 1 / 1 | **0 / 0 / 0** |
| Failed requests | 0 / 0 / 1 | **0 / 0 / 0** |
| Service-card broken image | 1 / 1 / 1 | **0 / 0 / 0** |
| Total `<img>` in DOM | 22 / 21 / 32 | 21 / 20 / 31 (−1 each, the removed placeholder `<img>`) |

Service card count unchanged at **12**; service-card images now **11** on home, contact and
gallery — exactly matching the 11 of 12 services that carry `media_id`. `Classic Haircut` now
renders as a text card instead of a broken image.