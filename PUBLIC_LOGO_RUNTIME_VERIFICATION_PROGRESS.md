# Phase 8 — Runtime Logo Verification Progress

## Environment

- **Date**: 2026-10-03T17:30:52.696Z
- **Server**: http://localhost:8000 (static file server)
- **Browser**: Chromium 1234 (Playwright headless)
- **Supabase Project**: jczwilrysvnhcjzjztbi

## Baseline Findings

- Local fallback assets exist: logo.webp, logo-white.webp, favicon.ico
- Playwright + Chromium installed in admin repo
- Script order: supabase-js -> env.js -> supabase.config.js -> lib/supabase.js -> business-config.js -> BusinessRepository.js -> branding-init.js -> content-loader.js
- shared-components.js fix verified served: .logo-dark->logoLightFallback, .logo-light->logoFallback

## Expected Canonical DB State

| Field | Expected | Actual (runtime) |
| logo_media_id | a5fb7148-...323 | resolved_logo_url=logo.webp |
| logo_light_media_id | fca651b3-...1d3f | fca651b3-9ca1-4e43-b27a-29edc2cc1d3f |
| favicon_media_id | 032f8b83-...1bd3 | resolved_favicon_url=favicon.ico |

## Dark Theme DOM Evidence (Initial Load)

```
logo-dark site-logo [VISIBLE] src=.../logos/logo-white.webp display=block
logo-light site-logo [HIDDEN] src=.../logos/logo.webp display=none
logo-dark site-logo [VISIBLE] src=.../logos/logo-white.webp display=block (footer)
logo-light site-logo [HIDDEN] src=.../logos/logo.webp display=none (footer)
htmlClass="" (dark mode)
```
**PASS** — Dark header shows white/light logo

## Light Theme DOM Evidence (After Toggle)

```
logo-dark site-logo [HIDDEN] src=.../logos/logo-white.webp display=none
logo-light site-logo [VISIBLE] src=.../logos/logo.webp display=block
logo-dark site-logo [HIDDEN] src=.../logos/logo-white.webp display=none (footer)
logo-light site-logo [VISIBLE] src=.../logos/logo.webp display=block (footer)
htmlClass="light-mode"
```
**PASS** — Light header shows dark logo

## Theme Switch Evidence
- Dark->Light: logo-white->logo.webp ✅
- Light->Dark: logo.webp->logo-white ✅
- No errors, no duplicates ✅

## Reload Evidence
- Reload dark: .logo-dark visible with logo-white.webp ✅
- Reload light: .logo-light visible with logo.webp ✅
- branding-init.js runs on each reload ✅

## Network/Cache Evidence
All HTTP 200: shared-components.js, branding-init.js, business-config.js, supabase.js, logo.webp, logo-white.webp, CDN logos
Served shared-components.js has init-flash fix ✅

## Writer Trace

```
[BrandingInit] Starting canonical branding initialization...
[BrandingInit] Settings loaded: {hasResolvedLogo: true, hasResolvedFavicon: true}
[BrandingInit] Updated 4 logo elements (light->.logo-dark, dark->.logo-light)
[BrandingInit] ✅ Logo canonicalized: .../logos/logo.webp
[BrandingInit] ✅ Favicon canonicalized: .../favicons/favicon.ico
```

```json
{
  supabaseClient: true, getAllError: null,
  logo_light_media_id: "fca651b3-9ca1-4e43-b27a-29edc2cc1d3f",
  resolved_logo_light_url: ".../logos/logo-white.webp",
  resolved_favicon_url: ".../favicons/favicon.ico"
}
```

Writer sequence:
1. shared-components.js injects .logo-dark->local logo-white.webp, .logo-light->local logo.webp
2. Supabase client created with anon key
3. BusinessRepository.getAll() returns logo_light_media_id=fca651b3-...
4. resolveBranding() resolves media_id->media_assets->logo-white.webp
5. branding-init.js updateLogos(): .logo-dark->logo-white.webp, .logo-light->logo.webp
6. No overwriting script ✅

## Favicon Evidence
- resolved_favicon_url = .../favicons/favicon.ico ✅
- Independent of logo switching ✅

## Root Cause

**NONE** — No defect found. The Phase 7 fix is fully working at runtime.
The black/dark logo issue is RESOLVED:
1. DB logo_light_media_id=fca651b3-... (was NULL) ✅
2. Init markup: .logo-dark->logo-white.webp ✅
3. Runtime branding-init.js correct ✅
4. CSS display rules correct ✅
5. No overwriting script ✅

## Fix Required: NONE

## Remaining Blockers: NONE

## Final Verdict

**STATUS: VERIFIED**

- DARK: visible logo = logo-white.webp on dark header ✅
- LIGHT: visible logo = logo.webp on light header ✅
- SWITCH Dark->Light: white->dark ✅
- SWITCH Light->Dark: dark->white ✅
- RELOAD: both states retain correct logo ✅
- FAVICON: favicon.ico, independent ✅

## Files Changed
- PUBLIC_LOGO_RUNTIME_VERIFICATION_PROGRESS.md (created — this report)
- scripts/phase8-runtime-test.js (verification tooling — Playwright browser test)
- scripts/phase8-baseline-check.js (baseline utility — git/Playwright environment check)

## DB Changes: NONE

## Detailed DOM Evidence

Dark (initial): .logo-dark[VISIBLE] logo-white.webp | .logo-light[HIDDEN] logo.webp
Light (after toggle): .logo-dark[HIDDEN] logo-white.webp | .logo-light[VISIBLE] logo.webp
Both header and footer logo slots correct (4 elements total).
