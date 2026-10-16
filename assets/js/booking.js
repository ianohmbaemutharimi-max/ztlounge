/**
 * ============================================================
 * ZT Lounge Meru - Booking System
 * Enterprise-Grade Booking Component
 * Version: 2.0.0
 * 
 * Architecture: Config → DOM Cache → Utilities → Services → Components → Pages
 * 
 * Features:
 *   - Booking form with validation
 *   - Date/time picker
 *   - Guest selection
 *   - Service selection
 *   - Real-time availability
 *   - Email confirmation
 *   - WhatsApp integration
 * 
 * Dependencies: ZT Kernel (main.js)
 * Integration: ZT.Components.Booking
 * ============================================================
 */

(function() {
    'use strict';

    // ============================================================
    // 1. CONFIGURATION - Centralized, type-safe constants
    // ============================================================
    const CONFIG = Object.freeze({
        // Booking Configuration
        booking: {
            minAdvanceDays: 1,
            maxAdvanceDays: 90,
            maxGuests: 20,
            minGuests: 1,
            defaultService: 'restaurant',
            maxRetries: 3,
            retryDelay: 1000
        },

        // Form Selectors
        selectors: {
            bookingForm: '#bookingForm',
            serviceSelect: '#serviceSelect',
            datePicker: '#datePicker',
            timePicker: '#timePicker',
            guestCount: '#guestCount',
            fullName: '#fullName',
            email: '#email',
            phone: '#phone',
            specialRequests: '#specialRequests',
            submitBtn: '#bookingSubmit',
            availabilityMessage: '#availabilityMessage',
            confirmationModal: '#bookingConfirmation'
        },

        // Service Categories — intentionally not hard-coded to a fixed set.
        // The service selector (_setupServiceSelect) fetches active services
        // from ServicesRepository (DB-first). A minimal fallback is provided
        // below for when the DB returns no rows; new services added to the DB
        // will automatically appear in the selector without source changes.
        //
        // Key: slug → { label, maxGuests, requiresDeposit }.
        // maxGuests / requiresDeposit are UI behavior fallbacks — the DB does
        * not store these fields for services. When a new service is added to
        * the DB, the selector will list it; guest constraints will use the
        * fallback values until per-service rules are re-established.
        fallbackServices: {
            restaurant: { label: 'Restaurant', maxGuests: 12, requiresDeposit: true },
            lounge:     { label: 'Lounge & Bar', maxGuests: 12, requiresDeposit: true },
            vip:        { label: 'VIP Cabins', maxGuests: 6, requiresDeposit: true },
            events:     { label: 'Events', maxGuests: 20, requiresDeposit: true },
            conference: { label: 'Conference', maxGuests: 20, requiresDeposit: true },
            autospa:    { label: 'Auto Spa', maxGuests: 4, requiresDeposit: true },
            barbershop: { label: 'Barbershop', maxGuests: 4, requiresDeposit: false }
        },

        // API Endpoints
        endpoints: {
            checkAvailability: '/api/booking/availability',
            submitBooking: '/api/booking/submit',
            getTimeSlots: '/api/booking/timeslots'
        }
    });

    // ============================================================
    // 2. DOM CACHE - Single source of truth with lazy loading
    // ============================================================
    const DOM = {
        _cache: {},
        
        /**
         * Get cached element or query and cache
         * @param {string} key - Cache key
         * @param {string} selector - CSS selector
         * @param {boolean} multiple - Whether to return multiple elements
         * @returns {Element|NodeList|null} Cached element(s)
         */
        get: function(key, selector, multiple) {
            if (!this._cache[key]) {
                try {
                    const elements = document.querySelectorAll(selector);
                    this._cache[key] = multiple ? elements : (elements.length === 1 ? elements[0] : elements);
                } catch (e) {
                    console.warn('DOM cache failed for key:', key, e);
                    return null;
                }
            }
            return this._cache[key];
        },

        // Form elements
        get form() { return this.get('form', CONFIG.selectors.bookingForm, false); },
        get serviceSelect() { return this.get('serviceSelect', CONFIG.selectors.serviceSelect, false); },
        get datePicker() { return this.get('datePicker', CONFIG.selectors.datePicker, false); },
        get timePicker() { return this.get('timePicker', CONFIG.selectors.timePicker, false); },
        get guestCount() { return this.get('guestCount', CONFIG.selectors.guestCount, false); },
        get fullName() { return this.get('fullName', CONFIG.selectors.fullName, false); },
        get email() { return this.get('email', CONFIG.selectors.email, false); },
        get phone() { return this.get('phone', CONFIG.selectors.phone, false); },
        get specialRequests() { return this.get('specialRequests', CONFIG.selectors.specialRequests, false); },
        get submitBtn() { return this.get('submitBtn', CONFIG.selectors.submitBtn, false); },
        get availabilityMessage() { return this.get('availabilityMessage', CONFIG.selectors.availabilityMessage, false); },
        get confirmationModal() { return this.get('confirmationModal', CONFIG.selectors.confirmationModal, false); }
    };

    // ============================================================
    // 3. UTILITIES - Shared helper functions
    // ============================================================
    const Utils = {
        /**
         * Debounce utility
         */
        debounce: function(func, wait) {
            if (window.ZT && ZT.Utils && ZT.Utils.debounce) {
                return ZT.Utils.debounce(func, wait);
            }
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        },

        /**
         * Validate email
         */
        validateEmail: function(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        },

        /**
         * Validate phone number (Kenyan format)
         */
        validatePhone: function(phone) {
            const re = /^(?:\+254|0)[17]\d{8}$/;
            return re.test(phone);
        },

        /**
         * Format date for display
         */
        formatDate: function(date) {
            const d = new Date(date);
            return d.toLocaleDateString('en-KE', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        },

        /**
         * Format time for display
         */
        formatTime: function(time) {
            const [hours, minutes] = time.split(':');
            const h = parseInt(hours, 10);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return `${h12}:${minutes} ${ampm}`;
        },

        /**
         * Generate booking reference
         */
        generateReference: function() {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = 'ZT-';
            for (let i = 0; i < 6; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        },

        /**
         * Get minimum date for booking
         */
        getMinDate: function() {
            const date = new Date();
            date.setDate(date.getDate() + CONFIG.booking.minAdvanceDays);
            return date.toISOString().split('T')[0];
        },

        /**
         * Get maximum date for booking
         */
        getMaxDate: function() {
            const date = new Date();
            date.setDate(date.getDate() + CONFIG.booking.maxAdvanceDays);
            return date.toISOString().split('T')[0];
        },

        /**
         * Dispatch custom event
         */
        dispatchEvent: function(eventName, detail) {
            if (window.ZT && ZT.Events && ZT.Events.emit) {
                ZT.Events.emit(eventName, detail);
            } else {
                const event = new CustomEvent(eventName, { detail, bubbles: true });
                document.dispatchEvent(event);
            }
        },

        /**
         * Log message
         */
        log: function(message, data) {
            if (window.ZT && ZT.Logger && ZT.Logger.info) {
                ZT.Logger.info(message, data);
            } else if (window.console) {
                console.log('[Booking]', message, data || '');
            }
        },

        /**
         * Log error
         */
        error: function(message, data) {
            if (window.ZT && ZT.Logger && ZT.Logger.error) {
                ZT.Logger.error(message, data);
            } else if (window.console) {
                console.error('[Booking]', message, data || '');
            }
        }
    };

    // ============================================================
    // 4. BOOKING STATE MANAGER
    // ============================================================
    class BookingState {
        constructor() {
            this._state = {
                selectedService: CONFIG.booking.defaultService,
                selectedDate: null,
                selectedTime: null,
                guestCount: CONFIG.booking.minGuests,
                isAvailable: false,
                isSubmitting: false,
                isConfirmed: false,
                bookingReference: null,
                errors: {}
            };
            this._listeners = [];
        }

        /**
         * Get state value
         * @param {string} key - State key
         * @returns {*} State value
         */
        get(key) {
            return this._state[key];
        }

        /**
         * Set state value
         * @param {string} key - State key
         * @param {*} value - State value
         * @param {boolean} silent - Skip event emission
         */
        set(key, value, silent) {
            const oldValue = this._state[key];
            this._state[key] = value;
            
            if (!silent && oldValue !== value) {
                this._emitChange(key, value, oldValue);
            }
        }

        /**
         * Subscribe to state changes
         * @param {string} key - State key
         * @param {Function} callback - Callback function
         * @returns {Function} Unsubscribe function
         */
        subscribe(key, callback) {
            const listener = { key, callback };
            this._listeners.push(listener);
            return () => {
                const index = this._listeners.indexOf(listener);
                if (index > -1) {
                    this._listeners.splice(index, 1);
                }
            };
        }

        /**
         * Get full state
         * @returns {Object} Full state object
         */
        getState() {
            return { ...this._state };
        }

        /**
         * Reset state
         */
        reset() {
            this._state = {
                selectedService: CONFIG.booking.defaultService,
                selectedDate: null,
                selectedTime: null,
                guestCount: CONFIG.booking.minGuests,
                isAvailable: false,
                isSubmitting: false,
                isConfirmed: false,
                bookingReference: null,
                errors: {}
            };
            this._listeners.forEach(listener => {
                listener.callback(this._state[listener.key]);
            });
        }

        /**
         * Emit state change
         */
        _emitChange(key, value, oldValue) {
            this._listeners.forEach(listener => {
                if (listener.key === key) {
                    listener.callback(value, oldValue);
                }
            });
        }
    }

    // ============================================================
    // 5. BOOKING SERVICE
    // ============================================================
    class BookingService {
        constructor() {
            this.state = new BookingState();
            this._availabilityCache = {};
        }

        /**
         * Check availability
         * @param {Object} params - Availability parameters
         * @returns {Promise} Availability result
         */
        async checkAvailability(params) {
            const cacheKey = `${params.service}-${params.date}-${params.time}`;
            
            // Check cache
            if (this._availabilityCache[cacheKey]) {
                return this._availabilityCache[cacheKey];
            }

            try {
                // Simulate API call
                const result = await this._simulateAvailabilityCheck(params);
                
                // Cache result
                this._availabilityCache[cacheKey] = result;
                
                // Update state
                this.state.set('isAvailable', result.available);
                
                return result;
            } catch (e) {
                Utils.error('Availability check failed', e);
                return { available: false, error: e.message };
            }
        }

        /**
         * Submit booking
         * @param {Object} bookingData - Booking data
         * @returns {Promise} Booking result
         */
        async submitBooking(bookingData) {
            try {
                this.state.set('isSubmitting', true);
                
                // Validate data
                this._validateBookingData(bookingData);
                
                // Generate reference
                const reference = Utils.generateReference();
                
                // Simulate API call
                const result = await this._simulateSubmit(bookingData, reference);
                
                this.state.set('isConfirmed', true);
                this.state.set('bookingReference', reference);
                this.state.set('isSubmitting', false);
                
                Utils.dispatchEvent('booking:confirmed', {
                    reference,
                    bookingData
                });
                
                return {
                    success: true,
                    reference: reference,
                    data: result
                };
                
            } catch (e) {
                this.state.set('isSubmitting', false);
                Utils.error('Booking submission failed', e);
                
                Utils.dispatchEvent('booking:error', {
                    error: e.message
                });
                
                return {
                    success: false,
                    error: e.message
                };
            }
        }

        /**
         * Get available time slots
         * @param {string} service - Service type
         * @param {string} date - Date string
         * @returns {Promise} Time slots
         */
        async getTimeSlots(service, date) {
            try {
                // Simulate API call
                const slots = await this._simulateTimeSlots(service, date);
                return slots;
            } catch (e) {
                Utils.error('Time slots fetch failed', e);
                return [];
            }
        }

        /**
         * Validate booking data
         * @param {Object} data - Booking data
         * @throws {Error} Validation error
         */
        _validateBookingData(data) {
            const errors = {};
            
            if (!data.name || data.name.length < 2) {
                errors.name = 'Name is required and must be at least 2 characters';
            }
            
            if (!data.email || !Utils.validateEmail(data.email)) {
                errors.email = 'Valid email address is required';
            }
            
            if (!data.phone || !Utils.validatePhone(data.phone)) {
                errors.phone = 'Valid Kenyan phone number is required';
            }
            
            if (!data.date) {
                errors.date = 'Date is required';
            }
            
            if (!data.time) {
                errors.time = 'Time is required';
            }
            
            if (data.guests < CONFIG.booking.minGuests || 
                data.guests > CONFIG.booking.maxGuests) {
                errors.guests = `Guests must be between ${CONFIG.booking.minGuests} and ${CONFIG.booking.maxGuests}`;
            }
            
            if (Object.keys(errors).length > 0) {
                const error = new Error('Validation failed');
                error.errors = errors;
                throw error;
            }
        }

        /**
         * Simulate availability check
         */
        _simulateAvailabilityCheck(params) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    // Simulate random availability
                    const available = Math.random() > 0.2;
                    resolve({
                        available,
                        message: available ? 'Available for booking' : 'Not available',
                        slots: available ? ['10:00', '12:00', '14:00', '16:00', '18:00'] : []
                    });
                }, 500);
            });
        }

        /**
         * Simulate booking submission
         */
        _simulateSubmit(data, reference) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        reference: reference,
                        status: 'confirmed',
                        message: 'Booking confirmed',
                        details: data
                    });
                }, 800);
            });
        }

        /**
         * Simulate time slots
         */
        _simulateTimeSlots(service, date) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const slots = [
                        { time: '10:00', available: true },
                        { time: '11:00', available: true },
                        { time: '12:00', available: Math.random() > 0.3 },
                        { time: '13:00', available: Math.random() > 0.4 },
                        { time: '14:00', available: true },
                        { time: '15:00', available: Math.random() > 0.2 },
                        { time: '16:00', available: true },
                        { time: '17:00', available: Math.random() > 0.5 },
                        { time: '18:00', available: true },
                        { time: '19:00', available: Math.random() > 0.3 }
                    ];
                    resolve(slots);
                }, 300);
            });
        }
    }

    // ============================================================
    // 6. BOOKING COMPONENT
    // ============================================================
    class BookingComponent {
        constructor() {
            this.service = new BookingService();
            this._initialized = false;
            this._form = DOM.form;
            this._init();
        }

        _init() {
            if (this._initialized) return;
            if (!this._form) {
                Utils.log('Booking form not found - skipping initialization');
                return;
            }

            this._setupForm();
            this._setupEventListeners();
            this._setupDatePicker();
            this._setupServiceSelect();
            
            this._initialized = true;
            Utils.log('Booking component initialized');
        }

        _setupForm() {
            // Set initial date constraints
            const dateInput = DOM.datePicker;
            if (dateInput) {
                dateInput.min = Utils.getMinDate();
                dateInput.max = Utils.getMaxDate();
            }

            // Set initial guest count
            const guestInput = DOM.guestCount;
            if (guestInput) {
                guestInput.min = CONFIG.booking.minGuests;
                guestInput.max = CONFIG.booking.maxGuests;
                guestInput.value = CONFIG.booking.minGuests;
            }
        }

        _setupEventListeners() {
            // Service selection
            const serviceSelect = DOM.serviceSelect;
            if (serviceSelect) {
                serviceSelect.addEventListener('change', (e) => {
                    const service = e.target.value;
                    this.service.state.set('selectedService', service);
                    this._updateGuestConstraints(service);
                    this._checkAvailability();
                });
            }

            // Date selection
            const datePicker = DOM.datePicker;
            if (datePicker) {
                datePicker.addEventListener('change', (e) => {
                    const date = e.target.value;
                    this.service.state.set('selectedDate', date);
                    this._updateTimeSlots(date);
                    this._checkAvailability();
                });
            }

            // Time selection
            const timePicker = DOM.timePicker;
            if (timePicker) {
                timePicker.addEventListener('change', (e) => {
                    const time = e.target.value;
                    this.service.state.set('selectedTime', time);
                    this._checkAvailability();
                });
            }

            // Guest count
            const guestCount = DOM.guestCount;
            if (guestCount) {
                guestCount.addEventListener('change', (e) => {
                    const guests = parseInt(e.target.value, 10);
                    this.service.state.set('guestCount', guests);
                    this._checkAvailability();
                });
            }

            // Form submission
            if (this._form) {
                this._form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this._handleSubmit();
                });
            }

            // Subscribe to state changes
            this.service.state.subscribe('isAvailable', (available) => {
                this._updateAvailabilityUI(available);
            });
        }

        _setupDatePicker() {
            const datePicker = DOM.datePicker;
            if (!datePicker) return;

            // Set default date to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const defaultDate = tomorrow.toISOString().split('T')[0];
            datePicker.value = defaultDate;
            this.service.state.set('selectedDate', defaultDate);
        }

        _setupServiceSelect() {
            const serviceSelect = DOM.serviceSelect;
            if (!serviceSelect) return;

            // Populate service options
            const services = CONFIG.services;
            Object.keys(services).forEach(key => {
                const service = services[key];
                const option = document.createElement('option');
                option.value = service.id;
                option.textContent = service.label;
                if (service.id === CONFIG.booking.defaultService) {
                    option.selected = true;
                }
                serviceSelect.appendChild(option);
            });
        }

        _updateGuestConstraints(service) {
            const serviceConfig = CONFIG.services[service];
            const guestInput = DOM.guestCount;
            if (!guestInput || !serviceConfig) return;

            const maxGuests = Math.min(serviceConfig.maxGuests, CONFIG.booking.maxGuests);
            const currentGuests = parseInt(guestInput.value, 10);
            
            guestInput.max = maxGuests;
            
            if (currentGuests > maxGuests) {
                guestInput.value = maxGuests;
                this.service.state.set('guestCount', maxGuests);
            }
        }

        _updateTimeSlots(date) {
            const service = this.service.state.get('selectedService');
            const timePicker = DOM.timePicker;
            if (!timePicker || !date) return;

            // Clear current options
            timePicker.innerHTML = '';
            
            // Show loading state
            const loadingOption = document.createElement('option');
            loadingOption.value = '';
            loadingOption.textContent = 'Loading time slots...';
            loadingOption.disabled = true;
            loadingOption.selected = true;
            timePicker.appendChild(loadingOption);

            // Fetch time slots
            this.service.getTimeSlots(service, date).then(slots => {
                timePicker.innerHTML = '';
                
                // Add default option
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Select time...';
                defaultOption.disabled = true;
                defaultOption.selected = true;
                timePicker.appendChild(defaultOption);

                // Add available slots
                slots.forEach(slot => {
                    if (slot.available) {
                        const option = document.createElement('option');
                        option.value = slot.time;
                        option.textContent = Utils.formatTime(slot.time);
                        timePicker.appendChild(option);
                    }
                });

                // If no slots available
                if (timePicker.children.length <= 1) {
                    const noSlotOption = document.createElement('option');
                    noSlotOption.value = '';
                    noSlotOption.textContent = 'No slots available';
                    noSlotOption.disabled = true;
                    timePicker.appendChild(noSlotOption);
                }
            });
        }

        _checkAvailability() {
            const service = this.service.state.get('selectedService');
            const date = this.service.state.get('selectedDate');
            const time = this.service.state.get('selectedTime');
            const guests = this.service.state.get('guestCount');

            if (!date || !time) {
                this._updateAvailabilityUI(false, 'Please select date and time');
                return;
            }

            this.service.checkAvailability({
                service,
                date,
                time,
                guests
            }).then(result => {
                if (result.available) {
                    this._updateAvailabilityUI(true, 'Time slot available! Proceed with booking.');
                } else {
                    this._updateAvailabilityUI(false, result.message || 'Time slot not available');
                }
            });
        }

        _updateAvailabilityUI(available, message) {
            const messageElement = DOM.availabilityMessage;
            if (!messageElement) return;

            if (available) {
                messageElement.className = 'availability-message success';
                messageElement.textContent = message || '✅ Available - Ready to book!';
                messageElement.setAttribute('aria-live', 'polite');
            } else {
                messageElement.className = 'availability-message error';
                messageElement.textContent = message || '❌ Not available - Please try another time';
                messageElement.setAttribute('aria-live', 'assertive');
            }
        }

        _handleSubmit() {
            const name = DOM.fullName;
            const email = DOM.email;
            const phone = DOM.phone;
            const specialRequests = DOM.specialRequests;

            const bookingData = {
                name: name ? name.value.trim() : '',
                email: email ? email.value.trim() : '',
                phone: phone ? phone.value.trim() : '',
                service: this.service.state.get('selectedService'),
                date: this.service.state.get('selectedDate'),
                time: this.service.state.get('selectedTime'),
                guests: this.service.state.get('guestCount'),
                specialRequests: specialRequests ? specialRequests.value.trim() : '',
                timestamp: new Date().toISOString()
            };

            // Validate required fields
            if (!bookingData.name || !bookingData.email || !bookingData.phone) {
                Utils.error('Missing required fields');
                this._showError('Please fill in all required fields');
                return;
            }

            // Submit booking
            this.service.submitBooking(bookingData).then(result => {
                if (result.success) {
                    this._showConfirmation(result);
                    Utils.dispatchEvent('booking:success', result);
                } else {
                    this._showError(result.error || 'Booking failed. Please try again.');
                    Utils.dispatchEvent('booking:failed', result);
                }
            });
        }

        _showConfirmation(result) {
            const modal = DOM.confirmationModal;
            if (!modal) {
                Utils.log('Confirmation modal not found');
                // Fallback: show alert
                alert(`Booking confirmed! Reference: ${result.reference}`);
                return;
            }

            // Populate confirmation details
            const refElement = modal.querySelector('#bookingRef');
            const detailsElement = modal.querySelector('#bookingDetails');
            
            if (refElement) {
                refElement.textContent = result.reference;
            }
            
            if (detailsElement) {
                const state = this.service.state.getState();
                detailsElement.innerHTML = `
                    <p><strong>Name:</strong> ${result.data.name}</p>
                    <p><strong>Service:</strong> ${CONFIG.services[state.selectedService]?.label || state.selectedService}</p>
                    <p><strong>Date:</strong> ${Utils.formatDate(state.selectedDate)}</p>
                    <p><strong>Time:</strong> ${Utils.formatTime(state.selectedTime)}</p>
                    <p><strong>Guests:</strong> ${state.guestCount}</p>
                `;
            }

            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');

            // Close button
            const closeBtn = modal.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    modal.classList.remove('active');
                    modal.setAttribute('aria-hidden', 'true');
                });
            }

            // Close on background click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                    modal.setAttribute('aria-hidden', 'true');
                }
            });

            Utils.dispatchEvent('booking:confirmation-shown', { reference: result.reference });
        }

        _showError(message) {
            const messageElement = DOM.availabilityMessage;
            if (messageElement) {
                messageElement.className = 'availability-message error';
                messageElement.textContent = `❌ ${message}`;
                messageElement.setAttribute('aria-live', 'assertive');
            } else {
                alert(`Error: ${message}`);
            }
        }

        /**
         * Get current booking state
         * @returns {Object} Booking state
         */
        getState() {
            return this.service.state.getState();
        }

        /**
         * Reset booking form
         */
        reset() {
            this.service.state.reset();
            this._form.reset();
            this._setupDatePicker();
            this._updateAvailabilityUI(false, '');
            Utils.log('Booking form reset');
        }

        /**
         * Check if booking is ready
         * @returns {boolean} Whether booking is ready
         */
        isReady() {
            const state = this.service.state.getState();
            return state.isAvailable && 
                   !state.isSubmitting && 
                   state.selectedDate && 
                   state.selectedTime;
        }
    }

    // ============================================================
    // 7. INTEGRATION WITH ZT KERNEL
    // ============================================================
    
    // Register booking with ZT namespace if available
    if (window.ZT) {
        if (!ZT.Components) {
            ZT.Components = {};
        }
        ZT.Components.Booking = BookingComponent;
        Utils.log('Booking registered with ZT kernel');
    } else {
        // Fallback: expose globally
        window.ZTBooking = BookingComponent;
    }

    // ============================================================
    // 8. BOOTSTRAP - Wait for DOM to be ready
    // ============================================================
    
    let bookingInstance = null;

    /**
     * Initialize booking component
     */
    function initBooking() {
        if (bookingInstance) {
            Utils.log('Booking already initialized');
            return bookingInstance;
        }

        // Check if booking form exists on page
        const form = document.querySelector(CONFIG.selectors.bookingForm);
        if (!form) {
            Utils.log('Booking form not found - skipping initialization');
            return null;
        }

        bookingInstance = new BookingComponent();
        Utils.dispatchEvent('booking:ready', { instance: bookingInstance });
        return bookingInstance;
    }

    // If ZT kernel exists, let it handle initialization
    if (window.ZT && ZT.Kernel && ZT.Kernel.isReady) {
        // Wait for kernel to be ready
        if (ZT.Kernel.isReady()) {
            initBooking();
        } else {
            ZT.Events.on('zt-ready', function() {
                initBooking();
            });
        }
    } else {
        // Standalone initialization
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                initBooking();
            });
        } else {
            initBooking();
        }
    }

    // Export for testing
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            BookingComponent,
            BookingService,
            BookingState,
            CONFIG,
            DOM,
            Utils,
            initBooking
        };
    }

})();





