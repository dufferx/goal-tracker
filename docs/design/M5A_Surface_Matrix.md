# M5A Responsive Surface Matrix

**Status:** Implemented — visually accepted on 2026-08-04
**Milestone:** M5A — Responsive architecture and desktop composition

This matrix converts the approved references and responsive rules into an implementation and
capture contract. Product behavior remains governed by the canonical requirements.

## Responsive contract

| Viewport | Navigation | Composition rule |
| --- | --- | --- |
| `<768px` | Floating mobile tab bar | Preserve approved single-column mobile order and gutters |
| `768–1023px` | Floating tab bar | Preserve order; permit useful two-column field/group layouts |
| `>=1024px` | Persistent 236px rail | Use intentional desktop regions and contextual simultaneity |
| `>=1440px` | Persistent 236px rail | Cap application content at 1280px; do not stretch controls |

### Mobile visual-freeze rule

Below 768px, every accepted M1–M4 composition is frozen for M5A. Responsive refactoring may change
component ownership or DOM structure, but it must not intentionally change the rendered hierarchy,
copy, spacing, typography, sizing, component choice, navigation placement, action hierarchy, or
Drawer presentation. A necessary visible accessibility or canonical-behavior correction requires
documented user approval before implementation. Subpixel rendering noise is not a material change.

## Surface ownership

| Surface | Route/state | Mobile constraint | Desktop outcome | Primary evidence |
| --- | --- | --- | --- | --- |
| Active dashboard | `/goals` | Preserve mobile cards and floating add action | Product rail, contribution CTA, counts, currency groups, two featured cards and compact overflow rows | `reference/m5/desktop-dashboard.png`, M2/M3 mobile captures |
| Archived dashboard | `/goals`, archived filter | Preserve filter and archived explanation | Same dashboard shell and density; no separate archive page | M2 dashboard states plus desktop dashboard structure |
| Dashboard empty/loading/error | `/goals`, fixture states | Preserve stable mobile states | Fill main content region without replacing shell; actions remain in expected locations | M2 dashboard states and DESIGN.md |
| Goal overview | `/goals/:goalId` | Preserve one scrolling page, tab bar, guidance-first order | Contextual rail; summary/guidance region beside items and recent history | `reference/m5/desktop-goal-detail.png`, M3/M4 mobile captures |
| Goal items | `/goals/:goalId/items` | Preserve focused item management | Shared contextual rail; wider item rows/forms where useful | M2 goal-items mobile reference plus desktop goal-detail items region |
| Goal edit | goal-detail Edit state | Preserve focused form and lifecycle actions | Shared contextual rail and readable focused form width | M2 goal-settings mobile reference plus Graphite form rules |
| Full history | `/goals/:goalId/history` | Preserve filter chips and mobile list | Shared contextual rail; comparison-friendly wide history rows/table | M3 financial-history mobile reference plus desktop goal-detail history region |
| Simulator | `/goals/:goalId/simulator` | Preserve vertical phase/report flow | Shared contextual rail; wider composition with phase editor and report context when useful | M4 simulator mobile reference plus responsive rules |
| New goal | `/goals/new` | Preserve approved focused form | Shared product shell; intentionally narrow form, not isolated mobile canvas | M2 create-goal mobile references plus Graphite form rules |
| Settings | `/settings` | Preserve focused settings list and mobile tab bar | Shared product rail and existing readable 620px panel | M1 account-settings reference plus Graphite form rules |
| Contextual money/item form | Drawer state | shadcn Drawer, full-width mobile treatment | Approximately 480px shadcn Dialog where appropriate | M3 overlay references and Graphite overlay rules |
| Destructive confirmation | AlertDialog state | shadcn AlertDialog | shadcn AlertDialog | M2/M3 lifecycle references |

## Shared shell contract

### Product rail

- Brand.
- Primary Add contribution action when at least one active goal is eligible.
- Goals and Settings destinations with visible and semantic active state.
- Active and archived counts when goal-list data is available.
- No tasks, activity destination, administration, or global cross-currency total.

### Contextual goal rail

- Brand and All goals return action.
- Overview, Items, History, Simulator, and Edit goal destinations.
- Active destination is visible and semantic.
- It supplies navigation only; content and mutation logic remain in the existing route/controller.

### Mobile tab bar

- Goals, Settings, and the circular add-contribution action when eligible.
- No permanent contextual goal submenu.
- The goal page retains its existing inline links/actions to Items, History, Simulator, and Edit.

## Presentation boundaries to establish

| Section | Current location | M5A reuse objective |
| --- | --- | --- |
| Guidance summary/actions | `GuidanceCard` through `FinancialOverview` | Same section in mobile flow and desktop summary region |
| Financial progress/metrics | `FinancialOverview` | Same exact data in mobile flow and desktop summary region |
| Planning timeline | `PlanningTimeline` through `FinancialOverview` | Mobile full timeline; desktop summary/detail placement without duplicate calculation |
| Item summary/actions | `FinancialOverview` and `ItemsPanel` | Overview summary plus focused management route from shared data/controllers |
| Recent/full history | `FinancialOverview` and `FinancialHistoryPage` | Recent desktop table/list plus focused full-history route |
| Goal navigation/header | `GoalDetailPage` plus direct `MobileNavigation` | Shell-provided responsive navigation with one route state |

## Baseline capture inventory

All images below come from the current React application and deterministic `__design` fixtures.

| Capture | Viewport | Purpose |
| --- | --- | --- |
| `implementation/m5a/before/desktop-dashboard-1280.png` | 1280×900 | Current basic rail and mobile-style card baseline |
| `implementation/m5a/before/desktop-goal-detail-1280.png` | 1280×900 | Current isolated 390px detail baseline |
| `implementation/m5a/before/desktop-goal-create-1280.png` | 1280×1000 | Current isolated focused-form baseline |
| `implementation/m5a/before/desktop-history-1280.png` | 1280×900 | Current isolated history and bottom Drawer baseline |
| `implementation/m5a/before/desktop-simulator-1280.png` | 1280×1000 | Current isolated simulator baseline |
| `implementation/m5a/before/desktop-settings-1280.png` | 1280×900 | Current shell plus focused settings baseline |
| `implementation/m5a/before/mobile-dashboard-390.png` | 390×844 | Mobile dashboard regression anchor |
| `implementation/m5a/before/mobile-goal-detail-390.png` | 390×844 | Mobile detail regression anchor |
| `implementation/m5a/before/mobile-goal-create-390.png` | 390×844 | Mobile form regression anchor |
| `implementation/m5a/before/mobile-history-390.png` | 390×844 | Mobile history regression anchor |
| `implementation/m5a/before/mobile-simulator-390.png` | 390×844 | Mobile simulator regression anchor |
| `implementation/m5a/before/mobile-settings-390.png` | 390×844 | Mobile settings regression anchor |

## Material baseline gaps

| Severity | Gap | Evidence |
| --- | --- | --- |
| Blocking | Goal detail bypasses the authenticated shell and remains a centered 390px column | Desktop goal-detail baseline versus approved reference |
| Blocking | History, simulator, and creation do not participate in authenticated desktop navigation | Desktop secondary-flow baselines |
| Blocking | Desktop goal detail cannot show summary and item/history regions simultaneously | Current monolithic `FinancialOverview` |
| Material | Dashboard rail lacks primary contribution action, counts, and reference hierarchy | Desktop dashboard baseline versus approved reference |
| Material | Dashboard uses only expanded mobile cards; no compact additional-goal rows | Desktop dashboard baseline versus approved reference |
| Material | Full desktop rail appears at 768px instead of the documented 1024px tier | `app-shell.tsx` and design-system breakpoints |
| Material | Desktop history opens a mobile bottom Drawer | Desktop history baseline and overlay rules |
| Acceptable baseline | Focused creation form remains narrow | Graphite form rules; it still needs shared-shell context |
| Acceptable baseline | Settings remains a 620px focused panel | Graphite form rules and current shell composition |

Any mobile difference beyond non-material rendering variance is blocking unless it is a
pre-approved accessibility or canonical-behavior correction.

## Required final evidence

Before M5A can close, replace the baseline with current `after/` captures for:

- dashboard at 390px and 1280px;
- goal detail at 390px and 1280px;
- create goal, items, history, simulator, archives, and settings at representative 390px and 1280px
  states;
- mobile Drawer and desktop Dialog/AlertDialog equivalents where responsive overlay composition
  changes.

The handoff must compare the 1280px dashboard and goal detail directly with their approved M5
references, record any justified deviations, and obtain explicit user acceptance.

Current implementation evidence and comparison notes are stored in
[`implementation/m5a/README.md`](implementation/m5a/README.md). The user accepted the comparison on
2026-08-04, closing the M5A visual gate.
