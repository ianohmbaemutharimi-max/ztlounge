/**
 * ============================================================
 * ZT Lounge Meru - Feature Repository
 * Canonical public feature card data access
 * Version: 1.0.0
 * ============================================================
 *
 * Public Interface:
 * - FeaturesRepository.getByPage(pageId)   → features for a specific page
 * - FeaturesRepository.getFeatured(pageId) → featured features only (is_active=true)
 *
 * Data Source: Supabase public.page_features table ONLY (no fallback)
 * RLS enforces public read of active records only.
 * ============================================================
 */

window.FeaturesRepository = (function() {
    'use strict';

    var repo = null;

    function getRepo() {
        if (!repo) {
            var config = window.SupabaseConfig || {};
            var tableName = config.tables && config.tables.pageFeatures
                ? config.tables.pageFeatures
                : 'page_features';
            repo = window.BaseRepository.create(
                tableName,
                function() { return []; }, // no static fallback features — ever
                { cacheTTL: 300000 }
            );
        }
        return repo;
    }

    /**
     * Map a canonical DB row to the UI shape for feature cards.
     */
    function mapToUI(item) {
        return {
            id: item.id,
            page_id: item.page_id || null,
            title: item.title || '',
            description: item.description || '',
            icon: item.icon || 'fas fa-star',
            display_order: Number(item.display_order || 0),
            is_active: item.is_active === true,
            created_at: item.created_at || null
        };
    }

    /**
     * Sort canonically: display_order ASC, then created_at ASC.
     */
    function sortByDisplayOrder(items) {
        return items.slice().sort(function(a, b) {
            var d = a.display_order - b.display_order;
            if (d !== 0) return d;
            return String(a.created_at || '').localeCompare(String(b.created_at || ''));
        });
    }

    /**
     * Get all active features for a specific page, ordered by display_order.
     * @param {string} pageId - Page identifier
     * @returns {Promise<Array>} Array of feature card UI objects
     */
    function getByPage(pageId) {
        return getRepo()
            .getByColumn('page_id', pageId)
            .then(function(rows) {
                var active = (rows || [])
                    .filter(function(f) { return f.is_active === true; })
                    .map(mapToUI);
                return sortByDisplayOrder(active);
            });
    }

    /**
     * Alias for getByPage — returns featured (active) features for a page.
     * @param {string} pageId - Page identifier
     * @returns {Promise<Array>}
     */
    function getFeatured(pageId) {
        return getByPage(pageId);
    }

    return {
        getByPage: getByPage,
        getFeatured: getFeatured,
        clearCache: function() { if (repo) repo.clearCache(); }
    };
})();