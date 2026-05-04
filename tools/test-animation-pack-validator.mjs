import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { extractAnimationTracksFromGlbBuffer } from "./glb-animation-tracks.mjs";

const require = createRequire(import.meta.url);
const { validateAnimationPack } = require("../animation-pack-validator.js");

const schema = JSON.parse(await readFile("schemas/animation.pack.schema.json", "utf8"));
const contract = JSON.parse(await readFile("schemas/skeleton.contract.v1.json", "utf8"));
const examplePack = JSON.parse(await readFile("packs/example-pack/pack.json", "utf8"));

function codes(messages) {
  return messages.map((message) => message.code);
}

function makePack(overrides = {}) {
  return {
    id: "validator-test",
    name: "Validator Test",
    version: "0.0.0",
    skeletonContract: "v1",
    clips: [
      {
        name: "Safe",
        url: "https://example.com/safe.glb",
        tracks: ["mixamorig:Hips.position", "mixamorig:LeftArm.quaternion"]
      }
    ],
    ...overrides
  };
}

function makeMinimalGlb(gltf) {
  const json = JSON.stringify(gltf);
  const jsonPadding = (4 - (Buffer.byteLength(json) % 4)) % 4;
  const jsonChunk = Buffer.concat([Buffer.from(json), Buffer.alloc(jsonPadding, 0x20)]);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length, 8);
  const chunkHeader = Buffer.alloc(8);
  chunkHeader.writeUInt32LE(jsonChunk.length, 0);
  chunkHeader.writeUInt32LE(0x4e4f534a, 4);
  return Buffer.concat([header, chunkHeader, jsonChunk]);
}

const exampleResult = validateAnimationPack(examplePack, { schema, contract });
assert.equal(exampleResult.ok, true, "existing example pack should remain valid");
assert.equal(exampleResult.errors.length, 0, "example pack should not produce errors");
assert.ok(
  codes(exampleResult.warnings).includes("clip.trackMetadataMissing"),
  "example pack should ask for track metadata without failing"
);

const missingClips = validateAnimationPack(makePack({ clips: [] }), { schema, contract });
assert.equal(missingClips.ok, false);
assert.ok(codes(missingClips.errors).includes("clip.missing"));

const trackHazards = validateAnimationPack(
  makePack({
    clips: [
      {
        name: "Hazards",
        url: "https://example.com/hazards.glb",
        tracks: ["mixamorig:Hips.scale", "LeftArm.position", "Tail.quaternion"]
      }
    ]
  }),
  { schema, contract }
);
assert.equal(trackHazards.ok, false);
assert.ok(codes(trackHazards.warnings).includes("track.scale"));
assert.ok(codes(trackHazards.warnings).includes("track.locationUnsafe"));
assert.ok(codes(trackHazards.errors).includes("track.boneUnknown"));

const strictTrackHazards = validateAnimationPack(
  makePack({
    clips: [
      {
        name: "Strict Hazards",
        url: "https://example.com/hazards.glb",
        tracks: ["mixamorig:Hips.scale", "LeftArm.position"]
      }
    ]
  }),
  { schema, contract, strictTracks: true }
);
assert.equal(strictTrackHazards.ok, false);
assert.ok(codes(strictTrackHazards.errors).includes("track.scale"));
assert.ok(codes(strictTrackHazards.errors).includes("track.locationUnsafe"));

const poseMismatch = validateAnimationPack(
  makePack({
    rigAssumptions: {
      sourceRestPose: "t-pose",
      targetRestPose: "a-pose",
      targetSkeletonContract: "v1"
    }
  }),
  { schema, contract }
);
assert.equal(poseMismatch.ok, false);
assert.ok(codes(poseMismatch.errors).includes("rig.restPoseMismatch"));

const scannedTracks = extractAnimationTracksFromGlbBuffer(
  makeMinimalGlb({
    asset: { version: "2.0" },
    nodes: [{ name: "mixamorig:Hips" }, { name: "LeftArm" }],
    animations: [
      {
        name: "Scanned",
        channels: [
          { sampler: 0, target: { node: 0, path: "translation" } },
          { sampler: 1, target: { node: 1, path: "scale" } }
        ],
        samplers: [{}, {}]
      }
    ]
  })
);
assert.deepEqual(
  scannedTracks.map((track) => [track.target, track.property]),
  [
    ["mixamorig:Hips", "position"],
    ["LeftArm", "scale"]
  ]
);

console.log("animation pack validator tests passed");
