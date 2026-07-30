# M2 implementation screenshots

Current Goal Tracker React application captures used for the M2.1 visual-conformance review.
Mobile captures use a 390–392px viewport matching the mapped references.

Captured states:

- `onboarding-welcome.png`
- `goal-create-fixed.png`
- `goal-create-item-derived.png`
- `dashboard-active.png`
- `dashboard-empty.png`
- `dashboard-loading.png`
- `dashboard-error.png`
- `goal-incomplete-setup.png`
- `goal-items.png`
- `goal-settings.png`
- `planning-decisions.png`
- `planning-mode-change.png`
- `goal-lifecycle.png`
- `lifecycle-archive-dialog.png`
- `lifecycle-delete-dialog.png`

The captures use deterministic development-only fixture dependencies selected with the
`__design` query parameter. Production builds retain the real Auth/API dependencies and do not
expose fixture behavior.

Intentional deviations:

- M2 surfaces do not show funded progress, pace status, contribution actions, or purchase state;
  those facts do not exist until M3/M4.
- Goal descriptions remain editable because they are canonical M2 data even where a compact
  reference example omits them.
- Contextual item editing uses a shadcn Sheet on mobile instead of persistent action-button clutter.
- Compound planning/lifecycle boards are represented by separate focused captures so each overlay
  remains a real, accessible application state.
