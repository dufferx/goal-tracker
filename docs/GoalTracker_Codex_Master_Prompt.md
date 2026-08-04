# Goal Tracker — Codex Standing Prompt

Build Goal Tracker as a deliberately small, private, self-hosted goal and budget tracker.

Before acting, read in order:

1. `AGENTS.md`;
2. `docs/GoalTracker_Product_Requirements_Master.md`;
3. `docs/GoalTracker_Technical_Architecture.md`;
4. `docs/GoalTracker_Architecture_Blueprint.md`;
5. `DESIGN.md` for user-facing work;
6. `docs/design/README.md` and the active milestone's mapped captures for user-facing work;
7. `docs/design/GoalTracker_Design_System.md` for user-facing work;
8. `docs/GoalTracker_Implementation_Plan.md`;
9. the requested milestone checklist.

The product has one primary aggregate: a private goal. A goal may have optional purchasable items.
It has either a fixed target or a target derived from expected and actual item prices. An item's
optional due month supplies cumulative deadline planning without a separate checkpoint entity.

Money changes only through the authoritative financial ledger. Funded, spent, available, purchase
state, target, remaining amount, guidance, and simulation outputs are derived. Every financial
mutation passes through one backend service, an explicit transaction, goal lock, and full ordered
replay. Never put authoritative rules in React or write financial rows from the
browser.

Implement only the active milestone, sequentially through D0, D1, M1, M2, M2.1, M3, M4, M5A,
M5B, and M6. Choose the simplest
implementation consistent with the canonical documents. Do not introduce:

- tasks or task progress;
- standalone milestones/checkpoints or generic components;
- pay periods, transfers, bank integrations, or shared goals;
- snapshots as financial truth;
- persistent simulations;
- offline writes, service workers, mutation queues, request idempotency, or automatic financial
  mutation retries;
- app-level import/export;
- AI, OAuth, native apps, push notifications, or public APIs.

Use Supabase migrations as the sole schema history, Drizzle for typed access, RLS plus backend
authorization for isolation, integer minor units for money, explicit business dates, and pure domain
engines. Keep dependencies flowing in the direction documented by the architecture.

For every UI change, read `docs/design/README.md`, the mapped milestone captures, and
`docs/design/GoalTracker_Design_System.md`. Reproduce the approved Graphite structure closely with
shared tokens. Use configured shadcn/ui registry primitives for generic controls; do not invent
parallel buttons, inputs, cards, sheets, drawers, dialogs, selects, tables, alerts, or skeletons.
Custom UI is limited to the documented Goal Tracker domain composites.

M1 through M4 must each leave their owned surfaces at product quality. Current implementation
captures and a side-by-side comparison are milestone exit evidence. M5A owns responsive
architecture and desktop composition and has a blocking user visual gate. M5B is the final
integrated accessibility and journey audit, not a phase for repairing avoidable foundational visual
debt.

Before completion, run:

```sh
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
git diff --check
```

Add milestone-specific validation and disclose anything that could not run. Preserve unrelated work.
Do not commit, push, create a PR, or make external changes unless the user explicitly requests it.

If a product rule is missing, do not invent a consequential behavior. Select only a reversible,
minimal implementation detail; document it in the correct source. Stop when product and technical
sources genuinely conflict.
