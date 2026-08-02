/**
 * Form Handling
 * Handles all booking/reservation forms across the site
 * Supports: reservationForm, loungeBookingForm, contactForm, vipBookingForm, eventBookingForm, conferenceBookingForm, autospaBookingForm
 */
(function() {
    'use strict';
    
    /**
     * Submit form data to Supabase for persistence
     * Falls back gracefully if Supabase is unavailable
     * @param {HTMLElement} form - The form element
     * @param {string} formId - The form identifier
     */
    function submitToSupabase(form, formId) {
        var client = null;
        try {
            client = window.SupabaseClient && window.SupabaseClient.getClient();
            if (!client) return; // Silent fallback
        } catch (e) {
            return; // Graceful fallback
        }

        // Use correct table names from SupabaseConfig
        var tableName = window.SupabaseConfig && window.SupabaseConfig.tables ? 
            window.SupabaseConfig.tables.contactMessages : 'contact_messages';
        var isBooking = formId !== 'contactForm';
        if (isBooking) {
            tableName = window.SupabaseConfig && window.SupabaseConfig.tables ? 
                window.SupabaseConfig.tables.bookings : 'bookings';
        }

        // Gather form data
        var formData = {
            name: (form.querySelector('#fullName') || {}).value || '',
            email: (form.querySelector('#email') || {}).value || '',
            phone: (form.querySelector('#phoneNumber') || {}).value || '',
            service: getSelectValue(form.querySelector('#service')),
            guests: (form.querySelector('#guestCount') || {}).value || null,
            date: (form.querySelector('#bookingDate') || form.querySelector('#eventDate') || form.querySelector('#appointmentDate') || {}).value || null,
            time: getSelectValue(form.querySelector('#bookingTime')) || (form.querySelector('#appointmentTime') || {}).value || null,
            occasion: getSelectValue(form.querySelector('#occasion')),
            special_requests: (form.querySelector('#specialRequests') || {}).value || '',
            form_type: formId,
            source: window.location.pathname
        };

        // Only submit if we have at least a name
        if (!formData.name && !formData.phone) return;

        client.from(tableName).insert([formData]).select().then(function(result) {
            if (result.error) {
                console.warn('[Forms] Supabase insert failed:', result.error.message);
            }
        }).catch(function(err) {
            // Silent catch - WhatsApp is the primary channel
            console.warn('[Forms] Supabase submission error:', err.message);
        });
    }

    /**
     * Safely get selected value from a select element
     * @param {HTMLElement|null} selectEl
     * @returns {string}
     */
    function getSelectValue(selectEl) {
        if (!selectEl || !selectEl.options) return '';
        return selectEl.options[selectEl.selectedIndex] ? selectEl.options[selectEl.selectedIndex].text : '';
    }
    
    document.addEventListener('DOMContentLoaded', function() {
        var formIds = [
            'reservationForm', 
            'loungeBookingForm', 
            'contactForm', 
            'vipBookingForm', 
            'eventBookingForm', 
            'conferenceBookingForm', 
            'autospaBookingForm'
        ];
        
        formIds.forEach(function(formId) {
            var form = document.getElementById(formId);
            if (!form) return;
            
            // Handle different date input IDs for different forms
            var dateInput = form.querySelector('#bookingDate') || form.querySelector('#eventDate') || form.querySelector('#appointmentDate');
            
            // Set default date to tomorrow
            if (dateInput) {
                var tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                dateInput.value = tomorrow.toISOString().split('T')[0];
            }
            
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Reset previous errors
                form.querySelectorAll('.form-error').forEach(function(el) {
                    el.classList.remove('visible');
                });
                form.querySelectorAll('.form-input, .form-select').forEach(function(el) {
                    el.classList.remove('error');
                });
                var successEl = form.querySelector('#formSuccess');
                if (successEl) successEl.classList.remove('visible');
                
                var isValid = true;
                
                // Validate name (if exists on form)
                var name = form.querySelector('#fullName');
                if (name && !name.value.trim()) {
                    var nameError = form.querySelector('#fullNameError');
                    if (nameError) nameError.classList.add('visible');
                    name.classList.add('error');
                    isValid = false;
                }
                
                // Validate phone
                var phone = form.querySelector('#phoneNumber');
                if (phone && (!phone.value.trim() || phone.value.trim().length < 8)) {
                    var phoneError = form.querySelector('#phoneError');
                    if (phoneError) phoneError.classList.add('visible');
                    phone.classList.add('error');
                    isValid = false;
                }
                
                // Validate service/event type/cabin package (various forms)
                var serviceType = form.querySelector('#service') || form.querySelector('#eventType') || form.querySelector('#cabinPackage');
                if (serviceType && serviceType.hasAttribute('required') && !serviceType.value) {
                    var serviceError = form.querySelector('#serviceError') || form.querySelector('#eventTypeError') || form.querySelector('#packageError');
                    if (serviceError) serviceError.classList.add('visible');
                    serviceType.classList.add('error');
                    isValid = false;
                }
                
                // Validate guests/attendees/vehicle type
                var guestSelector = form.querySelector('#guestCount') || form.querySelector('#attendees') || form.querySelector('#vehicleType');
                if (guestSelector && guestSelector.hasAttribute('required') && !guestSelector.value) {
                    var guestError = form.querySelector('#guestError') || form.querySelector('#attendeesError') || form.querySelector('#vehicleError');
                    if (guestError) guestError.classList.add('visible');
                    guestSelector.classList.add('error');
                    isValid = false;
                }
                
                // Validate date
                var date = form.querySelector('#bookingDate') || form.querySelector('#eventDate') || form.querySelector('#appointmentDate');
                if (date && date.hasAttribute('required') && !date.value) {
                    var dateError = form.querySelector('#dateError');
                    if (dateError) dateError.classList.add('visible');
                    date.classList.add('error');
                    isValid = false;
                }
                
                // Validate time (including appointmentTime for autospa)
                var time = form.querySelector('#bookingTime') || form.querySelector('#eventTime') || form.querySelector('#appointmentTime') || form.querySelector('#time');
                if (time && time.nodeName === 'SELECT' && time.hasAttribute('required') && !time.value) {
                    var timeError = form.querySelector('#timeError') || form.querySelector('#durationError');
                    if (timeError) timeError.classList.add('visible');
                    time.classList.add('error');
                    isValid = false;
                }
                
                // Validate duration (conference specific)
                var durationEl = form.querySelector('#duration');
                if (durationEl && durationEl.hasAttribute('required') && !durationEl.value) {
                    var durationError = form.querySelector('#durationError');
                    if (durationError) durationError.classList.add('visible');
                    durationEl.classList.add('error');
                    isValid = false;
                }
                
                if (!isValid) {
                    var firstError = form.querySelector('.form-error.visible');
                    if (firstError) {
                        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    return;
                }
                
                // Submit to Supabase (if available) for data persistence
                submitToSupabase(form, formId);
                
                // Build WhatsApp message based on form type
                var message = '';
                
                if (formId === 'reservationForm') {
                    message = 'Hello ZT Lounge, I\'d like to make a table reservation:%0A%0A';
                } else if (formId === 'loungeBookingForm') {
                    message = 'Hello ZT Lounge, I\'d like to reserve a table at the lounge:%0A%0A';
                } else if (formId === 'contactForm') {
                    message = 'Hello ZT Lounge, I\'d like to make a booking:%0A%0A';
                } else if (formId === 'vipBookingForm') {
                    message = 'Hello ZT Lounge, I\'d like to book a VIP cabin:%0A%0A';
                } else if (formId === 'eventBookingForm') {
                    message = 'Hello ZT Lounge, I\'d like to plan an event:%0A%0A';
                } else if (formId === 'conferenceBookingForm') {
                    message = 'Hello ZT Lounge, I\'d like to inquire about the conference hall:%0A%0A';
                } else if (formId === 'autospaBookingForm') {
                    message = 'Hello ZT Lounge, I\'d like to book an auto spa appointment:%0A%0A';
                }
                
                if (name) message += 'Name: ' + name.value.trim() + '%0A';
                
                var email = form.querySelector('#email');
                if (email) message += 'Email: ' + (email.value.trim() || 'Not provided') + '%0A';
                
                if (phone) message += 'Phone: ' + phone.value.trim() + '%0A';
                
                if (serviceType && serviceType.options[serviceType.selectedIndex]) {
                    message += 'Service: ' + serviceType.options[serviceType.selectedIndex].text + '%0A';
                }
                
                if (guestSelector && guestSelector.options[guestSelector.selectedIndex]) {
                    var guestText = guestSelector.options[guestSelector.selectedIndex].text;
                    message += 'Guests: ' + guestText + '%0A';
                }
                
                var occasionEl = form.querySelector('#occasion');
                if (occasionEl && occasionEl.options[occasionEl.selectedIndex]) {
                    message += 'Occasion: ' + occasionEl.options[occasionEl.selectedIndex].text + '%0A';
                }
                
                if (date) message += 'Date: ' + date.value + '%0A';
                
                var timeValue = '';
                if (time && time.nodeName === 'SELECT') {
                    timeValue = time.options[time.selectedIndex] ? time.options[time.selectedIndex].text : time.value;
                } else if (time) {
                    timeValue = time.value || 'Not specified';
                }
                message += 'Time: ' + (timeValue || 'Not specified') + '%0A';
                
                if (durationEl && durationEl.value && durationEl.options[durationEl.selectedIndex]) {
                    message += 'Duration: ' + durationEl.options[durationEl.selectedIndex].text + '%0A';
                }
                
                var specialRequests = form.querySelector('#specialRequests');
                message += 'Special Requests: ' + (specialRequests ? (specialRequests.value.trim() || 'None') : 'None');
                
                var whatsappUrl = 'https://wa.me/254143542601?text=' + encodeURIComponent(message.replace(/%0A/g, '\n'));
                
                // Show success message
                if (successEl) successEl.classList.add('visible');
                
                // Open WhatsApp and reset form
                setTimeout(function() {
                    window.open(whatsappUrl, '_blank');
                    setTimeout(function() {
                        form.reset();
                        if (successEl) successEl.classList.remove('visible');
                        if (dateInput) {
                            var tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            dateInput.value = tomorrow.toISOString().split('T')[0];
                        }
                    }, 3000);
                }, 1000);
            });
        });
    });
})();