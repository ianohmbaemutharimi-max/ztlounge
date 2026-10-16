# PHASE 2 — FINAL CLOSURE REPORT
## Public Data Delivery Pipeline + Home Hero

> Scope: the public `zt-lounge` website Home Hero pipeline only.
> This file is the authoritative closure report for the **Phase 2 (Hero public-data pipeline)**
> track. It is intentionally distinct from the separate `zt-lounge-admin` authorization/invitation
> report of the same series name; that auth track is explicitly **out of scope** here.

---

## 1. Final Status

**PHASE 2 — CLOSED**

The Phase 2 (Public Data Delivery Pipeline + Home Hero) end-to-end invariant holds to the level
supported by the available evidence (live database probe + a fresh Playwright/Chromium runtime
capture against a local server serving the working tree).

| Test | Required | Evidence | Classification |
|---|---|---|---|
| A — Home Hero exists | Hero renders | `data-hero-state="ok"`, 2 slides, `.hero-slide` present | RUNTIME-VERIFIED |
| B — Hero image is canonical | bg-image = `media_assets.public_url` | DOM bg-image = hero-restaurant.webp; DB `image_url` = NULL; network shows hero_slides→media_assets | RUNTIME-VERIFIED |
| C — Page ownership | Home uses Home slides | `hero_slides.page_id = e5186de1...` (home UUID) | RUNTIME-VERIFIED |
| D — Ordering | DB order honored | display_order ASC; slide 0 active first | RUNTIME-VERIFIED |
| E — Active state | inactive excluded | `is_active=true` query; only active rows returned | SOURCE + runtime |
| F — Empty/missing | no broken output | `state:'empty'`/`'unavailable'` controlled paths in source | SOURCE-VERIFIED |
| G — Regression sanity | homepage intact | 7 of 9 homepage sections 200 from canonical | RUNTIME-VERIFIED |
| Typecheck | `npx tsc --noEmit` = 0 errors | EXIT=0, zero diagnostics (after fix) | RUNTIME-VERIFIED |

---

## 2. Baseline

| Item | Value | Source |
|---|---|---|
| Public repo / branch | `zt-lounge` · `feature/membership-tiers-staging-phase1` | `git rev-parse --abbrev-ref HEAD` |
| Public HEAD | `905bd7a fix: align testimonials UI with database schema and manager RBAC` | `git log -1` |
| Public runtime | `http://127.0.0.1:8765/` (local static server, working tree) | probe |
| Admin repo / branch | `zt-lounge-admin` · `clean-rebuild` · HEAD `876b185` | `git rev-parse --abbrev-ref HEAD`; `git log -1` |
| Canonical Supabase project | `jczwilrysvnhcjzjztbi` (`https://jczwilrysvnhcjzjztbi.supabase.co`) | `env.js` + network capture |
| Anon key role | `anon` (RLS-protected); **no** `service_role` in any browser file | `env.js` / `supabase.config.js` |
| Date/time of verification | 2026-09-29 | — |

**Pre-existing dirty working tree** (573 entries; the Phase 2 Hero files are `M`/`??` but never
committed — see R3 in `PHASE2_PUBLIC_HERO_PROGRESS.md`). Per the dirty-repository rule, **no**
`reset` / `clean` / `stash` / `checkout` / `commit` was performed. The Hero pipeline sources
read here are exactly what the runtime served.

---

## 3. Confirmed Implementation

No new Hero subsystem was introduced. The existing pipeline is reused end-to-end:

| Layer | File | Responsibility |
|---|---|---|
| Bootstrap order | `index.html` | loads `theme-init.js` → (CMS shell) `supabase-js.js` → `env.js` → `supabase.config.js` → `page-identity.js` → `PageResolver.js` → `MediaResolver.js` → … → `content-loader.js` |
| Supabase browser client | `assets/js/lib/supabase-js.js` (+`lib/supabase.js` wrapper) | anon key, `persistSession:false`, no service_role |
| Canonical config | `assets/js/config/env.js` | injects canonical `jczwilrysvnhcjzjztbi` URL/anonKey for localhost |
| Page identity (page_key→PageId) | `assets/js/lib/page-identity.js` | `<body data-page="home">` validated against `PAGE_IDS`; exact-basename fallback; never guesses |
| Page resolution (PageId→UUID) | `assets/js/repositories/PageResolver.js` | `resolvePageRecord`/`requirePageUuid`; caches `cache[pageId]` + in-flight `inFlight[pageId]` dedupe; Phase 2C column 400 → legacy fallback, fail-open |
| Hero data access | `assets/js/repositories/HeroRepository.js` | `getByPage(pageId)` → `requirePageUuid` → `hero_slides` `select=*` WHERE `page_id=UUID AND is_active=true` ORDER BY `display_order` ASC; states `ok`/`empty`/`unavailable` |
| Media resolution | `assets/js/repositories/MediaResolver.js` | **single** path `media_id → media_assets.public_url`; batched, cached; canonical wins over legacy `image_url` |
| Hero renderer | `assets/js/content-loader.js` → `populateHero()` | generates `.hero-slide` DOM from DB rows; sets `data-hero-state/count`; bg-image from resolved `slide.image_url` |

---

## 4. Confirmed Fixes

Only **one** surgical source change was made in this closure pass, chosen because it is the
single typecheck gate the task makes mandatory. No Hero/pipeline/runtime file was altered.

| # | File | Change | Reason |
|---|---|---|---|
| 1 | `zt-lounge-admin/src/lib/images/processor.ts` | Added `promotions: 1920` and `memberships: 800` entries to `CATEGORY_MAX_WIDTHS: Record<ImageCategory, number>` (with explanatory comment) | `ImageCategory` allowlist in `@/lib/storage/paths` was extended to 8 categories (`hero, gallery, menu, services, testimonials, branding, promotions, memberships`) but `CATEGORY_MAX_WIDTHS` only declared 6 → `TS2739` at line 36. This is the "known remaining Phase 2 typecheck issue"; completing the `Record` is a type-safety fix with **no behavior change** to any existing category including `hero`. Required for the `npx tsc --noEmit` = 0 gate. |

No other source file was modified. `env.js` was already corrected to the canonical project in
prior work (the single blocking defect from `PHASE2_PUBLIC_HERO_PROGRESS.md` §B.2) — it was
re-verified as canonical in the runtime capture (§8) and was **not** re-edited.

---

## 5. Database Evidence (live, read-only REST with the public anon key)

Against `https://jczwilrysvnhcjzjztbi.supabase.co/rest/v1/` (the same anon key the browser uses):

```
website_pages?select=id,page_key&limit=100  → 200
  id=e5186de1-a199-476f-abe2-a3f8b21c6120  page_key=home
  (also restaurant, lounge, vip, events, conference, grooming-care, gallery, contact)

website_pages?...service_cards_enabled,service_packages_enabled&page_key=eq.home → 400  (42703; Phase 2C columns — see §10)
website_pages?select=id,page_key,title&page_key=eq.home → 200   (PageResolver legacy fallback)
  id=e5186de1-a199-476f-abe2-a3f8b21c6120  page_key=home  title=ZT Lounge Home

hero_slides?...page_id=eq.e5186de1-a199-476f-abe2-a3f8b21c6120&is_active=eq.true&order=display_order.asc → 200
  [0] display_order=0  title="ZT Lounge Meru"  badge="Meru's Finest"
      media_id=ce0458d4-2275-40a7-b82c-f367922d1d0b  is_active=true  image_url=NULL
  [1] display_order=1  title="best place"  badge="Night Experience"
      media_id=141ce2ea-6bf1-463d-a390-5faf426a74d4  is_active=true  image_url=NULL

media_assets?id=eq.ce0458d4-2275-40a7-b82c-f367922d1d0b → 200
  public_url = https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/hero-images/hero-restaurant.webp
  alt_text   = "ZT Lounge Meru - Premium Hospitality Logo"

media_assets?id=eq.141ce2ea-6bf1-463d-a390-5faf426a74d4 → 200
  public_url = https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/hero-images/hero-lounge.webp
  alt_text   = "ZT Lounge Nightlife Experience"
```

Key facts: `hero_slides.image_url` is **NULL** for both rows → the rendered Hero image can ONLY have
come from `media_id → media_assets.public_url`. Both slides are `is_active=true`, so the active-
filter leaves both in repository order. 9 total Hero rows exist in the DB; 2 belong to `home`.

---

## 6. Public Pipeline Evidence (the real execution path)

Traced from source + black-box network capture (§8):

```
index.html served at /  (body data-page="home")
  └─ PageIdentity.getCanonicalPageId() -> "home"   (page-identity.js:128)
  └─ populateHero()                                (content-loader.js:341)
       └─ getPageId() -> "home"
       └─ HeroRepository.getByPage("home")        (HeroRepository.js:129)
            └─ PageResolver.requirePageUuid("home") (PageResolver.js:144)
                 └─ resolvePageRecord("home")
                      PHASE2C_COLUMNS query -> 400 (42703: service_cards_enabled missing)
                      fallback -> LEGACY_COLUMNS query -> 200 -> {state:'resolved', id:'e5186de1...'}
                      (inFlight[pageId] dedupe prevents concurrent duplicates of this lookup)
            └─ BaseRepository.getAll({page_id=eq.e5186de1..., is_active=eq.true, order:display_order})
                 -> GET hero_slides?...&page_id=eq.e5186de1...&is_active=eq.true&order=display_order.asc -> 200 (2 rows)
            └─ resolveMedia(data.map(mapToUI))
                 -> MediaResolver.resolveCollection -> GET media_assets?id=in.(ce0458d4...,141ce2ea...) -> 200
                 -> overwrites each slide.image_url with media_assets.public_url
       └─ renders .hero-slide per row (display_order ASC), first slide .active
            -> slideEl.style.backgroundImage = url("<public_url>")
            -> dispatches DOM CustomEvent('hero:rendered', {state,count})
```

The path uses `window.HeroRepository`/`PageResolver`/`MediaResolver` (the canonical modules),
never a local config array. `window.HeroConfig` is no longer consulted as a hero source
(HeroRepository documents this). The Hero query is `select=*` (independent of the Phase 2C
toggle columns), so the missing-toggle-column 400 only affects the page-UUID lookup, which
PageResolver recovers via the documented legacy fallback.

---

## 7. Hero Evidence

| Aspect | Value | Evidence |
|---|---|---|
| Page | `home` (`data-page="home"`) | page-identity.js + DB `page_key=home` |
| Page UUID | `e5186de1-a199-476f-abe2-a3f8b21c6120` | `website_pages` 200; used in `hero_slides.page_id=eq.` |
| Slides (home, active, ordered) | 2 | `hero_slides` 200, `is_active=true`, `display_order` 0→1 |
| Ordering | DB `display_order ASC` honored | slide 0 rendered as first/active; slide 1 second |
| Active filtering | only `is_active=true` returned | repository query; 2 of 9 total rows belong to home |
| media_id | `ce0458d4…`, `141ce2ea…` | present on both rows |
| public_url (resolved) | hero-restaurant.webp / hero-lounge.webp | MediaResolver batch → `media_assets.public_url` 200 |
| DOM image | `background-image: url("…/hero-images/hero-restaurant.webp")` | Playwright DOM snapshot (§8) |
| Legacy image_url | NULL on both rows | DB probe — image came from media_id, not image_url |
| data-hero-state | `ok` | DOM attribute (Playwright) |
| Empty/missing | `state:'empty'`/`'unavailable'`, controls hidden, no broken image | source (content-loader.js:364-372, HeroRepository.js:121-163) |

No hardcoded Hero media. No static Hero data driving the page. The HTML contains only the
`.hero-slider` shell (no `<img>`/inline slides); the slide count is decided by the DB result.

---

## 8. Typecheck Evidence

The Phase 2 (Hero) implementation itself is pure client-side JavaScript (the public repo has
no `tsconfig.json` and no `.ts` in the Hero pipeline). The workspace’s canonical TypeScript
typecheck is the `zt-lounge-admin` Next.js app.

**Command:** `npx tsc --noEmit -p tsconfig.json` (run from `zt-lounge-admin`)

| Stage | Exit | Diagnostics | Notes |
|---|---|---|---|
| Before fix | 1 | 1 error: `processor.ts(36,14) error TS2739` — `Record<ImageCategory, number>` missing `promotions`, `memberships` | pre-existing "known remaining Phase 2 typecheck issue" |
| After fix (§4) | 0 | none | `src/lib/images/processor.ts` edited only |

Exit code `0`, empty stdout (zero diagnostics), empty stderr. Re-verified on two independent
invocations. The fix is a type-allowlist completion; it does **not** alter resize behaviour for
the `hero` (or any pre-existing) image category. No `@ts-ignore` or suppression was used.

---

## 9. Runtime Evidence (fresh, 2026-09-29)

- **URL:** `http://127.0.0.1:8765/` — local static server rooted at `zt-lounge` working tree,
  serving the real `index.html` + all Hero pipeline JS (not a mock).
- **Viewport:** 1400×950, Chromium, headless.
- **Method:** Playwright (`require('playwright')` `chromium`). Read-only DB access (anon key);
  **no** DB writes, no data mutation.

### Observed outcome

```
Hero DOM:
  hasSlider           : true
  data-hero-state     : "ok"
  data-hero-count     : "2"
  slideCount          : 2
  activeCount         : 1                 (first slide .active)
  firstBg             : url("https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/hero-images/hero-restaurant.webp")
  supabaseUrl (runtime): "https://jczwilrysvnhcjzjztbi.supabase.co"   (canonical, NOT staging)
  pageId              : "home"
```

### Intercepted canonical REST calls (status)

| Call | Status |
|---|---|
| `website_pages?...page_key=eq.home` (PHASE2C columns) | 400 (42703) → fallback |
| `website_pages?select=id,page_key,title&page_key=eq.home` (legacy fallback) | 200 → UUID `e5186de1…` |
| `hero_slides?...page_id=eq.e5186de1-a199-476f-abe2-a3f8b21c6120&is_active=eq.true&order=display_order.asc` | 200 (2 slides) |
| `media_assets?...id=in.(ce0458d4…,141ce2ea…)` | 200 (public_url resolved) |
| `business_settings`, `membership_plans`, `testimonials`, `menu_categories`, `services`, `gallery`, `promotions`, `faqs` (home) | all 200 |

Trace: `hero_slides` requested with `page_id=eq.<home UUID>` → proves **page ownership**
(Home fetched Home's slides). The rendered `background-image` equals the `public_url` of
`media_id=ce0458d4`, which the live DB reports with `image_url=NULL` → the pixel came through
`media_id → media_assets.public_url`, i.e. the canonical relationship.

### Console / regression
- Console resource errors: three `400` (the expected Phase 2C `website_pages` feature-flag
  query on `home`/`gallery`, both recovered by the legacy fallback — see §10) and one `404`
  (`placeholder-service.webp`, known cosmetic R2).
- **No JS exceptions / page errors.** `pageId` resolves to `home`; the whole homepage
  (Hero + gallery + services + promotions + business settings + membership + testimonials)
  populated from the canonical project → regression sanity pass (G).

Note: the Hero pipeline dispatches a DOM `CustomEvent('hero:rendered')`, not a `console` call,
so a console-text listener for that event is naturally non-firing; the `HERO_DOM` snapshot
(state `ok`, count 2) is the authoritative render proof.

---

## 10. Limitations

1. **Admin→Public live link not exercised.** Editing a Hero slide in the Admin CMS → Supabase
   → public Hero was **not** performed. The Admin CMS is read-only for this task and a live edit
   would mutate real business content with no safe/non-destructive test mechanism. The equivalent
   contract is proved by source wiring + the live DB round-trip (DB rows ⇒ rendered DOM via the
   exact Admin-same `hero_slides`/`media_assets` tables). No runtime Admin→Public edit claim is
   made.
2. **Inactive / empty-state runtime not force-exercised.** Proving the `is_active=false`
   exclusion or the empty page would require DB writes (forbidden) or removing the real Home
   slides (forbidden — "Do not insert/delete existing slides"). Behaviour is covered in source
   (`is_active=eq.true` query; `state:'empty'`/`'unavailable'` controlled paths).
3. **Two-failure rule kept in budget.** Command-execution had PowerShell quote/separator hiccups
   (`&&`, bare `tsc` not on PATH); each was diagnosed to a concrete cause and re-run successfully.
   The reliable paths (REST probe, Playwright) succeeded on first real attempt.
4. **Untracked files (R3).** `PageResolver.js` and `MediaResolver.js` are untracked (`??`) in
   the public repo; the Hero pipeline depends on working-tree-only files. A `git clean -fd`
   would remove the data layer. **Left untouched** per the dirty-repository rule — recorded as
   a deployment/hygiene risk, not a functional closure blocker.

---

## 11. Remaining Issues (Phase 2 scope only)

1. **`website_pages` Phase 2C feature-flag columns are not deployed.** `service_cards_enabled`
   / `service_packages_enabled` do not exist on the live `website_pages` table
   (`400 / 42703`). `PageResolver` handles this with a documented legacy-column fallback that
   **fails open** (both sections default enabled), so Home Hero and all page resolution keep
   working. This is the Phase 2C (Services) toggle task, explicitly **out of scope** here; it
   is recorded solely because it surfaces as a `400` in the browser network log. **Does not
   block Phase 2 (Hero) closure.**
   - Owner/fix: deploy migration
     `zt-lounge/supabase/migrations/20260925120000_phase2c_service_section_toggles.sql`
     (both `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements), or reconcile the remote
     migration ledger. Out of Phase 2 (Hero) hands.
2. **Untracked Hero data-layer files (R3)** — see Limitations §4. A deliberate commit/stash
   decision is required before any cleanup. Out of scope for this Phase 2 pass.

No other Phase 2 (Public Data Delivery Pipeline + Home Hero) invariants are outstanding.
Services, Gallery, Promotions (admin side), Bookings, Membership, Notifications, Team, and
schema/migration work were all left untouched.

---

## 12. Phase 2 End-to-End Invariant

```
Canonical Supabase (jczwilrysvnhcjzjztbi)
   ↓ website_pages(page_key='home')
   ↓ hero_slides(page_id=home-uuid, is_active=true, ORDER BY display_order ASC)
   ↓ media_id
   ↓ media_assets(id) → public_url
   ↓ MediaResolver.resolveCollection (canonical wins; image_url=NULL)
   ↓ public data pipeline (HeroRepository → content-loader populateHero)
   ↓ Home Hero → browser (background-image = media_assets.public_url)
```

Satisfied:
- ✅ NO HARDCODED HERO MEDIA (image_url is NULL; bg-image = resolved public_url)
- ✅ NO STATIC HERO DATA DRIVING THE PAGE (HTML holds only the `.hero-slider` shell; slides generated from DB)
- ✅ NO WRONG PAGE HERO (`page_id=eq.<home UUID>`; `pageId=home`)
- ✅ NO LEGACY `image_url` DEPENDENCY (NULL; resolved via `media_id → media_assets`)
- ✅ NO UNVERIFIED "PASS" (live DB probe + fresh Playwright capture)

## 13. Closure Decision

Every required Phase 2 (Public Data Delivery Pipeline + Home Hero) invariant has evidence
below the level required: canonical config, live canonical DB data, source-wired canonical
pipeline, fresh browser runtime, and a clean typecheck.

**PHASE 2 — CLOSED**

(Closure of the **separate** Phase 2C service-toggle columns and the **separate** Admin
authorization/RPC track are not addressed here — they are out of scope for the Home Hero
pipeline, and the typecheck fix in §4 is a type-safety completion that does not alter Hero
behaviour.)
