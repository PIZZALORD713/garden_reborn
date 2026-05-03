# fRiENEMiES Kanban Operating Model

_Last updated: 2026-05-03_

This model defines how to run the fRiENEMiES roadmap board from `PIZZALORD713/garden_reborn` issues.

## Board

Target board: `fRiENEMiES Roadmap` in GitHub Projects v2.

Issues are the source of truth. The project board is the planning view over those issues.

## Cadence

- Cycle length: 6 weeks.
- Current milestones:
  - `Cycle 01 - Foundation Audit and Board Bootstrap`, due 2026-06-14.
  - `Cycle 02 - Studio Reliability and Blender Contract`, due 2026-07-26.
  - `Cycle 03 - Render Packs and Scene Direction`, due 2026-09-06.
- Every cycle starts with source/priority review and ends with verification notes.

## Project Fields

- `Status`: Inbox, Fact Finding, Ready, In Progress, Review, Blocked, Done.
- `Track`: Studio, Blender, Animation, Agent Identity, Web3, Ecosystem, Ops.
- `Horizon`: Now, Next, Later, Someday.
- `Priority`: P0, P1, P2, P3.
- `Source`: Context Pack, Garden Reborn, Local Blender, Agent Vault, Legacy DApp, New Idea.

## Labels

Use labels as repo-portable metadata even when project fields exist.

- Tracks: `track:studio`, `track:blender`, `track:animation`, `track:agent-identity`, `track:web3`, `track:ecosystem`, `track:ops`.
- Types: `type:research`, `type:feature`, `type:qa`, `type:docs`, `type:decision`.
- Priorities: `priority:p0`, `priority:p1`, `priority:p2`.
- Sources: `source:context-pack`, `source:garden-reborn`, `source:local-blender`, `source:agent-vault`, `source:legacy-dapp`.
- Risks/blockers: `risk:ip-legal`, `blocked`.

## Issue Template Rules

Every roadmap issue should include:

- `Goal`: one paragraph explaining why the work matters.
- `Grounding Sources`: links or paths to the evidence behind the issue.
- `Acceptance Criteria`: observable completion checks.
- `Definition of Done`: final handoff standard.

P0 and P1 issues must also include a source label and at least one acceptance criterion that can be verified without guessing.

## Guardrails

- Do not imply fRiENEMiES is official FriendsWithYou work.
- Do not promise commercial rights, guaranteed rewards, guaranteed value, or finalized claim mechanics.
- Treat Web3 claim/inventory items as research until separately approved.
- Keep Studio + Blender delivery ahead of broader ecosystem expansion.

## Seed Issues

- [#59](https://github.com/PIZZALORD713/garden_reborn/issues/59) P0: Fact-finding source map for all fRiENEMiES artifacts
- [#60](https://github.com/PIZZALORD713/garden_reborn/issues/60) P0: Refresh canonical fRiENEMiES strategy from context pack plus current repo evidence
- [#61](https://github.com/PIZZALORD713/garden_reborn/issues/61) P0: Finish garden_reborn slice-057 verification pass
- [#62](https://github.com/PIZZALORD713/garden_reborn/issues/62) P0: Triage open PRs #56 and #57 before new Studio UI work
- [#63](https://github.com/PIZZALORD713/garden_reborn/issues/63) P1: Define Studio-to-Blender contract for token manifests, face overlays, animations, and GLB export
- [#64](https://github.com/PIZZALORD713/garden_reborn/issues/64) P1: Promote the local Blender scene pipeline into the roadmap as the scene-generation track
- [#65](https://github.com/PIZZALORD713/garden_reborn/issues/65) P1: Specify Static Avatar Render Pack V1 for agent identity outputs
- [#66](https://github.com/PIZZALORD713/garden_reborn/issues/66) P1: Harden animation pack validation against skeleton contract rules
- [#67](https://github.com/PIZZALORD713/garden_reborn/issues/67) P2: Research Web3 holder verification, claim, chain, and inventory mechanics without implementing contracts
- [#68](https://github.com/PIZZALORD713/garden_reborn/issues/68) P2: Scope collector and AI identity pages as a later product track
- [#69](https://github.com/PIZZALORD713/garden_reborn/issues/69) P2: Map gm.pizza and broader ecosystem ideas as non-blocking long-term opportunities
