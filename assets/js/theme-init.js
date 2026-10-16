/**
 * ============================================================
 * ZT Lounge Meru - Canonical Theme Initialization
 * Version: 1.0.0 (extracted from the 10 copied inline snippets)
 * ============================================================
 *
 * SINGLE canonical pre-render theme initialization for every
 * public page. Must be loaded as a BLOCKING script in <head>
 * (before first paint) to avoid theme FOUC:
 *
 *   <script src="{prefix}assets/js/theme-init.js"></script>
 *
 * Behaviour is byte-for-byte identical to the previous inline
 * snippets that were copied into every page's <head>.
 */
(function() {
    try {
        var savedTheme = localStorage.getItem('zt-theme');
        if (savedTheme === 'light') {
            document.documentElement.classList.add('light-mode');
            document.documentElement.style.colorScheme = 'light';
        } else {
            document.documentElement.style.colorScheme = 'dark';
        }
    } catch (e) {
        document.documentElement.style.colorScheme = 'dark';
    }
})();