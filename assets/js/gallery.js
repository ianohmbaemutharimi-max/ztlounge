/**
 * Gallery Lightbox
 * Handles gallery lightbox, navigation, and touch events
 */
(function() {
    'use strict';
    
    document.addEventListener('DOMContentLoaded', function() {
        var lightbox = document.getElementById('lightbox');
        if (!lightbox) return;
        
        var lightboxImg = document.getElementById('lightboxImg');
        var lightboxCaption = document.getElementById('lightboxCaption');
        var lightboxCounter = document.getElementById('lightboxCounter');
        var gridItems = document.querySelectorAll('.grid-item');
        var totalItems = gridItems.length;
        var currentIndex = 0;
        
// Gallery data
        var galleryData = [];
        gridItems.forEach(function(item, index) {
            var img = item.querySelector('img');
            var overlay = item.querySelector('.overlay');
            var title = (overlay && overlay.querySelector('h4')) ? overlay.querySelector('h4').textContent : 'Image';
            var desc = (overlay && overlay.querySelector('span')) ? overlay.querySelector('span').textContent : '';
            galleryData.push({
                src: img.src,
                alt: img.alt,
                title: title,
                description: desc
            });
            
            item.addEventListener('click', function() {
                openLightbox(index);
            });
        });
        
        function openLightbox(index) {
            currentIndex = index;
            var data = galleryData[index];
            lightboxImg.src = data.src;
            lightboxImg.alt = data.alt;
            lightboxCaption.textContent = data.title + ' — ' + data.description;
            lightboxCounter.textContent = (index + 1) + ' / ' + totalItems;
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
        function closeLightbox() {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        function navigateLightbox(direction) {
            var newIndex = currentIndex + direction;
            if (newIndex < 0) newIndex = totalItems - 1;
            if (newIndex >= totalItems) newIndex = 0;
            openLightbox(newIndex);
        }
        
        // Event listeners - null checks for safety
        var lightboxClose = document.getElementById('lightboxClose');
        var lightboxBgClose = document.getElementById('lightboxBgClose');
        var lightboxPrev = document.getElementById('lightboxPrev');
        var lightboxNext = document.getElementById('lightboxNext');
        
        if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
        if (lightboxBgClose) lightboxBgClose.addEventListener('click', closeLightbox);
        if (lightboxPrev) lightboxPrev.addEventListener('click', function() { navigateLightbox(-1); });
        if (lightboxNext) lightboxNext.addEventListener('click', function() { navigateLightbox(1); });
        
        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (!lightbox.classList.contains('active')) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') navigateLightbox(-1);
            if (e.key === 'ArrowRight') navigateLightbox(1);
        });
        
        // Touch swipe support
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
    });
})();