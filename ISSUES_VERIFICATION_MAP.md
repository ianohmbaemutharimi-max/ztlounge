# Team Invitations - Issue Verification Map

## ISSUE #1: Dashboard Incomplete ❌ CRITICAL
**File**: `src/app/dashboard/team/page.tsx`
**Problem**: Only has invite form, missing entire invitations list display
- No `fetchInvitations()` implementation
- No table rendering
- No filtering UI
- No resend/cancel buttons

**Impact**: Feature 30% complete - users can send but not manage invitations
**Fix**: Add complete list UI with filtering and actions

---

## ISSUE #2: Auth Context ✅ FALSE POSITIVE
**Files**: `src/app/api/admin/team-invitations/route.ts` (line 94)
**Code**: `auth.session.profile.full_name`

**Verification**: ✅ CORRECT
- Checked `src/lib/auth/server.ts` (lines 34-46)
- SessionContext.profile.full_name DOES exist
- Type is `string` - properly defined

**Status**: NO FIX NEEDED - code is correct

---

## ISSUE #3: Missing nodemailer ❌ HIGH PRIORITY
**File**: `src/lib/email/team-invitations.ts` (line 1)
**Problem**: Imports `nodemailer` but NOT in `package.json`

**Current Dependencies**: No nodemailer found (checked lines 17-32)

**Impact**: Email sending will fail at runtime with "Cannot find module"
**Workaround in code**: Line 97-99 silently catches errors, invitations still create

**Fix Required**:
```bash
npm install nodemailer
npm install -D @types/nodemailer
```

---

## ISSUE #4: Staff Creation Error Not Handled ❌ MEDIUM
**File**: `src/app/api/invitations/accept/[token]/route.ts` (lines 114-131)

**Problem**: Staff record insertion has NO error handling
```typescript
await supabase.from("staff").insert({...});  // No error check!
```

**Cascade**:
- Auth account ✅ created
- Profile ✅ created
- Staff ❌ fails → silently ignored
- Invitation ✅ marked ACCEPTED
- Returns SUCCESS ✅ (but incomplete)

**Result**: User thinks fully set up, but staff record missing

**Fix**: Add try-catch or check staff creation error

---

## ISSUE #5: created_by Uses Wrong ID ❌ HIGH PRIORITY
**Files**: 
- `src/app/api/admin/team-invitations/route.ts` (line 75)
- `src/app/api/admin/team-invitations/[id]/route.ts` (line 102)

**Problem**:
```typescript
created_by: auth.session.user.id  // ❌ WRONG - auth users ID
```

**Should be**:
```typescript
created_by: auth.session.profile.id  // ✅ CORRECT - profiles ID
```

**Why**: Schema has `created_by UUID REFERENCES profiles(id)`
- Must use `auth.session.profile.id` not `auth.session.user.id`
- Current code will fail FK constraint or create wrong reference

**Verified**: SessionContext has both:
- `user.id` → auth.users.id
- `profile.id` → profiles.id

**Fix Required**: Change to use profile.id (2 files, 2 locations)

---

## ISSUE #6: No Transaction Rollback ❌ MEDIUM
**File**: `src/app/api/invitations/accept/[token]/route.ts`

**Problem**: Multi-step account creation with partial rollback

**Current**:
- ✅ Rolls back auth if profile fails (line 107)
- ❌ No rollback if staff creation fails
- ❌ No rollback if invitation update fails

**Result**: Orphaned accounts or partial data states

**Fix**: Add rollback for staff creation failure

---

## ISSUE #7: No Env Validation ⚠️ LOW
**File**: `src/lib/email/team-invitations.ts` (lines 12-20)

**Problem**: Silently defaults to "localhost" if SMTP_HOST missing
- `host: process.env.SMTP_HOST || "localhost"`
- `port: parseInt(process.env.SMTP_PORT || "587")`

**Impact**: Config errors not caught until first email attempt

**Fix**: Add startup validation

---

## SUMMARY

| Issue | Severity | Status | Type |
|-------|----------|--------|------|
| 1. Dashboard incomplete | 🔴 CRITICAL | ❌ Broken | Missing Code |
| 2. Auth context | 🟢 NONE | ✅ OK | False Alarm |
| 3. Missing nodemailer | 🟠 HIGH | ❌ Broken | Dependency |
| 4. Staff error handling | 🟡 MEDIUM | ⚠️ Risky | Error Handling |
| 5. created_by wrong ID | 🟠 HIGH | ❌ Broken | Logic Error |
| 6. No rollback | 🟡 MEDIUM | ⚠️ Risky | Error Handling |
| 7. Env validation | 🟡 LOW | ⚠️ Risky | Config |

---

## FIX PRIORITY

**MUST FIX** (won't work without):
1. Issue #3: Add nodemailer to package.json
2. Issue #5: Fix created_by to use profile.id

**SHOULD FIX** (system partially broken):
3. Issue #1: Complete dashboard list UI
4. Issue #4: Add staff error handling
5. Issue #6: Add transaction rollback

**NICE TO FIX**:
6. Issue #7: Add env validation
