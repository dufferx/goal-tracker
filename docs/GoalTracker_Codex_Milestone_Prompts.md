# Codex Prompts by Milestone — Goal Tracker

Use each prompt in a fresh Codex task after the previous milestone is merged into `development`.

---

# M0 — Repository Foundation

Implement milestone M0 from `docs/GoalTracker_Implementation_Plan.md`.

Requirements:

- initialize pnpm monorepo;
- create `apps/web` with React, Vite, TypeScript;
- create `apps/api` with a minimal TypeScript HTTP server;
- create packages `domain`, `database`, `contracts`, `ui`, `config`;
- configure shadcn/ui;
- configure Drizzle without using Drizzle migrations;
- initialize Supabase local directory and migration workflow;
- create Docker Compose reference development setup;
- add root scripts for dev, lint, typecheck, test, build;
- add CI;
- add health endpoint;
- add `.env.example` and README.

Do not implement product features.

---

# M1 — Identity and User Isolation

Implement M1.

Requirements:

- Supabase email/password auth;
- registration, login, logout, password recovery;
- `profiles` migration;
- default currency and effective timezone;
- authenticated API middleware;
- RLS policies;
- cross-user isolation tests;
- confirmation flow when browser timezone differs.

Keep OAuth out of scope.

---

# M2 — Goals Core

Implement M2.

Requirements:

- goals migration and Drizzle schema;
- create, list, read, update goals;
- quick-create flow;
- target modes;
- saving frequency;
- planned contribution;
- priority and manual ordering;
- states, archive, trash, restore;
- separate archived view;
- currency lock after first financial event;
- activity events for lifecycle changes.

No components or financial events yet beyond the minimum needed to enforce currency locking later.

---

# M3 — Planning Model

Implement M3.

Requirements:

- components with `one_time_purchase` and `budget`;
- checkpoints;
- automatic final checkpoint;
- checkpoint-components join table;
- tasks with only one optional context;
- cumulative checkpoint validation;
- activity timeline entries;
- roadmap UI;
- unit and integration tests.

Ensure component-calculated goals recalculate their target correctly.

---

# M4 — Financial Engine

Implement M4.

Requirements:

- financial events, revisions, snapshots migrations;
- FinancialEngine public interface;
- deposit;
- withdrawal;
- purchase one-time component;
- register budget expense;
- atomic event and snapshot update;
- idempotency for every mutation;
- snapshot reconstruction;
- historical balance validation;
- backend-only writes;
- comprehensive table-driven tests.

Do not implement transfers, refunds, or voids yet.

---

# M5 — Transfers and Corrections

Implement M5.

Requirements:

- transfers entity;
- atomic transfer with stable lock ordering;
- edit financial event with revision;
- void event;
- restore voided event;
- total and partial refunds;
- transfer void;
- complete chronological reconstruction;
- checkpoint achievement recalculation;
- rejection of changes causing negative historical balance.

---

# M6 — Projection Engine

Implement M6.

Requirements:

- pure domain package;
- abstract saving periods;
- semi-monthly and monthly schedules;
- critical checkpoint;
- checkpoint and final-goal projections;
- minimum contribution;
- ideal contribution;
- projected completion date;
- tranquility states;
- explanation tree;
- prioritized recommended actions;
- no database or API dependencies;
- exhaustive unit tests.

---

# M7 — Simulation Engine

Implement M7.

Requirements:

- immutable temporary snapshots;
- override model;
- compare base and simulated projections;
- support amount, date, target, component-cost, and cancellation scenarios;
- API endpoint;
- UI comparison;
- applying a scenario must call normal use cases.

No simulation persistence.

---

# M8 — Activity and Completion

Implement M8.

Requirements:

- unified timeline;
- filters;
- checkpoint achievement history;
- current coverage;
- completion detection;
- close flow;
- surplus resolution;
- close below original target;
- archive after confirmation;
- completion summary.

---

# M9 — Offline PWA

Implement M9.

Requirements:

- installable PWA;
- service worker;
- cache previously loaded data;
- IndexedDB offline deposit queue;
- unique client operation IDs;
- sync states;
- automatic retry;
- needs-review state for archived/trashed target;
- no duplicate deposits after replay;
- UI indicators for pending and failed sync.

---

# M10 — Import, Export, Backup

Implement M10.

Requirements:

- versioned JSON schemas;
- full user backup;
- restore;
- goal export;
- empty goal-template export/import;
- CSV export;
- preview and selection;
- schema compatibility validation;
- file size limits;
- safe failure without partial ambiguous imports.

---

# M11 — UX Integration

Implement the approved Claude Design output without changing business rules.

Requirements:

- dashboard;
- goal detail;
- roadmap;
- action menu;
- deposit-first UX;
- responsive navigation;
- empty/loading/error states;
- accessible primary flows;
- screenshots for desktop and mobile;
- preserve tests.

---

# M12 — Hardening and Release

Implement M12.

Requirements:

- security and RLS audit;
- rate limits where justified;
- audit logs;
- complete integration and E2E suite;
- Japan and Home Gym fixtures;
- production Docker Compose;
- SMTP docs;
- backup and upgrade docs;
- migration upgrade test;
- MIT license;
- changelog;
- release checklist.

Do not claim completion unless fresh deployment and full validation pass.
