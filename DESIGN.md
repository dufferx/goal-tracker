# Goal Tracker Design Delivery Guide

This file defines the visual-quality gate for every milestone that changes user-facing UI.
It complements `AGENTS.md`, the canonical product and architecture documents, and the detailed
Graphite rules in `docs/design/GoalTracker_Design_System.md`.

## Authority

Apply visual sources in this order:

1. `docs/GoalTracker_Product_Requirements_Master.md` for product behavior and user-visible facts.
2. The active milestone in `docs/GoalTracker_Implementation_Plan.md` for owned surfaces and states.
3. `docs/design/README.md` for the approved reference mapping.
4. Every mapped reference image for composition, hierarchy, density, and interaction presentation.
5. `docs/design/GoalTracker_Design_System.md` for Graphite tokens and shared interaction rules.
6. `packages/ui/src/styles/globals.css` for executable token values.

The screenshots are implementation constraints. They do not authorize prototype annotations,
future-milestone behavior, fake values, or inaccessible interaction patterns.

## Definition of visually complete

A UI-producing milestone is not complete merely because its flows function. It is visually complete
only when all of the following are true:

- every mapped surface and required state exists;
- the implementation has been captured at the reference viewport;
- implementation and reference captures have been reviewed side by side;
- structure, hierarchy, proportions, spacing, typography, surfaces, and action emphasis are closely
  aligned;
- selected, focused, disabled, loading, error, success, empty, and destructive states are
  unambiguous;
- the implementation uses shared Graphite tokens and the configured shadcn/ui primitives;
- no fake progress, placeholder facts, future-feature controls, or milestone/roadmap copy is shown
  to users;
- responsive and accessibility behavior is verified;
- every intentional deviation is documented with a product, responsive, or accessibility reason;
- the milestone handoff includes current implementation screenshots.

Missing captures or an unexplained visible mismatch fails the milestone exit criteria.

## Required workflow for every UI milestone

### 1. Inventory before implementation

Before writing UI code:

1. open every reference mapped to the active milestone;
2. list the surfaces, variants, overlays, and states represented;
3. identify content that belongs to a later milestone and must not be imitated yet;
4. map generic controls to existing or newly installed shadcn/ui primitives;
5. identify the smallest approved Goal Tracker domain composites needed.

Do not start from a generic page skeleton and attempt to style it later.

### 2. Build the real states

- Compose the screen using real milestone data and behavior.
- Preserve the reference's information hierarchy and action hierarchy.
- Use progressive disclosure instead of persistent explanatory paragraphs.
- Do not expose implementation language such as “comes next”, “later milestone”, or “not yet
  implemented”.
- Do not draw progress, status, totals, or affordances without authoritative data and behavior.
- Do not render a disabled future feature merely to occupy its eventual location.

### 3. Use the shared component system

- Using the configured `new-york` shadcn/ui registry is mandatory whenever the registry provides a
  primitive that can represent the interaction.
- Before creating any generic interactive or layout control, check the installed shared primitives
  and the shadcn/ui registry. Install the applicable primitive into `packages/ui` when it is not
  already present.
- Never hand-roll Button, Input, Label, Form, Select, RadioGroup, Checkbox, Switch, Card, Badge,
  Alert, Skeleton, Separator, Dialog, AlertDialog, Drawer, Sheet, Popover, Calendar, Date Picker,
  Tooltip, DropdownMenu,
  Table, or ScrollArea replacements.
- “The reference looks slightly different” is not a reason to replace a shadcn primitive. Apply
  Graphite tokens, variants, and composition to the primitive.
- A custom generic control is allowed only when no applicable shadcn primitive exists. The
  milestone handoff must identify the missing primitive, explain the accessibility and interaction
  implementation, and record the exception before the milestone can pass.
- Style primitives through semantic Graphite tokens and variants, not local hex values.
- Selected choices must be obvious through more than a subtle color change. Use the primitive's
  checked semantics plus clear border, indicator, typography, or surface contrast.
- Custom components are limited to the domain composites approved in the design system.

### 4. Capture and compare

For each mapped surface:

1. run the real local application with representative milestone data;
2. capture the implementation at the documented mobile width, normally 390px;
3. capture the relevant desktop width when the milestone owns responsive composition;
4. compare the implementation and reference side by side;
5. inspect, at minimum:
   - viewport and content width;
   - outer and section spacing;
   - header alignment;
   - text size, weight, line height, and wrapping;
   - control height, padding, radius, and border;
   - selected and focused states;
   - primary, secondary, and destructive action emphasis;
   - overlays and focus behavior;
   - empty, loading, error, success, and disabled states;
6. correct material differences and recapture.

The comparison must use screenshots from the current implementation. A README listing expected
filenames is not evidence of conformance.

### 5. Review and handoff

The handoff must include:

- paths to current implementation captures;
- the mapped reference for each capture;
- intentional deviations and their reason;
- responsive and accessibility checks performed;
- confirmation that generic controls trace to shadcn/ui;
- confirmation that no future behavior or fake data was introduced;
- reviewer or user sign-off when visual acceptance is required.

## Visual acceptance checklist

### Composition

- [ ] The screen reads in the same order and with the same dominant element as the reference.
- [ ] Mobile content uses the intended gutter and does not stretch like a desktop form.
- [ ] Desktop width adds useful context without enlarging mobile controls indefinitely.
- [ ] Related fields are grouped and unrelated actions are separated.

### Interaction

- [ ] The selected option is immediately recognizable without trial and error.
- [ ] Keyboard focus is visible and logical.
- [ ] Touch targets are at least 44px.
- [ ] Only one filled mint primary action appears in a decision context.
- [ ] Destructive actions use confirmation and appropriate danger styling.
- [ ] Mobile contextual actions prefer Drawer; Sheet requires an explicit reference exception.

### Content

- [ ] Copy is user-facing, concise, and action-led.
- [ ] No development roadmap or milestone language appears.
- [ ] No prototype annotation outside the product frame was copied.
- [ ] Money and business months use the documented formatting.
- [ ] Unlike currencies are never visually combined.

### Quality evidence

- [ ] Every mapped state has a current implementation capture.
- [ ] Captures were compared with references at matching widths.
- [ ] Material differences were corrected or explicitly justified.
- [ ] Every generic control traces to an installed shadcn/ui primitive or has a documented,
      approved no-primitive exception.
- [ ] Loading, empty, error, success, disabled, and destructive states were inspected.
- [ ] The milestone is not handed off with placeholder capture files.

## Milestone policy

- M1 through M4 must each leave their owned surfaces at product quality.
- A later milestone may extend an earlier surface, but it must not be expected to repair avoidable
  visual debt.
- M5A owns responsive architecture and intentional desktop composition. Its accepted mobile and
  desktop captures are a blocking gate before M5B.
- M5B is the integrated consistency, accessibility, journey, and final-detail audit. It is not the
  first visual-quality pass and must not redesign accepted M5A compositions.
- A milestone with functional behavior but failed visual conformance remains incomplete.
