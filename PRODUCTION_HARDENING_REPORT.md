# ZT Lounge Production Hardening Report

**Date:** 2026-08-03
**Scope:** Post-CMS-migration production gaps
**Mode:** Audit + targeted fixes (no destructive migrations)

---

## 1. FILES CHANGED (this phase)

| File | Change |
|------|--------|
| `assets/js/forms.js` | Added Kenyan phone validation, optional email validation, future-date validation, validation-before-loading-state fix |
| `assets/js/repositories/BookingRepository.js` | Added `insert()` (customer + booking) |
| `assets/js/content-loader.js` | In-place menu rendering + dynamic JSON-LD |
| `assets/js/services/BusinessService.js` | Added `social` to `getContact()` |
| `assets/js/repositories/BusinessRepository.js` | Added social fields to `mapToUI()` + `getContact()` |
| `assets/js/repositories/MenuRepository.js` | Fixed to use `menu_categories` table; added `getMenu()` |
| `index.html` + 9 pages | Added `data-hours` attributes; added Supabase/CMS script tags; added `forms.js` to form pages |

## 2. DATABASE CHANGES

| Migration | Status |
|-----------|--------|
| `025_business_settings_reconciliation` | ✅ Applied (added twitter/youtube/city/country/lat/lng; populated data) |
| `026_seed_cms_content` | ✅ Applied (hero, menu, services, gallery, faqs) |
| `027_cms_alignment` | ✅ Applied (service_categories, website_pages, relationships, RLS) |

**No destructive migrations applied.** All changes were additive/idempotent.

## 3. SECURITY FIXES

| Area | Status | Notes |
|------|--------|-------|
| Supabase RLS | ✅ Intact | `business_settings` public-read + admin-manage; `bookings` public-insert restricted to `staff_id IS NULL AND status='pending'` |
| Service role key | ✅ Not exposed | Only anon key in `supabase.config.js`; `.env.local` not in git |
| Public form validation | ✅ Added | Kenyan phone regex, email format, future-date check |
| Rate limiting | ✅ In place | `prevent_public_booking_spam` (max 3 bookings/customer/60min) |
| Duplicate submission | ✅ Prevented | Submit button disabled during async submission |
| XSS | ✅ Safe | content-loader uses `textContent` for FAQ/testimonials; JSON-LD uses `JSON.stringify` |

## 4. REMAINING TECHNICAL DEBT

| # | Debt | Priority | Recommendation |
|---|------|----------|----------------|
| 1 | Inline JS/CSS duplicated on every page (~700 lines/page) | Medium | Extract to external `navigation.js`/`theme.js`/`slider.js` + `sections/*.css` |
| 2 | Static HTML values remain as fallbacks | Low | Intentional — progressive enhancement; keep |
| 3 | No testimonials section on frontend | Low | Add a testimonials container for `populateTestimonials()` |
| 4 | `service_categories` has 1 leftover "Hair Styling" row | Low | Safe to delete (not referenced by any service) |
| 5 | Image strategy (local vs Storage) undecided | Medium | Document decision (see Phase 3) |
| 6 | No CSP meta tag | Medium | Add CSP header/meta for XSS defense-in-depth |
| 7 | `website_pages` seeded but page_id not set on gallery/faqs | Low | Optional FK linking for admin page-scoping |
| 8 | No `maxlength` on form inputs | Low | Add to prevent oversized payloads |

## 5. PRODUCTION READINESS SCORE

| Category | Score |
|----------|-------|
| Database design | 8/10 |
| CMS integration | 8/10 |
| Security | 8/10 |
| SEO | 7/10 |
| Frontend architecture | 7/10 |
| **Overall** | **7.7/10** |

## 6. DEPLOYMENT CHECKLIST

### Pre-deploy
- [ ] Verify `supabase.config.js` anon key matches live project (`jczwilrysvnhcjzjztbi`)
- [ ] Confirm `.env.local` is NOT committed (gitignored)
- [ ] Run `findstr /s /m "service_role" *.js` — should return nothing
- [ ] Verify all 3 migrations (025/026/027) applied to live DB

### Post-deploy
- [ ] Load homepage — hero slides render from DB
- [ ] Load restaurant-menu — menu items render from DB
- [ ] Load gallery — 14 images render from DB
- [ ] Load contact — FAQs + business info render from DB
- [ ] Submit a test booking — appears in `bookings` table (status `pending`)
- [ ] Submit a test contact message — appears in `contact_messages`
- [ ] Verify admin dashboard can edit business_settings, menu, services, gallery, faqs, testimonials
- [ ] Verify admin edits reflect on public site (cache TTL 5 min)

### Monitoring
- [ ] Check Supabase logs for RLS violations
- [ ] Monitor `bookings` for spam (rate limit active)
- [ ] Verify no console errors on any page

---

*Report complete. No destructive migrations applied. All changes are additive and reversible.*