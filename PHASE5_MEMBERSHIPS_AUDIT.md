# PHASE 5 — ZT Lounge Membership System Audit

**Scope:** read-only audit of the ZT Lounge membership system across BOTH repositories. **No code, DB, migration, or git history was modified this session.**

**Workspace:** `D:\zt lounge\zt-lounge-demo` (parent `zt-lounge` = public site + migrations; child `zt-lounge-admin` = Next.js dashboard).

## Provenance legend
- **[SOURCE VERIFIED]** — proven from committed source/migration files read this session.
- **[RUNTIME VERIFIED]** — proven by a live probe this session (dev boot / HTTP probe).
- **[DATABASE VERIFIED]** — proven by an executed live SQL query this session. *(None — see BLOCKED.)*
- **[BLOCKED]** — live DB access attempted once and failed; not retried.
- **[NOT FOUND]** — searched and confirmed absent.
- **[DEFERRED]** — requires live DB state; cannot verify without a DB connection.

### Environment probes (this session)
| Probe | Result |
|---|---|
| Supabase DB `api.supabase.co` DNS | **BLOCKED** — `DNS name does not exist` (matches Phase 4 ENOTFOUND). Single attempt, not retried. |
| Next dev server `npm run dev` | **RUNTIME VERIFIED** — Next 16.2.6/Turbopack `Ready in 1446ms`, `Local: http://localhost:3000`. |
| `GET /api/admin/membership-plans` (live) | **RUNTIME VERIFIED** — `401 Unauthorized` (admin auth gate enforced). |
| `GET /membership` (live) | cold-compile timeout (>10s) — inconclusive; SOURCE-VERIFIED only. |

Because live DB is BLOCKED, all DB-layer claims are backed by **committed migration source** (`038`–`042`) + **`.temp/` audit SQL** (read, not executed this session).

## 1. Repository topology (two repos, split ownership) — SOURCE VERIFIED
| Repo | Path | Role | Git |
|---|---|---|---|
| Parent (public site + schema) | `zt-lounge/` | Static public site; **canonical migrations 038–042**; `.temp/` audits; runtime DOM captures. | legacy |
| Child (admin dashboard) | `zt-lounge-admin/` | Next.js admin dashboard; **all membership code** under `src/`. | `clean-rebuild` @ `876b185` |

Membership **migrations** live in the PARENT (`zt-lounge/supabase/migrations/`); membership **application code** lives entirely in the CHILD (`zt-lounge-admin/src/`). The feature crosses a trust/schema boundary: the DB contract is authored in the parent, consumed by the child app.

## 2. File inventory (membership-relevant)
- **Schema/DB (parent):** `supabase/migrations/038_membership_baseline.sql`, `039_membership_headline_benefit.sql`, `040_membership_revoke_excess_grants.sql`, `041_membership_headline_benefit_id.sql` (staging-only), `042_membership_admin_rpcs.sql`; audit probes `.temp/zt-041-state.sql`, `zt-staging-verify.sql`, `zt-staging-verify-grants.sql`, `zt-staging-041-042-state.sql`, `zt-membership-state-functions.sql`, `zt-staging-object-state.sql`, `zt-staging-phase7-read2.sql`.
- **Public (parent):** `assets/js/repositories/MembershipRepository.js`, `membership-view.js`, `membership.config.js`, `repositories/MediaResolver.js`, `lib/content-loader.js` (`populateMembership`, ~L1793), `lib/shared-components.js` (`FEATURE_SCRIPTS['membership']`, ~L348), `lib/page-identity.js`, `index.html`, `index_clean.html` (duplicate homepage).
- **Admin (child):** `src/app/membership/page.tsx` (public Next card page); `src/app/dashboard/memberships` → `@/features/memberships/memberships-cms.tsx` (plan/benefit CMS); `src/app/dashboard/members` → `@/features/members/members-view.tsx`; `src/app/api/membership-plans/route.ts` (PUBLIC read-only); `src/app/api/admin/[resource]` + `[resource]/[id]` (generic CRUD); `src/app/api/admin/customer-memberships/[id]/cancel|renew`; `src/lib/membership-handler.ts`, `repository.ts`, `api.ts`, `auth/server.ts`, `db/schema.ts`, `resource-config.ts`, `validation/admin.ts`, `page-scope.ts`, `media/resolver.ts`, `lib/constants/nav.ts`.

## 3. Membership schema baseline (`038`) — SOURCE VERIFIED
**`membership_plans`** (`id` uuid PK `gen_random_uuid`, `slug` UNIQUE, `media_id→media_assets ON DELETE SET NULL`, `updated_by→profiles`): name/slug/description; `annual_price` numeric(12,2) NOT NULL CHECK>=0; `registration_fee` numeric(12,2) NOT NULL DEFAULT 0 CHECK>=0; `display_order` int DEFAULT 0; `is_active` bool DEFAULT true; `cta_text/cte_link`; timestamps. Indexes: `display_order`, `is_active`.
**`membership_plan_benefits`** (`id` PK): `plan_id→membership_plans ON DELETE CASCADE`; `description` text NOT NULL CHECK(trim>0); `display_order` int DEFAULT 0; `is_active` bool DEFAULT true; timestamps; `(id,plan_id)` UNIQUE (041). Indexes plan_id, (plan_id,display_order).
**`customer_memberships`** (`id` PK): `customer_id→customers(id) ON DELETE RESTRICT`; `plan_id→membership_plans ON DELETE RESTRICT`; `member_number` text NOT NULL UNIQUE default `'ZT-M-'||lpad(nextval('membership_member_number_seq')::text,5,'0')` (seq OWNED by it); **`status` text NOT NULL DEFAULT 'active' CHECK = ANY('pending','active','expired','cancelled')`**; `registered_at` timestamptz NOT NULL DEFAULT now(); **`expires_at` timestamptz NOT NULL** (no default); `annual_price_snapshot`/`registration_fee_snapshot` numeric(12,2) NOT NULL CHECK>=0; `notes`; `created_by→profiles`; timestamps. Indexes customer_id/plan_id/status. `updated_at` BEFORE-UPDATE triggers on all three tables.

## 4. Headline-benefit drift — SOURCE VERIFIED
| Object | `039` (text) | `041` (id, staging→squash) | admin `schema.ts` | public `MembershipRepository` | `MembershipsCms` form |
|---|---|---|---|---|---|
| `headline_benefit` | ADD text + backfill 4 tiers + ownership guard | **DROP** | absent | absent | absent |
| `headline_benefit_id` (uuid→benefits(id,plan_id) CASCADE/SET NULL) + deactivation guard trigger | absent | ADD | absent | **projected** (`item.headline_benefit_id`, resolves `headline_benefit` from benefits) | absent |

Public repo projects `headline_benefit_id` (expects `041`/squash contract). Admin Drizzle mirror (L563–616) has **neither** column. **Impact:** on a `039`-only live DB, the public `SELECT …headline_benefit_id` errors (PGRST column-missing → `MembershipRepository.getPublicPlans` rejects → homepage hides the section). Live-DB column state is **DEFERRED** (DB access BLOCKED).

## 5. Row Level Security & grants — SOURCE VERIFIED (`038`, `040`, `042`)
- `membership_plans` has **no DELETE** policy — `membership_plans_admin_manage` is FOR ALL (USING/WITH CHECK `is_admin_or_above()`), so admins can INSERT/UPDATE/DELETE. `membership_plans_public_read` (SELECT WHERE `is_active=true`) serves the public. **Note:** `customer_memberships` has **no public policy at all** — `customer_memberships_admin_manage` (ALL, `is_admin_or_above()`) is the only policy ⇒ **zero anon read of member data** (confirmed by `MembershipRepository.js` L17 and `.temp/zt-staging-verify-grants.sql`).
- `040`: `REVOKE TRUNCATE, TRIGGER, REFERENCES` on all three tables FROM `anon,authenticated` (DDL defence-in-depth; RLS remains the DML boundary). `.temp/zt-staging-verify-grants.sql` selects exact privileges per grantee.
- `042`: RPCs `REVOKE ALL … FROM PUBLIC, anon`; `GRANT EXECUTE … TO authenticated`.

## 6. Server-side functions & RPCs — SOURCE VERIFIED (`038`, `042`; `.temp/zt-membership-state-functions.sql`)
| Function | Purpose | Auth / mode | Caller |
|---|---|---|---|
| `update_membership_domain_updated_at()` | `updated_at` trigger fn | trigger | 3 tables |
| `reorder_membership_plans(uuid[])` | bulk `display_order` rewrite | `SECURITY INVOKER`; `is_admin_or_above()` check; anon revoked, `authenticated` execute | **ORPHANED — see §20** |
| `set_membership_registration_fee(numeric, jsonb)` | single bulk fee set w/ optimistic-concurrency guard | `SECURITY INVOKER`; `is_admin_or_above()`; anon revoked, `authenticated` execute | **ORPHANED — see §20** |
| `guard_membership_headline_deactivation()` (041) | deny deactivating a benefit that is a plan headline | trigger BEFORE UPDATE OF is_active | `membership_plan_benefits` |
| `is_admin_or_above()` | role gate | external (earlier migration) | all admin policies/RPCs |
| `current_role()` | role lookup | external (earlier migration) | policies/RPCs |

**Important — no lifecycle RPCs exist:** searched source for `membership_activate`, `membership_renew`, `membership_expire`, `grant_membership`, `revoke_membership`, `cancel_membership` → [NOT FOUND]. Activation/renewal/cancel are enforced **in app code** (`MembershipHandler`), not DB RPCs.

## 7. Authentication & authorization — SOURCE VERIFIED (`src/lib/auth/server.ts`)
- Roles: `ADMIN_ROLES=["super_admin","admin"]`; `requireSuperAdmin` = super_admin only; `getServerSession` rejects `is_active=false` (403) and joins `profiles→roles`.
- `withAdminAuth`→`requireAdmin` (super_admin **or** admin) wraps the generic `[resource]` CRUD and `customer-memberships/[id]/cancel|renew`; `withSuperAdminAuth`→super_admin; `withContentManagerAuth`→super_admin|admin for `gallery`/`testimonials` only.
- **Gap:** `/dashboard/memberships` page enforces `requireSuperAdmin` (super_admin only), but the underlying generic API uses `withAdminAuth` (admin+super_admin) — a plain `admin` can still call `/api/admin/membership-plans` directly. Defence-in-depth gap.

## 8. Admin API surface — SOURCE VERIFIED (read + runtime)
| Endpoint | Method | Auth | Backend |
|---|---|---|---|
| `/api/membership-plans` | GET | PUBLIC (anon) | `038`/`042`: active plans + benefits + media |
| `/api/admin/[resource]` | GET(list)/POST | `withAdminAuth` (admin+) | generic `Repository`; supports membership-plans/benefits/customer-memberships; limit/offset/orderBy/search/filter |
| `/api/admin/[resource]/[id]` | GET/PATCH/DELETE | `withAdminAuth` (admin+) | generic `Repository`; resolves media only for `menu-items,services,gallery,hero-slides,promotions` — NOT membership-plans |
| `/api/admin/customer-memberships/[id]/cancel` | POST | `withAdminAuth` | `MembershipHandler.cancel` (status→cancelled, record preserved) |
| `/api/admin/customer-memberships/[id]/renew` | POST | `withAdminAuth` | `MembershipHandler.renew` (status→active, extends expiry, re-snapshots prices) |

Runtime: `GET /api/admin/membership-plans` (anon) → **401** ([RUNTIME VERIFIED] — admin auth gate enforced). `membership-plans`/`membership-plan-benefits`/`customer-memberships` are registered in `ADMIN_RESOURCES` + `RESOURCE_CONFIG` + `ORDERABLE_COLUMNS`/`SEARCHABLE_FIELDS` (validation/admin.ts L35–74, resource-config.ts L126–140).

## 9. Admin UI — Memberships CMS (Plans/Benefits) — SOURCE VERIFIED
Route `/dashboard/memberships` (`dashboard/memberships/page.tsx` → `requireSuperAdmin`) renders `@/features/memberships/memberships-cms.tsx` via the **generic** `/api/admin/membership-plans` + `/api/admin/membership-plan-benefits` APIs. The old `/api/admin/membership/{reorder,registration-fee,…}` RPC routes are **not present** in the live tree ([NOT FOUND]) — only `customer-memberships/[id]/cancel|renew` exist there (Get-ChildItem of `src/app/api/admin`).

**Capabilities:** list plans (paginated, media resolved on the list); create/edit plan (name, slug, description, annual_price, registration_fee, display_order, cta_text, cta_link, **media picker**→`media_id`); **Activate/Deactivate** (`is_active` toggle, Power icon); **Delete** (FK `ON DELETE RESTRICT` ⇒ 409 `DEPENDENT_RECORDS` when history exists — Deactivate is the normal lifecycle). Benefits: add/edit/toggle-active per plan. **Headline fields not editable** (form/schema omit `headline_benefit_id` — drift, §19 D2/D3). Reordering is via per-plan `display_order` edit, not the bulk RPC (§20 R3).

## 10. Admin UI — Members (customer membership ops) — SOURCE VERIFIED
Route `/dashboard/members` (`dashboard/members/page.tsx` → `MembersView`, admin+super_admin) reads `customers`, `customer-memberships`, `membership-plans` via the generic API. **Capabilities:** list customers with membership status (Active/Expired/Cancelled), member code, package, expiry date, **Days Left** countdown; search customers (active members filtered out of picker); **Assign** membership to an existing customer (`api.create("customer-memberships",{customer_id,plan_id})`); **Add Member** = create customer + membership in one step (auto-resolve/create customer by normalized phone via `normalize_customer_phone` RPC); **Renew** (POST `…/[id]/renew`); **Cancel** (POST `…/[id]/cancel` → status `cancelled`, record preserved); **View** (Eye → detail). No **activate** action (§11).

## 11. Membership lifecycle & server-side contracts — SOURCE VERIFIED (`membership-handler.ts` L1–17,59–302; `038` CHECK)
`MembershipHandler` enforces: `member_number` is DB-sequence-only (never client input); `annual_price_snapshot`/`registration_fee_snapshot` re-snapshotted from the plan at assign/renew; `registered_at`/`expires_at` server-derived (annual period); **one active membership per customer per plan** (duplicate active → `CONFLICT`). `STATUS_TRANSITIONS`: `pending→[active,cancelled]`, `active→[cancelled,expired]`, `expired→[cancelled]`, `cancelled→[]`. **`create()` sets `status="active"` directly** (L~165) — no reachable `pending` state in the admin flow, and **`cancelled` never auto-reverts**. The `pending` and `expired` CHECK entries are therefore **dead states** in practice (see §12).

## 12. Expiry / renewal automation — NOT FOUND (CRITICAL) — def. §2.2
Searched parent + child for `pg_cron`|`cron.job`|`supabase/functions`|`edge function`|`scheduled job`|`job_scheduler`|`refresh_materialized` → [NOT FOUND] (only the `@supabase/functions-js` npm dependency in `zt-lounge-admin`; `supabase/config.toml` mentions only the Edge-Function **inspector port** comment, not a deployed function). No DB trigger sets `status='expired'` when `expires_at < now()`. `expires_at` is a stored column with **no automatic status transition**. `042` RPCs do nothing with expiry. ⇒ **Memberships never auto-expire.** An `active` membership stays `active` past `expires_at` until manually cancelled. Renewal is explicit (Renew extends `expires_at` + re-snapshots). The `Days Left` column counts down but does **not** flip status. The `expired` state is unreachable via any code path. Live-DB confirmation of any scheduled job is **BLOCKED** (DNS).

## 13. Media resolution — SOURCE VERIFIED (public + admin)
- **Public:** `MediaResolver.js` `media_id → media_assets.public_url`, **batched** (one fetch per page for unresolved ids), in-memory cached; canonical `public_url` wins over legacy `image_url`, which is kept **only** as a fallback when an asset can't resolve. No N+1 (MembershipRepository.resolveMedia → `resolveCollection`).
- **Admin list:** generic `[resource]` GET includes `membership-plans` in its `MEDIA_RESOURCES` set and calls `resolveImageUrls` ⇒ plan images render on the list. **Admin single-record:** `[resource]/[id]` GET `MEDIA_RESOURCES` = `menu-items, services, gallery, hero-slides, promotions` — `membership-plans` **omitted** ⇒ single plan `media_id` returned unresolved (minor; the CMS reads from the list, so previews work). `business-settings` resolves logo/favicon separately.
- **Admin editor** uses `ImageChangeDialog` → `api.update("membership-plans", id, { media_id })` (canonical media assignment).

## 14. Public rendering path (homepage) — SOURCE VERIFIED
1. `index.html` (`<body data-page="home">`, L224) loads `theme-init.js` (theme FOUC guard) in `<head>` (L8).
2. Top of `<body>`: `<div id="site-header"></div>` + `<script src="assets/js/shared-components.js" data-features="membership">` (L231). The `membership` flag selects `FEATURE_SCRIPTS['membership']` = `MembershipRepository.js` + `membership.config.js` + `membership-view.js`, emitted as `defer` before the core CMS layer.
3. `content-loader.js` `populateMembership()` (~L1793) runs on `DOMContentLoaded` (and re-runs on the shell's `shell:rendered` / `business-config-loaded` events) → `MembershipView.init()`.
4. `MembershipView.init` calls `MembershipRepository.getPublicPlans()` (RLS `is_active=true`, `display_order ASC`) + `getFeeSummary()` + business/WhatsApp data, then `mount()` into `[data-membership-grid]` with `data-membership-mode="teaser" data-membership-limit="4"` (index.html ~L292).
5. **Teaser:** first 4 plan cards + a local **"View More"** button (`data-membership-modal-trigger`) — no page navigation.
6. **View More:** `openModal(allPlans, summary, business)` injects an in-page `#membership-modal` rendering **all** plans in `full` mode (full CTA via `enquiryHref` → WhatsApp / `cta_link`), `document.body` scroll-lock, ESC close; `closeModal` removes the node after 300ms. No route change, no new HTML page.

## 15. Public `/membership` page (Next app) — SOURCE VERIFIED
`zt-lounge-admin/src/app/membership/page.tsx` is a **separate, public, anon-rendered** Next SSR page (uses `NEXT_PUBLIC_*_ANON_KEY` directly; `formatKES`→`KES`; WhatsApp "Join" CTA). Shows Bronze/Silver/Gold/Platinum cards + a registration-fee banner. **Distinct** from the static homepage: the static site has **no served** `/membership` route — `page-identity.js` `PAGE_ROUTES` has no membership key and `FILENAME_MAP` has no `membership.html` ([NOT FOUND]). The `content-loader.js` comment "shared by the homepage teaser and the full membership page" refers to this Next page, **not** a second static HTML page.

## 16. Duplicate / conflicting representations — SOURCE VERIFIED
Three independent membership surfaces exist with **no shared source of truth**: (1) **static homepage** (`index.html` teaser + "View More" modal) driven by `public.membership_plans`; (2) **static duplicate** `index_clean.html` (repo root, identical membership section ~L571–592) — a second copy of the homepage HTML risked by drift; (3) **Next.js public page** `src/app/membership/page.tsx` (anon SSR cards, WhatsApp). Plus the **Next admin** Memberships CMS + Members view. **Currency formatting also diverges:** static uses `KSh` (membership.config.js), Next uses `KES`. **Recommendation:** consolidate to one public surface (see §22 #7).

## 17. Staging / audit artifacts (`.temp/`) — SOURCE VERIFIED (read, not executed)
The parent repo's `.temp/` holds prior **live-DB** audit SQL that corroborates the migration-derived contract (not re-run this session; DB blocked):
- `zt-041-state.sql` — checks `headline_benefit` / `headline_benefit_id` column existence + `reorder_membership_plans`/`set_membership_registration_fee` function existence.
- `zt-staging-verify.sql` / `zt-staging-verify-grants.sql` — headline ownership guard, Gold≠Platinum headline guard, **exact privilege grants** per grantee for the three membership tables.
- `zt-staging-041-042-state.sql` — `EXECUTE` grants for `authenticated` on the two RPCs.
- `zt-membership-state-functions.sql` — `security_definer`/`proconfig` metadata + routine privileges.
- `zt-staging-object-state.sql` — constraint defs (`headline…` FK).
- `zt-staging-phase7-read2.sql` — column data_types incl. `membership_plans` headline columns.
- `verify-membership.cjs` — Playwright screenshot probe of `index.html` + `membership.html`.

⚠️ `verify-membership.cjs` references `membership.html`, but **no such static page exists** in the live tree ([NOT FOUND]); the Next `/membership` is the real full page. These scripts corroborate the contract; they were **not executed this session** (env BLOCKED).

## 18. Environment probes — SOURCE/RUNTIME VERIFIED; DB BLOCKED
- **Supabase live DB: BLOCKED.** `Resolve-DnsName api.supabase.co -DnsOnly` → `DNS name does not exist` (matches Phase 4 ENOTFOUND). This is the single allowed attempt; **not retried**. All DB-layer claims are therefore **SOURCE VERIFIED** via committed migrations + `.temp/` scripts, **not** a live query. Project ref in use: `jczwilrysvnhcjzjztbi` (canonical host `https://jczwilrysvnhcjzjztbi.supabase.co`, per `index.html` asset URLs L357 etc.).
- **Next dev server: RUNTIME VERIFIED (start).** `npm run dev` → `Next.js 16.2.6 (Turbopack)`, `Ready in 1446ms`, `Local: http://localhost:3000`, env `.env.local`. Did **not** hang (contradicts Phase 4 note).
- **Runtime API probe (on the live instance):** `GET /api/admin/membership-plans` (anon) → **401 Unauthorized** ([RUNTIME VERIFIED] — admin auth gate enforced). `GET /membership` cold-compiled past the 10s probe window — inconclusive; classified from source.

## 19. Schema-vs-code drift register — SOURCE VERIFIED
| # | Source of truth (migration) | Code location | Drift | Severity |
|---|---|---|---|---|
| D1 | `038`–`042` | `schema.ts` comment "created by `20260906_create_membership_domain.sql`" | cited migration **does not exist** ([NOT FOUND] in either repo) | med |
| D2 | `041` `headline_benefit_id` | `schema.ts` membershipPlans (L563–616) | column **absent** in Drizzle mirror | med |
| D3 | `039`/`041` headline | `MembershipsCms` plan form | headline fields **not editable** | low |
| D4 | `041` `headline_benefit_id` | public `MembershipRepository.mapPlan` projects it | expects `041`; on a `039`-only live DB the public plan `SELECT` errors and the homepage section is hidden | high |
| D5 | `042` reorder/set_fee RPCs | live admin app | RPCs defined+granted but **no caller** (orphaned; old `/api/admin/membership/*` routes gone) | low |
| D6 | `038` `expires_at`/`snapshots` NOT NULL (no defaults) | generic `[resource]` POST for `customer-memberships` | omits server-derived columns → insert fails (§20 R2) | crit |
| D7 | static `index.html` membership section | `src/app/membership/page.tsx` (Next) | two divergent public representations | med |

## 20. Risk register
| # | Risk | Severity | Evidence |
|---|---|---|---|
| R1 | **No auto-expiry** — `expired` state unreachable; memberships stay `active` past `expires_at` until manually cancelled. | High | §12 (no trigger/cron/edge function; `MembershipHandler` has no expire path; `create()` sets active directly) |
| R2 | **Create-membership broken** — "Add Member/Assign" calls generic `POST /api/admin/customer-memberships` (`repo.create` w/ no server fields), omitting NOT NULL `expires_at`/`annual_price_snapshot`/`registration_fee_snapshot` (no DB defaults) → Postgres 23502 null-violation → 500. `MembershipHandler.create` (the correct, server-field-injecting path) is **not routed** ([NOT FOUND] base `customer-memberships` route). | High | §10/§11 + `repository.ts` create (no serverFields injected by generic `[resource]` POST) |
| R3 | **Orphaned, over-granted RPCs** — `reorder_membership_plans`, `set_membership_registration_fee` are `SECURITY INVOKER`, `is_admin_or_above()`-checked, but `GRANT EXECUTE … TO authenticated` (whole role) with no caller. | Med | §6, §19 D5 |
| R4 | **Public failure if headline contract mismatches** — `MembershipRepository` projects `headline_benefit_id` (041); on a `039`-only live DB public fetch errors → section hidden. | High | §4, §19 D4 (DEFERRED on live DB) |
| R5 | **Admin gate inconsistency** — plan CMS UI is super_admin-only, generic API is admin-accessible. | Low | §7 |
| R6 | **Single-record media gap** — `[resource]/[id]` GET doesn't resolve `membership-plans` images. | Low | §8, §13 |
| R7 | **Duplicate homepage HTML** — `index.html` + `index_clean.html` risk drift. | Low | §16 |

## 21. Coverage gaps / unverified
- **Live DB state** (row counts, realized grants, post-`041` column presence, `profiles`/`customers` DDL) is **DEFERRED** — needs DB access (BLOCKED). `customers`/`profiles` DDL lives in earlier migrations (not read this session); membership FKs to `customers(id)`/`profiles(id)` taken from `038`.
- Whether `src/app/membership` (Next public page) is actually deployed to `ztlounge.co.ke` (vs static `index.html`) — **DEFERRED** (deploy/routing config not examined).
- `index.html` head `<script>` chain past L100 (shell loader wiring) — **SOURCE VERIFIED** via `_runtime_captures/home_dom.txt` (~L1043–1058 lists the `defer`ed membership scripts actually loaded).

## 22. Recommendations (read-only; no changes made this session)
1. **Fix membership creation (R2):** route `POST /api/admin/customer-memberships` (and the "Add Member/Assign" path) through `MembershipHandler.create` so `registered_at`/`expires_at`/snapshots are server-derived; or add DB defaults. The generic `[resource]` POST must not allow NOT NULL server columns to reach INSERT as NULL.
2. **Implement expiry (R1):** add a periodic mechanism (pg_cron / scheduled edge function / daily job) to set `status='expired' WHERE expires_at < now() AND status='active' AND status <> 'cancelled'`; or re-purpose the `Days Left` "Expired" badge to drive the real transition. Until then `expired` is a dead state.
3. **Wire or remove orphaned RPCs (R3):** either call `reorder_membership_plans`/`set_membership_registration_fee` from the CMS (bulk reorder / global fee) or drop them; narrow `EXECUTE` grant from `authenticated` to a dedicated admin role.
4. **Reconcile headline contract (D1–D4):** remove the fictional `20260906_create_membership_domain.sql` comment in `schema.ts`; add `headline_benefit_id` to the Drizzle mirror + MembershipsCms form; confirm `041` is the live prod contract (verify on the DB when reachable).
5. **Close admin gate gap (R5):** place membership plan/benefit endpoints behind `withSuperAdminAuth`.
6. **Fix single-record media (R6):** add `membership-plans` to the `[resource]/[id]` `MEDIA_RESOURCES`.
7. **Consolidate public surfaces (D7/R7):** merge the static `index.html` membership section + `index_clean.html` + Next `/membership` page into one canonical public surface and reconcile `KSh` vs `KES` formatting.
8. **Remove duplicate homepage:** delete `index_clean.html` (or clearly mark non-served), to eliminate drift risk.

## 23. Appendix — provenance of every claim
- **Schema (columns/CHECK/sequence/triggers/RLS/grants/RPCs):** `zt-lounge/supabase/migrations/038..042_membership_*.sql` — **[SOURCE VERIFIED]**.
- **RLS/grant/RPC-state corroboration:** `.temp/zt-041-state.sql`, `zt-staging-verify.sql`, `zt-staging-verify-grants.sql`, `zt-staging-041-042-state.sql`, `zt-membership-state-functions.sql`, `zt-staging-object-state.sql`, `zt-staging-phase7-read2.sql`, `zt-041-state.sql` — audit SQL read but **not executed** this session — **[SOURCE VERIFIED (script)]**.
- **Public data layer:** `assets/js/repositories/MembershipRepository.js`, `membership-view.js`, `membership.config.js`, `repositories/MediaResolver.js`, `lib/content-loader.js` (~L1793), `lib/shared-components.js` (~L348), `lib/page-identity.js`, `index.html` (L8/L224/L231/~L292), `index_clean.html` (~L571), `_runtime_captures/home_dom.txt` (~L1043–1058) — **[SOURCE VERIFIED]**; runtime script list corroborated by captured DOM.
- **Admin layer:** `src/app/membership/page.tsx`, `src/app/dashboard/memberships/page.tsx` + `@/features/memberships/memberships-cms.tsx`, `src/app/dashboard/members/page.tsx` + `@/features/members/members-view.tsx`, `src/app/api/membership-plans/route.ts`, `src/app/api/admin/[resource]/route.ts`, `src/app/api/admin/[resource]/[id]/route.ts`, `src/app/api/admin/customer-memberships/[id]/cancel|renew/route.ts`, `src/lib/membership-handler.ts`, `repository.ts`, `api.ts`, `auth/server.ts`, `db/schema.ts`, `resource-config.ts`, `validation/admin.ts`, `page-scope.ts`, `media/resolver.ts`, `lib/constants/nav.ts` — **[SOURCE VERIFIED]**.
- **Runtime:** dev server boot + `401` on `/api/admin/membership-plans` — **[RUNTIME VERIFIED]**.
- **Blocked:** live Supabase SQL execution — **[BLOCKED]** (single DNS attempt, NXDOMAIN).
- **Not found:** `pg_cron`/`supabase/functions/`/Edge Function, `membership activate/renew/expiry` RPC, a base `customer-memberships` route, the old `/api/admin/membership/{reorder|registration-fee,…}` routes, a static `membership.html` page, `headline_benefit_id` in `schema.ts`/`MembershipsCms` — **[NOT FOUND]** (read + search).
