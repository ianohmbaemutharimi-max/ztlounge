/**
 * ============================================================
 * ZT Lounge Meru - Supabase Configuration
 * Centralized configuration for Supabase connection
 * Version: 1.1.0
 * ============================================================
 *
 * IMPORTANT:
 * - Only the PUBLIC anon key is used here (safe for browser JS)
 * - The service_role key MUST NEVER appear in this file or any
 *   other browser-accessible file
 * - At deploy time, override url/anonKey via window.__SUPABASE_CONFIG
 *   (injected by the hosting provider from environment variables)
 * - The hardcoded fallback values below are the project defaults for
 *   local development only. They are the public anon credentials and
 *   are safe to ship to the browser.
 * ============================================================
 */

// Base configuration object - DO NOT freeze until after runtime overrides
var SupabaseConfigObj = {
    // Supabase Project URL
    // Override at deploy time via window.__SUPABASE_CONFIG.url
    url: 'https://jczwilrysvnhcjzjztbi.supabase.co',
    // Public anon key â€” safe for browser, operates under Row Level Security
    // Override at deploy time via window.__SUPABASE_CONFIG.anonKey
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
        menuCategories: 'menu_categories',
        membershipPlans: 'membership_plans',
        membershipPlanBenefits: 'membership_plan_benefits',
        pricingPackages: 'pricing_packages'
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
