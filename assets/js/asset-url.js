/**
 * ============================================================
 * ZT Lounge Meru - Centralized Asset URL Helper
 * Version: 1.1.0 (Legacy Passthrough — Media Gateway Migration)
 * ============================================================
 * LEGACY: New media references MUST go through the canonical
 * media_assets gateway (MediaResolver / MediaDomResolver with
 * media_id). This helper remains only as a URL normalizer for
 * legacy relative paths; it returns full Supabase URLs unchanged
 * (passthrough), so canonical MediaResolver output is unaffected.
 *
 * All media assets are stored in the Supabase Storage bucket
 * "public-assets" under the "images/" folder hierarchy.
 *
 * Public URL format:
 *   https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/public-assets/images/{category}/{filename}
 * ============================================================
 */

(function() {
    'use strict';

    // Supabase Storage configuration
    var SUPABASE_URL = 'https://jczwilrysvnhcjzjztbi.supabase.co';
    var BUCKET_ID = 'public-assets';
    var STORAGE_BASE = SUPABASE_URL + '/storage/v1/object/public/' + BUCKET_ID;

    /**
     * Resolve a local asset path to a Supabase Storage public URL.
     *
     * Accepts any of these input formats:
     *   - "assets/images/autospa/autospa-1.webp"
     *   - "../../assets/images/branding/logo.webp"
     *   - "https://ztlounge.co.ke/assets/images/restaurant/interior.webp"
     *   - "images/autospa/autospa-1.webp" (already relative to bucket)
     *
     * @param {string} path - Local asset path
     * @returns {string} Supabase Storage public URL
     */
    function assetUrl(path) {
        if (!path) return '';

        // Already a full Supabase URL — return as-is
        if (path.indexOf(SUPABASE_URL) === 0) return path;

        // Strip protocol + domain if it's an absolute ztlounge.co.ke URL
        // e.g. "https://ztlounge.co.ke/assets/images/..." → "assets/images/..."
        var cleaned = path.replace(/^https?:\/\/[^/]+\/?/, '');

        // Strip leading relative path prefixes
        // e.g. "../../assets/images/..." → "assets/images/..."
        // e.g. "./assets/images/..." → "assets/images/..."
        cleaned = cleaned.replace(/^(\.\.\/)+/, '');
        cleaned = cleaned.replace(/^\.\//, '');

        // Strip "assets/" prefix if present
        // e.g. "assets/images/autospa/..." → "images/autospa/..."
        if (cleaned.indexOf('assets/') === 0) {
            cleaned = cleaned.substring(7);
        }

        // Ensure it starts with "images/"
        if (cleaned.indexOf('images/') !== 0 && cleaned.indexOf('images/') !== 0) {
            cleaned = 'images/' + cleaned;
        }

        return STORAGE_BASE + '/' + cleaned;
    }

    // Export to window
    window.AssetUrl = {
        resolve: assetUrl,
        BASE: STORAGE_BASE
    };
})();