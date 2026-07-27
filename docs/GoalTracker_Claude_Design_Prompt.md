# Prompt for Claude Design — Goal Tracker Web/PWA

You are the lead product designer for Goal Tracker, a self-hosted personal financial-goal planning app.

Your job is to design the complete responsive web/PWA experience. Do not change business rules. The design must express the product model clearly and make financial planning feel calm, understandable, and actionable.

## Product concept

Goal Tracker helps users manage separate financial goals such as:

- a trip to Japan;
- building a home gym;
- an emergency fund;
- a large purchase.

The core questions are:

- How much progress have I made?
- Am I on track?
- How much should I save this period?
- What is the next critical checkpoint?
- What should I do next?

## Core metrics

Use these exact concepts:

- Available
- Invested
- Funded
- Historical contributions

The main progress metric is `Funded`.

## Goal structure

A goal may contain:

- target;
- optional final date;
- checkpoints;
- components;
- tasks;
- financial events;
- projections;
- simulations;
- activity timeline.

Components have two types:

1. One-time purchase
2. Budget

Checkpoints distinguish:

- historical achievement;
- current coverage;
- component completion.

## Tranquility states

- Ahead
- On track
- Tight
- At risk
- Late

Every state must include an explanation.

## Main design principle

The product should prioritize:

1. tranquility status;
2. next recommended action;
3. critical checkpoint;
4. progress;
5. supporting financial details.

Do not design this as a generic budgeting dashboard.

## Required screens

### Authentication

- sign up;
- sign in;
- password recovery.

### Dashboard

Include:

- goal cards;
- tranquility;
- next action;
- progress;
- next/critical checkpoint;
- recommended contribution;
- secondary global summary;
- sorting by manual order, priority, urgency, risk;
- archived goals entry point.

### Goal creation

- template selection;
- quick create;
- finish setup now / later;
- templates:
  - simple savings;
  - trip;
  - component project;
  - continuous fund.

### Goal detail

Header should surface:

- tranquility;
- next action;
- funded progress;
- available;
- invested;
- target;
- minimum contribution;
- ideal contribution.

Sections:

- overview;
- roadmap/checkpoints;
- components;
- tasks;
- activity;
- simulations.

### Financial actions

A global action button with:

- Add contribution first;
- Withdrawal;
- Transfer;
- Purchase component;
- Record budget expense;
- Note.

Adding a contribution should ask only for amount initially.

### Components

One-time purchase:

- planned;
- saving;
- ready to buy;
- purchased;
- cancelled.

Budget:

- planned;
- in use;
- completed;
- cancelled;
- show estimated, spent, remaining.

### Checkpoints

Desktop:

- timeline-oriented view.

Mobile:

- clear vertical list.

Each checkpoint displays:

- name;
- date;
- required amount;
- current coverage;
- historical achievement;
- component completion;
- tranquility;
- shortfall;
- recommended contribution.

### Simulations

Design a clear “what if” workspace:

- change contribution;
- change date;
- change target;
- change component cost;
- cancel component;
- compare current vs simulated;
- apply only after explicit confirmation.

### Activity timeline

Filters:

- Money
- Purchases
- Goal
- Organization

### Completion

- celebration;
- planned vs actual date;
- time gained/lost;
- funded;
- invested;
- budget variance;
- surplus resolution;
- close confirmation.

### Archived and trash

- archived goals section;
- trash with restore;
- permanent delete confirmation requiring goal name.

### Offline states

- cached/offline indicator;
- pending deposit;
- syncing;
- synced;
- failed;
- needs review.

## Responsive requirements

Design both:

- desktop;
- mobile.

The mobile version must feel like a native personal-finance app, not a compressed desktop page.

## Visual direction

- calm;
- trustworthy;
- modern;
- spacious;
- highly legible;
- financially serious without looking corporate;
- use shadcn/ui-friendly patterns;
- avoid excessive gradients, glassmorphism, gamification, and dense dashboards.

Use color to support tranquility, but never rely on color alone.

## Accessibility

Include:

- strong contrast;
- keyboard-friendly controls;
- visible focus states;
- readable status labels;
- icons plus text;
- touch-friendly targets.

## Deliverables

Provide:

1. information architecture;
2. navigation model;
3. desktop wireframes;
4. mobile wireframes;
5. high-fidelity screens;
6. component inventory;
7. interaction notes;
8. empty states;
9. loading states;
10. error states;
11. warning/confirmation patterns;
12. responsive behavior;
13. design tokens;
14. implementation notes for React + shadcn/ui.

## Screens to prioritize first

1. Dashboard
2. Goal detail
3. Add contribution
4. Goal creation
5. Checkpoint roadmap
6. Components
7. Simulation
8. Completion summary

## Important constraints

- Do not invent collaborative goals.
- Do not add bank connections.
- Do not add AI chat to the MVP.
- Do not add push notifications.
- Do not add admin UI.
- Do not alter formulas or business rules.
- Do not hide important financial consequences behind decorative UI.
- Keep the primary action obvious.

Design the system so the user can understand “Am I okay?” within a few seconds of opening the app.
