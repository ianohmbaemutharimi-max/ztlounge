# PROMOTIONS FIX — PHASE-BY-PHASE PLAN

**Status:** Phase 1 ✅ COMPLETE | Phase 2 🔄 IN PROGRESS  
**Target:** Fix discount schema mismatch, add toggle UX, create detail page

---

## PHASE 1: IMMEDIATE FIX (Data Persistence) 🔴 BLOCKING

**Goal:** Make promotions persist with working discounts

### Phase 1.1: Fix Form Schema
- [ ] Change form to use `discountPercent` only (drop `discountType`/`discountValue`)
- [ ] Update Zod schema: `discountPercent: z.coerce.number().min(0).max(100, "Max 100%")`
- [ ] File: `promotions-view.tsx`

### Phase 1.2: Fix Display Bug
- [ ] Change line 89: `p.discountValue` → `p.discountPercent`
- [ ] File: `promotions-view.tsx:89`

### Phase 1.3: Verify API Layer
- [ ] Confirm `repository.ts:111` has `discount_percent` ✅ Already correct
- [ ] Confirm `mapping.ts:262` has `discountPercent` ✅ Already correct
- [ ] Remove `discountType, discountValue` from `UNSUPPORTED_FIELDS`
- [ ] Files: `repository.ts`, `mapping.ts`

**Result:** Admins can create/edit promotions with discount that persists to DB

---

## PHASE 2: ENHANCE TOGGLE UX (Admin Experience)

**Goal:** Improve toggle button feedback and add validation

### Phase 2.1: Add Loading State
- [ ] Show spinner icon while mutation pending
- [ ] Disable button during request
- [ ] File: `promotions-view.tsx:93`

### Phase 2.2: Add Expiry Check
- [ ] Disable toggle when `endDate < today`
- [ ] Show tooltip explaining why disabled
- [ ] File: `promotions-view.tsx:77-93`

### Phase 2.3: Add Error Handling
- [ ] Catch toggle mutation errors
- [ ] Show error message if toggle fails
- [ ] File: `promotions-view.tsx:43-46`

---

## PHASE 3: CREATE DETAIL PAGE (Promo Owner Page)

**Goal:** Single-promotion view + destination for floating banner

### Phase 3.1: Create Route & Page
- [ ] Create `src/app/dashboard/promotions/[id]/page.tsx`
- [ ] Fetch single promo by ID
- [ ] Render full edit form (same as modal, but full-page)

### Phase 3.2: Navigation
- [ ] Link from list card to detail page (title/description)
- [ ] Add "Back to list" link on detail page

**Result:** Can navigate to promo owner page, see full details, edit in isolation

---

## FILES TO MODIFY

| File | Phase | Priority |
|------|-------|----------|
| `src/features/promotions/promotions-view.tsx` | 1, 2, 3 | 🔴 P0 |
| `src/lib/contract/mapping.ts` | 1 | 🔴 P0 |
| `src/app/dashboard/promotions/[id]/page.tsx` | 3 | 🟠 P1 |

---

**Ready to execute Phase 1? Let's go!**
