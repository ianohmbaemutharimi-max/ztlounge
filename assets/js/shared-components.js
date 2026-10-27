/**
 * Shared Components
 * ============================================================
 * Unified header and footer management for all website pages.
 * Provides consistent site-header and site-footer initialization
 * across the entire ZT Lounge website.
 * Version: 1.0.0
 * ============================================================
 */

/* Initialize site-header */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        // Site header can be populated dynamically per page
        // Header placeholders are injected by the page templates
        // This function provides consistent header behavior

        // Add any header initialization logic here
        // e.g., mobile menu setup, header scroll effects, etc.

        // Check if header exists
        var header = document.getElementById('site-header');
        if (!header) return;

        // Example: Add aria-label if not present
        if (!header.getAttribute('aria-label')) {
            header.setAttribute('aria-label', 'Site header');
        }
    });
})();

/* Initialize site-footer */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        // Copyright year
        var yearEl = document.getElementById('copyrightYear');
        if (yearEl) {
            yearEl.textContent = new Date().getFullYear();
        }

        // Initialize footer business info if BusinessConfig is available
        if (typeof window.BusinessConfig !== 'undefined') {
            var cfg = window.BusinessConfig;

            // Populate footer brand name
            var footerName = document.querySelector('footer [data-business="name"]');
            if (footerName && cfg.name) {
                footerName.textContent = cfg.name;
            }

            // Populate footer tagline/description
            var footerDesc = document.querySelector('footer [data-business="description"]');
            if (footerDesc && cfg.tagline) {
                footerDesc.textContent = cfg.tagline;
            }

            // Populate footer hours
            var footerHours = document.querySelector('footer [data-business="hours"]');
            if (footerHours && cfg.hours && cfg.hours.default) {
                footerHours.textContent = cfg.hours.default;
            }

            // Populate social links
            var socialMap = {
                facebook: 'facebook',
                instagram: 'instagram',
                twitter: 'twitter',
                youtube: 'youtube',
                // Restaurant Menu link in Experiences dropdown
                restaurantMenu: 'restaurant-menu'
            };

            Object.keys(socialMap).forEach(function(key) {
                var el = document.querySelector('footer [data-social="' + key + '"]');
                if (el && cfg.social && cfg.social[key]) {
                    el.href = cfg.social[key];
                }
            });

            // Populate footer email
            var footerEmail = document.querySelector('footer [data-business="email"]');
            if (footerEmail && cfg.email) {
                footerEmail.href = 'mailto:' + cfg.email;
                footerEmail.textContent = cfg.email;
            }
        }

        // Add aria-label to footer if not present
        var footer = document.getElementById('site-footer');
        if (footer && !footer.getAttribute('aria-label')) {
            footer.setAttribute('aria-label', 'Site footer');
        }
    });
})();
/* Initialize booking form consistency across all pages */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        // Standardize booking form core fields across all pages
        // Core fields: date, time, party size, contact name, email
        // Page-specific fields are preserved as enhancements

        var bookingForms = document.querySelectorAll(
            '.booking-form, .reservation-form, .appointment-form, .event-booking'
        );

        bookingForms.forEach(function(form) {
            // Ensure all booking forms have core field labels and placeholders
            var formFields = form.querySelectorAll('input[required], select[required], textarea[required]');

            formFields.forEach(function(field) {
                // Add aria-describedby for accessibility if not present
                if (!field.getAttribute('aria-label')) {
                    var fieldType = field.type || field.name || 'field';
                    field.setAttribute('aria-label', capitalizeFirstLetter(fieldType) + ' field');
                }

                // Standardize placeholder if empty
                if (!field.placeholder && field.getAttribute('type') !== 'hidden') {
                    var placeholderMap = {
                        'date': 'YYYY-MM-DD',
                        'datetime-local': 'YYYY-MM-DDTHH:MM',
                        'time': 'HH:MM',
                        'name': 'Your name',
                        'email': 'your.email@example.com',
                        'party': 'Number of guests',
                        'persons': 'Number of guests',
                        'phone': 'Phone number'
                    };
                    var typeLower = field.type ? field.type.toLowerCase() : '';
                    if (placeholderMap[typeLower]) {
                        field.placeholder = placeholderMap[typeLower];
                    }
                }
            });
        });

        // Add consistent submit button behavior
        var submitBtns = document.querySelectorAll(
            '.booking-form button[type=submit], .reservation-form button[type=submit], .event-booking button[type=submit]'
        );
        submitBtns.forEach(function(btn) {
            if (!btn.getAttribute('aria-label') && btn.textContent.trim()) {
                btn.setAttribute('aria-label', 'Submit ' + btn.textContent.trim().toLowerCase() + ' form');
            }
        });
    });

    /* Helper function */
    function capitalizeFirstLetter(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }
})();
