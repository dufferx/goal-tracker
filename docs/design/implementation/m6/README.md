# M6 managed deployment implementation evidence

**Status:** Implemented
**Capture date:** 2026-08-17

## Scope and fixtures

- Mobile capture uses a 390×844 viewport; desktop capture uses 1280×900.
- Captures come from the real React application with deterministic development-only `__design`
  fixtures (`/settings?__design=active`).
- The surface covered is settings with the "About this deployment" card from
  `docs/design/reference/m6/deployment-information.png`: release version, registration
  capability, password-reset capability, and the backups note.
- The release version shown in the fixture (`1.0.0`) matches the release notes; live deployments
  render the `APP_VERSION` configured on the API.

## Conformance notes

- The version value moved from a hardcoded placeholder to the `version` field of
  `GET /api/v1/capabilities`, so the card always reflects the running release.
- No other visual change: the card composition, hierarchy, and tokens match the accepted M1/M5B
  settings surfaces.
