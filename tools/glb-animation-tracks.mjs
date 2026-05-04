import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;

function toArrayBufferView(buffer) {
  if (buffer instanceof Uint8Array) return buffer;
  if (buffer instanceof ArrayBuffer) return new Uint8Array(buffer);
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

export function readGlbJson(buffer) {
  const view = toArrayBufferView(buffer);
  const dataView = new DataView(view.buffer, view.byteOffset, view.byteLength);
  if (dataView.byteLength < 12) {
    throw new Error("GLB is too small to contain a valid header.");
  }
  if (dataView.getUint32(0, true) !== GLB_MAGIC) {
    throw new Error("File is not a GLB binary.");
  }
  const version = dataView.getUint32(4, true);
  if (version !== 2) {
    throw new Error(`Unsupported GLB version '${version}'.`);
  }

  let offset = 12;
  while (offset + 8 <= dataView.byteLength) {
    const chunkLength = dataView.getUint32(offset, true);
    const chunkType = dataView.getUint32(offset + 4, true);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkLength;
    if (chunkEnd > dataView.byteLength) {
      throw new Error("GLB chunk extends past file length.");
    }
    if (chunkType === JSON_CHUNK) {
      const jsonBytes = view.subarray(chunkStart, chunkEnd);
      const jsonText = new TextDecoder("utf-8").decode(jsonBytes).replace(/\0+$/g, "").trim();
      return JSON.parse(jsonText);
    }
    offset = chunkEnd;
  }

  throw new Error("GLB does not contain a JSON chunk.");
}

function propertyForGltfPath(targetPath) {
  if (targetPath === "translation") return "position";
  if (targetPath === "rotation") return "quaternion";
  return targetPath || "";
}

export function extractAnimationTracksFromGltf(gltf) {
  const nodes = Array.isArray(gltf?.nodes) ? gltf.nodes : [];
  const animations = Array.isArray(gltf?.animations) ? gltf.animations : [];
  const tracks = [];

  animations.forEach((animation, animationIndex) => {
    const channels = Array.isArray(animation?.channels) ? animation.channels : [];
    channels.forEach((channel, channelIndex) => {
      const target = channel?.target || {};
      const node = typeof target.node === "number" ? nodes[target.node] : null;
      const targetName = node?.name || (target.node !== undefined ? `node_${target.node}` : "");
      const property = propertyForGltfPath(target.path);
      tracks.push({
        name: [targetName, property].filter(Boolean).join("."),
        target: targetName,
        property,
        clipName: animation?.name || `Animation ${animationIndex + 1}`,
        animationIndex,
        channelIndex,
        source: "glb"
      });
    });
  });

  return tracks;
}

export function extractAnimationTracksFromGlbBuffer(buffer) {
  return extractAnimationTracksFromGltf(readGlbJson(buffer));
}

async function readClipBuffer(clipUrl, options = {}) {
  const baseDir = options.baseDir || process.cwd();
  const rawUrl = String(clipUrl || "");
  if (/^https?:\/\//i.test(rawUrl)) {
    if (!options.fetchRemote) {
      return {
        skipped: true,
        reason: "remote_fetch_disabled",
        hint: "Pass --fetch-remote with --scan-glb to inspect remote clip channels."
      };
    }
    const response = await fetch(rawUrl);
    if (!response.ok) {
      throw new Error(`Remote clip fetch failed with ${response.status}.`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  const filePath = rawUrl.startsWith("file:")
    ? fileURLToPath(rawUrl)
    : path.resolve(baseDir, rawUrl);
  return readFile(filePath);
}

export async function scanClipAnimationTracks(clip, options = {}) {
  const clipName = clip?.name || "unnamed";
  const clipUrl = clip?.url || "";
  const buffer = await readClipBuffer(clipUrl, options);
  if (buffer?.skipped) {
    return {
      tracks: [],
      messages: [
        {
          severity: "warning",
          code: "clip.scanSkipped",
          path: options.path || "$.clips[]",
          message: `Skipped GLB scan for '${clipName}'.`,
          hint: buffer.hint,
          details: { reason: buffer.reason, url: clipUrl }
        }
      ]
    };
  }

  const tracks = extractAnimationTracksFromGlbBuffer(buffer);
  const messages = [];
  if (!tracks.length) {
    messages.push({
      severity: "error",
      code: "clip.noAnimations",
      path: options.path || "$.clips[]",
      message: `Clip '${clipName}' has no animation channels.`,
      hint: "Export a GLB with at least one animation channel or remove this clip from the pack."
    });
  }
  return { tracks, messages };
}
