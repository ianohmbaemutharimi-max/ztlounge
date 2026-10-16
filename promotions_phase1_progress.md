# PROMOTIONS PHASE 1 — PROGRESS LOG

**Date:** 2026-09-22
**Mode:** Implementation (surgical, findings-scoped)
**Admin (canonical):** `D:\zt lounge\zt-lounge-demo\zt-lounge-admin`
**Public:** `D:\zt lounge\zt-lounge-demo\zt-lounge`
**Duplicate legacy admin tree:** `…\zt-lounge\zt-lounge-admin` — **NOT touched** (verified unchanged)

---

## 1. Findings addressed

| # | Finding | Status |
|---|---|---|
| 1 | Floating offer has the wrong destination | **IMPLEMENTED** |
| 2 | Homepage promotion has no CTA | **IMPLEMENTED** |
| 3 | `show_on_homepage` incorrectly coupled to `page_id` | **IMPLEMENTED** |
| 4 | Floating offer coupled to page targeting | **IMPLEMENTED** |
| 7 | Admin Placement selector allows unreachable pages | **IMPLEMENTED** |
| 11 | Promotion image only renders on homepage | **IMPLEMENTED** |

Routing investigation (the `website_pages.id → public route` gap): **RESOLVED** by extending
existing architecture. No new schema field, no new promotion route, no new media path.

---

## 2. Files modified

### Public repo (`D:\zt lounge\zt-lounge-demo\zt-lounge`)

| File | Change |
|---|---|
| `assets/js/lib/page-identity.js` | **Outbound identity added.** New `PAGE_ROUTES` map (PageId / `website_pages.page_key` → served public HTML route) + `pageHrefForPageKey(pageKey)`; both exported. |
| `assets/js/repositories/PageResolver.js` | **Inverse lookup added.** New `byIdCache`, `resolvePageKeysByIds(ids)` (one batched `website_pages.select('id,page_key').in('id', ids)`, cached per document, never rejects) and `resolvePageKeyById(id)`; both exported. Header documents the new outbound direction. |
| `assets/js/content-loader.js` | Promotion subsystem rewritten (see §3). |

### Admin repo (`D:\zt lounge\zt-lounge-demo\zt-lounge-admin`)

| File | Change |
|---|---|
| `src/lib/constants/public-pages.ts` | **NEW.** `PUBLIC_PAGE_KEYS` + `isPublicPageKey()` — the single place the Admin records which page keys have a served public page. Mirrors `page-identity.js`. |
| `src/features/promotions/promotions-view.tsx` | Placement selector restricted to resolvable keys; unreachable-target warning added. |

### Unchanged by design

- `assets/js/repositories/PromotionRepository.js` — canonical data path preserved (§5).
- `assets/js/repositories/MediaResolver.js`, `assets/js/lib/BaseRepository.js` — media path untouched.
- `src/db/schema.ts`, all migrations, `src/lib/repository.ts` allowlists — no schema/allowlist edits.
- The duplicate nested admin tree — untouched.

## 3. Exact changes

### 3.1 Canonical destination resolver (Findings 1 + 2; single source of truth)

```
promotion.page_id
  → website_pages.id            (already present as promotion.page_id)
  → website_pages.page_key      PageResolver.resolvePageKeysByIds   [NEW batched query]
  → served public HTML route    PageIdentity.pageHrefForPageKey     [NEW static map]
  → href at current depth       siteRootPrefix()/siteHref()         [extracted from promoHomeHref]
```

`content-loader.js` now has exactly ONE destination builder:

```js
function promoDestination(promo, pageKeyById) {
    var pageId = promo && promo.page_id;
    if (pageId && pageKeyById) {
        var pageKey = pageKeyById[pageId] || null;
        var route = (pageKey && window.PageIdentity && window.PageIdentity.pageHrefForPageKey)
            ? window.PageIdentity.pageHrefForPageKey(pageKey) : null;
        if (route) return { href: siteHref(route), pageKey: pageKey, targeted: true };
    }
    return { href: promoHomeHref(), pageKey: null, targeted: false };   // page_id = NULL fallback
}
```

- `promoHomeHref()` behaviour is byte-identical to before (`#promotions` at root,
  `<up>index.html#promotions` when nested) — it is now the documented fallback only.
- Used by **all three** surfaces. No other route-building logic exists in the file.

### 3.2 Floating offer (Findings 1 + 4)

- `isPromoForCurrentPage` removed entirely (the shared predicate is gone from shipped code).
- `renderGlobalPromoStickers(eligible, pageKeyById)` — no longer takes the current page;
  visibility = **canonical eligibility only** (everything `PromotionRepository.getEligible()`
  returned). It cannot widen visibility: inactive / expired / not-yet-started rows never
  reach it, so no historical promotion is resurrected.
- Each sticker: `href = promoDestination(p, pageKeyById).href`, plus `data-promotion-page-id`
  and `data-promotion-destination` for DB↔UI reconciliation and runtime assertions.
- `.zt-promo-stickers` gained `max-height:calc(100vh - 32px);overflow-y:auto` so a
  multi-promotion set cannot push stickers off-screen (presentational only — never hides a
  promotion).

### 3.3 Homepage group (Findings 2 + 3)

- Membership rule is now **`show_on_homepage === true` only**:
  `homepagePromos = (eligible || []).filter(p => p && p.show_on_homepage === true)`
- The card is an anchor (`<a class="zt-promo-card" href=…>`) produced by ONE shared template
  `promoCardHTML(p, pageKeyById)` with a `.zt-promo-cta` line. Clicking the homepage
  promotion opens its associated page (or the promotions fallback when `page_id = NULL`).
- The empty branch now clears `grid.innerHTML` so a stale render cannot survive a re-run.

### 3.4 Associated-page surface (Finding 11)

- New `renderPagePromoGroup(eligible, currentPageUuid, pageKeyById)` injects
  `<section id="zt-page-promotions" class="zt-page-promotions">` into `<main id="main">`
  (verified present on all 10 served pages; fallback `querySelector('main')` → `body`).
- Contents: canonical image (`p.image_url`, already resolved by `MediaResolver`), discount,
  title, description, dates, CTA — all via the shared `promoCardHTML`.
- Independent by construction: never reads `show_on_homepage`, never touches
  `#promotions-grid`, returns early when the current page UUID is unknown, and skips the
  homepage (which owns `#promotions-grid`) so nothing double-renders.
- Reuses existing site classes `.container`, `.section-header`, `.section-tag`,
  `.section-title`, `.promotions-grid`, `.zt-promo-card` (all global — verified in
  `theme.css` / `layout.css` / `typography.css`).

### 3.5 Entry point

```js
populatePromotions()   // ONE repository call + ONE batched page-key lookup
  → resolveCurrentPageUuid()
  → PromotionRepository.getEligible()          // unchanged canonical path
  → resolvePromoPageKeys(eligible)             // NEW batched inverse lookup
  → renderGlobalPromoStickers(eligible, pageKeyById)
  → renderHomepagePromoGroup(eligible, pageKeyById)
  → renderPagePromoGroup(eligible, currentPageUuid, pageKeyById)
```

### 3.6 Admin placement safety (Finding 7)

- `promotions-view.tsx`: `placementPages = (pages.data ?? []).filter(p => isPublicPageKey(p.page_key))`
  drives the Placement `<select>`. `barbershop` and `autospa` are therefore not offerable.
- If an existing promotion already targets a non-resolvable page, the select shows a rose
  warning instead of silently rewriting the stored `page_id`. No data is mutated on load.
- No DB rows deleted; no schema change; no `website_pages` writes.

## 4. Tests attempted

## RUNTIME VERIFICATION BLOCKED

Every shell invocation failed with no observable output:

`Command completion could not be observed; the command may still be running…` / `Command exited with code 1`

| # | Attempt | Result |
|---|---|---|
| 1 | `node -e "console.log('shell probe')"` | blocked |
| 2 | `Write-Output ZT_PROBE_OK` | blocked |
| 3 | `node -e …` (earlier in loop) | blocked |
| 4 | `cmd.exe /c dir /s /b "…\zt-lounge-admin\supabase"` | blocked |
| 5 | `cmd /c dir /b "…\zt-lounge-admin"` | blocked |
| 6 | `Set-Location '…'; Get-ChildItem -Force` | blocked |
| 7 | `Get-ChildItem -Path '…' -Depth 0` | blocked |
| 8 | `echo hello` | blocked |
| 9 | `Get-ChildItem -Path '…\zt-lounge'` | blocked |

Same failure mode recorded by a prior loop (`_media_management_audit.md:301`).

**Consequently NOT executed:** admin `npm run dev` (:3000), public static server (:8080),
Playwright/Chrome, `tsc --noEmit`, `eslint`, any Supabase REST query, any DB probe.
**No Playwright evidence exists for this loop. Nothing was fabricated.**

### Tests: passed

Static verification only (disk reads + repo-wide exact-string searches):

| Check | Evidence |
|---|---|
| `isPromoForCurrentPage` fully removed from shipped code | repo-wide search → only `dif.txt` / `_l68_chain3.txt` (historical debris `.txt`), zero hits in `assets/js/**` |
| Single destination builder | `promoDestination` defined once (`content-loader.js:1487`), called at `:1564` (sticker) and `:1598` (shared card template) |
| `PAGE_ROUTES` + `pageHrefForPageKey` exported | `page-identity.js:97-108, 162-167, 172, 177` |
| `resolvePageKeysByIds` + `byIdCache` declared & exported | `PageResolver.js:27, 104-154` |
| All 10 served pages provide the injection host | `<main id="main" role="main">` in `index.html:234`, `restaurant:580`, `restaurant-menu:412`, `lounge:613`, `vip:560`, `events:448`, `conference:492`, `grooming-care:117`, `gallery:652`, `contact:546` |
| Reused chrome classes are global, not scoped | `.container` (`theme.css:874`, `layout.css:9`), `.section-header` (`theme.css:991`, `layout.css:98`), `.section-tag` (`theme.css:996`, `typography.css:92`) |
| Admin wiring | `promotions-view.tsx:15` import, `:91` `placementPages`, `:310` map, `:319-326` warning |
| Canonical data path untouched | `PromotionRepository.js` not edited in this loop |

### Tests: blocked (require runtime)

| # | Test | Status |
|---|---|---|
| 1 | Homepage shows TEST PROMOTION + canonical image + clickable | **BLOCKED** |
| 2 | Homepage click → Restaurant page (not `homepage#promotions`) | **BLOCKED** |
| 3 | Restaurant page shows promotion + image + title + discount | **BLOCKED** |
| 4 | Lounge page floating offer → click → Restaurant page | **BLOCKED** |
| 5 | `show_on_homepage=false` removes homepage entry but keeps page/global behaviour | **BLOCKED** |
| 6 | Admin Placement no longer offers Barbershop / Auto Spa | **BLOCKED** |

Static trace for each (explicitly NOT a substitute for runtime):

- **Test 2** — `promoDestination` with `page_id = <restaurant UUID>` on `/`:
  `pageKeyById[restaurant UUID] = 'restaurant'` → `pageHrefForPageKey('restaurant') =
  'pages/experiences/restaurant.html'` → `siteHref` prefix `''` → **`pages/experiences/restaurant.html`**.
- **Test 4** — same promotion on `/pages/experiences/lounge.html`: prefix `'../../'` →
  **`../../pages/experiences/restaurant.html`** (resolves to root + route). The sticker list
  is no longer page-filtered, so the offer is present on Lounge.
- **Test 5** — `show_on_homepage=false`: homepage filter excludes it (the `page_id` term is no
  longer part of that rule); sticker list unfiltered → still rendered; `renderPagePromoGroup`
  keys on `page_id === currentPageUuid` only → still rendered on Restaurant.
- **Test 6** — `isPublicPageKey('barbershop') === false`, `isPublicPageKey('autospa') === false`
  → both filtered out of `placementPages`.

---

## 5. Canonical data path — preserved (unchanged)

```
PromotionRepository.getEligible()
  → promotions (select *, order display_order asc)
  → isEligible()      is_active && Nairobi business date window
  → mapToUI()         media_id, page_id, show_on_homepage, display_order …
  → MediaResolver.resolveCollection → media_assets.public_url → p.image_url
```
Not modified. `MediaResolver.js`, `BaseRepository.js` and `PromotionRepository.js` were not
edited this loop. No `banner_image`, no new image field, no second media query.

---

## 6. Remaining issues (Promotions-relevant only)

1. **`getHomepageEligible()` is now provably redundant, not divergent.** It filters on
   `show_on_homepage` alone — which is now exactly the live homepage rule. It remains
   exported and uncalled. Deferred to the cleanup loop per instruction.
2. **`website_pages.restaurant-menu` has no row** (audit Finding 7 reverse mismatch). The
   page is served and `PAGE_ROUTES` / `PUBLIC_PAGE_KEYS` include it, so it will work the
   moment a row exists — but until then no promotion can target it. Requires a DB row
   (out of scope this loop).
3. **`promotions.start_time` / `end_time` remain collected-then-dropped** (audit F-5).
   Untouched: fixing it means either schema work or removing the admin inputs.
4. **`promotions` RLS policy `promotions_public_read` still unverifiable** (audit F-6) — no
   migration in either repo creates it. Cannot be resolved without DB access.
5. **`banner_image` still returned by `RESPONSE_ALLOWLISTS.promotions`** (audit F-13),
   read-only and unread by the public site.
6. **Admin promotions list still capped at 10 rows with no pagination** (audit F-9).
7. **Associated-page card self-links** when the visitor is already on the promotion's target
   page (the Restaurant card links to the Restaurant page). This is the honest output of one
   destination resolver; special-casing the current page would diverge the surfaces.
8. **One extra network request per page load** when any eligible promotion has a `page_id`:
   `website_pages?select=id,page_key&id=in.(…)`. Batched and cached per document; no N+1.
9. **Associated-page section placement** is at the end of `<main>` (above the footer). If a
   more prominent slot is wanted that is a layout decision, not an architecture change.
10. **`PUBLIC_PAGE_KEYS` is a cross-repo mirror.** The Admin is a separate deployment and
    cannot import `page-identity.js`; the constant is commented to point at its source of
    truth and must be updated in lockstep when a public page ships or is removed.

---

## 7. Status

**PHASE 1 BLOCKED — REQUIRES INVESTIGATION**

All six findings are implemented and statically verified from disk. Runtime verification
could not be performed because this environment cannot execute shell commands (9 attempts,
all invocation forms). Do not treat the promotion flow as verified until Tests 1–6 run
against a live admin + public server.

**Information required to unblock:** a working command-execution channel (or a CI/manual run
of the admin dev server on :3000 + static public server on :8080 with Playwright), plus
read-only DB confirmation of (a) whether `20260919_promotions_canonical_media.sql` is
applied and (b) whether any `promotions` RLS policy exists.



