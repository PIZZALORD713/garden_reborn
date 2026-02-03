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
const PANORAMA_URL = `/garden-cotton-clouds.png?v=${encodeURIComponent(
  ASSET_VERSION
)}`;
const EXR_ENV_URL = `/friendsies_cloud_overcast_studio_v1.exr?v=${encodeURIComponent(
  ASSET_VERSION
)}`;

// ----------------------------
// Metadata
// ----------------------------
const METADATA_URL =
  "https://gist.githubusercontent.com/IntergalacticPizzaLord/a7b0eeac98041a483d715c8320ccf660/raw/ce7d37a94c33c63e2b50d5922e0711e72494c8dd/fRiENDSiES";

// ----------------------------
// On-chain collection identity (wallet lookup)
// ----------------------------
// Friendsies ERC-721 contract (Ethereum mainnet)
// NOTE: pizzalord.eth currently resolves to 0x28af…d713 (wallet),
// but the Friendsies NFT contract is 0xe5af…6956.
const FRIENDSIES_CONTRACT = "0xe5af63234f93afd72a8b9114803e33f6d9766956";
const FRIENDSIES_CHAIN = "eth";

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
    keyLightIntensity: 0.55,
    rimLightIntensity: 0.55,
    envIntensityMultiplier: 0.1,
    emissiveIntensityMultiplier: 0.75
  },
  "Punchy Toybox": {
    toneMapping: "ACES",
    toneMappingExposure: 1.2,
    ambientIntensity: 0.12,
    hemiIntensity: 0.2,
    keyLightIntensity: 1.0,
    rimLightIntensity: 0.45,
    envIntensityMultiplier: 1.5,
    emissiveIntensityMultiplier: 2.0
  },
  "Soft Pastel": {
    toneMapping: "Reinhard",
    toneMappingExposure: 0.95,
    ambientIntensity: 0.25,
    hemiIntensity: 0.35,
    keyLightIntensity: 0.55,
    rimLightIntensity: 0.22,
    envIntensityMultiplier: 0.9,
    emissiveIntensityMultiplier: 1.1
  }
};

const DEFAULT_LOOK_PRESET = "Cinematic";
const LOOK_ALLOWED_KEYS = [
  "toneMapping",
  "toneMappingExposure",
  "ambientIntensity",
  "hemiIntensity",
  "keyLightIntensity",
  "rimLightIntensity",
  "envIntensityMultiplier",
  "emissiveIntensityMultiplier"
];
const LEGACY_LOOK_KEY_MAP = {
  keyIntensity: "keyLightIntensity",
  rimIntensity: "rimLightIntensity",
  envMapIntensity: "envIntensityMultiplier",
  emissiveIntensity: "emissiveIntensityMultiplier"
};
const IS_DEV =
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1" ||
  location.hostname.endsWith(".local") ||
  location.hostname === "";

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
  for (const [legacyKey, canonicalKey] of Object.entries(LEGACY_LOOK_KEY_MAP)) {
    if (legacyKey in LOOK_CONTROLS) {
      if (LOOK_CONTROLS[canonicalKey] === undefined) {
        LOOK_CONTROLS[canonicalKey] = LOOK_CONTROLS[legacyKey];
      }
      delete LOOK_CONTROLS[legacyKey];
    }
  }

  if (LOOK_CONTROLS.keyLightIntensity === undefined) {
    LOOK_CONTROLS.keyLightIntensity = 0.75;
  }
  if (LOOK_CONTROLS.rimLightIntensity === undefined) {
    LOOK_CONTROLS.rimLightIntensity = 0.35;
  }
  if (LOOK_CONTROLS.envIntensityMultiplier === undefined) {
    LOOK_CONTROLS.envIntensityMultiplier = 1.0;
  }
  if (LOOK_CONTROLS.emissiveIntensityMultiplier === undefined) {
    LOOK_CONTROLS.emissiveIntensityMultiplier = 1.0;
  }
}

function validateLookConfig(config, label) {
  if (!IS_DEV || !config) return;

  const keys = Object.keys(config);
  const unknownKeys = keys.filter((key) => !LOOK_ALLOWED_KEYS.includes(key));
  const legacyKeys = keys.filter((key) => key in LEGACY_LOOK_KEY_MAP);
  const overlapping = legacyKeys
    .filter((legacy) => keys.includes(LEGACY_LOOK_KEY_MAP[legacy]))
    .map((legacy) => `${legacy} → ${LEGACY_LOOK_KEY_MAP[legacy]}`);

  if (!unknownKeys.length && !legacyKeys.length) return;

  const warning = [
    `[LookControls] ${label} has unsupported look keys.`,
    unknownKeys.length ? `Unknown: ${unknownKeys.join(", ")}` : null,
    legacyKeys.length ? `Legacy: ${legacyKeys.join(", ")}` : null,
    overlapping.length ? `Overlapping: ${overlapping.join(", ")}` : null
  ]
    .filter(Boolean)
    .join(" ");

  console.warn(warning, { unknownKeys, legacyKeys, overlapping });
  if (typeof logLine === "function") {
    logLine(warning, "warn");
  }
}

function getCanonicalLookSnapshot() {
  normalizeLookControls();
  const snapshot = {};
  for (const key of LOOK_ALLOWED_KEYS) {
    if (key in LOOK_CONTROLS) {
      snapshot[key] = LOOK_CONTROLS[key];
    }
  }
  return snapshot;
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
  carousel: document.getElementById("carousel"),
  carouselTrack: document.getElementById("carouselTrack"),
  carouselPeekBtn: document.getElementById("carouselPeekBtn"),
  carouselPrevBtn: document.getElementById("carouselPrevBtn"),
  carouselNextBtn: document.getElementById("carouselNextBtn"),
  logToggleBtn: document.getElementById("logToggleBtn"),
  logChevron: document.getElementById("logChevron"),
  lookPanel: document.getElementById("lookPanel"),
  lookToggleBtn: document.getElementById("lookToggleBtn"),
  lookControls: document.getElementById("lookControls"),
  copyLookBtn: document.getElementById("copyLookBtn"),

  status: document.getElementById("status"),

  walletInput: document.getElementById("walletInput"),
  walletLookupBtn: document.getElementById("walletLookupBtn"),
  walletDownloadJsonBtn: document.getElementById("walletDownloadJsonBtn"),
  walletTokensSelect: document.getElementById("walletTokensSelect"),
  walletLoadSelectedBtn: document.getElementById("walletLoadSelectedBtn"),
  walletHint: document.getElementById("walletHint"),

  friendsiesId: document.getElementById("friendsiesId"),
  loadBtn: document.getElementById("loadBtn"),
  randomBtn: document.getElementById("randomBtn"),
  randomBtnText: document.getElementById("randomBtnText"),
  autoRandomOn: document.getElementById("autoRandomOn"),
  autoRandomLabelText: document.getElementById("autoRandomLabelText"),

  animSelect: document.getElementById("animSelect"),
  playBtn: document.getElementById("playBtn"),
  stopBtn: document.getElementById("stopBtn"),

  orbitOn: document.getElementById("orbitOn"),
  autoRotateOn: document.getElementById("autoRotateOn"),

  printTraitsBtn: document.getElementById("printTraitsBtn"),
  printRigBtn: document.getElementById("printRigBtn"),
  downloadGlbBtn: document.getElementById("downloadGlbBtn"),

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
  const json = JSON.stringify(getCanonicalLookSnapshot(), null, 2);
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

applyLookPreset(DEFAULT_LOOK_PRESET);
syncLookSliders();

// ----------------------------
// State
// ----------------------------
const clock = new THREE.Clock();

let allFriendsies = null;
let currentLoadId = 0;

let loadedParts = [];
let loadedPartsMeta = []; // parallel array of { trait_type, value }
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
let lastFaceTexture = null;

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

function loadTextureAsync(url) {
  return new Promise((resolve) => {
    textureLoader.load(
      url,
      (tex) => resolve(tex),
      undefined,
      () => resolve(null)
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
    let overlay;
    if (src.isSkinnedMesh) {
      overlay = new THREE.SkinnedMesh(src.geometry, faceMat);
      const bindMatrix = src.bindMatrix
        ? src.bindMatrix.clone()
        : new THREE.Matrix4();
      overlay.bind(bodySkeleton, bindMatrix);
      overlay.bindMode = src.bindMode || "attached";
    } else {
      overlay = new THREE.Mesh(src.geometry, faceMat);
    }

    overlay.name = (src.name || "headMesh") + "_FACE_OVERLAY";
    overlay.renderOrder = 999;
    overlay.frustumCulled = false;

    headScene.updateMatrixWorld(true);
    faceAnchor.updateMatrixWorld(true);
    src.updateMatrixWorld(true);

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
  loadedPartsMeta = [];

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

  logSection(
    `Rig bones (${bodySkeleton.bones.length}) hipsRaw=${hipsRawName || "(none)"}`
  );
  for (const b of bodySkeleton.bones) {
    logLine(`${b.name}  →  ${keyForName(b.name)}`);
  }
}

// ----------------------------
// Export (Download)
// ----------------------------
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function drawTextureToCanvas(ctx, tex, w, h) {
  if (!tex || !tex.image) return;

  // Some textures in this project use repeat.y = -1 + offset.y = 1 for flip.
  // Apply equivalent transform when drawing to a canvas.
  const flipY = tex.repeat?.y === -1;

  ctx.save();
  if (flipY) {
    ctx.translate(0, h);
    ctx.scale(1, -1);
  }
  try {
    ctx.drawImage(tex.image, 0, 0, w, h);
  } catch {
    // ignore
  }
  ctx.restore();
}

function makeFaceDecalMaterial(faceTex) {
  if (!faceTex) return null;
  const mat = new THREE.MeshStandardMaterial({
    map: faceTex,
    transparent: true,
    opacity: 1,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    metalness: 0,
    roughness: 1
  });
  // glTF export tends to prefer non-flipped textures.
  // Keep faceTex as-is; viewer already flips via repeat/offset if needed.
  mat.needsUpdate = true;
  return mat;
}

function cloneGeometryWithNormalOffset(geometry, epsilon = 0.0002) {
  if (!geometry) return geometry;
  const g = geometry.clone();
  const pos = g.attributes?.position;
  const nrm = g.attributes?.normal;
  if (!pos || !nrm || pos.count !== nrm.count) return g;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const nx = nrm.getX(i);
    const ny = nrm.getY(i);
    const nz = nrm.getZ(i);
    pos.setXYZ(i, x + nx * epsilon, y + ny * epsilon, z + nz * epsilon);
  }

  pos.needsUpdate = true;
  g.computeBoundingBox?.();
  g.computeBoundingSphere?.();
  return g;
}

function addFaceDecalMesh(exportRoot, headMesh, faceTex) {
  if (!exportRoot || !headMesh || !faceTex) return null;

  const decalMat = makeFaceDecalMaterial(faceTex);
  if (!decalMat) return null;

  // IMPORTANT: glTF has no polygonOffset; coplanar overlay meshes can break in Cycles.
  // So for EXPORT we slightly offset the decal geometry along normals.
  const decalGeo = cloneGeometryWithNormalOffset(headMesh.geometry, 0.0002);

  let decal = null;
  if (headMesh.isSkinnedMesh) {
    decal = new THREE.SkinnedMesh(decalGeo, decalMat);
    // Copy skinning attributes
    decal.bindMode = headMesh.bindMode;
    decal.skeleton = headMesh.skeleton;
    decal.bindMatrix.copy(headMesh.bindMatrix);
    decal.bindMatrixInverse.copy(headMesh.bindMatrixInverse);
    // Ensure it's bound (some exporters look for explicit bind)
    try {
      decal.bind(headMesh.skeleton, headMesh.bindMatrix);
    } catch {}
  } else {
    decal = new THREE.Mesh(decalGeo, decalMat);
  }

  decal.name = (headMesh.name ? headMesh.name + "_FACE" : "Head_FACE");
  decal.renderOrder = 999; // helps in three.js; exporters may ignore

  // Keep transform aligned with head mesh
  decal.position.copy(headMesh.position);
  decal.quaternion.copy(headMesh.quaternion);
  decal.scale.copy(headMesh.scale);

  exportRoot.add(decal);
  return decal;
}

function bakeFaceOntoBaseColor(baseTex, faceTex) {
  if (!faceTex?.image) return baseTex || null;

  const w = baseTex?.image?.width || faceTex.image.width || 1024;
  const h = baseTex?.image?.height || faceTex.image.height || 1024;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  // base
  if (baseTex?.image) {
    drawTextureToCanvas(ctx, baseTex, w, h);
  } else {
    ctx.clearRect(0, 0, w, h);
  }

  // overlay (face png already aligned to the head UV layout)
  drawTextureToCanvas(ctx, faceTex, w, h);

  const baked = new THREE.CanvasTexture(canvas);
  baked.encoding = THREE.sRGBEncoding;
  baked.flipY = false; // glTF convention
  baked.needsUpdate = true;
  return baked;
}

function stripJunkNodesButKeepMeshes(root) {
  if (!root) return;

  // If we remove bones that currently parent meshes, we can accidentally delete the meshes.
  // So first, lift all meshes/skinned meshes to the root while preserving world transforms.
  const meshes = [];
  root.traverse((o) => {
    if (o.isMesh || o.isSkinnedMesh) meshes.push(o);
  });
  for (const m of meshes) {
    if (!m.parent) continue;
    reparentKeepWorld(m, root);
  }

  // Now we can safely remove bone trees + armature empties.
  const toRemove = [];
  root.traverse((o) => {
    if (o === root) return;

    // Never remove bones here — we still need the skeleton for export.
    // (We strip extra armature wrappers elsewhere.)

    if (!o.isMesh && !o.isSkinnedMesh && !o.isBone) {
      const name = String(o.name || "");
      const looksLikeArmature = /armature|skeleton|rig/i.test(name);
      if (looksLikeArmature) toRemove.push(o);
    }
  });

  for (const o of toRemove) {
    if (o?.parent) o.parent.remove(o);
  }
}

function pruneExportHelpers(exportRoot) {
  if (!exportRoot) return 0;
  const killNames = [
    /^glTF_not_exported$/i,
    /^Icosphere(\.\d+)?$/i,
    /^FACE_ANCHOR$/i,
    /^X_FACE_OVERLAY$/i,
    /_FACE_OVERLAY$/i
  ];

  const toRemove = [];
  exportRoot.traverse((o) => {
    const n = String(o.name || "");
    if (!n) return;
    if (killNames.some((re) => re.test(n))) toRemove.push(o);
  });

  for (const o of toRemove) {
    if (o?.parent) o.parent.remove(o);
  }

  return toRemove.length;
}

// ----------------------------
// Export post-processing
// Goal: Improve Windows 3D Viewer compatibility without breaking Blender.
// This is intentionally conservative: if anything looks off, we fall back to raw GLB.
// ----------------------------
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
      // JSON
      jsonChunk = u8.slice(chunkStart, chunkEnd);
    } else if (chunkType === 0x004e4942) {
      // BIN
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
  let jsonBytes = enc.encode(JSON.stringify(json));

  // 4-byte alignment
  const pad4 = (n) => (4 - (n % 4)) % 4;
  const jsonPad = pad4(jsonBytes.byteLength);
  const binPad = binChunk ? pad4(binChunk.byteLength) : 0;

  const jsonChunkLen = jsonBytes.byteLength + jsonPad;
  const binChunkLen = binChunk ? binChunk.byteLength + binPad : 0;

  const totalLen = 12 + 8 + jsonChunkLen + (binChunk ? 8 + binChunkLen : 0);

  const out = new ArrayBuffer(totalLen);
  const dv = new DataView(out);
  const u8 = new Uint8Array(out);

  // header
  dv.setUint32(0, 0x46546c67, true);
  dv.setUint32(4, 2, true);
  dv.setUint32(8, totalLen, true);

  let offset = 12;

  // JSON chunk header
  dv.setUint32(offset, jsonChunkLen, true);
  dv.setUint32(offset + 4, 0x4e4f534a, true);
  offset += 8;
  u8.set(jsonBytes, offset);
  offset += jsonBytes.byteLength;
  for (let i = 0; i < jsonPad; i++) u8[offset++] = 0x20; // spaces

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
  // only for small objects like samplers
  return JSON.stringify(a) === JSON.stringify(b);
}

function dedupeSamplers(gltf) {
  const samplers = gltf.samplers;
  const textures = gltf.textures;
  if (!Array.isArray(samplers) || !Array.isArray(textures) || samplers.length < 2)
    return { changed: false };

  const newSamplers = [];
  const remap = new Map(); // old -> new

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
  // THREE.GLTFExporter tends to emit one skin per SkinnedMesh even when they all share
  // the same skeleton/joints. Windows 3D Viewer seems especially unhappy with that.
  //
  // We dedupe aggressively but safely:
  // - If joints[] and skeleton match, we treat skins as equivalent.
  // - Prefer the first skin as canonical.
  // - If inverseBindMatrices accessors differ but are byte-identical MAT4 buffers,
  //   we also treat them as equivalent.
  const skins = gltf.skins;
  const nodes = gltf.nodes;
  if (!Array.isArray(skins) || skins.length < 2 || !Array.isArray(nodes))
    return { changed: false };

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

    // Only bother with the common IBM shape (MAT4, float)
    if (acc.componentType !== 5126 || acc.type !== "MAT4") return null;

    const byteOffset = (bv.byteOffset || 0) + (acc.byteOffset || 0);
    const byteLength = (bv.byteStride || 64) * (acc.count || 0);
    if (byteLength <= 0) return null;
    const end = byteOffset + byteLength;
    if (byteOffset < 0 || end > bin.byteLength) return null;

    // Create a cheap hash (not cryptographic) for comparison.
    // Sample a few bytes + length.
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

    // Prefer to match by actual IBM buffer content when possible.
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

  // Also unify inverseBindMatrices indices for the merged skins, picking the first one.
  // (This is conservative: we only unify within the deduped skin list.)
  for (const s of newSkins) {
    if (!s) continue;
    // no-op, but keeps structure stable
  }

  const changed = nodeChanged || newSkins.length !== skins.length;
  if (changed) gltf.skins = newSkins;
  return { changed, before: skins.length, after: gltf.skins.length };
}

function bakeAndRemoveKHRTextureTransform_FlipYOnly(gltf, binChunk) {
  // Windows 3D Viewer is often picky; KHR_texture_transform might be a culprit.
  // We handle ONLY the common flipY pattern: offset [0,1], scale [1,-1], rotation 0.
  if (!gltf?.materials || !gltf?.meshes || !gltf?.accessors || !gltf?.bufferViews)
    return { changed: false };

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

    const isFlipY =
      rot === 0 &&
      off[0] === 0 &&
      off[1] === 1 &&
      sc[0] === 1 &&
      sc[1] === -1;

    if (!isFlipY) continue;

    const ti = tex.index;
    if (typeof ti === "number") {
      flipYTextures.add(ti);
    }
  }

  if (!flipYTextures.size) return { changed: false };

  // Build a mapping from material index -> needsFlipY (based on baseColorTexture index)
  const materialNeedsFlip = new Set();
  for (let mi = 0; mi < materials.length; mi++) {
    const m = materials[mi];
    const tex = m?.pbrMetallicRoughness?.baseColorTexture;
    const ti = tex?.index;
    if (typeof ti === "number" && flipYTextures.has(ti)) materialNeedsFlip.add(mi);
  }

  // Flip V in-place for TEXCOORD_0 accessors on primitives that use those materials.
  const bin = binChunk
    ? new Uint8Array(binChunk.buffer, binChunk.byteOffset, binChunk.byteLength)
    : null;
  if (!bin) return { changed: false };

  const accessors = gltf.accessors;
  const bufferViews = gltf.bufferViews;

  const flipAccessor = (accessorIndex) => {
    const acc = accessors[accessorIndex];
    if (!acc) return false;
    if (acc.componentType !== 5126) return false; // FLOAT
    if (acc.type !== "VEC2") return false;

    const bv = bufferViews[acc.bufferView];
    if (!bv) return false;

    const baseOffset = (bv.byteOffset || 0) + (acc.byteOffset || 0);
    const stride = bv.byteStride || 8;
    const count = acc.count || 0;

    // Safety checks
    const lastByte = baseOffset + stride * (count - 1) + 8;
    if (count <= 0 || baseOffset < 0 || lastByte > bin.byteLength) return false;

    const dv = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
    for (let i = 0; i < count; i++) {
      const yOff = baseOffset + i * stride + 4;
      const y = dv.getFloat32(yOff, true);
      dv.setFloat32(yOff, 1.0 - y, true);
    }

    // Update accessor min/max if present
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
      if (typeof uvAccessor !== "number") continue;
      if (flippedAccessors.has(uvAccessor)) continue;

      if (flipAccessor(uvAccessor)) {
        flippedAccessors.add(uvAccessor);
        changed = true;
      }
    }
  }

  if (!changed) return { changed: false };

  // Remove the extension from materials (only those flipY ones)
  for (const m of materials) {
    const tex = m?.pbrMetallicRoughness?.baseColorTexture;
    const ext = tex?.extensions?.KHR_texture_transform;
    if (!ext) continue;

    const off = ext.offset || [0, 0];
    const sc = ext.scale || [1, 1];
    const rot = ext.rotation || 0;
    const isFlipY =
      rot === 0 && off[0] === 0 && off[1] === 1 && sc[0] === 1 && sc[1] === -1;

    if (!isFlipY) continue;

    delete tex.extensions.KHR_texture_transform;
    if (Object.keys(tex.extensions).length === 0) delete tex.extensions;
  }

  // Clean up extensionsUsed if possible
  if (Array.isArray(gltf.extensionsUsed)) {
    const stillUsed = new Set();
    // crude scan
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
  // Windows 3D Viewer can fail hard on certain material edge-cases.
  // Keep this conservative: clamp factors into spec ranges and strip nonstandard extras.
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
      // Strip material extras produced by our viewer-only look system.
      delete m.extras;
      strippedExtras++;
      changed = true;
    }

    // emissiveFactor must be [0..1] per component in glTF 2.0.
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

    // Clamp PBR factors into spec too.
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
  // Returns { glb, report } or throws.
  const { json, binChunk } = parseGlb(rawGlb);

  const report = { steps: [] };

  const bakeRes = bakeAndRemoveKHRTextureTransform_FlipYOnly(json, binChunk);
  if (bakeRes.changed) report.steps.push({ step: "bakeFlipY", ...bakeRes });

  const sampRes = dedupeSamplers(json);
  if (sampRes.changed) report.steps.push({ step: "dedupeSamplers", ...sampRes });

  const skinRes = dedupeSkins(json, binChunk);
  if (skinRes.changed) report.steps.push({ step: "dedupeSkins", ...skinRes });

  const matRes = sanitizeMaterialsForWindows(json);
  if (matRes.changed) report.steps.push({ step: "sanitizeMaterials", ...matRes });

  // Basic sanity checks (avoid exporting a broken file)
  const matCount = Array.isArray(json.materials) ? json.materials.length : 0;
  const imgCount = Array.isArray(json.images) ? json.images.length : 0;
  const texCount = Array.isArray(json.textures) ? json.textures.length : 0;

  if (!matCount) throw new Error("Optimize sanity check failed: 0 materials");
  if (!imgCount && texCount) throw new Error("Optimize sanity check failed: textures but 0 images");

  return { glb: buildGlb(json, binChunk), report };
}

function downloadRigGlb() {
  if (!loadedParts?.length || !bodyRoot) {
    logLine("Nothing loaded yet — load a fRiENDSiES first.", "warn");
    return;
  }
  if (!THREE?.GLTFExporter) {
    logLine("GLTFExporter missing (script tag not loaded).", "warn");
    return;
  }

  // We want option A: rigged + T-pose only.
  // Stop animation and return skeleton to bind pose if possible.
  try {
    if (mixer) mixer.stopAllAction();
    if (bodySkeleton && typeof bodySkeleton.pose === "function") {
      bodySkeleton.pose();
    }
  } catch {}

  // Temporarily normalize avatarGroup scale/position so the exported file is usable in Blender.
  const oldScale = avatarGroup.scale.clone();
  const oldPos = avatarGroup.position.clone();
  avatarGroup.scale.setScalar(1);
  avatarGroup.position.set(0, 0, 0);

  // Build a clean export root (avoid nested Scene roots + dead armatures from parts)
  const exportRoot = new THREE.Group();
  const id = Number(el.friendsiesId?.value || 0) || 0;
  const idStr = String(id || 0).padStart(4, "0");
  exportRoot.name = `fRiENDSiES_${idStr}`;

  // IMPORTANT: The live viewer adds FACE_ANCHOR + overlay meshes under the BODY rig.
  // We do NOT want those exported. Temporarily detach faceAnchor before cloning.
  const faceAnchorParent = faceAnchor?.parent || null;
  if (faceAnchorParent) faceAnchorParent.remove(faceAnchor);

  // Clone everything for export.
  // Use SkeletonUtils.clone so SkinnedMesh + skeleton/bind data survive properly.
  const exportBodyRoot = THREE.SkeletonUtils?.clone
    ? THREE.SkeletonUtils.clone(bodyRoot)
    : bodyRoot.clone(true);

  // Restore live faceAnchor immediately after cloning.
  if (faceAnchorParent) faceAnchorParent.add(faceAnchor);

  exportRoot.add(exportBodyRoot);

  const exportBodySkinned = findFirstSkinnedMesh(exportBodyRoot);
  const exportSkeleton = exportBodySkinned?.skeleton || null;

  function attachPartToExportSkeleton(partScene) {
    if (!exportSkeleton || !exportBodySkinned || !partScene) return 0;

    exportBodySkinned.updateMatrixWorld(true);

    let skinnedCount = 0;
    partScene.traverse((o) => {
      if (!o.isSkinnedMesh) return;
      skinnedCount++;

      // Use the part's existing bindMatrix, but bind to the exported skeleton.
      const bindMatrix = o.bindMatrix ? o.bindMatrix.clone() : new THREE.Matrix4();
      o.bind(exportSkeleton, bindMatrix);
      o.bindMode = exportBodySkinned.bindMode || o.bindMode;
      o.frustumCulled = false;
      o.updateMatrixWorld(true);
    });

    return skinnedCount;
  }

  // Clone trait parts, strip junk, and rebind skinned meshes to the EXPORTED BODY skeleton.
  // We also name meshes by trait type for sanity.
  const traitParts = loadedParts
    .map((p, idx) => ({ part: p, meta: loadedPartsMeta[idx] }))
    .filter((x) => x.part && x.part !== bodyRoot);

  for (const { part, meta } of traitParts) {
    const clone = THREE.SkeletonUtils?.clone
      ? THREE.SkeletonUtils.clone(part)
      : part.clone(true);

    stripJunkNodesButKeepMeshes(clone);
    attachPartToExportSkeleton(clone);

    const labelBase = String(meta?.trait_type || "Part").trim() || "Part";
    const labelValue = String(meta?.value || "").trim();
    const label = labelValue ? `${labelBase}_${labelValue}` : labelBase;

    // Remove any viewer-only face overlay meshes if they were present in the part.
    const toCull = [];
    clone.traverse((o) => {
      const n = String(o.name || "");
      if (/FACE_ANCHOR/i.test(n) || /_FACE_OVERLAY$/i.test(n) || /^X_FACE_OVERLAY$/i.test(n)) {
        toCull.push(o);
      }
    });
    for (const o of toCull) {
      if (o?.parent) o.parent.remove(o);
    }

    // Add only meshes to exportRoot to avoid nested Scene roots.
    const keep = [];
    clone.traverse((o) => {
      if (o.isMesh || o.isSkinnedMesh) keep.push(o);
    });
    for (const m of keep) {
      if (!m.name || m.name === "X") m.name = label;
      reparentKeepWorld(m, exportRoot);
    }
  }

  // If this token uses a 2D face PNG, export it as a decal mesh (glTF-native overlay).
  if (lastFaceTexture) {
    let headMesh = null;
    exportRoot.traverse((o) => {
      if (headMesh) return;
      if (!(o.isMesh || o.isSkinnedMesh)) return;
      const n = String(o.name || "").toLowerCase();
      if (n.includes("head")) headMesh = o;
    });

    if (headMesh) {
      addFaceDecalMesh(exportRoot, headMesh, lastFaceTexture);
    }
  }

  // Final cleanup: remove any known helper nodes that can confuse Blender importer.
  const pruned = pruneExportHelpers(exportRoot);
  if (pruned) logLine(`🧽 Pruned helper nodes from export: ${pruned}`, "dim");

  exportRoot.updateMatrixWorld(true);

  const exporter = new THREE.GLTFExporter();
  const filename = `friendsies_${id || "export"}_rig_tpose.glb`;

  logLine(`Exporting ${filename}…`, "dim");

  // (faceAnchor already detached only for cloning; it is not part of exportRoot)

  try {
    // NOTE: In Three r128 GLTFExporter.parse signature is:
    // parse(input, onDone, options)
    exporter.parse(
      exportRoot,
      (result) => {
        avatarGroup.scale.copy(oldScale);
        avatarGroup.position.copy(oldPos);
        avatarGroup.updateMatrixWorld(true);

        const glb = result instanceof ArrayBuffer ? result : null;
        if (!glb) {
          logLine(
            `Export failed: expected ArrayBuffer (.glb) but got ${typeof result}.`,
            "warn"
          );
          return;
        }

        let outGlb = glb;

        // Attempt a conservative Windows-compat pass.
        // If it fails for any reason, fall back to the raw exporter output.
        try {
          const optimized = optimizeGlbForWindows(glb);
          outGlb = optimized.glb;
          if (optimized?.report?.steps?.length) {
            logLine(
              `🧹 Export cleanup: ${optimized.report.steps
                .map((s) => s.step)
                .join(", ")}`,
              "dim"
            );
          }
        } catch (e) {
          logLine(`⚠️ Export cleanup skipped: ${e?.message || e}`, "dim");
          outGlb = glb;
        }

        downloadBlob(new Blob([outGlb], { type: "model/gltf-binary" }), filename);
        logLine(`✅ Download started: ${filename}`);
      },
      {
        binary: true,
        onlyVisible: true,
        embedImages: true,
        trs: true
      }
    );
  } catch (err) {
    // restore on error
    avatarGroup.scale.copy(oldScale);
    avatarGroup.position.copy(oldPos);
    avatarGroup.updateMatrixWorld(true);

    logLine(`Export error: ${err?.message || err}`, "warn");
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

  const previousAvatarVisible = avatarGroup.visible;
  avatarGroup.visible = false;
  const restoreAvatarVisibility = () => {
    if (loadId === currentLoadId) {
      avatarGroup.visible = previousAvatarVisible;
    }
  };

  const traits = entry.attributes || [];
  lastTraits = traits;

  logSection(`Loaded fRiENDSiES #${id}`);
  logLine(`traits: ${traits.length}`);

  // face texture
  const faceAttr = traits.find((t) => t.trait_type === "face");
  const faceTexturePromise = faceAttr?.asset_url
    ? loadTextureAsync(faceAttr.asset_url).then((tex) => {
        if (!tex) return null;
        tex.minFilter = THREE.LinearFilter;
        // Keep viewer behavior (some sources need Y flip)
        tex.repeat.y = -1;
        tex.offset.y = 1;
        tex.encoding = THREE.sRGBEncoding;
        return tex;
      })
    : Promise.resolve(null);

  // BODY
  const bodyAttr = traits.find((t) => t.trait_type === "body");
  if (!bodyAttr?.asset_url) {
    restoreAvatarVisibility();
    return setStatus("no body trait found ❌");
  }

  const bodyPromise = loadGLB(bodyAttr.asset_url);

  const headAttr = traits.find((t) => t.trait_type === "head");

  // Other parts
  const partTraits = traits.filter((t) => !["body", "head", "face"].includes(t.trait_type));
  const headPromise = headAttr?.asset_url ? loadGLB(headAttr.asset_url) : Promise.resolve(null);
  const partPromises = partTraits
    .filter((t) => t.asset_url && t.asset_url.endsWith(".glb"))
    .map((t) => ({ trait: t, promise: loadGLB(t.asset_url) }));

  const results = await Promise.all([
    bodyPromise,
    headPromise,
    ...partPromises.map((p) => p.promise)
  ]);
  if (loadId !== currentLoadId) {
    restoreAvatarVisibility();
    return;
  }

  const bodyRes = results[0];
  if (!bodyRes.ok) {
    logLine("body load failed ❌", "err");
    restoreAvatarVisibility();
    return setStatus("body load failed ❌");
  }

  bodyRoot = bodyRes.gltf.scene;
  loadedParts.push(bodyRoot);
  loadedPartsMeta.push({ trait_type: "Body", value: "body" });

  bodySkinned = findFirstSkinnedMesh(bodyRoot);
  if (!bodySkinned?.skeleton) {
    restoreAvatarVisibility();
    return setStatus("body loaded but no skeleton ❌");
  }

  bodySkeleton = bodySkinned.skeleton;
  collectRigInfo();

  avatarGroup.add(bodyRoot);
  avatarGroup.updateMatrixWorld(true);

  mixer = new THREE.AnimationMixer(bodyRoot);

  // if body has built-in clip (idle), start it until we play external anim
  const bodyClips = bodyRes.gltf.animations || [];
  if (bodyClips.length) {
    const clip = sanitizeClip(bodyClips[0]);
    currentAction = mixer.clipAction(clip);
    currentAction.reset().play();
  }

  // (bodyRoot already tracked/added above)
  avatarGroup.add(bodyRoot);
  avatarGroup.updateMatrixWorld(true);

  const headRes = results[1];
  const faceTexture = await faceTexturePromise;
  lastFaceTexture = faceTexture;
  if (loadId !== currentLoadId) {
    restoreAvatarVisibility();
    return;
  }

  if (headRes?.ok) {
    const headScene = headRes.gltf.scene;

    avatarGroup.add(headScene);
    avatarGroup.updateMatrixWorld(true);

    attachPartToBodySkeleton(headScene);
    createSkinnedFaceOverlayFromHead(headScene, faceTexture);

    const moved = retargetRigidAttachmentsToBodyBones(headScene);
    if (moved) logLine(`🧷 Retargeted rigid attachments (head): ${moved}`);

    boostMaterialsForPop(headScene);
    loadedParts.push(headScene);
    loadedPartsMeta.push({ trait_type: "Head", value: headAttr?.value || "head" });
    avatarGroup.updateMatrixWorld(true);
  }

  let totalBound = 0;
  let totalMoved = 0;

  for (let index = 0; index < partPromises.length; index += 1) {
    const res = results[index + 2];
    if (!res?.ok) continue;

    const part = res.gltf.scene;

    totalBound += attachPartToBodySkeleton(part);
    totalMoved += retargetRigidAttachmentsToBodyBones(part);

    boostMaterialsForPop(part);
    loadedParts.push(part);
    loadedPartsMeta.push({ trait_type: partPromises[index]?.trait?.trait_type || "Part", value: partPromises[index]?.trait?.value || "" });
    avatarGroup.add(part);
  }
  avatarGroup.updateMatrixWorld(true);
  avatarGroup.visible = previousAvatarVisible;

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
      const walletIds = getWalletTokenIds();
      const id = walletIds ? getRandomFromArray(walletIds) : 1 + Math.floor(Math.random() * 10000);
      if (!id) return;
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
syncOwnedModeLabels();

// ----------------------------
// Wallet lookup (Moralis via /api proxy)
// ----------------------------
var lastWalletLookup = null;

// ----------------------------
// Modes
// ----------------------------
// "Showcase mode" is enabled ONLY when the wallet is provided via URL path
// (e.g. /pizzalord.eth or /0x...).
var IS_SHOWCASE_MODE = false;
var SHOWCASE_PENDING_TOKEN_ID = null;

function getWalletTokenIds() {
  const ids = lastWalletLookup?.tokenIds;
  if (!Array.isArray(ids) || !ids.length) return null;
  return ids
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 10000)
    .sort((a, b) => a - b);
}

function getRandomFromArray(arr) {
  if (!arr || !arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function syncOwnedModeLabels() {
  const owned = !!getWalletTokenIds();
  if (el.randomBtnText) el.randomBtnText.textContent = owned ? "🎲 Random (Owned)" : "🎲 Random";
  if (el.autoRandomLabelText)
    el.autoRandomLabelText.textContent = owned ? "✅ Auto (Owned)" : "✅ Auto";
}

function isLikelyEns(name) {
  return typeof name === "string" && name.trim().toLowerCase().endsWith(".eth");
}

function isLikelyEvmAddress(addr) {
  return typeof addr === "string" && /^0x[0-9a-fA-F]{40}$/.test(addr.trim());
}

function setWalletUiState({ busy = false, tokenIds = null, hint = null } = {}) {
  if (el.walletLookupBtn) el.walletLookupBtn.disabled = busy;
  if (el.walletInput) el.walletInput.disabled = busy;
  if (el.walletLoadSelectedBtn) el.walletLoadSelectedBtn.disabled = busy;

  if (el.walletTokensSelect) {
    const hasTokens = Array.isArray(tokenIds) && tokenIds.length > 0;
    el.walletTokensSelect.disabled = busy || !hasTokens;
  }

  if (el.walletDownloadJsonBtn) {
    el.walletDownloadJsonBtn.disabled = busy || !lastWalletLookup;
  }

  if (el.walletHint && hint) el.walletHint.textContent = hint;
}

var carouselAllTokenIds = [];
var carouselWindowStart = 0; // legacy window paging (no longer used by dial-style carousel)

function wrapIndex(i, n) {
  if (n <= 0) return 0;
  return ((i % n) + n) % n;
}

function orderTokenIds(tokenIdsRaw) {
  // Stable, deterministic ordering: numeric ascending.
  return (tokenIdsRaw || [])
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x) && x > 0)
    .sort((a, b) => a - b);
}

function findCurrentIndex(orderedIds, currentId) {
  if (!Number.isFinite(currentId) || currentId <= 0) return -1;
  return orderedIds.indexOf(currentId);
}

function computeWindowIds(orderedIds, currentId, W, preferredDialRepeats = true) {
  const N = orderedIds.length;
  if (N === 0) return { N, W: 0, center: 0, currentIndex: -1, visible: [] };

  let currentIndex = findCurrentIndex(orderedIds, currentId);
  if (currentIndex < 0) currentIndex = 0;

  let windowSize = W;
  if (!preferredDialRepeats) windowSize = Math.min(W, N);

  const center = Math.floor(windowSize / 2);
  const visible = [];

  for (let i = 0; i < windowSize; i++) {
    const offset = i - center;
    visible.push(orderedIds[wrapIndex(currentIndex + offset, N)]);
  }

  return { N, W: windowSize, center, currentIndex, visible };
}

function selectNextId(orderedIds, currentId) {
  const N = orderedIds.length;
  if (N === 0) return null;
  if (N === 1) return orderedIds[0];

  let idx = findCurrentIndex(orderedIds, currentId);
  if (idx < 0) idx = 0;

  return orderedIds[wrapIndex(idx + 1, N)];
}

function selectPrevId(orderedIds, currentId) {
  const N = orderedIds.length;
  if (N === 0) return null;
  if (N === 1) return orderedIds[0];

  let idx = findCurrentIndex(orderedIds, currentId);
  if (idx < 0) idx = 0;

  return orderedIds[wrapIndex(idx - 1, N)];
}

function getCarouselWindowSize() {
  const w = window.innerWidth || 0;
  if (w >= 900) return 15;
  if (w >= 600) return 10;
  return 5;
}

function clamp(n, a, b) {
  return Math.min(b, Math.max(a, n));
}

function setCarouselVisible(visible) {
  if (el.carousel) {
    el.carousel.style.display = visible ? "block" : "none";
    el.carousel.setAttribute("aria-hidden", visible ? "false" : "true");
  }
  if (el.carouselPeekBtn) {
    el.carouselPeekBtn.style.display = visible ? "block" : "none";
  }
}

var peekTimer = null;
var carouselIsOpen = false;

function setCarouselOpen(open) {
  carouselIsOpen = !!open;
  if (el.carousel) {
    el.carousel.classList.toggle("open", carouselIsOpen);
    // Hover reveal only in showcase mode (otherwise it can get in the way)
    el.carousel.classList.toggle("hoverReveal", !!IS_SHOWCASE_MODE);
  }
  if (el.carouselPeekBtn) {
    el.carouselPeekBtn.classList.toggle("open", carouselIsOpen);
    // default icon state; updateCarouselActive can temporarily show token id
    el.carouselPeekBtn.textContent = carouselIsOpen ? "▾" : "▴";
  }
}

function setCarouselWindowAroundId(id) {
  const idx = carouselAllTokenIds.indexOf(id);
  if (idx < 0) return;
  const size = getCarouselWindowSize();
  const maxStart = Math.max(0, carouselAllTokenIds.length - size);
  carouselWindowStart = clamp(idx - Math.floor(size / 2), 0, maxStart);
}

function shiftCarouselWindow(dir) {
  const size = getCarouselWindowSize();
  const maxStart = Math.max(0, carouselAllTokenIds.length - size);
  const next = carouselWindowStart + dir * size;

  // Wrap-around paging so arrows can be used indefinitely.
  if (dir > 0 && next > maxStart) {
    carouselWindowStart = 0;
    return;
  }
  if (dir < 0 && next < 0) {
    carouselWindowStart = maxStart;
    return;
  }

  carouselWindowStart = clamp(next, 0, maxStart);
}

function scrollCarouselByPage(dir) {
  // If the user is paging, keep the carousel open.
  setCarouselOpen(true);

  // Dial-style behavior: arrows step selection (wrap-around), not page the window.
  const ordered = carouselAllTokenIds || [];
  const currentId = Number(el.friendsiesId?.value || 0);
  const nextId = dir > 0 ? selectNextId(ordered, currentId) : selectPrevId(ordered, currentId);
  if (!nextId) return;

  if (el.friendsiesId) el.friendsiesId.value = String(nextId);
  loadFriendsies(nextId);
  updateCarouselActive();
}

function renderCarousel(tokenIds) {
  if (!el.carouselTrack) return;
  el.carouselTrack.innerHTML = "";

  if (!tokenIds || !tokenIds.length) {
    carouselAllTokenIds = [];
    carouselWindowStart = 0;
    setCarouselVisible(false);
    return;
  }

  // Canonical ordering (stable per wallet)
  carouselAllTokenIds = orderTokenIds(tokenIds);
  const currentId = Number(el.friendsiesId?.value || 0);

  const size = getCarouselWindowSize();
  const { visible, center } = computeWindowIds(
    carouselAllTokenIds,
    currentId,
    size,
    true // dial repeats when N < W
  );

  setCarouselVisible(true);

  // Don't stomp the user's open/closed state on every re-render.
  // Only set a default the first time we ever show the carousel.
  if (typeof carouselIsOpen !== "boolean") carouselIsOpen = false;
  if (!el.carousel?.dataset?.carouselInit) {
    setCarouselOpen(!IS_SHOWCASE_MODE);
    if (el.carousel) el.carousel.dataset.carouselInit = "1";
  } else {
    setCarouselOpen(carouselIsOpen);
  }

  for (let i = 0; i < visible.length; i++) {
    const id = visible[i];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "carouselItem" + (i === center ? " needle" : "") + (id === currentId ? " active" : "");
    btn.textContent = `#${id}`;
    btn.setAttribute("role", "listitem");
    btn.addEventListener("click", () => {
      if (el.friendsiesId) el.friendsiesId.value = String(id);
      loadFriendsies(id);
      updateCarouselActive();
    });
    el.carouselTrack.appendChild(btn);
  }
}

function updateCarouselActive() {
  if (!el.carouselTrack) return;
  const currentId = Number(el.friendsiesId?.value || 0);

  // Dial-style carousel: selection change affects the entire window.
  if (carouselAllTokenIds?.length) {
    renderCarousel(carouselAllTokenIds);
  }

  // Peek button shows current token briefly when closed (showcase mode)
  if (el.carouselPeekBtn && IS_SHOWCASE_MODE) {
    const isOpen = !!el.carousel?.classList.contains("open");
    if (!isOpen && Number.isFinite(currentId) && currentId > 0) {
      if (peekTimer) clearTimeout(peekTimer);
      el.carouselPeekBtn.textContent = `#${currentId}`;
      peekTimer = setTimeout(() => {
        el.carouselPeekBtn.textContent = "▴";
      }, 1400);
    }
  }
}

function setWalletTokensSelect(tokenIds) {
  if (!el.walletTokensSelect) return;

  el.walletTokensSelect.innerHTML = "";

  if (!tokenIds || !tokenIds.length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "(no Friendsies found)";
    el.walletTokensSelect.appendChild(opt);
    return;
  }

  const firstOpt = document.createElement("option");
  firstOpt.value = "";
  firstOpt.textContent = `(select a token — ${tokenIds.length} found)`;
  el.walletTokensSelect.appendChild(firstOpt);

  for (const id of tokenIds) {
    const opt = document.createElement("option");
    opt.value = String(id);
    opt.textContent = `#${id}`;
    el.walletTokensSelect.appendChild(opt);
  }
}

async function lookupWalletTokens(ownerInput) {
  const raw = String(ownerInput || "").trim();
  if (!raw) throw new Error("Enter a wallet or ENS name");
  if (!isLikelyEns(raw) && !isLikelyEvmAddress(raw)) {
    throw new Error("Expected an ETH address (0x…) or ENS name (.eth)");
  }

  const url = `/api/friendsiesTokens?owner=${encodeURIComponent(raw)}&chain=${encodeURIComponent(
    FRIENDSIES_CHAIN
  )}&contract=${encodeURIComponent(FRIENDSIES_CONTRACT)}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Lookup failed (${res.status}) ${text || ""}`.trim());
  }

  const data = await res.json();
  const tokenIds = Array.isArray(data.tokenIds) ? data.tokenIds : [];
  return { ...data, tokenIds };
}

function downloadJsonObject(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ----------------------------
// UI events
// ----------------------------
function loadByInput() {
  const id = Number(el.friendsiesId?.value);
  if (!Number.isFinite(id) || id < 1 || id > 10000) {
    return setStatus("enter a valid ID (1–10000)");
  }
  loadFriendsies(id);
  updateCarouselActive();
}

el.loadBtn?.addEventListener("click", loadByInput);

async function doWalletLookup() {
  const input = String(el.walletInput?.value || "").trim();
  try {
    setWalletUiState({ busy: true, hint: "Looking up wallet…" });
    setStatus("wallet lookup…");

    const data = await lookupWalletTokens(input);
    lastWalletLookup = data;
    syncOwnedModeLabels();

    // normalize + sort numeric
    const tokenIds = (data.tokenIds || [])
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);

    // reset carousel init for new wallet results
    if (el.carousel) delete el.carousel.dataset.carouselInit;

    setWalletTokensSelect(tokenIds);
    renderCarousel(tokenIds);

    const who = data.ownerResolved || data.ownerInput || input;
    const display =
      data.ownerInput && data.ownerResolved && data.ownerInput !== data.ownerResolved
        ? `${data.ownerInput} → ${data.ownerResolved}`
        : who;

    logLine(`🔎 Wallet lookup: ${display}`);
    logLine(
      `🧺 Friendsies owned: ${tokenIds.length} (contract ${FRIENDSIES_CONTRACT})`
    );

    setStatus("ready ✅");

    // Showcase mode: if the wallet was provided via deep-link URL,
    // auto-pick an owned token, enable auto-random (owned), and hide UI+transcript.
    if (IS_SHOWCASE_MODE && tokenIds.length) {
      const pick = getRandomFromArray(tokenIds);
      if (Number.isFinite(pick)) {
        if (el.friendsiesId) el.friendsiesId.value = String(pick);
        // Turn on auto-random (owned)
        setAutoRandom(true);
        // Hide UI + transcript
        applyUIHidden(true);
        applyLogCollapsed(true);

        // If metadata is ready, load immediately; otherwise queue it.
        if (allFriendsies) {
          loadFriendsies(pick);
        } else {
          SHOWCASE_PENDING_TOKEN_ID = pick;
        }
      }
    }

    setWalletUiState({
      busy: false,
      tokenIds,
      hint: tokenIds.length
        ? `Found ${tokenIds.length}. Pick one from dropdown.`
        : "No Friendsies found for that wallet."
    });
  } catch (err) {
    console.error(err);
    lastWalletLookup = null;
    syncOwnedModeLabels();
    setWalletTokensSelect([]);
    renderCarousel([]);
    setWalletUiState({ busy: false, tokenIds: [], hint: "Lookup failed." });
    setStatus("wallet lookup failed ❌");
    logLine(`wallet lookup failed ❌ ${err?.message || err}`, "err");
  }
}

el.walletLookupBtn?.addEventListener("click", doWalletLookup);

// Carousel controls
el.carouselPeekBtn?.addEventListener("click", () => {
  setCarouselOpen(!carouselIsOpen);
});
el.carouselPrevBtn?.addEventListener("click", () => scrollCarouselByPage(-1));
el.carouselNextBtn?.addEventListener("click", () => scrollCarouselByPage(1));

window.addEventListener("resize", () => {
  // Re-render windowed carousel on resize so it snaps to 15/10/5 behavior.
  if (carouselAllTokenIds?.length) renderCarousel(carouselAllTokenIds);
});

el.walletInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") doWalletLookup();
});

el.walletDownloadJsonBtn?.addEventListener("click", () => {
  if (!lastWalletLookup) return;
  const safeOwner = String(lastWalletLookup.ownerResolved || lastWalletLookup.ownerInput || "wallet")
    .replace(/[^a-zA-Z0-9_.-]/g, "_")
    .slice(0, 60);
  const filename = `friendsies_wallet_${safeOwner}.json`;
  downloadJsonObject(lastWalletLookup, filename);
  logLine(`⬇ Downloaded wallet JSON: ${filename}`);
});

el.walletLoadSelectedBtn?.addEventListener("click", () => {
  const val = String(el.walletTokensSelect?.value || "").trim();
  const id = Number(val);
  if (!Number.isFinite(id) || id < 1 || id > 10000) {
    return setStatus("select a token from dropdown");
  }
  if (el.friendsiesId) el.friendsiesId.value = String(id);
  loadFriendsies(id);
  updateCarouselActive();
});

el.walletTokensSelect?.addEventListener("change", () => {
  const val = String(el.walletTokensSelect?.value || "").trim();
  const id = Number(val);
  if (!Number.isFinite(id) || id < 1 || id > 10000) return;
  if (el.friendsiesId) el.friendsiesId.value = String(id);
  // Auto-load immediately on selection (better UX)
  loadFriendsies(id);
  updateCarouselActive();
});

el.randomBtn?.addEventListener("click", () => {
  const walletIds = getWalletTokenIds();
  const id = walletIds ? getRandomFromArray(walletIds) : 1 + Math.floor(Math.random() * 10000);
  if (!id) return;
  if (el.friendsiesId) el.friendsiesId.value = String(id);
  loadFriendsies(id);
  updateCarouselActive();
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
el.downloadGlbBtn?.addEventListener("click", downloadRigGlb);

// ----------------------------
// Boot sequence
// ----------------------------
(async function boot() {
  // Deep link support:
  // - /pizzalord.eth
  // - /0xabc...
  // - ?owner=pizzalord.eth
  // We rewrite to index.html (via vercel.json) and parse the path/query here.
  // IMPORTANT: do this BEFORE loading pano/env so the wallet field fills immediately.
  const path = String(location.pathname || "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
  const ownerFromQuery = new URLSearchParams(location.search).get("owner");
  const ownerFromPath = path && path !== "index.html" ? decodeURIComponent(path) : "";
  const owner = (ownerFromQuery || ownerFromPath || "").trim();

  // Showcase mode ONLY when wallet is provided via URL path (not query, not manual).
  IS_SHOWCASE_MODE = !!ownerFromPath;

  if (owner && el.walletInput) {
    el.walletInput.value = owner;
    // Don't block boot if wallet lookup fails.
    doWalletLookup();
  }

  validateLookConfig(LOOK_CONTROLS, "LOOK_CONTROLS");
  validateLookConfig(
    LOOK_PRESETS[DEFAULT_LOOK_PRESET],
    `Preset: ${DEFAULT_LOOK_PRESET}`
  );
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

      // If showcase mode queued a token before metadata was ready, load it now.
      if (IS_SHOWCASE_MODE && Number.isFinite(SHOWCASE_PENDING_TOKEN_ID)) {
        const id = Number(SHOWCASE_PENDING_TOKEN_ID);
        SHOWCASE_PENDING_TOKEN_ID = null;
        if (el.friendsiesId) el.friendsiesId.value = String(id);
        loadFriendsies(id);
        return;
      }

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
