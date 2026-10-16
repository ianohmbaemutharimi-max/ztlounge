# DATABASE SINGLE SOURCE OF TRUTH IMPLEMENTATION PLAN

**Status:** Strategic Plan | **Version:** 1.0.0 | **Date:** October 9, 2026

---

## 🎯 GOAL

Transform the media architecture from a **fallback model** to an **exclusive gateway model**:

| **Current State** | **Target State** |
|---|---|
| `media_id` + `image_url` coexist | `media_id` is **the only** source |
| MediaResolver acts as optional override | MediaResolver always provides the URL |
| `image_url` is presentation fallback | `image_url` column deprecated/unused |
| Dual-source complexity | Single canonical path |

**The exclusive gateway principle:**
```
media_id (FK to media_assets.id) → media_assets.public_url → [rendered to DOM]
```

No fallbacks. No legacy `image_url` in production. No hardcoded storage URLs.

---

## 📊 CURRENT STATE ANALYSIS

### Tables with `image_url` Legacy Column

| Table | Total Rows | With `media_id` | Without `media_id` | `image_url` Usage |
|---|---|---|---|---|
| `hero_slides` | 2 | 2 (100%) | 0 | All NULL |
| `gallery` | 14 | 14 (100%) | 0 | All NULL |
| `services` | 14 | 13 (93%) | 1 (7%) | 1 row has value |
| `menu_items` | 14 | 14 (100%) | 0 | All NULL |
| **business_settings** | 1 | — | — | — |
| **testimonials** | field exists | — | — | — |

**Key Finding:** `image_url` column exists but is **nearly completely unused** (42/43 rows = 98% already NULL).

### Current Resolution Flow

```
Repository (e.g., HeroRepository.getByPage)
  ↓ SELECT * FROM hero_slides WHERE page_id=? AND is_active=true
  ↓ Returns: { media_id, image_url (NULL), alt_text, ... }
  ↓ MediaResolver.resolveCollection(items)
    ↓ Batch query: SELECT id, public_url, alt_text FROM media_assets WHERE id IN (...)
    ↓ Cache in-memory
    ↓ applyResolved: item.image_url = media_assets.public_url (canonical override)
  ↓ Result: item.image_url now contains the resolved public_url
  ↓ Content-loader renders via item.image_url
```

**Problem:** The fallback pathway is baked into the logic. This creates non-fatal resilience, but obscures the requirement: `media_id` should be **required**, not optional.

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Data Migration (Immediate)
**Goal:** Ensure every content row has `media_id` populated; NULL out `image_url`.

#### 1.1 Find the gap: Service without media_id
```sql
SELECT id, name, slug, media_id, image_url 
FROM services 
WHERE media_id IS NULL;
```

**Action:** Either migrate the `image_url` value to a new media_assets row, or delete the row.

#### 1.2 Null out all legacy `image_url` columns
```sql
UPDATE hero_slides SET image_url = NULL WHERE image_url IS NOT NULL;
UPDATE gallery SET image_url = NULL WHERE image_url IS NOT NULL;
UPDATE services SET image_url = NULL WHERE image_url IS NOT NULL;
UPDATE menu_items SET image_url = NULL WHERE image_url IS NOT NULL;
UPDATE testimonials SET image_url = NULL WHERE image_url IS NOT NULL;
UPDATE business_settings SET image_url = NULL WHERE image_url IS NOT NULL;
```
