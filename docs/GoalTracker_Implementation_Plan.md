# Goal Tracker — Implementation Plan

**Status:** Approved
**Last updated:** 2026-08-04
**Sequence:** D0, D1, M1, M2, M2.1, M3, M4, M5A, M5B, then M6 without overlap

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

## D1 — Design implementation baseline

**Goal:** Make the approved Graphite v2 design a durable, executable implementation constraint
before feature UI work begins.

**Branch:** `docs/design-implementation-baseline`

### Changes

- capture milestone-scoped PNG references from the approved local design artifact;
- record artifact provenance, screen ownership, and responsive dimensions;
- document Graphite v2 tokens, typography, surfaces, interaction patterns, copy, accessibility, and
  responsive behavior;
- apply shared Graphite tokens in `packages/ui/src/styles/globals.css`;
- require configured shadcn/ui primitives before generic custom controls;
- integrate visual references and conformance checks into M1–M6.

### References

- [D1 requirements](GoalTracker_Design_Baseline_Requirements.md)
- [D1 implementation plan](GoalTracker_Design_Baseline_Implementation_Plan.md)
- [Design reference index](design/README.md)
- [Graphite v2 design system](design/GoalTracker_Design_System.md)

### Exit criteria

- every UI-producing milestone links to its primary visual references;
- committed screenshots match the recorded artifact checksum and have stable filenames;
- shared CSS exposes the documented Graphite semantic tokens;
- generic controls are assigned to shadcn/ui primitives and custom composites have a closed
  allowlist;
- design references distinguish product UI from prototype annotations;
- no product feature, migration, or speculative component is implemented;
- full repository checks and image/link validation pass.

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

### Design references

- [Sign in](design/reference/m1/auth-sign-in.png)
- [Create account](design/reference/m1/auth-create-account.png)
- [Registration disabled](design/reference/m1/auth-registration-disabled.png)
- [Password recovery](design/reference/m1/auth-password-recovery.png)
- [Account settings](design/reference/m1/account-settings.png)

### Tests

- migration and constraints;
- API unauthenticated and cross-user denial;
- RLS direct-access isolation;
- registration enabled/disabled behavior;
- recovery UI with and without configured email delivery.

### Exit criteria

Two users can authenticate on the same deployment and cannot read or mutate one another's data
through the API or RLS. Implemented surfaces conform to the mapped references and shared design
system, with any accessibility-driven deviation documented.

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

### Design references

- [Welcome](design/reference/m2/onboarding-welcome.png)
- [Create fixed goal](design/reference/m2/goal-create-fixed.png)
- [Create item-derived goal](design/reference/m2/goal-create-item-derived.png)
- [Incomplete item-derived setup](design/reference/m2/goal-incomplete-setup.png)
- [Active dashboard](design/reference/m2/dashboard-active.png)
- [Dashboard states](design/reference/m2/dashboard-states.png)
- [Goal items](design/reference/m2/goal-items.png)
- [Goal settings](design/reference/m2/goal-settings.png)
- [Planning decisions](design/reference/m2/planning-decisions.png)
- [Goal lifecycle](design/reference/m2/goal-lifecycle.png)

### Tests

- target calculations and edge cases;
- invalid month ranges and target-mode fields;
- item ownership and ordering;
- explicit over-budget choice;
- empty, loading, error, archive, restore, and delete states.

### Exit criteria

The Japan and empty/home-gym plans can be represented without tasks, checkpoints, or generic
components. Item-derived goals calculate their target or report incomplete setup correctly.
Implemented surfaces conform to the mapped references and shared design system.

## M2.1 — M1/M2 visual conformance recovery

**Goal:** Remove avoidable visual debt from M1 and M2 before financial behavior extends these
surfaces.

**Branch:** `feat/goals-items`

### Scope

- recover every mapped M1/M2 surface against the approved Graphite references;
- use shadcn/ui primitives for every applicable generic control;
- make selected, focused, disabled, loading, error, success, and destructive states unambiguous;
- remove fake progress, future-feature controls, and implementation-roadmap copy;
- store current implementation captures and compare them at the mapped viewports;
- preserve validated M1/M2 product behavior and all non-visual architecture.

### References

- [M2.1 requirements](GoalTracker_M2_1_Visual_Conformance_Requirements.md)
- [M2.1 implementation plan](GoalTracker_M2_1_Visual_Conformance_Implementation_Plan.md)
- [Design delivery gate](../DESIGN.md)
- [M1 implementation captures](design/implementation/m1/)
- [M2 implementation captures](design/implementation/m2/)

### Exit criteria

All mapped M1/M2 states have current implementation evidence. Blocking and material differences
have been corrected or have a documented product, responsive, or accessibility reason. Applicable
generic controls trace to shadcn/ui, automated validation passes, and the user accepts the final
visual comparison. M3 must not begin before this gate passes.

## M3 — Financial ledger and history

**Goal:** Make real monetary activity safe, editable, and reconstructable.

**Suggested branch:** `feat/financial-ledger`

### Data and domain

- create `financial_transactions`, constraints, indexes, and RLS;
- implement deterministic ledger replay and target integration;
- implement contribution, withdrawal, purchase, full undo, edit, and delete rules;
- implement currency locking, pending-submit locking, and explicit reconciliation after an
  ambiguous network result, without automatic mutation retries or an idempotency subsystem;
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
- unified financial history and correction states;
- disable financial forms while pending; on an unknown network result, refresh goal history before
  enabling another submission.

### Design references

- [Goal financial detail](design/reference/m3/goal-financial-detail.png)
- [Financial history](design/reference/m3/financial-history.png)
- [Add contribution](design/reference/m3/add-contribution.png)
- [Contribution result and withdrawal](design/reference/m3/contribution-result-withdrawal.png)
- [Purchase and undo](design/reference/m3/purchase-undo.png)
- [Transaction correction](design/reference/m3/transaction-correction.png)

### Tests

- table-driven replay including every invalid negative prefix;
- purchase affordability, actual-price target changes, duplicate purchase, undo, and purchased-item
  deletion block;
- concurrent commands and double-submit prevention;
- database rollback, locking, ambiguous-result reconciliation, and RLS;
- API and web happy/error paths.

### Exit criteria

Every financial write passes through one engine and transaction path. The client does not
automatically retry financial mutations; an unknown result is reconciled from history before the
user can try again. Retroactive changes cannot corrupt history, and cross-user or concurrent
commands cannot double-spend. Implemented surfaces conform to the mapped references and shared
design system.

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

### Design references

- [Guidance states](design/reference/m4/guidance-states.png)
- [Planning timeline](design/reference/m3/goal-financial-detail.png)
- [Temporary simulator](design/reference/m4/simulator.png)

### Tests

- month boundaries, past due obligations, overlapping obligations, frequency division, tolerance,
  purchased items, open goals, and incomplete targets;
- simulation duration, sequence, continuation, invalid amount, three-phase limit, and affordability;
- proof that simulations write no rows.

### Exit criteria

Both reference goals produce deterministic, understandable guidance, and simulation reports never
change real state or pretend affordable items were purchased. Implemented surfaces conform to the
mapped references and shared design system.

## M5A — Responsive architecture and desktop composition

**Goal:** Establish the final responsive application structure and implement intentional desktop
compositions without regressing the approved mobile experience or changing product behavior.

**Suggested branch:** `feat/product-ux-responsive`

### Changes

- unify authenticated navigation under one responsive application shell with the approved desktop
  rail and mobile tab bar;
- remove mobile-only width constraints from authenticated surfaces where the desktop references
  require more context, while keeping focused forms intentionally narrow;
- refactor the vertical goal-detail implementation into reusable presentation sections that can be
  composed on mobile and desktop without duplicating routes, screens, or business logic;
- implement the desktop dashboard composition, currency groups, card density, rail actions, and
  responsive goal states from the approved reference;
- implement the desktop goal-detail composition with contextual rail, guidance and financial
  summary, items, history, timeline, and simulator access;
- give create/edit flows, items, history, simulator, archives, and settings deliberate desktop
  widths and arrangements instead of scaling the mobile canvas;
- retain the existing shadcn-based drawers and dialogs, approved Graphite tokens, and mobile
  interaction behavior;
- make no domain, ledger, projection, persistence, or product-rule changes.

### Design references

- [Complete reference index](design/README.md)
- [Desktop dashboard](design/reference/m5/desktop-dashboard.png)
- [Desktop goal detail](design/reference/m5/desktop-goal-detail.png)
- the existing mobile references for every surface changed by responsive composition.

### Tests

- responsive component and routing coverage for the shared shell and contextual navigation;
- browser checks at the documented 390px mobile and 1280px desktop viewports;
- mobile regression checks for every surface whose composition changes;
- implementation captures for dashboard, goal detail, and representative secondary flows at both
  viewport classes.

### Exit criteria and visual gate

- dashboard and goal detail match the approved desktop hierarchy, density, rail, and content
  composition with no unexplained material divergence;
- authenticated secondary flows have intentional desktop layouts and do not render as enlarged
  390px screens;
- the same routes and presentation components serve mobile and desktop without duplicated
  authoritative logic;
- mobile captures show no regression from their approved references;
- keyboard focus order remains coherent across responsive navigation changes;
- current implementation captures and comparison notes are stored under
  `docs/design/implementation/m5a/`;
- the full repository validation suite passes and the user explicitly accepts the mobile/desktop
  visual comparison.

**M5B must not begin until this visual gate passes.**

## M5B — Integrated UX, accessibility, and journey quality

**Goal:** Audit the responsive product as one calm, accessible experience and close cross-flow
quality gaps without redesigning the M5A compositions.

**Suggested branch:** `feat/product-ux-quality`

### Changes

- align dashboard, goal detail, forms, history, simulator, archives, settings, and authentication as
  complete end-to-end journeys;
- correct remaining visual drift without changing approved information architecture;
- implement consistent currency, date, status, toast, dialog, drawer, skeleton, and error patterns;
- complete loading, empty, success, error, disabled, pending, destructive, ambiguous-network, and
  confirmation states;
- preserve form input across recoverable errors;
- complete keyboard, screen-reader, focus, contrast, reduced-motion, and responsive behavior;
- audit production bundle composition and add code splitting only where it produces a clear,
  measured benefit.

### Design references

- [Complete reference index](design/README.md), including all mobile references and the M5 desktop
  compositions accepted in M5A.

### Tests

- component and integration coverage for all visible states;
- automated accessibility checks and a documented manual keyboard pass;
- final mobile and desktop visual checks;
- end-to-end Japan Trip and Home Gym journeys across the real application stack;
- connection-error and recoverable-form scenarios for critical financial and planning flows.

### Exit criteria

The product is usable without knowledge of its data model, status is never color-only, destructive
actions are explicit, and both critical journeys work on mobile and desktop. Accessibility checks,
manual keyboard validation, end-to-end journeys, repository validation, and the final complete-set
visual review pass with no unexplained divergence.

## M6 — Managed deployment and release hardening

**Goal:** Produce a reproducible, supportable managed-deployment release on the reference stack:
Vercel for the web, a Docker container on Render or Railway for the API, and Supabase Cloud for
PostgreSQL and Auth.

**Suggested branch:** `chore/managed-deployment-release`

### Changes

- production start command for the API container (the current `apps/api/Dockerfile` CMD runs the
  development server);
- environment validation and safe public/server variable separation;
- observability with request IDs and non-sensitive structured logs;
- operator documentation for the managed stack: Supabase Cloud project creation, migration
  application with `supabase db push`, Auth and SMTP configuration in Supabase Cloud, API
  deployment on Render or Railway (environment variables, health check), web deployment on Vercel
  (build-time `VITE_*` variables), platform-managed domains and TLS, and Supabase Cloud backups
  with plan limitations such as free-tier inactivity pauses;
- self-hosted deployment documentation retained as an appendix option (Docker Compose, reverse
  proxy, own TLS, own backup/restore) without additional MVP hardening;
- dependency, image, migration, and security review;
- release notes and operator checklist.

### Design references

- [Registration capability](design/reference/m1/auth-registration-disabled.png)
- [Password recovery capability](design/reference/m1/auth-password-recovery.png)
- [Deployment information](design/reference/m6/deployment-information.png)

### Tests

- production build and container health checks;
- deployed-environment smoke test;
- full RLS, API, domain, web, end-to-end, and accessibility suites.

### Exit criteria

A new operator can deploy the managed stack from documented instructions — Supabase Cloud project,
API on Render or Railway, web on Vercel — create isolated users, and complete both reference
journeys without unpublished knowledge. The self-hosted option is documented as an appendix with
its own backup/restore rehearsal. Deployment-dependent UI conforms to the mapped references.

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
