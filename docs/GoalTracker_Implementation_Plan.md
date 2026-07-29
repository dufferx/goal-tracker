# Goal Tracker — Implementation Plan

**Status:** Approved
**Last updated:** 2026-07-29
**Sequence:** D0, then M1 through M6 without overlap

This is the canonical delivery plan. `implementation-plan.md` at the repository root is the
discovery-era detailed planning record; this document governs execution.

## Working rules

- Complete milestones in order and work only on the requested milestone.
- Start each milestone from `development` after the prior milestone exit criteria pass.
- Keep migrations, backend, frontend, tests, and documentation together when the milestone needs
  them.
- Do not add excluded features, future abstractions, unused dependencies, or compatibility layers
  for the abandoned model.
- Supabase SQL files are the only migration source of truth. Drizzle never generates migrations.
- Do not claim completion when required validation has not run; report the exact limitation.

## D0 — Simplified product reset

**Goal:** Make the approved simplified product the only authoritative direction before schema or
feature implementation.

**Branch:** `docs/simplified-product-reset`

### Changes

- rewrite product requirements around goals, items, ledger, guidance, and temporary simulation;
- rewrite technical architecture and blueprint with the four-table application model;
- replace the old milestone sequence with D0 and M1–M6;
- align contributor instructions, Codex prompts, design prompt, and README;
- retain approved discovery files as evidence and label them non-canonical;
- leave source code, dependencies, and migrations unchanged.

### Exit criteria

- no authoritative document instructs agents to implement tasks, standalone checkpoints,
  components, transfers, persistent simulations, or financial snapshots;
- all approved requirements R1–R32 map to the canonical requirements and delivery milestones;
- product and technical documents have an explicit precedence relationship;
- links and internal references resolve;
- Markdown/source whitespace passes `git diff --check`;
- repository validation is attempted and unavailable tooling is reported.

## M1 — Identity and user isolation

**Goal:** Establish private multi-user ownership and deployment-aware email/password authentication.

**Suggested branch:** `feat/identity-isolation`

### Data and backend

- create the `profiles` table and ownership policies;
- create the minimal `goals` ownership skeleton only if needed to prove child isolation;
- wire Supabase access-token verification in the API;
- add authenticated user context and typed authorization helpers;
- implement profile read/update;
- configure registration as a deployment setting;
- document SMTP recovery and manual recovery behavior.

### Web

- sign in, optional sign up, sign out, session restoration, recovery request, and update-password
  states;
- profile/default-currency setup;
- protected routing with loading and expired-session handling.

### Tests

- migration and constraints;
- API unauthenticated and cross-user denial;
- RLS direct-access isolation;
- registration enabled/disabled behavior;
- recovery UI with and without configured email delivery.

### Exit criteria

Two users can authenticate on the same deployment and cannot read or mutate one another's data
through the API or RLS.

## M2 — Goals and item planning

**Goal:** Create the complete non-financial planning aggregate.

**Suggested branch:** `feat/goals-items`

### Data and domain

- complete `goals` and create `goal_items`;
- implement fixed and item-derived target rules;
- implement canonical business-month parsing and validation;
- derive incomplete item-goal setup;
- implement fixed-goal item overage decision: keep or increase target.

### API and web

- goal CRUD, archive, restore, and confirmed permanent delete;
- item create/edit/delete/reorder;
- active and archived goal lists grouped by currency;
- create/edit forms for target mode, start/final month, one/two contribution frequency, and optional
  preferred amount;
- fixed-goal percentage helper that stores the converted money value.

### Tests

- target calculations and edge cases;
- invalid month ranges and target-mode fields;
- item ownership and ordering;
- explicit over-budget choice;
- empty, loading, error, archive, restore, and delete states.

### Exit criteria

The Japan and empty/home-gym plans can be represented without tasks, checkpoints, or generic
components. Item-derived goals calculate their target or report incomplete setup correctly.

## M3 — Financial ledger and history

**Goal:** Make real monetary activity safe, editable, and reconstructable.

**Suggested branch:** `feat/financial-ledger`

### Data and domain

- create `financial_transactions`, constraints, indexes, and RLS;
- implement deterministic ledger replay and target integration;
- implement contribution, withdrawal, purchase, full undo, edit, and delete rules;
- implement currency locking and submission/retry protection without an idempotency subsystem;
- serialize money safely at JSON boundaries.

### API

- one financial command service with explicit transaction and pessimistic goal lock;
- history query with deterministic ordering and filters;
- stable domain-error mapping;
- reject archived-goal mutations and future effective dates.

### Web

- add/edit/delete contribution and withdrawal;
- purchase item and undo purchase with confirmation;
- summary for funded, spent, available, target, and remaining;
- unified financial history and correction states.

### Tests

- table-driven replay including every invalid negative prefix;
- purchase affordability, actual-price target changes, duplicate purchase, undo, and purchased-item
  deletion block;
- concurrent and repeated commands;
- database rollback, locking, retry behavior, and RLS;
- API and web happy/error paths.

### Exit criteria

Every financial write passes through one engine and transaction path. Retries are safe, retroactive
changes cannot corrupt history, and cross-user or concurrent commands cannot double-spend.

## M4 — Guidance and temporary simulation

**Goal:** Explain the pace needed for a goal and safely explore hypothetical contributions.

**Suggested branch:** `feat/guidance-simulation`

### Domain

- implement cumulative due-item and final-month obligations;
- compute deadline-based monthly and per-contribution recommendations;
- implement open-goal preferred-amount forecast;
- implement `ahead`, `on_track`, `at_risk`, `behind`, absent-status, and `fully_funded` behavior;
- expose one projection entry point with values, status, explanation, and recommendation;
- implement validation and reporting for up to three sequential simulation phases whose amount is
  per contribution;

### API and web

- include guidance in goal-detail queries;
- add side-effect-free simulation endpoint;
- display guidance with plain-language reasons;
- build a temporary simulator with phase editing, validation, monthly report, target estimate, and
  item-affordability timeline.

### Tests

- month boundaries, past due obligations, overlapping obligations, frequency division, tolerance,
  purchased items, open goals, and incomplete targets;
- simulation duration, sequence, continuation, invalid amount, three-phase limit, and affordability;
- proof that simulations write no rows.

### Exit criteria

Both reference goals produce deterministic, understandable guidance, and simulation reports never
change real state or pretend affordable items were purchased.

## M5 — Product UX integration

**Goal:** Turn the functional slices into one calm, accessible, mobile-first product.

**Suggested branch:** `feat/product-ux`

### Changes

- align navigation, dashboard, goal detail, forms, history, simulator, archives, and settings;
- implement consistent currency, date, status, toast, dialog, skeleton, and error patterns;
- preserve form input across recoverable errors;
- complete keyboard, screen-reader, focus, contrast, reduced-motion, and responsive behavior.

### Tests

- component and integration coverage for all visible states;
- automated accessibility checks and manual keyboard pass;
- mobile and desktop visual checks;
- end-to-end Japan and home-gym journeys.

### Exit criteria

The product is usable without knowledge of its data model, status is never color-only, destructive
actions are explicit, and critical journeys work on mobile and desktop.

## M6 — Hardening and self-hosted release

**Goal:** Produce a reproducible, supportable self-hosted release.

**Suggested branch:** `chore/self-hosted-release`

### Changes

- production Docker Compose and reverse-proxy example with pinned versions;
- environment validation and safe public/server variable separation;
- signup, SMTP, TLS, secrets, backup, restore, upgrade, and rollback documentation;
- observability with request IDs and non-sensitive structured logs;
- dependency, image, migration, and security review;
- release notes and operator checklist.

### Tests

- clean-machine installation and smoke test;
- backup/restore rehearsal;
- production build and container health checks;
- full RLS, API, domain, web, end-to-end, and accessibility suites.

### Exit criteria

A new operator can deploy from documented instructions, create isolated users, restore a backup, and
complete both reference journeys without unpublished knowledge.

## Requirement coverage

| Requirement | Delivery milestone |
|---|---|
| R1 Manage goals | M2 |
| R2 Contributions and correction | M3 |
| R3 Money totals | M3 |
| R4 Dated-item cumulative deadlines | M2, M4 |
| R5 Contribution guidance | M4 |
| R6 Explainable status | M4 |
| R7 Items in both target modes | M2, M3 |
| R8 Item purchase | M3 |
| R9 Temporary simulation | M4 |
| R10 Withdrawal | M3 |
| R11 Purchase undo | M3 |
| R12 Purchased-item correction | M3 |
| R13 User-controlled fully funded lifecycle | M2, M4 |
| R14 Historical replay validation | M3 |
| R15 Pending-item deletion | M2, M3 |
| R16 Target-mode impact confirmation | M2 |
| R17 Month-level planning | M2, M4 |
| R18 Real transaction dates | M3 |
| R19 Unified financial history | M3 |
| R20 Multi-user isolation | M1 |
| R21 Authentication | M1 |
| R22 Archive, restore, permanent delete | M2 |
| R23 Deployment registration control | M1, M6 |
| R24 Capability-aware password recovery | M1, M6 |
| R25 Open-goal preferred contribution | M2, M4 |
| R26 Goal currency isolation and locking | M1–M3 |
| R27 Completed-month expected progress | M4 |
| R28 Safe contribution/withdrawal deletion | M3 |
| R29 No future real transactions | M3 |
| R30 Planning impact previews | M2 |
| R31 Real item-price overage choice | M2, M3 |
| R32 Empty item-goal setup state | M2, M4 |

## Standard completion report

Every milestone handoff includes:

- milestone and behavior delivered;
- files changed;
- migrations and rollback notes;
- tests added;
- commands run and results;
- unavailable validation and unresolved risks;
- next recommended milestone.
