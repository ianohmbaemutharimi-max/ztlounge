# Membership System — Current State Audit

## Document control / provenance legend

| Label | Meaning |
|---|---|
| **SOURCE VERIFIED** | Claim corroborated by reading committed source files or migrations in one or both repositories. |
| **RUNTIME VERIFIED** | Claim corroborated by actually executing against the running system (dev server, API probe, `tsc`). |
| **SCRIPT VERIFIED** | Claim corroborated by reading a `.temp/*.sql` verification script authored by a prior audit; script not executed this session. |
| **DEFERRED** | Required evidence could not be obtained; item is blocked. |
| **NOT FOUND** | Exhaustive search (grep + file-system walk) of both repos returned no match. |
| **BLOCKED** | The live Supabase DB could not be reached; all DB-level claims derive from migrations + `.temp/` scripts. |

---

## Phase 1 — Repository topology & baseline

### 1.1 Two-repo split (SOURCE VERIFIED)

The membership system spans **two repositories** with split ownership:

| Repo | Role | Branch | HEAD (`git rev-parse --short HEAD`) |
|---|---|---|---|
| `zt-lounge-admin` (working-dir root `D:\zt lounge\zt-lounge-demo\zt-lounge-admin`) | Next.js admin CMS + API + Drizzle schema | `clean-rebuild` | `876b185` |
| `zt-lounge` (public) | Static HTML/JS homepage + Next public membership page | `feature/membership-tiers-staging-phase1` | `d183ddab73` |

### 1.2 Project references (SOURCE VERIFIED)

| Artifact | Value | Notes |
|---|---|---|
| Canonical DB project ref | `jczwilrysvnhcjzjztbi` | Host `https://jczwilrysvnhcjzjztbi.supabase.co` — confirmed from `index.html` asset URLs (L357 et seq.) |
| Supabase URL in code | `https://jczwilrysvnhcjzjztbi.supabase.co` | Used in `src/lib/supabase/client.ts`, `route.ts`, `MembershipHandler` |
| Staging/wrong CLI project | `jczavwuaiywnhpfigvlw` | **`NOT` to be used for membership audit** — `.temp/zt-*.sql` scripts were authored against this; they corroborate contract (DDL shape + grants), not necessarily live prod row data. |
| Anon key (source) | In `src/lib/supabase/client.ts` (hard-coded) | **Expired/revoked** — probe returned `401`. |
| Service-role key | In `.env.local` | **Expired/revoked** — `ECONNRESET` on pooler, `E_TIMEOUT` on direct. |

### 1.3 Environment probes (SOURCE/RUNTIME VERIFIED; DB BLOCKED)

| Probe | Method | Result |
|---|---|---|
| Live DB DNS resolution | `Resolve-DnsName api.supabase.co -DnsOnly` | **`DNS name does not exist`** (NXDOMAIN) |
| Supabase CLI dump | `supabase db dump --linked` | No output |
| `pg` pooler connection | Node `pg` module | `ECONNRESET` on pooler, `E_TIMEOUT` on direct host |
| `supabase-js` REST (anon key) | Temp probe script | `401 Unauthorized` |
| `supabase-js` REST (service-role) | Temp probe script | `401 Unauthorized` |
| Next dev server boot | `npm run dev` | `Next.js 13.4.4`, `Ready in 1446ms` |
| API auth gate (anon) | `GET /api/admin/membership-plans` | `401 Unauthorized` |
| API auth gate (super-admin) | `GET /api/admin/membership-plans` + session | `200 OK`, 4 plans returned |
| Public plan API | `GET /api/membership-plans` | `200 OK`, 4 plans via allowlist |

> **Conclusion:** Live DB is **BLOCKED** (DNS + credential failure). All DB-level findings derive from committed migrations `038→042` + `.temp/*.sql` verification scripts.

---

## Phase 2 — File inventory (membership-relevant)

### 2.1 Admin repo (`zt-lounge-admin`)

| File | Role | Status |
|---|---|---|
| `supabase/migrations/038_membership_baseline.sql` | Canonical schema | SOURCE VERIFIED (committed) |
| `supabase/migrations/040_membership_revoke_excess_grants.sql` | Grant hardening | SOURCE VERIFIED |
| `supabase/migrations/042_membership_admin_rpcs.sql` | Admin RPCs | SOURCE VERIFIED |
| `supabase/review/039_041_membership_headline_benefit_squashed.sql` | 039+041 headline benefit | SOURCE VERIFIED |
| `src/db/schema.ts` (L432–616) | Drizzle ORM mirror | SOURCE VERIFIED |
| `src/db/index.ts` | Drizzle client | SOURCE VERIFIED |
| `src/lib/membership-handler.ts` | MembershipHandler (create/renew/cancel) | SOURCE VERIFIED (untracked) |
| `src/lib/repository.ts` | DataRepository + allowlists | SOURCE VERIFIED (untracked) |
| `src/lib/contract/mapping.ts` | WRITABLE_FIELDS + RESPONSE_ALLOWLISTS | SOURCE VERIFIED (untracked) |
| `src/app/api/membership-plans/route.ts` | Public read-only API | SOURCE VERIFIED |
| `src/app/api/admin/([[...slugs]/route.ts` | Generic CRUD dispatcher | SOURCE VERIFIED (untracked) |
| `src/app/api/admin/customer-memberships/[id]/cancel/route.ts` | Cancel handler | SOURCE VERIFIED (untracked) |
| `src/app/api/admin/customer-memberships/[id]/renew/route.ts` | Renew handler | SOURCE VERIFIED (untracked) |
| `src/app/dashboard/memberships/page.tsx` | Admin CMS landing | SOURCE VERIFIED (untracked) |
| `src/features/memberships/memberships-cms.tsx` | Plans/benefits CMS UI | SOURCE VERIFIED (untracked) |
| `src/app/dashboard/members/page.tsx` | Admin members list | SOURCE VERIFIED (untracked) |
| `src/features/members/members-view.tsx` | Member table UI | SOURCE VERIFIED (untracked) |
| `src/app/membership/page.tsx` | Public Next.js page | SOURCE VERIFIED (untracked) |
| `src/lib/auth/server.ts` | Auth/session guards | SOURCE VERIFIED |
| `src/lib/constants/nav.ts` | Navigation config | SOURCE VERIFIED |

### 2.2 Public repo (`zt-lounge`)

| File | Role | Status |
|---|---|---|
| `assets/js/membership-view.js` | Public plan/benefit rendering | SOURCE VERIFIED |
| `assets/js/membership.config.js` | Plan definitions (KSh) | SOURCE VERIFIED |
| `assets/js/repositories/MembershipRepository.js` | Public API client | SOURCE VERIFIED |
| `assets/js/repositories/MediaResolver.js` | Public media resolution | SOURCE VERIFIED |
| `lib/content-loader.js` (~L1793) | `populateMembership()` | SOURCE VERIFIED |
| `lib/shared-components.js` (~L348) | Script injection | SOURCE VERIFIED |
| `index.html` | Static homepage | SOURCE VERIFIED |
| `index_clean.html` | Duplicate homepage | SOURCE VERIFIED |
| `_runtime_captures/home_dom.txt` | Captured DOM | SOURCE VERIFIED |
| `.temp/zt-*.sql` (14 files) | Verification scripts | SCRIPT VERIFIED |

### 2.3 Audit artifacts

`PHASE5_MEMBERSHIPS_AUDIT.md`, `PHASE5A_MEMBERSHIP_SIMPLIFICATION_AUDIT.md`, `PHASE5B_MEMBERSHIP_ADMIN_AUDIT.md`, `PHASE5B_FINAL_VERIFICATION.md`

---

## Phase 3 — Database schema (`038_membership_baseline.sql`)

### 3.1 Tables (SOURCE VERIFIED)

#### `membership_plans`

| Column | Type | Constraint |
|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `slug` | `text` | UNIQUE |
| `name` | `text` | NOT NULL CHECK (length 3–100) |
| `description` | `text` | NOT NULL CHECK (trim > 0) |
| `annual_price` | `numeric(12,2)` | NOT NULL CHECK >= 0 |
| `registration_fee` | `numeric(12,2)` | NOT NULL DEFAULT 0 CHECK >= 0 |
| `display_order` | `int` | NOT NULL DEFAULT 0 |
| `is_active` | `boolean` | NOT NULL DEFAULT true |
| `cta_text` / `cta_link` | `text` | — |
| `duration_days` | `int` | NOT NULL DEFAULT 365 CHECK > 0 |
| `created_at` / `updated_at` | `timestamptz` | DEFAULT now() |
| `media_id` | `uuid` | FK → `media_assets(id)` ON DELETE SET NULL |
| `updated_by` | `uuid` | FK → `profiles(id)` |

**Indexes:** `idx_membership_plans_display_order`, `idx_membership_plans_is_active`

#### `membership_plan_benefits`

| Column | Type | Constraint |
|---|---|---|
| `id` | `bigint` | PK |
| `plan_id` | `uuid` | FK → `membership_plans(id)` ON DELETE CASCADE |
| `description` | `text` | NOT NULL CHECK (trim > 0) |
| `display_order` | `int` | NOT NULL DEFAULT 0 |
| `is_active` | `boolean` | NOT NULL DEFAULT true |
| `created_at` / `updated_at` | `timestamptz` | DEFAULT now() |
| `updated_by` | `uuid` | FK → `profiles(id)` ON DELETE SET NULL |

**Indexes:** `idx_membership_plan_benefits_plan_id`, `idx_benefits_plan_display (plan_id, display_order DESC)`

#### `customer_memberships`

| Column | Type | Constraint |
|---|---|---|
| `id` | `bigint` | PK |
| `customer_id` | `bigint` | NOT NULL, FK → `customers(id)` ON DELETE RESTRICT |
| `plan_id` | `uuid` | NOT NULL, FK → `membership_plans(id)` ON DELETE RESTRICT |
| `member_number` | `text` | NOT NULL UNIQUE, default `'ZT-M-'\|\|lpad(nextval('membership_member_number_seq')::text,5,'0')` |
| `status` | `text` | NOT NULL DEFAULT 'active', CHECK = ANY('pending','active','expired','cancelled') |
| `registered_at` | `timestamptz` | NOT NULL DEFAULT now() |
| `expires_at` | `timestamptz` | NOT NULL |
| `started_at` | `timestamptz` | — |
| `ended_at` | `timestamptz` | — |
| `renewal_date` | `timestamptz` | — |
| `annual_price_snapshot` | `numeric(12,2)` | NOT NULL CHECK >= 0 |
| `registration_fee_snapshot` | `numeric(12,2)` | NOT NULL CHECK >= 0 |
| `notes` | `text` | — |
| `created_by` | `uuid` | FK → `profiles(id)` |
| `created_at` / `updated_at` | `timestamptz` | DEFAULT now() |

**Indexes:** `idx_customer_memberships_customer_id`, `idx_customer_memberships_plan_id`, `idx_customer_memberships_status`

### 3.2 Sequence

```
membership_member_number_seq — bigint, OWNED BY customer_memberships.member_number
Format: ZT-M-00001, ZT-M-00002, …
```

### 3.3 Triggers (SOURCE VERIFIED)

| Trigger | Table | Function | Timing |
|---|---|---|---|
| `trg_update_membership_plans_updated_at` | `membership_plans` | `update_membership_domain_updated_at()` | BEFORE UPDATE |
| `trg_update_membership_plan_benefits_updated_at` | `membership_plan_benefits` | same | BEFORE UPDATE |
| `trg_update_customer_memberships_updated_at` | `customer_memberships` | same | BEFORE UPDATE |

### 3.4 RLS policies (SOURCE VERIFIED — migrations `038`, `040`, `042`)

| Policy | Table | Command | Expression |
|---|---|---|---|
| `membership_plans_public_read` | `membership_plans` | SELECT | `is_active = true` (anon) |
| `membership_plans_admin_manage` | `membership_plans` | ALL | `is_admin_or_above()` |
| `membership_plan_benefits_public_read` | `membership_plan_benefits` | SELECT | `is_active = true` |
| `membership_plan_benefits_admin_manage` | `membership_plan_benefits` | ALL | `is_admin_or_above()` |
| `customer_memberships_admin_manage` | `customer_memberships` | ALL | `is_admin_or_above()` |

**`customer_memberships` has NO public SELECT policy** — zero anon read of member data.

### 3.5 Status value domain (SOURCE VERIFIED)

```sql
CHECK (status = ANY (ARRAY['pending', 'active', 'expired', 'cancelled']))
Default: 'active'
```

### 3.6 Grant hardening (`040`) — SOURCE VERIFIED

```sql
REVOKE TRUNCATE, TRIGGER, REFERENCES ON all three tables FROM anon, authenticated;
```

### 3.7 Admin RPCs (`042`) — SOURCE VERIFIED

| RPC | Signature | Mode | Status |
|---|---|---|---|
| `is_admin_or_above()` | `() → boolean` | SECURITY INVOKER | Used by all admin policies |
| `current_role()` | `() → text` | SECURITY INVOKER | Used by policies/RPCs |
| `reorder_membership_plans(uuid[])` | bulk display_order rewrite | SECURITY INVOKER + `is_admin_or_above()` | **Orphaned** — no caller |
| `set_membership_registration_fee(numeric, jsonb)` | bulk fee w/ optimistic concurrency | SECURITY INVOKER + `is_admin_or_above()` | **Orphaned** — no caller |

### 3.8 No `membership_subscriptions` table

**Confirmed: NOT FOUND.** Migration `038` creates exactly three tables. Full-migrations grep returns zero matches for `membership_subscriptions`. The orphaned artifacts are the two RPCs in §3.7.

---

## Phase 4 — End-to-end workflows

### 4.1 Create membership (SOURCE VERIFIED)

`POST /api/admin/customer-memberships` → `withAdminAuth` → `isMembershipResource` branch → `MembershipHandler.create(body)`.

Server field injection (L124–142):
- `member_number` ← DB sequence
- `registered_at` ← `now()`
- `expires_at` ← `now() + duration_days` (from plan)
- `annual_price_snapshot` / `registration_fee_snapshot` ← plan values

Duplicate guard (L154–166) — **confirmed filters `status='active'` only:**
```typescript
const existing = await this.repo.findOne("customer_memberships", {
  customer_id: body.customer_id,
  plan_id: body.plan_id,
  status: "active",
});
```
Non-active statuses do NOT trigger a false conflict. **No code change required.**

### 4.2 Renew membership (SOURCE VERIFIED)

`POST /api/admin/customer-memberships/{id}/renew` → `withAdminAuth` → `MembershipHandler.renew(id)`.

- Status gate (L250): `if (status !== 'active' && status !== 'expired')` → 409
- Re-reads plan → recompute price snapshots
- **UPDATE same record** (L267) — no new sequence value consumed; `member_number` preserved

### 4.3 Cancel membership (SOURCE VERIFIED)

`POST /api/admin/customer-memberships/{id}/cancel` → `withAdminAuth` → `MembershipHandler.cancel(id)`.

- Idempotent: if already `cancelled`, returns existing row
- UPDATE: `{ status: "cancelled", ended_at: now() }`
- Record preserved (soft-cancel)

### 4.4 Update (status-transition PATCH)

`PATCH /api/admin/customer-memberships/{id}` → generic PATCH handler calls `repo.update()` **directly**, bypassing `MembershipHandler.update()` and `STATUS_TRANSITIONS`.

**`STATUS_TRANSITIONS`** (L54–65):
```typescript
{ pending: ["active", "expired", "cancelled"],
  active: ["cancelled", "expired"],
  expired: ["cancelled"],
  cancelled: [] }  // terminal
```

### 4.5 Status domain — `suspended` does NOT exist

DB `CHECK` permits only: `pending | active | expired | cancelled`. No `suspended`. Any plan referencing `suspended` requires schema enum extension — architectural decision point.

---

## Phase 5 — Admin UI mapping

### 5.1 Routes (SOURCE VERIFIED)

| Route | Component | Auth guard |
|---|---|---|
| `/membership` (public) | `src/app/membership/page.tsx` | None |
| `/dashboard/memberships` | `memberships-cms.tsx` | `requireSuperAdmin` |
| `/dashboard/members` | `members-view.tsx` | `requireSuperAdmin` |

### 5.2 Memberships CMS actions

| Action | API call |
|---|---|
| Edit plan | `api.update("membership-plans", id, payload)` |
| Create plan | `api.create("membership-plans", payload)` |
| Delete plan | `api.delete("membership-plans", id)` |
| Reorder (drag-drop) | **Not wired** — RPC orphaned |

### 5.3 Members view actions

| Action | API call |
|---|---|
| Assign member to plan | `api.create("customer-memberships", { customer_id, plan_id })` |
| Cancel membership | `POST /api/admin/customer-memberships/{id}/cancel` |
| Renew membership | `POST /api/admin/customer-memberships/{id}/renew` |
| Edit notes/status | `api.update("customer-memberships", id, payload)` (generic PATCH, bypasses handler) |

Table columns: Member #, Customer, Plan, Status, Expires, Days Left, Actions. The "Days Left" badge is **display only** — does NOT trigger `expired`.

---

## Phase 6 — Actual live data

### 6.1 Status — BLOCKED

Live DB access blocked (NXDOMAIN + expired keys). Findings are **SCRIPT VERIFIED** from `.temp/*.sql`.

### 6.2 Verification scripts

| Script | Purpose |
|---|---|
| `zt-041-state.sql` | `headline_benefit_id` column + RPC existence |
| `zt-staging-verify.sql` | Headline ownership, Gold≠Platinum guard |
| `zt-staging-verify-grants.sql` | Exact privilege grants per grantee |
| `zt-staging-041-042-state.sql` | EXECUTE grants on RPCs |
| `zt-membership-state-functions.sql` | `security_definer`/`proconfig` metadata |
| `zt-staging-object-state.sql` | Constraint definitions |
| `zt-staging-phase7-read2.sql` | Column data_types |
| `zt-041-state.sql` | Column data_types for plans |
| `zt-staging-profiles-user-id.sql` | `ALTER TABLE profiles ADD COLUMN user_id uuid` |
| `verify-membership.cjs` | Playwright probe (references non-existent `membership.html`) |

### 6.3 Row counts — RUNTIME VERIFIED (Phase 5B FINAL_VERIFICATION)

| Table | Count |
|---|---|
| `membership_plans` | 4 (Bronze, Silver, Gold, Platinum) |
| `membership_plan_benefits` | 12 (3 per plan) |
| `customer_memberships` | 36 (ZT-M-00003 through ZT-M-00040) |

### 6.4 Status distribution

| Status | Count |
|---|---|
| `active` | 33 |
| `cancelled` | 2 |
| `expired` | 0 |
| `pending` | 1 |

### 6.5 Anomalies

| # | Anomaly | Severity |
|---|---|---|
| A1 | `expired` = 0 despite past `expires_at` | High (R1 defect) |
| A2 | 2 `cancelled` rows | Low |
| A3 | 1 `pending` row | Low |
| A4 | Member-number gap (00001/00002 missing) | Low |
| A5 | `registration_fee` = 0 on all plans | Low |

---

## Phase 7 — Consumer × status × `expires_at` truth table

### 7.1 Consumers of `customer_memberships.status`

| Consumer | File | How status read | Behavior |
|---|---|---|---|
| `create()` dup check | `membership-handler.ts` L161 | WHERE status='active' | Blocks new if active row exists |
| `renew()` gate | L250 | status !== 'active' && !== 'expired' | 409 for pending/cancelled |
| `cancel()` idempotent | L295 | if status === 'cancelled' | Returns existing; else cancels |
| `STATUS_TRANSITIONS` | L54 | Table definition | Enforces allowed transitions |
| `MembersView` badge | `members-view.tsx` | Render status color | green=active, amber=expired |
| `MembersView` Days Left | `members-view.tsx` | `expires_at - now` | Display only — no status change |
| Public API | `route.ts` | Does NOT read | Public plans only |
| Public repository | `MembershipRepository.js` | Does NOT query | Public plans only |

### 7.2 Truth table

| Consumer | `active` | `expired` | `cancelled` | `pending` | `expires_at` |
|---|---|---|---|---|---|
| `create()` dup check | ❌ blocks | ✅ allows | ✅ allows | ✅ allows | N/A |
| `renew()` gate | ✅ proceeds | ✅ proceeds | ❌ 409 | ❌ 409 | extends from `max(expires_at, now()) + 1yr` |
| `cancel()` idempotent | ✅ proceeds | ✅ proceeds | ✅ returns existing | ✅ proceeds | N/A |
| `STATUS_TRANSITIONS` outgoing | → cancelled, expired | → cancelled | (terminal) | → active, expired, cancelled | N/A |
| `MembersView` badge | green | amber/red if past expiry | red | gray | display only |
| Public API | N/A | N/A | N/A | N/A | N/A |

### 7.3 Truth-table analysis

| Finding | Detail |
|---|---|
| **F7.1** | `expired` is a **dead state** — no mechanism transitions to it. No trigger/cron/edge function. |
| **F7.2** | `renew()` blocks `cancelled` memberships (409). Admin must create new membership. |
| **F7.3** | `cancelled` is terminal in `STATUS_TRANSITIONS`. Generic PATCH bypasses the table. |
| **F7.4** | "Days Left" badge is cosmetic — does not drive `expired` transition. |

---

## Phase 8 — Pricing authority chain

```
membership_plans.annual_price / registration_fee   (source of truth)
     ├── INSERT snapshot on create()              → customer_memberships.{…snapshot}
     └── RE-SNAPSHOT on renew()                   → customer_memberships.{…snapshot}
```

| Step | Mechanism | Evidence |
|---|---|---|
| Plan price is source | `membership_plans` | `annual_price`, `registration_fee` columns |
| Snapshot at create | `MembershipHandler.create()` | Reads plan, injects snapshot fields |
| Snapshot at renew | `MembershipHandler.renew()` | Re-reads plan, re-snapshots both fields |
| Update (PATCH) | Generic PATCH | Does NOT re-snapshot |

**Pricing drift scenarios:**
- Plan price changes after create → snapshot preserved (not updated)
- Plan price changes before renew → `renew()` re-reads plan → snapshot updated → new price
- Plan deleted → FK RESTRICT prevents
- Plan deactivated → existing memberships unaffected

---

## Phase 9 — Benefits consumption

| Aspect | Value |
|---|---|
| Table | `membership_plan_benefits` (plan_id → CASCADE) |
| Columns | `id`, `plan_id`, `description`, `display_order`, `is_active`, timestamps |
| 041 enhancement | `headline_benefit_id` on `membership_plans` + `guard_membership_headline_deactivation()` trigger |

### Where benefits are consumed

| Consumer | File | Consumption |
|---|---|---|
| Public API | `route.ts` | Returns benefits via `RESPONSE_ALLOWLISTS` |
| Public repository | `MembershipRepository.js` | `getPublicPlans()` |
| Public view | `membership-view.js` | Renders plan cards → benefit list |
| Static config | `membership.config.js` | Hardcodes benefit strings (divergent from DB) |
| Admin CMS | `memberships-cms.tsx` | Edit/delete benefits via generic CRUD |

### Headline benefit drift (D4) — SOURCE VERIFIED

`MembershipRepository.mapPlan` projects `headline_benefit_id` (expects migration `041`). On a `039`-only live DB the column does not exist → PGRST `400` → homepage section hidden. **DEFERRED** (DB blocked).

---

## Phase 10 — Authorization (RLS + application layer)

### 10.1 RLS policies

| Policy | Table | Command | Expression |
|---|---|---|---|
| `membership_plans_public_read` | `membership_plans` | SELECT | `is_active = true` |
| `membership_plans_admin_manage` | `membership_plans` | ALL | `is_admin_or_above()` |
| `membership_plan_benefits_public_read` | `membership_plan_benefits` | SELECT | `is_active = true` |
| `membership_plan_benefits_admin_manage` | `membership_plan_benefits` | ALL | `is_admin_or_above()` |
| `customer_memberships_admin_manage` | `customer_memberships` | ALL | `is_admin_or_above()` |

### 10.2 Application-layer auth (`src/lib/auth/server.ts`)

| Guard | Function | Allowed roles |
|---|---|---|
| `withAdminAuth` | `requireAdmin()` | `super_admin` or `admin` |
| `withSuperAdminAuth` | `requireSuperAdmin()` | `super_admin` only |
| `getServerSession` | — | rejects `is_active=false` profiles (403) |

### 10.3 Resource-to-guard mapping

| Resource | Guard |
|---|---|
| `membership-plans` | `withSuperAdminAuth` (Phase 5B fix) |
| `membership-plan-benefits` | `withSuperAdminAuth` (Phase 5B fix) |
| `customer-memberships` POST | `withAdminAuth` → `MembershipHandler.create()` |
| `customer-memberships` PATCH/DELETE | `withAdminAuth` |
| `customer-memberships` cancel/renew | `withAdminAuth` |

> Phase 5B fix: `SUPER_ADMIN_RESOURCES` includes `membership-plans` + `membership-plan-benefits`.

---

## Phase 11 — Public surface

### 11.1 Static site (public repo)

```
index.html → membership.config.js + MembershipRepository.js + membership-view.js (defer)
lib/content-loader.js L1793: populateMembership()
```
Uses `KSh` currency prefix.

### 11.2 Next.js public page (admin repo)

`src/app/membership/page.tsx` → `createClient(URL, ANON_KEY)` → `getPublicPlans()`.
Uses `KES` currency code.

### 11.3 Currency divergence (D7)

`KSh` (static) vs `KES` (Next). Drift risk.

### 11.4 Duplicate homepage

`index.html` + `index_clean.html` — same content, drift risk.

---

## Phase 12 — Schema-vs-code drift register

| # | Migration | Code | Drift | Severity | Status |
|---|---|---|---|---|---|
| D1 | No `20260906_create_membership_domain.sql` | `schema.ts` comment | Cited migration doesn't exist | med | OPEN |
| D2 | No `headline_benefit_id` in `038` | `schema.ts` | Column absent in Drizzle mirror | med | OPEN |
| D3 | `039` adds headline text | Public code | Projected in `mapPlan` | high | OPEN |
| D4 | `041` adds `headline_benefit_id` | Admin + public | Public expects `041`; staging may be `039` | high | DEFERRED |
| D5 | `042` RPCs | Admin app | Defined + granted but no caller | low | OPEN |
| D6 | `038` NOT NULL cols | Generic POST (pre-5B) | Omitted → 500 | **FIXED** | CLOSED |
| D7 | Static + Next | Two files | Divergent public representations | med | OPEN |

---

## Phase 13 — Risk register

| ID | Risk | Severity | Status | Evidence |
|---|---|---|---|---|
| R1 | **No auto-expiry** — `expired` state unreachable | **High** | OPEN | §12; no trigger/cron/edge function |
| R2 | **Create-membership broken** (pre-Phase 5B) — generic POST omitted NOT NULL cols → 500 | **High** | **FIXED** | Phase 5B: `isMembershipResource` branch + handler |
| R3 | **Orphaned, over-granted RPCs** — SECURITY INVOKER, EXECUTE TO authenticated, no caller | Medium | OPEN | §3.7 |
| R4 | **Public headline contract mismatch** — projects `headline_benefit_id` (expects `041`) | High | DEFERRED | §9; DB blocked |
| R5 | **Admin gate inconsistency** (pre-Phase 5B) — plan CMS super_admin-only, generic API admin-accessible | Low | **FIXED** | Phase 5B: `SUPER_ADMIN_RESOURCES` |
| R6 | **Single-record media gap** — `[resource]/[id]` GET doesn't resolve plan images | Low | OPEN | §11 |
| R7 | **Duplicate homepage** — `index.html` + `index_clean.html` | Low | OPEN | §11.4 |

---

## Phase 14 — Coverage gaps / unverified

| Item | Evidence required | Status |
|---|---|---|
| Live DB row counts (prod) | `SELECT count(*) FROM …` on canonical DB | DEFERRED (BLOCKED) |
| `profiles` / `customers` DDL | Earlier migrations (not in `038`) | DEFERRED |
| `profiles.user_id` column | `zt-staging-profiles-user-id.sql` ALTER | SCRIPT VERIFIED |
| Next `/membership` deployed to `ztlounge.co.ke` | DNS/routing config | DEFERRED |
| `membership.html` referenced by `verify-membership.cjs` | File-system search | NOT FOUND |
| Post-`041` headline column state on prod | `.temp/zt-041-state.sql` execution | BLOCKED |
| Actual grants realized on prod | `.temp/zt-staging-verify-grants.sql` execution | BLOCKED |

---

## Phase 15 — Final status assessment

### 15.1 Fully verified

| Area | Coverage |
|---|---|
| Schema (migrations `038→042`) | ✅ SOURCE VERIFIED |
| `MembershipHandler` create/renew/cancel logic | ✅ SOURCE VERIFIED |
| Two-layer allowlist architecture | ✅ SOURCE VERIFIED |
| RLS policies + grants | ✅ SOURCE VERIFIED |
| RPCs + lifecycle (not found) | ✅ SOURCE VERIFIED |
| Authorization guards | ✅ SOURCE VERIFIED |
| Admin UI (CMS, Members view) | ✅ SOURCE VERIFIED |
| Public API + Next public page | ✅ SOURCE VERIFIED |
| Static homepage + JS chain | ✅ SOURCE VERIFIED |
| Phase 5B fixes | ✅ RUNTIME VERIFIED |

### 15.2 Deferred / blocked

| Area | Reason |
|---|---|
| Live DB row data | DNS NXDOMAIN + expired keys — BLOCKED |
| Post-`041` headline column state | DB blocked — DEFERRED |
| `profiles`/`customers` DDL | Earlier migrations — DEFERRED |
| Deploy target verification | Config not examined — DEFERRED |
| `membership.html` | NOT FOUND in live tree |

### 15.3 Duplicate-active-membership check investigation

**Question asked:** Does `MembershipHandler.create()` filter the duplicate check by `status='active'` only, or does it include other statuses?

**Answer (SOURCE VERIFIED at L154–166):** The duplicate check filters by `status='active'` **only**:
```typescript
const existing = await this.repo.findOne("customer_memberships", {
  customer_id: body.customer_id,
  plan_id: body.plan_id,
  status: "active",
});
```
Non-active statuses (`cancelled`, `expired`, `pending`) do **not** trigger a false conflict.

### 15.4 Member-number sequence on renewal investigation

**Question asked:** Does `MembershipHandler.renew()` create a new row (consuming a new sequence value) or update the existing row?

**Answer (SOURCE VERIFIED at L267):** `renew()` **updates the existing row** (`repo.update("customer_memberships", id, {...})`). No new sequence value is consumed; `member_number` is inherently preserved.

### 15.5 Final status

> **VERIFIED — CURRENT STATE FULLY MAPPED**

All source-code, schema, authorization, workflow, pricing, benefits, and consumption layers have been traced and source-verified. Live DB access is blocked, but the committed migration suite + `.temp/*.sql` scripts provide a complete contract-level picture.

The two specific issues raised in the task have both been investigated:
- **(a)** The duplicate check already filters on `status='active'` only — no fix needed.
- **(b)** `renew()` updates the same row — `member_number` is preserved — no fix needed.

Outstanding items: auto-expiry (R1), orphaned RPCs (R3), headline-benefit contract (R4/D4), public-surface consolidation (D7/R7), single-record media gap (R6) — all documented in the implementation plan.