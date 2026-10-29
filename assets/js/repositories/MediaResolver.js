/**
 * ============================================================
 * ZT Lounge Meru - Media Resolver (EXCLUSIVE GATEWAY)
 * Version: 2.0.0 (Phase 3 Refactoring)
 * Date: 2026-10-09
 * ============================================================
 *
 * TRANSFORMATION: Fallback Model → Exclusive Gateway
 *
 * OLD (v1.0.0):
 *   - media_id + cache lookup (primary)
 *   - Falls back to legacy image_url if media_id missing/fails
 *   - Non-fatal: always returns item (possibly with stale data)
 *
 * NEW (v2.0.0):
 *   - media_id REQUIRED; throws error if missing
 *   - No fallback pathway
 *   - Enforces contract: ALL items MUST have media_id
 *   - Batched: one query per page load, cached in-memory (no N+1)
 *
 * ============================================================
 */

window.MediaResolver = (function() {
    'use strict';

    var cache = {}; // media_asset id -> { public_url, alt_text }
    var fetchInFlight = {}; // Batch key -> pending Promise (deduplication)

    function getClient() {
        return (window.SupabaseClient && typeof window.SupabaseClient.getClient === 'function')
            ? window.SupabaseClient.getClient()
            : null;
    }

    /**
     * A canonical public URL must be an absolute HTTPS URL on the configured
     * Supabase project host and use the public Storage URL path. Never repair
     * a bad URL in the browser; report it so the registry data can be fixed.
     */
    function isCanonicalPublicUrl(url) {
        if (typeof url !== 'string' || !url.trim()) return false;
        try {
            var parsed = new URL(url);
            var configured = window.SupabaseConfig && window.SupabaseConfig.url;
            if (!configured) return false;
            var expected = new URL(configured);
            return parsed.protocol === 'https:' &&
                parsed.host === expected.host &&
                parsed.pathname.indexOf('/storage/v1/object/public/') === 0;
        } catch (error) {
            return false;
        }
    }

    function fetchAssets(ids) {
        var client = getClient();
        if (!client) return Promise.reject(new Error('NO_SUPABASE_CLIENT'));
        return client
            .from('media_assets')
            .select('id, public_url, alt_text')
            .in('id', ids);
    }

    /** Load any ids not yet cached. Never rejects. Deduplicates parallel batch requests. */
    function loadMissing(ids) {
        var missing = [];
        ids.forEach(function(id) {
            if (id && !cache[id] && missing.indexOf(id) === -1) missing.push(id);
        });
        if (!missing.length) return Promise.resolve();
        
        // Create deterministic batch key to deduplicate identical parallel requests
        var batchKey = missing.sort().join(',');
        
        // If this exact batch is already in flight, return that promise
        if (fetchInFlight[batchKey]) {
            return fetchInFlight[batchKey];
        }
        
        var fetchPromise = fetchAssets(missing).then(function(res) {
            if (res && res.data) {
                res.data.forEach(function(asset) { cache[asset.id] = asset; });
            }
        }).catch(function(err) {
            // Log but don't reject; resolution errors are reported per-item in applyResolved
            console.error('[MediaResolver] fetchAssets failed:', err);
        }).finally(function() {
            // Clean up in-flight map
            delete fetchInFlight[batchKey];
        });
        
        fetchInFlight[batchKey] = fetchPromise;
        return fetchPromise;
    }

    /**
     * EXCLUSIVE GATEWAY: Apply resolved media or throw error
     * 
     * Enforces 3-part contract:
     * 1. Item must have media_id (required, not optional)
     * 2. media_id must resolve from media_assets table
     * 3. Resolved asset must have public_url
     * 
     * @throws {Error} if media_id missing, not found, or has no public_url
     * @param {Object} item - { media_id: UUID, image_url?, alt_text?, ... }
     * @returns {Object} item with canonical image_url from media_assets
     */
    function applyResolved(item) {
        // CONTRACT ENFORCEMENT #1: media_id is REQUIRED
        if (!item) {
            throw new Error('INVALID_MEDIA_CONTRACT: item is null/undefined');
        }
        if (!item.media_id) {
            throw new Error('INVALID_MEDIA_CONTRACT: media_id is required for all content items (item id=' + (item.id || 'unknown') + ')');
        }

        // CONTRACT ENFORCEMENT #2: media_id must resolve from cache
        if (!cache[item.media_id]) {
            throw new Error('MEDIA_NOT_FOUND: media_id ' + item.media_id + ' not resolved from media_assets table');
        }

        var asset = cache[item.media_id];

        // CONTRACT ENFORCEMENT #3: asset must have public_url
        if (!asset.public_url) {
            throw new Error('MEDIA_INVALID: media_id ' + item.media_id + ' resolved but has no public_url');
        }

        // CONTRACT ENFORCEMENT #4: URL must match the configured project's public Storage host.
        // Do not rewrite the host or fall back to a stale URL.
        if (!isCanonicalPublicUrl(asset.public_url)) {
            throw new Error('MEDIA_INVALID_URL: media_id ' + item.media_id + ' has a non-canonical public_url');
        }

        // CANONICAL ASSIGNMENT: Always from media_assets, never fallback to image_url
        item.image_url = asset.public_url;
        if (asset.alt_text) item.alt_text = asset.alt_text;

        return item;
    }

    /**
     * Resolve an array of records in one batched fetch.
     * Batches all media_ids into ONE query (no N+1).
     * Caches result in-memory for session.
     *
     * EXCLUSIVE GATEWAY: Will throw on ANY item with missing media_id or unresolved asset.
     * This enforces the contract: media_id is the ONLY gateway.
     *
     * @param {Array<Object>} items - Each item: { media_id: UUID, alt_text?: string, ... }
     * @returns {Promise<Array>} same items with canonical image_url applied
     * @throws {Error} if any item violates the exclusive gateway contract
     */
    function resolveCollection(items) {
        if (!items || !items.length) return Promise.resolve(items || []);
        var ids = [];
        items.forEach(function(it) { if (it && it.media_id) ids.push(it.media_id); });
        return loadMissing(ids).then(function() {
            return items.map(applyResolved);  // Will throw if contract violated
        });
    }

    /**
     * Resolve a single record.
     * 
     * EXCLUSIVE GATEWAY: Requires media_id; throws if missing or unresolved.
     *
     * @param {Object} item - { media_id: UUID, ... }
     * @returns {Promise<Object>} item with canonical image_url
     * @throws {Error} if media_id missing or unresolved
     */
    function resolveSingle(item) {
        if (!item) return Promise.resolve(item);
        return resolveCollection([item]).then(function() { return item; });
    }

    return {
        resolveCollection: resolveCollection,
        resolveSingle: resolveSingle,
        isCanonicalPublicUrl: isCanonicalPublicUrl,
        clearCache: function() { cache = {}; }
    };
})();
