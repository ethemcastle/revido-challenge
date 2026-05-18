# Report

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend (API) | Next.js Server Actions |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (magic-link OTP) |
| Realtime | Supabase Realtime (postgres_changes) |
| Worker | Node.js + TypeScript (polling loop) |
| Deployment | Railway (Dockerfile per service) |
| Package Manager | npm workspaces (monorepo) |

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Railway                        │
│                                                  │
│  ┌──────────────┐       ┌──────────────────┐    │
│  │  Web Service │       │  Worker Service  │    │
│  │  (Next.js)   │       │  (Node.js)       │    │
│  │              │       │                  │    │
│  │  - Auth      │       │  - Polls pending │    │
│  │  - UI        │       │    snapshots     │    │
│  │  - Server    │       │  - Fetches HTML  │    │
│  │    Actions   │       │  - Extracts meta │    │
│  └──────┬───────┘       └────────┬─────────┘    │
│         │                        │               │
└─────────┼────────────────────────┼───────────────┘
          │                        │
          ▼                        ▼
┌──────────────────────────────────────────────────┐
│              Supabase                            │
│                                                  │
│  ┌────────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ PostgreSQL │  │ Realtime │  │    Auth      │  │
│  │            │  │          │  │ (Magic Link) │  │
│  │ - competitors │ pub/sub  │  │             │  │
│  │ - snapshots   │          │  │             │  │
│  │ - snapshot_   │          │  │             │  │
│  │   notes       │          │  │             │  │
│  │ - workspaces  │          │  │             │  │
│  └────────────┘  └──────────┘  └─────────────┘  │
└──────────────────────────────────────────────────┘
```

**Key decisions:**

- **Monorepo with npm workspaces** — `web/` and `worker/` share nothing at runtime but co-exist in one repo for atomic deploys.
- **Single shared workspace** — All users belong to one hardcoded workspace (`00000000-...0001`). RLS policies gate access via `workspace_members` join table, so switching to multi-tenant later requires only removing the default and adding workspace selection UI.
- **Realtime via Supabase** — Competitors, snapshots, and notes all publish changes. The client subscribes with `postgres_changes` and optimistically updates local state.
- **Worker is stateless** — Polls `snapshots` table for `status=pending`, fetches HTML, extracts metadata, writes back. No queue infrastructure needed.
- **Migrations are idempotent** — All use `IF NOT EXISTS`, `DROP ... IF EXISTS` before `CREATE` so they can re-run safely.

## Built

- [x] Magic-link email authentication (Supabase OTP)
- [x] Shared workspace with auto-join trigger for new users
- [x] Competitors CRUD (add, edit, remove) with modals
- [x] URL reachability validation on add
- [x] Unique competitor name enforcement (DB + app level)
- [x] Realtime competitor list updates across users
- [x] Snapshot triggering (Scan button)
- [x] Worker: Firecrawl scraping (full Markdown + metadata), with fetch+regex fallback
- [x] Snapshot diff: unified and side-by-side comparison of full Markdown content
- [x] Realtime snapshot status updates (pending → completed/failed)
- [x] Snapshot notes (add/delete with realtime sync)
- [x] Snapshot comparison with unified diff and side-by-side view
- [x] Railway deployment (Dockerfiles + railway.toml)
- [x] Idempotent SQL migrations runner

## Cut (for time)

- [ ] Multi-workspace / workspace isolation (hardcoded to single shared workspace)
- [ ] Multi-workspace / workspace isolation (hardcoded to single shared workspace)
- [ ] User avatars / display names on notes
- [ ] Pagination / infinite scroll for large lists
- [ ] Error retry logic in worker
- [ ] Test suite (unit/integration)

## Out of Scope (per brief)

- Scheduled/automatic periodic scanning — brief explicitly excludes this; manual "Scan" only
- Email notifications on competitor changes — brief explicitly excludes this

## AI Usage

AI (GitHub Copilot) was used throughout development for:

1. **Scaffolding** — Initial monorepo structure, Dockerfiles, railway.toml, Supabase helper files
2. **Migrations** — All SQL migrations were AI-generated and iteratively fixed for idempotency
3. **UI components** — Competitor list, modals, snapshot panels, diff view
4. **Realtime hooks** — `useSnapshots`, `useSnapshotNotes`, `useCompetitorsRealtime`
5. **Bug fixing** — TypeScript type errors (React 19 strict types), RLS policy issues, event propagation bugs
6. **Refactoring** — Extracting shared auth helper, types, constants, hooks, and modal components

All code was reviewed and tested interactively. AI suggestions were adjusted when they didn't match Next.js 16 or Supabase conventions (e.g., middleware deprecation, `REPLICA IDENTITY FULL` for realtime deletes).


