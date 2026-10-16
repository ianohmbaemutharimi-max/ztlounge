# PUBLIC_LOGO_THEME_MAPPING_REVIEW — Progress Log

**Task mode:** AUDIT ONLY (read-only, no edits/writes/schema).
**Canonical map under review:** DARK → `.logo-dark` → `logo.webp` ; LIGHT → `.logo-light` → `logo-white.webp`

## Phase 1 — BASELINE (recorded before investigation)

| Item | Value |
|---|---|
| Git branch | `feature/membership-tiers-staging-phase1` |
| HEAD | `d183ddab7399429f3c334c4d288d6b0988a78f89` |
| Dirty/untracked file count (`git status --porcelain`) | 314 |
| Public server `http://localhost:8000` | HTTP 200 — "ZT Lounge Meru - Premium Dining, VIP Cabins, Auto Spa & Events" (available) |
| Canonical Supabase project | `jczwilrysvnhcjzjztbi` — confirmed in `assets/js/config/env.js` (anon-role) AND reachable via PostgREST REST `https://jczwilrysvnhcjzjztbi.supabase.co/rest/v1` |

**Status:** baseline confirmed; server up; canonical DB reachable read-only via PostgREST (anon key).

## Phase 2 — STATIC SOURCE TRACE (complete)
- CSS visibility (`theme.css:1096-1110`, `navbar.css:37-42`): dark→`.logo-dark` block; `.light-mode`→`.logo-light` block. Correct.
- Initial HTML (`shared-components.js` headerHTML L120-121, footerHTML L172-173): `.logo-dark`←`logoLightFallback`(logo-white.webp), `.logo-light`←`logoFallback`(logo.webp). **Inverted.**
- `branding-init.js updateLogos()` (L106-121) calls `updateLogos(logoUrl, logoLightUrl)` → `.logo-dark`←`lightUrl`, `.logo-light`←`darkUrl`. **Inverted (final runtime authority).** DB chain correct; only two src writers exist.

## Phase 3 — DATABASE / MEDIA TRACE (complete)
Canonical project `jczwilrysvnhcjzjztbi` reachable read-only via PostgREST (anon key from env.js).
- business_settings: `logo_media_id=a5fb7148-…`, `logo_light_media_id=fca651b3…`, legacy `logo_url=…/logos/logo.webp`.
- resolve `a5fb7148` → media_assets: bucket=`logos`, path=`logo.webp`, public_url=`…/logos/logo.webp` → **logo.webp (DARK, L=0.035)**.
- resolve `fca651b3` → media_assets: bucket=`logos`, path=`logo-white.webp`, public_url=`…/logos/logo-white.webp` → **logo-white.webp (LIGHT, L=0.958)**.
- BusinessRepository.resolveMediaId selects `public_url` by `id` (L86-116); resolveBranding (L146-166) maps logo_media_id→resolved_logo_url, logo_light_media_id→resolved_logo_light_url. Chain **correct**.

## Phase 4 — BROWSER VERIFICATION (complete; system Chrome via Playwright)
- DARK (initial/default): `.logo-dark` visible → currentSrc `…/logos/logo-white.webp`. MISMATCH (expected logo.webp).
- LIGHT (toggle, saved=light): `.logo-light` visible → currentSrc `…/logos/logo.webp`. MISMATCH (expected logo-white.webp).
- toggle back DARK, reload (persisted dark): `.logo-dark`→logo-white.webp. Theme + logo persist across reload.
- Mobile 375×812: dark, `.logo-dark`→logo-white.webp (matches desktop).
- Toggle changes actual visible `currentSrc`, not just CSS class. Header & footer agree.
- Errors/404s: no logo/branding 404. One unrelated `GET /favicon.ico` 404 (pre-shell preflight). Console: no page errors; branding-init logged "Updated 4 logo elements (light->.logo-dark, dark->.logo-light)".
- Served `shared-components.js` on disk matches served file (logoLightFallback→.logo-dark, logoFallback→.logo-light confirmed live).

## Phase 5 — CONFLICT ANALYSIS (complete)
Final runtime authority = `branding-init.js updateLogos()` (L106-121). Earliest static = `shared-components.js` L120-121/L172-173. DB layer correct. Result: **MISMATCH FOUND**.

## Phase 6 — REPORT
Final report: `PUBLIC_LOGO_THEME_MAPPING_REVIEW.md`.
**Executive status: MISMATCH FOUND.** Temp `%TEMP%` probes deleted; no repo source/DB/Storage/schema changes.

