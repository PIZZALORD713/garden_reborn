# CANON.md

## Skeleton Contract (v1)
- Canonical rig: BODY skeleton is source of truth.
- All skinned parts bind to BODY skeleton.
- Rigid attachments must be reparented/retargeted to canonical BODY bones.
- Bone-name normalization is required (`mixamorig`, delimiters, aliases).
- Animation packs should target canonical names/aliases from `schemas/skeleton.contract.v1.json`.

## Export Rules
- Export format: GLB (`model/gltf-binary`).
- Preserve skinning and animation clips.
- Remove helper/non-export nodes (face anchors, debug helpers).
- Keep face decal compatibility path (overlay or baked texture fallback).
- Apply conservative post-processing only (never destructive to rig fidelity).

## Known dragons
- Different DCC exports produce inconsistent bone naming and extra armature wrappers.
- Windows 3D Viewer can choke on duplicated skins/samplers and some texture transform cases.
- Mixed rigid + skinned trait assets can drift unless retarget pass is applied.
- Face overlays may z-fight in external tools if not offset/baked for export.
