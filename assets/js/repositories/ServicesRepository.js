/**
 * ============================================================
 * ZT Lounge Meru - Services Repository
 * Abstraction layer for services section content
 * Version: 2.0.0
 * ============================================================
 * 
 * Public Interface:
 * - ServicesRepository.getByPage(pageId)
 * - ServicesRepository.getServices()
 * - ServicesRepository.getExperiences(pageId)
 * - ServicesRepository.getFeatures(pageId)
 * 
 * Data Source: Supabase (services table) with local config fallback
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
        // Return canonical database field names directly
        return {
            id: item.id,
            name: item.name || '',
            image_url: item.image_url || '',
            alt_text: item.alt_text || '',
            tag: item.tag || '',
            href: item.href || '',
            description: item.description || '',
            type: item.type || 'service',
            display_order: item.display_order || 0,
            page_id: item.page_id || '',
            icon: item.icon || ''
        };
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
        return getRepo().getAll({
            eq: [
                { column: 'page_id', value: pageId },
                { column: 'is_active', value: true }
            ],
            orderBy: 'display_order',
            ascending: true
        }).then(function(data) {
            if (data && data.length > 0) {
                var result = {};
                result.services = data.filter(function(s) { return s.type === 'service'; }).map(mapToUI);
                result.experiences = data.filter(function(s) { return s.type === 'experience'; }).map(mapToUI);
                result.features = data.filter(function(s) { return s.type === 'feature'; }).map(mapToUI);
                return result;
            }
            var config = window.ServicesConfig || {};
            return config[pageId] || {};
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

    return {
        getByPage: getByPage,
        getServices: getServices,
        getExperiences: getExperiences,
        getFeatures: getFeatures
    };
})();