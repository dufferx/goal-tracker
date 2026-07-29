# Goal Tracker Contributor Guide

This file defines repository-wide instructions for coding agents and contributors.

## Source of truth

Before implementing a milestone, read in this order:

1. `docs/GoalTracker_Product_Requirements_Master.md` — authoritative product behavior.
2. `docs/GoalTracker_Technical_Architecture.md` — authoritative technical decisions.
3. `docs/GoalTracker_Architecture_Blueprint.md` — boundaries and dependency direction.
4. `docs/design/README.md` — approved visual references and milestone ownership.
5. `docs/design/GoalTracker_Design_System.md` — executable visual and interaction rules.
6. `docs/GoalTracker_Implementation_Plan.md` — milestone scope and exit criteria.
7. `docs/GoalTracker_Milestones_and_Git_Strategy.md` — branches, commits, PRs, releases.
8. `docs/GoalTracker_Codex_Milestone_Prompts.md` — execution checklists.
9. `docs/GoalTracker_Claude_Design_Prompt.md` — original design direction and quality bar.

`docs/GoalTracker_Codex_Master_Prompt.md` summarizes standing implementation rules.
`feature-requirements.md` and `implementation-plan.md` are retained discovery records; the files
under `docs/` govern if they differ.

Do not invent or reinterpret business rules. Product requirements take precedence for behavior;
technical architecture governs implementation. Surface genuine conflicts before coding.

## Delivery model

- Implement D0, D1, then M1 through M6 sequentially.
- Work only within the milestone requested by the user.
- Do not begin a later milestone until the prior exit criteria pass.
- Keep changes narrow and avoid future features, speculative abstractions, and unused dependencies.
- A milestone includes its required migrations, backend, frontend, tests, and documentation.
- Preserve existing and unrelated user changes.

## Product boundary

The MVP is a private, multi-user, self-hosted goal and budget tracker:

- a goal is the primary aggregate;
- goals have fixed or item-derived targets;
- optional items represent planned purchases and may have due months;
- due items provide cumulative deadline planning without a checkpoint entity;
- real money is recorded in one financial ledger;
- projections explain pace;
- simulations are temporary contribution-only reports.

Do not add tasks, standalone checkpoints, generic components, pay periods, transfers, bank
connections, shared goals, admin UI, OAuth, native apps, push notifications, public APIs,
persistent simulations, AI, or mixed-currency goal totals.

## Repository layout and stack

The intended pnpm monorepo is:

```text
apps/
  web/          React + Vite + TypeScript SPA
  api/          Fastify TypeScript API
packages/
  domain/       Pure domain engines and rules
  database/     Drizzle mappings and repositories
  contracts/    Zod API and serialization contracts
  ui/           Shared presentational components
  config/       Shared tool configuration
supabase/
  migrations/  Sole schema migration source
  seed.sql
  config.toml
docs/
tests/
```

Docker Compose is the reference environment. Supabase provides PostgreSQL and Auth. Drizzle provides
typed access but never manages migrations.

## Dependency boundaries

```text
web      -> contracts, ui
api      -> domain, database, contracts
database -> contracts, generated types
domain   -> TypeScript standard library only
ui       -> no authoritative domain logic
```

- Keep domain free of React, Supabase, Drizzle, HTTP, filesystem, clocks, and network concerns.
- Put orchestration, authorization, DTO validation, and transaction boundaries in the API.
- Put persistence behind typed repositories.
- Share contracts instead of duplicating request or response shapes.
- Keep routes thin and organize backend code by domain module.

## Non-negotiable invariants

- All application data is private and isolated by authenticated owner.
- Money uses integer minor units; JSON serialization must avoid JavaScript precision loss.
- UUID v4 identifies application records.
- Business months/dates are separate from technical timestamps.
- Financial ledger entries are the authoritative monetary facts.
- Funded, spent, available, targets, purchase state, and guidance are derived.
- Every financial mutation uses the backend's single Financial Engine path.
- Lock the goal, replay its full deterministic history, and persist within an explicit transaction.
- Reject any mutation producing a negative funded, spent, or available historical prefix.
- History order is effective date, creation timestamp, then ID.
- Purchase requires sufficient available money; undo is full and references one purchase.
- Currency becomes immutable after the first financial transaction.
- Projection and simulation engines are pure, deterministic, and infrastructure-free.
- Simulation never persists, purchases items, or alters real state.
- A financial submission produces one request. Disable its controls while pending and never
  automatically retry an ambiguous financial response. If confirmation is lost, refresh the goal
  history before allowing another attempt. Do not add offline writes, a service worker, a sync
  queue, idempotency keys, or an idempotency table.
- Each authoritative business rule exists in exactly one module.

## Database and security

- Supabase migrations are the sole schema history; never generate Drizzle migrations.
- Use PostgreSQL constraints for structural integrity and backend replay for contextual rules.
- Enable and test RLS for every exposed application table.
- Normal application data flows through the API; the browser uses Supabase directly only for Auth.
- Derive ownership from verified identity, never request bodies or mutable user metadata.
- Never expose service, secret, database, SMTP, JWT-signing, or backup credentials.
- Use JSONB only for genuinely flexible metadata, not core fields.
- Use selective archive state; do not add `deleted_at` indiscriminately.
- No AI system may access the database in the MVP.

## Implementation expectations

- Inspect branch, working tree, and relevant documents before editing.
- Prefer clear code and the smallest implementation that satisfies the active milestone.
- Add loading, empty, success, error, disabled, and confirmation states to user-facing flows.
- Preserve form input after recoverable errors.
- Calculate current derived values on demand; persist only historical facts.
- Update operational and behavior documentation with the implementation.
- Meet responsive and accessibility requirements and include UI screenshots in PR handoffs.
- Before UI work, read the active milestone's mapped captures in `docs/design/README.md` and the
  shared design-system rules. Match them closely using shared Graphite tokens.
- Use the configured shadcn/ui registry for generic primitives. Do not hand-roll replacements for
  buttons, inputs, cards, dialogs, drawers, sheets, selects, tables, alerts, badges, skeletons, or
  tooltips. Add a custom component only when it is an approved Goal Tracker domain composite.
- Treat visual references as implementation constraints, not permission to copy annotation text or
  move authoritative business logic into presentational components.

## Testing

Add success, failure, boundary, concurrency, and isolation coverage at the appropriate levels:

- table-driven unit tests for ledger, targets, projection, simulation, and serialization;
- database integration tests for migrations, constraints, transactions, locks, and RLS;
- API tests for authentication, authorization, validation, and financial mutations;
- web tests for visible states and accessibility;
- end-to-end tests for Japan and home-gym journeys;
- self-hosting, backup, and restore tests in M6.

Before declaring completion, run and report:

```sh
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
git diff --check
```

Also run milestone-specific validation. If tooling, Docker, or local Supabase is unavailable, state
exactly what could not run and provide the command required to validate it.

## Git and handoff

- Use `development` as integration and `main` for production-ready releases.
- Use milestone branches from the canonical plan.
- Use Conventional Commits.
- Do not commit, push, create, publish, or merge a PR unless explicitly requested.
- Never commit directly to `main`.

Final handoff notes include:

- summary and milestone;
- files changed;
- migrations;
- tests added;
- commands run and results;
- unresolved risks or unavailable validation;
- next recommended milestone.
