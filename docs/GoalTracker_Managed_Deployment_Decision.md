# Goal Tracker — Managed Deployment Decision

**Status:** Accepted
**Date:** 2026-08-17
**Authority:** Architecture decision record. It governs deployment and operations narrative in the
canonical documents and redefines the M6 milestone scope.

## Context

Goal Tracker is approaching M6, the release milestone, with the web SPA, Fastify API, Supabase
migrations, RLS, and Auth already implemented and tested. The product is operated for the owner's
personal use with a small number of users. The original plan made a fully self-hosted Docker
Compose stack (including self-hosted Supabase) the reference deployment and the focus of M6
hardening. That stack is heavy to operate for a personal deployment: a reverse proxy, own TLS, own
backup/restore rehearsals, and deliberate upgrades of a pinned Supabase self-hosting image set.

## Decision

The reference deployment is a managed stack:

- **Web:** Vercel serves the static Vite SPA; public configuration is supplied through build-time
  `VITE_*` variables.
- **API:** the existing `apps/api/Dockerfile` runs as a Docker container on Render or Railway; M6
  adds a production start command.
- **Database and Auth:** Supabase Cloud; migrations are applied with `supabase db push`; RLS and
  Auth are already implemented and tested.

Self-hosting with Docker Compose and self-hosted Supabase remains a supported, documented option,
kept as an appendix without additional MVP hardening. It is no longer the reference deployment.

## Alternatives considered

- **All-Vercel serverless:** the API would need re-platforming onto serverless functions, breaking
  the single Fastify application and its explicit transaction boundaries for no product gain.
- **Full self-host as reference:** highest reproducibility and data control, but the largest
  operational burden for a personal deployment (TLS, backups, gateway upgrades).
- **Hybrid Vercel web + VPS for API and Supabase:** keeps one server to secure, patch, back up, and
  monitor; strictly more work than the managed stack without better isolation than Supabase Cloud.

## Consequences

- M6 changes from "self-hosted release" to "managed deployment and release hardening": production
  API start command, environment validation, public/server variable separation, request IDs and
  non-sensitive structured logs, operator documentation for the managed stack, release notes, an
  operator checklist, and a deployed-environment smoke test. The self-hosted backup/restore
  rehearsal moves to the documented self-hosted option and is no longer the reference path.
- Application data resides in Supabase Cloud rather than on the operator's own hardware.
- Supabase Cloud free-tier projects pause after inactivity; the operator documentation must state
  this and the available paid-plan or keep-alive mitigations.
- The single-command reproducibility of Docker Compose is lost for the reference path; the compose
  stack remains for local development and the documented self-hosted option.
- TLS, domains, and database backups are delegated to the platforms; restore capabilities follow
  the Supabase Cloud plan.
- Self-hosted notes (image pinning, reverse proxy, own TLS, own backup/restore, self-hosted
  Supabase breaking-change review) are retained in the architecture document and identity
  operations guide for operators who choose that option.
