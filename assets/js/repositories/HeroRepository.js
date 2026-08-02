/**
 * ============================================================
 * ZT Lounge Meru - Hero Repository
 * Abstraction layer for hero section content
 * Version: 1.0.0
 * ============================================================
 * 
 * Public Interface:
 * - HeroRepository.getSlides(pageId)
 * - HeroRepository.getByPage(pageId)
 * 
 * Data Source: hero.config.js (Configuration file)
 * Future: Will return Supabase data without changing the interface
 * ============================================================
 */

window.HeroRepository = (function() {
    'use strict';

    var repo = null;

    /**
     * Map Supabase database fields to UI-expected fields
     * @param {Object} item - Raw database item
     * @returns {Object} Mapped item
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
            image_url: item.image_url || item.image || '',  // Canonical: image_url (with fallback)
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
     * Tries Supabase first, falls back to local config
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
                return { slides: data.map(mapToUI) };
            }
            var config = window.HeroConfig || {};
            return config[pageId] || { slides: [] };
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
