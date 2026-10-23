/**
 * ============================================================
 * ZT Lounge Meru - Base Repository
 * Database-first, config-fallback data access pattern
 * Version: 2.0.0
 * ============================================================
 * 
 * All repositories use this base.
 * 
 * Data Flow:
 *   1. Check deduplication map (prevents parallel duplicate queries)
 *   2. Check cache (filter-aware key)
 *   3. Try Supabase with retry for transient errors
 *   4. If success → cache + return
 *   5. If failure → return local config data (lazy evaluation)
 *   6. Never throw uncaught exceptions
 * ============================================================
 */

window.BaseRepository = (function() {
    'use strict';

    /**
     * In-memory cache with filter-aware keys
     */
    var cache = {};

    /**
     * Deduplication map: prevents parallel identical queries
     * Key: cacheKey, Value: Promise
     */
    var inFlight = {};

    /**
     * Transient error codes that should be retried
     */
    var TRANSIENT_ERRORS = {
        'timeout': true,
        'network': true,
        'abort': true,
        '500': true,
        '502': true,
        '503': true,
        '504': true,
        'FETCH_ERROR': true,
        'NETWORK_ERROR': true
    };

    /**
     * Clear all cached data
     */
    function clearCache() {
        cache = {};
        inFlight = {};
    }

    /**
     * Generate a deterministic cache key from table name and query options
     * @param {string} tableName
     * @param {Object} queryOptions
     * @returns {string}
     */
    function buildCacheKey(tableName, queryOptions) {
        var key = 'repo_' + tableName;
        if (queryOptions) {
            var stable = {};
            if (queryOptions.eq) {
                stable.eq = queryOptions.eq.map(function(f) {
                    return f.column + '=' + f.value;
                }).sort().join('&');
            }
            if (queryOptions.orderBy) stable.orderBy = queryOptions.orderBy;
            if (queryOptions.ascending !== undefined) stable.ascending = queryOptions.ascending;
            if (queryOptions.limit) stable.limit = queryOptions.limit;
            key += '_' + JSON.stringify(stable);
        }
        return key;
    }

    /**
     * Get cached value if not expired
     */
    function getCached(key) {
        var entry = cache[key];
        if (!entry) return undefined;
        if (Date.now() > entry.expires) {
            delete cache[key];
            return undefined;
        }
        return entry.data;
    }

    /**
     * Set cached value with TTL
     */
    function setCached(key, data, ttl) {
        cache[key] = {
            data: data,
            expires: Date.now() + (ttl || 300000)
        };
    }

    /**
     * Check if a Supabase error is transient (should be retried)
     * @param {Error|Object} error
     * @returns {boolean}
     */
    function isTransientError(error) {
        if (!error) return false;

        var msg = (error.message || error.code || error.error || '').toString().toLowerCase();

        // Never retry auth/validation errors
        if (msg.indexOf('401') !== -1) return false;
        if (msg.indexOf('403') !== -1) return false;
        if (msg.indexOf('404') !== -1) return false;
        if (msg.indexOf('validation') !== -1) return false;
        if (msg.indexOf('invalid') !== -1) return false;
        if (msg.indexOf('permission') !== -1) return false;
        if (msg.indexOf('row level security') !== -1) return false;
        if (msg.indexOf('jwt') !== -1) return false;

        // Transient errors
        if (msg.indexOf('timeout') !== -1) return true;
        if (msg.indexOf('network') !== -1) return true;
        if (msg.indexOf('abort') !== -1) return true;
        if (msg.indexOf('500') !== -1) return true;
        if (msg.indexOf('502') !== -1) return true;
        if (msg.indexOf('503') !== -1) return true;
        if (msg.indexOf('504') !== -1) return true;
        if (msg.indexOf('fetch_error') !== -1) return true;
        if (msg.indexOf('networking') !== -1) return true;
        if (msg.indexOf('econnrefused') !== -1) return true;
        if (msg.indexOf('enotfound') !== -1) return true;
        if (msg.indexOf('econnreset') !== -1) return true;

        // Default: assume transient (Supabase may be temporarily unavailable)
        return true;
    }

    /**
     * Execute query with retry support for transient errors
     * @param {Function} queryFn - Async function that performs the query
     * @param {number} retries - Number of retry attempts
     * @param {number} delay - Base delay in ms
     * @returns {Promise}
     */
    function executeWithRetry(queryFn, retries, delay) {
        function attempt(remaining) {
            return queryFn().catch(function(err) {
                if (remaining > 0 && isTransientError(err)) {
                    var wait = delay * Math.pow(2, retries - remaining);
                    return new Promise(function(resolve) {
                        setTimeout(function() {
                            resolve(attempt(remaining - 1));
                        }, wait);
                    });
                }
                throw err;
            });
        }
        return attempt(retries);
    }

    /**
     * Safe Supabase query with error handling, retry, dedup, and lazy fallback
     * @param {Function} queryFn - Function that performs the Supabase query
     * @param {Function} fallbackFn - Function that returns fallback data (lazy)
     * @param {string} dedupKey - Key for request deduplication
     * @returns {Promise<*>} Query result or fallback
     */
    function safeQuery(queryFn, fallbackFn, dedupKey) {
        // Return in-flight promise if identical query is already running
        if (dedupKey && inFlight[dedupKey]) {
            return inFlight[dedupKey];
        }

        var client = null;
        try {
            client = window.SupabaseClient && window.SupabaseClient.getClient();
        } catch (e) {
            // Ignore - fallback below
        }

        if (!client) {
            return Promise.resolve(fallbackFn ? fallbackFn() : null);
        }

        var config = window.SupabaseConfig;
        var retryAttempts = (config && config.query && config.query.retryAttempts) || 0;
        var retryDelay = (config && config.query && config.query.retryDelay) || 1000;

        var promise = executeWithRetry(function() {
            return queryFn(client);
        }, retryAttempts, retryDelay).catch(function(err) {
            console.warn('[BaseRepository] Query failed, using fallback:', err.message);
            return fallbackFn ? fallbackFn() : null;
        });

        // Track in-flight for deduplication
        if (dedupKey) {
            inFlight[dedupKey] = promise;
            // Clean up after promise settles
            promise.then(function() {
                delete inFlight[dedupKey];
            }, function() {
                delete inFlight[dedupKey];
            });
        }

        return promise;
    }

    /**
     * Create a new repository instance
     * @param {string} tableName - Supabase table name
     * @param {Function} configFallback - Function that returns local config data (LAZY)
     * @param {Object} options - Additional options
     * @returns {Object} Repository instance
     */
    function create(tableName, configFallback, options) {
        options = options || {};
        var cacheTTL = options.cacheTTL || 300000;

        /**
         * Get all records from the table with filter-aware caching
         * @param {Object} queryOptions - Optional query filters
         * @returns {Promise<Array>} Array of records
         */
        function getAll(queryOptions) {
            var cacheKey = buildCacheKey(tableName, queryOptions);

            // Check cache first
            var cached = getCached(cacheKey);
            if (cached !== undefined) {
                return Promise.resolve(cached);
            }

            return safeQuery(function(client) {
                var query = client.from(tableName).select(queryOptions && queryOptions.select ? queryOptions.select : '*');

                if (queryOptions) {
                    if (queryOptions.orderBy) {
                        query = query.order(queryOptions.orderBy, {
                            ascending: queryOptions.ascending !== false
                        });
                    }
                    if (queryOptions.eq) {
                        queryOptions.eq.forEach(function(filter) {
                            query = query.eq(filter.column, filter.value);
                        });
                    }
                    if (queryOptions.limit) {
                        query = query.limit(queryOptions.limit);
                    }
                }

                return query.then(function(result) {
                    if (result.error) {
                        console.warn('[BaseRepository] Supabase error for', tableName, ':', result.error.message);
                        return configFallback ? configFallback() : [];
                    }
                    var data = result.data || [];
                    setCached(cacheKey, data, cacheTTL);
                    return data;
                });
            }, configFallback, cacheKey);
        }

        /**
         * Get a single record by ID
         */
        function getById(id) {
            var cacheKey = buildCacheKey(tableName, { id: id });

            var cached = getCached(cacheKey);
            if (cached !== undefined) return Promise.resolve(cached);

            return safeQuery(function(client) {
                return client.from(tableName).select('*').eq('id', id).single().then(function(result) {
                    if (result.error) {
                        console.warn('[BaseRepository] getById error for', tableName, ':', result.error.message);
                        return null;
                    }
                    setCached(cacheKey, result.data, cacheTTL);
                    return result.data;
                });
            }, function() { return null; }, cacheKey);
        }

        /**
         * Get records filtered by a column value
         */
        function getByColumn(column, value) {
            var queryOptions = { eq: [{ column: column, value: value }] };
            var cacheKey = buildCacheKey(tableName, queryOptions);

            var cached = getCached(cacheKey);
            if (cached !== undefined) return Promise.resolve(cached);

            return safeQuery(function(client) {
                return client.from(tableName).select('*').eq(column, value).then(function(result) {
                    if (result.error) {
                        console.warn('[BaseRepository] getByColumn error for', tableName, ':', result.error.message);
                        return [];
                    }
                    var data = result.data || [];
                    setCached(cacheKey, data, cacheTTL);
                    return data;
                });
            }, function() { return []; }, cacheKey);
        }

        /**
         * Insert a record
         */
        function insert(record) {
            clearCache();
            return safeQuery(function(client) {
                return client.from(tableName).insert(record).select().single().then(function(result) {
                    if (result.error) {
                        console.warn('[BaseRepository] insert error for', tableName, ':', result.error.message);
                        return null;
                    }
                    return result.data;
                });
            }, function() { return null; });
        }

        /**
         * Update a record
         */
        function update(id, updates) {
            clearCache();
            return safeQuery(function(client) {
                return client.from(tableName).update(updates).eq('id', id).select().single().then(function(result) {
                    if (result.error) {
                        console.warn('[BaseRepository] update error for', tableName, ':', result.error.message);
                        return null;
                    }
                    return result.data;
                });
            }, function() { return null; });
        }

        /**
         * Delete a record
         */
        function remove(id) {
            clearCache();
            return safeQuery(function(client) {
                return client.from(tableName).delete().eq('id', id).then(function(result) {
                    if (result.error) {
                        console.warn('[BaseRepository] delete error for', tableName, ':', result.error.message);
                        return false;
                    }
                    return true;
                });
            }, function() { return false; });
        }

        return {
            tableName: tableName,
            getAll: getAll,
            getById: getById,
            getByColumn: getByColumn,
            insert: insert,
            update: update,
            remove: remove,
            clearCache: clearCache
        };
    }

    return {
        create: create,
        clearCache: clearCache
    };
})();