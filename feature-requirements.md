# Feature Requirements: Simplified Goal Tracker

## Status

Ready for Build — promoted to the canonical product requirements

> This file is the approved discovery record. Product behavior is now governed by
> `docs/GoalTracker_Product_Requirements_Master.md`. Preserve this record for decision traceability;
> update the canonical document first for future product changes.

## Summary

Goal Tracker is a personal budget-goal tracker for recording savings toward simple financial goals
and money-based projects. The first product definition must support two representative cases:

1. A Japan trip with a final date and dated items such as flights that create earlier funding
   deadlines.
2. A home gym without a final date whose target is calculated from the current prices of its items.

The product is open source and self-hosted. A deployment may be shared by a small number of users,
each with private data. It must favor simple daily use and a small domain model over exhaustive
audit, planning, project-management, offline, and future-platform capabilities.

## Goals

- Record contributions made monthly or twice per month.
- Show how much has been funded, how much remains, and how much cash is still available.
- Estimate the contribution needed per contribution for dated goals and dated items.
- Communicate whether a dated goal is behind, on track, or ahead.
- Derive simple funding deadlines such as “have enough for flights by October” from dated items.
- Support item-based goals whose target is the sum of their item costs.
- Mark an item as purchased, record its actual cost, and recalculate the item-based target.
- Show and allow correction of contribution history.
- Preview how a temporary contribution schedule would affect item deadlines and completion.
- Withdraw money that is still available in a goal.
- Undo an item purchase made by mistake or later reversed.

## Non-Goals

- Tasks or project-management functionality.
- A separate milestone or checkpoint entity.
- Checkpoint-to-item many-to-many relationships.
- Historical checkpoint coverage and achievement records.
- Component type-specific state machines.
- Persisted or audit-tracked simulations.
- Simulations that modify real data without a separate explicit future requirement.
- Non-financial activity timelines.
- Financial event revisions or audit-grade correction history.
- Persisted financial snapshots in the initial version.
- Offline financial writes in the initial version.
- AI, public API, native mobile, or notification preparation.
- Importable templates, CSV export, or full backup restoration in the initial version.
- Shared or collaborative goals.
- Administrative roles or an administrative web interface.

## Users and Entry Points

- Expected users: the deployment owner and a small number of other users, each managing private
  personal goals.
- Primary entry points:
  - goals dashboard;
  - goal detail;
  - add contribution;
  - manage items;
  - view and edit contribution history.

## Confirmed Facts

- Tasks must be removed completely.
- A goal uses a simple frequency of one or two contributions per month, without configured paydays
  or persisted saving periods.
- A goal may have a final date or be open-ended.
- A dated goal may contain several items with earlier due dates.
- Funding requirements derived from dated items are cumulative and ordered.
- A goal may use a manually entered target.
- A goal may derive its target from the sum of item costs.
- Purchased items record their actual cost.
- Changing an item's cost changes the target of an item-based goal.
- Contribution history must be visible and editable.
- A purchase can only use money already available in its goal.
- A withdrawal can only use money currently available in its goal.
- Status is based on the funding mathematically expected by today, rather than a separately
  configured planned contribution.
- A goal has an explicit editable start date that defaults to today.
- Items are allowed in both fixed-target and item-derived goals.
- Fixed-target item prices allocate the target but do not change it silently.
- When fixed-target items exceed the target, the user chooses whether to keep or increase the target.
- Percentage-based item entry is converted immediately to a stored money amount and is not a live
  formula.
- A simulation should allow different contribution amounts across sequential future month ranges.
- Reaching the target marks a goal as fully funded but never archives or closes it automatically.
- Contributions and withdrawals are editable only when replaying all financial transactions keeps
  available money non-negative at every point.
- An unpurchased item can be deleted with confirmation; a purchased item requires purchase undo
  first.
- Goal and item deadlines use month and year, not an exact day.
- Real financial transactions receive an automatic effective date that may be changed for older
  entries.
- Contributions, withdrawals, purchases, and purchase undos appear in one chronological history
  with simple type filters.
- The product is for personal use and simplicity is a primary constraint.
- The application is open source and self-hosted.
- A deployment supports a small number of authenticated users with strictly private data.
- Accounts use email and password through Supabase Auth.
- Instance owners can enable or disable new registrations through deployment configuration.
- Password recovery uses email when SMTP is configured; manual infrastructure-level reset is
  documented otherwise.
- An open-ended goal may define an optional preferred amount per contribution; without it, no
  completion estimate or pace status is shown.
- Goals may use different currencies, but each goal has exactly one currency and cross-currency
  totals are never combined.
- Each user has a default currency for new goals, and a goal's currency locks after its first
  financial transaction.
- Expected progress advances after completed calendar months; a month-level deadline is due at the
  end of its month.
- Contributions and withdrawals may be permanently deleted with confirmation only when the
  remaining chronological financial history stays valid.
- Real financial transactions may use past or current dates, never future dates.
- Goals use a simple active/archive/restore lifecycle plus explicitly confirmed permanent deletion.
- Planning fields remain editable with impact previews and deadline validation.
- Real item-price overages require sufficient available money and explicit fixed-target handling.
- An item-derived goal without items is incomplete setup, not a zero-value funded goal.

## Current Code Findings

- `README.md`: the repository contains only the M0 foundation and no product schema or implemented
  product behavior.
- `supabase/migrations/20260727030237_repository_foundation.sql`: the migration intentionally creates
  no application tables, so the model can be simplified without a data migration.
- `packages/domain/src/index.ts`: no domain implementation exists yet.
- `packages/contracts/src/index.ts`: no product contracts exist yet.
- `docs/GoalTracker_Product_Requirements_Master.md`: the current PRD combines goals, components,
  tasks, checkpoints, event history, simulations, offline writes, portability, and lifecycle flows.
- `docs/GoalTracker_Technical_Architecture.md`: the proposed model includes financial revisions,
  snapshots, checkpoint achievements, activity events, and multiple domain engines that are not yet
  implemented.

## Existing Patterns To Reuse

- `apps/api`: keep the backend as the authority for financial mutations.
- `supabase/migrations`: keep Supabase migrations as the only schema history.
- `packages/domain`: reuse for small, infrastructure-free monetary and projection calculations.
- `packages/contracts`: reuse for shared request and response validation.
- Existing architectural decisions worth preserving:
  - money stored in integer minor units;
  - stable business dates separated from technical timestamps;
  - user ownership and isolation;
  - no negative available balance;
  - financial mutations validated by the backend.

## Requirements

### R1: Manage simple financial goals

A user can create an active goal with a name, currency, saving frequency, editable start date,
optional final date, and either a fixed target or an item-derived target. The start date defaults to
today. An open-ended goal may also define an optional preferred amount per contribution.

Evidence:

- User decision: Japan has a dated fixed target; home gym is open-ended and item-derived; goal start
  date is user-editable and defaults to today.
- Code evidence: no existing schema constrains the redesign.
- Assumption: none.
- Inference: fixed and item-derived targets are two useful creation modes, but should not produce
  separate goal entities.

### R2: Record and correct contributions

A user can add a contribution with an amount and effective date, view it in chronological history,
and edit its amount or date. Current totals are recalculated after an edit.

Evidence:

- User decision: contribution history must be simple and editable.
- Code evidence: no event or revision system has been implemented.
- Assumption: none.
- Inference: audit-grade revision history is unnecessary for personal use unless explicitly
  requested.

### R3: Show understandable money totals

For each goal, the product distinguishes:

- available money not yet spent;
- money spent on goal items;
- total funded toward the goal;
- amount remaining against the current target.

Purchasing an item moves money from available to spent and does not erase funded progress.

Evidence:

- User decision: the app must show total saved and progress after purchasing home-gym items.
- Code evidence: the existing PRD already defines the useful identity `funded = available + spent`.
- Assumption: none.
- Inference: preserving funded progress after a goal-related purchase matches both representative
  cases.

### R4: Derive cumulative funding deadlines from dated items

A goal item may have an optional due date. For each item due date, the app derives a cumulative
funding requirement from the current amounts of all items due on or before that date. Several items
on the same date form one cumulative deadline. Progress is derived from the goal's total funded
amount. There is no separate milestone entity or item-to-milestone relationship.

Evidence:

- User decision: the Japan goal needs enough money for flights by October before the final trip;
  every required milestone is a concrete item or expense with an optional due date, so the separate
  milestone entity is removed.
- Code evidence: the current many-to-many checkpoint model is not implemented.
- Assumption: none.
- Inference: grouping dated items produces cumulative deadlines without duplicate data entry.

### R5: Calculate saving guidance from contributions per month

For the next unfinished dated-item deadline and the final dated target, the app calculates the
remaining amount and the recommended amount per contribution. A goal stores only whether the user
expects to contribute once or twice per calendar month. It does not define paydays, period
boundaries, or scheduled future contributions.

Evidence:

- User decision: the app should estimate how much to contribute each month to stay on track.
- User decision: frequency means only one or two contributions per month; exact payday dates and
  saving-period entities are unnecessary.
- Code evidence: the existing projection formula is `remaining amount / remaining periods`.
- Assumption: none.
- Inference: recommendation can divide the remaining amount by the remaining calendar-month
  contribution opportunities without creating a schedule.

### R6: Show a small, explainable status

A dated target communicates a small status such as behind, on track, or ahead using its funded
amount, due date, saving frequency, start date, and the amount mathematically expected by today.

For the current critical requirement (the next dated-item deadline, otherwise the final deadline):

- total contribution opportunities equal inclusive calendar months from start through deadline,
  multiplied by one or two contributions per month;
- expected opportunities equal fully completed calendar months since the start month, multiplied by
  the configured contribution count;
- the baseline contribution is the required cumulative amount divided by total opportunities;
- `behind` means the deadline month ended without sufficient funding;
- `at_risk` means funded money is at least one baseline contribution below expected;
- `ahead` means funded money is at least one baseline contribution above expected;
- `on_track` covers the interval between those thresholds.

Evidence:

- User decision: retain an understandable “good, bad, or ahead” state and compare current funding
  with the amount mathematically expected by today.
- Code evidence: the current six-state and explanation-tree engine is not implemented.
- Assumption: none.
- Inference: four states (`behind`, `at_risk`, `on_track`, and `ahead`) are sufficient and use the
  confirmed one-contribution deviation threshold at completed-month boundaries.

### R7: Manage goal items in both target modes

A goal can contain simple items with a name, expected price, optional due date, optional actual
price, and purchased state.

For an item-derived goal, its target is the sum of `actual price` for purchased items and `expected
price` for unpurchased items.

For a fixed-target goal, item amounts allocate portions of the fixed target. Adding or editing items
never changes the target silently. When their sum exceeds the target, the UI shows the overage and
requires the user to choose between keeping the existing target or explicitly increasing it to the
item total.

An item may be entered as a money amount or as a percentage of a fixed target. Percentage entry is
immediately converted to and stored as a fixed money amount; it does not change automatically when
the target changes later.

Evidence:

- User decision: the home-gym budget is defined by item prices and must change when an item costs
  less than expected; items also belong in fixed goals, but over-budget changes require explicit
  confirmation; percentages are input convenience only.
- Code evidence: no component schema has been implemented.
- Assumption: none.
- Inference: one item type and one derived readiness indicator are sufficient; separate purchase and
  budget component types are unnecessary.

### R8: Purchase an item using goal funds

When an item is purchased, the user records its actual cost. The purchase reduces available money,
increases spent money, and updates the item-derived target. The operation is rejected when the goal
does not have enough available money.

Evidence:

- User decision: an item can be marked purchased and its lower actual cost updates the goal.
- Code evidence: the existing financial identity already supports moving available money to spent.
- Assumption: none.
- Inference: externally funded purchases are outside the product's money model.

### R9: Preview a temporary contribution schedule

A user can create a temporary simulation made of sequential future contribution phases. Each phase
defines a number of calendar months and an amount per contribution. The goal's frequency determines
whether that amount is contributed once or twice in each simulated month. A simulation supports at
most three sequential phases, and its final phase may continue until the next item deadline or final
target. It does not create exact future contribution dates and does not modify real contributions,
items, item deadlines, or goal settings.

For item-derived goals, the simulation starts from the real current state, including already
purchased items and their actual prices. Future simulated contributions may report when an
unpurchased item becomes affordable, but no hypothetical purchase is executed automatically. The
simulation is temporary and produces only a report. Purchasing remains an explicit real user action.

Evidence:

- User decision: the product should show what happens when one amount is contributed for one month
  and another amount is contributed for subsequent months; it is limited to three phases and
  remains temporary.
- User decision: real purchases must affect the simulation's starting state, and the report should
  account for items becoming affordable.
- User decision: simulated affordability never performs or schedules a real purchase.
- Code evidence: no simulation code or persistence exists.
- Assumption: none.
- Inference: reporting affordability preserves the useful item signal without inventing purchase
  order, future actual prices, or hypothetical financial transactions.

### R10: Withdraw available goal money

A user can withdraw money previously contributed to a goal. A withdrawal reduces available and
funded money and is rejected when it exceeds the currently available amount.

Evidence:

- User decision: withdrawals are required.
- Code evidence: no financial schema exists yet.
- Assumption: none.
- Inference: spent money cannot be withdrawn without first undoing its purchase.

### R11: Undo an item purchase

A user can undo a purchased item. Undoing restores the recorded real purchase amount to available
money, removes it from spent money, and returns the item to its pending state. Partial returns and
restocking-fee differences are outside the initial version.

Evidence:

- User decision: undoing purchases is required.
- Code evidence: no purchase or refund implementation exists yet.
- Assumption: none.
- Inference: one full undo action covers both erroneous purchase entry and a simple full return
  without introducing a refund subsystem.

### R12: Edit a purchased item safely

After purchase, an item's name remains editable and its real purchase price may be corrected when
the resulting financial sequence remains valid. A purchased item cannot be deleted until its
purchase is undone.

Evidence:

- User decision: confirmed the proposed purchased-item editing rules.
- Code evidence: no item model exists yet.
- Assumption: none.
- Inference: preventing deletion preserves the relationship between the item and its purchase.

### R13: Keep fully funded goals under user control

When funded money reaches the current target, the goal displays `Fully funded`. It remains available
and is not automatically completed, closed, or archived. The user explicitly decides when to
archive it.

Evidence:

- User decision: confirmed manual lifecycle control after full funding.
- Code evidence: no lifecycle implementation exists yet.
- Assumption: none.
- Inference: reaching a money target and finishing a real trip or project are different events.

### R14: Validate financial history after edits

Contributions and withdrawals may be edited directly without revision history. Before saving an
amount or date change, the backend replays transactions in chronological order and rejects the edit
if available money would become negative at any point. The error identifies the first later
transaction that would no longer have sufficient funds.

Evidence:

- User decision: confirmed chronological validation for edits.
- Code evidence: expected personal-use transaction volume makes on-demand replay practical.
- Assumption: none.
- Inference: this preserves understandable money integrity without snapshots or event revisions.

### R15: Delete pending items with confirmation

An unpurchased item may be deleted after confirmation. In an item-derived goal this recalculates the
target. In a fixed-target goal the target remains unchanged and the unallocated amount increases.
Removing a dated item recalculates cumulative funding deadlines and projections. A purchased item
must first have its purchase undone.

Evidence:

- User decision: confirmed the proposed item deletion behavior.
- Code evidence: no item persistence exists yet.
- Assumption: none.
- Inference: confirmation is sufficient because no financial transaction is attached to an
  unpurchased item.

### R16: Switch target mode with impact confirmation

A goal may switch between fixed and item-derived target modes after financial activity. Switching
from fixed to item-derived makes the current item sum the target. Switching from item-derived to
fixed requires a new fixed target. The UI previews the new target, remaining amount, deadlines, and
status before confirmation. Existing contributions, withdrawals, purchases, and items are not
modified.

Evidence:

- User decision: confirmed target-mode switching with impact preview.
- Code evidence: no goal model exists yet.
- Assumption: none.
- Inference: target mode changes planning calculations, not financial facts.

### R17: Use month-level planning deadlines

Goal deadlines and item due dates use calendar month and year only. Saving guidance and simulations
operate on remaining calendar months and one or two contribution opportunities per month. No payday
or exact deadline-day configuration is exposed.

Evidence:

- User decision: confirmed month/year deadlines and rejected configured payday periods.
- Code evidence: no date model exists yet.
- Assumption: none.
- Inference: month-level deadlines match the intended planning precision.

### R18: Date real financial transactions

Each contribution, withdrawal, purchase, and purchase undo receives the current calendar date by
default. The user may choose an older effective date when recording or correcting a transaction.
Dates provide deterministic chronological history but do not define a recurring schedule.

Evidence:

- User decision: confirmed automatic, editable transaction dates.
- Code evidence: no financial schema exists yet.
- Assumption: none.
- Inference: business dates remain necessary for history integrity even though planning uses months.

### R19: Show one financial history

Goal detail shows contributions, withdrawals, purchases, and purchase undos together in a single
chronological list. Simple type filters narrow the list. Non-financial item or goal edits do not
create activity entries.

Evidence:

- User decision: confirmed a unified financial history with simple filters.
- Code evidence: the former non-financial activity model is not implemented.
- Assumption: none.
- Inference: one money-focused history supports correction without restoring an activity subsystem.

### R20: Isolate a small number of users

A self-hosted installation supports a small number of authenticated users. Every goal, item, and
financial transaction belongs to exactly one user and is inaccessible to other users. Goals are not
shared or collaborative.

Evidence:

- User decision: the personal open-source app will be self-hosted and the deployment will be shared
  with a few users.
- Code evidence: the M0 repository already includes Supabase as the intended identity and PostgreSQL
  platform, but no auth or RLS behavior is implemented.
- Assumption: none.
- Inference: ownership and database isolation are necessary product integrity, not speculative
  multi-tenant architecture.

### R21: Require authentication

Access to goals and financial data requires email-and-password authentication through Supabase Auth.

Evidence:

- User decision: confirmed login, multiple users, and email/password credentials.
- Code evidence: Supabase Auth is available in the selected foundation.
- Assumption: none.
- Inference: an internet-accessible shared deployment cannot rely on trusted-device access.

### R22: Archive, restore, or permanently delete a goal

A goal is either active or archived. The user may archive and restore it manually. Permanent
deletion requires explicit confirmation and atomically removes the goal, its items, and financial
history. There is no trash state, retention timer, or automatic close flow.

Evidence:

- User decision: confirmed the proposed simplified goal lifecycle.
- Code evidence: no goal lifecycle exists yet.
- Assumption: none.
- Inference: direct confirmed deletion is simpler than a timed trash subsystem for this product.

### R23: Control registration at deployment level

New-account registration is enabled or disabled through an instance configuration value. When
disabled, existing users can still sign in but the registration flow is unavailable. There is no
invitation system or administrative web interface.

Evidence:

- User decision: confirmed deployment-controlled registration.
- Code evidence: the M0 repository already uses environment-based instance configuration.
- Assumption: none.
- Inference: one signup toggle fits a small self-hosted deployment without introducing roles.

### R24: Recover passwords according to instance capabilities

When SMTP is configured, users can request the normal email password-recovery flow. When SMTP is not
configured, the deployment documentation provides an infrastructure-level/manual reset procedure.
The product does not build a second in-app recovery mechanism.

Evidence:

- User decision: confirmed optional email recovery and documented manual fallback.
- Code evidence: Supabase Auth supports email recovery; production SMTP is not yet configured.
- Assumption: none.
- Inference: recovery must remain possible without making email a mandatory self-hosting dependency.

### R25: Project open-ended goals only when a preferred contribution exists

An open-ended goal may define a preferred amount per contribution. When present, the app uses the
goal's one-or-two-contributions-per-month frequency to estimate a completion month and pace status.
When absent, the goal shows funded, available, spent, target, remaining amount, and simulations, but
no invented completion estimate or pace status.

Evidence:

- User decision: confirmed optional preferred-contribution behavior for goals without a deadline.
- Code evidence: no projection implementation exists yet.
- Assumption: none.
- Inference: a preferred contribution supplies the missing time dimension without forcing a final
  date.

### R26: Keep currencies isolated by goal

Each goal has one currency. Different goals may use different currencies, but dashboard and summary
values are grouped by currency and never arithmetically combined. Each user may configure a default
currency for new goals. A goal's currency may change until its first financial transaction and is
immutable afterward.

Evidence:

- User decision: confirmed per-goal currencies, no cross-currency totals, user default currency, and
  locking after financial activity.
- Code evidence: no currency schema exists yet.
- Assumption: none.
- Inference: avoiding exchange rates keeps the product deterministic and self-contained.

### R27: Evaluate expected progress at month boundaries

Expected progress advances after each fully completed calendar month. A deadline identified by month
and year is due at the end of that month. For a twice-monthly goal, each completed month contributes
two expected contribution opportunities; for a monthly goal, it contributes one. Status does not
change at invented intra-month payday boundaries.

Evidence:

- User decision: confirmed month-boundary status evaluation.
- Code evidence: no projection implementation exists yet.
- Assumption: none.
- Inference: evaluating completed months is the deterministic counterpart to omitting exact paydays.

### R28: Delete erroneous contributions or withdrawals safely

A contribution or withdrawal may be permanently deleted after explicit confirmation. Before
deletion, the backend replays the remaining transactions chronologically and rejects the operation
if available money would become negative at any later point. No audit revision is retained.

Evidence:

- User decision: confirmed valid permanent deletion for contributions and withdrawals.
- Code evidence: no transaction persistence exists yet.
- Assumption: none.
- Inference: direct deletion matches personal-use correction needs while chronological replay
  protects later purchases and withdrawals.

### R29: Reject future real transactions

Contributions, withdrawals, purchases, and purchase undos may use today or an earlier effective
date, but never a future date. Future contribution amounts exist only in the temporary simulator and
never appear in financial history.

Evidence:

- User decision: confirmed that real financial transactions cannot be future-dated.
- Code evidence: no financial validation exists yet.
- Assumption: none.
- Inference: separating real and hypothetical money prevents misleading funded totals.

### R30: Edit planning fields with impact preview

Goal planning fields remain editable after financial activity: fixed target, start month, final
month, contributions per month, preferred contribution, and pending-item expected amount or due
month. Changes that affect target, deadlines, recommendation, or status show an impact preview
before confirmation and never rewrite financial history.

An item due month cannot precede the goal start month. When a goal has a final month, an item due
month cannot follow it.

Evidence:

- User decision: confirmed planning edits and deadline validation.
- Code evidence: no planning model exists yet.
- Assumption: none.
- Inference: planning facts can evolve independently from recorded money.

### R31: Handle real item-price overages explicitly

Purchasing above an item's expected amount requires enough available money. In an item-derived goal,
the actual amount immediately becomes part of the calculated target. In a fixed-target goal, the
target never changes silently; if current item amounts exceed it, the purchase preview requires the
user to keep the existing target or explicitly increase it to the item total.

Evidence:

- User decision: confirmed explicit handling for real prices above estimate.
- Code evidence: no purchase flow exists yet.
- Assumption: none.
- Inference: the existing fixed-versus-derived target distinction applies equally during purchase.

### R32: Treat an empty item-derived goal as incomplete setup

An item-derived goal with no items has no current target rather than a zero target. It displays an
`Add your first item` setup state and does not show percentage, pace status, recommendation, or
completion estimate. It may still receive contributions, which remain available until items are
added.

Evidence:

- User decision: confirmed the empty item-derived goal behavior.
- Code evidence: no empty-state implementation exists yet.
- Assumption: none.
- Inference: distinguishing an unknown target from zero prevents false `Fully funded` output.

## UX and Interaction Details

- Adding a contribution should request only amount by default; the current date is prefilled.
- Goal cards should prioritize total funded, target, remaining amount, and next required
  contribution.
- A goal with dated items may show its next cumulative funding deadline.
- An item-derived goal may show the next item currently affordable, but “ready to buy” is derived and
  not persisted as an item state.
- A simulation should be presented as an editable sequence of month-based contribution phases with a
  live comparison against the current projection.
- For an item-derived goal, the report should identify when an item becomes affordable while making
  clear that no purchase was simulated and available money was not automatically spent.
- Goal detail should initially contain only:
  - overview;
  - items when present;
  - financial history.
- The dashboard empty state explains the product and offers `Create your first goal`.
- An item-derived goal without items offers `Add your first item`.
- An empty financial history offers `Add contribution` as its primary action.
- Loading states use stable skeletons for goal lists and goal detail.
- Recoverable errors preserve entered form values and provide retry.
- Unavailable actions explain why they are disabled, including insufficient funds, locked currency,
  disabled registration, and invalid historical edits.
- Archive, permanent goal deletion, transaction deletion, item deletion, purchase undo, target-mode
  change, and fixed-target overage changes require explicit confirmation proportional to impact.
- Primary flows must work on mobile and desktop, with keyboard access, labels, visible focus, and
  non-color-only status communication.

## Data, State, API, and Permissions

Provisional minimal entities:

- `profiles`;
- `goals`;
- `goal_items`;
- `financial_transactions`.

Explicitly excluded from the initial model:

- tasks;
- checkpoint-item bridge;
- checkpoint achievements;
- financial snapshots;
- financial event revisions;
- activity events;
- simulation records.

All records are private to their owner, enforced by backend authorization and database isolation.
Monetary amounts use integer minor units. Current totals and status are derived on demand.

Supabase implementation constraints:

- enable RLS on every user-data table exposed through the Data API;
- ownership policies must compare the authenticated user ID with the row owner, not merely check the
  authenticated database role;
- update policies require both existing-row ownership and new-row ownership checks;
- privileged/service-role credentials never reach the web client.

Simulations introduce no database entity. They are calculated from the current goal snapshot plus a
temporary contribution schedule supplied by the client.

## Edge Cases

- A dated goal has no remaining contribution opportunities.
- Fixed-target dated items cumulatively exceed the final target.
- A contribution is edited to an amount or date that makes later purchases impossible.
- An item actual cost is higher than expected.
- An item is marked purchased without sufficient available goal money.
- An item price is edited after purchase.
- An item is removed after contributions or purchases exist.
- A withdrawal would consume money already spent on items.
- A contribution or withdrawal date edit makes a later purchase invalid.
- An item-derived goal has no items.
- An open-ended goal has no configured contribution amount.
- A simulation ends before a dated-item deadline or final target is reached.
- A simulation does not define contributions beyond its last phase.
- A twice-monthly simulation applies two equal hypothetical contributions per simulated month.
- A transaction is backdated before a later purchase.
- An item deadline or final deadline month is the current month.
- Several unpurchased items become individually affordable from the same unreserved balance.
- An item's future actual purchase price is unknown during a contribution-only simulation.
- A planning edit moves an item deadline before the goal start or after the final month.
- A real item price exceeds both its estimate and a fixed target's remaining allocation.
- An item-derived goal receives contributions before its first item is added.

## Acceptance Matrix

| Requirement | Acceptance Criteria                                                                         | Test/Validation              |
| ----------- | ------------------------------------------------------------------------------------------- | ---------------------------- |
| R1          | Fixed and item-derived goals can be created without unrelated planning fields.              | API/UI integration           |
| R2          | Editing a contribution updates history and all derived totals.                              | Domain and API tests         |
| R3          | A purchase moves available money to spent while funded remains unchanged.                   | Table-driven domain tests    |
| R4          | Japan derives an October cumulative funding deadline from the dated flights item.           | Scenario test                |
| R5          | One- or two-contributions-per-month recommendations are calculated deterministically.       | Table-driven unit tests      |
| R6          | Each status is derived from documented inputs and has a short explanation.                  | Table-driven unit tests      |
| R7          | Home-gym target equals the current sum of expected/actual item costs.                       | Scenario test                |
| R8          | Purchasing below estimate updates available, spent, target, and remaining amount.           | Transaction integration test |
| R9          | A multi-phase temporary schedule previews item-deadline and final outcomes without writes.  | Domain/UI test               |
| R10         | A withdrawal reduces funded and cannot exceed available money.                              | Domain/API test              |
| R11         | Undoing a purchase restores its full real amount and item state.                            | Transaction integration test |
| R12         | Purchased-item edits preserve valid totals and deletion is blocked until undo.              | API/UI test                  |
| R13         | Full funding changes the displayed state but never archives the goal automatically.         | Domain/UI test               |
| R14         | Invalid historical edits identify and preserve the first affected later transaction.        | Table-driven/API test        |
| R15         | Deleting a pending item recalculates the appropriate target and deadlines.                  | Domain/API test              |
| R16         | Switching target mode previews and changes planning values without changing money history.  | Domain/API/UI test           |
| R17         | Planning accepts month/year and calculates one or two opportunities per remaining month.    | Domain/UI test               |
| R18         | Transactions default to today and support valid historical dates.                           | API/UI test                  |
| R19         | All financial operation types appear in one filterable chronological history.               | UI/API test                  |
| R20         | One user cannot read or mutate another user's goals, items, or transactions.                | RLS/API integration test     |
| R21         | Unauthenticated users cannot access application data.                                       | Auth/API test                |
| R22         | Archive/restore preserves data and confirmed permanent deletion removes the full aggregate. | API/UI test                  |
| R23         | Disabling registration hides/rejects signup without affecting existing login.               | Config/auth test             |
| R24         | Configured SMTP enables email recovery and documentation covers no-SMTP reset.              | Auth/manual validation       |
| R25         | Open goals project only with a preferred contribution and otherwise omit time-based claims. | Domain/UI test               |
| R26         | Currencies lock after activity and no summary combines unlike currencies.                   | Domain/API/UI test           |
| R27         | Expected progress advances only after completed months and deadlines expire at month end.   | Table-driven domain test     |
| R28         | Valid transaction deletion succeeds and invalid deletion preserves all later history.       | API integration test         |
| R29         | Future financial dates are rejected while today and valid past dates are accepted.          | Contract/API test            |
| R30         | Planning edits preview impact, preserve financial history, and reject invalid month order.  | Domain/API/UI test           |
| R31         | Above-estimate purchases require available money and explicit fixed-target handling.        | Transaction/UI test          |
| R32         | Empty item-derived goals accept contributions but omit false target/projection output.      | Domain/UI test               |

## Assumptions

None.

## Open Questions

None.

## Decisions

- Iteration 1: remove tasks completely.
- Iteration 1: retain fixed-target and item-derived financial goals.
- Iteration 1: replace complex checkpoints with candidate simple monetary milestones.
- Iteration 1: keep editable contribution history without assuming audit-grade revisions.
- Iteration 1: retain saving guidance and a simplified status system.
- Iteration 1: reduce components to simple purchasable goal items.
- Iteration 2: allow several independent monetary milestones per goal.
- Iteration 2: compare actual funding with the mathematically expected funding by today.
- Iteration 2: require sufficient available goal money before purchasing an item.
- Iteration 2: include a narrowly scoped, temporary contribution-schedule simulation.
- Iteration 3: limit simulations to three sequential contribution phases.
- Iteration 3: keep simulations temporary and report-only.
- Iteration 3: include real purchased items in the simulation baseline and propose affordability
  reporting instead of automatic hypothetical purchases.
- Iteration 4: simulated item affordability is report-only; purchases remain explicit real actions.
- Iteration 5: allow withdrawals up to currently available money.
- Iteration 5: allow a full purchase undo without partial-return behavior.
- Iteration 5: purchased items remain editable in limited ways and cannot be deleted before undo.
- Iteration 6: milestone dates and amounts are cumulative and ordered.
- Iteration 6: goals have an editable start date defaulting to today.
- Iteration 6: reopened the item/milestone boundary because current milestones may be dated
  purchases rather than an independent domain concept.
- Iteration 7: remove the milestone entity and derive cumulative funding deadlines from item due
  dates.
- Iteration 7: allow items in both target modes.
- Iteration 7: fixed-target overages require an explicit keep-or-increase choice.
- Iteration 7: percentage item entry stores the calculated money amount, not a live formula.
- Iteration 8: full funding never closes or archives a goal automatically.
- Iteration 8: contribution and withdrawal edits must preserve non-negative chronological available
  money.
- Iteration 8: pending items may be deleted with confirmation and purchased items require undo
  first.
- Iteration 9: saving frequency is only one or two contributions per month, without payday or period
  configuration.
- Iteration 9: confirmed four status thresholds based on one recommended contribution of deviation.
- Iteration 9: allow target-mode switching with impact preview and no changes to financial history.
- Iteration 10: planning deadlines use month and year only.
- Iteration 10: real financial transactions retain defaulted, editable calendar dates.
- Iteration 10: show all financial operations in one chronological history with type filters.
- Iteration 11: corrected the installation model from single-owner to a small number of private
  authenticated users.
- Iteration 11: keep login and strict per-user ownership; shared goals remain out of scope.
- Iteration 11: use active/archive/restore plus explicitly confirmed permanent goal deletion.
- Iteration 12: use Supabase Auth email/password accounts.
- Iteration 12: control registration with an instance setting and no invitation/admin UI.
- Iteration 12: use SMTP recovery when configured and document a manual infrastructure fallback.
- Iteration 13: open-ended goals project only when an optional preferred contribution is configured.
- Iteration 13: allow one currency per goal, group summaries by currency, and never combine unlike
  currencies.
- Iteration 13: use a per-user default currency and lock goal currency after financial activity.
- Iteration 14: evaluate expected progress after completed calendar months and expire deadlines at
  month end.
- Iteration 14: allow confirmed deletion of valid contributions and withdrawals without audit
  revisions.
- Iteration 14: reject future-dated real financial transactions.
- Iteration 15: keep planning fields editable with impact preview and validate month ordering.
- Iteration 15: handle above-estimate purchases according to fixed or item-derived target mode.
- Iteration 15: treat an item-derived goal without items as incomplete setup while allowing
  contributions.

## Implementation Notes

- Do not implement while discovery is active.
- Do not update the current master PRD until the simplified requirements are confirmed.
- Favor aggregate queries over snapshots at personal-use scale.
- Favor reversal or validation rules only where they protect understandable money totals.
- Likely implementation areas:
  - `supabase/migrations`: four application tables, constraints, ownership, and RLS;
  - `packages/contracts`: goal, item, transaction, projection, and simulation validation;
  - `packages/domain`: money totals, chronological validation, target calculation, deadlines,
    status, recommendation, and simulation;
  - `packages/database`: typed repositories and explicit transaction boundaries;
  - `apps/api`: auth, ownership, mutations, previews, and aggregate responses;
  - `apps/web`: auth, dashboard, goal detail, item flows, money flows, history, and simulator.
- Required validation from repository guidance:
  - `pnpm install`;
  - `pnpm lint`;
  - `pnpm typecheck`;
  - `pnpm test`;
  - `pnpm build`;
  - `git diff --check`;
  - milestone-specific database, RLS, API, and end-to-end tests.

## Definition of Ready Check

- [x] Initial scope and non-goals captured.
- [x] Representative users and entry points identified.
- [x] Current repository state investigated.
- [x] Candidate entities and domain boundaries identified.
- [x] Status calculation baseline confirmed.
- [x] Milestone cardinality confirmed.
- [x] Purchase funding rule confirmed.
- [x] Simulation scope and interaction confirmed.
- [x] Withdrawal behavior confirmed.
- [x] Purchase correction behavior confirmed.
- [x] Purchased-item editing behavior confirmed.
- [x] Item availability by goal type confirmed.
- [x] Milestone amount semantics confirmed.
- [x] Goal start-date behavior confirmed.
- [x] Item versus milestone boundary confirmed.
- [x] Fixed-target item overage behavior confirmed.
- [x] Percentage-based item input behavior confirmed.
- [x] Fully-funded goal lifecycle confirmed.
- [x] Contribution and withdrawal edit validation confirmed.
- [x] Pending-item deletion behavior confirmed.
- [x] Contribution-frequency behavior confirmed.
- [x] Status thresholds confirmed.
- [x] Target-mode switching behavior confirmed.
- [x] Goal and item deadline precision confirmed.
- [x] Financial transaction date behavior confirmed.
- [x] History composition confirmed.
- [x] Installation user model confirmed.
- [x] Authentication requirement confirmed.
- [x] Goal deletion lifecycle confirmed.
- [x] Account credential method confirmed.
- [x] Registration control confirmed.
- [x] Password recovery behavior confirmed.
- [x] Open-ended goal pace behavior confirmed.
- [x] Multi-currency behavior confirmed.
- [x] Currency mutability and default confirmed.
- [x] Month-boundary status evaluation confirmed.
- [x] Contribution and withdrawal deletion behavior confirmed.
- [x] Future financial transaction behavior confirmed.
- [x] Remaining financial correction and lifecycle edge cases resolved.
- [x] Normal, empty, loading, error, disabled, destructive, mobile, and accessibility UX states
      identified.
- [x] Data, API, permissions, and Supabase RLS impacts identified.
- [x] Acceptance criteria and validation commands identified.
- [x] Final user confirmation received.
