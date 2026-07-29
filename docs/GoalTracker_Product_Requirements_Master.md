# Goal Tracker — Product Requirements

**Status:** Approved simplified MVP
**Last updated:** 2026-07-29
**Authority:** This document is the source of truth for product behavior. It supersedes every earlier
product model, including tasks, standalone checkpoints, components, transfers, persistent
simulations, and snapshot-driven progress.

## 1. Product

Goal Tracker is a small, open-source, self-hosted web application for answering four questions:

1. How much money have I funded toward each goal?
2. How much remains available or has already been spent?
3. Am I contributing fast enough for the goal's plan?
4. When will a planned purchase become affordable under a hypothetical contribution plan?

The product is intentionally a goal and budget tracker. It is not a task manager, accounting
platform, banking integration, or project management system.

The initial reference cases are:

- a Japan trip with one or two monthly contributions and dated expenses such as flights and hotel;
- a home gym whose required amount is the sum of equipment prices and which has no final date.

## 2. Users and deployment

- The application supports multiple accounts even when a deployment has only a few users.
- Every user's goals, items, transactions, preferences, and derived results are private.
- Authentication uses Supabase email and password.
- Self-hosters decide whether public registration is enabled.
- Password recovery uses configured SMTP when available. A deployment without SMTP must document a
  manual administrator-assisted reset procedure; the UI must not promise email delivery.
- There are no shared goals, organizations, teams, roles, or admin UI in the MVP.
- English is the initial interface language. The data model must not prevent later localization.

## 3. Product scope

### Included

- create, edit, archive, restore, and permanently delete personal goals;
- fixed-target and item-derived goals;
- optional planned purchases or expenses inside any goal;
- one or two planned contributions per calendar month;
- contributions, withdrawals, purchases, purchase undo, and editable history;
- current totals, remaining amount, pace status, estimate, and explanation;
- temporary, contribution-only simulations with item-affordability reporting;
- responsive web experience;
- versioned self-hosted deployment plus infrastructure backup and restore documentation.

### Explicitly excluded

- tasks, subtasks, habits, completion points, or task-based progress;
- standalone milestone or checkpoint entities;
- paydays, pay periods, recurring transaction entities, or automatic deposits;
- transfers between goals;
- bank connections and financial-provider synchronization;
- shared goals, public profiles, admin roles, or admin dashboards;
- OAuth, native mobile apps, push notifications, or public APIs;
- persistent simulation scenarios;
- AI features;
- multiple currencies inside one goal or portfolio totals across currencies.
- offline writes, service workers, importable templates, CSV/app-level import or export, and
  application-level restore flows.

An excluded feature requires an explicit product-document revision before implementation.

## 4. Core concepts

### 4.1 Goal

A goal is the primary aggregate and belongs to one user. It contains:

- name and optional description;
- currency;
- target mode: `fixed` or `items`;
- target amount when fixed;
- planning start month;
- optional final month;
- planned contribution frequency: one or two contributions per calendar month;
- optional preferred amount per contribution;
- lifecycle state: active or archived.

Months are stored and displayed as month/year concepts. No artificial day, payday, or period entity
is created. Calculations use the first day of the month internally only as a canonical
representation.

Currency is editable until the first financial transaction and immutable afterward.

### 4.2 Goal item

An item is an optional planned purchase or expense inside any goal. Examples include a flight,
hotel, or dumbbell.

It contains:

- name;
- expected price;
- optional due month;
- stable display position.

An item with a due month supplies the same user need previously called a checkpoint: it represents
a cumulative amount that must be funded by a particular month. There is no separate checkpoint
entity or separate checkpoint progress.

For a fixed goal, items allocate or explain parts of the fixed budget:

- the user may enter an item directly as money;
- the UI may offer percentage input, but it immediately converts the percentage to a stored money
  amount;
- item prices are never maintained as live percentage formulas;
- if item prices exceed the target, the UI warns clearly and requires the user to keep the existing
  target or increase it. Either choice is valid.

For an item-derived goal, the current target is:

```text
sum(actual purchase price for purchased items)
+ sum(expected price for unpurchased items)
```

An item-derived goal with no items is an incomplete setup. It may receive contributions, but it has
no target, remaining amount, pace status, or completion state until an item exists.

### 4.3 Financial transaction

Financial transactions are the authoritative monetary history. Supported kinds are:

- `contribution`: adds available and funded money;
- `withdrawal`: removes available and funded money;
- `purchase`: removes available money, increases spent money, and references exactly one item;
- `purchase_undo`: reverses one purchase completely.

Current amounts are derived as:

```text
funded   = contributions - withdrawals
spent    = purchases - purchase_undos
available = funded - spent
```

For valid history, `funded`, `spent`, and `available` must never be negative at any point in the
chronological replay. A purchase is allowed only when enough money is available.

Purchasing does not reduce funded progress. It moves money from available to spent. In an
item-derived goal, the actual purchase price replaces that item's expected price, so the target may
increase or decrease.

## 5. Financial behavior

### 5.1 Recording

- A real transaction cannot have a future effective date.
- The default effective date is today and may be changed to a past date.
- Money is stored in integer minor units with two decimal places in the MVP.
- IDs are UUID v4 values.
- Every mutation is authorized and executed by the backend; the browser never inserts ledger rows
  directly.
- Retry protection relies on committed transaction state plus disabled/submitting UI controls. The
  MVP does not introduce an offline or idempotency subsystem.

### 5.2 Editing and correcting

- Contributions and withdrawals can be edited or deleted.
- A retroactive change is accepted only if replaying the full goal history still satisfies every
  monetary invariant.
- A real refund is a contribution or withdrawal correction appropriate to the real event; mistakes
  are corrected through the explicit edit/delete or purchase-undo flows.
- A purchased item cannot be deleted until its purchase has been undone.
- Undo reverses the entire purchase. Partial undo is outside the MVP.
- A purchase price may be corrected through the purchase edit flow if the full replay remains valid.

History ordering is deterministic:

1. effective date;
2. creation timestamp;
3. transaction ID.

The goal history is a single chronological list with kind and date filters. It must show edits and
purchase reversals clearly without exposing sensitive audit metadata.

## 6. Guidance and projection

### 6.1 Planning baseline

The user chooses one or two planned contributions per calendar month. This value controls how a
recommended monthly amount is presented:

```text
per-contribution recommendation = monthly recommendation / frequency
```

It does not restrict the number of real contributions the user may record.

### 6.2 Dated plan

Each due item produces a cumulative required amount by its due month. A final-month goal produces a
required total by that month. When several obligations share or overlap a month, their required
amounts are cumulative.

Guidance evaluates the next unfinished dated-item requirement; when none exists it evaluates the
final target. The baseline amount per contribution is the remaining required money divided by the
remaining contribution opportunities, using inclusive calendar months multiplied by the selected
one-or-two frequency. Past unmet obligations are reported as behind rather than divided over
negative or zero opportunities.

If an item is already purchased, its obligation is satisfied by its actual purchase. If it was
purchased after its due month, history remains truthful and the current recommendation uses the
remaining future obligations.

### 6.3 Open goals

A goal without any future due month or final month has no deadline-based required pace.

- If it has a preferred amount per contribution, show a forecast and guidance based on that
  preference and the one-or-two frequency.
- Without a preferred amount, show current totals and remaining money but no pace status or
  completion estimate.

### 6.4 Status

Status is computed only when there is enough planning information:

- `behind`: the relevant deadline month has ended without enough cumulative funding;
- `at_risk`: funded progress is at least one baseline contribution below expected progress;
- `ahead`: funded progress is at least one baseline contribution above expected progress;
- `on_track`: funded progress lies between the `at_risk` and `ahead` thresholds.

Expected progress is based on completed calendar months from the planning start month and the
current recommended contribution plan. One baseline contribution means the current recommended
per-contribution amount.

`fully_funded` is a separate completion condition, not another pace status. It is true when a valid
target exists and funded money is at least that target. Purchases do not make a funded goal
incomplete.

Every status or absent status must include a short explanation and a useful recommendation. The
projection engine has one public entry point returning calculations, status, explanation, and
recommendation together.

## 7. Temporary simulation

Simulation is an in-memory report. It never creates, updates, or purchases anything.

- The user may define up to three sequential future phases.
- Each phase specifies a number of calendar months and a hypothetical amount per contribution. The
  goal frequency applies that amount once or twice in each simulated month.
- The final phase may optionally continue until the next item deadline or the final target.
- Only contributions are simulated.
- The report shows projected funded and available money by month, expected target completion when
  calculable, and the month in which each unpurchased item becomes affordable.
- Affordability is informational. The simulation never assumes that an affordable item is bought
  and never reduces hypothetical available money for it.
- Closing or refreshing the simulation discards it.

Invalid duration, invalid money, non-sequential phases, or more than three phases is rejected.

## 8. Goal lifecycle

- Archive removes a goal from the default active list without altering its history.
- Restore returns an archived goal to the active list.
- Permanent deletion requires explicit confirmation and removes the aggregate according to the
  documented database cascade.
- Archived goals remain readable but cannot receive financial mutations until restored.

The dashboard groups totals by currency. It never sums unlike currencies.

## 9. Required user experience

The MVP has these primary surfaces:

1. authentication and account recovery;
2. active goals dashboard;
3. create/edit goal;
4. goal detail with summary, guidance, items, and recent history;
5. add/edit contribution or withdrawal;
6. purchase/undo item;
7. complete financial history;
8. temporary simulator;
9. archived goals;
10. profile and deployment-aware account settings.

Every user-facing flow needs loading, empty, success, error, and disabled states. Destructive actions
require confirmation. Forms must preserve user input after recoverable server errors.

The interface is mobile-first, keyboard usable, screen-reader meaningful, and does not communicate
status through color alone. Money always displays with its currency and dates follow the user's
locale while retaining month-level business semantics.

Planning changes that can alter target, deadlines, or guidance show an impact preview. Switching
target mode requires confirmation. A fixed-goal item or actual purchase price that exceeds the
current target requires the explicit keep-target or increase-target choice.

## 10. Acceptance examples

### Japan

A user creates a fixed USD 3,000 goal starting in July, ending next February, with two planned
contributions per month. They add USD 900 flights due in October and a USD 700 hotel. The app
includes the flight in the cumulative October requirement, recommends a monthly and per-contribution
amount, and updates guidance from real contributions. Purchasing the flight for USD 850 records
USD 850 spent, keeps funded money unchanged, and leaves the fixed target at USD 3,000.

### Home gym

A user creates an item-derived goal with no final month and adds equipment. The target equals the
sum of expected prices. When a USD 300 dumbbell set is purchased for USD 280, available money falls
by USD 280 and the target uses USD 280 for that item. With no due months or preferred amount, the
app shows totals but intentionally shows no pace status.

### Isolation

Two registered users can use the same deployment. Neither API calls nor direct database access
under their authenticated roles can read or mutate the other's profiles, goals, items, or ledger.

## 11. Requirement traceability

The approved discovery requirements are retained in `feature-requirements.md`. This document
incorporates all of them:

| Requirement | Canonical section |
|---|---|
| R1 Manage simple financial goals | 4.1 Goal |
| R2 Record and correct contributions | 5 Financial behavior |
| R3 Show understandable money totals | 4.3 Financial transaction |
| R4 Derive cumulative deadlines from dated items | 4.2 Goal item; 6.2 Dated plan |
| R5 Calculate guidance from contribution frequency | 6.1–6.2 Planning and dated plan |
| R6 Show a small explainable status | 6.4 Status |
| R7 Manage items in both target modes | 4.2 Goal item |
| R8 Purchase an item using goal funds | 4.3 and 5 Financial behavior |
| R9 Preview a temporary contribution schedule | 7 Temporary simulation |
| R10 Withdraw available goal money | 4.3 and 5 Financial behavior |
| R11 Undo an item purchase | 5.2 Editing and correcting |
| R12 Edit a purchased item safely | 5.2 Editing and correcting |
| R13 Keep fully funded goals under user control | 6.4 Status; 8 Lifecycle |
| R14 Validate history after edits | 5.2 Editing and correcting |
| R15 Delete pending items with confirmation | 5.2 Editing and correcting; 9 UX |
| R16 Switch target mode with impact confirmation | 9 Required UX |
| R17 Use month-level deadlines | 4.1 Goal; 6.2 Dated plan |
| R18 Date real financial transactions | 5.1 Recording |
| R19 Show one financial history | 5.2 Editing and correcting |
| R20 Isolate a small number of users | 2 Users and deployment |
| R21 Require authentication | 2 Users and deployment |
| R22 Archive, restore, or permanently delete | 8 Goal lifecycle |
| R23 Control registration at deployment level | 2 Users and deployment |
| R24 Recover passwords by instance capability | 2 Users and deployment |
| R25 Project open goals only with a preference | 6.3 Open goals |
| R26 Keep currencies isolated by goal | 4.1 Goal; 8 Lifecycle |
| R27 Evaluate progress at month boundaries | 6.4 Status |
| R28 Delete erroneous contributions/withdrawals safely | 5.2 Editing and correcting |
| R29 Reject future real transactions | 5.1 Recording |
| R30 Edit planning fields with impact preview | 9 Required UX |
| R31 Handle real item-price overages explicitly | 4.2 Goal item; 9 UX |
| R32 Treat an empty item-derived goal as incomplete | 4.2 Goal item |

If the discovery record and this document differ, this document governs. A product change must
update this file first, then the architecture and implementation plan.
