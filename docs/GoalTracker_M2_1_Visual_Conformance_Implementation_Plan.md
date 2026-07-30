# Implementation Plan: M2.1 Visual Conformance Recovery

## Source Requirements

- `docs/GoalTracker_M2_1_Visual_Conformance_Requirements.md`
- `DESIGN.md`

## Repo Rules Applied

- M2.1 repairs M1/M2 visual conformance before M3 begins.
- Product behavior remains governed by the Product Requirements Master.
- Existing M1/M2 domain, contracts, database, RLS, API, and validated behavior are preserved.
- The approved M1/M2 captures govern composition; Graphite tokens govern executable styling.
- Generic controls must use applicable shadcn/ui primitives.
- Custom UI remains limited to approved Goal Tracker domain composites.
- No M3/M4 behavior, fake future state, or implementation-roadmap copy may appear.
- Existing uncommitted M2 work belongs to the user and must be preserved.
- No commit, push, PR, or merge occurs without explicit user authorization.

## Scope

Rebuild or refine the M1/M2 React presentation until every mapped surface reaches the approved
Graphite quality bar. Introduce reproducible capture evidence, enforce shadcn/ui provenance, and
make visual acceptance a blocking milestone gate.

M2.1 may substantially replace web presentation code. It does not rewrite working non-visual layers.

## Requirement Traceability

| Requirement | Implementation step(s) | Validation |
| --- | --- | --- |
| R1 | 1, 2, 6, 7, 8, 9 | Complete M1/M2 capture matrix |
| R2 | 3, 6, 7, 8 | Semantic tests and selected-state captures |
| R3 | 1, 4, 10 | Existing M1/M2 suites and API-contract review |
| R4 | 2, 5, 7 | Copy/source audit and screenshots |
| R5 | 3, 5, 6, 7, 8 | Side-by-side 390px and desktop review |
| R6 | 4 | File-boundary review, lint, typecheck |
| R7 | 2, 9, 10 | Stored current captures and handoff mapping |
| R8 | 3, 6, 7, 8, 10 | Accessibility tests and manual audit |
| R9 | 1, 10 | Documentation link and exit-gate audit |
| R10 | 3, 5, 6, 7, 8, 10 | shadcn provenance inventory |

## Patch-Oriented Plan

### 1. Register M2.1 and the design gate

- Requirement(s): R1, R7, R9, R10
- Change:
  - add `DESIGN.md` to the repository-wide reading order in `AGENTS.md`;
  - insert M2.1 between M2 and M3 in the canonical implementation and Git strategy documents;
  - add a concise M2.1 execution prompt;
  - strengthen every UI milestone exit criterion so current implementation captures and visual
    comparison are mandatory;
  - state that M5 is a final integrated audit, not deferred foundational styling.
- Do not change:
  - product behavior;
  - M3–M6 functional ownership.
- Validation:
  - Markdown link audit;
  - milestone order search;
  - `git diff --check`.

### 2. Build the visual inventory and reproducible capture workflow

- Requirement(s): R1, R4, R7
- Change:
  - create a checked-in M1/M2 surface matrix mapping reference, route, test data, UI states,
    viewport, future-state exclusions, and expected implementation capture;
  - add the smallest reproducible browser-capture tooling needed to exercise the real local app;
  - provision disposable local test users and representative Japan, Home Gym, incomplete,
    empty/error, active, and archived states without adding production-only debug behavior;
  - capture current implementation images under `docs/design/implementation/m1` and
    `docs/design/implementation/m2`;
  - keep current/reference filenames and mapping explicit.
- Do not change:
  - production APIs solely for screenshot setup;
  - reference PNG files;
  - ignored source HTML.
- Validation:
  - every expected PNG exists, is non-empty, and has the documented dimensions;
  - captures come from the current application rather than mock HTML;
  - capture setup is repeatable after a local database reset.

### 3. Audit and correct the shared UI foundation

- Requirement(s): R2, R5, R8, R10
- Change:
  - inventory every generic control used by M1/M2 and map it to a shadcn/ui primitive;
  - install only missing primitives actually required by mapped surfaces;
  - remove hand-written generic buttons acting as RadioGroup, tabs, decisions, or similar controls;
  - introduce Graphite variants around shadcn primitives for choice cards, navigation, money input,
    compact headers, and overlays;
  - make selected, focused, invalid, disabled, and pending states visually unmistakable;
  - verify shared typography, control sizing, radii, borders, overlay elevation, and content gutters
    against executable tokens;
  - document any true no-primitive exception before use.
- Do not change:
  - Radix/shadcn semantics to force a screenshot match;
  - the approved custom-composite allowlist without a documented decision;
  - authoritative business logic.
- Validation:
  - component provenance inventory;
  - keyboard and accessibility tests;
  - focused screenshots of selected/unselected/error/disabled states;
  - no unapproved generic raw `button`, dialog, select, or input replacement remains.

### 4. Establish focused React presentation boundaries

- Requirement(s): R3, R6
- Change:
  - reduce `apps/web/src/app.tsx` to application/session/routing composition;
  - split authentication and account settings into focused feature/page modules;
  - split goal detail into items, settings, lifecycle, and planning-decision presentation modules;
  - extract only repeated presentational patterns required by more than one accepted surface;
  - retain current API gateway and request contracts.
- Do not change:
  - introduce a speculative generic design framework;
  - replace working routing with an unrelated router unless a concrete M2.1 requirement demands it;
  - move domain calculations into React.
- Validation:
  - route behavior tests;
  - existing M1/M2 functional suites;
  - dependency-boundary review;
  - lint and typecheck.

### 5. Rebuild the application shell and remove misleading UI

- Requirement(s): R4, R5, R10
- Change:
  - match the mobile floating navigation and desktop rail references using shadcn Button and
    approved navigation composition;
  - remove the disabled contribution placeholder until M3 owns the real action;
  - remove fake progress and every “comes next”, “later milestone”, or equivalent roadmap message;
  - ensure authenticated and unauthenticated layouts use the correct content width and background;
  - preserve navigation to Goals and Settings without introducing future destinations.
- Do not change:
  - implement contribution behavior;
  - copy financial values or statuses from future reference states.
- Validation:
  - source/copy audit;
  - shell captures at mobile and desktop widths;
  - keyboard navigation and active-destination semantics.

### 6. Recover all M1 surfaces

- Requirement(s): R1, R2, R5, R7, R8, R10
- Change:
  - compare and refine sign-in, account creation, registration-disabled, password recovery, and
    account settings against every mapped M1 capture;
  - correct composition, field sizing, selected/error states, action hierarchy, and bottom
    alignment;
  - preserve deployment capability behavior, auth behavior, input retention, and session handling;
  - use shadcn primitives for all generic controls and overlays.
- Do not change:
  - authentication, registration, SMTP, or profile business behavior;
  - expose unavailable deployment capabilities.
- Validation:
  - M1 web tests;
  - reference/implementation capture pairs;
  - registration and recovery variants;
  - keyboard and screen-reader semantics.

### 7. Recover onboarding, dashboard, and dashboard states

- Requirement(s): R1, R2, R4, R5, R7, R8, R10
- Change:
  - match onboarding welcome hierarchy and CTA placement;
  - rebuild active/archived filtering with the applicable shadcn primitive and clear selection;
  - match grouped-currency layout, card density, empty, loading, and error references;
  - represent only honest M2 planning facts;
  - omit financial progress/status/actions until their milestones.
- Do not change:
  - invent M3 totals or M4 status;
  - combine currencies;
  - change goal list contracts.
- Validation:
  - empty/loading/error/active/archived tests;
  - populated and empty implementation captures;
  - no fake progress or future copy.

### 8. Rebuild goal creation, items, settings, and lifecycle

- Requirement(s): R1, R2, R5, R7, R8, R10
- Change:
  - rebuild fixed and item-derived creation at the reference mobile width and density;
  - use shadcn RadioGroup for target mode, contribution frequency, and overage choices;
  - use the approved MoneyInput composition around shadcn Input where appropriate;
  - make target-mode and frequency selection immediately visible;
  - match incomplete setup, items, settings, planning decision, archive, restore, item delete, and
    permanent-delete surfaces;
  - use Drawer/Sheet on mobile and Dialog/AlertDialog on desktop as specified;
  - keep error messages adjacent to fields and preserve recoverable input.
- Do not change:
  - M2 planning behavior or contracts;
  - implement purchase state, actual price, funded progress, recommendation, status, or history;
  - copy future financial content embedded in a reference.
- Validation:
  - fixed/item-derived/incomplete/overage/lifecycle web tests;
  - selected-state and overlay accessibility tests;
  - captures for every mapped M2 surface and decision state.

### 9. Run the visual conformance loop

- Requirement(s): R1, R5, R7
- Change:
  - generate the full current M1/M2 capture set;
  - compare each capture side by side with its mapped reference at matching dimensions;
  - record discrepancies by severity: blocking composition/interaction, material styling, minor
    detail;
  - correct blocking and material differences, then recapture;
  - document only product-, responsive-, or accessibility-required deviations.
- Do not change:
  - accept a mismatch merely because the correct token names are present;
  - approve placeholder capture files;
  - defer blocking/material differences to M5.
- Validation:
  - completed surface matrix;
  - final capture inventory;
  - no unexplained blocking or material discrepancy.

### 10. Validate and prepare the user sign-off handoff

- Requirement(s): R3, R7, R8, R9, R10
- Change:
  - fix failures found by validation without expanding product scope;
  - provide a reference/implementation table with clickable captures;
  - list intentional deviations and shadcn provenance;
  - request explicit user visual approval before declaring M2.1 complete.
- Do not change:
  - begin M3;
  - claim visual completion without user sign-off.
- Validation:
  - `pnpm install`;
  - `pnpm infra:start`;
  - `pnpm supabase db reset --local`;
  - `pnpm lint`;
  - `pnpm typecheck`;
  - `pnpm test`;
  - `pnpm build`;
  - `pnpm format:check`;
  - milestone-specific browser capture and accessibility commands;
  - `git diff --check`;
  - final diff review against `development`.

## Files and Modules

Expected documentation:

- `AGENTS.md`
- `DESIGN.md`
- `docs/GoalTracker_M2_1_Visual_Conformance_Requirements.md`
- `docs/GoalTracker_M2_1_Visual_Conformance_Implementation_Plan.md`
- `docs/GoalTracker_Implementation_Plan.md`
- `docs/GoalTracker_Milestones_and_Git_Strategy.md`
- `docs/GoalTracker_Codex_Milestone_Prompts.md`
- `docs/GoalTracker_Codex_Master_Prompt.md`
- `docs/design/README.md`
- `docs/design/implementation/m1/*`
- `docs/design/implementation/m2/*`

Expected shared UI:

- `packages/ui/src/styles/globals.css`
- applicable `packages/ui/src/components/*` shadcn primitives
- approved presentation-only Goal Tracker composites needed by M1/M2

Expected web presentation:

- `apps/web/src/app.tsx`
- `apps/web/src/components/auth-shell.tsx`
- `apps/web/src/components/app-shell.tsx`
- focused M1 feature/page modules under `apps/web/src/features/`
- focused M2 feature/page modules under `apps/web/src/features/goals/`
- web API/auth gateways only where presentation integration requires compatible imports
- M1/M2 web tests and browser-capture tests

Expected non-changes:

- `supabase/migrations/*`
- `packages/domain/*`
- `packages/database/*`
- `apps/api/*`
- goal/auth contracts, except a proven presentation serialization defect

## Testing and Validation

### Automated

- Existing M1/M2 unit, API, integration, and web suites remain green.
- Choice controls expose checked/selected semantics and keyboard operation.
- Forms retain input after recoverable errors and expose adjacent field errors.
- Empty, loading, error, disabled, pending, success, archive, restore, and destructive states render.
- Browser capture setup reproduces representative local states after database reset.

### Visual

- Review every M1/M2 mapped surface at 390px.
- Review milestone-owned desktop compositions at their documented width.
- Compare content width, spacing, typography, surfaces, selected state, action hierarchy, overlays,
  and responsive behavior.
- Store current implementation captures, not only a filename manifest.
- Obtain explicit user approval of the final comparison set.

### Component provenance

- Map every generic control to its shadcn/ui source.
- Search for raw generic interactive replacements in product presentation.
- Document and approve any true no-primitive exception.

## Plan Critique

- Requirements without implementation steps: none.
- Implementation steps without requirements: capture tooling and file-boundary work are direct
  prerequisites for R1, R6, and R7.
- Risks not covered: exact browser font rendering may differ slightly by host; material hierarchy,
  spacing, and state must still match.
- Scope-creep risk: rewriting backend layers, adopting a new application framework, or implementing
  future financial content to fill reference layouts.
- Test gaps: automated visual comparison cannot replace user judgment; explicit sign-off remains
  required.

## Risks and Mitigations

- **Large uncommitted M2 diff:** preserve all changes, inspect before editing, and establish reviewable
  corrective boundaries without destructive Git commands.
- **UI rewrite breaks behavior:** keep API gateways/contracts stable and run existing suites after
  each surface group.
- **Screenshot mimicry adds fake data:** maintain the future-state exclusion column in the surface
  matrix.
- **Hand-written controls return:** make shadcn provenance part of the blocking handoff checklist.
- **Visual review happens only at the end:** capture after foundation, M1, dashboard, and goal-flow
  groups rather than waiting for one final pass.
- **M5 becomes another redesign:** block M2.1 completion on material discrepancy and user sign-off.

## Rollback

M2.1 changes no intended persistence or API behavior. If a visual batch regresses behavior, revert
that presentational batch while retaining the prior functional M2 implementation. Keep capture and
documentation changes that accurately describe the remaining state. Never roll back user work with
destructive Git commands.

## Exit Criteria

M2.1 is complete only when:

- every M1/M2 mapped surface has a current implementation capture;
- implementation/reference comparisons have no unexplained blocking or material differences;
- choice states are obvious and accessible;
- applicable generic controls use shadcn/ui;
- fake progress, future-feature controls, and roadmap copy are absent;
- existing M1/M2 functional validation passes;
- responsive and accessibility audits pass;
- the user explicitly approves the final visual comparison set;
- M3 has not begun.
