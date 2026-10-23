/**
 * ZT Lounge Meru - Reusable Menu Engine
 * Renders menu from Supabase, scoped by page_id, grouped by DB category.
 * Driven by data attributes: data-menu-root, data-page-key
 */
(function() {
    'use strict';
    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    function buildMenuItemCard(item, grid) {
        if (!item || !grid) return;
        var card = document.createElement('div');
        card.className = 'menu-item-card';
        var img = document.createElement('img');
        img.className = 'menu-item-image';
        img.setAttribute('loading', 'lazy');
        img.setAttribute('decoding', 'async');
        img.alt = item.alt_text || item.name || 'Menu item';
        card.appendChild(img);
        var content = document.createElement('div');
        content.className = 'menu-item-content';
        var h3 = document.createElement('h3');
        h3.textContent = item.name || 'Unnamed Item';
        content.appendChild(h3);
        if (item.description) {
            var p = document.createElement('p');
            p.textContent = item.description;
            content.appendChild(p);
        }
        var price = document.createElement('span');
        price.className = 'price-tag';
        price.textContent = 'KES ' + Number(item.price || 0).toLocaleString();
        content.appendChild(price);
        card.appendChild(content);
        grid.appendChild(card);
    }
    function renderMenuNav(root, categories) {
        var navContainer = document.createElement('nav');
        navContainer.className = 'menu-nav-section';
        navContainer.setAttribute('aria-label', 'Menu categories');
        var nav = document.createElement('div');
        nav.className = 'menu-nav';
        categories.forEach(function(cat, index) {
            var link = document.createElement('a');
            link.href = '#' + cat.slug;
            link.textContent = cat.name;
            if (index === 0) link.classList.add('active');
            nav.appendChild(link);
        });
        navContainer.appendChild(nav);
        root.appendChild(navContainer);
    }
    function renderMenuSections(root, categories) {
        categories.forEach(function(cat) {
            if (!cat.items || cat.items.length === 0) return;
            var section = document.createElement('section');
            section.className = 'menu-category';
            section.id = cat.slug;
            var title = document.createElement('h2');
            title.className = 'menu-category-title';
            title.textContent = cat.name;
            var span = document.createElement('span');
            span.textContent = ' ' + cat.name + ' ';
            title.appendChild(span);
            var divider = document.createElement('div');
            divider.className = 'menu-category-divider';
            var grid = document.createElement('div');
            grid.className = 'menu-items-grid';
            (cat.items || []).forEach(function(item) {
                buildMenuItemCard(item, grid);
            });
            section.appendChild(title);
            section.appendChild(divider);
            section.appendChild(grid);
            root.appendChild(section);
        });
    }
    function renderMenuUncategorizedItems(root, items) {
        if (!items || items.length === 0) return;
        var section = document.createElement('section');
        section.className = 'menu-category';
        section.id = 'menu-more';
        var title = document.createElement('h2');
        title.className = 'menu-category-title';
        title.textContent = 'More';
        var span = document.createElement('span');
        span.textContent = ' More';
        title.appendChild(span);
        var divider = document.createElement('div');
        divider.className = 'menu-category-divider';
        var grid = document.createElement('div');
        grid.className = 'menu-items-grid';
        (items || []).forEach(function(item) {
            buildMenuItemCard(item, grid);
        });
        section.appendChild(title);
        section.appendChild(divider);
        section.appendChild(grid);
        root.appendChild(section);
    }
    function showMenuEmpty(root) {
        root.innerHTML = '';
        var empty = document.createElement('div');
        empty.className = 'menu-category';
        var title = document.createElement('h2');
        title.className = 'menu-category-title';
        title.textContent = 'No menu items found';
        var desc = document.createElement('p');
        desc.className = 'menu-empty-desc';
        desc.textContent = 'Please check back later or contact us for more information.';
        var btnContainer = document.createElement('div');
        btnContainer.className = 'menu-contact-buttons';
        var whatsappBtn = document.createElement('a');
        whatsappBtn.className = 'btn btn-outline';
        whatsappBtn.href = 'https://wa.me/254143542601?text=Hello%20ZT%20Lounge%2C%20I%27d%20like%20to%20make%20an%20inquiry';
        whatsappBtn.target = '_blank';
        whatsappBtn.rel = 'noopener noreferrer';
        whatsappBtn.setAttribute('aria-label', 'Chat with us on WhatsApp');
        var waIcon = document.createElement('i');
        waIcon.className = 'fab fa-whatsapp';
        waIcon.setAttribute('aria-hidden', 'true');
        whatsappBtn.appendChild(waIcon);
        whatsappBtn.appendChild(document.createTextNode(' WhatsApp'));
        var callBtn = document.createElement('a');
        callBtn.className = 'btn btn-secondary';
        callBtn.href = 'tel:+254143542601';
        callBtn.setAttribute('aria-label', 'Call us at +254 143 542 601');
        var phoneIcon = document.createElement('i');
        phoneIcon.className = 'fas fa-phone';
        phoneIcon.setAttribute('aria-hidden', 'true');
        callBtn.appendChild(phoneIcon);
        callBtn.appendChild(document.createTextNode(' Call'));
        btnContainer.appendChild(whatsappBtn);
        btnContainer.appendChild(callBtn);
        empty.appendChild(title);
        empty.appendChild(desc);
        empty.appendChild(btnContainer);
        root.appendChild(empty);
    }
    function showMenuError(root, err) {
        root.innerHTML = '';
        var error = document.createElement('div');
        error.className = 'menu-category';
        var title = document.createElement('h2');
        title.className = 'menu-category-title';
        title.textContent = 'Unable to load menu';
        var desc = document.createElement('p');
        desc.className = 'menu-empty-desc';
        desc.textContent = err && err.message ? escapeHtml(err.message) : 'Please check your connection and try again.';
        var btnContainer = document.createElement('div');
        btnContainer.className = 'menu-contact-buttons';
        var whatsappBtn = document.createElement('a');
        whatsappBtn.className = 'btn btn-outline';
        whatsappBtn.href = 'https://wa.me/254143542601?text=Hello%20ZT%20Lounge%2C%20I%27d%20like%20to%20make%20an%20inquiry';
        whatsappBtn.target = '_blank';
        whatsappBtn.rel = 'noopener noreferrer';
        whatsappBtn.setAttribute('aria-label', 'Chat with us on WhatsApp');
        var waIcon = document.createElement('i');
        waIcon.className = 'fab fa-whatsapp';
        waIcon.setAttribute('aria-hidden', 'true');
        whatsappBtn.appendChild(waIcon);
        whatsappBtn.appendChild(document.createTextNode(' WhatsApp'));
        var callBtn = document.createElement('a');
        callBtn.className = 'btn btn-secondary';
        callBtn.href = 'tel:+254143542601';
        callBtn.setAttribute('aria-label', 'Call us at +254 143 542 601');
        var phoneIcon = document.createElement('i');
        phoneIcon.className = 'fas fa-phone';
        phoneIcon.setAttribute('aria-hidden', 'true');
        callBtn.appendChild(phoneIcon);
        callBtn.appendChild(document.createTextNode(' Call'));
        btnContainer.appendChild(whatsappBtn);
        btnContainer.appendChild(callBtn);
        error.appendChild(title);
        error.appendChild(desc);
        error.appendChild(btnContainer);
        root.appendChild(error);
    }
    function renderMenuEngine() {
        var roots = document.querySelectorAll('[data-menu-root]');
        roots.forEach(function(root) {
            var pageKey = root.getAttribute('data-page-key');
            if (!pageKey) return;
            root.innerHTML = '<div class="menu-loading"><div class="menu-skeleton"></div></div>';
            var pageId = window.pageKeyToId && window.pageKeyToId[pageKey];
            if (!pageId) {
                if (window.PageResolver && window.PageResolver.requirePageUuid) {
                    window.PageResolver.requirePageUuid(pageKey).then(function(id) {
                        renderMenuForPage(root, id);
                    }).catch(function(err) {
                        showMenuError(root, err);
                    });
                } else {
                    showMenuError(root, new Error('Page key not found: ' + pageKey));
                }
                return;
            }
            window.MenuRepository.getMenuForPage(pageId).then(function(menuData) {
                if (!menuData || (!menuData.categories || menuData.categories.length === 0) && (!menuData.uncategorizedItems || menuData.uncategorizedItems.length === 0)) {
                    showMenuEmpty(root);
                    return;
                }
                renderMenuNav(root, menuData.categories);
                renderMenuSections(root, menuData.categories);
                renderMenuUncategorizedItems(root, menuData.uncategorizedItems);
                if (window.initMenuScrollSpy) {
                    window.initMenuScrollSpy();
                }
            }).catch(function(err) {
                showMenuError(root, err);
            });
        });
    }
    function renderMenuForPage(root, pageId) {
        window.MenuRepository.getMenuForPage(pageId).then(function(menuData) {
            if (!menuData || (!menuData.categories || menuData.categories.length === 0) && (!menuData.uncategorizedItems || menuData.uncategorizedItems.length === 0)) {
                showMenuEmpty(root);
                return;
            }
            renderMenuNav(root, menuData.categories);
            renderMenuSections(root, menuData.categories);
            renderMenuUncategorizedItems(root, menuData.uncategorizedItems);
            if (window.initMenuScrollSpy) {
                window.initMenuScrollSpy();
            }
        }).catch(function(err) {
            showMenuError(root, err);
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            renderMenuEngine();
        });
    } else {
        renderMenuEngine();
    }

})();