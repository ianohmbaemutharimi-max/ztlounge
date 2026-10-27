// Type declarations for assets/js/lib/booking-time.js
// (UMD-style browser + Node module; canonical Africa/Nairobi clock).
export interface BookingTimeApi {
    /** Canonical business timezone ("Africa/Nairobi"). */
    TIMEZONE: string;
    /** Today's date in the business timezone, YYYY-MM-DD. */
    todayISO(now?: Date): string;
    /** Current wall time in the business timezone, HH:MM (24h). */
    nowHM(now?: Date): string;
    /**
     * True when the requested slot lies entirely in the past.
     * Equal current minute counts as past; missing time on today
     * returns false (server owns the final decision).
     */
    isPastSlot(
        dateISO: string | undefined | null,
        timeHM?: string | null,
        now?: Date
    ): boolean;
}
declare const BookingTime: BookingTimeApi;
export default BookingTime;
