/**
 * Menu Navigation
 * Handles smooth scrolling and active state for menu category navigation
 */
(function() {
    'use strict';
    
    document.addEventListener('DOMContentLoaded', function() {
        var categoryLinks = document.querySelectorAll('.menu-nav a');
        categoryLinks.forEach(function(link) {
            link.addEventListener('click', function(e) {
                var targetId = this.getAttribute('href');
                if (targetId && targetId.startsWith('#')) {
                    e.preventDefault();
                    var target = document.querySelector(targetId);
                    if (target) {
                        var headerOffset = document.querySelector('.menu-nav-section')?.offsetHeight || 80;
                        var elementPosition = target.getBoundingClientRect().top;
                        var offsetPosition = elementPosition + window.pageYOffset - headerOffset - 20;
                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });

        var menuCategories = document.querySelectorAll('.menu-category');
        var navAnchors = document.querySelectorAll('.menu-nav a');
        
        function updateActiveNav() {
            var scrollPosition = window.scrollY + 200;
            var activeIndex = 0;
            menuCategories.forEach(function(category, index) {
                if (scrollPosition >= category.offsetTop) activeIndex = index;
            });
            navAnchors.forEach(function(anchor, index) {
                anchor.classList.toggle('active', index === activeIndex);
            });
        }
        
        window.addEventListener('scroll', updateActiveNav);
        updateActiveNav();
    });
})();