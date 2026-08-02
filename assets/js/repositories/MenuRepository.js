/**
 * ============================================================
 * ZT Lounge Meru - Menu Repository
 * Abstraction layer for menu content
 * Version: 2.0.0
 * ============================================================
 * 
 * Public Interface:
 * - MenuRepository.getCategories()
 * - MenuRepository.getSignatureItems()
 * - MenuRepository.getItemsByCategory(categoryId)
 * 
 * Data Source: Supabase (menu_items table) with local config fallback
 * ============================================================
 */

window.MenuRepository = (function() {
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
            name: item.name || '',
            description: item.description || '',
            price: item.price || 0,
            image_url: item.image_url || '',
            alt_text: item.alt_text || '',
            is_active: item.is_active !== undefined ? item.is_active : true,
            is_featured: item.is_featured || false,
            display_order: item.display_order || item.sort_order || 0,  // Canonical: display_order (with fallback)
            type: item.type || 'item',
            category_id: item.category_id || '',
            page_id: item.page_id || ''
        };
    }

    function getRepo() {
        if (!repo) {
            repo = window.BaseRepository.create(
                window.SupabaseConfig.tables.menuItems,
                function() { return []; },
                { cacheTTL: 300000 }
            );
        }
        return repo;
    }

    /**
     * Get all menu categories
     * @returns {Promise<Array>} Array of category objects
     */
    function getCategories() {
        return getRepo().getAll({
            eq: [
                { column: 'type', value: 'category' },
                { column: 'is_active', value: true }
            ],
            orderBy: 'display_order',
            ascending: true
        }).then(function(data) {
            if (data && data.length > 0) {
                return data.map(mapToUI);
            }
            var config = window.MenuConfig || {};
            return config.categories || [];
        });
    }

    /**
     * Get signature collection items
     * @returns {Promise<Array>} Array of signature menu items
     */
    function getSignatureItems() {
        return getRepo().getAll({
            eq: [
                { column: 'type', value: 'signature' },
                { column: 'is_active', value: true }
            ],
            orderBy: 'display_order',
            ascending: true
        }).then(function(data) {
            if (data && data.length > 0) {
                return data.map(mapToUI);
            }
            var config = window.MenuConfig || {};
            return config.signatureCollection || [];
        });
    }

    /**
     * Get menu items by category
     * @param {string} categoryId - Category identifier
     * @returns {Promise<Array>} Array of menu items
     */
    function getItemsByCategory(categoryId) {
        return getRepo().getAll({
            eq: [
                { column: 'type', value: 'item' },
                { column: 'category_id', value: categoryId },
                { column: 'is_active', value: true }
            ],
            orderBy: 'display_order',
            ascending: true
        }).then(function(data) {
            if (data && data.length > 0) {
                return data.map(mapToUI);
            }
            var config = window.MenuConfig || {};
            var fullMenu = config.fullMenu || {};
            return fullMenu[categoryId] || [];
        });
    }

    return {
        getCategories: getCategories,
        getSignatureItems: getSignatureItems,
        getItemsByCategory: getItemsByCategory
    };
})();