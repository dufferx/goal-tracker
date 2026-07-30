# M2.1 Surface and State Matrix

This matrix maps the immutable Graphite references to current React implementation evidence. The
development-only `__design` fixture selector supplies deterministic data without changing
production dependencies or product behavior.

| Milestone | Surface/state | Reference | Implementation evidence | Viewport |
| --- | --- | --- | --- | --- |
| M1 | Sign in | `reference/m1/auth-sign-in.png` | `implementation/m1/auth-sign-in.png` | 392px |
| M1 | Create account | `reference/m1/auth-create-account.png` | `implementation/m1/auth-create-account.png` | 390px |
| M1 | Registration disabled | `reference/m1/auth-registration-disabled.png` | `implementation/m1/auth-registration-disabled.png` | 390px |
| M1 | Password recovery | `reference/m1/auth-password-recovery.png` | `implementation/m1/auth-password-recovery.png` | 390px |
| M1 | Account settings | `reference/m1/account-settings.png` | `implementation/m1/account-settings.png` | 392px |
| M2 | Welcome | `reference/m2/onboarding-welcome.png` | `implementation/m2/onboarding-welcome.png` | 392px |
| M2 | Fixed goal creation | `reference/m2/goal-create-fixed.png` | `implementation/m2/goal-create-fixed.png` | 392px |
| M2 | Item-derived creation | `reference/m2/goal-create-item-derived.png` | `implementation/m2/goal-create-item-derived.png` | 390px |
| M2 | Active dashboard | `reference/m2/dashboard-active.png` | `implementation/m2/dashboard-active.png` | 392px |
| M2 | Incomplete setup | `reference/m2/goal-incomplete-setup.png` | `implementation/m2/goal-incomplete-setup.png` | 390px |
| M2 | Empty/loading/error dashboard | `reference/m2/dashboard-states.png` | `implementation/m2/dashboard-empty.png`, `implementation/m2/dashboard-loading.png`, `implementation/m2/dashboard-error.png` | 390px |
| M2 | Goal items | `reference/m2/goal-items.png` | `implementation/m2/goal-items.png` | 390px |
| M2 | Goal settings | `reference/m2/goal-settings.png` | `implementation/m2/goal-settings.png` | 392px |
| M2 | Planning decisions | `reference/m2/planning-decisions.png` | `implementation/m2/planning-decisions.png`, `implementation/m2/planning-mode-change.png` | 390px |
| M2 | Lifecycle | `reference/m2/goal-lifecycle.png` | `implementation/m2/goal-lifecycle.png`, `implementation/m2/lifecycle-archive-dialog.png`, `implementation/m2/lifecycle-delete-dialog.png` | 390px |

## Future-state exclusions

M2 captures intentionally omit funded progress, pace status, contribution/purchase actions,
financial history, and simulation. These belong to M3/M4 and may not be faked for visual parity.

## Accepted implementation choices

- Generic controls use installed shadcn/Radix primitives.
- `MoneyInput` is an approved Goal Tracker domain composite around shadcn Input.
- Mobile item editing uses shadcn Sheet; destructive confirmation uses AlertDialog.
- Separate captures represent compound reference boards when one production screen cannot honestly
  show all states simultaneously.
