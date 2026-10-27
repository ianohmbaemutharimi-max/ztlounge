/**
 * ============================================================
 * ZT Lounge Meru - Promotion Repository
 * Canonical public promotions data access
 * Version: 1.0.0
 * ============================================================
 *
 * Public Interface:
 * - PromotionRepository.getEligible()         â†’ publicly eligible promotions
 * - PromotionRepository.getHomepageEligible() â†’ eligible + show_on_homepage=true
 * - PromotionRepository.isEligible(p)         â†’ canonical eligibility rule
 * - PromotionRepository.status(p)             â†’ canonical status rule
 *
 * Data Source: Supabase public.promotions table ONLY (no fallback,
 * no second promotion source). RLS additionally enforces eligibility
 * server-side (public_can_read_active_promotions), so ineligible rows never even
 * reach this layer over the network.
 *
 * CANONICAL ELIGIBILITY RULE (mirrors admin src/lib/promotions/status.ts):
 *   is_active = true
 *   AND Nairobi business date >= start_date
 *   AND Nairobi business date <= end_date
 *   NULL start_date OR NULL end_date => NOT eligible
 * ============================================================
 */

window.PromotionRepository = (function() {
    'use strict';

    var repo = null;
    var PROMOTION_TIMEZONE = 'Africa/Nairobi';

    function getRepo() {
        if (!repo) {
            var config = window.SupabaseConfig || {};
            var tableName = config.tables && config.tables.promotions
                ? config.tables.promotions
                : 'promotions';
            repo = window.BaseRepository.create(
                tableName,
                function() { return []; }, // no static fallback promotions â€” ever
                { cacheTTL: 300000 }
            );
        }
        return repo;
    }

    /**
     * Current business date in Africa/Nairobi as "YYYY-MM-DD".
     * Never uses the browser-local timezone.
     */
    function nairobiToday() {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: PROMOTION_TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date());
    }

    /**
     * Canonical status derivation. Never trusts is_active alone.
     * Date-aware: compares Nairobi business date (start_time/end_time are retired).
     *   scheduled = is_active AND nairobi_today < start_date
     *   active    = is_active AND start_date <= nairobi_today <= end_date
     *   expired   = is_active AND nairobi_today > end_date
     *   inactive  = is_active = false
     *   invalid_dates = is_active but missing start_date or end_date
     */
    function status(p) {
        if (!p || p.is_active !== true) return 'inactive';
        var startDate = String(p.start_date || '').slice(0, 10);
        var endDate = String(p.end_date || '').slice(0, 10);
        if (!startDate || !endDate) return 'invalid_dates';
        
        // Date-only eligibility. start_time/end_time columns do not exist,
        // so scheduling is by Nairobi business date only - matches
        // getPromoStatus (admin grid) and the F1 RLS predicate.
        var today = nairobiToday();
        
        if (today < startDate) return 'scheduled';
        if (today > endDate) return 'expired';
        return 'active';
    }

    /**
     * Single public-visibility rule. Only "active" promotions are
     * publicly eligible. Defense in depth: RLS already filters
     * server-side; this guarantees client consumers agree.
     */
    function isEligible(p) {
        return status(p) === 'active';
    }

    /**
     * Map a canonical DB row to the UI shape (canonical field names kept).
     */
    function mapToUI(item) {
        return {
            id: item.id,
            title: item.title || '',
            description: item.description || '',
            discount_percent: (item.discount_percent !== null && item.discount_percent !== undefined)
                ? Number(item.discount_percent) : null,
            start_date: item.start_date || null,
            end_date: item.end_date || null,
            is_active: item.is_active === true,
            page_id: item.page_id || null,
            media_id: item.media_id || null,
            show_on_homepage: item.show_on_homepage === true,
            display_order: Number(item.display_order || 0),
            image_url: null, // resolved from media_assets by resolveMedia()
            alt_text: item.title || 'ZT Lounge promotion'
        };
    }

    /**
     * Resolve media URLs through the canonical public MediaResolver
     * (promotions.media_id â†’ media_assets.public_url, one batched query,
     * session-cached). Delegation keeps a SINGLE resolver in the codebase.
     * Legacy banner_image is intentionally never used.
     */
    function resolveMedia(items) {
        if (window.MediaResolver && window.MediaResolver.resolveCollection) {
            return window.MediaResolver.resolveCollection(items);
        }
        // MediaResolver absent: presentation fallback is no resolution
        // (never silently fall back to legacy banner_image).
        return Promise.resolve(items);
    }

    /**
     * Sort canonically: display_order ASC, then created_at ASC.
     */
    function sortByDisplayOrder(items) {
        return items.slice().sort(function(a, b) {
            var d = a.display_order - b.display_order;
            if (d !== 0) return d;
            return String(a.created_at || '').localeCompare(String(b.created_at || ''));
        });
    }

    /**
     * All publicly eligible promotions, canonically ordered.
     * @returns {Promise<Array>}
     */
    function getEligible() {
        return getRepo()
            .getAll({ orderBy: 'display_order', ascending: true })
            .then(function(rows) {
                var eligible = (rows || []).filter(isEligible).map(mapToUI);
                return sortByDisplayOrder(eligible);
            })
            .then(resolveMedia);
    }

    /**
     * Homepage group subset: eligible AND show_on_homepage = true,
     * ordered by display_order ASC.
     * @returns {Promise<Array>}
     */
    function getHomepageEligible() {
        return getEligible().then(function(eligible) {
            return eligible.filter(function(p) { return p.show_on_homepage; });
        });
    }

    return {
        getEligible: getEligible,
        getHomepageEligible: getHomepageEligible,
        isEligible: isEligible,
        status: status,
        nairobiToday: nairobiToday,
        clearCache: function() { if (repo) repo.clearCache(); }
    };
})();

