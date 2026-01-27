// main.js
// ------------------------------------------------------------
// fRiENDSiES Toy Box
// - Load fRiENDSiES parts (BODY is the master rig)
// - Bind trait parts to BODY skeleton (Skinned + rigid attachments)
// - Apply face/vibe texture as an overlay anchored to BODY Head bone
// - Load pano background + EXR environment lighting
// - Minimal UI + on-screen pseudo console log
// ------------------------------------------------------------

// ------------------------------------------------------------
// UI (minimal)
// ------------------------------------------------------------
const UI = {
  statusEl: document.getElementById("status"),
  idInput: document.getElementById("friendsiesId"),
  loadBtn: document.getElementById("loadBtn"),
  randomBtn: document.getElementById("randomBtn"),
  autoRandomOn: document.getElementById("autoRandomOn"),

  animSelect: document.getElementById("animSelect"),
  playBtn: document.getElementById("playBtn"),
  stopBtn: document.getElementById("stopAnimBtn"),

  orbitOn: document.getElementById("orbitOn"),
  autoRotateOn: document.getElementById("autoRotateOn"),

  printTraitsBtn: document.getElementById("printTraitsBtn"),
  printRigBtn: document.getElementById("printRigBtn"),
  clearLogBtn: document.getElementById("clearLogBtn"),

  logEl: document.getElementById("log"),
};

function setStatus(s) {
  if (UI.statusEl) UI.statusEl.textContent = s;
}

const orbitOn = () => UI.orbitOn?.checked ?? true;
const autoRotateOn = () => UI.autoRotateOn?.checked ?? false;

const LOG_MAX = 250;

function logLine(msg, level = "info") {
  if (!UI.logEl) return;

  const line = document.createElement("div");
  line.className =
    "logLine" +
    (level === "dim"
      ? " dim"
      : level === "warn"
      ? " warn"
      : level === "err"
      ? " err"
      : "");

  const ts = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  line.textContent = `[${ts}] ${msg}`;
  UI.logEl.appendChild(line);

  while (UI.logEl.children.length > LOG_MAX)
    UI.logEl.removeChild(UI.logEl.firstChild);

  UI.logEl.scrollTop = UI.logEl.scrollHeight;
}

function logHeader(title) {
  logLine(`\n=== ${title} ===`, "dim");
}

function clearLog() {
  if (UI.logEl) UI.logEl.innerHTML = "";
}

// ------------------------------------------------------------
// Animation presets
// ------------------------------------------------------------
const ANIM_PRESETS = [
  {
    label: "Walk Start",
    url: "https://cdn.jsdelivr.net/gh/PIZZALORD713/animation_collection@main/WalkStart.glb",
  },
  {
    label: "Walk Loop",
    url: "https://cdn.jsdelivr.net/gh/PIZZALORD713/animation_collection@main/WalkLoop.glb",
  },
  {
    label: "Idle",
    url: "https://cdn.jsdelivr.net/gh/PIZZALORD713/animation_collection@main/Idle.glb",
  },
  {
    label: "Run",
    url: "https://cdn.jsdelivr.net/gh/PIZZALORD713/animation_collection@main/Run.glb",
  },
  {
    label: "Jump",
    url: "https://cdn.jsdelivr.net/gh/PIZZALORD713/animation_collection@main/Jump.glb",
  },
];

function initAnimSelect() {
  if (!UI.animSelect) return;

  UI.animSelect.innerHTML = "";

  for (const p of ANIM_PRESETS) {
    const opt = document.createElement("option");
    opt.value = p.url; // keep URL hidden behind label
    opt.textContent = p.label;
    UI.animSelect.appendChild(opt);
  }

  const custom = document.createElement("option");
  custom.value = "__custom__";
  custom.textContent = "Custom…";
  UI.animSelect.appendChild(custom);

  UI.animSelect.addEventListener("change", () => {
    if (UI.animSelect.value !== "__custom__") return;

    const url = prompt("Paste animation GLB URL");
    if (!url) {
      UI.animSelect.selectedIndex = 0;
      return;
    }

    const label = url.split("/").pop()?.replace(/\?.*$/, "") || "Custom";
    const opt = document.createElement("option");
    opt.value = url;
    opt.textContent = `Custom: ${label}`;
    UI.animSelect.insertBefore(opt, UI.animSelect.lastElementChild);
    UI.animSelect.value = url;
  });

  UI.animSelect.selectedIndex = 0;
}

// ------------------------------------------------------------
// Scene / Camera / Renderer
// ------------------------------------------------------------
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1.2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0xffffff);
renderer.outputEncoding = THREE.sRGBEncoding;

document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 2;
controls.maxDistance = 14;
controls.target.set(0, 1.0, 0);

// ------------------------------------------------------------
// Lights
// ------------------------------------------------------------
scene.add(new THREE.HemisphereLight(0xffffff, 0xffffff, 0.35));
scene.add(new THREE.AmbientLight(0xffffff, 0.25));

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.65);
directionalLight.position.set(-0.5, 2.5, 5);
scene.add(directionalLight);

// ------------------------------------------------------------
// Loaders
// ------------------------------------------------------------
const dracoLoader = new THREE.DRACOLoader();
dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");

const gltfLoader = new THREE.GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin("anonymous");

// ------------------------------------------------------------
// Assets (LOCAL first) + cache bust helper
// ------------------------------------------------------------
// If you overwrite the same filename in GitHub, browsers/CDNs may cache it.
// Bump ASSET_VERSION when you replace files, or rename the file.
const ASSET_VERSION = "v1"; // <- bump to v2, v3... whenever you change local images

const LDR_BG_URL = `./garden-cotton-clouds.png?${ASSET_VERSION}`;
const HDR_EXR_URL = `./friendsies_cloud_overcast_studio_v1.exr?${ASSET_VERSION}`;

// ------------------------------------------------------------
// Background (panorama on inside of sphere)
// ------------------------------------------------------------
function loadBackgroundLDR() {
  const bgTexture = textureLoader.load(
    LDR_BG_URL,
    () => logLine("Background loaded ✅", "dim"),
    undefined,
    (err) => logLine("Background failed ❌ " + (err?.message || err), "err")
  );
  bgTexture.encoding = THREE.sRGBEncoding;

  const sphereGeo = new THREE.SphereGeometry(200, 48, 32);
  sphereGeo.scale(-1, 1, 1);

  const sphereMat = new THREE.MeshBasicMaterial({ map: bgTexture });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  sphere.name = "PANO_BG";
  scene.add(sphere);
}

// ------------------------------------------------------------
// EXR environment lighting (PMREM)
// ------------------------------------------------------------
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

function loadEnvironmentEXR() {
  if (!THREE.EXRLoader) {
    logLine("EXRLoader missing ❌ (check script include order)", "err");
    return;
  }

  const exrLoader = new THREE.EXRLoader();
  exrLoader.load(
    HDR_EXR_URL,
    (texture) => {
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      scene.environment = envMap;
      texture.dispose();
      pmremGenerator.dispose();
      logLine("EXR environment loaded ✅", "dim");
    },
    undefined,
    (err) => logLine("EXR env failed ❌ " + (err?.message || err), "err")
  );
}

// ------------------------------------------------------------
// Avatar group (global scale/offset)
// ------------------------------------------------------------
const avatarGroup = new THREE.Group();
avatarGroup.scale.set(15, 15, 15);
avatarGroup.position.y = -2.5;
scene.add(avatarGroup);

// ------------------------------------------------------------
// State
// ------------------------------------------------------------
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

// Defaults (removed from UI)
const SAFE_MODE_DEFAULT = true;
const FREEZE_POS_DEFAULT = true;
const ALLOW_HIPS_TRANSLATION_DEFAULT = true;
const BOB_DEFAULT = true;

const safeModeOn = () => SAFE_MODE_DEFAULT;
const freezePosOn = () => FREEZE_POS_DEFAULT;
const allowHipsPosOn = () => ALLOW_HIPS_TRANSLATION_DEFAULT;
const bobOn = () => BOB_DEFAULT;

let isLoading = false;

// ------------------------------------------------------------
// Small helpers
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// Rig info collection (hips + rest pose)
// ------------------------------------------------------------
function collectRigInfo() {
  hipsRawName = null;
  restPosByBone = new Map();
  if (!bodySkeleton) return;

  for (const b of bodySkeleton.bones) {
    if (!hipsRawName && keyForName(b.name) === "hips") hipsRawName = b.name;
    restPosByBone.set(b.name, b.position.clone());
  }

  if (faceAnchor?.parent) faceAnchor.parent.remove(faceAnchor);
  faceAnchor = new THREE.Object3D();
  faceAnchor.name = "FACE_ANCHOR";

  const headBone = getBodyBoneByKey("head") || getBodyBoneByKey("neck");
  if (headBone) headBone.add(faceAnchor);
  else avatarGroup.add(faceAnchor);
}

function restoreRestPositionsExceptHips() {
  if (!bodySkeleton) return;

  for (const b of bodySkeleton.bones) {
    if (allowHipsPosOn() && hipsRawName && b.name === hipsRawName) continue;
    const p = restPosByBone.get(b.name);
    if (p) b.position.copy(p);
  }
}

// ------------------------------------------------------------
// Bind part skinned meshes to BODY skeleton
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// Retarget rigid attachments to BODY bones
// ------------------------------------------------------------
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
    const hasSkinAttrs =
      !!g?.attributes?.skinIndex && !!g?.attributes?.skinWeight;

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

      const bindMatrix =
        bodySkinned?.bindMatrix?.clone?.() || new THREE.Matrix4();
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

// ------------------------------------------------------------
// Animation clip sanitization
// ------------------------------------------------------------
function sanitizeClip(clip) {
  if (!clip) return clip;

  const tracks = [];
  for (const t of clip.tracks || []) {
    const n = (t.name || "").toLowerCase();

    if (n.endsWith(".scale")) continue;

    if (safeModeOn() && n.endsWith(".position")) {
      const rawTarget = t.name.split(".")[0] || "";
      const boneName = rawTarget.includes("|")
        ? rawTarget.split("|").pop()
        : rawTarget;

      const isHips = hipsRawName && boneName === hipsRawName;
      if (allowHipsPosOn() && isHips) tracks.push(t);

      continue;
    }

    tracks.push(t);
  }

  const out = new THREE.AnimationClip(clip.name, clip.duration, tracks);
  out.optimize();
  return out;
}

// ------------------------------------------------------------
// Face overlay
// ------------------------------------------------------------
function clearFaceOverlay() {
  for (const m of faceOverlayMeshes) if (m?.parent) m.parent.remove(m);
  faceOverlayMeshes = [];
}

function createSkinnedFaceOverlayFromHead(headScene, faceTexture) {
  clearFaceOverlay();
  if (!headScene || !faceTexture || !bodySkeleton || !faceAnchor) return;

  const faceMat = new THREE.MeshStandardMaterial({
    map: faceTexture,
    transparent: true,
    alphaTest: 0.5,
    depthWrite: false,
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
    if (
      /(face|vibe|eyes|mask|decal)/.test(n) ||
      /(face|vibe|eyes|mask|decal)/.test(mn)
    ) {
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

    const local = new THREE.Matrix4()
      .copy(faceAnchor.matrixWorld)
      .invert()
      .multiply(src.matrixWorld);

    local.decompose(overlay.position, overlay.quaternion, overlay.scale);

    faceAnchor.add(overlay);
    faceOverlayMeshes.push(overlay);
    made++;
  }

  logLine(`Face overlay: ${made} mesh(es)`, "dim");
}

// ------------------------------------------------------------
// Cleanup
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// Debug actions (to on-screen log)
// ------------------------------------------------------------
function printTraitsToLog() {
  if (!lastTraits) return logLine("No traits loaded yet.", "warn");

  logHeader("Trait URLs");
  for (const t of lastTraits) {
    const url = t.asset_url ? `\n    ${t.asset_url}` : "";
    logLine(`${t.trait_type}: ${t.value}${url}`);
  }
}

function printRigBonesToLog() {
  if (!bodySkeleton) return logLine("No rig yet.", "warn");

  logHeader(`Rig Bones (${bodySkeleton.bones.length})`);
  for (const b of bodySkeleton.bones) {
    logLine(`${b.name}  →  ${keyForName(b.name)}`, "dim");
  }
}

// ------------------------------------------------------------
// Metadata
// ------------------------------------------------------------
const METADATA_URL =
  "https://gist.githubusercontent.com/IntergalacticPizzaLord/a7b0eeac98041a483d715c8320ccf660/raw/ce7d37a94c33c63e2b50d5922e0711e72494c8dd/fRiENDSiES";

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

// ------------------------------------------------------------
// Load full character
// ------------------------------------------------------------
async function loadFriendsies(id) {
  if (!allFriendsies) return;

  isLoading = true;

  const loadId = ++currentLoadId;
  clearAvatar();
  setStatus(`loading #${id}…`);

  const entry = getEntryById(id);
  if (!entry) {
    setStatus(`not found: #${id}`);
    isLoading = false;
    return;
  }

  const traits = entry.attributes || [];
  lastTraits = traits;

  const faceAttr = traits.find((t) => t.trait_type === "face");
  let faceTexture = null;

  if (faceAttr?.asset_url) {
    faceTexture = textureLoader.load(faceAttr.asset_url);
    faceTexture.minFilter = THREE.LinearFilter;
    faceTexture.repeat.y = -1;
    faceTexture.offset.y = 1;
    faceTexture.encoding = THREE.sRGBEncoding;
  }

  const bodyAttr = traits.find((t) => t.trait_type === "body");
  if (!bodyAttr?.asset_url) {
    setStatus("no body trait found ❌");
    isLoading = false;
    return;
  }

  const bodyRes = await loadGLB(bodyAttr.asset_url);
  if (loadId !== currentLoadId) return;

  if (!bodyRes.ok) {
    setStatus("body load failed ❌");
    isLoading = false;
    return;
  }

  bodyRoot = bodyRes.gltf.scene;
  loadedParts.push(bodyRoot);
  avatarGroup.add(bodyRoot);

  bodySkinned = findFirstSkinnedMesh(bodyRoot);
  if (!bodySkinned?.skeleton) {
    setStatus("body loaded but no skeleton ❌");
    isLoading = false;
    return;
  }

  bodySkeleton = bodySkinned.skeleton;
  collectRigInfo();

  mixer = new THREE.AnimationMixer(bodyRoot);

  const bodyClips = bodyRes.gltf.animations || [];
  if (bodyClips.length) {
    const clip = sanitizeClip(bodyClips[0]);
    currentAction = mixer.clipAction(clip);
    currentAction.reset().play();
  }

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
      if (moved) logLine(`Head rigid retarget: ${moved}`, "dim");
    }
  }

  const partTraits = traits.filter(
    (t) => !["body", "head", "face"].includes(t.trait_type)
  );

  for (const t of partTraits) {
    if (!t.asset_url || !t.asset_url.endsWith(".glb")) continue;

    const res = await loadGLB(t.asset_url);
    if (loadId !== currentLoadId) return;

    if (res.ok) {
      const part = res.gltf.scene;

      loadedParts.push(part);
      avatarGroup.add(part);
      avatarGroup.updateMatrixWorld(true);

      const c = attachPartToBodySkeleton(part);
      const moved = retargetRigidAttachmentsToBodyBones(part);

      if (c || moved)
        logLine(
          `Part ${t.trait_type}:${t.value}  bound:${c}  retarget:${moved}`,
          "dim"
        );
    }
  }

  controls.target.set(0, 1.0, 0);
  setStatus(`loaded #${id} ✅`);
  isLoading = false;

  if (UI.animSelect?.value && UI.animSelect.value !== "__custom__") {
    await loadExternalAnim(UI.animSelect.value);
  }
}

// ------------------------------------------------------------
// External animation (Mixamo GLB)
// ------------------------------------------------------------
async function loadExternalAnim(url) {
  if (!url) return setStatus("select an animation");
  if (!mixer || !bodyRoot) return setStatus("load a friendsies first");

  setStatus("loading anim…");

  const res = await loadGLB(url);
  if (!res.ok) {
    setStatus("anim load failed ❌");
    return logLine("Anim load failed ❌", "err");
  }

  const clips = res.gltf.animations || [];
  if (!clips.length) {
    setStatus("anim has 0 clips ❌");
    return logLine("Anim has 0 clips ❌", "err");
  }

  const clip = sanitizeClip(clips[0]);

  mixer.stopAllAction();
  currentAction = mixer.clipAction(clip);
  currentAction.reset().play();

  setStatus(`playing ✅ ${clip.name || "clip"}`);
  logLine(`Playing: ${clip.name || "unnamed"}`, "dim");
}

// ------------------------------------------------------------
// UI wiring
// ------------------------------------------------------------
async function loadByInput() {
  const id = Number(UI.idInput?.value);
  if (!Number.isFinite(id) || id < 1 || id > 10000)
    return setStatus("enter a valid ID (1–10000)");
  await loadFriendsies(id);
}

function loadRandom() {
  const id = 1 + Math.floor(Math.random() * 10000);
  if (UI.idInput) UI.idInput.value = String(id);
  loadFriendsies(id);
}

let autoRandomTimer = null;
function setAutoRandom(enabled) {
  if (autoRandomTimer) clearInterval(autoRandomTimer);
  autoRandomTimer = null;

  if (!enabled) return logLine("Auto-random OFF", "dim");

  logLine("Auto-random ON (every 4s)", "dim");
  autoRandomTimer = setInterval(() => {
    if (isLoading) return;
    loadRandom();
  }, 4000);
}

UI.loadBtn?.addEventListener("click", () => loadByInput());
UI.randomBtn?.addEventListener("click", () => loadRandom());
UI.idInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loadByInput();
});

UI.playBtn?.addEventListener("click", async () => {
  const url = UI.animSelect?.value;
  if (!url || url === "__custom__") return setStatus("select an animation");
  await loadExternalAnim(url);
});

UI.stopBtn?.addEventListener("click", () => {
  if (mixer) mixer.stopAllAction();
  currentAction = null;
  setStatus("stopped");
  logLine("Stopped animation", "dim");
});

UI.autoRandomOn?.addEventListener("change", () =>
  setAutoRandom(!!UI.autoRandomOn.checked)
);

UI.printTraitsBtn?.addEventListener("click", () => printTraitsToLog());
UI.printRigBtn?.addEventListener("click", () => printRigBonesToLog());
UI.clearLogBtn?.addEventListener("click", () => clearLog());

// ------------------------------------------------------------
// Boot
// ------------------------------------------------------------
clearLog();
logLine("Toy Box booting…", "dim");
initAnimSelect();
loadBackgroundLDR();
loadEnvironmentEXR();

setStatus("fetching metadata…");
fetch(METADATA_URL)
  .then((r) => r.json())
  .then(async (data) => {
    allFriendsies = data;
    setStatus("ready ✅");
    logLine("Metadata loaded ✅", "dim");
    await loadByInput();
  })
  .catch((e) => {
    setStatus("metadata fetch failed ❌");
    logLine("Metadata fetch failed ❌", "err");
  });

// ------------------------------------------------------------
// Render loop
// ------------------------------------------------------------
function animate() {
  requestAnimationFrame(animate);

  const dt = clock.getDelta();

  if (mixer) mixer.update(dt);
  if (freezePosOn() && bodySkeleton) restoreRestPositionsExceptHips();

  if (bobOn()) {
    const t = clock.elapsedTime;
    avatarGroup.position.y = -2.5 + Math.sin(t * 2.0) * 0.08;
    avatarGroup.rotation.y = Math.sin(t * 0.6) * 0.06;
  } else {
    avatarGroup.position.y = -2.5;
    avatarGroup.rotation.y = 0;
  }

  controls.enabled = orbitOn();
  controls.autoRotate = orbitOn() && autoRotateOn();
  if (controls.enabled) controls.update();

  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});
