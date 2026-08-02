/**
 * ============================================================
 * ZT Lounge Meru - SEO Repository
 * Abstraction layer for SEO metadata
 * Version: 1.0.0
 * ============================================================
 * 
 * Public Interface:
 * - SEORepository.getByPage(pageId)
 * - SEORepository.getTitle(pageId)
 * - SEORepository.getDescription(pageId)
 * 
 * Data Source: seo.config.js (Configuration file)
 * Future: Will return Supabase data without changing the interface
 * ============================================================
 */

window.SEORepository = (function() {
    'use strict';

    /**
     * Get SEO configuration for a specific page
     * @param {string} pageId - Page identifier
     * @returns {Object} SEO configuration
     */
    function getByPage(pageId) {
        var config = window.SeoConfig || {};
        return config[pageId] || { title: '', description: '' };
    }

    /**
     * Get page title for SEO
     * @param {string} pageId - Page identifier
     * @returns {string} Page title
     */
    function getTitle(pageId) {
        var config = getByPage(pageId);
        return config.title || '';
    }

    /**
     * Get page description for SEO
     * @param {string} pageId - Page identifier
     * @returns {string} Page description
     */
    function getDescription(pageId) {
        var config = getByPage(pageId);
        return config.description || '';
    }

    // Public API
    return {
        getByPage: getByPage,
        getTitle: getTitle,
        getDescription: getDescription
    };
})();