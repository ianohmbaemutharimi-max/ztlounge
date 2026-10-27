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
     * Generate a unique booking reference (e.g. ZT-8F3K2M9Q).
     * @returns {string} Booking reference
     */
    function generateBookingNumber() {
        var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
        var ref = '';
        for (var i = 0; i < 8; i++) {
            ref += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return 'ZT-' + ref;
    }

    /**
     * Resolve a service by slug from the live services table.
     * @param {Object} client - Supabase client
     * @param {string} slug - Service slug (restaurant, lounge, vip, events, conference, autospa)
     * @returns {Promise<{id: string, duration_minutes: number}>}
     */
    function resolveService(client, slug) {
        return client.from('services')
            .select('id, duration_minutes')
            .eq('slug', slug)
            .eq('is_active', true)
            .maybeSingle()
            .then(function(result) {
                if (result.error) throw result.error;
                if (!result.data) {
                    throw new Error('Service not found for slug: ' + slug);
                }
                return { id: result.data.id, duration_minutes: result.data.duration_minutes || 60 };
            });
    }

    /**
     * Add minutes to a "HH:MM" time string.
     * @param {string} time - "HH:MM" 24-hour
     * @param {number} minutes - Minutes to add
     * @returns {string} "HH:MM" 24-hour
     */
    function addMinutes(time, minutes) {
        var parts = String(time).split(':');
        var h = parseInt(parts[0], 10) || 0;
        var m = parseInt(parts[1], 10) || 0;
        var total = h * 60 + m + minutes;
        total = ((total % 1440) + 1440) % 1440; // wrap around midnight
        var hh = String(Math.floor(total / 60)).padStart(2, '0');
        var mm = String(total % 60).padStart(2, '0');
        return hh + ':' + mm;
    }

    /**
     * Check whether the requested time slot overlaps an existing non-cancelled booking.
     * @param {Object} client - Supabase client
     * @param {string} date - Booking date (YYYY-MM-DD)
     * @param {string} startTime - "HH:MM" start
     * @param {string} endTime - "HH:MM" end
     * @returns {Promise<string|null>} Error message if a clash exists, otherwise null
     */
    function checkAvailability(client, date, startTime, endTime) {
        // Overlap condition: existing.start_time < requested.end_time AND existing.end_time > requested.start_time
        return client.from('bookings')
            .select('booking_number, start_time, end_time')
            .eq('booking_date', date)
            .lt('start_time', endTime)
            .gt('end_time', startTime)
            .neq('status', 'cancelled')
            .limit(5)
            .then(function(result) {
                if (result.error) throw result.error;
                if (result.data && result.data.length > 0) {
                    var clash = result.data[0];
                    return 'The requested time slot (' + startTime + 'â€“' + endTime + ') is already booked (ref ' + clash.booking_number + '). Please choose another time.';
                }
                return null;
            });
    }

    /**
     * Insert a booking into Supabase atomically via the create_booking RPC.
     * The RPC handles: service resolution, availability check, customer find/create,
     * booking_number generation, end_time derivation, and booking insert â€” all in one transaction.
     * @param {Object} data - { fullName, email, phone, serviceSlug, date, time, guests, occasion, specialRequests }
     * @returns {Promise<Object>} { customerId, booking }
     */
    function insert(data) {
        if (!window.supabaseClient) {
            return Promise.reject(new Error('Supabase client not initialized'));
        }

        var client = window.supabaseClient;
        var serviceSlug = data.serviceSlug || 'restaurant';
        var startTime = data.time || '12:00';

        // The create_booking RPC has no dedicated occasion parameter/column,
        // so merge the occasion into special_requests to preserve the input.
        var specialRequests = data.specialRequests || '';
        if (data.occasion) {
            var occasionText = 'Occasion: ' + data.occasion;
            specialRequests = specialRequests
                ? specialRequests + ' | ' + occasionText
                : occasionText;
        }

        // Call the atomic RPC. All validation, availability, customer creation,
        // and booking insertion happen inside a single DB transaction.
        return client.rpc('create_booking', {
            p_full_name: data.fullName,
            p_phone: data.phone,
            p_booking_date: data.date,
            p_start_time: startTime,
            p_guests: data.guests || 1,
            p_email: data.email || null,
            p_service_slug: serviceSlug,
            p_special_requests: specialRequests || null
        }).then(function(result) {
            if (result.error) throw result.error;
            if (!result.data) throw new Error('Booking creation failed: no data returned');

            var booking = result.data;
            return {
                customerId: booking.customer_id,
                booking: {
                    id: booking.booking_id,
                    booking_number: booking.booking_number,
                    customer_id: booking.customer_id,
                    service_id: booking.service_id,
                    booking_date: booking.booking_date,
                    start_time: booking.start_time,
                    end_time: booking.end_time,
                    guests: booking.guests,
                    status: booking.status
                }
            };
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
