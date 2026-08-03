# ZT LOUNGE ALIGNMENT AUDIT

**Date:** 2026-08-03
**Scope:** zt-lounge-demo (public website) ↔ Supabase CMS ↔ zt-lounge-admin (dashboard)
**Mode:** Audit only — no files modified

---

## 1. EXECUTIVE SUMMARY

The ZT Lounge ecosystem consists of three layers that are **not yet fully aligned**:

1. **Frontend (static HTML + JS):** Rich content, all hardcoded in HTML. Excellent visual design, but business data is scattered across 10 HTML files with duplicated markup.
2. **Supabase Database:** Schema is mostly well-designed (business_settings, hero_slides, menu_items, services, gallery, faqs, testimonials, bookings, contact_messages). However, most tables are empty or contain test data that does not match the website.
3. **Admin Dashboard (Next.js):** Has CRUD config for all CMS resources, but only works if the database is seeded and the website frontend actually reads from Supabase.

**Key finding:** The three layers exist independently. The DB was recently reconciled (migration 025), and a seed migration (026) is ready but **not yet applied** (pending user SQL review). Until the seed is applied and the content-loader frontend selectors are aligned, the website will continue showing hardcoded content.

---

## 2. CRITICAL ISSUES

| # | Issue | Impact | Affected Area |
|---|-------|--------|---------------|
| C1 | **Seed migration 026 not applied** | DB tables (services, menu_items, gallery, faqs, hero_slides) remain empty/test-only; website cannot pull real CMS content | Database / Frontend |
| C2 | **Frontend content-loader selectors mismatch HTML** | `populateGallery()` targets `.grid-item[data-index]`; `populateHero()` targets `.hero-slide[data-index]` — HTML uses IDs + different classes | Frontend JS |
| C3 | **No `orders` table in Supabase** | Audit asked for `orders`; it does not exist. Bookings table is the destination for reservations; admin has no `orders` resource | Database |
| C4 | **business_settings missing twitter/youtube historically** | Now fixed via migration 025 (columns added) | Database ✅ resolved |
| C5 | **website_pages table is empty (0 rows)** | All FK columns (`services.page_id`, `hero_slides.page_id`, `menu_items.page_id`, `gallery.page_id`, `faqs.page_id`) reference a table with no rows → FK inserts will fail if page_id is used | Database |

---

## 3. HIGH PRIORITY ISSUES

| # | Issue | Impact | Recommended Fix |
|---|-------|--------|-----------------|
| H1 | Hardcoded services (6 cards) on index.html + contact.html | Admin service edits don't reflect on website | Populate `services` via seed, fix content-loader selector |
| H2 | Hardcoded hero slides on index.html | Admin hero edits don't reflect | Seed hero_slides; align loader to `.hero-slide[data-index]` or add data-index to HTML |
| H3 | Hardcoded gallery (14 items) on gallery.html | Admin gallery edits don't reflect | Seed gallery; align loader selector (`.grid-item[data-index]` matches gallery.html) |
| H4 | Hardcoded FAQs (5) on contact.html | Admin FAQ edits don't reflect | Seed faqs; align loader to `.faq-item` |
| H5 | Hardcoded menu items in restaurant.html | Admin menu edits don't reflect | Seed menu_items + menu_categories; align loader |
| H6 | Inline scripts (nav/theme/slider) duplicated on every page | Maintenance burden, render blocking | Extract to external `navigation.js`/`theme.js`/`slider.js` |
| H7 | Inline CSS (~400 lines/page) duplicated | Maintenance burden | Move to external `sections/*.css` |
| H8 | Address inconsistency (index.html "Milimani Road" vs restaurant/contact "Opposite Ezri Hotel") | Confusing for customers; SEO inconsistency | Standardize to DB `business_settings.address` = "Milimani Road, Meru, Kenya" |

---

## 4. MEDIUM ISSUES

| # | Issue | Impact | Recommended Fix |
|---|-------|--------|-----------------|
| M1 | Admin `resource-config.ts` references `hero-slides`, `menu-items`, `services` etc. — these exist, good. But admin `cms/website-cms.tsx` may not expose all fields | Partial CMS control | Verify each admin resource form maps to DB columns |
| M2 | `hero_slides.buttons` JSONB not populated by seed | Loader may not render CTA buttons dynamically | Add buttons JSON to seed, or keep HTML static |
| M3 | `services.category_id` not set in seed (null) | Services are not linked to service_categories | Either populate service_categories and link, or leave type='experience' for site cards |
| M4 | `menu_items.category` is a text field matching config categories, but `category_id` is null | Menu categories table exists but items not FK-linked | Seed menu_categories then link via category_id |
| M5 | `gallery.category` values (dining, vip, lounge, events, autospa, conference, general) are custom — not a separate lookup table | Filtering consistency | Document allowed category values; align admin dropdown |
| M6 | `testimonials` has 1 test row ("Mary Customer") | Admin needs >1 meaningful review | Keep, but add realistic testimonials from business if available |
| M7 | Image paths: seed uses `assets/images/...` (correct for browser) but DB image_url might be used by admin storage paths | Ambiguity between local asset and Supabase Storage | Decide: local assets vs Supabase Storage bucket; align all `image_url` values |
| M8 | `website_pages` empty — no page_key rows | FK page_id unusable; admin page CMS won't work | Seed page_key rows: home, restaurant, lounge, vip, events, conference, autospa, gallery, contact |

---

## 5. LOW PRIORITY ISSUES

| # | Issue | Recommended Fix |
|---|-------|-----------------|
| L1 | `business_settings.logo_url`/`favicon_url` now set to local asset paths — if admin uploads to Storage, paths diverge | Use Storage URLs when admin uploads |
| L2 | No `promotions` usage on frontend | Add a promotions strip if desired |
| L3 | `system_settings` exists but unused by frontend | Optionally gate online booking flag |
| L4 | `activity_logs` tracked but not surfaced in frontend | Admin-only, fine |
| L5 | `staff`, `staff_availability`, `staff_leave` tables are admin-facing only; frontend doesn't need them | Keep as-is |
| L6 | `file_uploads` table unused by frontend | Seed only if using Storage uploads |
| L7 | `business_closures` unused by frontend | Could disable online booking on closures |

---

## 6. HARDCODED CONTENT LIST (FRONTEND)

| File | Line (approx) | Hardcoded Value | Should come from | DB Table | Recommended Fix |
|------|---------------|-----------------|------------------|----------|-----------------|
| index.html | ~113 | "ZT Lounge Meru" (JSON-LD name) | business_settings.business_name | business_settings | JS render |
| index.html | ~627 | "Milimani Road, Meru, Kenya" | business_settings.address | business_settings | data-* + loader |
| index.html | ~630 | "+254 143 542 601" | business_settings.phone | business_settings | data-phone + loader |
| index.html | ~632 | "ztloungemeru@gmail.com" | business_settings.email | business_settings | data-email + loader |
| index.html | ~634 | "Mon - Sun: 10:00 AM - 2:00 AM" | business_settings.opening_hours | business_settings | data-hours + loader |
| index.html | ~160-170 | Service card "Restaurant" + desc + image | services row (slug='restaurant') | services | content-loader |
| index.html | ~180-190 | Service card "Lounge & Bar" | services row | services | content-loader |
| index.html | ~200-210 | Service card "VIP Cabins" | services row | services | content-loader |
| index.html | ~220-230 | Service card "Events" | services row | services | content-loader |
| index.html | ~240-250 | Service card "Conference" | services row | services | content-loader |
| index.html | ~260-270 | Service card "Auto Spa" | services row | services | content-loader |
| index.html | ~300-330 | Hero slide 1 (badge/title/subtitle) | hero_slides (display_order=0) | hero_slides | content-loader |
| index.html | ~340-360 | Hero slide 2 | hero_slides (display_order=1) | hero_slides | content-loader |
| index.html | footer | Social links (fb/ig/x/yt) | business_settings.facebook/instagram/twitter/youtube | business_settings | loader |
| restaurant.html | menu | "Signature Nyama Choma" KES 1,800 | menu_items | menu_items | loader |
| restaurant.html | menu | "ZT Signature Pilau" KES 650 | menu_items | menu_items | loader |
| restaurant.html | menu | "Premium Beef Steak" KES 1,650 | menu_items | menu_items | loader |
| contact.html | FAQ x5 | FAQ Q&A | faqs | faqs | loader |
| contact.html | ~500 | "Opposite Ezri Hotel" | business_settings.address | business_settings | standardize |
| contact.html | ~956 | "+254 143 542 601" | business_settings.phone | business_settings | loader |
| contact.html | ~1108 | "Opposite Ezri Hotel, Milimani, Meru" | business_settings.address | business_settings | standardize |
| contact.html | ~1113 | Hours | business_settings.opening_hours | business_settings | loader |
| gallery.html | 14 images | gallery-01..14 + alt | gallery | gallery | loader |
| 404.html | — | no CMS content | static | N/A | keep |

---

## 7. DATABASE MISMATCH LIST

| Frontend Expectation | Database Field | Status |
|----------------------|----------------|--------|
| Business name | business_settings.business_name | ✅ present + seeded |
| Phone | business_settings.phone | ✅ present |
| Email | business_settings.email | ✅ present |
| Address | business_settings.address | ✅ present (standardize HTML) |
| Hours | business_settings.opening_hours (jsonb) | ⚠️ JSON structure vs HTML text — need loader mapping |
| WhatsApp | business_settings.whatsapp / phoneRaw equivalent | ✅ present |
| Facebook | business_settings.facebook | ✅ present (was null, migration 025 populated) |
| Instagram | business_settings.instagram | ✅ present (was null) |
| Twitter | business_settings.twitter | ✅ present (added 025) |
| YouTube | business_settings.youtube | ✅ present (added 025) |
| Google Maps | business_settings.google_maps_url | ✅ present |
| Hero slides | hero_slides (page_id nullable) | ⚠️ page_id references empty website_pages |
| Menu categories | menu_categories | ⚠️ 0 rows — seed adds 6 |
| Menu items | menu_items | ⚠️ category_id null, category as text |
| Services | services | ⚠️ category_id null, type='experience' plan |
| Gallery | gallery | ⚠️ 0 rows — seed adds 14 |
| FAQs | faqs | ⚠️ 1 test row — seed replaces with 5 |
| Testimonials | testimonials | ⚠️ 1 test row |
| Bookings | bookings | ⚠️ 0 rows — forms not connected |
| Orders | **NO `orders` table** | ❌ MISSING — use `bookings` |
| Contact messages | contact_messages | ⚠️ 1 test row |
| Pages (FK) | website_pages | ❌ 0 rows — blocks page_id FKs |

---

## 8. RECOMMENDED FIX ORDER

1. **Seed `website_pages`** (home, restaurant, lounge, vip, events, conference, autospa, gallery, contact) — unblocks all page_id FKs.
2. **Apply seed migration 026** after user SQL review — populates hero_slides, menu_categories, menu_items, services, gallery, faqs, testimonials.
3. **Align content-loader.js selectors** to match actual HTML (gallery `.grid-item[data-index]` OK on gallery.html; hero needs data-index or ID match; services `.service-card`; faqs `.faq-item`; menu `.menu-item`).
4. **Add `data-content` attributes** to key HTML elements for loader targeting (business name, phone, email, hours, socials).
5. **Connect forms** (restaurant + contact) to BookingRepository/ContactRepository → bookings + contact_messages tables (Phase 5).
6. **Extract inline JS/CSS** to external files (Phase 4).
7. **Standardize address** across HTML to match DB.
8. **Decide asset strategy**: local `assets/images` vs Supabase Storage; keep consistent in DB image_url.

---

## 9. FINAL PRODUCTION SCORE

| Category | Score | Reason |
|----------|-------|--------|
| Frontend architecture | **4/10** | Great design system, but everything inline/duplicated; loader disconnected |
| Database design | **7/10** | Solid schema, RLS in place, indexes present; but empty website_pages and category linkage |
| CMS integration | **2/10** | Admin + DB ready, but frontend never reads DB; seed pending |
| Security | **7/10** | RLS good for business_settings; anon insert policies on customers/contact loose; SECURITY DEFINER warnings |
| SEO | **6/10** | Good meta/OG/JSON-LD; sitemap broken (fixed by Phase 6), 404 bare, no FAQ/Menu schema |
| Production readiness | **3/10** | Not deployable as CMS-driven until seed + loader alignment + form wiring completed |

### Overall Alignment Score: **4.8 / 10**

---

*Audit complete — no files/frontend/DB modified during this audit (other than the previously approved migration 025 DB changes and committed 026 seed file pending review).*