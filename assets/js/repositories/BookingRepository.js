/**
 * ============================================================
 * ZT Lounge Meru - Booking Repository
 * Abstraction layer for booking configuration
 * Version: 1.0.0
 * ============================================================
 * 
 * Public Interface:
 * - BookingRepository.getGuestOptions()
 * - BookingRepository.getTimes(pageId)
 * - BookingRepository.getOccasions(pageId)
 * - BookingRepository.getServiceOptions()
 * - BookingRepository.getSuccessMessage(formType)
 * 
 * Data Source: booking.config.js (Configuration file)
 * Future: Will return Supabase data without changing the interface
 * ============================================================
 */

window.BookingRepository = (function() {
    'use strict';

    /**
     * Get guest count options
     * @returns {Array} Array of guest numbers
     */
    function getGuestOptions() {
        var config = window.BookingConfig || {};
        return config.guestOptions || [2, 4, 6, 8, 10];
    }

    /**
     * Get available times for a page/form type
     * @param {string} pageId - Page identifier (restaurant, lounge, etc.)
     * @returns {Array} Array of time strings
     */
    function getTimes(pageId) {
        var config = window.BookingConfig || {};
        var timesKey = pageId + 'Times';
        return config[timesKey] || config.restaurantTimes || [];
    }

    /**
     * Get occasion options for a page
     * @param {string} pageId - Page identifier
     * @returns {Array} Array of occasion options
     */
    function getOccasions(pageId) {
        var config = window.BookingConfig || {};
        var occasions = config.occasions || {};
        return occasions[pageId] || [];
    }

    /**
     * Get service options (for contact form)
     * @returns {Array} Array of service option objects
     */
    function getServiceOptions() {
        var config = window.BookingConfig || {};
        return config.serviceOptions || [];
    }

    /**
     * Get success message for a form type
     * @param {string} formType - Form identifier
     * @returns {string} Success message
     */
    function getSuccessMessage(formType) {
        var config = window.BookingConfig || {};
        var messages = config.successMessages || {};
        return messages[formType] || messages.contact || '';
    }

    // Public API
    return {
        getGuestOptions: getGuestOptions,
        getTimes: getTimes,
        getOccasions: getOccasions,
        getServiceOptions: getServiceOptions,
        getSuccessMessage: getSuccessMessage
    };
})();