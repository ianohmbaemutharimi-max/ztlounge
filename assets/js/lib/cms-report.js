/**
 * ============================================================
 * ZT Lounge - Structured CMS Diagnostics (hardening phase)
 * ============================================================
 *
 * Single error-reporting channel for all public CMS subsystems.
 * Every message identifies: subsystem, operation, page, and a
 * machine-readable error code â€” never a generic failure.
 *
 * Error codes used across the hardened pipeline:
 *   INVALID_PAGE_ID       page identity not in canonical set
 *   MISSING_DEPENDENCY    required global/script absent
 *   MISSING_PAGE_RECORD   page has no website_pages row (expected absence)
 *   DB_ERROR              Supabase/PostgREST failure
 *   API_MISMATCH          referenced repository method does not exist
 *   BOOKING_CONFLICT      expected business outcome (slot taken)
 */
window.CMSReport = (function () {
    'use strict';

    function fmt(subsystem, operation, code, extra) {
        var page = (window.PageIdentity && window.PageIdentity.getCanonicalPageId()) || 'unknown';
        var msg = '[CMS][' + subsystem + '] operation=' + operation +
                  ' page=' + page + ' error=' + code;
        if (extra) msg += ' detail=' + extra;
        return msg;
    }

    return {
        info: function (subsystem, operation, code, extra) {
            console.info(fmt(subsystem, operation, code, extra));
        },
        warn: function (subsystem, operation, code, extra) {
            console.warn(fmt(subsystem, operation, code, extra));
        },
        error: function (subsystem, operation, code, extra) {
            console.error(fmt(subsystem, operation, code, extra));
        }
    };
})();
