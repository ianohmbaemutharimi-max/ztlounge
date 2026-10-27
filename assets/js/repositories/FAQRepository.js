/**
 * ============================================================
 * ZT Lounge Meru - FAQ Repository
 * Abstraction layer for FAQ content
 * Version: 2.0.0
 * ============================================================
 * 
 * Public Interface:
 * - FAQRepository.getByPage(pageId)
 * - FAQRepository.getAll()
 * 
 * Data Source: Supabase (faqs table) with local config fallback
 * ============================================================
 */

window.FAQRepository = (function() {
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
            question: item.question || '',
            answer: item.answer || '',
            category: item.category || '',
            display_order: item.display_order || item.sort_order || 0,  // Canonical: display_order (with fallback)
            is_active: item.is_active !== undefined ? item.is_active : true,
            is_featured: item.is_featured || false,
            view_count: item.view_count || 0,
            page_id: item.page_id || ''
        };
    }

    function getRepo() {
        if (!repo) {
            repo = window.BaseRepository.create(
                window.SupabaseConfig.tables.faqs,
                function() { return []; },
                { cacheTTL: 300000 }
            );
        }
        return repo;
    }

    /**
     * Get FAQ items for a specific page
     * @param {string} pageId - Page identifier
     * @returns {Promise<Array>} Array of FAQ item objects
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
                return data.map(mapToUI);
            }
            var config = window.FaqConfig || {};
            return config[pageId] || [];
        });
    }

    /**
     * Get all FAQ items (for contact page)
     * @returns {Promise<Array>} Array of all FAQ items
     */
    function getAll() {
        return getByPage('contact');
    }

    return {
        getByPage: getByPage,
        getAll: getAll
    };
})();
