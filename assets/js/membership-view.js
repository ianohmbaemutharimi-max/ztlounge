/**
 * ZT Lounge Membership View
 *
 * Homepage membership teaser renderer with local modal interaction.
 * Plan content comes from MembershipRepository/Supabase; this file owns
 * presentation only.
 */
window.MembershipView = (function() {
    'use strict';

    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function cfg() { return window.MembershipConfig || {}; }

    function money(value) {
        var number = Number(value);
        if (!isFinite(number) || number < 0) return '';
        return (cfg().currency || 'KSh') + ' ' +
            number.toLocaleString(cfg().currencyLocale || 'en-KE');
    }

    function safeExternalHref(raw) {
        if (raw === null || raw === undefined) return '';
        var value = String(raw).trim();
        if (!value) return '';
        if (/^tel:\+?[0-9().\-\s]+$/i.test(value)) return value;
        if (!/^https:\/\//i.test(value)) return '';
        try {
            var parsed = new URL(value);
            return parsed.protocol === 'https:' && parsed.hostname ? value : '';
        } catch (error) { return ''; }
    }

    function businessData() {
        if (window.BusinessConfig) return Promise.resolve(window.BusinessConfig);
        if (window.BusinessService && typeof window.BusinessService.getBusiness === 'function') {
            return window.BusinessService.getBusiness().catch(function() { return null; });
        }
        return Promise.resolve(null);
    }

    function whatsappBase(business) {
        if (!business) return '';
        var raw = (business.social && business.social.whatsapp) ||
            business.whatsapp || business.phoneRaw || business.phone || '';
        if (!raw) return '';
        var external = safeExternalHref(raw);
        if (external && /^https:\/\//i.test(external)) return external.replace(/\/$/, '');
        var digits = String(raw).replace(/\D/g, '');
        return digits ? 'https://wa.me/' + digits : '';
    }

    function enquiryHref(plan, business) {
        var configured = safeExternalHref(plan.cta_link);
        if (configured) return configured;
        var base = whatsappBase(business);
        return base ? base + '?text=' + encodeURIComponent(
            'Hello, I would like to enquire about the ' + (plan.name || 'membership') + ' plan.'
        ) : '';
    }

    function teaserCta() {
        return '<button type="button" class="zt-member-cta-secondary" data-membership-modal-trigger>View Details</button>';
    }

    function fullModeCta(plan, business) {
        var href = enquiryHref(plan, business);
        var text = plan.cta_text || cfg().ctaFallbackText || 'Enquire now';
        return href
            ? '<a class="zt-member-cta-primary" href="' + esc(href) +
                '" target="_blank" rel="noopener noreferrer">' + esc(text) + '</a>'
            : '';
    }

    function benefitsHTML(benefits) {
        if (!benefits || !benefits.length) return '';
        var items = benefits.map(function(b) {
            return '<li>' + esc(b.description || '') + '</li>';
        }).join('');
        return '<ul class="zt-member-benefits">' + items + '</ul>';
    }

    function tierIcon(tier) {
        var icons = {
            'bronze': '🥉',
            'silver': '🥈',
            'gold': '🥇',
            'platinum': '💎'
        };
        return icons[tier] || '';
    }

    function cardHTML(plan, full, business) {
        var price = money(plan.annual_price);
        var tier = plan.slug || 'neutral';
        var image = plan.image_url
            ? '<img class="zt-member-image" src="' + esc(plan.image_url) + '" alt="' + esc(plan.name || plan.slug) + ' membership" loading="lazy" decoding="async">'
            : '';
        
        var icon = tierIcon(tier);
        return '<article class="zt-member-card" data-tier="' + esc(tier) + '">' +
            image +
            '<div class="zt-member-card-header">' +
                '<h3 class="zt-member-card-title">' + esc(plan.name || '') + '</h3>' +
                (icon ? '<span class="zt-member-tier-icon">' + icon + '</span>' : '') +
            '</div>' +
            '<div class="zt-member-card-body">' +
                (price ? '<div class="zt-member-price-value">' + esc(price) + '</div><div class="zt-member-price-label">Annual</div>' : '') +
                (full ? (benefitsHTML(plan.benefits) + fullModeCta(plan, business)) : teaserCta()) +
            '</div>' +
        '</article>';
    }

    function bannerHTML(summary) {
        if (!summary || summary.fee === null || summary.fee === undefined) return '';
        var note = summary.consistent ? cfg().feeNote : cfg().feeNoteMixed;
        return '<b>Registration Fee: ' + esc(money(summary.fee)) + '</b>' +
            '<span> &middot; ' + esc(note || '') + '</span>';
    }

function createModal(plan, summary, business) {
        plan = plan || {};
        var modal = document.createElement('div');
        modal.id = 'membership-modal';
        modal.className = 'membership-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'membership-modal-title');
        modal.setAttribute('aria-modal', 'true');
        var title = plan.name ? esc(plan.name) + ' Membership' : 'ZT Lounge Membership';
        var image = plan.image_url
            ? '<img class="zt-member-modal-image" src="' + esc(plan.image_url) + '" alt="' + esc(plan.name || 'membership card') + '">'
            : '';
        var price = money(plan.annual_price);
        var period = cfg().pricePeriodLabel || 'per year';
        var regFee = money(plan.registration_fee);
        modal.innerHTML =
            '<div class="membership-modal-overlay" data-membership-modal-close></div>' +
            '<div class="membership-modal-content">' +
                '<button type="button" class="membership-modal-close" data-membership-modal-close aria-label="Close">&times;</button>' +
                '<h2 id="membership-modal-title">' + title + '</h2>' +
                '<div class="membership-modal-body">' +
                    image +
                    '<p><strong>Membership:</strong> ' + esc(plan.name || '') + '</p>' +
                    (price ? '<p><strong>Annual price:</strong> ' + esc(price) + ' <small>(' + esc(period) + ')</small></p>' : '') +
                    '<p><strong>Registration fee:</strong> ' + esc(regFee) + '</p>' +
                    (plan.description ? '<p>' + esc(plan.description) + '</p>' : '') +
                    '<h3 class="zt-member-benefits-title">Membership Privileges</h3>' +
                    benefitsHTML(plan.benefits) +
                    fullModeCta(plan, business) +
                    '<p>Contact ZT Lounge for membership registration and current benefits:</p>' +
                    '<ul class="membership-modal-contact">' +
                        '<li><i class="fas fa-phone"></i> <a href="tel:254143542601">+254 143 542 601</a></li>' +
                        '<li><i class="fab fa-whatsapp"></i> <a href="' + (whatsappBase(business) || 'https://wa.me/254143542601') + '?text=' + encodeURIComponent('Hello, I would like to enquire about the ' + (plan.name || 'membership') + ' plan.') + '" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>' +
                        '<li><i class="fas fa-envelope"></i> <a href="mailto:ztloungemeru@gmail.com">ztloungemeru@gmail.com</a></li>' +
                    '</ul>' +
                '</div>' +
            '</div>';
        return modal;
    }

    function openModal(plan, summary, business) {
        var existing = document.getElementById('membership-modal');
        if (existing) existing.remove();
        
        var modal = createModal(plan, summary, business);
        document.body.appendChild(modal);
        
        setTimeout(function() {
            modal.classList.add('membership-modal-open');
            var closeBtn = modal.querySelector('.membership-modal-close[data-membership-modal-close]');
            if (closeBtn) closeBtn.focus();
        }, 10);
        
        modal.addEventListener('click', function(e) {
            if (e.target.hasAttribute('data-membership-modal-close') ||
                e.target.closest('[data-membership-modal-close]')) {
                closeModal();
            }
        });
        
        function handleEscape(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        }
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        var modal = document.getElementById('membership-modal');
        if (modal) {
            modal.classList.remove('membership-modal-open');
            setTimeout(function() {
                modal.remove();
                document.body.style.overflow = '';
            }, 300);
        }
    }

    function hideData(scope) {
        var grid = scope || document.querySelector('[data-membership-grid]');
        if (grid) grid.classList.add('zt-member-section-hidden');
        var title = document.querySelector('[data-membership-title]');
        if (title) title.hidden = true;
        var banner = document.getElementById('membership-fee-banner');
        if (banner) { banner.hidden = true; banner.innerHTML = ''; }
        var more = document.getElementById('membership-teaser-more');
        if (more) more.hidden = true;
    }

    function mount(mountEl, plans, summary, business) {
        var full = mountEl.getAttribute('data-membership-mode') === 'full';
        var limit = full ? plans.length : Number(
            mountEl.getAttribute('data-membership-limit') || cfg().teaserLimit || 4
        );
        if (!plans.length) { hideData(mountEl); return; }

        var banner = document.getElementById('membership-fee-banner');
        if (banner) {
            var html = bannerHTML(summary);
            banner.hidden = !html;
            banner.innerHTML = html;
        }
        var title = document.querySelector('[data-membership-title]');
        if (title) title.hidden = false;
        var visible = plans.slice(0, limit);
        mountEl.setAttribute('data-count', String(visible.length));
        mountEl.classList.remove('zt-member-section-hidden');
        mountEl.innerHTML = visible.map(function(plan) {
            return cardHTML(plan, full, business);
        }).join('');

        if (!full) {
            var triggers = mountEl.querySelectorAll('[data-membership-modal-trigger]');
            Array.prototype.forEach.call(triggers, function(trigger, i) {
                trigger.addEventListener('click', function() {
                    openModal(visible[i], summary, business);
                });
            });
            
            var more = document.getElementById('membership-teaser-more');
            if (more) more.hidden = true;
        }
    }

    function init() {
        var mounts = document.querySelectorAll('[data-membership-grid]');
        if (!mounts.length) {
            console.warn('[membership-view] No membership grid mount points found');
            return Promise.resolve();
        }
        if (!window.MembershipRepository) {
            console.error('[membership-view] MembershipRepository is not defined - cannot render membership cards');
            // Don't hide existing mounts - let other scripts handle it
            return Promise.resolve();
        }

        var feePromise = window.MembershipRepository.getFeeSummary
            ? window.MembershipRepository.getFeeSummary() : Promise.resolve(null);

        return Promise.all([
            window.MembershipRepository.getPublicPlans(),
            feePromise,
            businessData()
        ]).then(function(results) {
            var plans = results[0] || [];
            var feeSummary = results[1] || null;
            var business = results[2] || null;

            console.log('[membership-view] Rendering', plans.length, 'plans');

            if (plans.length === 0) {
                // Hide gracefully if no plans (instead of erroring)
                Array.prototype.forEach.call(mounts, function(el) {
                    hideData(el);
                });
                console.log('[membership-view] No active plans found - section hidden');
                return;
            }

            Array.prototype.forEach.call(mounts, function(el) {
                mount(el, plans, feeSummary, business);
            });
        }).catch(function(error) {
            // Log error but DON'T hide the section - let users see the mount points
            console.error('[membership-view] render failed:', error);
            // Only hide if mounts explicitly request it, otherwise leave visible
            // Commented out: Array.prototype.forEach.call(mounts, function(el) { hideData(el); });
            console.warn('[membership-view] Error rendered but section remains visible for debugging');
        });
    }

    return {
        init: init,
        money: money,
        safeExternalHref: safeExternalHref
    };
})();