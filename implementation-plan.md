# Implementation Plan: Simplified Goal Tracker

## Status

Approved Planning Record — promoted to the canonical implementation plan

> This file preserves the detailed discovery-to-patch analysis. Milestone execution is now governed
> by `docs/GoalTracker_Implementation_Plan.md`.

## Source Requirements

- `feature-requirements.md` — closed product requirements and acceptance matrix.
- `AGENTS.md` — repository rules, subject to the documentation realignment described below.

## Repo Rules Applied

- Preserve the completed M0 repository foundation.
- Use `development` as the integration branch and milestone-scoped feature branches.
- Keep Supabase migrations as the only schema history; Drizzle must not generate migrations.
- Keep authoritative business rules out of React and infrastructure-free in `packages/domain`.
- Put request validation in `packages/contracts`, persistence in `packages/database`, and
  authorization/transactions in `apps/api`.
- Store money as integer minor units and business dates separately from technical timestamps.
- Enforce per-user isolation in both API queries and PostgreSQL RLS.
- Include migrations, backend, frontend, tests, and documentation in the milestone that owns a
  behavior.
- Do not start a later milestone until the current milestone exit criteria pass.
- Do not create a PR, commit, or deployment unless explicitly requested.

## Required Documentation Realignment

The current authoritative documents still require tasks, standalone checkpoints, snapshots,
transfers, offline writes, imports, and other behavior explicitly removed by the closed
requirements. They also require the obsolete M0–M12 sequence.

No product implementation should begin until milestone D0 updates those sources. Until D0 is
accepted, `feature-requirements.md` and the existing master documents conflict.

## Scope

Retain M0 and deliver the simplified product through:

| Milestone | Outcome                                                              |
| --------- | -------------------------------------------------------------------- |
| D0        | Authoritative documentation reset                                    |
| M1        | Authentication, profiles, registration control, and user isolation   |
| M2        | Goals and goal items, including target modes and dated-item planning |
| M3        | Financial ledger, purchases, corrections, totals, and history        |
| M4        | Recommendations, status, projections, and temporary simulation       |
| M5        | Complete responsive product UX and lifecycle integration             |
| M6        | Security hardening, self-hosted release, and end-to-end validation   |

Explicitly excluded:

- tasks;
- standalone milestones/checkpoints;
- transfers between goals;
- snapshots and financial revision tables;
- non-financial activity events;
- persistent simulations;
- offline writes or a service worker;
- import, templates, CSV, and restore;
- shared goals, admin UI, OAuth, AI, public API, and native apps.

## Target Data Model

### `profiles`

- `id` — UUID matching the Supabase Auth user;
- `display_name` — optional display value;
- `default_currency` — validated currency code;
- `created_at`, `updated_at`.

### `goals`

- `id`, `owner_id`;
- `name`;
- `currency`;
- `target_mode` — `fixed` or `items`;
- `fixed_target_amount` — required only for fixed mode;
- `start_month` — normalized to the first day of its month;
- `final_month` — optional, normalized to the first day;
- `contributions_per_month` — `1` or `2`;
- `preferred_contribution_amount` — optional;
- `status` — `active` or `archived`;
- `created_at`, `updated_at`.

### `goal_items`

- `id`, `owner_id`, `goal_id`;
- `name`;
- `expected_amount`;
- `due_month` — optional, normalized to the first day;
- `created_at`, `updated_at`.

Purchased state and actual amount are derived from the financial ledger. They are not duplicated on
the item row.

### `financial_transactions`

- `id`, `owner_id`, `goal_id`;
- `item_id` — required for purchase operations, otherwise absent;
- `type` — `contribution`, `withdrawal`, `purchase`, or `purchase_undo`;
- `amount`;
- `effective_date`;
- `reverses_transaction_id` — required only for purchase undo;
- `created_at`, `updated_at`.

The ledger is ordered by `effective_date`, `created_at`, then `id`. There is no snapshot table.

### Structural constraints and indexes

- positive monetary amounts;
- valid conditional fields for goal target modes and transaction types;
- month values normalized to day one;
- one purchase undo per purchase;
- composite ownership relationships so items and transactions cannot reference another user's goal;
- indexes for owner goal lists, goal items, and goal transaction history;
- cascade deletion only from a permanently deleted goal;
- RLS on all four application tables.

Contextual rules such as sufficient funds, currency locking, date ordering, active purchase
uniqueness, and valid historical replay remain in the backend transaction boundary.

## Domain Model

Keep small pure functions instead of introducing generic engines or base classes:

- money-total replay:
  - contribution: available and funded increase;
  - withdrawal: available and funded decrease;
  - purchase: available decreases and spent increases;
  - purchase undo: available increases and spent decreases;
- current item amount:
  - active purchase amount when purchased;
  - expected item amount otherwise;
- goal target:
  - fixed amount in fixed mode;
  - sum of current item amounts in item mode;
  - absent for an empty item-derived goal;
- dated-item requirements:
  - group by due month;
  - cumulative sum through each due month;
- chronological validation:
  - available and spent never become negative at any replay point;
- recommendation and status:
  - inclusive goal months multiplied by one or two contributions per month;
  - expected progress changes only after completed months;
  - one recommended contribution defines the risk/ahead tolerance;
- simulation:
  - up to three month ranges;
  - one amount per contribution;
  - no persistence or real mutations;
  - report individual item affordability without automatically purchasing.

## API Shape

The exact route filenames may follow the domain-module structure established during implementation,
but the public application capabilities should remain limited to:

- public instance configuration:
  - registration enabled;
  - password recovery available;
- authenticated profile read/update;
- goal list, detail, create, update, archive, restore, and permanent delete;
- goal-change impact preview;
- item create, update, delete, and over-budget impact preview;
- contribution create, update, and delete;
- withdrawal create, update, and delete;
- item purchase, purchase-price correction, and purchase undo;
- unified financial history with type filters;
- goal projection;
- temporary contribution simulation.

All application data flows through the Fastify API. The web client uses Supabase directly only for
authentication. Every API data query includes the authenticated owner ID even when the database
connection is privileged.

## Requirement Traceability

| Requirements                                            | Implementation milestone(s) | Primary validation                                                |
| ------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------- |
| R20, R21, R23, R24                                      | M1, M6                      | Auth, configuration, API authorization, and RLS integration tests |
| R1, R7, R13, R15, R16, R17, R22, R26, R30, R32          | M2, M5                      | Domain, API, database, and UI tests                               |
| R2, R3, R8, R10, R11, R12, R14, R18, R19, R28, R29, R31 | M3, M5                      | Table-driven ledger and transaction integration tests             |
| R4, R5, R6, R9, R25, R27                                | M4, M5                      | Table-driven projection and simulation tests                      |
| Cross-cutting UX states                                 | M2–M5                       | Component/integration tests and responsive manual validation      |
| Full Japan and home-gym scenarios                       | M6                          | End-to-end tests against local Supabase                           |

## Patch-Oriented Plan

### D0 — Reset authoritative documentation

Requirements: all closed requirements; prerequisite for every implementation milestone.

1. Replace the functional master with the simplified product definition.
   - Update `docs/GoalTracker_Product_Requirements_Master.md`.
   - Treat `feature-requirements.md` as the review source and preserve its decision history.
   - Remove tasks, standalone checkpoints, transfers, snapshots, offline writes, import/export, and
     other excluded behavior from MVP language.

2. Rewrite technical and boundary documentation.
   - Update `docs/GoalTracker_Technical_Architecture.md`.
   - Update `docs/GoalTracker_Architecture_Blueprint.md`.
   - Document the four-table model, ledger replay, goal-row locking, pure calculations, API-only
     application data access, RLS, and the absence of snapshots.

3. Replace delivery documents.
   - Update `docs/GoalTracker_Implementation_Plan.md` to the D0/M1–M6 sequence.
   - Update `docs/GoalTracker_Milestones_and_Git_Strategy.md`.
   - Update `docs/GoalTracker_Codex_Milestone_Prompts.md`.
   - Update `docs/GoalTracker_Codex_Master_Prompt.md`.

4. Realign contributor and design guidance.
   - Update `AGENTS.md` so its non-negotiable invariants match the closed requirements.
   - Rewrite `docs/GoalTracker_Claude_Design_Prompt.md` around the reduced navigation and flows.
   - Mark the existing large HTML design artifact obsolete; do not delete it without explicit user
     approval.

5. Update `README.md` with the simplified milestone roadmap.

Do not change:

- M0 source code or dependencies;
- database schema;
- runtime behavior.

Validation:

- search all authoritative docs for removed entities and behaviors;
- verify every closed requirement is represented once in the correct source document;
- `git diff --check`;
- formatting check when `pnpm` is available.

Exit criteria:

- no authoritative document instructs agents to implement excluded features;
- `AGENTS.md`, PRD, architecture, and implementation plan agree;
- M1 may begin without a source-of-truth conflict.

### M1 — Identity and user isolation

Requirements: R20–R24 and the profile portion of R26.

1. Add current, pinned auth dependencies only where required.
   - Add the supported Supabase browser client to `apps/web`.
   - Add an API-side token-validation adapter following current official Supabase documentation.
   - Do not expose privileged keys to Vite environment variables.

2. Define auth and profile contracts.
   - Add focused modules under `packages/contracts/src`.
   - Cover public instance configuration, profile setup, and default currency.

3. Create the identity migration using the Supabase CLI workflow.
   - Add `profiles`.
   - Enable RLS and ownership policies.
   - Grant only the required Data API access.
   - Keep profile authorization out of user-editable JWT metadata.

4. Add Fastify auth and configuration modules.
   - Validate the Supabase session for protected routes.
   - Expose registration/recovery capability flags without exposing secrets.
   - Enforce the registration setting server-side and in Supabase Auth configuration, not only by
     hiding the UI.

5. Add the web authentication and profile setup flows.
   - Sign in;
   - conditional registration;
   - recovery when enabled;
   - password update;
   - first-use default currency;
   - authenticated route shell.

6. Document SMTP and manual reset behavior.

Do not change:

- goal or financial schema;
- admin roles, invitations, OAuth, or shared data.

Validation:

- auth unit/integration tests;
- direct RLS test proving user A cannot read/update user B's profile;
- registration enabled/disabled tests;
- unauthenticated API rejection;
- SMTP-enabled UI state plus documented no-SMTP reset;
- root quality commands.

Exit criteria:

- a small self-hosted deployment can create permitted users and isolate profiles;
- existing users can sign in when registration is disabled;
- no product route is accessible without authentication.

### M2 — Goals and item planning

Requirements: R1, R7, R13, R15–R17, R22, R26, R30, and R32.

1. Add goal and item contracts.
   - Fixed versus item-derived targets;
   - month values;
   - one/two contributions per month;
   - preferred contribution;
   - currency and target-mode impact decisions;
   - fixed-target overage choices.

2. Add pure target and planning rules in `packages/domain`.
   - Current item amounts;
   - fixed allocation/unallocated/overallocated values;
   - item-derived target or incomplete setup;
   - due-month grouping and validation;
   - target-mode and planning-change impact results.

3. Create the goals/items migration.
   - Add enums or constrained text values only where they improve integrity.
   - Add `goals` and `goal_items`, composite ownership relationships, indexes, and RLS.
   - Add no checkpoint, task, snapshot, or activity table.

4. Add Drizzle schema mappings and repositories.
   - Keep mappings synchronized with Supabase SQL.
   - Do not add Drizzle migration tooling.
   - Scope every query by owner.

5. Add Fastify goals/items modules.
   - List/detail/create/update;
   - planning impact preview;
   - archive/restore/permanent delete;
   - item create/update/delete;
   - currency lock check prepared for M3 transaction existence.

6. Deliver a narrow vertical UI.
   - Dashboard with empty/loading/error states;
   - fixed and item-derived goal creation;
   - goal overview and items section;
   - fixed allocation and over-budget decision;
   - incomplete item-derived setup;
   - archive/restore/delete confirmations.

Do not change:

- financial totals beyond empty/zero placeholders;
- projection or simulation behavior;
- purchased state before M3.

Validation:

- table-driven target-mode tests;
- month ordering and fixed overage tests;
- migration constraint tests;
- RLS tests for goals and items;
- API ownership and destructive-action tests;
- responsive goal creation/detail tests;
- root quality commands.

Exit criteria:

- Japan and home-gym structures can be configured;
- item dates derive ordered cumulative requirements;
- no financial operation is implied or persisted yet.

### M3 — Financial ledger and history

Requirements: R2–R3, R8, R10–R12, R14, R18–R19, R28–R29, and R31.

1. Add transaction contracts and response totals.
   - Contribution, withdrawal, purchase, purchase undo;
   - past/today effective date;
   - correction and deletion;
   - fixed-target overage decision at purchase.

2. Implement pure ledger replay.
   - Deterministic ordering;
   - available, spent, funded, and remaining;
   - active purchase/undo resolution;
   - non-negative available and spent at every point;
   - first-invalid-transaction error details.

3. Create the financial migration.
   - Add `financial_transactions`;
   - add structural type/item/reversal constraints and indexes;
   - add owner-consistent foreign keys and RLS;
   - add no snapshot, revision, transfer, or idempotency table.

4. Add repositories and one financial application service.
   - Lock the goal row before every balance-affecting mutation.
   - Load and replay the relevant ledger inside the same explicit transaction.
   - Insert/update/delete only after replay validates.
   - Allow direct deletion only for contributions and withdrawals.
   - Represent purchase undo as a referenced financial transaction.

5. Add API mutations and aggregate reads.
   - Contribution and withdrawal create/edit/delete;
   - purchase preview/confirm;
   - actual-price correction;
   - purchase undo;
   - unified filtered history;
   - aggregate goal detail with current totals and item purchase state.

6. Add the money UI.
   - Amount-only quick contribution with editable effective date;
   - withdrawal;
   - item purchase and above-estimate confirmation;
   - purchase undo;
   - transaction edit/delete;
   - unified history and filters;
   - insufficient-funds and invalid-history explanations.

Do not change:

- add future-dated real transactions;
- add partial refunds, transfers, snapshots, audit revisions, or offline replay.

Validation:

- table-driven ledger success/failure cases;
- historical edit/delete tests;
- purchase/undo and actual-price correction tests;
- concurrent double-spend integration test using goal-row locking;
- API authorization and RLS tests;
- Japan/home-gym financial scenario tests;
- root quality commands.

Exit criteria:

- financial history is authoritative and reconstructs every displayed total;
- purchases cannot consume unavailable money;
- corrections cannot invalidate later history;
- retry protection relies on committed transaction state and UI submission locking, without adding
  an offline/idempotency subsystem.

### M4 — Guidance and temporary simulation

Requirements: R4–R6, R9, R25, and R27.

1. Add projection and simulation contracts.
   - Current critical deadline;
   - recommendation, expected funded, status, and short explanation;
   - open-goal completion estimate;
   - up to three simulation ranges;
   - affordability report.

2. Implement pure month arithmetic.
   - Inclusive start/deadline month counts;
   - completed-month expected opportunities;
   - one/two contributions per month;
   - month-end deadline expiration;
   - currency-safe rounding upward for contribution recommendations.

3. Implement one small projection function.
   - Use the next incomplete dated-item requirement, otherwise the final target.
   - Return `behind`, `at_risk`, `on_track`, or `ahead`.
   - Return `fully funded` as a separate condition.
   - Omit pace output for incomplete or unplanned open goals.

4. Implement temporary simulation as a wrapper around projection.
   - Apply hypothetical contributions in memory;
   - continue the optional final range until deadline/target;
   - compare current and simulated outcomes;
   - report when each pending item becomes individually affordable;
   - never reserve money, purchase items, or write data.

5. Add projection and simulation API responses.
   - Include current projection in goal aggregate responses.
   - Add a read-only simulation endpoint with no repository writes.

6. Add guidance and simulator UI.
   - Goal-card status and recommended contribution;
   - dated-item deadline summary;
   - open-goal estimate or no-plan state;
   - three-range simulator;
   - current-versus-simulated report;
   - explicit report-only affordability language.

Do not change:

- goal settings or transactions from a simulation;
- persist simulation inputs/results;
- add explanation trees or multiple recommendation systems.

Validation:

- exhaustive table-driven month/status boundaries;
- one/two-contribution rounding cases;
- current-month and expired-deadline cases;
- open goal with/without preferred contribution;
- three-range simulation and affordability cases;
- assertion that simulation performs no writes;
- root quality commands.

Exit criteria:

- identical inputs always return identical guidance;
- Japan deadlines and home-gym estimates match hand-calculated fixtures;
- simulation cannot mutate real state.

### M5 — Product UX integration

Requirements: all user-facing portions of R1–R32.

1. Finalize the information architecture.
   - Routes: auth, goals dashboard, goal detail, archived goals, and settings.
   - Goal detail: overview, items, and financial history.
   - Simulator as a focused page or responsive sheet, not a permanent navigation destination.

2. Consolidate reusable UI only where repeated.
   - Money formatter/input;
   - status label;
   - funded progress;
   - impact preview;
   - confirmation dialog;
   - loading/empty/error states.

3. Complete responsive behavior.
   - Mobile-first primary actions;
   - desktop density without extra business information;
   - keyboard and visible-focus support;
   - labels and non-color status communication.

4. Complete all disabled and recovery states.
   - registration/recovery unavailable;
   - locked currency;
   - insufficient funds;
   - invalid historical correction;
   - item-derived setup incomplete;
   - no preferred contribution;
   - archived read-only behavior where appropriate.

5. Update user and operator documentation.
   - Core workflows;
   - currency and correction behavior;
   - registration, SMTP, and self-hosting configuration.

Do not change:

- business rules for visual convenience;
- add dashboard totals across currencies;
- restore excluded navigation or features from the obsolete prototype.

Validation:

- React integration tests for normal/empty/loading/error/disabled states;
- keyboard and accessible-name checks;
- responsive screenshots for dashboard, goal detail, money action, and simulator;
- manual verification at representative mobile and desktop widths;
- root quality commands.

Exit criteria:

- a new user can complete both representative scenarios without external help;
- contribution remains the fastest primary action;
- the UI exposes no excluded feature.

### M6 — Hardening and self-hosted release

Requirements: cross-cutting security, operations, and final acceptance.

1. Recheck current Supabase documentation and changelog before release work.
   - Auth configuration;
   - registration control;
   - Data API grants;
   - RLS policy syntax;
   - production self-hosting.

2. Harden database and authorization.
   - RLS on every exposed application table;
   - explicit owner predicates;
   - `USING` and `WITH CHECK` for updates;
   - no user-editable metadata for authorization;
   - no privileged client credentials;
   - database advisors and query/index review.

3. Add full integration and end-to-end coverage.
   - User A versus user B isolation;
   - Japan fixed goal with dated flights/hotel items;
   - home gym item-derived goal with purchases and lower/higher actual prices;
   - invalid historical edit/delete;
   - archive/restore/permanent delete;
   - registration disabled;
   - simulator report-only guarantee.

4. Produce the production self-hosting configuration.
   - Web, API, PostgreSQL/Supabase, secrets, TLS/reverse-proxy guidance, SMTP, backups, migrations,
     and upgrade procedure.
   - Ensure default development credentials cannot be used in production.

5. Final documentation and release review.
   - README;
   - environment reference;
   - manual password reset;
   - backup/restore at infrastructure level;
   - license and release checklist.

Validation:

- `pnpm install --frozen-lockfile`;
- `pnpm format:check`;
- `pnpm lint`;
- `pnpm typecheck`;
- `pnpm test`;
- `pnpm build`;
- `pnpm db:reset`;
- database/RLS/API integration suites;
- end-to-end suite;
- `docker compose config`;
- fresh self-hosted startup and migration upgrade rehearsal;
- `git diff --check`.

Exit criteria:

- both representative scenarios pass end to end;
- cross-user access fails at API and database layers;
- a fresh deployment is reproducible and documented;
- no excluded feature or obsolete invariant remains in release documentation.

## Files and Modules

Expected additions or focused edits:

```text
AGENTS.md
README.md
docs/
apps/api/src/
  config/
  middleware/
  modules/auth/
  modules/profiles/
  modules/goals/
  modules/items/
  modules/financial/
  modules/projections/
apps/web/src/
  app/
  features/auth/
  features/goals/
  features/items/
  features/financial/
  features/simulation/
  lib/
packages/contracts/src/
  auth/
  profiles/
  goals/
  items/
  financial/
  projections/
packages/domain/src/
  money/
  goals/
  financial/
  projections/
  simulations/
packages/database/src/
  schema/
  repositories/
supabase/migrations/
tests/
```

The directory names are planning targets, not authorization to create generic layers or empty
barrels. Each file should be introduced only when its owning milestone needs it.

## Testing and Validation Strategy

### Unit

- target modes and item sums;
- ledger replay and invalid chronological sequences;
- month arithmetic, rounding, status, and open-goal estimates;
- simulation ranges and item affordability.

### Database integration

- migration constraints and cascades;
- owner-consistent foreign keys;
- goal-row locking and concurrent spending;
- RLS select/insert/update/delete isolation.

### API integration

- auth and ownership;
- every financial success and rejection path;
- impact previews and confirmations;
- archive/restore/delete;
- simulation no-write behavior.

### Web integration

- auth capability states;
- goal/item/money flows;
- history editing;
- loading/empty/error/disabled/destructive states;
- responsive and keyboard behavior.

### End to end

- Japan;
- home gym;
- second-user isolation;
- self-hosted registration and recovery configurations.

## Plan Critique

- Requirements without implementation steps: none.
- Implementation steps without requirements:
  - documentation realignment is a prerequisite created by the current source-of-truth conflict;
  - production hardening is required by the repository's self-hosting rules.
- Primary scope-creep risks:
  - restoring standalone checkpoints instead of deriving deadlines from dated items;
  - turning simulation into saved plans or automatic purchases;
  - reintroducing snapshots/event sourcing for personal-scale data;
  - adding transfers, offline sync, templates, or admin UI “while nearby.”
- Primary test gaps to prevent:
  - cross-user mutation tests, not only read tests;
  - chronological corrections after purchases;
  - fixed-target overage decisions;
  - month boundary and current-month calculations;
  - concurrency without snapshots.

## Risks and Mitigations

### Existing documentation conflict

Mitigation: D0 is mandatory and documentation-only. No schema or feature code begins beforehand.

### Ledger replay performance

Expected volume is personal and small. Index by goal and deterministic order, measure before adding
any cache, and introduce no snapshot without evidence.

### Concurrent spending without a snapshot row

Lock the owning goal row inside each financial transaction, replay after acquiring the lock, then
write and commit.

### Duplicate source of truth for purchased items

Derive purchased state and actual cost from the active purchase transaction. Do not store duplicate
purchase fields on `goal_items`.

### RLS versus privileged API connection

Scope every repository query by owner even when the API connection bypasses RLS. Test RLS separately
against authenticated Data API access as defense in depth.

### Supabase version drift

At M1 and M6, inspect the pinned CLI/client versions, current changelog, and official documentation
before implementing auth configuration or release hardening.

### Fixed-target overage confusion

Use one shared impact contract and require the explicit `keep target` or `increase target` decision
in item and purchase flows.

## Rollback

- D0: revert documentation changes before implementation if the simplified scope is rejected.
- Code milestones: revert the milestone branch before merge when no shared environment has applied
  its migration.
- Applied database migrations: never delete or rewrite migration history; create a forward corrective
  migration.
- Feature data: keep each milestone deployable and avoid destructive backfills.
- Release: document database backup and tested restore before upgrading a self-hosted instance.

## Build Authorization Gate

This plan does not authorize implementation. Before starting D0 or any code milestone, request:

> Confirmo que puedo empezar a implementar usando este plan?
