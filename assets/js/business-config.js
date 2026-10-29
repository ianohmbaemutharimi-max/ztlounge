/**
 * ============================================================
 * ZT Lounge Meru - Business Configuration
 * Single Source of Truth for Business Information
 * Version: 1.3.0 (Canonical Media Only)
 * ============================================================
 *
 * This configuration maps directly to the business_settings table.
 * DO NOT hardcode these values in HTML - use this config instead.
 *
 * MEDIA NOTE: Branding images are selected by business_settings media IDs.
 * This configuration intentionally stores no logo or favicon URL fallback.
 * ============================================================
 */

window.BusinessConfig = Object.freeze({
    // Business Identity
    name: 'ZT Lounge Meru',
    tagline: 'Premium Hospitality Destination',

    // Contact Information
    phone: '+254 143 542 601',
    phoneRaw: '254143542601', // For WhatsApp/tel links
    email: 'ztloungemeru@gmail.com',

    // Address
    address: {
        street: 'Milimani Road',
        area: 'Opposite Ezri Hotel, Milimani',
        city: 'Meru',
        region: 'Meru County',
        postalCode: '60200',
        country: 'Kenya',
        full: 'Milimani Road, Meru, Kenya',
        short: 'Milimani, Meru'
    },

    // Operating Hours
    hours: {
        restaurant: 'Mon - Sun: 10:00 AM - 2:00 AM',
        autospa: 'Mon - Sun: 8:00 AM - 6:00 PM',
        default: 'Mon - Sun: 10:00 AM - 2:00 AM'
    },

    // Social Media
    social: {
        whatsapp: 'https://wa.me/254143542601',
        facebook: 'https://facebook.com/ztlounge',
        instagram: 'https://instagram.com/ztlounge',
        twitter: 'https://x.com/ztlounge_meru',
        youtube: 'https://youtube.com/@ztlounge'
    },

    // Maps
    googleMaps: 'https://maps.app.goo.gl/HqTbiiU4q2jRFoPg6',

    // Google Reviews (business_settings.google_review_url overrides this when set)
    googleReview: 'https://maps.app.goo.gl/HqTbiiU4q2jRFoPg6',

    // Branding: descriptive text only; image URLs come from canonical media IDs.
    logo: {
        alt: 'ZT Lounge Meru - Premium Hospitality Logo'
    },

    // SEO
    seo: {
        siteName: 'ZT Lounge Meru',
        locale: 'en_KE',
        url: 'https://ztlounge.co.ke'
    },

    // Trust Badges
    trust: {
        happyGuests: '200+',
        eventsHosted: '500+',
        responseTime: 'Fast Response Within 30 Minutes'
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BusinessConfig;
}