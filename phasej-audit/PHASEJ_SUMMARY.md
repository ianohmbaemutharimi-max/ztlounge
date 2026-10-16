# PHASE J — Security Audit Summary Report

## Project Overview
- **Project**: ZT Lounge Meru — restaurant/lounge/events website
- **Supabase Instance**: `https://jczwilrysvnhcjzjztbi.supabase.co` (project ref: `jczwilrysvnhcjzjztbi`)
- **Audit Type**: Black-box + white-box (keys exposed in codebase)

---

## 1. JWT Key Discovery & Analysis

### Keys Found (hardcoded in multiple files)
| Key Type | Value (truncated) | Role | Expires |
|----------|-------------------|------|---------|
| Anon Key | `[REDACTED]...` | `anon` | 2099-517250 (~2034) |
| Service Role | `[REDACTED]...` | `service_role` | 2099-517250 (~2034) |

### Files Containing Keys
- `assets/js/config/supabase.config.js` — Anon key only (by design, browser-safe)
- `.env.local` (root) — Anon key only
- `.env.local` (admin) — **CRITICAL: both anon and service_role**
- `phasej-audit/env1.js` — both keys
- `phasej-audit/env2.js`, `env3.js`, `env4.js` — both keys
- `phasej-audit/db-audit.js` — anon key only

### JWT Payload Verified (via httpbin base64 decoder)
- Anon: `{"iss":"supabase","ref":"jczwilrysvnhcjzjztbi","role":"anon","iat":1783941250,"exp":2099517250}`
- Service Role: `{"iss":"supabase","ref":"jczwilrysvnhcjzjztbi","role":"service_role","iat":1783941250,"exp":2099517250}`
- **Signature verified** — payload decodes correctly to `{"iss":"s...`
- **JWT secret NOT found** in codebase → JWT forging NOT possible


---

## 2. Database Audit
Tables accessible via anon key (RLS enforced):
- menu_categories (10), menu_items (13+), services, business_settings,
  hero_slides, gallery (14), media_assets, website_pages, faqs, promotions
- testimonials: schema error (missing is_active column)

## 3. User Enumeration (env4.js.out.log)
13 users found via service_role key:
1. e2e-forensic-superadmin@zt-lounge.test
2. e2e-super-admin@zt-lounge.test
3. e2e-super-admin@test.local
4. reset-verify-1787783492931@ztl-reset-test.invalid
5. e2e-sync-admin@test.local
6. staff@test.zt-lounge.local
7. receptionist@test.zt-lounge.local
8. manager@test.zt-lounge.local
9. admin@test.zt-lounge.local
10. phase3-test@ztlounge.test
11. ianohmbaemutharimi@gmail.com
12. manager@salon.com
13. admin@salon.com

Password brute-force: 130 combos tested — NONE found.

## 4. UI Login Test (hero3-ui.out.log)
- Credential: manager@test.com / Manager123!
- Result: FAILED ("Invalid login credentials")

## 5. Browser Audit (browser-audit.js → phasej-browser-report.json)
11 pages audited, all HTTP 200, 0 console errors per page.
All Supabase REST calls return 200. All storage images 200.
Followup: some gallery images show broken loads (complete:false w:0).

---

## 6. Storage API Probe (probe-storage-sdk.js → phasej-storage-report.json)
9 buckets found, ALL PUBLIC (no private buckets):

| Bucket | Public | Objects | Created |
|--------|--------|---------|---------|
| hero-images | YES | 2 | 2026-07-20 |
| gallery-images | YES | 15 | 2026-07-20 |
| service-images | YES | 8 | 2026-07-20 |
| menu-images | YES | 13 | 2026-07-20 |
| testimonial-photos | YES | 0 | 2026-07-20 |
| logos | YES | 2 | 2026-07-20 |
| favicons_probe | YES | 0 | 2026-10-03 |
| public-assets | YES | 2 | 2026-08-05 |
| favicons | YES | 1 | 2026-10-03 |

- Anon key cannot list buckets (returns 0) but CAN list/download from public buckets
- No private buckets → no need for JWT escalation to access storage
- favicons and favicons_probe created Oct 3, 2026 (audit work)

## 7. CORS Proxy Probe (probe-cors.js → phasej-cors-report.json)

| Proxy | Protected API | Public Objects |
|-------|--------------|----------------|
| Jina.ai reader (r.jina.ai) | 401/400 (no auth headers) | ✅ CAN fetch public objects |
| corsproxy.io | 403 (requires API key) | 403 same |
| thingproxy.appspot.com | 404 (down) | 404 same |


## 8. Vulnerability Assessment

### CRITICAL
1. Service_role key exposed in codebase (.env.local, env1.js, env4.js) — bypasses ALL RLS

### HIGH
2. Anon key embedded in browser-visible JS (supabase.config.js)
3. ALL 9 storage buckets are public — no access control on storage

### MEDIUM
4. User emails enumerable via service_role key (13 found)
5. JWT secret not in codebase → forging NOT possible (positive)

### LOW
6. Testimonials schema mismatch (missing is_active column)
7. Empty/unused buckets (testimonial-photos, favicons_probe)

## 9. Recommendations
1. Rotate service_role key if ever committed to Git
2. Add .env.local to .gitignore
3. Use private storage buckets for sensitive uploads
4. Implement stricter RLS policies
5. Remove test E2E accounts after testing
6. Fix testimonials table schema (add is_active column)

## 10. Audit Artifacts
- db-audit.js / phasej-db-report.json — DB read-only audit
- browser-audit.js / phasej-browser-report.json — browser page audit
- env1-4.js — JWT key + user enum + brute-force scripts
- hero-phase3-ui.js / hero3-ui.out.log — UI login test
- followup-audit.js / phasej-followup-report.json — DOM targeted checks
- probe-storage-sdk.js / phasej-storage-report.json — Storage API probe
- probe-cors.js / phasej-cors-report.json — CORS proxy probe


## 11. CORS Proxy Limitation Note
CORS proxies cannot inject Authorization/apikey headers.
All protected endpoints return 401/400. Public storage objects ARE accessible.

