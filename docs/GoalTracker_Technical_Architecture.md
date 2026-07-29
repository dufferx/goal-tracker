# Goal Tracker — Technical Architecture

**Status:** Approved for implementation
**Last updated:** 2026-07-29
**Authority:** Technical decisions and implementation constraints. Product behavior is governed by
`GoalTracker_Product_Requirements_Master.md`.

## 1. Architecture goals

The architecture optimizes for a small self-hosted product:

- one clear path for each business rule;
- a reconstructable ledger instead of multiple sources of monetary truth;
- strict user isolation;
- explicit transactions for financial consistency;
- pure calculations that are easy to test;
- minimal infrastructure and no speculative extension points.

The implementation is a pnpm TypeScript monorepo:

```text
apps/
  web/          React + Vite SPA
  api/          Fastify HTTP API
packages/
  domain/       Pure ledger, projection, item, and simulation rules
  database/     Drizzle mappings and typed repositories
  contracts/    Zod request/response and serialization contracts
  ui/           Shared presentational components
  config/       Shared build and tool configuration
supabase/
  migrations/  Sole database migration history
  seed.sql
  config.toml
```

Docker Compose is the reference local and self-hosted environment. Supabase supplies PostgreSQL and
Auth. Drizzle supplies typed access only; it never creates or manages migrations.

## 2. Dependency direction

```text
web      -> contracts, ui
api      -> domain, database, contracts
database -> contracts, generated database types
domain   -> TypeScript standard library only
ui       -> React and visual dependencies, no authoritative domain logic
```

The web app talks to Supabase directly only for authentication session operations. All application
data goes through the API. The API validates the Supabase access token, resolves the authenticated
user, authorizes the aggregate, and invokes domain and repository operations.

## 3. Data model

All identifiers are UUID v4. All money uses signed `bigint` minor units at application boundaries
and PostgreSQL `bigint` in storage. The MVP accepts currencies with two decimal places. Business
months use a `date` constrained to the first day of a month; real transaction dates use `date`;
technical ordering and audit fields use `timestamptz`.

### `profiles`

| Column | Type | Rule |
|---|---|---|
| `id` | uuid PK/FK | References `auth.users(id)` with cascade |
| `display_name` | text nullable | Trimmed, bounded |
| `default_currency` | char(3) | Uppercase ISO-like code |
| `created_at`, `updated_at` | timestamptz | Server managed |

### `goals`

| Column | Type | Rule |
|---|---|---|
| `id` | uuid PK | UUID v4 |
| `owner_id` | uuid FK | Owner |
| `name` | text | Non-empty, bounded |
| `currency` | char(3) | Uppercase; locked after first ledger row |
| `target_mode` | enum | `fixed`, `items` |
| `fixed_target_minor` | bigint nullable | Required and positive only for `fixed` |
| `start_month` | date | First day of month |
| `final_month` | date nullable | First day, not before start |
| `contributions_per_month` | smallint | 1 or 2 |
| `preferred_contribution_minor` | bigint nullable | Positive amount per contribution |
| `status` | enum | `active`, `archived` |
| `created_at`, `updated_at` | timestamptz | Server managed |

### `goal_items`

| Column | Type | Rule |
|---|---|---|
| `id` | uuid PK | UUID v4 |
| `owner_id` | uuid FK | Same owner as parent goal |
| `goal_id` | uuid FK | Cascade on permanent goal deletion |
| `name` | text | Non-empty, bounded |
| `expected_price_minor` | bigint | Positive |
| `due_month` | date nullable | First day; not before goal start |
| `created_at`, `updated_at` | timestamptz | Server managed |

Purchase state and actual price are derived from the active purchase ledger. They are not duplicated
on the item row.

### `financial_transactions`

| Column | Type | Rule |
|---|---|---|
| `id` | uuid PK | UUID v4 |
| `owner_id` | uuid FK | Same owner as parent goal |
| `goal_id` | uuid FK | Cascade only with permanent goal deletion |
| `kind` | enum | contribution, withdrawal, purchase, purchase_undo |
| `amount_minor` | bigint | Positive |
| `effective_date` | date | Not future at command time |
| `item_id` | uuid nullable | Required only for purchase and undo |
| `reverses_transaction_id` | uuid nullable | Required only for undo; unique |
| `created_at`, `updated_at` | timestamptz | Deterministic history |

A purchase item may have at most one active purchase not reversed by a unique undo. Composite
ownership relationships ensure children cannot reference another owner's goal. Contextual rules
that require history replay belong to the backend transaction, not brittle SQL checks.

Required indexes cover owner goal lists, goal items, ledger replay
`(goal_id, effective_date, created_at, id)`, and item purchase lookup.

There are deliberately no task, checkpoint, component, transfer, pay-period, simulation, snapshot,
or revision tables in the MVP.

## 4. Domain modules

`packages/domain` exposes focused modules:

- `ledger`: deterministic replay and validation of contribution, withdrawal, purchase, undo,
  retroactive edit, and delete commands;
- `targets`: fixed and item-derived target calculation;
- `projection`: one public calculation returning required pace, estimate, status, explanation, and
  recommendation;
- `simulation`: contribution-only phase validation and in-memory reporting;
- `money` and `business-month`: shared primitives and safe arithmetic.

Domain functions accept plain immutable data and an explicit calculation date. They perform no I/O,
read no clock directly, and import no React, HTTP, Supabase, Drizzle, filesystem, or network code.

Each authoritative formula exists once. API and UI consume its result instead of reimplementing it.

## 5. Financial mutation transaction

Every financial command follows one application service:

1. validate the request contract;
2. begin an explicit database transaction;
3. lock the owned goal row with `SELECT ... FOR UPDATE`;
4. load the complete ordered ledger and relevant items;
5. apply the proposed create, edit, delete, or undo in memory;
6. replay the complete sequence with the ledger engine;
7. reject any negative funded, spent, or available prefix or invalid item transition;
8. persist the mutation and commit;
9. return freshly derived totals and affected entities.

Locking the goal serializes all mutations for that aggregate, including competing item purchases.
The ledger is expected to remain small for a personal tracker. Snapshots or incremental replay are
not introduced without measured need and a documented architecture decision.

## 6. Application API

The API is versioned under `/api/v1` and organized by domain module.

Conceptual endpoints:

```text
GET/PUT              /profile
GET/POST             /goals
GET/PATCH/DELETE     /goals/:goalId
POST                 /goals/:goalId/archive
POST                 /goals/:goalId/restore
GET/POST             /goals/:goalId/items
PATCH/DELETE         /goals/:goalId/items/:itemId
GET/POST             /goals/:goalId/transactions
PATCH/DELETE         /goals/:goalId/transactions/:transactionId
POST                 /goals/:goalId/items/:itemId/purchase
POST                 /goals/:goalId/transactions/:purchaseId/undo
POST                 /goals/:goalId/simulate
```

DTOs are defined once in `packages/contracts` with Zod and exported TypeScript types. Responses use
string-encoded minor units at JSON boundaries to avoid JavaScript precision loss. Errors use a
stable envelope with code, message, field details when relevant, and request ID.

Archived aggregates reject mutations except restore and permanent deletion. Permanent deletion is
an explicit command, never a generic accidental cascade from another resource.

## 7. Authentication, authorization, and RLS

- The API verifies access tokens against the configured Supabase project and never trusts a
  client-supplied owner ID.
- Repository methods require an authenticated user ID and constrain every owner lookup.
- Public-schema application tables have RLS enabled.
- Owner policies derive ownership from `auth.uid()`, directly for profiles/goals and through the
  parent goal for items and transactions.
- UPDATE policies define both `USING` and `WITH CHECK`; required SELECT policies are present.
- Authorization never uses mutable `user_metadata`.
- Service-role, secret, database, and JWT-signing credentials never reach the browser.
- Cross-user API and RLS tests are release blockers.

RLS is defense in depth because normal application access uses the API. Privileged backend access
does not replace repository authorization.

Registration is deployment configuration, not a product table. Self-hosted environments explicitly
configure signup, external email, mailer auto-confirm, site URL, redirect allow-list, and SMTP
behavior. The web app receives only public runtime configuration.

## 8. Web boundary

React pages orchestrate API state and render domain results. They contain no authoritative monetary
or projection formulas. Server state uses one query/mutation layer with cache invalidation scoped to
the affected goal.

Offline behavior, service-worker caching, mutation queues, and request idempotency are outside the
MVP. A financial form sends one request and disables resubmission while it is pending. The query
layer must not automatically retry financial mutations.

A known server rejection preserves recoverable form input and may be retried after correction. If a
network failure leaves the commit result unknown, the web app shows an indeterminate-result error,
refreshes the affected goal and history, and enables another submission only after reconciliation.
No client-generated key, replay queue, or idempotency persistence is introduced.

## 9. Self-hosting and operations

- Pin application, Supabase, PostgreSQL, and gateway image versions; do not deploy floating tags.
- Keep deployment-specific URLs and gateway prefixes in environment configuration. Do not hardcode
  assumptions about a particular Supabase gateway generation.
- Terminate TLS at a reverse proxy in production.
- Replace every example secret, restrict database exposure, and configure production SMTP when
  email recovery is offered.
- Back up PostgreSQL data and deployment configuration. Document a restore rehearsal.
- Review Supabase breaking changes before upgrading, especially database-major and gateway changes.
- Backups operate at the infrastructure/database level. App-level import/export is outside the MVP.

Current upstream references:

- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Self-hosted Auth configuration](https://supabase.com/docs/guides/self-hosting/auth/config)
- [Self-hosting with Docker](https://supabase.com/docs/guides/self-hosting/docker)
- [Supabase breaking changes](https://supabase.com/changelog?types=breaking-change)

## 10. Validation

The minimum continuous validation is:

```sh
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
git diff --check
```

Milestones add:

- table-driven domain tests for every ledger prefix, target mode, projection boundary, and
  simulation phase;
- database integration tests for migrations, constraints, locking, rollback, and RLS;
- API integration tests for authentication, ownership, errors, and mutation replay;
- web tests for critical states and accessibility;
- end-to-end tests for the Japan and home-gym journeys;
- backup/restore and self-hosted smoke tests before release.

## 11. Superseded architecture

The following concepts are not retained for compatibility because no production user data exists:

- task and task-completion systems;
- standalone milestones/checkpoints;
- generic component abstractions;
- transfer and transfer-reversal workflows;
- snapshot-led financial truth;
- persistent simulations;
- multiple parallel financial mutation paths.

Any future reintroduction requires measured need, a product decision, a migration plan, and an
architecture decision record.
