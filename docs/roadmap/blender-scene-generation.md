# Blender Scene Generation Track

_Last updated: 2026-05-04_

This track promotes the local Blender work at `/Users/sauce/Documents/New project` from prototype evidence into an official fRiENEMiES roadmap lane. The goal is not to immediately move every local file into `garden_reborn`; the goal is to make the working scene pipeline visible, preserve the artifacts, and define the migration path into canonical specs and production tooling.

## Current Working Loop

```text
scene idea -> JSON recipe -> fetch token assets -> assemble in Blender -> render PNG + save .blend + export GLB
```

Current proof scene:

- Recipe: `/Users/sauce/Documents/New project/manifests/scenes/friendsies-bus-pizza-drop.json`
- Story: Friendsies #8448 drops pizza while Friendsies #1, #5, and #8521 share the bus-stop moment.
- Builder: `/Users/sauce/Documents/New project/scripts/build-directed-scene.sh`
- Blender entrypoint: `/Users/sauce/Documents/New project/blender/directed_scene_pipeline.py`
- Outputs:
  - `output/scenes/friendsies-bus-pizza-drop/friendsies_bus_pizza_drop.png`
  - `output/scenes/friendsies-bus-pizza-drop/friendsies_bus_pizza_drop.blend`
  - `web/public/assets/scenes/friendsies-bus-pizza-drop/friendsies_bus_pizza_drop.glb`

## What Blender Owns

Blender is the source of truth for scene generation and offline/rendered outputs.

Blender owns:

- multi-actor scene assembly
- procedural props and environments
- camera, lens, depth of field, lighting, world color, render settings
- posed story moments and static directed shots
- `.blend` source scenes for human iteration
- PNG render outputs for review, social, identity, and collector surfaces
- GLB scene exports for web/runtime handoff
- head-UV-clone face PNG rendering when a token uses 2D face art

Blender should not own:

- wallet/ENS lookup UX
- live carousel browsing
- primary collector routing
- public Studio copy and onboarding
- Web3 claim, inventory, staking, or marketplace mechanics

## What Studio Owns

`garden_reborn` Studio remains the source of truth for browser-native character viewing, animation preview, wallet/token lookup, and web GLB export.

Studio owns:

- token ID, wallet, and ENS lookup
- BODY-first runtime assembly in Three.js
- animation preview and GLB export from the browser
- holder routes and shareable Studio URLs
- pack registry and schema entrypoints
- UX constraints, public copy, and guardrails

Studio should emit or preserve enough metadata for Blender to consume:

- token ID and collection contract
- resolved trait list
- source asset URLs
- face PNG information
- animation preset and skeleton contract
- export/render provenance when outputs become persistent

## Canonical Contract

The shared technical contract is [Studio-to-Blender Contract v0.1](../contracts/studio-blender-contract.md).

Required shared invariants:

- BODY skeleton is the source of truth.
- Skinned traits bind to the BODY skeleton.
- Rigid traits attach or retarget to BODY bones.
- Bone names normalize before matching.
- Face PNGs follow head animation.
- GLB is the default exchange format.

The Blender scene track extends that contract with directed-scene concerns: actors, roles, poses, props, camera, lights, render outputs, and prompt-to-scene planning.

## Directed Scene Recipe V0

The local directed scene recipe has these top-level fields:

| Field | Purpose |
|---|---|
| `name` | Human-readable scene name |
| `description` | Story brief |
| `environments` | Procedural environment presets and mood |
| `actors` | Token actors, roles, manifests, transforms, scale, poses |
| `props` | Procedural or imported scene props |
| `scene` | World color, lights, camera |
| `render` | Engine, resolution, samples, color management |
| `outputs` | Render PNG, `.blend`, GLB, export flags |

Near-term schema work should formalize this in `schemas/directed.scene.schema.json` after the local recipe shape survives one more production scene.

## Migration Plan

### Phase 0: Preserve Local Evidence

Status: current.

- Keep `/Users/sauce/Documents/New project` intact as the working Blender pipeline.
- Treat local `README.md`, `docs/avatar-blender-pipeline.md`, token manifests, and the bus-stop recipe as current implementation evidence.
- Do not move generated output files into `garden_reborn` unless they are intentionally selected as fixtures.

### Phase 1: Canonical Docs And Schemas

Status: now/next.

- Add this roadmap track.
- Add directed scene schema draft in `garden_reborn`.
- Add token manifest compatibility notes for `token_id` and `tokenId`.
- Add validation expectations for actor transforms, pose bones, render outputs, and required token manifests.

### Phase 2: Minimal Portable Runner

Status: next.

- Decide whether Blender scripts live in `garden_reborn/tools/blender/` or a dedicated `frienemies-blender-pipeline` repo.
- Port only stable entrypoints first:
  - token manifest fetcher
  - directed scene validator
  - runner wrapper that locates Blender LTS
- Keep asset caches and heavy generated outputs out of git by default.

### Phase 3: Production Scene Packs

Status: later.

- Add scene-pack manifests that reference recipe JSON, required token IDs, output targets, and render presets.
- Add deterministic render-pack outputs from #65.
- Add prompt-to-scene planning that writes directed scene JSON before Blender executes.
- Add GLB post-export checks for materials, textures, transform sanity, and web preview compatibility.

## Roadmap Milestones

### Now

- Close #64 by making Blender scene generation first-class in the roadmap.
- Keep #66 focused on animation/skeleton validation because both Studio and Blender depend on it.

### Next

- Draft directed scene schema.
- Add validation-only mode for directed scene recipes.
- Identify stable local scripts to port or package.
- Define scene output manifest/provenance records.

### Later

- Specify Static Avatar Render Pack V1 in #65.
- Add reusable pose/action libraries for scene direction.
- Add prompt-to-scene planner that emits directed JSON.
- Add batch rendering for selected tokens, casts, and scene packs.

## Preservation Rules

- Never treat local generated outputs as disposable until they have a replacement path or archived evidence.
- Keep source URLs beside local cached paths in generated token manifests.
- Do not rewrite the local Blender repo as part of roadmap work unless explicitly requested.
- Keep public copy careful: this is independent, community-led creative tooling, not an official FriendsWithYou product.

## Related Specs And Follow-Up

- [#65](https://github.com/PIZZALORD713/garden_reborn/issues/65): [Static Avatar Render Pack V1](../render-packs/static-avatar-render-pack-v1.md) for agent identity outputs.
- [#66](https://github.com/PIZZALORD713/garden_reborn/issues/66): [Animation pack validation](../animation-pack-validation.md) against skeleton contract rules.
- [#71](https://github.com/PIZZALORD713/garden_reborn/issues/71): add the local Blender runner for `static-avatar-v1` using token #8521 / Sauce-0x as the first proof case.
