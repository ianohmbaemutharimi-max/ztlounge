/**
 * Hero Slider
 * Handles hero slider autoplay, navigation, and accessibility
 */
(function() {
    'use strict';
    
    document.addEventListener('DOMContentLoaded', function() {
        var heroSlides = document.querySelectorAll('.hero-slide');
        var heroDots = document.querySelectorAll('.dot');
        
        if (!heroSlides.length || !heroDots.length) return;
        
        var heroCurrent = 0;
        var heroInterval;
        
        function goToHero(index) {
            if (index < 0) index = heroSlides.length - 1;
            if (index >= heroSlides.length) index = 0;
            
            heroSlides.forEach(function(slide, i) {
                var isActive = i === index;
                slide.classList.toggle('active', isActive);
                slide.setAttribute('aria-hidden', String(!isActive));
                
                var interactiveElements = slide.querySelectorAll('a, button');
                interactiveElements.forEach(function(el) {
                    el.tabIndex = isActive ? 0 : -1;
                });
            });
            
            heroDots.forEach(function(dot, i) {
                var isActive = i === index;
                dot.classList.toggle('active', isActive);
                dot.setAttribute('aria-selected', String(isActive));
                dot.tabIndex = isActive ? 0 : -1;
            });
            
            heroCurrent = index;
        }
        
        function nextHero() { goToHero(heroCurrent + 1); }
        function prevHero() { goToHero(heroCurrent - 1); }
        
        var prevSlideBtn = document.getElementById('prevSlide');
        var nextSlideBtn = document.getElementById('nextSlide');
        
        if (prevSlideBtn) {
            prevSlideBtn.addEventListener('click', function() {
                prevHero();
                resetHeroAutoplay();
            });
        }
        
        if (nextSlideBtn) {
            nextSlideBtn.addEventListener('click', function() {
                nextHero();
                resetHeroAutoplay();
            });
        }
        
        heroDots.forEach(function(dot, index) {
            dot.addEventListener('click', function() {
                goToHero(index);
                resetHeroAutoplay();
            });
            
            dot.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    goToHero(index);
                    resetHeroAutoplay();
                }
            });
        });
        
        function startHeroAutoplay() {
            stopHeroAutoplay();
            heroInterval = setInterval(nextHero, 5000);
        }
        
        function stopHeroAutoplay() {
            if (heroInterval) {
                clearInterval(heroInterval);
                heroInterval = null;
            }
        }
        
        function resetHeroAutoplay() {
            startHeroAutoplay();
        }
        
        var heroContainer = document.querySelector('.hero-slider');
        if (heroContainer) {
            heroContainer.addEventListener('mouseenter', stopHeroAutoplay);
            heroContainer.addEventListener('mouseleave', startHeroAutoplay);
            heroContainer.addEventListener('focusin', stopHeroAutoplay);
            heroContainer.addEventListener('focusout', function(e) {
                if (!this.contains(e.relatedTarget)) {
                    startHeroAutoplay();
                }
            });
        }
        
        goToHero(0);
        startHeroAutoplay();
    });
})();