# M5B quality implementation evidence

**Status:** Implemented — visually accepted
**Capture date:** 2026-08-04
**Acceptance date:** 2026-08-04

## Scope and fixtures

- Mobile captures use a 390×844 viewport; desktop captures use 1280×900.
- Captures come from the real React application with deterministic development-only `__design`
  fixtures.
- The set covers authentication, dashboard, archives, goal creation, goal detail, item management,
  history, simulator, settings, contribution, and purchase surfaces.
- Refresh the complete set with
  `CAPTURE_M5B=1 pnpm exec playwright test tests/e2e/captures.spec.ts` while local Supabase is
  running.

## Quality audit

- Preserved the mobile compositions accepted in M5A and the accepted responsive desktop layouts.
- Added a keyboard-visible skip link and a stable main-content target.
- Corrected selected-state semantics, status announcements, error announcements, and specific item
  purchase labels without relying on color alone.
- Enabled shadcn Drawer focus containment and consistent focus restoration for controlled shadcn
  Drawer and Dialog overlays.
- Raised tertiary-text contrast in both themes to meet WCAG AA on its normal surfaces. This is the
  only intentional visual deviation from M5A.
- Kept reduced-motion behavior in the shared design-system stylesheet.

## Accessibility evidence

- Automated axe coverage checks authentication and every primary route plus loading, empty, error,
  contribution Drawer, and purchase Drawer states. Color contrast is excluded only in jsdom and is
  validated against the documented token pairs in the browser audit.
- The Playwright keyboard pass verifies the first-tab skip link, activation of the main-content
  target, keyboard opening of contribution overlays, focus containment, Escape dismissal, and focus
  return on both mobile and desktop.
- Manual browser keyboard pass covered sign-in, dashboard navigation, goal opening, contribution,
  purchase, history, simulator, and settings. Tab/Shift+Tab order was coherent, focus rings stayed
  visible, Enter/Space activated controls, Escape dismissed overlays, and focus returned to the
  invoking control. Statuses retained text labels, and reduced-motion mode removed nonessential
  transition duration.

## End-to-end and reliability evidence

- Real-stack Playwright journeys cover Japan Trip with a dated purchase and Home Gym with an
  item-derived target on both mobile and desktop.
- Recoverable financial errors retain amount/date input; ambiguous financial responses reconcile
  goal detail and history before another submission is enabled.
- Success feedback remains visible after reconciliation on both contextual and dashboard
  contribution flows.
- Financial mutations now assign a timestamp strictly after the locked aggregate history when the
  application clock has not advanced. This preserves effective-date/creation-time/ID replay order
  and prevents an undo from sorting before the purchase it references.

## Database compatibility

Migration `20260804194142_grant_service_role_application_tables.sql` explicitly grants application
table privileges to `service_role`. This supports current Supabase Data API defaults and trusted
integration/administrative access without granting browser writes to `anon` or `authenticated`.
RLS remains enabled, and local Supabase security/performance advisors report no issues.

## Bundle audit

Route-level lazy loading reduced the initial production JavaScript from 852.55 kB (239.85 kB gzip)
to 553.26 kB (160.02 kB gzip), approximately 35%. Goal creation, detail, financial history/actions,
and simulator code now load on demand. The remaining Vite size warning is recorded for M6 rather
than introducing broader dependency or architecture changes in M5B.

## shadcn/ui provenance

All generic controls continue to use the configured shadcn primitives. M5B changes shared shadcn
Dialog and Drawer wrappers for focus behavior; it does not introduce hand-rolled replacements or a
new visual direction.

## Gate

The complete repository validation passed, and the user explicitly accepted the final mobile and
desktop capture set on 2026-08-04. The M5B visual gate is closed.
