# Animation Pack Validation

_Last updated: 2026-05-04_

Animation packs must be safe for both fRiENEMiES Studio and the Blender scene pipeline. The validator added for #66 checks pack manifests, skeleton compatibility, rest-pose assumptions, and animation track hazards before runtime playback or GLB export.

## CLI

```bash
node tools/validate-animation-pack.mjs packs/example-pack/pack.json
```

Useful options:

```bash
node tools/validate-animation-pack.mjs packs/example-pack/pack.json --json
node tools/validate-animation-pack.mjs packs/example-pack/pack.json --scan-glb
node tools/validate-animation-pack.mjs packs/example-pack/pack.json --scan-glb --fetch-remote
node tools/validate-animation-pack.mjs packs/example-pack/pack.json --strict-tracks
```

By default, the validator reads:

- `schemas/animation.pack.schema.json`
- `schemas/skeleton.contract.v1.json`

## What Gets Checked

Manifest checks:

- required fields: `id`, `name`, `version`, `skeletonContract`, `clips`
- `skeletonContract` must be `v1`
- clip entries must include `name` and `url`
- clip URLs must be absolute URIs or repo-relative paths
- clip arrays cannot be empty

Skeleton checks:

- track targets normalize through BODY-style bone aliases
- Mixamo-style prefixes such as `mixamorig:` are accepted
- aliases such as `pelvis -> hips` and `leftupperarm -> leftarm` are accepted
- current `animation_collection2` rig names such as `BiscepL`, `ArmL`, `ThighL`, and `Backpiece_Attachment` are aliased into BODY-compatible names
- unknown bone targets are errors because Studio and Blender cannot reliably retarget them

Track checks:

- scale tracks are flagged
- non-root/non-hips location tracks are flagged
- root/hips location tracks are allowed by default
- clip-level or pack-level `allowLocationTracks` can allow specific extra bones

Rig assumption checks:

- source and target rest poses must not conflict
- `targetSkeletonContract` must match the contract being validated
- declared rig bones must include required contract bones when provided
- `unitScale` must be a positive number when provided

## Track Metadata

Existing packs remain valid without track metadata, but the validator warns because it cannot inspect channel hazards until tracks are known.

Creators can add metadata directly:

```json
{
  "name": "Wave",
  "url": "https://example.com/wave.glb",
  "tracks": [
    "mixamorig:Hips.position",
    "mixamorig:LeftArm.quaternion"
  ]
}
```

Or the CLI can scan GLB channels:

```bash
node tools/validate-animation-pack.mjs packs/example-pack/pack.json --scan-glb --fetch-remote
```

Remote scans are opt-in so routine validation does not depend on CDN availability.

## Severity Rules

Errors fail validation:

- missing required manifest fields
- missing/empty `clips`
- wrong `skeletonContract`
- unknown bone targets
- incompatible rest-pose assumptions
- GLB scan failure or scanned clip with no animation channels

Warnings keep the pack usable but require creator attention:

- missing track metadata
- scale tracks
- unsafe location tracks
- unknown optional rest-pose labels

Use `--strict-tracks` to turn scale and unsafe location warnings into errors for release gates.

## Studio And Blender Behavior

Runtime Studio sanitation still drops scale tracks and unsafe bone location tracks during playback. Blender should do the same during import/retargeting. The validator exists so creators and agents see these issues before a scene or export run, with enough path information to fix the source pack.
