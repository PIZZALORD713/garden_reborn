# Static Avatar Render Pack V1

_Last updated: 2026-05-04_

Static Avatar Render Pack V1 defines the first deterministic agent-identity output bundle for fRiENEMiES characters. It turns one canonical Friendsies token source into a repeatable set of static PNG assets plus a manifest that records exactly how the pack was produced.

This is the Agent Identity Compiler's first shippable unit:

```text
Friendsies token -> identity preset -> render preset -> export pack -> PNG outputs + manifest
```

V1 is intentionally static and identity-first. It does not define animation exports, talking heads, prompt-to-scene generation, claim mechanics, or marketplace behavior.

## Primary Test Target

V1 must be testable with token #8521 / Sauce-0x.

Grounding source:

```text
/Users/sauce/Documents/New project/manifests/friendsies/token-8521.json
```

Token #8521 is a strong first target because it already appears in local Agent Avatar System notes as the Sauce-0x identity seed and exercises visible character accessories:

| Trait | Value |
|---|---|
| body | Knight |
| head | Steve |
| backpiece | Rocket |
| hand | Wubby |
| shoe | Convos Green Red |

## Required Outputs

Every V1 pack emits exactly these required PNG assets and one manifest:

| Output | File | Size | Background | Purpose |
|---|---|---:|---|---|
| Square avatar | `avatar-square.png` | `1024x1024` | included | Primary profile image for agents, chats, cards, and token pages |
| Transparent avatar | `avatar-transparent.png` | `2048x2048` | alpha | Compositable bust/upper-body cutout for UI surfaces |
| Banner | `avatar-banner.png` | `3000x1000` | included | Wide header/banner with safe negative space |
| Full body | `avatar-fullbody.png` | `2048x3072` | included | Full readable character reference |
| Manifest | `render-pack-manifest.json` | n/a | n/a | Reproducibility and provenance record |

Optional files may be added later, but V1 consumers should not depend on anything beyond this table.

## Preset Model

V1 separates identity, rendering, and export concerns.

### Identity Preset

Defines who the character is.

Required fields:

- `id`
- `displayName`
- `tokenId`
- `collection.contract`
- `collection.chain`
- `characterManifest`
- `role`

For #8521:

```json
{
  "id": "sauce-0x",
  "displayName": "Sauce-0x",
  "tokenId": 8521,
  "role": "agent identity seed",
  "characterManifest": "/Users/sauce/Documents/New project/manifests/friendsies/token-8521.json"
}
```

### Render Preset

Defines how the character should be presented.

V1 canonical preset:

```text
agent-id-v1
```

Required render sub-presets:

| Field | V1 Value | Notes |
|---|---|---|
| `posePreset` | `neutral-3q-readable-v1` | 3/4 body angle, head toward camera, face readable, arms relaxed |
| `lightingPreset` | `soft-studio-v1` | Soft key, gentle fill, readable face, light rim separation |
| `backgroundPreset` | `frienemies-cloud-v1` | Brand-safe soft studio/cloud background for non-alpha outputs |
| `colorPreset` | `filmic-medium-high-contrast-v1` | Matches current local Blender Filmic/Medium High Contrast defaults |
| `cameraPreset` | per-output crop | Each output owns crop/camera details |

### Export Pack

Defines what should be emitted.

V1 canonical pack:

```text
static-avatar-v1
```

Each export target records:

- output id
- file name
- resolution
- crop preset
- background mode
- alpha mode
- camera framing
- safe area

## Crop Presets

| Crop Preset | Used By | Framing Rule |
|---|---|---|
| `square-bust-v1` | `avatar-square.png` | Head and upper body, circle-safe, face centered above vertical midpoint |
| `transparent-bust-v1` | `avatar-transparent.png` | Upper body with alpha, enough padding for compositing |
| `banner-left-v1` | `avatar-banner.png` | Character on left or center-left, 45-55% horizontal safe empty space |
| `fullbody-v1` | `avatar-fullbody.png` | Entire character visible, feet and accessories not cropped |

## Camera And Render Defaults

V1 should begin from the local Blender token manifest's camera/lighting defaults, then override per-output framing.

Base defaults:

```json
{
  "engine": "BLENDER_EEVEE_NEXT",
  "samples": 64,
  "viewTransform": "Filmic",
  "look": "Medium High Contrast",
  "exposure": 0,
  "gamma": 1,
  "lens": 52,
  "cameraLocation": [2.8, -5.6, 2.1],
  "cameraTarget": [0, 0, 1.0]
}
```

The runner may use `auto_frame: true`, but it must produce deterministic crops for the same token, preset, Blender version, and input assets.

## Output Layout

Target output layout:

```text
output/render-packs/
  sauce-0x-token-8521/
    static-avatar-v1/
      avatar-square.png
      avatar-transparent.png
      avatar-banner.png
      avatar-fullbody.png
      render-pack-manifest.json
```

Web/public mirrors, if needed later:

```text
web/public/assets/render-packs/sauce-0x-token-8521/static-avatar-v1/
```

Generated PNGs and `.blend` files should stay out of `garden_reborn` unless intentionally selected as small fixtures or examples.

## Manifest Requirements

The generated `render-pack-manifest.json` must record:

- manifest `version`
- pack `kind`
- identity preset
- token ID and collection
- source character manifest path
- source trait asset URLs and local paths when available
- render preset and sub-presets
- export pack id
- output files, sizes, background mode, alpha mode, and crop preset
- Blender version and pipeline version when available
- generation timestamp
- input manifest hash when available
- output file hashes when available
- non-goals and limitations where useful

Schema:

```text
schemas/static-avatar.render-pack.v1.schema.json
```

Example:

```text
examples/render-packs/sauce-0x-token-8521.static-avatar-v1.json
```

## Runner Command

The local Blender implementation pass is tracked in [#71](https://github.com/PIZZALORD713/garden_reborn/issues/71). Regenerate the #8521 pack from this spec repo's example manifest with:

```bash
/Users/sauce/Documents/New project/scripts/build-static-avatar-render-pack.sh \
  examples/render-packs/sauce-0x-token-8521.static-avatar-v1.json
```

Run it from `garden_reborn`, or pass the absolute example manifest path from any working directory:

```bash
/Users/sauce/Documents/New\ project/scripts/build-static-avatar-render-pack.sh \
  /tmp/garden_reborn-qa/examples/render-packs/sauce-0x-token-8521.static-avatar-v1.json
```

The runner:

1. Load the render-pack manifest.
2. Resolve/fetch the token manifest if needed.
3. Assemble the character with the BODY-first Blender pipeline.
4. Apply `neutral-3q-readable-v1`.
5. Render all four output targets.
6. Write `render-pack-manifest.json` with generated timestamps and hashes.

The current local output path is:

```text
/Users/sauce/Documents/New project/output/render-packs/sauce-0x-token-8521/static-avatar-v1/
```

## Quality Gates

A V1 pack passes only when:

- all four PNG outputs exist
- dimensions match the spec exactly
- face/head/trait identity is readable at small size
- fullbody output does not crop head, feet, rocket, or hand accessory
- transparent output has a real alpha background
- banner leaves intentional safe space for UI/text
- output manifest records source URLs and local paths where available
- repeated runs with the same inputs produce visually equivalent outputs
- public wording does not imply official affiliation, guaranteed value, or finalized claim mechanics

## Non-Goals

V1 does not include:

- animation exports
- turntables, GIFs, or video
- multi-actor scenes
- prompt-to-scene generation
- wallet ownership verification
- Web3 claim, staking, inventory, or marketplace mechanics
- dynamic moods or expression variants
- final commercial rights language

## V2 Expansion Hooks

The V1 manifest leaves room for:

- `glbOutputs`
- `animationOutputs`
- `moodPresets`
- `scenePresets`
- `voiceOrPersonaRefs`
- collector/token page integration
- batch render jobs across many token IDs
