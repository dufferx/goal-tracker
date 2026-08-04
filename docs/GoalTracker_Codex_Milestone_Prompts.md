# Goal Tracker — Codex Milestone Prompts

These prompts are execution checklists, not independent sources of product truth. Read
`AGENTS.md` and the authoritative documents before using one.

## D0 — Documentation reset

> Work only on D0. Replace obsolete authoritative documentation with the approved simplified
> product: private goals, optional items, a single financial ledger, projection guidance, and
> temporary contribution simulations. Remove instructions for tasks, standalone checkpoints,
> components, transfers, persistent simulations, and snapshot-led progress. Align AGENTS, README,
> milestone, architecture, and design documents. Do not change code, dependencies, or migrations.
> Validate links, requirement coverage, working-tree scope, and `git diff --check`.

## D1 — Design implementation baseline

> Work only on D1 after D0 passes. Capture and version the approved milestone-scoped design
> references, document Graphite v2 completely, apply its shared semantic tokens, and link each
> UI-producing milestone to its reference images. Use configured shadcn/ui primitives for generic
> controls and keep custom components limited to approved domain composites. Do not implement
> product behavior, migrations, or speculative components. Validate images, links, repository
> checks, and artifact provenance.

## M1 — Identity and isolation

> Work only on M1 from `development`. Implement Supabase email/password session flows, profiles,
> deployment-controlled signup, recovery behavior, API token verification, owner-scoped
> repositories, and RLS. Prove two users cannot access one another's data through the API or direct
> authenticated database access. Do not implement goal planning or finance beyond the minimal
> ownership fixture needed for isolation tests. Follow the M1 captures and shared design system;
> do not redesign the mapped surfaces.

## M2 — Goals and items

> Work only on M2 after M1 passes. Implement fixed and item-derived goals, month-level planning, one
> or two planned contributions per month, optional preferred contribution, optional items and due
> months, target derivation, explicit fixed-budget overage handling, archives, and permanent delete.
> Do not add financial ledger, status, or simulation behavior. Follow the M2 captures and shared
> design system; use shadcn/ui primitives instead of replacement controls.

## M2.1 — Visual conformance recovery

> Work only on M2.1 after M2 behavior passes and before M3 begins. Read `DESIGN.md`, compare every
> M1/M2 surface with its mapped reference at the documented viewport, and correct blocking or
> material differences. Use shadcn/ui primitives for every applicable generic control; selected
> states must be unmistakable. Remove fake progress, future controls, and roadmap copy. Preserve
> M1/M2 behavior and non-visual architecture. Store current implementation captures, document only
> product-, responsive-, or accessibility-required deviations, run the full validation suite, and
> require user visual acceptance before closing the milestone.

## M3 — Financial ledger

> Work only on M3 after M2 passes. Implement the authoritative ledger and the single locked
> financial mutation path for contributions, withdrawals, purchases, full undo, edits,
> and deletes. Replay the complete ordered history and reject every negative prefix. Derive funded,
> spent, available, item purchase state, actual price, target, and history. Add concurrency,
> transaction, RLS, API, and UI coverage. Disable duplicate submissions and reconcile an ambiguous
> network result by refreshing history; do not add automatic mutation retries, offline behavior, or
> idempotency infrastructure. Do not implement projections or simulation. Follow the M3 captures
> and shared design system.

## M4 — Guidance and simulation

> Work only on M4 after M3 passes. Build pure deadline and open-goal projection rules, monthly and
> per-contribution recommendation, pace statuses, fully-funded condition, explanation, and estimate
> through one public domain entry point. Add a side-effect-free simulator with at most three
> sequential phases whose amount is per contribution, plus informational item-affordability
> reporting. Prove it never writes data or
> assumes purchases. Follow the M4 captures and shared design system.

## M5A — Responsive architecture and desktop composition

> Work only on M5A after M4 passes. Build the shared responsive authenticated shell and intentional
> desktop compositions for dashboard, goal detail, forms, items, history, simulator, archives, and
> settings while preserving the approved mobile layouts. Refactor presentation boundaries where
> necessary, but do not duplicate routes or move business rules into React. Match the M5 desktop
> dashboard and goal-detail references, use the existing mobile references as regression constraints,
> and use shadcn/ui primitives for generic controls. Capture both viewport classes under
> `docs/design/implementation/m5a/`, run the full suite, and stop for explicit user visual acceptance.
> Do not begin M5B while that gate is open.

## M5B — Integrated UX, accessibility, and journey quality

> Work only on M5B from updated `development` after M5A's visual gate and pull request pass. Audit
> authentication, dashboard, goal detail, item and transaction flows, history, simulation, archives,
> and settings as complete responsive journeys. Complete loading, empty, error, success, disabled,
> pending, confirmation, keyboard, screen-reader, contrast, reduced-motion, and connection-error
> states. Add automated accessibility coverage, document a manual keyboard pass, and implement real
> Japan Trip and Home Gym end-to-end journeys. Correct unexplained drift against the complete
> reference set; do not redesign the accepted M5A compositions or add product features.

## M6 — Self-hosted release

> Work only on M6 after M5B passes. Produce pinned, production-oriented self-hosting configuration;
> environment validation; TLS, signup, SMTP, secrets, infrastructure backup, restore, upgrade,
> rollback, logging, and operator documentation; and clean-install/recovery tests. Review current
> upstream breaking changes rather than relying on old image or gateway assumptions.

## Completion instruction

For every prompt:

1. inspect the branch and working tree;
2. preserve unrelated user changes;
3. state any genuine conflict before implementation;
4. run repository and milestone validation;
5. report files, migrations, tests, results, limitations, risks, and the next milestone;
6. do not commit or publish a pull request unless explicitly asked.
