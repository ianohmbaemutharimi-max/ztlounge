/**
 * ============================================================
 * ZT Lounge Meru - Business Configuration
 * Single Source of Truth for Business Information
 * Version: 1.0.0
 * ============================================================
 * 
 * This configuration maps directly to the business_settings table.
 * DO NOT hardcode these values in HTML - use this config instead.
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
        street: 'Opposite Ezri Hotel, Milimani',
        city: 'Meru',
        country: 'Kenya',
        full: 'Opposite Ezri Hotel, Milimani, Meru, Kenya',
        short: 'Opposite Ezri Hotel, Milimani, Meru'
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
        facebook: '', // Add when available
        instagram: '', // Add when available
        twitter: '', // Add when available
        youtube: '' // Add when available
    },
    
    // Maps
    googleMaps: '', // Add Google Maps embed URL when available
    
    // Branding
    logo: {
        dark: 'assets/images/branding/logo.webp',
        light: 'assets/images/branding/logo-white.webp',
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