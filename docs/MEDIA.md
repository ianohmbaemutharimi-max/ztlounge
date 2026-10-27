# Media Gateway Mini-System (Verified 2026-10-18)

## The contract (code-enforced)

`assets/js/repositories/MediaResolver.js` — the **exclusive gateway** for all
content imagery. Three hard enforcements (verified in code):

1. `INVALID_MEDIA_CONTRACT` — item has no `media_id` (or is null).
2. `MEDIA_NOT_FOUND` — `media_id` not resolvable from `media_assets`.
3. `MEDIA_INVALID` — asset resolved but has no `public_url`.

Batched: one `public_assets`-bucket query per page load (`in(...)` of collected
ids), in-memory cache (15 min), no N+1. Gallery additionally throws on
missing/failed media (`GalleryRepository.resolveMedia`); hero/promotions degrade
to no-image instead.

## Table (`media_assets`, anon-verified: 197 rows as of 2026-10-18)

13 columns incl. `public_url`, `storage_path`, `media_lane` (enum: `branding`,
`spa`, `barbershop` — CHECK added in `051`), `is_favorite`, `alt_text`.
Live lanes: gallery images 4 (lanes: restaurant, lounge, events, vip), brand
logos 3 (`branding`), membership plan images 3 (`spa`).

⚠️ Registry drift: `supabase.config.js` maps `mediaLane: 'media_lane'` but the
enum type is named `media_lane_type` in migration `051`.

## Migration chain (all read)

`044` gallery image migration → `0455` classic-haircut media gap fix (renamed
from `045a`; the CLI skips non-`<digits>_` names) → `046`
exclusive-gateway phase 1 (enforcement setup) → `050` reconstruct media_assets
DDL → `051` lane scope → `052` reconstruct `media_id` gateway columns
(hero_slides, gallery, services, menu_items) → `053` backfill + canonicalize →
`054` schema reconcile. The revert of `053` (`053_revert_…`, would undo the
now-verified live backfill) and `055` canonical-media readiness (incl. planned
`testimonials.media_id NOT NULL`; a checklist, not a chain step) were moved to
`archived/` on 2026-10-18.

## Live production state — verified 2026-10-18 (post-reconciliation)

**All gateway columns are live and populated.** An earlier "052–056 not
applied" reading came from probes taken during an endpoint-instability window
and has been disproven by fresh anon-REST checks:

| Table | media_id live? | Evidence |
|-------|----------------|----------|
| `gallery` | ✅ yes | REST rows expose `media_id`; resolver maps to `public_url` |
| `membership_plans` | ✅ yes | row includes `media_id`; plan images render via resolver |
| `business_settings` | ✅ (3 FKs) | resolved logos applied live |
| `hero_slides` | ✅ yes | `media_id` populated on live rows |
| `menu_items` | ✅ yes | `media_id` populated on live rows |
| `services` | ✅ yes | `media_id` populated (45 rows) |

⇒ The "media_id is the ONLY gateway" claim now matches production. Migration
history was reconciled the same day (33 out-of-band `schema_migrations`
orphans reverted; local `026`–`054`,`057` recorded applied) and `056` was
pushed as the only pending file; `migration list` shows Local = Remote for
every version. Code-side consumption differs per repository — see the
per-system docs.

## Verification gap

`staff*`, `booking_history/notes`, `google_*` DDL and any service_role-only
views could not be inspected (anon probes only). The endpoint was unreachable
at the audit's close but healthy again on 2026-10-18 (all verification probes
above re-run successfully). A **service_role schema dump** is still required
to complete this document.
