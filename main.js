// ------------------------------------------------------------
// fRiENDSiES Toy Box — Viewer + Animation Test
// - BODY is the master rig (skeleton source)
// - HEAD + trait parts: bind SkinnedMeshes to BODY skeleton
// - FIX: also retarget rigid (non-skinned) meshes parented under part bones
// - Face texture: overlay mesh anchored to BODY head bone
//
// UI upgrades in this version:
// - Gear button toggles ALL UI (controls + transcript)
// - Transcript panel can collapse independently
// - Trait URLs / Rig Bones print into transcript (not dev console)
//
// UPDATE (2026-01-27):
// - Panorama sphere fix: avoid double-inverting (scale(-1...) + BackSide).
//   We keep geo.scale(-1,1,1) and switch material side to FrontSide.
//   Also force pano to render as true background.
// ------------------------------------------------------------

// ----------------------------
// Cache busting for static assets (update this when you replace files)
// ----------------------------
const ASSET_VERSION = "2026-01-27a";

// ----------------------------
// Assets in your repo root
// ----------------------------
const PANORAMA_URL = `./garden-cotton-clouds.png?v=${encodeURIComponent(
  ASSET_VERSION
)}`;
const EXR_ENV_URL = `./friendsies_cloud_overcast_studio_v1.exr?v=${encodeURIComponent(
  ASSET_VERSION
)}`;

// ----------------------------
// Metadata
// ----------------------------
const METADATA_URL =
  "https://gist.githubusercontent.com/IntergalacticPizzaLord/a7b0eeac98041a483d715c8320ccf660/raw/ce7d37a94c33c63e2b50d5922e0711e72494c8dd/fRiENDSiES";

// ----------------------------
// UI state keys
// ----------------------------
const LS_UI_HIDDEN = "toybox_ui_hidden_v1";
const LS_LOG_COLLAPSED = "toybox_log_collapsed_v1";
const LS_AUTORANDOM = "toybox_auto_random_v1";

// ----------------------------
// Scene / Camera / Renderer
// ----------------------------
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);
camera.position.set(0, 1.2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0xffffff);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.physicallyCorrectLights = true;

document.body.appendChild(renderer.domElement);

// ----------------------------
// Look controls + presets
// ----------------------------
const LOOK_CONTROLS = {
  toneMapping: "ACES",
  toneMappingExposure: 1.04,
  ambientIntensity: 0.12,
  hemiIntensity: 0.72,
  keyIntensity: 0.55,
  rimIntensity: 0.55,
  envMapIntensity: 0.1,
  emissiveIntensity: 0.75,
  keyLightIntensity: 0.55,
  rimLightIntensity: 0.55,
  envIntensityMultiplier: 0.1,
  emissiveIntensityMultiplier: 0.75
};

const LOOK_PRESETS = {
  Cinematic: {
    toneMapping: "ACES",
    toneMappingExposure: 1.04,
    ambientIntensity: 0.12,
    hemiIntensity: 0.72,
    keyIntensity: 0.55,
    rimIntensity: 0.55,
    envMapIntensity: 0.1,
    emissiveIntensity: 0.75
  },
  "Punchy Toybox": {
    toneMapping: "ACES",
    toneMappingExposure: 1.2,
    ambientIntensity: 0.12,
    hemiIntensity: 0.2,
    keyIntensity: 1.0,
    rimIntensity: 0.45,
    envMapIntensity: 1.5,
    emissiveIntensity: 2.0
  },
  "Soft Pastel": {
    toneMapping: "Reinhard",
    toneMappingExposure: 0.95,
    ambientIntensity: 0.25,
    hemiIntensity: 0.35,
    keyIntensity: 0.55,
    rimIntensity: 0.22,
    envMapIntensity: 0.9,
    emissiveIntensity: 1.1
  }
};

function resolveToneMapping(name) {
  switch (String(name).toLowerCase()) {
    case "reinhard":
      return THREE.ReinhardToneMapping;
    case "aces":
    case "acesfilmic":
    default:
      return THREE.ACESFilmicToneMapping;
  }
}

function registerMaterialDefaults(m) {
  if (!m) return;
  m.userData = m.userData || {};

  if (m.userData.baseEnvMapIntensity === undefined) {
    const base =
      typeof m.envMapIntensity === "number" ? m.envMapIntensity : 1.0;
    m.userData.baseEnvMapIntensity = base;
  }

  if (m.emissiveMap && m.userData.baseEmissiveIntensity === undefined) {
    const base =
      typeof m.emissiveIntensity === "number" ? m.emissiveIntensity : 1.0;
    m.userData.baseEmissiveIntensity = base;
  }
}

function normalizeLookControls() {
  if (LOOK_CONTROLS.keyLightIntensity === undefined) {
    LOOK_CONTROLS.keyLightIntensity = LOOK_CONTROLS.keyIntensity ?? 0.75;
  }
  if (LOOK_CONTROLS.rimLightIntensity === undefined) {
    LOOK_CONTROLS.rimLightIntensity = LOOK_CONTROLS.rimIntensity ?? 0.35;
  }
  if (LOOK_CONTROLS.envIntensityMultiplier === undefined) {
    LOOK_CONTROLS.envIntensityMultiplier = LOOK_CONTROLS.envMapIntensity ?? 1.0;
  }
  if (LOOK_CONTROLS.emissiveIntensityMultiplier === undefined) {
    LOOK_CONTROLS.emissiveIntensityMultiplier =
      LOOK_CONTROLS.emissiveIntensity ?? 1.0;
  }

  LOOK_CONTROLS.keyIntensity = LOOK_CONTROLS.keyLightIntensity;
  LOOK_CONTROLS.rimIntensity = LOOK_CONTROLS.rimLightIntensity;
  LOOK_CONTROLS.envMapIntensity = LOOK_CONTROLS.envIntensityMultiplier;
  LOOK_CONTROLS.emissiveIntensity = LOOK_CONTROLS.emissiveIntensityMultiplier;
}

function applyLookToMaterials(root) {
  if (!root) return;
  root.traverse((child) => {
    if (!child.isMesh) return;

    const mats = Array.isArray(child.material) ? child.material : [child.material];
    for (const m of mats) {
      if (!m) continue;
      registerMaterialDefaults(m);

      if ("envMapIntensity" in m) {
        m.envMapIntensity =
          m.userData.baseEnvMapIntensity * LOOK_CONTROLS.envIntensityMultiplier;
      }

      if (m.emissiveMap) {
        m.emissive = new THREE.Color(0xffffff);
        const base = m.userData.baseEmissiveIntensity ?? 1.0;
        m.emissiveIntensity = base * LOOK_CONTROLS.emissiveIntensityMultiplier;
      }

      m.needsUpdate = true;
    }
  });
}

function applyLookControls() {
  normalizeLookControls();
  renderer.toneMapping = resolveToneMapping(LOOK_CONTROLS.toneMapping);
  renderer.toneMappingExposure = LOOK_CONTROLS.toneMappingExposure;

  hemisphereLight.intensity = LOOK_CONTROLS.hemiIntensity;
  ambientLight.intensity = LOOK_CONTROLS.ambientIntensity;
  keyLight.intensity = LOOK_CONTROLS.keyLightIntensity;
  rim.intensity = LOOK_CONTROLS.rimLightIntensity;

  applyLookToMaterials(avatarGroup);
}

function applyLookPreset(name) {
  const preset = LOOK_PRESETS[name];
  if (!preset) return;
  Object.assign(LOOK_CONTROLS, preset);
  normalizeLookControls();
  applyLookControls();
  syncLookSliders();
  const msg = `🎨 Look preset applied: ${name}`;
  console.log(msg, { ...LOOK_CONTROLS });
  logLine(msg);
}

// OrbitControls (debug camera)
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 2;
controls.maxDistance = 14;
controls.target.set(0, 1.0, 0);

// ----------------------------
// UI wiring
// ----------------------------
const uiRoot = document.getElementById("ui");

const el = {
  uiToggleBtn: document.getElementById("uiToggleBtn"),
  panel: document.getElementById("panel"),
  logPanel: document.getElementById("logPanel"),
  logToggleBtn: document.getElementById("logToggleBtn"),
  logChevron: document.getElementById("logChevron"),
  lookPanel: document.getElementById("lookPanel"),
  lookToggleBtn: document.getElementById("lookToggleBtn"),
  lookControls: document.getElementById("lookControls"),
  copyLookBtn: document.getElementById("copyLookBtn"),

  status: document.getElementById("status"),
  friendsiesId: document.getElementById("friendsiesId"),
  loadBtn: document.getElementById("loadBtn"),
  randomBtn: document.getElementById("randomBtn"),
  autoRandomOn: document.getElementById("autoRandomOn"),

  animSelect: document.getElementById("animSelect"),
  playBtn: document.getElementById("playBtn"),
  stopBtn: document.getElementById("stopBtn"),

  orbitOn: document.getElementById("orbitOn"),
  autoRotateOn: document.getElementById("autoRotateOn"),

  printTraitsBtn: document.getElementById("printTraitsBtn"),
  printRigBtn: document.getElementById("printRigBtn"),

  log: document.getElementById("log"),
  clearLogBtn: document.getElementById("clearLogBtn")
};

function setStatus(s) {
  if (el.status) el.status.textContent = s;
  logLine(`• ${s}`, "dim");
}

// Transcript helpers
function logLine(text, cls = "") {
  if (!el.log) return;

  // Keep scroll “sticky” only if user is already near bottom
  const nearBottom =
    el.log.scrollTop + el.log.clientHeight >= el.log.scrollHeight - 30;

  const div = document.createElement("div");
  div.className = `logLine ${cls}`.trim();
  div.textContent = String(text);
  el.log.appendChild(div);

  // Cap lines so it doesn’t grow forever
  const MAX_LINES = 220;
  while (el.log.childNodes.length > MAX_LINES) {
    el.log.removeChild(el.log.firstChild);
  }

  if (nearBottom) el.log.scrollTop = el.log.scrollHeight;
}

function logSection(title) {
  logLine("");
  logLine(`=== ${title} ===`);
}

function clearLog() {
  if (el.log) el.log.innerHTML = "";
  logLine("Transcript cleared.");
}

function formatLookValue(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return String(value);
  return value.toFixed(2);
}

function syncLookSliders() {
  const sliders = document.querySelectorAll("[data-look-control]");
  sliders.forEach((slider) => {
    const key = slider.dataset.lookControl;
    if (!key || !(key in LOOK_CONTROLS)) return;
    const value = LOOK_CONTROLS[key];
    slider.value = String(value);
  });

  const valueEls = document.querySelectorAll("[data-look-value]");
  valueEls.forEach((elValue) => {
    const key = elValue.dataset.lookValue;
    if (!key || !(key in LOOK_CONTROLS)) return;
    elValue.textContent = formatLookValue(LOOK_CONTROLS[key]);
  });
}

function updateLookControl(key, value) {
  LOOK_CONTROLS[key] = value;
  normalizeLookControls();
  applyLookControls();
  syncLookSliders();
}

function copyCurrentLook() {
  normalizeLookControls();
  const json = JSON.stringify(LOOK_CONTROLS, null, 2);
  logSection("Current Look JSON");
  logLine(json);
  console.log("Current Look JSON", json);
}

// UI visibility
function getBoolLS(key, fallback = false) {
  const v = localStorage.getItem(key);
  if (v === null) return fallback;
  return v === "1";
}
function setBoolLS(key, val) {
  localStorage.setItem(key, val ? "1" : "0");
}

function applyUIHidden(hidden) {
  uiRoot.classList.toggle("uiHidden", hidden);
  if (el.panel) el.panel.setAttribute("aria-hidden", hidden ? "true" : "false");
  if (el.logPanel)
    el.logPanel.setAttribute("aria-hidden", hidden ? "true" : "false");
  setBoolLS(LS_UI_HIDDEN, hidden);
}

function applyLogCollapsed(collapsed) {
  uiRoot.classList.toggle("logCollapsed", collapsed);
  setBoolLS(LS_LOG_COLLAPSED, collapsed);
}

// initialize UI states
applyUIHidden(getBoolLS(LS_UI_HIDDEN, false));
applyLogCollapsed(getBoolLS(LS_LOG_COLLAPSED, false));

// Buttons + keyboard shortcuts
el.uiToggleBtn?.addEventListener("click", () => {
  applyUIHidden(!uiRoot.classList.contains("uiHidden"));
});

el.logToggleBtn?.addEventListener("click", () => {
  applyLogCollapsed(!uiRoot.classList.contains("logCollapsed"));
});

el.clearLogBtn?.addEventListener("click", clearLog);

el.lookToggleBtn?.addEventListener("click", () => {
  if (!el.lookPanel || !el.lookControls) return;
  const collapsed = !el.lookPanel.classList.contains("collapsed");
  el.lookPanel.classList.toggle("collapsed", collapsed);
  el.lookToggleBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
  el.lookControls.setAttribute("aria-hidden", collapsed ? "true" : "false");
});

el.copyLookBtn?.addEventListener("click", copyCurrentLook);

document.querySelectorAll("[data-look-control]").forEach((slider) => {
  slider.addEventListener("input", (event) => {
    const key = event.target.dataset.lookControl;
    const value = Number(event.target.value);
    if (!key || !Number.isFinite(value)) return;
    updateLookControl(key, value);
  });
});

document.addEventListener("keydown", (e) => {
  const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : "";
  const typing = tag === "input" || tag === "select" || tag === "textarea";
  if (typing) return;

  if (e.key.toLowerCase() === "h") {
    applyUIHidden(!uiRoot.classList.contains("uiHidden"));
  }
  if (e.key.toLowerCase() === "l") {
    applyLogCollapsed(!uiRoot.classList.contains("logCollapsed"));
  }
  if (e.key === "1") applyLookPreset("Cinematic");
  if (e.key === "2") applyLookPreset("Punchy Toybox");
  if (e.key === "3") applyLookPreset("Soft Pastel");
  if (e.key.toLowerCase() === "p") copyCurrentLook();
});

// ----------------------------
// Lights (plus a tiny rim for metals)
// ----------------------------
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.35);
scene.add(hemisphereLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 0.65);
keyLight.position.set(-0.5, 2.5, 5);
scene.add(keyLight);

const rim = new THREE.DirectionalLight(0xffffff, 0.25);
rim.position.set(2.5, 1.5, -3.5);
scene.add(rim);

// ----------------------------
// Loaders
// ----------------------------
const dracoLoader = new THREE.DRACOLoader();
dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");

const gltfLoader = new THREE.GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin("anonymous");

// ----------------------------
// Background panorama sphere + EXR environment
// ----------------------------
const panoGroup = new THREE.Group();
scene.add(panoGroup);

async function loadPanoramaSphere() {
  return new Promise((resolve) => {
    textureLoader.load(
      PANORAMA_URL,
      (panoTex) => {
        panoTex.encoding = THREE.sRGBEncoding;
        panoTex.flipY = true;

        const geo = new THREE.SphereGeometry(80, 64, 32);

        // ✅ Keep this inversion (camera is inside the sphere)
        geo.scale(-1, 1, 1);

        // ✅ FIX: do NOT use BackSide when you've already inverted the geometry.
        // Also force background-ish behavior.
        const mat = new THREE.MeshBasicMaterial({
          map: panoTex,
          side: THREE.FrontSide,
          depthWrite: false,
          depthTest: false
        });
        mat.toneMapped = false;

        const mesh = new THREE.Mesh(geo, mat);
        mesh.name = "PANORAMA_SPHERE";

        // Ensure it renders first (so it never covers the avatar)
        mesh.renderOrder = -1000;

        panoGroup.clear();
        panoGroup.add(mesh);

        resolve(true);
      },
      undefined,
      () => resolve(false)
    );
  });
}

async function loadExrEnvironment() {
  return new Promise((resolve) => {
    const exrLoader = new THREE.EXRLoader();
    exrLoader.load(
      EXR_ENV_URL,
      (tex) => {
        const pmrem = new THREE.PMREMGenerator(renderer);
        pmrem.compileEquirectangularShader();

        const envRT = pmrem.fromEquirectangular(tex);
        const envMap = envRT.texture;

        scene.environment = envMap;

        tex.dispose();
        pmrem.dispose();

        resolve(true);
      },
      undefined,
      () => resolve(false)
    );
  });
}

// ----------------------------
// Avatar group
// ----------------------------
const avatarGroup = new THREE.Group();
avatarGroup.scale.setScalar(15);
avatarGroup.position.y = -2.5;
scene.add(avatarGroup);

applyLookPreset("Cinematic");
syncLookSliders();

// ----------------------------
// State
// ----------------------------
const clock = new THREE.Clock();

let allFriendsies = null;
let currentLoadId = 0;

let loadedParts = [];
let lastTraits = null;

let bodyRoot = null;
let bodySkeleton = null;
let bodySkinned = null;

let mixer = null;
let currentAction = null;

let hipsRawName = null;
let restPosByBone = new Map();

let faceOverlayMeshes = [];
let faceAnchor = null;

let autoRandomTimer = null;

// Stability defaults (no longer UI toggles)
const SAFE_MODE = true;
const FREEZE_POS = true;
const ALLOW_HIPS_POS = true;

// ----------------------------
// Helpers
// ----------------------------
function loadGLB(url) {
  return new Promise((resolve) => {
    gltfLoader.load(
      url,
      (gltf) => resolve({ ok: true, gltf }),
      undefined,
      (err) => resolve({ ok: false, err })
    );
  });
}

function findFirstSkinnedMesh(root) {
  let found = null;
  root.traverse((o) => {
    if (!found && o.isSkinnedMesh) found = o;
  });
  return found;
}

function baseKey(name) {
  let s = (name || "").toLowerCase();
  s = s.replace(/^armature[|:]/g, "");
  s = s.replace(/^mixamorig[:]?/g, "");
  s = s.replace(/\s+/g, "");
  s = s.replace(/[^a-z0-9]+/g, "");
  s = s.replace(/end$/g, "");
  return s;
}

function aliasKey(key) {
  key = key.replace(/^spine0+(\d+)$/, "spine$1");
  if (key === "pelvis" || key === "hip") return "hips";
  return key;
}

function keyForName(name) {
  return aliasKey(baseKey(name));
}

function getBodyBoneByKey(key) {
  if (!bodySkeleton) return null;
  const target = aliasKey(key.toLowerCase());
  return bodySkeleton.bones.find((b) => keyForName(b.name) === target) || null;
}

function collectRigInfo() {
  hipsRawName = null;
  restPosByBone = new Map();
  if (!bodySkeleton) return;

  for (const b of bodySkeleton.bones) {
    if (!hipsRawName && keyForName(b.name) === "hips") hipsRawName = b.name;
    restPosByBone.set(b.name, b.position.clone());
  }

  // Face anchor under BODY head bone
  if (faceAnchor?.parent) faceAnchor.parent.remove(faceAnchor);
  faceAnchor = new THREE.Object3D();
  faceAnchor.name = "FACE_ANCHOR";

  const headBone = getBodyBoneByKey("head") || getBodyBoneByKey("neck");
  if (headBone) {
    headBone.add(faceAnchor);
  } else {
    avatarGroup.add(faceAnchor);
    logLine(
      "⚠️ No BODY head/neck bone found — FACE_ANCHOR attached to avatarGroup",
      "warn"
    );
  }
}

function restoreRestPositionsExceptHips() {
  if (!bodySkeleton) return;
  for (const b of bodySkeleton.bones) {
    if (ALLOW_HIPS_POS && hipsRawName && b.name === hipsRawName) continue;
    const p = restPosByBone.get(b.name);
    if (p) b.position.copy(p);
  }
}

function attachPartToBodySkeleton(partScene) {
  if (!bodySkeleton || !bodySkinned || !partScene) return 0;

  bodySkinned.updateMatrixWorld(true);

  let skinnedCount = 0;
  partScene.traverse((o) => {
    if (!o.isSkinnedMesh) return;
    skinnedCount++;

    const bindMatrix = o.bindMatrix ? o.bindMatrix.clone() : new THREE.Matrix4();
    o.bind(bodySkeleton, bindMatrix);
    o.bindMode = bodySkinned.bindMode || o.bindMode;
    o.frustumCulled = false;
    o.updateMatrixWorld(true);
  });

  return skinnedCount;
}

// ---- rigid reparent fix ----
function buildBodyBoneMap() {
  const map = new Map();
  for (const b of bodySkeleton?.bones || []) map.set(keyForName(b.name), b);
  return map;
}

function findBoneAncestor(obj) {
  let p = obj.parent;
  while (p) {
    if (p.isBone) return p;
    p = p.parent;
  }
  return null;
}

function reparentKeepWorld(obj, newParent) {
  obj.updateMatrixWorld(true);
  const world = obj.matrixWorld.clone();

  newParent.updateMatrixWorld(true);
  newParent.add(obj);

  const inv = new THREE.Matrix4().copy(newParent.matrixWorld).invert();
  obj.matrix.copy(inv.multiply(world));
  obj.matrix.decompose(obj.position, obj.quaternion, obj.scale);
  obj.matrixAutoUpdate = true;
}

function retargetRigidAttachmentsToBodyBones(partScene) {
  if (!partScene || !bodySkeleton) return 0;

  const boneMap = buildBodyBoneMap();
  const ops = [];

  partScene.traverse((o) => {
    if (!o.isMesh || o.isSkinnedMesh) return;

    const g = o.geometry;
    const hasSkinAttrs = !!g?.attributes?.skinIndex && !!g?.attributes?.skinWeight;
    if (hasSkinAttrs) {
      ops.push({ type: "convertToSkinned", obj: o });
      return;
    }

    const bone = findBoneAncestor(o);
    if (!bone) return;

    const targetBone = boneMap.get(keyForName(bone.name));
    if (!targetBone) return;

    ops.push({ type: "reparent", obj: o, target: targetBone });
  });

  for (const op of ops) {
    if (op.type === "convertToSkinned") {
      const src = op.obj;
      const parent = src.parent;
      if (!parent) continue;

      const sk = new THREE.SkinnedMesh(src.geometry, src.material);
      sk.name = (src.name || "mesh") + "_SKINNED_FROM_MESH";
      sk.position.copy(src.position);
      sk.quaternion.copy(src.quaternion);
      sk.scale.copy(src.scale);

      const bindMatrix = bodySkinned?.bindMatrix?.clone?.() || new THREE.Matrix4();
      sk.bind(bodySkeleton, bindMatrix);
      sk.frustumCulled = false;

      parent.add(sk);
      parent.remove(src);
    }

    if (op.type === "reparent") {
      reparentKeepWorld(op.obj, op.target);
    }
  }

  return ops.length;
}

// ---- animation sanitation ----
function sanitizeClip(clip) {
  if (!clip) return clip;

  const tracks = [];
  for (const t of clip.tracks || []) {
    const n = (t.name || "").toLowerCase();

    if (n.endsWith(".scale")) continue;

    if (SAFE_MODE && n.endsWith(".position")) {
      const rawTarget = t.name.split(".")[0] || "";
      const boneName = rawTarget.includes("|") ? rawTarget.split("|").pop() : rawTarget;
      const isHips = hipsRawName && boneName === hipsRawName;

      if (ALLOW_HIPS_POS && isHips) tracks.push(t);
      continue;
    }

    tracks.push(t);
  }

  const out = new THREE.AnimationClip(clip.name, clip.duration, tracks);
  out.optimize();
  return out;
}

// ---- face overlay ----
function clearFaceOverlay() {
  for (const m of faceOverlayMeshes) {
    if (m?.parent) m.parent.remove(m);
  }
  faceOverlayMeshes = [];
}

function createSkinnedFaceOverlayFromHead(headScene, faceTexture) {
  clearFaceOverlay();
  if (!headScene || !faceTexture || !bodySkeleton || !faceAnchor) return;

  const faceMat = new THREE.MeshStandardMaterial({
    map: faceTexture,
    transparent: true,
    alphaTest: 0.5,
    depthWrite: false
  });
  faceMat.polygonOffset = true;
  faceMat.polygonOffsetFactor = -1;
  faceMat.polygonOffsetUnits = -4;

  const candidates = [];
  const all = [];

  headScene.traverse((o) => {
    if (!(o.isMesh || o.isSkinnedMesh)) return;
    all.push(o);

    const n = (o.name || "").toLowerCase();
    const mn = o.material?.name ? String(o.material.name).toLowerCase() : "";

    if (/(face|vibe|eyes|mask|decal)/.test(n) || /(face|vibe|eyes|mask|decal)/.test(mn)) {
      candidates.push(o);
    }
  });

  const targets = candidates.length ? candidates : all;

  let made = 0;
  for (const src of targets) {
    src.updateMatrixWorld(true);
    faceAnchor.updateMatrixWorld(true);

    let overlay;
    if (src.isSkinnedMesh) {
      overlay = new THREE.SkinnedMesh(src.geometry, faceMat);
      const bindMatrix = src.bindMatrix ? src.bindMatrix.clone() : new THREE.Matrix4();
      overlay.bind(bodySkeleton, bindMatrix);
      overlay.bindMode = src.bindMode || "attached";
    } else {
      overlay = new THREE.Mesh(src.geometry, faceMat);
    }

    overlay.name = (src.name || "headMesh") + "_FACE_OVERLAY";
    overlay.renderOrder = 999;
    overlay.frustumCulled = false;

    const local = new THREE.Matrix4()
      .copy(faceAnchor.matrixWorld)
      .invert()
      .multiply(src.matrixWorld);

    local.decompose(overlay.position, overlay.quaternion, overlay.scale);

    faceAnchor.add(overlay);
    faceOverlayMeshes.push(overlay);
    made++;
  }

  logLine(`🎭 Face overlay created: ${made} mesh(es)`);
}

// ---- material pop ----
function boostMaterialsForPop(root) {
  if (!root) return;

  root.traverse((child) => {
    if (!child.isMesh) return;

    const mats = Array.isArray(child.material) ? child.material : [child.material];
    for (const m of mats) {
      if (!m) continue;

      // bring back head glow behavior if emissiveMap exists
      if (m.emissiveMap) {
        m.emissive = new THREE.Color(0xffffff);
        if (m.userData?.baseEmissiveIntensity === undefined) {
          m.userData = m.userData || {};
          m.userData.baseEmissiveIntensity = 2.3;
        }
      }

      // slightly stronger env response for metalness
      if (typeof m.metalness === "number" && m.metalness > 0.1) {
        m.userData = m.userData || {};
        const base = Math.max(
          m.userData.baseEnvMapIntensity ?? m.envMapIntensity ?? 1.0,
          1.35
        );
        m.userData.baseEnvMapIntensity = base;
      }

      registerMaterialDefaults(m);
      m.needsUpdate = true;
    }
  });
}

// ----------------------------
// Cleanup
// ----------------------------
function clearAvatar() {
  clearFaceOverlay();

  loadedParts.forEach((m) => avatarGroup.remove(m));
  loadedParts = [];

  bodyRoot = null;
  bodySkeleton = null;
  bodySkinned = null;

  if (mixer) mixer.stopAllAction();
  mixer = null;
  currentAction = null;

  hipsRawName = null;
  restPosByBone = new Map();
  lastTraits = null;

  if (faceAnchor?.parent) faceAnchor.parent.remove(faceAnchor);
  faceAnchor = null;
}

// ----------------------------
// Debug actions -> transcript
// ----------------------------
function printTraits() {
  if (!lastTraits) return logLine("No traits loaded yet.", "warn");

  logSection("Trait URLs");
  for (const t of lastTraits) {
    logLine(`${t.trait_type}: ${t.value}`);
    if (t.asset_url) logLine(`  ${t.asset_url}`);
  }
}

function printRigBones() {
  if (!bodySkeleton) return logLine("No rig yet.", "warn");

  logSection(`Rig bones (${bodySkeleton.bones.length}) hipsRaw=${hipsRawName || "(none)"}`);
  for (const b of bodySkeleton.bones) {
    logLine(`${b.name}  →  ${keyForName(b.name)}`);
  }
}

// ----------------------------
// Anim presets
// ----------------------------
const ANIM_PRESETS = [
  ["WalkStart", "https://cdn.jsdelivr.net/gh/PIZZALORD713/animation_collection@main/WalkStart.glb"],
  ["Idle", "https://cdn.jsdelivr.net/gh/PIZZALORD713/animation_collection@main/Idle.glb"],
  ["Wave", "https://cdn.jsdelivr.net/gh/PIZZALORD713/animation_collection@main/Wave.glb"],
  ["Jump", "https://cdn.jsdelivr.net/gh/PIZZALORD713/animation_collection@main/Jump.glb"]
];

// Populate dropdown
(function initAnimSelect() {
  if (!el.animSelect) return;
  el.animSelect.innerHTML = "";
  for (const [label, url] of ANIM_PRESETS) {
    const opt = document.createElement("option");
    opt.value = url;
    opt.textContent = label;
    el.animSelect.appendChild(opt);
  }
  // default: WalkStart
  el.animSelect.value = ANIM_PRESETS[0][1];
})();

function getSelectedAnimUrl() {
  return el.animSelect?.value || ANIM_PRESETS[0][1];
}

// ----------------------------
// Load + build character
// ----------------------------
function getEntryById(id) {
  if (!allFriendsies) return null;
  return (
    allFriendsies[id] ||
    allFriendsies[id - 1] ||
    allFriendsies.find?.((x) => Number(x?.token_id) === id) ||
    allFriendsies.find?.((x) => Number(x?.id) === id) ||
    null
  );
}

async function loadFriendsies(id) {
  if (!allFriendsies) return;

  const loadId = ++currentLoadId;
  clearAvatar();
  setStatus(`loading #${id}…`);

  const entry = getEntryById(id);
  if (!entry) return setStatus(`not found: #${id}`);

  const traits = entry.attributes || [];
  lastTraits = traits;

  logSection(`Loaded fRiENDSiES #${id}`);
  logLine(`traits: ${traits.length}`);

  // face texture
  const faceAttr = traits.find((t) => t.trait_type === "face");
  let faceTexture = null;

  if (faceAttr?.asset_url) {
    faceTexture = textureLoader.load(faceAttr.asset_url);
    faceTexture.minFilter = THREE.LinearFilter;
    faceTexture.repeat.y = -1;
    faceTexture.offset.y = 1;
    faceTexture.encoding = THREE.sRGBEncoding;
  }

  // BODY
  const bodyAttr = traits.find((t) => t.trait_type === "body");
  if (!bodyAttr?.asset_url) return setStatus("no body trait found ❌");

  const bodyRes = await loadGLB(bodyAttr.asset_url);
  if (loadId !== currentLoadId) return;

  if (!bodyRes.ok) {
    logLine("body load failed ❌", "err");
    return setStatus("body load failed ❌");
  }

  bodyRoot = bodyRes.gltf.scene;
  loadedParts.push(bodyRoot);
  avatarGroup.add(bodyRoot);

  bodySkinned = findFirstSkinnedMesh(bodyRoot);
  if (!bodySkinned?.skeleton) return setStatus("body loaded but no skeleton ❌");

  bodySkeleton = bodySkinned.skeleton;
  collectRigInfo();

  mixer = new THREE.AnimationMixer(bodyRoot);

  // if body has built-in clip (idle), start it until we play external anim
  const bodyClips = bodyRes.gltf.animations || [];
  if (bodyClips.length) {
    const clip = sanitizeClip(bodyClips[0]);
    currentAction = mixer.clipAction(clip);
    currentAction.reset().play();
  }

  // HEAD
  const headAttr = traits.find((t) => t.trait_type === "head");
  if (headAttr?.asset_url) {
    const headRes = await loadGLB(headAttr.asset_url);
    if (loadId !== currentLoadId) return;

    if (headRes.ok) {
      const headScene = headRes.gltf.scene;

      loadedParts.push(headScene);
      avatarGroup.add(headScene);
      avatarGroup.updateMatrixWorld(true);

      attachPartToBodySkeleton(headScene);
      createSkinnedFaceOverlayFromHead(headScene, faceTexture);

      const moved = retargetRigidAttachmentsToBodyBones(headScene);
      if (moved) logLine(`🧷 Retargeted rigid attachments (head): ${moved}`);

      boostMaterialsForPop(headScene);
    }
  }

  // Other parts
  const partTraits = traits.filter((t) => !["body", "head", "face"].includes(t.trait_type));

  let totalBound = 0;
  let totalMoved = 0;

  for (const t of partTraits) {
    if (!t.asset_url || !t.asset_url.endsWith(".glb")) continue;

    const res = await loadGLB(t.asset_url);
    if (loadId !== currentLoadId) return;

    if (res.ok) {
      const part = res.gltf.scene;

      loadedParts.push(part);
      avatarGroup.add(part);
      avatarGroup.updateMatrixWorld(true);

      totalBound += attachPartToBodySkeleton(part);
      totalMoved += retargetRigidAttachmentsToBodyBones(part);

      boostMaterialsForPop(part);
    }
  }

  applyLookControls();
  controls.target.set(0, 1.0, 0);

  setStatus(
    `loaded #${id} ✅ parts:${loadedParts.length} bones:${bodySkeleton.bones.length} faceOverlays:${faceOverlayMeshes.length}`
  );

  if (totalBound || totalMoved) {
    logLine(`🧩 Parts bound:${totalBound} rigid retargeted:${totalMoved}`);
  }

  // Auto-play selected animation after load
  await playAnimUrl(getSelectedAnimUrl(), loadId);
}

// ----------------------------
// External animation
// ----------------------------
async function playAnimUrl(url, loadIdGuard = currentLoadId) {
  if (!url) return setStatus("pick an animation");
  if (!mixer || !bodyRoot) return setStatus("load a friendsies first");

  setStatus("loading anim…");

  const res = await loadGLB(url);
  if (loadIdGuard !== currentLoadId) return; // user loaded a new character mid-load

  if (!res.ok) {
    logLine(`anim load failed ❌ ${url}`, "err");
    return setStatus("anim load failed ❌");
  }

  const clips = res.gltf.animations || [];
  if (!clips.length) return setStatus("anim has 0 clips ❌");

  const clip = sanitizeClip(clips[0]);

  mixer.stopAllAction();
  currentAction = mixer.clipAction(clip);
  currentAction.reset().play();

  setStatus(`playing anim ✅ ${clip.name || "unnamed"}`);
  logLine(`▶ Playing: ${clip.name || "unnamed"} (${url})`);
}

// ----------------------------
// Auto-random every 4 seconds
// ----------------------------
function setAutoRandom(on) {
  if (autoRandomTimer) {
    clearInterval(autoRandomTimer);
    autoRandomTimer = null;
  }

  if (on) {
    autoRandomTimer = setInterval(() => {
      const id = 1 + Math.floor(Math.random() * 10000);
      if (el.friendsiesId) el.friendsiesId.value = String(id);
      loadFriendsies(id);
    }, 4000);
    logLine("✅ Auto-random ON (every 4s)");
  } else {
    logLine("Auto-random OFF");
  }

  setBoolLS(LS_AUTORANDOM, on);
  if (el.autoRandomOn) el.autoRandomOn.checked = on;
}

// restore auto-random preference
setAutoRandom(getBoolLS(LS_AUTORANDOM, false));

// ----------------------------
// UI events
// ----------------------------
function loadByInput() {
  const id = Number(el.friendsiesId?.value);
  if (!Number.isFinite(id) || id < 1 || id > 10000) {
    return setStatus("enter a valid ID (1–10000)");
  }
  loadFriendsies(id);
}

el.loadBtn?.addEventListener("click", loadByInput);

el.randomBtn?.addEventListener("click", () => {
  const id = 1 + Math.floor(Math.random() * 10000);
  if (el.friendsiesId) el.friendsiesId.value = String(id);
  loadFriendsies(id);
});

el.friendsiesId?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loadByInput();
});

el.autoRandomOn?.addEventListener("change", (e) => {
  setAutoRandom(!!e.target.checked);
});

el.playBtn?.addEventListener("click", () => playAnimUrl(getSelectedAnimUrl()));

el.stopBtn?.addEventListener("click", () => {
  if (mixer) mixer.stopAllAction();
  currentAction = null;
  setStatus("anim stopped");
  logLine("■ Animation stopped");
});

el.printTraitsBtn?.addEventListener("click", printTraits);
el.printRigBtn?.addEventListener("click", printRigBones);

// ----------------------------
// Boot sequence
// ----------------------------
(async function boot() {
  setStatus("loading pano/env…");

  const panoOk = await loadPanoramaSphere();
  const envOk = await loadExrEnvironment();

  logLine(`🖼 pano: ${panoOk ? "ok" : "failed"} (${PANORAMA_URL})`);
  logLine(`🌫 env: ${envOk ? "ok" : "failed"} (${EXR_ENV_URL})`);

  setStatus("fetching metadata…");

  fetch(METADATA_URL)
    .then((r) => r.json())
    .then((data) => {
      allFriendsies = data;
      setStatus("ready ✅");
      loadByInput();
    })
    .catch((e) => {
      console.error(e);
      setStatus("metadata fetch failed ❌");
      logLine("metadata fetch failed ❌", "err");
    });
})();

// ----------------------------
// Render loop
// ----------------------------
function animate() {
  requestAnimationFrame(animate);

  const dt = clock.getDelta();
  if (mixer) mixer.update(dt);

  // Stabilize bone positions (except hips)
  if (FREEZE_POS && bodySkeleton) restoreRestPositionsExceptHips();

  // Camera controls
  const orbitEnabled = el.orbitOn?.checked ?? true;
  const autoRot = el.autoRotateOn?.checked ?? false;

  controls.enabled = orbitEnabled;
  controls.autoRotate = orbitEnabled && autoRot;
  if (controls.enabled) controls.update();

  renderer.render(scene, camera);
}
animate();

// ----------------------------
// Resize handler
// ----------------------------
window.addEventListener("resize", () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});
