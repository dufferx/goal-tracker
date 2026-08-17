# Goal Tracker Operator Guide

This guide explains how to deploy, operate, upgrade, and roll back Goal Tracker on the managed
reference stack:

- **Web** — Vercel serves the static Vite SPA.
- **API** — Render or Railway runs the API Docker container (`apps/api/Dockerfile`).
- **Database and Auth** — Supabase Cloud provides PostgreSQL and Auth.

The self-hosted Docker Compose option is documented in [Appendix A](#appendix-a-self-hosted-option).

## Prerequisites

- A Supabase Cloud account, a Vercel account, and a Render or Railway account.
- The Supabase CLI (`pnpm dlx supabase --version`, or the copy in `node_modules`).
- This repository cloned locally, with environment values from `.env.example` as a template.

## 1. Supabase Cloud: database and Auth

1. Create a new project at [supabase.com](https://supabase.com) (choose region and database
   password; store the password safely).
2. From the project settings, collect:
   - **Project URL** (`https://<ref>.supabase.co`) → `SUPABASE_URL`, `VITE_SUPABASE_URL`.
   - **Publishable (anon) key** → `SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
   - **Database connection string** (Settings → Database; use the session-mode pooler,
     port 5432) → `DATABASE_URL`.
3. Apply the schema migrations:

   ```sh
   supabase link --project-ref <ref>
   supabase db push
   ```

   `supabase/migrations/` is the sole schema history. Never edit the production schema by hand.
4. Configure Auth (Authentication → Settings in the dashboard):
   - **Site URL**: the Vercel web URL (for example `https://app.example.com`).
   - **Redirect URLs**: add `<web-url>/update-password` to the allow-list.
   - **Email provider**: to offer password recovery email, configure SMTP (Supabase's custom
     SMTP settings or your provider). The default built-in email service is rate-limited and
     intended for development only.
   - **Sign-ups**: enable or disable email sign-up according to whether the deployment allows
     public registration. This must match `PUBLIC_REGISTRATION_ENABLED` below.

## 2. API on Render or Railway

Deploy `apps/api/Dockerfile` as a Docker web service:

- **Render**: New → Web Service → connect the repository → Runtime "Docker". The Dockerfile is
  detected automatically (set Docker context to the repository root and Dockerfile path to
  `apps/api/Dockerfile`). Health check path: `/health`.
- **Railway**: New Project → Deploy from repo → add a service from the repository; Railway detects
  the Dockerfile. Configure the health check path `/health` in the service settings.

Set these environment variables on the service (see `.env.example` for the full reference):

| Variable | Value |
| --- | --- |
| `API_HOST` | `0.0.0.0` |
| `API_PORT` | `3000` (or the platform-provided `PORT` mapped to 3000) |
| `APP_VERSION` | Release version, for example `1.0.0` |
| `DATABASE_URL` | Supabase session-mode pooler connection string |
| `DATABASE_SSL` | `true` |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |
| `WEB_ORIGIN` | The exact web origin, for example `https://app.example.com` |
| `PUBLIC_REGISTRATION_ENABLED` | `true`/`false` — must match Supabase Auth sign-up setting |
| `PUBLIC_PASSWORD_RECOVERY_EMAIL_ENABLED` | `true` only when SMTP is configured in Supabase |

Notes:

- `DATABASE_SSL=true` is required for Supabase Cloud connections.
- `WEB_ORIGIN` is the only origin allowed by CORS; it must match the Vercel URL exactly
  (scheme included, no trailing path).
- These variables are server-only. Never prefix them with `VITE_`.

## 3. Web on Vercel

1. Import the repository into Vercel and set **Root Directory** to `apps/web`.
2. Vercel detects Vite. Override the build command so workspace packages compile first:

   ```sh
   cd ../.. && pnpm install --frozen-lockfile && pnpm build:packages && pnpm --filter @goal-tracker/web build
   ```

   Output directory: `dist` (the Vite default).
3. Set the build-time environment variables (they are embedded in the public bundle):

   | Variable | Value |
   | --- | --- |
   | `VITE_API_URL` | The API URL from step 2, for example `https://api.example.com` |
   | `VITE_SUPABASE_URL` | Supabase project URL |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |

4. `apps/web/vercel.json` already declares the SPA fallback rewrite to `/index.html`; no extra
   routing configuration is needed.

## 4. Verify the deployment

Run the deployed-environment smoke test from the repository:

```sh
SMOKE_API_URL=https://api.example.com SMOKE_WEB_URL=https://app.example.com pnpm test:smoke
```

It checks the API health endpoint, the public capabilities shape, the shared error envelope, and
the SPA shell (including a client-side route). Then sign in through the web app and complete one
contribution end to end.

## 5. Operations

### Domains and TLS

Both Vercel and Render/Railway terminate TLS and manage certificates automatically for their
default domains and for custom domains you attach. No reverse proxy is required.

### Backups

Supabase Cloud manages database backups according to your plan:

- **Free plan**: no scheduled backups, and projects pause after about a week of inactivity
  (they resume on access). Export your own backups periodically with
  `pg_dump "<connection-string>" > backup.sql` if the data matters to you.
- **Pro plan**: daily backups with 7-day retention and point-in-time recovery options.

Backups operate at the database level; the app has no import/export feature by design.

### Observability

- The API emits structured JSON logs. The `authorization` and `cookie` request headers are
  redacted; no tokens or secrets are logged.
- Every response error carries a `requestId`. The API honors an incoming `x-request-id` header
  and generates a UUID otherwise, so platform logs can be correlated with user reports.
- Platform dashboards (Render/Railway metrics, Vercel analytics, Supabase logs) complete the
  picture; no additional agents are required.

### Upgrades

1. Merge the release into `main` and deploy: Vercel redeploys on push; redeploy the API service
   so the container picks up the new image.
2. Apply new migrations first with `supabase db push`, then redeploy the API, then the web.
3. Bump `APP_VERSION` so settings shows the running release.

### Rollback

- Web: redeploy the previous deployment from the Vercel dashboard.
- API: redeploy the previous image/deployment from Render or Railway.
- Database: migrations are forward-only. Revert application code first; restore from a Supabase
  backup only as a last resort, accepting data loss after the backup point.

## Operator checklist

- [ ] Supabase Cloud project created; `supabase db push` applied cleanly.
- [ ] Auth site URL, redirect allow-list, sign-up setting, and SMTP configured.
- [ ] API container deployed with all environment variables; `/health` returns 200.
- [ ] `DATABASE_SSL=true`, `WEB_ORIGIN` matches the web origin exactly.
- [ ] Web deployed on Vercel with the three `VITE_*` variables.
- [ ] `pnpm test:smoke` passes against the deployed URLs.
- [ ] Registration and password recovery behave as the capabilities indicate.
- [ ] Two test users cannot see each other's goals (RLS isolation).
- [ ] Backup approach understood for the Supabase plan in use.

## Appendix A: Self-hosted option

The repository retains Docker Compose (`docker-compose.yml`) and the local Supabase CLI stack as
a supported self-hosted path. It is documented here without additional hardening.

1. Copy `.env.example` to `.env` and replace every example secret.
2. Run the stack locally with `pnpm dev` (starts Supabase locally and both apps) or build the
   containers with `docker compose up --build`.
3. Put a reverse proxy (for example Caddy or nginx) in front of the web and API services and
   terminate TLS there; set `WEB_ORIGIN` and the Auth site URL to the public origin.
4. Configure Supabase Auth (GoTrue) through the environment variables documented in
   `.env.example` and [Identity operations](GoalTracker_Identity_Operations.md).
5. Pin all image versions; do not deploy floating tags. Review Supabase breaking changes before
   upgrading.

### Backup/restore rehearsal (self-hosted)

1. Back up: `pg_dump "<connection-string>" > goal-tracker-$(date +%F).sql`. Include the `.env`
   deployment configuration in your backup set.
2. Rehearse the restore on a scratch database: create an empty database, run
   `psql "<scratch-connection-string>" < goal-tracker-<date>.sql`, point a test API at it, and
   verify sign-in plus goal history.
3. Record the time the rehearsal takes; that is your realistic recovery time.

Run the rehearsal at least once before trusting the deployment, and after any major upgrade.
