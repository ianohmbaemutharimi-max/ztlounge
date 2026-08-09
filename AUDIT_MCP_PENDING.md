# ZT LOUNGE ADMIN — LIVE DATABASE ALIGNMENT AUDIT
## STATUS: PENDING MCP CONNECTION

**Audit Requested:** 2026-08-09 12:05 EAT  
**Audit Type:** READ-ONLY evidence-based alignment verification  
**Source of Truth:** Live Supabase database via MCP  
**Blocker:** MCP Supabase server not connected

---

## MCP CONNECTION STATUS

### Attempts
1. **12:00 PM** - `cBZizP0mcp0list_projects` → Error: "Not connected"
2. **12:01 PM** - `cBZizP0mcp0list_projects` → Error: "Not connected"

### Configuration Found
- **File:** `cline_mcp_settings.json`
- **Server:** `@supabase/mcp-server-supabase`
- **Token Format:** `sbp_` prefix (appears valid format)
- **Auto-approve:** `execute_sql`, `list_projects`, `list_tables`

### Likely Cause
- Access token may be expired or revoked
- MCP server process may not be running
- Network connectivity issue

### Resolution Required (USER ACTION)
1. Generate new Supabase access token from dashboard
2. Update `SUPABASE_ACCESS_TOKEN` in `cline_mcp_settings.json`
3. Restart VS Code or reload MCP server
4. Retry audit

---

## APPLICATION INVENTORY (COMPLETED)

While awaiting MCP connection, application analysis has identified:

### Expected Database Tables (22 total)

From `src/lib/resource-config.ts`:

| Resource | Table Name | Search Fields | Default Sort |
|----------|------------|---------------|--------------|
| bookings | `bookings` | booking_number, customer_id, staff_id | created_at DESC |
| booking-history | `booking_history` | — | created_at DESC |
| booking-notes | `booking_notes` | — | created_at DESC |
| customers | `customers` | full_name, email, phone | created_at DESC |
| services | `services` | name, description | display_order ASC |
| service-categories | `service_categories` | name, description | display_order ASC |
| menu-items | `menu_items` | name, description, category | display_order ASC |
| menu-categories | `menu_categories` | name, description | display_order ASC |
| staff | `staff` | full_name, email, position | created_at DESC |
| staff-availability | `staff_availability` | — | weekday ASC |
| staff-leave | `staff_leave` | — | start_date DESC |
| gallery | `gallery` | title, category, description | display_order ASC |
| file-uploads | `file_uploads` | — | created_at DESC |
| testimonials | `testimonials` | customer_name, comment | display_order ASC |
| contact-messages | `contact_messages` | full_name, email, message | created_at DESC |
| faqs | `faqs` | question, answer, category | display_order ASC |
| promotions | `promotions` | title, description | start_date DESC |
| hero-slides | `hero_slides` | — | display_order ASC |
| website-pages | `website_pages` | title, page_key, seo_title | page_key ASC |
| business-settings | `business_settings` | — | — |
| system-settings | `system_settings` | — | — |
| notifications | `notifications` | — | created_at DESC |
| activity-logs | `activity_logs` | — | created_at DESC |
| business-closures | `business_closures` | — | closure_date ASC |
| profiles | `profiles` | full_name, email | created_at DESC |
| roles | `roles` | — | name ASC |

### Application Architecture

**Database Access Pattern:**
```
UI Component → API Route → Repository.findAll/create/update/delete → Supabase Client
```

**Key Files:**
- `src/app/api/admin/[resource]/route.ts` - Main CRUD handler
- `src/lib/repository.ts` - Database abstraction with field mapping
- `src/lib/resource-config.ts` - Table and search field definitions
- `src/lib/validation/schemas.ts` - Payload validation (needs inspection)
- `src/lib/supabase/client.ts` - Connection configuration

**Field Name Handling:**
- **Client → API:** camelCase
- **API → Repository:** Converts to snake_case via `toSnakeKey()`
- **Repository → Database:** snake_case
- **Database → Repository:** Maps back to camelCase + snake_case (dual format)

### Authentication Architecture
- `src/lib/auth/server.ts` - `withAdminAuth` middleware
- `src/app/api/auth/session/route.ts` - Session management
- RLS compatibility intended (requires verification)

---

## PENDING AUDIT PHASES (BLOCKED)

### ❌ Phase 3: Live Database Inventory via MCP
**Requirements:**
- List all tables with columns, types, nullable, defaults
- Inspect all relationships (FK, PK)
- Inspect all constraints (unique, check)
- Inspect all indexes
- Inspect all enums
- Inspect all functions/RPCs
- Inspect all triggers
- Inspect ALL RLS policies with exact USING/WITH CHECK expressions
- Inspect auth configuration

**Status:** BLOCKED - requires MCP connection

### ❌ Phase 4: Application ↔ Database Matrix
**Requirements:**
- For EVERY application table/column, verify existence in live DB
- For EVERY live DB table/column, check if application uses it
- Compare data types
- Compare nullability
- Compare defaults
- Compare relationships
- Flag mismatches

**Status:** BLOCKED - requires live database inventory

### ❌ Phase 5-16: All Subsequent Phases
- Field-level alignment
- CRUD verification
- RLS policy verification
- RBAC alignment
- Gap analyses
- Migration drift
- Security audit
- Function/RPC alignment
- Data integrity
- Final classification

**Status:** ALL BLOCKED - require live database access

---

## NEXT STEPS

1. **USER:** Fix MCP Supabase connection
2. **AUDIT:** Retry `cBZizP0mcp0list_projects`
3. **AUDIT:** Execute live database inventory
4. **AUDIT:** Compare application vs live database
5. **AUDIT:** Generate definitive alignment report

---

## CRITICAL AUDIT PRINCIPLE

> The LIVE SUPABASE DATABASE accessed via MCP is the ONLY source of truth.

Any conclusions about alignment MUST be based on verified comparison between:
- Application code expectations
- Live database actual state

Migration files, TypeScript types, and documentation are comparison targets, NOT sources of truth.

---

**Audit Status:** ⏸️ PAUSED - Awaiting MCP connection restoration