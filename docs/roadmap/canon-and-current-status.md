# fRiENEMiES Canon and Current Status

_Last updated: 2026-05-03_

This brief refreshes the polished fRiENEMiES context pack against current repo and local implementation evidence. Use it to keep brand, roadmap, and engineering decisions aligned.

## Canonical Position

fRiENEMiES is an independent, community-led creative technology project for making Friendsies-style 3D characters more useful, expressive, animated, and portable. It is a holder-builder response and creative tooling layer, not an official FriendsWithYou product and not an official continuation of the original roadmap.

The emotional center is evolution, not revenge. The project should feel resilient, funny, sharp, weird, future-facing, and useful. It should not get stuck in grievance, financial recovery promises, or IP certainty that has not been verified.

## North Star

Turn static NFT ownership into living, expressive, remixable, AI-assisted digital characters.

The current practical path is:

1. Make fRiENEMiES Studio reliable for loading, viewing, animating, and exporting characters.
2. Connect Studio to Blender so characters can be rendered into deterministic scenes and asset packs.
3. Build animation and render-pack systems that make characters usable in videos, profiles, agents, games, and future collector pages.
4. Keep Web3 claim, inventory, marketplace, and AI-social systems as research tracks until the core creative pipeline is stable.

## What Is Current

### fRiENEMiES Studio

`garden_reborn` is the current public implementation and planning repo. It already supports:

- token ID loading
- wallet and ENS lookup through a serverless endpoint
- metadata-driven trait loading
- BODY-first skeleton binding
- rigid attachment retargeting
- face texture overlays
- animation preview from external packs
- lighting presets
- GLB export with compatibility cleanup
- holder routes and shareable URLs
- schema and pack foundations
- an MCP scaffold

Status: current flagship implementation.

### Blender Scene Pipeline

The local Blender repo at `/Users/sauce/Documents/New project` is the current Blender-side prototype. It already supports:

- Friendsies token asset fetching
- token manifest generation
- BODY-first trait assembly
- animation/pose application
- head-UV-clone face PNG overlays
- directed multi-actor scene recipes
- Blender render, `.blend`, and GLB export
- a working bus-stop scene with tokens #1, #5, #8448, and #8521

Status: current local implementation, should be promoted into the roadmap as the scene-generation track.

### Animation Sources

`animation_collection2` is the current animation preset source used by local tooling for `walk`, `walk-arms-low`, `dance-rumba`, and `joy-jump`. `animation_collection` is older historical animation material and should be mined carefully, not treated as automatically current.

Status: current animation pack work exists, validation needs hardening.

### Agent Identity Direction

The Agent Avatar System docs define a useful product layer: a deterministic identity compiler that turns a Friendsies token into reusable static and later 3D/animated outputs. This should feed render-pack work after Studio + Blender contracts are clear.

Status: high-value product spec, not yet fully implemented.

## What Is Historical

`frienemies-dapp` is an earlier public web3-first app. It uses a Next.js, RainbowKit, wagmi/viem, Moralis, and Three.js stack. It is useful for lineage and wallet/NFT lookup ideas, but it is not the current flagship. Treat it as historical reference unless a future issue explicitly ports something forward.

The Agent Vault `frienemies-app` review describes a likely private/internal bridge between `frienemies-dapp` and `garden_reborn`. Treat it as lineage evidence, not a canonical current implementation unless the repo is inspected directly.

## What Is Later Research

The following tracks are valuable but should not drive this week's execution:

- Web3 claim, staking, escrow, burn, or conversion mechanics
- trait inventory and ERC-1155 style systems
- marketplace or creator upload mechanics
- generalized AI character pages and social feeds
- gm.pizza ecosystem integration
- Thornvale/game-world expansion

These belong in Later/Someday until Studio reliability, Blender contract, and render-pack specs are stronger.

## Now, Next, Later, Someday

| Horizon | Focus | Issues |
|---|---|---|
| Now | Source truth, canon/status, Studio QA, PR triage | [#59](https://github.com/PIZZALORD713/garden_reborn/issues/59), [#60](https://github.com/PIZZALORD713/garden_reborn/issues/60), [#61](https://github.com/PIZZALORD713/garden_reborn/issues/61), [#62](https://github.com/PIZZALORD713/garden_reborn/issues/62) |
| Next | Studio-to-Blender contract, local Blender track, animation validation | [#63](https://github.com/PIZZALORD713/garden_reborn/issues/63), [#64](https://github.com/PIZZALORD713/garden_reborn/issues/64), [#66](https://github.com/PIZZALORD713/garden_reborn/issues/66) |
| Later | Static avatar render packs, Web3 research, collector/AI identity, ecosystem map | [#65](https://github.com/PIZZALORD713/garden_reborn/issues/65), [#67](https://github.com/PIZZALORD713/garden_reborn/issues/67), [#68](https://github.com/PIZZALORD713/garden_reborn/issues/68), [#69](https://github.com/PIZZALORD713/garden_reborn/issues/69) |
| Someday | Creator marketplace, game compatibility, trait economy, gm.pizza commissions, multi-collection expansion | Future issues only |

## Public Language Guardrails

Use:

- independent
- community-led
- holder-built
- inspired by the spirit of the original community
- creative tool layer
- animation studio
- character pipeline
- render/export system

Avoid:

- official continuation
- official sequel
- FriendsWithYou approved
- guaranteed value
- guaranteed rewards
- make holders whole
- finalized claim mechanics
- legal certainty around rights

## Current Strategic Bet

The highest-output bet is to make fRiENEMiES a repeatable creative engine before making it a complex Web3 system.

That means the immediate order is:

1. Verify and stabilize Studio.
2. Define the Studio-to-Blender contract.
3. Promote Blender scene generation into the roadmap.
4. Specify deterministic avatar render packs.
5. Then research Web3, inventory, collector pages, and ecosystem expansion with stronger product evidence.
