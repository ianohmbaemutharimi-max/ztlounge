/**
 * ============================================================
 * ZT Lounge Meru - Business Configuration
 * Single Source of Truth for Business Information
 * Version: 1.2.0 (Legacy Media Fallback â€” behavior unchanged)
 * ============================================================
 *
 * This configuration maps directly to the business_settings table.
 * DO NOT hardcode these values in HTML - use this config instead.
 *
 * MEDIA NOTE: logo URLs below are the documented static fallback for
 * the BusinessRepository branding gateway (see docs/BUSINESS_SETTINGS.md:
 * media failure keeps branding fallbacks, catch-and-keep). Canonical
 * ownership for these assets lives on data-media-id attributes in
 * shared-components.js (logo -> 79e60738-*, logo-white -> ebac626d-*).
 * Keep these URLs in sync only if the storage paths change.
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

    // Branding
    logo: {
        dark: 'https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/branding/logo.webp',
        light: 'https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/branding/logo-white.webp',
        alt: 'ZT Lounge Meru - Premium Hospitality Logo'
    },

    // SEO
    seo: {
        siteName: 'ZT Lounge Meru',
        locale: 'en_KE',
        url: 'https://ztlounge.com'
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
