# Testimonials Mini-System (Verified 2026-10-18)

## Declared contract (`TestimonialsRepository.js` header)

- `getAll()` / `getFeatured()`
- Field mapping claim: `comment → content`; author from
  `customer.first_name + customer.last_name`; only approved testimonials.
- Data: Supabase `testimonials` with local config fallback.

## Live production shape (anon-verified: 8 rows at audit; **0 rows** as of 2026-10-18 — anon tier now returns nothing, so the public site serves the static fallback)

Columns actually exposed: `id, comment, rating, occupation, is_featured,
is_visible, approved, created_at`. **No `author`, no `customer_id` join, no
`image_url`, no `media_id`, no `page_id`.** RLS anon tier filters
`is_visible AND approved` server-side.

## Implementation (verified)

- `getAll()`: `approved = true`, ordered `created_at DESC`; empty → static
  `testimonials.config.js` items.
- `getFeatured()`: adds `is_featured = true`; same fallback (filtering
  `featured/is_featured` locally).
- `mapToUI()`: builds `author` from `customer_name` → `author` → `customer`
  relation — **all three sources are absent in the live schema**, so `author`
  is always `''` (UI must show an anonymous fallback such as "ZT Lounge Guest").
  Maps `image_url` (always `''` live) and returns canonical `comment`.

## Contract verdict

| Item | Status |
|------|--------|
| Declared exports == actual | ✅ |
| "comment → content" mapping claim | ❌ stale — implementation returns `comment` (canonical), never `content` |
| Customer-joined author name | ❌ impossible live (no public join; likely removed for privacy) |
| `image_url` in mapper | ❌ dead field (column doesn't exist; avatar always empty) |
| Server-side visibility filter | ✅ RLS double-gates `approved` + `is_visible` (repo filters are defense-in-depth) |
| Static fallback | ✅ `testimonials.config.js` |

## Admin

`testimonials` is a full admin resource (service_role; 8 rows at audit, anon
tier returns 0 since 2026-10-18) with
`customer_name` fields creatable via admin even though the public mapper
prefers the (nonexistent) relation join — admin-created `customer_name` **will**
surface because `mapToUI` checks it first.

## Related finding (cross-system)

`MEDIA.md` notes migration `055` plans a `testimonials.media_id` NOT NULL
cutover; the column does not exist in production yet.
