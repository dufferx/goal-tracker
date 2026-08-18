# M4 visual acceptance

Status: **accepted** on 2026-07-31 after direct comparison at the 390px mobile baseline.

## Evidence

| Implemented surface | Compared with | Result |
| --- | --- | --- |
| [Japan Trip — on-track guidance](goal-guidance-on-track.png) | `reference/m4/guidance-states.png` and `reference/m3/goal-financial-detail.png` | Accepted |
| [Home Gym — open-goal forecast](open-goal-forecast.png) | `reference/m4/guidance-states.png` and `reference/m3/goal-financial-detail.png` | Accepted |
| [Japan Trip — funded item milestone](funded-item-milestone.png) | `reference/m3/goal-financial-detail.png` | Accepted |
| [Temporary simulator report](simulator-report.png) | `reference/m4/simulator.png` | Accepted |

The captures come from the real React application through the development-only `__design`
fixtures. They cover the guidance hierarchy, recommendation CTA, planning metrics, timeline,
multi-phase simulator, continuation switch, affordability report, and month-by-month output.

## Conformance notes

- Guidance is the dominant content at the top of goal detail, with one contribution action row.
- A funded or purchased due item remains visible as a completed timeline milestone after guidance
  advances to the next obligation.
- The planning timeline uses the backend-provided guidance month; it does not infer business state
  from the browser clock.
- The simulator remains temporary and informational. Its affordability dates do not create
  purchases or alter the ledger.
- Home Gym intentionally demonstrates a once-monthly plan while the reference demonstrates a
  twice-monthly plan. Frequency is user data, and the same UI supports both.
- Goal items remain visible below the timeline because they are a core product surface already
  delivered in M2/M3. The reference crop omits them but does not prohibit them.
- The centered circular contribution action is retained from the explicitly approved M3 mobile
  navigation instead of restoring the older wide navigation action shown in the reference.

## Component compliance

Generic controls use the shared shadcn/ui implementations: `Button`, `Card`, `Progress`, `Alert`,
`Input`, and `Switch`. `GuidanceCard` and `PlanningTimeline` are Goal Tracker domain composites;
they contain no authoritative financial or projection rules.

## Gate checklist

- [x] 390px hierarchy, spacing, typography, color, borders, and radii compared visually.
- [x] On-track and open-goal forecast states are deterministic and reproducible.
- [x] Simulator phases and complete report are deterministic and reproducible.
- [x] No duplicate contribution CTA on goal detail.
- [x] No horizontal overflow (`documentElement.scrollWidth === innerWidth === 390`).
- [x] Visual deviations are documented above.
