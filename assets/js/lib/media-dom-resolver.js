/**
 * ============================================================================
 * ZT Lounge Meru - Media DOM Resolver
 * Version: 1.0.0
 * ============================================================================
 *
 * Scans the DOM for elements marked with data-media-id and resolves them
 * exclusively through window.MediaResolver (the media_assets gateway).
 *
 * DESIGN NOTES:
 *   - Meta tags (og:image, twitter:image) are read by social crawlers BEFORE
 *     JS runs, so we keep the original URL as the attribute value and add
 *     data-media-id as the ownership marker. JS re-resolves after load for
 *     client-side consistency.
 *   - All media_ids are batched into ONE media_assets query (no N+1).
 *   - Fail closed: invalid or unresolved canonical media never keeps a stale URL.
 *
 * USAGE (on any page element):
 *   <meta property="og:image" content="https://.../og-image.webp"
 *        data-media-id="a1b2c3d4-..." />
 *   <link rel="preload" as="image" href="https://.../hero.webp"
 *         data-media-id="a1b2c3d4-..." />
 *   <img src="https://.../photo.webp" data-media-id="a1b2c3d4-..." />
 *   <div class="hero" data-media-id="a1b2c3d4-..." data-media-bg></div>
 *
 * DEPENDENCY: window.MediaResolver (from assets/js/repositories/MediaResolver.js)
 *   must be loaded before this script. Load order: MediaResolver.js → this file.
 * ============================================================================
 */

(function() {
    'use strict';

    var MediaDomResolver = (function() {
        var RESOLVED_ATTR = 'data-media-resolved';
        var BG_ATTR = 'data-media-bg';

        function getMediaId(el) {
            return el.getAttribute('data-media-id');
        }

        function getOriginalUrl(el) {
            if (el.tagName === 'META') return el.getAttribute('content');
            if (el.tagName === 'LINK') return el.getAttribute('href');
            if (el.tagName === 'IMG') return el.getAttribute('src');
            return null;
        }

        function markMissing(el) {
            el.setAttribute('data-media-status', 'missing');
            if (el.tagName === 'META') {
                el.removeAttribute('content');
            } else if (el.tagName === 'LINK') {
                el.removeAttribute('href');
            } else if (el.tagName === 'IMG') {
                el.removeAttribute('src');
                el.removeAttribute('srcset');
                el.alt = el.alt || 'Image unavailable';
                el.style.display = 'none';
                var wrapper = el.parentElement && el.parentElement.tagName.toLowerCase() === 'picture'
                    ? el.parentElement.parentElement
                    : el.parentElement;
                if (wrapper) {
                    var existing = wrapper.querySelector(':scope > .zt-media-missing');
                    if (!existing) {
                        existing = document.createElement('span');
                        existing.className = 'zt-media-missing';
                        existing.setAttribute('role', 'status');
                        existing.textContent = 'Image unavailable';
                        existing.style.cssText = 'display:flex;align-items:center;justify-content:center;min-height:4rem;padding:.75rem;color:#a8a29e;background:rgba(28,25,23,.75);font-size:12px;text-align:center;';
                        if (el.parentElement === wrapper) el.insertAdjacentElement('afterend', existing);
                        else wrapper.appendChild(existing);
                    }
                }
            } else if (el.getAttribute(BG_ATTR)) {
                el.style.backgroundImage = 'none';
                el.style.background = 'none';
            }
        }

        function applyUrl(el, url) {
            if (!url || !window.MediaResolver ||
                typeof window.MediaResolver.isCanonicalPublicUrl !== 'function' ||
                !window.MediaResolver.isCanonicalPublicUrl(url)) {
                markMissing(el);
                return false;
            }
            if (el.tagName === 'META') {
                el.setAttribute('content', url);
            } else if (el.tagName === 'LINK') {
                el.setAttribute('href', url);
            } else if (el.tagName === 'IMG') {
                el.setAttribute('src', url);
                el.style.display = '';
            } else if (el.getAttribute(BG_ATTR)) {
                var gradient = el.getAttribute('data-media-bg-gradient') ||
                    'linear-gradient(135deg, rgba(10,10,10,0.75), rgba(10,10,10,0.4))';
                el.style.background = gradient + ", url('" + url + "') center/cover no-repeat";
            }
            el.setAttribute('data-media-status', 'resolved');
            return true;
        }

        function resolve(elements) {
            if (!window.MediaResolver || !window.MediaResolver.resolveCollection) {
                console.error('[MediaDomResolver] MediaResolver unavailable; clearing stale media URLs');
                elements.forEach(markMissing);
                return Promise.resolve();
            }

            // Collect unique media_ids from unresolved elements
            var ids = [];
            var idToEls = {};
            elements.forEach(function(el) {
                var mid = getMediaId(el);
                if (!mid || el.getAttribute(RESOLVED_ATTR)) return;
                if (ids.indexOf(mid) === -1) ids.push(mid);
                if (!idToEls[mid]) idToEls[mid] = [];
                idToEls[mid].push(el);
            });

            if (!ids.length) return Promise.resolve();

            var items = ids.map(function(mid) { return { media_id: mid }; });

            return window.MediaResolver.resolveCollection(items).then(function(resolved) {
                resolved.forEach(function(item) {
                    var els = idToEls[item.media_id] || [];
                    els.forEach(function(el) {
                        if (applyUrl(el, item.image_url)) {
                            el.setAttribute(RESOLVED_ATTR, 'true');
                        }
                    });
                });
            }).catch(function(err) {
                console.warn('[MediaDomResolver] canonical resolution failed; clearing stale URLs:', err.message);
                elements.forEach(function(el) {
                    if (ids.indexOf(getMediaId(el)) !== -1 && !el.getAttribute(RESOLVED_ATTR)) markMissing(el);
                });
            });
        }

        function init() {
            var elements = document.querySelectorAll('[data-media-id]');
            if (!elements.length) return;
            resolve(Array.prototype.slice.call(elements));
        }

        return {
            init: init,
            resolve: resolve
        };
    })();

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            MediaDomResolver.init();
        });
    } else {
        MediaDomResolver.init();
    }

    // Expose for manual invocation (e.g. after dynamic content injection)
    window.MediaDomResolver = MediaDomResolver;

})();
