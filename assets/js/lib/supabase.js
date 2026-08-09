
/**
 * ============================================================
 * ZT Lounge Meru - Supabase Client
 * Lazy-initialized Supabase client for the public frontend
 * Version: 1.0.0
 * ============================================================
 * 
 * This module creates and manages the Supabase client instance.
 * It uses the public anon key only - NEVER the service role key.
 * 
 * Dependencies:
 * - @supabase/supabase-js (loaded via CDN in HTML)
 * - config/supabase.config.js
 * 
 * Usage:
 *   SupabaseClient.getClient()  => Supabase client or null
 *   SupabaseClient.isAvailable() => boolean
 *   window.__SUPABASE_AVAILABLE => boolean (for backward compatibility)
 * ============================================================
 */

window.SupabaseClient = (function() {
    'use strict';

    var client = null;
    var initialized = false;
    var initError = null;

    /**
     * Initialize the Supabase client
     * Called lazily - only when first needed
     * @returns {Object|null} Supabase client instance or null
     */
    function init() {
        if (initialized) {
            return client;
        }
        initialized = true;

        // Check if supabase library is available (loaded via CDN)
        if (typeof window.supabase === 'undefined') {
            initError = new Error('Supabase JS library not loaded. Ensure @supabase/supabase-js CDN is included.');
            console.warn('[SupabaseClient]', initError.message);
            return null;
        }

        // Get configuration
        var config = window.SupabaseConfig;
        if (!config) {
            initError = new Error('SupabaseConfig not found. Ensure config/supabase.config.js is loaded.');
            console.warn('[SupabaseClient]', initError.message);
            return null;
        }

        // Validate configuration - check for empty/null/undefined values only
        // DO NOT reject specific values - the config may contain valid values
        if (!config.url || typeof config.url !== 'string' || config.url.trim() === '' || config.url === 'YOUR_SUPABASE_URL_HERE') {
            initError = new Error('Supabase URL not configured. Set a valid URL in supabase.config.js.');
            console.warn('[SupabaseClient]', initError.message);
            window.__SUPABASE_AVAILABLE = false;
            return null;
        }

        if (!config.anonKey || typeof config.anonKey !== 'string' || config.anonKey.trim() === '') {
            initError = new Error('Supabase anon key not configured.');
            console.warn('[SupabaseClient]', initError.message);
            window.__SUPABASE_AVAILABLE = false;
            return null;
        }

        // Test URL format
        try {
            var url = new URL(config.url);
            if (!url.hostname.includes('.supabase.co')) {
                initError = new Error('Invalid Supabase URL format. Should be https://[project-ref].supabase.co');
                console.warn('[SupabaseClient]', initError.message);
                window.__SUPABASE_AVAILABLE = false;
                return null;
            }
        } catch (e) {
            initError = new Error('Invalid Supabase URL format.');
            console.warn('[SupabaseClient]', initError.message);
            window.__SUPABASE_AVAILABLE = false;
            return null;
        }

        try {
            client = window.supabase.createClient(config.url, config.anonKey, {
                auth: {
                    persistSession: false, // Public site - no auth needed
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                },
                global: {
                    headers: {
                        'x-application-name': 'zt-lounge-public'
                    }
                }
            });
            
            // Expose client globally for repositories
            window.supabaseClient = client;
            
            // Test connection
            client.from('business_settings').select('id').limit(1).then(function(result) {
                if (result.error) {
                    console.warn('[SupabaseClient] Connection test failed:', result.error.message);
                    window.__SUPABASE_AVAILABLE = false;
                } else {
                    console.log('[SupabaseClient] Connected successfully.');
                    window.__SUPABASE_AVAILABLE = true;
                }
            }).catch(function(e) {
                console.warn('[SupabaseClient] Connection test failed:', e.message);
                window.__SUPABASE_AVAILABLE = false;
            });
            
            return client;
        } catch (e) {
            initError = e;
            console.error('[SupabaseClient] Failed to initialize:', e.message);
            window.__SUPABASE_AVAILABLE = false;
            return null;
        }
    }

    /**
     * Get the Supabase client instance
     * @returns {Object|null} Supabase client or null if unavailable
     */
    function getClient() {
        if (!client && !initialized) {
            init();
        }
        return client;
    }

    /**
     * Check if Supabase is available and configured
     * @returns {boolean} True if client is ready
     */
    function isAvailable() {
        return getClient() !== null;
    }

    /**
     * Get the last initialization error
     * @returns {Error|null}
     */
    function getInitError() {
        return initError;
    }

    // Initialize availability flag
    window.__SUPABASE_AVAILABLE = false;

    // Public API
    return {
        getClient: getClient,
        isAvailable: isAvailable,
        getInitError: getInitError
    };
})();