# Implementation Plan: M5A Responsive Architecture and Desktop Composition

## Status

Implemented — visually accepted on 2026-08-04

## Source Requirements

- `docs/GoalTracker_M5A_Responsive_Requirements.md`
- `docs/design/M5A_Surface_Matrix.md`
- canonical M5A scope in `docs/GoalTracker_Implementation_Plan.md`
- visual delivery gate in `DESIGN.md`

## Repo Rules Applied

- Work only on M5A from `feat/product-ux-responsive`.
- Product behavior comes from `docs/GoalTracker_Product_Requirements_Master.md`; M5A must not
  reinterpret it.
- Architecture and dependency direction remain unchanged. React consumes render-ready contracts
  and does not acquire authoritative financial, target, projection, or simulation logic.
- All authenticated routes use one responsive shell; routes and business behavior are not
  duplicated by viewport.
- Below 768px, accepted mobile presentation is frozen. Any material mobile difference is blocking
  unless the user approved a required exception before implementation.
- The full 236px rail begins at 1024px. The 768–1023px tier retains the floating navigation and may
  use available width without adopting the desktop rail.
- Generic controls use installed shadcn/ui primitives. Mobile contextual forms remain Drawer-based;
  desktop equivalents use Dialog/AlertDialog where appropriate. Do not introduce Sheet.
- The desktop dashboard and goal detail references are implementation constraints.
- Preserve `consolelogs.txt` and all unrelated user work.
- Do not commit, push, create a PR, or begin M5B without explicit authorization.

## Scope

Refactor the authenticated React composition so dashboard, goal detail, creation, item management,
history, simulator, archives, and settings share one responsive shell. Implement the approved
desktop dashboard and goal-detail hierarchies, give secondary routes deliberate desktop layouts,
preserve the mobile presentation, add responsive tests, and produce the required visual evidence.

No migration, backend, contract, domain, security, or product-rule change is planned.

## Requirement Traceability

| Requirement | Implementation steps | Validation |
| --- | --- | --- |
| R1 | 1, 2, 5 | Shell/route tests and source audit |
| R2 | 1, 2, 7 | Browser checks at 390/768/1024/1280/1440 |
| R3 | 3, 8 | Desktop dashboard capture comparison |
| R4 | 4, 8 | Desktop goal-detail capture comparison |
| R5 | 4, 5 | Component-boundary review and existing behavior tests |
| R6 | 2, 5, 8 | Paired secondary-flow captures |
| R7 | 6, 7 | Primitive provenance and responsive overlay tests |
| R8 | 1–7, 9 | Existing full repository suite |
| R9 | 1–8 | Mobile captures, focus order, semantics, touch targets |
| R10 | 8, 9 | Capture inventory, comparison notes, user visual gate |
| R11 | Every step, especially 1, 3, 4, 5, 8 | 390px before/after review and source diff audit |

## Patch-Oriented Plan

### 1. Evolve the shared authenticated shell

- Requirement(s): R1, R2, R7, R9, R11
- Change:
  - update `apps/web/src/components/app-shell.tsx` to support product-level and contextual goal rail
    configurations through typed presentation props;
  - retain one `MobileNavigation` implementation and keep its rendered mobile geometry unchanged;
  - move the full rail breakpoint from 768px to 1024px;
  - use the Graphite `--layout-rail` and `--layout-content-max` values;
  - support brand, primary contribution action, Goals/Settings active states, optional active/archive
    counts, All goals, and contextual goal destinations without putting data fetching in the shell;
  - expose semantic current-page state and accessible labels.
- Do not change:
  - mobile tab-bar placement, sizing, labels, or add-action behavior;
  - navigation destinations or authorization;
  - create a second shell or generic navigation framework.
- Validation:
  - component tests for product/contextual variants and active semantics;
  - tests at the breakpoint classes or mocked viewport behavior;
  - source audit proving feature pages no longer import global mobile navigation directly.

### 2. Compose every authenticated route through the shell

- Requirement(s): R1, R2, R6, R8, R11
- Change:
  - update `AuthenticatedApp` in `apps/web/src/app.tsx` so goal creation, detail/items/edit, history,
    simulator, dashboard/archives, and settings all receive the shared shell;
  - pass product rail data/actions from `GoalsHome` and contextual rail navigation from goal routes;
  - keep route parsing, `navigate`, browser back/forward behavior, session expiry, and API ownership
    unchanged;
  - ensure loading and error states render inside the same authenticated composition;
  - avoid fetching the same goal or history solely to populate duplicated desktop chrome.
- Do not change:
  - public auth pages or `AuthShell`;
  - route URLs, API contracts, or session rules;
  - introduce React Router or another routing migration.
- Validation:
  - extend route tests for all authenticated destinations;
  - browser back/forward and active-rail checks;
  - mobile capture comparison after shell integration before continuing.

### 3. Implement the desktop dashboard composition

- Requirement(s): R3, R8, R9, R11
- Change:
  - update `apps/web/src/features/goals/dashboard.tsx` to preserve the current mobile cards while
    adding the approved desktop heading, compact context, currency-group summaries, featured-card
    hierarchy, and compact additional-goal rows;
  - add status text, guidance/recommendation, deadline facts, and exact financial values only from
    existing render-ready goal data;
  - keep each goal card or row directly clickable and retain clear keyboard focus;
  - expose Add contribution and active/archive counts through the shell instead of duplicating them
    in page chrome;
  - keep empty, loading, error, incomplete, and archived states structurally stable at desktop;
  - extend deterministic design fixtures only if required to capture existing status and
    multi-currency states; fixtures remain development/test-only.
- Do not change:
  - sum currencies, invent guidance, or calculate projections in React;
  - add a separate View goal button when the whole surface is already the link;
  - alter mobile card hierarchy, copy, spacing, or actions.
- Validation:
  - dashboard tests for featured/compact ordering, direct click, currency separation, status text,
    and empty/loading/error/archive states;
  - 390px comparison against the accepted baseline;
  - 1280px side-by-side comparison against `desktop-dashboard.png`.

### 4. Establish reusable goal-detail presentation sections

- Requirement(s): R4, R5, R8, R9, R11
- Change:
  - refactor `GoalDetailPage` and `FinancialOverview` into focused presentation sections for header,
    guidance/actions, financial progress/metrics, planning timeline, item summary/actions, and
    recent history;
  - keep data loading, contribution/purchase/undo state, reconciliation, and mutation callbacks
    single-sourced in the existing page/controller path;
  - compose the same sections vertically below 1024px and as the approved desktop summary and
    companion regions at 1024px and above;
  - supply contextual rail state for Overview, Items, History, Simulator, and Edit goal;
  - use CSS layout and logical DOM order so keyboard and screen-reader order remain coherent;
  - apply sticky positioning only where it matches the reference and does not obscure content.
- Do not change:
  - duplicate a desktop detail route or fetch path;
  - move monetary or projection formulas into React;
  - change mobile content order, inline navigation, buttons, copy, or Drawer behavior.
- Validation:
  - existing finance, guidance, planning timeline, item, and route tests remain green;
  - new tests for contextual active navigation and section availability;
  - 390px before/after comparison before desktop styling is accepted;
  - 1280px side-by-side comparison against `desktop-goal-detail.png`.

### 5. Give secondary authenticated flows deliberate desktop layouts

- Requirement(s): R1, R5, R6, R8, R9, R11
- Change:
  - keep create/edit forms focused and readable inside the shared product/contextual shell;
  - make item management use the contextual rail and wider item rows or field groups where useful;
  - make full history use the contextual rail and a comparison-friendly desktop row/table layout
    while preserving the existing mobile list;
  - allow the simulator to use a wider desktop composition, including side-by-side editor/report
    regions when real content benefits, while preserving its mobile vertical order;
  - retain settings as a focused approximately 620px panel inside the product shell;
  - retain archives as the dashboard's filtered state.
- Do not change:
  - add desktop-only actions, facts, panels, or routes;
  - widen focused forms merely to fill space;
  - alter simulation semantics or persist simulation state;
  - make any intentional mobile visual change.
- Validation:
  - route and feature tests for create, items, history, simulator, archives, and settings;
  - representative paired 390px/1280px captures;
  - long-name and large-value browser inspection.

### 6. Adapt contextual overlays by viewport with shared form content

- Requirement(s): R7, R8, R9, R11
- Change:
  - keep shadcn Drawer for contribution, withdrawal, purchase, item edit, and transaction edit below
    1024px;
  - where desktop bottom placement remains visibly mobile-only, render the same extracted form body
    and actions inside the installed shadcn Dialog at 1024px and above;
  - keep AlertDialog for destructive and irreversible decisions;
  - share all pending, error, preserved-input, focus-return, reconciliation, and submit handlers
    across the responsive primitives;
  - use a small presentation-only viewport hook only for choosing the overlay primitive; it must
    not branch product logic or financial submission behavior.
- Do not change:
  - introduce Sheet;
  - duplicate form state or financial requests;
  - automatically retry financial mutations;
  - create a custom generic overlay primitive.
- Validation:
  - overlay tests at mobile and desktop media states;
  - keyboard Escape/focus-return checks;
  - financial single-submission and reconciliation tests;
  - mobile Drawer capture remains materially unchanged.

### 7. Add responsive and regression coverage

- Requirement(s): R1, R2, R5, R7, R8, R9, R11
- Change:
  - extend web tests for shell variants, active navigation, route composition, responsive
    presentation classes, and overlay selection;
  - add or centralize a minimal `matchMedia` test helper if needed;
  - verify that viewport selection changes presentation only, not API requests, data ownership, or
    mutation count;
  - audit raw generic controls and confirm every applicable control remains shadcn-based;
  - verify no `max-w-[390px]` page-level constraint remains on authenticated desktop surfaces,
    while accepted mobile and overlay constraints remain intentional.
- Do not change:
  - introduce screenshot-test brittleness as the only acceptance mechanism;
  - add a broad UI framework or unused testing dependency.
- Validation:
  - targeted web tests after each slice;
  - `rg` audits for direct `MobileNavigation`, page-level 390px caps, Sheet usage, raw controls, and
    duplicated responsive business branches;
  - lint and typecheck.

### 8. Run the required visual conformance loop

- Requirement(s): R2, R3, R4, R6, R9, R10, R11
- Change:
  - run the real application with deterministic fixtures;
  - capture dashboard, goal detail, create goal, items, history, simulator, archives, settings, and
    representative overlays at 390px and 1280px under
    `docs/design/implementation/m5a/after/`;
  - capture boundary checks at 768px, 1024px, and above 1440px when needed for evidence;
  - compare every 390px image with the corresponding accepted M1–M4 reference/baseline and treat
    any material change as blocking;
  - compare desktop dashboard and goal detail directly with their approved M5 references;
  - correct blocking and material desktop differences, recapture, and document only justified
    product, responsive, or accessibility deviations;
  - update `docs/design/implementation/m5a/README.md` and the surface matrix with final evidence,
    viewport, fixture, primitive provenance, and comparison notes.
- Do not change:
  - replace the immutable approved references;
  - approve the milestone from code inspection alone;
  - defer known material responsive differences to M5B.
- Validation:
  - every expected PNG exists, is non-empty, and has the documented dimensions;
  - manual side-by-side review of all captures;
  - explicit user visual acceptance before milestone closure.

### 9. Validate the complete milestone and prepare handoff

- Requirement(s): R8, R9, R10, R11
- Change:
  - fix only M5A-scoped failures discovered during validation;
  - summarize changed files, tests, visual evidence, primitive provenance, deviations, and risks;
  - stop at the M5A visual gate without beginning M5B.
- Do not change:
  - commit, push, create a PR, or merge unless explicitly requested;
  - declare M5A complete before user visual acceptance.
- Validation:
  - `pnpm install`;
  - `pnpm lint`;
  - `pnpm typecheck`;
  - `pnpm test`;
  - `pnpm build`;
  - `git diff --check`;
  - milestone-specific browser checks and capture inventory;
  - final diff review against `development` and unrelated-file audit.

## Files and Modules

Expected web changes:

- `apps/web/src/app.tsx`
- `apps/web/src/components/app-shell.tsx`
- `apps/web/src/features/goals/dashboard.tsx`
- `apps/web/src/features/goals/goal-detail.tsx`
- `apps/web/src/features/goals/financial.tsx`
- `apps/web/src/features/goals/goal-create.tsx`
- `apps/web/src/features/goals/simulator.tsx`
- focused presentation-only goal sections or hooks under `apps/web/src/features/goals/` and
  `apps/web/src/components/`
- relevant web tests and test setup
- `apps/web/src/design-preview.ts` only for deterministic visual fixture coverage

Expected shared UI changes:

- existing `packages/ui/src/components/*` only where a Graphite variant or responsive composition
  needs adjustment;
- `packages/ui/src/styles/globals.css` only for a missing semantic responsive token, never local
  screen hex values.

Expected documentation/evidence changes:

- `docs/GoalTracker_M5A_Responsive_Requirements.md`
- `docs/GoalTracker_M5A_Responsive_Implementation_Plan.md`
- `docs/design/M5A_Surface_Matrix.md`
- `docs/design/README.md`
- `docs/design/implementation/m5a/README.md`
- `docs/design/implementation/m5a/after/*.png`

Expected non-changes:

- `supabase/migrations/*`
- `packages/domain/*`
- `packages/database/*`
- `packages/contracts/*`
- `apps/api/*`
- public authentication presentation

## Testing and Validation

### Automated

- Existing M1–M4 domain, database, API, and web suites remain green.
- App shell renders product/contextual variants and correct active semantics.
- Every authenticated route participates in the shell without changing URL behavior.
- Dashboard preserves currency isolation and direct card/row activation.
- Goal detail sections share one source of data and mutation state.
- Overlay selection preserves one request and one form state.
- Mobile navigation and Drawer behavior remain unchanged.

### Responsive browser checks

- 390px: frozen accepted presentation.
- 768px: intermediate tier retains floating navigation and logical order.
- 1024px: full rail and desktop composition activate.
- 1280px: direct approved-reference comparison.
- 1440px or wider: 1280px content maximum remains visible.

### Visual evidence

- Paired mobile/desktop captures for every surface listed in the surface matrix.
- Direct side-by-side dashboard and goal-detail reference comparison.
- Documented shadcn primitive provenance for navigation, overlays, controls, cards, and tables.
- Explicit user acceptance was received on 2026-08-04; the visual gate is closed.

## Plan Critique

- Requirements without implementation steps: none.
- Implementation steps without requirements: none; fixture and capture work directly support R3,
  R4, R9, R10, and R11.
- Primary risk: refactoring the monolithic goal detail can accidentally change mobile structure or
  financial form state. The mitigation is to extract behavior-neutral sections and recapture 390px
  after each structural slice.
- Secondary risk: rendering Drawer and Dialog variants can duplicate form state or submissions. The
  mitigation is shared extracted content and one controller/handler set.
- Scope-creep risk: inventing desktop content for whitespace. The mitigation is the closed surface
  matrix and real render-ready data only.
- Test gap: jsdom cannot validate visual hierarchy. Real browser captures and explicit user review
  remain mandatory.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Mobile visual regression | Freeze rule, slice-by-slice 390px capture, no intentional mobile CSS/copy changes |
| Duplicate responsive behavior | One route/controller and CSS composition; viewport logic limited to overlay primitive choice |
| Financial double submission | Reuse one handler/state path and retain pending/reconciliation tests |
| Desktop imitation without real behavior | Render only existing contract data and actions |
| Inaccessible visual reordering | Preserve logical DOM order and test keyboard navigation |
| Unbounded refactor | Extract only sections required by the approved desktop composition |

## Rollback

M5A has no schema or data migration. If a slice fails its mobile or functional gate, revert that
presentation slice without affecting stored data or backend behavior. Keep the baseline captures
and requirements documentation so the failure remains reproducible. Do not roll back unrelated
M1–M4 fixes or user files.
