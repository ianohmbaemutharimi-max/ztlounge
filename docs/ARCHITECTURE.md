# ZT Lounge — System Architecture (Verified)

> Forensic revision: **2026-10-18**. Supersedes the previous draft. Every claim was
> verified against the working tree or the **production Supabase project via anon
> REST** on this date. A parallel session was mutating the tree during the audit
> (see §7). Per-system deep dives: `SERVICES.md`, `CMS.md`, `BUSINESS_SETTINGS.md`,
> `MEDIA.md`, `TESTIMONIALS.md`, `PUBLIC_WEBSITE.md`.

## Overview

```
                     ┌─────────────────────────────────────────┐
                     │         Supabase (PostgreSQL)           │
                     │  • Migrations 026–057 (+ archived/)     │
                     │  • Auth (email/password + Google OAuth) │
                     │  • Storage: public-assets bucket        │
                     │  • RLS (anon read tiers; no public RPC) │
                     └──────────────────▲──────────────────────┘
                                       │
                     ┌─────────────────┴─────────────────┐
           ┌─────────┴──────────┐     ┌──────────────────┴──────────┐
           │  Public Website    │     │   Admin Dashboard           │
           │  (static site)     │     │   (Next.js 16.2.6)          │
           │  • 16 HTML pages   │     │  • App Router, React 19.2.6 │
           │  • Vanilla JS      │     │  • TanStack Query 5, Zod    │
           │  • Supabase anon   │     │  • Tailwind v4, Zustand 5   │
           └────────────────────┘     │  • service_role (server)    │
                                      └─────────────────────────────┘
```

> **Correction vs previous draft:** there is **no `create_booking` RPC**. The
> public site writes bookings via client-side anon inserts through
> `BookingRepository.insert()`; the booking-future-datetime guard lives in
> migration `034` as a trigger.

## 1. Public Website (`/` root)

Static HTML/CSS/vanilla-JS. No build step. Full inventory: `PUBLIC_WEBSITE.md`.

| Path | Contents (verified) |
|------|---------------------|
| `index.html` + `404.html` | Homepage (~23 sections), custom 404 |
| `pages/` | 15 HTML pages: `business/` (autospa, barber, conference, events, grooming-care, spa), `contact/` (contact, gallery), `experiences/` (lounge, restaurant, restaurant-menu, vip), `home/`, `restaurant/` |
| `assets/css/` | One compiled stylesheet (466 KB) + `enhancements.css` + `animations.css` |
| `assets/js/` | See below |
| `robots.txt` / `sitemap.xml` | 13 URLs (⚠️ 16 pages exist; autospa missing) |
| `assets/images/` | WebP + PNG (logo, favicon) + SVG (icons) |

### JavaScript layout (`assets/js/`)

```
config/          env.js, supabase.config.js (30-table registry + anon config)
lib/             BaseRepository, BookingTime, PageIdentity, supabase (lazy client),
                 environment-detector, form-core, seo-meta
repositories/    14 modules (window.*Repository IIFE pattern):
                 Hero, Services, Gallery, Menu, FAQ, Testimonials, Promotion,
                 Booking, Contact, SEO, Business, Membership, PageResolver,
                 MediaResolver
services/        BusinessService (business/contact/hours/trust facade)
core/            app.js
legacy/          booking.js  ← DEAD duplicate (not loaded by any page)
*.config.js      11 static-fallback configs (hero, services, gallery, menu, faq,
                 testimonials, booking, contact, seo, membership, business)
content-loader.js  DOM-population orchestrator (~15 populate* functions, fail-open)
branding-init.js   logo/favicon DOM contract (.logo-dark/.logo-light.site-logo)
```

**Pattern:** Repository-per-table on top of `BaseRepository.create()` (cacheTTL,
Supabase-first, static-config fallback). `PageResolver` is the only component
allowed to convert a page key → `website_pages` UUID (5-state contract, cached,
fail-open for Phase-2C toggles). `MediaResolver` is the exclusive image gateway
(see `MEDIA.md`). All app scripts load with `defer` in a fixed order ending with
`content-loader.js` (~45 scripts on `index.html`).

## 2. Admin Dashboard (`zt-lounge-admin/` — standalone, currently untracked)

Verified dependency set: `next 16.2.6`, `react 19.2.6`, `@tanstack/react-query
5.101.4`, `tailwindcss 4.1.17`, `zustand 5.0.2`, `zod 3.24.1`, `drizzle-orm
0.45.2`, `@supabase/supabase-js 2.49.4`, `@supabase/ssr 0.5.2`, `sharp 0.33.5`,
`recharts`, `nodemailer`, `@electric-sql/pglite`. Uses the **service_role** key
(server-only) and a `POSTGRES_MAGIC` cookie for admin RLS elevation. 53 admin
resources including the `google_*` business tables.

## 3. Supabase Backend

- **Migrations:** `026`–`057` continuous + `archived/` (032, 039_old, 044_old,
  `053_revert`, `055`-readiness). `045a` was renamed `0455` — the CLI silently
  skips files not matching `<digits>_name.sql`.
- **History reconciled + `056` pushed (2026-10-18):** production's
  `schema_migrations` held 33 out-of-band timestamp versions with no local
  files while local `026`–`057` were unrecorded, so `db push` hard-failed.
  Repaired (orphans → reverted; local `026`–`054`,`057` → applied), then `056`
  (membership-signup triggers) — the sole pending file — was pushed.
  `migration list` now shows Local = Remote for all 30 local versions.
- **Gateway columns live:** `media_id` populated on `hero_slides`/`menu_items`/
  `services`/`gallery`; `service_categories` seeded (8 active rows); `services`
  expanded to 45 rows, all with `category_id`. (An earlier probe round taken
  during an endpoint-instability window wrongly reported the columns missing.)
  See `MEDIA.md`.
- **RLS tiers (anon-read re-verified 2026-10-18 post-reconciliation):**
  business_settings(1), website_pages(9), hero_slides(9), services(45),
  service_charges(29), menu_*(10+14), gallery(52), testimonials(0),
  promotions(0), faqs(5), membership_plans(4), media_assets(197).
  ⚠️ `customer_memberships` still anon-readable (0 rows now — make it private).
  `benefits` no longer anon-visible (404: dropped or SELECT ungranted).
  Counts drifted during 2026-10-18 out-of-band content work (gallery 4→52,
  testimonials/promotions 8,4→0, page keys consolidated 12→9).
  No anon access to staff*, customers, booking_*, activity_logs,
  contact_messages (writes only), google_*.
- **No public RPC.** Admin-only RPCs exist for membership (migration `042`).

## 4. Testing

| Location | Runner | Scope |
|----------|--------|-------|
| `tests/*.spec.js` (4 specs) | Playwright (root `npm test`) | media gateway, membership section, UX, admin gateway |
| `zt-lounge-admin/tests/contract/` | `node --test` (Node ≥24 TS stripping) | `booking-time`, `mapping` |
| `zt-lounge-admin/tests/unit/` | ⚠️ **emptied mid-audit** by parallel session | was 27 tests |

## 5. Tech Stack (all verified in manifests)

| Layer | Technology |
|-------|------------|
| Website frontend | HTML + CSS + vanilla JS (ES6), single compiled stylesheet |
| Admin frontend | Next.js 16.2.6, React 19.2.6, TypeScript, Tailwind v4 |
| Data access | Supabase JS 2.x (anon/service_role), Drizzle 0.45.2 (schema) |
| Validation | Zod 3.24.1 (admin shared contract layer) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Images | Sharp (admin), Supabase Storage `public-assets` bucket |
| Testing | Playwright, Node `node:test` |
| Hosting | Static host (website) + Vercel/Railway (admin) |

## 6. Contract-Conformance Summary

| Contract | Status |
|----------|--------|
| Repository headers vs exports | ✅ 12/14 exact; ⚠️ ServicesRepository header stale (3 undeclared methods); ⚠️ Testimonials header mapping claim stale |
| MediaResolver exclusive gateway | ✅ `media_id` live + populated on all four gateway tables (hero/menu/services/gallery); history reconciled & `056` pushed 2026-10-18 |
| MembershipRepository "zero exposure" for customer_memberships | ❌ violated live (1 row anon-readable) |
| PageResolver 5-state + fail-open toggles | ✅ |
| Branding DOM contract | ✅ verified live |
| Tech-stack / setup docs claims | ✅ |
| Old ARCHITECTURE.md claims (create_booking RPC, migrations 026–055, lib/MediaResolver) | ❌ corrected herein |
| Root package.json `"main": phase3c_audit.js` | ❌ ghost file |

## 7. Working-Tree Volatility (read before committing)

During this audit a **parallel session** continuously mutated the tree: config
files moved from `assets/js/config/` to `assets/js/*` (renamed to `*.config.js`),
`ServicesRepository.js` was rewritten mid-read (750→230 lines), admin unit tests
were deleted, `057_seed_service_categories.sql` + `seed.sql` were added untracked,
and `index.html`/`sitemap.xml`/`autospa.html` changed. **Re-verify §1 file lists
and any "currently" statements before relying on them, and coordinate before
commits.**

