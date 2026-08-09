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
                // Real failure - do NOT claim success, do NOT redirect to WhatsApp as success.
                console.error('[Forms] Supabase booking failed:', error.message);
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
     * Normalize a Kenyan phone number to the +2547XXXXXXXX format.
     * @param {string} value - Phone number string
     * @returns {string} Normalized phone number
     */
    function normalizeKenyanPhone(value) {
        var cleaned = value.replace(/[\s\-()]/g, '');
        if (cleaned.indexOf('+') === 0) return cleaned; // already +254...
        if (cleaned.indexOf('254') === 0) return '+' + cleaned; // 2547... -> +2547...
        if (cleaned.indexOf('0') === 0) return '+254' + cleaned.slice(1); // 07... -> +2547...
        return '+' + cleaned; // 7... -> +2547...
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
     * Determine the service slug from the current page URL so BookingRepository
     * can resolve the correct service_id from the live services table.
     * @returns {string} Service slug
     */
    function getServiceSlug() {
        var path = window.location.pathname;
        // Page slug → database service slug mapping
        if (path.indexOf('lounge') !== -1) return 'lounge-bar';
        if (path.indexOf('vip') !== -1) return 'vip-cabins';
        if (path.indexOf('events') !== -1) return 'events';
        if (path.indexOf('conference') !== -1) return 'conference';
        if (path.indexOf('autospa') !== -1) return 'auto-spa';
        return 'restaurant';
    }

    /**
     * Bind a booking form to the BookingRepository submit flow.
     * @param {Object} form - Form element
     */
    function bindBookingForm(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var submitBtn = form.querySelector('button[type="submit"]');
            var originalText = submitBtn ? submitBtn.textContent : '';

            // Prevent double submission (client-side duplicate lock)
            if (form.dataset.submitting === 'true') return;
            form.dataset.submitting = 'true';

            // Honeypot: if a bot filled the hidden field, silently reject.
            var honeypot = form.querySelector('[name="website"], [name="company_website"], .honeypot');
            if (honeypot && honeypot.value) {
                form.dataset.submitting = 'false';
                return;
            }

            // Collect + validate ALL fields BEFORE disabling the button
            // (supports bookingDate/bookingTime, eventDate/eventTime, and conference attendees/duration naming)
            var name = form.querySelector('#fullName, [name="fullName"]');
            var phone = form.querySelector('#phoneNumber, [name="phoneNumber"]');
            var date = form.querySelector('#bookingDate, [name="bookingDate"], #eventDate, [name="eventDate"], #appointmentDate, [name="appointmentDate"]');
            var time = (form.querySelector('#bookingTime, [name="bookingTime"], #eventTime, [name="eventTime"]') || {}).value || null;
            var emailVal = (form.querySelector('#email, [name="email"]') || {}).value || '';
            // Conference and autospa forms have no time field - default to 09:00 (business hours)
            if (!time && (form.id === 'conferenceBookingForm' || form.id === 'autospaBookingForm')) {
                time = '09:00';
            }
            // Conference form uses attendees instead of guestCount
            var guestsEl = form.querySelector('#guestCount, [name="guestCount"], #attendees, [name="attendees"]');
            var guestsVal = guestsEl ? guestsEl.value : '1';
            // Conference duration select (informational; end_time derived from service duration)
            var durationVal = (form.querySelector('#duration, [name="duration"]') || {}).value || '';

            if (!name || !name.value.trim()) { showError(form, 'Please enter your full name.'); form.dataset.submitting = 'false'; return; }
            if (!phone || !phone.value.trim()) { showError(form, 'Please enter your phone number.'); form.dataset.submitting = 'false'; return; }
            if (!isValidKenyanPhone(phone.value.trim())) { showError(form, 'Please enter a valid Kenyan phone number (e.g. +254 7XX XXX XXX).'); form.dataset.submitting = 'false'; return; }
            if (!isValidEmailOptional(emailVal)) { showError(form, 'Please enter a valid email address.'); form.dataset.submitting = 'false'; return; }
            if (!date || !isValidBookingDateTime(date.value, time)) { showError(form, 'Please select a valid date in the future.'); form.dataset.submitting = 'false'; return; }

            // Show loading state (only after validation passes)
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Submitting...';
            }

            var data = {
                fullName: name.value.trim(),
                phone: normalizeKenyanPhone(phone.value.trim()),
                email: emailVal,
                serviceSlug: getServiceSlug(),
                date: date.value,
                time: time,
                guests: parseInt(guestsVal || '1', 10),
                occasion: (form.querySelector('#occasion, [name="occasion"]') || {}).value || '',
                specialRequests: (form.querySelector('#specialRequests, [name="specialRequests"]') || {}).value || ''
            };

            submitBooking(data).then(function(result) {
                if (result.success) {
                    // Show success message with the real booking reference
                    var successEl = form.querySelector('.form-success, #formSuccess');
                    if (successEl) {
                        var bookingRef = (result.data && result.data.booking && result.data.booking.booking_number) || '';
                        if (bookingRef) {
                            successEl.textContent = 'Thank you! Your booking reference is ' + bookingRef + '. We\'ll confirm within 30 minutes.';
                        } else {
                            successEl.textContent = 'Thank you! We\'ll confirm your reservation within 30 minutes.';
                        }
                        successEl.classList.add('visible');
                    }
                    form.reset();
                } else {
                    // Real failure - show a visible error, do NOT claim success.
                    var errorMsg = (result.error && result.error.message) ? result.error.message : 'We could not save your booking. Please try again or contact us.';
                    showError(form, errorMsg);
                }

                // Reset button + duplicate lock
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
                form.dataset.submitting = 'false';
            });
        });
    }

    /**
     * Initialize all forms on the page
     */
    function init() {
        // Bind ALL booking forms (restaurant, lounge, vip, events, conference, autospa)
        var bookingForms = document.querySelectorAll('#reservationForm, #loungeBookingForm, #vipBookingForm, #eventBookingForm, #conferenceBookingForm, #autospaBookingForm');
        bookingForms.forEach(function(form) {
            bindBookingForm(form);
        });

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