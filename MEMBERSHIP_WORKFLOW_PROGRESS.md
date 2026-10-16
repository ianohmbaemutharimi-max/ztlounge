# Membership Workflow Progress Tracker

| Phase | Name | Status | Evidence | Owner | Next action |
|---|---|---|---|---|---|
| 1 | Baseline — repo HEAD + working tree | ✅ Done | `876b185` (admin), `d183dda` (public) | Audit | — |
| 2 | Find everything (file inventory) | ✅ Done | §2 of audit | Audit | — |
| 3 | Map Admin UI routes | ✅ Done | §5 of audit | Audit | — |
| 4 | E2E workflow trace (create/renew/cancel) | ✅ Done | §4 of audit | Audit | — |
| 5 | Database schema from migrations `038→042` | ✅ Done | §3 of audit | Audit | — |
| 5A | Public surface simplification | ✅ Done | `PHASE5A_*` | Audit | — |
| 5B | Admin fixes (R2 + R5) | ✅ Done | `PHASE5B_*` + FINAL_VERIFICATION | Audit | — |
| 6 | Actual live data verification | 🚫 Blocked | DNS NXDOMAIN + expired keys | — | Needs DB credentials (P0) |
| 7 | Consumer × status × expires_at truth table | ✅ Done | §7 of audit | Audit | — |
| 8 | Pricing authority trace | ✅ Done | §8 of audit | Audit | — |
| 9 | Benefits consumption trace | ✅ Done | §9 of audit | Audit | — |
| 11 | Audit authorization (RLS + app) | ✅ Done | §10 of audit | Audit | — |
| 13 | Public repo consumption search | ✅ Done | §11 of audit | Audit | — |
| — | Duplicate-active check investigation | ✅ Done | §15.3 — filters `status='active'` only | Audit | No fix needed |
| — | `member_number` sequence on renewal | ✅ Done | §15.4 — `renew()` updates same row | Audit | No fix needed |
| — | `suspended` status domain check | ✅ Done | §4.5 — NOT in `CHECK` constraint | Audit | Decision point in plan P9 |
| — | `membership_subscriptions` table check | ✅ Done | §3.8 — NOT FOUND in migrations | Audit | No such table exists |
| — | Draft `MEMBERSHIP_CURRENT_STATE_AUDIT.md` | ✅ Done | This document | Audit | — |
| — | Draft `MEMBERSHIP_IMPLEMENTATION_PLAN.md` | ✅ Done | This document | Audit | — |
| — | Clean up temp probe scripts | ✅ Done | `temp_db_query.js`, `temp_test.js`, `temp_read_handler.js`, `temp_schema_dump.sql` removed | Audit | — |

---

## Implementation phase planning

| Phase | Title | Planned | Prerequisites |
|---|---|---|---|
| P0 | Reconnect to live DB | Pending | DB credentials / Studio access |
| P1 | Fix auto-expiry (R1) | Pending | P0 |
| P2 | Route PATCH through handler | Pending | P0, Phase 5B |
| P3 | Reconcile headline contract (D1–D4) | Pending | P0 (DB column check) |
| P4 | Wire orphaned RPCs (R3) | Pending | P1 (optional) |
| P5 | Admin gate gap (R5) | ✅ Already fixed in Phase 5B | — |
| P6 | Single-record media (R6) | Pending | — |
| P7 | Consolidate public surfaces (D7/R7) | Pending | Decision on live surface |
| P8 | Remove duplicate homepage | Pending | P7 |
| P9 | Reactivate cancelled memberships | Pending decision | P1, P2 |

---

## Defects resolved by Phase 5B (already applied)

| Defect | Phase 5B fix | Verified |
|---|---|---|
| R2: Create-membership broken (generic POST omitted NOT NULL cols) | `isMembershipResource` branch → `MembershipHandler.create()` | ✅ TSC + API probe |
| R5: Admin gate inconsistency (plan endpoints admin-accessible) | `SUPER_ADMIN_RESOURCES` includes `membership-plans`, `membership-plan-benefits` → `withSuperAdminAuth` | ✅ Runtime 403 test |

**Git status:** These changes are **uncommitted** in the admin repo working tree (`??` untracked). They exist on disk only. A `git stash` or `git checkout` would revert them.

---

## Environment access matrix

| Access | Status | Notes |
|---|---|---|
| DB: `psql` native client | ❌ Not installed | `supabase db dump` was attempted instead |
| DB: Supabase CLI `db dump --linked` | ❌ No output | DNS NXDOMAIN |
| DB: Node.js `pg` pooler | ❌ ECONNRESET | Pooler rejects |
| DB: Node.js `pg` direct | ❌ E_TIMEOUT | Direct host unreachable |
| DB: `supabase-js` anon key (source) | ❌ Expired | 401 |
| DB: `supabase-js` service-role (`.env.local`) | ❌ Expired | 401 |
| DB: Supabase Studio (browser) | ❌ Not attempted | Low probability given DNS |
| Next dev server | ✅ Running | localhost:3000 |
| Admin API (super-admin) | ✅ 200 | Session cookie verified |
| Public API | ✅ 200 | Anon, allowlist-filtered |
| `tsc --noEmit` (admin repo) | ✅ Exit 0 | 0 errors |

---

## Key findings summary

| Finding | Impact | Resolution |
|---|---|---|
| `membership_subscriptions` table doesn't exist | None | Not FOUND — misread in prior summary |
| No auto-expiry (`expired` dead state) | High | P1: pg_cron sweep |
| POST create fixed (Phase 5B) | Resolved | ✅ Already applied |
| PATCH bypasses handler | High | P2: route through handler |
| Headline benefit contract drift | High | P3: decision gate on DB column check |
| `expired` = 0 rows in live data | Corroborates R1 | Awaiting DB to confirm |
| `suspended` not in status enum | N/A | No `suspended` in `CHECK` — decision point |
| Duplicate-active check filters `active` only | None (investigated) | ✅ No fix needed |
| `renew()` updates same row | None (investigated) | ✅ `member_number` preserved |
| Currency diverges (`KSh` vs `KES`) | Medium | P7: standardize to `KES` |
| `index_clean.html` duplicate | Low | P8: delete |

---

## Remaining open items

1. **Live DB credentials** — required for P0, P3, data verification (Phases 6–7)
2. **Headline column state** (`041` vs `039`) — requires DB probe via `.temp/zt-041-state.sql`
3. **`profiles`/`customers` DDL** — in earlier migrations, not read this session
4. **Live surface decision** — which public page is served on `ztlounge.co.ke`
5. **Reactivation semantics** — whether to preserve terminal `cancelled` state or allow reactivation (P9)

---

*Tracker last updated: 2026-04-10 (this session)*