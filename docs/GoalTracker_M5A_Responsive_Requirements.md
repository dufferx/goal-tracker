# Feature Requirements: M5A Responsive Architecture and Desktop Composition

## Status

Requirements Closed

## Summary

M1 through M4 established the mobile product and its business behavior, but the authenticated web
application does not yet share one responsive composition. The dashboard and settings use a basic
desktop rail, while goal detail, goal creation, history, and simulator render as independent mobile
canvases at desktop widths. M5A will establish one responsive application shell and intentional
desktop compositions without changing product behavior.

This milestone is structural visual work. It may refactor React presentation boundaries and route
composition, but it must not change domain engines, financial rules, API contracts, persistence, or
the approved mobile information hierarchy.

## Goals

- Give every authenticated route one coherent responsive shell.
- Closely match the approved 1280px dashboard and goal-detail references.
- Preserve the accepted 390px mobile experience while removing inappropriate mobile-only desktop
  constraints.
- Treat the accepted mobile compositions as visually frozen: M5A adds responsive behavior around
  them rather than redesigning them.
- Make secondary authenticated flows intentional on desktop without inventing new product
  behavior.
- Create reusable presentation sections for goal detail instead of separate mobile and desktop
  screens.
- Produce current 390px and 1280px visual evidence and require explicit user acceptance before
  M5B.

## Non-Goals

- Change goal, item, ledger, projection, simulation, authentication, or authorization behavior.
- Add new navigation destinations, analytics, charts, global activity, tasks, or administrative UI.
- Duplicate routes, requests, business rules, or derived calculations for desktop.
- Redesign the accepted mobile visual language.
- Make intentional mobile changes to hierarchy, copy, spacing, typography, component choice,
  navigation placement, or interaction presentation.
- Perform M5B's complete accessibility, error-state, or end-to-end journey audit, except where a
  responsive change would otherwise introduce a regression.
- Redesign public authentication screens; intentionally narrow authentication remains valid.

## Users and Entry Points

- Authenticated users on phones, tablets, laptops, and desktop displays.
- Entry points:
  - `/goals`;
  - `/goals/new`;
  - `/goals/:goalId`;
  - `/goals/:goalId/items`;
  - `/goals/:goalId/history`;
  - `/goals/:goalId/simulator`;
  - `/settings`.

## Confirmed Facts

- The user explicitly identified the current desktop experience as an enlarged mobile product and
  chose to solve responsive architecture before the final integrated quality phase.
- The canonical plan assigns responsive architecture and desktop composition to M5A and blocks
  M5B until the user accepts the visual comparison.
- The Graphite design system defines 390px as the primary mobile frame, a 236px desktop rail, a
  1280px content maximum, and reference breakpoints at 768px, 1024px, and 1440px.
- The approved desktop dashboard uses a persistent product rail, grouped currencies, two featured
  cards, compact goal rows, and contribution access in the rail.
- The approved desktop goal detail uses a contextual rail and a two-region composition: guidance
  and financial summary on the left, items and history on the right.
- Mobile contextual forms prefer shadcn Drawer; desktop decisions use Dialog or AlertDialog where
  appropriate. Sheet is not the default interaction.

## Current Code Findings

- `apps/web/src/components/app-shell.tsx` is used only by dashboard/onboarding and settings. It
  displays the full 236px rail at `md` (768px), earlier than the design system's 1024px desktop
  composition threshold.
- The current rail contains only Goals and Settings. It lacks the approved primary contribution
  action, goal counts, and contextual goal-detail navigation.
- `apps/web/src/features/goals/goal-detail.tsx` renders its own 390px page and imports
  `MobileNavigation` directly, bypassing `AppShell`.
- `apps/web/src/features/goals/goal-create.tsx`, `simulator.tsx`, and the history page in
  `financial.tsx` each own an independent `max-w-[390px]` page canvas.
- `apps/web/src/app.tsx` composes the settings and dashboard routes inside `AppShell`, but returns
  creation, detail, history, and simulator routes directly.
- `FinancialOverview` combines guidance, totals, planning timeline, items, recent history, purchase
  actions, and overlays in one vertical component. It cannot produce the approved desktop
  two-region layout without extracting presentation-only sections.
- Dashboard cards switch to two columns at `md`, but their content remains the mobile planning-card
  hierarchy instead of the desktop status, recommendation, and compact-row hierarchy.
- Settings already uses an intentional 620px content width within the shell. Goal creation is also
  appropriately focused in width, but it is visually isolated from the authenticated shell.
- Existing shared shadcn primitives include Button, Card, Drawer, Dialog, AlertDialog, RadioGroup,
  Select, Progress, Switch, Tooltip, and other controls needed by M5A.
- The current 1280px baseline is stored in `docs/design/implementation/m5a/before/` and visibly
  confirms the shell and width inconsistencies.

## Existing Patterns to Reuse

- `packages/ui/src/styles/globals.css`: Graphite tokens, fonts, radii, motion, 236px rail, and
  1280px content maximum.
- `apps/web/src/components/app-shell.tsx`: existing authenticated-shell and mobile-tabbar behavior
  to evolve rather than replace with parallel shells.
- `GuidanceCard`, `PlanningTimeline`, `MoneyInput`, financial metrics, and history rows: approved
  presentation or domain-composite patterns that should be recomposed, not reimplemented.
- `apps/web/src/design-preview.ts`: deterministic Japan Trip, Home Gym, incomplete-goal, history,
  guidance, and simulator states for visual capture.
- `docs/design/reference/m5/desktop-dashboard.png` and `desktop-goal-detail.png`: authoritative
  desktop composition references.
- M1 through M4 mobile reference and implementation captures: regression constraints.

## Requirements

### R1: Use one responsive authenticated shell

Every authenticated route must be composed through one application-shell system. Mobile uses the
existing floating tab bar; desktop uses the approved 236px rail. A page may supply contextual rail
content, but it must not create a second shell or render its own global mobile navigation.

Evidence:

- Canonical M5A scope: unify authenticated navigation under one responsive shell.
- Code evidence: four authenticated route families currently bypass `AppShell`.
- Assumption: none.
- Inference: centralizing shell selection prevents route-specific breakpoint and navigation drift.

### R2: Apply explicit responsive tiers

- Under 768px: preserve the accepted single-column mobile composition and floating tab bar.
- From 768px through 1023px: preserve logical content order, permit useful two-column groups, and
  avoid rendering the full desktop rail prematurely.
- At 1024px and above: show the full desktop rail and intentional desktop compositions.
- At 1440px and above: keep the application within the 1280px content maximum instead of
  stretching cards and controls.

No route may hide an available action solely because the viewport changes.

Evidence:

- Design-system responsive rules and reference breakpoints.
- Code evidence: the current full rail begins at 768px.
- Assumption: the floating tab bar remains the navigation mechanism through the intermediate tier.
- Inference: using one navigation change at 1024px is the simplest behavior consistent with the
  approved desktop threshold.

### R3: Match the approved desktop dashboard hierarchy

At 1280px, `/goals` must closely reproduce the reference's hierarchy and density using real goal
data: persistent rail, primary contribution access, Goals/Settings navigation, active/archive
counts, concise dashboard heading, currency groups, two featured goal cards when space and content
permit, and compact rows for additional goals. Status, recommendations, deadlines, funded,
available, spent, target, and remaining values must come from existing render-ready contracts.

Cards and rows remain directly clickable. Currencies remain visually separated and are never
summed together.

Evidence:

- Approved desktop dashboard reference.
- Product requirement: currency isolation and derived guidance.
- Code evidence: current dashboard already supplies click behavior and currency grouping but not
  the desktop information hierarchy.
- Assumption: none.

### R4: Match the approved desktop goal-detail hierarchy

At 1280px, `/goals/:goalId` must closely reproduce the reference: contextual rail with All goals,
Overview, Items, History, Simulator, and Edit goal; a summary region containing status, guidance,
contribution actions, exact financial progress, and planning facts; and a companion region showing
items and recent history.

The desktop layout must preserve a logical DOM and focus order. Sticky behavior may be used only
for the summary/rail presentation and must not hide content or actions.

Evidence:

- Approved desktop goal-detail reference.
- Design-system goal-detail and accessibility rules.
- Code evidence: all required content exists but is currently emitted by one vertical component.
- Assumption: none.

### R5: Recompose shared goal-detail sections without duplicating behavior

Guidance, financial summary, planning timeline, items, recent history, and contextual actions must
be extracted or bounded as presentation sections that the same route can compose vertically on
mobile and in regions on desktop. Requests, mutation state, reconciliation, item purchase rules,
and derived data remain single-sourced.

The `/items` and `/history` routes remain valid focused destinations. Desktop overview may show
their summaries without cloning their authoritative behavior.

Evidence:

- Architecture rule: UI contains no authoritative domain logic.
- Canonical M5A scope: reusable presentation sections without duplicated routes or business logic.
- Code evidence: `FinancialOverview` and `GoalDetailPage` currently couple layout, navigation, and
  interaction state.
- Assumption: none.

### R6: Give secondary authenticated flows intentional desktop layouts

Goal creation/editing, item management, full history, simulator, archives, and settings must render
inside the shared shell and use content-appropriate desktop widths:

- focused create/edit forms remain deliberately narrow and readable rather than filling the page;
- item management and history may use wider rows or tables where comparison benefits;
- simulator may place phase editing and report context side by side when space permits;
- settings remains a focused panel inside the shell;
- archive remains a dashboard state rather than a new destination.

Where no dedicated desktop reference exists, M5A must extend the established Graphite hierarchy
and preserve the corresponding mobile reference. It must not invent panels, facts, or controls to
fill space.

Evidence:

- Canonical M5A scope names these secondary flows.
- Design-system principle: desktop uses width for context and simultaneity.
- Baseline evidence: creation, history, and simulator currently remain isolated 390px canvases.
- Assumption: none.

### R7: Preserve overlay behavior and use shadcn primitives

Every generic control must continue to trace to an installed shadcn/ui primitive. Mobile
contextual financial and item forms remain Drawer-based. Desktop may present the equivalent
focused interaction as an approximately 480px Dialog where the design system calls for it;
destructive decisions remain AlertDialog. Do not introduce Sheet as a replacement or hand-roll an
overlay.

Evidence:

- User decision: prefer Drawer over Sheet.
- Repository-wide shadcn requirement and Graphite overlay rules.
- Code evidence: required primitives are already installed.
- Assumption: none.

### R8: Preserve all product and technical behavior

M5A must not change contracts, API semantics, persistence, RLS, financial replay, target,
projection, simulation, or authorization rules. It must preserve current routes, browser
back/forward behavior, form input, financial pending locks, and ambiguous-result reconciliation.

Evidence:

- Canonical M5A scope explicitly excludes domain and product-rule changes.
- Architecture boundary: React consumes render-ready results.
- Assumption: none.

### R9: Preserve mobile quality and responsive accessibility

Every changed surface must be checked at 390px for composition regression. Responsive navigation
must expose active state semantically and visually, icon-only actions must retain accessible names,
focus order must follow reading order, touch targets remain at least 44px, status remains textually
identified, and reduced motion remains honored.

Evidence:

- DESIGN.md visual and accessibility gate.
- Canonical M5A exit criteria.
- Assumption: none.

### R10: Require current visual evidence and explicit acceptance

M5A must store current implementation captures for dashboard, goal detail, and representative
secondary flows at 390px and 1280px under `docs/design/implementation/m5a/`. Each capture must map
to its reference or responsive rule, and every material deviation must have a product, responsive,
or accessibility reason. M5A cannot close and M5B cannot begin without explicit user acceptance.

Evidence:

- DESIGN.md and canonical M5A visual gate.
- Existing baseline captures demonstrate why automated tests alone are insufficient.
- Assumption: none.

### R11: Treat mobile presentation as visually frozen

At widths below 768px, M5A must make no intentional visual or interaction-design changes to the
accepted M1–M4 compositions. Content order, navigation placement, component choice, spacing,
typography, sizing, action hierarchy, Drawer behavior, and user-facing copy remain unchanged.

Refactoring DOM or component ownership is allowed only when its rendered mobile result and behavior
remain materially equivalent. Normal subpixel font rasterization or screenshot timing differences
are not product changes. If implementation uncovers a canonical-behavior or accessibility defect
that genuinely requires a visible mobile change, that exception must be documented and explicitly
approved by the user before it is applied; it cannot be smuggled into responsive work.

Evidence:

- User decision: mobile should not change visually as part of M5A.
- Code evidence: accepted M1–M4 mobile captures already provide the regression baseline.
- Assumption: none.
- Inference: a material-equivalence gate protects the approved experience without making browser
  rendering noise or invisible structural refactoring a false failure.

## UX and Interaction Details

- Width adds context and simultaneity; it does not enlarge mobile controls indefinitely.
- The desktop rail owns global contribution access. Goal-detail contribution controls remain near
  guidance because they are contextual and amount-specific.
- Dashboard cards remain one-click destinations; separate “View goal” buttons are not required.
- The desktop goal-detail rail changes location, not capability. The same destinations remain
  reachable on mobile through the existing page actions and routes.
- Goal creation and edit forms retain visible labels, clear selected states, and their existing
  month-level controls.
- Full history uses a comparison-friendly desktop row/table presentation while preserving the
  mobile list.
- Simulator phase input and report remain temporary and visually distinct from real financial
  actions.
- Empty, loading, error, archived, incomplete, and fully funded states must fit the same shell and
  must not collapse to an unrelated page structure.

## Data, State, API, and Permissions

- No database, migration, RLS, contract, API, domain, or serialization changes are intended.
- Existing route state and API calls may be lifted into shared page controllers only to permit
  multiple visual compositions.
- No new persisted UI preferences or breakpoint state.
- CSS media queries and responsive utility classes control layout; JavaScript must not fork
  authoritative behavior by viewport.
- No new permission or external service.

## Edge Cases

- No active goals, archived-only goals, mixed active/archive counts, and goal-load failure.
- One goal, two goals, and three or more goals within one currency group.
- Multiple currency groups without cross-currency totals.
- Incomplete item-derived goal and archived goal.
- Fully funded, no pace, ahead, on track, at risk, and behind guidance.
- Long names, large values, two currencies, and month labels that wrap.
- Purchased, affordable, and unaffordable items.
- Empty and populated history.
- Mobile Drawer and desktop Dialog/AlertDialog focus return.
- 390px, 768px, 1024px, 1280px, and widths above 1440px.
- Keyboard navigation, browser back/forward, zoom, and reduced motion.

## Acceptance Matrix

| Requirement | Acceptance criteria | Validation |
| --- | --- | --- |
| R1 | All authenticated routes use one shell; no page imports global mobile navigation | Route/component tests and source audit |
| R2 | Navigation and layout switch at documented tiers and cap at 1280px | Browser checks at 390/768/1024/1280/1440 |
| R3 | Dashboard closely matches approved 1280px hierarchy using real data | Side-by-side desktop capture review |
| R4 | Goal detail has contextual rail and two-region desktop composition | Side-by-side desktop capture review |
| R5 | Mobile/desktop use shared controllers and sections without duplicated rules | Diff and dependency review; existing tests |
| R6 | Secondary flows render intentionally inside the shell | Paired 390px/1280px captures |
| R7 | Generic controls trace to shadcn; Drawer/Dialog behavior follows rules | Provenance audit and overlay tests |
| R8 | Existing functional behavior and full repository suite remain green | Existing unit, API, database, and web tests |
| R9 | Mobile composition, focus, semantics, and touch targets do not regress | Mobile captures and keyboard/accessibility checks |
| R10 | Current captures and comparison notes exist; user explicitly accepts them | Evidence inventory and user sign-off |
| R11 | No intentional or material mobile visual change; any necessary visible exception is pre-approved | 390px side-by-side review and diff audit |

## Assumptions

1. The floating tab bar remains visible through the 768–1023px intermediate tier; the full rail
   begins at 1024px.
2. Secondary flows without dedicated desktop references extend Graphite conservatively through
   content-appropriate width and grouping, not new information architecture.

## Open Questions

None currently block implementation planning.

## Decisions

- M5A is a separate responsive milestone with a blocking visual gate before M5B.
- The approved mobile compositions remain regression constraints.
- Full desktop rail begins at 1024px; the 768–1023px tier retains mobile navigation while allowing
  layout breathing room.
- Goal detail gets contextual rail content through the shared shell, not a new route or screen.
- Drawer remains the mobile contextual overlay; Dialog/AlertDialog is allowed on desktop according
  to the design system; Sheet is not introduced.
- Authentication remains intentionally narrow and is not redesigned in M5A.
- Iteration 2: mobile presentation is frozen for M5A. Material equivalence, rather than brittle
  pixel identity, is the acceptance standard; any necessary visible exception requires advance
  user approval.

## Likely Files and Modules

- `apps/web/src/app.tsx`
- `apps/web/src/components/app-shell.tsx`
- `apps/web/src/features/goals/dashboard.tsx`
- `apps/web/src/features/goals/goal-detail.tsx`
- `apps/web/src/features/goals/financial.tsx`
- `apps/web/src/features/goals/goal-create.tsx`
- `apps/web/src/features/goals/simulator.tsx`
- focused presentation sections under `apps/web/src/features/goals/`
- relevant web tests under `apps/web/src/`
- `packages/ui/src/styles/globals.css` only if an established responsive token is missing
- existing shadcn primitives under `packages/ui/src/components/`
- `docs/design/implementation/m5a/`
- `docs/design/M5A_Surface_Matrix.md`

Expected non-changes:

- `supabase/migrations/*`
- `packages/domain/*`
- `packages/database/*`
- `packages/contracts/*`
- `apps/api/*`

## Definition of Ready

- [x] Product, architecture, design, milestone, and Git strategy sources reviewed.
- [x] Approved mobile and desktop references reviewed.
- [x] Current route, shell, width, overlay, and presentation boundaries inventoried.
- [x] Current 390px and 1280px baseline captures produced and inspected.
- [x] Responsive surface matrix drafted.
- [x] Requirements are evidence-backed with no unresolved product-rule conflict.
- [x] Data/API impact is explicitly none.
- [x] Assumptions are limited and reversible.
- [x] User confirmed these requirements are closed on 2026-08-04.
- [x] Patch-oriented implementation plan is written after confirmation.
