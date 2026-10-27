/**
 * ZT Lounge Meru - bounded homepage media warmer
 *
 * Home-only. Starts after the canonical first hero has rendered/settled,
 * discovers media through existing repositories/MediaResolver, and warms
 * canonical public_url values through the browser's normal HTTP cache.
 * It owns no media URL, media ID, or CMS resolution logic.
 */
(function () {
    'use strict';

    if (window.BackgroundMediaWarmer) return;

    var IMMEDIATE_PAGES = ['lounge', 'restaurant', 'grooming-care'];
    var IDLE_FALLBACK_MS = 250;
    var state = {
        status: 'idle',
        pageId: null,
        policy: null,
        heroRenderedAt: null,
        heroSettledAt: null,
        idleScheduledAt: null,
        startAt: null,
        acceptedAssets: 0,
        budget: 0,
        endAt: null,
        cancelledAt: null,
        cancelReason: null,
        discoveryComplete: false,
        discovered: 0,
        duplicateUrls: 0,
        alreadyRequested: 0,
        budgetSkipped: 0,
        warmed: 0,
        failed: 0,
        active: 0,
        maxObservedConcurrency: 0,
        pending: [],
        items: {},
        seenUrls: {},
        discoveryErrors: [],
        controllers: []
    };
    var sequence = 0;

    function now() { return performance.now(); }
    function round(value) { return Math.round(Number(value || 0) * 10) / 10; }

    function emit(name, detail) {
        try {
            document.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
        } catch (error) {
            /* Supported runtimes expose CustomEvent; legacy engines simply skip. */
        }
    }

    function connectionPolicy() {
        var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!connection) {
            return { mode: 'unknown', maxAssets: 8, concurrency: 1, effectiveType: null };
        }
        if (connection.saveData === true || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            return { mode: 'disabled', maxAssets: 0, concurrency: 0, effectiveType: connection.effectiveType || null };
        }
        if (connection.effectiveType === '3g' || (typeof connection.downlink === 'number' && connection.downlink < 1)) {
            return { mode: 'conservative', maxAssets: 3, concurrency: 1, effectiveType: connection.effectiveType || '3g' };
        }
        if (connection.effectiveType === '4g') {
            return { mode: 'normal', maxAssets: 16, concurrency: 2, effectiveType: '4g' };
        }
        return { mode: 'unknown', maxAssets: 8, concurrency: 1, effectiveType: connection.effectiveType || null };
    }

    function publicState() {
        return {
            status: state.status,
            pageId: state.pageId,
            policy: state.policy ? {
                mode: state.policy.mode,
                maxAssets: state.policy.maxAssets,
                concurrency: state.policy.concurrency,
                effectiveType: state.policy.effectiveType
            } : null,
            heroRenderedAt: round(state.heroRenderedAt),
            heroSettledAt: round(state.heroSettledAt),
            idleScheduledAt: round(state.idleScheduledAt),
            startAt: round(state.startAt),
            endAt: round(state.endAt),
            cancelledAt: round(state.cancelledAt),
            cancelReason: state.cancelReason,
            discoveryComplete: state.discoveryComplete,
            acceptedAssets: state.acceptedAssets,
            budget: state.budget,
            discovered: state.discovered,
            duplicateUrls: state.duplicateUrls,
            alreadyRequested: state.alreadyRequested,
            budgetSkipped: state.budgetSkipped,
            warmed: state.warmed,
            failed: state.failed,
            active: state.active,
            maxObservedConcurrency: state.maxObservedConcurrency,
            discoveryErrors: state.discoveryErrors.slice(),
            items: Object.keys(state.items).map(function (key) { return state.items[key]; })
        };
    }

    function isTerminal() {
        return state.status === 'cancelled' || state.status === 'complete' || state.status === 'error';
    }

    function canonicalUrl(value) {
        if (typeof value !== 'string' || !value) return null;
        try {
            var url = new URL(value, window.location.href);
            return (url.protocol === 'http:' || url.protocol === 'https:') ? url.href : null;
        } catch (error) {
            return null;
        }
    }

    function resourceAlreadyRequested(url) {
        if (window.performance && typeof performance.getEntriesByType === 'function') {
            var resources = performance.getEntriesByType('resource');
            for (var i = 0; i < resources.length; i += 1) {
                if (resources[i].name === url) return true;
            }
        }
        var images = document.images || [];
        for (var j = 0; j < images.length; j += 1) {
            try {
                if (images[j].currentSrc === url || images[j].src === url) return true;
            } catch (error) { /* Ignore detached images. */ }
        }
        return false;
    }

    function registerMedia(item, priority, source, pageId) {
        // Media resolution through MediaResolver (exclusive gateway: media_id â†’ media_assets.public_url)
        // No fallback to direct item.image_url access
        var mediaId = item.media_id;
        if (!mediaId) return false;
        var url;
        if (window.MediaResolver && window.MediaResolver.resolveCollection) {
            // Resolve through MediaResolver - will assign item.image_url = asset.public_url
            url = canonicalUrl(item.public_url);
        } else if (item.public_url) {
            // Fallback if MediaResolver not loaded yet
            url = canonicalUrl(item.public_url);
        } else {
            return false;
        }
        if (state.seenUrls[url]) {
            state.duplicateUrls += 1;
            return false;
        }
        state.seenUrls[url] = true;
        state.discovered += 1;

        if (resourceAlreadyRequested(url)) {
            state.alreadyRequested += 1;
            return false;
        }
        if (state.acceptedAssets >= state.budget) {
            state.budgetSkipped += 1;
            return false;
        }

        var record = {
            url: url,
            mediaId: item.media_id,
            priority: priority,
            source: source,
            pageId: pageId || null,
            status: 'queued',
            startedAt: null,
            endedAt: null,
            httpStatus: null,
            contentType: null,
            contentLength: null,
            cacheControl: null,
            order: sequence++
        };
        state.items[url] = record;
        state.pending.push(record);
        state.acceptedAssets += 1;
        pump();
        return true;
    }

    function addResolvedItems(items, priority, source, pageId) {
        (Array.isArray(items) ? items : []).forEach(function (item) {
            registerMedia(item, priority, source, pageId);
        });
    }

    function callRepository(ownerName, method, args) {
        var owner = window[ownerName];
        if (!owner || typeof owner[method] !== 'function') {
            return Promise.resolve(null);
        }
        try {
            return Promise.resolve(owner[method].apply(owner, args || []));
        } catch (error) {
            state.discoveryErrors.push(ownerName + '.' + method + ': ' + (error.message || String(error)));
            return Promise.resolve(null);
        }
    }

    function budgetReached() {
        return state.acceptedAssets >= state.budget;
    }

    function servedPageIds() {
        var identity = window.PageIdentity || {};
        if (!Array.isArray(identity.PAGE_ROUTES) || typeof identity.pageKeyForPageId !== 'function') {
            return [];
        }
        return (identity.PAGE_IDS || []).filter(function (pageId) {
            var key = identity.pageKeyForPageId(pageId);
            return pageId !== 'home' && typeof identity.pageHrefForPageKey(key) === 'string';
        });
    }

    function registerPriority(priority, source, pageId, data) {
        if (Array.isArray(data)) {
            addResolvedItems(data, priority, source, pageId);
            return;
        }
        if (data && Array.isArray(data.slides)) {
            addResolvedItems(data.slides, priority, source, pageId);
        }
    }

    function discoverPriorityOne() {
        var chain = Promise.resolve();
        IMMEDIATE_PAGES.forEach(function (pageId) {
            chain = chain.then(function () {
                if (budgetReached()) return null;
                return callRepository('HeroRepository', 'getByPage', [pageId]);
            }).then(function (data) {
                registerPriority(1, 'hero', pageId, data);
            }).catch(function (error) {
                state.discoveryErrors.push('priority hero ' + pageId + ': ' + (error.message || String(error)));
            });
        });
        return chain.then(function () {
            return callRepository('BusinessRepository', 'getAll', []);
        }).then(function (business) {
            if (!business) return;
                        if (business.logo_media_id && business.resolved_logo_url) {
                registerMedia({ media_id: business.logo_media_id, image_url: business.resolved_logo_url }, 1, 'branding', null);
            }
            // Light colorway logo (logos/logo-white.webp) -> .logo-dark (dark header)
            if (business.logo_light_media_id && business.resolved_logo_light_url) {
                registerMedia({ media_id: business.logo_light_media_id, image_url: business.resolved_logo_light_url }, 1, 'branding', null);
            }
            if (business.favicon_media_id && business.resolved_favicon_url) {
                registerMedia({ media_id: business.favicon_media_id, image_url: business.resolved_favicon_url }, 1, 'branding', null);
            }
        }).catch(function (error) {
            state.discoveryErrors.push('BusinessRepository.getAll: ' + (error.message || String(error)));
        });
    }

    function discoverPriorityTwo() {
        var chain = Promise.resolve();
        IMMEDIATE_PAGES.forEach(function (pageId) {
            chain = chain.then(function () {
                if (budgetReached()) return null;
                return callRepository('ServicesRepository', 'getByPage', [pageId]);
            }).then(function (data) {
                if (!data) return;
                addResolvedItems(data.services, 2, 'services', pageId);
                addResolvedItems(data.experiences, 2, 'services', pageId);
                addResolvedItems(data.features, 2, 'services', pageId);
            }).then(function () {
                if (budgetReached()) return null;
                return callRepository('GalleryRepository', 'getByPage', [pageId]);
            }).then(function (data) {
                addResolvedItems(Array.isArray(data) ? data : (data && data.items), 2, 'gallery', pageId);
            }).catch(function (error) {
                state.discoveryErrors.push('priority page media ' + pageId + ': ' + (error.message || String(error)));
            });
        });
        return chain.then(function () {
            if (budgetReached()) return null;
            // Menu media is page-scoped like every other CMS surface: warm the
            // restaurant and lounge menu scopes explicitly instead of asking for
            // an unscoped menu (which now refuses to return every venue).
            return callRepository('MenuRepository', 'getMenuForSurface', ['restaurant']);
        }).then(function (data) {
            ((data && data.categories) || []).forEach(function (category) {
                addResolvedItems(category.items, 2, 'menu', 'restaurant');
            });
        }).then(function () {
            if (budgetReached()) return null;
            return callRepository('MenuRepository', 'getMenuForSurface', ['lounge']);
        }).then(function (data) {
            ((data && data.categories) || []).forEach(function (category) {
                addResolvedItems(category.items, 2, 'menu', 'lounge');
            });
        }).catch(function (error) {
            state.discoveryErrors.push('MenuRepository.getMenuForSurface: ' + (error.message || String(error)));
        });
    }

    function discoverPriorityThree() {
        var chain = callRepository('PromotionRepository', 'getEligible', [])
            .then(function (items) { addResolvedItems(items, 3, 'promotion', null); })
            .catch(function (error) {
                state.discoveryErrors.push('PromotionRepository.getEligible: ' + (error.message || String(error)));
            });
        servedPageIds().forEach(function (pageId) {
            chain = chain.then(function () {
                if (budgetReached()) return null;
                return callRepository('HeroRepository', 'getByPage', [pageId]);
            }).then(function (data) {
                registerPriority(3, 'hero', pageId, data);
            }).catch(function (error) {
                state.discoveryErrors.push('remaining hero ' + pageId + ': ' + (error.message || String(error)));
            });
        });
        return chain;
    }

    function discoverAll() {
        state.status = 'discovering';
        return discoverPriorityOne()
            .then(discoverPriorityTwo)
            .then(discoverPriorityThree)
            .then(function () {
                state.discoveryComplete = true;
                pump();
            });
    }

    function warmRecord(record) {
        var controller = new AbortController();
        record.status = 'loading';
        record.startedAt = now();
        state.active += 1;
        state.maxObservedConcurrency = Math.max(state.maxObservedConcurrency, state.active);
        state.controllers.push(controller);

        return fetch(record.url, {
            method: 'GET',
            cache: 'default',
            credentials: 'omit',
            signal: controller.signal
        }).then(function (response) {
            record.httpStatus = response.status;
            record.contentType = response.headers.get('content-type');
            record.contentLength = response.headers.get('content-length');
            record.cacheControl = response.headers.get('cache-control');
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.arrayBuffer();
        }).then(function () {
            record.status = 'warmed';
            record.endedAt = now();
            state.warmed += 1;
        }).catch(function (error) {
            record.status = state.status === 'cancelled' ? 'cancelled' : 'failed';
            record.endedAt = now();
            if (record.status === 'failed') state.failed += 1;
        }).then(function () {
            state.active = Math.max(0, state.active - 1);
            var controllerIndex = state.controllers.indexOf(controller);
            if (controllerIndex !== -1) state.controllers.splice(controllerIndex, 1);
            pump();
        });
    }

    function pump() {
        if (isTerminal()) return;
        state.pending.sort(function (a, b) {
            return (a.priority - b.priority) || (a.order - b.order);
        });
        while (state.active < state.policy.concurrency && state.pending.length) {
            warmRecord(state.pending.shift());
        }
        if (state.discoveryComplete && state.active === 0 && state.pending.length === 0) {
            state.status = 'complete';
            state.endAt = now();
            emit('background-media-warming:complete', publicState());
        }
    }

    function cancel(reason) {
        if (isTerminal()) return;
        state.status = 'cancelled';
        state.cancelReason = reason || 'navigation';
        state.cancelledAt = now();
        state.pending.length = 0;
        state.controllers.forEach(function (controller) {
            try { controller.abort(); } catch (error) { /* Browser cleanup. */ }
        });
        state.controllers.length = 0;
        Object.keys(state.items).forEach(function (key) {
            if (state.items[key].status === 'queued' || state.items[key].status === 'loading') {
                state.items[key].status = 'cancelled';
            }
        });
        emit('background-media-warming:cancelled', publicState());
    }

    function firstHeroUrl() {
        var slide = document.querySelector('.hero-slide.active') || document.querySelector('.hero-slide');
        if (!slide) return null;
        var background = window.getComputedStyle(slide).backgroundImage || slide.style.backgroundImage;
        var match = String(background || '').match(/^url\((['"]?)(.*?)\1\)$/);
        return match ? canonicalUrl(match[2]) : null;
    }

    function firstHeroAlreadySettled(url) {
        if (!url || !window.performance || typeof performance.getEntriesByName !== 'function') return false;
        return performance.getEntriesByName(url).some(function (entry) {
            return Number(entry.responseEnd || 0) > 0;
        });
    }

    function scheduleWhenIdle() {
        if (isTerminal()) return;
        state.idleScheduledAt = now();
        var start = function () {
            if (isTerminal() || document.visibilityState === 'hidden') return;
            state.startAt = now();
            emit('background-media-warming:start', publicState());
            discoverAll().catch(function (error) {
                if (isTerminal()) return;
                state.status = 'error';
                state.endAt = now();
                state.discoveryErrors.push('fatal: ' + (error.message || String(error)));
                emit('background-media-warming:error', publicState());
            });
        };
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(start, { timeout: 2000 });
        } else {
            window.setTimeout(start, IDLE_FALLBACK_MS);
        }
    }

    function afterHeroRendered() {
        if (isTerminal() || state.heroRenderedAt) return;
        state.heroRenderedAt = now();
        var url = firstHeroUrl();
        if (!url || firstHeroAlreadySettled(url)) {
            state.heroSettledAt = now();
            scheduleWhenIdle();
            return;
        }
        var probe = new Image();
        probe.decoding = 'async';
        probe.onload = function () {
            state.heroSettledAt = now();
            scheduleWhenIdle();
        };
        probe.onerror = function () {
            state.heroSettledAt = now();
            scheduleWhenIdle();
        };
        probe.src = url;
    }

    function onConnectionChange() {
        if (isTerminal()) return;
        var next = connectionPolicy();
        if (next.mode === 'disabled') {
            state.policy = next;
            state.budget = 0;
            cancel('connection-constrained');
            return;
        }
        if (next.mode === 'conservative' && state.policy && state.policy.mode === 'normal') {
            state.policy = next;
            state.budget = Math.min(state.budget, next.maxAssets);
            state.pending = state.pending.filter(function (record, index) {
                if (index < next.maxAssets) return true;
                state.budgetSkipped += 1;
                record.status = 'skipped';
                return false;
            });
        }
    }

    function shouldStartOnAnchor(event) {
        var anchor = event.target && event.target.closest ? event.target.closest('a[href]') : null;
        if (!anchor || anchor.target === '_blank') return;
        var url;
        try { url = new URL(anchor.href, window.location.href); } catch (error) { return; }
        if (url.origin === window.location.origin && url.pathname === window.location.pathname && url.search === window.location.search) return;
        cancel('navigation');
    }

    function init() {
        if (!window.PageIdentity || window.PageIdentity.getCanonicalPageId() !== 'home') {
            state.status = 'not-home';
            return;
        }
        state.pageId = 'home';
        state.policy = connectionPolicy();
        state.budget = state.policy.maxAssets;
        if (state.policy.mode === 'disabled') {
            state.status = 'disabled';
            state.endAt = now();
            return;
        }

        document.addEventListener('hero:rendered', afterHeroRendered, { once: true });
        var container = document.querySelector('.hero-slider');
        if (container && (container.getAttribute('data-hero-state') === 'ok' || container.getAttribute('data-hero-state') === 'empty')) {
            window.setTimeout(afterHeroRendered, 0);
        }
        window.addEventListener('pagehide', function () { cancel('pagehide'); });
        window.addEventListener('beforeunload', function () { cancel('beforeunload'); });
        document.addEventListener('click', shouldStartOnAnchor, true);
        var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection && typeof connection.addEventListener === 'function') {
            connection.addEventListener('change', onConnectionChange);
        }
    }

    window.BackgroundMediaWarmer = {
        getState: publicState
    };
    emit('background-media-warming:initialized', { pageId: state.pageId });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
