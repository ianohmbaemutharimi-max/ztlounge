/**
 * ============================================================
 * ZT Lounge Meru - Testimonials Repository
 * Abstraction layer for testimonial content
 * Version: 2.1.0
 * ============================================================
 *
 * Public Interface:
 * - TestimonialsRepository.getAll()
 * - TestimonialsRepository.getFeatured()
 *
 * Data Source: Supabase (testimonials table) with local config fallback
 *
 * Media contract:
 * - media_id is the only source of testimonial imagery.
 * - MediaResolver resolves media_id through media_assets.public_url.
 * - Legacy image_url values are never returned or used as a fallback.
 * ============================================================
 */

window.TestimonialsRepository = (function() {
    'use strict';

    var repo = null;

    /**
     * Map Supabase database fields to the UI shape.
     * Keep media_id so the canonical MediaResolver can resolve it.
     * Do not copy legacy image_url values into the UI model.
     */
    function mapToUI(item) {
        if (!item) return null;

        var author = '';
        if (item.customer_name) {
            author = item.customer_name;
        } else if (item.author) {
            author = item.author;
        } else if (item.customer) {
            author = (item.customer.first_name || '') + ' ' + (item.customer.last_name || '');
            author = author.trim();
        }

        return {
            id: item.id,
            comment: item.comment || item.quote || '',
            author: author,
            occupation: item.occupation || item.location || '',
            rating: item.rating || 5,
            media_id: item.media_id || null,
            image_url: '',
            alt_text: item.alt_text || '',
            is_featured: item.is_featured || false,
            is_visible: item.is_visible !== undefined ? item.is_visible : true,
            approved: item.approved !== undefined ? item.approved : true,
            created_at: item.created_at
        };
    }

    /**
     * Resolve all available testimonial media in one batch.
     * Records without media_id remain usable as text-only testimonials.
     * A media failure must not make the testimonial content disappear.
     */
    function resolveMedia(items) {
        var rows = (items || []).filter(function(item) { return item !== null; });
        var withMedia = rows.filter(function(item) { return !!item.media_id; });

        if (!withMedia.length) return Promise.resolve(rows);

        if (!window.MediaResolver || typeof window.MediaResolver.resolveCollection !== 'function') {
            console.warn('[TestimonialsRepository] MediaResolver unavailable; testimonial images omitted.');
            return Promise.resolve(rows);
        }

        return window.MediaResolver.resolveCollection(withMedia).then(function() {
            return rows;
        }).catch(function(err) {
            // Never fall back to a legacy URL if canonical resolution fails.
            withMedia.forEach(function(item) { item.image_url = ''; });
            console.error('[TestimonialsRepository] Canonical media resolution failed:', err);
            return rows;
        });
    }

    function getRepo() {
        if (!repo) {
            var config = window.SupabaseConfig || {};
            var tableName = config.tables && config.tables.testimonials ? config.tables.testimonials : 'testimonials';
            repo = window.BaseRepository.create(
                tableName,
                function() {
                    var localConfig = window.TestimonialsConfig || {};
                    return localConfig.items || localConfig.testimonials || [];
                },
                { cacheTTL: 300000 }
            );
        }
        return repo;
    }

    function getLocalItems(featuredOnly) {
        var config = window.TestimonialsConfig || {};
        var localItems = config.items || config.testimonials || [];
        if (featuredOnly) {
            localItems = localItems.filter(function(item) {
                return item.featured || item.is_featured;
            });
        }
        return resolveMedia(localItems.map(mapToUI));
    }

    /**
     * Get all approved testimonials.
     * @returns {Promise<Array>} Array of testimonial objects
     */
    function getAll() {
        return getRepo().getAll({
            eq: [{ column: 'approved', value: true }],
            orderBy: 'created_at',
            ascending: false
        }).then(function(data) {
            if (data && data.length > 0) {
                return resolveMedia(data.map(mapToUI));
            }
            return getLocalItems(false);
        });
    }

    /**
     * Get featured approved testimonials.
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
                return resolveMedia(data.map(mapToUI));
            }
            return getLocalItems(true);
        });
    }

    return {
        getAll: getAll,
        getFeatured: getFeatured
    };
})();
