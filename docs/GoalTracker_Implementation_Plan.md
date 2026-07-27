# Goal Tracker — Implementation Plan

> **Source documents**
>
> - `GoalTracker_Product_Requirements_Master.md`
> - `GoalTracker_Technical_Architecture.md`
> - `GoalTracker_Architecture_Blueprint.md`

---

# 1. Objective

Implement the Goal Tracker MVP as a self-hosted React + Vite PWA backed by a TypeScript API, Supabase Auth/PostgreSQL, Drizzle for typed data access, and Supabase migrations as the schema source of truth.

The implementation must preserve these architectural principles:

- financial events are the source of truth;
- snapshots are reconstructable caches;
- all financial writes go through the backend;
- Projection Engine is pure and deterministic;
- simulations are side-effect free;
- offline support is limited to cached reads and deposit creation;
- every important business rule exists in one authoritative place.

---

# 2. Delivery strategy

The project will be delivered in sequential milestones. Each milestone must:

1. have a narrow scope;
2. include migrations, backend, frontend, and tests when relevant;
3. define explicit acceptance criteria;
4. pass lint, typecheck, unit tests, integration tests, and build;
5. update documentation before merge.

No milestone should begin until the previous milestone's exit criteria are satisfied.

---

# 3. Proposed repository structure

```text
goal-tracker/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   ├── domain/
│   ├── database/
│   ├── contracts/
│   ├── ui/
│   └── config/
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── config.toml
├── docs/
├── tests/
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json
```

Use `pnpm` workspaces.

---

# 4. Milestone summary

| Milestone | Name | Primary outcome |
|---|---|---|
| M0 | Repository Foundation | Runnable monorepo and local infrastructure |
| M1 | Identity and User Isolation | Auth, profiles, RLS, private user data |
| M2 | Goals Core | Goal lifecycle and dashboard foundation |
| M3 | Planning Model | Components, checkpoints, tasks |
| M4 | Financial Engine | Deposits, withdrawals, purchases, expenses, snapshots |
| M5 | Transfers and Corrections | Transfers, refunds, voids, revisions |
| M6 | Projection Engine | Contributions, tranquility, recommendations |
| M7 | Simulation | Temporary scenario comparison |
| M8 | Activity and Completion | Timeline, close, archive, trash |
| M9 | Offline PWA | Cached reads and offline deposits |
| M10 | Import, Export, Backup | JSON, CSV, templates, restore |
| M11 | UX Integration | Claude Design implementation and responsive polish |
| M12 | Hardening and Release | Security, tests, docs, Docker release |

---

# 5. Milestone details

## M0 — Repository Foundation

### Scope

- initialize monorepo;
- configure React + Vite + TypeScript;
- configure TypeScript API;
- configure pnpm workspaces;
- add shadcn/ui;
- add Drizzle;
- initialize Supabase local development;
- establish Supabase migrations;
- add Docker Compose;
- configure linting, formatting, testing, typechecking;
- add CI.

### Deliverables

- runnable `apps/web`;
- runnable `apps/api`;
- shared packages;
- local Supabase stack;
- health endpoint;
- root scripts;
- `README.md`;
- `.env.example`.

### Exit criteria

- `pnpm install` works;
- `pnpm dev` starts web, API, and Supabase;
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass;
- Docker Compose startup is documented.

---

## M1 — Identity and User Isolation

### Scope

- email/password registration;
- login/logout;
- password recovery;
- `profiles` table;
- default currency;
- effective timezone;
- RLS policies;
- authenticated API middleware.

### Acceptance criteria

- a user can register and sign in;
- each user sees only their profile;
- unauthenticated API calls are rejected;
- RLS tests prove cross-user isolation;
- timezone changes require confirmation.

---

## M2 — Goals Core

### Scope

- `goals` table;
- create goal;
- quick creation flow;
- edit goal;
- list goals;
- manual order;
- priority;
- states;
- archive, trash, restore;
- goal details shell.

### Acceptance criteria

- a user can create manual-target and component-calculated goals;
- goal currency locks after first financial event;
- archived goals are separated;
- trashed goals can be restored;
- permanent deletion follows configured rules.

---

## M3 — Planning Model

### Scope

- components;
- component types;
- checkpoints;
- checkpoint-component relation;
- final automatic checkpoint;
- tasks;
- roadmap;
- activity events for non-financial changes.

### Acceptance criteria

- one-time purchase and budget components behave differently;
- checkpoint amounts derive correctly;
- checkpoints remain cumulative;
- only one final checkpoint exists;
- tasks may link to one checkpoint or one component;
- history records planning changes.

---

## M4 — Financial Engine

### Scope

- `financial_events`;
- `financial_event_revisions`;
- `goal_financial_snapshots`;
- deposits;
- withdrawals;
- one-time purchases;
- budget expenses;
- event + snapshot atomicity;
- idempotency;
- snapshot reconstruction.

### Acceptance criteria

- financial events are authoritative;
- available, invested, funded, and historical totals calculate correctly;
- no operation creates a negative historical balance;
- repeated idempotency keys return the original result;
- snapshot rebuild matches event history;
- financial writes cannot bypass backend rules.

---

## M5 — Transfers and Corrections

### Scope

- `transfers`;
- atomic transfer;
- refund;
- partial refund;
- event edit;
- event void;
- transfer void;
- historical sequence recalculation;
- checkpoint achievement recalculation.

### Acceptance criteria

- transfer either succeeds fully or changes nothing;
- partial refund never exceeds refundable balance;
- voiding restores exact financial state;
- historical edits are rejected if they create a negative past balance;
- both transfer sides remain linked.

---

## M6 — Projection Engine

### Scope

- pure Projection Engine;
- abstract saving periods;
- monthly and semi-monthly schedules;
- critical checkpoint;
- minimum contribution;
- ideal contribution;
- projected completion date;
- tranquility status;
- explanation tree;
- prioritized recommended actions.

### Acceptance criteria

- same input always returns same output;
- engine has no infrastructure imports;
- all five tranquility states are covered by tests;
- open goals without plan return `No plan`;
- next checkpoint and final goal projections are separate;
- UI displays explanation and recommended action.

---

## M7 — Simulation

### Scope

- Simulation Engine;
- temporary overrides;
- compare base vs simulated;
- change amount, dates, component costs, target;
- apply scenario only after confirmation.

### Acceptance criteria

- simulations do not write to the database;
- real state remains unchanged;
- result clearly compares current and simulated outcomes;
- applying a scenario uses normal validated use cases.

---

## M8 — Activity and Completion

### Scope

- unified activity timeline;
- filters;
- checkpoint achievements;
- current coverage;
- goal completion detection;
- close flow;
- surplus handling;
- close below original target;
- completion summary.

### Acceptance criteria

- historical achievement and current coverage are distinct;
- close requires valid completion or explicit early-close reason;
- remaining balance can be transferred, withdrawn, or retained;
- archived goal retains history.

---

## M9 — Offline PWA

### Scope

- service worker;
- installable PWA;
- client cache;
- IndexedDB;
- offline deposit queue;
- sync states;
- idempotent replay;
- needs-review handling.

### Acceptance criteria

- previously loaded data is readable offline;
- deposit can be created offline;
- reconnection syncs exactly once;
- double replay does not duplicate;
- deposits targeting archived/trashed goals enter review.

---

## M10 — Import, Export, Backup

### Scope

- versioned full backup JSON;
- restore;
- goal export;
- empty template export/import;
- CSV export;
- schema validation;
- incompatible-file errors.

### Acceptance criteria

- template never includes financial history;
- backup restore validates schema before changes;
- incompatible versions fail safely;
- CSV exports usable tabular data;
- import preview allows selection and adjustments.

---

## M11 — UX Integration

### Scope

- implement Claude Design output;
- responsive dashboard;
- goal detail navigation;
- roadmap;
- action menu;
- financial forms;
- empty states;
- loading/error states;
- accessibility basics.

### Acceptance criteria

- mobile and desktop flows are complete;
- adding a deposit requires only amount;
- all critical warnings are understandable;
- keyboard navigation works for primary flows;
- visual design does not alter business rules.

---

## M12 — Hardening and Release

### Scope

- full RLS review;
- security review;
- import size limits;
- rate limiting where appropriate;
- audit logs;
- integration tests;
- end-to-end tests;
- Docker production configuration;
- SMTP documentation;
- backup documentation;
- release process;
- license.

### Acceptance criteria

- Japan and Home Gym scenarios pass end-to-end;
- all mandatory PRD audit cases pass;
- fresh Docker deployment works;
- migration upgrade path works;
- release documentation is complete;
- repository is ready for MIT publication.

---

# 6. Cross-cutting test matrix

Each milestone must add relevant tests across:

- unit;
- database integration;
- API integration;
- RLS;
- end-to-end;
- offline where relevant.

Financial and projection logic require table-driven tests.

---

# 7. Definition of done

A feature is done only when:

- functional behavior is implemented;
- authorization is enforced;
- database constraints exist where appropriate;
- tests cover success and failure paths;
- UI includes loading, empty, success, and error states;
- documentation is updated;
- no business rule is duplicated in the frontend;
- lint, typecheck, tests, and build pass.

---

# 8. Implementation order rationale

The order intentionally builds:

1. infrastructure;
2. identity;
3. structure;
4. money;
5. intelligence;
6. offline and portability;
7. design polish;
8. hardening.

Claude Design may run after M3 once the real information architecture is stable. Full visual integration should happen in M11 to avoid blocking backend progress.
