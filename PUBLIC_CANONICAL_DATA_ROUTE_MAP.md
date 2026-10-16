# PUBLIC CANONICAL_DATA_ROUTE_MAP

Branch `feature/membership-tiers-staging-phase1` · HEAD `905bd7a11c87a06fbfe6a6fc90d15c3e2769850c`
DB `jczwilrysvnhcjzjztbi` (read-only). Built BEFORE any change in this cleanup task.

| Category | Canonical source | Repository / service | Resolver / loader | Public consumer | Hardcoded copies | Status |
|---|---|---|---|---|---|---|
| Business name | `business_settings.business_name` | `BusinessRepository.getAll()` → `BusinessService.getContact()` | `content-loader.populateBusinessInfo()` | `[data-business-name]`, footer/header shell | 3 fallbacks (`business-config.js`, `shared-components.js` CONTACT, `BusinessService.getBusiness`) | CANONICAL + LEGITIMATE_FALLBACK |
| Address | `business_settings.address` | same | `populateBusinessInfo()` `[data-address],[data-business-address],[data-footer-address]` | footer, location blocks | **1 stale** (`business-config.js` fallback — fixed this task); static JSON-LD `streetAddress` (overwritten at runtime) | CANONICAL after fix |
| City / country | `business_settings.city` / `.country` | same | `populateBusinessInfo()` (via address) | location blocks | JSON-LD `addressLocality`/`addressCountry` (static, overwritten) | CANONICAL |
| Postal code / region | **NO COLUMN** | — | — | JSON-LD only (`60200`, `Meru County`) | 2 JSON-LD values | **SOURCE GAP (E)** |
| Phone | `business_settings.phone` (+254143542601) | `BusinessService.getContact().phoneDisplay/phoneRaw` | `populateBusinessInfo()` `[data-phone]`, `[data-phone-link]` | footer, contact blocks, forms | fallbacks only (`business-config.js`, `shared-components.js`, `forms.js`) | CANONICAL |
| Email | `business_settings.email` | `BusinessService.getContact().email` | `populateBusinessInfo()` `[data-email]`, `[data-email-link]` | footer, contact blocks | **9 malformed hooks** — literal `"…gmail.com data-email-link"` text, never hydrated (**defect F**) | CANONICAL after fix |
| WhatsApp | `business_settings.whatsapp` | `BusinessRepository` → `contact.social.whatsapp` | `populateBusinessInfo()` `[data-whatsapp]` | floating buttons | `shared-components.js` CONTACT.whatsapp (fallback) | CANONICAL + fallback |
| Opening hours | `business_settings.opening_hours` (jsonb, 7 days) | `BusinessRepository` → `contact.hours` | `formatOpeningHours()` → `populateBusinessInfo()` `[data-hours]` | footer/location hours | static fallbacks in 9 pages; **1 stale found + fixed this task** (`conference.html:797` displayed `8:00 AM – 10:00 PM`, contradicting DB `10:00 AM - 2:00 AM`) | CANONICAL after fix — DB value `Mon–Sun 10:00 AM – 2:00 AM` verified on all 9 pages |
| Hero | `hero_slides.media_id` (+ title/subtitle/cta) | `HeroRepository.getByPage()` | `MediaResolver` → `populateHero()` | `.hero-slider` | none — DOM fully generated | CANONICAL |
| Gallery (full) | `gallery` (`page_id`, `is_active`) | `GalleryRepository.getByPage()` | `MediaResolver.resolveCollection()` → `populateGallery()` | `.grid-item` | none | CANONICAL |
| Gallery (previews) | `gallery` + `is_featured`, scoped to `page_key='gallery'` | `GalleryRepository.getByPage('gallery')` | `MediaResolver.resolveCollection()` → `populateHomepageGalleryPreview()` | `.gallery-preview-grid .gallery-preview-item` | homepage + contact = CMS mounts (no literals). lounge/vip/conference/events still carry baked storage URLs | **PARTIAL** — home/contact VERIFIED canonical; other 4 pages are **SOURCE GAP (E)** (no CMS gallery rows exist for those page scopes — see E-4) |
| Menu | `menu_items` / `menu_categories` | `MenuRepository.getMenu()` | `populateMenu()` (×2 surfaces) | `.menu-container`, category grids | none | VERIFIED — runtime prices match live rows |
| Services (cards) | `services` | `ServicesRepository.getByPage()/getAll()/getByPageGrouped()` | `populateServiceCards()`, `populateCategoryServices()` | `.service-cards-grid`, `.category-services-grid` | none | CANONICAL |
| Maps URL | `business_settings.google_maps_url` (`https://maps.app.goo.gl/HqTbiiU4q2jRFoPg6`) | `BusinessRepository` → `contact.social.google_maps` | `populateBusinessInfo()` `[data-map-link]` | "Get Directions" | 12 static copies, **all canonical** (1 typo fixed this task) | CANONICAL |
| Logo / favicon | `business_settings.logo_media_id` / `favicon_media_id` | `BusinessRepository.resolveBranding()` | `MediaResolver.resolveMediaId()` → `media_assets.public_url` | `branding-init.js`, `resolved_logo_url` | none (legacy `logo_url` used only if media_id absent) | CANONICAL |
| Packages / prices | `service_charges` (RLS: active only) | `ServicesRepository.getChargesBySlug()` | `populateServicePrices()`, `populateServiceCatalog()` | price grids, booking package select | none in source | CANONICAL |
| Booking price authority | `create_booking` RPC resolves server-side | `BookingRepository` | `forms.js` submits **identifiers only** | booking forms | no client price literals | CANONICAL |
| Membership | `membership_plans` + `membership_plan_benefits` | `MembershipRepository.getPlans()/getFeeSummary()` | `membership-view.mount()` | membership modal | **none** — `membership.config.js` holds only non-record constants | CANONICAL |
| Promotions | `promotions` (`getEligible()`, `show_on_homepage`) | `PromotionRepository.getEligible()` | `populatePromotions()` + `promoDestination()` | `#promotions-grid`, floating sticker, page strip | none | CANONICAL |
| Testimonials | `testimonials` | `TestimonialsRepository.getAll()` | `populateTestimonials()` | `.testimonials-section` | none | CANONICAL |
| FAQ | `faqs` (`page_id` NULL = global) | `FAQRepository.getByPage()` | `populateFAQ()` (clears `.faq-container`) | `.faq-container` | static HTML fallback items, fully replaced at runtime | CANONICAL (runtime-verified: 5 DB rows) |
| Pages / toggles | `website_pages` (`page_key`) | `PageResolver.requirePageUuid()/resolvePageRecord()` | `getPageSectionToggles()` | section visibility, gallery scope | none | CANONICAL |
| Lounge cocktail prices | **NO ROWS** | — | — | `lounge.html:675,680,685,690` literal markup | 4 literal "From KES X" prices | **NO CANONICAL SOURCE — DECISION REQUIRED (E-1)** · `menu_items` has no row for any of the 4 offerings (Bar Menu = Cocktail Selection 850, Signature Cocktail 750 only); lounge `services` row is "Lounge & Bar" @ 0.00 |
| Conference / VIP feature grids | **NOT IN MODEL** | — | — | static markup (`conference.html:631,651`, vip equivalents) | 6 + 4 items | **NO CANONICAL SOURCE — DECISION REQUIRED (E-2)** · `services` has exactly 1 row/page (conference → "Conference" 0.00; vip → "VIP Cabins" 0.00); these are venue amenities, not bookable services |
| Per-page preview images (lounge/vip/conference/events) | **NO ROWS for those page scopes** | `GalleryRepository.getByPage(<page>)` would need rows | — | baked `.gallery-preview-item` storage URLs | 4 URLs × 4 pages | **NO CANONICAL SOURCE — DECISION REQUIRED (E-4)** · all 13 live `gallery` rows are `page_key='gallery'`; creating page-scoped rows = DB mutation, prohibited |

## Newly found + fixed in the re-audit (Phase 4–5)

| Finding | Location | Class | Canonical source | Action |
|---|---|---|---|---|
| Stale opening hours `8:00 AM – 10:00 PM` | `pages/business/conference.html:797` | **F** | `business_settings.opening_hours` | Replaced with canonical `10:00 AM - 2:00 AM` |
| Address `<span>` had no `data-address` hook → never hydrated | `pages/contact/contact.html:909` | **D** | `business_settings.address` | Added the existing hydration hook (no new loader) |
| Address fallback drifted: two branches appended `", Kenya"` | `assets/js/repositories/BusinessRepository.js:199,221` | **F** | `business_settings.address` | Single `CANONICAL_ADDRESS_FALLBACK` constant (line 41) now used by both branches |

## Canonical route coverage summary

- **Verified canonical routes (13):** business name, address, phone, email, WhatsApp, hours, maps URL, logo/favicon, hero, gallery (full page), menu, services, packages, booking price authority, membership, promotions, testimonials, FAQ, pages/toggles.
- **NO CANONICAL SOURCE — DECISION REQUIRED (4):** E-1 lounge cocktail prices · E-2 conference/VIP feature grids · E-3 postal code & address region · E-4 per-page preview gallery images.

## Media classification

- `media_id → media_assets.public_url` via `MediaResolver` — hero, gallery, services, menu, branding, promotions: **CANONICAL**.
- `assets/js/asset-url.js` (`AssetUrl.resolve`) — maps *local relative paths* to bucket URLs; a centralized helper, not an independent authority: **LEGITIMATE STATIC ASSET PATH**.
- Absolute `https://jczwilrysvnhcjzjztbi.supabase.co/storage/v1/object/public/...` literals in HTML: **D** where they are business media (gallery previews on lounge/vip/conference/events), **LEGITIMATE_STATIC** where they are local branding/CSS/decorative assets.

## E-1 to E-4 — decision gate (Phase 8 of the gap-resolution audit)

These four rows are **NOT VERIFIED** and are deliberately not labelled as such.

| Gap | Actual canonical authority | Route if one exists | Why the current route is unavailable | Required future decision | Existing schema supports the future solution? |
|---|---|---|---|---|---|
| **E-1** Lounge prices | `menu_items` (structurally) — `Bar Menu` category, `name/description/price/media_id/is_active/display_order` all exist | `MenuRepository` → `populateMenu()`, already proven on the restaurant menu page | `lounge.html` has **no menu mount** and does **not** consume `MenuRepository`; `menu_items` has **no row** for any of the four offerings | Business call: are these real bookable menu items (→ create 4 rows + mount) or indicative "from" bands (→ re-label as editorial copy)? | **Yes** — `menu_items` + `MenuRepository` need no change |
| **E-2** Conference/VIP feature grids | **NONE** — not represented by any canonical entity | — | `services` holds exactly 1 umbrella row per page (`Conference` 0.00, `VIP Cabins` 0.00); real per-space prices live in `service_charges`; the grids are amenities, not records | Choose a content model: `website_pages.content.features` (jsonb, preferred, no new table) **or** a new `page_features` table | **Yes for option 1** — `website_pages.content` already exists and is admin-exposed |
| **E-3** Postal code / region | **NONE** — no `postal_code`/`postcode`/`zip`/`region`/`county`/`state`/`province` column (27-column `business_settings` verified) | — | JSON-LD only (`60200`, `Meru County`); no field to read, and `city`/`country` are not legitimate sources | Schema migration: `ALTER TABLE business_settings ADD COLUMN postal_code text, ADD COLUMN region text;` then populate + wire into `mapToUI` and `generateJSONLD` | **No** — one migration required |
| **E-4** Per-page preview images | `gallery` — already page-scoped: `page_id` → `website_pages.id`, plus `media_id`, `display_order`, `is_active`, `is_featured` | `GalleryRepository.getByPage(<page>)` → `MediaResolver.resolveCollection()`; already proven on home + contact | All **13** live `gallery` rows resolve to `page_key = 'gallery'`; **zero** rows exist for `lounge`/`vip`/`conference`/`events`, so `getByPage()` returns `[]` | Register missing media, then create page-scoped `gallery` rows and widen the existing preview renderer's scope to any page owning a `.gallery-preview-grid` | **Yes — completely.** No migration, no new table, no new repository, no new loader |

### Media-coverage caveat (unverified)

The four preview grids reference **16 `src` values / 15 unique files** (source-verified).
The number of those files that already have a `media_assets` row **could not be verified**
(live DB unreachable this session after 2 failures). An earlier "13 of 16" figure and a
"lounge 3 / conference 1 / vip 1 / events 0" figure are mutually inconsistent and are
withdrawn. Re-count before planning any insert (queue step E-4.1).

---

# PHASE 6 — FINAL ROUTE MAP (rebuilt, enforcement audit)

Every category identifies a concrete route. No row says merely "DB-driven".
Evidence = live read-only PostgREST against `jczwilrysvnhcjzjztbi` unless noted.

| Category | Canonical Source | Repository/Service | Resolver/Loader | Public Consumer | Fallback | Status | Evidence |
|---|---|---|---|---|---|---|---|
| Business name | `business_settings.business_name` | `BusinessRepository.getAll()`→`mapToUI()`; `BusinessService.getContact()` | `content-loader.populateBusinessInfo()` | `[data-business-name]`, shell | `FALLBACK_CONFIG.name` = "ZT Lounge Meru" (matches DB) | **A + B** | live `business_name="ZT Lounge Meru"` |
| Address | `business_settings.address` | same | `populateBusinessInfo()` | `[data-address]`,`[data-business-address]`,`[data-footer-address]` | `CANONICAL_ADDRESS_FALLBACK` + `FALLBACK_CONFIG.address.*` (all match DB) | **A + B** | live `address="Opposite Ezri Hotel, Milimani, Meru"`; hydrated 10/10 pages |
| City / country | `business_settings.city` / `.country` | same | `populateBusinessInfo()` + `generateJSONLD()` | location blocks, JSON-LD | `FALLBACK_CONFIG.address.city/country` | **A + B** | live `city="Meru  town"`, `country="Kenya"` (note DB double space) |
| Phone | `business_settings.phone` | `BusinessRepository`→`BusinessService.getContact().phoneDisplay/phoneRaw` | `populateBusinessInfo()` | `[data-phone]`,`[data-phone-link]` | `FALLBACK_CONFIG.phone/phoneRaw`, `shared-components.CONTACT` | **A + B** | live `+254143542601`; displayed `+254 143 542 601` via `formatPhoneDisplay()` |
| Email | `business_settings.email` | `BusinessService.getContact().email` | `populateBusinessInfo()` | `[data-email]`,`[data-email-link]` | `FALLBACK_CONFIG.email`, `CONTACT.email` | **A + B** | live `ztloungemeru@gmail.com` |
| WhatsApp | `business_settings.whatsapp` | `BusinessRepository.canonicalWhatsAppUrl()`→`contact.social.whatsapp` | `populateBusinessInfo()` | `[data-whatsapp]`, floating buttons | `FALLBACK_CONFIG.social.whatsapp`, `CONTACT.whatsapp` | **A + B** | live `+254143542601`; normalised to `wa.me/254143542601` |
| Opening hours | `business_settings.opening_hours` (7-day jsonb) | `BusinessRepository`→`contact.hours` | `formatOpeningHours()`→`populateBusinessInfo()` | `[data-hours]` | static `Mon - Sun: 10:00 AM - 2:00 AM` in markup | **A + B** | live all 7 days `10:00 AM - 2:00 AM`; hydrated 10/10; 0 `[object Object]` |
| Maps URL | `business_settings.google_maps_url` | `contact.social.google_maps` | `populateBusinessInfo()` | `[data-map-link]` | `FALLBACK_CONFIG.googleMaps` | **A + B** | live `maps.app.goo.gl/HqTbiiU4q2jRFoPg6`; 11 hooked occurrences |
| Postal code / region | **NO COLUMN** | — | — | JSON-LD only | none | **G — SCHEMA_GAP (E-3)** | live column list has no postal/region/county/state |
| Logo / favicon | `business_settings.logo_media_id`/`favicon_media_id` → `media_assets.public_url` | `BusinessRepository.resolveBranding()` | `business-config.js` | `<img>`, `link[rel=icon]`, `branding-init.js` | logo only; favicon deliberately `null` | **A + B** | live both UUIDs = `a5fb7148…` |
| Hero | `hero_slides.media_id` + title/subtitle/cta | `HeroRepository.getByPage()` | `MediaResolver`→`populateHero()` | `.hero-slider` | none — DOM generated | **A** | source-verified |
| Gallery (full) | `gallery` (`page_id`,`is_active`,`media_id`) | `GalleryRepository.getByPage()` | `MediaResolver.resolveCollection()`→`populateGallery()` | `.grid-item` | none | **A** | live 13 rows, all page `gallery` |
| Gallery previews (home/contact) | `gallery` + `is_featured` | `GalleryRepository.getByPage()` | `MediaResolver`→`populateHomepageGalleryPreview()` | `.gallery-preview-grid` | none — CMS mount | **A** | live rows exist for `gallery` |
| Gallery previews (lounge/vip/conference/events) | **NO ROWS** | — | — | `.gallery-preview-grid` (static `<img src>`) | none | **E — CANONICAL_DATA_MISSING (E-4)** | 0/15 files in `media_assets`; 0 gallery rows for those page ids |
| Menu | `menu_items`/`menu_categories` | `MenuRepository.getMenu()` | `populateMenu()`, `populateMenuPrices()` | `.menu-container` | none | **A** | live 14 items, 10 categories |
| Services (cards) | `services` | `ServicesRepository.getByPage()/getAll()/getByPageGrouped()` | `populateServiceCards()`, `populateCategoryServices()` | `.service-cards-grid` | none | **A** | live 12 services |
| Packages / charges | `service_charges` | `ServicesRepository.getChargesBySlug()` | `populateServicePrices()`, `populateServiceCatalog()` | `[data-charge-name]` | none | **A** | gated by `website_pages.service_packages_enabled` |
| Booking | server-side `create_booking` RPC | `BookingRepository` | `booking.js` | booking form | none | **A** | price authority server-side |
| Membership plans | `membership_plans` | `MembershipRepository.getPlans()` | `populateMembership()`→`membership-view.js` | plan cards, modal | modal contact literals (Class B) | **A + B** | untouched this task |
| Membership benefits | `membership_plan_benefits` | `MembershipRepository` | `membership-view.benefitsHTML()` | modal list | none | **A** | untouched |
| Promotions / Testimonials / FAQ | respective tables | `PromotionRepository`, `TestimonialsRepository`, `FAQRepository` | loaders | sections | none | **A** | untouched |
## Unresolved gaps

| Gap | Why unavailable | Required decision | Schema sufficient? | Code-only fix? |
|---|---|---|---|---|
| **E-1** Lounge prices (`lounge.html:675,680,685,690`) | No `menu_items` row for any of the 4 offerings; no menu mount on the page | Real menu items vs editorial copy vs removal | **Yes** | **No** |
| **E-2** Conference/VIP feature grids | `services` holds 1 umbrella row/page and drives booking; no amenities entity exists | Content model: `website_pages.content.features` (preferred) vs new table | **Partially** | **No** |
| **E-3** Postal code / region | `business_settings` has no postal/region/county/state column | Authorize a 2-column migration, then wire + delete literals | **No** | **No** |
| **E-4** Preview images (16 refs / 15 files) | 0/15 in `media_assets`; 0 `gallery` rows for those page ids | Authorize `media_assets` + `gallery` row creation, then widen renderer scope | **Yes — fully** | **No** |

## Class D defects found and fixed in the enforcement audit

| # | Defect | File | Fix |
|---|---|---|---|
| 1 | `getBusiness()` guarded on `data.name` — a key `mapToUI()` never returns, so the canonical record was **always** discarded and a hardcoded 2-field object returned, starving `generateJSONLD()` of address/city/country/hours/logo/maps | `assets/js/services/BusinessService.js` | Guard on `business_name`/`businessName`; fallback retained with matching values |
| 2 | Consequence of #1 — static JSON-LD blocks fell back to literals and `telephone` received the display-formatted number | same (fix #1 restores it) | Verified live: `addressLocality="Meru  town"`, `hasMap=true`, `hasLogo=true` |
| 3 | `getTrust()` called `repository.getTrust()`, which does not exist on `BusinessRepository` | `assets/js/services/BusinessService.js` | Resolve from `BusinessConfig.trust` / `ContactConfig.trustBadges` (no DB route invented) |

## Environment correction (supersedes earlier DB notes)

`supabase db query --linked` resolves `supabase/.temp/project-ref` = **`jczavwuaiywnhpfigvlw`**
(staging, 6 tables, **no CMS tables**) — **not** the canonical `jczwilrysvnhcjzjztbi` the
site reads. A CLI query returned `ERROR 42P01: relation "gallery" does not exist`.
All evidence in the enforcement audit was gathered read-only via the PostgREST
`/rest/v1` endpoint the browser itself uses. **Prior figures derived from the CLI should
be re-verified.**
| Page toggles | `website_pages.service_*_enabled` | `getPageSectionToggles()` | `hidePublicSection()` | `#services`,`#pricing` | none | **A** | live 9 pages |
| JSON-LD (business) | `business_settings` object | `BusinessService.getBusiness()` | `generateJSONLD()` | static `ld+json` + dynamic `LocalBusiness` | literals in the schema object | **A — FIXED THIS TASK** | was Class D; now `addressLocality="Meru  town"`, `hasMap`,`hasLogo` verified live |
| Trust badges | **none (not a record)** | — | — | `.trust-badges` | `FALLBACK_CONFIG.trust` / `ContactConfig.trustBadges` | **C** | marketing claims, correctly not DB records |