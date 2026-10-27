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
     * Handles both:
     * - .gallery-preview-grid (page preview sections - 4 items)
     * - .grid-item[data-index] (full gallery masonry grid)
     */
    function populateGallery() {
        var pageId = getPageId();
        if (!window.GalleryRepository) return;

        window.GalleryRepository.getByPage(pageId).then(function(galleryData) {
            if (!galleryData) return;

            if (galleryData.items && galleryData.items.length > 0) {
                // Populate gallery preview grid (page-specific preview sections)
                var previewGrid = document.querySelector('.gallery-preview-grid');
                if (previewGrid) {
                    // Clear any existing static content
                    previewGrid.innerHTML = '';
                    
                    // Limit to first 4 items for preview sections
                    var previewItems = galleryData.items.slice(0, 4);
                    
                    previewItems.forEach(function(item) {
                        var itemDiv = document.createElement('div');
                        itemDiv.className = 'gallery-preview-item';
                        
                        var img = document.createElement('img');
                        img.src = item.public_url ? window.AssetUrl ? window.AssetUrl.resolve(item.public_url) : item.public_url : '';
                        img.alt = item.alt_text || item.title || '';
                        img.loading = 'lazy';
                        img.decoding = 'async';
                        itemDiv.appendChild(img);
                        
                        if (item.title || item.description) {
                            var overlay = document.createElement('div');
                            overlay.className = 'gallery-preview-overlay';
                            
                            if (item.title) {
                                var h4 = document.createElement('h4');
                                h4.textContent = item.title;
                                overlay.appendChild(h4);
                            }
                            
                            if (item.description) {
                                var span = document.createElement('span');
                                span.textContent = item.description;
                                overlay.appendChild(span);
                            }
                            
                            itemDiv.appendChild(overlay);
                        }
                        
                        previewGrid.appendChild(itemDiv);
                    });
                }

                // Populate full gallery grid (for gallery.html page)
                galleryData.items.forEach(function(item, index) {
                    var gridItem = document.querySelector('.grid-item[data-index="' + index + '"]');
                    if (!gridItem) return;

                    var img = gridItem.querySelector('img');
                    if (img && item.image) {
                        img.src = window.AssetUrl ? window.AssetUrl.resolve(item.image) : item.image;
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
        }).catch(function(error) {
            console.error('Error loading gallery:', error);
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

        var pageId = getPageId();
        var grid = document.querySelector('.service-cards-grid');
        if (!grid) return;

        window.ServicesRepository.getByPage(pageId).then(function(servicesData) {
            if (!servicesData || !servicesData.services || !servicesData.services.length) {
                return;
            }

            var services = servicesData.services;
            var cards = grid.querySelectorAll('.service-card');

            if (cards.length > 0) {
                // Update existing cards in-place (homepage pattern)
                services.forEach(function(service) {
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
            } else {
                // CREATE cards dynamically if grid is empty (homepage with data-service-grid)
                services.forEach(function(service) {
                    var card = document.createElement('a');
                    card.className = 'service-card';
                    card.href = service.href || '#';
                    
                    // Image wrapper
                    var imgWrapper = document.createElement('div');
                    imgWrapper.className = 'card-image-wrapper';
                    
                    var img = document.createElement('img');
                    img.className = 'card-image';
                    img.src = service.image_url;
                    img.alt = service.alt_text || service.name || '';
                    img.loading = 'lazy';
                    
                    imgWrapper.appendChild(img);
                    card.appendChild(imgWrapper);
                    
                    // Content
                    var content = document.createElement('div');
                    content.className = 'card-content';
                    
                    if (service.tag) {
                        var tag = document.createElement('span');
                        tag.className = 'card-tag';
                        tag.textContent = 'âœ¦ ' + service.tag;
                        content.appendChild(tag);
                    }
                    
                    var title = document.createElement('h3');
                    title.textContent = service.name;
                    content.appendChild(title);
                    
                    if (service.description) {
                        var desc = document.createElement('p');
                        desc.textContent = service.description;
                        content.appendChild(desc);
                    }
                    
                    card.appendChild(content);
                    grid.appendChild(card);
                });
            }
        }).catch(function(err) {
            console.error('[content-loader] populateServiceCards failed:', err);
        });
    }

    /**
     * Populate menu from MenuRepository (Supabase-first)
     * Updates in-place .menu-item-card elements to preserve visual design.
     * Matches DB category name to existing .menu-category section headings.
     */
    function createMenuCategorySection(cat) {
        var slug = cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'category';
        var title = cat.name || 'Unnamed Category';

        var section = document.createElement('section');
        section.className = 'menu-category';
        section.id = slug;

        var titleElem = document.createElement('h2');
        titleElem.className = 'menu-category-title';
        titleElem.textContent = title;

        var divider = document.createElement('div');
        divider.className = 'menu-category-divider';

        var grid = document.createElement('div');
        grid.className = 'menu-items-grid';

        section.appendChild(titleElem);
        section.appendChild(divider);
        section.appendChild(grid);

        return section;
    }

    function populateMenu() {
        if (!window.MenuRepository) return;

        window.MenuRepository.getMenu().then(function(menuData) {
            if (!menuData || !menuData.categories || !menuData.categories.length) return;

            var existingSections = document.querySelectorAll('.menu-category');
            var hasExistingStructure = existingSections && existingSections.length > 0;

            // Build a map of category name (lowercase) -> section for matching
            var sectionMap = {};
            if (hasExistingStructure) {
                existingSections.forEach(function(sec) {
                    var heading = sec.querySelector('.menu-category-title');
                    if (heading) {
                        var headingText = heading.textContent.toLowerCase();
                        sectionMap[headingText] = sec;
                    }
                });
            }

            menuData.categories.forEach(function(category) {
                var catName = (category.name || '').toLowerCase();
                var catSection = null;

                // Try to find matching existing section first
                if (hasExistingStructure) {
                    var exactMatch = sectionMap[catName];
                    if (exactMatch) {
                        catSection = exactMatch;
                    } else {
                        // Check if any existing section title contains the category name
                        existingSections.forEach(function(sec) {
                            var heading = sec.querySelector('.menu-category-title');
                            if (heading) {
                                var headingText = heading.textContent.toLowerCase();
                                if (headingText.indexOf(catName) !== -1) {
                                    catSection = sec;
                                }
                            }
                        });
                    }
                }

                // If no existing section found, create one dynamically
                if (!catSection) {
                    catSection = createMenuCategorySection(category);
                    // Insert into the page before or after menu container
                    var menuRoot = document.querySelector('[data-menu-root]');
                    if (menuRoot && menuRoot.parentNode) {
                        // Insert after the menu-root div if there's sibling content, otherwise at end
                        var nextNode = menuRoot.nextSibling;
                        if (nextNode && nextNode.nodeType === 1) {
                            menuRoot.parentNode.insertBefore(catSection, nextNode);
                        } else {
                            menuRoot.parentNode.appendChild(catSection);
                        }
                    } else {
                        // Fallback: append to body
                        document.body.appendChild(catSection);
                    }
                }

                var cards = catSection.querySelectorAll('.menu-item-card');
                var items = category.items || [];

                items.forEach(function(item, index) {
                    var card = cards[index];
                    if (!card) {
                        // Create card if it doesn't exist
                        card = document.createElement('div');
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
                        catSection.querySelector('.menu-items-grid').appendChild(card);
                    }

                    var h3 = card.querySelector('h3');
                    if (h3 && item.name) h3.textContent = item.name;

                    var p = card.querySelector('p');
                    if (p && item.description) p.textContent = item.description;

                    var priceTag = card.querySelector('.price-tag');
                    if (priceTag && item.price) {
                        priceTag.textContent = 'KES ' + Number(item.price).toLocaleString();
                    }

                    var img = card.querySelector('.menu-item-image');
                    if (img && item.public_url) {
                        img.src = window.AssetUrl ? window.AssetUrl.resolve(item.public_url) : item.public_url;
                    }
                });
            });
        });
    }

    /**
     * Populate category-based service grids from ServicesRepository (Supabase-first)
     * Discovers all [data-category-grid] containers and populates them by category slug
     */
    function populateServiceCardsByCategory() {
        if (!window.ServicesRepository || !window.ServicesRepository.getByCategory) return;

        var pageId = getPageId();
        var categoryGrids = document.querySelectorAll('[data-category-grid]');
        if (!categoryGrids || categoryGrids.length === 0) return;

        // Get page UUID for filtering
        var pageUuidPromise = window.PageResolver && window.PageResolver.requirePageUuid
            ? window.PageResolver.requirePageUuid(pageId)
            : Promise.resolve(null);

        pageUuidPromise.then(function(pageUuid) {
            categoryGrids.forEach(function(grid) {
                var categorySlug = grid.getAttribute('data-category-slug');
                if (!categorySlug) return;

                window.ServicesRepository.getByCategory(categorySlug).then(function(services) {
                    // Filter by page UUID if available (some services span multiple pages)
                    var filteredServices = services;
                    if (pageUuid) {
                        filteredServices = services.filter(function(s) {
                            return !s.page_id || s.page_id === pageUuid;
                        });
                    }

                    // Toggle empty state visibility
                    var emptyState = document.querySelector('[data-category-empty][data-category-slug="' + categorySlug + '"]');
                    if (filteredServices.length === 0) {
                        grid.style.display = 'none';
                        if (emptyState) emptyState.style.display = 'block';
                        return;
                    }

                    // Hide empty state and show grid
                    if (emptyState) emptyState.style.display = 'none';
                    grid.style.display = 'grid';
                    grid.innerHTML = ''; // Clear any placeholder content

                    // Create service cards
                    filteredServices.forEach(function(service) {
                        var card = document.createElement('a');
                        card.className = 'service-card';
                        card.href = service.href || '#';

                        // Card image
                        if (service.image_url) {
                            var img = document.createElement('img');
                            img.src = window.AssetUrl ? window.AssetUrl.resolve(service.image_url) : service.image_url;
                            img.alt = service.alt_text || service.name || '';
                            img.className = 'card-image';
                            img.loading = 'lazy';
                            img.decoding = 'async';
                            card.appendChild(img);
                        }

                        // Card content
                        var content = document.createElement('div');
                        content.className = 'card-content';

                        // Tag (optional)
                        if (service.tag) {
                            var tag = document.createElement('span');
                            tag.className = 'card-tag';
                            tag.textContent = 'âœ¦ ' + service.tag;
                            content.appendChild(tag);
                        }

                        // Title
                        var title = document.createElement('h3');
                        title.textContent = service.name || '';
                        content.appendChild(title);

                        // Description
                        if (service.description) {
                            var desc = document.createElement('p');
                            desc.textContent = service.description;
                            content.appendChild(desc);
                        }

                        card.appendChild(content);
                        grid.appendChild(card);
                    });
                }).catch(function(err) {
                    console.error('[content-loader] Failed to load category services:', categorySlug, err);
                });
            });
        }).catch(function(err) {
            console.warn('[content-loader] Page UUID resolution failed, loading all category services:', err);
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

            // Check if container has actual content (not just comments)
            var hasContent = false;
            for (var i = 0; i < container.children.length; i++) {
                if (container.children[i].nodeType === 1) { // Element node
                    hasContent = true;
                    break;
                }
            }
            if (hasContent) return; // Skip if already populated

            // Clear any comments or text nodes
            container.innerHTML = '';

            data.forEach(function(item) {
                var itemEl = document.createElement('div');
                itemEl.className = 'testimonial-card'; // Match homepage styling

                // Create star rating
                var stars = document.createElement('div');
                stars.className = 'stars';
                stars.setAttribute('aria-hidden', 'true');
                var rating = item.rating || 5;
                for (var j = 0; j < rating; j++) {
                    var star = document.createElement('i');
                    star.className = 'fas fa-star';
                    stars.appendChild(star);
                }
                itemEl.appendChild(stars);

                // Create quote paragraph
                var quote = document.createElement('p');
                quote.textContent = '"' + (item.comment || item.content || item.text || item.review || '') + '"';
                itemEl.appendChild(quote);

                // Create author section
                var author = document.createElement('div');
                author.className = 'author';
                var authorName = item.customer_name || item.author || 'Anonymous';
                var authorRole = item.occupation || item.role || item.title || '';
                author.innerHTML = 'â€” ' + authorName + (authorRole ? ', <span>' + authorRole + '</span>' : '');
                itemEl.appendChild(author);

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
            var url = 'https://ztlounge.com/';

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
        // Wait for Supabase client to be ready before populating service cards
        function waitForSupabase() {
            var supabaseReady = window.supabase && window.SupabaseConfig;
            if (supabaseReady) {
                populateServiceCards();
                populateServiceCardsByCategory(); // Populate [data-category-grid] containers
            } else {
                setTimeout(waitForSupabase, 200);
            }
        }
        waitForSupabase();
        populateMenu();
        populateServices();
        populateTestimonials();
        populateBusinessInfo();
        generateJSONLD();
        populateMembershipPackages();
        populateSEO();
        populateFeatures();
    });

    /**
     * Populate page <title> and <meta description> from SEORepository (Supabase page_seo table).
     * Falls back to static seo.config.js if Supabase is unavailable.
     */
    function populateSEO() {
        if (!window.SEORepository) return;

        var pageId = getPageId();

        window.SEORepository.getByPage(pageId).then(function(seo) {
            // Update <title>
            if (seo.title) {
                var titleEl = document.querySelector('title');
                if (titleEl) {
                    titleEl.textContent = seo.title;
                }
            }

            // Update <meta name="description">
            if (seo.description) {
                var descEl = document.querySelector('meta[name="description"]');
                if (descEl) {
                    descEl.setAttribute('content', seo.description);
                }
            }
        }).catch(function(err) {
            console.warn('[content-loader] populateSEO failed:', err.message);
        });
    }

    /**
     * Populate feature card sections from FeaturesRepository (Supabase page_features table).
     * Targets elements with data-feature-grid and data-page attributes.
     */
    function populateFeatures() {
        if (!window.FeaturesRepository) return;

        var pageId = getPageId();
        var featureGrids = document.querySelectorAll('[data-feature-grid]');
        if (!featureGrids || featureGrids.length === 0) return;

        featureGrids.forEach(function(grid) {
            var gridPageId = grid.getAttribute('data-page') || pageId;

            window.FeaturesRepository.getByPage(gridPageId).then(function(features) {
                if (!features || features.length === 0) return;

                grid.innerHTML = '';

                features.forEach(function(feature) {
                    var card = document.createElement('div');
                    card.className = 'feature-card';

                    var icon = document.createElement('i');
                    icon.className = feature.icon + ' feature-icon';
                    card.appendChild(icon);

                    var title = document.createElement('h3');
                    title.className = 'feature-title';
                    title.textContent = feature.title;
                    card.appendChild(title);

                    var desc = document.createElement('p');
                    desc.className = 'feature-description';
                    desc.textContent = feature.description;
                    card.appendChild(desc);

                    grid.appendChild(card);
                });
            }).catch(function(err) {
                console.warn('[content-loader] populateFeatures failed:', err.message);
            });
        });
    }
})();

/**
 * Populate membership packages from MembershipRepository (Supabase-first).
 * Targets #membership-fee-banner and [data-membership-grid] on homepage only.
 */
function populateMembershipPackages() {
    if (!window.MembershipRepository) return;

    var pageId = getPageId();
    if (pageId !== 'home') return; // Homepage only

    var grid = document.querySelector('[data-membership-grid]');
    var feeBanner = document.getElementById('membership-fee-banner');
    if (!grid && !feeBanner) return;

    // Populate fee banner
    window.MembershipRepository.getFeeSummary().then(function(feeSummary) {
        if (feeBanner && feeSummary.fee !== null && feeSummary.fee !== undefined) {
            var currency = window.MembershipConfig ? window.MembershipConfig.currency : 'KSh';
            var locale = window.MembershipConfig ? window.MembershipConfig.currencyLocale : 'en-KE';
            var formattedFee = new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currency.replace('KSh', 'KES')
            }).format(feeSummary.fee);
            feeBanner.innerHTML = '<strong>One-time registration fee: ' + formattedFee + '</strong> ' +
                (window.MembershipConfig ? window.MembershipConfig.feeNote : 'applies to all membership levels');
        }
    }).catch(function(err) {
        console.warn('[content-loader] Failed to load membership fee summary:', err);
    });

    // Populate membership grid
    window.MembershipRepository.getPublicPlans().then(function(plans) {
        if (!plans || !plans.length) return;

        var teaserLimit = window.MembershipConfig ? window.MembershipConfig.teaserLimit : 4;
        var displayPlans = plans.slice(0, teaserLimit);

        grid.innerHTML = ''; // Clear placeholder

        displayPlans.forEach(function(plan) {
            var card = document.createElement('div');
            card.className = 'membership-plan-card';
            card.setAttribute('data-tier', plan.slug || '');

            if (plan.is_featured) {
                card.classList.add('featured');
            }

            // Featured badge
            if (plan.is_featured) {
                var badge = document.createElement('span');
                badge.className = 'membership-plan-badge';
                badge.textContent = 'FEATURED';
                card.appendChild(badge);
            }

            // Header section
            var header = document.createElement('div');
            header.className = 'membership-plan-header';

            var tier = document.createElement('span');
            tier.className = 'membership-plan-tier';
            tier.textContent = (plan.name || '').toUpperCase();
            header.appendChild(tier);

            var name = document.createElement('h3');
            name.className = 'membership-plan-name';
            name.textContent = plan.name || '';
            header.appendChild(name);

            card.appendChild(header);

            // Price section
            var price = document.createElement('div');
            price.className = 'membership-plan-price';

            var amount = document.createElement('span');
            amount.className = 'price-amount';
            var currency = window.MembershipConfig ? window.MembershipConfig.currency : 'KSh';
            var locale = window.MembershipConfig ? window.MembershipConfig.currencyLocale : 'en-KE';
            var formattedPrice = new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currency.replace('KSh', 'KES')
            }).format(plan.annual_price || 0);
            amount.textContent = formattedPrice;
            price.appendChild(amount);

            var period = document.createElement('span');
            period.className = 'price-period';
            period.textContent = window.MembershipConfig ? window.MembershipConfig.pricePeriodLabel : 'per year';
            price.appendChild(period);

            card.appendChild(price);

            // Registration fee
            if (plan.registration_fee) {
                var fee = document.createElement('p');
                fee.className = 'membership-plan-registration-fee';
                var formattedRegFee = new Intl.NumberFormat(locale, {
                    style: 'currency',
                    currency: currency.replace('KSh', 'KES')
                }).format(plan.registration_fee);
                fee.textContent = '+ ' + formattedRegFee + ' registration fee';
                card.appendChild(fee);
            }

            // Description
            if (plan.description) {
                var desc = document.createElement('p');
                desc.className = 'membership-plan-description';
                desc.textContent = plan.description;
                card.appendChild(desc);
            }

            // Benefits
            var benefits = document.createElement('div');
            benefits.className = 'membership-plan-benefits';

            var benefitsTitle = document.createElement('h4');
            benefitsTitle.textContent = 'Key Benefits';
            benefits.appendChild(benefitsTitle);

            var benefitsList = document.createElement('ul');
            (plan.benefits || []).forEach(function(benefit) {
                var li = document.createElement('li');
                li.textContent = benefit.description || '';
                benefitsList.appendChild(li);
            });
            benefits.appendChild(benefitsList);

            card.appendChild(benefits);

            // CTA
            var cta = document.createElement('div');
            cta.className = 'membership-plan-cta';

            var btn = document.createElement('a');
            btn.className = 'btn btn-primary btn-large';
            btn.href = plan.cta_link || '/membership';
            btn.textContent = plan.cta_text || (window.MembershipConfig ? window.MembershipConfig.ctaFallbackText : 'Enquire now');
            cta.appendChild(btn);

            card.appendChild(cta);

            grid.appendChild(card);
        });
    }).catch(function(err) {
        console.error('[content-loader] Failed to load membership plans:', err);
    });
}

    /**
     * Populate services by category (for grooming-care, conference, events pages)
     * Targets elements with data-category-grid and data-category-slug attributes
     */
    function populateServicesByCategory() {
        if (!window.ServicesRepository) return;

        var categoryGrids = document.querySelectorAll('[data-category-grid][data-category-slug]');
        if (!categoryGrids || categoryGrids.length === 0) return;

        categoryGrids.forEach(function(grid) {
            var categorySlug = grid.getAttribute('data-category-slug');
            if (!categorySlug) return;

            // Hide empty state initially
            var emptyState = document.querySelector('[data-category-empty][data-category-slug="' + categorySlug + '"]');
            if (emptyState) {
                emptyState.style.display = 'none';
            }

            window.ServicesRepository.getByCategory(categorySlug).then(function(services) {
                if (!services || services.length === 0) {
                    // Show empty state if no services
                    if (emptyState) {
                        emptyState.style.display = 'block';
                    }
                    return;
                }

                // Clear grid and populate with services
                grid.innerHTML = '';

                services.forEach(function(service) {
                    var card = document.createElement('div');
                    card.className = 'service-card';

                    // Icon
                    if (service.icon) {
                        var iconDiv = document.createElement('div');
                        iconDiv.className = 'service-icon';
                        var icon = document.createElement('i');
                        icon.className = service.icon;
                        iconDiv.appendChild(icon);
                        card.appendChild(iconDiv);
                    }

                    // Title
                    var title = document.createElement('h3');
                    title.className = 'service-title';
                    title.textContent = service.name || '';
                    card.appendChild(title);

                    // Description
                    if (service.description) {
                        var desc = document.createElement('p');
                        desc.className = 'service-description';
                        desc.textContent = service.description;
                        card.appendChild(desc);
                    }

                    // Price
                    if (service.price && parseFloat(service.price) > 0) {
                        var priceDiv = document.createElement('div');
                        priceDiv.className = 'service-price';
                        priceDiv.textContent = 'From KSh ' + parseFloat(service.price).toLocaleString();
                        card.appendChild(priceDiv);
                    }

                    grid.appendChild(card);
                });

                // Keep empty state hidden if we have services
                if (emptyState) {
                    emptyState.style.display = 'none';
                }

            }).catch(function(err) {
                console.error('[content-loader] Failed to load services for category:', categorySlug, err);
                // Show empty state on error
                if (emptyState) {
                    emptyState.style.display = 'block';
                }
            });
        });
    }

    /**
     * Initialize all content loaders on page load
     */

    /**  
     * Populate package cards from pricing_packages table
     * Targets elements with data-membership-grid and id="package-pricing-grid"
     */
    function populatePackageCards() {
        if (!window.PackageRepository) return;

        var grids = document.querySelectorAll('[data-membership-grid]');
        if (!grids || grids.length === 0) return;

        grids.forEach(function(grid) {
            var pageId = getPageId();

            window.PackageRepository.getByPage(pageId).then(function(packages) {
                if (!packages || packages.length === 0) {
                    var emptyState = grid.querySelector('[data-empty-state]');
                    if (emptyState) {
                        emptyState.style.display = 'block';
                    }
                    return;
                }

                grid.innerHTML = '';

                packages.forEach(function(pkg) {
                    var card = document.createElement('div');
                    card.className = 'package-card';
                    if (pkg.is_featured) {
                        card.classList.add('featured');
                    }

                    var name = document.createElement('h3');
                    name.className = 'package-name';
                    name.textContent = pkg.package_name || '';
                    card.appendChild(name);

                    if (pkg.description) {
                        var desc = document.createElement('p');
                        desc.className = 'package-description';
                        desc.textContent = pkg.description;
                        card.appendChild(desc);
                    }

                    if (pkg.price_amount > 0) {
                        var priceDiv = document.createElement('div');
                        priceDiv.className = 'package-price';
                        priceDiv.textContent = 'KSh ' + pkg.price_amount.toLocaleString() + ' ' + pkg.price_period;
                        card.appendChild(priceDiv);
                    }

                    if (pkg.is_featured) {
                        var badge = document.createElement('span');
                        badge.className = 'package-badge';
                        badge.textContent = 'FEATURED';
                        card.appendChild(badge);
                    }

                    grid.appendChild(card);
                });

            }).catch(function(err) {
                console.error('[content-loader] Failed to load packages:', err);
            });
        });
    }

    /**  
     * Initialize all content loaders on page load
     */
    function init() {
        populateHero();
        populateGallery();
        populateServiceCards();
        populateServicesByCategory();
        populateMenu();
        populateFAQs();
        populateTestimonials();
        populateMembershipPlans();
        populatePackageCards();

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
