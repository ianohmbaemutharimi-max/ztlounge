# Membership Plans + Customer ID Architecture Audit — Progress Log

> READ-ONLY AUDIT. No source, schema, data, migration, RPC, or config modifications.

- Start timestamp (UTC): 2026-10-06
- Canonical Supabase project ref: `jczwilrysvnhcjzjztbi` (authoritative; host `https://jczwilrysvnhcjzjztbi.supabase.co`)
- Forbidden staging project: `jczavwuaiywnhpfigvlw` (do NOT treat as authoritative)
- Public repo: `D:\zt lounge\zt-lounge-demo\zt-lounge` (branch `feature/membership-tiers-staging-phase1` per task context; HEAD re-verify pending — `git rev-parse` probe hit shell-integration failure, 1 failure counted)
- Admin repo: `D:\zt lounge\zt-lounge-demo\zt-lounge-admin`
- Known baseline context only (re-query required): profiles ~13, membership_plans ~4, customer_memberships ~36
- Phase started: Phase 1 (progress file) + Phase 2 (map database from migrations/source; live DB re-query pending)

## Actions (continued — Phase 2–10 source + live reads)
- 2026-10-06: Read migrations 039 (headline_benefit text + guards), 041 (staging-only headline_benefit_id + trigger; drops text column), 042 (orphaned SECURITY INVOKER RPCs `reorder_membership_plans`, `set_membership_registration_fee` granted to `authenticated`), 040 (revoke excess grants).
- 2026-10-06: Read live `membership-handler.ts` (create L77-194 with dual workflow: direct customer auto-create by normalized phone OR customer_id link; duplicate guard one-active-per-customer-per-plan L155-168; renew L246-282; cancel L288-302; dead-code `update()` L199-238), `resource-config.ts` (membership resources mapped), `validation/admin.ts` (allowlist), public `/api/membership-plans/route.ts` (anon, active-only, no customer data), cancel/renew routes (`withAdminAuth` + audit log), `members-view.tsx` (assign = `customer_id+plan_id` POST; add-member = create customer then membership), `memberships-cms.tsx` (super-admin plans/benefits CRUD, no headline editing), `customers-view.tsx` (same assign + cancel-then-create change-package), Drizzle `schema.ts` (profiles/customers both uuid PK with `user_id` unique; membership mirror matches 038 except headline columns absent).
- 2026-10-06: Verified `profiles.user_id` linkage: `042` RPCs resolve `profiles WHERE user_id = auth.uid()`; `auth/server.ts` queries profiles by `id` matching `auth.uid()` (comment) — profiles.id IS the auth user id; customers.user_id exists in Drizzle mirror but no FK to profiles and no code path populating it found.
- 2026-10-06: LIVE CANONICAL DB QUERIES (read-only anon PostgREST, jczwilrysvnhcjzjztbi) — SUCCESS, contradicts prior BLOCKED notes:
  - `membership_plans`: 4 rows, ALL active (bronze 5000, silver 10000, gold 20000, platinum 30000; registration_fee 1000 uniform; display_order 0-3).
  - `select=*` on plans: 14 columns, NO `headline_benefit` and NO `headline_benefit_id` → canonical does NOT have 039 or 041 applied. Prior R4 headline-mismatch risk does not apply to live canonical.
  - `membership_plan_benefits`: 36 active rows returned (limit 100); all `is_active=true`; each plan_id references a live plan id.
  - `customer_memberships` as anon: HTTP 200 + `[]` (RLS allows query, zero rows visible — consistent with admin-only policy, NOT a 401).
  - `customers` as anon: HTTP 200 + `[]` (same RLS-closed behavior).
  - Membership row counts (36-ish, statuses, customer_id population) NOT TESTABLE via anon — requires admin/service-role read, no valid credentials this session.

## Evidence discovered (continued)
- Identity chain (source-verified): `customer_memberships.customer_id → customers(id)` (NOT NULL, RESTRICT). `customers` has NO FK to `profiles`; `customers.user_id` nullable unique with no writer found — customers are operational records, NOT auth-linked. Staff/admin identity flows through `profiles.id = auth.uid()` + `roles` join. So customer_id IS the canonical member identity at DB level, but customers↔profiles linkage is absent/unused.
- Client-controlled identity: `MembershipHandler.create()` accepts client-supplied `customer_id` (verified existence only, no ownership check — any admin can attach a membership to any customer). Generic PATCH also admits `customer_id`/`plan_id` rewrite (P2 finding). RLS boundary is role-based (`is_admin_or_above()`), not ownership-based.
- Multi-membership model: duplicate guard is (customer_id, plan_id, status=active) — same customer CAN hold multiple active memberships on DIFFERENT plans; same-plan re-assign blocked while active. Expired/cancelled do not block. Change-package = cancel + create (record-preserving).
- No auto-expiry: no trigger/cron/edge function; `expired` only via generic PATCH (unguarded) — dead state in practice.
- Benefits: normalized freeform rows (`membership_plan_benefits`), belong to plan, NOT copied into membership; price snapshots (not benefits) copied at assign/renew — plan price edits do not affect historical rows.
- Public: static `index.html` (MembershipRepository anon read, hides section on empty/error) + divergent Next `/membership` page + `/api/membership-plans`; enrollment = WhatsApp link only, no online enrollment, no customer identity involved.

## Status
- Phases 1–9 (source-level): near-complete from current reads.
- Phase 10 (live counts): PARTIAL — plans/benefits VERIFIED live; membership/customer/profile rows NOT TESTABLE (anon RLS-closed, no admin creds).
- Overall: PARTIALLY VERIFIED (final). Source + live plans/benefits/RLS verified; membership/customer/profile row aggregates NOT TESTABLE without admin credentials.
- Deliverables: `MEMBERSHIP_ARCHITECTURE_AUDIT.md` (sections 1–14 + verification, this same folder) + this progress log.
- Writes performed: two new audit docs only. Zero source/schema/data/RPC/config modifications; live access was anon GETs only.

- 2026-10-06: Created this progress file.
- 2026-10-06: Attempted combined `git rev-parse` for both repos (branch + short HEAD); shell integration did not return output (failure #1, environment/tooling, not evidence).
- 2026-10-06: Read `package.json` (both repos) for baseline; searched codebase for `customer_memberships`, `membership_plans`, `customer_id`, `MembershipHandler`, `normalize_customer_phone`, `is_admin_or_above`.
- 2026-10-06: Read canonical migration `038_membership_baseline.sql` (full DDL + RLS) and prior audits `MEMBERSHIP_CURRENT_STATE_AUDIT.md`, `MEMBERSHIP_READ_ONLY_AUDIT.md` as secondary sources (must still verify against live schema + current source, not trust blindly).

## Evidence discovered (preliminary, migration/source-level; live DB counts still pending)
- `038` DDL: `customer_memberships.customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT`; `plan_id uuid NOT NULL REFERENCES membership_plans(id) ON DELETE RESTRICT`; `member_number text NOT NULL UNIQUE` w/ sequence; `status CHECK (pending,active,expired,cancelled)` default `active`; `expires_at timestamptz NOT NULL` (no default); price snapshots NOT NULL; indexes on customer_id/plan_id/status.
- `membership_plans`: uuid PK, slug UNIQUE, annual_price + registration_fee NOT NULL CHECK >=0, is_active, display_order, media_id FK, headline fields via later migrations (039/041 — to verify).
- RLS (038): plans public SELECT `is_active=true`; benefits public SELECT active + active plan; `customer_memberships` NO public read, admin-manage `is_admin_or_above()` only.
- Prior audits assert live canonical counts ~4 plans / 36 memberships, handler create/renew/cancel flow, PATCH/DELETE generic bypass, orphaned RPCs `reorder_membership_plans` / `set_membership_registration_fee` — all require re-verification against current source in this audit.

## Blockers
- Shell `run_commands` integration unstable (1 failure so far). Per hard rules: stop and report after 2 failures to access required evidence/tools.
- Live canonical DB not yet queried this task. Prior task notes DNS NXDOMAIN + expired anon/service keys — must re-attempt via read-only REST with current repo credentials and record actual result.

## Status
- Phase 1: IN PROGRESS
- Phase 2: IN PROGRESS
- Phases 3–13: NOT STARTED
- Overall: IN PROGRESS (NOT TESTABLE for live counts until DB probe succeeds)
