# Feature Requirements: Design Implementation Baseline

## Status

Implementation Planned

## Summary

Create a repository-owned visual implementation baseline from
`GoalTracker Simplified MVP (offline).html` before feature development begins. The baseline will
turn the approved Graphite v2 prototype into milestone-scoped screenshots, executable design
tokens, documented interaction and responsive rules, and a strict shadcn/ui reuse policy.

This preparation becomes D1, after the approved D0 product reset and before M1. Its purpose is to
prevent later implementation agents from redesigning screens, inventing replacement primitives, or
postponing visual consistency until M5.

## Goals

- Preserve the approved prototype as a durable visual reference without committing its bundled
  HTML.
- Give every UI-producing milestone an explicit screenshot set and design-system reference.
- Establish Graphite v2 tokens in the shared UI package before feature screens are implemented.
- Require agents to compose existing shadcn/ui primitives instead of recreating generic controls.
- Document the few Goal Tracker-specific composites that are justified by the product.
- Make M5 an integration and accessibility pass, not a late redesign.

## Non-Goals

- Implement authentication, goals, finance, guidance, simulation, or deployment behavior.
- Change product rules or introduce screens absent from the approved requirements.
- Convert the design artifact into application code automatically.
- Commit the offline HTML bundle or make it a runtime dependency.
- Pre-install every possible shadcn/ui component.
- Create a parallel generic component library.
- Require pixel-identical rendering where accessibility, responsive behavior, or real content
  requires a documented adjustment.

## Users and Entry Points

- Implementation agents working on M1 through M6.
- Reviewers comparing milestone output with the approved visual baseline.
- Contributors adding shared components in `packages/ui`.
- Entry points:
  - `AGENTS.md`;
  - `docs/design/README.md`;
  - milestone sections in `docs/GoalTracker_Implementation_Plan.md`;
  - Graphite tokens in `packages/ui/src/styles/globals.css`.

## Confirmed Facts

- The user explicitly wants screenshots stored in the repository and referenced from each phase.
- The user explicitly wants later agents to reproduce the HTML design closely.
- The user requires use of prebuilt shadcn/ui components and does not want agents inventing generic
  replacements.
- The design artifact is intentionally ignored by Git through `/GoalTracker*.html`.
- The approved artifact uses the Graphite v2 visual language and is dark-first.
- Product delivery is currently D0 followed by M1 through M6.

## Current Code Findings

- `GoalTracker Simplified MVP (offline).html`: approved bundled reference; SHA-256 at discovery time
  is `5e375c60c88d497968a0f1e84e86b2fabf66fb97460b5af5de3bd82b8f7b42fe`.
- `.gitignore`: root Goal Tracker HTML artifacts are ignored and therefore cannot be the durable
  implementation reference by themselves.
- `packages/ui/components.json`: shadcn/ui is configured with the `new-york` style, CSS variables,
  TypeScript, and Lucide.
- `apps/web/components.json`: web aliases shared primitives from `@goal-tracker/ui`.
- `packages/ui/src/styles/globals.css`: current neutral light tokens and Inter stack do not match
  Graphite v2.
- `packages/ui/src/components/button.tsx`: the shared package already follows the Radix Slot plus
  `class-variance-authority` pattern.
- `docs/GoalTracker_Implementation_Plan.md`: M1–M4 already produce UI, while visual integration is
  deferred primarily to M5.
- `docs/GoalTracker_Claude_Design_Prompt.md`: requires Tailwind, shadcn/ui, Lucide, responsive
  behavior, and WCAG 2.2 AA intent.

## Existing Patterns To Reuse

- `packages/ui/components.json`: use the existing shadcn configuration and registry output.
- `packages/ui/src/components/button.tsx`: extend shared primitives using established shadcn/Radix
  composition and CVA variants.
- `packages/ui/src/styles/globals.css`: make this the executable source of truth for semantic design
  tokens.
- `docs/GoalTracker_Implementation_Plan.md`: attach visual references to the milestone that owns each
  screen rather than creating a separate parallel implementation plan.

## Requirements

### R1: Introduce D1 before feature implementation

D1 must be a documentation and shared-style preparation milestone between D0 and M1. M1 may not
start until D1 exit criteria pass.

Evidence:

- User decision: requested a preparation phase before implementing `implementation-plan.md`.
- Code evidence: the canonical sequence currently has no design-baseline milestone.
- Assumption: name the milestone `D1 — Design implementation baseline`.
- Inference: placing it after D0 preserves the approved product reset and prevents redesign during
  M1–M4.

### R2: Commit milestone-scoped visual references

Capture the approved HTML at representative mobile and desktop sizes. Store PNG files under
`docs/design/reference/` in milestone folders and provide an index containing the source checksum,
screen IDs, viewport or element dimensions, owning milestone, and relevant product states.

Evidence:

- User decision: screenshots must be stored in the codebase and referenced by phase.
- Code evidence: the HTML is ignored and PR requirements already ask for screenshots on UI work.
- Assumption: use lossless PNG because the source consists mainly of UI text and flat colors.
- Inference: milestone folders make required references discoverable without loading a complete
  prototype board.

### R3: Map every UI-producing milestone to screenshots

The canonical implementation plan and concise milestone prompts must link to the relevant screenshot
index entries. M1–M4 implement their screens against those references; M5 integrates and verifies
the complete set; M6 references only deployment/account capability surfaces it changes.

Proposed ownership:

| Milestone | Primary visual coverage |
| --- | --- |
| M1 | sign in, signup enabled/disabled, recovery variants, account setup, protected shell |
| M2 | first-goal setup, fixed/item-derived goal forms, dashboard states, items, archives, goal settings |
| M3 | goal financial summary, contribution, withdrawal, purchase/undo, edit/delete, history |
| M4 | guidance states, planning timeline, simulation editor and report |
| M5 | complete mobile journeys, desktop dashboard/detail, responsive and accessibility states |
| M6 | deployment capabilities, registration and recovery configuration, deployment information |

Evidence:

- User decision: every phase must reference its corresponding captures.
- Code evidence: M1–M4 and M6 each own user-visible states before M5.
- Assumption: a screenshot may be referenced by more than one milestone when ownership overlaps.
- Inference: visual ownership in the implementation plan prevents M5 from becoming a redesign.

### R4: Establish executable Graphite v2 tokens

Update `packages/ui/src/styles/globals.css` with the approved dark and light semantic palettes,
typography families, numeric typography, radii, shadows, motion durations/easing, breakpoints, and
layout measurements. Document the mapping from design names to Tailwind/shadcn variables in
`docs/design/GoalTracker_Design_System.md`.

Evidence:

- User decision: document tokens and all design-system information from the HTML.
- Code evidence: current shared CSS is a neutral placeholder that conflicts with the approved
  design.
- Assumption: dark is the initial/default presentation; light values remain defined and documented.
- Inference: executable shared variables are less error-prone than asking every milestone to copy
  values from documentation.

### R5: Use shadcn/ui primitives before custom UI

Generic controls and interaction surfaces must come from the existing shadcn/ui setup. Agents must
check the registry and install the appropriate primitive into `packages/ui` before writing a
replacement.

Required reuse categories include Button, Card, Badge, Alert, AlertDialog, Dialog, Drawer/Sheet,
Form, Input, Label, Select, RadioGroup, Switch, Popover, Separator, ScrollArea, Skeleton, Table, and
Tooltip when the mapped design calls for them.

Evidence:

- User decision: do not invent components; use prebuilt shadcn components.
- Code evidence: both shared UI and web already have compatible shadcn configuration.
- Assumption: primitives are installed only when first required by a milestone.
- Inference: incremental registry use avoids unused dependencies while preserving visual
  consistency.

### R6: Restrict custom components to domain composites

Custom Goal Tracker components are allowed only when they express domain-specific composition not
provided by shadcn/ui. The initial approved list is:

- `FundedProgress`;
- `FinancialMetric`;
- `PlanningTimeline`;
- `GuidanceSummary`;
- `MoneyInput` as a composition around shadcn `Input`;
- `HistoryList`;
- `SimulationPanel`;
- application navigation composition.

Each composite must be built from shared primitives, contain no authoritative business logic, and
be added only in the milestone that first needs it.

Evidence:

- User decision: avoid invented components.
- Code evidence: the prototype explicitly identifies domain-specific composites; shadcn does not
  provide financial progress or planning-timeline semantics.
- Assumption: this allowlist may change only through an explicit documented design decision.
- Inference: interpreting “no invented components” as “do not recreate generic primitives” keeps
  domain UI possible without creating a parallel design system.

### R7: Document visual and interaction rules

The design-system guide must cover:

- palette and semantic status usage;
- typography and tabular money formatting;
- spacing, radii, borders, shadows, and surface hierarchy;
- button hierarchy and one-filled-accent-action rule;
- forms, sheets, drawers, dialogs, confirmations, and error states;
- mobile navigation and desktop rail behavior;
- responsive breakpoints and content widths;
- focus, contrast, reduced motion, touch targets, and screen-reader rules;
- copy vocabulary and prohibited synonyms;
- loading, empty, success, recoverable error, indeterminate financial result, disabled, and
  destructive states;
- when screenshots are authoritative and when accessibility or responsive constraints justify a
  documented deviation.

Evidence:

- User decision: document everything the HTML contains about the design system.
- Code evidence: the artifact includes token, component, copy, responsive, and backend-handoff
  sections.
- Assumption: keep one design-system guide plus a screenshot index instead of duplicating rules per
  milestone.
- Inference: centralized rules reduce contradictory implementation guidance.

### R8: Add visual-conformance acceptance criteria

Every UI-producing milestone must include:

- comparison against its mapped screenshots at the documented viewport;
- screenshots in the PR handoff;
- use of shared tokens and shadcn primitives;
- no unexplained generic custom primitive;
- documented intentional deviations;
- responsive and accessibility validation proportional to the milestone.

Evidence:

- User decision: later phases should not need to reconsider design and should closely match the
  HTML.
- Code evidence: current milestone exits require behavior but do not make screenshot conformance
  phase-specific.
- Assumption: exact automated screenshot-diff tooling is not required in D1.
- Inference: review criteria are necessary; references alone do not prevent drift.

### R9: Preserve provenance without committing the HTML

Record the artifact filename, checksum, capture date, and extraction/capture procedure. The
repository must not depend on the ignored HTML at build or runtime. Regeneration requires a local
artifact with the recorded checksum or an explicitly approved replacement.

Evidence:

- User decision: HTML design files should remain ignored.
- Code evidence: `/GoalTracker*.html` now excludes the source artifact.
- Assumption: screenshots and documented tokens become the durable repository baseline.
- Inference: provenance prevents silent recapture from a different design iteration.

## UX and Interaction Details

- Reference captures use realistic Japan and Home Gym data already present in the artifact.
- Mobile captures preserve the designed 390px application frames without adding browser chrome.
- Desktop captures preserve the 1180px design boards and document their intended 1280px viewport.
- Dark screenshots are the primary visual baseline because all product screens in the approved
  artifact are rendered in dark Graphite.
- Light semantic tokens are still documented so implementation does not invent a separate palette.
- A screenshot is not permission to implement explanatory annotation text surrounding a mockup;
  only content inside the represented product surface is product UI.

## Data, State, API, and Permissions

- No database, API, authentication, or runtime state changes.
- Shared CSS token changes affect presentation only.
- Screenshot and documentation assets contain fictional example data and no user information.
- The ignored HTML remains a local design input, never an application asset.

## Edge Cases

- One composite artifact block may contain several nested state IDs; the index must list all states
  visible in that capture.
- A surface owned by two milestones must identify primary implementation ownership and secondary
  integration ownership.
- Screenshots must not imply excluded behavior that conflicts with the canonical PRD.
- If the artifact and canonical product requirements conflict, product requirements win and the
  deviation is recorded beside the screenshot.
- If text rendering differs because approved fonts are unavailable, D1 is not complete until the
  font source or an explicit fallback decision is documented.
- Screenshot filenames must remain stable after being referenced by milestone documents.

## Acceptance Matrix

| Requirement | Acceptance Criteria | Validation |
| --- | --- | --- |
| R1 | D1 appears between D0 and M1 in canonical sequence, strategy, prompts, and AGENTS guidance. | Link review and `rg` |
| R2 | PNG references exist under milestone folders with a complete index and recorded checksum. | File inventory and image inspection |
| R3 | M1–M6 link directly to their mapped design references. | Markdown link validation |
| R4 | Shared CSS exposes documented Graphite tokens and no longer uses placeholder Inter/neutral values. | CSS inspection, build, visual token page |
| R5 | Guide requires registry-backed shadcn primitives and incremental installation. | Documentation review |
| R6 | Custom composite allowlist is explicit and preserves domain/UI boundaries. | Documentation review |
| R7 | Design-system guide covers visual, interaction, responsive, accessibility, and copy rules. | Checklist review |
| R8 | Each UI milestone has visual-conformance criteria. | Plan review |
| R9 | HTML remains ignored and provenance is sufficient to validate/regenerate captures locally. | `git check-ignore`, checksum record |

## Assumptions

1. Add D1 between D0 and M1 with branch `docs/design-implementation-baseline`.
2. Commit dark PNG references; document the light token set without inventing light screenshots not
   present in the artifact.
3. Make Graphite tokens executable in shared CSS during D1, not merely descriptive documentation.

## Open Questions

None.

## Decisions

- Iteration 1: the baseline will be repository-owned through screenshots, tokens, and documentation;
  the ignored HTML remains provenance input only.
- Iteration 1: shadcn/ui is mandatory for generic primitives; custom code is limited to named domain
  composites.
- Iteration 1: visual references are owned by the milestone that first implements the corresponding
  behavior, with M5 responsible for full integration rather than first-pass styling.
- Iteration 2: the user confirmed D1 placement, dark PNG references with documented light tokens,
  and executable Graphite tokens in shared CSS.

## Implementation Notes

Likely files and directories:

- `docs/design/README.md`;
- `docs/design/GoalTracker_Design_System.md`;
- `docs/design/reference/m1/` through `m6/`;
- `packages/ui/src/styles/globals.css`;
- `AGENTS.md`;
- `docs/GoalTracker_Implementation_Plan.md`;
- `docs/GoalTracker_Milestones_and_Git_Strategy.md`;
- `docs/GoalTracker_Codex_Milestone_Prompts.md`;
- `docs/GoalTracker_Codex_Master_Prompt.md`.

Capture implementation should use Chromium DevTools Protocol to locate artifact screen IDs and save
lossless element screenshots. Temporary extraction scripts and browser profiles must not be
committed.

## Definition of Ready Check

- [x] Scope and non-goals are explicit.
- [x] No material open questions remain.
- [x] Three assumptions are listed and none alter product behavior.
- [x] Important requirements contain evidence.
- [x] Users, entry points, and affected workflows are identified.
- [x] UX states and responsive references are covered.
- [x] Data, API, and permission impact is explicitly none.
- [x] Edge cases and failure modes are listed.
- [x] Acceptance criteria are testable.
- [x] Existing patterns to reuse are identified.
- [x] Likely touched files are listed.
- [x] Validation commands come from repository instructions.
