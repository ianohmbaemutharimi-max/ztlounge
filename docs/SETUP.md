# Setup & Deployment Guide

## Prerequisites

- **Node.js** 20+ (LTS)
- **npm** 10+ (or pnpm/yarn)
- **Supabase CLI** (`npm i -g supabase`) — for local DB management
- A **Supabase project** (free tier available at supabase.com)

## 1. Clone & Install

```bash
git clone https://github.com/ianohmbaemutharimi-max/ztlounge.git
cd ztlounge

# Admin dashboard dependencies
cd zt-lounge-admin
npm install

# Root (for Playwright tests)
cd ..
npm install
```

## 2. Configure Environment Variables

### Public Website

```bash
cd /                    # project root
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> These values are public (safe for the browser). Get them from the
> Supabase Dashboard → Settings → API.

### Admin Dashboard

```bash
cd zt-lounge-admin
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database (for Drizzle ORM, health check, audit logging)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Optional: Rate limiting (Upstash Redis)
# UPSTASH_REDIS_REST_URL=...
# UPSTASH_REDIS_REST_TOKEN=...
```

> **Important**: `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. Never expose it
> to the browser.

## 3. Apply Database Migrations

```bash
supabase login
supabase link --project-ref [your-project-ref]

# Apply all migrations
supabase db push

# Or reset + reseed (development only)
supabase db reset
```

## 4. Run the Applications

### Admin Dashboard (dev)

```bash
cd zt-lounge-admin
npm run dev             # → http://localhost:3000
npm run typecheck       # Type checking
npm run lint            # ESLint
npm run build           # Production build
```

### Public Website (local preview)

```bash
npx serve .             # → http://localhost:8000
```

### Both Applications (for tests)

```bash
# Terminal 1: Admin dashboard
cd zt-lounge-admin
npm run dev

# Terminal 2: Public website
npx serve .
```

## 5. Running Tests

```bash
# Website tests (Playwright)
npm test

# Admin unit/contract tests
cd zt-lounge-admin
npm test

# Admin E2E tests
cd zt-lounge-admin
npx playwright test
```

## Deployment

### Public Website

A static site (no build step). Deploy to any static host:

1. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as
   environment variables in your hosting provider.
2. At deploy time, inject them into the page via `window.__SUPABASE_CONFIG`.
3. Deploy the directory contents to Vercel, Netlify, Cloudflare Pages, etc.

### Admin Dashboard

A Next.js app. Deploy to Vercel or Railway:

1. Set all environment variables from `.env.example` in your hosting dashboard.
2. Configure `DATABASE_URL` for the Drizzle health check.
3. Configure SMTP settings for team invitation emails:
   ```env
   SMTP_HOST=smtp.your-provider.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-smtp-user
   SMTP_PASSWORD=your-smtp-password
   SMTP_FROM=noreply@your-domain.com
   ```
4. Configure Google OAuth in Supabase Dashboard → Authentication → Providers.
5. Set redirect URL: `https://your-domain.com/auth/callback`

## Troubleshooting

### Admin "Unable to fetch" errors

Ensure `.env.local` has valid `SUPABASE_SERVICE_ROLE_KEY` (not anon key).

### Website not loading content

1. Check `.env.local` has valid Supabase URL and anon key.
2. Verify Supabase project is accessible from your hosting environment.
3. Check browser console for CORS or network errors.

### Database migration errors

```bash
supabase db reset       # Full reset + reseed
supabase db push        # Apply pending migrations
```

### Tests failing in CI

```bash
# Install browsers (for Playwright E2E)
npx playwright install-deps --linux
npx playwright install
```
