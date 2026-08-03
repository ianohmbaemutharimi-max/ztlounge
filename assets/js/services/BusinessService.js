/**
 * ============================================================
 * ZT Lounge Meru - Business Service
 * Service layer for business data operations
 * Version: 1.0.0
 * ============================================================
 * 
 * Public Interface:
 * - BusinessService.getBusiness()
 * - BusinessService.getContact()
 * - BusinessService.getHours()
 * - BusinessService.getTrust()
 * - BusinessService.formatPhoneForWhatsApp()
 * 
 * Dependencies: BusinessRepository
 * Responsibilities: Validation, formatting, business rules
 * ============================================================
 */

window.BusinessService = (function() {
    'use strict';

    var repository = window.BusinessRepository;

    /**
     * Get full business configuration with validation
     * @returns {Promise<Object>} Validated business configuration
     */
    function getBusiness() {
        return repository.getBusiness().then(function(data) {
            if (!data || !data.name) {
                return { name: 'ZT Lounge Meru', phone: '+254 143 542 601' };
            }
            return data;
        });
    }

    /**
     * Get contact information with validation
     * @returns {Promise<Object>} Validated contact details
     */
    function getContact() {
        return repository.getContact().then(function(contact) {
            if (!contact) {
                return {};
            }
            return {
                phone: contact.phone || '',
                phoneRaw: contact.phoneRaw || formatPhoneRaw(contact.phone),
                email: contact.email || '',
                address: contact.address || {},
                social: contact.social || {}
            };
        });
    }

    /**
     * Get operating hours with formatting
     * @returns {Promise<Object>} Operating hours
     */
    function getHours() {
        return repository.getHours();
    }

    /**
     * Get trust badge data with validation
     * @returns {Promise<Object>} Validated trust metrics
     */
    function getTrust() {
        return repository.getTrust();
    }

    /**
     * Format phone number for WhatsApp link
     * @param {string} phone - Phone number
     * @returns {string} Formatted phone number
     */
    function formatPhoneForWhatsApp(phone) {
        if (!phone) return '';
        return phone.replace(/\D/g, '');
    }

    /**
     * Format raw phone from display format
     * @param {string} phone - Display phone format
     * @returns {string} Raw phone format
     */
    function formatPhoneRaw(phone) {
        if (!phone) return '';
        return phone.replace(/\D/g, '');
    }

    // Public API
    return {
        getBusiness: getBusiness,
        getContact: getContact,
        getHours: getHours,
        getTrust: getTrust,
        formatPhoneForWhatsApp: formatPhoneForWhatsApp
    };
})();