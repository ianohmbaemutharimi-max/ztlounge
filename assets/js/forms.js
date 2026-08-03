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

                // Basic validation
                var name = form.querySelector('#fullName, [name="fullName"]');
                var phone = form.querySelector('#phoneNumber, [name="phoneNumber"]');
                var date = form.querySelector('#bookingDate, [name="bookingDate"]');
                if (!name || !name.value.trim() || !phone || !phone.value.trim() || !date || !date.value) {
                    alert('Please fill in all required fields.');
                    return;
                }

                // Show loading state
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Submitting...';
                }

                var data = {
                    fullName: name.value.trim(),
                    phone: phone.value.trim(),
                    email: (form.querySelector('#email, [name="email"]') || {}).value || '',
                    serviceId: null,
                    date: date.value,
                    time: (form.querySelector('#bookingTime, [name="bookingTime"]') || {}).value || null,
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