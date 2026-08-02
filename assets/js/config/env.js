/**
 * ============================================================
 * ZT Lounge Meru - Environment Variable Loader
 * Version: 1.0.0
 * ============================================================
 *
 * This static site has no build step. At deploy time, inject the
 * Supabase URL and anon key into the browser via
 * window.__SUPABASE_CONFIG (populated from environment variables
 * by your hosting provider / deploy script).
 *
 * Example deploy-time injection (before this script runs):
 *   <script>
 *     window.__SUPABASE_CONFIG = {
 *       url: process.env.NEXT_PUBLIC_SUPABASE_URL,
 *       anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
 *     };
 *   </script>
 *
 * This file MUST be loaded BEFORE config/supabase.config.js so the
 * runtime override takes effect.
 *
 * SECURITY:
 * - Only the PUBLIC anon key is ever injected here.
 * - The service_role key must NEVER be exposed to the browser.
 * ============================================================
 */

(function () {
  "use strict";

  // If a deploy-time config is already present, leave it alone.
  if (window.__SUPABASE_CONFIG) {
    return;
  }

  // Fallback: read from a global ENV object if provided by the host
  // (e.g. window.__ENV = { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY }).
  var env = window.__ENV || {};

  var url = env.NEXT_PUBLIC_SUPABASE_URL || "";
  var anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  // Only set the override if both values are present and non-placeholder.
  if (
    url &&
    anonKey &&
    url.indexOf("your-project-id") === -1 &&
    anonKey.indexOf("...") === -1
  ) {
    window.__SUPABASE_CONFIG = {
      url: url,
      anonKey: anonKey,
    };
  }
})();