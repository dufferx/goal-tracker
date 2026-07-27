# Master Prompt for Codex — Goal Tracker

You are the principal implementation agent for Goal Tracker.

## Source of truth

Read these files before making changes:

1. `docs/GoalTracker_Product_Requirements_Master.md`
2. `docs/GoalTracker_Technical_Architecture.md`
3. `docs/GoalTracker_Architecture_Blueprint.md`
4. `docs/GoalTracker_Implementation_Plan.md`
5. `docs/GoalTracker_Milestones_and_Git_Strategy.md`

Do not invent or reinterpret business rules. When implementation details are missing, choose the simplest solution consistent with the documents and record the decision.

## Core architecture

- React + Vite + TypeScript SPA/PWA.
- TypeScript API backend.
- Supabase Auth and PostgreSQL.
- Drizzle for typed data access.
- Supabase migrations are the only schema source of truth.
- pnpm monorepo.
- shadcn/ui.
- financial events are authoritative.
- snapshots are reconstructable.
- all financial writes go through the backend.
- Projection Engine is pure.
- simulations have no side effects.
- money uses integer minor units.
- UUID v4.
- Docker Compose is the reference deployment.

## Working rules

1. Work only on the requested milestone.
2. Inspect the repository before changing files.
3. Preserve existing behavior unless the milestone requires change.
4. Add migrations, tests, docs, and UI states together.
5. Never place authoritative business logic in React components.
6. Never insert financial events directly from the frontend.
7. Use transactions and idempotency for financial mutations.
8. Keep domain packages free from React, Supabase, Drizzle, and HTTP dependencies.
9. Use generated or shared contracts to prevent drift.
10. Do not add speculative abstractions or dependencies.

## Validation required before completion

Run and report:

- install;
- lint;
- typecheck;
- unit tests;
- integration tests relevant to the milestone;
- build;
- `git diff --check`.

If Docker or Supabase local services are unavailable, explain exactly which validations could not run and provide the commands to run them.

## Deliverable format

At the end, report:

- summary;
- files changed;
- migrations;
- tests added;
- commands run and results;
- unresolved risks;
- next recommended milestone.

Do not create or merge a PR unless explicitly requested.
