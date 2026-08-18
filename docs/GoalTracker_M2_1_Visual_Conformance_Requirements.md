# Feature Requirements: M2.1 Visual Conformance Recovery

## Status

Implemented — visually accepted

## Summary

M2 delivered working goal and item-planning behavior but failed the approved Graphite visual
conformance bar. M2.1 will recover product-quality M1/M2 presentation before M3 builds financial
flows on top of the same shell, forms, cards, and overlays.

The correction preserves verified product behavior, domain rules, API contracts, persistence, RLS,
and migrations. It may replace or substantially restructure presentational web code when that is
the smallest reliable route to the approved result.

## Implementation outcome

- M1/M2 application surfaces were rebuilt and recaptured from the current React application.
- Choice cards now use the shared shadcn/Radix RadioGroup with obvious checked indicators.
- Password visibility uses an accessible eye icon and account creation uses a four-segment strength
  indicator.
- Fake progress, future contribution controls, and implementation-roadmap copy were removed.
- Item editing uses a shadcn Sheet; lifecycle and planning confirmations use AlertDialog.
- Current/reference evidence is mapped in `docs/design/M2_1_Surface_Matrix.md`.
- Automated repository, web, API, local migration, RLS, database lint, and security-advisor checks
  pass.
- The user accepted the recovered M1/M2 visual direction; creation now returns to the dashboard
  instead of opening goal settings.

## Goals

- Make every M1 and M2 surface closely conform to its mapped reference at the documented viewport.
- Establish an evidence-based capture, comparison, correction, and sign-off loop.
- Make selected and interactive states immediately legible.
- Remove fake, future-facing, developer-facing, or visually misleading UI.
- Establish reusable, high-quality shell, form, choice, money-input, card, and overlay patterns
  before M3.
- Leave M5 responsible for final integration details rather than foundational redesign.

## Non-Goals

- Change M1 authentication or M2 goal/item business behavior.
- Rewrite domain, database, RLS, API, or contracts solely for visual preference.
- Implement M3 financial transactions, progress, purchase state, or history.
- Implement M4 guidance, status, projection, or simulation.
- Copy prototype annotations or fake future data to match a screenshot.
- Demand brittle pixel identity where real content, responsiveness, or accessibility requires a
  documented deviation.

## Users and Entry Points

- Authenticated users using onboarding, dashboard, goal creation, goal items, goal settings, and
  lifecycle flows.
- Unauthenticated users using sign-in, registration, and recovery.
- Contributors and implementation agents delivering later milestones.
- Entry points:
  - M1 routes under authentication and settings;
  - `/goals`;
  - `/goals/new`;
  - `/goals/:goalId`;
  - `/goals/:goalId/items`;
  - root `DESIGN.md`.

## Confirmed Facts

- The user explicitly rejects the current M2 visual result.
- The user requires a corrective M2.1 before continuing.
- The user wants every phase to leave a clean, high-quality product.
- The user wants M5 limited primarily to final details.
- The attached fixed-goal comparison shows materially different width, proportions, spacing,
  typography, and state emphasis.
- The target-mode and contribution-frequency selections are not sufficiently distinguishable in the
  current implementation.
- Rebuilding the UI is acceptable if necessary, but data and business behavior have not been
  rejected.

## Current Code Findings

- `apps/web/src/features/goals/goal-create.tsx`: target mode, contribution frequency, and overage
  choices use hand-written `button` controls even though the shared package includes RadioGroup.
- `apps/web/src/features/goals/dashboard.tsx`: renders a fixed 28% visual progress segment unrelated
  to an authoritative financial value.
- `apps/web/src/features/goals/dashboard.tsx`: exposes “Money tracking comes next” and “arrives
  later” roadmap copy to users.
- `apps/web/src/components/app-shell.tsx`: renders a disabled future contribution action.
- `apps/web/src/features/goals/goal-detail.tsx`: combines nearly one thousand lines of item,
  settings, lifecycle, and decision presentation, making controlled visual iteration difficult.
- `apps/web/src/app.tsx`: combines nearly one thousand lines of routing, authentication, settings,
  and product composition.
- `docs/design/implementation/m2/README.md`: lists expected captures, but no M2 implementation PNGs
  were produced.
- `docs/design/GoalTracker_Design_System.md`: already requires progressive disclosure, shadcn
  primitives, screenshot comparison, and documented deviations.

## Existing Patterns To Reuse

- `packages/ui/src/styles/globals.css`: existing Graphite semantic tokens and typography.
- `packages/ui/src/components/*`: shadcn-generated primitives.
- `apps/web/src/components/auth-shell.tsx`: a relatively close M1 composition that can be refined
  rather than automatically discarded.
- `docs/design/reference/m1` and `docs/design/reference/m2`: authoritative visual mappings.
- `docs/design/GoalTracker_Design_System.md`: established component, responsive, and accessibility
  rules.

## Requirements

### R1: Rebuild against references rather than approximate from memory

Every mapped M1 and M2 surface must be opened, inventoried, implemented, captured, and compared at
its documented viewport. Material differences must be corrected or explicitly justified.

Evidence:

- User decision: each phase must leave a clean, reference-quality product.
- Code evidence: M2 produced no implementation captures.
- Assumption: none.
- Inference: checking only the fixed-goal form would leave the same failure mode elsewhere.

### R2: Make choice state unambiguous

Target mode, contribution frequency, overage decisions, tabs, filters, and similar choices must use
accessible shadcn primitives and expose a visually obvious selected state through checked semantics,
border/indicator, typography, and sufficient surface contrast.

Evidence:

- User decision: current radio options do not visibly communicate selection.
- Code evidence: current choices are hand-written buttons with a subtle border-only difference.
- Assumption: none.
- Inference: both visual and semantic selection need correction.

### R3: Preserve working non-visual behavior

M2.1 must preserve verified M1/M2 contracts, domain rules, migrations, RLS, repositories, API
behavior, form validation, ownership, and lifecycle behavior. Presentational code and web tests may
be replaced or reorganized.

Evidence:

- User decision: M1/M2 function, but UI quality is rejected.
- Code evidence: the visual problems are concentrated in web composition.
- Assumption: none.
- Inference: rewriting validated backend layers adds risk without addressing the reported failure.

### R4: Remove misleading and implementation-facing UI

The product must not show fake progress, disabled future-feature actions, prototype annotations,
milestone language, or explanations that exist only because a later phase is not implemented.

Evidence:

- User decision: wants a clean, high-quality product in each phase.
- Code evidence: current dashboard and shell contain fixed progress and future-milestone copy.
- Assumption: none.
- Inference: honest omission is simpler and clearer than advertising unavailable functionality.

### R5: Match the Graphite composition and density

M1/M2 screens must closely match their references in content width, gutters, grouping, vertical
rhythm, typography, control height, radii, surfaces, header alignment, and action hierarchy.

Evidence:

- User decision: attached comparison is unacceptable despite using similar colors.
- Code evidence: current fixed-goal form is materially wider and less dense than its 390px
  reference composition.
- Assumption: none.
- Inference: token reuse alone does not produce design fidelity.

### R6: Establish maintainable visual boundaries before M3

Large web files must be split only where doing so creates clear page, flow, or reusable
presentational boundaries needed for M2.1 and M3. No new generic component framework may be created.

Evidence:

- User decision: later phases must preserve quality rather than repeat this failure.
- Code evidence: `app.tsx` and `goal-detail.tsx` are each close to one thousand lines.
- Assumption: none.
- Inference: focused visual review and future financial composition require smaller feature
  boundaries.

### R7: Require real visual evidence

M2.1 must store current implementation captures for all accepted M1/M2 surfaces and states, at
minimum at 390px and at each milestone-owned desktop width. The handoff must map every capture to
its reference and document deviations.

Evidence:

- User decision: implementation must be compared and verified against existing captures.
- Code evidence: the current screenshot directory contains only a placeholder README.
- Assumption: none.
- Inference: automated tests cannot establish composition quality by themselves.

### R8: Keep accessibility and real behavior authoritative

Visual matching must preserve keyboard use, focus visibility, semantic labels, checked state,
screen-reader meaning, reduced motion, contrast, touch targets, error association, and real
responsive content.

Evidence:

- User decision: wants a quality product, not a static replica.
- Code evidence: the design baseline permits documented accessibility deviations.
- Assumption: none.
- Inference: visual recovery cannot regress functional usability.

### R9: Make visual quality a milestone gate

Root `DESIGN.md` must define the mandatory visual workflow and be referenced by contributor and
milestone execution guidance. Future UI milestones cannot close without current comparison captures.

Evidence:

- User decision: explicitly requested `design.md` so every phase leaves product-quality UI.
- Code evidence: existing design guidance was not enforced during M2.
- Assumption: the canonical filename is root `DESIGN.md`.
- Inference: a discoverable gate plus evidence requirements is needed, not another optional guide.

### R10: Require shadcn/ui whenever an applicable primitive exists

Every generic UI control must use the configured shadcn/ui registry whenever it provides an
applicable primitive. Agents must check installed shared primitives and the registry before
implementing a control. A custom generic control is allowed only when no applicable shadcn primitive
exists and the exception is documented and approved.

Styling differences from the reference must be achieved through Graphite tokens, variants, and
composition around the shadcn primitive, not by replacing its behavior with a hand-written control.

Evidence:

- User decision: explicitly made shadcn/ui usage mandatory whenever possible.
- Code evidence: current M2 hand-rolls target, frequency, and overage choices despite having
  RadioGroup available.
- Assumption: none.
- Inference: registry-first enforcement is necessary because the previous advisory wording did not
  prevent replacement controls.

## UX and Interaction Details

- Reference viewport dimensions must be matched before judging proportions.
- Selection cannot rely on a one-pixel low-contrast border alone.
- Product copy describes current capabilities, not development sequencing.
- Future financial sections are omitted until their milestone rather than represented by fake
  placeholders.
- M2.1 may rebuild page composition from the references while reusing API hooks and behavior.
- Mobile is reviewed first; desktop is then reviewed without stretching mobile controls.

## Data, State, API, and Permissions

- No intended database, migration, RLS, API, contract, or domain behavior changes.
- Existing M2 migration and backend changes remain subject to their own functional review.
- Web state management may be reorganized without changing observable requests or authorization.
- No new permissions or external services.

## Edge Cases

- Empty and populated dashboards.
- Fixed and item-derived goal creation.
- Incomplete item-derived setup.
- Selected, unselected, focused, disabled, pending, invalid, and server-error form states.
- Fixed-target overage decisions.
- Active and archived lists.
- Archive, restore, item deletion, and permanent goal deletion overlays.
- Long goal/item names, large money values, and locale month labels.
- 390px mobile, intermediate widths, and milestone-owned desktop widths.
- Reduced motion and keyboard-only operation.

## Acceptance Matrix

| Requirement | Acceptance criteria | Validation |
| --- | --- | --- |
| R1 | Every mapped M1/M2 surface has an implementation/reference comparison | Capture inventory and manual review |
| R2 | Every choice exposes semantic and obvious visual selection | RTL accessibility tests plus screenshot review |
| R3 | Existing functional M1/M2 suites continue to pass | Unit, API, integration, and web tests |
| R4 | No fake progress, future controls, or roadmap copy remains | `rg` audit and visual review |
| R5 | Material composition differences are corrected or justified | 390px and desktop side-by-side review |
| R6 | Web presentation has focused feature/page boundaries | Diff review, lint, typecheck |
| R7 | Current captures exist and map to references | File inventory and handoff table |
| R8 | Keyboard, focus, semantics, contrast, and responsive behavior pass | Automated tests and manual audit |
| R9 | Future milestone guidance references the root design gate | Documentation link audit |
| R10 | Every generic control traces to shadcn or an approved no-primitive exception | Component provenance audit |

## Assumptions

- None.

## Open Questions

- None.

## Decisions

- Iteration 1: M2 is functionally useful but visually rejected; M3 must not begin.
- Iteration 1: add root `DESIGN.md` and make quality evidence mandatory in every UI milestone.
- Iteration 1: prefer preserving non-visual behavior over a full-stack rewrite.
- Iteration 2: M2.1 covers every mapped M1 and M2 surface, including authentication and settings.
- Iteration 2: React presentation may be substantially rebuilt while non-visual behavior and layers
  remain intact.
- Iteration 2: M2.1 requires explicit user approval of the final implementation/reference captures.
- Iteration 2: shadcn/ui is mandatory whenever an applicable primitive exists; exceptions require
  documented proof and approval.

## Implementation Notes

- Begin with capture infrastructure and a complete surface/state inventory.
- Correct shared primitives and layout foundations before individual pages.
- Use RadioGroup and other installed shadcn primitives instead of manual generic controls.
- Treat the attached fixed-goal comparison as evidence, not as the only affected surface.
- Review current uncommitted M2 changes before creating any corrective commit boundary.

## Definition of Ready Check

- Scope and non-goals: defined and confirmed.
- Open assumptions: none.
- User entry points: identified.
- UX states: identified.
- Data/API/permissions impact: explicitly constrained.
- Edge cases: listed.
- Acceptance criteria: testable.
- Existing patterns: identified.
- Files/modules: finalized in the implementation plan.
- Validation: repository commands plus capture/conformance review.
