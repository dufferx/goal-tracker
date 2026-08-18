# M3 implementation evidence

These captures come from the current React application at the approved mobile reference widths.
They are comparison evidence; the immutable sources remain in `docs/design/reference/m3/`.

| Implementation capture | Reference | State |
| --- | --- | --- |
| [Dashboard navigation](dashboard-navbar.png) | `reference/m2/dashboard-active.png` | primary contribution action centered in mobile navigation |
| [Goal financial detail](goal-financial-detail.png) | `reference/m3/goal-financial-detail.png` | real totals, progress, items, recent history, mobile navigation |
| [Financial history](financial-history.png) | `reference/m3/financial-history.png` | kind/date filters and running available balance |
| [Add contribution](add-contribution.png) | `reference/m3/add-contribution.png` | prefilled contribution drawer |
| [Withdrawal](withdrawal.png) | `reference/m3/contribution-result-withdrawal.png` | withdrawal drawer and resulting available amount |
| [Purchase](purchase.png) | `reference/m3/purchase-undo.png` | actual price and insufficient-available state |
| [Transaction correction](transaction-correction.png) | `reference/m3/transaction-correction.png` | edit and delete actions |

## Intentional M3 boundaries

- Pace status, recommendations, the planning timeline, and simulator entry shown in the prototype
  belong to M4 and are deliberately absent.
- Real financial events use the shadcn Date Picker composition (Popover + Calendar) inside the
  Drawer rather than a native date input or prototype-only “Today” control.
- The financial detail prioritizes the funded summary once M4 guidance is removed. It does not add
  replacement explanatory copy.
- Generic UI uses installed shadcn primitives: Button, Input, Select, Card, Badge, Alert, Drawer,
  AlertDialog, Skeleton, and Progress. Goal Tracker adds only the approved financial composites.

The captures were reviewed at 390/392 px against their matching references. Focus, pending,
known-error, unknown-result reconciliation, insufficient funds, confirmation, empty history, and
destructive correction states are covered by implementation and automated tests.
