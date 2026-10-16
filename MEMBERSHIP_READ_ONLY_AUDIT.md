# ZT LOUNGE — Membership System Read-Only Audit

> **Forensic source-level audit. No source files, migrations, or database rows were modified.**

**Date:** 2026-10-04
**Repos:** `zt-lounge` (public) @ `feature/membership-tiers-staging-phase1`; `zt-lounge-admin` (admin Next.js app, working tree includes uncommitted Phase 5B fixes).
**Live DB:** Canonical reachable from admin project per `PHASE5B_FINAL_VERIFICATION.md` (host `jczwilrysvnhcjzjztbi.supabase.co`, 4 plans, 36 memberships). Staging project `jczavwuaiywnhpfigvlw` was NXDOMAIN per Phase 5A.

---

## Evidence Index

| Source | File | Lines | Status |
|---|---|---|---|
| Migration `038` | `supabase/migrations/038_membership_baseline.sql` | — | Read (untracked in git) |
| Migration `039` | `supabase/migrations/039_membership_headline_benefit.sql` | — | Read |
| Migration `040` | `supabase/migrations/040_membership_revoke_excess_grants.sql` | — | Read |
| Migration `041` | `supabase/migrations/041_membership_headline_benefit_id.sql` | — | Read (20 lines) |
| Migration `042` | `supabase/migrations/042_membership_admin_rpcs.sql` | — | Read |
| Handler | `Zt-lounge-admin/src/lib/membership-handler.ts` | 1-314 | Read (source verified) |
| Repository | `Zt-lounge-admin/src/lib/repository.ts` | — | Read (WRITABLE_FIELDS, sanitizePayload, create, update, delete) |
| Mapping | `Zt-lounge-admin/src/lib/contract/mapping.ts` | — | Read (empty for membership) |
| Resource config | `Zt-lounge-admin/src/lib/resource-config.ts` | — | Read |
| Admin validation | `Zt-lounge-admin/src/lib/validation/admin.ts` | — | Read (ADMIN_RESOURCES, helper factories) |
| Collection route | `Zt-lounge-admin/src/app/api/admin/[resource]/route.ts` | 1-496 | Read (Phase 5B applied) |
| ID route | `Zt-lounge-admin/src/app/api/admin/[resource]/[id]/route.ts` | 1-496 | Read (PATCH/DELETE bypass confirmed) |
| Cancel route | `…/customer-memberships/[id]/cancel/route.ts` | — | Read |
| Renew route | `…/customer-memberships/[id]/renew/route.ts` | — | Read |
| Public API | `Zt-lounge-admin/src/app/api/membership-plans/route.ts` | — | Read |
| Public page | `Zt-lounge/src/app/membership/page.tsx` | — | Read |
| Public repo JS | `Zt-lounge/assets/js/repositories/MembershipRepository.js` | 1-181 | Read (full) |
| Admin CMS | `Zt-lounge-admin/src/features/memberships/memberships-cms.tsx` | — | Read |
| Drizzle schema | `Zt-lounge-admin/src/db/schema.ts` | 567-620 | Read (membership models) |
| Existing audit | `MEMBERSHIP_CURRENT_STATE_AUDIT.md` | — | Read (cross-referenced) |
| Phase 5B audit | `phasej-audit/PHASE5B_MEMBERSHIP_ADMIN_AUDIT.md` | — | Read (cross-referenced) |
| Phase 5B verify | `phasej-audit/PHASE5B_FINAL_VERIFICATION.md` | — | Read (runtime evidence) |
| Diagnostic SQL | `.temp/zt-041-state.sql` | 1-6 | Read |

---

## 1. Repository Baseline

| Field | Value |
|---|---|
| Public branch | `feature/membership-tiers-staging-phase1` |
| Public HEAD | `d183ddab7399429f3c334c4d288d6b0988a78f89` |
| Admin branch | `clean-rebuild` (working tree includes uncommitted Phase 5B changes) |
| **Migrations tracked in git** | **0** — `git ls-files supabase/migrations/` returns empty |
| **Migrations on disk** | 5 files: `038_membership_baseline.sql` through `042_membership_admin_rpcs.sql` |
| **Migration tracking status** | `038` is untracked (on disk but not committed); `039`–`042` status unverified (git command timed out) |

> **CRITICAL META-FINDING F-0:** Uncommitted database migrations on disk represent a canonical DB drift vector. If `038_membership_baseline.sql` is not committed, a fresh `supabase db push` or CI checkout would lose the entire membership schema. The remaining migration files (`039`–`042`) were likewise not confirmed tracked.

---

## 2. Database Schema (Canonical — Migration `038`)

Migration `038_membership_baseline.sql` creates exactly **three tables** — there is **no** `membership_subscriptions` table.

### 2.1 `membership_plans`

```sql
CREATE TABLE membership_plans (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  description text CHECK (LENGTH(TRIM(description)) >= 3),
  annual_price numeric NOT NULL,
  registration_fee numeric NOT NULL DEFAULT 0,
  media_id    uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  is_active   boolean NOT NULL DEFAULT true,
  cta_text    text CHECK (LENGTH(TRIM(cta_text)) >= 1),
  cta_link    text,
  updated_by  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  timestamp with time zone NOT NULL DEFAULT now(),
  updated_at  timestamp with time zone NOT NULL DEFAULT now()
);
```

### 2.2 `membership_plan_benefits`

```sql
CREATE TABLE membership_plan_benefits (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id       uuid NOT NULL REFERENCES membership_plans(id) ON DELETE CASCADE,
  description   text NOT NULL CHECK (LENGTH(TRIM(description)) >= 3),
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamp with time zone NOT NULL DEFAULT now(),
  updated_at    timestamp with time zone NOT NULL DEFAULT now()
);
```

### 2.3 `customer_memberships` (key columns)

```sql
CREATE TABLE customer_memberships (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id               uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  plan_id                   uuid NOT NULL REFERENCES membership_plans(id) ON DELETE RESTRICT,
  member_number             text NOT NULL UNIQUE DEFAULT
    concat('ZT-M-', lpad(nextval('membership_member_number_seq')::text, 5, '0')),
  status                    text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  registered_at             timestamp with time zone NOT NULL DEFAULT now(),
  expires_at                timestamp with time zone NOT NULL,
  annual_price_snapshot     numeric NOT NULL,
  registration_fee_snapshot numeric NOT NULL,
  notes                     text,
  created_at                timestamp with time zone NOT NULL DEFAULT now(),
  updated_at                timestamp with time zone NOT NULL DEFAULT now()
);
```

### 2.4 Discrepancies from existing audit (`MEMBERSHIP_CURRENT_STATE_AUDIT.md`)

The existing audit makes claims that **do not match the actual migration or source:**

| Existing audit claim | Actual (migration `038` / source) | Impact |
|---|---|---|
| `name CHECK (LENGTH(TRIM(name)) >= 3)` on `membership_plans` | No `name` CHECK; only `name text NOT NULL` | Audit overstated the constraint |
| Columns `started_at`, `ended_at`, `renewal_date` on `customer_memberships` | These columns **do not exist** | Core audit field inventory is wrong |
| `cancel()` sets `ended_at: now()` | `cancel()` sets `{ status: "cancelled" }` only — no `ended_at` column exists | Audit §4.3 is incorrect |
| `expires_at ← now() + duration_days` (from plan) | `addYears(registeredAt, 1)` — hardcoded 1 year; no `duration_days` column | Audit §4.1 is incorrect |
| STATUS_TRANSITIONS `pending → [active, expired, cancelled]` | Actual: `pending → [active, cancelled]` only | Audit §4.4 status machine is wrong |
| `this.repo.findOne(...)` for duplicate check | `this.supabase.from("customer_memberships").select(...)` — direct client call | Audit §4.1 method name is wrong |
| D4: `MembershipRepository.mapPlan` projects `headline_benefit_id` | Does NOT project it — Phase 5A already removed all references | D4 is stale, severity remediated |
| `suspended` status exists | Absent from migration, code, and schema | Audit §4.4 needs this confirmed as absent |

### 2.5 Drizzle mirror (`schema.ts`) drift

`Zt-lounge-admin/src/db/schema.ts` (L567-620) **does** contain membership models, contradicting Phase 5A's claim that it "does not model the membership domain." However, the mirror drifts from migration `038`:

| schema.ts field | Migration `038` | Drift type |
|---|---|---|
| `status: text("status").default("active")` | `DEFAULT 'pending'` | **Behavioral**: ORM says `active`; DB says `pending` |
| `createdBy: uuid("created_by")` on `customerMemberships` | No `created_by` column | **Phantom column**: ORM expects column that doesn't exist |
| Comment: `// migration 20260906_create_membership_domain.sql` | No such migration exists | **Fictional reference** |
| No CHECK constraints modeled | `description CHECK LENGTH >= 3`, `status CHECK IN (...)`, etc. | **Constraint erosion** |

### 2.6 Grants & RLS

- Migration `040` revokes `TRUNCATE`, `TRIGGER`, `REFERENCES` from `anon` and `authenticated`.
- RLS policies (migration `038` + `042`):
  - `membership_plans_public_read`: SELECT `is_active = true`
  - `membership_plans_admin_manage`: ALL `is_admin_or_above()`
  - `membership_plan_benefits_public_read`: SELECT `is_active = true`
  - `membership_plan_benefits_admin_manage`: ALL `is_admin_or_above()`
  - `customer_memberships_admin_manage`: ALL `is_admin_or_above()` (no public read)

### 2.7 Admin RPCs (Migration `042`)

| RPC | Signature | Mode | Caller? |
|---|---|---|---|
| `is_admin_or_above()` | `() → boolean` | SECURITY INVOKER | Used by all admin policies |
| `current_role()` | `() → text` | SECURITY INVOKER | Used by policies/RPCs |
| `reorder_membership_plans(uuid[])` | bulk display_order rewrite | SECURITY INVOKER + `is_admin_or_above()` | **Orphaned — no caller** |
| `set_membership_registration_fee(numeric, jsonb)` | bulk fee w/ optimistic concurrency | SECURITY INVOKER + `is_admin_or_above()` | **Orphaned — no caller** |

---

## 3. Membership Plan Workflow (Admin)

### 3.1 Collection Route

```
POST   /api/admin/membership-plans      → withSuperAdminAuth → repo.create("membership-plans", body)
GET    /api/admin/membership-plans      → withSuperAdminAuth → repo.findAll("membership-plans")
```

Phase 5B fix added `SUPER_ADMIN_RESOURCES = {"membership-plans", "membership-plan-benefits"}` → both routes use `withSuperAdminAuth`.

### 3.2 ID Route (PATCH / DELETE)

```
PATCH   /api/admin/membership-plans/:id  → withSuperAdminAuth → repo.update("membership-plans", id, body)
DELETE  /api/admin/membership-plans/:id  → withSuperAdminAuth → repo.delete("membership-plans", id)
```

Plan/benefit entities are simple CRUD — no `MembershipHandler` method wraps them. `WRITABLE_FIELDS` allowlist respected.

### 3.3 Admin CMS

`memberships-cms.tsx` manages plans and benefits via generic CRUD. No `headline_benefit` fields (Phase 5B: "No app-code reference").

---

## 4. Member Workflow (Admin — Customer Memberships)

### 4.1 CREATE — `POST /api/admin/customer-memberships`

**Route flow (Phase 5B fixed):**
```
POST → [resource]/route.ts L214-221 → isMembershipResource("customer-memberships")
  → new MembershipHandler(repo).create(body)
  → repo.create("customer_memberships", {... ASSIGN_SERVER_FIELDS})
  → 201 Created
```

**`MembershipHandler.create()` (L77-194) — verified source:**

1. **Plan must exist** (L86-92): Queries `membership_plans`. Returns 404 if not found. No `is_active` gate — admins can assign inactive plans.
2. **Customer resolution** (L97-153): By `customer_id` or auto-create by normalized phone via `normalize_customer_phone` RPC.
3. **Duplicate guard** (L155-168) — **direct Supabase call, NOT `repo.findOne()`**:
```typescript
const { data: duplicate } = await this.supabase
  .from("customer_memberships")
  .select("id, member_number")
  .eq("customer_id", customerId)
  .eq("plan_id", planId)
  .eq("status", "active")
  .maybeSingle();
```
Filters `status='active'` ONLY.

4. **Server field injection** (L170-189):
```typescript
const registeredAt = new Date();
const expiresAt = addYears(registeredAt, 1);  // hardcoded 1 year
const created = await this.repo.create("customer_memberships", {
  customer_id, plan_id, status: "active", notes,
  registered_at, expires_at,
  annual_price_snapshot: plan.annual_price,
  registration_fee_snapshot: plan.registration_fee,
}, ASSIGN_SERVER_FIELDS);
```
- `member_number` **omitted** → DB sequence generates `ZT-M-00001`
- `ASSIGN_SERVER_FIELDS = [registered_at, expires_at, annual_price_snapshot, registration_fee_snapshot]`

**Phase 5B runtime evidence:** 201 Created. Row `ZT-M-00040`: seq `ZT-M-00040`, `expires_at` +1yr, snapshots `5000/1000` (Bronze).

### 4.2 UPDATE (Status-Transition PATCH)

**`MembershipHandler.update()` (L195-238):**

1. Extracts `notes` and `status` from body
2. Validates `status` against `MEMBERSHIP_STATUSES = ["pending", "active", "expired", "cancelled"]`
3. Reads current row via `repo.findById("customer-memberships", id)`
4. Validates transition: `STATUS_TRANSITIONS[current.status]` must include `nextStatus`
5. Only `notes` and `status` accepted; all other fields silently dropped
6. Calls `repo.update("customer_memberships", id, patch)` — **WITHOUT `serverFields`**

**STATUS_TRANSITIONS (L33-38):**
```typescript
const STATUS_TRANSITIONS: Record<MembershipStatus, MembershipStatus[]> = {
  pending: ["active", "cancelled"],
  active: ["cancelled", "expired"],
  expired: ["cancelled"],
  cancelled: [],  // terminal
};
```

### 4.3 RENEW — `POST /api/admin/customer-memberships/:id/renew`

Route: `POST → [resource]/[id]/renew/route.ts → withAdminAuth → MembershipHandler.renew(id)`

**`MembershipHandler.renew()` (L246-282):**

1. Fetches current row; **Status gate:** `if (status !== "active" && status !== "expired")` → 409
2. Re-reads plan's current `annual_price` and `registration_fee`
3. `expires_at = addYears(max(current.expires_at, now()), 1)`
4. `repo.update("customer_memberships", id, {status:"active", expires_at, annual_price_snapshot, registration_fee_snapshot}, RENEW_SERVER_FIELDS)`
- `RENEW_SERVER_FIELDS = ["expires_at", "annual_price_snapshot", "registration_fee_snapshot"]`
- UPDATE on existing row — `member_number` preserved

### 4.4 CANCEL — `POST /api/admin/customer-memberships/:id/cancel`

Route: `POST → [resource]/[id]/cancel/route.ts → withAdminAuth → MembershipHandler.cancel(id)`

**`MembershipHandler.cancel()` (L288-302):**
```typescript
async cancel(id: string): Promise<ActionResult<any>> {
  const current = await this.repo.findById("customer-memberships", id);
  if (!current) return notFoundErr("Membership not found");
  if (current.status === "cancelled") return { success: true, data: current };
  const updated = await this.repo.update("customer-memberships", id, {
    status: "cancelled",
  });
  return { success: true, data: updated };
}
```
- Idempotent; only sets `{ status: "cancelled" }` — no `ended_at`
- Record preserved (soft-delete via status)

---

## 5. Lifecycle State Machine

**Source-verified from `STATUS_TRANSITIONS` (membership-handler.ts L33-38):**

```
pending ──→ active ──→ expired ──→ cancelled (terminal)
   │         │            │
   │         └────────────┘
   │
   └─→ cancelled (terminal)

Self-loops: none in STATUS_TRANSITIONS. However, renew() (L246-282)
explicitly sets status back to "active" from either "active" or "expired".
```

**No `suspended` status** — confirmed absent from:
- Migration `038` status CHECK
- `MEMBERSHIP_STATUSES` constant (L29)
- `STATUS_TRANSITIONS` table (L33-38)

**Dead state `expired`:**
- `STATUS_TRANSITIONS` allows `active → expired`
- But **no code path transitions to `expired`**: no trigger, no pg_cron job, no edge function
- MembersView "Days Left" badge (display only) does NOT drive the transition
- **Phase 5B runtime evidence:** 36 rows → `active=33, cancelled=2, expired=0, pending=1`. Zero expired despite past `expires_at`.

---

## 6. Generic CRUD Bypass — The Core Security Gap

### 6.1 Architecture

```
[resource]/route.ts (collection)        [resource]/[id]/route.ts (ID)
  ├─ isBookingResource → BookingHandler.create()
  ├─ isMembershipResource → MembershipHandler.create()  [POST only]
  └─ fallback → repo.create() / repo.update() / repo.delete()  ← generic path
```

### 6.2 What's wired (POST — FIXED)

| Method | Route | Handler | Status |
|---|---|---|---|
| POST | `/api/admin/customer-memberships` | `MembershipHandler.create(body)` | **Wired** (Phase 5B fix F2) |
| POST | `/api/admin/membership-plans` | `repo.create()` (generic) | OK (simple entity) |
| POST | `/api/admin/membership-plan-benefits` | `repo.create()` (generic) | OK (simple entity) |

### 6.3 What's NOT wired (PATCH / DELETE — BYPASS)

| Method | Route | Handler | Bypass |
|---|---|---|---|
| PATCH | `/api/admin/customer-memberships/:id` | `repo.update()` directly | `MembershipHandler.update()` exists but is **dead code** — not imported |
| DELETE | `/api/admin/customer-memberships/:id` | `repo.delete()` directly | No `cancel()` routing; hard DELETE allowed |

**Evidence — `[resource]/[id]/route.ts` imports:**
```
L1:  import { NextRequest, NextResponse } from "next/server";
L3:  import { withAdminAuth, ..., withSuperAdminAuth } from "@/lib/auth/server";
L5:  import { Repository } from "@/lib/repository";
L7:  import { BookingHandler, isBookingResource } from "@/lib/booking-handler";
//   NO import of MembershipHandler
//   NO import of isMembershipResource
```

**Evidence — `[resource]/route.ts` imports (collection, for comparison):**
```
L7:  import { BookingHandler, isBookingResource } from "@/lib/booking-handler";
L9:  import { MembershipHandler, isMembershipResource } from "@/lib/membership-handler";
//    Phase 5B fix F2 added this import — only used in POST branch
```

### 6.4 PATCH bypass chain

1. `PATCH /api/admin/customer-memberships/:id`
2. → `[resource]/[id]/route.ts` PATCH handler (L399-403)
3. → `repo.update("customer_memberships", id, body)` — generic fallback
4. → `sanitizePayload("customer_memberships", body, [])` — `serverFields` defaults to `[]`
5. → Only `WRITABLE_FIELDS["customer_memberships"]` = `[customer_id, plan_id, status, notes]` pass through

**What an admin can do via generic PATCH that the handler would block:**

| Field | Generic PATCH | `MembershipHandler.update()` would block? | Impact |
|---|---|---|---|
| `status: "cancelled"` from `active` | ✅ (in allowlist) | ✅ (valid transition) | Same outcome, no idempotency check |
| `status: "expired"` from `pending` | ✅ (in allowlist) | ✅ (blocked — `pending→expired` not in transitions) | **Bypasses lifecycle validation** |
| `status: "pending"` from `active` | ✅ (in allowlist) | ✅ (blocked — not a valid downward transition) | **Invalid state transition** |
| `status: "active"` from `cancelled` | ✅ (in allowlist) | ✅ (blocked — terminal) | **Re-activates cancelled membership** |
| `status: "active"` from `expired` | ✅ (in allowlist) | ✅ (valid — renew does this) | Bypasses renew() price re-snapshot |
| `expires_at` | ❌ (not in allowlist) | N/A | Protected ✓ |
| `annual_price_snapshot` | ❌ (not in allowlist) | N/A | Protected ✓ |
| `member_number` | ❌ (not in allowlist) | N/A | Protected ✓ |

> **Note:** `sanitizePayload` protects server-derived fields (`expires_at`, snapshots, `member_number`) via the allowlist — those CANNOT be modified even through generic PATCH. However, `status` IS in the allowlist, so the **transition validation** in `STATUS_TRANSITIONS` is completely bypassed.

### 6.5 DELETE bypass

The generic DELETE handler (`repo.delete()`) on `customer_memberships`:
- `customer_memberships` is in `ADMIN_RESOURCES` → `validateResource()` passes
- Hard SQL `DELETE` — no `cancel()` routing, no soft-delete enforcement
- Contradicts the design comment in `cancel()`: "Preserves the record — cancellation is lifecycle state, never deletion."

### 6.6 Dead code: `MembershipHandler.update()`

`MembershipHandler.update()` (L195-238) is fully implemented with `STATUS_TRANSITIONS` validation but **never called** — `[resource]/[id]/route.ts` does not import it. This creates a false sense of security: auditors assume the handler guards PATCH, but it doesn't.

---

## 7. Pricing Authority Chain

**Source of truth:** `membership_plans.annual_price` / `registration_fee`.

```
membership_plans.annual_price / registration_fee   (source of truth)
   ├── INSERT on create()               → customer_memberships.{…snapshot}
   └── RE-SNAPSHOT on renew()           → customer_memberships.{…snapshot}
```

| Operation | Re-reads plan prices? | Snapshots updated? |
|---|---|---|
| `create()` | Yes (L86-90) | Yes — `plan.annual_price`, `plan.registration_fee` |
| `renew()` | Yes (L254-258) | Yes — fresh from plan |
| Generic PATCH | No | No — snapshots not in WRITABLE_FIELDS |

**Phase 5B runtime evidence:** Row `ZT-M-00040` had `annual_price_snapshot=5000, registration_fee_snapshot=1000` matching Bronze plan.

---

## 8. Benefits Consumption

### 8.1 Admin

`memberships-cms.tsx` manages `membership_plan_benefits` via generic CRUD. Freeform `description` text with `display_order` and `is_active`.

### 8.2 Public

```
DB → membership_plan_benefits (public_read: is_active=true)
  → MembershipRepository.getPublicPlans() (L113-137)
  → mapBenefit() (L81-86)
  → membership-view.js → renders <ul> benefit list
```

### 8.3 Headline benefit state

- Migration `039` adds `headline_benefit text`; Migration `041` drops it and adds `headline_benefit_id uuid`
- `.temp/zt-041-state.sql` queries which variant is live
- **Phase 5B:** invariant search for `headline_benefit` across all `assets/js/` + `src/` returns **no matches** — code is agnostic to DB column variant

---

## 9. Public Membership Surface

| Surface | File | Currency | Source |
|---|---|---|---|
| Static homepage (v1) | `index.html` | `KSh` | `MembershipRepository.js` + `membership-view.js` |
| Static homepage (v2) | `index_clean.html` | `KSh` | Same public JS chain |
| Next.js public page | `src/app/membership/page.tsx` | `KES` | `MembershipRepository.js` |
| Public API | `src/app/api/membership-plans/route.ts` | `KES` | Direct DB query via anon client |

### 9.1 `mapPlan` projection (verified)

```javascript
function mapPlan(item) {
    return {
        id: item.id, name: item.name || '', slug: item.slug || '',
        description: item.description ?? null,
        annual_price: Number(item.annual_price),
        registration_fee: Number(item.registration_fee),
        media_id: item.media_id || null,
        display_order: Number(item.display_order || 0),
        is_active: item.is_active === true,
        cta_text: item.cta_text || '',
        cta_link: item.cta_link || ',',    // ← BUG: comma, not empty string
        image_url: null,                  // resolved separately from media_assets
        benefits: []
    };
}
```

**No `headline_benefit_id` projection** — contradicting existing audit D4 ("high"). Phase 5A already removed all references.

### 9.2 `cta_link` fallback bug (F-8)

`MembershipRepository.mapPlan()` L74: `cta_link: item.cta_link || ','` — fallback is **comma** `,` instead of empty string `''`.

### 9.3 Currency divergence (F-12)

Static uses `KSh`; Next.js public page uses `KES`.

---

## 10. Authorization

### 10.1 RLS policies

| Resource | Policy | Command | Expression |
|---|---|---|---|
| `membership_plans` | `public_read` | SELECT | `is_active = true` |
| `membership_plans` | `admin_manage` | ALL | `is_admin_or_above()` |
| `membership_plan_benefits` | `public_read` | SELECT | `is_active = true` |
| `membership_plan_benefits` | `admin_manage` | ALL | `is_admin_or_above()` |
| `customer_memberships` | `admin_manage` | ALL | `is_admin_or_above()` |

### 10.2 Application-layer guards

| Route | Auth | Allowed |
|---|---|---|
| Collection `[resource]/route.ts` | `getAuthWrapper(resource)` | Plans/benefits → `withSuperAdminAuth`; Memberships → `withAdminAuth` |
| ID `[resource]/[id]/route.ts` | `getAuthWrapper(resource)` | Same mapping |
| Cancel/Renew routes | `withAdminAuth` | `super_admin` or `admin` |

Phase 5B fix (F1): `SUPER_ADMIN_RESOURCES = {"membership-plans", "membership-plan-benefits"}` → `withSuperAdminAuth`. Runtime: unauth → 401.

### 10.3 Coverage gap — asymmetric Phase 5B fix

| Operation | Phase 5B coverage | Gap? |
|---|---|---|
| Plans/benefits auth | ✅ `withSuperAdminAuth` | No |
| Member POST | ✅ `MembershipHandler.create()` wired | No |
| Member PATCH | ❌ `repo.update()` generic | **YES** |
| Member DELETE | ❌ `repo.delete()` generic | **YES** |

The `[resource]/[id]/route.ts` file does NOT import `MembershipHandler` or `isMembershipResource`. Only the collection route does.

---

## 11. Two-Layer Allowlist Architecture

**Layer 1 — `WRITABLE_FIELDS` (repository.ts):**

```typescript
const WRITABLE_FIELDS: Record<string, string[]> = {
  "membership-plans": [name, slug, description, annual_price, registration_fee,
    media_id, display_order, is_active, cta_text, cta_link, updated_by],
  "membership-plan-benefits": [plan_id, description, display_order, is_active],
  "customer-memberships": [customer_id, plan_id, status, notes],
};
```

**Layer 2 — `sanitizePayload()`:** Intersects client payload with `WRITABLE_FIELDS[table]` + `serverFields`.

Protects: `member_number`, `expires_at`, snapshots, timestamps, `created_by` — all NOT in WRITABLE_FIELDS.
Does NOT protect: `status` IS in WRITABLE_FIELDS → bypass of `STATUS_TRANSITIONS`.

---

## 12. Findings Register

| ID | Finding | Severity | Evidence (file:line) | Status |
|---|---|---|---|---|
| F-0 | **Uncommitted migrations on disk** — `038` through `042` not tracked in git | **Critical** | `git ls-files` empty; files on disk | OPEN |
| F-1 | **Generic PATCH bypasses STATUS_TRANSITIONS** on `customer-memberships` | **High** | `[id]/route.ts` no handler import; `membership-handler.ts` L33-38 (dead) | OPEN |
| F-2 | **`MembershipHandler.update()` is dead code** — exists but never called | High | `membership-handler.ts` L195-238; `[id]/route.ts` imports (no MembershipHandler) | OPEN |
| F-3 | **Generic DELETE can hard-delete memberships** — no cancel() routing | **High** | `[id]/route.ts` DELETE → `repo.delete()` | OPEN |
| F-4 | **No auto-expiry mechanism** — `expired` state unreachable; 0 expired rows | **High** | Phase 5B runtime: 36 rows, 0 expired | OPEN |
| F-5 | **schema.ts phantom `created_by`** — ORM expects non-existent column | Medium | `schema.ts` L617; migration `038` (no `created_by`) | OPEN |
| F-6 | **schema.ts status default drift** — `default("active")` vs DB `DEFAULT 'pending'` | Medium | `schema.ts` L610; migration `038` L105 | OPEN |
| F-7 | **schema.ts fictional migration comment** — `20260906_create_membership_domain.sql` absent | Low | `schema.ts` L568; `git ls-files` | OPEN |
| F-8 | **`cta_link` fallback bug** — `|| ','` comma instead of `|| ''` empty string | Low | `MembershipRepository.js` L74 | OPEN |
| F-9 | **Drizzle CHECK constraints not modeled** | Medium | `schema.ts` L571-620 (no CHECK) | OPEN |
| F-10 | **Existing audit has stale/inaccurate claims** | Medium | See §12.1 below | OPEN |
| F-11 | **Duplicate homepage** — `index.html` + `index_clean.html` | Low | Both files exist | OPEN |
| F-12 | **Currency divergence** — `KSh` vs `KES` | Low | `index.html` vs `page.tsx` | OPEN |

### 12.1 Existing audit discrepancy register

| Audit claim | Actual source | Corrected ref |
|---|---|---|
| `STATUS_TRANSITIONS` at L54-65; `pending → [active, expired, cancelled]` | L33-38; `pending → [active, cancelled]` | `membership-handler.ts` L33-38 |
| Duplicate check uses `this.repo.findOne(...)` | `this.supabase.from("customer_memberships").select(...)` | L155-162 |
| `cancel()` sets `ended_at: now()` | Only `{ status: "cancelled" }` — no `ended_at` column | L295-297 |
| `expires_at ← now() + duration_days` | `addYears(registeredAt, 1)` — hardcoded 1yr | L170-171 |
| D4: `mapPlan` projects `headline_benefit_id` (high) | Does NOT — Phase 5A removed references | `MembershipRepository.js` L60-78 |
| Phase 6.1: "Live DB access blocked" | Phase 5B queries DB successfully | `PHASE5B_FINAL_VERIFICATION.md` L47-48 |
| Phase 5A: "schema.ts does not model membership" | Models DO exist at L567-620 | `schema.ts` L567-620 |
| `is_active` gate on create() | No gate — admins can assign inactive plans | L86-92 |

---

## 13. Implementation Backlog

| Priority | Finding | Fix | Files | Risk |
|---|---|---|---|---|
| **P0** | F-0 | Commit migrations `038`–`042` to git | `supabase/migrations/` | Low |
| **P0** | F-1 | Wire `MembershipHandler.update()` to PATCH on member ID route | `[id]/route.ts`, `membership-handler.ts` | Medium |
| **P0** | F-3 | Route DELETE on members to `cancel()` instead of hard delete | `[id]/route.ts` | High — data loss prevention |
| **P1** | F-2 | Either wire `update()` OR remove dead method | `membership-handler.ts` | Low |
| **P1** | F-4 | Implement auto-expiry (pg_cron or edge function) | New migration + cron | Medium |
| **P2** | F-5 | Add `created_by` to migration OR remove from schema.ts | Migration or schema.ts | Low |
| **P2** | F-6 | Fix status default in schema.ts: `active` → `pending` | `schema.ts` L610 | Low |
| **P2** | F-7 | Remove fictional migration comment | `schema.ts` L568 | Trivial |
| **P2** | F-9 | Add CHECK constraints to schema.ts | `schema.ts` L571-620 | Low |
| **P3** | F-8 | Fix `cta_link` fallback: `','` → `''` | `MembershipRepository.js` L74 | Low |
| **P3** | F-11 | Consolidate `index.html` + `index_clean.html` | Public repo | Low |
| **P3** | F-12 | Standardize currency | `index.html`, `page.tsx` | Low |

> **P0 rationale:** F-1 and F-3 allow direct status mutation (bypassing lifecycle validation) and permanent data loss. Even though current UI uses dedicated `/cancel` and `/renew` endpoints, the generic PATCH/DELETE endpoints are exposed to any admin.

---

## 14. Evidence Matrix

| Verification | Method | Evidence |
|---|---|---|
| Migration schema | `read_files` on `038_membership_baseline.sql` | Full DDL for 3 tables |
| STATUS_TRANSITIONS | `read_files` on `membership-handler.ts` L33-38 | `pending→[active,cancelled]`, `active→[cancelled,expired]`, `expired→[cancelled]`, `cancelled→[]` |
| PATCH bypass | `read_files` on `[resource]/[id]/route.ts` L1-7, L399-403 | No `MembershipHandler`/`isMembershipResource` import |
| Dead `update()` | `read_files` on `membership-handler.ts` L195-238 | Method exists, no caller |
| Duplicate check | `read_files` on `membership-handler.ts` L155-162 | Direct `supabase.from()` call |
| Cancel (no `ended_at`) | `read_files` on `membership-handler.ts` L295-297 | `{ status: "cancelled" }` only |
| 1-year expiry | `read_files` on `membership-handler.ts` L170-171 | `addYears(registeredAt, 1)` |
| `cta_link` bug | `read_files` on `MembershipRepository.js` L74 | `|| ','` |
| Phase 5B fixes | `PHASE5B_FINAL_VERIFICATION.md` L13-14 | Runtime: 201 Created, 401 on unauth |
| Live DB data | `PHASE5B_FINAL_VERIFICATION.md` L43-44 | 4 plans, 36 members, 33 active, 2 cancelled, 0 expired, 1 pending |
| `member_number` seq | `PHASE5B_FINAL_VERIFICATION.md` L20-21 | `ZT-M-00040`, `ZT-M-00003`…`ZT-M-00040` |
| Price snapshots | `PHASE5B_FINAL_VERIFICATION.md` L20 | `annual_price_snapshot=5000/1000` (Bronze) |
| schema.ts drift | `read_files` on `schema.ts` L567-620 | `default("active")`, phantom `createdBy`, fictional migration comment |
| Headline check | `PHASE5B_FINAL_VERIFICATION.md` L29-30 | `Select-String` invariant `headline_benefit` → none in app code |
| Cancel runtime | `PHASE5B_FINAL_VERIFICATION.md` L40 | `POST .../cancel` → 200, `status→cancelled` |
| TypeScript | `PHASE5B_FINAL_VERIFICATION.md` L15 | `npx tsc --noEmit` → exit 0, 0 errors |
| Public JS syntax | `PHASE5B_FINAL_VERIFICATION.md` L16 | `node --check` x2 → exit 0 |

---

## 15. Summary

The membership system has been comprehensively mapped end-to-end across two repositories. The **core create/renew/cancel workflow** is sound and was runtime-verified in Phase 5B (201 on create, 200 on cancel, 401 on unauth).

The **critical remaining gap** is the asymmetric Phase 5B fix: while POST now correctly routes through `MembershipHandler.create()`, the generic `[resource]/[id]/route.ts` PATCH and DELETE handlers still bypass the handler layer entirely. This means:

1. **Status transitions are not enforced** — any admin can PATCH `status` to any valid value, skipping `STATUS_TRANSITIONS` validation.
2. **Hard DELETE is possible** — no `cancel()` routing means membership history can be permanently destroyed.
3. **The `MembershipHandler.update()` method is dead code** — it exists with proper validation but is never imported by the route handler, creating false audit confidence.

**Three medium-priority drifts** between the Drizzle `schema.ts` mirror and the actual migration `038` (phantom `created_by` column, wrong status default, fictional migration comment) represent type-safety risks but do not affect the runtime Supabase JS client path (the Next admin app uses `supabase.from()` directly, not Drizzle, for membership operations).

**The `cta_link` fallback bug** (`'||',''` instead of `|| ''`') is a low-risk UI defect that produces `href=","` when the column is NULL.

No source files were modified during this audit. All findings are backed by direct source reads cross-referenced against the existing audit corpus and Phase 5B runtime verification evidence.
