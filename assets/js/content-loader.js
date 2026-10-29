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
        if (path.includes('restaurant-menu')) return 'restaurant-menu';
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

    function isCanonicalMediaUrl(url) {
        return !!(url && window.MediaResolver &&
            typeof window.MediaResolver.isCanonicalPublicUrl === 'function' &&
            window.MediaResolver.isCanonicalPublicUrl(url));
    }

    function applyCanonicalImage(img, url, alt) {
        if (!img) return;
        var wrapper = img.parentElement && img.parentElement.tagName.toLowerCase() === 'picture'
            ? img.parentElement.parentElement
            : img.parentElement;
        var placeholder = null;
        if (wrapper) {
            for (var i = 0; i < wrapper.children.length; i++) {
                if (wrapper.children[i].classList && wrapper.children[i].classList.contains('zt-media-missing')) {
                    placeholder = wrapper.children[i];
                    break;
                }
            }
        }
        if (isCanonicalMediaUrl(url)) {
            img.src = url;
            img.alt = alt || img.alt || 'Image';
            img.style.display = '';
            img.setAttribute('data-media-status', 'resolved');
            if (placeholder) placeholder.remove();
            return;
        }

        img.removeAttribute('src');
        img.removeAttribute('srcset');
        img.alt = alt ? alt + ' image unavailable' : 'Image unavailable';
        img.style.display = 'none';
        img.setAttribute('data-media-status', 'missing');
        if (wrapper && !placeholder) {
            placeholder = document.createElement('span');
            placeholder.className = 'zt-media-missing';
            placeholder.setAttribute('role', 'status');
            placeholder.textContent = 'Image unavailable';
            placeholder.style.cssText = 'display:flex;align-items:center;justify-content:center;min-height:4rem;padding:0.75rem;color:#a8a29e;background:rgba(28,25,23,.75);font-size:12px;text-align:center;';
            if (img.parentElement === wrapper) {
                img.insertAdjacentElement('afterend', placeholder);
            } else {
                wrapper.appendChild(placeholder);
            }
        } else if (placeholder) {
            placeholder.hidden = false;
            placeholder.style.display = 'flex';
        }
    }

    function clearContainerImages(container) {
        if (!container) return;
        container.querySelectorAll('img').forEach(function(img) {
            applyCanonicalImage(img, null, img.alt || 'Content');
        });
        container.querySelectorAll('[style*="background-image"]').forEach(function(element) {
            element.style.backgroundImage = 'none';
            element.setAttribute('data-media-status', 'missing');
        });
    }

    function applyCanonicalBackground(element, url) {
        if (!element) return;
        var existing = element.querySelector(':scope > .zt-media-missing');
        if (isCanonicalMediaUrl(url)) {
            element.style.backgroundImage = 'url("' + url.replace(/"/g, '%22') + '")';
            element.setAttribute('data-media-status', 'resolved');
            if (existing) existing.remove();
            return;
        }
        element.style.backgroundImage = 'none';
        element.setAttribute('data-media-status', 'missing');
        if (!existing) {
            existing = document.createElement('span');
            existing.className = 'zt-media-missing';
            existing.setAttribute('role', 'status');
            existing.textContent = 'Hero image unavailable';
            existing.style.cssText = 'position:absolute;left:1rem;bottom:1rem;z-index:2;padding:.5rem .75rem;background:rgba(28,25,23,.8);color:#d6d3d1;font-size:12px;';
            element.appendChild(existing);
        }
    }

    /**
     * Populate hero section from HeroRepository (Supabase-first)
     */
    function populateHero() {
        var pageId = getPageId();
        var heroContainer = document.querySelector('.hero-slider, .hero-section, #hero');
        if (!window.HeroRepository) {
            clearContainerImages(heroContainer);
            document.querySelectorAll('.hero-slide').forEach(function(slide) { applyCanonicalBackground(slide, null); });
            return;
        }

        window.HeroRepository.getByPage(pageId).then(function(heroData) {
            if (!heroData || !Array.isArray(heroData.slides) || heroData.slides.length === 0) {
                document.querySelectorAll('.hero-slide').forEach(function(slide) { applyCanonicalBackground(slide, null); });
                return;
            }

            heroData.slides.forEach(function(slide, index) {
                var slideEl = document.querySelector('.hero-slide[data-index="' + index + '"], #hero-slide-' + index);
                if (!slideEl) return;
                applyCanonicalBackground(slideEl, slide.image_url);

                var badgeEl = slideEl.querySelector('.hero-badge');
                if (badgeEl && slide.badge) badgeEl.textContent = slide.badge;

                var titleEl = slideEl.querySelector('.hero-title');
                if (titleEl && slide.title) {
                    var html = slide.title;
                    if (slide.highlight) html = slide.title + ' <span>' + slide.highlight + '</span>';
                    titleEl.innerHTML = html;
                }

                var subtitleEl = slideEl.querySelector('.hero-subtitle');
                if (subtitleEl && slide.subtitle) subtitleEl.textContent = slide.subtitle;

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
        }).catch(function(error) {
            console.error('[ContentLoader] Canonical hero media failed:', error.message);
            document.querySelectorAll('.hero-slide').forEach(function(slide) { applyCanonicalBackground(slide, null); });
        });
    }

    function populateGallery() {
        var pageId = getPageId();
        var grid = document.querySelector('.gallery-grid, .gallery-section') || (document.querySelector('.grid-item') && document.querySelector('.grid-item').parentElement);
        if (!window.GalleryRepository) {
            clearContainerImages(grid);
            return;
        }

        window.GalleryRepository.getByPage(pageId).then(function(galleryData) {
            var items = galleryData && Array.isArray(galleryData.items) ? galleryData.items : [];
            if (!items.length) {
                clearContainerImages(grid);
                return;
            }

            items.forEach(function(item, index) {
                var gridItem = document.querySelector('.grid-item[data-index="' + index + '"]');
                if (!gridItem) return;
                var img = gridItem.querySelector('img');
                if (img) applyCanonicalImage(img, item.image_url, item.alt_text || item.label || item.title);
                var overlay = gridItem.querySelector('.overlay');
                if (overlay) {
                    var h4 = overlay.querySelector('h4');
                    var span = overlay.querySelector('span');
                    if (h4 && item.label) h4.textContent = item.label;
                    if (span && item.caption) span.textContent = item.caption;
                }
            });
        }).catch(function(error) {
            console.error('[ContentLoader] Canonical gallery media failed:', error.message);
            clearContainerImages(grid);
        });
    }

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
        var pageId = getPageId();
        var grid = document.querySelector('.service-cards-grid');
        if (!grid) return;
        if (!window.ServicesRepository) {
            clearContainerImages(grid);
            return;
        }

        window.ServicesRepository.getByPage(pageId).then(function(servicesData) {
            var services = servicesData && Array.isArray(servicesData.services) ? servicesData.services : [];
            var cards = grid.querySelectorAll('.service-card');
            if (!services.length) {
                clearContainerImages(grid);
                return;
            }

            services.forEach(function(service, index) {
                var card = null;
                if (service.href) card = grid.querySelector('.service-card[href="' + service.href + '"]');
                if (!card) card = cards[index];
                if (!card) return;

                var img = card.querySelector('.card-image');
                if (img) applyCanonicalImage(img, service.image_url, service.alt_text || service.name);

                var tag = card.querySelector('.card-tag');
                if (tag && service.tag) tag.textContent = '\u2726 ' + service.tag;
                var h3 = card.querySelector('h3');
                if (h3 && service.name) h3.textContent = service.name;
                var p = card.querySelector('p');
                if (p && service.description) p.textContent = service.description;
            });
        }).catch(function(error) {
            console.error('[ContentLoader] Canonical service media failed:', error.message);
            clearContainerImages(grid);
        });
    }

    function populateMenu() {
        var menuContainer = document.querySelector('.menu-section, .menu-grid, .menu-categories');
        if (!window.MenuRepository) {
            clearContainerImages(menuContainer);
            return;
        }

        window.MenuRepository.getMenu().then(function(menuData) {
            if (!menuData || !Array.isArray(menuData.categories) || !menuData.categories.length) {
                clearContainerImages(menuContainer);
                return;
            }

            var categories = document.querySelectorAll('.menu-category');
            if (!categories || categories.length === 0) return;

            menuData.categories.forEach(function(category) {
                var catName = (category.name || '').toLowerCase();
                var catSection = null;
                categories.forEach(function(sec) {
                    var heading = sec.querySelector('.menu-category-title');
                    var headingText = heading ? heading.textContent.toLowerCase() : '';
                    if (headingText.indexOf(catName) !== -1) catSection = sec;
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
                    if (priceTag && item.price) priceTag.textContent = 'KES ' + Number(item.price).toLocaleString();
                    var img = card.querySelector('.menu-item-image');
                    if (img) applyCanonicalImage(img, item.image_url, item.alt_text || item.name);
                });
            });
        }).catch(function(error) {
            console.error('[ContentLoader] Canonical menu media failed:', error.message);
            clearContainerImages(menuContainer);
        });
    }

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
        var container = document.querySelector('.testimonials-container, .testimonials-grid, .testimonial-list');
        if (!container) return;
        container.innerHTML = '';

        function showUnavailable() {
            container.innerHTML = '';
            var message = document.createElement('p');
            message.className = 'zt-media-missing';
            message.setAttribute('role', 'status');
            message.textContent = 'Testimonials are temporarily unavailable.';
            container.appendChild(message);
        }

        if (!window.TestimonialsRepository) {
            showUnavailable();
            return;
        }

        window.TestimonialsRepository.getAll().then(function(data) {
            if (!Array.isArray(data) || !data.length) {
                showUnavailable();
                return;
            }

            data.forEach(function(item) {
                var itemEl = document.createElement('div');
                itemEl.className = 'testimonial-item';

                if (item.image_url) {
                    var img = document.createElement('img');
                    img.className = 'testimonial-image';
                    img.loading = 'lazy';
                    applyCanonicalImage(img, item.image_url, item.customer_name || item.author || 'Customer');
                    itemEl.appendChild(img);
                }

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
        }).catch(function(error) {
            console.error('[ContentLoader] Canonical testimonial media failed:', error.message);
            showUnavailable();
        });
    }

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
     * Generate JSON-LD structured data from business_settings
     * Injects LocalBusiness + Restaurant schema dynamically
     */
    function generateJSONLD() {
        if (!window.BusinessService) return;

        window.BusinessService.getBusiness().then(function(biz) {
            if (!biz) return;

            var name = biz.business_name || biz.businessName || 'ZT Lounge Meru';
            var phone = biz.phone || '+254 143 542 601';
            var email = biz.email || 'ztloungemeru@gmail.com';
            var address = biz.address || 'Milimani Road, Meru, Kenya';
            var city = biz.city || 'Meru';
            var country = biz.country || 'Kenya';
            var lat = biz.latitude || 0.0476;
            var lng = biz.longitude || 37.6822;
            var url = 'https://ztlounge.co.ke/';

            // Remove any existing dynamic JSON-LD (keep static ones)
            var existing = document.querySelectorAll('script[data-dynamic-jsonld]');
            existing.forEach(function(s) { s.parentNode.removeChild(s); });

            var schema = {
                "@context": "https://schema.org",
                "@type": "LocalBusiness",
                "name": name,
                "url": url,
                "telephone": phone,
                "email": email,
                "priceRange": "$$$",
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": address,
                    "addressLocality": city,
                    "addressCountry": country
                },
                "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": lat,
                    "longitude": lng
                }
            };

            var script = document.createElement('script');
            script.type = 'application/ld+json';
            script.setAttribute('data-dynamic-jsonld', 'true');
            script.textContent = JSON.stringify(schema);
            document.head.appendChild(script);
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
        generateJSONLD();
    });
})();
