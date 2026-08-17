# Goal Tracker Release Notes

## 1.0.0 — Managed deployment release

First production-ready release of Goal Tracker on the managed reference stack: Vercel (web),
Render or Railway (API container), and Supabase Cloud (PostgreSQL and Auth).

### What is included

- **Goals and planning (M2, M2.1):** goals with fixed or item-derived targets, planned items with
  optional due months, archive/restore/permanent delete, and month-level planning previews.
- **Financial ledger (M3):** one authoritative ledger per goal with contributions, withdrawals,
  purchases, purchase undo, and corrections; deterministic history replay; currency locked after
  the first transaction.
- **Guidance and simulation (M4):** pace status (`ahead`, `on_track`, `at_risk`, `behind`,
  `fully_funded`), monthly obligations, recommendations, and a temporary contribution-only
  simulator with item-affordability reporting.
- **Responsive experience (M5A):** intentional mobile and desktop layouts from a single shell.
- **Quality pass (M5B):** complete loading, empty, error, pending, and confirmation states;
  accessibility coverage; end-to-end Japan Trip and Home Gym journeys.
- **Identity and isolation (M1):** Supabase email/password auth, per-owner data isolation with
  RLS, configurable registration, and capability-aware password recovery.

### Deployment changes in this release

- Production Docker image for the API (`apps/api/Dockerfile` runs the compiled server, includes
  a container `HEALTHCHECK`, and shuts down gracefully on `SIGTERM`).
- Environment validation at startup with fail-fast errors; `DATABASE_SSL` for TLS-enforcing
  databases such as Supabase Cloud; clear public/server variable separation in `.env.example`.
- Observability: structured JSON logs with `authorization`/`cookie` header redaction and
  `x-request-id` correlation; every error response carries a `requestId`.
- Settings shows the running release version under "About this deployment".
- Deployed-environment smoke test: `pnpm test:smoke` (see the operator guide).
- Operator documentation: [Operator guide](GoalTracker_Operator_Guide.md), including the
  self-hosted appendix with a backup/restore rehearsal.

### Upgrade and rollback

Follow the upgrade and rollback procedures in the
[operator guide](GoalTracker_Operator_Guide.md#5-operations). Apply migrations with
`supabase db push` before redeploying the API.

### Known limitations

- Supabase Cloud free plan pauses projects after about a week of inactivity and has no scheduled
  backups; export your own backups or upgrade the plan.
- App-level data import/export is intentionally out of scope; backups are database-level.
- Self-hosted deployments are supported via the documented appendix but receive no additional
  hardening in this release.
