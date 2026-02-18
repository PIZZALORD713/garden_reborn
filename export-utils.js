(() => {
  function parseGlb(arrayBuffer) {
    const u8 = new Uint8Array(arrayBuffer);
    const dv = new DataView(arrayBuffer);

    const magic = dv.getUint32(0, true);
    if (magic !== 0x46546c67) throw new Error("Not a GLB (bad magic)");

    const version = dv.getUint32(4, true);
    if (version !== 2) throw new Error(`Unsupported GLB version: ${version}`);

    let offset = 12;
    let jsonChunk = null;
    let binChunk = null;

    while (offset + 8 <= u8.byteLength) {
      const chunkLength = dv.getUint32(offset, true);
      const chunkType = dv.getUint32(offset + 4, true);
      const chunkStart = offset + 8;
      const chunkEnd = chunkStart + chunkLength;

      if (chunkEnd > u8.byteLength) break;

      if (chunkType === 0x4e4f534a) {
        jsonChunk = u8.slice(chunkStart, chunkEnd);
      } else if (chunkType === 0x004e4942) {
        binChunk = u8.slice(chunkStart, chunkEnd);
      }

      offset = chunkEnd;
    }

    if (!jsonChunk) throw new Error("GLB missing JSON chunk");

    const jsonText = new TextDecoder("utf-8").decode(jsonChunk);
    const json = JSON.parse(jsonText);

    return { json, binChunk };
  }

  function buildGlb(json, binChunk) {
    const enc = new TextEncoder();
    const jsonBytes = enc.encode(JSON.stringify(json));

    const pad4 = (n) => (4 - (n % 4)) % 4;
    const jsonPad = pad4(jsonBytes.byteLength);
    const binPad = binChunk ? pad4(binChunk.byteLength) : 0;

    const jsonChunkLen = jsonBytes.byteLength + jsonPad;
    const binChunkLen = binChunk ? binChunk.byteLength + binPad : 0;

    const totalLen = 12 + 8 + jsonChunkLen + (binChunk ? 8 + binChunkLen : 0);

    const out = new ArrayBuffer(totalLen);
    const dv = new DataView(out);
    const u8 = new Uint8Array(out);

    dv.setUint32(0, 0x46546c67, true);
    dv.setUint32(4, 2, true);
    dv.setUint32(8, totalLen, true);

    let offset = 12;

    dv.setUint32(offset, jsonChunkLen, true);
    dv.setUint32(offset + 4, 0x4e4f534a, true);
    offset += 8;
    u8.set(jsonBytes, offset);
    offset += jsonBytes.byteLength;
    for (let i = 0; i < jsonPad; i++) u8[offset++] = 0x20;

    if (binChunk) {
      dv.setUint32(offset, binChunkLen, true);
      dv.setUint32(offset + 4, 0x004e4942, true);
      offset += 8;
      u8.set(binChunk, offset);
      offset += binChunk.byteLength;
      for (let i = 0; i < binPad; i++) u8[offset++] = 0;
    }

    return out;
  }

  function deepEqualJson(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  function dedupeSamplers(gltf) {
    const samplers = gltf.samplers;
    const textures = gltf.textures;
    if (!Array.isArray(samplers) || !Array.isArray(textures) || samplers.length < 2) {
      return { changed: false };
    }

    const newSamplers = [];
    const remap = new Map();

    for (let i = 0; i < samplers.length; i++) {
      const s = samplers[i] || {};
      let found = -1;
      for (let j = 0; j < newSamplers.length; j++) {
        if (deepEqualJson(newSamplers[j], s)) {
          found = j;
          break;
        }
      }
      if (found === -1) {
        found = newSamplers.length;
        newSamplers.push(s);
      }
      remap.set(i, found);
    }

    let texChanged = false;
    for (const t of textures) {
      if (!t) continue;
      const old = t.sampler;
      if (typeof old === "number" && remap.has(old)) {
        const nu = remap.get(old);
        if (nu !== old) {
          t.sampler = nu;
          texChanged = true;
        }
      }
    }

    const changed = texChanged || newSamplers.length !== samplers.length;
    if (changed) gltf.samplers = newSamplers;
    return { changed, before: samplers.length, after: newSamplers.length };
  }

  function dedupeSkins(gltf, binChunk) {
    const skins = gltf.skins;
    const nodes = gltf.nodes;
    if (!Array.isArray(skins) || skins.length < 2 || !Array.isArray(nodes)) {
      return { changed: false };
    }

    const accessors = gltf.accessors;
    const bufferViews = gltf.bufferViews;
    const bin = binChunk
      ? new Uint8Array(binChunk.buffer, binChunk.byteOffset, binChunk.byteLength)
      : null;

    const getAccessorByteSliceKey = (accessorIndex) => {
      if (!bin || !Array.isArray(accessors) || !Array.isArray(bufferViews)) return null;
      const acc = accessors[accessorIndex];
      if (!acc) return null;
      const bv = bufferViews[acc.bufferView];
      if (!bv) return null;

      if (acc.componentType !== 5126 || acc.type !== "MAT4") return null;

      const byteOffset = (bv.byteOffset || 0) + (acc.byteOffset || 0);
      const byteLength = (bv.byteStride || 64) * (acc.count || 0);
      if (byteLength <= 0) return null;
      const end = byteOffset + byteLength;
      if (byteOffset < 0 || end > bin.byteLength) return null;

      const view = bin.subarray(byteOffset, end);
      let h = 2166136261;
      const step = Math.max(1, Math.floor(view.length / 64));
      for (let i = 0; i < view.length; i += step) {
        h ^= view[i];
        h = Math.imul(h, 16777619);
      }
      return `${view.length}:${h >>> 0}`;
    };

    const keyForSkin = (s) => {
      if (!s) return "null";

      const joints = Array.isArray(s.joints) ? s.joints : null;
      const skeleton = typeof s.skeleton === "number" ? s.skeleton : null;

      const ibm = typeof s.inverseBindMatrices === "number" ? s.inverseBindMatrices : null;
      const ibmKey = ibm !== null ? getAccessorByteSliceKey(ibm) : null;

      return JSON.stringify({ joints, skeleton, ibmKey: ibmKey || ibm });
    };

    const mapKeyToNew = new Map();
    const remap = new Map();
    const newSkins = [];

    for (let i = 0; i < skins.length; i++) {
      const s = skins[i];
      const k = keyForSkin(s);
      if (!mapKeyToNew.has(k)) {
        mapKeyToNew.set(k, newSkins.length);
        newSkins.push(s);
      }
      remap.set(i, mapKeyToNew.get(k));
    }

    let nodeChanged = false;
    for (const n of nodes) {
      if (!n) continue;
      const old = n.skin;
      if (typeof old === "number" && remap.has(old)) {
        const nu = remap.get(old);
        if (nu !== old) {
          n.skin = nu;
          nodeChanged = true;
        }
      }
    }

    const changed = nodeChanged || newSkins.length !== skins.length;
    if (changed) gltf.skins = newSkins;
    return { changed, before: skins.length, after: gltf.skins.length };
  }

  function bakeAndRemoveKHRTextureTransform_FlipYOnly(gltf, binChunk) {
    if (!gltf?.materials || !gltf?.meshes || !gltf?.accessors || !gltf?.bufferViews) {
      return { changed: false };
    }

    const materials = gltf.materials;
    const meshes = gltf.meshes;

    const flipYTextures = new Set();

    for (let mi = 0; mi < materials.length; mi++) {
      const m = materials[mi];
      const tex = m?.pbrMetallicRoughness?.baseColorTexture;
      const ext = tex?.extensions?.KHR_texture_transform;
      if (!ext) continue;

      const off = ext.offset || [0, 0];
      const sc = ext.scale || [1, 1];
      const rot = ext.rotation || 0;

      const isFlipY = rot === 0 && off[0] === 0 && off[1] === 1 && sc[0] === 1 && sc[1] === -1;
      if (!isFlipY) continue;

      const ti = tex.index;
      if (typeof ti === "number") flipYTextures.add(ti);
    }

    if (!flipYTextures.size) return { changed: false };

    const materialNeedsFlip = new Set();
    for (let mi = 0; mi < materials.length; mi++) {
      const m = materials[mi];
      const tex = m?.pbrMetallicRoughness?.baseColorTexture;
      const ti = tex?.index;
      if (typeof ti === "number" && flipYTextures.has(ti)) materialNeedsFlip.add(mi);
    }

    const bin = binChunk
      ? new Uint8Array(binChunk.buffer, binChunk.byteOffset, binChunk.byteLength)
      : null;
    if (!bin) return { changed: false };

    const accessors = gltf.accessors;
    const bufferViews = gltf.bufferViews;

    const flipAccessor = (accessorIndex) => {
      const acc = accessors[accessorIndex];
      if (!acc || acc.componentType !== 5126 || acc.type !== "VEC2") return false;

      const bv = bufferViews[acc.bufferView];
      if (!bv) return false;

      const baseOffset = (bv.byteOffset || 0) + (acc.byteOffset || 0);
      const stride = bv.byteStride || 8;
      const count = acc.count || 0;

      const lastByte = baseOffset + stride * (count - 1) + 8;
      if (count <= 0 || baseOffset < 0 || lastByte > bin.byteLength) return false;

      const dv = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
      for (let i = 0; i < count; i++) {
        const yOff = baseOffset + i * stride + 4;
        const y = dv.getFloat32(yOff, true);
        dv.setFloat32(yOff, 1.0 - y, true);
      }

      if (Array.isArray(acc.min) && acc.min.length === 2) {
        const minY = acc.min[1];
        const maxY = Array.isArray(acc.max) ? acc.max[1] : undefined;
        if (typeof minY === "number" && typeof maxY === "number") {
          acc.min[1] = 1.0 - maxY;
          if (Array.isArray(acc.max) && acc.max.length === 2) {
            acc.max[1] = 1.0 - minY;
          }
        }
      }

      return true;
    };

    const flippedAccessors = new Set();
    let changed = false;

    for (const mesh of meshes) {
      for (const prim of mesh?.primitives || []) {
        if (!prim) continue;
        const matIndex = prim.material;
        if (typeof matIndex !== "number" || !materialNeedsFlip.has(matIndex)) continue;

        const uvAccessor = prim.attributes?.TEXCOORD_0;
        if (typeof uvAccessor !== "number" || flippedAccessors.has(uvAccessor)) continue;

        if (flipAccessor(uvAccessor)) {
          flippedAccessors.add(uvAccessor);
          changed = true;
        }
      }
    }

    if (!changed) return { changed: false };

    for (const m of materials) {
      const tex = m?.pbrMetallicRoughness?.baseColorTexture;
      const ext = tex?.extensions?.KHR_texture_transform;
      if (!ext) continue;

      const off = ext.offset || [0, 0];
      const sc = ext.scale || [1, 1];
      const rot = ext.rotation || 0;
      const isFlipY = rot === 0 && off[0] === 0 && off[1] === 1 && sc[0] === 1 && sc[1] === -1;
      if (!isFlipY) continue;

      delete tex.extensions.KHR_texture_transform;
      if (Object.keys(tex.extensions).length === 0) delete tex.extensions;
    }

    if (Array.isArray(gltf.extensionsUsed)) {
      const stillUsed = new Set();
      const scan = (obj) => {
        if (!obj || typeof obj !== "object") return;
        if (obj.extensions && typeof obj.extensions === "object") {
          for (const k of Object.keys(obj.extensions)) stillUsed.add(k);
        }
        for (const v of Object.values(obj)) scan(v);
      };
      scan(gltf);
      gltf.extensionsUsed = gltf.extensionsUsed.filter((k) => stillUsed.has(k));
      if (!gltf.extensionsUsed.length) delete gltf.extensionsUsed;
    }

    return {
      changed: true,
      flippedAccessors: flippedAccessors.size,
      textures: flipYTextures.size
    };
  }

  function sanitizeMaterialsForWindows(gltf) {
    const mats = gltf.materials;
    if (!Array.isArray(mats) || !mats.length) return { changed: false };

    const clamp01 = (x) => {
      const n = Number(x);
      if (!Number.isFinite(n)) return x;
      return Math.min(1, Math.max(0, n));
    };

    let changed = false;
    let clamped = 0;
    let strippedExtras = 0;

    for (const m of mats) {
      if (!m) continue;

      if (m.extras && typeof m.extras === "object") {
        delete m.extras;
        strippedExtras++;
        changed = true;
      }

      if (Array.isArray(m.emissiveFactor) && m.emissiveFactor.length === 3) {
        const before = m.emissiveFactor.slice();
        m.emissiveFactor = [
          clamp01(m.emissiveFactor[0]),
          clamp01(m.emissiveFactor[1]),
          clamp01(m.emissiveFactor[2])
        ];
        if (JSON.stringify(before) !== JSON.stringify(m.emissiveFactor)) {
          clamped++;
          changed = true;
        }
      }

      const pbr = m.pbrMetallicRoughness;
      if (pbr && typeof pbr === "object") {
        if (typeof pbr.metallicFactor === "number") {
          const v = clamp01(pbr.metallicFactor);
          if (v !== pbr.metallicFactor) {
            pbr.metallicFactor = v;
            clamped++;
            changed = true;
          }
        }
        if (typeof pbr.roughnessFactor === "number") {
          const v = clamp01(pbr.roughnessFactor);
          if (v !== pbr.roughnessFactor) {
            pbr.roughnessFactor = v;
            clamped++;
            changed = true;
          }
        }
        if (Array.isArray(pbr.baseColorFactor) && pbr.baseColorFactor.length === 4) {
          const before = pbr.baseColorFactor.slice();
          pbr.baseColorFactor = [
            clamp01(pbr.baseColorFactor[0]),
            clamp01(pbr.baseColorFactor[1]),
            clamp01(pbr.baseColorFactor[2]),
            clamp01(pbr.baseColorFactor[3])
          ];
          if (JSON.stringify(before) !== JSON.stringify(pbr.baseColorFactor)) {
            clamped++;
            changed = true;
          }
        }
      }
    }

    return { changed, clamped, strippedExtras };
  }

  function optimizeGlbForWindows(rawGlb) {
    const { json, binChunk } = parseGlb(rawGlb);

    const report = { steps: [] };

    const bakeRes = bakeAndRemoveKHRTextureTransform_FlipYOnly(json, binChunk);
    if (bakeRes.changed) report.steps.push({ step: "bakeFlipY", ...bakeRes });

    const samplerRes = dedupeSamplers(json);
    if (samplerRes.changed) report.steps.push({ step: "dedupeSamplers", ...samplerRes });

    const skinRes = dedupeSkins(json, binChunk);
    if (skinRes.changed) report.steps.push({ step: "dedupeSkins", ...skinRes });

    const matRes = sanitizeMaterialsForWindows(json);
    if (matRes.changed) report.steps.push({ step: "sanitizeMaterials", ...matRes });

    const matCount = Array.isArray(json.materials) ? json.materials.length : 0;
    const imgCount = Array.isArray(json.images) ? json.images.length : 0;
    const texCount = Array.isArray(json.textures) ? json.textures.length : 0;

    if (!matCount) throw new Error("Optimize sanity check failed: 0 materials");
    if (!imgCount && texCount) {
      throw new Error("Optimize sanity check failed: textures but 0 images");
    }

    return { glb: buildGlb(json, binChunk), report };
  }

  window.FrienemiesExportUtils = {
    parseGlb,
    buildGlb,
    deepEqualJson,
    dedupeSamplers,
    dedupeSkins,
    bakeAndRemoveKHRTextureTransform_FlipYOnly,
    sanitizeMaterialsForWindows,
    optimizeGlbForWindows
  };
})();
