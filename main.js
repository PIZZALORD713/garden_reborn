// JS (CodePen) — full file (r128 globals)

// ----------------------------
// Scene / Camera / Renderer
// ----------------------------
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  45, // slightly narrower FOV helps the pano feel less "stretched"
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1.2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0xffffff);

// Better looking PBR response
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

document.body.appendChild(renderer.domElement);

// OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 2;
controls.maxDistance = 14;
controls.target.set(0, 1.0, 0);

// ----------------------------
// UI
// ----------------------------
const statusEl = document.getElementById("status");
const setStatus = (s) => (statusEl.textContent = s);

const orbitOn = () => document.getElementById("orbitOn")?.checked ?? true;
const autoRotateOn = () =>
  document.getElementById("autoRotateOn")?.checked ?? false;

const safeModeOn = () => document.getElementById("safeModeOn")?.checked ?? true;
const freezePosOn = () =>
  document.getElementById("freezePosOn")?.checked ?? true;
const allowHipsPosOn = () =>
  document.getElementById("allowHipsPosOn")?.checked ?? true;
const bobOn = () => document.getElementById("bobOn")?.checked ?? true;

// Drawer toggle
const controlsEl = document.getElementById("controls");
const gearBtn = document.getElementById("gearBtn");
gearBtn?.addEventListener("click", () => {
  const collapsed = controlsEl.classList.toggle("collapsed");
  gearBtn.setAttribute("aria-expanded", String(!collapsed));
});

// ----------------------------
// Lights (add subtle rim to fix dark backs)
// ----------------------------
scene.add(new THREE.HemisphereLight(0xffffff, 0xffffff, 0.22));
scene.add(new THREE.AmbientLight(0xffffff, 0.12));

// Key light (front-ish)
const keyLight = new THREE.DirectionalLight(0xffffff, 0.55);
keyLight.position.set(-0.5, 2.5, 5);
scene.add(keyLight);

// Rim light (behind) — helps metallic wings/backs not go black
const rimLight = new THREE.DirectionalLight(0xffffff, 0.35);
rimLight.position.set(0.8, 2.0, -5);
scene.add(rimLight);

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
// ENV: Sphere pano background + EXR environment
// ----------------------------
const LDR_BG_URL =
  "https://cdn.jsdelivr.net/gh/PIZZALORD713/garden_reborn@main/garden-cotton-clouds.png";
const HDR_EXR_URL =
  "https://cdn.jsdelivr.net/gh/PIZZALORD713/garden_reborn@main/friendsies_cloud_overcast_studio_v1.exr";

const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();

// Background sphere (reduces “edge exaggeration” vs scene.background)
let panoSphere = null;
function setPanoSphere(tex) {
  if (panoSphere?.parent) panoSphere.parent.remove(panoSphere);

  const geo = new THREE.SphereBufferGeometry(250, 60, 40);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    side: THREE.BackSide,
    depthWrite: false
  });

  panoSphere = new THREE.Mesh(geo, mat);
  panoSphere.frustumCulled = false;
  scene.add(panoSphere);
}

function loadBackgroundLDR() {
  setStatus("loading pano bg…");
  textureLoader.load(
    LDR_BG_URL,
    (tex) => {
      tex.encoding = THREE.sRGBEncoding;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy?.() || 1;

      // IMPORTANT: don’t set EquirectangularReflectionMapping for sphere UVs
      // Sphere geometry already has proper UVs for an equirectangular image.
      setPanoSphere(tex);

      setStatus("loading EXR env…");
    },
    undefined,
    (err) => {
      console.warn("❌ pano bg failed", err);
      setStatus("pano bg failed ❌");
    }
  );
}

function loadEnvironmentEXR() {
  if (!THREE.EXRLoader) {
    console.error(
      "THREE.EXRLoader missing. Add EXRLoader.js in External Scripts."
    );
    setStatus("EXRLoader missing ❌");
    return;
  }

  const exrLoader = new THREE.EXRLoader();
  exrLoader.load(
    HDR_EXR_URL,
    (tex) => {
      // EXR is linear — do NOT set sRGBEncoding
      tex.mapping = THREE.EquirectangularReflectionMapping;

      const envRT = pmrem.fromEquirectangular(tex);
      scene.environment = envRT.texture;

      tex.dispose();

      setStatus("ready ✅");
      console.log("✅ EXR environment loaded");
    },
    undefined,
    (err) => {
      console.warn("❌ EXR env failed", err);
      setStatus("EXR env failed ❌");
    }
  );
}

loadBackgroundLDR();
loadEnvironmentEXR();

// ----------------------------
// Avatar group
// ----------------------------
const avatarGroup = new THREE.Group();
avatarGroup.scale.set(15, 15, 15);
avatarGroup.position.y = -2.5;
scene.add(avatarGroup);

// ----------------------------
// State
// ----------------------------
const clock = new THREE.Clock();

let allFriendsies = null;
let currentLoadId = 0;

let loadedParts = [];
let lastTraits = null;

// BODY rig refs
let bodyRoot = null;
let bodySkeleton = null;
let bodySkinned = null;

// Animation
let mixer = null;
let currentAction = null;

// Hips/rest
let hipsRawName = null;
let restPosByBone = new Map();

// Face overlay
let faceOverlayMeshes = [];
let faceAnchor = null;

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

function attachPartToBodySkeleton(partScene) {
  if (!bodySkeleton || !bodySkinned || !partScene) return 0;
  bodySkinned.updateMatrixWorld(true);

  let skinnedCount = 0;
  partScene.traverse((o) => {
    if (!o.isSkinnedMesh) return;
    skinnedCount++;

    const bindMatrix = o.bindMatrix
      ? o.bindMatrix.clone()
      : new THREE.Matrix4();
    o.bind(bodySkeleton, bindMatrix);
    o.bindMode = bodySkinned.bindMode || o.bindMode;
    o.frustumCulled = false;
    o.updateMatrixWorld(true);
  });

  return skinnedCount;
}

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

    if (op.type === "reparent") reparentKeepWorld(op.obj, op.target);
  }

  return ops.length;
}

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
    if (
      /(face|vibe|eyes|mask|decal)/.test(n) ||
      /(face|vibe|eyes|mask|decal)/.test(mn)
    ) {
      candidates.push(o);
    }
  });

  const targets = candidates.length ? candidates : all;

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
  }
}

// Bring back the emissive boost for some head materials (as you had before)
function boostHeadEmissive(headScene, intensity = 2.3) {
  if (!headScene) return;
  headScene.traverse((child) => {
    if (!child.isMesh) return;

    const mats = Array.isArray(child.material)
      ? child.material
      : [child.material];
    for (const m of mats) {
      if (!m) continue;
      if (m.emissiveMap) {
        m.emissive = new THREE.Color(0xffffff);
        m.emissiveIntensity = intensity;
        m.needsUpdate = true;
      }
    }
  });
}

// Fix “dark metal backs”: nudge envMapIntensity for metallic-ish materials
function tuneMaterialsForEnv(root) {
  if (!root) return;
  root.traverse((o) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (!m) continue;
      if ("metalness" in m) {
        // Give shiny stuff more environment contribution
        if ((m.metalness ?? 0) > 0.35) {
          m.envMapIntensity = Math.max(m.envMapIntensity ?? 1, 1.35);
        } else {
          m.envMapIntensity = Math.max(m.envMapIntensity ?? 1, 1.05);
        }
        m.needsUpdate = true;
      }
    }
  });
}

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

function printTraits() {
  if (!lastTraits) return console.warn("No traits loaded yet.");
  console.groupCollapsed("🧩 Trait URLs");
  console.table(
    lastTraits.map((t) => ({
      trait_type: t.trait_type,
      value: t.value,
      asset_url: t.asset_url
    }))
  );
  console.groupEnd();
}

function printRigBones() {
  if (!bodySkeleton) return console.warn("No rig yet.");
  console.groupCollapsed(
    `🦴 Rig bones (${bodySkeleton.bones.length}) hipsRaw=${
      hipsRawName || "(none)"
    }`
  );
  console.table(
    bodySkeleton.bones.map((b) => ({ raw: b.name, key: keyForName(b.name) }))
  );
  console.groupEnd();
}

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

// ----------------------------
// Metadata
// ----------------------------
const METADATA_URL =
  "https://gist.githubusercontent.com/IntergalacticPizzaLord/a7b0eeac98041a483d715c8320ccf660/raw/ce7d37a94c33c63e2b50d5922e0711e72494c8dd/fRiENDSiES";

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
  });

// ----------------------------
// Load full character
// ----------------------------
async function loadFriendsies(id) {
  if (!allFriendsies) return;

  const loadId = ++currentLoadId;
  clearAvatar();
  setStatus(`loading #${id}…`);

  const entry = getEntryById(id);
  if (!entry) return setStatus(`not found: #${id}`);

  const traits = entry.attributes || [];
  lastTraits = traits;

  // FACE texture (PNG)
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
    console.warn(bodyRes.err);
    return setStatus("body load failed ❌");
  }

  bodyRoot = bodyRes.gltf.scene;
  loadedParts.push(bodyRoot);
  avatarGroup.add(bodyRoot);

  bodySkinned = findFirstSkinnedMesh(bodyRoot);
  if (!bodySkinned?.skeleton)
    return setStatus("body loaded but no skeleton ❌");

  bodySkeleton = bodySkinned.skeleton;
  collectRigInfo();

  mixer = new THREE.AnimationMixer(bodyRoot);

  const bodyClips = bodyRes.gltf.animations || [];
  if (bodyClips.length) {
    const clip = sanitizeClip(bodyClips[0]);
    currentAction = mixer.clipAction(clip);
    currentAction.reset().play();
  }

  tuneMaterialsForEnv(bodyRoot);

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
      if (moved)
        console.log(`🧷 Retargeted rigid attachments (head): ${moved}`);

      // ✅ Restore emissive boost for head
      boostHeadEmissive(headScene, 2.3);

      tuneMaterialsForEnv(headScene);
    }
  }

  // OTHER PARTS
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

      attachPartToBodySkeleton(part);
      retargetRigidAttachmentsToBodyBones(part);

      tuneMaterialsForEnv(part);
    }
  }

  controls.target.set(0, 1.0, 0);

  setStatus(
    `loaded #${id} ✅ parts:${loadedParts.length} bones:${bodySkeleton.bones.length} faceOverlays:${faceOverlayMeshes.length}`
  );
}

// ----------------------------
// External animation
// ----------------------------
async function loadExternalAnim() {
  const url = document.getElementById("animUrl").value.trim();
  if (!url) return setStatus("paste an animation GLB url");
  if (!mixer || !bodyRoot) return setStatus("load a friendsies first");

  setStatus("loading anim…");

  const res = await loadGLB(url);
  if (!res.ok) {
    console.warn(res.err);
    return setStatus("anim load failed ❌");
  }

  const clips = res.gltf.animations || [];
  if (!clips.length) return setStatus("anim has 0 clips ❌");

  const clip = sanitizeClip(clips[0]);

  mixer.stopAllAction();
  currentAction = mixer.clipAction(clip);
  currentAction.reset().play();

  setStatus(`playing anim ✅ clip:${clip.name || "unnamed"}`);
}

// ----------------------------
// UI wiring
// ----------------------------
function loadByInput() {
  const id = Number(document.getElementById("friendsiesId").value);
  if (!Number.isFinite(id) || id < 1 || id > 10000)
    return setStatus("enter a valid ID (1–10000)");
  loadFriendsies(id);
}

document.getElementById("loadBtn").addEventListener("click", loadByInput);

document.getElementById("randomBtn").addEventListener("click", () => {
  const id = 1 + Math.floor(Math.random() * 10000);
  document.getElementById("friendsiesId").value = String(id);
  loadFriendsies(id);
});

document.getElementById("friendsiesId").addEventListener("keydown", (e) => {
  if (e.key === "Enter") loadByInput();
});

document
  .getElementById("loadAnimBtn")
  .addEventListener("click", loadExternalAnim);

document.getElementById("stopAnimBtn").addEventListener("click", () => {
  if (mixer) mixer.stopAllAction();
  currentAction = null;
  setStatus("anim stopped");
});

document
  .getElementById("printTraitsBtn")
  .addEventListener("click", printTraits);
document.getElementById("printRigBtn").addEventListener("click", printRigBones);

// ----------------------------
// Render loop
// ----------------------------
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

// ----------------------------
// Resize
// ----------------------------
window.addEventListener("resize", () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});
