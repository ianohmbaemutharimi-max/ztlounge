/**
 * ============================================================
 * ZT Lounge Meru - Contact Repository
 * Abstraction layer for contact page content
 * Version: 1.0.0
 * ============================================================
 * 
 * Public Interface:
 * - ContactRepository.getHero()
 * - ContactRepository.getContactInfo()
 * - ContactRepository.getTrustBadges()
 * 
 * Data Source: contact.config.js (Configuration file)
 * Future: Will return Supabase data without changing the interface
 * ============================================================
 */

window.ContactRepository = (function() {
    'use strict';

    /**
     * Get hero configuration for contact page
     * @returns {Object} Hero configuration
     */
    function getHero() {
        var config = window.ContactConfig || {};
        return config.hero || {};
    }

    /**
     * Get contact information
     * @returns {Object} Contact info configuration
     */
    function getContactInfo() {
        var config = window.ContactConfig || {};
        return config.contactInfo || {};
    }

    /**
     * Get trust badge data
     * @returns {Object} Trust badges configuration
     */
    function getTrustBadges() {
        var config = window.ContactConfig || {};
        return config.trustBadges || {};
    }

    // Public API
    return {
        getHero: getHero,
        getContactInfo: getContactInfo,
        getTrustBadges: getTrustBadges
    };
})();