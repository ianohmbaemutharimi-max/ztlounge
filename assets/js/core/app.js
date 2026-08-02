/**
 * ============================================================
 * ZT Lounge Design System - Core Module
 * Centralized application logic
 * ============================================================
 */

window.ZTLounge = (function() {
    'use strict';

    // ========================================
    // Theme Management
    // ========================================
    var theme = {
        init: function() {
            this.loadTheme();
            this.bindEvents();
        },

        loadTheme: function() {
            var savedTheme = localStorage.getItem('zt-theme');
            if (savedTheme === 'light') {
                document.body.classList.add('light-mode');
            }
        },

        bindEvents: function() {
            var themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.addEventListener('click', this.toggleTheme.bind(this));
            }
        },

        toggleTheme: function() {
            document.body.classList.toggle('light-mode');
            var isLight = document.body.classList.contains('light-mode');
            localStorage.setItem('zt-theme', isLight ? 'light' : 'dark');
        }
    };

    // ========================================
    // Navigation Management
    // ========================================
    var navigation = {
        init: function() {
            this.bindEvents();
            this.setCurrentPage();
        },

        bindEvents: function() {
            var hamburger = document.getElementById('hamburger');
            if (hamburger) {
                hamburger.addEventListener('click', this.toggleMobileMenu.bind(this));
            }
        },

        toggleMobileMenu: function() {
            var hamburger = document.getElementById('hamburger');
            var navMenu = document.getElementById('navMenu');
            
            if (hamburger && navMenu) {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            }
        },

        setCurrentPage: function() {
            var currentPath = window.location.pathname;
            var navLinks = document.querySelectorAll('.nav-list a');
            
            navLinks.forEach(function(link) {
                if (link.getAttribute('href') && currentPath.includes(link.getAttribute('href'))) {
                    link.classList.add('active');
                }
            });
        }
    };

    // ========================================
    // Slider Management
    // ========================================
    var slider = {
        slides: [],
        currentIndex: 0,
        autoPlayInterval: null,

        init: function(config) {
            if (!config || !config.slides) return;
            this.slides = config.slides;
            this.renderSlides();
            this.startAutoPlay();
        },

        renderSlides: function() {
            var track = document.querySelector('.slider-track');
            if (!track) return;

            track.innerHTML = this.slides.map(function(slide, index) {
                return '<div class="slide" data-index="' + index + '">' +
                    '<img src="' + slide.image + '" alt="' + slide.alt + '" class="slide-image" loading="lazy" decoding="async" />' +
                    '<div class="slide-content">' +
                        '<span class="hero-badge">' + slide.badge + '</span>' +
                        '<h1 class="hero-title">' + 
                            (slide.highlight ? '<span class="hero-highlight">' + slide.highlight + '</span> ' : '') + 
                            slide.title + 
                        '</h1>' +
                        '<p class="hero-subtitle">' + slide.subtitle + '</p>' +
                    '</div>' +
                '</div>';
            }).join('');

            this.createDots();
        },

        createDots: function() {
            var navContainer = document.querySelector('.slider-nav') || document.createElement('div');
            navContainer.className = 'slider-nav';
            
            navContainer.innerHTML = this.slides.map(function(_, index) {
                return '<button class="slider-dot' + (index === 0 ? ' active' : '') + '" data-index="' + index + '"></button>';
            }).join('');

            document.querySelector('.slider-container').appendChild(navContainer);
            this.bindDotEvents();
        },

        bindDotEvents: function() {
            var dots = document.querySelectorAll('.slider-dot');
            dots.forEach(function(dot) {
                dot.addEventListener('click', function() {
                    var index = parseInt(this.getAttribute('data-index'));
                    this.showSlide(index);
                }.bind(this));
            }.bind(this));
        },

        showSlide: function(index) {
            this.currentIndex = index;
            var track = document.querySelector('.slider-track');
            
            if (track) {
                track.style.transform = 'translateX(-' + (index * 100) + '%)';
            }

            document.querySelectorAll('.slider-dot').forEach(function(dot, i) {
                dot.classList.toggle('active', i === index);
            });
        },

        startAutoPlay: function() {
            this.autoPlayInterval = setInterval(function() {
                this.nextSlide();
            }.bind(this), 5000);
        },

        nextSlide: function() {
            var nextIndex = (this.currentIndex + 1) % this.slides.length;
            this.showSlide(nextIndex);
        }
    };

    // ========================================
    // App Initialization
    // ========================================
    var app = {
        init: function() {
            theme.init();
            navigation.init();
        }
    };

    // Public API
    return {
        init: app.init.bind(app),
        theme: theme,
        navigation: navigation,
        slider: slider
    };
})();