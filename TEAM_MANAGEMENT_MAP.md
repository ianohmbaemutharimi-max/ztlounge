# 🎯 TEAM MANAGEMENT MAPPING

## Overview
ZT Lounge has a multi-layered team management system with three distinct identity chains:
1. **Authentication** (Supabase auth.users)
2. **Admin/Staff Profiles** (profiles + roles)
3. **Employee Records** (staff table for operational data)

---

## 1. IDENTITY ARCHITECTURE

### Chain A: Authentication Identity
```
Supabase auth.users (id = UUID)
  ↓ Used for session management & login
```

### Chain B: Admin/Staff Identity (Dashboard Access)
```
profiles (id, user_id, role_id) → roles
  ↓ User logs in → auth.uid() matches profiles.user_id → lookup role
```

### Chain C: Employee/Operational Data
```
staff (id, profile_id, employee_number, ...)
  ↓ Used for scheduling, availability, bookings
  Optional FK to profiles.id (can be NULL, can exist without auth)
```

---

## 2. DATABASE SCHEMA

### Roles Table
```
id (UUID, PK)
name (TEXT, UNIQUE) — super_admin, admin, manager, staff, content_manager, customer
description (TEXT)
created_at (TIMESTAMP)
```

### Profiles Table
```
id (UUID, PK)
user_id (UUID, UNIQUE, FK→auth.users.id) — Can be NULL
full_name (TEXT, NOT NULL)
phone (TEXT)
role_id (UUID, FK→roles.id, NOT NULL)
avatar_url (TEXT)
is_active (BOOLEAN, default: true)
created_at, updated_at (TIMESTAMP)
```

### Staff Table (Operational)
```
id (UUID, PK)
profile_id (UUID, FK→profiles.id) — Optional
employee_number (TEXT)
full_name (TEXT, NOT NULL)
email (TEXT)
phone (TEXT)
position (TEXT, NOT NULL)
bio (TEXT)
photo_url (TEXT)
hire_date (DATE)
is_active (BOOLEAN, default: true)
created_at, updated_at (TIMESTAMP)
```

### Staff Availability & Leave
```
staff_availability: staff_id, weekday, start_time, end_time, is_available
staff_leave: staff_id, leave_type, start_date, end_date, reason, approval_status, approved_by
```

---

## 3. AUTHORIZATION

### Auth Constants (`src/lib/auth/server.ts`)
```typescript
ADMIN_ROLES = ["super_admin", "admin"]
CONTENT_MANAGER_ROLES = ["super_admin", "admin", "manager"]
EMPLOYEE_ROLES = ["super_admin", "admin", "staff"]
```

### Auth Functions
- `getServerSession(req?)` — Get current session with profile & role
- `requireAdmin(req?, allowedRoles?)` — Enforce admin role check
- `withAdminAuth(handler)` — HOF wrapper for API routes
- `withContentManagerAuth(handler)` — HOF for content manager routes

---

## 4. CURRENT STATUS

### ✅ What Exists
- Roles table & model
- Profiles & auth linkage
- Role-based access control
- Staff table with availability & leave
- Dashboard auth gates
- Generic admin CRUD (repository)

### ⏳ What's Missing
- Team invitations system
- Dashboard team management page
- Invite email templates
- Bulk import UI
- Team member CRUD UI

---

## 5. KEY FILES

**Core Auth:**
- `src/lib/auth/server.ts`
- `src/middleware.ts`
- `src/components/RoleGuard.tsx`

**Data:**
- `src/db/schema.ts`
- `src/lib/repository.ts`
- `src/lib/contract/mapping.ts`

**Dashboard:**
- `src/app/dashboard/layout.tsx`
- `src/components/DashboardNav.tsx`

**Scripts:**
- `scripts/phase0-team-invitations-ground-truth.mjs`

---

## 6. API ALLOWLISTS

**Profiles Response:** id, full_name, phone, avatar_url, is_active, created_at, updated_at
**Profiles Writable:** full_name, phone, avatar_url, is_active

**Staff Response:** id, profile_id, employee_number, full_name, email, phone, position, bio, photo_url, hire_date, is_active, created_at, updated_at
**Staff Writable:** profile_id, employee_number, full_name, email, phone, position, bio, photo_url, hire_date, is_active

---

## 7. TEST ACCOUNTS

- `admin@test.zt-lounge.local` — super_admin
- `manager@test.zt-lounge.local` — manager
- `staff@test.zt-lounge.local` — staff
- `receptionist@test.zt-lounge.local` — staff

---

**Status:** ✅ Ready for Team Management implementation
**Last Updated:** 2026-10-09
