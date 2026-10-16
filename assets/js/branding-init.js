/**
 * ============================================================
 * ZT Lounge Meru - Canonical Branding Initializer
 * Version: 1.1.0
 * ============================================================
 *
 * Purpose: Replace hardcoded Storage URLs with canonical CMS-driven branding
 *
 * Flow:
 * 1. Query business_settings - logo_media_id, favicon_media_id
 * 2. Resolve media_ids - media_assets.public_url
 * 3. Inject canonical URLs into DOM
 * 4. Maintain graceful fallback if database unavailable
 *
 * Contract:
 * - Logo (dark): .logo-dark.site-logo
 * - Logo (light): .logo-light.site-logo
 * - Favicon: link[rel="icon"]
 * - Apple touch: link[rel="apple-touch-icon"]
 * - OG image: meta[property="og:image"]
 * - JSON-LD: script[type="application/ld+json"]
 * ============================================================
 */

(function() {
    'use strict';

    /**
     * Initialize canonical branding from business_settings - media_assets
     */
    async function initCanonicalBranding() {
        console.log('[BrandingInit] Starting canonical branding initialization...');

        try {
            // Require BusinessRepository
            if (!window.BusinessRepository) {
                console.warn('[BrandingInit] BusinessRepository not available - using static fallback');
                return;
            }

            // Fetch canonical business settings
            const settings = await window.BusinessRepository.getAll();

            if (!settings) {
                console.warn('[BrandingInit] No business settings found - using static fallback');
                return;
            }

            console.log('[BrandingInit] Settings loaded:', {
                businessName: settings.business_name,
                hasResolvedLogo: !!settings.resolved_logo_url,
                hasResolvedFavicon: !!settings.resolved_favicon_url
            });

            // Extract resolved branding URLs.
            // resolved_logo_url       = DARK colorway  (logo_media_id      -> logo.webp)   -> .logo-dark (dark header)
            // resolved_logo_light_url  = LIGHT colorway (logo_light_media_id -> logo-white.webp) -> .logo-light (light header)
            const logoUrl = settings.resolved_logo_url;
            const logoLightUrl = settings.resolved_logo_light_url;
            const faviconUrl = settings.resolved_favicon_url;

            // OG/Twitter/JSON-LD are theme-agnostic social cards (white bg) and
            // stay logo-driven (dark colorway). Only the header/footer slots need
            // distinct per-theme colorways.
            if (logoUrl) {
                updateOGImage(logoUrl);
                updateJSONLD(logoUrl);
                console.log('[BrandingInit] ✅ Logo canonicalized:', logoUrl);
            } else {
                console.warn('[BrandingInit] Logo URL not resolved - keeping fallback');
            }

            // Fan distinct colorways to the correct CSS slots. CSS display is
            // authoritative: .logo-dark  lives on the dark header  (dark colorway  -> logo.webp)
            // and .logo-light on the light/white header (light colorway -> logo-white.webp).
            if (logoUrl || logoLightUrl) {
                updateLogos(logoUrl, logoLightUrl);
            }

            if (faviconUrl) {
                updateFavicon(faviconUrl);
                console.log('[BrandingInit] ✅ Favicon canonicalized:', faviconUrl);
            } else {
                console.warn('[BrandingInit] Favicon URL not resolved - keeping fallback');
            }

            console.log('[BrandingInit] ✅ Canonical branding initialization complete');

        } catch (error) {
            console.error('[BrandingInit] Failed to load canonical branding:', error.message);
            console.warn('[BrandingInit] Using static fallback branding');
        }
    }

    /**
     * Update logo images (header + footer). CSS slot visibility is authoritative:
     *   - .logo-dark  is visible on a DARK header -> render DARK colorway (logo.webp)
     *   - .logo-light is visible on a LIGHT header -> render LIGHT colorway (logo-white.webp)
     * darkUrl  = dark colorway  (logo_media_id      -> logo.webp)
     * lightUrl = light colorway (logo_light_media_id -> logo-white.webp)

     * @param {string} darkUrl  - Dark colorway URL  (header/footer .logo-dark slot)
     * @param {string} lightUrl - Light colorway URL (header/footer .logo-light slot)
     */
    function updateLogos(darkUrl, lightUrl) {
        // .logo-dark (dark header) <- dark colorway (darkUrl -> logo.webp)
        var darkThemeLogos = document.querySelectorAll('.logo-dark.site-logo');
        darkThemeLogos.forEach(function(img) {
            if (darkUrl) { img.src = darkUrl; }
        });

        // .logo-light (light/white header) <- light colorway (lightUrl -> logo-white.webp)
        var lightThemeLogos = document.querySelectorAll('.logo-light.site-logo');
        lightThemeLogos.forEach(function(img) {
            if (lightUrl) { img.src = lightUrl; }
        });

        console.log('[BrandingInit] Updated', darkThemeLogos.length + lightThemeLogos.length,
            'logo elements (dark->.logo-dark, light->.logo-light)');
    }

    /**
     * Update favicon
     * @param {string} faviconUrl - Canonical favicon URL
     */
    function updateFavicon(faviconUrl) {
        // SOLE AUTHORITY for <link rel="icon">. The shell no longer seeds a
        // favicon link, so create it here from the canonical DB favicon URL.
        let faviconLink = document.querySelector('link[rel="icon"]');
        if (!faviconLink) {
            faviconLink = document.createElement('link');
            faviconLink.setAttribute('rel', 'icon');
            document.head.appendChild(faviconLink);
        }
        faviconLink.setAttribute('href', faviconUrl);
        faviconLink.setAttribute('type', 'image/x-icon');

        // Phase 5: apple-touch-icon is intentionally NOT coupled here. It is
        // managed independently (shared-components.js boot fallback) and must
        // never receive the .ico payload (HARD RULE 2).

        console.log('[BrandingInit] ✅ Favicon canonicalized:', faviconUrl);
    }

    /**
     * Update Open Graph image meta tag
     * @param {string} logoUrl - Canonical logo URL
     */
    function updateOGImage(logoUrl) {
        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage) {
            ogImage.setAttribute('content', logoUrl);
        }

        const twitterImage = document.querySelector('meta[name="twitter:image"]');
        if (twitterImage) {
            twitterImage.setAttribute('content', logoUrl);
        }

        console.log('[BrandingInit] Updated OG/Twitter image meta tags');
    }

    /**
     * Update JSON-LD structured data logo
     * @param {string} logoUrl - Canonical logo URL
     */
    function updateJSONLD(logoUrl) {
        const jsonLDScript = document.querySelector('script[type="application/ld+json"]');
        if (!jsonLDScript) return;

        try {
            const structuredData = JSON.parse(jsonLDScript.textContent);
            if (structuredData.image !== undefined) {
                structuredData.image = logoUrl;
                jsonLDScript.textContent = JSON.stringify(structuredData, null, 2);
                console.log('[BrandingInit] Updated JSON-LD structured data');
            }
        } catch (error) {
            console.warn('[BrandingInit] Failed to update JSON-LD:', error.message);
        }
    }

    // Initialize when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCanonicalBranding);
    } else {
        initCanonicalBranding();
    }

})();
