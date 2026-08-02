/**
 * Navigation Management
 * Handles mobile menu, dropdowns, hamburger, keyboard navigation, and active states
 */
(function() {
    'use strict';
    
    document.addEventListener('DOMContentLoaded', function() {
        var hamburger = document.getElementById('hamburger');
        var navMenu = document.getElementById('navMenu');
        
        if (!hamburger || !navMenu) return;
        
        // === MOBILE MENU TOGGLE ===
        function openMobileMenu() {
            hamburger.classList.add('active');
            navMenu.classList.add('active');
            hamburger.setAttribute('aria-expanded', 'true');
        }
        
        function closeMobileMenu() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        }
        
        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
            var isActive = navMenu.classList.contains('active');
            this.setAttribute('aria-expanded', isActive ? 'true' : 'false');
        });
        
        // === MOBILE DROPDOWN TOGGLE ===
        var dropdownParents = navMenu.querySelectorAll('.nav-list > li > a.dropdown-parent');
        dropdownParents.forEach(function(link) {
            link.addEventListener('click', function(e) {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    var parentLi = this.parentElement;
                    var isExpanded = parentLi.getAttribute('aria-expanded') === 'true';
                    
                    // Close other active dropdowns
                    var activeItems = navMenu.querySelectorAll('.nav-list > li.active-dropdown');
                    activeItems.forEach(function(el) {
                        if (el !== parentLi) {
                            el.classList.remove('active-dropdown');
                            el.setAttribute('aria-expanded', 'false');
                        }
                    });
                    
                    var newExpanded = !isExpanded;
                    parentLi.classList.toggle('active-dropdown', newExpanded);
                    parentLi.setAttribute('aria-expanded', String(newExpanded));
                }
            });
        });
        
        // === CLOSE MENU ON LINK CLICK (MOBILE) ===
        var navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(function(link) {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768 && !this.closest('.dropdown-menu')) {
                    closeMobileMenu();
                }
            });
        });
        
        // === KEYBOARD NAVIGATION ===
        hamburger.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                closeMobileMenu();
                this.focus();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                closeMobileMenu();
                hamburger.focus();
            }
        });
        
        // Close on resize to desktop
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768 && navMenu.classList.contains('active')) {
                closeMobileMenu();
            }
        });
        
        // === DESKTOP DROPDOWN KEYBOARD ACCESS ===
        var desktopDropdownParents = document.querySelectorAll('.nav-list > li > a.dropdown-parent');
        desktopDropdownParents.forEach(function(link) {
            link.addEventListener('keydown', function(e) {
                if (window.innerWidth > 768) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        var parentLi = this.parentElement;
                        var isExpanded = parentLi.getAttribute('aria-expanded') === 'true';
                        parentLi.setAttribute('aria-expanded', String(!isExpanded));
                    }
                }
            });
        });
        
        // Arrow key navigation within dropdown
        var dropdownMenus = document.querySelectorAll('.dropdown-menu');
        dropdownMenus.forEach(function(menu) {
            var items = menu.querySelectorAll('a');
            items.forEach(function(item, index) {
                item.addEventListener('keydown', function(e) {
                    if (e.key === 'ArrowDown') {
                        var next = items[index + 1] || items[0];
                        next.focus();
                    } else if (e.key === 'ArrowUp') {
                        var prev = items[index - 1] || items[items.length - 1];
                        prev.focus();
                    } else if (e.key === 'Escape') {
                        var parentLink = this.closest('li')?.parentElement?.previousElementSibling;
                        if (parentLink && parentLink.classList.contains('dropdown-parent')) {
                            parentLink.focus();
                            var parentLi = parentLink.parentElement;
                            if (window.innerWidth <= 768) {
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
        
        // Close dropdowns when clicking outside (desktop)
        document.addEventListener('click', function(e) {
            if (window.innerWidth > 768) {
                var dropdownParents = document.querySelectorAll('.nav-list > li[aria-expanded="true"]');
                dropdownParents.forEach(function(parent) {
                    if (!parent.contains(e.target)) {
                        parent.setAttribute('aria-expanded', 'false');
                    }
                });
            }
        });
        
        // === UPDATE ACTIVE NAV LINK (preserve hardcoded active states) ===
        var currentPath = window.location.pathname;
        var navLinksAll = document.querySelectorAll('.nav-list a[href]');
        navLinksAll.forEach(function(link) {
            // Check if already has hardcoded active state
            var alreadyActive = link.classList.contains('active');
            var href = link.getAttribute('href');
            // Handle both relative paths and absolute path matching
            var isActive = href === currentPath ||
                           (currentPath.endsWith('/' + href)) ||
                           (href === 'index.html' && (currentPath === '/' || currentPath === '' || currentPath === '/index.html')) ||
                           (href === '../../index.html' && (currentPath === '/' || currentPath === '' || currentPath.endsWith('/index.html')));
            if (!alreadyActive && isActive) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
            }
        });
        
        // === UPDATE COPYRIGHT YEAR ===
        var yearEl = document.getElementById('copyrightYear');
        if (yearEl) {
            yearEl.textContent = new Date().getFullYear();
        }
    });
})();