# Phase 5A â€” Progress Log (provenance / source-verified reading order)

> **Phase:** Audit complete (PLAN â†’ ACT). Surgical fixes **APPLIED** in act-mode, source-verified,
> both JS pass `node --check`. See Â§6 for the as-executed log.

## 0. Task framing
Requirement: simple membership **cards on the website â†’ click a card â†’ in-page modal** with that
membership's name, image, price/registration, **complete** benefits, CTA, close. No separate membership
page. No hardcoded membership images/content.

## 1. Surfaces identified
- **Static public site (target):** `zt-lounge/index.html` + `assets/js/` browser stack
  (`shared-components.js`â†’`MembershipRepository.js`+`membership.config.js`+`membership-view.js`,
  `content-loader.js`, `MediaResolver.js`, `BaseRepository.js`, `supabase.config.js`).
- **Divergent public Next surface (NOT targeted):** `zt-lounge-admin/src/app/page.tsx` (public landing,
  links `/membership`Ã—3), `src/app/membership/page.tsx`, `src/app/api/membership-plans/route.ts`.
- **Admin CMS (NOT targeted):** `zt-lounge-admin/src/app/dashboard/memberships/page.tsx` â†’
  `memberships-cms.tsx`; generic admin CRUD `[resource]/[id]/route.ts`; `MembershipHandler`
  (customer-memberships only).
- **Structural anomaly:** nested duplicate `zt-lounge\zt-lounge-admin` (60 entries) â€” disambiguate
  before any admin-repo edits.

## 2. Source files read (each content-verified; no assumptions from PHASE5_MEMBERSHIPS_AUDIT.md)
- `supabase/migrations/038_membership_baseline.sql` â€” canonical columns + RLS + triggers.
- `supabase/migrations/039_membership_headline_benefit.sql` â€” prod: `headline_benefit` TEXT + populate + guards.
- `supabase/migrations/041_membership_headline_benefit_id.sql` â€” staging-only: `headline_benefit_id` + trigger (explicitly not prod).
- `040`, `042` â€” grant revocations / RPCs (scope only).
- `assets/js/membership-view.js` (L1â€“262, full) â€” presenter; **bugs F1â€“F6 found here**.
- `assets/js/repositories/MembershipRepository.js` (L1â€“145, full) â€” `mapPlan` (name/slug/description, dead headline), `mapBenefit` (description), `getPublicPlans`, `getFeeSummary`.
- `assets/js/repositories/MediaResolver.js` (full) â€” canonical `media_id`â†’`public_url` resolution.
- `assets/js/lib/BaseRepository.js` L240 â€” confirms `.select('*')` (projection cannot error on prod 039).
- `assets/js/membership.config.js` â€” currency `KSh`, locale `en-KE`, teaserLimit 4, ctaFallback `Enquire now`.
- `assets/css/theme.css` L1828â€“1872 â€” modal + card CSS slots; `.zt-member-image`/`.zt-member-modal-image` absent.
- `index.html` L229â€“311 â€” membership mount (pure, no hardcoded images) + disclaimer.
- `src/app/api/membership-plans/route.ts` L1â€“90 â€” public Next API; selects `name,slug,description,annual_price,registration_fee,display_order` (no image/media).
- `src/lib/membership-handler.ts` L1â€“90 â€” `isMembershipResource === "customer-memberships"`; `name`/`slug` selects.
- `src/app/api/admin/[resource]/route.ts` (LIST) L144â€“156 â€” `MEDIA_RESOURCES` includes `membership-plans`.
- `src/app/api/admin/[resource]/[id]/route.ts` (GET single) L104â€“114 â€” `MEDIA_RESOURCES` omits `membership-plans`.
- `src/lib/resource-config.ts` L1â€“70; `src/lib/validation/admin.ts` L1â€“55 â€” `ADMIN_RESOURCES` allowlist includes membership-plans / membership-plan-benefits / customer-memberships.
- `src/features/memberships/memberships-cms.tsx` L1â€“80 â€” `planSchema` (no headline fields); CMS edits benefits via `/api/admin/membership-plan-benefits`.
- `src/db/schema.ts` L1â€“235 â€” **no membership models** in Drizzle mirror.
- `src/app/page.tsx` L1â€“45 â€” public landing, no auth, links `/membership`.
- `_runtime_captures/home_dom.txt` â€” confirmed live bundle loads the 3 membership defer scripts.
- Codebase greps: `plan_name|tier_level` (only in `membership-view.js`); `headline` (repo L75/133-136 + migrations + `.temp/`; NOT in view).

## 3. Key corrections vs. the earlier PHASE5_MEMBERSHIPS_AUDIT.md
- D4 ("public `SELECT` errors / homepage hidden on 039-only DB") is **false**: `BaseRepository.getAll`
  uses `.select('*')` (L240); a missing `headline_benefit_id` is `undefined`â†’`null`, not an error.
  Real breakage = field-name drift (F1) + benefits key (F2) + no image (F3) + generic modal (F4).
- D1/D2 (`schema.ts` L563â€“616 `membershipPlans` model) **false**: schema.ts has no membership models.
- D2 (`headline_benefit_id` absent in Drizzle) moot: there's no Drizzle membership model at all.

## 4. Status / next action (UPDATED)
Audit complete; surgical set FIX 1â€“6 **applied** to the static public site (see Â§6). No further
edits required for the static site. Live DB remains `[BLOCKED â€” LIVE DB UNAVAILABLE]`.

## 5. Baseline (pre-edit) git state
- `zt-lounge`: branch `clean-rebuild`. `git status --short` noisy (many staged-deleted `scripts/*.mjs`,
  unrelated).
- `theme.css`: tracked but **already modified pre-existing** (222 ins / 28 del vs HEAD; grep confirms the
  diff contains none of `membership`/`zt-member`/`modal-image` CSS â†’ unrelated to membership).
- `membership-view.js` + `MembershipRepository.js`: **untracked** (`??`) â€” present on disk & served live,
  but not in git for this branch (`ls-files` returns nothing for them).
- `zt-lounge-admin`: branch checked.
- Nested dup `zt-lounge\zt-lounge-admin`: 60 entries confirmed present.

## 6. Fixes Applied (as-executed)

Applied surgical set FIX 1â€“6 to the static public site (see `PHASE5A_MEMBERSHIP_SIMPLIFICATION_AUDIT.md` Â§14). Both JS pass `node --check`; grep confirms no `plan_name`/`tier_level`/`benefit_text`/`headline_benefit` remain. Live DB remains `[BLOCKED â€” LIVE DB UNAVAILABLE]` (no runtime query; all DB facts are migration/source-derived).
