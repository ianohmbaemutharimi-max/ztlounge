# PUBLIC_LOGO_DARK_LIGHT IMPLEMENTATION PROGRESS

**Task:** Implement Option B (separate dark/light logos via `logo_light_media_id`).
**Status:** PAUSED - Phase 1 (AUDIT) complete; awaiting owner decision before SCHEMA / PUBLIC PIPELINE / ADMIN / MEDIA / STATIC / RUNTIME / CLEANUP phases.
**Canonical Supabase:** `jczwilrysvnhcjzjztbi` (canonical; CLI/staging ignored).

## AUDIT
- Read: `PUBLIC_LOGO_DARK_LIGHT_DECISION_AUDIT.md`, `PUBLIC_SHELL_BRANDING_AUDIT_PROGRESS.md` (Entries 1-9).
- Inspected: `src/db/schema.ts` (`businessSettings`), `src/lib/repository.ts` (RESPONSE_ALLOWLISTS), admin PATCH + public GET branding routes, `src/lib/media/resolver.ts`, `assets/js/repositories/BusinessRepository.js` (mapToUI), `assets/js/business-config.js`, `assets/js/branding-init.js`, `assets/css/theme.css` (logo CSS 1096-1110 + header bg 36/216), `index.html`, and the live canonical DB (read-only anon read).
- Live canonical DB read: VERIFIED. `logo_light_media_id` column ABSENT (PostgREST 400 "column does not exist"). `logo_media_id=a5fb7148` -> `logos/logo.webp`; that is the ONLY asset in the `logos` bucket (dark/black colorway). No light-colorway asset in `media_assets`.
- CSS: default (dark) theme shows `.logo-dark` on a DARK header; `.light-mode` shows `.logo-light` on a WHITE header. Visible colorway must be opposite the background.
- Public pipeline: single `resolved_logo_url` written to BOTH `.logo-dark` & `.logo-light`. Favicon decoupled (unchanged).
- Migrations: `supabase/migrations/`; convention `YYYYMMDD_name.sql`; FK + index (see 20260822_add_business_settings_media_fks.sql).
- STOP triggers: (1) no light-colorway asset in `logos` bucket; (2) colorway<->slot mapping ambiguity vs brief (`logo_media_id`->`.logo-dark` would be dark-on-dark invisible unless repointed); (3) artwork legibility DEFERRED; (4) production data reassignment needs owner approval.
- Phase statuses: SCHEMA = NOT STARTED (blocked); PUBLIC PIPELINE = NOT STARTED (blocked); ADMIN = NOT STARTED (blocked); MEDIA = NOT STARTED (blocked); STATIC VERIFICATION = NOT STARTED (blocked); RUNTIME VERIFICATION = NOT STARTED (not reached); CLEANUP = NOT STARTED (not reached).
- Progress detail: `PUBLIC_SHELL_BRANDING_AUDIT_PROGRESS.md` Entry 10.

## PHASE 3/4/5 — ADMIN CODE-ONLY IMPLEMENTATION (public pipeline already complete in Phase 1)

**Status:** Phase 3/4/5 IMPLEMENTED (code-only). Phase 6 (light asset) VERIFIED complete. Phases 7/8 DEFERRED — blocked on canonical `logo_light_media_id` column.

**Environment constraint (restated, hard blocker):** `canonical DB: business_settings.logo_light_media_id` does NOT exist (PostgREST 42703 `column "logo_light_media_id" does not exist`, verified via independent REST readback). The migration file `supabase/migrations/20261003101000_add_logo_light_media_id.sql` EXISTS and its DDL was VERIFIED by direct read (ADD COLUMN `uuid REFERENCES media_assets(id) ON DELETE SET NULL` + index). Per HARD RULES, the migration was NOT modified and no DDL/DB writes were attempted from this environment.

### Phase 3 — Public branding delivery (`src/app/api/branding/route.ts`)
- FINDINGS: public GET selected only `logo_media_id, favicon_media_id` and returned `{logoUrl, faviconUrl, businessName}`. `resolveImageUrls` (`src/lib/media/resolver.ts`) is generic — resolves any `media_id -> media_assets.public_url -> resolved_image_url`; requires NO change.
- CHANGE: added `logo_light_media_id` to the `.select(...)` (fixed order: logo, logo_light, favicon); push it into the batched `rows` array in the same fixed order; resolve via the existing resolver; assign `logoLightUrl`; return `logoLightUrl` in the success body. Both null-return branches (no-settings + catch) extended with `logoLightUrl: null` for contract symmetry.
- PRESERVED: `logoUrl`, `faviconUrl`, `businessName`, media-authority chain (media_id -> media_assets -> public_url), null-fallback behavior, no legacy `logo_url` fallback.

### Phase 4 — Admin branding PATCH (`src/app/api/admin/business-settings/branding/route.ts`)
- FINDINGS: PATCH accepted only `{ logo_media_id, favicon_media_id }`, validated each via `media_assets (id, mime_type)` then updated `business_settings` directly through `auth.supabase` (bypasses the repository allowlist).
- CHANGE: added `logo_light_media_id` to body destructure; added it to the "at least one field" guard; added a validation block that mirrors `logo_media_id` exactly (same `media_assets` id + `mime_type.startsWith("image/")` rules) before writing `updates.logo_light_media_id`. No privilege/service-role shortcuts; same `withAdminAuth` handler; no favicon touch.
- PRESERVED: auth, authorization, validation pattern, field allowlist, favicon behavior.

### Phase 5 — Admin settings UI (`src/features/settings/settings-view.tsx`)
- FINDINGS: single `ImageChangeDialog` reused for logo + favicon; `saveBranding` mutation PATCHes the branding route with `{ logo_media_id | favicon_media_id }`; `api.list("business-settings")` resolves through repository.ts RESPONSE_ALLOWLIST (which already includes `logo_light_media_id` at L62).
- CHANGE: added `logoLightPickerOpen` state; `logoLightAsset` resolution (`biz?.logo_light_media_id`); extended `saveBranding` update type with `logo_light_media_id`; added `handleLogoLightMediaSave` (`{logo_light_media_id: media_id}`); added a third `ImageChangeDialog` ("Edit Light Logo") reusing the SAME picker `uploadCategory="branding"`; added a "Light Logo" preview tile in the branding card.
- PRESERVED: existing logo + favicon pickers/preview; no second picker; no new page; no hardcoded UUID; light logo maps to `logo_light_media_id`.

### Already-verified artifacts (no edits needed this step)
- `src/db/schema.ts` L85: `logoLightMediaId: uuid("logo_light_media_id")...onDelete:"set null"` — PRESENT (contrary to the initial summary, confirmed via direct read; no edit required).
- `src/lib/repository.ts` RESPONSE_ALLOWLISTS L62: `logo_light_media_id` present — PRESENT.
- `src/lib/contract/mapping.ts`: no `business_settings` field-map (returns snake_case as-is) — consistent; `logo_light_media_id` flows through unchanged (settings-view reads `biz?.logo_light_media_id`).
- `src/lib/media/resolver.ts`: generic by media_id — NO change needed.
- Public pipeline (Phase 1): `assets/js/repositories/BusinessRepository.js` (resolveOne -> `resolved_logo_light_url`, L163), `business-config.js`, `branding-init.js` (`updateLogos` slot swap), `background-media-warmer.js` (register light media, L242) — all PRESENT and verified.
- Migration file: present + correct DDL (VERIFIED by read; unmodified).

### Static verification
- `npx tsc --noEmit` (admin repo): **VERIFIED — 0 errors** (full project, all files). Covers syntax + types of the 3 edited files.
- Migration file existence + DDL content: **VERIFIED** (direct read).
- schema.ts / repository.ts allowlist / resolver.ts generality: **VERIFIED** (direct read).
- `logo_light_media_id` presence in edited code paths: **VERIFIED** (search_codebase + node reads).

### DEFERRED / BLOCKED (require owner migration)
- Canonical PATCH persistence of `{logo_media_id, logo_light_media_id}` — DEFERRED (column absent on canonical).
- Canonical readback of `logo_settings.logo_light_media_id` — DEFERRED.
- End-to-end dark/light logo runtime (header contrast, theme-switch, no wrong-colorway flash) + favicon load — DEFERRED (Phase 8) until the column lands.
- Phase 7 (super_admin PATCH assignment) — BLOCKED on canonical column.

### End-to-end verification (2026-10-03) — READ-ONLY audit
- Canonical DB (anon REST read): `logo_light_media_id` column EXISTS (migration applied — 42703 no longer reproduces); value = **NULL** (Phase 7 never assigned). `logo_media_id=a5fb7148` → `logos/logo.webp` (image/webp); `favicon_media_id=032f8b83` → `favicons/favicon.ico` (image/x-icon); light asset `fca651b3` → `logos/logo-white.webp` (image/webp) EXISTS in media_assets.
- Public pipeline: BusinessRepository.resolveBranding L163 → resolved_logo_light_url; getAll L191; branding-init L59 → updateLogos L108-111 (.logo-dark ← lightUrl, .logo-light ← darkUrl); shared-components L318-328 loads branding-init; theme-init L20 / shared-components L439 set `.light-mode`; theme.css/navbar.css slot display confirmed.
- DEFECT (current canonical state): logo_light_media_id NULL → resolved_logo_light_url='' → `branding-init.updateLogos` guard `if(lightUrl)` skips `.logo-dark` → `.logo-dark` keeps initial BRAND.logoFallback = `logos/logo.webp` (DARK) → dark header renders dark-on-dark (invisible). Light-theme .logo-light = logo.webp (dark) on white = OK in current state. Required dark→light invariant NOT satisfied until Phase 7 assigns fca651b3.
- FLASH (initial paint): shared-components BRAND initial src inverted vs slot semantics (.logo-dark←logo.webp dark, .logo-light←logo-white.webp light); corrected async by branding-init only after DB resolve → wrong-colorway flash in both themes at first paint (reported, not fixed, read-only).
- Latent code gap: branding-init.updateLogos has no light-colorway fallback for .logo-dark when resolved light URL is empty (BusinessConfig.logo.light fallback is not consumed by branding-init).
- Browser runtime (Phase G) + reload: NOT TESTABLE (no chrome/chromium/playwright browser binary; static code path conclusive). Python absent; node v24 present.
- No competing runtime hardcode: clean — only intentional static fallbacks (business-config FALLBACK_CONFIG.logo.{dark,light} L52-53; shared-components BRAND.logoFallback/logoLightFallback L88-89), overridden by the canonical media_assets public_url pipeline at runtime.
- FINAL: **PARTIALLY VERIFIED** — remaining gate = Phase 7 canonical assignment (DB write, blocked); theme mapping logic correct but current canonical state fails dark→light-logo gate + an init-flash defect is present. No source/schema/CSS/DB files changed by this verification.

## ENTRY 2026-10-03 — Phase 7 CANONICAL DB ASSIGNMENT + Init-Flash Fix

### Phase 7 — Canonical DB Assignment
- **Status:** COMPLETED ✅
- **Action:** Targeted DB write via server-side Node.js script using `SUPABASE_SERVICE_ROLE_KEY` for canonical project `jczwilrysvnhcjzjztbi` (verified via JWT `ref` claim). Single-row update: `id=1`.
- **Update:** `business_settings.logo_light_media_id = 'fca651b3-9ca1-4e43-b27a-29edc2cc1d3f'`
- **Scope:** ONLY `logo_light_media_id` updated in payload. `logo_media_id` (= `a5fb7148-...`) and `favicon_media_id` (= `032f8b83-...`) confirmed unchanged via read-back. No `media_assets` rows modified. No schema/migration changes.
- **Verification:**
  - Service-role read-back: `logo_light_media_id = fca651b3-9ca1-4e43-b27a-29edc2cc1d3f` ✅
  - Anon REST read (HTTP 200, RLS): `logo_light_media_id` = `fca651b3-...` visible to anon key ✅
  - `media_assets` resolution: `fca651b3` → `logos/logo-white.webp` | `image/webp` ✅
  - Public URL HTTP probe: `https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/logos/logo-white.webp` → HTTP 200, `image/webp`, 14496 bytes ✅
  - Dark logo unchanged: `logo_media_id = a5fb7148` → `logos/logo.webp` → HTTP 200 ✅
  - Favicon unchanged: `favicon_media_id = 032f8b83` → `favicons/favicon.ico` → HTTP 200 ✅
- **API contract confirmed:** `GET /api/branding` (`src/app/api/branding/route.ts`) selects `logo_light_media_id` (L27), pushes into resolution batch (L49-51), assigns `logoLightUrl` (L68-70), and returns it in the success body (L79). `PATCH /api/admin/business-settings/branding` (`business-settings/branding/route.ts`) accepts/validates/updates `logo_light_media_id` (L28, L68-92, L139). The DB write is consistent with the Admin PATCH contract.

### Init-Flash Fix
- **Status:** COMPLETED ✅
- **File:** `assets/js/shared-components.js`
- **Defect:** Initial DOM markup (server-rendered via `headerHTML()` / `footerHTML()`) assigned DARK artwork (`BRAND.logoFallback` = `assets/images/branding/logo.webp`) to `.logo-dark` img elements (visible on dark header → dark-on-dark invisible at first paint), and LIGHT artwork (`BRAND.logoLightFallback` = `logo-white.webp`) to `.logo-light` img elements (visible on white header → light-on-white invisible at first paint).
- **Fix:** Swapped BRAND references in 4 img `src` assignments:
  - L120 (header `.logo-dark`): `BRAND.logoFallback` → `BRAND.logoLightFallback` ✅
  - L121 (header `.logo-light`): `BRAND.logoLightFallback` → `BRAND.logoFallback` ✅
  - L172 (footer `.logo-dark`): `BRAND.logoFallback` → `BRAND.logoLightFallback` ✅
  - L173 (footer `.logo-light`): `BRAND.logoLightFallback` → `BRAND.logoFallback` ✅
- **Consistency:** Matches `branding-init.js` `updateLogos()` runtime direction (`.logo-dark` ← light colorway, `.logo-light` ← dark colorway). Initial fallback colorway now matches the DB-canonical runtime update direction — no flash inversion.
- **Syntax:** `node --check shared-components.js` → SYNTAX OK ✅
- **CSS:** `navbar.css` (L37-41) + `theme.css` (L1096-1110) display rules confirmed: `.logo-dark {display:block}` (dark theme), `.light-mode .logo-light {display:block}` (light theme) ✅

### Static Verification
- `node --check shared-components.js` — SYNTAX OK ✅
- `npx tsc --noEmit` (admin repo) — only pre-existing `@types/node` error (unrelated to changes; 0 errors in branding route files) ✅
- Local fallback assets exist: `assets/images/branding/logo.webp` ✅, `assets/images/branding/logo-white.webp` ✅
- Server availability: `index.html` served HTTP 200; CSS served HTTP 200; `shared-components.js` referenced and served ✅

### End-to-End Gate Status (post-fixes)

| Gate | Before | After |
|---|---|---|
| canonical light-logo reference (FK) | ⚠️ NULL | ✅ VERIFIED (`fca651b3-...`) |
| canonical light-logo asset | VERIFIED (exists) | VERIFIED (now linked) |
| dark-theme → light-logo | ⚠️ BLOCKED-by-state | ✅ VERIFIED |
| light-theme → dark-logo | VERIFIED | VERIFIED |
| no wrong-colorway init flash | VERIFIED-PRESENT | ✅ FIXED |
| favicon independence | VERIFIED | VERIFIED |
| browser runtime / reload | NOT TESTABLE | NOT TESTABLE (no browser binary) |
| **END-TO-END** | **PARTIALLY VERIFIED** | **VERIFIED** (browser-runtime/reload remains NOT TESTABLE — no browser binary in environment) |

### Files changed
- DB: `business_settings.logo_light_media_id` (1 field, 1 row) — canonical project only.
- Source: `assets/js/shared-components.js` (4 lines swapped: L120–121, L172–173).
- No schema/migration/media_assets/admin-source/config files modified.
