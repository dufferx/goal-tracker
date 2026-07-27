# Goal Tracker Contributor Guide

This file defines repository-wide instructions for coding agents and contributors.

## Source of truth

Before implementing a milestone, read the relevant sections of these documents:

1. `docs/GoalTracker_Product_Requirements_Master.md` — authoritative product and business rules.
2. `docs/GoalTracker_Technical_Architecture.md` — authoritative technical decisions.
3. `docs/GoalTracker_Architecture_Blueprint.md` — system boundaries and dependency direction.
4. `docs/GoalTracker_Implementation_Plan.md` — milestone scope, order, and acceptance criteria.
5. `docs/GoalTracker_Milestones_and_Git_Strategy.md` — branches, commits, PRs, and releases.
6. `docs/GoalTracker_Codex_Milestone_Prompts.md` — concise execution checklist for each milestone.
7. `docs/GoalTracker_Claude_Design_Prompt.md` — UI direction, primarily for M11.

`docs/GoalTracker_Codex_Master_Prompt.md` summarizes the standing implementation rules.

Do not invent or reinterpret business rules. If an implementation detail is absent, choose the
simplest option consistent with the documents and record the decision in the appropriate project
documentation. Product requirements take precedence for behavior; technical architecture governs
implementation. Stop and surface any genuine conflict between them.

## Current delivery model

- Implement milestones sequentially from M0 through M12.
- Work only within the milestone requested by the user.
- Do not begin a later milestone until the prior milestone exit criteria pass.
- Keep changes narrow; do not add future features, speculative abstractions, or unused dependencies.
- A milestone includes migrations, backend, frontend, tests, and documentation when applicable.
- Preserve existing behavior unless the active milestone explicitly changes it.

## Target stack and repository layout

The intended repository is a `pnpm` monorepo:

```text
apps/
  web/          React + Vite + TypeScript SPA/PWA
  api/          lightweight TypeScript API
packages/
  domain/       pure domain engines and rules
  database/     Drizzle schema, repositories, and generated types
  contracts/    API, validation, and serialization contracts
  ui/           shared shadcn/ui-based components
  config/       shared tool configuration
supabase/
  migrations/  the only schema migration source of truth
  seed.sql
  config.toml
docs/
tests/
```

Docker Compose is the reference environment for local development and self-hosting. Supabase
provides PostgreSQL and Auth; Drizzle provides typed data access but must never manage migrations.

## Dependency boundaries

Keep dependencies flowing in this direction:

```text
web      -> contracts, ui
api      -> domain, database, contracts
domain   -> shared code only
database -> contracts, generated types
ui       -> no authoritative domain logic
```

- Keep `packages/domain` free of React, Supabase, Drizzle, HTTP, filesystem, and network concerns.
- Put orchestration, authorization, DTO validation, and transaction boundaries in the API/application
  layer.
- Put persistence behind typed repositories in `packages/database`.
- Share typed contracts and validation instead of duplicating request or response shapes.
- Do not place authoritative business rules in React components.
- Organize backend code by domain module rather than only by horizontal CRUD layers.

## Non-negotiable domain invariants

- A goal is the primary aggregate; all user data is private and isolated.
- Monetary progress depends only on money. Tasks never change monetary progress.
- Store money as integer minor units, never floating point. The MVP assumes two decimal places.
- Use UUID v4 identifiers.
- Separate business dates from technical timestamps.
- Financial events are authoritative; snapshots are reconstructable caches.
- Every financial mutation goes through the backend and the single Financial Engine interface.
- Never insert financial events directly from the frontend.
- Financial mutations require idempotency keys; a retry returns the original result.
- Commit an event and its snapshot atomically using explicit transactions.
- Use pessimistic snapshot locking where required to prevent double spending.
- Reject mutations that create a negative balance at any point in the historical sequence.
- Order financial history deterministically by effective date, creation timestamp, then ID.
- Rebuild the full sequence after retroactive edits or voids.
- Transfers and transfer reversals are atomic across both goals and require matching currencies.
- Errors are voided; real refunds create referenced financial events.
- Goal currency becomes immutable after the first financial event.
- The Projection Engine is pure, deterministic, infrastructure-free, and exposes one public entry
  point returning calculations, tranquility, explanation, and recommendation together.
- Simulations run in memory and have no side effects until the user confirms an action.
- Import, export, backup, and template formats are centralized and versioned.
- Offline MVP support is limited to cached reads and idempotent deposit creation/synchronization.
- Each authoritative business rule must exist in exactly one module.

## Database and security rules

- Supabase migrations are the sole schema history. Do not generate or apply Drizzle migrations.
- Enforce simple structural integrity with PostgreSQL constraints and contextual rules in the backend.
- Use RLS for user isolation and test that one user cannot access another user's data.
- Use JSONB only for genuinely flexible metadata, not core domain fields.
- Use selective soft deletion; do not add `deleted_at` indiscriminately.
- Keep profiles separate from Supabase Auth data.
- Do not expose secrets, privileged database credentials, or sensitive audit context to the client.
- No AI model may access the database directly; AI is outside the MVP.

## Product scope guardrails

The MVP is web/PWA, English-first, self-hosted, and email/password based. Do not add OAuth, native
mobile apps, bank connections, shared goals, admin roles/UI, push notifications, public APIs,
multiple currencies within one goal, persistent simulations, or AI features unless the source docs
and requested milestone are explicitly updated.

## Implementation expectations

- Inspect the repository and working tree before editing.
- Preserve unrelated user changes.
- Prefer clear code over clever compression or premature generalization.
- Add loading, empty, success, and error states to user-facing flows.
- Important or destructive changes require explicit confirmation in the UI.
- Keep current derived values calculated on demand; persist only historical facts or justified
  performance caches.
- Update documentation with behavior, environment, migration, backup, or operational changes.
- For UI work, meet responsive and accessibility requirements in the product/design documents and
  include screenshots in the PR.

## Testing and validation

Add success and failure coverage at the appropriate levels:

- unit tests for domain engines, checkpoint rules, simulations, and serialization;
- table-driven tests for financial and projection logic;
- database integration tests for migrations, constraints, transactions, locks, and snapshot rebuilds;
- API integration tests for authorization and mutations;
- RLS tests for cross-user isolation;
- end-to-end and offline tests when the milestone requires them.

Before declaring work complete, run and report:

```sh
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
git diff --check
```

Also run milestone-specific integration or end-to-end tests. If Docker or local Supabase is
unavailable, state exactly what could not run and provide the command needed to validate it.

## Git and delivery

- Use `development` as the integration branch; `main` is for production-ready releases.
- Start work from `development` and target pull requests to `development`.
- Use milestone-scoped branches such as `feat/repository-foundation`.
- Use Conventional Commits: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`, or `ci`.
- Do not create, merge, or publish a pull request unless explicitly requested.
- Never commit directly to `main`.

Final handoff notes must include:

- summary and milestone;
- files changed;
- migrations;
- tests added;
- commands run and their results;
- unresolved risks or unavailable validation;
- next recommended milestone.
