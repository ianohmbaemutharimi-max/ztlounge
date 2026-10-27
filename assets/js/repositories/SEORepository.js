/**
 * ============================================================
 * ZT Lounge Meru - SEO Repository
 * Abstraction layer for SEO metadata
 * Version: 2.0.0
 * ============================================================
 * 
 * Public Interface:
 * - SEORepository.getByPage(pageId)     → Promise<{title, description}>
 * - SEORepository.getTitle(pageId)      → Promise<string>
 * - SEORepository.getDescription(pageId) → Promise<string>
 * 
 * Data Source: Supabase public.page_seo table (primary),
 *              static seo.config.js (fallback)
 * ============================================================
 */

window.SEORepository = (function() {
    'use strict';

    var repo = null;
    var configCache = {};

    function getRepo() {
        if (!repo) {
            var config = window.SupabaseConfig || {};
            var tableName = config.tables && config.tables.pageSeo
                ? config.tables.pageSeo
                : 'page_seo';
            repo = window.BaseRepository.create(
                tableName,
                function() { return []; }, // static fallback handled below
                { cacheTTL: 300000 }
            );
        }
        return repo;
    }

    /**
     * Get SEO configuration for a specific page from static config fallback
     * @param {string} pageId - Page identifier
     * @returns {Object} SEO configuration
     */
    function getFromStaticConfig(pageId) {
        var config = window.SeoConfig || {};
        return config[pageId] || { title: '', description: '' };
    }

    /**
     * Get SEO configuration for a specific page
     * @param {string} pageId - Page identifier
     * @returns {Promise<Object>} SEO configuration {title, description}
     */
    function getByPage(pageId) {
        // Return cached static result if available
        if (configCache[pageId]) {
            return Promise.resolve(configCache[pageId]);
        }

        return getRepo()
            .getByColumn('page_id', pageId)
            .then(function(rows) {
                var row = (rows && rows.length > 0) ? rows[0] : null;
                if (row && row.is_active !== false) {
                    var result = {
                        title: row.title || '',
                        description: row.description || ''
                    };
                    configCache[pageId] = result;
                    return result;
                }
                // Fallback to static config
                var fallback = getFromStaticConfig(pageId);
                configCache[pageId] = fallback;
                return fallback;
            })
            .catch(function(err) {
                console.warn('[SEORepository] Supabase query failed, using static config:', err.message);
                var fallback = getFromStaticConfig(pageId);
                configCache[pageId] = fallback;
                return fallback;
            });
    }

    /**
     * Get page title for SEO
     * @param {string} pageId - Page identifier
     * @returns {Promise<string>} Page title
     */
    function getTitle(pageId) {
        return getByPage(pageId).then(function(config) {
            return config.title || '';
        });
    }

    /**
     * Get page description for SEO
     * @param {string} pageId - Page identifier
     * @returns {Promise<string>} Page description
     */
    function getDescription(pageId) {
        return getByPage(pageId).then(function(config) {
            return config.description || '';
        });
    }

    // Public API
    return {
        getByPage: getByPage,
        getTitle: getTitle,
        getDescription: getDescription,
        clearCache: function() {
            configCache = {};
            if (repo) repo.clearCache();
        }
    };
})();
