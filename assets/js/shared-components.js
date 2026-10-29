/**
 * Depth-aware routing helpers.
 *
 * The shared header/footer is injected into pages at varying directory
 * depths (site root, pages/experiences/, pages/business/, pages/contact/).
 * Internal hrefs must be resolved relative to the current document so links
 * such as the Grooming & Care entry don't 404 on nested pages (e.g.
 * /pages/business/grooming-care.html). Mirrors the convention already used
 * by content-loader.js (siteRootPrefix / siteHref).
 */
function siteRootPrefix() {
    var segments = String(window.location.pathname || '').split('/').filter(Boolean);
    // Root document (e.g. / or /index.html) needs no prefix.
    if (segments.length <= 1) return '';
    return new Array(segments.length).join('../');
}

/** Apply site-root prefix to a canonical route. Leaves absolute/root/hash
 *  schemes (mailto:, tel:, https://, //) untouched. */
function href(route) {
    if (!route || route === '/' || route.charAt(0) === '#' ||
        /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(route)) {
        return route;
    }
    return siteRootPrefix() + route;
}

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
            street: 'Milimani Road',
            city: 'Meru',
            country: 'Kenya',
            full: 'Milimani Road, Meru, Kenya',
            short: 'Milimani, Meru'
        },
        social: {
            whatsapp: 'https://wa.me/254143542601'
        },
        hours: {
            default: 'Mon - Sun: 10:00 AM - 2:00 AM'
        },
        logo: {
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
                        '<img data-media-slot="logo-dark" alt="' + config.logo.alt + '" class="logo-dark site-logo" height="62" decoding="async" fetchpriority="high" />' +
                        '<span class="logo-dark site-logo logo-media-missing" hidden>Logo unavailable</span>' +
                        '<img data-media-slot="logo-light" alt="' + config.logo.alt + '" class="logo-light site-logo" height="62" decoding="async" fetchpriority="high" />' +
                        '<span class="logo-light site-logo logo-media-missing" hidden>Logo unavailable</span>' +
                    '</a>' +
                    '<nav class="nav-menu" id="navMenu" role="navigation" aria-label="Main navigation">' +
                        '<ul class="nav-list" role="menubar">' +
                            '<li role="none"><a href="/" role="menuitem" class="nav-home"><i class="fas fa-home" aria-hidden="true"></i> Home</a></li>' +
                            '<li role="none" aria-expanded="false">' +
                                '<a role="menuitem" aria-haspopup="true" aria-expanded="false" aria-controls="experiences-dropdown" class="dropdown-parent" tabindex="0">Experiences <i class="fas fa-chevron-down" aria-hidden="true"></i></a>' +
                                '<ul class="dropdown-menu" id="experiences-dropdown" role="menu">' +
                                    '<li role="none"><a href="' + href('pages/experiences/restaurant.html') + '" role="menuitem">Restaurant</a></li>' +
                                    '<li role="none"><a href="' + href('pages/experiences/restaurant-menu.html') + '" role="menuitem">Restaurant Menu</a></li>' +
                                    '<li role="none"><a href="' + href('pages/experiences/lounge.html') + '" role="menuitem">Lounge</a></li>' +
                                    '<li role="none"><a href="' + href('pages/experiences/vip.html') + '" role="menuitem">VIP Cabins</a></li>' +
                                '</ul>' +
                            '</li>' +
                            '<li role="none" aria-expanded="false">' +
                                '<a role="menuitem" aria-haspopup="true" aria-expanded="false" aria-controls="business-dropdown" class="dropdown-parent" tabindex="0">Business <i class="fas fa-chevron-down" aria-hidden="true"></i></a>' +
                                '<ul class="dropdown-menu" id="business-dropdown" role="menu">' +
                                    '<li role="none"><a href="' + href('pages/business/events.html') + '" role="menuitem">Events</a></li>' +
                                    '<li role="none"><a href="' + href('pages/business/conference.html') + '" role="menuitem">Conference</a></li>' +
                                    '<li role="none"><a href="' + href('pages/business/grooming-care.html') + '" role="menuitem">Grooming & Care</a></li>' +
                                '</ul>' +
                            '</li>' +
                            '<li role="none" aria-expanded="false">' +
                                '<a role="menuitem" aria-haspopup="true" aria-expanded="false" aria-controls="contact-dropdown" class="dropdown-parent" tabindex="0">Contact <i class="fas fa-chevron-down" aria-hidden="true"></i></a>' +
                                '<ul class="dropdown-menu" id="contact-dropdown" role="menu">' +
                                    '<li role="none"><a href="' + href('pages/contact/contact.html') + '" role="menuitem">Contact Page</a></li>' +
                                    '<li role="none"><a href="' + href('pages/contact/gallery.html') + '" role="menuitem">Gallery</a></li>' +
                                '</ul>' +
                            '</li>' +
                        '</ul>' +
                    '</nav>' +
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
window.injectFooter = function() {
        var config = getBusinessConfig();
        var address = config.address || {};
        var hours = (config.hours && config.hours.default) || 'Mon - Sun: 10:00 AM - 2:00 AM';
        var phoneRaw = config.phoneRaw || String(config.phone || '').replace(/\D/g, '');
        var whatsapp = (config.social && config.social.whatsapp) || ('https://wa.me/' + phoneRaw);
        var footerHTML = '<footer class="footer" role="contentinfo">' +
            '<div class="container">' +
                '<div class="footer-grid">' +
                    '<div class="footer-brand">' +
                        '<a href="' + href('index.html') + '" class="logo" aria-label="ZT Lounge Home">' +
                            '<img data-media-slot="logo-dark" alt="' + config.logo.alt + '" class="logo-dark site-logo" height="48" loading="lazy" decoding="async" />' +
                            '<span class="logo-dark site-logo logo-media-missing" hidden>Logo unavailable</span>' +
                            '<img data-media-slot="logo-light" alt="' + config.logo.alt + '" class="logo-light site-logo" height="48" loading="lazy" decoding="async" />' +
                            '<span class="logo-light site-logo logo-media-missing" hidden>Logo unavailable</span>' +
                        '</a>' +
                        '<p data-business="description">Experience premium hospitality at ZT Lounge Meru — fine dining, exclusive lounges, pool table entertainment, Grooming &amp; Care, and world-class service in Milimani.</p>' +
                        '<div class="footer-social">' +
                            '<a href="https://facebook.com/ztlounge" target="_blank" rel="noopener noreferrer" aria-label="Facebook page" data-social="facebook"><i class="fab fa-facebook-f" aria-hidden="true"></i></a>' +
                            '<a href="https://instagram.com/ztlounge" target="_blank" rel="noopener noreferrer" aria-label="Instagram page" data-social="instagram"><i class="fab fa-instagram" aria-hidden="true"></i></a>' +
                            '<a href="https://x.com/ztlounge_meru" target="_blank" rel="noopener noreferrer" aria-label="Twitter page" data-social="twitter"><i class="fab fa-twitter" aria-hidden="true"></i></a>' +
                            '<a href="https://youtube.com/@ztlounge" target="_blank" rel="noopener noreferrer" aria-label="YouTube channel" data-social="youtube"><i class="fab fa-youtube" aria-hidden="true"></i></a>' +
                        '</div>' +
                    '</div>' +
                    '<nav class="footer-links" aria-label="Quick links">' +
                        '<h4>Quick Links</h4>' +
                        '<ul>' +
                            '<li><a href="' + href('index.html') + '">Home</a></li>' +
                            '<li><a href="' + href('pages/experiences/restaurant.html') + '">Restaurant</a></li>' +
                            '<li><a href="' + href('pages/experiences/lounge.html') + '">Lounge &amp; Bar</a></li>' +
                            '<li><a href="' + href('pages/experiences/vip.html') + '">VIP Cabins</a></li>' +
                            '<li><a href="' + href('pages/business/events.html') + '">Events</a></li>' +
                            '<li><a href="' + href('pages/business/conference.html') + '">Conference</a></li>' +
                            '<li><a href="' + href('pages/business/grooming-care.html') + '">Grooming &amp; Care</a></li>' +
                            '<li><a href="' + href('pages/contact/gallery.html') + '">Gallery</a></li>' +
                            '<li><a href="' + href('pages/contact/contact.html') + '">Contact</a></li>' +
                    '<nav class="footer-services" aria-label="Our services">' +
                        '<h4>Our Services</h4>' +
                        '<ul>' +
                            '<li><a href="' + href('pages/experiences/restaurant.html') + '">Restaurant</a></li>' +
                            '<li><a href="' + href('pages/experiences/lounge.html') + '">Lounge &amp; Bar</a></li>' +
                            '<li><a href="' + href('pages/experiences/vip.html') + '">VIP Cabins</a></li>' +
                            '<li><a href="' + href('pages/business/events.html') + '">Events</a></li>' +
                            '<li><a href="' + href('pages/business/conference.html') + '">Conference</a></li>' +
                            '<li><a href="' + href('pages/business/grooming-care.html') + '">Grooming &amp; Care</a></li>' +
                        '</ul>' +
                    '</nav>' +
                    '<div class="footer-contact" aria-label="Contact information">' +
                        '<h4>Contact Info</h4>' +
                        '<ul>' +
                            '<li><i class="fas fa-map-marker-alt" aria-hidden="true"></i> <span data-business="address">' + (address.full || 'Milimani Road, Meru') + '</span></li>' +
                            '<li><i class="fas fa-phone" aria-hidden="true"></i> <a href="tel:' + phoneRaw + '" data-business="phone">' + config.phone + '</a></li>' +
                            '<li><i class="fab fa-whatsapp" aria-hidden="true"></i> <a href="' + whatsapp + '" target="_blank" rel="noopener noreferrer" data-business="whatsapp">WhatsApp</a></li>' +
                            '<li><i class="fas fa-envelope" aria-hidden="true"></i> <a href="mailto:' + config.email + '" data-business="email">' + config.email + '</a></li>' +
                            '<li><i class="fas fa-clock" aria-hidden="true"></i> <span data-business="hours">' + hours + '</span></li>' +
                        '</ul>' +
                    '</div>' +
                '</div>' +
                '<div class="footer-bottom">' +
                    '<p>&copy; <span id="copyrightYear">2026</span> <span data-business="name">' + config.name + '</span>. All rights reserved.</p>' +
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

                        '</ul>' +
                    '</nav>' +


    /**
     * Auto-inject on DOMContentLoaded
     * Injects into placeholders or appends to body
     */
    document.addEventListener('DOMContentLoaded', function() {
        injectHeader();
        injectFooter();
        if (window.MediaDomResolver) {
            window.MediaDomResolver.init();
        }
    });
