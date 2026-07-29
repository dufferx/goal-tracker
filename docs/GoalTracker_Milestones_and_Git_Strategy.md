# Goal Tracker — Milestones and Git Strategy

**Status:** Active
**Base branch:** `development`
**Release branch:** `main`

## Milestones

| Milestone | Purpose | Suggested branch |
|---|---|---|
| D0 | Simplified product documentation reset | `docs/simplified-product-reset` |
| M1 | Identity and cross-user isolation | `feat/identity-isolation` |
| M2 | Goals and item planning | `feat/goals-items` |
| M3 | Financial ledger and history | `feat/financial-ledger` |
| M4 | Guidance and temporary simulation | `feat/guidance-simulation` |
| M5 | Integrated product UX | `feat/product-ux` |
| M6 | Self-hosted hardening and release | `chore/self-hosted-release` |

The detailed scope and exit criteria are in `GoalTracker_Implementation_Plan.md`.

## Branch workflow

1. Confirm the previous milestone passes its exit criteria on `development`.
2. Update local `development` without discarding unrelated work.
3. Create the milestone branch shown above or an equivalently scoped branch.
4. Implement only that milestone.
5. Validate the full repository plus milestone-specific tests.
6. Review the diff against `development`.
7. Commit intentionally and open a pull request to `development` only when explicitly requested.
8. Merge only after required checks and review pass.

`main` receives production-ready releases from `development`; feature work never targets `main`
directly.

## Commit strategy

Use Conventional Commits:

```text
docs(product): establish simplified goal model
feat(goals): add fixed and item-derived planning
feat(finance): add replay-safe financial ledger
test(rls): prove cross-user isolation
chore(release): pin self-hosted service versions
```

Prefer small commits that leave the branch valid and represent one coherent change. Do not create
artificial commits per file or mix unrelated cleanup with a milestone.

## Schema changes

- Each schema change is a forward Supabase migration in `supabase/migrations`.
- Never edit a migration already used by another environment unless the repository is explicitly
  reset before first release.
- Drizzle mappings change in the same commit as their SQL migration.
- Migration tests cover constraints, RLS, and expected rollback behavior.
- Destructive migrations need backup and restoration notes.

## Pull-request requirements

A milestone PR targets `development` and describes:

- user-visible scope and exclusions;
- architecture or product decisions changed;
- migration and deployment effects;
- test commands and results;
- screenshots for UI work;
- follow-up risks that belong to a later milestone.

No PR is created, published, merged, or retargeted without explicit user authorization.

## Releases

Use semantic versioning after M6 establishes the first deployable release. A release includes pinned
container/application versions, migrations, operator notes, backup compatibility, and known
limitations. Upgrades must review current Supabase and PostgreSQL breaking changes before changing
pins.
