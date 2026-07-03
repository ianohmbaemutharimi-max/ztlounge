/**
 * ============================================================
 * ZT Lounge Meru - Gallery JavaScript
 * Enterprise-Grade Gallery System
 * Version: 2.0.0
 * 
 * Architecture: Config â†’ DOM Cache â†’ Utilities â†’ Modules â†’ Engine
 * 
 * Features:
 *   - Lightbox with keyboard/touch support
 *   - Gallery filtering
 *   - Lazy loading
 *   - Image validation
 *   - Responsive images
 *   - Accessibility support
 * 
 * Dependencies: ZT Kernel (main.js)
 * Integration: ZT.Components.Gallery
 * ============================================================
 */

(function() {
    'use strict';

    // ============================================================
    // 1. CONFIGURATION - Centralized, type-safe constants
    // ============================================================
    const CONFIG = Object.freeze({
        lazyLoadThreshold: 0.01,
        lazyLoadRootMargin: '100px 0px',
        lightboxAnimationDuration: 300,
        galleryAnimationDelay: 50,
        preloadAdjacentCount: 2,
        keyboardNavigation: true,
        smoothScroll: true,
        touchSwipe: true,

        // Selectors - Support both homepage and full gallery
        gallerySelectors: [
            '.gallery-grid',
            '.gallery-preview-grid',
            '.service-cards-grid',
            '.location-grid'
        ].join(', '),
        itemSelectors: [
            '.gallery-item',
            '.gallery-preview-item',
            '.service-card',
            '.location-image'
        ].join(', '),
        lightboxSelectors: [
            '.gallery-item img',
            '.gallery-preview-item img',
            '.service-detail-image img',
            '.about-image img',
            '.service-card img',
            '.location-image img',
            '.card-image',
            '.feature-card img',
            '.pricing-card img',
            '.room-image',
            '.food-image',
            '[data-lightbox]'
        ].join(', '),

        // Image Design System Rules
        imageRules: {
            'image-hero': { aspectRatio: '16:9', minWidth: 1200, maxWidth: 1920 },
            'image-gallery': { aspectRatio: '1:1', minWidth: 400, maxWidth: 800 },
            'image-service': { aspectRatio: '16:10', minWidth: 600, maxWidth: 800 },
            'image-room': { aspectRatio: '16:9', minWidth: 800, maxWidth: 1200 },
            'image-team': { aspectRatio: '3:4', minWidth: 400, maxWidth: 600 },
            'image-food': { aspectRatio: '1:1', minWidth: 400, maxWidth: 800 },
            'image-testimonial': { aspectRatio: '1:1', minWidth: 60, maxWidth: 80 },
            // Homepage image classes
            'card-image': { aspectRatio: '16:10', minWidth: 400, maxWidth: 800 },
            'location-image': { aspectRatio: '4:3', minWidth: 600, maxWidth: 1200 },
            'site-logo': { aspectRatio: 'auto', minWidth: 40, maxWidth: 200 },
            'gallery-preview-item': { aspectRatio: '4:3', minWidth: 300, maxWidth: 600 },
            'hero-slide': { aspectRatio: '16:9', minWidth: 1200, maxWidth: 1920 },
            'feature-card': { aspectRatio: '1:1', minWidth: 200, maxWidth: 400 },
            'pricing-card': { aspectRatio: '16:10', minWidth: 300, maxWidth: 600 }
        },

        // Responsive breakpoints
        breakpoints: {
            mobile: 480,
            tablet: 768,
            laptop: 1024,
            desktop: 1200
        },

        galleryColumns: {
            mobile: 2,
            tablet: 3,
            laptop: 4,
            desktop: 4
        }
    });

    // ============================================================
    // 2. DOM CACHE - Single source of truth with lazy loading
    // ============================================================
    const DOM = {
        _cache: {},
        
        /**
         * Get cached element or query and cache
         * @param {string} key - Cache key
         * @param {string} selector - CSS selector
         * @param {boolean} multiple - Whether to return multiple elements
         * @returns {Element|NodeList|null} Cached element(s)
         */
        get: function(key, selector, multiple) {
            if (!this._cache[key]) {
                try {
                    const elements = document.querySelectorAll(selector);
                    this._cache[key] = multiple ? elements : (elements.length === 1 ? elements[0] : elements);
                } catch (e) {
                    console.warn('DOM cache failed for key:', key, e);
                    return null;
                }
            }
            return this._cache[key];
        },

        // Lightbox
        get lightbox() { return this.get('lightbox', '#lightbox', false); },
        get lightboxImg() { return this.get('lightboxImg', '#lightbox-img', false); },
        get lightboxCaption() { return this.get('lightboxCaption', '#lightbox-caption', false); },
        get lightboxCounter() { return this.get('lightboxCounter', '#lightbox-counter', false); },
        get closeLightbox() { return this.get('closeLightbox', '#close-lightbox', false); },
        get prevLightbox() { return this.get('prevLightbox', '#prev-lightbox', false); },
        get nextLightbox() { return this.get('nextLightbox', '#next-lightbox', false); },
        
        // Gallery
        get filterButtons() { return this.get('filterButtons', '.gallery-filter button', true); },
        get galleryItems() { return this.get('galleryItems', CONFIG.itemSelectors, true); },
        get galleryCounter() { return this.get('galleryCounter', '#gallery-counter', false); },
        get galleryGrids() { return this.get('galleryGrids', CONFIG.gallerySelectors, true); },
        
        // Images
        get allImages() { return this.get('allImages', 'img', true); },
        get lazyImages() { return this.get('lazyImages', 'img[data-src]', true); },
        get heroImages() { return this.get('heroImages', '.image-hero, .hero-slide', true); },
        get galleryImages() { return this.get('galleryImages', '.image-gallery, .gallery-item img, .gallery-preview-item img', true); },
        get serviceImages() { return this.get('serviceImages', '.image-service, .service-card img, .card-image', true); },
        get roomImages() { return this.get('roomImages', '.image-room, .vip-card img', true); },
        get logoImages() { return this.get('logoImages', '.site-logo', true); },
        get locationImages() { return this.get('locationImages', '.location-image img', true); },
        
        // Lightbox triggers
        get lightboxTriggers() { return this.get('lightboxTriggers', CONFIG.lightboxSelectors, true); }
    };

    // ============================================================
    // 3. UTILITIES - Shared helper functions (uses ZT.Utils if available)
    // ============================================================
    const Utils = {
        /**
         * Debounce utility - uses ZT.Utils if available
         */
        debounce: function(func, wait) {
            if (window.ZT && ZT.Utils && ZT.Utils.debounce) {
                return ZT.Utils.debounce(func, wait);
            }
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        },

        /**
         * Throttle utility - uses ZT.Utils if available
         */
        throttle: function(func, limit) {
            if (window.ZT && ZT.Utils && ZT.Utils.throttle) {
                return ZT.Utils.throttle(func, limit);
            }
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => { inThrottle = false; }, limit);
                }
            };
        },

        /**
         * Get image dimensions
         */
        getImageDimensions: function(img) {
            return new Promise((resolve) => {
                if (img.complete && img.naturalWidth > 0) {
                    resolve({ width: img.naturalWidth, height: img.naturalHeight });
                } else {
                    img.addEventListener('load', function() {
                        resolve({ width: this.naturalWidth, height: this.naturalHeight });
                    }, { once: true });
                    img.addEventListener('error', function() {
                        resolve({ width: 0, height: 0 });
                    }, { once: true });
                }
            });
        },

        /**
         * Check if element is in viewport
         */
        isInViewport: function(el) {
            const rect = el.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        },

        /**
         * Get image caption from element
         */
        getImageCaption: function(img) {
            return img.getAttribute('data-caption') || 
                   img.getAttribute('alt') || 
                   img.title || 
                   'ZT Lounge Meru';
        },

        /**
         * Format counter
         */
        formatCounter: function(current, total) {
            return (current + 1) + ' / ' + total;
        },

        /**
         * Preload image
         */
        preloadImage: function(src) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Failed to load image: ' + src));
                img.src = src;
            });
        },

        /**
         * Get touch swipe direction
         */
        getTouchDirection: function(startX, startY, endX, endY) {
            const dx = endX - startX;
            const dy = endY - startY;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            
            if (Math.max(absDx, absDy) < 50) return null;
            
            if (absDx > absDy) {
                return dx > 0 ? 'right' : 'left';
            } else {
                return dy > 0 ? 'down' : 'up';
            }
        },

        /**
         * Get current breakpoint
         */
        getBreakpoint: function(width) {
            if (width <= CONFIG.breakpoints.mobile) return 'mobile';
            if (width <= CONFIG.breakpoints.tablet) return 'tablet';
            if (width <= CONFIG.breakpoints.laptop) return 'laptop';
            return 'desktop';
        },

        /**
         * Dispatch custom event - uses ZT.Events if available
         */
        dispatchEvent: function(eventName, detail) {
            if (window.ZT && ZT.Events && ZT.Events.emit) {
                ZT.Events.emit(eventName, detail);
            } else {
                const event = new CustomEvent(eventName, { detail, bubbles: true });
                document.dispatchEvent(event);
            }
        },

        /**
         * Parse aspect ratio string
         */
        parseAspectRatio: function(ratio) {
            if (ratio === 'auto') return null;
            const parts = ratio.split(':');
            return parseFloat(parts[0]) / parseFloat(parts[1]);
        },

        /**
         * Check if reduced motion is preferred
         */
        prefersReducedMotion: function() {
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        },

        /**
         * Log message - uses ZT.Logger if available
         */
        log: function(message, data) {
            if (window.ZT && ZT.Logger && ZT.Logger.info) {
                ZT.Logger.info(message, data);
            } else if (window.console) {
                console.log('[Gallery]', message, data || '');
            }
        },

        /**
         * Log warning - uses ZT.Logger if available
         */
        warn: function(message, data) {
            if (window.ZT && ZT.Logger && ZT.Logger.warn) {
                ZT.Logger.warn(message, data);
            } else if (window.console) {
                console.warn('[Gallery]', message, data || '');
            }
        }
    };

    // ============================================================
    // 4. IMAGE DESIGN SYSTEM - Image validation
    // ============================================================
    class ImageDesignSystem {
        constructor() {
            this.rules = CONFIG.imageRules;
        }

        /**
         * Validate a single image
         * @param {HTMLImageElement} img - Image element
         * @returns {Promise} Validation result
         */
        async validateImage(img) {
            // Find matching rule
            let className = '';
            const classList = img.className.split(' ');
            for (const cls of classList) {
                if (this.rules[cls]) {
                    className = cls;
                    break;
                }
            }
            
            const rule = this.rules[className];
            
            if (!rule) {
                return { valid: true, message: 'No specific rule for this image class' };
            }

            try {
                const { width, height } = await Utils.getImageDimensions(img);
                
                if (width === 0 || height === 0) {
                    return {
                        valid: false,
                        message: 'Image dimensions could not be determined',
                        severity: 'warning'
                    };
                }

                const aspectRatio = width / height;
                const expectedRatio = Utils.parseAspectRatio(rule.aspectRatio);
                
                let valid = true;
                const messages = [];

                if (width < rule.minWidth) {
                    valid = false;
                    messages.push(`Width (${width}px) below minimum (${rule.minWidth}px)`);
                }

                if (width > rule.maxWidth) {
                    valid = false;
                    messages.push(`Width (${width}px) exceeds maximum (${rule.maxWidth}px)`);
                }

                if (expectedRatio !== null) {
                    const ratioDiff = Math.abs(aspectRatio - expectedRatio) / expectedRatio;
                    if (ratioDiff > 0.1) {
                        valid = false;
                        messages.push(`Aspect ratio (${aspectRatio.toFixed(2)}) differs from expected (${rule.aspectRatio})`);
                    }
                }

                return {
                    valid,
                    message: messages.join('; ') || 'Image meets design system requirements',
                    severity: valid ? 'success' : 'error',
                    dimensions: { width, height },
                    expected: rule,
                    className: className
                };
            } catch (e) {
                return {
                    valid: false,
                    message: 'Error validating image: ' + e.message,
                    severity: 'error'
                };
            }
        }

        /**
         * Audit all images on the page
         * @returns {Promise} Audit results
         */
        async auditImages() {
            const results = [];
            const images = document.querySelectorAll(
                '[class*="image-"], .card-image, .location-image, .site-logo, ' +
                '.gallery-preview-item, .hero-slide, .feature-card, .pricing-card'
            );
            
            for (const img of images) {
                const result = await this.validateImage(img);
                results.push({
                    element: img,
                    src: img.src || img.style.backgroundImage,
                    className: img.className,
                    ...result
                });
            }

            return results;
        }
    }

    // ============================================================
    // 5. LAZY LOADING SYSTEM
    // ============================================================
    class LazyLoader {
        constructor() {
            this.observer = null;
            this.images = [];
            this.loadedCount = 0;
            this._init();
        }

        _init() {
            if ('IntersectionObserver' in window) {
                this.observer = new IntersectionObserver(
                    this._handleIntersection.bind(this),
                    {
                        threshold: CONFIG.lazyLoadThreshold,
                        rootMargin: CONFIG.lazyLoadRootMargin
                    }
                );
                this._setupLazyImages();
            } else {
                this._loadAllImages();
            }
        }

        _setupLazyImages() {
            const lazyImages = DOM.lazyImages;
            
            if (lazyImages) {
                lazyImages.forEach(img => {
                    if (img.src && !img.src.startsWith('data:')) return;
                    this.images.push(img);
                    this.observer.observe(img);
                });
            }

            // Also support background images
            document.querySelectorAll('[data-bg]').forEach(el => {
                const bg = el.getAttribute('data-bg');
                if (bg) {
                    el.style.backgroundImage = `url(${bg})`;
                }
            });
        }

        _handleIntersection(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    this._loadImage(img);
                    this.observer.unobserve(img);
                }
            });
        }

        _loadImage(img) {
            if (img.dataset.src) {
                const src = img.dataset.src;
                
                img.style.opacity = '0.3';
                
                Utils.preloadImage(src)
                    .then(() => {
                        img.src = src;
                        img.removeAttribute('data-src');
                        img.style.opacity = '1';
                        img.classList.add('image-loaded');
                        this.loadedCount++;
                        Utils.dispatchEvent('lazy:loaded', { img, src });
                    })
                    .catch(() => {
                        if (img.dataset.fallback) {
                            img.src = img.dataset.fallback;
                        }
                        img.removeAttribute('data-src');
                        img.style.opacity = '1';
                        Utils.dispatchEvent('lazy:error', { img, src });
                    });
            } else if (img.src) {
                img.classList.add('image-loaded');
                this.loadedCount++;
            }
        }

        _loadAllImages() {
            this.images.forEach(img => this._loadImage(img));
        }

        getStats() {
            return {
                total: this.images.length,
                loaded: this.loadedCount,
                pending: this.images.length - this.loadedCount
            };
        }
    }

    // ============================================================
    // 6. GALLERY FILTER SYSTEM
    // ============================================================
    class GalleryFilter {
        constructor() {
            this.buttons = DOM.filterButtons;
            this.items = DOM.galleryItems;
            this.counter = DOM.galleryCounter;
            this.currentFilter = 'all';
            this.isAnimating = false;
            this._init();
        }

        _init() {
            if (!this.buttons || !this.buttons.length || !this.items || !this.items.length) return;
            
            this.buttons.forEach(button => {
                button.addEventListener('click', this._handleClick.bind(this));
                button.addEventListener('keydown', this._handleKeydown.bind(this));
            });
            
            this._updateCounter();
        }

        _handleClick(event) {
            const button = event.currentTarget;
            const filter = button.getAttribute('data-filter');
            
            if (this.isAnimating || filter === this.currentFilter) return;
            
            this._applyFilter(filter, button);
        }

        _handleKeydown(event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                this._handleClick(event);
            }
        }

        _applyFilter(filter, activeButton) {
            this.isAnimating = true;
            this.currentFilter = filter;
            
            this.buttons.forEach(btn => btn.classList.remove('active'));
            if (activeButton) {
                activeButton.classList.add('active');
            } else {
                const matchingButton = Array.from(this.buttons).find(
                    btn => btn.getAttribute('data-filter') === filter
                );
                if (matchingButton) matchingButton.classList.add('active');
            }
            
            this.items.forEach((item, index) => {
                const category = item.getAttribute('data-category');
                const shouldShow = filter === 'all' || category === filter;
                
                if (shouldShow) {
                    this._showItem(item, index);
                } else {
                    this._hideItem(item, index);
                }
            });
            
            setTimeout(() => {
                this._updateCounter();
                this.isAnimating = false;
                Utils.dispatchEvent('gallery:filtered', { filter });
            }, CONFIG.galleryAnimationDelay * 8 + 400);
        }

        _showItem(item, index) {
            item.style.display = 'block';
            item.style.opacity = '0';
            item.style.transform = 'scale(0.95) translateY(20px)';
            
            // Force reflow for animation
            void item.offsetWidth;
            
            setTimeout(() => {
                item.style.transition = `opacity 0.5s ease ${index * 0.05}s, transform 0.5s ease ${index * 0.05}s`;
                item.style.opacity = '1';
                item.style.transform = 'scale(1) translateY(0)';
            }, CONFIG.galleryAnimationDelay);
        }

        _hideItem(item, index) {
            item.style.transition = `opacity 0.4s ease ${index * 0.03}s, transform 0.4s ease ${index * 0.03}s`;
            item.style.opacity = '0';
            item.style.transform = 'scale(0.95) translateY(20px)';
            
            setTimeout(() => {
                item.style.display = 'none';
            }, CONFIG.galleryAnimationDelay * 6 + 400);
        }

        _updateCounter() {
            if (!this.counter) return;
            
            const visibleItems = Array.from(this.items).filter(
                item => item.style.display !== 'none'
            ).length;
            
            const total = this.items.length;
            const filterName = this.currentFilter !== 'all' ? ` (${this.currentFilter})` : '';
            
            this.counter.textContent = `${visibleItems} of ${total} photos${filterName}`;
            this.counter.setAttribute('aria-label', 
                `Showing ${visibleItems} of ${total} gallery items${filterName}`
            );
        }

        getState() {
            return {
                currentFilter: this.currentFilter,
                totalItems: this.items ? this.items.length : 0,
                visibleItems: this.items ? Array.from(this.items).filter(
                    item => item.style.display !== 'none'
                ).length : 0
            };
        }
    }

    // ============================================================
    // 7. LIGHTBOX SYSTEM
    // ============================================================
    class Lightbox {
        constructor() {
            this.element = DOM.lightbox;
            this.img = DOM.lightboxImg;
            this.caption = DOM.lightboxCaption;
            this.counter = DOM.lightboxCounter;
            this.closeBtn = DOM.closeLightbox;
            this.prevBtn = DOM.prevLightbox;
            this.nextBtn = DOM.nextLightbox;
            
            this.images = [];
            this.currentIndex = 0;
            this.isOpen = false;
            this.isAnimating = false;
            this.touchStartX = 0;
            this.touchStartY = 0;
            
            this._init();
        }

        _init() {
            this._setupImageTriggers();
            this._setupControls();
            
            if (CONFIG.keyboardNavigation) {
                this._setupKeyboardNavigation();
            }
            
            if (CONFIG.touchSwipe) {
                this._setupTouchSupport();
            }
        }

        _setupImageTriggers() {
            const triggers = DOM.lightboxTriggers;
            
            if (!triggers || !triggers.length) return;
            
            triggers.forEach(img => {
                img.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._openFromImage(img);
                });
                
                img.setAttribute('role', 'button');
                img.setAttribute('tabindex', '0');
                img.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this._openFromImage(img);
                    }
                });
            });
        }

        _openFromImage(clickedImg) {
            // Find all images in the same container
            const containers = document.querySelectorAll(
                '.gallery-grid, .gallery-preview-grid, .service-cards-grid, ' +
                '.location-grid, .service-detail-grid, .about-grid, ' +
                '.image-grid, .feature-grid, .pricing-grid'
            );
            
            let parent = null;
            for (const container of containers) {
                if (container.contains(clickedImg)) {
                    parent = container;
                    break;
                }
            }
            
            if (parent) {
                const allImgs = parent.querySelectorAll('img');
                this.images = Array.from(allImgs).map(i => i.getAttribute('src') || i.src);
                const index = this.images.indexOf(clickedImg.getAttribute('src') || clickedImg.src);
                if (index !== -1) this._open(index);
            } else {
                const group = clickedImg.getAttribute('data-lightbox-group');
                if (group) {
                    const groupImages = document.querySelectorAll(
                        `[data-lightbox-group="${group}"]`
                    );
                    this.images = Array.from(groupImages).map(i => i.getAttribute('src') || i.src);
                    const index = this.images.indexOf(clickedImg.getAttribute('src') || clickedImg.src);
                    if (index !== -1) this._open(index);
                } else {
                    this.images = [clickedImg.getAttribute('src') || clickedImg.src];
                    this._open(0);
                }
            }
        }

        _open(index) {
            if (this.isOpen || this.isAnimating) return;
            if (!this.images || this.images.length === 0) return;
            
            this.currentIndex = Math.max(0, Math.min(index, this.images.length - 1));
            this.isOpen = true;
            
            if (this.element) {
                this.element.classList.add('active');
            }
            document.body.style.overflow = 'hidden';
            
            this._loadImage(this.currentIndex);
            this._updateControls();
            this._preloadAdjacentImages();
            
            Utils.dispatchEvent('lightbox:opened', { 
                index: this.currentIndex, 
                total: this.images.length 
            });
        }

        _loadImage(index) {
            if (this.isAnimating) return;
            
            const src = this.images[index];
            if (!src || !this.img) return;
            
            this.isAnimating = true;
            this.img.style.opacity = '0.3';
            
            Utils.preloadImage(src)
                .then(() => {
                    this.img.src = src;
                    this.img.alt = this._getImageCaption(index);
                    this._updateCaption(index);
                    this._updateCounter(index);
                    this.img.style.opacity = '1';
                    this.isAnimating = false;
                    this._preloadAdjacentImages();
                })
                .catch(() => {
                    this.img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f0edea" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" font-family="sans-serif" font-size="20" fill="%23999" text-anchor="middle" dy=".3em"%3EImage unavailable%3C/text%3E%3C/svg%3E';
                    this.img.alt = 'Image unavailable';
                    this.isAnimating = false;
                });
        }

        _getImageCaption(index) {
            const src = this.images[index];
            const imgElement = document.querySelector(`img[src="${src}"]`);
            if (imgElement) return Utils.getImageCaption(imgElement);
            return 'ZT Lounge Meru - Gallery image ' + (index + 1);
        }

        _updateCaption(index) {
            if (this.caption) {
                const caption = this._getImageCaption(index);
                this.caption.textContent = caption;
                this.caption.setAttribute('aria-label', caption);
            }
        }

        _updateCounter(index) {
            if (this.counter && this.images.length > 1) {
                this.counter.textContent = Utils.formatCounter(index, this.images.length);
                this.counter.setAttribute('aria-label', 
                    'Image ' + (index + 1) + ' of ' + this.images.length
                );
            }
        }

        _updateControls() {
            if (this.images.length <= 1) {
                if (this.prevBtn) this.prevBtn.style.display = 'none';
                if (this.nextBtn) this.nextBtn.style.display = 'none';
            } else {
                if (this.prevBtn) this.prevBtn.style.display = 'block';
                if (this.nextBtn) this.nextBtn.style.display = 'block';
            }
        }

        _preloadAdjacentImages() {
            const count = CONFIG.preloadAdjacentCount;
            for (let i = 1; i <= count; i++) {
                const nextIndex = (this.currentIndex + i) % this.images.length;
                if (nextIndex !== this.currentIndex) {
                    Utils.preloadImage(this.images[nextIndex]).catch(() => {});
                }
                
                const prevIndex = (this.currentIndex - i + this.images.length) % this.images.length;
                if (prevIndex !== this.currentIndex) {
                    Utils.preloadImage(this.images[prevIndex]).catch(() => {});
                }
            }
        }

        _close() {
            if (!this.isOpen || this.isAnimating) return;
            
            this.isOpen = false;
            if (this.element) {
                this.element.classList.remove('active');
            }
            document.body.style.overflow = '';
            
            Utils.dispatchEvent('lightbox:closed', { index: this.currentIndex });
        }

        _navigate(direction) {
            if (this.images.length === 0 || this.isAnimating) return;
            
            const newIndex = (this.currentIndex + direction + this.images.length) % this.images.length;
            if (newIndex === this.currentIndex) return;
            
            this.currentIndex = newIndex;
            this._loadImage(this.currentIndex);
            this._updateCounter(this.currentIndex);
            this._updateCaption(this.currentIndex);
            this._preloadAdjacentImages();
            
            Utils.dispatchEvent('lightbox:navigated', { 
                direction, 
                index: this.currentIndex 
            });
        }

        _setupControls() {
            if (this.closeBtn) {
                this.closeBtn.addEventListener('click', () => this._close());
            }
            
            if (this.prevBtn) {
                this.prevBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._navigate(-1);
                });
            }
            
            if (this.nextBtn) {
                this.nextBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._navigate(1);
                });
            }
            
            if (this.element) {
                this.element.addEventListener('click', (e) => {
                    if (e.target === this.element) this._close();
                });
            }
        }

        _setupKeyboardNavigation() {
            document.addEventListener('keydown', (e) => {
                if (!this.isOpen) return;
                
                switch (e.key) {
                    case 'Escape':
                        e.preventDefault();
                        this._close();
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        this._navigate(-1);
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this._navigate(1);
                        break;
                }
            });
        }

        _setupTouchSupport() {
            if (this.element) {
                this.element.addEventListener('touchstart', (e) => {
                    const touch = e.touches[0];
                    this.touchStartX = touch.clientX;
                    this.touchStartY = touch.clientY;
                }, { passive: true });
                
                this.element.addEventListener('touchmove', (e) => {
                    if (!this.touchStartX || !this.touchStartY) return;
                    
                    const touch = e.touches[0];
                    const direction = Utils.getTouchDirection(
                        this.touchStartX, 
                        this.touchStartY,
                        touch.clientX, 
                        touch.clientY
                    );
                    
                    if (direction === 'left') {
                        this._navigate(1);
                        this.touchStartX = touch.clientX;
                        this.touchStartY = touch.clientY;
                    } else if (direction === 'right') {
                        this._navigate(-1);
                        this.touchStartX = touch.clientX;
                        this.touchStartY = touch.clientY;
                    }
                }, { passive: true });
            }
        }

        getState() {
            return {
                isOpen: this.isOpen,
                currentIndex: this.currentIndex,
                totalImages: this.images.length
            };
        }
    }

    // ============================================================
    // 8. GALLERY ANIMATION SYSTEM - CSS-based animations
    // ============================================================
    class GalleryAnimation {
        constructor() {
            this.grids = DOM.galleryGrids;
            this._init();
        }

        _init() {
            if (!this.grids || !this.grids.length) return;
            
            this.grids.forEach(grid => {
                const items = grid.querySelectorAll(
                    '.gallery-item, .gallery-preview-item, .service-card'
                );
                
                // Skip if already visible (homepage preview)
                const isPreview = grid.closest('.gallery-preview') || 
                                 grid.closest('.gallery-preview-grid');
                
                items.forEach((item, index) => {
                    if (!isPreview && !Utils.prefersReducedMotion()) {
                        // Add classes instead of inline styles
                        item.classList.add('gallery-item-hidden');
                        item.dataset.animationIndex = index;
                    }
                });
                
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const visibleItems = entry.target.querySelectorAll(
                                '.gallery-item, .gallery-preview-item, .service-card'
                            );
                            visibleItems.forEach((item, index) => {
                                if (item.classList.contains('gallery-item-hidden')) {
                                    setTimeout(() => {
                                        item.classList.remove('gallery-item-hidden');
                                        item.classList.add('gallery-item-visible');
                                    }, index * 80);
                                }
                            });
                            observer.unobserve(entry.target);
                        }
                    });
                }, {
                    threshold: 0.1,
                    rootMargin: '0px 0px -50px 0px'
                });
                
                observer.observe(grid);
            });
        }
    }

    // ============================================================
    // 9. RESPONSIVE IMAGE HANDLER
    // ============================================================
    class ResponsiveImageHandler {
        constructor() {
            this._init();
        }

        _init() {
            const debouncedResize = Utils.debounce(this._handleResize.bind(this), 250);
            window.addEventListener('resize', debouncedResize);
            this._handleResize();
        }

        _handleResize() {
            const width = window.innerWidth;
            const breakpoint = Utils.getBreakpoint(width);
            
            document.documentElement.setAttribute('data-breakpoint', breakpoint);
            this._updateGalleryGrid(breakpoint);
            this._updateResponsiveImages(breakpoint);
        }

        _updateResponsiveImages(breakpoint) {
            document.querySelectorAll('img[data-srcset]').forEach(img => {
                const srcset = img.getAttribute('data-srcset-' + breakpoint);
                if (srcset) {
                    img.srcset = srcset;
                }
            });
        }

        _updateGalleryGrid(breakpoint) {
            const grids = document.querySelectorAll('.gallery-grid, .gallery-preview-grid');
            const columns = CONFIG.galleryColumns;
            
            grids.forEach(grid => {
                grid.style.gridTemplateColumns = 'repeat(' + (columns[breakpoint] || 4) + ', 1fr)';
            });
        }
    }

    // ============================================================
    // 10. ACCESSIBILITY ENHANCER
    // ============================================================
    class AccessibilityEnhancer {
        constructor() {
            this._init();
        }

        _init() {
            this._validateAltText();
            this._enhanceControls();
            this._setupFocusManagement();
            this._setupAriaLive();
        }

        _validateAltText() {
            document.querySelectorAll('img').forEach(img => {
                if (!img.hasAttribute('alt')) {
                    img.setAttribute('alt', '');
                }
            });
        }

        _enhanceControls() {
            document.querySelectorAll('.gallery-filter button').forEach(btn => {
                const filter = btn.getAttribute('data-filter');
                btn.setAttribute('role', 'tab');
                btn.setAttribute('aria-selected', btn.classList.contains('active') ? 'true' : 'false');
                btn.setAttribute('aria-controls', 'gallery-' + filter);
            });
            
            const lightboxControls = [
                { id: 'close-lightbox', label: 'Close lightbox' },
                { id: 'prev-lightbox', label: 'Previous image' },
                { id: 'next-lightbox', label: 'Next image' }
            ];
            
            lightboxControls.forEach(({ id, label }) => {
                const el = document.getElementById(id);
                if (el) {
                    el.setAttribute('aria-label', label);
                    el.setAttribute('role', 'button');
                }
            });
        }

        _setupFocusManagement() {
            document.addEventListener('lightbox:opened', () => {
                const focusableElements = document.querySelectorAll(
                    '#lightbox button, #lightbox [role="button"]'
                );
                if (focusableElements.length > 0) {
                    focusableElements[0].focus();
                }
            });
        }

        _setupAriaLive() {
            const counter = document.getElementById('gallery-counter');
            if (counter) {
                counter.setAttribute('aria-live', 'polite');
                counter.setAttribute('aria-atomic', 'true');
            }
        }
    }

    // ============================================================
    // 11. PERFORMANCE MONITOR
    // ============================================================
    class PerformanceMonitor {
        constructor() {
            this.metrics = {
                imagesLoaded: 0,
                totalImages: 0,
                layoutShifts: 0,
                largestContentfulPaint: 0
            };
            this._init();
        }

        _init() {
            if ('PerformanceObserver' in window) {
                try {
                    const lcpObserver = new PerformanceObserver((entryList) => {
                        const entries = entryList.getEntries();
                        const lastEntry = entries[entries.length - 1];
                        this.metrics.largestContentfulPaint = lastEntry.startTime;
                    });
                    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                    
                    const clsObserver = new PerformanceObserver((entryList) => {
                        for (const entry of entryList.getEntries()) {
                            if (!entry.hadRecentInput) {
                                this.metrics.layoutShifts += entry.value;
                            }
                        }
                    });
                    clsObserver.observe({ entryTypes: ['layout-shift'] });
                } catch (e) {
                    // PerformanceObserver not fully supported
                }
            }
            
            this.metrics.totalImages = document.querySelectorAll('img').length;
            
            // Listen for lazy loaded images
            document.addEventListener('lazy:loaded', () => {
                this.metrics.imagesLoaded++;
            });
        }

        getReport() {
            return {
                ...this.metrics,
                loadProgress: this.metrics.totalImages > 0 ? 
                    (this.metrics.imagesLoaded / this.metrics.totalImages * 100).toFixed(1) : 0
            };
        }
    }

    // ============================================================
    // 12. GALLERY ENGINE - Orchestrates all gallery modules
    // ============================================================
    const GalleryEngine = {
        _initialized: false,
        _components: {},

        /**
         * Initialize gallery engine
         */
        init: function() {
            if (this._initialized) return;
            
            try {
                this._components = {
                    lazyLoader: new LazyLoader(),
                    galleryFilter: new GalleryFilter(),
                    lightbox: new Lightbox(),
                    galleryAnimation: new GalleryAnimation(),
                    responsiveImages: new ResponsiveImageHandler(),
                    accessibility: new AccessibilityEnhancer(),
                    designSystem: new ImageDesignSystem(),
                    performance: new PerformanceMonitor()
                };

                this._setupGlobalListeners();
                this._runAudit();
                
                this._initialized = true;
                this._logStartup();
                
                Utils.dispatchEvent('gallery:ready');
                
            } catch (e) {
                Utils.warn('Gallery initialization failed', e);
            }
        },

        /**
         * Setup global event listeners
         */
        _setupGlobalListeners: function() {
            // Re-run audit after images load
            window.addEventListener('load', () => {
                setTimeout(() => this._runAudit(), 1000);
            });
        },

        /**
         * Run image audit
         */
        _runAudit: function() {
            this._components.designSystem.auditImages()
                .then(results => {
                    const errors = results.filter(r => !r.valid);
                    if (errors.length > 0) {
                        Utils.warn('Found ' + errors.length + ' images not matching design system', { errors });
                    }
                    Utils.dispatchEvent('gallery:auditComplete', { results, errors });
                })
                .catch(() => {
                    // Silent fail for audit
                });
        },

        /**
         * Log startup
         */
        _logStartup: function() {
            Utils.log('Gallery System initialized');
            Utils.log('Performance:', this._components.performance.getReport());
        },

        /**
         * Get component
         * @param {string} name - Component name
         * @returns {Object} Component instance
         */
        getComponent: function(name) {
            return this._components[name] || null;
        },

        /**
         * Get all components
         * @returns {Object} All components
         */
        getComponents: function() {
            return this._components;
        },

        /**
         * Get performance report
         * @returns {Object} Performance metrics
         */
        getPerformanceReport: function() {
            return this._components.performance.getReport();
        },

        /**
         * Check if gallery is initialized
         * @returns {boolean}
         */
        isInitialized: function() {
            return this._initialized;
        }
    };

    // ============================================================
    // 13. INTEGRATION WITH ZT KERNEL
    // ============================================================
    
    // Register gallery with ZT namespace if available
    if (window.ZT) {
        if (!ZT.Components) {
            ZT.Components = {};
        }
        ZT.Components.Gallery = GalleryEngine;
        Utils.log('Gallery registered with ZT kernel');
    } else {
        // Fallback: expose globally
        window.ZTGallery = GalleryEngine;
    }

    // ============================================================
    // 14. BOOTSTRAP - Wait for DOM to be ready
    // ============================================================
    
    // If ZT kernel exists, let it handle initialization
    if (window.ZT && ZT.Kernel && ZT.Kernel.isReady) {
        // Wait for kernel to be ready
        if (ZT.Kernel.isReady()) {
            GalleryEngine.init();
        } else {
            ZT.Events.on('zt-ready', function() {
                GalleryEngine.init();
            });
        }
    } else {
        // Standalone initialization
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                GalleryEngine.init();
            });
        } else {
            GalleryEngine.init();
        }
    }

})();


