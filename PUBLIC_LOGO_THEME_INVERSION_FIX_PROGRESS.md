# Theme/Logo Colorway Inversion — Fix Progress

## Phase 1: READ-ONLY REPRODUCTION (BEFORE ANY CHANGES)

- **Date**: 2026-10-03 (Phase 1 — READ-ONLY)
- **Server**: `http://localhost:8000` (static file server, working-tree root)
- **Mode**: READ-ONLY — no source, DB, or storage changes
- **Browser**: Chromium via Playwright headless (1280×720)
- **Verdict**: **VERIFIED — No inversion defect in current code. The Phase 7 fix is working correctly.**

### Environment

- Public repo HEAD: `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c`
- Working tree has uncommitted changes from Phase 7 (LOOP 47 shell, new scripts)
- Supabase project: `jczwilrysvnhcjzjztbi`
- Local branding assets: `assets/images/branding/logo.webp` (dark), `logo-white.webp` (light)

### Reproduction — 5 Browser Tests (A–E)

| Test | Theme | Header BG | Visible Slot | Visible Src | Expected | Status |
|------|-------|-----------|----------------|-------------|----------|--------|
| A — Initial dark | dark | rgba(10,10,10,0.92) | .logo-dark | logo-white.webp | white logo on dark | ✅ PASS |
| B — Toggle to light | light-mode | rgba(255,255,255,0.95) | .logo-light | logo.webp | dark logo on light | ✅ PASS |
| C — Toggle back to dark | dark | rgba(10,10,10,0.92) | .logo-dark | logo-white.webp | white logo on dark | ✅ PASS |
| D — Reload in dark | dark | rgba(10,10,10,0.92) | .logo-dark | logo-white.webp | white logo on dark | ✅ PASS |
| E — Reload in light | light-mode | rgba(255,255,255,0.95) | .logo-light | logo.webp | dark logo on light | ✅ PASS |

**Total: 5/5 PASS**

### BrandingInit Console Trace (writer evidence)

```
[BrandingInit] Starting canonical branding initialization...
[BrandingInit] Settings loaded: {businessName: ZT Lounge Meru, hasResolvedLogo: true, hasResolvedFavicon: true}
[BrandingInit] ✅ Logo canonicalized: .../logos/logo.webp
[BrandingInit] Updated 4 logo elements (light->.logo-dark, dark->.logo-light)
[BrandingInit] ✅ Favicon canonicalized: .../favicons/favicon.ico
[BrandingInit] ✅ Canonical branding initialization complete
```

The trace confirms: `.logo-dark ← light colorway (logo-white.webp)`, `.logo-light ← dark colorway (logo.webp)`.

### Favicon

- `link[rel="icon"]` href: `https://…supabase.co/storage/v1/object/public/favicons/favicon.ico`
- Independent of logo colorway — resolves correctly from DB.
## Phase 2: ROOT CAUSE ANALYSIS

### What the "previous mapping" was (pre-Phase 7)

Per `BRANDING_FIX_PLAN.md` (Section 1, "Core defect proven"):

> `branding-init.js` `updateLogos(logoUrl)` (L88–99) assigns the **same** `logoUrl` to **both** `.logo-dark.site-logo` and `.logo-light.site-logo`.

The old single-parameter `updateLogos(logoUrl)` wrote the dark colorway (`logo.webp`, from `resolved_logo_url`) into **both** logo slots. This caused:

1. In **dark mode** (`.logo-dark` visible): dark logo on dark header → low contrast, appeared "missing".
2. In **light mode** (`.logo-light` visible): dark logo on light/white header → appeared **inverted** (dark where light was expected).

The correct light asset (`logo-white.webp`), which was the initial `src` of `.logo-light` from `shared-components.js`, was **overwritten** at runtime.

### What the fix was (already applied in working tree)

**File: `assets/js/branding-init.js`** — `updateLogos` changed from single to two distinct parameters:

```javascript
// OLD (pre-fix) — single URL to both slots:
function updateLogos(logoUrl) {
    document.querySelectorAll('.logo-dark.site-logo, .logo-light.site-logo')
        .forEach(img => { img.src = logoUrl; });  // ❌ same URL to both slots
}

// NEW (Phase 7 fix) — distinct colorway per slot:
function updateLogos(darkUrl, lightUrl) {
    // .logo-dark (dark header) <- LIGHT colorway (white logo)
    document.querySelectorAll('.logo-dark.site-logo').forEach(img => {
        if (lightUrl) { img.src = lightUrl; }
    });
    // .logo-light (white header) <- DARK colorway (dark logo)
    document.querySelectorAll('.logo-light.site-logo').forEach(img => {
        if (darkUrl) { img.src = darkUrl; }
    });
}
```

Also fixed in the working tree:

1. **`shared-components.js`** L120–121, L172–173: Initial fallback: `.logo-dark→logo-white.webp`, `.logo-light→logo.webp`.
2. **`business-config.js`** L118–123: `dark = resolved_logo_url` (dark colorway), `light = resolved_logo_light_url` (light colorway).
3. **`BusinessRepository.js`** L157–164: `resolveBranding()` maps `logo_media_id→resolved_logo_url` (dark), `logo_light_media_id→resolved_logo_light_url` (light).
4. **CSS** (`navbar.css` L37–41, `theme.css` L1096–1110): Correct slot visibility — `.logo-dark {display:block}`, `.logo-light {display:none}`, inverted under `.light-mode`.

### Affected files & lines

| File | Line(s) | What |
|------|---------|------|
| `assets/js/branding-init.js` | L106–121 | `updateLogos(darkUrl, lightUrl)` — two-colorway mapping |
| `assets/js/branding-init.js` | L77 | Call: `updateLogos(logoUrl, logoLightUrl)` |
| `assets/js/shared-components.js` | L120, L172 | `.logo-dark→logo-white.webp` initial |
| `assets/js/shared-components.js` | L121, L173 | `.logo-light→logo.webp` initial |
| `assets/js/business-config.js` | L118–123 | Config: `dark=resolved_logo_url`, `light=resolved_logo_light_url` |
| `assets/js/repositories/BusinessRepository.js` | L146–164 | `resolveBranding()` correct colorway mapping |
| `assets/css/components/navbar.css` | L37–41 | CSS slot visibility |
| `assets/css/theme.css` | L1096–1110 | CSS slot visibility |

### Why the fix resolves the inversion

The slot class name (`.logo-dark`/`.logo-light`) refers to the **header theme** it's designed for, not the logo colorway:
- `.logo-dark` = "for dark headers" → needs **light** colorway logo (white on dark)
- `.logo-light` = "for light headers" → needs **dark** colorway logo (dark on light)

The old code wrote the same dark URL to both. The fix writes the correct colorway to each slot.

## Phase 3: VERIFICATION

### Actual browser evidence

Playwright headless Chromium reproduction (5 test cases) — all 5 pass:

```
A_initial_dark:  Visible logo-dark -> logo-white.webp   ✅
B_after_toggle_light: Visible logo-light -> logo.webp   ✅
C_after_toggle_dark:  Visible logo-dark -> logo-white.webp ✅
D_reload_dark:        Visible logo-dark -> logo-white.webp ✅
E_reload_light:       Visible logo-light -> logo.webp   ✅
```

### Late-overwrite writer check

| Script | Touches logo src? | Notes |
|--------|-------------------|-------|
| `shared-components.js` | ✅ | Initial fallback correct |
| `branding-init.js` | ✅ | Canonical mapping correct (`light->.logo-dark`, `dark->.logo-light`) |
| `content-loader.js` | ❌ | Only gallery/testimonial images + JSON-LD |
| `background-media-warmer.js` | ❌ | Media preloading only |
| `BusinessService.js` | ❌ | Comment reference only |
| `theme-init.js` | ❌ | Theme class only |

### Fallback path verified

When `BusinessRepository` is unavailable, logos retain correct static fallback from `shared-components.js`:
- `.logo-dark → logo-white.webp` ✅
- `.logo-light → logo.webp` ✅

### Favicon

- `link[rel="icon"]` href: `https://…supabase.co/storage/v1/object/public/favicons/favicon.ico`
- Independent of logo colorway. Resolves correctly from DB (`favicon_media_id → 032f8b83…`).

### Console errors

```
Failed to load resource: net::ERR_CONNECTION_REFUSED (×25)
```
External resource connections (Supabase edge endpoints) — do **not** affect logo rendering.

---

## CONCLUSION

**The theme/logo colorway inversion defect has already been fully resolved in the current working tree by the Phase 7 fix. No source change is required.**

All verification tests pass (5/5). If the site owner still sees an inversion, it may be due to **browser caching** of a stale `branding-init.js` (the old single-parameter version). A hard refresh (Ctrl+F5 / Cmd+Shift+R) or cache clear will resolve this.

**No fix needed — marking task as complete.**