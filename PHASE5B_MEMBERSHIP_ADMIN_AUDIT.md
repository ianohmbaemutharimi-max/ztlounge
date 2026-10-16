# Phase 5B — Membership Admin Audit

**Status:** AUDIT complete + 2 surgical fixes applied & statically verified.
**Branches:** `zt-lounge-admin`=`clean-rebuild`; `zt-lounge`=`feature/membership-tiers-staging-phase1`.
**Live DB:** `[BLOCKED — NXDOMAIN, per 5A]` — runtime/DB-row evidence is read from schema+migration+`.temp` scripts (not executed).

## Preservation (Phase 5A untouched)
- Public repo: `assets/css/theme.css` = `M` (tracked); `assets/js/membership-view.js` + `assets/js/repositories/MembershipRepository.js` = untracked, **unchanged**. No `git reset/clean/restore/stash`.
- `node --check` both JS → **exit 0**.
- Invariant `plan_name|tier_level|benefit_text|headline_benefit` over `assets/js` + `admin/src` → **none**.

## Audit findings
- **Schema (`038`):** `membership_plans(id,name,slug,description,annual_price,registration_fee,media_id→media_assets NULL,display_order,is_active,cta_text,cta_link,created_at,updated_at,updated_by)`; `membership_plan_benefits(id,plan_id→plans CASCADE,description,display_order,is_active,created_at,updated_at)`; `customer_memberships(id,customer_id→customers RESTRICT,plan_id→plans RESTRICT,member_number(seq),status CHECK,registered_at,expires_at NN,annual_price_snapshot NN,registration_fee_snapshot NN,notes,created_by,created_at,updated_at)`. RLS: public_read=`is_active=true`; admin_manage=`is_admin_or_above`; customer_memberships=admin-only. `040` revokes TRUNCATE/TRIGGER/REFERENCES.
- **Field consistency (PASS):** admin `WRITABLE_FIELDS` for `membership_plan_benefits`=`[plan_id,description,display_order,is_active]`, `membership_plans`=`[name,slug,description,annual_price,registration_fee,media_id,display_order,is_active,cta_text,cta_link,updated_by]`, `customer_memberships`=`[customer_id,plan_id,status,notes]`. Public `MembershipRepository.mapPlan/mapBenefit` + `membership-view.js` consume exactly `description`, `annual_price`, `registration_fee`, `display_order`, `is_active` (Phase-5A FIX 1). **No drift.**
- **Media (§16):** `media_id` nullable; public card null-guarded (`plan.image_url ? '<img>' : ''`) → membership **does not require** media. Admin `[resource]` `MEDIA_RESOURCES` excludes membership tables. Pre-existing image picker is optional.
- **headline_benefit:** only in migrations `039`/`041` + `.temp/` diagnostic SQL; reviewed squash `039_041` marked "DO NOT APPLY". **No app-code reference.**
- **Public surfaces (§13):** four representations — static `index.html`+modal, `index_clean.html`, Next `/membership/page.tsx`, public `/api/membership-plans/route.ts` (currency `KSh` vs `KES`). Reported, **not deleted**.
- **RPCs (`042`):** `reorder_membership_plans`, `set_membership_registration_fee` — `SECURITY INVOKER`, `is_admin_or_above`, anon revoked → **orphaned (no caller)**.

## Surgical fixes (DEFECT / ROOT CAUSE / MINIMAL FIX / FILES)
**F1 — plans/benefits authorization mismatch.**
- Root cause: `dashboard/memberships/page.tsx` (`requireSuperAdmin`) + `memberships-cms.tsx` JSDoc = SUPER-ADMIN-ONLY, but generic route `getAuthWrapper` returns `withAdminAuth` (`ADMIN_ROLES=["super_admin","admin"]`) → plain `admin` can `GET/POST/PATCH/DELETE` `/api/admin/membership-plans` & `/membership-plan-benefits`.
- Fix: `SUPER_ADMIN_RESOURCES={"membership-plans","membership-plan-benefits"}` → `withSuperAdminAuth` in both generic route files; `customer-memberships` stays `withAdminAuth` (Members view is admin-level by design).
- Files: `src/app/api/admin/[resource]/route.ts`, `src/app/api/admin/[resource]/[id]/route.ts` (import + `getAuthWrapper`).

**F2 — customer-membership creation broken.**
- Root cause: generic `POST /api/admin/[resource]` only routes `isBookingResource`→`BookingHandler`; `customer-memberships` falls to `repo.create()` → `sanitizePayload` allow-list `[customer_id,plan_id,status,notes]` drops NOT-NULL `expires_at`/`annual_price_snapshot`/`registration_fee_snapshot` → Postgres `23502`. `/dashboard/members` "Assign Member" hits this.
- Fix: add `isMembershipResource` branch → `MembershipHandler.create(body)` (server-derives `member_number` via DB seq, `expires_at`, snapshots).
- Files: `src/app/api/admin/[resource]/route.ts` (POST branch + import).

## Verification (§18)
| Check | Result |
|---|---|
| `node --check` (public JS) | exit 0 ✅ |
| field-name invariant (app code) | none ✅ |
| `npx tsc --noEmit` (admin) | TSC_EXIT=0, 0 error-TS lines ✅ (covers `MembershipHandler` import + `isMembershipResource` branch + `withSuperAdminAuth`) |
| wiring grep | all new identifiers present in both routes ✅ |
| git footprint (§19) | public repo = Phase-5A state only; admin = 2 route files modified; pre-existing `clean-rebuild` dirt in unrelated lines is not from this edit ✅ |

## Deferred (documented, not changed)
- Generic `PATCH` for `customer-memberships` bypasses `MembershipHandler.patch` status-transition validation (no UI path PATCHes a membership; renew/cancel use dedicated endpoints) — out of §10 create-scope.
- Duplicate public surfaces (§13) and orphaned RPCs (§5) above.
<!--SPLIT-->
