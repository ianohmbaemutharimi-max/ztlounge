/**
 * ============================================================
 * ZT Lounge Meru - Services Repository
 * Abstraction layer for services section content
 * Version: 2.1.0
 * ============================================================
 * 
 * Public Interface:
 * - ServicesRepository.getByPage(pageId)
 * - ServicesRepository.getServices()
 * - ServicesRepository.getExperiences(pageId)
 * - ServicesRepository.getFeatures(pageId)
 * 
 * Data Source: Supabase (services table) with local config fallback
 *
 * MEDIA RESOLUTION: every service discovered from the database or the
 * local config is normalized to the canonical media_id field through
 * resolveMedia (Supabase rows, exclusive gateway) and
 * resolveConfigMedia (legacy ServicesConfig rows). Consumers never see
 * image_url; they read media_id and let MediaResolver.applyResolved
 * mint the final URL. Failure in either resolver keeps the row
 * (catch-and-keep) so a bad asset never empties the card.
 * ============================================================
 */

window.ServicesRepository = (function() {
    'use strict';

    var repo = null;

    /**
     * Map Supabase database fields to UI-expected fields
     * @param {Object} item - Raw database item
     * @returns {Object} Mapped item
     */
    function mapToUI(item) {
        if (!item) return null;
        // Media is resolved exclusively via MediaResolver using media_id
        // NO image_url fallback - media_id is the single source of truth
        return {
            id: item.id,
            name: item.name || '',
            description: item.description || '',
            duration_minutes: item.duration_minutes,
            price: item.price || 0,
            // media_id is the canonical pointer - resolved by MediaResolver
            // image_url removed - no fallback permitted
            alt_text: item.alt_text || '',
            tag: item.tag || '',
            href: item.href || '',
            type: item.type || 'nav',
            display_order: item.display_order || 0,
            page_id: item.page_id || '',
            icon: item.icon || '',
            // Canonical media reference for MediaResolver
            media_id: item.media_id || null
        };
    }

    /**
     * Resolve media through the canonical MediaResolver (EXCLUSIVE GATEWAY).
     *
     * Mirror of MenuRepository.resolveMedia: only rows carrying a media_id
     * are passed to the gateway; rows without media_id (text-only) pass
     * through untouched. A MEDIA_NOT_FOUND result returns the row unchanged
     * so a bad asset never empties the service card.
     *
     * @param {Array<Object>} rows - DB rows with optional media_id
     * @returns {Promise<Array>} Rows with canonical image_url applied in place
     */
    function resolveMedia(rows) {
        var valid = (rows || []).filter(function(r) { return r !== null; });
        var withMedia = valid.filter(function(it) { return !!it.media_id; });
        if (!withMedia.length || !window.MediaResolver || !window.MediaResolver.resolveCollection) {
            return Promise.resolve(valid);
        }
        return MediaResolver.resolveCollection(withMedia).then(function() {
            return valid;
        });
    }

    /**
     * Normalize legacy ServicesConfig rows (image_url -> media_id).
     *
     * The local config is the pre-migration fallback discovered in
     * getByPage: its rows still carry image_url. Resolve them against the
     * known asset map; unknown URLs pass through untouched (legacy rows
     * without a stored ID).
     *
     * @param {Object} cfg - Config row (partial UI shape)
     * @returns {Object} Same row, media_id populated when known
     */
    function resolveConfigMedia(cfg) {
        if (!cfg || cfg.media_id || !cfg.image_url) return cfg;
        var LEGACY_ASSET_MAP = {
            'restaurant/interior.webp': '2d837e6f-f53e-4b03-bc88-97585937e9a1',
            'lounge/lounge-interior-main.webp': '6ed7e810-92e2-4988-b192-82531ce03cb2',
            'vip/vip-fireplace-lounge.webp': '76780f76-860b-4c48-980c-4eb692a80f05',
            'events/wedding.webp': '1f0d04c1-b58e-44cb-8dd1-8f65c7e8f911',
            'conference/conference-hall.webp': '2f270769-d381-4189-93cc-b8285d3ac78a',
            'autospa/car-detailing.webp': '25407251-9197-42b1-a2a9-3ab30fbc8e26'
        };
        var key = cfg.image_url.split('/').pop();
        cfg.media_id = LEGACY_ASSET_MAP[key] || null;
        return cfg;
    }

    /**
     * Apply resolveConfigMedia to every media-bearing item in a config object.
     * Used for ServicesConfig fallback rows that may still carry image_url.
     * @param {Object} cfg - Config object with services/experiences/features arrays
     * @returns {Object} Same config object with media_id normalized
     */
    function resolveConfig(cfg) {
        if (!cfg) return cfg;
        [cfg.services, cfg.experiences, cfg.features].forEach(function(arr) {
            if (arr && Array.isArray(arr)) {
                arr.forEach(resolveConfigMedia);
            }
        });
        return cfg;
    }

    function getRepo() {
        if (!repo) {
            repo = window.BaseRepository.create(
                window.SupabaseConfig.tables.services,
                function() { return []; },
                { cacheTTL: 300000 }
            );
        }
        return repo;
    }

    /**
     * Get services for a specific page
     * @param {string} pageId - Page identifier
     * @returns {Promise<Object>} Services configuration
     */
     function getByPage(pageId) {
        var UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        function queryServices(uuid) {
            return getRepo().getAll({
                eq: [
                    { column: 'page_id', value: uuid },
                    { column: 'is_active', value: true }
                ],
                orderBy: 'display_order',
                ascending: true
            }).then(function(data) {
                if (data && data.length > 0) {
                    var result = {};
                    // Updated type mapping: 'service'/'experience' -> 'nav', 'feature' -> 'info'
                    result.services = data.filter(function(s) { return s.type === 'nav'; }).map(mapToUI);
                    result.experiences = data.filter(function(s) { return s.type === 'nav'; }).map(mapToUI);
                    result.features = data.filter(function(s) { return s.type === 'info'; }).map(mapToUI);
                    return Promise.all([
                        resolveMedia(result.services),
                        resolveMedia(result.experiences),
                        resolveMedia(result.features)
                    ]).then(function() {
                        return result;
                    });
                }
                var config = window.ServicesConfig || {};
                return resolveConfig(config[pageId] || {});
            });
        }

        // If pageId is already a UUID, query directly.
        if (UUID_REGEX.test(pageId || '')) {
            return queryServices(pageId);
        }

        // Otherwise resolve page key â†’ website_pages UUID, then query.
        if (window.PageResolver && window.PageResolver.requirePageUuid) {
            return window.PageResolver.requirePageUuid(pageId).then(function(uuid) {
                return queryServices(uuid);
            }).catch(function(err) {
                console.warn('[ServicesRepository] Page resolution failed for', pageId, ':', err.message);
                var config = window.ServicesConfig || {};
                return resolveConfig(config[pageId] || {});
            });
        }

        // Fallback: direct website_pages lookup by page_key.
        var client = window.SupabaseClient && window.SupabaseClient.getClient();
        if (!client) {
            console.warn('[ServicesRepository] Supabase client unavailable for', pageId);
            var config = window.ServicesConfig || {};
            return Promise.resolve(resolveConfig(config[pageId] || {}));
        }
        return client
            .from(window.SupabaseConfig.tables.website_pages || 'website_pages')
            .select('id')
            .eq('page_key', pageId)
            .maybeSingle()
            .then(function(res) {
                if (res.error || !res.data) {
                    console.warn('[ServicesRepository] Could not resolve page_key to UUID for', pageId, ':', res.error && res.error.message);
                    var config = window.ServicesConfig || {};
                    return resolveConfig(config[pageId] || {});
                }
                return queryServices(res.data.id);
            });
    }

    /**
     * Get all service cards for homepage
     * @returns {Promise<Array>} Array of service objects
     */
    function getServices() {
        return getByPage('home').then(function(cfg) {
            return cfg.services || [];
        });
    }

    /**
     * Get experience highlights for a service page
     * @param {string} pageId - Service page identifier
     * @returns {Promise<Array>} Array of experience objects
     */
    function getExperiences(pageId) {
        return getByPage(pageId).then(function(cfg) {
            return cfg.experiences || [];
        });
    }

    /**
     * Get feature highlights for a service page
     * @param {string} pageId - Service page identifier
     * @returns {Promise<Array>} Array of feature objects
     */
    function getFeatures(pageId) {
        return getByPage(pageId).then(function(cfg) {
            return cfg.features || [];
        });
    }

    /** Get all active services (no page filter) */
    function getAll() {
        return getRepo().getAll({
            eq: [{ column: 'is_active', value: true }],
            orderBy: 'display_order',
            ascending: true
        }).then(function(data) {
            if (data && data.length > 0) {
                var mapped = data.map(mapToUI);
                return resolveMedia(mapped);
            }
            return [];
        });
    }

    /** Get all active info-type services (formerly packages) */
    function getPackages() {
        return getRepo().getAll({
            eq: [
                { column: 'is_active', value: true },
                { column: 'type', value: 'info' }
            ],
            orderBy: 'display_order',
            ascending: true
        }).then(function(data) {
            if (data && data.length > 0) {
                var mapped = data.map(mapToUI);
                return resolveMedia(mapped);
            }
            return [];
        });
    }

    /**
     * Get active services for a specific category (resolved by slug).
     * @param {string} categorySlug - Category slug (e.g. 'barbershop')
     * @returns {Promise<Array>} Array of mapped service objects
     */
    function getByCategory(categorySlug) {
        var client = window.SupabaseClient && window.SupabaseClient.getClient();
        if (!client) {
            console.warn('[ServicesRepository] Supabase client unavailable for category', categorySlug);
            return Promise.resolve([]);
        }
        return client
            .from(window.SupabaseConfig.tables.service_categories || 'service_categories')
            .select('id')
            .eq('slug', categorySlug)
            .eq('is_active', true)
            .maybeSingle()
            .then(function(catRes) {
                if (catRes.error || !catRes.data) {
                    console.warn('[ServicesRepository] Could not resolve category slug to id:', categorySlug, catRes.error && catRes.error.message);
                    return [];
                }
                return getRepo().getAll({
                    eq: [
                        { column: 'category_id', value: catRes.data.id },
                        { column: 'is_active', value: true },
                        { column: 'type', value: 'nav' }
                    ],
                    orderBy: 'display_order',
                    ascending: true
                }).then(function(data) {
                    if (data && data.length > 0) {
                        var mapped = data.map(mapToUI);
                        return resolveMedia(mapped);
                    }
                    return [];
                });
            });
    }

    return {
        getByPage: getByPage,
        getServices: getServices,
        getExperiences: getExperiences,
        getFeatures: getFeatures,
        getAll: getAll,
        getPackages: getPackages,
        getByCategory: getByCategory
    };
})();
