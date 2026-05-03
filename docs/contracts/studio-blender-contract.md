# Studio-to-Blender Contract v0.1

_Last updated: 2026-05-03_

This contract defines how fRiENEMiES Studio and the Blender scene pipeline should share character, rig, face, animation, and export semantics. It is intentionally limited to the current Studio + Blender horizon. It does not define Web3 claim, inventory, or marketplace mechanics.

## Grounding Sources

- `garden_reborn` `README.md`, `CANON.md`, `ARCHITECTURE.md`, and schemas.
- Local Blender README: `/Users/sauce/Documents/New project/README.md`.
- Local Blender pipeline doc: `/Users/sauce/Documents/New project/docs/avatar-blender-pipeline.md`.
- Local token recipe example: `/Users/sauce/Documents/New project/manifests/friendsies/token-8448.json`.
- Local directed scene example: `/Users/sauce/Documents/New project/manifests/scenes/friendsies-bus-pizza-drop.json`.

## Shared Invariants

- BODY skeleton is the source of truth.
- Skinned traits must bind to the BODY skeleton.
- Rigid traits must attach or retarget to canonical BODY bones.
- Bone names must be normalized before matching.
- Face PNGs must follow the head through animation.
- GLB is the default exchange/export format.
- Public outputs must preserve character readability, especially silhouette and face expression.

## Minimum Character Manifest

Studio and Blender should converge on a manifest shape that can be projected from `schemas/character.manifest.schema.json` and the local Blender token recipes.

Required fields for interchange:

```json
{
  "version": "1.0.0",
  "name": "Friendsies #8448",
  "collection": {
    "name": "fRiENDSiES",
    "contract": "0xe5af63234f93afd72a8b9114803e33f6d9766956",
    "chain": "eth"
  },
  "token_id": 8448,
  "skeletonContract": "v1",
  "traits": [
    {
      "trait_type": "body",
      "value": "Lucky White",
      "asset_url": "https://.../body.glb"
    }
  ],
  "body": {
    "path": "references/friendsies/tokens/8448/assets/body__lucky-white__d64c51af78.glb",
    "source_url": "https://.../body.glb",
    "armature": "Character Rig",
    "name": "FriendsiesRig"
  },
  "parts": [
    {
      "slot": "head",
      "value": "The Boy",
      "mode": "auto",
      "path": "references/friendsies/tokens/8448/assets/head__the-boy__3f86917108.glb",
      "source_url": "https://.../head.glb"
    }
  ],
  "face": {
    "slot": "face",
    "value": "Glooms",
    "path": "references/friendsies/tokens/8448/assets/face__glooms__9787682e72.png",
    "source_url": "https://.../face.png",
    "mode": "head_uv_clone"
  }
}
```

Naming note: existing Blender recipes use `token_id`; existing `garden_reborn` schema uses `tokenId`. Until schemas are unified, consumers should accept both and emit one canonical field in generated outputs.

## Trait Modes

| Mode | Meaning | Studio Behavior | Blender Behavior |
|---|---|---|---|
| `skinned` | Mesh has skin data and should deform with BODY | Bind compatible SkinnedMesh to BODY skeleton | Rebind mesh Armature modifier to BODY armature and remove imported trait armature |
| `attach` | Rigid prop should follow a BODY bone | Parent/retarget object to canonical BODY bone | Parent object to resolved pose bone while preserving world transform when requested |
| `auto` | Loader decides skinned versus rigid | Prefer skinned path when skin data exists, otherwise attach if `attach_to` exists | Same rule: skinned first, attach fallback |

Initial attachment hints:

| Slot | Attach bone |
|---|---|
| `head`, `sprout`, `hat`, `headwear` | `Head` |
| `backpiece`, `back` | `Spine` |
| `hand`, `hands` | `Hand.R` |
| `shoe`, `shoes` | `Foot.R` |

These hints are defaults, not hard guarantees. Per-trait overrides should be allowed.

## Face Overlay Contract

Studio currently supports face texture overlays and export keeps a face decal compatibility path. Blender now uses the head-UV-clone approach.

Required behavior:

- Face PNGs must use transparency.
- The face must follow head animation.
- The face must preserve the source head UV layout when available.
- The face overlay must avoid z-fighting in renders and exported GLBs.
- The face overlay must not be a free-floating billboard when a compatible head mesh exists.

Blender implementation rule:

```text
Clone the imported head mesh -> preserve UVs -> offset slightly along normals -> assign transparent face PNG material -> bind to BODY armature.
```

Studio export rule:

```text
Strip viewer-only helpers -> add/export face decal mesh or baked equivalent -> keep normal-offset compatibility path.
```

Example coverage: token #8448 has body `Lucky White`, head `The Boy`, and face `Glooms`; it must remain a regression case for this contract.

## Animation Contract

Animation packs should target `skeletonContract: v1` and pass through the skeleton alias rules in `schemas/skeleton.contract.v1.json`.

Current preset names in local Blender tooling:

- `none`
- `walk`
- `walk-arms-low`
- `dance-rumba`
- `joy-jump`

Studio pack manifests use clip names and URLs. Blender recipes may reference a selected animation path or omit animation for static scene renders.

Required sanitizer behavior:

- Drop scale tracks by default.
- Drop bone location tracks except approved root/hips tracks.
- Remap compatible bone names onto BODY armature names.
- Remove tracks for bones that do not exist on the BODY armature.
- Preserve source animation names for provenance where possible.

## Directed Scene Contract

Directed Blender scenes should remain JSON-first so an AI or human can describe actors, props, camera, and mood before Blender runs.

Minimum directed scene fields:

```json
{
  "name": "Friendsies Bus Stop Pizza Drop",
  "description": "Story summary",
  "actors": [
    {
      "id": "pizza_dropper_8448",
      "token_id": 8448,
      "role": "unfortunate passenger dropping pizza",
      "manifest": "manifests/friendsies/token-8448.json",
      "location": [-0.62, -0.72, 0.0],
      "rotation_euler_deg": [0, 0, -8],
      "scale": [3.45, 3.45, 3.45],
      "pose": { "frame": 1, "bones": {} }
    }
  ],
  "props": [{ "type": "dropped_pizza" }],
  "scene": { "camera": {}, "lights": [] },
  "render": { "resolution": [1600, 1200], "samples": 64 },
  "outputs": { "render": "...png", "blend": "...blend", "glb": "...glb" }
}
```

Studio does not need to execute directed scenes immediately. Its near-term responsibility is to emit or preserve enough token/trait/animation metadata for Blender to consume.

## Output Contract

Blender output bundle:

- PNG render for review/share.
- `.blend` source scene for iteration.
- GLB export for web/runtime handoff.
- Manifest/provenance record should be added next.

Studio output bundle:

- Runtime-loaded assembled character.
- Downloadable GLB export.
- Shareable token/wallet route.
- Future deterministic screenshot/render output for agent avatar packs.

Both systems should record source token ID, source asset URLs, local asset paths when applicable, animation preset, render preset, and pipeline version when generating persistent outputs.

## Validation Cases

Use these as minimum contract checks:

| Case | Why |
|---|---|
| Token #8448 | Has 2D face PNG `Glooms`; validates head-UV-clone face overlay |
| Token #8521 | Sauce-0x mascot candidate; validates core identity path and accessories |
| Token #5 | More complex traits/accessories; validates multi-part assembly |
| Directed bus scene | Validates multiple actors, poses, props, camera, render, and GLB export |

## Non-Goals

This contract does not define:

- smart contract claim flows
- staking, burning, or escrow mechanics
- trait ownership or marketplace systems
- final commercial rights language
- generalized AI personality behavior

Those remain separate research or later product tracks.

## Next Schema Work

- Align `tokenId` versus `token_id` naming.
- Extend character manifests with local path/source URL pairs for Blender compatibility.
- Add explicit `face.mode = head_uv_clone | decal | baked_texture` semantics.
- Add attachment hint validation for rigid parts.
- Add directed scene recipe schema after the local JSON shape stabilizes.
