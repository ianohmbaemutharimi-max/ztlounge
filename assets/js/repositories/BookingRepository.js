/**
 * ============================================================
 * ZT Lounge Meru - Booking Repository
 * Abstraction layer for booking configuration + submission
 * Version: 2.0.0
 * ============================================================
 *
 * Public Interface:
 * - BookingRepository.getGuestOptions()
 * - BookingRepository.getTimes(pageId)
 * - BookingRepository.getOccasions(pageId)
 * - BookingRepository.getServiceOptions()
 * - BookingRepository.getSuccessMessage(formType)
 * - BookingRepository.insert(bookingData)
 *
 * Data Source: Supabase (customers + bookings tables) with local config fallback
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

    /**
     * Insert a booking into Supabase.
     * Creates/links a customer, then inserts the booking.
     * @param {Object} data - { fullName, email, phone, serviceId, date, time, guests, occasion, specialRequests }
     * @returns {Promise<Object>} { customer, booking }
     */
    function insert(data) {
        if (!window.supabaseClient) {
            return Promise.reject(new Error('Supabase client not initialized'));
        }

        var client = window.supabaseClient;

        // Step 1: Find or create customer
        return client.from('customers')
            .select('id')
            .eq('phone', data.phone)
            .maybeSingle()
            .then(function(customerResult) {
                if (customerResult.error) throw customerResult.error;

                if (customerResult.data) {
                    return customerResult.data.id;
                }

                // Create new customer
                return client.from('customers')
                    .insert({
                        full_name: data.fullName,
                        phone: data.phone,
                        email: data.email || null
                    })
                    .select('id')
                    .single()
                    .then(function(insertResult) {
                        if (insertResult.error) throw insertResult.error;
                        return insertResult.data.id;
                    });
            })
            .then(function(customerId) {
                // Step 2: Insert booking
                return client.from('bookings')
                    .insert({
                        customer_id: customerId,
                        service_id: data.serviceId || null,
                        booking_date: data.date,
                        start_time: data.time || null,
                        guests: data.guests || 1,
                        status: 'pending',
                        special_requests: data.specialRequests || null
                    })
                    .select()
                    .single()
                    .then(function(bookingResult) {
                        if (bookingResult.error) throw bookingResult.error;
                        return { customerId: customerId, booking: bookingResult.data };
                    });
            });
    }

    // Public API
    return {
        getGuestOptions: getGuestOptions,
        getTimes: getTimes,
        getOccasions: getOccasions,
        getServiceOptions: getServiceOptions,
        getSuccessMessage: getSuccessMessage,
        insert: insert
    };
})();