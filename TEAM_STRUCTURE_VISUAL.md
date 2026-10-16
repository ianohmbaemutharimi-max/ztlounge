# 🗺️ TEAM MANAGEMENT STRUCTURE - VISUAL MAP

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ AUTHENTICATION: Supabase auth.users (id = UUID)             │
│ ↓ user_id links to profiles                                │
├─────────────────────────────────────────────────────────────┤
│ PROFILES: id, user_id, role_id, full_name                 │
│ ↓ role_id links to roles                                  │
├─────────────────────────────────────────────────────────────┤
│ ROLES: super_admin, admin, manager, staff, content_manager │
├─────────────────────────────────────────────────────────────┤
│ STAFF: id, profile_id (optional), position, hire_date      │
│ └─ Can exist without auth account                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Three Identity Chains

**Chain A:** auth.users → profiles (customer) ✗ No dashboard  
**Chain B:** auth.users → profiles (admin/mgr) → staff (optional) ✓ Dashboard  
**Chain C:** staff (no auth) → profiles (optional) ✓ Bookable  

---

## Roles & Access

```
super_admin  → Full access
admin        → Full access
manager      → Content management
staff        → Limited (bookings, own schedule)
content_manager → Gallery, testimonials, uploads
customer     → No dashboard
```

---

## Current Status

✅ Built: Auth layer, profiles, roles, staff, repository, middleware  
⏳ Missing: Team invitations, dashboard team page, invite UI

---

## Files

```
src/lib/auth/server.ts       ← Auth functions
src/middleware.ts            ← Auth middleware
src/db/schema.ts             ← Database schema
src/app/dashboard/team/page.tsx ← TO BUILD
```

---

**Ready for Team Management Implementation - 2026-10-09**
