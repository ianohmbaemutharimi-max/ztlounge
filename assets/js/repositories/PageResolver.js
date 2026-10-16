/**
 * ============================================================
 * ZT Lounge - Canonical Page Resolver (hardening phase)
 * ============================================================
 *
 * The ONLY component allowed to convert a PageId into the
 * website_pages UUID used by page-linked CMS columns
 * (gallery.page_id, faqs.page_id, testimonials.page_id, …).
 *
 * Resolution states (never collapsed into a silent []):
 *   { state: 'resolved', id }        — UUID available
 *   { state: 'missing-page-record' }  — page has no CMS row (expected)
 *   { state: 'invalid-page' }         — PageId not in canonical set
 *   { state: 'dependency-missing' }   — Supabase client unavailable
 *   { state: 'db-error', error }      — database failure
 *
 * Results are cached per page load. No timeouts. One projection
 * fallback exists: when migration 043 (Phase 2C toggle columns) has not
 * been applied yet, the query retries with the legacy column set so
 * page resolution keeps working and the toggles simply default ON.
 *
 * Also owns the OUTBOUND direction (resolvePageKeysByIds): website_pages.id
 * → page_key, so a page-linked CMS column (e.g. promotions.page_id) can be
 * turned back into the public page it represents without a second resolver.
 */
window.PageResolver = (function () {
    'use strict';

    var cache = {}; // pageId -> completed result object (per document lifetime)
    var inFlight = {}; // pageId -> pending resolvePageRecord Promise
    var byIdCache = {}; // website_pages.id -> page_key (per document lifetime)

    // Legacy projection: every consumer only ever needed id/page_key/title.
    var LEGACY_COLUMNS = 'id,page_key,title';
    // Phase 2C: adds the section-visibility toggles so renderers can gate
    // #services / #pricing without a second query.
    var PHASE2C_COLUMNS = 'id,page_key,title,service_cards_enabled,service_packages_enabled';

    function ensureSupabase() {
        if (window.supabaseClient) return window.supabaseClient;
        if (window.SupabaseClient && window.SupabaseClient.getClient) {
            return window.SupabaseClient.getClient();
        }
        return null;
    }

    /** Raw PostgREST row fetch for one page_key with the given projection. */
    function fetchPageRow(pageKey, columns) {
        return ensureSupabase()
            .from('website_pages')
            .select(columns)
            .eq('page_key', pageKey)
            .maybeSingle();
    }

    /**
     * Classify one fetch result into the canonical resolution states.
     * When the Phase 2C columns were selected, the toggles are normalized
     * onto the resolved record (missing/false-y values fail OPEN = enabled).
     */
    function classifyResult(pageId, res, withFlags) {
        if (res.error) {
            return { state: 'db-error', error: res.error, pageId: pageId };
        }
        if (!res.data) {
            return { state: 'missing-page-record', pageId: pageId };
        }
        var result = { state: 'resolved', id: res.data.id, pageId: pageId };
        if (withFlags) {
            result.serviceCardsEnabled = res.data.service_cards_enabled !== false;
            result.servicePackagesEnabled = res.data.service_packages_enabled !== false;
        }
        return result;
    }

    /**
     * @param {string} pageId canonical PageId (see window.PageIdentity)
     * @returns {Promise<{state:string,id?:string,error?:any}>}
     */
    function resolvePageRecord(pageId) {
        if (!window.PageIdentity || !window.PageIdentity.isValidPageId(pageId)) {
            return Promise.resolve({ state: 'invalid-page', pageId: pageId });
        }
        if (cache[pageId]) {
            return Promise.resolve(cache[pageId]);
        }
        if (inFlight[pageId]) {
            return inFlight[pageId];
        }

        var client = ensureSupabase();
        if (!client) {
            var dep = { state: 'dependency-missing', dependency: 'SupabaseClient' };
            cache[pageId] = dep; // do not hammer a broken environment per subsystem
            return Promise.resolve(dep);
        }

        var pageKey = window.PageIdentity.pageKeyForPageId(pageId);
        if (!pageKey) {
            // Canonical fact: this page has no CMS record namespace.
            var none = { state: 'missing-page-record', pageId: pageId };
            cache[pageId] = none;
            return Promise.resolve(none);
        }

        var pending = fetchPageRow(pageKey, PHASE2C_COLUMNS)
            .then(function (res) {
                if (res.error) {
                    // Migration 043 not applied yet (unknown-column error):
                    // retry with the legacy projection so page resolution —
                    // and every page-scoped CMS column — keeps working.
                    // Toggles are then absent from the record, and callers
                    // fail OPEN (both sections enabled = pre-Phase-2C state).
                    return fetchPageRow(pageKey, LEGACY_COLUMNS).then(function (legacyRes) {
                        return classifyResult(pageId, legacyRes, false);
                    });
                }
                return classifyResult(pageId, res, true);
            })
            .then(function (result) {
                cache[pageId] = result;
                return result;
            })
            .catch(function (err) {
                var failure = { state: 'db-error', error: err, pageId: pageId };
                cache[pageId] = failure;
                return failure;
            });

        inFlight[pageId] = pending;
        pending.then(function () {
            if (inFlight[pageId] === pending) delete inFlight[pageId];
        }, function () {
            if (inFlight[pageId] === pending) delete inFlight[pageId];
        });
        return pending;
    }

    /**
     * Convenience for repositories: resolves the UUID or rejects with a
     * typed reason. Missing page record REJECTS too — callers decide
     * whether absence is acceptable, but it is never disguised as data.
     */
    function requirePageUuid(pageId, subsystem) {
        return resolvePageRecord(pageId).then(function (r) {
            if (r.state === 'resolved') return r.id;
            var err = new Error('Page resolution failed: ' + r.state);
            err.code = r.state === 'missing-page-record' ? 'MISSING_PAGE_RECORD'
                     : r.state === 'invalid-page' ? 'INVALID_PAGE_ID'
                     : r.state === 'dependency-missing' ? 'MISSING_DEPENDENCY'
                     : 'DB_ERROR';
            err.detail = r;
            if (window.CMSReport) {
                window.CMSReport.warn(subsystem || 'PageResolver', 'requirePageUuid', err.code);
            }
            throw err;
        });
    }

    /**
     * OUTBOUND identity: website_pages.id → page_key.
     *
     * The inverse of resolvePageRecord, used to turn a page-linked CMS column
     * (e.g. promotions.page_id) back into the public page it represents.
     * One batched query for all uncached ids; cached per document lifetime.
     * Never rejects — ids that cannot be resolved are simply absent from the
     * returned map, and callers decide the fallback.
     *
     * @param {string[]} ids website_pages UUIDs
     * @returns {Promise<Object>} map of uuid → page_key (resolved ids only)
     */
    function resolvePageKeysByIds(ids) {
        var wanted = [];
        (ids || []).forEach(function (id) {
            if (id && !byIdCache[id] && wanted.indexOf(id) === -1) wanted.push(id);
        });
        if (!wanted.length) return Promise.resolve(byIdCache);

        var client = ensureSupabase();
        if (!client) return Promise.resolve(byIdCache);

        return client
            .from('website_pages')
            .select('id,page_key')
            .in('id', wanted)
            .then(function (res) {
                if (!res.error && res.data) {
                    res.data.forEach(function (row) {
                        if (row && row.id && row.page_key) byIdCache[row.id] = row.page_key;
                    });
                }
                return byIdCache;
            })
            .catch(function () {
                return byIdCache;
            });
    }

    /** Convenience: single-id inverse lookup (null when unresolved). */
    function resolvePageKeyById(id) {
        return resolvePageKeysByIds([id]).then(function (map) {
            return map[id] || null;
        });
    }

    return {
        resolvePageRecord: resolvePageRecord,
        requirePageUuid: requirePageUuid,
        resolvePageKeysByIds: resolvePageKeysByIds,
        resolvePageKeyById: resolvePageKeyById
    };
})();
