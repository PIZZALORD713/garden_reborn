# fRiENEMiES Source Map

_Last updated: 2026-05-04_

This is the canonical evidence map for the fRiENEMiES roadmap. It tells agents and contributors which artifacts define brand intent, which artifacts represent current implementation, which artifacts are historical, and which artifacts are adjacent ecosystem context.

Use this rule: the polished context pack is canon for brand and guardrails, but current repo and local implementation evidence wins for status.

## Project Board

- [fRiENEMiES Roadmap](https://github.com/users/PIZZALORD713/projects/1)

## Source Classes

| Class | Meaning | How to Use |
|---|---|---|
| Canon | Stable brand, voice, guardrails, north star | Use for public tone and strategic direction |
| Current implementation | Working code or active local pipeline | Use for status, technical contracts, and execution |
| High-value spec | Product or architecture spec not yet fully implemented | Use to shape next issues and acceptance criteria |
| Historical reference | Older repo or artifact superseded by newer work | Mine for reusable ideas, do not treat as current |
| Adjacent ecosystem | Related brand, game, asset, or tool context | Keep visible, but do not let it block Studio + Blender |
| Speculative | Future claim, inventory, marketplace, or AI-social ideas | Research only until explicitly approved |

## Canonical Rules

- fRiENEMiES is independent, community-led, and not an official FriendsWithYou product.
- Public copy must not imply verified commercial rights, guaranteed value, guaranteed rewards, or finalized claim mechanics.
- Web3 claim, trait inventory, marketplace, and token mechanics are research tracks until a separate decision promotes them.
- The first execution horizon is Studio + Blender: view, animate, export, render, and direct character scenes.
- BODY-first rig assembly is the core technical invariant across Studio and Blender.

## Artifact Inventory

| Source | Location | Class | What It Proves | Freshness | Confidence | Feeds |
|---|---|---|---|---|---|---|
| fRiENEMiES AI Agent Context Pack | `/Users/sauce/Downloads/frienemies_ai_agent_context.md` | Canon | Brand identity, origin framing, tone, legal/IP guardrails, product pillars, strategic phases | Polished but not newest | High for intent, medium for status | [#60](https://github.com/PIZZALORD713/garden_reborn/issues/60), [#67](https://github.com/PIZZALORD713/garden_reborn/issues/67), [#68](https://github.com/PIZZALORD713/garden_reborn/issues/68), [#69](https://github.com/PIZZALORD713/garden_reborn/issues/69) |
| garden_reborn repo | https://github.com/PIZZALORD713/garden_reborn | Current implementation | Current fRiENEMiES Studio app: token/wallet/ENS loading, animation preview, GLB export, lighting presets, holder routes, pack schemas, MCP scaffold | Updated 2026-05-03 | High | [#61](https://github.com/PIZZALORD713/garden_reborn/issues/61), [#62](https://github.com/PIZZALORD713/garden_reborn/issues/62), [#63](https://github.com/PIZZALORD713/garden_reborn/issues/63), [#66](https://github.com/PIZZALORD713/garden_reborn/issues/66) |
| garden_reborn `README.md` | https://github.com/PIZZALORD713/garden_reborn/blob/main/README.md | Current implementation | Public product framing: view, animate, export; vanilla Three.js r175; Moralis-backed holder lookup; GLB export compatibility cleanup | Current in repo | High | [#60](https://github.com/PIZZALORD713/garden_reborn/issues/60), [#63](https://github.com/PIZZALORD713/garden_reborn/issues/63) |
| garden_reborn `CANON.md` | https://github.com/PIZZALORD713/garden_reborn/blob/main/CANON.md | Current implementation | BODY skeleton is source of truth; skinned parts bind to BODY; rigid attachments retarget; GLB export rules; face decal compatibility path | Current in repo | High | [#63](https://github.com/PIZZALORD713/garden_reborn/issues/63), [#66](https://github.com/PIZZALORD713/garden_reborn/issues/66) |
| garden_reborn `ARCHITECTURE.md` | https://github.com/PIZZALORD713/garden_reborn/blob/main/ARCHITECTURE.md | Current implementation | Runtime pipeline, state seams, API boundary, schemas, packs, MCP, Sauce-0x mascot hook | Current in repo | High | [#61](https://github.com/PIZZALORD713/garden_reborn/issues/61), [#63](https://github.com/PIZZALORD713/garden_reborn/issues/63) |
| garden_reborn `TODO.md` | https://github.com/PIZZALORD713/garden_reborn/blob/main/TODO.md | Current implementation | Slice history, current active task `slice-057-post-slice-056-verification-pass`, modularization/QA cadence | Current in repo | High | [#61](https://github.com/PIZZALORD713/garden_reborn/issues/61) |
| garden_reborn `ROADMAP.md` | https://github.com/PIZZALORD713/garden_reborn/blob/main/ROADMAP.md | Current implementation | Existing two-track roadmap: Ship Studio and Framework/MCP | Current in repo | High | [#60](https://github.com/PIZZALORD713/garden_reborn/issues/60), [#66](https://github.com/PIZZALORD713/garden_reborn/issues/66) |
| garden_reborn schemas | `schemas/character.manifest.schema.json`, `schemas/animation.pack.schema.json`, `schemas/skeleton.contract.v1.json` | Current implementation | Baseline manifest, animation pack, and skeleton contract schemas already exist | Current in repo | High | [#63](https://github.com/PIZZALORD713/garden_reborn/issues/63), [#66](https://github.com/PIZZALORD713/garden_reborn/issues/66) |
| garden_reborn pack registry | `packs/registry.json`, `packs/example-pack/pack.json` | Current implementation | Pack registry exists; example pack now points to current `animation_collection2` clip URLs and validates through #66 tooling | Current in repo | High | [#66](https://github.com/PIZZALORD713/garden_reborn/issues/66) |
| Animation pack validation tooling | `tools/animation-pack-validator.js`, `tools/validate-animation-pack.mjs`, `tools/glb-animation-tracks.mjs`, `docs/animation-pack-validation.md` | Current implementation | Manifest, skeleton alias, rest-pose, track hazard, and optional GLB channel validation for Studio/Blender animation packs | Current in repo | High | [#66](https://github.com/PIZZALORD713/garden_reborn/issues/66) |
| PR #56 | https://github.com/PIZZALORD713/garden_reborn/pull/56 | Current implementation | Merged Studio UI branch for iridescent hover/gradient work | Merged 2026-05-04 | Medium-high | [#62](https://github.com/PIZZALORD713/garden_reborn/issues/62) |
| PR #57 | https://github.com/PIZZALORD713/garden_reborn/pull/57 | Historical reference | Superseded Studio UI branch for prismatic glass cards, menu, and sheets | Closed 2026-05-04 | Low-current, useful visual reference | [#62](https://github.com/PIZZALORD713/garden_reborn/issues/62) |
| Local Blender scene pipeline | `/Users/sauce/Documents/New project` | Current implementation | Blender LTS pipeline for JSON-directed token scenes, Friendsies asset fetch, PNG render, `.blend`, and GLB export | Current local work | High for prototype | [#63](https://github.com/PIZZALORD713/garden_reborn/issues/63), [#64](https://github.com/PIZZALORD713/garden_reborn/issues/64), [#65](https://github.com/PIZZALORD713/garden_reborn/issues/65) |
| Local Blender README | `/Users/sauce/Documents/New project/README.md` | Current implementation | Current local workflow: scene idea to JSON recipe to token assets to Blender render/export | Current local work | High | [#63](https://github.com/PIZZALORD713/garden_reborn/issues/63), [#64](https://github.com/PIZZALORD713/garden_reborn/issues/64) |
| Avatar Blender Pipeline doc | `/Users/sauce/Documents/New project/docs/avatar-blender-pipeline.md` | Current implementation | Blender-side BODY-first rig rules, part modes, animation sanitizer, real token path, head-UV-clone face overlays, directed scene V0 | Current local work | High | [#63](https://github.com/PIZZALORD713/garden_reborn/issues/63), [#64](https://github.com/PIZZALORD713/garden_reborn/issues/64) |
| Blender scene generation track | https://github.com/PIZZALORD713/garden_reborn/blob/main/docs/roadmap/blender-scene-generation.md | High-value spec | Canonical roadmap lane for directed Blender scenes, Studio/Blender ownership boundaries, and migration plan from local prototype to production tooling | Current in repo | High | [#64](https://github.com/PIZZALORD713/garden_reborn/issues/64), [#65](https://github.com/PIZZALORD713/garden_reborn/issues/65), [#66](https://github.com/PIZZALORD713/garden_reborn/issues/66) |
| Static Avatar Render Pack V1 | `docs/render-packs/static-avatar-render-pack-v1.md`, `schemas/static-avatar.render-pack.v1.schema.json`, `examples/render-packs/sauce-0x-token-8521.static-avatar-v1.json` | High-value spec | Deterministic agent identity PNG pack contract: square, transparent, banner, fullbody, manifest, presets, quality gates, #8521 test case | Current in repo | High | [#65](https://github.com/PIZZALORD713/garden_reborn/issues/65) |
| Local directed scene recipe | `/Users/sauce/Documents/New project/manifests/scenes/friendsies-bus-pizza-drop.json` | Current implementation | Multi-actor scene schema in practice: actors, roles, poses, props, camera, render outputs | Current local work | High for prototype | [#63](https://github.com/PIZZALORD713/garden_reborn/issues/63), [#64](https://github.com/PIZZALORD713/garden_reborn/issues/64) |
| Local token manifests | `/Users/sauce/Documents/New project/manifests/friendsies/token-*.json` | Current implementation | Concrete token recipe shape for body, parts, face, traits, scene, render, outputs | Current local work | High for prototype | [#63](https://github.com/PIZZALORD713/garden_reborn/issues/63) |
| Agent Avatar System product spec | `/Users/sauce/Documents/Sauce0x - Agent Vault/Projects/repo-landscape/friendsies-agent-avatar-system-product-spec.md` | High-value spec | Agent Identity Compiler framing, static render pack outputs, identity/render/export preset model | Recent local planning | High for product angle | [#65](https://github.com/PIZZALORD713/garden_reborn/issues/65) |
| Agent Avatar System notes | `/Users/sauce/Documents/Sauce0x - Agent Vault/Projects/repo-landscape/friendsies-agent-avatar-system.md` | High-value spec | `garden_reborn` as render-pack foundation, screenshot/export automation gap, Sauce-0x/token 8521 seed | Recent local planning | High for approach | [#65](https://github.com/PIZZALORD713/garden_reborn/issues/65) |
| frienemies-dapp repo | https://github.com/PIZZALORD713/frienemies-dapp | Historical reference | Earlier public Next.js/RainbowKit/wagmi/Moralis/Three.js dapp with wallet-first architecture | Updated 2025-03-03 | Medium historical | [#67](https://github.com/PIZZALORD713/garden_reborn/issues/67) |
| Agent Vault frienemies-dapp review | `/Users/sauce/Documents/Sauce0x - Agent Vault/Projects/repo-landscape/repos/frienemies-dapp.md` | Historical reference | Confirms `frienemies-dapp` as lineage/reference, likely superseded by `garden_reborn` | Recent local review | Medium-high | [#67](https://github.com/PIZZALORD713/garden_reborn/issues/67) |
| Agent Vault frienemies-app review | `/Users/sauce/Documents/Sauce0x - Agent Vault/Projects/repo-landscape/repos/frienemies-app.md` | Historical reference | Identifies private/internal bridge repo between early dapp and `garden_reborn` | Recent local review | Medium, private-source dependent | [#60](https://github.com/PIZZALORD713/garden_reborn/issues/60) |
| animation_collection2 | https://github.com/PIZZALORD713/animation_collection2 | Current implementation | Current GLB animation preset source: `walk`, `walk-arms-low`, `dance-rumba`, `joy-jump`, T-pose rig test | Updated 2026-02-13 | High | [#63](https://github.com/PIZZALORD713/garden_reborn/issues/63), [#66](https://github.com/PIZZALORD713/garden_reborn/issues/66) |
| animation_collection | https://github.com/PIZZALORD713/animation_collection | Historical reference | Earlier FBX/GLB animation experiments and jsDelivr source mentioned in older docs | Updated 2026-01-26 | Medium | [#66](https://github.com/PIZZALORD713/garden_reborn/issues/66) |
| Thornvale | https://github.com/PIZZALORD713/Thornvale | Adjacent ecosystem | 3D/game-world work with Friendsies-related visual/character loading context | Updated 2026-02-14 | Medium adjacent | [#69](https://github.com/PIZZALORD713/garden_reborn/issues/69) |
| gm-assets | https://github.com/PIZZALORD713/gm-assets | Adjacent ecosystem | gm.pizza and related brand asset source | Updated 2025-05-11 | Medium adjacent | [#69](https://github.com/PIZZALORD713/garden_reborn/issues/69) |
| rainbowkit-test-v0 | https://github.com/PIZZALORD713/rainbowkit-test-v0 | Adjacent ecosystem | AI/status/API experiments, useful pattern reference but not core fRiENEMiES implementation | Updated 2026-01-18 | Low-medium for fRiENEMiES | Someday research only |
| sugar-depot-vercel | https://github.com/PIZZALORD713/sugar-depot-vercel | Adjacent ecosystem | Separate web3/app surface with wallet and collectible patterns | Updated 2025-08-16 | Low-medium for fRiENEMiES | Someday research only |
| OTTO | https://github.com/PIZZALORD713/OTTO | Adjacent ecosystem | Separate TypeScript/UI project, not a current fRiENEMiES source | Updated 2025-07-03 | Low | Someday research only |
| Typo-App | https://github.com/PIZZALORD713/Typo-App | Adjacent ecosystem | Separate TypeScript/UI project, not a current fRiENEMiES source | Updated 2025-06-23 | Low | Someday research only |

## Current Truth Stack

1. Brand and guardrails: context pack.
2. Current browser Studio: `garden_reborn`.
3. Current Blender scene generation: local Blender repo and `docs/avatar-blender-pipeline.md`.
4. Agent render-pack direction: Agent Avatar System docs.
5. Historical Web3 app context: `frienemies-dapp` and Agent Vault repo reviews.
6. Ecosystem expansion: Thornvale, gm-assets, and other adjacent repos.

## Immediate Next Actions

- Use [Studio-to-Blender Contract v0.1](../contracts/studio-blender-contract.md) and the [Blender scene generation track](./blender-scene-generation.md) as the canonical bridge from browser Studio to local Blender scene production.
- Use [Static Avatar Render Pack V1](../render-packs/static-avatar-render-pack-v1.md) as the implementation contract for [#71](https://github.com/PIZZALORD713/garden_reborn/issues/71), the first token #8521 / Sauce-0x render-pack runner.
- Keep Web3, claim, inventory, and marketplace language in research mode until [#67](https://github.com/PIZZALORD713/garden_reborn/issues/67) explicitly promotes a design.

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
- [#70](https://github.com/PIZZALORD713/garden_reborn/issues/70) P0: Complete GitHub Projects v2 board setup after project-scope auth
- [#71](https://github.com/PIZZALORD713/garden_reborn/issues/71) P1: Implement Static Avatar Render Pack V1 runner for token #8521
