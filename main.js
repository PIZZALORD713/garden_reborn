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

  // new UI elements for visibility toggles
  uiToggleBtn: document.getElementById("uiToggleBtn"),
  panel: document.getElementById("panel"),
  logWrap: document.getElementById("logWrap"),
  logToggleBtn: document.getElementById("logToggleBtn"),
};

function setStatus(s) {
  if (UI.statusEl) UI.statusEl.textContent = s;
}

const orbitOn = () => UI.orbitOn?.checked ?? true;
const autoRotateOn = () => UI.autoRotateOn?.checked ?? false;

const LOG_MAX = 250;

// ------------------------------------------------------------
// UI visibility (panel + console)
// - H toggles the whole UI panel (gear stays visible)
// - L toggles the on-screen log console
// ------------------------------------------------------------
const UI_STATE = {
  uiOpen: true,
  logOpen: true,
};

function isTypingInForm() {
  const el = document.activeElement;
  const tag = el?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable;
}

function setUIOpen(open) {
  UI_STATE.uiOpen = !!open;
  document.body.classList.toggle("uiHidden", !UI_STATE.uiOpen);
  if (UI.uiToggleBtn) UI.uiToggleBtn.setAttribute("aria-expanded", String(UI_STATE.uiOpen));
  try { localStorage.setItem("uiOpen", UI_STATE.uiOpen ? "1" : "0"); } catch {}
}

function setLogOpen(open) {
  UI_STATE.logOpen = !!open;
  if (UI.logWrap) UI.logWrap.classList.toggle("collapsed", !UI_STATE.logOpen);
  if (UI.logToggleBtn) UI.logToggleBtn.setAttribute("aria-expanded", String(UI_STATE.logOpen));
  try { localStorage.setItem("logOpen", UI_STATE.logOpen ? "1" : "0"); } catch {}
}

(function initVisibility() {
  try {
    const uiOpen = localStorage.getItem("uiOpen");
    const logOpen = localStorage.getItem("logOpen");
    if (uiOpen !== null) UI_STATE.uiOpen = uiOpen === "1";
    if (logOpen !== null) UI_STATE.logOpen = logOpen === "1";
  } catch {}

  setUIOpen(UI_STATE.uiOpen);
  setLogOpen(UI_STATE.logOpen);

  UI.uiToggleBtn?.addEventListener("click", () => setUIOpen(!UI_STATE.uiOpen));
  UI.logToggleBtn?.addEventListener("click", () => setLogOpen(!UI_STATE.logOpen));

  document.addEventListener("keydown", (e) => {
    if (isTypingInForm()) return;
    if (e.key === "h" || e.key === "H") setUIOpen(!UI_STATE.uiOpen);
    if (e.key === "l" || e.key === "L") setLogOpen(!UI_STATE.logOpen);
  });
})();

// ------------------------------------------------------------
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

// ... rest of your existing main.js continues unchanged ...
// (Everything after this point is identical to your current main.js and
// was not modified except for the UI additions above.)