# Goal Tracker Design System — Graphite v2

## Authority

This guide translates the approved Graphite v2 prototype into implementation rules. Executable
values live in `packages/ui/src/styles/globals.css`; this file explains how to use them.

Product requirements remain authoritative for behavior. Screenshots remain authoritative for
composition. Shared CSS remains authoritative for token values.

## Principles

- Calm before decorative.
- One obvious primary action per context.
- Money is exact, visible, and never communicated by color alone.
- Progressive disclosure keeps explanation available without making every screen instructional.
- Mobile is the base composition; desktop uses width for context and simultaneity.
- Fully funded is a condition, not a celebration ceremony.
- Motion explains state change and never blocks work.

## Color and surfaces

### Dark/default

| Token | Value | Use |
| --- | --- | --- |
| page | `#000000` | browser/board background |
| canvas | `#0B0C0D` | application background |
| surface | `#121416` | cards |
| raised | `#17191C` | drawers, dialogs, raised panels |
| control | `#1F2326` | inputs and secondary controls |
| border | `#24282C` | standard boundaries |
| border strong | `#2A2F33` | selected/raised boundaries |
| hairline | `#1E2124` | row separators |
| text | `#EDEFF1` | primary text |
| text secondary | `#A2A9AF` | descriptions |
| text tertiary | `#798187` | metadata; WCAG AA on canvas and surfaces |
| accent | `#74D3AE` | primary action and on-track |
| accent surface | `#0E1A17` | quiet positive background |
| accent border | `#1E3A32` | quiet positive boundary |

### Light

| Token | Value |
| --- | --- |
| canvas | `#F7F7F5` |
| surface/raised | `#FFFFFF` |
| control | `#F0F0EC` |
| border | `#E4E4E0` |
| border strong | `#D6D6D0` |
| hairline | `#EBEBE7` |
| text | `#14171A` |
| text secondary | `#5B6268` |
| text tertiary | `#666E74` |
| accent | `#1B6350` |
| accent surface | `#E7F1ED` |
| accent border | `#C9E0D7` |

Dark screenshots are the approved baseline. Light mode uses the documented semantic mapping and
must not introduce different hierarchy or components.

### Status

| Status | Dark | Light |
| --- | --- | --- |
| ahead | `#93E3C6` | `#17705A` |
| on track | `#74D3AE` | `#1B6350` |
| at risk | `#E39B5A` | `#9C5D18` |
| behind | `#E37B6C` | `#A03A2C` |
| no pace | `#8A9196` | `#6B7278` |

Always pair status color with its exact status text. Reserve destructive red styling for permanent
delete or a blocking error; ordinary withdrawal and purchase are not destructive-danger actions.

## Typography

- UI: `Golos Text`, then system sans-serif.
- Money and dates: `DM Mono`, then a system monospace.
- Use tabular numerals for every amount, date column, before/after value, and progress label.
- Default body is 14px with comfortable 1.5–1.6 line height.
- Mobile screen titles are approximately 23–28px; dominant guidance is 19–22px.
- Section labels use 12–13px, medium weight, and restrained tracking.
- Do not compress helper text below 12px.

Fonts are supplied through the shared UI package. Do not replace them per screen.

## Geometry

- Control radius: 9px.
- Input radius: 11px.
- Inner panel radius: 12px.
- Card radius: 16px.
- Tab bar radius: 20px.
- Drawer/dialog radius: 22px.
- Pill radius: 999px.
- Touch targets: at least 44px; primary mobile controls target 48px.
- Mobile content gutter: 16px, expanding to 22px in focused forms.
- Desktop rail: 236px.
- Desktop content maximum: 1280px.
- Reference breakpoints: 768px, 1024px, 1440px.

Cards, inputs, and ordinary buttons have no decorative shadow. Use shadows only to communicate
elevation:

- drawer: `0 -10px 34px rgb(0 0 0 / 50%)`;
- dialog: `0 24px 60px rgb(0 0 0 / 60%)`;
- floating tab bar: `0 8px 28px rgb(0 0 0 / 45%)`.

## Motion

- State feedback: 160ms.
- Movement: 220ms.
- Surface entry/exit: 280ms.
- Progress update: 400ms.
- Easing: `cubic-bezier(.32,.72,0,1)`.
- Honor `prefers-reduced-motion`; remove travel and keep immediate state clarity.

## Action hierarchy

1. Filled mint: the single primary action in the current context.
2. Mint text on control surface: important secondary action.
3. Neutral outlined/control button: ordinary alternate.
4. Text button: tertiary navigation or disclosure.
5. Danger fill: permanent deletion only.

Do not place two filled accent buttons in the same decision surface. Disabled controls retain their
label and explain unavailability nearby.

## shadcn/ui first

Use the repository's `new-york` shadcn configuration and Lucide icons. Before building a generic
control:

1. check the shadcn registry;
2. install the primitive into `packages/ui` when first required;
3. style it through semantic tokens and variants;
4. compose it in the web app.

Never hand-roll replacements for:

- Button, Input, Label, Form, Select, RadioGroup, Checkbox, Switch;
- Card, Badge, Alert, Skeleton, Separator;
- Dialog, AlertDialog, Drawer, Sheet, Popover, Calendar, Date Picker, Tooltip, DropdownMenu;
- Table and ScrollArea.

Do not install every primitive during D1. Each milestone adds only what it uses.

## Approved domain composites

These may be custom because shadcn does not encode their domain presentation:

- `FundedProgress`: funded and spent segments with exact text and an accessible sentence label.
- `FinancialMetric`: label plus formatted integer-minor-unit value.
- `PlanningTimeline`: vertical semantic list of current month, due items, and final target; its
  connector means order, never money progress.
- `GuidanceSummary`: render-ready status, short explanation, and recommendation.
- `MoneyInput`: composition around shadcn `Input`, with currency prefix and suggestion chips.
- `HistoryList`: financial rows/table with running available balance.
- `SimulationPanel`: phase editors and the report table.
- Application navigation composition: mobile floating tab bar and desktop rail.

The list is closed. Adding another custom composite requires a documented need and proof that it
does not recreate a generic primitive. Composites contain no authoritative financial or projection
logic.

## Core patterns

### App shell

- Mobile: goals and settings destinations plus one labelled contribution action.
- Desktop: 236px rail; width adds context but no capability.
- Avoid nested permanent navigation, global activity, or task destinations.

### Goal cards

- Name and exact status label first.
- One short recommendation or fact.
- Exact available/spent and funded/target values.
- One primary contribution action and a route to details.
- Currency groups never sum unlike currencies.

### Goal detail

- Guidance and primary contribution action precede totals.
- Main financial progress represents money only.
- `PlanningTimeline` separately represents temporal order.
- Items, recent history, and simulator entry remain on one scrolling mobile page.

### Forms

- Labels remain visible; placeholders do not replace them.
- Errors sit directly below the field.
- Money uses decimal input mode but converts to integer minor units at the contract boundary.
- Planning uses month pickers; real financial events use dates.
- Preserve input after known recoverable errors.
- Disable the submit action while pending.
- For an unconfirmed financial result, show an indeterminate state and refresh history before
  allowing another attempt.

### Overlays

- Mobile contextual forms prefer Drawer. Use Sheet only when a future approved reference explicitly
  requires a lateral panel.
- Desktop equivalent: approximately 480px Dialog.
- Decisions and destructive actions: Dialog/AlertDialog.
- Focus is trapped, Escape behavior is correct, and focus returns to the trigger.

### Feedback

- Inline Alert/banner, not transient toast, for financial outcomes requiring attention.
- Loading: stable Skeleton geometry without shimmer dependence.
- Empty: one plain explanation and one next action.
- Success: state and new exact total; avoid celebration.
- Error: what happened, whether money moved, and what to do next.
- Permanent delete: typed goal name and danger styling.

## Copy

Use:

- Funded, Available, Spent, Target, Remaining;
- Contribution, Withdrawal, Purchase, Item, Month;
- Behind, At risk, On track, Ahead;
- Fully funded, No pace status, Setup incomplete.

Do not use Invested, Committed, Checkpoint, Component, Period, Transfer, Tight, or No plan. Prefer
short action-led sentences. Put longer explanations behind progressive disclosure.

## Responsive behavior

- Under 768px: single-column mobile composition and full-width contextual overlays.
- 768–1023px: retain content order, allow two columns where comparison improves comprehension, and
  reduce the rail to compact navigation if used.
- 1024px and above: desktop rail, side-by-side goal cards, sticky summary beside items/history, and
  Dialog instead of mobile Drawer/Sheet where appropriate.
- Do not hide actions solely because the viewport changed.
- Do not stretch mobile cards indefinitely; use the 1280px content maximum.

## Accessibility

- Meet WCAG 2.2 AA intent.
- Visible focus uses the accent ring.
- Status is never color-only.
- Progress has exact adjacent text and an accessible sentence.
- Signed financial amounts are announced as contribution/withdrawal words where symbols could be
  ambiguous.
- All icon-only controls have accessible names.
- Lucide icons are decorative when adjacent text already names the action.
- Preserve logical DOM order when desktop visually creates columns.
- Month/date and currency are never inferred only from position.

## Conformance review

For each milestone:

1. compare at 390px and the relevant desktop width;
2. verify shared tokens rather than local hex values;
3. verify generic controls trace to shadcn/ui;
4. verify domain composites remain presentation-only;
5. capture the implementation for the PR;
6. document every intentional difference from the mapped reference.

The target is close structural and visual fidelity, not brittle screenshot mimicry that compromises
real content or accessibility.
