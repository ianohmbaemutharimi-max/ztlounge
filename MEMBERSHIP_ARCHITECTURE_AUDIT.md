# ZT Lounge — Membership Plans + Customer ID Architecture Audit

> READ-ONLY AUDIT. No source, schema, data, migration, RPC, or config modifications were made.
> Date: 2026-10-06. Canonical project: `jczwilrysvnhcjzjztbi` (live PostgREST reads below). Staging `jczavwuaiywnhpfigvlw` was NOT used.
> Repos: public `D:\zt lounge\zt-lounge-demo\zt-lounge` (branch `feature/membership-tiers-staging-phase1` per context; HEAD re-verify blocked by shell-integration failure); admin `D:\zt lounge\zt-lounge-demo\zt-lounge-admin`.

## 1. Executive Summary

The membership system is a two-repo design: the admin Next.js app owns all membership writes through `MembershipHandler` + generic admin CRUD routes, and the public static site only reads active plans/benefits via anon RLS. The DB contract (`038_membership_baseline.sql`) makes `customer_memberships.customer_id` → `customers(id)` (NOT NULL, RESTRICT) the member identity, and the write path honors it. But `customers` has no FK to `profiles`, and no code populates `customers.user_id` — customers are operational records, not auth-linked accounts. So customer_id is canonical for membership rows, while the customers-to-profiles bridge is absent/unused. Live canonical state: 4 plans (all active), 35 active benefits (bronze 6 / silver 8 / gold 10 / platinum 11), NO headline columns (neither 039 text nor 041 id — both unapplied on canonical). Membership/customer/profile row counts are NOT TESTABLE via anon (RLS-closed, 200 + []). Biggest risks: generic PATCH/DELETE bypass of lifecycle guards (P0), client-supplied customer_id with no ownership check (P0/P1), no auto-expiry (P1), orphaned over-granted RPCs (P1).

## 2. Current Database Model

Source: `supabase/migrations/038` (+039/040/041-staging-only/042) cross-checked with live `select=*` (14 plan columns, no headline fields).

auth.users → profiles (id = auth.uid(); user_id UNIQUE; role_id → roles) → membership_plans.updated_by / customer_memberships.created_by (audit only, SET NULL). membership_plans (id PK, slug UNIQUE, annual_price NOT NULL >= 0, registration_fee NOT NULL DEFAULT 0, display_order, is_active, media_id → media_assets SET NULL, cta_text/link, timestamps). plans 1:N → membership_plan_benefits (CASCADE: plan_id, description NOT NULL, display_order, is_active). plans 1:N (RESTRICT) + customers 1:N (RESTRICT) → customer_memberships (id PK, customer_id NOT NULL, plan_id NOT NULL, member_number UNIQUE via sequence, status CHECK pending/active/expired/cancelled DEFAULT active, registered_at DEFAULT now(), expires_at NOT NULL no default, price snapshots NOT NULL, notes, timestamps; indexes on customer_id/plan_id/status; updated_at triggers on all three tables). customers (id PK, user_id UNIQUE nullable with NO FK and NO writer found, full_name NOT NULL, source DEFAULT manual, is_active; NO FK to profiles).

## 3. Customer Identity Model

Answer: PARTIALLY. `customer_id` IS the canonical identity of every membership row (NOT NULL FK to customers, enforced at DB level; handler resolves/links it on every create; all three admin UIs send it). But the chain stops at `customers` — there is no verified customers-to-profiles/auth linkage (no FK, no populating code, no reading code), so "customer" here means an operational CRM record keyed by phone, not a login identity. Staff/admin identity is a separate chain (profiles.id = auth.uid() + roles). Evidence: 038 DDL; handler create L97–153; members-view L58/69 + customers-view L93/114 (all send `customer_id`); schema.ts L275–289 (customers.user_id with no reference); search for customers-to-profiles writers: none found.

## 4. Existing Membership Plans

Live canonical (anon REST, 2026-10-06): 4 rows, ALL is_active=true, display_order 0–3, uniform registration_fee=1000.

- bronze | Bronze | 5000/yr | description NULL | d627ec76…
- silver | Silver | 10000/yr | "Designed for regular customers who want added benefits and better value during their visits." | 422d0676…
- gold | Gold | 20000/yr | "Designed for customers who visit frequently and want enhanced privileges and priority access." | 7fe75f06…
- platinum | Platinum | 30000/yr | "Our premium membership for customers who want the highest level of priority service and exclusive ZT Lounge experiences." | 8eb6d7b2…

Structure: uuid PK, slug UNIQUE, prices numeric(12,2) CHECK >= 0, media_id → media_assets (live gold row: null), cta_text/cta_link (live: null). Created/edited via super-admin CMS (memberships-cms.tsx → generic membership-plans API; WRITABLE_FIELDS admits content fields + updated_by). Deactivation (is_active=false) is the normal lifecycle because plan_id is RESTRICT (delete with history → 409). Edits do NOT touch history rows (snapshots only at assign/renew). All 4 plans have benefits; no orphan benefits.

## 5. Benefits Model

Normalized freeform CMS records (membership_plan_benefits: plan_id CASCADE, description NOT NULL trimmed, display_order, is_active) — NOT JSON/text/hardcoded. Live: 35 active rows (bronze 6, silver 8, gold 10, platinum 11); every plan_id matches a live plan. Benefits belong to the plan and are rendered live on every read (public repo + public API + Next page attach current active benefits per request) — NEVER copied into customer_memberships. Only prices are snapshotted. Consequence: editing a benefit changes what all viewers see (no versioning); editing a plan price affects only new assigns/renews, never history. membership.config.js holds zero benefit text (constants only).

## 6. Membership Lifecycle

No RPCs, triggers, cron, or edge functions drive lifecycle — all decisions live in MembershipHandler + two dedicated routes. Create (POST /api/admin/customer-memberships → withAdminAuth → handler.create()): plan must exist (no active-gate — inactive assignable); customer by customer_id OR auto-create by normalized phone; duplicate guard (customer_id, plan_id, active) → 409; server injects registered_at=now, expires_at=+1yr, both price snapshots, status active; member_number from DB sequence only. Renew (POST .../[id]/renew): gate active|expired else 409; extends from max(expiry, now) +1yr; re-snapshots CURRENT plan prices; forces status active; audit-logged. Cancel (POST .../[id]/cancel): idempotent; sets cancelled; record preserved; audit-logged. Update/Delete (UNGUARDED): generic [resource]/[id] PATCH/DELETE call repo.update/delete directly — no handler import, no transition validation, no audit log; WRITABLE_FIELDS admits customer_id/plan_id/status/notes. So STATUS_TRANSITIONS (pending→active/cancelled; active→cancelled/expired; expired→cancelled; cancelled→terminal) binds only the dead-code update() method, never the live route. Change package (UI convention, members + customers views): cancel current + create new (both rows preserved). Model: one active membership per (customer, plan); multiple actives across different plans allowed; history preserved forever (no UI delete path). pending unreachable (create sets active); expired unreachable (no auto-expiry) except via manual PATCH.

## 7. Admin Architecture

/dashboard/memberships → memberships-cms.tsx (super_admin only, API also withSuperAdminAuth): plan/benefit CRUD + activate/deactivate + media picker; headline fields absent from form (consistent with canonical lacking the columns). /dashboard/members → members-view.tsx (admin+super_admin): customer picker (active members filtered out), Add Member (create customer → create membership with customer_id), Assign (existing customer + customer_id), renew/cancel POSTs, detail view; no activate action. /dashboard/customers → customers-view.tsx: same membership mutations plus cancel-then-create change-package. All three fetch via generic api.list (customers | customer-memberships | membership-plans), one fetch each, no N+1, no duplicate data-access paths. Identifier sent is always customers.id as customer_id — no profile/user-id/email substitution anywhere.

## 8. Public Architecture

Three surfaces, all read-only, no enrollment, no identity: (a) static index.html teaser + full-page mode via MembershipRepository.getPublicPlans() (anon, active-only double-filtered, benefits attached, media resolved; hides section + fee banner on empty/error); (b) Next /membership page (anon server read, same active-only shape, wa.me join CTA per plan, KES formatting); (c) /api/membership-plans (anon, active plans + active benefits, 5-min cache). Prices + benefits always from DB; zero hardcoding (only currency/teaser-limit/CTA-fallback constants). customer_memberships has zero public exposure (anon reads 200 + []).

## 9. RLS/Authorization

DATABASE/RLS (038 + 040, live-corroborated for anon): plans public SELECT is_active=true; benefits public SELECT active + active-plan; customer_memberships admin-manage-ONLY (is_admin_or_above()), no public read (anon gets 200 + [], never 401 — RLS filters, doesn't reject); excess TRUNCATE/TRIGGER/REFERENCES revoked from anon/authenticated (040). APPLICATION (source-verified, NOT runtime-tested — no user creds): plans/benefits APIs withSuperAdminAuth; membership POST/cancel/renew + generic PATCH/DELETE withAdminAuth; session = profiles-by-auth.uid + roles join, inactive profiles rejected. Ownership is NOT enforced anywhere — any admin can attach/rename any membership via customer_id; service-role paths (media listing, login audit) bypass RLS by design. Orphaned 042 RPCs (reorder_membership_plans, set_membership_registration_fee) are INVOKER + admin-checked but EXECUTE-granted to all authenticated with zero callers.

## 10. Data Integrity

Live canonical (anon REST 2026-10-06): plans total 4 / active 4 / inactive 0. Benefits total 35 visible active (6/8/10/11); inactive/orphan counts not separable via anon (RLS hides inactive rows). customer_memberships: total / with-customer_id / without / valid refs / by-status — NOT TESTABLE (anon RLS-closed; prior audit's 36-row/33-active/2-cancelled/1-pending figure is secondhand Phase-5B evidence, not re-verified here). Structural guarantee: customer_id/plan_id NOT NULL + RESTRICT FKs make missing/invalid references uninsertable through any path reaching the DB. customers → profiles: no linkage to count (no FK, no join).

## 11. Findings

- F-1 | P0 | Lifecycle | Generic PATCH/DELETE bypass MembershipHandler: any admin can set any status / rewrite customer_id+plan_id / hard-delete history, no validation or audit log. Evidence: [resource]/[id]/route.ts L289–403 (no membership import; generic fallback); WRITABLE_FIELDS admits all four; update() dead code; P2 investigation. Status: VERIFIED (source).
- F-2 | P0 | Identity | Client-supplied customer_id accepted on create with existence check only — no ownership check. Evidence: handler L97–120. Status: VERIFIED (source).
- F-3 | P1 | Lifecycle | No auto-expiry: expired unreachable except manual PATCH; rows stay active past expires_at. Evidence: no cron/trigger/edge fn found; handler has no expire path; Days Left display-only. Status: VERIFIED (source).
- F-4 | P1 | RLS/RPC | Orphaned reorder_membership_plans + set_membership_registration_fee (INVOKER, admin-checked) granted EXECUTE to all authenticated, zero callers. Evidence: 042 L112–115; caller search none. Status: VERIFIED (source).
- F-5 | P1 | Identity | customers-to-profiles bridge missing: no FK, customers.user_id never written/read; CRM customer vs auth profile unmapped. Evidence: schema.ts L26–36/275–289; 038; code search no writers. Status: VERIFIED (source).
- F-6 | P2 | Schema drift | Drizzle mirror cites fictional migration 20260906_create_membership_domain.sql. Evidence: schema.ts L568. Status: VERIFIED (source).

- F-7 | P2 | Admin UX | No activate/reactivate action; cancelled terminal with no UI path back. Evidence: members/customers views; handler L250. Status: VERIFIED (source).
- F-8 | P2 | Public | Three divergent public surfaces (static JS, Next page, public API) with separate formatting/CTA logic. Evidence: MembershipRepository.js vs admin /membership/page.tsx vs /api/membership-plans. Status: VERIFIED (source+live).
- F-9 | P3 | Public JS | cta_link fallback || ',' yields href="," when NULL (live plans have null cta_link). Evidence: MembershipRepository.js L74. Status: VERIFIED (source+live).
- F-10 | P3 | Data | Membership/customer/profile live counts NOT TESTABLE (anon RLS-closed, no admin creds). Evidence: anon reads 200 + []. Status: NOT TESTABLE.
- Prior-audit R4 (headline contract mismatch) is CLOSED for canonical: live select=* proves neither 039 nor 041 applied, and no app code references headline fields.

## 12. Recommended Target Architecture

Keep the proven core (handler-orchestrated writes, snapshot pricing, RESTRICT history, RLS-closed members, DB-read public) and close the gaps: customer_id stays the canonical member identity; add an explicit optional customers.user_id to auth link ONLY if self-service is approved (else leave unlinked by decision); route ALL membership writes (PATCH/DELETE included) through MembershipHandler; add server-owned expiry; narrow or drop the orphaned RPCs; unify or designate one public surface.

## 13. Implementation Plan (NOT started — read-only task)

Stage 1 — Identity/data: admin-credentialed audit of all membership rows (customer_id populated/valid, duplicates, status distribution); decide customers-to-profiles linkage. Stage 2 — Database/RPC: PATCH/DELETE-via-handler (or DB-level transition guard); expiry job (pg_cron/edge); revoke/re-scope 042 EXECUTE grants; fix schema.ts comment drift. Stage 3 — Admin plans: headline decision (ship 039+041-squash + CMS fields, or formally abandon); bulk reorder/fee UX or RPC removal. Stage 4 — Admin members: ownership checks on customer_id; activate/reactivate semantics; change-package atomicity. Stage 5 — Public: single canonical surface decision; fix cta_link fallback; currency/CTA consistency. Stage 6 — Enrollment/payment: define whether online enrollment exists (today: WhatsApp only); payment-before-activation rule. Stage 7 — Lifecycle/renewal: expiry, renew, grace semantics; multi-plan-per-customer policy confirmation. Stage 8 — Runtime verification: admin-authed counts, transition tests, RLS probes per role, public regression.

## 14. Decision Gates (business/product approval required)

1. Multiple simultaneous memberships (different plans) per customer — allowed by code; confirm intended. 2. Same-plan re-join after cancel/expiry: new row vs reactivate (member_number continuity). 3. Plan price/benefit edits prospective-only; history snapshots immutable — confirm. 4. Expiry: grace period? auto-expire job approved? owner? 5. Renewal = +1yr from max(expiry, now) at current prices — confirm; payment required before active? 6. Manual admin grants without payment — allowed? audited how? 7. customers-to-profiles linking: login self-service or CRM-only? 8. Cancelled terminal vs reactivatable (F-7). 9. Public surface: static vs Next canonical for ztlounge.co.ke? 10. Headline benefit feature: ship or abandon?

## Verification (Phase 13)

Report reconciled with progress log (phase-by-phase evidence there). Every major claim cites file:line or live query output; membership row-level claims marked NOT TESTABLE. Zero modifications: only two new audit docs created; no source/schema/data/RPC/config writes (anon GETs only). Canonical DB used throughout; staging ref never queried. customer_id traced end-to-end (DB FK → handler → all three admin UIs → allowlists → RLS; no ownership layer — documented, not assumed). No recommendation contradicts live schema (headline absence confirmed before closing R4). Final status: PARTIALLY VERIFIED (source + live plans/benefits/RLS verified; membership/customer/profile row aggregates NOT TESTABLE without admin credentials).




