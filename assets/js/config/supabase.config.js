/**
 * ============================================================
 * ZT Lounge Meru - Supabase Configuration
 * Centralized configuration for Supabase connection
 * Version: 1.0.0
 * ============================================================
 * 
 * IMPORTANT:
 * - Only PUBLIC anon key is used here
 * - Service Role Key is NEVER exposed to the frontend
 * - Change the URL to your actual Supabase project URL before deployment
 * ============================================================
 */

// Base configuration object - DO NOT freeze until after runtime overrides
var SupabaseConfigObj = {
    // Supabase Project URL - CHANGE THIS TO YOUR ACTUAL PROJECT URL
    // Example format: https://[project-ref].supabase.co
    // Live project ref: jczwilrysvnhcjzjztbi (shared with zt-lounge-admin)
    url: 'https://jczwilrysvnhcjzjztbi.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjendpbHJ5c3ZuaGNqemp6dGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NDEyNTAsImV4cCI6MjA5OTUxNzI1MH0.TooU0gjA4VcKsGBF07O1hpiCvJgACLxvZY09bukpXhw',

    // Table names used by the frontend - match actual database schema
    tables: {
        businessSettings: 'business_settings',
        services: 'services',
        gallery: 'gallery',
        faqs: 'faqs',
        testimonials: 'testimonials',
        contactMessages: 'contact_messages',
        bookings: 'bookings',
        serviceCategories: 'service_categories',
        heroSlides: 'hero_slides',
        menuItems: 'menu_items',
        menuCategories: 'menu_categories'
    },

    // Query configuration
    query: {
        retryAttempts: 1,
        retryDelay: 1000,
        cacheTTL: 300000 // 5 minutes
    }
};

// Allow runtime override via window.__SUPABASE_CONFIG
// This enables environment-specific configuration without modifying this file
(function() {
    var runtime = window.__SUPABASE_CONFIG;
    if (runtime) {
        if (runtime.url) SupabaseConfigObj.url = runtime.url;
        if (runtime.anonKey) SupabaseConfigObj.anonKey = runtime.anonKey;
    }
})();

// Freeze AFTER runtime overrides so they can take effect
window.SupabaseConfig = Object.freeze(SupabaseConfigObj);