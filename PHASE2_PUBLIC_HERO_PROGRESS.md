# PHASE 2 — PUBLIC DATA DELIVERY PIPELINE + HOME HERO — PROGRESS LOG

Repository: `D:\zt lounge\zt-lounge-demo\zt-lounge` (public website)
Admin repo: `D:\zt lounge\zt-lounge-demo\zt-lounge-admin` (read-only, not modified)
Canonical Supabase: `jczwilrysvnhcjzjztbi`

---

## A. BASELINE (captured before any change)

| Item | Value |
|---|---|
| Public branch | `feature/membership-tiers-staging-phase1` |
| Public HEAD | `905bd7a fix: align testimonials UI with database schema and manager RBAC` |
| Public dirty tree | **573 entries** — 36 `M`, 94 `D`, 443 `??` |
| Staged entries | **0** (all changes are worktree-only) |
| Public runtime | http://localhost:8000 (HTTP 200) |
| Admin runtime | http://localhost:3000 (HTTP 200) |
| Admin branch | `clean-rebuild` |
| Admin HEAD | `876b185` |

**Pre-existing dirty files that carry the Hero pipeline** (modified/untracked *before* this
phase — NOT created by me):

```
 M assets/js/config/env.js
 M assets/js/config/supabase.config.js
 M assets/js/content-loader.js
 M assets/js/repositories/HeroRepository.js
 M index.html
 ?? assets/js/repositories/MediaResolver.js
 ?? assets/js/repositories/PageResolver.js
```

No reset / clean / stash / checkout / commit / branch switch was performed. All pre-existing
work preserved.

---

## B. AUDIT FINDINGS (read-only, before implementation)

### 1. The data layer already exists — no new system was needed

| Module | Path | Exists |
|---|---|---|
| Supabase browser client | `assets/js/lib/supabase-js.js` | YES |
| Page resolver (`page_key` → `id`) | `assets/js/repositories/PageResolver.js` | YES (untracked) |
| Hero repository | `assets/js/repositories/HeroRepository.js` | YES |
| Media resolver (`media_id` → `public_url`) | `assets/js/repositories/MediaResolver.js` | YES (untracked) |
| Hero renderer (`populateHero`) | `assets/js/shared-components.js` | YES |
| Page bootstrap | `assets/js/content-loader.js` | YES |

**Decision: reuse everything. No duplicate client, repository, or renderer created.**

### 2. CONFIRMED DEFECT — authoritative config pointed at the wrong Supabase project

`assets/js/config/env.js` (loaded by `index.html` *before* `supabase.config.js`) overrode
`window.__SUPABASE_CONFIG` for `localhost` with the staging project:

```
jcxavwuaiywnhpfigvlw  (staging — no CMS tables)
```

Proven impact: every REST call returned
`{"code":"PGRST205","message":"Could not find the table 'public.<x>' in the schema cache"}`
→ `populateHero` received an error, not slides → `data-hero-state="error"` /
`NO_ACTIVE_SLIDES_UNAVAILABLE`.

`assets/js/config/supabase.config.js` already declared the correct canonical defaults, but
`env.js` runs first and won. **This was the single authoritative blocking value.**

### 3. NOT A DEFECT — the chain was already wired in `index.html`

Verified by reading the served HTML and by Playwright: `index.html` loads `content-loader.js`,
which loads `shared-components.js`, which calls `HeroRepository` → `PageResolver` +
`MediaResolver`. The chain did **not** stop at a missing script tag. It stopped at the
project mismatch. **No bootstrap rewrite was performed.**

---

## C. IMPLEMENTATION (one file changed)

### Change 1 — `assets/js/config/env.js` (ONLY file modified)

Replaced the localhost staging-project override with the canonical project, matching the
defaults already in `config/supabase.config.js` and the repo `.env.local`.

- `url`: `https://jczwilrysvnhcjzjztbi.supabase.co`
- `anonKey`: canonical **anon-role** key, JWT `ref` = `jczwilrysvnhcjzjztbi`, `role` = `anon`
- The existing early-return at the top of the IIFE still honours any deploy-time
  `window.__SUPABASE_CONFIG` / `window.__ENV` injection, so deploy override behaviour is
  unchanged.
- No `service_role` key, no schema, no RLS, no seed, no migration touched.


---

## D. VERIFICATION — WHITE BOX (code inspection)

- [x] Browser runtime resolves canonical project — `window.__SUPABASE_CONFIG.url` =
      `https://jczwilrysvnhcjzjztbi.supabase.co` (read live from the browser, not from source)
- [x] Anon key JWT decoded: `{"iss":"supabase","ref":"jczwilrysvnhcjzjztbi","role":"anon"}` → canonical
- [x] No staging project remains authoritative
- [x] Hero query exists and executes:
      `GET /rest/v1/hero_slides?select=*&order=display_order.asc&page_id=eq.e5186de1-…&is_active=eq.true`
- [x] Home page ownership resolved dynamically via
      `GET /rest/v1/website_pages?…&page_key=eq.home` → `e5186de1-a199-476f-abe2-a3f8b21c6120`
      (no UUID hardcoded in HTML)
- [x] Inactive slides excluded — `is_active=eq.true` in the query
- [x] Ordering deterministic — `order=display_order.asc`
- [x] Media resolved via `media_id` → `media_assets.public_url` (MediaResolver); no storage URL
      string constructed in HTML/JS
- [x] No hardcoded Supabase storage URL drives the Hero

## E. VERIFICATION — BLACK BOX (Playwright 1.63.0, Chromium, http://localhost:8000/)

- [x] Page loads (HTTP 200)
- [x] **No JS page errors** — `(none)`
- [x] `data-hero-state = "ok"`
- [x] Hero renders **2 slides** (Home active slides from CMS)
- [x] Slide 0: title `ZT Lounge Meru Premium Dining • VIP Cabins • …`,
      subtitle `Experience premium hospitality at ZT Lounge Meru`
- [x] Slide 1: title `best place From sunset cocktails to late-night entertainment`,
      subtitle `Experience Meru's finest hospitality`
- [x] **Hero images actually load and decode** (not broken):
      - `LOADED 1448x1086  …/hero-images/hero-restaurant.webp`
      - `LOADED 1448x1086  …/hero-images/hero-lounge.webp`
- [x] Ordering follows `display_order` (0 then 1) — matches DB exactly
- [x] Only CMS Home slides render; no inactive slide appears
- [x] Network reaches canonical project only: `{"jczwilrysvnhcjzjztbi": 72}` requests,
      **0 requests to `jcxavwuaiywnhpfigvlw`**
- [x] No hardcoded fallback image replaced a CMS response — slides carry real CMS titles
- [x] Homepage intact: 8 sections, 28 nav links, 22 images, body text 4548 chars

### Media resolution trace (live)

```
hero_slides.media_id = ce0458d4-2275-40a7-b82c-f367922d1d0b
  → media_assets.public_url
  = https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/hero-images/hero-restaurant.webp

hero_slides.media_id = 141ce2ea-6bf1-463d-a390-5faf426a74d4
  → media_assets.public_url
  = https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/hero-images/hero-lounge.webp
```

Hero images are applied via CSS `background-image` by the existing `populateHero` renderer
(not `<img>`); this is the pre-existing design and was preserved.

---

## F. SECTION 21 — LIVE `hero_slides.image_url` DISCREPANCY (resolved, not reconciled silently)

Queried the **live** DB with the same anon key the browser uses:

| State | Count |
|---|---|
| `image_url` = `NULL` | 4 / 9 |
| `image_url` = `""` (empty string) | 5 / 9 |
| `image_url` populated with a URL | **0 / 9** |
| `media_id` populated | **9 / 9** |

**Reconciliation:** Phase 1 reported "NULL for all 9". The live table is not literally all-NULL —
5 rows hold an empty string `""`, which is functionally equivalent to absent but is a distinct
value. **No row carries a usable URL**, so there is no competing image source. The
`media_id → media_assets → public_url` path remains the sole canonical source, as approved.
This did not change the implementation decision.

---

## G. RLS / SECURITY BOUNDARY (anon key, read-only probes)

| Table | anon read | Note |
|---|---|---|
| `hero_slides` | 200, 1 row | public read — required for Hero |
| `media_assets` | 200, 1 row | public read — required for media |
| `website_pages` | 200, 1 row | public read — required for page resolution |
| `profiles` | 200, **0 rows** | anon blocked — correct |
| `customers` | 200, **0 rows** | anon blocked — correct |
| `bookings` | 200, **0 rows** | anon blocked — correct |

---

## H. REGRESSION (outside Hero)

- [x] `index.html` structure intact — no edits made to it
- [x] 8 homepage sections render, 28 nav links, 22 images
- [x] Other sections now also receive live CMS data (they were blocked by the same config
      defect): `business_settings`, `membership_plans`, `membership_plan_benefits`,
      `menu_categories`, `menu_items`, `testimonials`, `faqs`, `services`, `gallery`,
      `promotions`, logo via `media_assets`
- [x] Nested pages under `/pages/` unaffected (no file changes)
- [x] Admin CMS untouched — zero files modified in the admin repo
- [x] No schema / migration / seed / RLS / storage / booking / membership / service / gallery /
      promotion changes

---

## I. REMAINING ISSUES FOUND (NOT fixed — outside Hero scope)

### R1. `website_pages` query returns HTTP 400 (pre-existing, unrelated to Hero)

```
GET /rest/v1/website_pages?select=id,page_key,title,service_cards_enabled,service_packages_enabled
→ 400 {"code":"42703","message":"column website_pages.service_cards_enabled does not exist"}
```

Actual `website_pages` columns: `id, page_key, title, subtitle, content, seo_title,
seo_description, updated_by, created_at, updated_at`.

The `service_cards_enabled` / `service_packages_enabled` projection references two columns that
do not exist. This fires for `home`, `gallery`, `lounge`, `restaurant`, `grooming-care`.
It does **not** affect the Home Hero (the Hero uses a separate `select=*` call that returns 200),
but it degrades the page-feature-flag logic. Fixing it means deciding whether to add columns or
drop the projection — a schema decision requiring explicit approval. **Not fixed.**

### R2. Missing local asset

```
404 GET http://localhost:8000/assets/images/placeholder-service.webp
```

A service card with no image references a placeholder that does not exist on disk. Cosmetic.

### R3. Hero pipeline lives in uncommitted files — HIGH RISK

`MediaResolver.js` and `PageResolver.js` are **untracked** (`??`), and `index.html`,
`content-loader.js`, `HeroRepository.js` are **modified but never staged or committed** (0 staged
entries across the whole repo). The now-working Hero pipeline depends on these files. A
`git clean -fd` or a fresh clone of `feature/membership-tiers-staging-phase1` would **delete the
entire Hero data layer**. Per the dirty-repository rule I did not commit, stash, or clean
anything. **This requires a deliberate decision before any cleanup.**

### R4. Empty CMS content surfaced live

- `membership_plans.media_id` = NULL for all 4 plans
- `promotions`: 1 row, title `barbershop`, `banner_image` NULL, `discount_percent` 10 but
  description says "20% off this week!" — content inconsistency
- `business_settings.favicon_media_id` points at the **logo** asset, not a favicon
- `services` `Classic Haircut` has `media_id` NULL (only service without media)

---

## J. FINAL STATUS  → see `PHASE2_FINAL_CLOSURE_REPORT.md` (this track)

# CLOSED

**Verified with evidence:** the Home Hero delivery pipeline works end-to-end
`website_pages(page_key=home) → hero_slides → media_id → media_assets.public_url → rendered Hero`,
against the canonical project (`jczwilrysvnhcjzjztbi`), with correct ordering, active
filtering, canonical media resolution, and no JS errors. Closure verdict and full evidence
in `PHASE2_FINAL_CLOSURE_REPORT.md`.

**Phase 2 (Public Data Delivery Pipeline + Home Hero) is CLOSED.**

The non-Hero sections that the same config fix also unblocked (Services, Gallery,
Promotions, Membership, etc.) were *observed* loading from the canonical project
(see `PHASE2_FINAL_CLOSURE_REPORT.md` §9 runtime evidence), but they were **not**
functionally audited — per the task's instruction to stop after Home Hero. R1 (the 400 on
`website_pages` Phase 2C feature-flag columns) is a confirmed **out-of-scope** defect
(Phase 2C / Services) that does **not** affect the Home Hero; it is documented as a
remaining observation, not a Hero closure blocker.


No credential rotation, RLS change, or storage-policy change was made or required.
The anon key is the public browser role; no `service_role` key exists in public JS.
