# Goal Tracker

A deliberately small, open-source, private goal and budget tracker for personal savings plans.

Goal Tracker records contributions and spending, supports optional planned purchases, explains
whether a dated plan is on pace, and lets users temporarily simulate future contribution amounts.
It supports multiple private accounts so a small deployment can be shared without sharing data.

## Product model

- **Goals** have a fixed budget or a target calculated from item prices.
- **Items** are optional planned purchases or expenses and may have a due month.
- **Transactions** record contributions, withdrawals, purchases, and purchase undo.
- **Guidance** estimates the monthly and per-contribution amount needed for dated plans.
- **Simulation** temporarily reports what hypothetical contributions would make affordable.

There are no tasks, standalone checkpoints, transfers, bank integrations, shared goals, or saved
simulations in the MVP.

## Current state

The `development` branch contains the monorepo foundation, D0/D1 documentation and design baseline,
and the completed M1 through M4 product slices. Remaining feature work proceeds sequentially:

| Milestone | Scope                                           |
| --------- | ----------------------------------------------- |
| D0        | Canonical product and architecture reset        |
| D1        | Design references and executable visual tokens  |
| M1        | Identity and user isolation                     |
| M2        | Goals and item planning                         |
| M3        | Financial ledger and history                    |
| M4        | Guidance and temporary simulation               |
| M5A       | Responsive architecture and desktop composition |
| M5B       | Integrated UX, accessibility, and journeys      |
| M6        | Managed deployment and release hardening        |

Do not treat a planned milestone as an implemented feature.

## Intended stack

```text
apps/web        React + Vite + TypeScript
apps/api        Fastify + TypeScript
packages/domain Pure business engines
packages/database Drizzle typed access
packages/contracts Zod contracts
packages/ui      Shared UI components
supabase/        PostgreSQL/Auth configuration and migrations
```

The project uses pnpm workspaces and Turborepo. Docker Compose is the reference local development
environment. The reference production deployment is managed — Vercel (web), Render or Railway (API
container), and Supabase Cloud (PostgreSQL and Auth) — with self-hosting retained as a documented
option; see the [managed deployment decision](docs/GoalTracker_Managed_Deployment_Decision.md).
Supabase migrations are the only database migration source; Drizzle is used for typed access only.

## Documentation

Read in this order:

1. [Product requirements](docs/GoalTracker_Product_Requirements_Master.md)
2. [Technical architecture](docs/GoalTracker_Technical_Architecture.md)
3. [Architecture blueprint](docs/GoalTracker_Architecture_Blueprint.md)
4. [Implementation plan](docs/GoalTracker_Implementation_Plan.md)
5. [Milestones and Git strategy](docs/GoalTracker_Milestones_and_Git_Strategy.md)
6. [Managed deployment decision](docs/GoalTracker_Managed_Deployment_Decision.md)
7. [Design reference index](docs/design/README.md)
8. [Design system](docs/design/GoalTracker_Design_System.md)
9. [Contributor guide](AGENTS.md)

## Operating a deployment

- [Operator guide](docs/GoalTracker_Operator_Guide.md) — deploy and operate the managed stack
  (Supabase Cloud, Render or Railway, Vercel), plus the self-hosted appendix.
- [Release notes](docs/GoalTracker_Release_Notes.md) — versioned release history.

The root `feature-requirements.md` and `implementation-plan.md` preserve the approved discovery
conversation and detailed requirement mapping. Canonical documents under `docs/` govern execution.

## Repository setup

Prerequisites:

- Node.js version declared in `.nvmrc`;
- pnpm version declared in `package.json`;
- Docker and Docker Compose for Supabase and full integration tests.

Install and validate:

```sh
corepack enable
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
git diff --check
```

Environment and deployment instructions are documented in the
[operator guide](docs/GoalTracker_Operator_Guide.md). Deployed-environment smoke tests run with
`pnpm test:smoke` (requires the deployed API and web URLs).

M1 authentication and recovery configuration is documented in
[Identity operations](docs/GoalTracker_Identity_Operations.md).

## Contributing

Work from `development`, implement only the active milestone, preserve unrelated changes, and
follow [AGENTS.md](AGENTS.md). Pull requests target `development`; `main` is reserved for
production-ready releases.

## License

This project is intended to be open source. The definitive license is the repository `LICENSE`
file when present.
