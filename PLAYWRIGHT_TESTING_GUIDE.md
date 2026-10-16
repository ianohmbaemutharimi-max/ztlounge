# 🎭 PLAYWRIGHT TEST SUITE - Quick Start Guide

## Prerequisites

Before running tests, ensure:
1. ✅ Website running on `http://localhost:8000`
2. ✅ Admin running on `http://localhost:3000`
3. ✅ Phase 1 migrations executed (045a, 046)
4. ✅ Phase 2-3 code deployed (MediaResolver v2.0.0 + repositories)

## Running Tests

### Option 1: Run All Tests (Headless)
```bash
node run-tests.js
```

### Option 2: Run Website Tests Only
```bash
node run-tests.js website
```

### Option 3: Run Admin Tests Only
```bash
node run-tests.js admin
```

### Option 4: Run with Visible Browser
```bash
node run-tests.js --headed
```

### Option 5: Run Specific File
```bash
npx playwright test tests/website-media-gateway.spec.js
```

## What Each Test Verifies

### Website Tests (tests/website-media-gateway.spec.js)

**Test 1: Home page loads hero slides with images**
- Verifies 2 hero slides render
- Checks images have src attributes
- Ensures NO contract errors (INVALID_MEDIA_CONTRACT, MEDIA_NOT_FOUND)

**Test 2: Gallery page loads all items with images**
- Verifies all 14 gallery items have images
- Confirms images come from media_assets (not fallback)
- Checks for contract violations

**Test 3: Services - Classic Haircut has image (Gap Fixed)**
- Finds Classic Haircut service
- Verifies it now has an image (migration 045a fixed gap)
- Ensures media_id was assigned correctly

**Test 4: Menu page loads items with images**
- Verifies menu items load with images
- Checks no contract violations

**Test 5: No fallback to legacy image_url**
- Verifies MediaResolver v2.0.0 is loaded
- Confirms exclusive gateway pattern in use

### Admin Tests (tests/admin-media-gateway.spec.js)

**Test 1: Admin dashboard loads**
- Verifies admin UI is accessible
- No critical errors

**Test 2-4: Hero/Gallery/Services pages accessible**
- Verifies all admin sections load
- No contract violations

**Test 5: Classic Haircut visible in admin**
- Can view Classic Haircut in services admin
- Shows media assignment

**Test 6: No contract errors**
- Admin pages have no violations
- Ready for Phase 4 integration

## Expected Results

### ✅ All Tests Pass
```
✅ Home page loads hero slides with images
✅ Gallery page loads all items with images
✅ Services - Classic Haircut has image (Gap Fixed)
✅ Menu page loads items with images
✅ No fallback to legacy image_url
✅ Admin dashboard loads
✅ (... admin tests ...)

Exit Code: 0
✅ ALL TESTS PASSED
```

### ❌ Failures Indicate

| Failure | Cause | Fix |
|---------|-------|-----|
| Images not loading | Migration not executed | Run migrations 045a + 046 |
| INVALID_MEDIA_CONTRACT error | Item has NULL media_id | Re-run migration 045a |
| MEDIA_NOT_FOUND error | media_id references missing asset | Create missing media_asset |
| Classic Haircut has no image | Gap not fixed | Run migration 045a |
| Fallback warnings | Code not deployed | Redeploy MediaResolver v2.0.0 |

## Test Output Files

After running tests, check:
- `./playwright-report/index.html` - Full HTML report (open in browser)
- `./test-results.json` - Machine-readable results
- Console output - Live test status

## Troubleshooting

### "Connection refused on localhost:8000"
```bash
# Ensure website is running
npm run dev      # In website directory (port 8000)
```

### "Connection refused on localhost:3000"
```bash
# Ensure admin is running
npm run dev:admin      # In admin directory (port 3000)
```

### "Tests timeout"
```bash
# Increase timeout in playwright.config.js
# Or manually start servers before running tests
```

### "Contract errors appear"
1. Check browser console for specific error
2. Verify migration 045a executed
3. Verify migration 046 executed
4. Check database: `SELECT COUNT(*) FROM services WHERE media_id IS NULL;`
5. If any NULL: gap not fixed, re-run migration

## Next Steps After Tests Pass

1. ✅ Review test results
2. ✅ Check HTML report for details
3. ✅ Verify NO contract violations
4. ✅ Verify ALL images load correctly
5. ✅ Ready for Phase 4 (Admin API validation)

---

**Status:** Phase 1-3 Verification Tests Ready
**Last Updated:** 2026-10-09
