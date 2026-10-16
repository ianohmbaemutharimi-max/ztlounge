# Issue #2: created_by Foreign Key Constraint - TEST REPORT

## Status: ✅ FIXED & VERIFIED

### Verification Results

**Code Analysis**:
- ✅ Line 75 (`route.ts`): `created_by: auth.session.profile.id` - CORRECT
- ✅ Not using: `auth.session.user.id` - REMOVED
- ✅ Schema line 469: `references(() => profiles.id)` - CORRECT FK
- ✅ Migration line 19: `REFERENCES public.profiles(id)` - CORRECT

**Test Suite**: `tests/e2e/issue-2-created-by-fk.spec.ts`

Tests included:
1. ✅ `should use profile.id not user.id in team-invitations route`
2. ✅ `database schema should reference profiles table`
3. ✅ `migration should define created_by with FK to profiles`
4. ✅ `SessionContext should provide profile.id property`
5. ✅ `should prevent FK constraint violations`

### What Was Fixed

**Before (WRONG)**:
```typescript
created_by: auth.session.user.id  // ❌ auth.users.id
```

**After (CORRECT)**:
```typescript
created_by: auth.session.profile.id  // ✅ profiles.id
```

### Database Schema Context

```sql
-- Migration 045
team_invitations (
  ...
  created_by UUID NOT NULL REFERENCES public.profiles(id),  -- ✅ FK to profiles
  ...
)
```

The `created_by` field must reference `profiles.id`, not `auth.users.id` because:
- `profiles.id` is the primary key of the profiles table
- `auth.users.id` is from the auth system (external)
- Database FK constraints require matching types and tables

### SessionContext Structure

```typescript
interface SessionContext {
  user: {
    id: string;        // auth.users.id - for auth purposes
  };
  profile: {
    id: string;        // profiles.id - for database references ✅
    full_name: string;
    role_id: string;
    role_name: string;
  };
}
```

### Impact of Fix

**Without Fix (❌ Broken)**:
- FK constraint violation on insertion
- "No matching profile.id for auth.user.id"
- Invitations cannot be created
- Database error: 500

**With Fix (✅ Working)**:
- Correct admin profile referenced
- Invitations created successfully
- Data integrity maintained
- No constraint violations

### How to Run Tests

```bash
cd zt-lounge-admin
npx playwright test tests/e2e/issue-2-created-by-fk.spec.ts --headed
```

### Test Files Location
- Main test: `tests/e2e/issue-2-created-by-fk.spec.ts`
- Code being tested:
  - `src/app/api/admin/team-invitations/route.ts` (line 75)
  - `src/db/schema.ts` (line 469)
  - `src/lib/auth/server.ts` (SessionContext interface)
  - `supabase/migrations/045_create_team_invitations.sql`

---

## Next: Issue #3 - Staff Creation Error Handling

Ready to test Issue #3 fix?
