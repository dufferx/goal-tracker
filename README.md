# Goal Tracker

Goal Tracker is being built as a self-hosted web application for personal financial goals. The
repository currently contains the M0 foundation only: a React web shell, a Fastify API, shared
workspaces, local Supabase configuration, and development tooling. It intentionally contains no
product features, authentication, application tables, or service worker.

## Prerequisites

- Node.js 24 LTS (see `.nvmrc` and `.node-version`)
- pnpm 10.33.1
- Docker Desktop or another Docker-compatible runtime

The Supabase CLI is pinned as a project dependency. Do not install a separate global version.

## Start from a clean clone

```sh
cp .env.example .env
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev` starts or verifies the local Supabase stack and then keeps the API and web development
servers running. Open:

- web: <http://127.0.0.1:5173>
- API health: <http://127.0.0.1:3000/health>
- Supabase Studio: <http://127.0.0.1:54323>

The first Supabase start downloads Docker images and can take several minutes.

To run the application processes without changing local infrastructure:

```sh
pnpm dev:apps
```

To manage infrastructure explicitly:

```sh
pnpm infra:start
pnpm db:reset
pnpm infra:stop
```

`db:reset` targets the local stack explicitly, reapplies every migration in `supabase/migrations`,
and then runs `supabase/seed.sql`. Supabase migrations are the only schema history. Drizzle is used
only for typed PostgreSQL access and must not generate or apply migrations.

## Docker Compose development reference

The root Compose file runs the web and API development applications:

```sh
pnpm infra:start
docker compose up --build
```

Stop the application containers with `docker compose down`, then stop Supabase with
`pnpm infra:stop`.

The Supabase CLI stack and this Compose file are development-only. The CLI stack uses default
credentials, has no production TLS or rate limiting, and must not be exposed to external traffic.
M12 owns the hardened production Compose deployment and the production self-hosted Supabase stack.

## Repository layout

```text
apps/
  api/          Fastify TypeScript API
  web/          React + Vite web application
packages/
  config/       Shared ESLint and TypeScript configuration
  contracts/    Shared contracts (introduced by owning milestones)
  database/     Drizzle PostgreSQL access
  domain/       Infrastructure-free domain code
  ui/           Shared shadcn/ui-based components
supabase/
  migrations/  Sole schema migration history
  seed.sql      Local development seed entry point
```

Dependencies flow from applications toward shared packages. In particular, `packages/domain` must
remain independent of React, Fastify, Supabase, Drizzle, HTTP, filesystem, and network concerns.

## Quality checks

Run the same independent checks as CI:

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
docker compose config
git diff --check
```

The API test exercises `GET /health` using Fastify injection. The web smoke test renders the real
application shell with React Testing Library.

## Environment variables

Copy `.env.example` to `.env` for local overrides. M0 uses:

| Variable       | Default                       | Purpose                                  |
| -------------- | ----------------------------- | ---------------------------------------- |
| `API_HOST`     | `127.0.0.1`                   | API bind address outside Compose         |
| `API_PORT`     | `3000`                        | API port                                 |
| `VITE_API_URL` | `http://127.0.0.1:3000`       | Browser-visible API URL                  |
| `DATABASE_URL` | local Supabase PostgreSQL URL | Future server-side typed database access |

Never commit `.env` or production credentials. The frontend must never receive privileged database
credentials.
