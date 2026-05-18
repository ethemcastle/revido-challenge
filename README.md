# Revido Challenge

Monorepo with two services: **web** (Next.js) and **worker** (Node.js polling worker).

## Prerequisites

- Node.js 22+
- npm

## Setup

```bash
# Install all dependencies (from repo root)
npm install
```

Create env files:

- `web/.env.local` — copy from `web/.env.local.example` and fill in your Supabase credentials
- `worker/.env` — copy from `worker/.env.example` and fill in your database/Supabase credentials

## Running Locally

```bash
# Run the web app (Next.js) on http://localhost:3000
npm run dev:web

# Run the worker (in a separate terminal)
npm run dev:worker
```

## Project Structure

```
├── web/          # Next.js frontend (Supabase auth, magic-link login)
│   └── src/
│       ├── app/          # Pages & routes
│       ├── middleware.ts  # Session refresh
│       └── utils/supabase/ # Supabase client helpers
├── worker/       # Background worker (polls DB, runs migrations)
│   ├── src/
│   │   ├── index.ts    # Polling loop
│   │   ├── migrate.ts  # SQL migration runner
│   │   └── supabase.ts # Service-role client
│   └── migrations/     # SQL migration files
```

## Running Migrations

```bash
cd worker
npx tsx src/migrate.ts
```

## Building for Production

```bash
# Build the web app
npm run build:web

# Build the worker
npm run build:worker
```

## Deploying

Both services are deployed to Railway via Dockerfiles. Each service needs its root directory set in Railway:

- **Web service** → Root directory: `web/`
- **Worker service** → Root directory: `worker/`
