# Goal Tracker Design References

This directory is the durable visual implementation baseline for Goal Tracker. Product behavior
comes from the canonical requirements; these references govern visual structure, hierarchy,
responsive composition, and interaction presentation.

## Provenance

- Source artifact: `GoalTracker Simplified MVP (offline).html`
- Source SHA-256: `5e375c60c88d497968a0f1e84e86b2fabf66fb97460b5af5de3bd82b8f7b42fe`
- Capture date: 2026-07-29
- Design: Graphite v2 refined
- Primary mobile frame: 390px
- Desktop boards: drawn at 1180px for an intended 1280px viewport
- Source HTML policy: ignored by Git and never used at build or runtime

Changing the source checksum does not silently replace this baseline. A new artifact requires an
explicit design decision, new captures, and updated provenance.

## How to use the references

1. Read the active milestone in `docs/GoalTracker_Implementation_Plan.md`.
2. Open every image linked by that milestone.
3. Read `GoalTracker_Design_System.md`.
4. Build generic controls from the configured shadcn/ui registry.
5. Compare the implementation at the documented mobile and desktop widths.
6. Include implementation screenshots in the PR and explain intentional deviations.

The screenshots crop to product surfaces where possible. Captions or notes outside a rounded mobile
frame are prototype annotations for implementers, not application copy.

## Current implementation evidence

M1 and M2 implementation captures produced by the real React application are stored separately
from the immutable design references:

- [M1 implementation captures](implementation/m1/)
- [M2 implementation captures](implementation/m2/)
- [M2.1 surface and state matrix](M2_1_Surface_Matrix.md)

These captures are evidence for comparison, not a new design source. A milestone is not visually
complete when this evidence is missing or stale.

## Milestone index

### M1 — Identity and isolation

| Reference | Artifact ID | States represented |
| --- | --- | --- |
| [Sign in](reference/m1/auth-sign-in.png) | A-01 | credentials, field error |
| [Create account](reference/m1/auth-create-account.png) | A-02 | account and default currency |
| [Registration disabled](reference/m1/auth-registration-disabled.png) | A-03 | deployment capability |
| [Password recovery](reference/m1/auth-password-recovery.png) | A-04 | email and manual recovery |
| [Account settings](reference/m1/account-settings.png) | S-01 | profile, currency, password, sign out |

### M2 — Goals and item planning

| Reference | Artifact ID | States represented |
| --- | --- | --- |
| [Welcome](reference/m2/onboarding-welcome.png) | O-01 | first use |
| [Create fixed goal](reference/m2/goal-create-fixed.png) | O-02 | fixed target form |
| [Create item-derived goal](reference/m2/goal-create-item-derived.png) | O-03 | item-derived form |
| [Incomplete setup](reference/m2/goal-incomplete-setup.png) | O-04 | no-item target state |
| [Active dashboard](reference/m2/dashboard-active.png) | D-01 | grouped currencies and statuses |
| [Dashboard states](reference/m2/dashboard-states.png) | D-02 | empty, loading, error, archive filter |
| [Goal items](reference/m2/goal-items.png) | G-02 | fixed and item-derived item modes |
| [Goal settings](reference/m2/goal-settings.png) | G-05 | editing and impact summary |
| [Planning decisions](reference/m2/planning-decisions.png) | P-04 | target mode and overage choices |
| [Goal lifecycle](reference/m2/goal-lifecycle.png) | X-01 | archive, restore, permanent delete |

### M3 — Financial ledger and history

| Reference | Artifact ID | States represented |
| --- | --- | --- |
| [Goal financial detail](reference/m3/goal-financial-detail.png) | G-01 | totals, progress, timeline, history |
| [Financial history](reference/m3/financial-history.png) | G-03 | filters, balances, corrections |
| [Add contribution](reference/m3/add-contribution.png) | F-01 | fast-path money sheet |
| [Result and withdrawal](reference/m3/contribution-result-withdrawal.png) | F-02 | success, failure, withdrawal |
| [Purchase and undo](reference/m3/purchase-undo.png) | F-04 | actual price, insufficient funds, undo |
| [Transaction correction](reference/m3/transaction-correction.png) | F-06 | edit, delete, replay rejection |

### M4 — Guidance and simulation

| Reference | Artifact ID | States represented |
| --- | --- | --- |
| [Guidance states](reference/m4/guidance-states.png) | P-01 | on track, no pace, fully funded |
| [Planning timeline](reference/m3/goal-financial-detail.png) | G-01 | current month, due items, final target |
| [Simulator](reference/m4/simulator.png) | G-04 | phases, validation, report, affordability |

### M5 — Product UX integration

M5 audits all references above and adds the wider compositions:

| Reference | Artifact surface | States represented |
| --- | --- | --- |
| [Desktop dashboard](reference/m5/desktop-dashboard.png) | D-01 desktop | rail, currency groups, two-up cards |
| [Desktop goal detail](reference/m5/desktop-goal-detail.png) | G-01 desktop | rail, sticky summary, items and history |

### M6 — Self-hosted release

| Reference | Artifact ID | States represented |
| --- | --- | --- |
| [Registration disabled](reference/m1/auth-registration-disabled.png) | A-03 | signup capability |
| [Password recovery](reference/m1/auth-password-recovery.png) | A-04 | mail capability |
| [Deployment information](reference/m6/deployment-information.png) | S-02 | version and deployment capabilities |

## Conformance rule

Match structure, hierarchy, density, spacing, color, typography, radii, and interaction choice
closely. A deviation is acceptable only when required by:

- canonical product behavior;
- real responsive content;
- WCAG 2.2 AA semantics or contrast;
- the installed shadcn primitive's correct accessible behavior.

Record the reason in the milestone PR. Personal preference is not a reason to redesign a mapped
surface.
