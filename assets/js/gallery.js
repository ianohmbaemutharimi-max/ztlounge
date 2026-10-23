/**
 * Gallery Lightbox v2.0.0 (Phase 3 – Dynamic Gallery)
 * Handles gallery lightbox, navigation, touch events, and image-error
 * fallback for BOTH static and dynamically-rendered items.
 *
 * v2.0.0 changes:
 *   - Uses event delegation on #galleryGrid so clicks on dynamically
 *     rendered .grid-item elements (added by content-loader) are captured.
 *   - Rebuilds the gallery data from the DOM whenever the lightbox opens.
 *   - Listens for the gallery:rendered event to re-stamp data-index.
 */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        var lightbox = document.getElementById('lightbox');
        if (!lightbox) return;

        var lightboxImg = document.getElementById('lightboxImg');
        var lightboxCaption = document.getElementById('lightboxCaption');
        var lightboxCounter = document.getElementById('lightboxCounter');
        var grid = document.getElementById('galleryGrid');
        var currentIndex = 0;

        function buildGalleryData() {
            var data = [];
            if (!grid) return data;
            var items = grid.querySelectorAll('.grid-item');
            items.forEach(function(item) {
                if (item.style.display === 'none') return;
                var img = item.querySelector('img');
                var overlay = item.querySelector('.overlay');
                var h4 = overlay ? overlay.querySelector('h4') : null;
                var span = overlay ? overlay.querySelector('span') : null;
                data.push({
                    src: img ? img.src : '',
                    alt: img ? img.alt : '',
                    title: h4 ? h4.textContent : (item.getAttribute('data-title') || 'Image'),
                    description: span ? span.textContent : (item.getAttribute('data-description') || ''),
                    id: item.getAttribute('data-gallery-id') || '',
                    media_id: item.getAttribute('data-gallery-media-id') || ''
                });
            });
            return data;
        }

        function openLightbox(index) {
            currentIndex = index;
            var data = buildGalleryData();
            var item = data[index];
            if (!item) return;
            lightboxImg.src = item.src;
            lightboxImg.alt = item.alt || '';
            lightboxCaption.textContent = (item.title || 'Image') + ' — ' + (item.description || '');
            lightboxCounter.textContent = (index + 1) + ' / ' + data.length;
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }

        function navigateLightbox(direction) {
            var data = buildGalleryData();
            var total = data.length;
            if (total === 0) return;
            var newIndex = currentIndex + direction;
            if (newIndex < 0) newIndex = total - 1;
            if (newIndex >= total) newIndex = 0;
            openLightbox(newIndex);
        }

        // === Event delegation for grid item clicks ===
        if (grid) {
            grid.addEventListener('click', function(e) {
                var clickedItem = e.target.closest('.grid-item');
                if (!clickedItem) return;
                var visibleItems = Array.prototype.slice.call(grid.querySelectorAll('.grid-item'))
                    .filter(function(item) { return item.style.display !== 'none'; });
                var idx = visibleItems.indexOf(clickedItem);
                if (idx >= 0) openLightbox(idx);
            });
        }

        // === Lightbox control listeners ===
        var lightboxClose = document.getElementById('lightboxClose');
        var lightboxBgClose = document.getElementById('lightboxBgClose');
        var lightboxPrev = document.getElementById('lightboxPrev');
        var lightboxNext = document.getElementById('lightboxNext');
        if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
        if (lightboxBgClose) lightboxBgClose.addEventListener('click', closeLightbox);
        if (lightboxPrev) lightboxPrev.addEventListener('click', function() { navigateLightbox(-1); });
        if (lightboxNext) lightboxNext.addEventListener('click', function() { navigateLightbox(1); });

        // === Keyboard navigation ===
        document.addEventListener('keydown', function(e) {
            if (!lightbox.classList.contains('active')) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') navigateLightbox(-1);
            if (e.key === 'ArrowRight') navigateLightbox(1);
        });

        // === Touch swipe support ===
        var touchStartX = 0;
        lightbox.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        });
        lightbox.addEventListener('touchend', function(e) {
            var diff = touchStartX - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 50) {
                navigateLightbox(diff > 0 ? 1 : -1);
            }
        });

        // === Refresh data-index after dynamic render ===
        function refreshIndices() {
            if (!grid) return;
            var items = grid.querySelectorAll('.grid-item');
            items.forEach(function(item, i) {
                item.setAttribute('data-index', String(i));
            });
        }
        document.addEventListener('gallery:rendered', refreshIndices);

        // === Image fallback ===
        function initImageFallbacks() {
            var lazyImages = document.querySelectorAll('img[loading="lazy"]');
            lazyImages.forEach(function(img) {
                img.addEventListener('error', function() {
                    if (this.dataset.fallbackApplied) return;
                    this.dataset.fallbackApplied = 'true';
                    var fallbackText = this.alt || 'Image unavailable';
                    this.style.display = 'none';
                    var parent = this.closest('.grid-item');
                    if (parent) {
                        var div = document.createElement('div');
                        div.className = 'image-fallback';
                        div.setAttribute('role', 'img');
                        div.setAttribute('aria-label', fallbackText);
                        div.textContent = fallbackText;
                        parent.insertBefore(div, parent.firstChild);
                    }
                });
            });
        }
        initImageFallbacks();
        document.addEventListener('gallery:rendered', initImageFallbacks);
    });
})();