/**
 * ============================================================
 * ZT Lounge - Canonical Page Identity (hardening phase)
 * ============================================================
 *
 * SINGLE SOURCE OF TRUTH for public page identity.
 *
 * Resolution order (getCanonicalPageId):
 *   1. <body data-page="..."> â€” validated against the canonical set
 *   2. exact file-name match (basename of the path ONLY)
 *   3. otherwise null â€” NEVER guessed from substrings of the URL,
 *      directory names, or hosting paths.
 *
 * This module must stay dependency-free so it can load first.
 */
window.PageIdentity = (function () {
    'use strict';

    /**
     * Canonical page identifiers. Anything else is invalid by definition.
     * NOTE: 'grooming-care' consolidates Auto Spa, Barbershop, and Carpet
     * Cleaning services into a unified grooming & care experience.
     * Legacy URLs barbershop.html and autospa.html resolve to 'grooming-care'.
     * Auto Spa is a SERVICE CATEGORY (slug 'auto-spa'), not a page: 'autospa'
     * is deliberately NOT a PageId and pages/business/autospa.html was removed.
     */
    var PAGE_IDS = [
        'home',
        'restaurant',
        'restaurant-menu',
        'lounge',
        'vip',
        'events',
        'conference',
        'grooming-care',
        'gallery',
        'contact'
    ];

    /** Exact basename -> PageId. No substring matching, ever. */
    var FILENAME_MAP = {
        'index.html': 'home',
        '': 'home',
        'restaurant.html': 'restaurant',
        'restaurant-menu.html': 'restaurant-menu',
        'lounge.html': 'lounge',
        'vip.html': 'vip',
        'events.html': 'events',
        'conference.html': 'conference',
        'autospa.html': 'grooming-care', // legacy URL -> consolidated Grooming & Care
        'grooming-care.html': 'grooming-care',
        'barbershop.html': 'grooming-care', // legacy URL -> consolidated Grooming & Care
        'gallery.html': 'gallery',
        'contact.html': 'contact'
    };

    /**
     * PageId -> canonical services.slug (service pages only).
     * NOTE: this is deliberately DIFFERENT from website_pages.page_key.
     * The Grooming & Care page uses 'auto-spa' slug for pricing lookups.
     */
    var PAGE_TO_SERVICE_SLUG = {
        'restaurant': 'restaurant',
        'lounge': 'lounge-bar',
        'vip': 'vip-cabins',
        'events': 'events',
        'conference': 'conference',
        'grooming-care': 'auto-spa'
    };

    /** PageId -> website_pages.page_key (CMS UUID resolution namespace). */
    var PAGE_TO_PAGE_KEY = {
        'home': 'home',
        'restaurant': 'restaurant',
        'restaurant-menu': 'restaurant-menu',
        'lounge': 'lounge',
        'vip': 'vip',
        'events': 'events',
        'conference': 'conference',
        'grooming-care': 'grooming-care',
        'gallery': 'gallery',
        'contact': 'contact'
    };

    /**
     * OUTBOUND page identity: PageId / website_pages.page_key â†’ the served
     * public HTML route (site-root-relative). The reverse half of FILENAME_MAP
     * and the ONLY place a canonical page key becomes a link target.
     *
     * A key ABSENT from this map has NO served public page and must never be
     * offered or linked as a destination:
     *   'barbershop' â€” not a canonical PageId, no served barbershop.html
     *   'autospa'    â€” pages/business/autospa.html was removed from the site
     */
    var PAGE_ROUTES = {
        'home': 'index.html',
        'restaurant': 'pages/experiences/restaurant.html',
        'restaurant-menu': 'pages/experiences/restaurant-menu.html',
        'lounge': 'pages/experiences/lounge.html',
        'vip': 'pages/experiences/vip.html',
        'events': 'pages/business/events.html',
        'conference': 'pages/business/conference.html',
        'grooming-care': 'pages/business/grooming-care.html',
        'gallery': 'pages/contact/gallery.html',
        'contact': 'pages/contact/contact.html'
    };

    function isValidPageId(value) {
        return typeof value === 'string' && PAGE_IDS.indexOf(value) !== -1;
    }

    function resolveFromFilename(pathname) {
        var segments = String(pathname || '').split('/');
        var file = segments[segments.length - 1] || '';
        file = file.split('?')[0].split('#')[0].toLowerCase();
        return Object.prototype.hasOwnProperty.call(FILENAME_MAP, file)
            ? FILENAME_MAP[file]
            : null;
    }

    /**
     * Resolve the canonical PageId for the current document.
     * @returns {string|null} a known PageId, or null when unknown.
     * Never guesses. Never inspects parent directories.
     */
    function getCanonicalPageId() {
        var body = document.body;
        if (body) {
            var explicit = body.getAttribute('data-page');
            if (explicit) {
                return isValidPageId(explicit) ? explicit : null;
            }
        }
        return resolveFromFilename(window.location.pathname);
    }

    /**
     * Canonical services.slug for a service PageId.
     * @returns {string|null} slug or null for non-service / invalid ids.
     */
    function pageSlugForPageId(pageId) {
        if (!isValidPageId(pageId)) return null;
        return PAGE_TO_SERVICE_SLUG[pageId] || null;
    }

    /**
     * website_pages.page_key for a PageId.
     * @returns {string|null} page key or null when no CMS record can exist.
     */
    function pageKeyForPageId(pageId) {
        if (!isValidPageId(pageId)) return null;
        var key = PAGE_TO_PAGE_KEY[pageId];
        return typeof key === 'string' ? key : null;
    }

    /**
     * Served public route (site-root-relative) for a website_pages.page_key.
     * @returns {string|null} route, or null when the key has no served page.
     */
    function pageHrefForPageKey(pageKey) {
        if (typeof pageKey !== 'string') return null;
        return Object.prototype.hasOwnProperty.call(PAGE_ROUTES, pageKey)
            ? PAGE_ROUTES[pageKey]
            : null;
    }

    return {
        PAGE_IDS: PAGE_IDS,
        FILENAME_MAP: FILENAME_MAP,
        PAGE_ROUTES: PAGE_ROUTES,
        isValidPageId: isValidPageId,
        getCanonicalPageId: getCanonicalPageId,
        pageSlugForPageId: pageSlugForPageId,
        pageKeyForPageId: pageKeyForPageId,
        pageHrefForPageKey: pageHrefForPageKey
    };
})();
