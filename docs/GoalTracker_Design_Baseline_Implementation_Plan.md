# Implementation Plan: Design Implementation Baseline

## Source Requirements

- `docs/GoalTracker_Design_Baseline_Requirements.md`

## Repo Rules Applied

- D1 follows D0 and precedes M1.
- This phase changes documentation, reference images, and shared presentation tokens only.
- The ignored offline HTML is capture input, never a committed source or runtime dependency.
- Product requirements override a screenshot if any conflict is found.
- Generic interaction primitives come from the configured shadcn/ui registry.
- Domain composites contain presentation only; authoritative rules remain outside `packages/ui`.
- Existing unrelated working-tree changes are preserved.

## Scope

Create the durable Graphite v2 visual baseline, integrate it into milestone execution guidance, and
make shared tokens executable before product feature implementation.

## Requirement Traceability

| Requirement | Implementation step(s) | Validation |
| --- | --- | --- |
| R1 | 1, 2 | Canonical sequence and branch references |
| R2 | 3 | PNG inventory and visual inspection |
| R3 | 2, 4 | Milestone link review |
| R4 | 5 | CSS inspection, typecheck, build |
| R5 | 4 | Design guide review |
| R6 | 4 | Composite allowlist review |
| R7 | 4 | Design-system checklist |
| R8 | 2, 4 | Milestone exit-criteria review |
| R9 | 3, 4 | `git check-ignore`, checksum and provenance |

## Patch-Oriented Plan

1. Close and register D1 requirements.
   - Requirement(s): R1
   - Change: mark requirements closed and add this implementation plan.
   - Do not change: product behavior or M1–M6 business scope.
   - Validation: requirements Definition of Ready and `git diff --check`.

2. Integrate D1 into canonical delivery guidance.
   - Requirement(s): R1, R3, R8
   - Change:
     - add D1 to the canonical sequence, Git strategy, concise prompts, master prompt, and AGENTS;
     - add a `Design references` subsection and visual-conformance acceptance criteria to every
       UI-producing milestone;
     - clarify that M5 integrates and audits rather than first styling the product.
   - Do not change: milestone ownership of backend or product behavior.
   - Validation: link checks and sequence search.

3. Capture and version the visual reference set.
   - Requirement(s): R2, R9
   - Change:
     - extract product surfaces from the approved local HTML using Chromium;
     - save stable PNG files under `docs/design/reference/m1` through `m6`;
     - record source filename, SHA-256, capture date, IDs, dimensions, and ownership.
   - Do not change: the ignored HTML or its runtime status.
   - Validation: open every image, verify dimensions/non-empty content, compare representative
     mobile and desktop references with the artifact.

4. Create the design-system and reference documentation.
   - Requirement(s): R3, R5, R6, R7, R8, R9
   - Change:
     - create `docs/design/README.md` as the visual-reference index;
     - create `docs/design/GoalTracker_Design_System.md` for tokens, surfaces, typography,
       components, responsive behavior, accessibility, copy, and implementation constraints;
     - require shadcn registry primitives before custom controls;
     - document the approved domain-composite allowlist and deviation process.
   - Do not change: business rules or introduce speculative UI components.
   - Validation: documentation checklist and Markdown links.

5. Make Graphite v2 tokens executable.
   - Requirement(s): R4
   - Change:
     - replace placeholder shared colors and Inter stack in
       `packages/ui/src/styles/globals.css`;
     - expose dark/default and light semantic values, status colors, fonts, numeric styling, radii,
       shadows, motion, and layout measurements;
     - keep aliases compatible with shadcn and Tailwind.
   - Do not change: feature components or install unused primitives.
   - Validation: lint, typecheck, tests, build, and visual smoke check.

6. Validate D1 as a repository baseline.
   - Requirement(s): R1–R9
   - Change: no additional scope; fix only failures found by validation.
   - Validation:
     - `pnpm install`;
     - `pnpm lint`;
     - `pnpm typecheck`;
     - `pnpm test`;
     - `pnpm build`;
     - `git diff --check`;
     - image inventory and Markdown-link checker;
     - `git check-ignore` for the source HTML.

## Files and Modules

- `AGENTS.md`
- `docs/GoalTracker_Design_Baseline_Requirements.md`
- `docs/GoalTracker_Design_Baseline_Implementation_Plan.md`
- `docs/GoalTracker_Implementation_Plan.md`
- `docs/GoalTracker_Milestones_and_Git_Strategy.md`
- `docs/GoalTracker_Codex_Milestone_Prompts.md`
- `docs/GoalTracker_Codex_Master_Prompt.md`
- `docs/design/README.md`
- `docs/design/GoalTracker_Design_System.md`
- `docs/design/reference/m1/*.png`
- `docs/design/reference/m2/*.png`
- `docs/design/reference/m3/*.png`
- `docs/design/reference/m4/*.png`
- `docs/design/reference/m5/*.png`
- `docs/design/reference/m6/*.png`
- `packages/ui/src/styles/globals.css`

## Testing and Validation

- Visual: inspect every captured PNG and compare representative screens with the source.
- Structural: verify every mapped image exists and every milestone link resolves.
- UI foundation: run the full repository commands because shared CSS affects the web build.
- Scope: confirm no application feature code, migrations, or dependencies changed.

## Plan Critique

- Requirements without implementation steps: none.
- Implementation steps without requirements: none.
- Risks not covered: font delivery may need an explicit self-hosted or package decision.
- Scope-creep risk: pre-installing all shadcn primitives or building feature composites in D1.
- Test gaps: no automated screenshot-diff system; D1 establishes references and manual comparison.

## Risks and Mitigations

- PNG repository size: capture individual product surfaces and avoid full-board duplicates.
- Artifact drift: record SHA-256 and require explicit approval before recapture from another source.
- Screenshot annotations mistaken for product UI: crop to screen surfaces and document nested states.
- Pixel matching harms accessibility: require documented deviations where WCAG or real responsive
  content needs them.
- Custom component proliferation: maintain a closed domain-composite allowlist.

## Rollback

Revert D1 documentation, PNG assets, and shared token changes together. M1 must not use a partially
reverted baseline. The ignored source HTML remains untouched and can be used to regenerate the same
assets while its checksum matches.
