# Membership System — Implementation Plan

> **Status:** Implementation-ready (no code changes made in this session)
> **Based on:** `MEMBERSHIP_CURRENT_STATE_AUDIT.md`

---

## Overview — Sequenced remediation

| Phase | Title | Priority | Risk | Effort | Depends on |
|---|---|---|---|---|---|
| P0 | Reconnect to live DB | P0 | — | ½ day | None |
| P1 | Fix auto-expiry (R1) | P0 | High | 2–3 days | P0 |
| P2 | Route generic PATCH through handler (R2) | P0 | High | 1–2 days | P0 |
| P3 | Reconcile headline-benefit contract (D1–D4) | P1 | High | 1 day | P0 |
| P4 | Wire or remove orphaned RPCs (R3) | P1 | Med | 1 day | P0 |
| P5 | Close admin gate gap (R5) — already fixed | P2 | Low | — | — |
| P6 | Fix single-record media gap (R6) | P2 | Low | ½ day | — |
| P7 | Consolidate public surfaces (D7/R7) | P2 | Med | 2 days | — |
| P8 | Migrate static homepage to Next.js | P3 | Med | 3 days | P7 |
| P9 | Reactivation path (arch.) | P3 | Low | ½ day | P1, P2 |

---

## Phase P0 — Reconnect to live database

### Objective

Restore live DB access to enable data verification and runtime validation of all subsequent fixes.

### Actions

1. **Obtain valid credentials** from ownership: Supabase `service_role` key for project `jczwilrysvnhcjzjztbi` or a Supabase Studio temporary session.
2. **Verify DNS** to `jczwilrysvnhcjzjztbi.supabase.co` (was NXDOMAIN).
3. **Run `.temp/` verification scripts:** `zt-041-state.sql`, `zt-staging-verify-grants.sql`, `zt-staging-verify.sql`.
4. **Capture live row counts** + status distributions for all 3 membership tables.
5. **Archive fresh `.sql` snapshot** to `.temp/`.

### Decision point

If DB cannot be restored within 48h → proceed with migration-derived contract only; mark data-dependent tests `@requires-db` SKIP.

### Rollback

None (no state changes). Revoke credentials if project lockout occurs.

### Testability

- `pg_isready` against pooler + direct host
- `supabase-js` anon + service-role key test queries
- `psql -f .temp/zt-041-state.sql`

---

## Phase P1 — Fix auto-expiry (R1)

### Problem

`expired` is a **dead state**. No DB trigger, pg_cron job, or edge function transitions `active → expired` when `expires_at < now()`. The "Days Left" badge is display-only.

### Solution

Daily scheduled expiry sweep as a Postgres function + pg_cron schedule.

### Implementation

#### Step 1: Migration `043_membership_auto_expiry.sql`

```sql
create or replace function expire_memberships()
returns void
language plpgsql
security invoker
as $$
begin
  update public.customer_memberships
  set status = 'expired',
      ended_at = now()
  where expires_at < now()
    and status = 'active';
end;
$$;

revoke execute on function expire_memberships() from anon;
grant execute on function expire_memberships() to authenticated;
```

**Design:** `security invoker`; only expires `active → expired`; does not touch `cancelled`/`pending`.

#### Step 2: pg_cron schedule (preferred)

```sql
-- Requires supabase pgcron extension
select cron.schedule('membership-expiry', '0 2 * * *', $$select expire_memberships()$$);
```

#### Step 3: Edge Function fallback (if no pg_cron)

Deploy `supabase/functions/expire-memberships/index.ts` calling `expire_memberships()` via `supabase-js` service-role, scheduled externally.

### Rollback

- Drop function (migration rollback)
- Unschedule cron
- Remove edge function

### Testability

```sql
-- Pre: test membership expiring yesterday
select expire_memberships();
select status, ended_at from customer_memberships where id = '<test>';
-- expect: status='expired', ended_at IS NOT NULL
```

### Dependencies

- P0 (DB write access)
- `is_admin_or_above()` from `042`

---

## Phase P2 — Route generic PATCH through handler (R2 completion)

### Problem

Phase 5B fixed **POST** only. `PATCH /api/admin/customer-memberships/{id}` still calls `repo.update()` directly, bypassing `STATUS_TRANSITIONS` validation.

### Solution

Route PATCH through `MembershipHandler.update()` (already exists at L199–238).

In `src/app/api/admin/([[...slugs]/route.ts`:
```typescript
if (isMembershipResource(slugs[0])) {
  const result = await membershipHandler.update(id, body, currentStatus);
  return result;
}
```

### Rollback

Revert route change; PATCH falls back to generic `repo.update()`.

### Testability

- PATCH `active → expired` (allowed)
- PATCH `cancelled → active` (should 409 — terminal)

### Risk

Low — `STATUS_TRANSITIONS` already defined; only restricts.

---

## Phase P3 — Reconcile headline-benefit contract (D1–D4, R4)

### Problem

- D1: `schema.ts` references non-existent migration `20260906_create_membership_domain.sql`
- D2: Drizzle mirror lacks `headline_benefit_id` column
- D3: `MembershipsCms` form has no headline-benefit fields
- D4: Public `MembershipRepository.mapPlan` projects `headline_benefit_id` — errors if `041` not on DB

### Solution

**Decision gate (requires P0):** Run `.temp/zt-041-state.sql` to check column existence on live DB.

- If **exists** (041 applied): extend Drizzle mirror + CMS form
- If **not exists** (039 only): remove projection from `mapPlan`, fix comment

### Implementation (if 041 confirmed on DB)

1. Fix `schema.ts`: remove incorrect comment + add `headlineBenefitId` column to Drizzle mirror
2. `mapPlan` projection already correct — no change needed
3. Add headline-benefit selector to `MembershipsCms` plan form

### Rollback

Revert `schema.ts`; restore `mapPlan` projection if removed.

### Testability

- `tsc --noEmit` passes
- `GET /api/membership-plans` returns headline benefit without 400

---

## Phase P4 — Wire or remove orphaned RPCs (R3)

### Problem

`reorder_membership_plans(uuid[])` and `set_membership_registration_fee(numeric, jsonb)` exist in DB (`042`) with `GRANT EXECUTE TO authenticated` but have zero callers.

### Solution

**Wire them into the CMS** (higher value than removal).

#### Step 1: Wire order into Memberships CMS

Add drag-and-drop reordering:
```typescript
const reorderPlans = async (orderedIds: string[]) => {
  await api.rpc("reorder_membership_plans", { plan_ids: orderedIds });
};
```

#### Step 2: Wire fee into bulk-fee UI

Add "Set global registration fee" button.

#### Step 3: Narrow grants

```sql
REVOKE EXECUTE ON FUNCTION reorder_membership_plans, set_membership_registration_fee FROM authenticated;
GRANT EXECUTE ON FUNCTION … TO membership_admin;
```

### Rollback

Remove CMS wiring; new migration restores `authenticated` grant.

### Risk

Low — RPCs are idempotent and `SECURITY INVOKER`.

---

## Phase P5 — Close admin gate gap (R5) — STATUS: FIXED

Phase 5B already resolved: `SUPER_ADMIN_RESOURCES` includes `membership-plans` and `membership-plan-benefits` → both behind `withSuperAdminAuth`. No further action.

**Verified:** `GET /api/admin/membership-plans` with non-super-admin session → 403.

---

## Phase P6 — Fix single-record media gap (R6)

### Problem

`[resource]/[id]/route.ts` GET doesn't resolve `membership-plans` media via `media_id` FK.

### Solution

Add `membership-plans` to `MEDIA_RESOURCES` in media resolver.

### Rollback

Remove from array.

### Testability

`GET /api/admin/membership-plans/{id}` returns `media.url`.

---

## Phase P7 — Consolidate public surfaces (D7/R7)

### Problem

Two divergent public surfaces: static HTML+JS (public repo) vs Next `/membership` (admin repo). Currency diverges: `KSh` vs `KES`.

### Solution

**Decision gate:** Determine which is live on `ztlounge.co.ke`.
- If Next `/membership` is live → deprecate static HTML
- If static is live → keep static, redirect Next page

### Recommended: consolidate on Next.js

1. Migrate static `membership.config.js` content → CMS-managed
2. Ensure Next page renders identical markup
3. Standardize currency → `KES`

### Rollback

Restore `populateMembership()` in content-loader; remove redirect.

### Risk

Medium — public-facing; requires visual verification.

---

## Phase P8 — Remove duplicate homepage (R7 continuation)

Delete `index_clean.html` (tracked duplicate). If untracked, remove from disk.

### Rollback

Restore from git or recreate from `index.html`.

---

## Phase P9 — Reactivate cancelled memberships (architectural)

### Background

`cancelled` is terminal in `STATUS_TRANSITIONS`. Admin can't reactivate — must `create()` new membership (new `member_number`).

### Options

| Option | Pros | Cons |
|---|---|---|
| A: New "Reassign" → create() | Simple, existing path | New `member_number` |
| B: Extend transitions `cancelled → active` | Preserves `member_number` | Changes terminal semantics |
| C: Dedicated `/reactivate` endpoint | Explicit, auditable | Requires handler change |

### Recommendation

**Option C** — `POST /api/admin/customer-memberships/{id}/reactivate`:
1. Validate `status === 'cancelled'`
2. Re-read plan for current prices
3. Set `status='active'`, `started_at=now()`, re-snapshot prices
4. Preserve `member_number` and `id`

Implement **after** P1 + P2 (decision item).

---

## Priority matrix (final)

| Phase | Priority | Effort | Risk | Blocker |
|---|---|---|---|---|
| P0 | P0 | ½ day | None | Credentials |
| P1 | P0 | 2–3 days | High | P0 |
| P2 | P0 | 1–2 days | High | P0 |
| P3 | P1 | 1 day | High | P0 (DB check) |
| P4 | P1 | 1 day | Med | P0 |
| P5 | P2 | — | Low | **FIXED** |
| P6 | P2 | ½ day | Low | — |
| P7 | P2 | 2 days | Med | — |
| P8 | P3 | ½ day | Low | P7 |
| P9 | P3 | ½ day | Low | P1, P2

---