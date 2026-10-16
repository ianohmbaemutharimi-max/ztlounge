/**
 * ============================================================
 * ZT Lounge - Canonical Booking Time Helpers (business timezone)
 * ============================================================
 *
 * SINGLE SOURCE OF TRUTH for "is this booking slot in the past?"
 * on the public site (UX validation ONLY — the create_booking RPC /
 * database trigger remain the authoritative enforcement).
 *
 * Canonical business timezone: Africa/Nairobi (Kenya, UTC+3, no DST).
 *
 * All comparisons operate on real instants represented as combined
 * date+time strings in the business timezone (never separate DATE and
 * TIME compared against different clocks).
 *
 * Loads in the browser (window.BookingTime) AND in Node (module.exports)
 * so the exact same logic is unit-testable.
 */
(function (root, factory) {
    'use strict';
    var api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    root.BookingTime = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
    'use strict';

    /** Canonical business timezone. Never compare against another clock. */
    var BUSINESS_TIMEZONE = 'Africa/Nairobi';

    /**
     * Today's date in the business timezone, YYYY-MM-DD.
     * en-CA locale yields ISO ordering directly.
     */
    function todayISO(now) {
        var d = now || new Date();
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: BUSINESS_TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(d);
    }

    /** Current wall-clock time in the business timezone, HH:MM (24h). */
    function nowHM(now) {
        var d = now || new Date();
        var hm = new Intl.DateTimeFormat('en-GB', {
            timeZone: BUSINESS_TIMEZONE,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(d);
        // Some engines format midnight as "24:00"; normalize to "00:00".
        if (hm.indexOf('24:') === 0) hm = '00:' + hm.slice(3);
        return hm;
    }

    /**
     * Whether the requested slot lies entirely in the past.
     * @param {string} dateISO - booking_date, YYYY-MM-DD
     * @param {string} [timeHM] - start_time, HH:MM (or HH:MM:SS)
     * @param {Date} [now] - injectable clock (tests); defaults to real now
     * @returns {boolean} true when the slot is already past
     */
    function isPastSlot(dateISO, timeHM, now) {
        if (!dateISO || typeof dateISO !== 'string') return true;
        var date = String(dateISO).slice(0, 10);
        var today = todayISO(now);

        // Pure string comparison is correct for zero-padded ISO dates.
        if (date < today) return true;   // yesterday or older -> past
        if (date > today) return false;  // tomorrow or later -> future

        // Same business day: compare combined instant via HH:MM strings.
        if (!timeHM || typeof timeHM !== 'string') {
            // No time supplied on today's date: cannot prove it is past
            // here; the server-side check owns the final decision.
            return false;
        }
        var requested = String(timeHM).slice(0, 5); // HH:MM (drop :SS)
        var current = nowHM(now);
        // Equal time counts as past: "TODAY + CURRENT/PAST TIME -> REJECT".
        return requested <= current;
    }

    return {
        TIMEZONE: BUSINESS_TIMEZONE,
        todayISO: todayISO,
        nowHM: nowHM,
        isPastSlot: isPastSlot
    };
});
