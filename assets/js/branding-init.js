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
 * 4. Show an explicit missing-media state if canonical branding cannot be resolved
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
                console.warn('[BrandingInit] BusinessRepository unavailable; clearing static branding');
                clearBranding();
                return;
            }

            // Fetch canonical business settings
            const settings = await window.BusinessRepository.getAll();

            if (!settings) {
                console.warn('[BrandingInit] No business settings found; clearing static branding');
                clearBranding();
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
            // Always update every slot. Missing/invalid canonical media must not
            // leave a hard-coded image from the HTML or shared header.
            updateLogos(logoUrl, logoLightUrl);
            if (logoUrl) {
                updateOGImage(logoUrl);
                updateJSONLD(logoUrl);
                console.log('[BrandingInit] Canonical logo resolved');
            } else {
                clearOGImage();
                clearJSONLDImage();
                console.warn('[BrandingInit] Canonical logo missing or invalid');
            }

            if (faviconUrl) {
                updateFavicon(faviconUrl);
                console.log('[BrandingInit] Canonical favicon resolved');
            } else {
                clearFavicon();
                console.warn('[BrandingInit] Canonical favicon missing or invalid');
            }

            console.log('[BrandingInit] ✅ Canonical branding initialization complete');

        } catch (error) {
            console.error('[BrandingInit] Failed to load canonical branding:', error.message);
            clearBranding();
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
    function applyLogoSlot(selector, placeholderSelector, url) {
        document.querySelectorAll(selector).forEach(function(img) {
            if (url && window.MediaResolver && window.MediaResolver.isCanonicalPublicUrl(url)) {
                img.src = url;
                img.style.display = '';
                img.setAttribute('data-media-status', 'resolved');
            } else {
                img.removeAttribute('src');
                img.style.display = 'none';
                img.setAttribute('data-media-status', 'missing');
            }
        });
        document.querySelectorAll(placeholderSelector).forEach(function(placeholder) {
            placeholder.hidden = !!(url && window.MediaResolver && window.MediaResolver.isCanonicalPublicUrl(url));
        });
    }

    function updateLogos(darkUrl, lightUrl) {
        applyLogoSlot('img.logo-dark.site-logo', 'span.logo-dark.logo-media-missing', darkUrl);
        applyLogoSlot('img.logo-light.site-logo', 'span.logo-light.logo-media-missing', lightUrl);
    }

    function clearBranding() {
        updateLogos(null, null);
        clearFavicon();
        clearOGImage();
        clearJSONLDImage();
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

    function clearFavicon() {
        document.querySelectorAll('link[rel="icon"]').forEach(function(link) {
            link.removeAttribute('href');
            link.setAttribute('data-media-status', 'missing');
        });
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

    function clearOGImage() {
        ['meta[property="og:image"]', 'meta[name="twitter:image"]'].forEach(function(selector) {
            var element = document.querySelector(selector);
            if (element) {
                element.removeAttribute('content');
                element.setAttribute('data-media-status', 'missing');
            }
        });
    }

    function clearJSONLDImage() {
        document.querySelectorAll('script[type="application/ld+json"]').forEach(function(script) {
            try {
                var data = JSON.parse(script.textContent);
                if (data && Object.prototype.hasOwnProperty.call(data, 'image')) {
                    delete data.image;
                    script.textContent = JSON.stringify(data, null, 2);
                }
            } catch (error) {
                console.warn('[BrandingInit] Failed to clear invalid JSON-LD image:', error.message);
            }
        });
    }

    // Initialize when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCanonicalBranding);
    } else {
        initCanonicalBranding();
    }

})();
