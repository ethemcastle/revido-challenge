# Manifest

## Features

### ✅ Built

| Feature | Description | Files |
|---------|-------------|-------|
| Magic-link Auth | Email OTP login via Supabase, session refresh middleware | `web/src/app/login/page.tsx`, `web/src/app/auth/callback/route.ts`, `web/src/middleware.ts`, `web/src/utils/supabase/` |
| Shared Workspace | Single hardcoded workspace, auto-join trigger on signup, backfill for existing users | `worker/migrations/002_shared_workspace.sql`, `worker/migrations/005_backfill_workspace_members.sql` |
| Competitors CRUD | Add/edit/remove competitors with modal UI, name uniqueness, URL validation | `web/src/app/competitors/actions.ts`, `web/src/app/competitors/competitor-list.tsx`, `web/src/app/competitors/competitor-modals.tsx` |
| Realtime Competitors | Live sync of competitor list across all workspace users | `web/src/hooks/use-competitors-realtime.ts`, `worker/migrations/007_enable_realtime.sql` |
| Snapshot Triggering | "Scan" button inserts pending snapshot row | `web/src/app/competitors/actions.ts` (`triggerSnapshot`) |
| Snapshot Worker | Polls pending snapshots, scrapes via Firecrawl (full Markdown), falls back to fetch+regex if no API key | `worker/src/index.ts` |
| Realtime Snapshots | Live status updates (pending → completed/failed) in UI | `web/src/hooks/use-snapshots.ts`, `web/src/app/competitors/snapshots-panel.tsx` |
| Snapshot Notes | Add/delete text notes under snapshots with realtime sync | `web/src/app/competitors/snapshot-notes.tsx`, `web/src/hooks/use-snapshot-notes.ts`, `worker/migrations/009_snapshot_notes.sql` |
| Snapshot Comparison | Select two snapshots, view unified diff or side-by-side | `web/src/app/competitors/snapshot-compare.tsx` |
| SQL Migrations | Idempotent migration runner (all `IF NOT EXISTS` / `DROP IF EXISTS`) | `worker/src/migrate.ts`, `worker/migrations/` |
| Railway Deployment | Dockerfiles + railway.toml for web and worker services | `web/Dockerfile`, `worker/Dockerfile`, `web/railway.toml`, `worker/railway.toml` |
| RLS Policies | Row-level security on all tables gated by workspace membership | All migration files |

### 🟡 Partial

| Feature | What works | What's missing |
|---------|-----------|----------------|
| Snapshot Content | Firecrawl returns full page Markdown + metadata; falls back to fetch+regex | N/A — fully functional with Firecrawl |
| Diff View | Diffs full Markdown content when Firecrawl is used, metadata summary otherwise | N/A |
| Auth Redirect | Works locally, code uses `NEXT_PUBLIC_SITE_URL` | Requires correct Railway env var + Supabase Site URL config |
| Middleware | Session refresh works but triggers Next.js 16 deprecation warning | Should migrate to `proxy` convention per Next.js 16 |

### ❌ Cut

| Feature | Reason |
|---------|--------|
| Multi-workspace isolation | Time — hardcoded to shared workspace; DB schema supports it |
| User avatars / display names on notes | Time — notes show timestamp only |
| Pagination / infinite scroll | Time — all items loaded at once |
| Worker error retry / dead-letter | Time — failed snapshots stay failed |
| Test suite | Time — no unit or integration tests |

### 🚫 Out of Scope (per brief)

| Feature | Reason |
|---------|--------|
| Scheduled periodic scanning | Explicitly out of scope in the brief — manual "Scan" only |
| Email notifications | Explicitly out of scope in the brief |

## Database Schema

| Table | Purpose |
|-------|---------|
| `workspaces` | Single shared workspace row |
| `workspace_members` | Maps users → workspace (auto-populated by trigger) |
| `competitors` | Tracked competitors (name, homepage_url, notes) |
| `snapshots` | Point-in-time scan results per competitor |
| `snapshot_notes` | User comments on specific snapshots |
| `my_items` | Unused scaffold leftover (can be dropped) |

## API (Server Actions)

| Action | Purpose |
|--------|---------|
| `addCompetitor` | Validates name/URL uniqueness, checks URL reachability, inserts |
| `updateCompetitor` | Validates uniqueness excluding self, updates |
| `deleteCompetitor` | Removes competitor and cascades |
| `triggerSnapshot` | Inserts pending snapshot for worker to process |

## Realtime Channels

| Channel | Table | Events |
|---------|-------|--------|
| `competitors-realtime` | `competitors` | INSERT, UPDATE, DELETE |
| `snapshots-{id}` | `snapshots` | INSERT, UPDATE, DELETE (filtered by competitor_id) |
| `snapshot-notes-{id}` | `snapshot_notes` | INSERT, DELETE (filtered by snapshot_id) |


