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

## M1 — Identity and isolation

> Work only on M1 from `development`. Implement Supabase email/password session flows, profiles,
> deployment-controlled signup, recovery behavior, API token verification, owner-scoped
> repositories, and RLS. Prove two users cannot access one another's data through the API or direct
> authenticated database access. Do not implement goal planning or finance beyond the minimal
> ownership fixture needed for isolation tests.

## M2 — Goals and items

> Work only on M2 after M1 passes. Implement fixed and item-derived goals, month-level planning, one
> or two planned contributions per month, optional preferred contribution, optional items and due
> months, target derivation, explicit fixed-budget overage handling, archives, and permanent delete.
> Do not add financial ledger, status, or simulation behavior.

## M3 — Financial ledger

> Work only on M3 after M2 passes. Implement the authoritative ledger and the single locked
> financial mutation path for contributions, withdrawals, purchases, full undo, edits,
> and deletes. Replay the complete ordered history and reject every negative prefix. Derive funded,
> spent, available, item purchase state, actual price, target, and history. Add concurrency,
> transaction, RLS, API, and UI coverage. Do not implement projections or simulation.

## M4 — Guidance and simulation

> Work only on M4 after M3 passes. Build pure deadline and open-goal projection rules, monthly and
> per-contribution recommendation, pace statuses, fully-funded condition, explanation, and estimate
> through one public domain entry point. Add a side-effect-free simulator with at most three
> sequential phases whose amount is per contribution, plus informational item-affordability
> reporting. Prove it never writes data or
> assumes purchases.

## M5 — Product UX

> Work only on M5 after M4 passes. Integrate a calm mobile-first experience for authentication,
> dashboard, goal detail, item and transaction flows, history, simulation, archives, and settings.
> Complete loading, empty, error, success, disabled, confirmation, responsive, keyboard,
> screen-reader, contrast, and connection-error states. Do not add new product features.

## M6 — Self-hosted release

> Work only on M6 after M5 passes. Produce pinned, production-oriented self-hosting configuration;
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
