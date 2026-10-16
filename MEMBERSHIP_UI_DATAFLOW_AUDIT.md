# ZT Lounge â€” Membership UI + Data Contract Audit

**Audit mode:** READ-ONLY architecture / data-flow / visual discovery. No source, schema, migration, RLS, API contract, database row, or UI artifact was modified.

**Repositories audited (canonical)**

- `D:\zt lounge\zt-lounge-demo\zt-lounge` â€” public website (static HTML + browser JS)
- `D:\zt lounge\zt-lounge-demo\zt-lounge-admin` â€” admin app (Next.js)

> **Nested copy excluded:** the nested `zt-lounge-admin` tree inside the admin repo is **not** the canonical admin implementation and was not used for this report.

## Status tag key

| Tag | Meaning |
|---|---|
| `VERIFIED` | Confirmed by direct source read in the canonical worktree |
| `NOT TESTABLE` | Executable checks exist in code, but runtime confirmation was impossible in this environment (blocking jammed shell / unavailable runtimes) |
| `BLOCKED` | Required dependency unavailable for this audit (live Supabase SQL execution, jammed shell) |
| `REQUIRES DECISION` | Product / engineering choice needed before implementation |
| `DEFERRED` | Deliberately out of scope for this audit / cannot be acted on without a preceding decision |
| `REJECTED` | Not applicable |

> **Runtime evidence policy:** where runtime/DB access is unavailable, that dimension is marked `NOT TESTABLE` or `BLOCKED`. No runtime evidence was manufactured and no prior report was assumed as proof â€” every claim below was read from the canonical source.

---

## 1. Executive summary

1. **Public membership data path is fully database-driven.** The served `index.html` (and the non-served `index_clean.html` backup) contain no hardcoded plan cards; they are pure mount points. `MembershipRepository.js` reads Supabase `membership_plans` + `membership_plan_benefits` through the canonical project (`jczwilrysvnhcjzjztbi`) anon client (RLS-gated) and returns **no fabricated rows** (fallbacks are `[]`). `membership-view.js` renders every plan value strictly from DB fields.
2. **No plan names, prices, registration fees, benefit text, plan order, or plan-specific badges are hardcoded in the served public UI.** The only plan-identity values embedded in code are:
   - `TIER_COLORS` (slug-keyed gradient map) in the admin repo's public Next `/membership` page;
   - the WhatsApp-only CTA rule + `KES` currency prefix on that same Next page;
   - CSS tier-color gradient rules in `assets/css/theme.css` keyed to `data-tier = slug` (legitimate visual constants, but not database-owned design tokens).
3. **Admin plans/benefits CMS is a clean super-admin CMS** (`/dashboard/memberships` â†’ `MembershipsCms`) writing through the generic admin CRUD routes, which are `withSuperAdminAuth`-gated for plans/benefits. The `WRITABLE_FIELDS` + `RESPONSE_ALLOWLISTS` boundary in `repository.ts` is the DBâ†”API contract and matches `schema.ts`.
4. **Ordering, active filtering, benefit ordering, CTA routing, and fee rendering are all DB-driven** on the public surfaces. `customer_memberships` has zero public exposure (no public read path exists).
5. **Remaining gaps are design/UX and ownership decisions, not data-source flaws:** no `featured` column, no per-plan accent color in the DB, and a divergent second public `/membership` page in the admin repo.





## 2. Current database contract

### 2.1 Canonical tables (verified from `src/db/schema.ts` L567-621 + `supabase/migrations/038_membership_baseline.sql`)

**`membership_plans`** â€” migration 038 baseline. **No `headline_benefit` / `headline_benefit_id` columns exist** (039/041 refinements unapplied; `schema.ts` comment L568-569).

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK, default random |
| `name` | text | NOT NULL |
| `slug` | text | NOT NULL, UNIQUE |
| `description` | text | nullable |
| `annual_price` | numeric | NOT NULL, CHECK >= 0 |
| `registration_fee` | numeric | NOT NULL, default 0 |
| `media_id` | uuid | FK â†’ `media_assets`, nullable |
| `display_order` | integer | NOT NULL, default 0 |
| `is_active` | boolean | NOT NULL, default true |
| `cta_text` | text | nullable |
| `cta_link` | text | nullable |
| `created_at` / `updated_at` | timestamp | NOT NULL, default now |
| `updated_by` | uuid | FK â†’ profiles, nullable |

**`membership_plan_benefits`** (1:N â†’ plans, `ON DELETE CASCADE`)

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `plan_id` | uuid | FK â†’ plans, NOT NULL, `ON DELETE CASCADE` |
| `description` | text | NOT NULL, CHECK >= 3 chars |
| `display_order` | integer | NOT NULL, default 0 |
| `is_active` | boolean | NOT NULL, default true |
| `created_at` / `updated_at` | timestamp | NOT NULL, default now |

**`customer_memberships`** â€” server-owned lifecycle table; **not a public plan-card surface**.

| Column | Type | Meaning |
|---|---|---|
| `id` | uuid | PK |
| `customer_id` | uuid | FK â†’ customers, `ON DELETE RESTRICT` |
| `plan_id` | uuid | FK â†’ plans, `ON DELETE RESTRICT` |
| `member_number` | text | DB sequence only (`ZT-M-00001â€¦`), UNIQUE, NOT NULL |
| `status` | text | CHECK: active / cancelled / expired / pending; default active |
| `registered_at` | timestamp | NOT NULL, default now (server) |
| `expires_at` | timestamp | NOT NULL (server, +1 yr) |
| `annual_price_snapshot` | numeric | NOT NULL (server snapshot) |
| `registration_fee_snapshot` | numeric | NOT NULL (server snapshot) |
| `notes` | text | nullable |
| `created_by` | uuid | FK â†’ profiles, nullable |
| `created_at` / `updated_at` | timestamp | NOT NULL |

### 2.2 RLS / grants (verified from `038` migration + `.temp/` state scripts)

- `membership_plans`: public read `is_active = true`; admin/manage `is_admin_or_above()`.
- `membership_plan_benefits`: public read `is_active = true AND plan.is_active = true`.
- `customer_memberships`: **no public read**; admin/manage only.
- `040` revoked excess `TRUNCATE/TRIGGER/REFERENCES` grants on the three tables.

## 3. Admin data flow

### 3.1 Route map (verified)

| Operation | Route | Auth | Implementation |
|---|---|---|---|
| GET plans/benefits list | `GET /api/admin/membership-plans` / `/membership-plan-benefits` | `withSuperAdminAuth` | generic `[resource]` route â†’ `repo.findById` collection (pagination, `ORDERABLE_COLUMNS`, `SEARCHABLE_FIELDS`, RLS `is_active`) |
| POST plan/benefit | `POST /api/admin/membership-plans` / `/membership-plan-benefits` | `withSuperAdminAuth` | generic `[resource]` POST â†’ `repo.create(resource, body)` (sanitized by `WRITABLE_FIELDS` allowlist) |
| GET single | `GET /api/admin/membership-plans/:id` | `withSuperAdminAuth` | `repo.findById` (+ media resolution for `MEDIA_RESOURCES`; membership tables are NOT media resources) |
| PATCH single | `PATCH /api/admin/membership-plans/:id` | `withSuperAdminAuth` | generic `[id]` â†’ `repo.update` (sanitized by `WRITABLE_FIELDS`) |
| DELETE | `DELETE /api/admin/membership-plans/:id` | `withSuperAdminAuth` | generic `[id]` â†’ `repo.delete` (FK `RESTRICT` â†’ 409 `DEPENDENT_RECORDS` when history exists) |
| Assign member | `POST /api/admin/customer-memberships` | `withAdminAuth` | `MembershipHandler.create()` (server derives `member_number`, snapshots, `registered_at`, `expires_at`) |
| Lifecycle | `POST /api/admin/customer-memberships/:id/renew`<br>`POST /api/admin/customer-memberships/:id/cancel` | `withAdminAuth` | `MembershipHandler.renew()` / `.cancel()` (idempotent cancel; record preserved) |
| Member edit | `PATCH /api/admin/customer-memberships/:id` | `withAdminAuth` | `MembershipHandler.update()` (status transitions + notes only) |

**Key findings:**
- `DEDICATED_ROUTE_ONLY_RESOURCES = { "service_charges" }` â€” plans/benefits share the **generic** dynamic routes (no separate dedicated `[id]` route exists for them).
- `SUPER_ADMIN_RESOURCES = { "membership-plans", "membership-plan-benefits" }` â†’ both gated `withSuperAdminAuth` (Phase 5B fix).
- `customer_memberships` routes are `withAdminAuth` (admin-level by design).
- `MembershipHandler` is **only** used for `customer_memberships` lifecycle; plan/benefit mutations go through generic `repo.create/update`.
- `WRITABLE_FIELDS` (confirmed in `repository.ts`):

| Table | Writable fields |
|---|---|
| `membership_plans` | `name, slug, description, annual_price, registration_fee, media_id, display_order, is_active, cta_text, cta_link, updated_by` |
| `membership_plan_benefits` | `plan_id, description, display_order, is_active` |
| `customer_memberships` | `customer_id, plan_id, status, notes` |

- `RESPONSE_ALLOWLISTS` mirror the writable allowlists (snake_case; `mapping.ts` has **no** membership entries).
- `PUT`/`PATCH` of `status` on `customer_memberships` is admitted by the allowlist; app-level `STATUS_TRANSITIONS` guards live only in `MembershipHandler.update` (the route PATCH path). The dead-code `update()` helper is not reachable from the routes.

### 3.2 Admin surfaces (verified)

- `/dashboard/memberships` â†’ `MembershipsCms` (server-guarded `requireSuperAdmin`; plain admin redirected to `/dashboard`). Plan form: `name, slug, description, annual_price, registration_fee, display_order, cta_text, cta_link` + media picker (`PLAN_UPLOAD_CATEGORY = "memberships"`). Benefit form: `description, display_order`. Activate/deactivate via `is_active` toggle. Delete â†’ 409 when history exists.
- `/dashboard/members` â†’ `MembersView` (admin/super-admin): assign or add a member, renew/cancel, change package. Inactive plans shown with `(Inactive)` badge. **This is member-management, not plan-card configuration.**
- `/dashboard/customers` â†’ `CustomersView` (admin/super-admin): customer list + membership change/assign/renew. Membership mutations also live here (no separate membership page).
- Nav: "Membership" â†’ `/dashboard/membership`, but canonical pages are `/dashboard/memberships` (CMS) and `/dashboard/members` (member ops). **No `/dashboard/membership` page exists in the canonical tree** (source-verified) â€” nav link is stale. Minor supervision gap (NOT TESTABLE in this shell; would 404/redirect).
- `WRITABLE_FIELDS` (confirmed in `repository.ts`):

| Table | Writable fields |
|---|---|
| `membership_plans` | `name, slug, description, annual_price, registration_fee, media_id, display_order, is_active, cta_text, cta_link, updated_by` |
| `membership_plan_benefits` | `plan_id, description, display_order, is_active` |
| `customer_memberships` | `customer_id, plan_id, status, notes` |

- `RESPONSE_ALLOWLISTS` mirror the writable allowlists (snake_case; `mapping.ts` has **no** membership entries).
- `PUT`/`PATCH` of `status` on `customer_memberships` is admitted by the allowlist; app-level `STATUS_TRANSITIONS` guards live only in `MembershipHandler.update` (the route PATCH path). The dead-code `update()` helper is not reachable from the routes.

### 3.2 Admin surfaces (verified)

- `/dashboard/memberships` â†’ `MembershipsCms` (server-guarded `requireSuperAdmin`; plain admin redirected to `/dashboard`). Plan form: `name, slug, description, annual_price, registration_fee, display_order, cta_text, cta_link` + media picker (`PLAN_UPLOAD_CATEGORY = "memberships"`). Benefit form: `description, display_order`. Activate/deactivate via `is_active` toggle. Delete â†’ 409 when history exists.

## 5. Membership-plan workflow

### 5.1 Plan and benefit CRUD (admin CMS â†’ DB)

```
MembershipsCms (src/features/memberships/memberships-cms.tsx)
   â”œâ”€ POST /api/admin/membership-plans / /membership-plan-benefits   (generic [resource] route, withSuperAdminAuth)
   â”‚    â””â”€ repo.create(resource, body)                               (WRITABLE_FIELDS sanitize)
   â”‚         â””â”€ INSERT to membership_plans / membership_plan_benefits (schema.ts)
   â””â”€ generic [resource] PATCH/DELETE routes
        â””â”€ repo.update/delete (WRITABLE_FIELDS sanitize, FK RESTRICT handling)
```

- Plan mutators: name, slug, description, annual_price, registration_fee, media_id, display_order, is_active, cta_text, cta_link (all `WRITABLE_FIELDS` for `membership_plans`).
- Benefit mutators: plan_id, description, display_order, is_active (all `WRITABLE_FIELDS` for `membership_plan_benefits`).
- Media: plan media_id FK â†’ media_assets (`MEDIA_RESOURCES`); plan/benefit tables are NOT media resources; `PlanMediaResolver`/`BenefitMediaResolver` resolve public URLs for the public UI.
- No `featured`, no per-plan accent-color column exists anywhere in the schema.

### 5.2 Membership (customer_memberships) workflow â€” `MembershipHandler`

```
POST /api/admin/customer-memberships                       (withAdminAuth)
   â””â”€ MembershipHandler.create()
        member_number (DB seq ZT-M-00001â€¦), is_active, registered_at, expires_at (+1 yr), annual_price_snapshot, registration_fee_snapshot, status active

POST /api/admin/customer-memberships/:id/renew             (withAdminAuth)
   â””â”€ MembershipHandler.renew() â€” re-derives snapshots, extends expiry, status stays active

POST /api/admin/customer-memberships/:id/cancel            (withAdminAuth)
   â””â”€ MembershipHandler.cancel() â€” idempotent: status â†’ cancelled, preserved (no hard delete)

PATCH /api/admin/customer-memberships/:id                  (withAdminAuth)
   â””â”€ MembershipHandler.update() â€” status transitions + notes only (app-level STATUS_TRANSITIONS guard)
```

## 6. Hardcoded business data inventory

The following business-critical values are **hardcoded in code/CSS** rather than owned by the DB/public UI. These are the actionable findings of this audit.

| # | Location | Hardcoded value | Severity | Category |
|---|---|---|---|---|
| 1 | `src/app/membership/page.tsx` (admin repo) | `TIER_COLORS` slug-keyed gradient map | HIGH | Business data |
| 2 | `src/app/membership/page.tsx` (admin repo) | WhatsApp-only CTA rule (`Join {plan.name} via WhatsApp`); no `cta_text`/`cta_link` support | HIGH | Business rule |
| 3 | `src/app/membership/page.tsx` (admin repo) | `KES` currency prefix + KES formatting independent of `cfg().currency` | MEDIUM | Business data |
| 4 | `assets/css/theme.css` | `.tier-{slug}` gradient rules keyed to `data-tier=slug`; overlay text hardcodes "Enjoy Your Breakfast Todayâ€¦" | MEDIUM | UI constants |
| 5 | `assets/js/membership-view.js` | `money()` â†’ `'KSh ' + en-KE` prefix constant; `cfg().currency` exists but not used for public cards | LOW | Formatting |
| 6 | `assets/js/membership-view.js` | `cfg().ctaFallbackText = 'Enquire now'`; `fullModeCta` uses `plan.cta_text || cfg().ctaFallbackText` | LOW | Fallback rule |
| 7 | `src/app/dashboard/memberships/page.tsx` | `PLAN_UPLOAD_CATEGORY = 'memberships'` (media picker scoping) | LOW | Admin metadata |
| 8 | `src/app/dashboard/membership/page.tsx` (nav) | Stale nav link "Membership" â†’ `/dashboard/membership` (no such page in canonical tree) | MEDIUM | Navigation |
| 9 | `src/app/membership/page.tsx` (admin repo) | Duplicate public surface with different CTA/colors/lang than canonical static site | MEDIUM | Duplicate surface |
| 10 | `src/app/membership/page.tsx` + `membership-view.js` | Two independent `TIER_COLORS`/`money()`/CTA-rule copies that will drift | HIGH | Duplication |
| 11 | `src/lib/api.ts` | Admin CRUD allowlists (`WRITABLE_FIELDS` / `RESPONSE_ALLOWLISTS`) block new per-plan fields until the DB schema changes | INFO | Contract |

### 6.1 Evidence notes

- **TIER_COLORS** (admin repo `/membership`) is a slug-keyed map like `'breakfast': 'linear-gradient(135deg, #...), ...'`. The static site has no equivalent: its tier treatment is purely CSS classes (`tier-neutral`, `tier-breakfast`, â€¦) with no DB-owned accent values.
- **WhatsApp-only CTA** on the admin repo public page means a plan with `cta_text`/`cta_link` populated still renders `wa.me` via the `enquiryHref`/`fullModeCta` logic; the `cta_link` path is effectively disabled there.
- **KES prefix** appears in the admin repo page for the price and period; the static site uses `money()` (`'KSh ' + en-KE`).
- **CSS tier rules** in `theme.css` duplicate the slug vocabulary from `TIER_COLORS`. These are *visual constants* (not business data to publish), which is why they are marked MEDIUM/HIGH only as UI consistency risk, not as leaked data.
- No other hardcoded plan/benefit/customer data was found in the served static HTML, the public JS renderer, or the admin CRUD forms (all plan-identifying values flow from the DB).

### 6.2 Recommended remediation (for the implementation phases)

- Delete or mark `TIER_COLORS` dead code in the admin repo public page; keep the single `data-tier` CSS taxonomy aligned with DB `slug` values.
- Route the admin repo public page to the canonical static site (or delete it) and enforce one currency/formatting rule + one CTA resolution path in `membership-view.js`.
- Add a per-plan accent-color to the DB (`accent_color` column, default null) and consume it in the public UI/CSS if/when the feature is approved (never bake colors into code).
- Align `/dashboard/membership` nav with the canonical CMS pages or remove it; the static site's footer disclaimer must remain the single legal copy.


- Member number is DB-derived and immutable; snapshots are server-computed; `customer_memberships` never appears in public API responses (sealed at the data-access layer).
- The generic `[resource]` routes admit `status` writes (allowlist), but the app-level `STATUS_TRANSITIONS` guard lives only in `MembershipHandler.update`; there is a dead-code `update()` helper in `membership-handler.ts` that is unreachable from the routes.

### 5.3 Public rendering flow (summary)

```
new GetPublicPlans() â†’ order_by display_order ASC, live is_active filter
   â†’ candidate cards (name, slug, description, annual_price, registration_fee, media_id, cta_text, cta_link, is_active)
   â†’ benefits attached (active only)
   â†’ media resolved
   â†’ membership-view.js renders: name, slug data-tier, image (16/9), description, price (KSh + en-KE), registration fee banner, benefits list, CTA
```

### 5.4 Admin screens that do NOT belong to plan-card configuration

- `/dashboard/members` (MembersView) â€” member assign/renew/cancel/package change; shows `(Inactive)` on inactive plans only as a hint.
- `/dashboard/customers` (CustomersView) â€” customer list + membership change/assign/renew; no separate membership page.
- These are member-operations surfaces, not plan-card configuration surfaces.



## 7. Admin CMS UI audit (conformance vs. brief)

### 7.1 `/dashboard/memberships` â€” `MembershipsCms` (verified)

- Conforms: generic `[resource]` CRUD for `membership-plans` and `membership-plan-benefits`; super-admin gating (`withSuperAdminAuth`); plan form fields (name, slug, description, annual_price, registration_fee, display_order, cta_text, cta_link) + media picker (`PLAN_UPLOAD_CATEGORY = 'memberships'`); benefit form (description, display_order); activate/deactivate via `is_active`; delete â†’ 409 when history exists.
- Gaps (UI/design, not data source): no **featured/badged** badge toggle UI; no **per-plan accent color** picker (no DB column); no **search/filter** beyond `ORDERABLE_COLUMNS`/`SEARCHABLE_FIELDS`; no **CSV export**; no **plan-image upload/asset management** UI (media_id is selected from existing media assets only); no **publish-status/visibility** concept beyond `is_active`; no **delete-cascade confirmation** beyond the 409; no inline preview of the public card; no audit/log view of who changed what.

### 7.2 `/dashboard/members` â€” `MembersView` (verified)

- Conforms: assign/add member, renew, cancel, change package; inactive plans shown with `(Inactive)` badge.
- Gaps: this is member-operations, not plan-card configuration; the brief's "members" view should show participation state only (member number, status, expiry, snapshot dates) â€” no plan-card controls.

### 7.3 `/dashboard/customers` â€” `CustomersView` (verified)

- Conforms: customer list + membership change/assign/renew.
- Gaps: membership mutations are duplicated here (no dedicated membership page); no customer membership history/print view.

### 7.4 Cross-cutting admin UI assessment

- **Image provisioning for plan cards**: the public UI demands a plan image (16/9, `zt-member-image` fallback), but the admin CMS has no upload surface â€” only an FK to `media_assets`. Either the brief's "no binar y" rule allows asset upload from the CMS, or the public image is served from a seeded `media_assets` row. Currently: seed-only.
- **No plan export**: no CSV/XLSX download of plans, benefits, or fees for ops/maintenance.
- **No per-plan clone/duplicate**: plan workflows commonly need duplicate-by-slug; not present.
- **No audit UI**: `updated_by` is captured server-side, but there is no admin page rendering change history.

## 8. Public website UI audit (conformance vs. brief)

### 8.1 Structural template (short-code-based card UI)

- **Conforms**: the public pages (`index.html` L291-311, `index_clean.html` L571-592) contain a short-code-ish mount block: static header (accordion+lead copy is hardcoded in the static HTML â€” a design constant), fee banner element `#membership-fee-banner`, and `data-membership-grid` mount point with `data-membership-mode` (`teaser`/`full`) and `data-membership-limit` attributes.
- **Conforms**: `src/assets/js/membership-view.js` renders a `<div class="card">` per plan using: name (h3), slug (`data-tier=data-tier`), image (`zt-member-image`, 16/9, null-guarded), description, price (KES + en-KE), registration fee banner, benefits list, CTA. Matches the brief's structural template.
- **Conforms**: pricing uses `money()` â†’ `'KSh ' + en-KE`; period shown as **annual**; registration fee as a banner.

### 8.2 Gaps on the public website

- **No featured/lead placement**: `data-tier`-based CSS tiers exist, but no `featured` visual treatment (hero placement, badge, asymmetric layout) for any plan. This is a DB/UI decision, not a data-source flaw.
- **No per-plan CTA landing / deep link**: cards link to WhatsApp or `cta_link` only for enquiry; no plan detail page, no "view schedule"/"buy now" destinations beyond WhatsApp.
- **No public group/read of participation**: `customer_memberships` has no public read path (by design â€” participation state must remain sealed).
- **No search/filter/legend**: plans are shown in `display_order`; no tag/filter UI on the public site.
- **No export/print/kiosk**: no printable plan sheet, no QR/code to the public page from the CMS.
- **Static HTML carries design constants, not plan data**: the static header/lead copy and the mandatory legal disclaimer are hardcoded in `index.html`/`index_clean.html` â€” acceptable, but they must be the ONLY static content; any future plan data added there would break the DB-driven contract.
- **No accent/color token**: `TIER_COLORS` lives only in the admin repo's duplicate public page; the canonical static site has no accent treatment.

### 8.3 Assessment

- The public UI is **structurally complete** for the brief's short-code card template, and fully database-driven. The canonical `index.html`/`index_clean.html` + `MembershipRepository.js` + `membership-view.js` are consistent with each other. The defects are (a) the duplicate admin-repo public page, (b) missing `featured`/accent UI decisions, (c) absence of a plan-image upload surface in the CMS, (d) duplication of formatting/color/CTA rules across two codebases.

## 9. Data ownership & public-readability matrix

| Data domain | DB/table | Public read path | Admin read path | Owner / notes |
|---|---|---|---|---|
| Plan identity/config | `membership_plans` | anon (RLS `is_active=true`) â†’ `getPublicPlans()` live | admin (super-admin) â†’ generic `[resource]` + CMS | Canonical plan-card source; `slug`/`name`/`description` owned by DB |
| Plan image | `membership_plans.media_id` â†’ `media_assets` | public (via `MediaResolver`) only | admin (super-admin, media tools) | Seeded artifact; CMS upload still open |
| Plan benefits | `membership_plan_benefits` | anon (active + linked plan active) | admin (super-admin) | 1:N to plans |
| Fees (annual, registration) | `annual_price`, `registration_fee` | public (fee banner from first active plan) | admin (CMS) | DB numerics; formatting applied client-side |
| CTA (text/link) | `cta_text`, `cta_link` | public (used or fall back to WhatsApp) | admin (CMS) | `cta_text` may be empty â†’ WhatsApp fallback |
| Plan order/visibility | `display_order`, `is_active` | public (ordered, filtered) | admin (CMS toggle) | RLS exposes `is_active` |
| Menu/location/social (business) | `business` / `cfg()` | public (finder â†’ content/static) | admin (admin config) | Static; not membership data |
| Participation | `customer_memberships` | **none** (sealed; no public read) | admin (super-admin) | Server-derived member numbers, snapshots, expiry â€” never public |
| Customer master | `customers` | none (admin only) | admin (super-admin) | No public exposure |
| Plan-specific visual tokens | `theme.css` `.tier-*` + admin `TIER_COLORS` | CSS (client) | CSS | Design constants â€” not DB data; must be unified |

### 9.1 Ownership rules

- **Canonical public data = the DB fields listed in Â§2.1**; nothing else (no hardcoded plan names, prices, fees, benefit text, order, badges, or secrets) may reach the public UI.
- **Participation = server-owned and admin-only**; never exposed via the public API or public UI.
- **Media = seed-only today**; the CMS has no upload path, so plan images are a seeded `media_assets` FK.
- **Design tokens** (tier colors, accents, currency symbol) must be DB/CMS-owned or a single shared static copy â€” never duplicated per codebase.

## 10. Identified gaps (true gaps, not data-source contradictions)

Each gap below is a real shortfall in the current system relative to the brief â€” **not** a claim that the public UI leaks DB data.

### 10.1 Plan configuration gaps (no public UI defect)

1. **No `featured` column / UI** â€” no plan can be marked featured; the public UI has no featured treatment.
2. **No per-plan accent color** â€” tier colors live in `TIER_COLORS` (admin repo) and `theme.css`; no DB/CMS color ownership.
3. **No plan-image upload in the CMS** â€” plan images are a seeded FK to `media_assets` only.
4. **No CSV/export** of plans, benefits, or fee matrix from the CMS.
5. **No plan duplicate/clone workflow**.
6. **No audit/history view** of who changed what (`updated_by` exists but no UI).
7. **No searchable/filterable public plan UI** (only `display_order`).

### 10.2 Public website gaps (UX/design)


### 10.2 Public website gaps (UX/design)

1. **No featured/lead placement** â€” `data-tier`-based CSS tiers exist, but no `featured` visual treatment (hero placement, badge, asymmetric layout).
2. **No per-plan CTA landing / deep link** â€” cards link to WhatsApp or `cta_link` only for enquiry; no plan detail page or "buy now" destination.
3. **No public group/read of participation** â€” `customer_memberships` has no public read path (by design; participation must remain sealed).
4. **No search/filter/legend** â€” plans shown in `display_order`; no tag/filter UI.
5. **No export/print/kiosk** â€” no printable plan sheet; no QR/code to the public page from the CMS.
6. **Static HTML carries design constants, not plan data** â€” the static header/lead copy and mandatory legal disclaimer are hardcoded; they must be the ONLY static content.

S


























































































































































