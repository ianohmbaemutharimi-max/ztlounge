# Phase 5A â€” Membership Simplification Audit & Surgical Fix Apply (source-verified)

> **Status:** Audit complete. **Fixes APPLIED** â€” surgical set FIX 1â€“6 applied in act-mode (see Â§14); both JS pass `node --check`.
>
> **Mode:** Read-only audit phase. Every claim below is **source-verified** from file contents
> and `supabase/migrations/038`â€“`042` â€” not inferred from the earlier `PHASE5_MEMBERSHIPS_AUDIT.md`
> report (that report is cited only to record where it was **incorrect**).
>
> **Provenance:** [BLOCKED â€” LIVE DB UNAVAILABLE] â€” `api.supabase.co` resolves to NXDOMAIN in this
> environment, so no live SQL query could be executed. All DB-layer facts are established from
> migrations + `.temp/` verification scripts + `.select()` call-sites in source.
>
> **Target branch baseline:** `zt-lounge` @ `clean-rebuild` (HEAD); `git status --short` captured pre-edit
> (see `PHASE5A_PROGRESS.md`). **`theme.css` is tracked but already dirty** (222 insertions / 28 deletions
> vs HEAD, unrelated to membership â€” its diff contains no `membership`/`zt-member` CSS).
> `membership-view.js` + `MembershipRepository.js` are **untracked** (`??`) â€” present on disk and served by
> the live bundle, but not under git in this branch (see F12). FIX 6 on CSS therefore *adds* 2 rules on top
> of a pre-existing diff; the JS fixes (FIX 1â€“5) operate on untracked working-tree files, so "rollback" for
> them means restoring from backup, not `git checkout`.

## 1. What "membership" means here (scope alignment)

The task requirement is a **simple membership card on the website â†’ visitor clicks a card â†’ in-page modal**
showing that membership's name, image, price/registration info, **complete** privileges/benefits, a CTA,
and a close button. There is no separate membership page and no hardcoded membership content.

The **canonical public site** is the static shell `zt-lounge/index.html`. All membership rendering for the
public site is browser-JS: `shared-components.js` (`data-features="membership"`) â†’
`FEATURE_SCRIPTS['membership']` emits `MembershipRepository.js` + `membership.config.js` +
`membership-view.js` (`defer`) â†’ `content-loader.js` `populateMembership()` â†’ `MembershipView.init()`
mounted into `[data-membership-grid]`. `index.html` L231 / L291â€“311 confirm this (no hardcoded
membership images â€” the section is a pure mount + disclaimer).

> Note on a second public surface: `zt-lounge-admin/src/app/page.tsx` is itself a **public landing**
> (`export const revalidate = 0`, no auth) and links to `/membership` (L88/139/152); `src/app/membership/page.tsx`
> is a separate public Next page; `src/app/api/membership-plans/route.ts` is a public Next API. These form a
> **divergent/duplicate public surface** (see Â§10). Phase 5A's surgical fix set targets **only** the static
> `zt-lounge` public site. The Next public surfaces are recorded as consolidation candidates, not touched.

## 2. Migrations 038â€“042 (source-verified)

| # | File | Effect | Production? |
|---|------|--------|-------------|
| 038 | `038_membership_baseline.sql` | Creates `membership_plans`, `membership_plan_benefits`, `customer_memberships`; `updated_at` triggers; indexes; **RLS** (`membership_plans_public_read` = `is_active=true`; `â€¦_admin_manage` = `is_admin_or_above()`; `customer_memberships` = admin-only); `member_number` sequence default. | **Yes (baseline)** |
| 039 | `039_membership_headline_benefit.sql` | `ADD COLUMN headline_benefit text` + populate from benefit descriptions (Bronze/Silver/Gold/Platinum) + guard DOs. | Yes (prod lineage: 038â†’039) |
| 040 | `040_membership_revoke_excess_grants.sql` | Revokes `TRUNCATE, TRIGGER, REFERENCES` from `anon`/`authenticated`. | Yes |
| 041 | `041_membership_headline_benefit_id.sql` | `ADD COLUMN headline_benefit_id uuid` + UNIQUE(id,plan_id) + guard trigger `guard_membership_headline_deactivation`; **DROPs `headline_benefit` text**. Comment: *"Staging-only. â€¦ not intended to be applied to production as a separate migration; the production release will use the reviewed 039+041 squash."* | **No â€” staging only** |
| 042 | `042_membership_admin_rpcs.sql` | RPCs `reorder_membership_plans` + `set_membership_registration_fee`; grants `EXECUTE` to `authenticated`. | Yes |

Canonical columns (migration 038, the prod baseline) â€” **the source of truth for field names**:

- `membership_plans`: `id, name, slug, description, annual_price, registration_fee, media_id, display_order, is_active, cta_text, cta_link, created_at, updated_at, updated_by`
- `membership_plan_benefits`: `id, plan_id, description, display_order, is_active, created_at, updated_at`

> `name` (not `plan_name`); `slug` (not `tier_level`) â€” these are the **tier identifiers**. `description` (not `benefit_text`) on benefits.

## 3. Canonical DB contract vs. `schema.ts` (Drizzle mirror)

The Next admin app ships a Drizzle mirror in `src/db/schema.ts`. **It does not model the membership
domain at all** â€” a codebase-wide search for `membershipPlans|membershipPlanBenefits|customerMemberships`
in `schema.ts` returns **no hits** (only `assets/js/config/supabase.config.js`, `MembershipRepository.js`,
and this audit's own `PHASE5_MEMBERSHIPS_AUDIT.md` reference them). The Next app therefore accesses
membership via **raw `supabase.from(...)` selects**, not the Drizzle ORM.

Consequence: `PHASE5_MEMBERSHIPS_AUDIT.md` finding D1/D2 (which cite `schema.ts` lines 563â€“616 for a
`membershipPlans` model and an absent `headline_benefit_id` column) are **inaccurate** â€” there is no such
model in `schema.ts`. (See Â§8 â€” corrected findings.)

## 4. Media flow (canonical public path â€” verified)

- `MembershipRepository.js` â†’ `BaseRepository.create('membership_plans', â€¦, {cacheTTL:300000})`.
- `getPlansRepo().getAll({orderBy:'display_order', ascending:true})` â†’ **`client.from('membership_plans').select('*')`**
  (verified in `BaseRepository.js` L240). RLS exposes only `is_active=true`.
- `mapPlan` projects `media_id` (from the row) and sets `image_url = null`.
- `getPublicPlans` â†’ `.then(resolveMedia)` â†’ `MediaResolver.resolveCollection(items)`:
  collects `media_id`s â†’ one batched `media_assets.select('id,public_url,alt_text')` â†’ cache â†’
  `applyResolved` sets **`item.image_url = public_url`** when the asset resolves (never rejects â€”
  legacy `image_url` fallback otherwise). `MediaResolver.js` L58â€“78.
- So a plan card image source is `plan.image_url` (canonical `media_assets.public_url`), **driven by
  `media_id`** set through the CMS image picker. **No hardcoded membership image exists on the static
  public site** (`index.html` L292â€“311 is a pure mount). Â§2 requirement satisfied at the data layer.
- Admin CMS: `memberships-cms.tsx` (`ImageChangeDialog`, `PLAN_UPLOAD_CATEGORY='memberships'`) writes
  `media_id` on `membership_plans` via `/api/admin/membership-plans[/:id]`. The generic admin LIST endpoint
  `src/app/api/admin/[resource]/route.ts` **includes `membership-plans` in `MEDIA_RESOURCES`** (L145), so
  the CMS list/preview resolves `public_url` correctly. (Gap: the single-record GET
  `[resource]/[id]/route.ts` `MEDIA_RESOURCES` L106 is `{menu-items, services, gallery, hero-slides,
  promotions}` â€” **omits `membership-plans`**; CMS edit forms open from the LIST row which is already
  resolved, so this is non-blocking. Flagged as minor.)

## 5. Benefits flow + the field-name bug (the real breakage)

`mapBenefit` (verified L82â€“90) returns `{ id, plan_id, description, display_order, is_active }` â€”
benefit text is in **`description`**. `mapPlan` (L60â€“79) returns `name`, `slug` (not `plan_name`,
not `tier_level`). But the **presenter reads the wrong field names** â€” a field-name drift between the
repository (correct) and the view (stale from the Phase 5 report's assumptions):

| Presenter ref | File:line | Canonical field | Effect live |
|---|---|---|---|
| `plan.plan_name` | `membership-view.js:65, 98, 122` | `plan.name` | card title **blank**; modal plan-name list **blank**; WhatsApp prefill `â€¦plan.` |
| `plan.tier_level` | `membership-view.js:95, 96` | `plan.slug` | `data-tier` blank â†’ tier colour badge **broken**; badge text blank |
| `b.benefit_text` | `membership-view.js:86` | `b.description` | **benefits never render** on card or in modal (`mapBenefit` â†’ `description`) |
| `plan.image_url` | rendered as 0 `<img>` | `plan.image_url` | no card image at all (violates Â§2 "image must show") |
| `createModal(plans,â€¦)` | `membership-view.js:114` | (single plan) | modal lists all plans generically; shows **no** benefits (violates Â§3 "complete privileges") |

Because `BaseRepository.getAll` uses `.select('*')` (L240 â€” **not** an explicit column list),
**projection cannot error** on a 039-only DB: `headline_benefit_id` is simply absent â†’ JS reads
`undefined` â†’ `mapPlan` coerces it to `null`. So the Phase 5 report's "high" finding D4
("on a `039`-only live DB the public plan SELECT errors and the homepage section is hidden") is
**factually wrong**. The homepage is hidden only by the *intentional* degrade path
(`hideData` on render error) â€” but rendering does NOT error; it just renders blank cards because of
the field-name drift above. This is the source-verified root cause.

## 6. Headline contract (Â§5 determination)

- Prod lineage is `038` (no headline) â†’ `039` (adds `headline_benefit` **text**).
- `041` (staging-only) replaces text with `headline_benefit_id` + a guard trigger and is explicitly **not**
  for production.
- The public static renderer (`MembershipRepository.js`) projects `headline_benefit_id`
  (`mapPlan` L75) and computes `plan.headline_benefit` (`getPublicPlans` L133â€“136).
- **Nothing in the presentation reads it.** A codebase-wide grep for `headline` shows references only in
  `MembershipRepository.js` (the two dead lines above), the `039`/`041` migrations, and `.temp/`
  verification scripts. `membership-view.js` never reads `headline_benefit` or `headline_benefit_id`.

**Determination (Â§5): YES â€” removing headline-specific complexity simplifies without breaking data or
rendering.** `headline_benefit_id` is not a prod column, is always `null` on prod (so the computed
`plan.headline_benefit` is always `''`), and is never rendered. Removing the two projections from the
public repository is data-safe (no DB write) and presentation-safe (no consumer). It also removes the
single source of confusion that produced the false "SELECT errors" risk.

## 7. Admin surfaces (separate, not in surgical scope)

- `src/app/api/membership-plans/route.ts` `GET`: public, anon-client, RLS-gated. Selects only
  `id, name, slug, description, annual_price, registration_fee, display_order` (+ benefits
  `plan_id, description, display_order`). Groups into `{id,name,slug,description,annual_price,registration_fee,display_order,benefits:[{description,display_order}]}`.
  **Does not return `image_url`/`media_id`** â€” a separate public Next surface gap (memberships rendered
  there would lack images). Out of Phase 5A scope; recorded.
- `src/app/membership/page.tsx`: public Next page (revalidate 0, no auth) â€” a **second public membership
  page** (Â§10 candidate).
- `src/app/dashboard/memberships/page.tsx` â†’ `memberships-cms.tsx`: SUPER-ADMIN CMS. `planSchema`
  (L56â€“68) = `name, slug, description, annual_price, registration_fee, display_order, cta_text, cta_link`
  â€” **no headline fields**, no `tier_level`/`plan_name`. Confirms Â§5 finding D3 (headline not CMS-editable).
  Image via `ImageChangeDialog` + `PLAN_UPLOAD_CATEGORY='memberships'`; writes `media_id`.
- Plan CRUD uses the generic `/api/admin/membership-plans[/:id]` (not `MembershipHandler`);
  `MembershipHandler.isMembershipResource` is `=== "customer-memberships"` only
  (`src/lib/membership-handler.ts` L50). Operational customer memberships (assign/renew/cancel with
  server-side `member_number`/`*_snapshot`/`expires_at` derivation) are **out of scope** for Phase 5A â€”
  they are admin-only lifecycle operations, not public marketing.
- `ADMIN_RESOURCES` allowlist (`src/lib/validation/admin.ts` L6â€“38) includes `membership-plans` (L35),
  `membership-plan-benefits` (L36), `customer-memberships` (L37) â€” so all three are admin-CRUD routable.

## 8. Findings table (corrected vs. the earlier Phase 5 report)

Severity is relative to the Phase 5A goal (simple cards â†’ modal on the static public site).

| # | Finding (source-verified) | Location | Risk | Note vs. earlier report |
|---|---|---|---|---|
| F1 | Presenter reads `plan_name`/`tier_level`; repo/DB are `name`/`slug` â†’ **blank card names + broken tier badge** | `membership-view.js:65,95,96,98,122` | **High** (silent: cards render but empty) | Phase 5 assumed these fields exist â€” they do not |
| F2 | `benefitsHTML` reads `b.benefit_text`; `mapBenefit` returns `description` â†’ **benefits never render (card or modal)** | `membership-view.js:86` | **High** (violates Â§3 "complete privileges") | Phase 5 did not flag this |
| F3 | No `<img>` rendered on card/modal from `plan.image_url` â†’ **no plan image** | `membership-view.js` cardHTML/createModal | **High** (violates Â§2) | Phase 5 assumed image wiring existed |
| F4 | `createModal` is generic/all-plans; shows **no** benefits; static title; card click opens site-wide modal, not the clicked plan's privileges | `membership-view.js:114,148` | **High** (violates Â§3) | Phase 5 treated modal as complete |
| F5 | Teaser card renders the full benefits list (overloaded card) | `membership-view.js:102` | Medium (violates Â§1 card simplicity) | â€” |
| F6 | Stale CTA label "View More" (should be "View Benefits") | `membership-view.js:71` | Low | â€” |
| F7 | `headline_benefit_id` projected by `mapPlan` but (a) not a prod column, (b) never rendered â€” dead complexity | `MembershipRepository.js:75,133-136` | Low (safe to remove) | Phase 5 D4 called this a *high* SQL-error risk â€” **incorrect**: `select('*')` cannot error on a missing projected column |
| F8 | `schema.ts` Drizzle mirror has **no** membership models | `src/db/schema.ts` | Info | Phase 5 D1/D2 cited `schema.ts` L563â€“616 â€” **inaccurate** (no such model) |
| F9 | Single-record admin GET omits `membership-plans` from media resolution | `[resource]/[id]/route.ts:106` | Low (non-blocking; CMS uses list) | â€” |
| F10 | Duplicate nested repo `zt-lounge\zt-lounge-admin` (60 entries) â€” legacy/duplicate of canonical `zt-lounge-admin` | repo tree | Low | Resolve/remove before any admin-repo writes |
| F11 | Two divergent public membership surfaces (static `index.html` vs Next `page.tsx` + `/membership` + `/api/membership-plans`) | two repos | Medium (consolidation) | Phase 5 did not distinguish |
| F12 | `membership-view.js` + `MembershipRepository.js` are **untracked** in `zt-lounge` (not in git); `theme.css` already `M` (pre-existing, unrelated, no membership CSS) | git state | Low (hygiene) | Working-tree membership layer is not source-controlled in this branch â€” edits invisible to `git diff`; restore-from-backup rollback |

## 9. Recommended surgical fix set (PROPOSED â€” not applied; plan mode)

Each edit is the minimum change that resolves the cited finding while reusing the existing modal
CSS (`.membership-modal*`) and existing helpers (`money`, `esc`, `benefitsHTML`, `fullModeCta`,
`whatsappBase`, `businessData`). No DB, migration, or admin-code changes. **Rollback = revert 3 files.**

### FIX 1 â€” Remap presenter field names to canonical (`name`/`slug`/`description`)
- **FILE:** `zt-lounge/assets/js/membership-view.js`
- **WHY (F1, F2):** `mapPlan`/`mapBenefit` return `name`/`slug`/`description`; the view reads `plan_name`/`tier_level`/`benefit_text` â†’ blank cards + no benefits.
- **OLD (6 sites):** L65 `plan.plan_name`; L86 `b.benefit_text`; L95 & L96 `plan.tier_level`; L98 `plan.plan_name`; L122 `p.plan_name`.
- **NEW:** `plan.name`; `b.description`; `plan.slug` (Ã—2); `plan.name`; `p.name`.
- **MINIMUM:** character-level remap of 6 identifiers; no structure change.

### FIX 2 â€” Render plan image on the card; do not overload the teaser card
- **FILE:** `zt-lounge/assets/js/membership-view.js` (`cardHTML`)
- **WHY (F3, F5):** Â§2 requires the plan image to show (canonical `plan.image_url`); Â§1 requires the card
  to be image/name/price/action only â€” complete privileges belong in the modal.
- **OLD:** cardHTML renders a badge + title + price + **`<ul>` benefits on the teaser** + CTA; no `<img>`.
- **NEW:** emit `<img class="zt-member-image" src=plan.image_url alt=â€¦ loading=lazy>` (only when
  `plan.image_url`); keep badge(`plan.slug`)/title(`plan.name`)/price; render benefits + FCA **only in
  `full` mode** (teaser shows only `View Benefits` CTA).
- **MINIMUM:** add image branch; gate `benefitsHTML` behind `full`.

### FIX 3 â€” Per-plan modal with complete privileges, image, price/registration, CTA, contact, close
- **FILE:** `zt-lounge/assets/js/membership-view.js` (`createModal`/`openModal`/`mount` triggers)
- **WHY (F4):** Â§3 â€” clicking a card must open a modal for **that** membership showing name, image,
  price/registration, **complete** benefits, CTA, contact, close. Current modal is generic, benefit-less,
  and site-wide.
- **OLD:** `createModal(plans, summary, business)` builds one generic modal; `openModal(plans,â€¦)` opens it;
  mount calls `openModal(plans, summary, business)` for every card.
- **NEW:** `openModal(plan, summary, business)` / `createModal(plan, summary, business)` render, for the
  clicked plan: `.membership-modal-image` (from `plan.image_url`), title `plan.name + " Membership"`,
  `annual_price` + period, `registration_fee`, `description`, `<h3>â€¦Privileges</h3>` + `benefitsHTML(plan.benefits)`
  (the **complete** benefits), `fullModeCta(plan, business)` (WhatsApp enquiry), and the existing
  contact `<ul>` (phone/WhatsApp/email) + `&times;` close. `mount` attaches each trigger to
  `openModal(visible[i], summary, business)`.
- **MINIMUM:** rewrite the two function bodies + the trigger-loop index (3 touch points); reuse existing
  CSS classes + helpers.

### FIX 4 â€” CTA label "View Benefits"
- **FILE:** `zt-lounge/assets/js/membership-view.js` (`teaserCta`, L71)
- **WHY (F6):** requirement calls for a clear "View Benefits" action.
- **OLD:** text `View More`. **NEW:** `View Benefits`. **MINIMUM:** text swap.

### FIX 5 â€” Remove dead headline projection from the public renderer
- **FILE:** `zt-lounge/assets/js/repositories/MembershipRepository.js`
- **WHY (F7, Â§5):** `headline_benefit_id` is not a prod column and is never rendered; projection is dead.
- **OLD:** `mapPlan` L75 `headline_benefit_id: item.headline_benefit_id || null`; `getPublicPlans` L133â€“136
  compute `plan.headline_benefit`.
- **NEW:** both removed; plan object shape otherwise unchanged (`benefits`, `image_url`, etc. intact).
- **MINIMUM:** delete 1 line + a 4-line block; no DB/API change (the static renderer is the only consumer).

### FIX 6 â€” Card + modal image presentational rules
- **FILE:** `zt-lounge/assets/css/theme.css` (append after the membership block, ~L1872)
- **WHY (F3):** `.zt-member-image` / `.zt-member-modal-image` are not yet defined; without a rule the
  `<img>` renders unconstrained.
- **OLD:** no rule. **NEW:**
  ```css
  .zt-member-image { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; }
  .zt-member-modal-image { width: 100%; height: auto; border-radius: var(--radius-md); margin-bottom: var(--space-md); display: block; }
  ```
- **MINIMUM:** two append-only, non-breaking rules.

### Why this is the complete set
After FIXs 1â€“6 the public path satisfies the task: cards carry image+name+price+("View Benefits"),
clicking a card opens an in-page modal (existing CSS, ESC/overlay/scroll-lock preserved) showing that
plan's name + image + price + registration fee + **complete** benefits + enquire CTA + contact links +
close. No migration, no admin code, no `/membership` Next page, no `index_clean.html` required.

## 10. Out-of-scope / consolidation candidates (NOT proposed for this surgical pass)

- **Deprecate the duplicate public Next surface** â€” `zt-lounge-admin/src/app/page.tsx` (public landing)
  + `src/app/membership/page.tsx` + `src/app/api/membership-plans/route.ts`. These re-present membership
  in Next. Consolidation (point the static site at one source, or retire the Next public pages) is a
  separate, cross-repo decision per Â§7 ("duplicated surfaces").
- **`/api/membership-plans` Next API does not return `image_url`/`media_id`** (selects only scalar plan
  columns). If the Next `/membership` page is to show images, it must add `media_id` (or join
  `media_assets`) + resolve URLs â€” out of Phase 5A scope.
- **`[id]/route.ts` single-record media gap (F9)** â€” non-blocking; add `membership-plans` to its
  `MEDIA_RESOURCES` only if a single-plan admin view is later added.
- **Operational memberships** (`customer_memberships`, assign/renew/cancel via `MembershipHandler`) â€”
  admin-only lifecycle; not part of "simple public card â†’ modal."
- **`index_clean.html` parity** â€” candidate cleanup; not required by the requirement.
- **Nested duplicate repo `zt-lounge\zt-lounge-admin`** (F10) â€” resolve/remove before any admin-repo
  writes; do not edit under the nested path.

## 11. File-impact prediction (if FIXs 1â€“6 applied)

| File | Change | Risk | User-visible effect |
|---|---|---|---|
| `assets/js/membership-view.js` | field remap; image on card; teaser drops benefits; per-plan modal; CTA label | Low | Card name+badge+price now show; card shows plan image; benefits move to modal (complete); click card â†’ per-plan modal |
| `assets/js/repositories/MembershipRepository.js` | remove headline projection | Low (no consumer; no DB write) | none (headline was never rendered) |
| `assets/css/theme.css` | 2 append-only rules | None | plan image renders with 16/9 cover; modal image styled |
| `index.html`, `membership.config.js`, `content-loader.js` | **none** | â€” | mount attrs already correct; no edit needed |
| Admin repos | **none** | â€” | unchanged |

> Note (F12, AS-APPLIED): `membership-view.js` / `MembershipRepository.js` remain **untracked** (`??`)
> in this branch â€” `git diff` / `git diff --stat` will NOT surface them. `theme.css` is **tracked and modified**
> (` M`); its diff now contains the two appended `.zt-member-image` / `.zt-member-modal-image` rules on top
> of a pre-existing unrelated modification. Revert = `git checkout -- assets/css/theme.css` (tracked) +
> restore the two untracked JS files from backup. The repo working tree is otherwise heavily pre-existing-
> dirty (many unrelated `M`/`D`/`??`), so isolate the membership signal with path filters.

## 12. Validation plan (post-act)
1. `node --check` on edited `membership-view.js` + `MembershipRepository.js`.
2. JS-side: render `cardHTML` with a sample plan (`{name:'Gold',slug:'gold',annual_price,registration_fee,image_url,description,benefits:[{description}]}`) â†’ assert image src, title text, price, "View Benefits" CTA, no benefits on teaser.
3. Render `createModal(plan,â€¦)` â†’ assert modal title = "Gold Membership", image present, price + registration fee, benefits `<ul>` populated with `description` text, enquire CTA + contact links, close button present.
4. Visual regression spot-check against `.membership-modal*` / `.zt-member-*` CSS.
5. `git diff --stat` â€” expect only `assets/css/theme.css` (tracked `M`). The two `assets/js/*.js` edits are on
   **untracked** files and won't appear in `git diff`; verify them via direct read + `node --check`.
   No migration/admin/Next changes (scope guard).

## 13. Blocked / live caveats
- `[BLOCKED â€” LIVE DB UNAVAILABLE]`: no live Supabase query possible (DNS NXDOMAIN). All DB facts from
  `038`â€“`042` + `.temp/` scripts + `.select()` call-sites. The headline "production release will use the
  reviewed 039+041 squash" note in `041` means the **final** prod headline column is unresolved; the
  safe public assumption is **no headline column** (matches `mapPlan` defaulting it to null and matches
  removing it here).



## 14. Fixes Applied (as-executed)

Surgical set FIX 1â€“6 applied to the static public site only (`zt-lounge`, branch `feature/membership-tiers-staging-phase1`). No migrations, no admin code, no Next `/membership` page touched.

- **FIX 1 â€” field-name remap** (`membership-view.js`): `plan.plan_name` â†’ `plan.name`; `plan.tier_level` â†’ `plan.slug`; `b.benefit_text` â†’ `b.description`. The dead unstyled `.zt-member-badge` div was removed from `cardHTML`.
- **FIX 2 â€” card image** (`membership-view.js` `cardHTML`): teaser now renders `plan.image_url` (16/9 cover via new CSS). Benefits no longer rendered inline on the teaser â€” they moved to the modal.
- **FIX 3 â€” per-plan modal** (`membership-view.js` `createModal`/`openModal`): rewritten so each card opens a modal scoped to **that one plan** â€” name (title), image, annual price, registration fee, description, **complete** benefits list, enquire CTA (`fullModeCta`), WhatsApp (prefilled with the plan name) + phone + email, and a close button. `openModal(plan, â€¦)` now opens `createModal(plan, â€¦)` (was `createModal(plans, â€¦)`); mount trigger wired per-card: `openModal(visible[i], summary, business)`. Reuses existing `.membership-modal*` / `membership-modal-open` CSS; ESC (`handleEscape`) + overlay + scroll-lock (`overflow: hidden`) preserved.
- **FIX 4 â€” CTA label** (`membership-view.js`): "View More" â†’ "View Benefits".
- **FIX 5 â€” drop dead headline** (`MembershipRepository.js`): removed `headline_benefit_id` projection from `mapPlan` and the `headline_benefit` lookup block from `getPublicPlans`. No DB write; no consumer.
- **FIX 6 â€” image CSS** (`theme.css`): appended `.zt-member-image` (100% width, 16/9 aspect-ratio cover) + `.zt-member-modal-image` (full-width, rounded, spaced).

### As-executed verification
- `node --check assets/js/membership-view.js` â†’ exit 0.
- `node --check assets/js/repositories/MembershipRepository.js` â†’ exit 0.
- Codebase grep `plan_name|tier_level|benefit_text|headline_benefit` across both JS files â†’ **none** (field drift + dead headline eliminated).
- `Get-Content` length-scan: `createModal` body contiguous at correct 4/8/12-space indentation; `openModal(plan, â€¦)` calls `createModal(plan, â€¦)`; mount passes `visible[i]`; modal close/ESC path intact.

### Editor-tooling note
Intermediate substring edits left two cosmetic artifacts (over-indented `MembershipRepository.js` lines; extra blank lines in the rewritten `createModal`). Both were resolved with content-anchored regex (leading-whitespace normalization; blank-line collapse within `createModal` via a line-range splice) and re-verified with `node --check` + a `Get-Content` length scan. Final `createModal` is contiguous; both JS pass `node --check`.

### Rollback
`git checkout -- assets/css/theme.css` (tracked) and restore `assets/js/membership-view.js` + `assets/js/repositories/MembershipRepository.js` from backup (untracked in this branch).
