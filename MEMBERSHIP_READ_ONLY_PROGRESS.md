# Membership Read-Only Audit — Progress Tracker

**Task:** Forensic read-only audit of the ZT Lounge membership system.
**Date:** 2026-10-04
**Mode:** Read-only (plan mode — no source or DB changes).

---

## Phase Progression

| Phase | Description | Status | Evidence |
|---|---|---|---|
| 1 | Repository baseline (HEAD, branch, working tree, git tracking) | ✅ DONE | `git log` + `git ls-files` — 0 migrations tracked |
| 2 | Migration schema analysis (038–042) | ✅ DONE | `read_files` on all 5 migration files |
| 3 | Membership plan workflow (admin CRUD → DB) | ✅ DONE | `[resource]/route.ts`, `repository.ts`, `validation/admin.ts`, `memberships-cms.tsx` |
| 4 | Member workflow (create/renew/cancel → DB) | ✅ DONE | `membership-handler.ts` L77-314; cancel/renew route handlers |
| 5 | Lifecycle state machine (transitions, dead states) | ✅ DONE | `STATUS_TRANSITIONS` L33-38; Phase 5B runtime evidence |
| 6 | Generic CRUD bypass (PATCH/DELETE on members) | ✅ DONE | `[resource]/[id]/route.ts` — no MembershipHandler import |
| 7 | Pricing authority chain | ✅ DONE | `membership-handler.ts` create/renew; `WRITABLE_FIELDS` |
| 8 | Benefits consumption (admin + public) | ✅ DONE | `MembershipRepository.js`, `memberships-cms.tsx` |
| 9 | Public membership surface | ✅ DONE | `index.html`, `index_clean.html`, `page.tsx`, public API |
| 10 | Authorization (RLS + app-layer) | ✅ DONE | `validation/admin.ts`, both route files, Phase 5B |
| 11 | Two-layer allowlist architecture | ✅ DONE | `repository.ts` WRITABLE_FIELDS + sanitizePayload |
| 12 | Findings register | ✅ DONE | Cross-referenced vs existing audit |
| 13 | Implementation backlog | ✅ DONE | Ranked by severity + fix risk |
| 14 | Evidence matrix | ✅ DONE | All sources traced |
| 15 | Output files | ✅ DONE | `MEMBERSHIP_READ_ONLY_AUDIT.md` produced |

---

## Findings Status

| ID | Finding | Severity | Status |
|---|---|---|---|
| F-0 | Uncommitted migrations on disk | Critical | OPEN |
| F-1 | Generic PATCH bypasses STATUS_TRANSITIONS | High | OPEN |
| F-2 | `MembershipHandler.update()` is dead code | High | OPEN |
| F-3 | Generic DELETE can hard-delete memberships | High | OPEN |
| F-4 | No auto-expiry mechanism | High | OPEN |
| F-5 | schema.ts phantom `created_by` | Medium | OPEN |
| F-6 | schema.ts status default drift | Medium | OPEN |
| F-7 | schema.ts fictional migration comment | Low | OPEN |
| F-8 | `cta_link` fallback bug (comma) | Low | OPEN |
| F-9 | Drizzle CHECK constraints not modeled | Medium | OPEN |
| F-10 | Existing audit has stale claims | Medium | OPEN |
| F-11 | Duplicate homepage | Low | OPEN |
| F-12 | Currency divergence (KSh vs KES) | Low | OPEN |

---

## Key Discrepancies Found in Existing Audit

The existing `MEMBERSHIP_CURRENT_STATE_AUDIT.md` contains claims that do NOT match the actual source code:

1. **STATUS_TRANSITIONS** — claims `pending → [active, expired, cancelled]` at L54-65; actual is `pending → [active, cancelled]` at L33-38
2. **Duplicate check method** — claims `this.repo.findOne(...)`; actual is direct `this.supabase.from(...)` call
3. **Cancel `ended_at`** — claims `UPDATE: {status:"cancelled", ended_at:now()}`; actual is only `{status:"cancelled"}`
4. **`expires_at` derivation** — claims `now() + duration_days`; actual is `addYears(registeredAt, 1)` (hardcoded, no `duration_days` column)
5. **D4 headline projection** — claims `mapPlan` projects `headline_benefit_id` (high); actual does NOT — Phase 5A already remediated
6. **DB access** — claims "BLOCKED" in Phase 6.1; Phase 5B verification confirmed live DB query success
7. **schema.ts** — Phase 5A claims "no membership models"; actual has models at L567-620 with drift

All discrepancies documented in audit §12.1.

---

## Verification Methods Used

| Method | Scope |
|---|---|
| `read_files` (direct source read) | All 5 migrations, handler, repository, route files, JS, TSX, schema.ts |
| `search_codebase` (regex) | `STATUS_TRANSITIONS`, `WRITABLE_FIELDS`, `headline_benefit`, `MembershipHandler` imports |
| `read_files` (existing audit cross-reference) | `MEMBERSHIP_CURRENT_STATE_AUDIT.md`, `PHASE5B_MEMBERSHIP_ADMIN_AUDIT.md`, `PHASE5B_FINAL_VERIFICATION.md` |
| `read_files` (.temp diagnostic) | `zt-041-state.sql` column-existence query |
| Git baseline | Branch, HEAD hash, tracking status (from session context + git ls-files) |

## Verification NOT performed (blocked)

| Item | Reason |
|---|---|
| Live DB row inspection | Session summary states DB unavailable; however Phase 5B verification DID query it successfully. Cross-reference `PHASE5B_FINAL_VERIFICATION.md` L43-44 for actual data. |
| `.temp/*.sql` script execution | Not run (read-only task + DB access not available in this session) |
| Runtime e2e on admin app | Not run (read-only task); Phase 5B verification covered this |
| Runtime on public homepage | Not run; Phase 5B verification confirmed `node --check` + source traceability |

---

## Files Produced

| File | Path | Lines |
|---|---|---|
| Main audit | `MEMBERSHIP_READ_ONLY_AUDIT.md` | ~627 |
| This progress | `MEMBERSHIP_READ_ONLY_PROGRESS.md` | n/a |

**Files modified:** 0 (read-only task).
**DB writes:** 0.
