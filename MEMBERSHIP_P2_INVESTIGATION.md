# Membership Investigation — P2: F-1 Generic PATCH Bypasses `STATUS_TRANSITIONS`

**Date:** 2026-10-04
**Scope:** Read-only investigation. No source files were modified.
**Tree under test:** `D:\zt lounge\zt-lounge-demo\Zt-lounge-admin` (top-level)

---

## 0. Which admin tree is authoritative (precondition)

The workspace contains two admin trees. This investigation covers the **top-level** one.

| | Top-level `Zt-lounge-admin` | Nested `zt-lounge\zt-lounge-admin` |
|---|---|---|
| `src/lib/membership-handler.ts` | **present** (`MEMBERSHIP_STATUSES`, `STATUS_TRANSITIONS`, `update()`) | **ENOENT** |
| `src/app/api/admin/customer-memberships/` | **present** (`renew/`, `cancel/`) | **ENOENT** (both `route.ts` and `[id]/route.ts`) |
| `src/app/api/admin/membership/` plan routes | absent | present (`plans/[id]`, `benefits/[id]`) |
| `ADMIN_RESOURCES` contains `customer-memberships` | **yes** | n/a |

**Conclusion (SOURCE VERIFIED):** the `customer-memberships` feature — handler, renew/cancel routes, generic CRUD — exists **only** in the top-level tree. The nested tree is a divergent copy with a different (`/api/admin/membership/*`) surface. All P2 findings below therefore apply to `Zt-lounge-admin`.

---

## 1. Request chain for `PATCH /api/admin/customer-memberships/:id`

**There is no dedicated ID route.** `Zt-lounge-admin\src\app\api\admin\customer-memberships\[id]\route.ts` → **ENOENT**. The only path is the generic dynamic route:

`Zt-lounge-admin\src\app\api\admin\[resource]\[id]\route.ts`

| Step | Location | Result for `customer-memberships` |
|---|---|---|
| Imports | L1–24 | `withAdminAuth`/`withContentManagerAuth`/`withSuperAdminAuth`, `Repository`, `BookingHandler`, `resolveImageUrls`, `validateResource`, `validateRecordId`, `notFoundError`, `validationError`, `isPublicPageKey`, `assertPageOwnership`, `assertPageAssignment`. **No `MembershipHandler` import. No `isMembershipResource`. No `logCrudOperation`.** |
| `extractResourceAndId` | L60–70 | `table="customer-memberships"`, `id=<uuid>` |
| `getAuthWrapper` | L52–54 | not in `SUPER_ADMIN_RESOURCES` (L41–46); not in `CONTENT_RESOURCES` (L36) → **`withAdminAuth`** |
| `validateResource` | L245–249 | `customer-memberships` ∈ `ADMIN_RESOURCES` (`validation/admin.ts` L37) → **passes** |
| `validateRecordId` | L251–255 | UUID or digits (`validation/admin.ts` L188–191) → passes |
| `assertPageOwnership` | L260–266 | no-op (resource is not page-scoped) |
| body parse | L270 | `const body = await req.json()` |
| `assertPageAssignment` | L277–283 | no-op |
| `isBookingResource` | L289–319 | false → booking branch skipped |
| `table === "notifications"` | L333–385 | false |
| `table === "promotions"` | L392–397 | false |
| **generic fallback** | **L399–403** | `const data = await repo.update(table, id, body); return NextResponse.json(data)` |

**Reachability verdict (SOURCE VERIFIED): YES — the generic `[resource]/[id]` PATCH is fully reachable for `customer-memberships`, and it is the *only* PATCH path.**

### Sanitization applied (`src/lib/repository.ts`)

- `WRITABLE_FIELDS.customer_memberships` = `["customer_id", "plan_id", "status", "notes"]` (L146)
- `sanitizePayload(table, payload, extraAllowed=[])` (L153–172) copies only allowlisted keys present in the payload.
- `Repository.update()` (L490–531): empty sanitized payload → `findById()` no-op (L503–505); `23514`/`23505` → `ValidationError`; otherwise raw `Error`.
- No transition check, no `MEMBERSHIP_STATUSES` membership check, no `current.status` read.

So `status` **is** writable, and `customer_id`/`plan_id` are also writable (silent reassignment is possible).

---

## 2. What the handler would have enforced

`Zt-lounge-admin\src\lib\membership-handler.ts`

```ts
// L29
const MEMBERSHIP_STATUSES = ["pending","active","expired","cancelled"] as const;
// L33-38
const STATUS_TRANSITIONS: Record<MembershipStatus, MembershipStatus[]> = {
  pending:   ["active", "cancelled"],
  active:    ["cancelled", "expired"],
  expired:   ["cancelled"],
  cancelled: [],
};
```

`MembershipHandler.update()` (L199–238):
1. accepts only `notes` (string|null) and `status`;
2. `status` must be in `MEMBERSHIP_STATUSES` → else `validationErr` (400);
3. reads `current = repo.findById(...)` → `notFoundErr` (404) if absent;
4. if `current.status !== nextStatus`, looks up `STATUS_TRANSITIONS[current.status]` → `conflictErr("Invalid membership transition: X → Y")` (409);
5. writes via `repo.update(...)`.

**Callers of `MembershipHandler`:** collection `POST` route (`[resource]/route.ts` L3 branch at L221–228 → `create()`), `customer-memberships/[id]/renew/route.ts` L28 → `renew()`, `customer-memberships/[id]/cancel/route.ts` L27 → `cancel()`. **`update()` has no caller anywhere → dead code.**

Note: `STATUS_TRANSITIONS` lives at **L33–38**, not `L54–65` as stated in `MEMBERSHIP_CURRENT_STATE_AUDIT.md` §4.4.

---

## 3. Transition classification

Classification is against the handler contract (the only lifecycle rules in the codebase).

| Transition | Per `STATUS_TRANSITIONS` | Current generic PATCH |
|---|---|---|
| `pending → expired` | not in `pending:["active","cancelled"]` → **VERIFIED ILLEGAL** | **accepted** (source-verified) |
| `cancelled → active` | `cancelled: []` → **VERIFIED ILLEGAL** | **accepted** |
| `active → pending` | not in `active:["cancelled","expired"]` → **VERIFIED ILLEGAL** | **accepted** |
| `expired → active` | not in `expired:["cancelled"]` → **VERIFIED ILLEGAL** | **accepted** |
| `cancelled → expired` | `cancelled: []` → **VERIFIED ILLEGAL** | **accepted** |

Legal transitions for reference: `pending→active`, `pending→cancelled`, `active→cancelled`, `active→expired`, `expired→cancelled`, plus same-value no-ops.

**Reachability caveat (SOURCE VERIFIED, not runtime-tested):** `pending` and `expired` are not produced by any reachable admin flow — `MembershipHandler.create()` always inserts `status:"active"` (L181), and there is no auto-expiry. So the `pending`/`expired` transitions are **NOT TESTABLE against live rows** via the UI; they are source-verifiable only, and reachable by direct API call to a row placed in that state out-of-band. `cancelled→active` / `active→pending` are likewise API-only (no UI affordance).

**Runtime:** NOT TESTABLE in this session — shell/command execution returns empty output (see blocker in tracker), so no HTTP probe or DB read was possible. All classifications above are SOURCE VERIFIED from the files cited.

---

## 4. Would routing PATCH through `MembershipHandler.update()` break any workflow?

**Answer: No — zero UI regression.**

No UI code PATCHes `customer-memberships`. Exhaustive read of the membership-touching views:

`src\features\members\members-view.tsx`
- `createCustomerAndMembership` → `api.create("customer-memberships", ...)` (L58)
- `assignMembership` → `api.create(...)` (L69)
- `renewMembership` / `cancelMembership` → `postMembershipAction()` → **`POST /api/admin/customer-memberships/${id}/${action}`** (L38–45)
- `changeMembership` → `postMembershipAction(...,"cancel")` then `api.create(...)` (change-package, L298–304)
- Actions column has only a "Manage" button (L224–233); no Edit/notes/status form.

`src\features\customers\customers-view.tsx`
- identical pattern: `postMembershipAction` (L79–86), `assignMembership`/`renewMembership`/`cancelMembership`/`changeMembership` (L91–117). Comment at L78: *"Dedicated lifecycle subroutes (renew/cancel) — POST, not PATCH."*
- `api.update` appears only for `"customers"` (L55), never for `customer-memberships`.

`src\features\memberships\memberships-cms.tsx` — plans/benefits only (`membership-plans`, `membership-plan-benefits`), not `customer-memberships`.

Corpus search for `api.update("customer-memberships"` returns **exactly one hit, in documentation** (`MEMBERSHIP_CURRENT_STATE_AUDIT.md` L300), not in code. That audit line is an **unsupported claim** — no such caller exists. This corroborates `PHASE5B_MEMBERSHIP_ADMIN_AUDIT.md` L41 (*"no UI path PATCHes a membership"*).

### Regression risks of the fix (analysis only — not implemented)

| Risk | Severity | Detail |
|---|---|---|
| `customer_id` / `plan_id` PATCH becomes a silent no-op | Low | Handler only reads `notes`/`status`. Currently these two are silently writable via allowlist; no known caller. Change-package deliberately uses cancel+create instead. |
| Response envelope changes | Low | Route must use `errorResultToResponse(result)` like the collection POST branch (L224–226) instead of `NextResponse.json(data)`. |
| Error codes shift 500/200 → 409 | Low | `repo.update().single()` currently yields `PGRST116` → generic 500 for missing id; handler yields proper 404/409. |
| Lost `customer_id`→`plan_id` reassignment capability | Info | Not exercised by UI; would be an intentional tightening. |
| `MembershipHandler.update()` does not re-snapshot prices | Info | Correct — re-snapshot belongs to `renew()`, which has its own route. |
| **No audit logging** on generic PATCH | Medium | `[id]/route.ts` has no `logCrudOperation`, unlike renew (L34–42) and cancel (L33–41). A lifecycle bypass performed through this route leaves **no audit trail**. |

---

## 5. Authorization & RLS

- **Auth wrapper:** `withAdminAuth` → `requireAdmin()` → `ADMIN_ROLES = ["super_admin","admin"]` (`auth/server.ts` L23, L155–158). Unauthenticated → **401**. Any role outside those two (content_manager, employee, customer) → rejected before the handler body runs.
- **RLS:** `038_membership_baseline.sql` `customer_memberships_admin_manage FOR ALL USING is_admin_or_above() WITH CHECK ...`. `is_admin_or_above()` = `current_role() IN ('super_admin','admin')` (`.temp/zt-staging-prerequisites.sql` L28–36) — role-based only.
- **Verdict:** RLS provides **no lifecycle protection**. It gates *who*, never *which transition*. Authorization is applied *before* the generic update, but it authorizes the **operation**, not the **state change** — so an authenticated `admin` can perform any of the five illegal transitions by calling the endpoint directly, entirely unaudited (§4 risk row 6).
- **Lower-privileged bypass:** a role below `admin` **cannot** reach `repo.update()` at all (blocked at `withAdminAuth`) nor pass RLS. The bypass is available to `admin`/`super_admin` only — i.e. it is a **same-privilege integrity bypass**, not a privilege escalation.

---

## 6. Findings summary

| ID | Finding | Evidence | Status |
|---|---|---|---|
| P2-1 | Generic PATCH is the only PATCH path for `customer-memberships` (no dedicated `[id]` route) | `[id]\route.ts` ENOENT; generic route L229–415 | VERIFIED |
| P2-2 | `MembershipHandler` is not imported by the ID route; generic fallback L399–403 is reached | route imports L1–24 | VERIFIED |
| P2-3 | `STATUS_TRANSITIONS` not enforced on PATCH; `status` writable via allowlist | `repository.ts` L146, L490–531; `membership-handler.ts` L33–38 | VERIFIED |
| P2-4 | All five requested illegal transitions are accepted by current code | §3 | VERIFIED (source) / NOT runtime-tested |
| P2-5 | `MembershipHandler.update()` is dead code | no caller in any route | VERIFIED |
| P2-6 | Zero UI callers of `customer-memberships` PATCH → fix breaks no workflow | §4 full view reads | VERIFIED |
| P2-7 | `MEMBERSHIP_CURRENT_STATE_AUDIT.md` L300 claims a UI caller that does not exist | §4 corpus search | DOC ERRATA (unsupported claim) |
| P2-8 | Generic PATCH performs no audit logging | `[id]/route.ts` imports L1–24 | VERIFIED |
| P2-9 | RLS is role-based only; no transition protection | `038` policy + `is_admin_or_above()` | VERIFIED |
| P2-10 | `STATUS_TRANSITIONS` line reference in prior audit is wrong (L33–38, not L54–65) | `membership-handler.ts` | DOC ERRATA |

**Adjacent, out of P2 scope (see P4):** generic `DELETE` at `[id]/route.ts` L419–495 → `repo.delete(table, id)` L481 — hard-delete of a membership is reachable by the same auth wrapper.


