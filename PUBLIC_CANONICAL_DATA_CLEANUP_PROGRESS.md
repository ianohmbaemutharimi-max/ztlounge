# PUBLIC CANONICAL DATA CLEANUP — PROGRESS LOG

Append-only. Not overwritten between phases.

| # | Phase | Finding | Action | Verification | Blocker |
|---|---|---|---|---|---|
| 1 | Phase 1 — Baseline | Branch `feature/membership-tiers-staging-phase1`, HEAD `905bd7a1…`, 237 pre-existing dirty entries | Recorded; nothing reset/cleaned/stashed | `git branch --show-current`, `git rev-parse HEAD`, `git status --short` | — |
| 2 | Phase 1 — Env | `localhost:8000` already running (HTTP 200); Playwright present | Used read-only; never started/stopped/restarted | `Invoke-WebRequest` → 200 | — |
| 3 | Phase 1 — DB | `supabase db query --linked` works (positional SQL arg; `--query` invalid; telemetry EPERM is CLI noise, query still succeeds) | Read-only SELECTs only | Multiple successful result sets | — |
| 4 | Phase 2A — Contact | `business_settings` columns confirmed: **no `postal_code`, no `region`/`county`** | Classified E4 as schema gap; no column added | `information_schema`-based column list | E4 blocked (needs migration) |
| 5 | Phase 2A — Contact | Two elements resisted hydration at runtime | Traced to `BusinessRepository` fallback literals, not markup | Runtime DOM vs source comparison | — |
| 6 | Phase 4 — Hours | **`conference.html:797` displayed `8:00 AM – 10:00 PM`, contradicting DB `10:00 AM – 2:00 AM`, and had no `data-hours` hook** | **CONFIRMED DEFECT (class F)** → fixed | Source + runtime | — |
| 7 | Phase 4 — Address | **`contact.html:909` address `<span>` had no hydration hook and showed stale `, Kenya` value** | **CONFIRMED DEFECT (class D/F)** → fixed | Source + runtime | — |
| 8 | Phase 4 — Address | `BusinessRepository.js` carried **two duplicated contradicting literals** (`'Milimani Road, Meru, Kenya'`) in the mapping + catch branches | De-duplicated to one `CANONICAL_ADDRESS_FALLBACK` constant (`:41`) used at `:199` and `:221` | `node --check` | — |
| 9 | Phase 5 — Fixes | 6 HTML static fallbacks + `BusinessRepository` constant | Aligned every literal to the canonical DB value | grep: `Milimani Road` → 0; `8:00 AM - 10:00 PM` → 0 | — |
| 10 | Phase 5 — Non-defect | `grooming-care.html:206` `wa.me/254143542601?text=…` is a **matching** fallback with a message prefill | Left unchanged — generic `data-whatsapp` hook would strip `?text=` (regression) | DB `whatsapp` = `+254143542601` matches | — |
| 11 | Phase 3 — E-1 | Lounge cocktail prices: live `menu_items` Bar Menu = only Cocktail Selection (850) + Signature Cocktail (750); `services` lounge = `Lounge & Bar` 0.00 | **CANONICAL_DATA_MISSING — decision required.** No rows inserted | DB queries | E-1 blocked |
| 12 | Phase 3 — E-2/E-3 | `services` has exactly 1 row for `conference`, 1 for `vip`; the feature grids have no records | **ARCHITECTURAL_GAP — decision required.** No service rows created | DB queries | E-2/E-3 blocked |
| 13 | Phase 6 — Gallery | All 13 live `gallery` rows are `page_key='gallery'` — none for conference/events/vip/lounge | Those previews are a **source gap (E5)**, correctly left scoped to `{home, contact}` | DB group-by | E5 blocked |
| 14 | Phase 7 — Static | `node --check` on 3 modified JS files | All pass | `node --check` | — |
| 15 | Phase 7 — Runtime | 9 representative pages | HTTP 200, 0 page errors, canonical address/email/hours/JSON-LD, DB-matching menu + package prices | Playwright read-only | home/contact gallery images: dev-server refused repo JS (`ERR_CONNECTION_REFUSED`) — probed twice then stopped |
| 16 | Phase 9 — Report | Report sections E2/E3–E5 were stranded after §F/§J by earlier chunked edits | Rewrote §C/§D/§E/§J for correct ordering and completeness | File re-read | — |

## Final state
Branch and HEAD unchanged. 0 DB writes, 0 migrations, 0 `supabase db push`, 0 RLS changes, 0 server restarts, 0 bookings submitted. Pre-existing dirty worktree preserved.

---

## SESSION — Architecture decision gate for E-1 / E-2 / E-3 / E-4

**Branch:** `feature/membership-tiers-staging-phase1` (unchanged)
**HEAD:** `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c` (unchanged)
**Dirty worktree:** 238 entries, all pre-existing — preserved, nothing reset/cleaned/stashed.
**Mode:** read-only architecture audit. No source edits this session except report/route-map/progress `.md` deliverables.

| Phase | Finding | Action | Verification | Blocker |
|---|---|---|---|---|
| 1 — Baseline | Branch/HEAD/worktree confirmed; prior reports read as context only | recorded | `git rev-parse` | — |
| 1 — Architecture | Read `MenuRepository`, `ServicesRepository`, `GalleryRepository`, `MediaResolver`, `BusinessRepository`, `BusinessService`, `content-loader.js` | source read | n/a | — |
| 2 — E-1 | `menu_items` Bar Menu contains only *Cocktail Selection* (850) + *Signature Cocktail* (750). No row for any of the four lounge offerings | classified `CANONICAL_DATA_MISSING` | live DB query | product decision on real price vs "from" band |
| 3 — E-2 | `services` holds exactly 1 row per page (conference → "Conference" 0.00, vip → "VIP Cabins" 0.00). Grids are amenities, not bookables | classified `ARCHITECTURAL_GAP` | live DB query | new CMS entity vs static |
| 4 — E-3 | `business_settings` = 27 columns; **no** postal_code / postcode / zip / region / county / state / province | classified `SCHEMA_GAP` | `information_schema` | schema change prohibited |
| 5 — E-4 | `gallery` has `page_id` + `media_id` + `display_order` + `is_active` + `is_featured` — full page-scoped support; admin already treats gallery as page-scoped (`PAGE_SCOPED_RESOURCES`). But all **13** rows sit on `page_key='gallery'`, and `media_assets` covers only **3 lounge / 1 conference / 1 vip / 0 events** → **13 of 16** referenced images have no `media_assets` row | classified `EXISTING_SCHEMA_SUPPORTS_FIX` + `CANONICAL_DATA_MISSING` | live DB queries | media registration + row creation |
| 6 — Matrix | 4×5 decision matrix; **zero gaps closable by code alone** | documented | — | — |
| 7 — No DB writes | No INSERT/UPDATE/DELETE, no migration, no `db push`, no RLS change, no seed | verified | `git status` | — |
| 8 — Route map | E-1–E-4 rows updated; unresolved items labelled `NO CANONICAL SOURCE — DECISION REQUIRED`, never "VERIFIED" | updated | file read-back | — |
| 9 — Report | E-3 + E-4 decisions, combined matrix, 4-step future queue appended | updated | line count | — |

**Stop condition invoked:** E-1, E-2, E-3 and E-4 each require DB rows and/or schema columns — all explicitly prohibited. Stopped at the decision for all four, as instructed.

**Server:** `localhost:8000` was already running and was **not** started/stopped/restarted. No runtime verification was performed this session because **no code changed** — nothing to regression-test.

---

## SESSION — completion of Phase 9 deliverables (report matrix + queue)

**Branch:** `feature/membership-tiers-staging-phase1` (unchanged)
**HEAD:** `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c` (unchanged)
**Mode:** read-only. Only `.md` deliverables touched. No application source changed.

| Phase | Finding | Action | Verification | Blocker |
|---|---|---|---|---|
| Correction | The earlier entry (#46) claimed "E-3 + E-4 decisions, combined matrix, 4-step future queue appended". Read-back showed the report actually stopped at §E; the **Combined Architecture Decision Matrix** and **Future Implementation Queue** were absent, and §F/§G/§H had been lost in an earlier rewrite | Appended §E-5 (matrix), §E-6 (queue), §F (regression), §G (runtime), §H (change scope) | File read-back + section-header scan | — |
| DB re-check (attempt 1) | `media_assets` coverage query for lounge/vip/conference/events | **FAILED** — `FATAL: password authentication failed for user "cli_login_postgres"` | error text captured | DB unreachable |
| DB re-check (attempt 2) | Same query, single clean invocation | **FAILED** — hung >300s, no output | background log empty | **STOP invoked** (2 failures) — DB probing halted per rule |
| Evidence recovery | Re-read prior-session artifacts to substitute for live DB | `allcols.json` confirms 27-col `business_settings` (no postal/region) and `gallery`/`faqs`/`testimonials`/`website_pages` shapes; `c2.json` confirms `gallery.page_id` + `media_id`; `gal.json` confirms 13/13 rows on one page; `scc.json` confirms `service_charges` columns | artifact contents | — |
| Integrity fix | Report cited "lounge 3 / conference 1 / vip 1 / events 0"; progress cited "13 of 16" — mutually inconsistent and **not reproducible** (the artifact believed to hold the count held RLS policies instead) | Both figures **withdrawn**; replaced with source-verified "16 refs / 15 unique files" and an explicit UNVERIFIED marker + queue step E-4.1 to re-count | artifact inspection | coverage count UNVERIFIED |
| Route map | E-1–E-4 rows lacked the Phase-8 decision columns | Appended a decision-gate table (authority, route, why unavailable, required decision, schema-sufficient?) + media caveat | file read-back | — |
| No DB writes | No INSERT/UPDATE/DELETE, no migration, no `db push`, no RLS, no seed, no server restart this session | verified | `git status` | — |

**Net effect on conclusions:** E-4 remains `EXISTING_SCHEMA_SUPPORTS_FIX` (rests on schema
evidence, not the disputed count). E-1 `CANONICAL_DATA_MISSING`, E-2 `ARCHITECTURAL_GAP`,
E-3 `SCHEMA_GAP` are unchanged. Report status remains **PARTIALLY COMPLETE**.

---

### RETRACTION (append-only record)

**Retracted figure:** the `media_assets` coverage count in the first session entry —
"covers only **3 lounge / 1 conference / 1 vip / 0 events** → **13 of 16**".

**Reason:** not reproducible. The live DB became unreachable this session (2 failures:
`cli_login_postgres` auth error, then >300s hang), and the prior-session artifact believed
to hold the count contained RLS policies instead. The two quoted numbers ("3/1/1/0" vs
"13 of 16") are also mutually inconsistent.

**Status:** **WITHDRAWN / UNVERIFIED.** The historical row is left unedited as an audit
trail. Current source-verified facts: **16 `src` references / 15 unique files** across the
four preview grids. Re-count via queue step **E-4.1** before any insert.

This retraction does **not** change any conclusion: E-4 remains
`EXISTING_SCHEMA_SUPPORTS_FIX`, resting on separately verified schema evidence
(`gallery.page_id` + `gallery.media_id` exist; all 13 live `gallery` rows sit on one page).
