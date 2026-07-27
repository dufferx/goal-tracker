# Goal Tracker — Milestones and Git Strategy

---

# 1. Branch model

Use a lightweight Git flow:

```text
main
└── development
    ├── feat/*
    ├── refactor/*
    ├── fix/*
    ├── chore/*
    └── docs/*
```

## Rules

- `main` contains production-ready releases only.
- `development` is the integration branch.
- all work begins from `development`;
- pull requests target `development`;
- releases merge `development` into `main`;
- no direct commits to `main`;
- keep branches milestone-scoped but small enough to review.

---

# 2. Branch naming

```text
feat/<scope>
refactor/<scope>
fix/<scope>
chore/<scope>
docs/<scope>
test/<scope>
```

Examples:

```text
feat/repository-foundation
feat/auth-and-profiles
feat/goals-core
feat/planning-model
feat/financial-engine
feat/transfers-and-corrections
feat/projection-engine
feat/simulation-engine
feat/activity-and-completion
feat/offline-pwa
feat/import-export-backup
feat/ux-integration
feat/release-hardening
```

---

# 3. Milestone branches

| Milestone | Primary branch |
|---|---|
| M0 | `feat/repository-foundation` |
| M1 | `feat/auth-and-profiles` |
| M2 | `feat/goals-core` |
| M3 | `feat/planning-model` |
| M4 | `feat/financial-engine` |
| M5 | `feat/transfers-and-corrections` |
| M6 | `feat/projection-engine` |
| M7 | `feat/simulation-engine` |
| M8 | `feat/activity-and-completion` |
| M9 | `feat/offline-pwa` |
| M10 | `feat/import-export-backup` |
| M11 | `feat/ux-integration` |
| M12 | `feat/release-hardening` |

---

# 4. Optional sub-branches

When a milestone becomes too large, split it into narrow branches.

Example for M4:

```text
feat/financial-schema
feat/financial-deposits-withdrawals
feat/financial-purchases-expenses
feat/financial-snapshots
test/financial-engine-cases
```

All target `development`.

---

# 5. Commit conventions

Use Conventional Commits:

```text
feat:
fix:
refactor:
test:
docs:
chore:
build:
ci:
```

Examples:

```text
feat(financial): add idempotent deposit use case
fix(projection): handle open goals without plan
test(rls): prevent cross-user goal access
docs(self-hosting): add SMTP setup
```

---

# 6. Pull request requirements

Every PR must include:

- scope summary;
- affected milestone;
- migrations;
- test evidence;
- screenshots for UI changes;
- known limitations;
- checklist confirming no business rules were duplicated.

---

# 7. Release strategy

Use semantic versioning.

Suggested progression:

```text
0.1.0  M0-M2 foundation
0.2.0  M3 planning
0.3.0  M4-M5 financial core
0.4.0  M6-M7 projections and simulations
0.5.0  M8-M10 completion, offline, portability
0.9.0  M11 design-complete release candidate
1.0.0  M12 stable MVP
```

---

# 8. Tags and changelog

- tag releases from `main`;
- maintain `CHANGELOG.md`;
- include migration notes;
- include breaking environment changes;
- document backup steps before upgrades.
