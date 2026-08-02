/**
 * ============================================================
 * ZT Lounge Meru - Shared Components System
 * Centralizes header and footer across all public pages
 * Version: 1.0.0
 * ============================================================
 */

(function() {
    'use strict';

    /**
     * Get business config with fallback
     */
    function getBusinessConfig() {
        return window.BusinessConfig || window.BusinessRepository || {
            name: 'ZT Lounge Meru',
            phone: '+254 143 542 601',
            phoneRaw: '254143542601',
            email: 'ztloungemeru@gmail.com',
            address: {
                street: 'Opposite Ezri Hotel, Milimani',
                city: 'Meru',
                country: 'Kenya',
                full: 'Opposite Ezri Hotel, Milimani, Meru, Kenya',
                short: 'Opposite Ezri Hotel, Milimani, Meru'
            },
            social: {
                whatsapp: 'https://wa.me/254143542601'
            },
            hours: {
                default: 'Mon - Sun: 10:00 AM - 2:00 AM'
            },
            logo: { 
                dark: 'assets/images/branding/logo.webp', 
                light: 'assets/images/branding/logo-white.webp',
                alt: 'ZT Lounge Meru - Premium Hospitality Logo'
            }
        };
    }

    window.injectHeader = function() {
        var config = getBusinessConfig();
        var headerHTML = '<header class="header" id="header" role="banner">' +
            '<div class="container">' +
                '<div class="nav-wrapper">' +
                    '<a href="/" class="logo" aria-label="ZT Lounge Home">' +
                        '<img src="' + config.logo.dark + '" alt="' + config.logo.alt + '" class="logo-dark site-logo" height="62" width="auto" decoding="async" fetchpriority="high" />' +
                        '<img src="' + config.logo.light + '" alt="' + config.logo.alt + '" class="logo-light site-logo" height="62" width="auto" decoding="async" fetchpriority="high" />' +
                    '</a>' +
                    '<nav class="nav-menu" id="navMenu" role="navigation" aria-label="Main navigation">' +
                        '<ul class="nav-list" role="menubar">' +
                            '<li role="none"><a href="/" role="menuitem" class="nav-home"><i class="fas fa-home" aria-hidden="true"></i> Home</a></li>' +
                            '<li role="none" aria-expanded="false">' +
                                '<a role="menuitem" aria-haspopup="true" aria-expanded="false" aria-controls="experiences-dropdown" class="dropdown-parent" tabindex="0">Experiences <i class="fas fa-chevron-down" aria-hidden="true"></i></a>' +
                                '<ul class="dropdown-menu" id="experiences-dropdown" role="menu">' +
                                    '<li role="none"><a href="pages/experiences/restaurant.html" role="menuitem">Restaurant</a></li>' +
                                    '<li role="none"><a href="pages/experiences/restaurant-menu.html" role="menuitem">Restaurant Menu</a></li>' +
                                    '<li role="none"><a href="pages/experiences/lounge.html" role="menuitem">Lounge</a></li>' +
                                    '<li role="none"><a href="pages/experiences/vip.html" role="menuitem">VIP Cabins</a></li>' +
                                '</ul>' +
                            '</li>' +
                            '<li role="none" aria-expanded="false">' +
                                '<a role="menuitem" aria-haspopup="true" aria-expanded="false" aria-controls="business-dropdown" class="dropdown-parent" tabindex="0">Business <i class="fas fa-chevron-down" aria-hidden="true"></i></a>' +
                                '<ul class="dropdown-menu" id="business-dropdown" role="menu">' +
                                    '<li role="none"><a href="pages/business/events.html" role="menuitem">Events</a></li>' +
                                    '<li role="none"><a href="pages/business/conference.html" role="menuitem">Conference</a></li>' +
                                    '<li role="none"><a href="pages/business/autospa.html" role="menuitem">Auto Spa</a></li>' +
                                '</ul>' +
                            '</li>' +
                            '<li role="none" aria-expanded="false">' +
                                '<a role="menuitem" aria-haspopup="true" aria-expanded="false" aria-controls="contact-dropdown" class="dropdown-parent" tabindex="0">Contact <i class="fas fa-chevron-down" aria-hidden="true"></i></a>' +
                                '<ul class="dropdown-menu" id="contact-dropdown" role="menu">' +
                                    '<li role="none"><a href="pages/contact/contact.html" role="menuitem">Contact Page</a></li>' +
                                    '<li role="none"><a href="pages/contact/gallery.html" role="menuitem">Gallery</a></li>' +
                                '</ul>' +
                            '</li>' +
                        '</ul>' +
                    '</nav>' +
                    '<div class="nav-actions">' +
                        '<button class="theme-toggle" id="themeToggle" aria-label="Toggle light or dark color theme" title="Toggle theme" type="button">' +
                            '<i class="fas fa-moon" aria-hidden="true"></i>' +
                            '<i class="fas fa-sun" aria-hidden="true"></i>' +
                        '</button>' +
                        '<a href="tel:' + config.phoneRaw + '" class="header-phone" aria-label="Call ZT Lounge">' +
                            '<i class="fas fa-phone" aria-hidden="true"></i>' +
                            '<span class="phone-number">' + config.phone + '</span>' +
                        '</a>' +
                        '<button class="hamburger" id="hamburger" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="navMenu" type="button">' +
                            '<span></span><span></span><span></span>' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</header>';

        var placeholder = document.getElementById('site-header');
        if (placeholder) {
            placeholder.innerHTML = headerHTML;
        } else {
            document.body.insertAdjacentHTML('afterbegin', headerHTML);
        }
    };

    /**
     * Inject shared footer into the page
     * Call this before closing body tag
     */
    window.injectFooter = function() {
        var config = getBusinessConfig();
        var address = config.address || {};
        var hours = config.hours || {};
        
        var footerHTML = '<footer class="footer" role="contentinfo">' +
            '<div class="container">' +
                '<div class="footer-grid">' +
                    '<div class="footer-brand">' +
                        '<a href="/" class="logo" aria-label="ZT Lounge Home">' +
                            '<img src="assets/images/branding/logo.webp" alt="ZT Lounge Meru - Premium Hospitality Logo" class="logo-dark site-logo" height="62" width="auto" loading="lazy" decoding="async" />' +
                            '<img src="assets/images/branding/logo-white.webp" alt="ZT Lounge Meru - Premium Hospitality Logo" class="logo-light site-logo" height="62" width="auto" loading="lazy" decoding="async" />' +
                        '</a>' +
                        '<p>Experience premium hospitality at ZT Lounge Meru — fine dining, exclusive lounges, pool table entertainment, Auto Spa, and world-class service in Milimani.</p>' +
                        '<div class="footer-social">' +
                            '<a href="https://facebook.com/ztlounge" target="_blank" rel="noopener noreferrer" aria-label="Facebook page"><i class="fab fa-facebook-f" aria-hidden="true"></i></a>' +
                            '<a href="https://instagram.com/ztlounge" target="_blank" rel="noopener noreferrer" aria-label="Instagram page"><i class="fab fa-instagram" aria-hidden="true"></i></a>' +
                            '<a href="https://x.com/ztlounge_meru" target="_blank" rel="noopener noreferrer" aria-label="Twitter page"><i class="fab fa-twitter" aria-hidden="true"></i></a>' +
                            '<a href="https://youtube.com/@ztlounge" target="_blank" rel="noopener noreferrer" aria-label="YouTube channel"><i class="fab fa-youtube" aria-hidden="true"></i></a>' +
                        '</div>' +
                    '</div>' +
                    '<nav class="footer-links" aria-label="Quick links">' +
                        '<h4>Quick Links</h4>' +
                        '<ul>' +
                            '<li><a href="/">Home</a></li>' +
                            '<li><a href="pages/experiences/restaurant.html">Restaurant</a></li>' +
                            '<li><a href="pages/experiences/lounge.html">Lounge & Bar</a></li>' +
                            '<li><a href="pages/experiences/vip.html">VIP Cabins</a></li>' +
                            '<li><a href="pages/business/events.html">Events</a></li>' +
                            '<li><a href="pages/business/conference.html">Conference</a></li>' +
                            '<li><a href="pages/business/autospa.html">Auto Spa</a></li>' +
                            '<li><a href="pages/contact/gallery.html">Gallery</a></li>' +
                            '<li><a href="pages/contact/contact.html">Contact</a></li>' +
                        '</ul>' +
                    '</nav>' +
                    '<nav class="footer-services" aria-label="Our services">' +
                        '<h4>Our Services</h4>' +
                        '<ul>' +
                            '<li><a href="pages/experiences/restaurant.html">Restaurant</a></li>' +
                            '<li><a href="pages/experiences/lounge.html">Lounge & Bar</a></li>' +
                            '<li><a href="pages/experiences/vip.html">VIP Cabins</a></li>' +
                            '<li><a href="pages/business/events.html">Events</a></li>' +
                            '<li><a href="pages/business/conference.html">Conference</a></li>' +
                            '<li><a href="pages/business/autospa.html">Auto Spa</a></li>' +
                        '</ul>' +
                    '</nav>' +
                    '<div class="footer-contact" aria-label="Contact information">' +
                        '<h4>Contact Info</h4>' +
                        '<ul>' +
                            '<li><i class="fas fa-map-marker-alt" aria-hidden="true"></i> ' + (address.short || address.full || 'Opposite Ezri Hotel, Milimani, Meru') + '</li>' +
                            '<li><i class="fas fa-phone" aria-hidden="true"></i> <a href="tel:' + (config.phoneRaw || config.phone.replace(/\D/g, '')) + '">' + config.phone + '</a></li>' +
                            '<li><i class="fab fa-whatsapp" aria-hidden="true"></i> <a href="' + (config.social && config.social.whatsapp || 'https://wa.me/' + (config.phoneRaw || config.phone.replace(/\D/g, ''))) + '" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>' +
                            '<li><i class="fas fa-envelope" aria-hidden="true"></i> <a href="mailto:' + config.email + '">' + config.email + '</a></li>' +
                            '<li><i class="fas fa-clock" aria-hidden="true"></i> ' + (hours.default || 'Mon - Sun: 10:00 AM - 2:00 AM') + '</li>' +
                        '</ul>' +
                    '</div>' +
                '</div>' +
                '<div class="footer-bottom">' +
                    '<p>&copy; <span id="copyrightYear">2026</span> ZT Lounge Meru. All rights reserved.</p>' +
                    '<p class="footer-credit">Designed with <i class="fas fa-heart" aria-hidden="true"></i> for luxury</p>' +
                '</div>' +
            '</div>' +
        '</footer>';

        var placeholder = document.getElementById('site-footer');
        if (placeholder) {
            placeholder.innerHTML = footerHTML;
        } else {
            document.body.insertAdjacentHTML('beforeend', footerHTML);
        }
    };

    /**
     * Auto-inject on DOMContentLoaded
     * Injects into placeholders or appends to body
     */
    document.addEventListener('DOMContentLoaded', function() {
        injectHeader();
        injectFooter();
    });
})();