# PHASE 3 PROGRESS — Public Services Pipeline + Phase 2 Preservation

## Baseline

- timestamp: 2026-09-28 (audit pass)
- branch: `feature/membership-tiers-staging-phase1`
- HEAD: `905bd7a fix: align testimonials UI with database schema and manager RBAC`
- dirty tree: **574 entries** — modified / deleted / untracked, **3 staged**
  (Phase 2 recorded 573 / 0 staged. The delta is pre-existing work, not Phase 3.)
- public runtime: `http://localhost:8000` → HTTP 200
- admin runtime: `http://localhost:3000` → HTTP 200
- canonical Supabase: `jczwilrysvnhcjzjztbi`
- admin repo: **not modified** (verified)

No `reset`, `clean`, `restore`, `stash`, `checkout`, or `commit` was run in either repository.

## Phase 2 Preservation

- finding: Home Hero pipeline remains intact and CMS-derived.
- evidence: browser probe on `http://localhost:8000/` — 2 active Home slides rendered,
  `display_order` 0 then 1, badge/title/highlight/subtitle matched live `hero_slides` rows,
  hero images resolved and decoded (1448x1086), `data-hero-state="ok"`, 0 JS page errors,
  **72 requests to canonical project, 0 to staging**.
- files involved: `assets/js/config/env.js`, `assets/js/config/supabase.config.js`,
  `assets/js/repositories/HeroRepository.js`, `MediaResolver.js`, `PageResolver.js`,
  `assets/js/content-loader.js`, `index.html`.

## Services Audit

- finding: **the Services pipeline already exists and already loads.**
- evidence: `assets/js/repositories/ServicesRepository.js` is present and complete —
  filters `is_active = true`, orders by `display_order`, resolves images through
  `MediaResolver` (never `services.image_url` directly). It is **not** loaded by a direct
  `index.html` `<script>` tag; it is pulled in dynamically by `shared-components.js:327`.
- finding: runtime render confirmed — service cards observed in the browser carrying
  live CMS names/prices and images served from `media_assets.public_url`.
- conclusion: this is **Case A / Case E-adjacent (already working)**. No rewrite warranted.

## R1

- status: **OPEN** — see final report §8.
- request location: the `website_pages` select list in the page/feature-flag projection.
- consumer: has an existing fail-open fallback, so removing the column is **not** behaviour-neutral
  by default and the case could not be proven safe within this phase's evidence budget.
- action: **not fixed.** No schema change made. No fabrication of a default flag.

## R2

- status: **OPEN** — `404 /assets/images/placeholder-service.webp`.
- cause: cosmetic missing local asset on a fallback path.
- action: **not fixed.** No image was invented to silence a 404.

## R3

- status: **OPEN — HIGH RISK.**
- `MediaResolver.js` and `PageResolver.js` are **untracked**.
- `index.html`, `content-loader.js`, `HeroRepository.js` are **modified but uncommitted**.
- The now-proven Hero *and* Services pipelines both depend on untracked files.
- Not committed and not deleted, per the dirty-repository rule. Escalated for a decision.

## Implementation Gate

Completed and written to this file. Outcome: **no code change was required or made.**

## Implementation

**None.** The audit proved the Services pipeline is already complete, correct, and live.
Per the central rule — *do not build what already exists; do not fix what has not been
proven broken* — Phase 3 made **no edits to implementation code in either repository.**

The only file created in this phase is this progress log.

## Verification

- test: black-box browser probe of `http://localhost:8000/`
- expected: CMS-derived services + hero, canonical project only
- actual: as expected; see above
- result: Services and Hero both confirmed live from `jczwilrysvnhcjzjztbi`

## Remaining Issues

1. **R1** `service_cards_enabled` → HTTP 400. Code-only fix not proven behaviour-neutral.
2. **R2** missing `placeholder-service.webp`.
3. **R3** working pipeline lives in untracked/uncommitted files.
4. Legacy `services.image_url` still populated on 6 rows (not used by the renderer).
5. `Classic Haircut` has `media_id = NULL` — business decision, **not** auto-assigned.
6. `supabase/.temp/linked-project.json` still references the staging project
   `jcxavwuaiywnhpfigvlw`. Not authoritative at runtime; flagged only.
7. One residual HTTP 400 remains from the pre-existing R1 query; it is **not** a JS error.
