/**
 * ============================================================
 * ZT Lounge Meru - Package Repository (PUBLIC, canonical)
 * Version: 1.0.0
 * ============================================================
 * Public Interface:
 * - PackageRepository.getPackages()      -> active packages w/ pricing
 * - PackageRepository.getByPage(pageId)  -> active packages for a page
 *
 * Data Source: Supabase public.pricing_packages (NO fallback that fabricates content).
 * RLS enforces is_active = true at query time. Consumers must not fabricate rows.
 * ============================================================
 */

window.PackageRepository = (function() {
    'use strict';

    var repo = null;

    /**
     * Get the Supabase repository instance for pricing_packages.
     * @returns {Object} The BaseRepository instance
     */
    function getRepo() {
        if (!repo) {
            var config = window.SupabaseConfig || {};
            repo = window.BaseRepository.create(
                (config.tables && config.tables.pricingPackages) || 'pricing_packages',
                function() { return []; }, // DB-only; no fabricated packages
                { cacheTTL: 300000 }
            );
        }
        return repo;
    }

    /**
     * Map a canonical package row to UI shape.
     * @param {Object} item - Raw database item
     * @returns {Object} Mapped item
     */
    function mapPackage(item) {
        if (!item) return null;
        return {
            id: item.id,
            page_id: item.page_id || '',
            package_name: item.package_name || '',
            description: item.description || null,
            price_amount: (item.price_amount !== null && item.price_amount !== undefined) ? Number(item.price_amount) : 0,
            price_currency: item.price_currency || 'KSH',
            price_period: item.price_period || 'per session',
            is_featured: item.is_featured === true,
            is_active: item.is_active === true,
            display_order: Number(item.display_order || 0)
        };
    }

    /**
     * Resolve media for package items (doesn't use media_id for packages currently).
     * @param {Array<Object>} rows - Package rows
     * @returns {Promise<Array>}
     */
    function resolvePackageMedia(rows) {
        // Packages don't use media_id - they are text-only commercial pricing cards
        return Promise.resolve(rows || []);
    }

    /**
     * Get all active packages (no page filter). Use this for admin display.
     * @returns {Promise<Array>} Array of mapped package objects
     */
    function getAll() {
        return getRepo().getAll({
            eq: [{ column: 'is_active', value: true }],
            orderBy: 'display_order',
            ascending: true
        }).then(function(data) {
            if (data && data.length > 0) {
                var mapped = data.map(mapPackage);
                return resolvePackageMedia(mapped);
            }
            return [];
        });
    }

    /**
     * Get active packages for a specific page.
     * @param {string} pageId - Page identifier (e.g., 'conference', 'vip')
     * @returns {Promise<Array>} Array of mapped package objects for that page
     */
    function getByPage(pageId) {
        if (!pageId) return Promise.resolve([]);
        return getRepo().getAll({
            eq: [{ column: 'is_active', value: true }, { column: 'page_id', value: pageId }],
            orderBy: 'display_order',
            ascending: true
        }).then(function(data) {
            if (data && data.length > 0) {
                var mapped = data.map(mapPackage);
                return resolvePackageMedia(mapped);
            }
            return [];
        });
    }

    return {
        getPackages: getAll,
        getByPage: getByPage,
        clearCache: function() {
            if (repo) repo.clearCache();
        }
    };
})();