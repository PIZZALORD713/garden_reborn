# fRiENEMiES Roadmap

_Last updated: 2026-05-04_

This roadmap uses `PIZZALORD713/garden_reborn` as the canonical planning repo and [fRiENEMiES Roadmap](https://github.com/users/PIZZALORD713/projects/1) as the GitHub Projects v2 board. The first execution horizon is Studio + Blender: make fRiENEMiES characters reliable to load, animate, export, render, and direct into scenes before deeper Web3 claim mechanics.

## North Star

Turn static NFT ownership into living, expressive, remixable, AI-assisted digital characters. The current practical path is: Studio reliability, Blender scene generation, animation validation, and deterministic render packs.

## Now: Cycle 01 - Foundation Audit and Board Bootstrap

Milestone due: 2026-06-14

No open P0 foundation blockers remain after the source audit, board bootstrap, Studio verification gate, and UI PR triage.

## Completed Foundation Work

- [#59](https://github.com/PIZZALORD713/garden_reborn/issues/59) Built the [source map](./source-map.md) and confidence model.
- [#60](https://github.com/PIZZALORD713/garden_reborn/issues/60) Refreshed [canon and current status](./canon-and-current-status.md) using context pack plus current evidence.
- [#61](https://github.com/PIZZALORD713/garden_reborn/issues/61) Completed the API-backed slice-057 verification gate with live `/api/friendsiesTokens`, rapid token switching, animation, GLB export, and mobile sanity.
- [#62](https://github.com/PIZZALORD713/garden_reborn/issues/62) Resolved the UI PR direction: keep [#56](https://github.com/PIZZALORD713/garden_reborn/pull/56) as the small merge candidate after the API-backed gate, close/supersede [#57](https://github.com/PIZZALORD713/garden_reborn/pull/57).
- [#70](https://github.com/PIZZALORD713/garden_reborn/issues/70) Created the GitHub Projects v2 board, fields, issue membership, and initial field values.

## Next: Cycle 02 - Studio Reliability and Blender Contract

Milestone due: 2026-07-26

- [#66](https://github.com/PIZZALORD713/garden_reborn/issues/66) Harden animation pack validation against skeleton rules.

## Completed Contract Work

- [#63](https://github.com/PIZZALORD713/garden_reborn/issues/63) Defined the shared [Studio-to-Blender contract](../contracts/studio-blender-contract.md).
- [#64](https://github.com/PIZZALORD713/garden_reborn/issues/64) Promoted Blender scene generation into the canonical roadmap as a [first-class scene-generation track](./blender-scene-generation.md).

## Later: Cycle 03 - Render Packs and Scene Direction

Milestone due: 2026-09-06

- [#65](https://github.com/PIZZALORD713/garden_reborn/issues/65) Specify deterministic static avatar render packs.
- [#67](https://github.com/PIZZALORD713/garden_reborn/issues/67) Research Web3 mechanics without building contracts.
- [#68](https://github.com/PIZZALORD713/garden_reborn/issues/68) Scope collector and AI identity pages.
- [#69](https://github.com/PIZZALORD713/garden_reborn/issues/69) Map ecosystem opportunities without blocking Studio + Blender.

## Operating Assumptions

- `garden_reborn` is the canonical planning repo.
- Work runs in 6-week cycles.
- First execution focus is Studio + Blender, not Web3 contracts.
- The context pack is canonical for voice, values, and guardrails; current repos/local artifacts are canonical for implementation status.
