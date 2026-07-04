/**
 * ============================================================
 * ZT Lounge Meru - Hero Slider
 * Enterprise-Grade Hero Carousel System
 * Version: 1.0.0
 * 
 * Architecture: Config → DOM Cache → Utilities → Engine → Integration
 * 
 * Features:
 *   - Autoplay with smooth fade transitions
 *   - Navigation controls (prev/next/dots)
 *   - Pause on hover, focus, touch, blur, and tab visibility
 *   - Keyboard navigation (Arrow keys, Home, End)
 *   - Touch swipe support with intelligent pause
 *   - Respects prefers-reduced-motion
 *   - Accessibility support (ARIA labels, roles)
 *   - Performance optimized
 *   - Duplicate initialization prevention
 *   - Defensive state management
 *   - Comprehensive lifecycle management
 * 
 * Dependencies: ZT Kernel (main.js) - Optional
 * Integration: ZT.Components.HeroSlider
 * ============================================================
 */

(function() {
    'use strict';

    // ============================================================
    // 1. CONFIGURATION - Type-safe constants (DO NOT MODIFY RUNTIME)
    // ============================================================
    const CONFIG = Object.freeze({
        // Timing (in milliseconds)
        initialDelay: 2500,        // First slide shows for 2.5s before transitioning
        autoplayInterval: 6000,    // Each slide shows for 6s
        transitionDuration: 1000,  // Fade transition takes 1s
        reducedMotionInterval: 8000, // Longer interval for reduced motion
        reducedMotionTransition: 0,  // No transition for reduced motion
        touchPauseDelay: 300,      // Delay before resuming after touch
        
        // Behavior
        pauseOnHover: true,
        pauseOnFocus: true,
        pauseWhenHidden: true,
        pauseWhenBlurred: true,    // Pause when window loses focus
        pauseOnTouch: true,        // Pause during touch interaction
        keyboardNavigation: true,
        touchSwipe: true,
        autoHeight: false,         // Set to true for dynamic height
        
        // Selectors (Update these to match your HTML)
        sliderSelector: '.hero-slider',
        slideSelector: '.hero-slide',
        dotSelector: '.hero-dot',
        prevSelector: '.hero-prev',
        nextSelector: '.hero-next',
        indicatorSelector: '.hero-indicator',
        contentSelector: '.hero-content',
        
        // Classes
        activeClass: 'active',
        transitioningClass: 'transitioning',
        pausedClass: 'paused',
        reducedMotionClass: 'reduced-motion'
    });

    // ============================================================
    // 2. DOM CACHE - Lazy loading with caching
    // ============================================================
    const DOM = {
        _cache: {},
        _initialized: false,
        
        get: function(key, selector, multiple = false) {
            if (!this._cache[key]) {
                try {
                    const elements = document.querySelectorAll(selector);
                    this._cache[key] = multiple ? elements : (elements.length === 1 ? elements[0] : elements);
                } catch (e) {
                    console.warn('[HeroSlider] DOM cache failed for key:', key, e);
                    return null;
                }
            }
            return this._cache[key];
        },
        
        // Main elements
        get slider() { return this.get('slider', CONFIG.sliderSelector, false); },
        get slides() { return this.get('slides', CONFIG.slideSelector, true); },
        
        // Controls
        get dots() { return this.get('dots', CONFIG.dotSelector, true); },
        get prevBtn() { return this.get('prevBtn', CONFIG.prevSelector, false); },
        get nextBtn() { return this.get('nextBtn', CONFIG.nextSelector, false); },
        get indicator() { return this.get('indicator', CONFIG.indicatorSelector, false); },
        
        // Content
        get contents() { return this.get('contents', CONFIG.contentSelector, true); },
        
        // Clear cache method
        clearCache: function() {
            this._cache = {};
            this._initialized = false;
        }
    };

    // ============================================================
    // 3. UTILITIES - Shared helper functions
    // ============================================================
    const Utils = {
        /**
         * Debounce - limits function calls
         */
        debounce: function(func, wait) {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        },
        
        /**
         * Throttle - ensures function executes at most once per interval
         */
        throttle: function(func, limit) {
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
         * Check if reduced motion is preferred
         */
        prefersReducedMotion: function() {
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        },
        
        /**
         * Check if document is visible
         */
        isDocumentVisible: function() {
            return !document.hidden;
        },
        
        /**
         * Check if window has focus
         */
        isWindowFocused: function() {
            return document.hasFocus();
        },
        
        /**
         * Dispatch custom event
         */
        dispatchEvent: function(eventName, detail = {}) {
            try {
                const event = new CustomEvent(`heroslider:${eventName}`, { 
                    detail, 
                    bubbles: true 
                });
                document.dispatchEvent(event);
            } catch (e) {
                // Silent fail for older browsers
            }
        },
        
        /**
         * Get element's computed style
         */
        getStyle: function(element, property) {
            return window.getComputedStyle(element).getPropertyValue(property);
        },
        
        /**
         * Log with prefix
         */
        log: function(message, data = null) {
            if (window.ZT && ZT.Logger && ZT.Logger.info) {
                ZT.Logger.info(`[HeroSlider] ${message}`, data);
            } else if (window.console) {
                console.log(`[HeroSlider] ${message}`, data || '');
            }
        },
        
        /**
         * Warn with prefix
         */
        warn: function(message, data = null) {
            if (window.ZT && ZT.Logger && ZT.Logger.warn) {
                ZT.Logger.warn(`[HeroSlider] ${message}`, data);
            } else if (window.console) {
                console.warn(`[HeroSlider] ${message}`, data || '');
            }
        }
    };

    // ============================================================
    // 4. HERO SLIDER ENGINE
    // ============================================================
    class HeroSlider {
        /**
         * Initialize the hero slider
         * @param {Element} sliderElement - Optional slider element
         */
        constructor(sliderElement = null) {
            // Guard against duplicate initialization
            if (sliderElement && sliderElement._heroSlider) {
                Utils.warn('Hero slider already initialized on this element');
                return sliderElement._heroSlider;
            }
            
            // Validate DOM elements
            this.slider = sliderElement || DOM.slider;
            this.slides = this.slider ? this.slider.querySelectorAll(CONFIG.slideSelector) : DOM.slides;
            
            if (!this.slider || !this.slides || this.slides.length < 2) {
                Utils.warn('Hero slider: Insufficient slides or no slider found', {
                    slider: !!this.slider,
                    slides: this.slides ? this.slides.length : 0
                });
                return;
            }
            
            // Store reference on element to prevent duplicate initialization
            this.slider._heroSlider = this;
            
            // Core state
            this.currentIndex = 0;
            this.totalSlides = this.slides.length;
            this.isTransitioning = false;
            this.isPaused = false;
            this.isDestroyed = false;
            this.autoplayTimer = null;
            this.transitionTimer = null;
            this.touchResumeTimer = null;
            
            // Compute runtime values based on reduced motion preference
            this.reducedMotion = Utils.prefersReducedMotion();
            this.transitionDuration = this.reducedMotion
                ? CONFIG.reducedMotionTransition
                : CONFIG.transitionDuration;
            this.autoplayInterval = this.reducedMotion
                ? CONFIG.reducedMotionInterval
                : CONFIG.autoplayInterval;
            
            // DOM references
            this.dots = DOM.dots;
            this.prevBtn = DOM.prevBtn;
            this.nextBtn = DOM.nextBtn;
            this.indicator = DOM.indicator;
            this.contents = DOM.contents;
            
            // Touch state
            this.touchStartX = 0;
            this.touchStartY = 0;
            this.isTouching = false;
            
            // Bind methods
            this._boundHandleKeydown = this._handleKeydown.bind(this);
            this._boundHandleVisibility = this._handleVisibility.bind(this);
            this._boundHandleWindowBlur = this._handleWindowBlur.bind(this);
            this._boundHandleWindowFocus = this._handleWindowFocus.bind(this);
            this._boundHandleResize = this._handleResize.bind(this);
            this._boundHandleTouchStart = this._handleTouchStart.bind(this);
            this._boundHandleTouchMove = this._handleTouchMove.bind(this);
            this._boundHandleTouchEnd = this._handleTouchEnd.bind(this);
            
            // Initialize
            this._init();
        }
        
        /**
         * Internal initialization
         */
        _init() {
            Utils.log('Initializing hero slider', { 
                total: this.totalSlides,
                reducedMotion: this.reducedMotion,
                transitionDuration: this.transitionDuration,
                autoplayInterval: this.autoplayInterval
            });
            
            // Apply reduced motion class if needed
            if (this.reducedMotion) {
                this.slider.classList.add(CONFIG.reducedMotionClass);
            }
            
            // Setup initial state
            this._setupSlides();
            this._setupControls();
            this._setupDots();
            this._setupKeyboard();
            this._setupTouch();
            this._setupVisibility();
            this._setupWindowFocus();
            this._setupResize();
            
            // Start autoplay
            this._startAutoplay(CONFIG.initialDelay);
            
            // Dispatch ready event
            Utils.dispatchEvent('ready', { 
                total: this.totalSlides,
                reducedMotion: this.reducedMotion
            });
            
            Utils.log('Hero slider ready', { 
                total: this.totalSlides, 
                reducedMotion: this.reducedMotion 
            });
        }
        
        /**
         * Setup initial slide states
         */
        _setupSlides() {
            this.slides.forEach((slide, index) => {
                // Remove existing active class
                slide.classList.remove(CONFIG.activeClass);
                
                // Set initial opacity and z-index
                if (index === 0) {
                    slide.classList.add(CONFIG.activeClass);
                    slide.style.opacity = '1';
                    slide.style.zIndex = '2';
                    slide.style.pointerEvents = 'auto';
                } else {
                    slide.style.opacity = '0';
                    slide.style.zIndex = '1';
                    slide.style.pointerEvents = 'none';
                }
                
                // Add transition for smooth fading
                if (!this.reducedMotion) {
                    slide.style.transition = `opacity ${this.transitionDuration}ms ease-in-out`;
                } else {
                    slide.style.transition = 'none';
                }
            });
            
            // Update indicator
            this._updateIndicator(0);
        }
        
        /**
         * Setup control buttons
         */
        _setupControls() {
            // Previous button
            if (this.prevBtn) {
                this.prevBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.prev();
                });
                this.prevBtn.setAttribute('aria-label', 'Previous slide');
                this.prevBtn.setAttribute('role', 'button');
            }
            
            // Next button
            if (this.nextBtn) {
                this.nextBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.next();
                });
                this.nextBtn.setAttribute('aria-label', 'Next slide');
                this.nextBtn.setAttribute('role', 'button');
            }
            
            // Pause on hover
            if (CONFIG.pauseOnHover) {
                this.slider.addEventListener('mouseenter', () => this.pause());
                this.slider.addEventListener('mouseleave', () => this.resume());
            }
            
            // Pause on focus
            if (CONFIG.pauseOnFocus) {
                const focusable = this.slider.querySelectorAll('button, a, [tabindex]');
                focusable.forEach(el => {
                    el.addEventListener('focusin', () => this.pause());
                    el.addEventListener('focusout', () => this.resume());
                });
            }
        }
        
        /**
         * Setup dot indicators
         */
        _setupDots() {
            // If dots don't exist in markup, create them
            if (!this.dots || this.dots.length === 0) {
                this._createDots();
                return;
            }
            
            // Setup existing dots
            this.dots.forEach((dot, index) => {
                dot.addEventListener('click', () => this.goTo(index));
                dot.setAttribute('role', 'button');
                dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
                dot.setAttribute('tabindex', '0');
                
                // Keyboard support for dots
                dot.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.goTo(index);
                    }
                });
            });
            
            // Update active state
            this._updateDots(0);
        }
        
        /**
         * Create dot indicators dynamically
         */
        _createDots() {
            const indicator = this.indicator || this.slider.querySelector('.hero-indicator');
            if (!indicator) return;
            
            // Clear existing dots
            indicator.innerHTML = '';
            
            // Create new dots
            for (let i = 0; i < this.totalSlides; i++) {
                const dot = document.createElement('button');
                dot.className = CONFIG.dotSelector.replace('.', '');
                dot.setAttribute('data-index', i);
                dot.setAttribute('role', 'button');
                dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
                dot.setAttribute('tabindex', '0');
                
                dot.addEventListener('click', () => this.goTo(i));
                dot.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.goTo(i);
                    }
                });
                
                indicator.appendChild(dot);
            }
            
            // Update reference
            this.dots = indicator.querySelectorAll(CONFIG.dotSelector);
            this._updateDots(0);
        }
        
        /**
         * Setup keyboard navigation
         */
        _setupKeyboard() {
            if (!CONFIG.keyboardNavigation) return;
            document.addEventListener('keydown', this._boundHandleKeydown);
        }
        
        /**
         * Handle keyboard events
         * @param {KeyboardEvent} e 
         */
        _handleKeydown(e) {
            // Only handle if slider is visible
            if (!this._isSliderVisible()) return;
            
            // Check if we're in an input/textarea
            const target = e.target;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return;
            }
            
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.prev();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.next();
                    break;
                case 'Home':
                    e.preventDefault();
                    this.goTo(0);
                    break;
                case 'End':
                    e.preventDefault();
                    this.goTo(this.totalSlides - 1);
                    break;
            }
        }
        
        /**
         * Setup touch swipe support with intelligent pause
         */
        _setupTouch() {
            if (!CONFIG.touchSwipe || !this.slider) return;
            
            this.slider.addEventListener('touchstart', this._boundHandleTouchStart, { passive: true });
            this.slider.addEventListener('touchmove', this._boundHandleTouchMove, { passive: false });
            this.slider.addEventListener('touchend', this._boundHandleTouchEnd, { passive: true });
            this.slider.addEventListener('touchcancel', this._boundHandleTouchEnd, { passive: true });
        }
        
        /**
         * Handle touch start
         * @param {TouchEvent} e 
         */
        _handleTouchStart(e) {
            const touch = e.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
            this.isTouching = true;
            
            // Pause during touch interaction
            if (CONFIG.pauseOnTouch) {
                this.pause();
            }
        }
        
        /**
         * Handle touch move
         * @param {TouchEvent} e 
         */
        _handleTouchMove(e) {
            if (!this.touchStartX || !this.touchStartY || !this.isTouching) return;
            
            const touch = e.touches[0];
            const dx = touch.clientX - this.touchStartX;
            const dy = touch.clientY - this.touchStartY;
            
            // Only handle horizontal swipes
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
                e.preventDefault();
                
                if (dx > 0) {
                    this.prev();
                } else {
                    this.next();
                }
                
                // Reset touch start to prevent multiple triggers
                this.touchStartX = touch.clientX;
                this.touchStartY = touch.clientY;
            }
        }
        
        /**
         * Handle touch end
         */
        _handleTouchEnd() {
            this.isTouching = false;
            this.touchStartX = 0;
            this.touchStartY = 0;
            
            // Resume after a short delay to prevent immediate transition
            if (CONFIG.pauseOnTouch) {
                clearTimeout(this.touchResumeTimer);
                this.touchResumeTimer = setTimeout(() => {
                    this.resume();
                }, CONFIG.touchPauseDelay);
            }
        }
        
        /**
         * Setup visibility change handling
         */
        _setupVisibility() {
            if (!CONFIG.pauseWhenHidden) return;
            document.addEventListener('visibilitychange', this._boundHandleVisibility);
        }
        
        /**
         * Handle visibility change - defensive
         */
        _handleVisibility() {
            if (document.hidden) {
                if (!this.isPaused) {
                    this.pause();
                    Utils.log('Document hidden - autoplay paused');
                }
            } else {
                if (this.isPaused && Utils.isWindowFocused()) {
                    this.resume();
                    Utils.log('Document visible - autoplay resumed');
                }
            }
        }
        
        /**
         * Setup window focus handling
         */
        _setupWindowFocus() {
            if (!CONFIG.pauseWhenBlurred) return;
            window.addEventListener('blur', this._boundHandleWindowBlur);
            window.addEventListener('focus', this._boundHandleWindowFocus);
        }
        
        /**
         * Handle window blur - defensive
         */
        _handleWindowBlur() {
            if (!this.isPaused) {
                this.pause();
                Utils.log('Window lost focus - autoplay paused');
            }
        }
        
        /**
         * Handle window focus - defensive
         */
        _handleWindowFocus() {
            if (this.isPaused && Utils.isDocumentVisible()) {
                this.resume();
                Utils.log('Window gained focus - autoplay resumed');
            }
        }
        
        /**
         * Setup resize handling
         */
        _setupResize() {
            if (!CONFIG.autoHeight) return;
            
            const debouncedResize = Utils.debounce(this._boundHandleResize, 250);
            window.addEventListener('resize', debouncedResize);
        }
        
        /**
         * Handle resize
         */
        _handleResize() {
            if (CONFIG.autoHeight) {
                this._updateHeight();
            }
        }
        
        /**
         * Navigate to specific slide
         * @param {number} index - Target slide index
         */
        goTo(index) {
            // Validation
            if (this.isTransitioning) return;
            if (index === this.currentIndex) return;
            if (index < 0 || index >= this.totalSlides) return;
            
            const currentSlide = this.slides[this.currentIndex];
            const nextSlide = this.slides[index];
            
            if (!currentSlide || !nextSlide) return;
            
            // Reset autoplay
            this._resetAutoplay();
            
            // Start transition
            this.isTransitioning = true;
            this.slider.classList.add(CONFIG.transitioningClass);
            
            // Update ARIA
            currentSlide.setAttribute('aria-hidden', 'true');
            
            // Fade out current
            currentSlide.style.opacity = '0';
            currentSlide.style.pointerEvents = 'none';
            currentSlide.classList.remove(CONFIG.activeClass);
            
            // Fade in next
            nextSlide.style.opacity = '1';
            nextSlide.style.pointerEvents = 'auto';
            nextSlide.classList.add(CONFIG.activeClass);
            nextSlide.setAttribute('aria-hidden', 'false');
            
            // Update state
            const previousIndex = this.currentIndex;
            this.currentIndex = index;
            
            // Update UI
            this._updateDots(index);
            this._updateIndicator(index);
            
            // Update height if needed
            if (CONFIG.autoHeight) {
                this._updateHeight();
            }
            
            // Cleanup after transition
            clearTimeout(this.transitionTimer);
            this.transitionTimer = setTimeout(() => {
                this.isTransitioning = false;
                this.slider.classList.remove(CONFIG.transitioningClass);
                
                // Dispatch event
                Utils.dispatchEvent('changed', {
                    from: previousIndex,
                    to: this.currentIndex,
                    total: this.totalSlides
                });
                
                Utils.log('Slide changed', {
                    from: previousIndex,
                    to: this.currentIndex
                });
            }, this.transitionDuration + 50);
        }
        
        /**
         * Go to next slide
         */
        next() {
            if (this.isDestroyed) return;
            const nextIndex = (this.currentIndex + 1) % this.totalSlides;
            this.goTo(nextIndex);
        }
        
        /**
         * Go to previous slide
         */
        prev() {
            if (this.isDestroyed) return;
            const prevIndex = (this.currentIndex - 1 + this.totalSlides) % this.totalSlides;
            this.goTo(prevIndex);
        }
        
        /**
         * Pause autoplay - defensive
         */
        pause() {
            if (this.isPaused || this.isDestroyed) return;
            
            this.isPaused = true;
            this._clearAutoplay();
            this.slider.classList.add(CONFIG.pausedClass);
            
            Utils.dispatchEvent('paused');
            Utils.log('Autoplay paused');
        }
        
        /**
         * Resume autoplay - defensive
         */
        resume() {
            if (!this.isPaused || this.isDestroyed) return;
            
            this.isPaused = false;
            this.slider.classList.remove(CONFIG.pausedClass);
            this._startAutoplay(this.autoplayInterval);
            
            Utils.dispatchEvent('resumed');
            Utils.log('Autoplay resumed');
        }
        
        /**
         * Toggle autoplay pause state
         */
        togglePause() {
            if (this.isPaused) {
                this.resume();
            } else {
                this.pause();
            }
        }
        
        /**
         * Start autoplay after delay
         * @param {number} delay - Delay in milliseconds
         */
        _startAutoplay(delay) {
            this._clearAutoplay();
            
            // Don't autoplay if destroyed or paused
            if (this.isDestroyed || this.isPaused) return;
            
            this.autoplayTimer = setTimeout(() => {
                if (!this.isPaused && !this.isDestroyed) {
                    this.next();
                    this._startAutoplay(this.autoplayInterval);
                }
            }, delay);
        }
        
        /**
         * Clear autoplay timer
         */
        _clearAutoplay() {
            if (this.autoplayTimer) {
                clearTimeout(this.autoplayTimer);
                this.autoplayTimer = null;
            }
        }
        
        /**
         * Reset autoplay timer
         */
        _resetAutoplay() {
            if (!this.isPaused && !this.isDestroyed) {
                this._clearAutoplay();
                this._startAutoplay(this.autoplayInterval);
            }
        }
        
        /**
         * Update dot indicators
         * @param {number} index - Active slide index
         */
        _updateDots(index) {
            if (!this.dots || this.dots.length === 0) return;
            
            this.dots.forEach((dot, i) => {
                const isActive = i === index;
                dot.classList.toggle(CONFIG.activeClass, isActive);
                dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
                
                if (isActive) {
                    dot.setAttribute('aria-current', 'true');
                } else {
                    dot.removeAttribute('aria-current');
                }
            });
        }
        
        /**
         * Update slide counter indicator
         * @param {number} index - Active slide index
         */
        _updateIndicator(index) {
            if (!this.indicator) return;
            
            const text = `${index + 1} / ${this.totalSlides}`;
            this.indicator.textContent = text;
            this.indicator.setAttribute('aria-label', `Slide ${index + 1} of ${this.totalSlides}`);
        }
        
        /**
         * Update slider height based on active slide content
         */
        _updateHeight() {
            if (!CONFIG.autoHeight) return;
            
            const activeSlide = this.slides[this.currentIndex];
            if (!activeSlide) return;
            
            const height = activeSlide.scrollHeight;
            this.slider.style.height = `${height}px`;
        }
        
        /**
         * Check if slider is visible in viewport
         * @returns {boolean}
         */
        _isSliderVisible() {
            if (!this.slider) return false;
            
            const rect = this.slider.getBoundingClientRect();
            const windowHeight = window.innerHeight || document.documentElement.clientHeight;
            
            return rect.top < windowHeight && rect.bottom > 0;
        }
        
        /**
         * Get current state
         * @returns {Object} Current slider state
         */
        getState() {
            return {
                currentIndex: this.currentIndex,
                totalSlides: this.totalSlides,
                isTransitioning: this.isTransitioning,
                isPaused: this.isPaused,
                isDestroyed: this.isDestroyed,
                isTouching: this.isTouching,
                reducedMotion: this.reducedMotion,
                transitionDuration: this.transitionDuration,
                autoplayInterval: this.autoplayInterval,
                windowFocused: Utils.isWindowFocused(),
                documentVisible: Utils.isDocumentVisible()
            };
        }
        
        /**
         * Destroy the slider and cleanup
         */
        destroy() {
            if (this.isDestroyed) return;
            
            Utils.log('Destroying hero slider');
            
            this.isDestroyed = true;
            this._clearAutoplay();
            clearTimeout(this.touchResumeTimer);
            
            // Remove event listeners
            document.removeEventListener('keydown', this._boundHandleKeydown);
            document.removeEventListener('visibilitychange', this._boundHandleVisibility);
            window.removeEventListener('blur', this._boundHandleWindowBlur);
            window.removeEventListener('focus', this._boundHandleWindowFocus);
            
            // Remove touch listeners
            if (this.slider) {
                this.slider.removeEventListener('touchstart', this._boundHandleTouchStart);
                this.slider.removeEventListener('touchmove', this._boundHandleTouchMove);
                this.slider.removeEventListener('touchend', this._boundHandleTouchEnd);
                this.slider.removeEventListener('touchcancel', this._boundHandleTouchEnd);
            }
            
            // Reset slides
            this.slides.forEach((slide) => {
                slide.style.opacity = '';
                slide.style.zIndex = '';
                slide.style.pointerEvents = '';
                slide.style.transition = '';
                slide.classList.remove(CONFIG.activeClass, CONFIG.transitioningClass);
            });
            
            // Reset slider
            this.slider.classList.remove(
                CONFIG.pausedClass,
                CONFIG.transitioningClass,
                CONFIG.reducedMotionClass
            );
            
            // Reset dots
            if (this.dots) {
                this.dots.forEach((dot) => {
                    dot.classList.remove(CONFIG.activeClass);
                    dot.removeAttribute('aria-selected');
                    dot.removeAttribute('aria-current');
                });
            }
            
            // Remove reference from element
            if (this.slider) {
                delete this.slider._heroSlider;
            }
            
            Utils.dispatchEvent('destroyed');
            Utils.log('Hero slider destroyed');
        }
    }

    // ============================================================
    // 5. ENGINE ORCHESTRATOR
    // ============================================================
    const HeroSliderEngine = {
        _initialized: false,
        _slider: null,
        _instances: [],
        
        /**
         * Initialize hero slider
         * @param {string|Element} selector - Custom selector or element
         * @returns {HeroSlider|null} Slider instance
         */
        init: function(selector = null) {
            // Guard against duplicate initialization
            if (this._initialized && !selector) {
                Utils.warn('Hero slider engine already initialized');
                return this._slider;
            }
            
            const targetSelector = selector || CONFIG.sliderSelector;
            let sliderElement = typeof targetSelector === 'string' 
                ? document.querySelector(targetSelector)
                : targetSelector;
            
            if (!sliderElement) {
                Utils.warn('Hero slider: No slider element found', { selector: targetSelector });
                return null;
            }
            
            // Check if this specific element already has a slider instance
            if (sliderElement._heroSlider) {
                Utils.log('Slider already initialized on this element');
                return sliderElement._heroSlider;
            }
            
            try {
                const slider = new HeroSlider(sliderElement);
                
                // Only store if valid instance was created
                if (slider && slider.slider) {
                    this._slider = slider;
                    this._instances.push(slider);
                    this._initialized = true;
                    
                    Utils.log('Hero slider engine initialized');
                    return slider;
                } else {
                    Utils.warn('Hero slider initialization failed - invalid instance');
                    return null;
                }
                
            } catch (e) {
                Utils.warn('Hero slider initialization failed', e);
                return null;
            }
        },
        
        /**
         * Get current slider instance
         * @returns {HeroSlider|null}
         */
        getSlider: function() {
            return this._slider;
        },
        
        /**
         * Get all slider instances
         * @returns {Array}
         */
        getInstances: function() {
            return this._instances;
        },
        
        /**
         * Check if engine is initialized
         * @returns {boolean}
         */
        isInitialized: function() {
            return this._initialized;
        },
        
        /**
         * Destroy all sliders
         */
        destroyAll: function() {
            this._instances.forEach(slider => slider.destroy());
            this._instances = [];
            this._slider = null;
            this._initialized = false;
            Utils.log('All hero sliders destroyed');
        }
    };

    // ============================================================
    // 6. INTEGRATION WITH ZT KERNEL
    // ============================================================
    if (window.ZT) {
        if (!ZT.Components) {
            ZT.Components = {};
        }
        ZT.Components.HeroSlider = HeroSliderEngine;
        Utils.log('Hero slider registered with ZT kernel');
    } else {
        // Fallback: expose globally
        window.ZTHeroSlider = HeroSliderEngine;
    }

    // ============================================================
    // 7. AUTO-BOOTSTRAP
    // ============================================================
    const bootstrap = function() {
        // Check if ZT kernel should handle initialization
        if (window.ZT && ZT.Kernel && ZT.Kernel.isReady && ZT.Kernel.isReady()) {
            HeroSliderEngine.init();
            return;
        }
        
        // Wait for ZT kernel if available
        if (window.ZT && ZT.Events) {
            ZT.Events.on('zt-ready', function() {
                HeroSliderEngine.init();
            });
            return;
        }
        
        // Standalone initialization
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                HeroSliderEngine.init();
            });
        } else {
            // DOM already loaded
            HeroSliderEngine.init();
        }
    };
    
    // Execute bootstrap
    bootstrap();

})();