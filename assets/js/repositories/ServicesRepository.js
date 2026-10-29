/**
 * ============================================================
 * ZT Lounge Meru - Services Repository
 * Abstraction layer for services section content
 * Version: 2.1.0
 * ============================================================
 * 
 * Public Interface:
 * - ServicesRepository.getByPage(pageId)
 * - ServicesRepository.getServices()
 * - ServicesRepository.getExperiences(pageId)
 * - ServicesRepository.getFeatures(pageId)
 * 
 * Data Source: Supabase services table only; page slugs and card types match live schema.
 * Every image-bearing row resolves through media_id -> media_assets.public_url.
 * Invalid or missing media is never replaced with a local image URL.
 * ============================================================
 */

window.ServicesRepository = (function() {
    'use strict';

    var repo = null;

    /**
     * Map Supabase database fields to UI-expected fields
     * @param {Object} item - Raw database item
     * @returns {Object} Mapped item
     */
    function mapToUI(item) {
        if (!item) return null;
        var typeRelation = item.service_card_types;
        if (Array.isArray(typeRelation)) typeRelation = typeRelation[0];
        var typeSlug = typeRelation && typeRelation.slug || "";
        var typeMap = { nav: "service", info: "experience", pkg: "package" };
        return {
            id: item.id,
            name: item.name || "",
            image_url: null,
            alt_text: item.alt_text || "",
            tag: item.tag || "",
            href: item.href || "",
            description: item.description || "",
            type: typeMap[typeSlug] || "",
            card_type: typeSlug || null,
            display_order: item.display_order || 0,
            page_id: item.page_id || "",
            icon: item.icon || "",
            category_id: item.category_id || "",
            media_id: item.media_id || null
        };
    }

    function resolveMedia(rows) {
        var valid = (rows || []).filter(function(row) { return row !== null; });
        var withMedia = valid.filter(function(row) { return !!row.media_id; });
        if (!withMedia.length) return Promise.resolve(valid);
        if (!window.MediaResolver || typeof window.MediaResolver.resolveCollection !== "function") {
            return Promise.reject(new Error("MEDIA_RESOLVER_UNAVAILABLE"));
        }
        return window.MediaResolver.resolveCollection(withMedia).then(function() { return valid; });
    }

    function getRepo() {
        if (!repo) {
            repo = window.BaseRepository.create(
                window.SupabaseConfig.tables.services,
                function() { return []; },
                { cacheTTL: 300000 }
            );
        }
        return repo;
    }

    /**
     * Get services for a specific page
     * @param {string} pageId - Page identifier
     * @returns {Promise<Object>} Services configuration
     */
    function getByPage(pageId) {
        if (!pageId) return Promise.resolve({ services: [], experiences: [], features: [], packages: [] });

        function queryBySlug(pageSlug) {
            return getRepo().getAll({
                select: "*,service_card_types(slug)",
                eq: [
                    { column: "page_id", value: pageSlug },
                    { column: "is_active", value: true }
                ],
                orderBy: "display_order",
                ascending: true
            }).then(function(data) {
                return resolveMedia((data || []).map(mapToUI)).then(function(rows) {
                    return {
                        services: rows.filter(function(row) { return row.type === "service"; }),
                        experiences: rows.filter(function(row) { return row.type === "experience"; }),
                        features: rows.filter(function(row) { return row.type === "feature"; }),
                        packages: rows.filter(function(row) { return row.type === "package"; })
                    };
                });
            });
        }

        // The live services.page_id stores page slugs, not website_pages UUIDs.
        var UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!UUID_REGEX.test(pageId)) return queryBySlug(pageId);

        var client = window.SupabaseClient && window.SupabaseClient.getClient();
        if (!client) return Promise.reject(new Error("SUPABASE_CLIENT_UNAVAILABLE"));
        return client.from("website_pages").select("slug").eq("id", pageId).maybeSingle().then(function(result) {
            if (result.error) throw result.error;
            if (!result.data || !result.data.slug) throw new Error("PAGE_SLUG_NOT_FOUND");
            return queryBySlug(result.data.slug);
        });
    }


    /**
     * Get all service cards for homepage
     * @returns {Promise<Array>} Array of service objects
     */
    function getServices() {
        return getByPage('home').then(function(cfg) {
            return cfg.services || [];
        });
    }

    /**
     * Get experience highlights for a service page
     * @param {string} pageId - Service page identifier
     * @returns {Promise<Array>} Array of experience objects
     */
    function getExperiences(pageId) {
        return getByPage(pageId).then(function(cfg) {
            return cfg.experiences || [];
        });
    }

    /**
     * Get feature highlights for a service page
     * @param {string} pageId - Service page identifier
     * @returns {Promise<Array>} Array of feature objects
     */
    function getFeatures(pageId) {
        return getByPage(pageId).then(function(cfg) {
            return cfg.features || [];
        });
    }

    /** Get all active services (no page filter) */
    function getAll() {
        return getRepo().getAll({
            select: "*,service_card_types(slug)",
            eq: [{ column: "is_active", value: true }],
            orderBy: "display_order",
            ascending: true
        }).then(function(data) {
            return resolveMedia((data || []).map(mapToUI));
        });
    }


    /** Get all active package-type services */
    function getPackages() {
        return getRepo().getAll({
            select: "*,service_card_types(slug)",
            eq: [{ column: "is_active", value: true }],
            orderBy: "display_order",
            ascending: true
        }).then(function(data) {
            var mapped = (data || []).map(mapToUI).filter(function(row) { return row.type === "package"; });
            return resolveMedia(mapped);
        });
    }


     * Get active services for a specific category (resolved by slug).
     * @param {string} categorySlug - Category slug (e.g. 'barbershop')
     * @returns {Promise<Array>} Array of mapped service objects
     */
    function getByCategory(categorySlug) {
        var client = window.SupabaseClient && window.SupabaseClient.getClient();
        if (!client) return Promise.reject(new Error("SUPABASE_CLIENT_UNAVAILABLE"));

        return client.from(window.SupabaseConfig.tables.serviceCategories || "service_categories")
            .select("id")
            .eq("slug", categorySlug)
            .eq("is_active", true)
            .maybeSingle()
            .then(function(catRes) {
                if (catRes.error) throw catRes.error;
                if (!catRes.data) return [];
                return getRepo().getAll({
                    select: "*,service_card_types(slug)",
                    eq: [
                        { column: "category_id", value: catRes.data.id },
                        { column: "is_active", value: true }
                    ],
                    orderBy: "display_order",
                    ascending: true
                }).then(function(data) {
                    var mapped = (data || []).map(mapToUI).filter(function(row) { return row.type === "service"; });
                    return resolveMedia(mapped);
                });
            });
    }


    return {
        getByPage: getByPage,
        getServices: getServices,
        getExperiences: getExperiences,
        getFeatures: getFeatures,
        getAll: getAll,
        getPackages: getPackages,
        getByCategory: getByCategory
    };
})();