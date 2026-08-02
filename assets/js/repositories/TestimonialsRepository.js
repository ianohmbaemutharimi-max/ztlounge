/**
 * ============================================================
 * ZT Lounge Meru - Testimonials Repository
 * Abstraction layer for testimonial content
 * Version: 2.0.0
 * ============================================================
 * 
 * Public Interface:
 * - TestimonialsRepository.getAll()
 * - TestimonialsRepository.getFeatured()
 * 
 * Data Source: Supabase (testimonials table) with local config fallback
 * 
 * Field Mapping (Supabase -> UI):
 * - comment -> content
 * - customer.first_name + customer.last_name -> author
 * - is_visible/approved -> include only approved testimonials
 * ============================================================
 */

window.TestimonialsRepository = (function() {
    'use strict';

    var repo = null;

    /**
     * Map Supabase database fields to UI-expected fields
     * @param {Object} item - Raw database item
     * @returns {Object} Mapped item
     */
    function mapToUI(item) {
        if (!item) return null;
        
        // Build author name - prioritize customer_name, then customer relation
        var author = '';
        if (item.customer_name) {
            author = item.customer_name;
        } else if (item.author) {
            author = item.author;
        } else if (item.customer) {
            author = (item.customer.first_name || '') + ' ' + (item.customer.last_name || '');
            author = author.trim();
        }
        
        // Return canonical database field names directly (no mapping)
        return {
            id: item.id,
            comment: item.comment || '',
            author: author,
            occupation: item.occupation || '',
            rating: item.rating || 5,
            image_url: item.image_url || '',
            is_featured: item.is_featured || false,
            is_visible: item.is_visible || false,
            approved: item.approved || false,
            created_at: item.created_at
        };
    }

    function getRepo() {
        if (!repo) {
            var config = window.SupabaseConfig || {};
            var tableName = config.tables && config.tables.testimonials ? config.tables.testimonials : 'testimonials';
            repo = window.BaseRepository.create(
                tableName,
                function() {
                    // Fallback to local config
                    var localConfig = window.TestimonialsConfig || { testimonials: [] };
                    return localConfig.testimonials || [];
                },
                { cacheTTL: 300000 }
            );
        }
        return repo;
    }

/**
     * Get all approved testimonials
     * @returns {Promise<Array>} Array of testimonial objects
     */
    function getAll() {
        return getRepo().getAll({
            eq: [{ column: 'approved', value: true }],
            orderBy: 'created_at',
            ascending: false
        }).then(function(data) {
            if (data && data.length > 0) {
                return data.map(mapToUI);
            }
            // Fallback to local config
            var config = window.TestimonialsConfig || {};
            var localItems = config.testimonials || [];
            return localItems.map(mapToUI);
        });
    }

    /**
     * Get featured testimonials
     * @returns {Promise<Array>} Array of featured testimonial objects
     */
    function getFeatured() {
        return getRepo().getAll({
            eq: [
                { column: 'approved', value: true },
                { column: 'is_featured', value: true }
            ],
            orderBy: 'created_at',
            ascending: false
        }).then(function(data) {
            if (data && data.length > 0) {
                return data.map(mapToUI);
            }
            // Fallback to local config
            var config = window.TestimonialsConfig || {};
            var localItems = (config.testimonials || []).filter(function(item) {
                return item.featured || item.is_featured;
            });
            return localItems.map(mapToUI);
        });
    }

    return {
        getAll: getAll,
        getFeatured: getFeatured
    };
})();