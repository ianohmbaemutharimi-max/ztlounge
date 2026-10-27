/**
 * ============================================================
 * ZT Lounge Meru - Gallery Repository
 * Abstraction layer for gallery content
 * Version: 2.0.0 (Phase 3 - Canonical Media Migration)
 * ============================================================
 *
  * Public Interface:
 * - GalleryRepository.getByPage(pageId)
 * - GalleryRepository.getAll(options?)  // options.is_favorite for hero/favorite filtering
 *
 * Data Source: Supabase (public.gallery table)
 * Media:       Resolved EXCLUSIVELY via MediaResolver
 *              (gallery.media_id â†’ media_assets.public_url)
 *
 * Canonical contract:
 *   â€¢ mapToUI() returns media_id â€” NO image_url in mapped output.
 *   â€¢ resolveMedia() delegates to MediaResolver.resolveCollection()
 *     which throws on missing / unresolvable media_id (exclusive gateway).
 *   â€¢ getByPage() returns { items: [...] } (resolved) to match the
 *     content-loader populateGallery() contract.
 *   â€¢ No static config fallback â€” the canonical source is the database.
 * ============================================================
 */

window.GalleryRepository = (function() {
    'use strict';

    var repo = null;

    /**
     * Map a raw Supabase row to the canonical UI shape.
     *
     * Canonical field names are preserved (no renaming):
     *   title, description, alt_text, category, display_order, â€¦
     *   media_id is the single media pointer (resolved to image_url
     *   downstream by MediaResolver â€” never a fallback to image_url).
     */
    function mapToUI(item) {
        if (!item) return null;
        return {
            id: item.id,
            title: item.title || '',
            description: item.description || '',
            alt_text: item.alt_text || '',
            category: item.category || '',
            media_id: item.media_id || null,   // Canonical: resolved by MediaResolver
            display_order: item.display_order || 0,
            page_id: item.page_id || '',
            is_active: item.is_active !== undefined ? item.is_active : true,
            is_featured: item.is_featured || false,
            type: item.type || 'general'
        };
    }

    /**
     * Resolve media through the canonical MediaResolver (EXCLUSIVE GATEWAY).
     *
     * Delegates to MediaResolver.resolveCollection() which:
     *   1. Batches all media_ids into a single media_assets query.
     *   2. Caches results in-memory for the session.
     *   3. Throws on ANY item with a missing or unresolvable media_id.
     *
     * @param {Array<Object>} items - Items with media_id
     * @returns {Promise<Array>} Same items with canonical image_url applied
     */
    function resolveMedia(items) {
        var valid = (items || []).filter(function(r) { return r !== null; });
        if (window.MediaResolver && window.MediaResolver.resolveCollection) {
            return MediaResolver.resolveCollection(valid);
        }
        // MediaResolver absent: no resolution, items keep media_id only
        return Promise.resolve(valid);
    }

    /**
     * Get or initialize the base repository
     */
    function getRepo() {
        if (!repo) {
            repo = BaseRepository.create(
                SupabaseConfig.tables.gallery,
                function() { return []; },   // no static fallback â€” canonical source is DB only
                { cacheTTL: 300000 }
            );
        }
        return repo;
    }

    /**
     * Get gallery items for a specific page.
     *
     * @param {string} pageId - Canonical PageId (e.g. 'gallery', 'home', 'restaurant')
     * @returns {Promise<{items: Array}>} Resolved gallery items for the page
     */
    function getByPage(pageId) {
        var table = SupabaseConfig.tables.gallery;
        var cacheKey = 'gallery_page_' + (pageId || '');
        if (cache[cacheKey]) {
            return Promise.resolve(cache[cacheKey]);
        }

        var request = BaseRepository.create(
            table,
            function() { return []; },
            { cacheTTL: 300000 }
        ).getAll({
            eq: [
                { column: 'page_id', value: pageId },
                { column: 'is_active', value: true }
            ],
            orderBy: 'display_order',
            ascending: true
        }).then(function(data) {
            var items = (data || []).map(mapToUI);
            return resolveMedia(items).then(function(resolved) {
                var result = { items: resolved };
                cache[cacheKey] = result;
                return result;
            });
        });

        cache[cacheKey] = request;
        return request;
    }

        /**
     * Get all active gallery items across all pages.
     *
     * @param {Object} [options] - Optional flags
     * @param {boolean} [options.is_favorite] - When true, filter to is_featured items only
     *                                         (used for hero/favorite section previews)
     * @returns {Promise<{items: Array}>} Resolved gallery items
     */
    function getAll(options) {
        options = options || {};
        var cacheKey = options.is_favorite ? 'gallery_all_featured' : 'gallery_all';
        if (cache[cacheKey]) {
            return Promise.resolve(cache[cacheKey]);
        }

        var eqFilters = [{ column: 'is_active', value: true }];
        if (options.is_favorite) {
            eqFilters.push({ column: 'is_featured', value: true });
        }

        var request = getRepo().getAll({
            eq: eqFilters,
            orderBy: 'display_order',
            ascending: true
        }).then(function(data) {
            var items = (data || []).map(mapToUI);
            return resolveMedia(items).then(function(resolved) {
                var result = { items: resolved };
                cache[cacheKey] = result;
                return result;
            });
        });

        cache[cacheKey] = request;
        return request;
    }

    /**
     * Clear in-memory cache (useful for tests / forced refresh)
     */
    function clearCache() {
        cache = {};
        repo = null;
    }

    // Module-level cache
    var cache = {};

    return {
        getByPage: getByPage,
        getAll: getAll,
        mapToUI: mapToUI,
        resolveMedia: resolveMedia,
        clearCache: clearCache
    };
})();
