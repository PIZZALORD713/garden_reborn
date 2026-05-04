#!/usr/bin/env node
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { scanClipAnimationTracks } from "./glb-animation-tracks.mjs";

const require = createRequire(import.meta.url);
const { validateAnimationPack } = require("../animation-pack-validator.js");

function usage() {
  return [
    "Usage:",
    "  node tools/validate-animation-pack.mjs <pack.json> [more-pack.json...] [options]",
    "",
    "Options:",
    "  --schema <path>       Animation pack schema path",
    "  --contract <path>     Skeleton contract path",
    "  --scan-glb            Read GLB animation channels and validate tracks",
    "  --fetch-remote        Allow --scan-glb to fetch https:// clip URLs",
    "  --strict-tracks       Treat scale/location track hazards as errors",
    "  --json                Print JSON results"
  ].join("\n");
}

function parseArgs(argv) {
  const options = {
    schemaPath: "schemas/animation.pack.schema.json",
    contractPath: "schemas/skeleton.contract.v1.json",
    scanGlb: false,
    fetchRemote: false,
    strictTracks: false,
    json: false,
    packPaths: []
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--schema") {
      options.schemaPath = argv[++i];
    } else if (arg === "--contract") {
      options.contractPath = argv[++i];
    } else if (arg === "--scan-glb") {
      options.scanGlb = true;
    } else if (arg === "--fetch-remote") {
      options.fetchRemote = true;
    } else if (arg === "--strict-tracks") {
      options.strictTracks = true;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(usage());
      process.exit(0);
    } else {
      options.packPaths.push(arg);
    }
  }

  return options;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function appendMessages(result, messages) {
  for (const message of messages) {
    if (message.severity === "error") result.errors.push(message);
    else result.warnings.push(message);
  }
  result.ok = result.errors.length === 0;
}

async function addScannedTracks(manifest, packPath, options) {
  const messages = [];
  if (!Array.isArray(manifest.clips)) return messages;

  const baseDir = path.dirname(path.resolve(packPath));
  for (let index = 0; index < manifest.clips.length; index += 1) {
    const clip = manifest.clips[index];
    try {
      const scan = await scanClipAnimationTracks(clip, {
        baseDir,
        fetchRemote: options.fetchRemote,
        path: `$.clips[${index}]`
      });
      if (scan.tracks.length) {
        clip.tracks = [...(Array.isArray(clip.tracks) ? clip.tracks : []), ...scan.tracks];
      }
      messages.push(...scan.messages);
    } catch (err) {
      messages.push({
        severity: "error",
        code: "clip.scanFailed",
        path: `$.clips[${index}].url`,
        message: `Failed to scan '${clip?.name || index}': ${err?.message || err}`,
        hint: "Confirm the clip URL points to a valid GLB file."
      });
    }
  }

  return messages;
}

function printTextResult(packPath, result) {
  const status = result.ok ? "OK" : "FAIL";
  console.log(
    `${status} ${packPath} (${result.summary.clipCount} clips, ${result.summary.trackCount} tracks, ${result.errors.length} errors, ${result.warnings.length} warnings)`
  );
  for (const message of [...result.errors, ...result.warnings]) {
    const label = message.severity.toUpperCase();
    console.log(`  ${label} ${message.code} ${message.path}: ${message.message}`);
    if (message.hint) console.log(`    hint: ${message.hint}`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.packPaths.length) {
    console.error(usage());
    process.exit(2);
  }

  const schema = await readJson(options.schemaPath);
  const contract = await readJson(options.contractPath);
  const results = [];

  for (const packPath of options.packPaths) {
    const manifest = cloneJson(await readJson(packPath));
    const scanMessages = options.scanGlb ? await addScannedTracks(manifest, packPath, options) : [];
    const result = validateAnimationPack(manifest, {
      schema,
      contract,
      strictTracks: options.strictTracks
    });
    appendMessages(result, scanMessages);
    results.push({ packPath, ...result });
  }

  if (options.json) {
    console.log(JSON.stringify({ ok: results.every((result) => result.ok), results }, null, 2));
  } else {
    results.forEach((result) => printTextResult(result.packPath, result));
  }

  process.exit(results.every((result) => result.ok) ? 0 : 1);
}

main().catch((err) => {
  console.error(err?.stack || err?.message || err);
  process.exit(1);
});
