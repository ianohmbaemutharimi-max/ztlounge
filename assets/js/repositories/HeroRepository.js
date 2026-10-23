/**
 * ============================================================
 * ZT Lounge Meru - Hero Repository
 * Abstraction layer for hero section content
 * Version: 2.0.0 (Phase 3 - Canonical Media Migration)
 * ============================================================
 *
 * Public Interface:
 * - HeroRepository.getSlides(pageId)
 * - HeroRepository.getByPage(pageId)
 *
 * Data Source: Supabase (hero_slides table)
 * Media: Resolved exclusively via MediaResolver (media_id -> media_assets.public_url)
 * ============================================================
 */

window.HeroRepository = (function() {
    'use strict';

    var repo = null;

    /**
     * Map Supabase database fields to UI-expected fields
     * @param {Object} item - Raw database item
     * @returns {Object} Mapped item with media_id for canonical media resolution
     */
    function mapToUI(item) {
        if (!item) return null;
        // Return canonical database field names directly
        return {
            id: item.id,
            badge: item.badge || '',
            title: item.title || '',
            highlight: item.highlight || '',
            subtitle: item.subtitle || '',
            media_id: item.media_id || null,  // Canonical: media_id (resolved to image_url by MediaResolver)
            alt_text: item.alt_text || '',
            cta_text: item.cta_text || '',
            cta_link: item.cta_link || '',
            buttons: item.buttons || [],
            display_order: item.display_order || item.sort_order || 0,  // Canonical: display_order (with fallback)
            page_id: item.page_id || '',
            is_active: item.is_active !== undefined ? item.is_active : true
        };
    }

    /**
     * Resolve media through the canonical MediaResolver (EXCLUSIVE GATEWAY).
     * Resolves media_id -> media_assets.public_url. Throws on missing media_id.
     * @param {Array} items - Array of items with media_id
     * @returns {Promise<Array>} Items with canonical image_url applied
     */
    function resolveMedia(items) {
        if (window.MediaResolver && window.MediaResolver.resolveCollection) {
            return window.MediaResolver.resolveCollection(items);
        }
        // MediaResolver absent: presentation fallback is no resolution
        return Promise.resolve(items);
    }

    /**
     * Get or initialize the base repository
     */
    function getRepo() {
        if (!repo) {
            repo = window.BaseRepository.create(
                window.SupabaseConfig.tables.heroSlides,
                function() { return []; },
                { cacheTTL: 300000 }
            );
        }
        return repo;
    }

    /**
     * Get hero slides for a specific page
     * Queries Supabase hero_slides table, resolves media via MediaResolver
     * @param {string} pageId - Page identifier (home, restaurant, lounge, etc.)
     * @returns {Promise<Object>} Hero configuration for the page
     */
    function getByPage(pageId) {
        return getRepo().getAll({
            eq: [
                { column: 'page_id', value: pageId },
                { column: 'is_active', value: true }
            ],
            orderBy: 'display_order',
            ascending: true
        }).then(function(data) {
            if (data && data.length > 0) {
                var mapped = data.map(mapToUI);
                return resolveMedia(mapped).then(function(resolved) {
                    return { slides: resolved };
                });
            }
            return { slides: [] };
        });
    }

    /**
     * Get all slides for a page
     * @param {string} pageId - Page identifier
     * @returns {Promise<Array>} Array of slide objects
     */
    function getSlides(pageId) {
        return getByPage(pageId).then(function(pageConfig) {
            return pageConfig.slides || [];
        });
    }

    // Public API
    return {
        getByPage: getByPage,
        getSlides: getSlides
    };
})();