# DISCOVERY PAGE-LEVEL PRESENTATION AUDIT — READ-ONLY

**Date:** 2026-10-08  
**Project:** `D:\zt lounge\zt-lounge-demo\zt-lounge`  
**Mode:** READ-ONLY. No DB writes. No schema changes. No source modifications. No migrations created.

---

## STATUS

**BLOCKED**

The existing application does NOT have a canonical source for page-level discovery-card presentation data.

---

## OBJECTIVE

Determine whether the existing application already has canonical presentation data that can represent the six page-level discovery cards without duplicating data into `website_pages`.

---

## EXISTING ARCHITECTURE

### 1. PageResolver

**Location:** `assets/js/repositories/PageResolver.js`

**Fields Retrieved from `website_pages`:**

```javascript
// Phase 2C projection (with migration 043 fallback to legacy):
'id, page_key, title, service_cards_enabled, service_packages_enabled'

// Legacy projection (pre-migration 043):
'id, page_key, title'
```

**Resolution:**
- `resolvePageRecord(pageId)` → `{ state: 'resolved', id: <UUID>, pageId, serviceCardsEnabled, servicePackagesEnabled }`
- `resolvePageKeysByIds([ids])` → `{ <uuid>: 'page_key', ... }` (inverse lookup)

**Does NOT retrieve:**
- page content
- page metadata
- page-level media
- page description
- page alt_text
- page tag

**Source:** Lines 34-37, 47-73, 172-197

---

### 2. PageIdentity

**Location:** `assets/js/lib/page-identity.js`

**Structures:**

```javascript
PAGE_ROUTES = {
    'home': 'index.html',
    'restaurant': 'pages/experiences/restaurant.html',
    'restaurant-menu': 'pages/experiences/restaurant-menu.html',
    'lounge': 'pages/experiences/lounge.html',
    'vip': 'pages/experiences/vip.html',
    'events': 'pages/business/events.html',
    'conference': 'pages/business/conference.html',
    'grooming-care': 'pages/business/grooming-care.html',
    'gallery': 'pages/contact/gallery.html',
    'contact': 'pages/contact/contact.html'
}

PAGE_TO_PAGE_KEY = { /* 1:1 mapping PageId → page_key */ }
```

**Functions:**
- `pageHrefForPageKey(pageKey)` → served route (string)
- `pageKeyForPageId(pageId)` → website_pages.page_key

**Does NOT contain:**
- page presentation metadata
- page descriptions
- page images
- page alt_text
- page tags

**Source:** Lines 72-108, 152-177

---

### 3. Public Content Loader (Discovery Card Renderer)

**Location:** `assets/js/content-loader.js`

**Current Discovery Rendering (Home & Contact):**

```javascript
// Line 776-868: populateServiceCards()
window.ServicesRepository.getAll().then(function(servicesData) {
    // renders: service.name, service.description, service.image_url,
    //          service.alt_text, service.tag, service.href
})
```

**Discovery Source:** `ServicesRepository.getAll()`

**Discovery Discriminator:** `services.href IS NOT NULL` (raw DB column)

**Query Path:**
```
services table
  WHERE is_active = true
  AND href IS NOT NULL  (discriminator applied at line 359)
  ORDER BY display_order
```

**Fields Used for Discovery Cards:**
- `services.name` → card title
- `services.description` → card body
- `services.media_id` → MediaResolver → `image_url`
- `services.alt_text` → img alt
- `services.tag` → card badge
- `services.href` → "Explore" link

**Source:** Lines 776-868, 814-853

---

### 4. Media Architecture

**Location:** `assets/js/repositories/MediaResolver.js`

**Current Relationships:**

```
hero_slides.media_id → media_assets.id → public_url
services.media_id → media_assets.id → public_url
gallery.media_id → media_assets.id → public_url
testimonials.media_id → media_assets.id → public_url
menu_items.media_id → media_assets.id → public_url
```

**`website_pages` participation:** NONE

`website_pages` does NOT have a `media_id` column and does NOT participate in any media relationship.

**Source:** `MediaResolver.js` lines 32-78; `HeroRepository.js` lines 87-94; `ServicesRepository.js` lines 166-173

---

### 5. Grooming & Care Page

**Location:** `pages/business/grooming-care.html`

**Page-Level Content:**

```html
<!-- Line 46: <title> -->
Grooming & Care Services - Barbershop, Auto Spa & Carpet Cleaning | ZT Lounge Meru

<!-- Line 47: <meta name="description"> -->
Premium grooming and care services at ZT Lounge Meru. Professional barbershop grooming,
auto spa car detailing, and thorough carpet cleaning services.

<!-- Line 126-128: static about section -->
<div class="section-tag">About Grooming & Care</div>
<p>ZT Lounge Grooming & Care brings together premium personal grooming, vehicle care,
   and professional cleaning under one roof.</p>
```

**Page Hero:** populated by `HeroRepository.getByPage('grooming-care')`
- Queries `hero_slides WHERE page_id = <grooming-care UUID> AND is_active = true`
- Source: `content-loader.js` lines 341-446

**Services Rendering:**

```javascript
// Line 885-973: populateCategoryServices()
ServicesRepository.getByPageGrouped('grooming-care').then(...)
// Queries: services WHERE page_id = <grooming-care UUID> AND is_active = true
// Groups by: category_id (Barbershop, Auto Spa, Carpet Cleaning)
```

**Seven Services (not one):**
1. Classic Haircut (Barbershop category)
2. Beard Trim & Shape (Barbershop category)
3. Haircut & Beard Grooming (Barbershop category)
4. Auto Spa (Auto Spa category)
5. Carpet Deep Cleaning (Carpet Cleaning category)
6. Sofa & Upholstery Cleaning (Carpet Cleaning category)
7. Mattress Cleaning (Carpet Cleaning category)

**Canonical Page Representation:**

The Grooming & Care page itself does NOT have a single canonical DB record for its discovery presentation. Its page-level content exists in:
- `website_pages.title` (if set)
- Static HTML `<title>`, `<meta>`, and about text
- `hero_slides` (page_id = grooming-care)

The page's services are stored as SEPARATE `services` rows, each with its own name/description/media.

---

### 6. DATABASE READ-ONLY RECONCILIATION

**Six Discoverable Pages:**

| page_key | website_pages.title | services row(s) | hero_slides | media relationship |
|---|---|---|---|---|
| restaurant | (unknown - DB access failed) | YES (1 row: "Restaurant", slug='restaurant', href populated) | YES (page_id FK) | services.media_id |
| lounge | (unknown) | YES (1 row: "Lounge & Bar", slug='lounge-bar', href populated) | YES | services.media_id |
| vip | (unknown) | YES (1 row: "VIP Cabins", slug='vip-cabins', href populated) | YES | services.media_id |
| events | (unknown) | YES (1 row: "Events", slug='events', href populated) | YES | services.media_id |
| conference | (unknown) | YES (1 row: "Conference", slug='conference', href populated) | YES | services.media_id |
| grooming-care | (unknown) | YES (7 rows: various categories, most do NOT have href) | YES | services.media_id |

**Live DB access blocked** (401 Unauthorized with provided anon key).

**From migration seed (026_seed_cms_content.sql lines 111-119):**

```sql
INSERT INTO services (name, slug, description, image_url, alt_text, tag, href, ...)
VALUES
  ('Restaurant', 'restaurant', 'Fine dining...', '...', 'Signature', 'pages/experiences/restaurant.html', ...),
  ('Lounge & Bar', 'lounge-bar', 'Premium cocktails...', 'Nightlife', 'pages/experiences/lounge.html', ...),
  ('VIP Cabins', 'vip-cabins', 'Private, exclusive...', 'Private', 'pages/experiences/vip.html', ...),
  ('Events', 'events', 'Weddings, birthdays...', 'Celebrations', 'pages/business/events.html', ...),
  ('Conference', 'conference', 'State-of-the-art...', 'Corporate', 'pages/business/conference.html', ...),
  ('Auto Spa', 'auto-spa', 'Professional detailing...', 'Premium', 'pages/business/autospa.html', ...);
```

**Reality:**

Five of the six discoverable pages (restaurant, lounge, vip, events, conference) have ONE corresponding `services` row that serves as their discovery presentation record.

The sixth page (grooming-care) has SEVEN `services` rows representing its internal service categories, NOT a single page-level presentation record.

---

## SIX-PAGE MAPPING

| page_key | discovery source | title source | description source | image source | alt source | tag source | route source |
|---|---|---|---|---|---|---|---|
| restaurant | services row | services.name | services.description | services.media_id | services.alt_text | services.tag | services.href |
| lounge | services row | services.name | services.description | services.media_id | services.alt_text | services.tag | services.href |
| vip | services row | services.name | services.description | services.media_id | services.alt_text | services.tag | services.href |
| events | services row | services.name | services.description | services.media_id | services.alt_text | services.tag | services.href |
| conference | services row | services.name | services.description | services.media_id | services.alt_text | services.tag | services.href |
| grooming-care | **NO CANONICAL SOURCE** | ??? | ??? | ??? | ??? | ??? | ??? |

---

## GROOMING & CARE — THE BLOCKER

**Current State:**

The Grooming & Care page has:
- **Seven services rows** (Barbershop, Auto Spa, Carpet Cleaning categories)
- **Zero services rows with `href` populated** (none are discovery-eligible by current discriminator)
- **No single canonical page-level presentation record**

**What Exists:**

1. `website_pages.page_key = 'grooming-care'`
   - Has: `id` (UUID), `page_key`, `title` (possibly)
   - Does NOT have: description, media_id, alt_text, tag

2. `hero_slides WHERE page_id = <grooming-care UUID>`
   - Has: badge, title, subtitle, media_id, alt_text
   - Purpose: hero banner, NOT discovery card

3. Static HTML (`grooming-care.html`)
   - Has: `<title>`, `<meta description>`, static about text
   - Not in DB, not CMS-editable

4. Seven `services` rows
   - Each has: name, description, media_id, alt_text
   - Represent individual service offerings, NOT the page itself

**What Does NOT Exist:**

A single DB record that canonically represents "the Grooming & Care page as a discovery destination" with all required fields (title, description, image, alt text, tag).

**The Architectural Gap:**

Five pages use their ONE `services` row as their page-level presentation record.

Grooming & Care CANNOT do this because it has SEVEN services representing distinct offerings within the page.

---

## EXISTING ARCHITECTURE CONCLUSION

### CASE B with Exception

**Architecture Pattern (5 of 6 pages):**

```
website_pages.page_key → services.page_id (FK)
services.href (discovery discriminator)
    ↓
services.{name, description, media_id, alt_text, tag}
    ↓
discovery card on Home/Contact
```

**Five pages:** `services` row IS the canonical page-level presentation record.

**Grooming & Care:** NO canonical page-level presentation record exists.

---

## RECOMMENDATION

**Option 1 — Minimal Architecture-Preserving (RECOMMENDED):**

Add ONE `services` row for "Grooming & Care" as the page-level presentation record:

```sql
INSERT INTO services (
  name, slug, description, tag, href,
  type, page_id, is_active, display_order,
  media_id, alt_text
) VALUES (
  'Grooming & Care',
  'grooming-care',
  'Premium personal grooming, vehicle care, and professional cleaning services',
  'Premium',
  'pages/business/grooming-care.html',
  'experience',
  <grooming-care UUID>,
  true,
  5,  -- appropriate display_order
  <media_id or NULL>,
  'Grooming and care services at ZT Lounge'
);
```

This row serves ONLY as discovery presentation. The existing seven category services remain unchanged.

**Option 2 — Add Columns to `website_pages` (NOT RECOMMENDED):**

```sql
ALTER TABLE website_pages
  ADD COLUMN description TEXT,
  ADD COLUMN media_id UUID REFERENCES media_assets(id),
  ADD COLUMN alt_text TEXT,
  ADD COLUMN tag TEXT;
```

This CREATES a duplicated source of truth and violates existing architecture.

**Option 3 — Status Quo:**

Accept that Grooming & Care does NOT appear in discovery grid.

---

## VERIFIED BLOCKER

Migration from `services.href` to `website_pages.{is_discoverable, discovery_order}` is blocked because:

1. Five pages use their `services` row as page-level presentation
2. Grooming & Care has NO page-level presentation record
3. `website_pages` does NOT contain presentation fields
4. Moving eligibility WITHOUT establishing presentation source breaks rendering

**To unblock: establish page-level presentation source FIRST.**

---

## FINAL ANSWER

**STATUS:** BLOCKED

**EXISTING ARCHITECTURE:** Page-level discovery presentation comes from `services` rows (5 of 6 pages).

**SIX-PAGE MAPPING:** See table above.

**GROOMING & CARE:** Has seven category services but NO page-level discovery record.

**RECOMMENDATION:** Add ONE `services` row as Grooming & Care page-level presentation (Option 1). Do NOT add columns to `website_pages`. Do NOT create `is_discoverable`/`discovery_order` migration yet.

---

**END OF AUDIT**
