# ZT LOUNGE — GOOGLE REVIEWS IMPLEMENTATION PATH

## STEP-BY-STEP IMPLEMENTATION GUIDE

You have Google OAuth credentials (Client ID & Secret). Follow this exact path to implement Google Reviews integration end-to-end.

---

## STEP 1: SETUP ENVIRONMENT VARIABLES

**File:** `zt-lounge-admin/.env.local`

Add these environment variables (you'll fill in your values):

```env
# Google OAuth for Business Profile API
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
GOOGLE_PLACE_ID=YOUR_PLACE_ID_HERE

# Redirect URI (must match Google Console)
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/google/auth/callback
```

**How to find Place ID:**
1. Go to Google Business Profile for ZT Lounge
2. OR search "ZT Lounge Meru" on Google Maps
3. Extract the Place ID from the URL (long alphanumeric string starting with ChIJ)
4. OR use Google Places API to lookup by address/name

---

## STEP 2: FIX DATABASE SCHEMA

**Command:**
```bash
cd zt-lounge-demo/zt-lounge
npm run supabase:migrations:create -- fix_testimonials_schema
```

**File:** `supabase/migrations/[timestamp]_fix_testimonials_schema.sql`

**Content:**

```sql
-- Add Google reviews integration fields
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS source_review_id TEXT;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS review_url TEXT;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS author_photo_url TEXT;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;

-- Create unique constraint for Google reviews (prevent duplicates)
ALTER TABLE testimonials ADD CONSTRAINT unique_google_review UNIQUE(source, source_review_id) WHERE source_review_id IS NOT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_testimonials_source ON testimonials(source);
CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON testimonials(approved);

-- IMPORTANT: Fix RLS policy to allow managers
-- See STEP 3 below
```

---

## STEP 3: FIX RLS POLICIES

**In Supabase Console:**

1. Go to: **Authentication → Policies → testimonials table**
2. Edit policy: `testimonials_admin_manage`
3. Change the USING clause from:
   ```sql
   is_admin_or_above()
   ```
   To:
   ```sql
   is_manager_or_above()
   ```
4. This allows managers AND admins to manage testimonials

**Or run migration:**

```sql
-- Create migration file: supabase/migrations/[timestamp]_fix_testimonials_rls.sql

DROP POLICY IF EXISTS "testimonials_admin_manage" ON testimonials;

CREATE POLICY "testimonials_admin_manage" ON testimonials
  FOR ALL
  USING (is_manager_or_above())
  WITH CHECK (is_manager_or_above());
```

---

## STEP 4: CREATE GOOGLE SYNC API ENDPOINT

**File:** `zt-lounge-admin/src/app/api/google/sync-reviews/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { withManagerAuth } from "@/lib/auth/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Types
interface GoogleReview {
  author: string;
  rating: number;
  text: string;
  time: number;
  publishTime?: number;
  originalUrl?: string;
  reviewId?: string;
  authorProfilePhotoUrl?: string;
}

interface GoogleReviewsResponse {
  reviews?: GoogleReview[];
  error?: string;
}

// Get access token from Google using OAuth credentials
async function getGoogleAccessToken(refreshToken?: string): Promise<string> {
  const tokenUrl = "https://oauth2.googleapis.com/token";

  const body = refreshToken
    ? {
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }
    : {
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        grant_type: "client_credentials",
        scope: "https://www.googleapis.com/auth/business.manage",
      };

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body as Record<string, string>),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Google token error: ${data.error_description}`);
  }

  return data.access_token;
}

// Fetch reviews from Google Business Profile API
async function fetchGoogleReviews(
  accessToken: string,
  placeId: string
): Promise<GoogleReview[]> {
  const apiUrl = `https://mybusiness.googleapis.com/v4/accounts/-/locations/${placeId}/reviews`;

  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Google API error: ${response.statusText}`);
  }

  const data: GoogleReviewsResponse = await response.json();
  return data.reviews || [];
}

// Sync reviews to database
async function syncReviewsToDB(reviews: GoogleReview[]): Promise<number> {
  let synced = 0;

  for (const review of reviews) {
    const reviewId = review.reviewId || `${Date.parse(String(review.time))}`;

    try {
      const { error } = await supabase.from("testimonials").upsert(
        {
          customer_name: review.author,
          rating: review.rating,
          comment: review.text,
          image_url: review.authorProfilePhotoUrl || null,
          source: "google",
          source_review_id: reviewId,
          review_url: review.originalUrl || null,
          author_photo_url: review.authorProfilePhotoUrl || null,
          reviewed_at: new Date(review.publishTime || review.time).toISOString(),
          synced_at: new Date().toISOString(),
          approved: true, // Auto-approve Google reviews
          is_featured: false,
        },
        {
          onConflict: "source,source_review_id",
        }
      );

      if (error) throw error;
      synced++;
    } catch (err) {
      console.error(`Failed to sync review ${reviewId}:`, err);
    }
  }

  return synced;
}

// Main handler
export async function POST(request: NextRequest) {
  try {
    // Authenticate as manager or higher
    const user = await withManagerAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get credentials from environment
    const placeId = process.env.GOOGLE_PLACE_ID;
    if (!placeId) {
      return NextResponse.json(
        { error: "GOOGLE_PLACE_ID not configured" },
        { status: 500 }
      );
    }

    // Get access token
    const accessToken = await getGoogleAccessToken();

    // Fetch reviews from Google
    const reviews = await fetchGoogleReviews(accessToken, placeId);

    // Sync to database
    const synced = await syncReviewsToDB(reviews);

    return NextResponse.json({
      success: true,
      message: `Synced ${synced} reviews from Google`,
      count: synced,
      total: reviews.length,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}

// GET handler to check sync status
export async function GET(request: NextRequest) {
  try {
    const user = await withManagerAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get latest sync timestamp
    const { data, error } = await supabase
      .from("testimonials")
      .select("synced_at, COUNT(*) as total")
      .eq("source", "google")
      .order("synced_at", { ascending: false })
      .limit(1);

    if (error) throw error;

    return NextResponse.json({
      status: "ok",
      lastSync: data?.[0]?.synced_at || null,
      googleReviews: data?.[0]?.total || 0,
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
```

---

## STEP 5: UPGRADE ADMIN UI

**File:** `zt-lounge-admin/src/features/testimonials/testimonials-view.tsx`

Add sync button and fix field mismatches:

```typescript
// Add at the top after imports
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

// Inside the component, add sync handler:
const [isSyncing, setIsSyncing] = useState(false);

const handleSyncGoogle = async () => {
  setIsSyncing(true);
  try {
    const response = await fetch("/api/google/sync-reviews", {
      method: "POST",
    });
    const data = await response.json();
    if (data.success) {
      // Refresh testimonials list
      refetch();
    }
  } finally {
    setIsSyncing(false);
  }
};

// Add sync button to UI (before the testimonials list):
return (
  <div>
    <div className="mb-4 flex justify-between items-center">
      <h2 className="text-xl font-bold">Testimonials</h2>
      <Button 
        onClick={handleSyncGoogle}
        disabled={isSyncing}
      >
        <RefreshCw className={isSyncing ? "animate-spin" : ""} />
        {isSyncing ? "Syncing..." : "Sync Google Reviews"}
      </Button>
    </div>
    {/* Rest of testimonials list */}
  </div>
);
```

---

## STEP 6: UPDATE PUBLIC WEBSITE

**File:** `zt-lounge/pages/contact/gallery.html`

Replace gallery section with testimonials widget:

```html
<section class="testimonials-section py-12 px-4 bg-stone-900">
  <div class="max-w-4xl mx-auto">
    <h2 class="text-3xl font-bold text-white mb-8 text-center">
      What Our Guests Say
    </h2>
    <div id="testimonials-container" class="grid gap-6">
      <!-- Testimonials will load here -->
    </div>
  </div>
</section>

<script>
  // Load testimonials from Supabase
  async function loadTestimonials() {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/testimonials?approved=eq.true&order=is_featured.desc,created_at.desc`,
      {
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
        },
      }
    );

    const testimonials = await response.json();
    const container = document.getElementById("testimonials-container");

    testimonials.forEach((t) => {
      const sourceLabel = t.source === "google" ? "Google Review" : "Direct";
      const html = `
        <div class="bg-stone-800 p-6 rounded-lg border border-gold-500/30">
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              ${t.author_photo_url ? `<img src="${t.author_photo_url}" class="w-10 h-10 rounded-full">` : ""}
              <div>
                <p class="font-semibold text-white">${t.customer_name}</p>
                <p class="text-xs text-stone-400">${sourceLabel}</p>
              </div>
            </div>
            <div class="flex text-gold-500">
              ${"★".repeat(t.rating)}
            </div>
          </div>
          <p class="text-stone-300">"${t.comment}"</p>
          ${t.review_url ? `<a href="${t.review_url}" target="_blank" class="text-sm text-gold-500 hover:underline mt-3 inline-block">View on Google →</a>` : ""}
        </div>
      `;
      container.innerHTML += html;
    });
  }

  loadTestimonials();
</script>
```

---

## STEP 7: ENVIRONMENT SETUP CHECKLIST

Before running, ensure:

- [ ] Google OAuth Client ID in `.env.local`
- [ ] Google OAuth Client Secret in `.env.local` (NOT in `.env.example`)
- [ ] Google Place ID in `.env.local`
- [ ] Google OAuth redirect URI matches Google Console configuration
- [ ] Supabase service role key configured in `.env.local`
- [ ] Migration files applied to Supabase

---

## STEP 8: RUN & TEST

**Build:**
```bash
cd zt-lounge-admin
npm run build
```

**Start dev server:**
```bash
npm run dev
```

**Test sync:**
```bash
curl -X POST http://localhost:3000/api/google/sync-reviews \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Check database:**
```bash
# In Supabase console, run:
SELECT * FROM testimonials WHERE source = 'google';
```

**Verify public website:**
- Visit `http://localhost:5000/pages/contact/gallery.html` (or wherever public site runs)
- Testimonials should display from database

---

## STEP 9: PRODUCTION DEPLOYMENT

1. Add secrets to production `.env`:
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_PLACE_ID`

2. Deploy admin to production (build verification required)

3. Deploy public website with testimonials widget

4. Schedule automated sync (optional):
   - Add cron job or GitHub Actions to POST `/api/google/sync-reviews` daily

---

## TROUBLESHOOTING

**Error: "GOOGLE_PLACE_ID not configured"**
- Add Place ID to `.env.local`

**Error: "Unauthorized"**
- Ensure you're logged in as manager or admin
- Check withManagerAuth() is working

**Reviews not syncing**
- Check Google OAuth credentials are correct
- Verify Place ID is valid
- Check Supabase RLS policy allows manager access

**Public website not showing testimonials**
- Ensure Supabase anon key is accessible
- Check testimonials are marked as `approved = true`
- Browser console for JavaScript errors

---

## NEXT: WHAT YOU NEED TO PROVIDE

Before I implement, send:

1. **Google Place ID** (from Google Business Profile / Maps)
2. **Google Client ID** (from Google Console)
3. **Google Client Secret** (from Google Console)
4. Confirmation to proceed with full implementation

Once you provide these, I'll:
- Apply all migrations
- Deploy API endpoint
- Update admin UI
- Add public website widget
- Run end-to-end tests
- Verify database integrity
- Build production verification
