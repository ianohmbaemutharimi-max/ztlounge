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
 * Data Source: Supabase testimonials table only; media URLs resolved through MediaResolver
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
            comment: item.comment || item.quote || '',
            author: author,
            occupation: item.occupation || item.location || '',
            rating: item.rating || 5,
            image_url: null,
            media_id: item.media_id || null,
            is_featured: item.is_featured || false,
            is_visible: item.is_visible !== undefined ? item.is_visible : true,
            approved: item.approved !== undefined ? item.approved : true,
            created_at: item.created_at
        };
    }

    function getTableName() {
        var config = window.SupabaseConfig || {};
        return config.tables && config.tables.testimonials ? config.tables.testimonials : 'testimonials';
    }

    function resolveMedia(rows) {
        var withMedia = (rows || []).filter(function(item) { return !!item.media_id; });
        if (!withMedia.length) return Promise.resolve(rows || []);
        if (!window.MediaResolver || typeof window.MediaResolver.resolveCollection !== 'function') {
            return Promise.reject(new Error('MEDIA_RESOLVER_UNAVAILABLE'));
        }
        return window.MediaResolver.resolveCollection(withMedia).then(function() { return rows || []; });
    }

/**
     * Get all approved testimonials
     * @returns {Promise<Array>} Array of testimonial objects
     */
    function getAll() {
        var client = window.SupabaseClient && window.SupabaseClient.getClient();
        if (!client) return Promise.reject(new Error('SUPABASE_CLIENT_UNAVAILABLE'));

        return client.from(getTableName()).select('*').eq('approved', true)
            .order('created_at', { ascending: false })
            .then(function(result) {
                if (result.error) throw result.error;
                var rows = (result.data || []).map(mapToUI);
                return resolveMedia(rows);
            });
    }

    /**
     * Get featured testimonials
     * @returns {Promise<Array>} Array of featured testimonial objects
     */
    function getFeatured() {
        var client = window.SupabaseClient && window.SupabaseClient.getClient();
        if (!client) return Promise.reject(new Error('SUPABASE_CLIENT_UNAVAILABLE'));

        return client.from(getTableName()).select('*')
            .eq('approved', true)
            .eq('is_featured', true)
            .order('created_at', { ascending: false })
            .then(function(result) {
                if (result.error) throw result.error;
                var rows = (result.data || []).map(mapToUI);
                return resolveMedia(rows);
            });
    }

    return {
        getAll: getAll,
        getFeatured: getFeatured
    };
})();