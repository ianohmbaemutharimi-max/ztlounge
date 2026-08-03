/**
 * Loads content from configuration files and populates the DOM
 * Version: 1.1.0
 * ============================================================
 * Supabase-first content loader.
 * Populates DOM from repositories (which read Supabase, falling back to config).
 * ============================================================
 */

(function() {
    'use strict';

    /**
     * Get page identifier from body or pathname
     */
    function getPageId() {
        var body = document.body;
        if (body.getAttribute('data-page')) {
            return body.getAttribute('data-page');
        }
        var path = window.location.pathname;
        if (path === '/' || path.endsWith('index.html')) return 'home';
        if (path.includes('restaurant-menu')) return 'restaurantMenu';
        if (path.includes('restaurant')) return 'restaurant';
        if (path.includes('lounge')) return 'lounge';
        if (path.includes('vip')) return 'vip';
        if (path.includes('events')) return 'events';
        if (path.includes('conference')) return 'conference';
        if (path.includes('autospa')) return 'autospa';
        if (path.includes('gallery')) return 'gallery';
        if (path.includes('contact')) return 'contact';
        return 'home';
    }

    /**
     * Populate hero section from HeroRepository (Supabase-first)
     */
    function populateHero() {
        var pageId = getPageId();
        if (!window.HeroRepository) return;

        window.HeroRepository.getByPage(pageId).then(function(heroData) {
            if (!heroData || !heroData.slides || heroData.slides.length === 0) {
                return;
            }

            heroData.slides.forEach(function(slide, index) {
                var slideEl = document.querySelector('.hero-slide[data-index="' + index + '"], #hero-slide-' + index);
                if (!slideEl) return;

                var badgeEl = slideEl.querySelector('.hero-badge');
                if (badgeEl && slide.badge) {
                    badgeEl.textContent = slide.badge;
                }

                var titleEl = slideEl.querySelector('.hero-title');
                if (titleEl && slide.title) {
                    var html = slide.title;
                    if (slide.highlight) {
                        html = slide.title + ' <span>' + slide.highlight + '</span>';
                    }
                    titleEl.innerHTML = html;
                }

                var subtitleEl = slideEl.querySelector('.hero-subtitle');
                if (subtitleEl && slide.subtitle) {
                    subtitleEl.textContent = slide.subtitle;
                }

                var buttonsContainer = slideEl.querySelector('.hero-buttons');
                if (buttonsContainer && slide.buttons) {
                    slide.buttons.forEach(function(btn) {
                        var btnLink = buttonsContainer.querySelector('a[href="' + btn.href + '"]');
                        if (btnLink) {
                            btnLink.textContent = btn.text;
                            btnLink.className = 'btn btn-' + btn.style;
                        }
                    });
                }
            });
        });
    }

    /**
     * Populate gallery from GalleryRepository (Supabase-first)
     */
    function populateGallery() {
        var pageId = getPageId();
        if (!window.GalleryRepository) return;

        window.GalleryRepository.getByPage(pageId).then(function(galleryData) {
            if (!galleryData) return;

            if (galleryData.items) {
                galleryData.items.forEach(function(item, index) {
                    var gridItem = document.querySelector('.grid-item[data-index="' + index + '"]');
                    if (!gridItem) return;

                    var img = gridItem.querySelector('img');
                    if (img && item.image) {
                        img.src = item.image;
                        img.alt = item.alt || item.label || '';
                    }

                    var overlay = gridItem.querySelector('.overlay');
                    if (overlay) {
                        var h4 = overlay.querySelector('h4');
                        var span = overlay.querySelector('span');
                        if (h4 && item.label) h4.textContent = item.label;
                        if (span && item.caption) span.textContent = item.caption;
                    }
                });
            }
        });
    }

    /**
     * Populate FAQ from FAQRepository (Supabase-first)
     * Uses textContent to prevent XSS
     */
    function populateFAQ() {
        var pageId = getPageId();
        if (!window.FAQRepository) return;

        window.FAQRepository.getByPage(pageId).then(function(faqData) {
            if (!faqData || !faqData.length) return;

            var faqContainer = document.querySelector('.faq-container, .faq-list');
            if (!faqContainer) return;

            faqContainer.innerHTML = '';

            faqData.forEach(function(item) {
                var itemEl = document.createElement('div');
                itemEl.className = 'faq-item';

                var strong = document.createElement('strong');
                strong.textContent = item.question || item.question_text || '';
                itemEl.appendChild(strong);

                var p = document.createElement('p');
                p.textContent = item.answer || item.answer_text || '';
                itemEl.appendChild(p);

                faqContainer.appendChild(itemEl);
            });
        });
    }

    /**
     * Populate homepage service cards from ServicesRepository (Supabase-first)
     * Targets .service-cards-grid .service-card
     */
    function populateServiceCards() {
        if (!window.ServicesRepository) return;

        window.ServicesRepository.getAll().then(function(servicesData) {
            if (!servicesData || !servicesData.length) return;

            var grid = document.querySelector('.service-cards-grid');
            if (!grid) return;

            var cards = grid.querySelectorAll('.service-card');
            if (cards.length === 0) return;

            // Map services by slug to update matching cards
            servicesData.forEach(function(service) {
                var slug = service.slug || '';
                var card = null;

                // Match by href or by order
                if (service.href) {
                    card = grid.querySelector('.service-card[href="' + service.href + '"]');
                }
                if (!card) {
                    // Fallback: match by index
                    var idx = service.display_order || 0;
                    card = cards[idx];
                }
                if (!card) return;

                var img = card.querySelector('.card-image');
                if (img && service.image_url) {
                    img.src = service.image_url;
                    img.alt = service.alt_text || service.name || '';
                }

                var tag = card.querySelector('.card-tag');
                if (tag && service.tag) {
                    tag.textContent = '\u2726 ' + service.tag;
                }

                var h3 = card.querySelector('h3');
                if (h3 && service.name) {
                    h3.textContent = service.name;
                }

                var p = card.querySelector('p');
                if (p && service.description) {
                    p.textContent = service.description;
                }
            });
        });
    }

    /**
     * Populate menu from MenuRepository (Supabase-first)
     * Updates in-place .menu-item-card elements to preserve visual design.
     * Matches DB category name to existing .menu-category section headings.
     */
    function populateMenu() {
        if (!window.MenuRepository) return;

        window.MenuRepository.getMenu().then(function(menuData) {
            if (!menuData || !menuData.categories || !menuData.categories.length) return;

            var categories = document.querySelectorAll('.menu-category');
            if (!categories || categories.length === 0) return;

            menuData.categories.forEach(function(category) {
                var catName = (category.name || '').toLowerCase();

                // Find matching .menu-category section by heading text
                var catSection = null;
                categories.forEach(function(sec) {
                    var heading = sec.querySelector('.menu-category-title');
                    var headingText = heading ? heading.textContent.toLowerCase() : '';
                    // Match "Signature Grills" -> section titled "Signature Grills", etc.
                    if (headingText.indexOf(catName) !== -1) {
                        catSection = sec;
                    }
                });
                if (!catSection) return;

                var cards = catSection.querySelectorAll('.menu-item-card');
                var items = category.items || [];

                items.forEach(function(item, index) {
                    var card = cards[index];
                    if (!card) return;

                    var h3 = card.querySelector('h3');
                    if (h3 && item.name) h3.textContent = item.name;

                    var p = card.querySelector('p');
                    if (p && item.description) p.textContent = item.description;

                    var priceTag = card.querySelector('.price-tag');
                    if (priceTag && item.price) {
                        priceTag.textContent = 'KES ' + Number(item.price).toLocaleString();
                    }

                    var img = card.querySelector('.menu-item-image');
                    if (img && item.image_url) img.src = item.image_url;
                });
            });
        });
    }

    /**
     * Populate services experience highlights from ServicesRepository (Supabase-first)
     */
    function populateServices() {
        var pageId = getPageId();
        if (!window.ServicesRepository) return;

        window.ServicesRepository.getByPage(pageId).then(function(servicesData) {
            if (!servicesData) return;

            if (servicesData.experiences) {
                var grid = document.querySelector('.experience-highlights-grid, .experience-grid');
                if (grid) {
                    // Content already in HTML - config available for future use
                }
            }

            if (servicesData.features) {
                var featuresContainer = document.querySelector('.features-grid, .features-list');
                if (featuresContainer) {
                    featuresContainer.innerHTML = '';
                    servicesData.features.forEach(function(feature) {
                        var featureEl = document.createElement('div');
                        featureEl.className = 'feature-item';

                        var icon = document.createElement('i');
                        icon.className = feature.icon || 'fa-star';
                        icon.setAttribute('aria-hidden', 'true');
                        featureEl.appendChild(icon);

                        var span = document.createElement('span');
                        span.textContent = feature.name || feature.title || '';
                        featureEl.appendChild(span);

                        featuresContainer.appendChild(featureEl);
                    });
                }
            }
        });
    }

    /**
     * Populate testimonials from TestimonialsRepository (Supabase-first)
     */
    function populateTestimonials() {
        if (!window.TestimonialsRepository) return;

        window.TestimonialsRepository.getAll().then(function(data) {
            if (!data || !data.length) return;

            var container = document.querySelector('.testimonials-container, .testimonials-grid, .testimonial-list');
            if (!container) return;

            // Only populate if container is empty or has placeholder content
            if (container.children.length > 0) return;

            data.forEach(function(item) {
                var itemEl = document.createElement('div');
                itemEl.className = 'testimonial-item';

                var quote = document.createElement('blockquote');
                quote.textContent = item.comment || item.content || item.text || item.review || '';
                itemEl.appendChild(quote);

                var author = document.createElement('cite');
                author.textContent = item.customer_name || item.author || '';
                itemEl.appendChild(author);

                if (item.occupation || item.role || item.title) {
                    var role = document.createElement('span');
                    role.className = 'testimonial-role';
                    role.textContent = item.occupation || item.role || item.title || '';
                    itemEl.appendChild(role);
                }

                container.appendChild(itemEl);
            });
        });
    }

    /**
     * Populate business contact info from BusinessService (Supabase-first)
     */
    function populateBusinessInfo() {
        if (!window.BusinessService) return;

        window.BusinessService.getContact().then(function(contact) {
            if (!contact) return;

            // Update phone numbers
            var phoneEls = document.querySelectorAll('.phone-number, [data-phone]');
            phoneEls.forEach(function(el) {
                if (contact.phone) el.textContent = contact.phone;
            });

            // Update phone links
            var phoneLinks = document.querySelectorAll('a[href^="tel:"]');
            phoneLinks.forEach(function(link) {
                if (contact.phoneRaw) {
                    link.href = 'tel:' + contact.phoneRaw;
                }
            });

            // Update WhatsApp links
            var waLinks = document.querySelectorAll('a[href^="https://wa.me/"]');
            waLinks.forEach(function(link) {
                if (contact.phoneRaw) {
                    var text = link.href.split('?text=')[1] || '';
                    link.href = 'https://wa.me/' + contact.phoneRaw + (text ? '?text=' + text : '');
                }
            });

            // Update email
            if (contact.email) {
                var emailLinks = document.querySelectorAll('a[href^="mailto:"]');
                emailLinks.forEach(function(link) {
                    link.href = 'mailto:' + contact.email;
                });
            }

            // Update social links
            if (contact.social) {
                var social = contact.social;
                var socialLinks = document.querySelectorAll('.footer-social a');
                socialLinks.forEach(function(link) {
                    var label = (link.getAttribute('aria-label') || '').toLowerCase();
                    if (label.includes('facebook') && social.facebook) link.href = social.facebook;
                    if (label.includes('instagram') && social.instagram) link.href = social.instagram;
                    if (label.includes('twitter') && social.twitter) link.href = social.twitter;
                    if (label.includes('youtube') && social.youtube) link.href = social.youtube;
                });
            }
        });

        window.BusinessService.getHours().then(function(hours) {
            if (!hours) return;
            var hoursEls = document.querySelectorAll('[data-hours]');
            hoursEls.forEach(function(el) {
                var key = el.getAttribute('data-hours');
                var hoursValue = hours.opening_hours || hours.hours || hours;
                if (hoursValue && hoursValue[key]) el.textContent = hoursValue[key];
            });
        });
    }

    /**
     * Initialize content loading on DOM ready
     */
    document.addEventListener('DOMContentLoaded', function() {
        populateHero();
        populateGallery();
        populateFAQ();
        populateServiceCards();
        populateMenu();
        populateServices();
        populateTestimonials();
        populateBusinessInfo();
    });
})();