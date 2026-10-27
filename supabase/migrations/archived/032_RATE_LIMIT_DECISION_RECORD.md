# Decision Record — Booking Rate Limit Hardening (Migration 032)

**Date:** 2026-08-06  
**Status:** REJECTED — No database changes required  
**Reviewer:** Automated audit via Supabase MCP

---

## Decision

**Migration 032 (both original and revised versions) is REJECTED.**

The booking rate limiting is **VERIFIED AS WORKING** in the current production database. No database changes are required.

---

## Evidence

### 1. Existing rate limiting is confirmed working

- `prevent_public_booking_spam` function (verified live) uses `customer_id` — set by `create_booking` RPC **before** the INSERT trigger fires
- Limits: 3 bookings per 60 minutes per `customer_id` (excluding cancelled)
- Skips staff bookings (`staff_id IS NULL` check)
- Works for anonymous users because `create_booking` finds/creates the customer record first

### 2. IP-based rate limiting NOT viable in Supabase PostgreSQL

Live test of `SELECT inet_client_addr()` returned:
```
2a05:d018:1e14:20a:bf84:8143:ef1f:116
```
This is the **Supabase proxy/pooler IP**, NOT the browser visitor IP.

Supabase sits behind a connection pooler. All users share proxy IPs, so:
- `get_client_ip()` would return the same IP for all visitors
- 5 bookings from any users within 60 min would block ALL subsequent bookings
- This would create a **false security assumption** and cause denial of service for legitimate customers

### 3. No application layer exists

The public site is static HTML/JS calling Supabase directly. There is no Next.js server or Edge Function to extract real IPs from `x-forwarded-for`.

---

## Files Archived

| Original File | Archived As |
|---------------|-------------|
| `supabase/migrations/032_booking_rate_limit_hardening.sql` | `supabase/migrations/archived/032_booking_rate_limit_hardening_REJECTED.sql` |
| `supabase/migrations/032_rate_limit_hardening_revised.sql` | `supabase/migrations/archived/032_rate_limit_hardening_revised_REJECTED.sql` |

---

## Future Recommendation (Non-Blocking)

If stronger anti-abuse protection is ever needed:

**Option A (Recommended):** Add Cloudflare Turnstile to booking forms — client-side anti-bot that does not require IP capture.

**Option B:** Add a server layer (Supabase Edge Function or Next.js API route) that:
1. Extracts real visitor IP from `x-forwarded-for` header
2. Passes it to `create_booking` RPC as `p_ip_address`
3. Stores it in a (future) `bookings.ip_address` column

Neither option is required for production launch.

---

## Verification Status

| Item | Status |
|------|--------|
| Booking rate limiting (customer_id-based) | ✅ VERIFIED — working |
| Migration 032 (IP-based) | ❌ REJECTED — not viable without app layer |
| Database changes | ✅ NONE REQUIRED |
| `create_booking` RPC | ✅ UNCHANGED |
| RLS policies | ✅ UNCHANGED |