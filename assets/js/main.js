/**
 * ============================================================
 * ZT Lounge Meru - Enterprise Application Kernel
 * Version: 2.0.0
 * Architecture: ZT Operating System
 * 
 * ZT OS - Zero-Touch Operating System for Enterprise Applications
 * ============================================================
 * 
 * Architecture Overview:
 * â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
 * â”‚                    ZT Namespace                       â”‚
 * â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
 * â”‚  â”‚              Application Kernel                â”‚  â”‚
 * â”‚  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚  â”‚
 * â”‚  â”‚  â”‚  Boot    â”‚ â”‚  Core    â”‚ â”‚  Services    â”‚  â”‚  â”‚
 * â”‚  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚  â”‚
 * â”‚  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚  â”‚
 * â”‚  â”‚  â”‚Component â”‚ â”‚  Pages   â”‚ â”‚  Shared      â”‚  â”‚  â”‚
 * â”‚  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚  â”‚
 * â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
 * â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
 * 
 * Lifecycle: Boot â†’ Core â†’ Services â†’ Components â†’ Pages â†’ Ready
 * ============================================================
 */

(function() {
    'use strict';

    // ============================================================
    // ZT NAMESPACE - Root namespace for entire application
    // ============================================================
    window.ZT = window.ZT || {};

    // ============================================================
    // ZT.VERSION - Semantic versioning
    // ============================================================
    ZT.version = '2.0.0';

    // ============================================================
    // ZT.Config - Application configuration
    // ============================================================
    ZT.Config = Object.freeze({
        // Application
        app: {
            name: 'ZT Lounge Meru',
            version: '2.0.0',
            environment: 'production', // 'development' | 'production'
            debug: false
        },

        // Header
        header: {
            scrollThreshold: 50
        },

        // Hero Slider
        hero: {
            interval: 6000,
            swipeThreshold: 50
        },

        // Navigation
        navigation: {
            mobileBreakpoint: 768
        },

        // Animation
        animation: {
            revealThreshold: 0.1,
            revealRootMargin: '0px 0px -50px 0px',
            revealDuration: 600
        },

        // Breakpoints
        breakpoints: {
            mobile: 768,
            tablet: 1024,
            desktop: 1200
        },

        // Selectors - Single source of truth
        selectors: {
            header: '#header',
            hamburger: '#hamburger',
            navMenu: '#navMenu',
            heroSlider: '.hero-slider',
            hero: '#hero',
            heroSlide: '.hero-slide',
            dot: '.dot',
            prevSlide: '#prevSlide',
            nextSlide: '#nextSlide',
            navList: '.nav-list',
            navLink: '.nav-list a',
            dropdownParent: '.nav-list > li > a.dropdown-parent',
            dropdownMenu: '.dropdown-menu',
            themeToggle: '#themeToggle',
            copyrightYear: '#copyrightYear',
            revealElements: '.service-card, .experience-card, .event-card, .testimonial-card, .gallery-preview-item',
            anchorLink: 'a[href^="#"]'
        },

        // Storage Keys
        storage: {
            theme: 'zt-theme',
            user: 'zt-user',
            preferences: 'zt-preferences'
        },

        // Accessibility
        accessibility: {
            reducedMotionQuery: '(prefers-reduced-motion: reduce)',
            focusVisibleClass: 'focus-visible'
        },

        // Timing
        timing: {
            resizeDebounce: 250,
            scrollThrottle: 100,
            hashScrollDelay: 500
        },

        // Feature Flags
        features: {
            heroSlider: true,
            scrollReveal: true,
            animations: true
        }
    });

    // ============================================================
    // ZT.State - Centralized application state
    // ============================================================
    ZT.State = {
        _data: {
            currentPage: null,
            theme: 'dark',
            screenSize: 'desktop',
            navigation: {
                isOpen: false,
                activeDropdown: null
            },
            hero: {
                currentSlide: 0,
                isPlaying: true
            },
            loading: {
                isReady: false,
                bootTime: 0
            },
            accessibility: {
                reducedMotion: false
            }
        },

        _listeners: [],

        /**
         * Get state value
         * @param {string} path - Dot notation path (e.g., 'hero.currentSlide')
         * @returns {*} State value
         */
        get: function(path) {
            return path.split('.').reduce((obj, key) => obj && obj[key], this._data);
        },

        /**
         * Set state value
         * @param {string} path - Dot notation path
         * @param {*} value - Value to set
         * @param {boolean} silent - If true, skip event emission
         */
        set: function(path, value, silent) {
            const keys = path.split('.');
            const lastKey = keys.pop();
            const target = keys.reduce((obj, key) => {
                if (!obj[key]) obj[key] = {};
                return obj[key];
            }, this._data);
            
            const oldValue = target[lastKey];
            target[lastKey] = value;
            
            if (!silent && oldValue !== value) {
                this._emitChange(path, value, oldValue);
            }
        },

        /**
         * Subscribe to state changes
         * @param {string} path - Path to watch
         * @param {Function} callback - Callback function
         * @returns {Function} Unsubscribe function
         */
        subscribe: function(path, callback) {
            const listener = { path, callback };
            this._listeners.push(listener);
            return () => {
                const index = this._listeners.indexOf(listener);
                if (index > -1) this._listeners.splice(index, 1);
            };
        },

        /**
         * Emit state change event
         */
        _emitChange: function(path, value, oldValue) {
            this._listeners.forEach(function(listener) {
                if (listener.path === path) {
                    listener.callback(value, oldValue);
                }
            });
        }
    };

    // ============================================================
    // ZT.Events - Centralized Event Bus
    // ============================================================
    ZT.Events = {
        _events: {},

        /**
         * Subscribe to an event
         * @param {string} event - Event name
         * @param {Function} callback - Event handler
         * @returns {Function} Unsubscribe function
         */
        on: function(event, callback) {
            if (!this._events[event]) {
                this._events[event] = [];
            }
            this._events[event].push(callback);
            return () => this.off(event, callback);
        },

        /**
         * Unsubscribe from an event
         * @param {string} event - Event name
         * @param {Function} callback - Event handler
         */
        off: function(event, callback) {
            if (!this._events[event]) return;
            const index = this._events[event].indexOf(callback);
            if (index > -1) {
                this._events[event].splice(index, 1);
            }
        },

        /**
         * Emit an event
         * @param {string} event - Event name
         * @param {*} data - Event data
         */
        emit: function(event, data) {
            if (!this._events[event]) return;
            this._events[event].forEach(function(callback) {
                try {
                    callback(data);
                } catch (e) {
                    ZT.Logger.error('Event handler error', { event, error: e });
                }
            });
        },

        /**
         * Emit event once
         * @param {string} event - Event name
         * @param {*} data - Event data
         */
        emitOnce: function(event, data) {
            const handlers = this._events[event] || [];
            this._events[event] = [];
            handlers.forEach(function(callback) {
                try {
                    callback(data);
                } catch (e) {
                    ZT.Logger.error('Event handler error', { event, error: e });
                }
            });
        }
    };

    // ============================================================
    // ZT.Logger - Enterprise logging system
    // ============================================================
    ZT.Logger = {
        _enabled: true,

        /**
         * Enable/disable logging
         * @param {boolean} enabled - Whether logging is enabled
         */
        setEnabled: function(enabled) {
            this._enabled = enabled;
        },

        /**
         * Log info message
         * @param {string} message - Log message
         * @param {*} data - Additional data
         */
        info: function(message, data) {
            if (!this._enabled) return;
            console.log(`[ZT] â„¹ï¸ ${message}`, data || '');
        },

        /**
         * Log warning message
         * @param {string} message - Log message
         * @param {*} data - Additional data
         */
        warn: function(message, data) {
            if (!this._enabled) return;
            console.warn(`[ZT] âš ï¸ ${message}`, data || '');
        },

        /**
         * Log error message
         * @param {string} message - Log message
         * @param {*} data - Additional data
         */
        error: function(message, data) {
            if (!this._enabled) return;
            console.error(`[ZT] âŒ ${message}`, data || '');
        },

        /**
         * Log debug message (only in development)
         * @param {string} message - Log message
         * @param {*} data - Additional data
         */
        debug: function(message, data) {
            if (!this._enabled) return;
            if (ZT.Config.app.environment === 'development') {
                console.debug(`[ZT] ðŸž ${message}`, data || '');
            }
        }
    };

    // ============================================================
    // ZT.Storage - Centralized storage service
    // ============================================================
    ZT.Storage = {
        _prefix: 'zt_',

        /**
         * Get item from localStorage
         * @param {string} key - Storage key
         * @param {*} defaultValue - Default value if key not found
         * @returns {*} Stored value or default
         */
        get: function(key, defaultValue) {
            try {
                const prefixedKey = this._prefix + key;
                const value = localStorage.getItem(prefixedKey);
                if (value === null) return defaultValue;
                try {
                    return JSON.parse(value);
                } catch (e) {
                    return value;
                }
            } catch (e) {
                ZT.Logger.warn('Storage get failed', { key, error: e });
                return defaultValue;
            }
        },

        /**
         * Set item in localStorage
         * @param {string} key - Storage key
         * @param {*} value - Value to store
         */
        set: function(key, value) {
            try {
                const prefixedKey = this._prefix + key;
                const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
                localStorage.setItem(prefixedKey, stringValue);
            } catch (e) {
                ZT.Logger.warn('Storage set failed', { key, value, error: e });
            }
        },

        /**
         * Remove item from localStorage
         * @param {string} key - Storage key
         */
        remove: function(key) {
            try {
                const prefixedKey = this._prefix + key;
                localStorage.removeItem(prefixedKey);
            } catch (e) {
                ZT.Logger.warn('Storage remove failed', { key, error: e });
            }
        },

        /**
         * Clear all items with prefix
         */
        clear: function() {
            try {
                const keys = Object.keys(localStorage);
                keys.forEach(function(key) {
                    if (key.startsWith(this._prefix)) {
                        localStorage.removeItem(key);
                    }
                }.bind(this));
            } catch (e) {
                ZT.Logger.warn('Storage clear failed', { error: e });
            }
        }
    };

    // ============================================================
    // ZT.DOM - DOM Cache with memoization
    // ============================================================
    ZT.DOM = {
        _cache: {},
        _initialized: false,

        /**
         * Initialize DOM cache
         */
        init: function() {
            if (this._initialized) return;
            this._cacheSelectors();
            this._initialized = true;
        },

        /**
         * Cache all selectors from config
         */
        _cacheSelectors: function() {
            const selectors = ZT.Config.selectors;
            Object.keys(selectors).forEach(function(key) {
                const selector = selectors[key];
                if (selector) {
                    try {
                        const elements = document.querySelectorAll(selector);
                        this._cache[key] = elements.length === 1 ? elements[0] : elements;
                    } catch (e) {
                        ZT.Logger.warn('DOM cache failed', { key, selector, error: e });
                    }
                }
            }.bind(this));
        },

        /**
         * Get cached element(s) by selector key
         * @param {string} key - Selector key from config
         * @returns {Element|NodeList} Cached element(s)
         */
        get: function(key) {
            if (!this._cache[key]) {
                const selector = ZT.Config.selectors[key];
                if (selector) {
                    try {
                        const elements = document.querySelectorAll(selector);
                        this._cache[key] = elements.length === 1 ? elements[0] : elements;
                    } catch (e) {
                        ZT.Logger.warn('DOM get failed', { key, selector, error: e });
                        return null;
                    }
                }
            }
            return this._cache[key] || null;
        },

        /**
         * Clear cache for specific key or all
         * @param {string} key - Optional key to clear
         */
        clear: function(key) {
            if (key) {
                delete this._cache[key];
            } else {
                this._cache = {};
                this._cacheSelectors();
            }
        }
    };

    // ============================================================
    // ZT.Utils - Pure utility functions
    // ============================================================
    ZT.Utils = {
        /**
         * Debounce - Limits function execution rate
         * @param {Function} func - Function to debounce
         * @param {number} wait - Milliseconds to wait
         * @returns {Function} Debounced function
         */
        debounce: function(func, wait) {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        },

        /**
         * Throttle - Limits function execution rate
         * @param {Function} func - Function to throttle
         * @param {number} limit - Milliseconds between executions
         * @returns {Function} Throttled function
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
         * Get header height with fallback
         * @returns {number} Header height in pixels
         */
        getHeaderOffset: function() {
            const header = ZT.DOM.get('header');
            return header ? header.offsetHeight : 80;
        },

        /**
         * Get navigation height from CSS variable or computed
         * @returns {number} Navigation height in pixels
         */
        getNavHeight: function() {
            const navHeight = getComputedStyle(document.documentElement)
                .getPropertyValue('--nav-height');
            const parsed = parseInt(navHeight);
            return !isNaN(parsed) ? parsed : this.getHeaderOffset();
        },

        /**
         * Check if user prefers reduced motion
         * @returns {boolean} True if reduced motion is preferred
         */
        prefersReducedMotion: function() {
            return window.matchMedia(ZT.Config.accessibility.reducedMotionQuery).matches;
        },

        /**
         * Get filename from a path
         * @param {string} path - File path
         * @returns {string} Filename
         */
        getFilenameFromPath: function(path) {
            if (!path) return 'index.html';
            const filename = path.split('/').pop();
            return filename || 'index.html';
        },

        /**
         * Get all focusable elements within a container
         * @param {HTMLElement} container - Container element
         * @returns {NodeList} Focusable elements
         */
        getFocusableElements: function(container) {
            return container.querySelectorAll(
                'a[href], button:not([disabled]), input:not([disabled]), ' +
                'select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'
            );
        },

        /**
         * Check if element is in viewport
         * @param {HTMLElement} el - Element to check
         * @returns {boolean} True if in viewport
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
         * Safe scroll to element with offset
         * @param {HTMLElement} target - Target element
         * @param {number} offset - Offset from top
         */
        scrollToElement: function(target, offset) {
            if (!target) return;
            const top = target.getBoundingClientRect().top + window.pageYOffset - (offset || 0);
            window.scrollTo({ top, behavior: 'smooth' });
        },

        /**
         * Get theme colors from CSS variables
         * @returns {Object} Theme color values
         */
        getThemeColors: function() {
            const root = document.documentElement;
            const styles = getComputedStyle(root);
            return {
                gold: styles.getPropertyValue('--color-gold').trim() || '#c9a84c',
                text: styles.getPropertyValue('--color-text').trim() || '#ffffff',
                textSecondary: styles.getPropertyValue('--color-text-secondary').trim() || '#aaaaaa',
                bg: styles.getPropertyValue('--color-bg').trim() || '#0a0a0a',
                cardBg: styles.getPropertyValue('--color-card-bg').trim() || '#141414',
                border: styles.getPropertyValue('--color-border').trim() || '#2a2a2a'
            };
        },

        /**
         * Check if element is interactive
         * @param {HTMLElement} el - Element to check
         * @returns {boolean} True if element is interactive
         */
        isInteractive: function(el) {
            const interactiveTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
            if (interactiveTags.includes(el.tagName)) return true;
            if (el.hasAttribute('onclick')) return true;
            if (el.getAttribute('role') === 'button') return true;
            return false;
        }
    };

    // ============================================================
    // ZT.Services - Business logic services
    // ============================================================
    ZT.Services = {
        // Theme Service
        Theme: {
            _initialized: false,

            init: function() {
                if (this._initialized) return;
                
                const toggle = ZT.DOM.get('themeToggle');
                if (toggle) {
                    toggle.addEventListener('click', this._handleToggle.bind(this));
                    this._updateToggleIcon();
                }
                
                ZT.Events.on('zt-theme-changed', this._onThemeChanged.bind(this));
                this._initialized = true;
                ZT.Logger.info('Theme service initialized');
            },

            _handleToggle: function() {
                const html = document.documentElement;
                const isLight = html.classList.toggle('light-mode');
                
                ZT.Storage.set('theme', isLight ? 'light' : 'dark');
                html.style.colorScheme = isLight ? 'light' : 'dark';
                ZT.State.set('theme', isLight ? 'light' : 'dark');
                this._updateToggleIcon();
                ZT.Events.emit('zt-theme-changed', { theme: isLight ? 'light' : 'dark' });
            },

            _updateToggleIcon: function() {
                const toggle = ZT.DOM.get('themeToggle');
                if (!toggle) return;
                
                const isLight = document.documentElement.classList.contains('light-mode');
                const icons = toggle.querySelectorAll('i');
                
                icons.forEach(function(icon) {
                    const isMoon = icon.classList.contains('fa-moon');
                    const isSun = icon.classList.contains('fa-sun');
                    
                    if (isLight && isMoon) {
                        icon.style.display = 'none';
                    } else if (isLight && isSun) {
                        icon.style.display = 'inline-block';
                    } else if (!isLight && isSun) {
                        icon.style.display = 'none';
                    } else if (!isLight && isMoon) {
                        icon.style.display = 'inline-block';
                    }
                });
            },

            _onThemeChanged: function() {
                this._updateToggleIcon();
            },

            getCurrent: function() {
                return document.documentElement.classList.contains('light-mode') ? 'light' : 'dark';
            },

            isLight: function() {
                return this.getCurrent() === 'light';
            }
        },

        // Scroll Service
        Scroll: {
            _initialized: false,
            _scrollY: 0,

            init: function() {
                if (this._initialized) return;
                
                this._scrollY = window.scrollY;
                const handler = ZT.Utils.throttle(this._handleScroll.bind(this), 100);
                window.addEventListener('scroll', handler, { passive: true });
                
                this._initialized = true;
                ZT.Logger.info('Scroll service initialized');
            },

            _handleScroll: function() {
                this._scrollY = window.scrollY;
                ZT.Events.emit('zt-scroll', { scrollY: this._scrollY });
            },

            getScrollY: function() {
                return this._scrollY;
            }
        },

        // Resize Service
        Resize: {
            _initialized: false,
            _width: 0,
            _height: 0,
            _breakpoint: 'desktop',

            init: function() {
                if (this._initialized) return;
                
                this._updateDimensions();
                const handler = ZT.Utils.debounce(this._handleResize.bind(this), 250);
                window.addEventListener('resize', handler);
                
                this._initialized = true;
                ZT.Logger.info('Resize service initialized');
            },

            _handleResize: function() {
                this._updateDimensions();
                ZT.Events.emit('zt-resize', {
                    width: this._width,
                    height: this._height,
                    breakpoint: this._breakpoint
                });
            },

            _updateDimensions: function() {
                this._width = window.innerWidth;
                this._height = window.innerHeight;
                this._breakpoint = this._getBreakpoint(this._width);
                ZT.State.set('screenSize', this._breakpoint);
            },

            _getBreakpoint: function(width) {
                if (width <= 768) return 'mobile';
                if (width <= 1024) return 'tablet';
                return 'desktop';
            },

            getWidth: function() {
                return this._width;
            },

            getHeight: function() {
                return this._height;
            },

            getBreakpoint: function() {
                return this._breakpoint;
            },

            isMobile: function() {
                return this._breakpoint === 'mobile';
            },

            isTablet: function() {
                return this._breakpoint === 'tablet';
            },

            isDesktop: function() {
                return this._breakpoint === 'desktop';
            }
        },

        // Navigation Service
        Navigation: {
            _initialized: false,

            init: function() {
                if (this._initialized) return;
                
                this._setActiveLink();
                this._scrollToHash();
                this._initCloseOnNavigate();
                
                this._initialized = true;
                ZT.Logger.info('Navigation service initialized');
            },

            _setActiveLink: function() {
                const currentPath = window.location.pathname;
                const currentFile = ZT.Utils.getFilenameFromPath(currentPath);
                const links = ZT.DOM.get('navLink');
                
                if (!links) return;
                
                links.forEach(function(link) {
                    link.classList.remove('active');
                    link.removeAttribute('aria-current');

                    const href = link.getAttribute('href');
                    if (!href || href.startsWith('#') || href.startsWith('http')) return;

                    const linkFile = ZT.Utils.getFilenameFromPath(href);
                    const isIndex = linkFile === 'index.html' && 
                                   (currentPath === '/' || currentPath === '' || currentPath === '/index.html');
                    const isActive = linkFile === currentFile || isIndex;

                    if (isActive) {
                        link.classList.add('active');
                        link.setAttribute('aria-current', 'page');
                    }
                });
            },

            _scrollToHash: function() {
                if (!window.location.hash) return;

                setTimeout(function() {
                    const target = document.querySelector(window.location.hash);
                    if (!target) return;
                    const offset = ZT.Utils.getNavHeight();
                    ZT.Utils.scrollToElement(target, offset);
                }, 500);
            },

            _initCloseOnNavigate: function() {
                const links = ZT.DOM.get('navLink');
                if (!links) return;
                
                links.forEach(function(link) {
                    link.addEventListener('click', function() {
                        const navMenu = ZT.DOM.get('navMenu');
                        const hamburger = ZT.DOM.get('hamburger');
                        if (navMenu && navMenu.classList.contains('active')) {
                            navMenu.classList.remove('active');
                            if (hamburger) {
                                hamburger.classList.remove('active');
                                hamburger.setAttribute('aria-expanded', 'false');
                            }
                            document.body.style.overflow = '';
                        }
                    });
                });
            }
        }
    };

    // ============================================================
    // ZT.Components - UI Components
    // ============================================================
    ZT.Components = {
        // Header Component
        Header: {
            _initialized: false,

            init: function() {
                if (this._initialized) return;
                
                this._initScrollEffect();
                this._initMobileMenu();
                this._initAnchorScroll();
                this._initDropdownKeyboard();
                
                this._initialized = true;
                ZT.Logger.info('Header component initialized');
            },

            _initScrollEffect: function() {
                const header = ZT.DOM.get('header');
                if (!header) return;

                ZT.Events.on('zt-scroll', function(data) {
                    const isScrolled = data.scrollY > ZT.Config.header.scrollThreshold;
                    header.classList.toggle('scrolled', isScrolled);
                });
            },

            _initMobileMenu: function() {
                const hamburger = ZT.DOM.get('hamburger');
                const navMenu = ZT.DOM.get('navMenu');
                
                if (!hamburger || !navMenu) return;

                const toggleMenu = function() {
                    const isActive = navMenu.classList.toggle('active');
                    hamburger.classList.toggle('active');
                    hamburger.setAttribute('aria-expanded', String(isActive));
                    document.body.style.overflow = isActive ? 'hidden' : '';
                    ZT.State.set('navigation.isOpen', isActive);
                    
                    if (isActive) {
                        this._trapFocus(navMenu);
                    } else {
                        this._releaseFocus();
                    }
                }.bind(this);

                const closeMenu = function() {
                    navMenu.classList.remove('active');
                    hamburger.classList.remove('active');
                    hamburger.setAttribute('aria-expanded', 'false');
                    document.body.style.overflow = '';
                    ZT.State.set('navigation.isOpen', false);
                    this._releaseFocus();
                }.bind(this);

                hamburger.addEventListener('click', toggleMenu);

                navMenu.querySelectorAll('a').forEach(function(link) {
                    link.addEventListener('click', function() {
                        if (ZT.Services.Resize.isMobile()) {
                            closeMenu();
                        }
                    });
                });

                document.addEventListener('click', function(e) {
                    const header = ZT.DOM.get('header');
                    if (header && !header.contains(e.target) && navMenu.classList.contains('active')) {
                        closeMenu();
                    }
                });

                document.addEventListener('keydown', function(e) {
                    if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                        closeMenu();
                        hamburger.focus();
                    }
                });

                ZT.Events.on('zt-resize', function() {
                    if (ZT.Services.Resize.isDesktop() && navMenu.classList.contains('active')) {
                        closeMenu();
                    }
                });
            },

            _trapFocus: function(container) {
                const focusableElements = ZT.Utils.getFocusableElements(container);
                if (focusableElements.length === 0) return;
                
                const firstFocusable = focusableElements[0];
                const lastFocusable = focusableElements[focusableElements.length - 1];
                
                firstFocusable.focus();
                
                const handler = function(e) {
                    if (e.key !== 'Tab') return;
                    if (e.shiftKey) {
                        if (document.activeElement === firstFocusable) {
                            e.preventDefault();
                            lastFocusable.focus();
                        }
                    } else {
                        if (document.activeElement === lastFocusable) {
                            e.preventDefault();
                            firstFocusable.focus();
                        }
                    }
                };
                
                document.addEventListener('keydown', handler);
                this._focusTrapHandler = handler;
            },

            _releaseFocus: function() {
                if (this._focusTrapHandler) {
                    document.removeEventListener('keydown', this._focusTrapHandler);
                    this._focusTrapHandler = null;
                }
            },

            _initDropdownKeyboard: function() {
                const dropdownParents = ZT.DOM.get('dropdownParent');
                if (!dropdownParents) return;

                dropdownParents.forEach(function(link) {
                    link.addEventListener('keydown', function(e) {
                        if (ZT.Services.Resize.isMobile()) return;
                        
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            const parentLi = this.parentElement;
                            const isExpanded = parentLi.getAttribute('aria-expanded') === 'true';
                            parentLi.setAttribute('aria-expanded', String(!isExpanded));
                        }
                        
                        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                            e.preventDefault();
                            const parentLi = this.parentElement;
                            const menu = parentLi.querySelector('.dropdown-menu');
                            if (menu) {
                                parentLi.setAttribute('aria-expanded', 'true');
                                const firstItem = menu.querySelector('a');
                                if (firstItem) firstItem.focus();
                            }
                        }
                    });

                    link.addEventListener('click', function(e) {
                        if (ZT.Services.Resize.isMobile()) {
                            e.preventDefault();
                            const parentLi = this.parentElement;
                            const isExpanded = parentLi.getAttribute('aria-expanded') === 'true';
                            
                            document.querySelectorAll('.nav-list > li.active-dropdown').forEach(function(el) {
                                if (el !== parentLi) {
                                    el.classList.remove('active-dropdown');
                                    el.setAttribute('aria-expanded', 'false');
                                }
                            });
                            
                            const newExpanded = !isExpanded;
                            parentLi.classList.toggle('active-dropdown', newExpanded);
                            parentLi.setAttribute('aria-expanded', String(newExpanded));
                        }
                    });
                });

                const dropdownMenus = ZT.DOM.get('dropdownMenu');
                if (!dropdownMenus) return;

                dropdownMenus.forEach(function(menu) {
                    const items = menu.querySelectorAll('a');
                    items.forEach(function(item, index) {
                        item.addEventListener('keydown', function(e) {
                            if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                const next = items[index + 1] || items[0];
                                next.focus();
                            } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                const prev = items[index - 1] || items[items.length - 1];
                                prev.focus();
                            } else if (e.key === 'Escape') {
                                e.preventDefault();
                                const parentLink = this.closest('li')?.parentElement?.previousElementSibling;
                                if (parentLink && parentLink.classList.contains('dropdown-parent')) {
                                    parentLink.focus();
                                    const parentLi = parentLink.parentElement;
                                    if (ZT.Services.Resize.isMobile()) {
                                        parentLi.classList.remove('active-dropdown');
                                        parentLi.setAttribute('aria-expanded', 'false');
                                    } else {
                                        parentLi.setAttribute('aria-expanded', 'false');
                                    }
                                }
                            }
                        });
                    });
                });

                document.addEventListener('click', function(e) {
                    if (ZT.Services.Resize.isMobile()) return;
                    
                    document.querySelectorAll('.nav-list > li[aria-expanded="true"]').forEach(function(parent) {
                        if (!parent.contains(e.target)) {
                            parent.setAttribute('aria-expanded', 'false');
                        }
                    });
                });
            },

            _initAnchorScroll: function() {
                const anchorLinks = ZT.DOM.get('anchorLink');
                if (!anchorLinks) return;

                anchorLinks.forEach(function(anchor) {
                    anchor.addEventListener('click', function(e) {
                        const href = this.getAttribute('href');
                        if (!href || href === '#') return;

                        const target = document.querySelector(href);
                        if (!target) return;

                        e.preventDefault();
                        const offset = ZT.Utils.getHeaderOffset();
                        ZT.Utils.scrollToElement(target, offset);
                    });
                });
            }
        },

        // Hero Slider Component
        HeroSlider: {
            _initialized: false,
            _currentSlide: 0,
            _slideInterval: null,

            init: function() {
                if (this._initialized) return;
                if (!ZT.Config.features.heroSlider) return;
                
                const slides = ZT.DOM.get('heroSlide');
                const dots = ZT.DOM.get('dot');
                
                if (!slides || !slides.length || !dots || !dots.length) {
                    this._initialized = true;
                    return;
                }

                this._slides = slides;
                this._dots = dots;
                this._goTo(0);
                this._bindEvents();
                this._startAutoPlay();

                const hero = ZT.DOM.get('hero');
                if (hero) {
                    hero.addEventListener('mouseenter', () => this._stopAutoPlay());
                    hero.addEventListener('mouseleave', () => this._startAutoPlay());
                }
                
                this._initialized = true;
                ZT.Logger.info('Hero slider component initialized');
            },

            _goTo: function(index) {
                const slides = this._slides;
                const dots = this._dots;

                if (index < 0) index = slides.length - 1;
                if (index >= slides.length) index = 0;

                slides.forEach(function(slide, i) {
                    const isActive = i === index;
                    slide.classList.toggle('active', isActive);
                    slide.setAttribute('aria-hidden', String(!isActive));
                    
                    slide.querySelectorAll('a, button').forEach(function(el) {
                        el.tabIndex = isActive ? 0 : -1;
                    });
                });

                dots.forEach(function(dot, i) {
                    const isActive = i === index;
                    dot.classList.toggle('active', isActive);
                    dot.setAttribute('aria-selected', String(isActive));
                    dot.tabIndex = isActive ? 0 : -1;
                });

                this._currentSlide = index;
                ZT.State.set('hero.currentSlide', index);
                ZT.Events.emit('zt-slider-change', { index });
            },

            _next: function() {
                this._goTo(this._currentSlide + 1);
            },

            _prev: function() {
                this._goTo(this._currentSlide - 1);
            },

            _startAutoPlay: function() {
                if (this._slides.length <= 1) return;
                this._stopAutoPlay();
                this._slideInterval = setInterval(() => this._next(), ZT.Config.hero.interval);
                ZT.State.set('hero.isPlaying', true);
            },

            _stopAutoPlay: function() {
                if (this._slideInterval) {
                    clearInterval(this._slideInterval);
                    this._slideInterval = null;
                    ZT.State.set('hero.isPlaying', false);
                }
            },

            _resetAutoPlay: function() {
                this._stopAutoPlay();
                this._startAutoPlay();
            },

            _bindEvents: function() {
                this._dots.forEach((dot, index) => {
                    dot.addEventListener('click', () => {
                        this._goTo(index);
                        this._resetAutoPlay();
                    });
                    dot.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            this._goTo(index);
                            this._resetAutoPlay();
                        }
                    });
                });

                const prevBtn = ZT.DOM.get('prevSlide');
                const nextBtn = ZT.DOM.get('nextSlide');
                
                if (prevBtn) {
                    prevBtn.addEventListener('click', () => {
                        this._prev();
                        this._resetAutoPlay();
                    });
                }

                if (nextBtn) {
                    nextBtn.addEventListener('click', () => {
                        this._next();
                        this._resetAutoPlay();
                    });
                }

                const slider = ZT.DOM.get('heroSlider');
                if (slider) {
                    slider.addEventListener('keydown', (e) => {
                        if (e.key === 'ArrowLeft') {
                            e.preventDefault();
                            this._prev();
                            this._resetAutoPlay();
                        } else if (e.key === 'ArrowRight') {
                            e.preventDefault();
                            this._next();
                            this._resetAutoPlay();
                        }
                    });

                    let touchStartX = 0;
                    let touchStartY = 0;

                    slider.addEventListener('touchstart', (e) => {
                        touchStartX = e.changedTouches[0].screenX;
                        touchStartY = e.changedTouches[0].screenY;
                    }, { passive: true });

                    slider.addEventListener('touchend', (e) => {
                        const touchEndX = e.changedTouches[0].screenX;
                        const touchEndY = e.changedTouches[0].screenY;
                        const diffX = touchStartX - touchEndX;
                        const diffY = touchStartY - touchEndY;

                        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > ZT.Config.hero.swipeThreshold) {
                            if (diffX > 0) {
                                this._next();
                            } else {
                                this._prev();
                            }
                            this._resetAutoPlay();
                        }
                    }, { passive: true });
                }
            },

            getCurrentIndex: function() {
                return this._currentSlide;
            }
        },

        // Scroll Reveal Component
        ScrollReveal: {
            _initialized: false,
            _observer: null,

            init: function() {
                if (this._initialized) return;
                if (!ZT.Config.features.scrollReveal) return;
                
                const elements = ZT.DOM.get('revealElements');
                if (!elements || !elements.length) {
                    this._initialized = true;
                    return;
                }
                
                if (ZT.Utils.prefersReducedMotion()) {
                    elements.forEach(function(el) {
                        el.style.opacity = '1';
                        el.style.transform = 'none';
                    });
                    this._initialized = true;
                    return;
                }
                
                if (!('IntersectionObserver' in window)) {
                    elements.forEach(function(el) {
                        el.style.opacity = '1';
                        el.style.transform = 'none';
                    });
                    this._initialized = true;
                    return;
                }

                this._observer = new IntersectionObserver(
                    this._handleIntersection.bind(this),
                    {
                        threshold: ZT.Config.animation.revealThreshold,
                        rootMargin: ZT.Config.animation.revealRootMargin
                    }
                );

                this._setupElements(elements);
                this._initialized = true;
                ZT.Logger.info('Scroll reveal component initialized');
            },

            _setupElements: function(elements) {
                elements.forEach(function(el) {
                    const isPreview = el.closest('.gallery-preview') || el.closest('.gallery-preview-grid');
                    if (isPreview) {
                        el.style.opacity = '1';
                        el.style.transform = 'none';
                        return;
                    }
                    
                    el.style.opacity = '0';
                    el.style.transform = 'translateY(30px)';
                    el.style.transition = `opacity ${ZT.Config.animation.revealDuration}ms ease, transform ${ZT.Config.animation.revealDuration}ms ease`;
                    this._observer.observe(el);
                }.bind(this));
            },

            _handleIntersection: function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        const el = entry.target;
                        el.style.opacity = '1';
                        el.style.transform = 'translateY(0)';
                        this._observer.unobserve(el);
                    }
                }.bind(this));
            }
        },

        // Copyright Component
        Copyright: {
            _initialized: false,

            init: function() {
                if (this._initialized) return;
                
                const yearEl = ZT.DOM.get('copyrightYear');
                if (yearEl) {
                    yearEl.textContent = new Date().getFullYear();
                }
                
                this._initialized = true;
                ZT.Logger.info('Copyright component initialized');
            }
        }
    };

    // ============================================================
    // ZT.Pages - Page Controllers
    // ============================================================
    ZT.Pages = {
        // Home Page Controller
        Home: {
            _initialized: false,

            init: function() {
                if (this._initialized) return;
                
                ZT.Components.HeroSlider.init();
                ZT.Components.ScrollReveal.init();
                
                this._initialized = true;
                ZT.Logger.info('Home page controller initialized');
            }
        },

        // Restaurant Page Controller
        Restaurant: {
            _initialized: false,

            init: function() {
                if (this._initialized) return;
                
                ZT.Components.ScrollReveal.init();
                
                this._initialized = true;
                ZT.Logger.info('Restaurant page controller initialized');
            }
        },

        // Gallery Page Controller
        Gallery: {
            _initialized: false,

            init: function() {
                if (this._initialized) return;
                
                ZT.Components.ScrollReveal.init();
                
                this._initialized = true;
                ZT.Logger.info('Gallery page controller initialized');
            }
        },

        // Conference Page Controller
        Conference: {
            _initialized: false,

            init: function() {
                if (this._initialized) return;
                
                ZT.Components.ScrollReveal.init();
                
                this._initialized = true;
                ZT.Logger.info('Conference page controller initialized');
            }
        },

        // Events Page Controller
        Events: {
            _initialized: false,

            init: function() {
                if (this._initialized) return;
                
                ZT.Components.ScrollReveal.init();
                
                this._initialized = true;
                ZT.Logger.info('Events page controller initialized');
            }
        },

        // Contact Page Controller
        Contact: {
            _initialized: false,

            init: function() {
                if (this._initialized) return;
                
                ZT.Components.ScrollReveal.init();
                
                this._initialized = true;
                ZT.Logger.info('Contact page controller initialized');
            }
        },

        // AutoSpa Page Controller
        AutoSpa: {
            _initialized: false,

            init: function() {
                if (this._initialized) return;
                
                ZT.Components.ScrollReveal.init();
                
                this._initialized = true;
                ZT.Logger.info('AutoSpa page controller initialized');
            }
        }
    };

    // ============================================================
    // ZT.Kernel - Application Kernel
    // ============================================================
    ZT.Kernel = {
        _initialized: false,
        _bootTime: 0,
        _isReady: false,

        /**
         * Start the application
         * @param {Object} options - Start options
         */
        start: function(options) {
            if (this._initialized) {
                ZT.Logger.warn('Application already started');
                return;
            }

            this._bootTime = performance.now();
            ZT.Logger.info('ZT OS booting...', { version: ZT.version });

            try {
                // Phase 1: Boot
                this._boot();
                
                // Phase 2: Core
                this._initCore();
                
                // Phase 3: Services
                this._initServices();
                
                // Phase 4: Components
                this._initComponents();
                
                // Phase 5: Pages
                this._initPages();
                
                // Phase 6: Ready
                this._ready();
                
                this._initialized = true;
                ZT.Logger.info('ZT OS ready', {
                    bootTime: (performance.now() - this._bootTime).toFixed(2) + 'ms'
                });
                
                ZT.Events.emit('zt-ready', {
                    bootTime: this._bootTime,
                    version: ZT.version
                });

            } catch (e) {
                ZT.Logger.error('ZT OS boot failed', { error: e });
                throw e;
            }
        },

        /**
         * Boot phase
         */
        _boot: function() {
            ZT.Logger.info('Boot phase...');
            
            // Set reduced motion preference
            const prefersReducedMotion = ZT.Utils.prefersReducedMotion();
            ZT.State.set('accessibility.reducedMotion', prefersReducedMotion);
            
            // Add focus-visible polyfill
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Tab') {
                    document.documentElement.classList.add('keyboard-navigation');
                }
            });
            document.addEventListener('mousedown', function() {
                document.documentElement.classList.remove('keyboard-navigation');
            });
        },

        /**
         * Core initialization
         */
        _initCore: function() {
            ZT.Logger.info('Core initialization...');
            
            ZT.DOM.init();
            ZT.Logger.debug('DOM cache initialized');
            
            // Check for existing theme preference
            const storedTheme = ZT.Storage.get('theme');
            if (storedTheme) {
                const isLight = storedTheme === 'light';
                document.documentElement.classList.toggle('light-mode', isLight);
                document.documentElement.style.colorScheme = isLight ? 'light' : 'dark';
                ZT.State.set('theme', storedTheme);
            }
        },

        /**
         * Services initialization
         */
        _initServices: function() {
            ZT.Logger.info('Services initialization...');
            
            ZT.Services.Resize.init();
            ZT.Services.Scroll.init();
            ZT.Services.Theme.init();
            ZT.Services.Navigation.init();
        },

        /**
         * Components initialization
         */
        _initComponents: function() {
            ZT.Logger.info('Components initialization...');
            
            ZT.Components.Header.init();
            ZT.Components.Copyright.init();
        },

        /**
         * Pages initialization - determine current page and load accordingly
         */
        _initPages: function() {
            ZT.Logger.info('Pages initialization...');
            
            const path = window.location.pathname;
            const page = this._detectPage(path);
            
            ZT.State.set('currentPage', page);
            ZT.Logger.info(`Loading page: ${page}`);
            
            // Page Registry for scalable page routing
            const PageRegistry = {
                home: ZT.Pages.Home,
                restaurant: ZT.Pages.Restaurant,
                gallery: ZT.Pages.Gallery,
                conference: ZT.Pages.Conference,
                events: ZT.Pages.Events,
                contact: ZT.Pages.Contact,
                autospa: ZT.Pages.AutoSpa
            };
            
            (PageRegistry[page] || PageRegistry.home).init();
        },

        /**
         * Detect current page from URL path
         * @param {string} path - URL path
         * @returns {string} Page name
         */
        _detectPage: function(path) {
            if (path === '/' || path === '' || path === '/index.html') {
                return 'home';
            }
            
            const pageName = path.split('/').pop()?.replace('.html', '') || 'home';
            const validPages = ['restaurant', 'gallery', 'conference', 'events', 'contact', 'autospa'];
            
            return validPages.includes(pageName) ? pageName : 'home';
        },

        /**
         * Ready phase - application is fully operational
         */
        _ready: function() {
            this._isReady = true;
            ZT.State.set('loading.isReady', true);
            ZT.State.set('loading.bootTime', performance.now() - this._bootTime);
            
            // Remove any loading indicators
            document.body.classList.add('zt-ready');
            
            ZT.Logger.info('Application ready');
        },

        /**
         * Restart the application
         */
        restart: function() {
            ZT.Logger.info('Restarting application...');
            this._initialized = false;
            this.start();
        },

        /**
         * Destroy the application (cleanup)
         */
        destroy: function() {
            ZT.Logger.info('Destroying application...');
            this._initialized = false;
            this._isReady = false;
            
            // Cleanup observers
            if (ZT.Components.ScrollReveal._observer) {
                ZT.Components.ScrollReveal._observer.disconnect();
            }
            
            // Cleanup intervals
            if (ZT.Components.HeroSlider._slideInterval) {
                clearInterval(ZT.Components.HeroSlider._slideInterval);
            }
            
            // Remove event listeners
            ZT.Events._events = {};
            
            ZT.Logger.info('Application destroyed');
        },

        /**
         * Check if application is ready
         * @returns {boolean}
         */
        isReady: function() {
            return this._isReady;
        },

        /**
         * Get uptime in milliseconds
         * @returns {number}
         */
        getUptime: function() {
            return performance.now() - this._bootTime;
        }
    };

    // ============================================================
    // ZT Public API - Minimal surface area
    // ============================================================
    ZT.start = function(options) {
        ZT.Kernel.start(options);
    };

    ZT.restart = function() {
        ZT.Kernel.restart();
    };

    ZT.destroy = function() {
        ZT.Kernel.destroy();
    };

    ZT.ready = function(callback) {
        if (ZT.Kernel.isReady()) {
            callback();
        } else {
            ZT.Events.on('zt-ready', callback);
        }
    };

    // ============================================================
    // Auto-Initialize - DOMContentLoaded trigger
    // ============================================================
    document.addEventListener('DOMContentLoaded', function() {
        ZT.start();
    });

    // ============================================================
    // Export ZT to window (already at top)
    // ============================================================
    // window.ZT is already defined at the top of this file

})();


