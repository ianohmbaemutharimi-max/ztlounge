/**
 * ============================================================
 * ZT Lounge Meru - Membership Repository (PUBLIC, canonical)
 * Version: 1.0.0
 * ============================================================
 *
 * Public Interface:
 * - MembershipRepository.getPublicPlans()              -> active plans w/ benefits
 * - MembershipRepository.getFeeSummary()               -> { fee, consistent, total }
 * - MembershipRepository.getBenefitsForPlan(planId)    -> active benefits
 *
 * Data Source: Supabase public.membership_plans + public.membership_plan_benefits
 * (NO fallback that fabricates content). RLS additionally enforces the
 * public contract server-side:
 *   membership_plans_public_read          -> is_active = true only
 *   membership_plan_benefits_public_read  -> is_active AND plan is active
 *   customer_memberships                  -> NO public read (zero exposure)
 *
 * BENEFITS: freeform CMS rows (no service FK). Benefits are marketing
 * content, NOT entitlement rules. No discount / priority enforcement here.
 * ============================================================
 */

window.MembershipRepository = (function() {
    'use strict';

    var plansRepo = null;
    var benefitsRepo = null;

    function getPlansRepo() {
        if (!plansRepo) {
            var config = window.SupabaseConfig || {};
            plansRepo = window.BaseRepository.create(
                (config.tables && config.tables.membershipPlans) || 'membership_plans',
                function() { return []; }, // DB-only; no fabricated plans
                { cacheTTL: 300000 }
            );
        }
        return plansRepo;
    }

    function getBenefitsRepo() {
        if (!benefitsRepo) {
            var config = window.SupabaseConfig || {};
            benefitsRepo = window.BaseRepository.create(
                (config.tables && config.tables.membershipPlanBenefits) || 'membership_plan_benefits',
                function() { return []; }, // DB-only; no fabricated benefits
                { cacheTTL: 300000 }
            );
        }
        return benefitsRepo;
    }

    /** Public visibility: RLS already filters; re-check defensively. */
    function isPublicPlan(p) {
        return !!(p && p.is_active === true);
    }

    /** Map a canonical plan row -> UI shape (snake_case preserved). */
    function mapPlan(item) {
        return {
            id: item.id,
            name: item.name || '',
            slug: item.slug || '',
            description: item.description ?? null,
            annual_price: (item.annual_price !== null && item.annual_price !== undefined)
                ? Number(item.annual_price) : null,
            registration_fee: (item.registration_fee !== null && item.registration_fee !== undefined)
                ? Number(item.registration_fee) : null,
            media_id: item.media_id || null,
            display_order: Number(item.display_order || 0),
            is_active: item.is_active === true,
            cta_text: item.cta_text || '',
            cta_link: item.cta_link || '',
            image_url: null, // resolved from media_assets by resolveMedia()
            benefits: []    // filled by getPublicPlans()
        };
    }

    /** Map a canonical benefit row -> UI shape. */
    function mapBenefit(item) {
        return {
            id: item.id,
            plan_id: item.plan_id || null,
            description: item.description || '',
            display_order: Number(item.display_order || 0),
            is_active: item.is_active === true
        };
    }

    /** Canonical sorting: display_order ASC, then created_at ASC. */
    function sortByDisplayOrder(items) {
        return items.slice().sort(function(a, b) {
            var d = a.display_order - b.display_order;
            if (d !== 0) return d;
            return String(a.created_at || '').localeCompare(String(b.created_at || ''));
        });
    }

    /** Resolve plan images through the canonical public MediaResolver. */
    function resolveMedia(items) {
        if (window.MediaResolver && window.MediaResolver.resolveCollection) {
            return window.MediaResolver.resolveCollection(items);
        }
        return Promise.resolve(items);
    }

    /**
     * All publicly visible plans (RLS-filtered), canonically ordered,
     * with their active benefits attached.
     * @returns {Promise<Array>}
     */
    function getPublicPlans() {
        return getPlansRepo()
            .getAll({ orderBy: 'display_order', ascending: true })
            .then(function(rows) {
                var plans = (rows || []).filter(isPublicPlan).map(mapPlan);
                return sortByDisplayOrder(plans);
            })
            .then(function(plans) {
                if (!plans.length) return plans;
                var planIds = plans.map(function(p) { return p.id; });
                return getBenefitsRepo().getAll({ orderBy: 'display_order', ascending: true })
                    .then(function(benefitRows) {
                        var benefits = (benefitRows || [])
                            .filter(function(b) { return b.is_active === true && planIds.indexOf(b.plan_id) !== -1; })
                            .map(mapBenefit);
                        plans.forEach(function(plan) {
                            plan.benefits = sortByDisplayOrder(
                                benefits.filter(function(b) { return b.plan_id === plan.id; })
                            );
                        });
                        return plans;
                    });
            })
            .then(resolveMedia);
    }
/**
     * Canonical registration fee (KSh 1,000 per current business requirement).
     * The fee lives on each plan row (membership_plans.registration_fee). The
     * shared banner line reads from the first active plan's fee so it always
     * agrees with the plan-level snapshot.
     * @returns {Promise<number>}
     */
    function getFeeSummary() {
        return getPublicPlans().then(function(plans) {
            var fees = plans.map(function(plan) { return plan.registration_fee; })
                .filter(function(fee) { return fee !== null && fee !== undefined; });
            var first = fees.length ? fees[0] : null;
            return {
                fee: first,
                consistent: fees.length === plans.length &&
                    fees.every(function(fee) { return fee === first; }),
                total: plans.length
            };
        });
    }

    /** Active benefits for a single plan (used defensively). */
    function getBenefitsForPlan(planId) {
        return getBenefitsRepo()
            .getAll({ orderBy: 'display_order', ascending: true })
            .then(function(rows) {
                return sortByDisplayOrder(
                    (rows || [])
                        .filter(function(b) { return b.is_active === true && b.plan_id === planId; })
                        .map(mapBenefit)
                );
            });
    }

    return {
        getPublicPlans: getPublicPlans,
        getFeeSummary: getFeeSummary,
        getBenefitsForPlan: getBenefitsForPlan,
        clearCache: function() {
            if (plansRepo) plansRepo.clearCache();
            if (benefitsRepo) benefitsRepo.clearCache();
        }
    };
})();