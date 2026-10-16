/**
 * ============================================================
 * ZT Lounge Meru - Membership Configuration
 * Version: 1.0.0
 * ============================================================
 *
 * CANONICAL MEMBERSHIP CONFIG VALUES.
 *
 * IMPORTANT:
 * - Plan content (names, prices, descriptions, benefits, images, active
 *   state) comes EXCLUSIVELY from Supabase public.membership_plans +
 *   public.membership_plan_benefits — it is Admin-editable CMS data and
 *   NEVER hardcoded here.
 * - This file holds only shared configuration constants that are not
 *   record data, plus an EMPTY fallback (no fabricated plans).
 * ============================================================
 */

window.MembershipConfig = Object.freeze({
    currency: 'KSh',
    currencyLocale: 'en-KE',
    pricePeriodLabel: 'per year',
    feeNote: 'applies to all membership levels',
    feeNoteMixed: 'see each tier for its registration fee',
    teaserLimit: 4,
    ctaFallbackText: 'Enquire now'
});