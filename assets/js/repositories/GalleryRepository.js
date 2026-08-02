/**
 * ============================================================
 * ZT Lounge Meru - Gallery Repository
 * Abstraction layer for gallery content
 * Version: 2.0.0
 * ============================================================
 * 
 * Public Interface:
 * - GalleryRepository.getByPage(pageId)
 * - GalleryRepository.getAll()
 * 
 * Data Source: Supabase (gallery table) with local config fallback
 * 
 * Field Mapping (Supabase -> UI):
 * - image_url -> image
 * - display_order -> sort_order
 * - alt_text -> alt
 * - title/description -> label/caption
 * ============================================================
 */

window.GalleryRepository = (function() {
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
            label: item.title || item.label || '',  // Canonical: title (with fallback)
            caption: item.description || item.caption || '',  // Canonical: description (with fallback)
            image_url: item.image_url || item.image || '',  // Canonical: image_url (with fallback)
            alt_text: item.alt_text || item.alt || '',  // Canonical: alt_text (with fallback)
            category: item.category || '',
            display_order: item.display_order || item.sort_order || 0,  // Canonical: display_order (with fallback)
            page_id: item.page_id,
            is_active: item.is_active,
            is_featured: item.is_featured,
            type: item.type || 'general',
            view_count: item.view_count || 0
        };
    }

    function getRepo() {
        if (!repo) {
            var config = window.SupabaseConfig || {};
            var tableName = config.tables && config.tables.gallery ? config.tables.gallery : 'gallery';
            repo = window.BaseRepository.create(
                tableName,
                function() {
                    // Fallback to local config
                    var localConfig = window.GalleryConfig || { gallery: [] };
                    return localConfig.gallery || [];
                },
                { cacheTTL: 300000 }
            );
        }
        return repo;
    }

    /**
     * Get gallery items for a specific page
     * @param {string} pageId - Page identifier
     * @returns {Promise<Array>} Array of gallery item objects
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
                // Map fields and check if we got real data from Supabase
                return data.map(mapToUI);
            }
            // Fallback to local config
            var config = window.GalleryConfig || {};
            var localItems = config[pageId] || config.gallery || [];
            return localItems.map(mapToUI);
        });
    }

    /**
     * Get all gallery items (for pages without specific page_id)
     * @returns {Promise<Array>} Array of gallery item objects
     */
    function getAll() {
        return getRepo().getAll({
            eq: [{ column: 'is_active', value: true }],
            orderBy: 'display_order',
            ascending: true
        }).then(function(data) {
            if (data && data.length > 0) {
                return data.map(mapToUI);
            }
            // Fallback to local config
            var config = window.GalleryConfig || {};
            var localItems = config.gallery || [];
            return localItems.map(mapToUI);
        });
    }

    return {
        getByPage: getByPage,
        getAll: getAll
    };
})();