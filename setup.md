# Project Architecture Setup Guide

> A monorepo with a **Next.js web app** + a **Node.js background worker**, deployed on **Railway**, backed by **Supabase** (Postgres + Auth).

---

## 1. Repo Structure

```
/
├── package.json              # Root workspace config
├── web/                      # Next.js frontend
│   ├── Dockerfile
│   ├── railway.toml
│   ├── package.json
│   └── src/
│       ├── middleware.ts     # Supabase auth session refresh
│       ├── app/              # App Router pages & API routes
│       └── utils/supabase/   # Supabase client helpers (client, server, middleware)
└── worker/                   # Background polling worker
    ├── Dockerfile
    ├── railway.toml
    ├── package.json
    ├── migrations/           # Raw SQL migrations run on startup
    └── src/
        ├── index.ts          # Polling loop
        ├── migrate.ts        # Runs .sql files against DATABASE_URL
        └── supabase.ts       # Supabase service-role client
```

---

## 2. Root `package.json`

```json
{
  "name": "my-project",
  "private": true,
  "workspaces": ["web", "worker"],
  "scripts": {
    "dev:web": "npm --workspace web run dev",
    "dev:worker": "npm --workspace worker run dev",
    "build:web": "npm --workspace web run build",
    "build:worker": "npm --workspace worker run build"
  }
}
```

---

## 3. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Note down:
   - **Project URL**: `https://<ref>.supabase.co`
   - **Anon/Publishable Key**: for client-side auth
   - **Service Role Key**: for worker (bypasses RLS)
   - **Database URL**: `postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres`
3. In **Authentication → URL Configuration**, set the **Site URL** to your deployed web URL (e.g. `https://myapp.up.railway.app`).
4. Add redirect URLs: `https://myapp.up.railway.app/auth/callback`

---

## 4. Environment Variables

### Web (build-time ARGs + runtime)

| Variable | Where | Example |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Build ARG + runtime | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Build ARG + runtime | `eyJ...` (anon key) |

### Worker (runtime only)

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | `postgresql://postgres:<pw>@db.<ref>.supabase.co:5432/postgres` |
| `SUPABASE_URL` | `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (service role) |

> Add any additional API keys your worker needs (e.g. `FIRECRAWL_API_KEY`, `OPENAI_API_KEY`, etc.)

---

## 5. Database Migrations

SQL files live in `worker/migrations/` and are ordered by filename prefix (e.g. `001_create_tables.sql`).

### Example Table (replace with your domain)

```sql
CREATE TABLE IF NOT EXISTS my_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  -- add your domain columns here
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS (so users can only access their own rows)
ALTER TABLE my_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can select own" ON my_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own" ON my_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own" ON my_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### Running locally

```bash
cd worker && npm run build && npm run migrate
```

The worker Dockerfile runs migrations automatically on startup:
```
CMD ["sh", "-c", "node dist/migrate.js && node dist/index.js"]
```

---

## 6. Dockerfiles

### Web (`web/Dockerfile`)

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

COPY web/package.json ./
RUN npm install

COPY web/ .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

> **Note**: Requires `output: "standalone"` in `next.config.ts`.

### Worker (`worker/Dockerfile`)

```dockerfile
FROM node:22-alpine
WORKDIR /app

COPY worker/package.json ./
RUN npm install

COPY worker/tsconfig.json ./
COPY worker/src ./src
COPY worker/migrations ./migrations

RUN npm run build

CMD ["sh", "-c", "node dist/migrate.js && node dist/index.js"]
```

---

## 7. Railway Configuration

Each service has a `railway.toml`:

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "./Dockerfile"
```

### Deploying

1. Create a **Railway project** linked to your GitHub repo.
2. Add **two services** in the project:
   - **web** — Root dir: `/web`, enable public networking, set build ARGs.
   - **worker** — Root dir: `/worker`, disable public networking, set runtime env vars.
3. Set **Watch Paths**:
   - web: `/web/**`
   - worker: `/worker/**`
4. Push to trigger auto-deploy.

---

## 8. Auth Flow (Magic Link)

1. User enters email on `/login`.
2. Supabase sends a magic link pointing to `<SITE_URL>/auth/callback?code=...`.
3. `/auth/callback/route.ts` exchanges the code for a session.
4. Middleware (`src/middleware.ts`) refreshes the session cookie on every request and protects authenticated routes.

**Critical**: Set your **Site URL** in Supabase dashboard to the production URL, NOT localhost.

---

## 9. Worker Logic

- Polls your main table every N seconds for rows needing processing (e.g. `status = 'pending'`).
- Does the work (API calls, parsing, etc.).
- Updates the row with results and changes the status.

---

## 10. Quick Start Checklist

- [ ] `npm install` at root
- [ ] Create `.env.local` in `web/` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Create `.env` in `worker/` with `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Write your migration SQL in `worker/migrations/`
- [ ] Run migrations: `cd worker && npm run build && npm run migrate`
- [ ] Start web: `npm run dev:web`
- [ ] Start worker: `cd worker && npm run dev`
- [ ] Set Supabase Site URL + redirect URLs for production
- [ ] Deploy to Railway with correct env vars

---

## 11. Common Gotchas

| Problem | Fix |
|---------|-----|
| Magic link redirects to `localhost` | Set **Site URL** in Supabase Auth settings to your Railway URL |
| Magic link redirects to Docker hostname (e.g. `e50bc280eb08:8080`) | Set `HOSTNAME=0.0.0.0` env var on Railway; ensure Site URL is the public domain |
| `ENOTFOUND db.<ref>.supabase.co` | Wrong ref or DNS issue; double-check `DATABASE_URL` |
| `Your project's URL and Key are required` | Missing `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` at build time |
| Railway: "No start command detected" | Ensure you set Root Dir to `/web` or `/worker`, not repo root |
| Email rate limit exceeded | Supabase free tier limits auth emails; wait or upgrade |
