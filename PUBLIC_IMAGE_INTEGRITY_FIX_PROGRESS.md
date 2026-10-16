# PUBLIC IMAGE INTEGRITY FIX — PROGRESS

Append-only. Public repo `feature/membership-tiers-staging-phase1` @ `905bd7a11c87a06...`

---

## 2026-10-03T08:04:27+03:00 — PHASE 1: BASELINE + REPRODUCTION

Recorded HEAD `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c`, dirty 275. Node server `:8021` alive.

Reproduced with a Playwright probe that captures each empty-`src` `<img>` by DOM path
(not just a count):

| Page | HTTP | imgs | empty src | broken | 404 | console err |
|---|---|---|---|---|---|---|
| home | 200 | 22 | 3 | 4 | 1 | 1 |
| contact | 200 | 21 | 3 | 4 | 1 | 1 |
| gallery | 200 | 32 | 1 | 2 | 1 | 1 |

The 404 on all three pages was `assets/images/placeholder-service.webp`.
Every empty-`src` element was identified as
`.gallery-preview-grid > .gallery-preview-item > img` (6) or `#lightboxImg` (1).

---

## 2026-10-03 — PHASE 2: ISOLATION

### F-1
Confirmed the asset does not exist (`placeholder-service.webp`, `placeholder.webp`,
`placeholder.jpg` all absent). Only `content-loader.js:795` references it. Trigger record:
`Classic Haircut` (`media_id` NULL, `image_url` null).

Read the gallery-preview renderer and found the **existing site rule** in the same file:
hide the mount, never emit a broken/fabricated URL, "No placeholder art is invented."
This decided fix shape **C** (omit the image) over **B** (add an asset), which would have
contradicted that rule. Shape **A** was ruled out — no placeholder asset exists anywhere.

Checked CSS before editing: `.service-cards-grid` is `grid-template-columns: repeat(auto-fit, …)`
and `.service-card .card-image` has a fixed height but no grid-row dependency, so removing the
`<img>` cannot disturb card layout.

### F-2 — **RETRACTED**
Wrote a second probe measuring `display`, `offsetParent`, and bounding-box height.

Result: all 6 gallery-preview images are `display:none`, height 0, `offsetParent === null`.
`#lightboxImg` sits in a `display:none` container, height 0.

DB check: **1 of 13** gallery rows is `is_active AND is_featured`, against **4** static mounts —
so 3 mounts are surplus and are intentionally hidden by `populateGalleryPreview()`.

**RETRACTION: the "7 empty `img` src" finding was a measurement artifact of my own earlier
probe**, which tested `naturalWidth === 0` and therefore counted `display:none` images as
broken. Not a product defect. No change made for F-2.

---

## 2026-10-03 — PHASE 3: FIX

Single edit, `assets/js/content-loader.js:792-802`: the no-media branch now yields `''` instead
of a placeholder `<img>`, with a comment citing the established gallery rule.
`node --check` → SYNTAX OK. Remaining `placeholder-service` references in source: **0**.

---

## 2026-10-03 — PHASE 4: AFTER-VERIFICATION

Identical probe re-run:

| Page | HTTP | 404s | console err | failed req | service-card broken |
|---|---|---|---|---|---|
| home | 200 | 0 | 0 | 0 | 0 |
| contact | 200 | 0 | 0 | 0 | 0 |
| gallery | 200 | 0 | 0 | 0 | 0 |

`placeholder-service.webp` 404: **3 pages → 0**. Console errors: **3 → 0**.

---

## 2026-10-03 — PHASE 5: REGRESSION SWEEP (8 surfaces)

All HTTP 200. Every surface: **0 404s, 0 console errors, 0 failed requests, 0 visible broken
images, 0 non-Storage visible images**.

| Surface | Before | After |
|---|---|---|
| Service cards (home/gallery/contact) | 12 | 12 |
| Service card images | 12 (1 broken) | 11 (0 broken) |
| `#galleryGrid` visible | 13 | 13 |
| Gallery preview visible | 1 | 1 |
| Menu restaurant / lounge | 11 / 2 | 11 / 2 |
| Membership (home) | 4 | 4 |
| Promotions (home) | 1 | 1 |
| DB rows | 14 / 12 / 13 / 10 | identical |

DB read-only re-check confirms `Classic Haircut` still has `media_id = NULL`, `image_url = null`
— **no data was written**.

---

## STATUS

**PARTIALLY FIXED.** F-1 fixed and verified by browser evidence. F-2 retracted with evidence.