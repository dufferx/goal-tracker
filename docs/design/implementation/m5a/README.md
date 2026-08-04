# M5A Responsive Implementation Evidence

**Status:** Implemented — visually accepted
**Capture date:** 2026-08-04
**Acceptance date:** 2026-08-04

## Viewports and fixtures

- Mobile regression: 390×844.
- Desktop: 1280×900, with 1280×1000 for long forms and simulator.
- Boundary checks: 768×900, 1024×900, and 1600×900.
- Source: the real Vite React application using deterministic development-only `__design`
  fixtures.

The immutable references remain under `docs/design/reference/`. `before/` records the pre-M5A
implementation and `after/` records this implementation.

## Evidence inventory

Paired mobile and desktop captures exist for dashboard, goal detail, goal creation, item management,
history, simulator, archives, and settings. Additional captures prove the mobile contribution
Drawer, desktop contribution Dialog, desktop purchase Dialog, and the responsive breakpoint
transitions.

## Comparison findings

- The mobile create, history, simulator, and settings PNGs are byte-identical to their before
  baselines. Dashboard and goal detail were visually inspected side by side and retain the accepted
  hierarchy, copy, spacing, controls, and tab bar.
- At 768px the floating tab bar remains and the dashboard uses available width without showing the
  rail.
- At 1024px the 236px rail and desktop composition activate.
- At 1600px the application remains capped at the 1280px content maximum.
- Desktop dashboard now has the product rail, contribution action, active/archive counts, currency
  grouping, direct card activation, and two-up featured cards.
- Desktop goal detail now has contextual navigation and a two-region summary/items/history
  composition from the same route, data, and mutation controller.
- Create and settings remain intentionally focused. Items and history use wider comparison space.
  Simulator uses simultaneous editor and report regions.

## Intentional deviations

The desktop reference shows per-goal pace badges, recommendations, and next-obligation facts on the
dashboard. The authoritative `GoalList` contract does not contain guidance; guidance is available
only from `GoalDetail`. M5A therefore omits those list-only facts rather than inventing them,
changing contracts/API outside this milestone, or issuing an N+1 detail request solely for desktop
presentation. The global contribution action and all list-derived financial facts remain real.

The whole goal card/row is the detail action; no separate `View goal` button was added, following
the accepted interaction decision.

## shadcn/ui provenance

- Navigation and actions: shared shadcn `Button`.
- Goal surfaces and summaries: shared shadcn `Card`, `Badge`, `Progress`, and `Skeleton`.
- Forms: shared shadcn `Input`, `RadioGroup`, `Select`, `Switch`, `Popover`, `Calendar`, and the
  composed DatePicker/MoneyInput patterns.
- Contextual financial actions: shared shadcn `Drawer` below 1024px and `Dialog` at desktop.
- Destructive decisions: shared shadcn `AlertDialog`.
- Feedback: shared shadcn `Alert`.
- Simulation report: shared shadcn `Table`.
- No Sheet was introduced.

## Gate

The user explicitly accepted the mobile/desktop comparison on 2026-08-04. The M5A visual gate is
closed. M5B may begin after this milestone is merged into `development` and the integration branch
is updated locally.
