# Claude Design Prompt — Goal Tracker

You are the lead product designer and design engineer for Goal Tracker.

Design a coherent, interactive, responsive product experience for the application described in the
two attached documents:

1. `GoalTracker_Product_Requirements_Master.md`
2. `GoalTracker_Architecture_Blueprint.md`

Read both documents completely before designing. They are the source of truth for product behavior,
terminology, scope, privacy, data relationships, and system boundaries.

Do not reinterpret business rules, introduce features that are not present, or restore concepts
that were explicitly removed. When a UI detail is not defined, make the simplest reasonable product
decision and briefly document it.

## Objective

Create the complete user flow and structural design foundation that implementation agents can use
throughout development.

This is not intended to be a low-fidelity wireframe exercise. Establish a recognizable visual brand
and a polished product direction now, while keeping the experience simple enough to evolve during
implementation.

The result should feel:

- modern;
- clean;
- minimal;
- calm and friendly;
- visually pleasant;
- trustworthy around money;
- extremely easy to understand and use.

Simplicity is the most important quality. Every element should earn its place.

## Creative freedom

You have broad freedom over:

- product navigation and information architecture;
- page composition and hierarchy;
- responsive behavior;
- visual identity, color palette, typography, spacing, iconography, and motion;
- how information is progressively disclosed;
- whether a flow is presented as a page, sheet, drawer, dialog, inline editor, or another suitable
  interaction;
- the exact presentation of goal progress, guidance, items, history, and simulation;
- microcopy, provided it remains faithful to the domain rules;
- reusable UI patterns and the personality of the brand.

Do not merely restyle an ordinary finance dashboard. Create a cohesive identity that feels personal,
focused, and useful without becoming decorative or complicated.

You may reorganize or improve any suggested flow if your solution is simpler and still respects the
attached requirements. The attached documents constrain product truth, not your creativity as a
designer.

## Product understanding

Goal Tracker is a personal, self-hosted goal and budget tracker. A deployment may contain a small
number of users, but every user's information is private.

The product helps a person:

- save toward a fixed financial target;
- create a goal whose target is calculated from the prices of planned items;
- contribute money once or twice per month;
- understand funded, available, spent, target, and remaining amounts;
- plan expenses with optional month-level deadlines;
- purchase an item only when enough goal money is available;
- see whether a dated goal is ahead, on track, at risk, or behind;
- explore a temporary hypothetical contribution plan;
- review and safely correct real financial history.

The two primary example journeys are:

- **Japan trip:** a fixed target with a final month and earlier expenses such as flights and hotel;
- **Home gym:** an open-ended, item-derived target where equipment is purchased over time and actual
  prices may differ from estimates.

Use realistic content from these journeys throughout the prototype. The product interface is
English-first.

## Non-negotiable product rules

The experience must accurately communicate the rules in the attached requirements, including:

- a goal is the primary object;
- items are optional and may exist in either target mode;
- an item's optional due month supplies a funding deadline without a separate milestone entity;
- an item-derived target uses actual price for purchased items and expected price for pending items;
- a fixed target does not change silently when item amounts exceed it;
- contributions increase funded and available money;
- withdrawals decrease funded and available money;
- purchases move money from available to spent without erasing funded progress;
- a purchase is blocked when available money is insufficient;
- purchase undo is complete, not partial;
- real transactions may be today or in the past, never in the future;
- historical edits may be rejected when they would invalidate later financial history;
- one or two contributions per month is a planning frequency, not a payday schedule;
- open goals without enough planning information intentionally have no pace status;
- `Fully funded` is separate from pace status and never archives a goal automatically;
- simulations are temporary, contribution-only, and never change real data or simulate purchases;
- the simulator reports when items become affordable;
- archived goals remain under explicit user control;
- currencies from different goals are never added together.

Use the exact product definitions of Funded, Available, Spent, Target, and Remaining. The interface
must make their differences understandable without requiring accounting knowledge.

Do not design tasks, standalone milestones or checkpoints, generic project components, transfers,
bank accounts, shared goals, administration dashboards, saved simulations, offline workflows, AI,
or any other excluded feature.

## Technology and component direction

Design for a React web application using Tailwind CSS and shadcn/ui.

Use shadcn/ui primitives as the foundation rather than inventing a parallel component system.
Choose components according to the interaction, including where useful:

- `Sheet` for fast contextual actions and compact forms;
- `Drawer` for comfortable mobile interactions;
- `Dialog` and `AlertDialog` for decisions and destructive confirmation;
- `Card`, `Progress`, `Badge`, `Tabs`, `Tooltip`, `Popover`, and `DropdownMenu`;
- shadcn form controls, calendars/month selectors, inputs, selects, tables, and toasts;
- `Skeleton`, `Alert`, and empty-state patterns for application feedback.

This is guidance, not a requirement to use every component. Avoid component variety for its own
sake. Prefer a small, consistent set of patterns that implementation agents can reuse.

Use Lucide icons or another restrained icon set compatible with shadcn. Do not rely on icons or color
alone to communicate meaning.

## Required end-to-end coverage

Design a connected experience rather than unrelated screen mockups. At minimum, the prototype must
allow a reviewer to follow these flows.

### Entry and account

- sign in;
- sign up when registration is enabled;
- registration-disabled state;
- password-recovery availability and unavailable/manual-support state;
- authenticated application shell;
- profile and default-currency settings.

### First goal

- empty dashboard;
- create a fixed or item-derived goal;
- choose currency, start month, optional final month, one/two contribution frequency, and optional
  preferred amount per contribution;
- understand what each target mode means before choosing;
- arrive at a useful goal-detail view.

### Japan trip

- see a populated fixed goal;
- add flights and hotel as items;
- give flights a due month;
- understand the cumulative funding need and current guidance;
- handle an item total that exceeds the fixed budget by explicitly keeping or increasing the target;
- add contributions;
- understand funded, available, spent, target, and remaining;
- purchase flights when affordable;
- see the effect of a lower or higher actual purchase price;
- review, edit, and delete eligible financial history;
- undo a purchase.

### Home gym

- create an item-derived goal with no final month;
- experience the intentional incomplete state before the first item exists;
- add and edit equipment;
- see the target become the sum of item prices;
- add contributions;
- see which item is currently affordable;
- purchase an item and see the target use its actual cost;
- understand the no-pace state when there is no deadline or preferred contribution;
- add a preferred amount and see an estimate become available.

### Temporary simulation

- open simulation from a goal;
- build one to three sequential phases;
- enter each phase as a duration in months and an amount per contribution;
- understand how the one/two frequency affects simulated monthly funding;
- optionally continue the final phase until the next deadline or target;
- compare the hypothetical result with the current plan;
- see the month in which each pending item becomes affordable;
- understand clearly that no item was purchased and no real data changed;
- reset or leave without saving.

### Lifecycle and recovery

- view active and archived goals;
- archive, restore, and permanently delete with appropriate confirmation;
- experience insufficient funds, invalid historical correction, locked currency, network failure,
  recoverable form error, and expired session.

## UX expectations

- Prioritize one clear primary action in each context.
- Make adding a contribution especially fast.
- Use progressive disclosure instead of displaying every detail at once.
- Keep goal detail useful at a glance without hiding important money distinctions.
- Prefer plain language over financial or technical terminology.
- Use confirmation proportional to risk; do not interrupt harmless actions unnecessarily.
- Preserve user input after recoverable errors.
- Provide purposeful loading, empty, success, error, disabled, and submitting states.
- Never retry a financial submission automatically. If its result cannot be confirmed, show an
  indeterminate-result state and refresh the affected goal history before enabling another attempt.
- Make unavailable actions explain why they are unavailable.
- Avoid excessive dashboards, nested cards, permanent side panels, charts, tabs, and metrics.
- Use charts only when they make a decision easier; always provide exact accessible values.
- Avoid gamification, shame-based language, visual noise, and false precision.

## Responsive and accessibility requirements

Design mobile-first, but create an intentional desktop experience rather than merely stretching the
mobile layout.

Meet WCAG 2.2 AA intent:

- semantic structure and meaningful labels;
- complete keyboard navigation;
- strong visible focus;
- correct sheet, drawer, dialog, and alert-dialog focus behavior;
- sufficient contrast;
- touch-friendly target sizes;
- reduced-motion support;
- screen-reader-friendly status and mutation feedback;
- no information communicated only by color, position, or animation.

Show how major layouts and contextual actions adapt between representative mobile and desktop
widths.

## Expected deliverables

Produce:

1. a coherent interactive prototype using realistic Goal Tracker data;
2. a concise information-architecture map;
3. the two complete reference journeys and their supporting states;
4. the simulator flow;
5. a visual brand foundation:
   - color and semantic palette;
   - typography;
   - spacing and radius approach;
   - icon and illustration direction, if any;
   - motion principles;
6. a small reusable component and interaction inventory based on shadcn/ui;
7. responsive examples for the main surfaces;
8. loading, empty, success, validation, error, disabled, and destructive states;
9. a short rationale explaining the most important UX decisions and any assumptions.

The prototype should be specific enough that implementation agents can use it as the visual and
interaction reference for later milestones.

Do not spend the work primarily explaining what you would design. Create the experience and then
briefly explain it.

## Final quality bar

Before finishing, verify:

- every designed action exists in the attached product requirements;
- the two reference journeys can be completed without external explanation;
- the hierarchy makes the five money concepts understandable;
- temporary simulation cannot be confused with real activity;
- no excluded feature appears in navigation or secondary actions;
- the same visual language is applied consistently across all flows;
- mobile and desktop interactions are both credible;
- the design feels distinctive, contemporary, simple, and friendly;
- implementation can reuse a small number of shadcn-based patterns rather than recreating each
  screen independently.

When visual ambition conflicts with clarity, choose clarity. When additional functionality
conflicts with simplicity, choose simplicity.
