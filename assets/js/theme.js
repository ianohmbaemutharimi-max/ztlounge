/**
 * Theme Management
 * Handles light/dark mode switching with localStorage persistence
 */
(function() {
    'use strict';
    
    document.addEventListener('DOMContentLoaded', function() {
        var themeToggle = document.getElementById('themeToggle');
        var html = document.documentElement;
        
        if (!themeToggle) return;
        
        themeToggle.addEventListener('click', function() {
            html.classList.toggle('light-mode');
            var isLight = html.classList.contains('light-mode');
            localStorage.setItem('zt-theme', isLight ? 'light' : 'dark');
            document.documentElement.style.colorScheme = isLight ? 'light' : 'dark';
        });
    });
})();