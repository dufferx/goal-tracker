# Goal Tracker — Product Design Brief

**Status:** Approved direction for M5
**Product:** Responsive web application, English-first

Design a calm personal money-planning tool, not a project-management dashboard. The user should
understand a goal in seconds: what it is for, how much is funded, how much remains available, what
has been spent, what comes next, and whether the current plan is realistic.

## Experience principles

- Favor one obvious primary action per screen.
- Use everyday money language; keep accounting and architecture terminology out of the UI.
- Show totals and their relationships before charts.
- Explain every pace status in text; color is supplementary.
- Reveal detail progressively. History and simulation should not crowd the everyday contribution
  flow.
- Make month-based planning feel month-based; do not show invented day precision.
- Treat destructive or financially meaningful actions with explicit confirmation.
- Optimize first for phone widths, then wider screens.

## Information architecture

Primary navigation:

- Goals
- History, when viewed within a goal
- Archived
- Settings

Authentication screens sit outside the application shell. Simulation is entered from a goal and
returns to that goal; it is not a durable top-level object.

## Dashboard

Show:

- active goal cards;
- totals grouped by currency, never combined across currencies;
- goal name, target when valid, funded progress, available money, next dated item, and pace status
  when calculable;
- an intentional incomplete-setup state for item-derived goals without items;
- clear create-goal action.

Avoid dense tables, task counters, global portfolio scores, and decorative charts without a direct
decision they support.

## Goal detail

Use a clear hierarchy:

1. goal identity and lifecycle;
2. funded/target progress;
3. available and spent money;
4. guidance, explanation, and recommendation;
5. primary contribution action;
6. planned items;
7. recent financial history;
8. simulation entry.

For open goals without enough planning information, say why no pace is shown and offer the relevant
next action: add a due month, final month, or preferred contribution. Do not label the user as
behind when no required pace exists.

## Money model in the interface

Use these terms consistently:

- **Funded:** contributions minus withdrawals;
- **Available:** funded money not yet spent;
- **Spent:** purchases after undo;
- **Target:** fixed budget or item-derived current total;
- **Remaining:** target minus funded, never the cash currently available.

After a purchase, reinforce that funded progress stays intact while available money decreases. For
an item-derived goal, show when actual price changed the target.

## Goal and item forms

Goal creation should be a short guided form:

1. name and currency;
2. fixed amount or “calculated from items”;
3. start month and optional final month;
4. one or two planned contributions per month;
5. optional preferred contribution for open goals.

Items belong inside goals and use name, expected price, and optional due month.

For a fixed goal:

- percentage entry may be offered as a convenience beside money entry;
- show the converted money amount before saving;
- if item totals exceed the budget, present two explicit choices: keep the goal target or increase
  it to cover the items.

For an item-derived goal, explain that adding or changing items changes the target.

## Financial flows

Contribution should be the fastest flow in the product. Default the date to today and allow a past
date.

Withdrawals, edits, deletes, purchases, and undo need enough context to prevent mistakes:

- show resulting amounts when helpful;
- block purchase with a plain explanation when available money is insufficient;
- explain why purchased items cannot be deleted before undo;
- warn that retroactive changes can be rejected if they make past balances invalid;
- require confirmation for delete, purchase undo, archive, and permanent goal deletion.

History is one chronological financial list with compact filters. Distinguish type with icon, label,
and sign—not color alone. Reversals must visibly reference the purchase they undo.

## Guidance

Pace states are:

- Ahead
- On track
- At risk
- Behind

Fully funded is a separate completion message. Each status block includes:

- the current state;
- one-sentence reason;
- recommended monthly amount;
- recommended amount per contribution for the selected one/two frequency;
- relevant next deadline or estimate.

Use encouraging, factual wording. Avoid shame, gamification pressure, confetti by default, or false
precision.

## Simulator

The simulator is explicitly labeled temporary and hypothetical.

- Support one to three sequential phases in a compact editor.
- Each phase has a duration in months and an amount per contribution. Make it clear that the goal's
  frequency applies that amount once or twice per month.
- Let the final phase optionally continue until the next deadline or target.
- Show duration, sequence, and amount validation inline.
- Report a month-by-month trajectory, estimated target month when possible, and the month each item
  becomes affordable.
- Say that affordability does not mean the item was bought and does not change real available money.
- Provide close/reset, not save. Refreshing or leaving may discard the report.

A small table or simple line visualization is appropriate only if it improves month-to-month
comparison. Always provide the exact values in accessible text.

## States and accessibility

Every screen must define:

- initial loading;
- empty;
- recoverable error;
- permission/session error;
- successful mutation feedback;
- disabled/submitting;
- connection error state.

Meet WCAG 2.2 AA intent: semantic landmarks, correct labels, keyboard access, visible focus, dialog
focus management, sufficient contrast, reduced motion, large touch targets, and screen-reader
announcements for mutation results. Preserve entered form values after recoverable errors.

## Visual direction

Use a restrained, warm-neutral system with one confident accent and a small semantic palette.
Typography and spacing should carry hierarchy. Cards may group goals, but avoid nesting every
section in another card. Use monospaced or tabular numerals for changing money values when it aids
comparison. Motion should clarify state changes and remain optional.

Do not design UI for tasks, checkpoints as separate records, transfers, bank accounts, shared goals,
admin dashboards, saved simulations, or AI.

## Required design coverage

Provide responsive designs for:

- sign in, registration-enabled and registration-disabled states, recovery;
- empty and populated goal dashboard;
- fixed and item-derived goal creation;
- goal detail for dated, open, incomplete, and fully funded states;
- item add/edit, over-budget decision, purchase, and undo;
- contribution/withdrawal add and correction;
- history filters;
- temporary simulator;
- archive/restore/permanent delete;
- profile/settings and connection-error state.

Use the Japan trip and home-gym acceptance examples from the product requirements as the primary
prototype journeys.
