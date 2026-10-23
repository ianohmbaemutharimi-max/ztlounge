# ZT Lounge Meru

A full-stack hospitality management system for **ZT Lounge Meru** — a premium
dining, VIP cabin, auto spa, and events venue in Milimani, Meru, Kenya.

The project is organized as a monorepo containing two independent applications
that share a single Supabase backend:

```
zt-lounge/
├── index.html                 # Public website homepage (static)
├── 404.html                   # Custom 404 page
├── pages/                     # Static HTML pages (restaurant, events, etc.)
├── assets/                    # Public website CSS, JS, and images
├── supabase/                  # Database migrations
├── tests/                     # Playwright tests for the public website
├── playwright.config.js       # Playwright config (website)
├── package.json               # Root package (Playwright runner)
├── .env.example               # Public website environment template
├── docs/                      # Documentation
│   ├── ARCHITECTURE.md        # Full system architecture
│   └── SETUP.md               # Setup & deployment guide
└── zt-lounge-admin/           # Admin dashboard (Next.js)
    ├── src/                   # Application source code
    ├── public/                # Static assets (Next.js public dir)
    ├── tests/                 # Admin test suite (Vitest + Playwright)
    ├── middleware.ts          # Next.js middleware
    ├── next.config.ts         # Next.js configuration
    ├── playwright.config.ts   # Playwright config (admin)
    ├── package.json           # Admin package manifest
    └── .env.example           # Admin environment template
```

## Quick Links

- **[System Architecture →](docs/ARCHITECTURE.md)**
- **[Setup & Deployment Guide →](docs/SETUP.md)**
- **[Admin Dashboard README →](zt-lounge-admin/README.md)**

## Quick Start

### 1. Configure Supabase

Both applications require a [Supabase](https://supabase.com) project.

**Root (public website):**
```bash
cp .env.example .env.local
# Edit .env.local and set your Supabase URL and anon key
```

**Admin dashboard:**
```bash
cp zt-lounge-admin/.env.example zt-lounge-admin/.env.local
# Edit to add your Supabase URL, anon key, service_role key, and DATABASE_URL
```

### 2. Apply Database Migrations

```bash
cd supabase
supabase db push          # Apply migrations to local/connected project
supabase db reset         # Reset and reseed (development only)
```

### 3. Run the Admin Dashboard

```bash
cd zt-lounge-admin
npm install
npm run dev               # http://localhost:3000
npm run typecheck         # Type checking
npm run lint              # Linting
```

### 4. Run the Public Website

The public website is a static site (HTML + vanilla JS). To preview locally:

```bash
npx serve .               # Serve from project root
# Then open http://localhost:8000
```

### 5. Run Tests

```bash
# Public website tests (Playwright)
npm test

# Admin dashboard tests
cd zt-lounge-admin
npm test                  # Unit tests (Node --test)
npx playwright test       # E2E tests (if configured)
```

## License

&copy; 2026 ZT Lounge. All rights reserved.
