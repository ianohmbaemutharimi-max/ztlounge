/**
 * ============================================================
 * ZT Lounge Meru - Forms
 * Handles booking + contact form submission to Supabase
 * Version: 1.0.0
 * ============================================================
 * Submits to Supabase bookings/contact_messages tables.
 * Falls back to WhatsApp if Supabase is unavailable.
 * ============================================================
 */

(function() {
    'use strict';

    /**
     * Submit a booking to Supabase via BookingRepository
     * @param {Object} data - Booking form data
     * @returns {Promise<Object>} Result
     */
    function submitBooking(data) {
        if (window.BookingRepository && window.BookingRepository.insert) {
            return window.BookingRepository.insert(data).then(function(result) {
                return { success: true, data: result };
            }).catch(function(error) {
                console.warn('[Forms] Supabase booking failed, falling back to WhatsApp:', error.message);
                return { success: false, error: error };
            });
        }
        return Promise.resolve({ success: false, error: new Error('BookingRepository not available') });
    }

    /**
     * Submit a contact message to Supabase
     * @param {Object} data - Contact form data
     * @returns {Promise<Object>} Result
     */
    function submitContact(data) {
        if (!window.supabaseClient) {
            return Promise.resolve({ success: false, error: new Error('Supabase client not initialized') });
        }
        return window.supabaseClient.from('contact_messages')
            .insert({
                full_name: data.fullName,
                phone: data.phone || null,
                email: data.email || null,
                subject: data.subject || null,
                message: data.message
            })
            .select()
            .single()
            .then(function(result) {
                if (result.error) throw result.error;
                return { success: true, data: result.data };
            })
            .catch(function(error) {
                console.warn('[Forms] Supabase contact failed:', error.message);
                return { success: false, error: error };
            });
    }

    /**
     * Build WhatsApp fallback URL
     * @param {string} phoneRaw - Raw phone number
     * @param {string} message - Message text
     * @returns {string} WhatsApp URL
     */
    function buildWhatsAppUrl(phoneRaw, message) {
        return 'https://wa.me/' + phoneRaw + '?text=' + encodeURIComponent(message);
    }

    /**
     * Validate a Kenyan phone number
     * Accepts +2547XXXXXXXX, 07XXXXXXXX, or 2547XXXXXXXX
     * @param {string} value - Phone number string
     * @returns {boolean} True if valid
     */
    function isValidKenyanPhone(value) {
        var cleaned = value.replace(/[\s\-()]/g, '');
        return /^(?:\+254|254|0)?7[0-9]{8}$/.test(cleaned);
    }

    /**
     * Validate an email address (if supplied)
     * @param {string} value - Email string
     * @returns {boolean} True if empty or valid
     */
    function isValidEmailOptional(value) {
        if (!value || !value.trim()) return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    }

    /**
     * Validate booking date is today or in the future
     * @param {string} dateValue - Date string (YYYY-MM-DD)
     * @param {string} timeValue - Optional time string (HH:MM)
     * @returns {boolean} True if valid
     */
    function isValidBookingDateTime(dateValue, timeValue) {
        if (!dateValue) return false;
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var date = new Date(dateValue + 'T00:00:00');
        if (isNaN(date.getTime())) return false;
        if (date < today) return false; // no past dates
        if (date.getTime() === today.getTime() && timeValue) {
            // Same day: time must be in the future
            var now = new Date();
            var timeParts = timeValue.split(':');
            var booking = new Date(now);
            booking.setHours(parseInt(timeParts[0], 10), parseInt(timeParts[1], 10), 0, 0);
            if (booking <= now) return false;
        }
        return true;
    }

    /**
     * Show an inline or alert error message
     * @param {Object} form - Form element
     * @param {string} message - Error message
     */
    function showError(form, message) {
        var errorEl = form.querySelector('.form-error-msg, #formError');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('visible');
            return;
        }
        alert(message);
    }

    /**
     * Initialize all forms on the page
     */
    function init() {
        // Restaurant reservation form
        var restaurantForm = document.getElementById('reservationForm');
        if (restaurantForm) {
            restaurantForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var form = this;
                var submitBtn = form.querySelector('button[type="submit"]');
                var originalText = submitBtn ? submitBtn.textContent : '';

                // Collect + validate ALL fields BEFORE disabling the button
                var name = form.querySelector('#fullName, [name="fullName"]');
                var phone = form.querySelector('#phoneNumber, [name="phoneNumber"]');
                var date = form.querySelector('#bookingDate, [name="bookingDate"]');
                var time = (form.querySelector('#bookingTime, [name="bookingTime"]') || {}).value || null;
                var emailVal = (form.querySelector('#email, [name="email"]') || {}).value || '';

                if (!name || !name.value.trim()) { showError(form, 'Please enter your full name.'); return; }
                if (!phone || !phone.value.trim()) { showError(form, 'Please enter your phone number.'); return; }
                if (!isValidKenyanPhone(phone.value.trim())) { showError(form, 'Please enter a valid Kenyan phone number (e.g. +254 7XX XXX XXX).'); return; }
                if (!isValidEmailOptional(emailVal)) { showError(form, 'Please enter a valid email address.'); return; }
                if (!date || !isValidBookingDateTime(date.value, time)) { showError(form, 'Please select a valid date in the future.'); return; }

                // Show loading state (only after validation passes)
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Submitting...';
                }

                var data = {
                    fullName: name.value.trim(),
                    phone: phone.value.trim(),
                    email: emailVal,
                    serviceId: null,
                    date: date.value,
                    time: time,
                    guests: parseInt((form.querySelector('#guestCount, [name="guestCount"]') || {}).value || '1', 10),
                    occasion: (form.querySelector('#occasion, [name="occasion"]') || {}).value || '',
                    specialRequests: (form.querySelector('#specialRequests, [name="specialRequests"]') || {}).value || ''
                };

                submitBooking(data).then(function(result) {
                    if (result.success) {
                        // Show success message
                        var successEl = form.querySelector('.form-success, #formSuccess');
                        if (successEl) successEl.classList.add('visible');
                        form.reset();
                    } else {
                        // Fallback to WhatsApp
                        var phoneRaw = (window.BusinessConfig && window.BusinessConfig.phoneRaw) || '254143542601';
                        var message = 'Hello ZT Lounge, I\'d like to make a booking:\n\n' +
                            'Name: ' + data.fullName + '\n' +
                            'Phone: ' + data.phone + '\n' +
                            'Date: ' + data.date + '\n' +
                            'Guests: ' + data.guests + '\n' +
                            (data.specialRequests ? 'Special Requests: ' + data.specialRequests : '');
                        window.open(buildWhatsAppUrl(phoneRaw, message), '_blank');
                    }

                    // Reset button
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalText;
                    }
                });
            });
        }

        // Contact form
        var contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var form = this;
                var submitBtn = form.querySelector('button[type="submit"]');
                var originalText = submitBtn ? submitBtn.textContent : '';

                var name = form.querySelector('#fullName, [name="fullName"]');
                var phone = form.querySelector('#phoneNumber, [name="phoneNumber"]');
                var email = form.querySelector('#email, [name="email"]');
                var message = form.querySelector('#specialRequests, [name="specialRequests"], textarea');

                if (!name || !name.value.trim() || !message || !message.value.trim()) {
                    alert('Please fill in your name and message.');
                    return;
                }

                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Sending...';
                }

                var data = {
                    fullName: name.value.trim(),
                    phone: phone ? phone.value.trim() : '',
                    email: email ? email.value.trim() : '',
                    subject: 'Website Contact Form',
                    message: message.value.trim()
                };

                submitContact(data).then(function(result) {
                    if (result.success) {
                        var successEl = form.querySelector('.form-success, #formSuccess');
                        if (successEl) successEl.classList.add('visible');
                        form.reset();
                    } else {
                        // Fallback to WhatsApp
                        var phoneRaw = (window.BusinessConfig && window.BusinessConfig.phoneRaw) || '254143542601';
                        var waMessage = 'Hello ZT Lounge, I\'d like to make an inquiry:\n\n' +
                            'Name: ' + data.fullName + '\n' +
                            'Phone: ' + data.phone + '\n' +
                            'Email: ' + data.email + '\n' +
                            'Message: ' + data.message;
                        window.open(buildWhatsAppUrl(phoneRaw, waMessage), '_blank');
                    }

                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalText;
                    }
                });
            });
        }
    }

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', init);
})();