# Auto-Mark Notifications as Read - Complete Implementation

## Overview

This document describes the **complete auto-mark-as-read notification system** that automatically marks notifications as read when admins:
1. **Open the notification bell panel** (Phase 1 - previous session)
2. **Visit related dashboard routes** (Phase 2 - this session)

---

## 🎯 Features Implemented

### Phase 1: Bell Panel Auto-Mark (✅ Complete)
- When admin clicks the bell icon, all unread notifications are auto-marked as read

### Phase 2: Route-Based Auto-Mark (✅ Complete)
- When admin visits `/dashboard/bookings`, all `booking_created` notifications are auto-marked
- When admin visits `/dashboard/promotions`, all `promo_*` notifications are auto-marked
- Works for ALL dashboard routes with mapped notification types
- Covers both list pages AND detail view pages automatically

### Phase 3: Promotion Expiry Notifications (✅ Complete)
- New database migration for promotion notifications
- Three notification types: `promo_created`, `promo_updated`, `promo_expiring`

---

## 📋 Implementation Details

### 1. Database Migration: Promotion Notifications

**File:** `supabase/migrations/048_admin_promotion_notifications.sql`

Creates three triggers for promotion notifications:

#### Trigger 1: Promotion Created
```sql
-- Fires when a new promotion is INSERTED
AFTER INSERT ON promotions
→ Creates 'promo_created' notifications for all active admins
```

#### Trigger 2: Promotion Updated
```sql
-- Fires when promotion status changes (is_active)
AFTER UPDATE ON promotions
→ Creates 'promo_updated' notifications when activated/deactivated
```

#### Trigger 3: Promotion Expiring
```sql
-- Function: notify_admins_on_promotion_expiring()
-- Can be called manually or by pg_cron scheduler
-- Creates 'promo_expiring' for promotions expiring within 3 days
-- Includes duplicate detection (won't notify twice same day)
```

**To enable daily expiry checks (optional):**
```sql
-- Run in Supabase SQL Editor if pg_cron is available:
SELECT cron.schedule(
  'check-promo-expiry',
  '0 9 * * *',  -- Daily at 9 AM
  'SELECT public.notify_admins_on_promotion_expiring()'
);
```

---

### 2. Route-to-Notification Mapping

**File:** `zt-lounge-admin/src/lib/notification-routes.ts`

Defines which notification types should be marked as read when visiting specific routes:

```typescript
export const ROUTE_NOTIFICATION_MAP: RouteNotificationMapping[] = [
  {
    route: "/dashboard/bookings",
    notificationTypes: ["booking_created", "booking_confirmed"],
  },
  {
    route: "/dashboard/promotions",
    notificationTypes: ["promo_created", "promo_updated", "promo_expiring"],
  },
  {
    route: "/dashboard/customers",
    notificationTypes: ["customer_created"],
  },
  // ... more routes
];
```

**Helper Functions:**
- `getNotificationTypesForRoute(pathname)` - Get notification types for a route
- `shouldAutoMarkForRoute(pathname)` - Check if route has associated notifications
