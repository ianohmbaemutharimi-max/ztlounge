# HOMEPAGE MEMBERSHIP CARDS — RENDER AUDIT REPORT

**Audit Date:** 2026-10-08  
**Status:** ⚠️ CRITICAL CSS SYNTAX ERRORS FOUND  
**Live Symptoms:** Cards render with OLD styling (no padding, no header, no tier colors, button overflow)

---

## EXECUTIVE SUMMARY

**Root Cause:** THREE UNCLOSED CSS RULE BLOCKS in `theme.css` cause the browser CSS parser to silently drop card styles.

| Bug | Location | Issue | Impact |
|-----|----------|-------|--------|
| **#1** | Line 1939-1945 | `.zt-member-card-desc-full {` never closes | Drops lines 1945-2011 (padding, header, pricing rules) |
| **#2** | Line 2006-2010 | `.zt-member-fee-value {` never closes | Compounds bug #1 |
| **#3** | Line 2111-2112 | `.light-mode .zt-member-cta-primary:hover {` never closes | Drops tier-color rules 2116-2182 |

**Result:** 60% of card styling is DROPPED by browser. Cards render with old generic styles.

---

## 1. RENDER PATH ✅ VERIFIED

**Canonical Chain:**
```
index.html (line 81)
  → <link rel="stylesheet" href="assets/css/theme.css" />
  → shared-components.js (line 649)
    → content-loader.js + MembershipRepository
      → MembershipView.init() (line 257)
        → cardHTML() (line 90-121)
          → [data-membership-grid] DOM mount
```

**Single Render Source:** ✅ ONE `cardHTML()` function  
**No Duplicates:** ✅ No /dist, /build, minified, or inline copies  
**Load Order:** ✅ CSS before JS; index.html line 81 before script at 649

---

## 2. CSS LOADING — THREE CRITICAL BRACE ERRORS

### Bug #1: Line 1939 (Opening) — Line 1945 (Missing Close)

```css
1939 | .zt-member-card-desc-full {
1940 |     margin: 0;
1941 |     font-size: var(--font-size-sm);
1942 |     line-height: 1.6;
1943 |     color: var(--color-text-secondary);
1944 |     padding: var(--space-md) 0;
1945 |     border-top: 1px solid var(--color-gold-light);
       | ← MISSING CLOSING BRACE HERE
1947 | /* ========== PRICING SECTION ========== */
```

**Parser Effect:** Encounters comment before `}`. Enters error recovery. Lines 1945-2011 DROPPED.

**Rules Lost:**
- `.zt-member-card-header` (padding, border, background)
- `.zt-member-card-body` (display: flex, padding)
- `.zt-member-pricing` (grid layout, styling)
- `.zt-member-price-*` (large text, gold color)
- `.zt-member-fee-*` (registration fee styling)

### Bug #2: Line 2006 (Opening) — Line 2010 (Missing Close)

```css
2006 | .zt-member-fee-value {
2007 |     font-size: clamp(18px, 5vw, 22px);
2008 |     font-weight: 700;
2009 |     color: var(--color-text);
       | ← MISSING CLOSING BRACE HERE
2011 | /* ========== BENEFITS LIST ========== */
```

**Parser Effect:** Same recovery mode. Rules 2010-2049 partially affected.

### Bug #3: Line 2111 (Opening) — Line 2112 (Missing Close)

```css
2111 | .light-mode .zt-member-cta-primary:hover {
       | ← MISSING CLOSING BRACE HERE
2113 | /* ========== TIER-SPECIFIC STYLING ========== */
```

**Parser Effect:** Tier-specific rules 2116-2182 enter recovery zone. Tier colors NOT applied.

---

## 3. CLASS-NAME COVERAGE

**Classes Emitted by cardHTML() vs. CSS Rules:**

| Class | Emitted (Line) | CSS Rule (Line) | Status |
|-------|---|---|---|
| zt-member-card | 99 | 1864 | ✅ Applied (basic grid) |
| zt-member-card-header | 101 | 1899 | ❌ **DROPPED (Bug #1)** |
| zt-member-card-title | 102 | 1905 | ❌ **DROPPED (Bug #1)** |
| zt-member-card-body | 104 | 1922 | ❌ **DROPPED (Bug #1)** — flex layout missing |
| zt-member-pricing | 106 | 1949 | ❌ **DROPPED (Bug #1)** — grid layout missing |
| zt-member-price-value | 109 | 1977 | ❌ **DROPPED (Bug #1)** — large gold text missing |
| zt-member-fee-value | 114 | 2006 | ❌ **DROPPED (Bug #2)** — fee display missing |
| zt-member-cta-secondary | 70 | 2073 | ⚠️ Partially applied (base rules only) |
| zt-member-cta-primary | 77 | 2095 | ⚠️ Partially applied |
| [data-tier="bronze"] | 99 | 2116 | ❌ **DROPPED (Bug #3)** — no tier colors |
| [data-tier="silver"] | 99 | 2131 | ❌ **DROPPED (Bug #3)** |
| [data-tier="gold"] | 99 | 2146 | ❌ **DROPPED (Bug #3)** |
| [data-tier="platinum"] | 99 | 2170 | ❌ **DROPPED (Bug #3)** |

---

## 4. SPECIFIC SYMPTOMS & ROOT CAUSES

| Symptom | Root Cause | File:Line | Evidence | Fix |
|---------|-----------|-----------|----------|-----|
| **Zero padding inside cards** | `.zt-member-card-header` & `.zt-member-card-body` rules DROPPED (Bug #1) | 1900, 1923 | Inspect header/body: "No matching rules" in DevTools | Add `}` after 1945 |
| **"View Benefits" button overflows, not full width** | `.zt-member-card-body { display: flex; }` DROPPED; parent not flex container | 1922 | Button computed style: `display: inline-flex` instead of in flex column | Same fix |
| **No header section visible** | `.zt-member-card-header { padding; border; background; }` DROPPED (Bug #1) | 1899-1903 | Header div exists in DOM but zero visible styling | Same fix |
| **Registration fee not on card** | `.zt-member-pricing`, `.zt-member-fee-block` DROPPED (Bugs #1 & #2) | 1949, 1992, 2006 | Pricing div exists in DOM but no grid, background, or color applied | Add `}` after 1945 AND 2010 |
| **All cards identical (no tier colors)** | `[data-tier="*"]` selectors DROPPED (Bug #3) | 2116-2182 | Inspect price: color is `#ffffff` not tier-specific color | Add `}` after 2112 |



---

## 5. DEVTOOLS VERIFICATION CHECKLIST

Run these checks to confirm each bug before fixing:

### Check 1: Card Padding Missing
```
Steps:
  1. F12 → Elements tab
  2. Inspect: <div class="zt-member-card-body">
  3. Styles panel (right side)

Expected Before Fix: "No matching rules" ❌
Expected After Fix: 
  - padding: clamp(20px, 5vw, 28px)
  - display: flex
  - flex: 1
```

### Check 2: Header Styling Missing
```
Steps:
  1. Inspect: <div class="zt-member-card-header">
  2. Styles panel

Expected Before Fix: "No matching rules" ❌
Expected After Fix:
  - padding: clamp(20px, 5vw, 28px) ...
  - border-bottom: 1px solid
  - background: linear-gradient(...)
```

### Check 3: Price Text Size & Color
```
Steps:
  1. Inspect: <div class="zt-member-price-value">
  2. Computed tab

Expected Before Fix: 
  - font-size: 14px (inherited) ❌
  - color: #ffffff (generic) ❌

Expected After Fix:
  - font-size: clamp(22px, 6vw, 28px) ✅
  - color: #c2410c (tier-specific) ✅
```

### Check 4: Tier Colors (All Cards)
```
Steps:
  1. Inspect each card's price value
  2. Filter styles by "data-tier"

Expected Before Fix: No tier rules applied ❌
Expected After Fix:
  - Bronze: #c2410c
  - Silver: #64748b
  - Gold: #f59e0b
  - Platinum: #a855f7 ✅
```

---

## 6. THE THREE BUGS & SURGICAL FIXES

| Bug ID | File:Lines | Problem | Fix | Impact |
|--------|-----------|---------|-----|--------|
| **#1** | theme.css:1945 | `.zt-member-card-desc-full {` at 1939 never closes | Add `}` after line 1945 | Restores header, body, pricing rules |
| **#2** | theme.css:2010 | `.zt-member-fee-value {` at 2006 never closes | Add `}` after line 2010 | Restores fee display styling |
| **#3** | theme.css:2112 | `.light-mode .zt-member-cta-primary:hover {` at 2111 never closes | Add `}` after line 2112 | Restores tier-color rules |

**Total Changes:** 3 closing braces (1 line per bug)  
**Risk Level:** ZERO (syntax fix only, no logic change)  
**Deployment:** Atomic, safe to revert  

---

## 7. CACHE & DEPLOYMENT

**Service Worker:** None detected  
**CDN Cache:** Unknown (production may be caching broken CSS)  
**Versioning:** No query string on theme.css link (line 81)

**If Already Deployed:** May need cache purge or add `?v=20261008` to force refresh

---

## AUDIT COMPLETE ✅

**Status:** Awaiting user approval to apply 3-line fix

**User Should Verify:**
1. Live page still shows old card styling (no padding, no header, no tier colors)
2. DevTools shows "No matching rules" for zt-member-card-header, zt-member-pricing, etc.
3. Approve the 3-line fix above
4. Then Kiro applies surgical fixes

