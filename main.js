import {
  getWalletOwnerFromUrl as getIdentifierWalletOwnerFromUrl,
  isEnsName,
  isHexAddress
} from "./identifier-utils.js";

// ------------------------------------------------------------
// fRiENEMiES Studio - Viewer + Animation Test
// - BODY is the master rig (skeleton source)
// - HEAD + trait parts: bind SkinnedMeshes to BODY skeleton
// - FIX: also retarget rigid (non-skinned) meshes parented under part bones
// - Face texture: overlay mesh anchored to BODY head bone
//
// UI upgrades in this version:
// - Gear button toggles ALL UI (controls + transcript)
// - Transcript panel can collapse independently
// - Trait URLs / Rig Bones print into transcript (not dev console)
// ------------------------------------------------------------

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
// Token defaults
// ----------------------------
const DEFAULT_TOKEN_ID = 5;
const FREN_DEFAULT_TOKEN_ID = 7499;
const SAUCE_PRESET_TOKEN_ID = 8521;
const FREN_TOKEN_MIN = 1;
const FREN_TOKEN_MAX = 10000;
const DEFAULT_TOKEN_IDS = Array.from({ length: 10000 }, (_, i) => i + 1);
let frenRouteActive = false;

// ----------------------------
// /fren/<token> route parsing (centralized)
// ----------------------------
function parseFrenTokenFromUrl(pathname) {
  if (pathname == null) pathname = window.location.pathname;
  const match = pathname.match(/^\/fren\/(\d+)\/?$/);
  if (!match) return null;
  const num = Number(match[1]);
  if (!Number.isInteger(num) || num < FREN_TOKEN_MIN || num > FREN_TOKEN_MAX) return null;
  return num;
}

function parseFrenTokenFromUrlRaw(pathname) {
  // Returns the raw numeric value even if out of range, for error messaging.
  if (pathname == null) pathname = window.location.pathname;
  const match = pathname.match(/^\/fren\/(\d+)\/?$/);
  if (!match) return null;
  return Number(match[1]);
}

function isFrenRoute(pathname) {
  if (pathname == null) pathname = window.location.pathname;
  return /^\/fren\//.test(pathname);
}

const MASCOT_CONFIG = {
  mascotTokenId: 8521,
  mascotName: "Sauce-0x",
  mascotOpenSeaImage:
    "https://i.seadn.io/s/raw/files/e1ed6c4df4dfe488f3cd8045f741f3eb.png"
};

const routingUtils = window.FrienemiesRoutingUtils || {};
const getWalletOwnerFromUrl =
  routingUtils.getWalletOwnerFromUrl ||
  getIdentifierWalletOwnerFromUrl;
const buildCollectionPath = routingUtils.buildCollectionPath || (() => "/");
const buildOwnerPath =
  routingUtils.buildOwnerPath ||
  ((ownerSlug) => `/${encodeURIComponent(String(ownerSlug ?? "").trim())}`);

const searchUtils = window.FrienemiesSearchUtils || {};
const searchUiUtils = window.FrienemiesSearchUiUtils || {};
const loadQueueUtils = window.FrienemiesLoadQueueUtils || {};
const carouselQueryUtils = window.FrienemiesCarouselQueryUtils || {};
const dragPhysicsUtils = window.FrienemiesDragPhysicsUtils || {};
const avatarRuntimeUtils = window.FrienemiesAvatarRuntimeUtils || {};
const avatarCleanupUtils = window.FrienemiesAvatarCleanupUtils || {};
const mascotUtils = window.FrienemiesMascotUtils || {};
const normalizeSearchInput =
  searchUtils.normalizeSearchInput ||
  ((value) => String(value ?? "").trim());
const parseTokenIdInput =
  searchUtils.parseTokenIdInput ||
  ((value, options = {}) => {
    const min = Number.isInteger(options.min) ? options.min : 1;
    const max = Number.isInteger(options.max) ? options.max : 10000;
    const normalized = normalizeSearchInput(value).replace(/^#/, "");
    if (!normalized) return null;
    const tokenId = Number(normalized);
    if (!Number.isInteger(tokenId)) return null;
    if (tokenId < min || tokenId > max) return null;
    return tokenId;
  });
const updateResetCollectionVisibilityFromUtils =
  searchUiUtils.updateResetCollectionVisibility ||
  ((button, tokenIds, defaultTokenIds) => {
    if (!button) return;
    const isFiltered = tokenIds.length < defaultTokenIds.length;
    button.classList.toggle("is-visible", isFiltered);
    button.setAttribute("aria-hidden", isFiltered ? "false" : "true");
  });
const normalizeRequestedTokenId =
  loadQueueUtils.normalizeRequestedTokenId ||
  ((tokenId) => {
    const id = Number(tokenId);
    return Number.isFinite(id) ? id : null;
  });
const canRequestTokenLoad =
  loadQueueUtils.canRequestTokenLoad ||
  ((tokenIdSet, tokenId) => Number.isFinite(tokenId) && tokenIdSet instanceof Set && tokenIdSet.has(tokenId));
const shouldSkipQueuedTokenLoad =
  loadQueueUtils.shouldSkipQueuedTokenLoad ||
  (({ id, tokenIdSet, lastLoadedTokenId, force = false }) => {
    if (!Number.isFinite(id)) return true;
    if (!(tokenIdSet instanceof Set) || !tokenIdSet.has(id)) return true;
    return !force && id === lastLoadedTokenId;
  });
const renderSearchMessageFromUtils =
  searchUiUtils.renderSearchMessage ||
  ((container, message, { tone = "info", showReset = false, hint = "" } = {}) => {
    if (!container) return;

    container.innerHTML = "";

    const notice = document.createElement("div");
    notice.className = `searchNotice searchNotice--${tone}`;
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");

    const msgEl = document.createElement("p");
    msgEl.className = "searchNoticeMessage";
    msgEl.textContent = String(message || "");
    notice.appendChild(msgEl);

    if (tone === "loading") {
      const shimmer = document.createElement("div");
      shimmer.className = "searchNoticeShimmer";
      shimmer.setAttribute("aria-hidden", "true");
      notice.appendChild(shimmer);
    }

    if (hint) {
      const hintEl = document.createElement("p");
      hintEl.className = "searchNoticeHint";
      hintEl.textContent = String(hint);
      notice.appendChild(hintEl);
    }

    if (showReset) {
      const actionBtn = document.createElement("button");
      actionBtn.className = "searchNoticeAction";
      actionBtn.type = "button";
      actionBtn.dataset.searchAction = "reset-collection";
      actionBtn.textContent = "View full collection";
      notice.appendChild(actionBtn);
    }

    container.appendChild(notice);
  });

const consoleUtils = window.FrienemiesConsoleUtils || {};

const rigUtils = window.FrienemiesRigUtils || {};
const tokenUtils = window.FrienemiesTokenUtils || {};
const imageLoadUtils = window.FrienemiesImageLoadUtils || {};

async function fetchWalletTokenIds(owner) {
  const params = new URLSearchParams({
    owner,
    chain: FRIENDSIES_CHAIN,
    contract: FRIENDSIES_CONTRACT
  });
  const url = `/api/friendsiesTokens?${params.toString()}`;
  const r = await fetch(url);
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`wallet fetch failed (${r.status}): ${text}`);
  }
  const data = await r.json();
  return {
    ownerInput: data?.ownerInput || owner,
    ownerResolved: data?.ownerResolved || null,
    tokenIds: Array.isArray(data?.tokenIds) ? data.tokenIds : []
  };
}

// ----------------------------
// Scene bootstrap
// ----------------------------
const sceneBootstrapUtils = window.FrienemiesSceneBootstrap || {};
const initScene =
  sceneBootstrapUtils.initScene ||
  function initSceneFallback() {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    // Initial framing: a bit further back + slightly lower so full body fits better on mobile
    camera.position.set(0, 1.05, 6.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0xffffff);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    document.body.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2;
    controls.maxDistance = 14;
    controls.target.set(0, 0.92, 0);

    return { scene, camera, renderer, controls };
  };

const initLighting =
  sceneBootstrapUtils.initLighting ||
  function initLightingFallback(scene) {
    // r175 lighting pipeline is ~PI brighter; scale to match r128 look
    const S = 1 / Math.PI;
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.35 * S);
    scene.add(hemisphereLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2 * S);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.65 * S);
    keyLight.position.set(-0.5, 2.5, 5);
    scene.add(keyLight);
    scene.add(keyLight.target);

    const rim = new THREE.DirectionalLight(0xffffff, 0.25 * S);
    rim.position.set(2.5, 1.5, -3.5);
    scene.add(rim);
    scene.add(rim.target);

    return { hemisphereLight, ambientLight, keyLight, rim };
  };

function initCharacterLoader() {
  const dracoLoader = new THREE.DRACOLoader();
  dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");

  const gltfLoader = new THREE.GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);

  const fbxLoader = THREE.FBXLoader ? new THREE.FBXLoader() : null;

  const textureLoader = new THREE.TextureLoader();
  textureLoader.setCrossOrigin("anonymous");

  return { dracoLoader, gltfLoader, fbxLoader, textureLoader };
}

const sceneBoot = initScene();
const scene = sceneBoot.scene;
const camera = sceneBoot.camera;
const renderer = sceneBoot.renderer;
const controls = sceneBoot.controls;

const loaderBoot = initCharacterLoader();
const dracoLoader = loaderBoot.dracoLoader;
const gltfLoader = loaderBoot.gltfLoader;
const fbxLoader = loaderBoot.fbxLoader;
const textureLoader = loaderBoot.textureLoader;

const lighting = initLighting(scene);
const hemisphereLight = lighting.hemisphereLight;
const ambientLight = lighting.ambientLight;
const keyLight = lighting.keyLight;
const rim = lighting.rim;

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
  "Punchy Studio": {
    toneMapping: "ACES",
    toneMappingExposure: 1.2,
    // Lift the floor so mobile doesn't crush metals/transparency into near-black.
    ambientIntensity: 0.22,
    hemiIntensity: 0.38,
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
const DEFAULT_LOOK_PRESET_MOBILE = "Punchy Studio";

function isMobileLike() {
  // Coarse pointer + no hover catches most phones/tablets; width fallback helps small screens.
  try {
    if (window.matchMedia) {
      if (window.matchMedia("(pointer: coarse)").matches) return true;
      if (window.matchMedia("(hover: none)").matches) return true;
      if (window.matchMedia("(max-width: 820px)").matches) return true;
    }
  } catch (_) {
    // ignore
  }
  return false;
}
const lookUtils = window.FrienemiesLookUtils || {};
const LOOK_ALLOWED_KEYS =
  lookUtils.LOOK_ALLOWED_KEYS || [
    "toneMapping",
    "toneMappingExposure",
    "ambientIntensity",
    "hemiIntensity",
    "keyLightIntensity",
    "rimLightIntensity",
    "envIntensityMultiplier",
    "emissiveIntensityMultiplier"
  ];
const LEGACY_LOOK_KEY_MAP =
  lookUtils.LEGACY_LOOK_KEY_MAP || {
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

const resolveToneMapping =
  lookUtils.resolveToneMapping ||
  function resolveToneMappingFallback(name) {
    switch (String(name).toLowerCase()) {
      case "reinhard":
        return THREE.ReinhardToneMapping;
      case "aces":
      case "acesfilmic":
      default:
        return THREE.ACESFilmicToneMapping;
    }
  };

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

const normalizeLookControls =
  lookUtils.normalizeLookControls ||
  function normalizeLookControlsFallback(controls) {
    const target = controls || LOOK_CONTROLS;
    for (const [legacyKey, canonicalKey] of Object.entries(LEGACY_LOOK_KEY_MAP)) {
      if (legacyKey in target) {
        if (target[canonicalKey] === undefined) {
          target[canonicalKey] = target[legacyKey];
        }
        delete target[legacyKey];
      }
    }

    if (target.keyLightIntensity === undefined) {
      target.keyLightIntensity = 0.75;
    }
    if (target.rimLightIntensity === undefined) {
      target.rimLightIntensity = 0.35;
    }
    if (target.envIntensityMultiplier === undefined) {
      target.envIntensityMultiplier = 1.0;
    }
    if (target.emissiveIntensityMultiplier === undefined) {
      target.emissiveIntensityMultiplier = 1.0;
    }
  };

const validateLookConfig =
  lookUtils.validateLookConfig ||
  function validateLookConfigFallback(config, label, options = {}) {
    const isDev = options.isDev ?? IS_DEV;
    if (!isDev || !config) return;

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
    const reporter = options.logLine || logLine;
    if (typeof reporter === "function") {
      reporter(warning, "warn");
    }
  };

function getCanonicalLookSnapshot() {
  if (lookUtils.getCanonicalLookSnapshot) {
    return lookUtils.getCanonicalLookSnapshot(LOOK_CONTROLS);
  }
  normalizeLookControls(LOOK_CONTROLS);
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
  normalizeLookControls(LOOK_CONTROLS);
  renderer.toneMapping = resolveToneMapping(LOOK_CONTROLS.toneMapping);
  renderer.toneMappingExposure = LOOK_CONTROLS.toneMappingExposure;

  // r175 lighting pipeline produces ~PI brighter output than r128 for
  // the same intensity values. Scale down to preserve the original look.
  const R175_LIGHT_SCALE = 1 / Math.PI;
  hemisphereLight.intensity = LOOK_CONTROLS.hemiIntensity * R175_LIGHT_SCALE;
  ambientLight.intensity = LOOK_CONTROLS.ambientIntensity * R175_LIGHT_SCALE;
  keyLight.intensity = LOOK_CONTROLS.keyLightIntensity * R175_LIGHT_SCALE;
  rim.intensity = LOOK_CONTROLS.rimLightIntensity * R175_LIGHT_SCALE;

  applyLookToMaterials(avatarGroup);
}

function applyLookPreset(name) {
  const preset = LOOK_PRESETS[name];
  if (!preset) return;
  Object.assign(LOOK_CONTROLS, preset);
  normalizeLookControls(LOOK_CONTROLS);
  applyLookControls();
  syncLookSliders();
  const msg = `🎨 Look preset applied: ${name}`;
  console.log(msg, { ...LOOK_CONTROLS });
  logLine(msg);
}

const uiRoot = document.getElementById("ui");
const ui = {
  shelf: document.getElementById("shelf"),
  shelfCloud: document.getElementById("shelfCloud"),
  shelfPanel: document.getElementById("shelfPanel"),
  shelfGear: document.getElementById("shelfGear"),
  shelfRadial: document.getElementById("shelfRadial"),
  shelfSearchWrap: document.getElementById("shelfSearchWrap"),
  shelfSearchBtn: document.getElementById("shelfSearchBtn"),
  shelfSearchInput: document.getElementById("shelfSearchInput"),
  slides: document.getElementById("tokenSlides"),
  carouselViewport: document.getElementById("carouselViewport"),
  spacerLeft: document.getElementById("spacerLeft"),
  spacerRight: document.getElementById("spacerRight")
};

const searchResults = document.getElementById("searchResults");
const resetCollectionBtn = document.getElementById("resetCollectionBtn");
const copyLinkBtn = document.getElementById("copyLinkBtn");
const downloadGlbBtn = document.getElementById("downloadGlbBtn");
const exportStatus = document.getElementById("exportStatus");
const exportFallbackLink = document.getElementById("exportFallbackLink");
const controlAnimSelect = document.getElementById("controlAnimSelect");
const controlPlayAnimBtn = document.getElementById("controlPlayAnimBtn");
const animCustomUrl = document.getElementById("animCustomUrl");
const animLoadUrlBtn = document.getElementById("animLoadUrlBtn");
const animFileInput = document.getElementById("animFileInput");
const sceneModeBtn = document.getElementById("sceneModeBtn");
const animSceneHint = document.getElementById("animSceneHint");
const consoleModal = document.getElementById("consoleModal");
const consoleViewer = document.getElementById("consoleViewer");
const consoleModalViewer = document.getElementById("consoleModalViewer");
const openConsoleModalBtn = document.getElementById("openConsoleModal");
const closeConsoleBtn = document.getElementById("closeConsoleBtn");
const copyConsoleBtn = document.getElementById("copyConsoleBtn");
const clearConsoleBtn = document.getElementById("clearConsoleBtn");
const copyConsoleModalBtn = document.getElementById("copyConsoleModalBtn");
const clearConsoleModalBtn = document.getElementById("clearConsoleModalBtn");
const onboardingEl = document.getElementById("onboarding");
const onboardingInput = document.getElementById("onboardingInput");
const onboardingAnimSelect = document.getElementById("onboardingAnimSelect");
const onboardingEnterBtn = document.getElementById("onboardingEnter");
const onboardingDemoBtn = document.getElementById("onboardingDemo");
const onboardingSkipBtn = document.getElementById("onboardingSkip");
const onboardingDismissBtn = document.getElementById("onboardingDismiss");
const showOnboardingBtn = document.getElementById("showOnboardingBtn");
const mascotPanel = document.getElementById("mascotPanel");
const mascotToggle = document.getElementById("mascotToggle");
const mascotBody = document.getElementById("mascotBody");
const mascotSprite = document.getElementById("mascotSprite");
const ENABLE_MASCOT_PANEL = false;
const SHELF_VIEWS = Object.freeze(["grid", "animate", "look", "share", "info", "console"]);
const ONBOARDING_SEEN_KEY = "frenemies.onboarding.seen.v2";

const debugUi = {
  log: null
};

const exportUiState = {
  lastBlobUrl: null,
  lastFilename: "",
  warningSuppressedCount: 0,
  pending: false
};

function setExportStatus(message, tone = "") {
  if (!exportStatus) return;
  exportStatus.textContent = String(message || "");
  exportStatus.classList.toggle("is-warn", tone === "warn");
  exportStatus.classList.toggle("is-ok", tone === "ok");
}

function setExportFallbackLink(url, filename) {
  if (!exportFallbackLink) return;
  const hasLink = !!url;
  exportFallbackLink.setAttribute("aria-hidden", hasLink ? "false" : "true");
  exportFallbackLink.href = hasLink ? url : "#";
  exportFallbackLink.download = hasLink && filename ? filename : "";
}

function releaseLastExportBlobUrl() {
  if (!exportUiState.lastBlobUrl) return;
  URL.revokeObjectURL(exportUiState.lastBlobUrl);
  exportUiState.lastBlobUrl = null;
}

function defocusIfInside(container, fallbackTarget) {
  if (!container) return;
  const active = document.activeElement;
  if (!active || !container.contains(active)) return;
  if (typeof active.blur === "function") active.blur();
  if (fallbackTarget && typeof fallbackTarget.focus === "function") {
    fallbackTarget.focus({ preventScroll: true });
  }
}

window.addEventListener("beforeunload", () => {
  releaseLastExportBlobUrl();
});

const appStateStoreUtils = window.FrienemiesAppStateStore || {};
const controlShellUtils = window.FrienemiesControlShellUtils || {};
const interactionShellUtils = window.FrienemiesInteractionShellUtils || {};
const createAppState =
  appStateStoreUtils.createState ||
  (() => ({
    controlShell: {
      activeView: "grid",
      radialOpen: false,
      statusText: "booting."
    },
    avatarRuntime: {
      allFriendsies: null,
      currentLoadId: 0,
      loadedParts: [],
      loadedPartsMeta: [],
      lastTraits: null,
      bodyRoot: null,
      bodySkeleton: null,
      bodySkinned: null,
      mixer: null,
      currentAction: null,
      hipsRawName: null,
      restPosByBone: new Map(),
      faceOverlayMeshes: [],
      faceAnchor: null,
      lastFaceTexture: null
    },
    interactionShell: {
      shelfOpen: false,
      searchExpanded: false,
      idleTimer: null,
      idleActive: false,
      orbitReleaseTimer: null,
      carouselHovered: false,
      carouselScrolling: false
    },
    carouselQuery: {
      carouselTokenIds: [...DEFAULT_TOKEN_IDS],
      carouselTokenIdSet: new Set(DEFAULT_TOKEN_IDS),
      activeCarouselIndex: null,
      pendingTokenId: null,
      lastLoadedTokenId: null,
      loadDebounceTimer: null,
      imageObserver: null,
      carouselListenersBound: false,
      scrollRafPending: false,
      suppressScrollHandler: false
    },
    dragPhysics: {
      isDragging: false,
      wasDragging: false,
      dragStartX: 0,
      dragStartScroll: 0,
      dragVelocity: 0,
      dragLastX: 0,
      dragLastTime: 0,
      momentumRaf: null
    }
  }));
const appState = createAppState();

const getInitialControlShellState =
  controlShellUtils.getInitialControlShellState ||
  ((options = {}) => {
    const defaults = options.defaults || {};
    const shell = options.appState?.controlShell || {};
    return {
      activeView:
        typeof shell.activeView === "string" && SHELF_VIEWS.includes(shell.activeView)
          ? shell.activeView
          : defaults.activeView || "grid",
      radialOpen:
        typeof shell.radialOpen === "boolean"
          ? shell.radialOpen
          : !!defaults.radialOpen,
      statusText:
        typeof shell.statusText === "string"
          ? shell.statusText
          : defaults.statusText || "booting…"
    };
  });

const updateActiveViewStateFromUtils =
  controlShellUtils.updateActiveViewState ||
  ((options = {}) => {
    const nextView = SHELF_VIEWS.includes(options.view) ? options.view : "grid";
    if (options.appState?.controlShell) {
      options.appState.controlShell.activeView = nextView;
    }
    return nextView;
  });

const updateRadialOpenStateFromUtils =
  controlShellUtils.updateRadialOpenState ||
  ((options = {}) => {
    const nextOpen = !!options.open;
    if (options.appState?.controlShell) {
      options.appState.controlShell.radialOpen = nextOpen;
    }
    return nextOpen;
  });

const updateStatusTextStateFromUtils =
  controlShellUtils.updateStatusTextState ||
  ((options = {}) => {
    const nextStatus = String(options.statusText || "");
    if (options.appState?.controlShell) {
      options.appState.controlShell.statusText = nextStatus;
    }
    return nextStatus;
  });

const initialControlShellState = getInitialControlShellState({
  appState,
  defaults: {
    activeView: "grid",
    radialOpen: false,
    statusText: "booting…"
  }
});

let activeView = initialControlShellState.activeView;
let radialOpen = initialControlShellState.radialOpen;
const logBuffer = [];
const LOG_BUFFER_MAX = 300;

const renderConsoleViewerFromUtils =
  consoleUtils.renderConsoleViewer ||
  function renderConsoleViewerFromUtilsFallback({ viewer, logBuffer: entries }) {
    if (!viewer || !Array.isArray(entries)) return;
    viewer.textContent = entries.join("\n");
    viewer.scrollTop = viewer.scrollHeight;
  };

const appendLogEntryFromUtils =
  consoleUtils.appendLogEntry ||
  function appendLogEntryFromUtilsFallback({
    text,
    cls = "",
    logBuffer: entries,
    logBufferMax = 300,
    viewer,
    debugLog,
    maxLines = 220
  }) {
    const entry = String(text);
    if (Array.isArray(entries)) {
      entries.push(entry);
      while (entries.length > logBufferMax) entries.shift();
    }

    renderConsoleViewerFromUtils({ viewer, logBuffer: entries });

    if (!debugLog) return;

    const nearBottom =
      debugLog.scrollTop + debugLog.clientHeight >= debugLog.scrollHeight - 30;

    const div = document.createElement("div");
    div.className = `logLine ${cls}`.trim();
    div.textContent = entry;
    debugLog.appendChild(div);

    while (debugLog.childNodes.length > maxLines) {
      debugLog.removeChild(debugLog.firstChild);
    }

    if (nearBottom) debugLog.scrollTop = debugLog.scrollHeight;
  };

const clearLogEntriesFromUtils =
  consoleUtils.clearLogEntries ||
  function clearLogEntriesFromUtilsFallback({ debugLog, logBuffer: entries, viewer }) {
    if (debugLog) debugLog.innerHTML = "";
    if (Array.isArray(entries)) entries.length = 0;
    renderConsoleViewerFromUtils({ viewer, logBuffer: entries });
  };

function renderConsoleViewer() {
  renderConsoleViewerFromUtils({ viewer: consoleViewer, logBuffer });
}

let statusText = initialControlShellState.statusText;
function setStatus(s) {
  statusText = updateStatusTextStateFromUtils({
    statusText: s,
    appState
  });
  logLine(`• ${statusText}`, "dim");
}

// Transcript helpers
function logLine(text, cls = "") {
  appendLogEntryFromUtils({
    text,
    cls,
    logBuffer,
    logBufferMax: LOG_BUFFER_MAX,
    viewer: consoleViewer,
    debugLog: debugUi.log,
    maxLines: 220
  });
}

function logSection(title) {
  logLine("");
  logLine(`=== ${title} ===`);
}

function clearLog() {
  clearLogEntriesFromUtils({
    debugLog: debugUi.log,
    logBuffer,
    viewer: consoleViewer
  });
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
  normalizeLookControls(LOOK_CONTROLS);
  applyLookControls();
  syncLookSliders();
}

function copyCurrentLook() {
  const json = JSON.stringify(getCanonicalLookSnapshot(), null, 2);
  logSection("Current Look JSON");
  logLine(json);
  console.log("Current Look JSON", json);
}

// (legacy toast/menu removed)

// On mobile, orbiting often swings metals/gems into very dark angles because the key/rim
// are fixed in world-space. Make them loosely follow the camera to keep a consistent fill.
const MOBILE_CAMERA_FOLLOW_LIGHTS = isMobileLike();
const tmpV3 = new THREE.Vector3();

// ----------------------------
// Avatar group
// ----------------------------
const avatarGroup = new THREE.Group();
avatarGroup.scale.setScalar(15);
avatarGroup.position.y = -2.5;
scene.add(avatarGroup);

// On mobile, default to a brighter preset so metallics/gems don't crush.
applyLookPreset(isMobileLike() ? DEFAULT_LOOK_PRESET_MOBILE : DEFAULT_LOOK_PRESET);
syncLookSliders();

// ----------------------------
// State
// ----------------------------
const clock = new THREE.Clock();

const getInitialAvatarRuntimeState =
  avatarRuntimeUtils.getInitialAvatarRuntimeState ||
  function getInitialAvatarRuntimeStateFallback({ appState, defaults = {} } = {}) {
    const avatarRuntime = appState?.avatarRuntime || {};
    return {
      allFriendsies: avatarRuntime.allFriendsies ?? defaults.allFriendsies ?? null,
      currentLoadId:
        Number.isFinite(avatarRuntime.currentLoadId)
          ? avatarRuntime.currentLoadId
          : Number(defaults.currentLoadId || 0),
      loadedParts: Array.isArray(avatarRuntime.loadedParts)
        ? avatarRuntime.loadedParts
        : Array.isArray(defaults.loadedParts)
          ? defaults.loadedParts
          : [],
      loadedPartsMeta: Array.isArray(avatarRuntime.loadedPartsMeta)
        ? avatarRuntime.loadedPartsMeta
        : Array.isArray(defaults.loadedPartsMeta)
          ? defaults.loadedPartsMeta
          : [],
      lastTraits: avatarRuntime.lastTraits ?? defaults.lastTraits ?? null,
      bodyRoot: avatarRuntime.bodyRoot ?? defaults.bodyRoot ?? null,
      bodySkeleton: avatarRuntime.bodySkeleton ?? defaults.bodySkeleton ?? null,
      bodySkinned: avatarRuntime.bodySkinned ?? defaults.bodySkinned ?? null,
      mixer: avatarRuntime.mixer ?? defaults.mixer ?? null,
      currentAction: avatarRuntime.currentAction ?? defaults.currentAction ?? null,
      hipsRawName: avatarRuntime.hipsRawName ?? defaults.hipsRawName ?? null,
      restPosByBone:
        avatarRuntime.restPosByBone instanceof Map
          ? avatarRuntime.restPosByBone
          : defaults.restPosByBone instanceof Map
            ? defaults.restPosByBone
            : new Map(),
      faceOverlayMeshes: Array.isArray(avatarRuntime.faceOverlayMeshes)
        ? avatarRuntime.faceOverlayMeshes
        : Array.isArray(defaults.faceOverlayMeshes)
          ? defaults.faceOverlayMeshes
          : [],
      faceAnchor: avatarRuntime.faceAnchor ?? defaults.faceAnchor ?? null,
      lastFaceTexture: avatarRuntime.lastFaceTexture ?? defaults.lastFaceTexture ?? null
    };
  };

const updateAvatarRuntimeField =
  avatarRuntimeUtils.updateAvatarRuntimeField ||
  function updateAvatarRuntimeFieldFallback({ appState, key, value }) {
    if (appState?.avatarRuntime && key && key in appState.avatarRuntime) {
      appState.avatarRuntime[key] = value;
    }
    return value;
  };

function setAvatarRuntimeField(key, value) {
  return updateAvatarRuntimeField({ appState, key, value });
}

const initialAvatarRuntimeState = getInitialAvatarRuntimeState({
  appState,
  defaults: {
    allFriendsies: null,
    currentLoadId: 0,
    loadedParts: [],
    loadedPartsMeta: [],
    lastTraits: null,
    bodyRoot: null,
    bodySkeleton: null,
    bodySkinned: null,
    mixer: null,
    currentAction: null,
    hipsRawName: null,
    restPosByBone: new Map(),
    faceOverlayMeshes: [],
    faceAnchor: null,
    lastFaceTexture: null
  }
});

let allFriendsies = initialAvatarRuntimeState.allFriendsies;
let currentLoadId = initialAvatarRuntimeState.currentLoadId;

let loadedParts = initialAvatarRuntimeState.loadedParts;
let loadedPartsMeta = initialAvatarRuntimeState.loadedPartsMeta; // parallel array of { trait_type, value }
let lastTraits = initialAvatarRuntimeState.lastTraits;

let bodyRoot = initialAvatarRuntimeState.bodyRoot;
let bodySkeleton = initialAvatarRuntimeState.bodySkeleton;
let bodySkinned = initialAvatarRuntimeState.bodySkinned;

let mixer = initialAvatarRuntimeState.mixer;
let currentAction = initialAvatarRuntimeState.currentAction;

let hipsRawName = initialAvatarRuntimeState.hipsRawName;
let restPosByBone = initialAvatarRuntimeState.restPosByBone;

let faceOverlayMeshes = initialAvatarRuntimeState.faceOverlayMeshes;
let faceAnchor = initialAvatarRuntimeState.faceAnchor;
let lastFaceTexture = initialAvatarRuntimeState.lastFaceTexture;

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

// Wraps FBXLoader in the same { ok, gltf } shape loadGLB uses so playAnimUrl
// can call either function transparently.
function loadFBX(url) {
  if (!fbxLoader) return Promise.resolve({ ok: false, err: "FBXLoader unavailable" });
  return new Promise((resolve) => {
    fbxLoader.load(
      url,
      (fbx) => resolve({ ok: true, gltf: { animations: fbx.animations || [] } }),
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

const baseKey =
  rigUtils.baseKey ||
  ((name) => {
    let s = (name || "").toLowerCase();
    s = s.replace(/^armature[|:]/g, "");
    s = s.replace(/^mixamorig[:]?/g, "");
    s = s.replace(/\s+/g, "");
    s = s.replace(/[^a-z0-9]+/g, "");
    s = s.replace(/end$/g, "");
    return s;
  });

const aliasKey =
  rigUtils.aliasKey ||
  ((key) => {
    const normalized = String(key || "").toLowerCase();
    const spineKey = normalized.replace(/^spine0+(\d+)$/, "spine$1");
    if (spineKey === "pelvis" || spineKey === "hip") return "hips";
    return spineKey;
  });

const keyForName =
  rigUtils.keyForName ||
  ((name) => aliasKey(baseKey(name)));

const getBodyBoneByKey =
  rigUtils.getBoneByKey
    ? (key) => rigUtils.getBoneByKey(bodySkeleton, key)
    : ((key) => {
        if (!bodySkeleton) return null;
        const target = aliasKey(String(key || "").toLowerCase());
        return bodySkeleton.bones.find((b) => keyForName(b.name) === target) || null;
      });

function collectRigInfo() {
  hipsRawName = setAvatarRuntimeField("hipsRawName", null);
  restPosByBone = setAvatarRuntimeField("restPosByBone", new Map());
  if (!bodySkeleton) return;

  for (const b of bodySkeleton.bones) {
    if (!hipsRawName && keyForName(b.name) === "hips") hipsRawName = setAvatarRuntimeField("hipsRawName", b.name);
    restPosByBone.set(b.name, b.position.clone());
  }

  // Face anchor under BODY head bone
  if (faceAnchor?.parent) faceAnchor.parent.remove(faceAnchor);
  faceAnchor = setAvatarRuntimeField("faceAnchor", new THREE.Object3D());
  faceAnchor.name = "FACE_ANCHOR";

  const headBone = getBodyBoneByKey("head") || getBodyBoneByKey("neck");
  if (headBone) {
    headBone.add(faceAnchor);
  } else {
    avatarGroup.add(faceAnchor);
    logLine(
      "⚠️ No BODY head/neck bone found - FACE_ANCHOR attached to avatarGroup",
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
const buildBodyBoneMap =
  rigUtils.buildBoneMap
    ? () => rigUtils.buildBoneMap(bodySkeleton)
    : (() => {
        const map = new Map();
        for (const b of bodySkeleton?.bones || []) map.set(keyForName(b.name), b);
        return map;
      });

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

// ----------------------------
// Animation state machine with crossfade and auto-idle-cycling
// ----------------------------
class AnimController {
  constructor() {
    this._mixer     = null;
    this._active    = null;   // THREE.AnimationAction currently blending in
    this._clips     = {};     // name → { clip: THREE.AnimationClip, loop: boolean }
    this._urlMap    = {};     // url  → name (reverse lookup for playAnimUrl)
    this._idleNames = [];
    this._idleIdx   = 0;
    this._state     = "none"; // "none" | "idle" | "walk" | "emote"
    this._retToIdle = false;
    this._timer     = null;
    this._sceneTimer = null;
    this._sceneMode = false;
    this._lastSceneUrl = "";
    this._guard     = 0;      // increments on detach so stale preload callbacks abort
    this._onFinished = this._onFinished.bind(this);
  }

  /** Bind to a freshly created AnimationMixer. */
  attach(mixer) {
    this._guard++;
    this._mixer = mixer;
    this._active = null;
    this._state = "none";
    this._retToIdle = false;
    clearTimeout(this._timer);
    this._timer = null;
    clearTimeout(this._sceneTimer);
    this._sceneTimer = null;
    mixer.addEventListener("finished", this._onFinished);
  }

  /** Unbind before clearing a character. */
  detach() {
    this._guard++;
    clearTimeout(this._timer);
    this._timer = null;
    clearTimeout(this._sceneTimer);
    this._sceneTimer = null;
    this._sceneMode = false;
    if (this._mixer) this._mixer.removeEventListener("finished", this._onFinished);
    this._mixer = null;
    this._active = null;
    this._state = "none";
    this._retToIdle = false;
  }

  /**
   * Background-preload every clip in the library.
   * Safe to call multiple times; skips already-loaded names.
   */
  async preload(library) {
    const g = this._guard;
    for (const entry of library) {
      if (this._clips[entry.name]) continue;
      try {
        const res = await loadGLB(entry.url);
        if (g !== this._guard) return;
        if (!res.ok) continue;
        const anims = res.gltf.animations || [];
        if (!anims.length) continue;
        this._clips[entry.name] = { clip: sanitizeClip(anims[0]), loop: entry.loop };
        this._urlMap[entry.url]  = entry.name;
      } catch (_) { /* non-fatal */ }
    }
    this._idleNames = library
      .filter(e => e.category === "idle" && this._clips[e.name])
      .map(e => e.name);
  }

  _action(name) {
    const entry = this._clips[name];
    if (!entry || !this._mixer) return null;
    const a = this._mixer.clipAction(entry.clip);
    a.setLoop(entry.loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    a.clampWhenFinished = !entry.loop;
    return a;
  }

  _crossFade(newAction, fadeDur) {
    if (!newAction) return;
    const previous = this._active;
    newAction.enabled = true;
    newAction.reset();
    newAction.setEffectiveTimeScale(1);
    newAction.setEffectiveWeight(1);
    newAction.fadeIn(Math.max(0.05, fadeDur || 0.01));
    newAction.play();
    if (previous && previous !== newAction) {
      previous.crossFadeTo(newAction, Math.max(0.05, fadeDur || 0.01), true);
    }
    this._active = newAction;
    currentAction = setAvatarRuntimeField("currentAction", newAction);
  }

  /** Transition to idle, then schedule periodic random emotes. */
  goIdle(fadeDur = 0.6) {
    clearTimeout(this._timer);
    this._timer = null;
    this._state = "idle";
    this._retToIdle = false;
    if (this._idleNames.length) {
      const name = this._idleNames[this._idleIdx % this._idleNames.length];
      this._crossFade(this._action(name), fadeDur);
    }
    this._scheduleEmote();
  }

  setSceneMode(enabled, { playNext = null } = {}) {
    this._sceneMode = Boolean(enabled);
    clearTimeout(this._sceneTimer);
    this._sceneTimer = null;
    if (this._sceneMode && typeof playNext === "function") {
      this._queueSceneBeat(playNext, 900);
    }
  }

  _queueSceneBeat(playNext, delayMs = null) {
    clearTimeout(this._sceneTimer);
    if (!this._sceneMode || typeof playNext !== "function") return;
    const delay = delayMs ?? (7000 + Math.random() * 9000);
    this._sceneTimer = setTimeout(() => playNext(), delay);
  }

  noteSceneUrl(url) {
    this._lastSceneUrl = String(url || "");
  }

  get sceneMode() { return this._sceneMode; }
  get lastSceneUrl() { return this._lastSceneUrl; }

  _scheduleEmote() {
    clearTimeout(this._timer);
    const delay = 12000 + Math.random() * 16000; // 12–28 s
    this._timer = setTimeout(() => {
      if (this._state !== "idle") return;
      const emoteNames = Object.keys(this._clips).filter(n => !this._clips[n].loop);
      if (!emoteNames.length) { this._scheduleEmote(); return; }
      const pick = emoteNames[Math.floor(Math.random() * emoteNames.length)];
      this.playByName(pick, 0.4);
    }, delay);
  }

  /** Play a clip from the preloaded cache by name. */
  playByName(name, fadeDur = 0.4) {
    const entry = this._clips[name];
    if (!entry) return false;
    const action = this._action(name);
    if (!action) return false;
    this._crossFade(action, fadeDur);
    this._state = entry.loop ? "walk" : "emote";
    this._retToIdle = !entry.loop;
    if (!entry.loop) clearTimeout(this._timer);
    return true;
  }

  /** Play any THREE.AnimationClip directly (used by playAnimUrl for ad-hoc clips). */
  playRaw(clip, loop = false, fadeDur = 0.4) {
    if (!this._mixer) return;
    const action = this._mixer.clipAction(clip);
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    action.clampWhenFinished = !loop;
    this._crossFade(action, fadeDur);
    this._state = loop ? "walk" : "emote";
    this._retToIdle = !loop;
    if (!loop) clearTimeout(this._timer);
  }

  /** Look up whether a URL should loop (preload cache → library → FBX hints → false). */
  loopForUrl(url) {
    const name = this._urlMap[url];
    if (name && this._clips[name]) return this._clips[name].loop;
    const entry = ANIM_LIBRARY.find(e => e.url === url);
    if (entry) return entry.loop;
    return ANIM_LOOP_HINTS.get(url) ?? false;
  }

  _onFinished(event) {
    if (event.action === this._active && this._retToIdle) {
      this._retToIdle = false;
      this.goIdle(0.5);
    }
  }

  get state() { return this._state; }
}

const animCtrl = new AnimController();

// ---- face overlay ----
function clearFaceOverlay({
  protectedTextures = new Set(),
  disposeStats = null,
  disposedGeometries = new Set(),
  disposedMaterials = new Set(),
  disposedTextures = new Set()
} = {}) {
  for (const m of faceOverlayMeshes) {
    if (!m) continue;
    if (m.parent) m.parent.remove(m);
    disposeObjectTreeFromUtils(m, {
      preserveTextures: protectedTextures,
      disposedGeometries,
      disposedMaterials,
      disposedTextures,
      stats: disposeStats
    });
  }
  faceOverlayMeshes = setAvatarRuntimeField("faceOverlayMeshes", []);
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
const disposeObjectTreeFromUtils =
  avatarCleanupUtils.disposeObjectTree ||
  ((root) => {
    root?.traverse?.((node) => {
      if (!node) return;
      if ((node.isMesh || node.isLine || node.isPoints) && node.geometry) {
        node.geometry.dispose?.();
      }
      if ((node.isMesh || node.isLine || node.isPoints) && node.material) {
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        mats.forEach((mat) => mat?.dispose?.());
      }
    });
    return { nodes: 0, geometries: 0, materials: 0, textures: 0 };
  });

function getProtectedTextureSet() {
  const protectedTextures = new Set();

  if (scene?.environment?.isTexture) protectedTextures.add(scene.environment);
  if (scene?.background?.isTexture) protectedTextures.add(scene.background);

  return protectedTextures;
}

function clearAvatar() {
  const protectedTextures = getProtectedTextureSet();
  const disposeStats = { nodes: 0, geometries: 0, materials: 0, textures: 0 };
  const disposedGeometries = new Set();
  const disposedMaterials = new Set();
  const disposedTextures = new Set();

  clearFaceOverlay({ protectedTextures, disposeStats, disposedGeometries, disposedMaterials, disposedTextures });

  loadedParts.forEach((part) => {
    if (!part) return;
    if (part.parent) part.parent.remove(part);
    disposeObjectTreeFromUtils(part, {
      preserveTextures: protectedTextures,
      disposedGeometries,
      disposedMaterials,
      disposedTextures,
      stats: disposeStats
    });
  });
  loadedParts = setAvatarRuntimeField("loadedParts", []);
  loadedPartsMeta = setAvatarRuntimeField("loadedPartsMeta", []);

  if (lastFaceTexture && !protectedTextures.has(lastFaceTexture) && !disposedTextures.has(lastFaceTexture)) {
    lastFaceTexture.dispose?.();
    disposedTextures.add(lastFaceTexture);
    disposeStats.textures += 1;
  }
  lastFaceTexture = setAvatarRuntimeField("lastFaceTexture", null);

  animCtrl.detach();

  if (mixer) {
    mixer.stopAllAction();
    if (bodyRoot) mixer.uncacheRoot?.(bodyRoot);
  }

  bodyRoot = setAvatarRuntimeField("bodyRoot", null);
  bodySkeleton = setAvatarRuntimeField("bodySkeleton", null);
  bodySkinned = setAvatarRuntimeField("bodySkinned", null);

  mixer = setAvatarRuntimeField("mixer", null);
  currentAction = setAvatarRuntimeField("currentAction", null);

  hipsRawName = setAvatarRuntimeField("hipsRawName", null);
  restPosByBone = setAvatarRuntimeField("restPosByBone", new Map());
  lastTraits = setAvatarRuntimeField("lastTraits", null);

  if (faceAnchor?.parent) faceAnchor.parent.remove(faceAnchor);
  faceAnchor = setAvatarRuntimeField("faceAnchor", null);

  if (disposeStats.geometries || disposeStats.materials || disposeStats.textures) {
    logLine(
      `🧹 Avatar cleanup — geom:${disposeStats.geometries} mat:${disposeStats.materials} tex:${disposeStats.textures}`,
      "dim"
    );
  }
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
  let clickError = null;

  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    clickError = err;
  }

  return { url, clickError };
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
  baked.colorSpace = THREE.SRGBColorSpace;
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

    // Never remove bones here - we still need the skeleton for export.
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
const exportUtils = window.FrienemiesExportUtils || {};

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

if (exportUtils.parseGlb) parseGlb = exportUtils.parseGlb;
if (exportUtils.buildGlb) buildGlb = exportUtils.buildGlb;
if (exportUtils.deepEqualJson) deepEqualJson = exportUtils.deepEqualJson;
if (exportUtils.dedupeSamplers) dedupeSamplers = exportUtils.dedupeSamplers;
if (exportUtils.dedupeSkins) dedupeSkins = exportUtils.dedupeSkins;
if (exportUtils.bakeAndRemoveKHRTextureTransform_FlipYOnly) {
  bakeAndRemoveKHRTextureTransform_FlipYOnly = exportUtils.bakeAndRemoveKHRTextureTransform_FlipYOnly;
}
if (exportUtils.sanitizeMaterialsForWindows) {
  sanitizeMaterialsForWindows = exportUtils.sanitizeMaterialsForWindows;
}
if (exportUtils.optimizeGlbForWindows) optimizeGlbForWindows = exportUtils.optimizeGlbForWindows;

function downloadRigGlb() {
  if (!loadedParts?.length || !bodyRoot) {
    logLine("Nothing loaded yet — load a fRiENDSiES asset first.", "warn");
    return false;
  }
  if (!THREE?.GLTFExporter) {
    logLine("GLTFExporter missing (script tag not loaded).", "warn");
    return false;
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
  const id = Number(lastLoadedTokenId || 0);
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

  exportUiState.pending = true;
  setExportStatus(`Preparing ${filename}…`);
  logLine(`Exporting ${filename}…`, "dim");

  // (faceAnchor already detached only for cloning; it is not part of exportRoot)

  exportUiState.warningSuppressedCount = 0;
  const originalConsoleWarn = console.warn;
  const suppressedWarningNeedle = "THREE.GLTFExporter: Normal scale components are different";
  console.warn = function patchedExportWarn(...args) {
    const first = String(args?.[0] || "");
    if (first.includes(suppressedWarningNeedle)) {
      exportUiState.warningSuppressedCount += 1;
      return;
    }
    return originalConsoleWarn.apply(console, args);
  };

  exporter.parseAsync(exportRoot, {
    binary: true,
    onlyVisible: true,
    trs: true
  }).then((result) => {
    console.warn = originalConsoleWarn;
    exportUiState.pending = false;

    avatarGroup.scale.copy(oldScale);
    avatarGroup.position.copy(oldPos);
    avatarGroup.updateMatrixWorld(true);

    const glb = result instanceof ArrayBuffer ? result : null;
    if (!glb) {
      setExportStatus("Export failed before download. Open Console for details.", "warn");
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

    releaseLastExportBlobUrl();
    const blob = new Blob([outGlb], { type: "model/gltf-binary" });
    const { url, clickError } = downloadBlob(blob, filename);
    exportUiState.lastBlobUrl = url;
    exportUiState.lastFilename = filename;
    setExportFallbackLink(url, filename);

    if (clickError) {
      setExportStatus(
        "Download was blocked by browser. Use “Open saved export link” to save manually.",
        "warn"
      );
      logLine(`⚠️ Download click failed: ${clickError?.message || clickError}`, "warn");
    } else {
      setExportStatus("Download started. If no file appears, use “Open saved export link”.", "ok");
      logLine(`✅ Download started: ${filename}`);
    }

    if (exportUiState.warningSuppressedCount > 0) {
      logLine(
        `ℹ️ Export note: suppressed ${exportUiState.warningSuppressedCount} known GLTFExporter normalScale warnings (visual-only).`,
        "dim"
      );
      exportUiState.warningSuppressedCount = 0;
    }
  }).catch((err) => {
    console.warn = originalConsoleWarn;
    exportUiState.pending = false;

    // restore on error
    avatarGroup.scale.copy(oldScale);
    avatarGroup.position.copy(oldPos);
    avatarGroup.updateMatrixWorld(true);

    setExportStatus("Export failed before download. Open Console for details.", "warn");
    logLine(`Export error: ${err?.message || err}`, "warn");
  });

  return true;
}

// ----------------------------
// Anim presets
// ----------------------------
const _AC1 = "https://cdn.jsdelivr.net/gh/PIZZALORD713/animation_collection@main/";
const _AC2 = "https://cdn.jsdelivr.net/gh/PIZZALORD713/animation_collection2@main/";

let ANIM_PRESETS = [
  // ── GLB: animation_collection2 ──────────────────────────────────────────────
  ["Walk",                _AC2 + "walk.glb"],
  ["Walk Arms Low",       _AC2 + "walk-arms-low.glb"],
  ["Dance Rumba",         _AC2 + "dance-rumba.glb"],
  ["Joy Jump",            _AC2 + "joy-jump.glb"],
  // ── GLB: animation_collection ───────────────────────────────────────────────
  ["WalkStart",           _AC1 + "WalkStart.glb"],
  ["StartWalking",        _AC1 + "StartWalking.glb"],
  ["FrostCloud",          _AC1 + "FrostCloud_Mixamo.glb"],
  // ── FBX: animation_collection (garden actions) ──────────────────────────────
  ["Box Idle",            _AC1 + "box%20idle.fbx"],
  ["Box Turn",            _AC1 + "box%20turn.fbx"],
  ["Box Turn Alt",        _AC1 + "box%20turn%20%282%29.fbx"],
  ["Box Walk Arc",        _AC1 + "box%20walk%20arc.fbx"],
  ["Cow Milking",         _AC1 + "cow%20milking.fbx"],
  ["Dig & Plant Seeds",   _AC1 + "dig%20and%20plant%20seeds.fbx"],
  ["Holding Idle",        _AC1 + "holding%20idle.fbx"],
  ["Holding Turn Left",   _AC1 + "holding%20turn%20left.fbx"],
  ["Holding Turn Right",  _AC1 + "holding%20turn%20right.fbx"],
  ["Holding Walk",        _AC1 + "holding%20walk.fbx"],
  ["Kneeling Idle",       _AC1 + "kneeling%20idle.fbx"],
  ["Pick Fruit",          _AC1 + "pick%20fruit.fbx"],
  ["Pick Fruit Alt",      _AC1 + "pick%20fruit%20%282%29.fbx"],
  ["Pick Fruit Alt 2",    _AC1 + "pick%20fruit%20%283%29.fbx"],
  ["Plant A Plant",       _AC1 + "plant%20a%20plant.fbx"],
  ["Plant Tree",          _AC1 + "plant%20tree.fbx"],
  ["Pull Plant",          _AC1 + "pull%20plant.fbx"],
  ["Pull Plant Alt",      _AC1 + "pull%20plant%20%282%29.fbx"],
  ["Watering",            _AC1 + "watering.fbx"],
  ["Wheelbarrow Dump",    _AC1 + "wheelbarrow%20dump.fbx"],
  ["Wheelbarrow Idle",    _AC1 + "wheelbarrow%20idle.fbx"],
  ["Wheelbarrow Walk",    _AC1 + "wheelbarrow%20walk.fbx"],
  ["Wheelbarrow Walk Alt",_AC1 + "wheelbarrow%20walk%20%282%29.fbx"],
  ["Wheelbarrow Turn",    _AC1 + "wheelbarrow%20walk%20turn.fbx"],
  ["Wheelbarrow Turn Alt",_AC1 + "wheelbarrow%20walk%20turn%20%282%29.fbx"],
];

// Typed catalog used by AnimController for preloading and auto-cycle logic.
// walk.glb is used as the calm base loop (idle category) since no standalone idle clip exists.
// FBX files are not preloaded here — they're only in ANIM_PRESETS for manual selection.
const ANIM_LIBRARY = [
  { name: "Walk",          url: "https://cdn.jsdelivr.net/gh/PIZZALORD713/animation_collection2@main/walk.glb",          loop: true,  category: "idle"  },
  { name: "Walk Arms Low", url: "https://cdn.jsdelivr.net/gh/PIZZALORD713/animation_collection2@main/walk-arms-low.glb", loop: true,  category: "walk"  },
  { name: "WalkStart",     url: "https://cdn.jsdelivr.net/gh/PIZZALORD713/animation_collection@main/WalkStart.glb",      loop: false, category: "walk"  },
  { name: "StartWalking",  url: "https://cdn.jsdelivr.net/gh/PIZZALORD713/animation_collection@main/StartWalking.glb",   loop: false, category: "walk"  },
  { name: "Dance Rumba",   url: "https://cdn.jsdelivr.net/gh/PIZZALORD713/animation_collection2@main/dance-rumba.glb",   loop: false, category: "emote" },
  { name: "Joy Jump",      url: "https://cdn.jsdelivr.net/gh/PIZZALORD713/animation_collection2@main/joy-jump.glb",      loop: false, category: "emote" }
];

// Loop hints for FBX files that aren't in ANIM_LIBRARY (not preloaded).
// All absent URLs default to loop: false (one-shot).
const ANIM_LOOP_HINTS = new Map([
  [_AC1 + "box%20idle.fbx",                      true],
  [_AC1 + "box%20walk%20arc.fbx",                true],
  [_AC1 + "holding%20idle.fbx",                  true],
  [_AC1 + "holding%20walk.fbx",                  true],
  [_AC1 + "kneeling%20idle.fbx",                 true],
  [_AC1 + "wheelbarrow%20idle.fbx",              true],
  [_AC1 + "wheelbarrow%20walk.fbx",              true],
  [_AC1 + "wheelbarrow%20walk%20%282%29.fbx",    true],
]);

const ANIM_MANIFEST_URL =
  "https://cdn.jsdelivr.net/gh/PIZZALORD713/animation_collection2@main/animations.json";

const SESSION_ANIM_OBJECT_URLS = new Set();

function inferAnimationCategory(name = "", url = "") {
  const text = `${name} ${url}`.toLowerCase();
  if (/idle|stand|breath|wait|hold|kneel/.test(text)) return "idle";
  if (/walk|run|jog|locomotion|turn|strafe/.test(text)) return "move";
  if (/dance|jump|gesture|wave|pick|plant|water|dig|pull|dump|milk|action|attack|emote/.test(text)) return "emote";
  return "emote";
}

function getAnimationPresetMeta(url) {
  const libraryEntry = ANIM_LIBRARY.find((entry) => entry.url === url);
  const preset = ANIM_PRESETS.find(([, presetUrl]) => presetUrl === url);
  const name = libraryEntry?.name || preset?.[0] || "Animation";
  const loop = animCtrl?.loopForUrl?.(url) ?? /idle|walk|run|loop/i.test(name);
  const category = libraryEntry?.category || inferAnimationCategory(name, url);
  return { name, url, loop, category };
}

function chooseSceneAnimationUrl() {
  const candidates = ANIM_PRESETS
    .map(([, url]) => getAnimationPresetMeta(url))
    .filter((entry) => entry.url);
  if (!candidates.length) return "";

  const roll = Math.random();
  const preferredCategory = roll < 0.42 ? "idle" : roll < 0.72 ? "move" : "emote";
  let pool = candidates.filter((entry) => entry.category === preferredCategory);
  if (!pool.length) pool = candidates.filter((entry) => entry.loop === (preferredCategory !== "emote"));
  if (!pool.length) pool = candidates;

  const freshPool = pool.filter((entry) => entry.url !== animCtrl.lastSceneUrl);
  const pickPool = freshPool.length ? freshPool : pool;
  return pickPool[Math.floor(Math.random() * pickPool.length)]?.url || "";
}

function updateSceneModeUi() {
  const enabled = animCtrl.sceneMode;
  sceneModeBtn?.setAttribute("aria-pressed", enabled ? "true" : "false");
  sceneModeBtn?.classList.toggle("is-active", enabled);
  if (sceneModeBtn) sceneModeBtn.textContent = enabled ? "Scene mode on" : "Scene mode";
  if (animSceneHint) {
    animSceneHint.textContent = enabled
      ? "Scene mode is chaining animation beats with longer blends for a more natural preview."
      : "Scene mode chains idles, walks, and emotes so previews feel like an in-game moment.";
  }
}

async function playNextSceneBeat() {
  if (!animCtrl.sceneMode) return;
  const url = chooseSceneAnimationUrl();
  if (!url) return;
  animCtrl.noteSceneUrl(url);
  await playAnimUrl(url, currentLoadId, null, { fadeDur: 0.85, sceneBeat: true });
  const { loop, category } = getAnimationPresetMeta(url);
  const nextDelay = loop || category !== "emote" ? 8500 + Math.random() * 9000 : 3500 + Math.random() * 5000;
  animCtrl._queueSceneBeat(playNextSceneBeat, nextDelay);
}

window.addEventListener("beforeunload", () => {
  for (const objectUrl of SESSION_ANIM_OBJECT_URLS) URL.revokeObjectURL(objectUrl);
  SESSION_ANIM_OBJECT_URLS.clear();
});

function registerSessionAnimationFiles(files = []) {
  const added = [];
  for (const file of files) {
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["glb", "gltf", "fbx"].includes(ext)) continue;
    const objectUrl = URL.createObjectURL(file);
    SESSION_ANIM_OBJECT_URLS.add(objectUrl);
    const baseName = file.name.replace(/\.(glb|gltf|fbx)$/i, "").replace(/[_-]+/g, " ").trim() || file.name;
    const name = `Local • ${baseName}`;
    ANIM_PRESETS.push([name, objectUrl]);
    if (/idle|walk|run|loop|hold/i.test(baseName)) ANIM_LOOP_HINTS.set(objectUrl, true);
    added.push([name, objectUrl, ext]);
  }
  if (added.length) {
    populateOnboardingAnimSelect();
    if (controlAnimSelect) controlAnimSelect.value = added[0][1];
    if (onboardingAnimSelect) onboardingAnimSelect.value = added[0][1];
  }
  return added;
}

const animUtils = window.FrienemiesAnimUtils || {};
const animSelectUtils = window.FrienemiesAnimSelectUtils || {};
const normalizeAnimManifestItem =
  animUtils.normalizeAnimManifestItem ||
  function normalizeAnimManifestItemFallback(item) {
    if (Array.isArray(item) && item.length >= 2) {
      return [String(item[0]), String(item[1])];
    }
    if (item && typeof item === "object" && item.url) {
      const url = String(item.url);
      const fallbackName = url.split("/").pop()?.replace(/\.glb$/i, "") || "Animation";
      return [String(item.name || fallbackName), url];
    }
    return null;
  };

async function loadAnimationManifest() {
  try {
    const res = await fetch(ANIM_MANIFEST_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`manifest fetch failed (${res.status})`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("manifest must be an array");
    const parsed = data.map(normalizeAnimManifestItem).filter(Boolean);
    if (parsed.length) {
      // Merge: add manifest entries not already present by URL so all library clips stay available
      const knownUrls = new Set(ANIM_PRESETS.map(([, url]) => url));
      for (const item of parsed) {
        if (!knownUrls.has(item[1])) ANIM_PRESETS.push(item);
      }
      logLine(`Loaded animation manifest (${parsed.length} items)`, "dim");
    }
  } catch (err) {
    logLine(`Animation manifest unavailable, using fallback presets (${err?.message || err})`, "dim");
  }
}

const populateAnimationSelectWithPresets =
  animUtils.populateAnimationSelect ||
  function populateAnimationSelectWithPresetsFallback(selectEl, presets = []) {
    if (!selectEl) return;
    selectEl.innerHTML = "";
    presets.forEach(([name, url], idx) => {
      const opt = document.createElement("option");
      opt.value = url;
      opt.textContent = name;
      if (idx === 0) opt.selected = true;
      selectEl.appendChild(opt);
    });
  };

function populateAnimationSelect(selectEl) {
  populateAnimationSelectWithPresets(selectEl, ANIM_PRESETS);
}

const populateOnboardingAnimationSelects =
  animSelectUtils.populateOnboardingAnimationSelects ||
  function populateOnboardingAnimationSelectsFallback(
    onboardingSelectEl,
    controlSelectEl,
    populateFn,
    presets = []
  ) {
    if (typeof populateFn !== "function") return;
    populateFn(onboardingSelectEl, presets);
    populateFn(controlSelectEl, presets);
  };

function populateOnboardingAnimSelect() {
  populateOnboardingAnimationSelects(
    onboardingAnimSelect,
    controlAnimSelect,
    populateAnimationSelectWithPresets,
    ANIM_PRESETS
  );
}

const getSelectedAnimUrlFromInputs =
  animSelectUtils.getSelectedAnimUrl ||
  function getSelectedAnimUrlFromInputsFallback(controlSelectEl, onboardingSelectEl, presets = []) {
    return controlSelectEl?.value || onboardingSelectEl?.value || presets?.[0]?.[1] || "";
  };

function getSelectedAnimUrl() {
  return getSelectedAnimUrlFromInputs(controlAnimSelect, onboardingAnimSelect, ANIM_PRESETS);
}

const getAnimUrlByNameFromPresets =
  animUtils.getAnimUrlByName ||
  function getAnimUrlByNameFromPresetsFallback(name, presets = []) {
    const target = String(name || "").toLowerCase();
    const hit = presets.find(([animName]) => String(animName).toLowerCase() === target);
    return hit?.[1] || "";
  };

function getAnimUrlByName(name) {
  return getAnimUrlByNameFromPresets(name, ANIM_PRESETS);
}

const initMascotHookFromUtils =
  mascotUtils.initMascotHook ||
  function initMascotHookFromUtilsFallback({
    mascotToggle: mascotToggleEl,
    mascotSprite: mascotSpriteEl,
    mascotBody: mascotBodyEl,
    mascotPanel: mascotPanelEl,
    mascotConfig,
    getAnimUrlByName: getAnimUrlByNameFn,
    playAnimUrl: playAnimUrlFn,
    logLine: logLineFn
  } = {}) {
    if (mascotToggleEl) mascotToggleEl.textContent = mascotConfig?.mascotName || "Mascot";
    if (mascotSpriteEl) {
      mascotSpriteEl.src = mascotConfig?.mascotOpenSeaImage || "";
      mascotSpriteEl.loading = "lazy";
    }

    mascotToggleEl?.addEventListener("click", () => {
      const collapsed = mascotBodyEl?.classList.toggle("is-collapsed");
      mascotToggleEl.setAttribute("aria-expanded", collapsed ? "false" : "true");
    });

    mascotPanelEl?.addEventListener("click", async (event) => {
      const btn = event.target.closest("[data-mascot-emote]");
      if (!btn) return;
      const emoteName = btn.dataset.mascotEmote;
      const animUrl = getAnimUrlByNameFn?.(emoteName);
      if (!animUrl) {
        logLineFn?.(`Mascot emote missing in manifest: ${emoteName}`, "warn");
        return;
      }
      await playAnimUrlFn?.(animUrl);
    });
  };

function initMascotHook() {
  mascotPanel?.classList.toggle("is-disabled", !ENABLE_MASCOT_PANEL);
  mascotPanel?.setAttribute("aria-hidden", ENABLE_MASCOT_PANEL ? "false" : "true");
  if (!ENABLE_MASCOT_PANEL) return;

  initMascotHookFromUtils({
    mascotToggle,
    mascotSprite,
    mascotBody,
    mascotPanel,
    mascotConfig: MASCOT_CONFIG,
    getAnimUrlByName,
    playAnimUrl,
    logLine
  });
}

// ----------------------------
// Load + build character
// ----------------------------
const resolveFriendsieEntry =
  tokenUtils.resolveFriendsieEntry ||
  ((allFriendsiesSource, id) => {
    if (!allFriendsiesSource) return null;
    const tokenId = Number(id);
    if (!Number.isFinite(tokenId)) return null;
    return (
      allFriendsiesSource[tokenId] ||
      allFriendsiesSource[tokenId - 1] ||
      allFriendsiesSource.find?.((x) => Number(x?.token_id) === tokenId) ||
      allFriendsiesSource.find?.((x) => Number(x?.id) === tokenId) ||
      null
    );
  });

function getEntryById(id) {
  return resolveFriendsieEntry(allFriendsies, id);
}

async function loadFriendsies(id) {
  if (!allFriendsies) return;

  const loadId = setAvatarRuntimeField("currentLoadId", currentLoadId + 1);
  currentLoadId = loadId;

  // If a load fails, never leave the viewer blank. Always restore visibility.
  const restoreAvatarVisibility = () => {
    if (loadId === currentLoadId) avatarGroup.visible = true;
  };

  // IMPORTANT: don't clear the existing avatar until the new one is confirmed loadable.
  // Otherwise a transient load failure leaves the viewer empty (background only).
  setStatus(`loading #${id}…`);
  const entry = getEntryById(id);
  if (!entry) {
    restoreAvatarVisibility();
    return setStatus(`not found: #${id}`);
  }

  const traits = entry.attributes || [];
  lastTraits = setAvatarRuntimeField("lastTraits", traits);

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
        tex.colorSpace = THREE.SRGBColorSpace;
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

  // Validate the new body before clearing the existing avatar.
  const nextBodyRoot = bodyRes.gltf.scene;
  const nextBodySkinned = findFirstSkinnedMesh(nextBodyRoot);
  if (!nextBodySkinned?.skeleton) {
    restoreAvatarVisibility();
    return setStatus("body loaded but no skeleton ❌");
  }

  // Now it's safe to replace the avatar.
  clearAvatar();
  avatarGroup.visible = false;

  bodyRoot = setAvatarRuntimeField("bodyRoot", nextBodyRoot);
  loadedParts.push(bodyRoot);
  loadedPartsMeta.push({ trait_type: "Body", value: "body" });

  bodySkinned = setAvatarRuntimeField("bodySkinned", nextBodySkinned);
  bodySkeleton = setAvatarRuntimeField("bodySkeleton", bodySkinned.skeleton);
  collectRigInfo();

  avatarGroup.add(bodyRoot);
  avatarGroup.updateMatrixWorld(true);

  mixer = setAvatarRuntimeField("mixer", new THREE.AnimationMixer(bodyRoot));
  animCtrl.attach(mixer);

  // if body has built-in clip (idle), play it through the controller as a temporary placeholder
  const bodyClips = bodyRes.gltf.animations || [];
  if (bodyClips.length) {
    animCtrl.playRaw(sanitizeClip(bodyClips[0]), true, 0);
  }

  // (bodyRoot already tracked/added above)

  const headRes = results[1];
  const faceTexture = await faceTexturePromise;
  lastFaceTexture = setAvatarRuntimeField("lastFaceTexture", faceTexture);
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
  avatarGroup.visible = true;

  applyLookControls();

  setStatus(
    `loaded #${id} ✅ parts:${loadedParts.length} bones:${bodySkeleton.bones.length} faceOverlays:${faceOverlayMeshes.length}`
  );

  if (totalBound || totalMoved) {
    logLine(`🧩 Parts bound:${totalBound} rigid retargeted:${totalMoved}`);
  }

  // Auto-play selected animation after load
  await playAnimUrl(getSelectedAnimUrl(), loadId);

  // Preload all library clips in background; once ready, start idle-cycle if uninterrupted
  animCtrl.preload(ANIM_LIBRARY).then(() => {
    if (loadId !== currentLoadId) return;
    if (animCtrl.state === "none" || animCtrl.state === "idle") {
      animCtrl.goIdle(0.6);
    }
  });
}

function loadToken(tokenId) {
  loadFriendsies(tokenId);

  // Keep URL in sync when browsing tokens on a /fren/ route
  if (frenRouteActive && tokenId != null) {
    const id = Number(tokenId);
    if (Number.isFinite(id) && id >= FREN_TOKEN_MIN && id <= FREN_TOKEN_MAX) {
      const currentFren = parseFrenTokenFromUrl();
      if (currentFren !== id) {
        window.history.replaceState({ frenToken: id }, "", `/fren/${id}`);
      }
      updateFrenMeta(id);
    }
  }
}

// ----------------------------
// External animation
// ----------------------------
// hint: "fbx" | "glb" | null — overrides URL extension detection (used for local blob URLs)
async function playAnimUrl(url, loadIdGuard = currentLoadId, hint = null, options = {}) {
  if (!url) return setStatus("pick an animation");
  if (!mixer || !bodyRoot) return setStatus("load a fRiENDSiES asset first");

  setStatus("loading anim…");

  const isFbx = hint === "fbx" || (!hint && /\.fbx($|\?)/i.test(url));
  const res = await (isFbx ? loadFBX(url) : loadGLB(url));
  if (loadIdGuard !== currentLoadId) return;

  if (!res.ok) {
    logLine(`anim load failed ❌ ${url}`, "err");
    return setStatus("anim load failed ❌");
  }

  const clips = res.gltf.animations || [];
  if (!clips.length) return setStatus("anim has 0 clips ❌");

  const clip = sanitizeClip(clips[0]);
  const loop = animCtrl.loopForUrl(url);
  const fadeDur = Number.isFinite(options.fadeDur) ? options.fadeDur : 0.65;

  // Crossfade into the new clip; non-looping clips return to idle automatically
  animCtrl.playRaw(clip, loop, fadeDur);

  setStatus(`playing anim ✅ ${clip.name || "unnamed"}`);
  logLine(`${options.sceneBeat ? "🎬 Scene beat" : "▶ Playing"}: ${clip.name || "unnamed"} (${url})`);
}

// ----------------------------
// Shelf interaction state
// ----------------------------
const IDLE_TIMEOUT_MS = 10000;

const getInitialInteractionShellState =
  interactionShellUtils.getInitialInteractionShellState ||
  function getInitialInteractionShellStateFallback({ appState, defaults = {} } = {}) {
    const shell = appState?.interactionShell || {};
    return {
      shelfOpen:
        typeof shell.shelfOpen === "boolean" ? shell.shelfOpen : !!defaults.shelfOpen,
      searchExpanded:
        typeof shell.searchExpanded === "boolean" ? shell.searchExpanded : !!defaults.searchExpanded,
      idleTimer: shell.idleTimer ?? defaults.idleTimer ?? null,
      idleActive: typeof shell.idleActive === "boolean" ? shell.idleActive : !!defaults.idleActive,
      orbitReleaseTimer: shell.orbitReleaseTimer ?? defaults.orbitReleaseTimer ?? null,
      carouselHovered:
        typeof shell.carouselHovered === "boolean"
          ? shell.carouselHovered
          : !!defaults.carouselHovered,
      carouselScrolling:
        typeof shell.carouselScrolling === "boolean"
          ? shell.carouselScrolling
          : !!defaults.carouselScrolling
    };
  };

const updateInteractionShellFieldFromUtils =
  interactionShellUtils.updateInteractionShellField ||
  function updateInteractionShellFieldFallback({ key, value, appState }) {
    if (appState?.interactionShell && typeof key === "string" && key in appState.interactionShell) {
      appState.interactionShell[key] = value;
    }
    return value;
  };

function setInteractionShellField(key, value) {
  return updateInteractionShellFieldFromUtils({ key, value, appState });
}

const initialInteractionShellState = getInitialInteractionShellState({
  appState,
  defaults: {
    shelfOpen: false,
    searchExpanded: false,
    idleTimer: null,
    idleActive: false,
    orbitReleaseTimer: null,
    carouselHovered: false,
    carouselScrolling: false
  }
});

let shelfOpen = initialInteractionShellState.shelfOpen;
let searchExpanded = initialInteractionShellState.searchExpanded;
let idleTimer = initialInteractionShellState.idleTimer;
let idleActive = initialInteractionShellState.idleActive;
let orbitReleaseTimer = initialInteractionShellState.orbitReleaseTimer;
let carouselHovered = initialInteractionShellState.carouselHovered;
let carouselScrolling = initialInteractionShellState.carouselScrolling;

const getInitialCarouselQueryState =
  carouselQueryUtils.getInitialCarouselQueryState ||
  function getInitialCarouselQueryStateFallback({ appState, defaultTokenIds }) {
    const source = Array.isArray(appState?.carouselQuery?.carouselTokenIds)
      ? appState.carouselQuery.carouselTokenIds
      : defaultTokenIds;
    const normalizedTokenIds = Array.from(
      new Set(
        source
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id))
      )
    ).sort((a, b) => a - b);

    return {
      carouselTokenIds: normalizedTokenIds,
      carouselTokenIdSet: new Set(normalizedTokenIds),
      activeCarouselIndex: appState?.carouselQuery?.activeCarouselIndex ?? null,
      pendingTokenId: appState?.carouselQuery?.pendingTokenId ?? null,
      lastLoadedTokenId: appState?.carouselQuery?.lastLoadedTokenId ?? null,
      loadDebounceTimer: appState?.carouselQuery?.loadDebounceTimer ?? null,
      imageObserver: appState?.carouselQuery?.imageObserver ?? null,
      carouselListenersBound: appState?.carouselQuery?.carouselListenersBound ?? false,
      scrollRafPending: appState?.carouselQuery?.scrollRafPending ?? false,
      suppressScrollHandler: appState?.carouselQuery?.suppressScrollHandler ?? false
    };
  };

const updateCarouselTokenIdsStateFromUtils =
  carouselQueryUtils.updateCarouselTokenIdsState ||
  function updateCarouselTokenIdsStateFallback({ tokenIds, appState, fallbackTokenIds = [] }) {
    const source = Array.isArray(tokenIds) ? tokenIds : fallbackTokenIds;
    const unique = Array.from(new Set(source.map((id) => Number(id)).filter((id) => Number.isFinite(id))));
    unique.sort((a, b) => a - b);
    if (appState?.carouselQuery) {
      appState.carouselQuery.carouselTokenIds = unique;
      appState.carouselQuery.carouselTokenIdSet = new Set(unique);
    }
    return {
      carouselTokenIds: unique,
      carouselTokenIdSet: new Set(unique)
    };
  };

const updateCarouselQueryFieldFromUtils =
  carouselQueryUtils.updateCarouselQueryField ||
  function updateCarouselQueryFieldFallback({ key, value, appState }) {
    if (appState?.carouselQuery && typeof key === "string" && key in appState.carouselQuery) {
      appState.carouselQuery[key] = value;
    }
    return value;
  };

const initialCarouselQueryState = getInitialCarouselQueryState({
  appState,
  defaultTokenIds: DEFAULT_TOKEN_IDS
});

let carouselTokenIds = initialCarouselQueryState.carouselTokenIds;
let carouselTokenIdSet = initialCarouselQueryState.carouselTokenIdSet;
let activeCarouselIndex = initialCarouselQueryState.activeCarouselIndex;
let pendingTokenId = initialCarouselQueryState.pendingTokenId;
let lastLoadedTokenId = initialCarouselQueryState.lastLoadedTokenId;
let loadDebounceTimer = initialCarouselQueryState.loadDebounceTimer;
let imageObserver = initialCarouselQueryState.imageObserver;
let carouselListenersBound = initialCarouselQueryState.carouselListenersBound;
let scrollRafPending = initialCarouselQueryState.scrollRafPending;
let suppressScrollHandler = initialCarouselQueryState.suppressScrollHandler;

const getInitialDragPhysicsState =
  dragPhysicsUtils.getInitialDragPhysicsState ||
  function getInitialDragPhysicsStateFallback({ appState, defaults = {} }) {
    return {
      isDragging: appState?.dragPhysics?.isDragging ?? !!defaults.isDragging,
      wasDragging: appState?.dragPhysics?.wasDragging ?? !!defaults.wasDragging,
      dragStartX: appState?.dragPhysics?.dragStartX ?? Number(defaults.dragStartX || 0),
      dragStartScroll: appState?.dragPhysics?.dragStartScroll ?? Number(defaults.dragStartScroll || 0),
      dragVelocity: appState?.dragPhysics?.dragVelocity ?? Number(defaults.dragVelocity || 0),
      dragLastX: appState?.dragPhysics?.dragLastX ?? Number(defaults.dragLastX || 0),
      dragLastTime: appState?.dragPhysics?.dragLastTime ?? Number(defaults.dragLastTime || 0),
      momentumRaf: appState?.dragPhysics?.momentumRaf ?? (defaults.momentumRaf ?? null)
    };
  };

const updateDragPhysicsFieldFromUtils =
  dragPhysicsUtils.updateDragPhysicsField ||
  function updateDragPhysicsFieldFallback({ key, value, appState }) {
    if (appState?.dragPhysics && typeof key === "string" && key in appState.dragPhysics) {
      appState.dragPhysics[key] = value;
    }
    return value;
  };

function setDragPhysicsField(key, value) {
  return updateDragPhysicsFieldFromUtils({ key, value, appState });
}

/* ── Pointer-drag momentum state ── */
const initialDragPhysicsState = getInitialDragPhysicsState({
  appState,
  defaults: {
    isDragging: false,
    wasDragging: false,
    dragStartX: 0,
    dragStartScroll: 0,
    dragVelocity: 0,
    dragLastX: 0,
    dragLastTime: 0,
    momentumRaf: null
  }
});

let isDragging = initialDragPhysicsState.isDragging;
let wasDragging = initialDragPhysicsState.wasDragging;  // persists through the click event after drag ends
let dragStartX = initialDragPhysicsState.dragStartX;
let dragStartScroll = initialDragPhysicsState.dragStartScroll;
let dragVelocity = initialDragPhysicsState.dragVelocity;
let dragLastX = initialDragPhysicsState.dragLastX;
let dragLastTime = initialDragPhysicsState.dragLastTime;
let momentumRaf = initialDragPhysicsState.momentumRaf;
const DRAG_THRESHOLD = 6;       // px - below this, treat as click
const MOMENTUM_FRICTION = 0.94; // per-frame multiplier (lower = more friction)
const MOMENTUM_MIN_VEL = 0.5;   // px/frame - stop momentum below this

const PREVIEW_BASE_URL =
  "https://storage.googleapis.com/friendsies-rendered-97557c";
const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><rect width='100%25' height='100%25' fill='%23f2f1fb'/></svg>";
const RENDER_BUFFER = 10;
const SNAP_BUFFER = 5;

// ---------------------
// Carousel geometry helpers
// ---------------------
const carouselUtils = window.FrienemiesCarouselUtils || {};

const getCardMetrics =
  carouselUtils.getCardMetrics ||
  function getCardMetricsFallback() {
    const style = getComputedStyle(document.documentElement);
    const cardWidth = parseFloat(style.getPropertyValue("--card-width")) || 120;
    const cardGap = parseFloat(style.getPropertyValue("--card-gap")) || 14;
    return { cardWidth, cardGap, step: cardWidth + cardGap };
  };

const getViewportMetrics =
  carouselUtils.getViewportMetrics ||
  function getViewportMetricsFallback(viewport, step) {
    const vpWidth = viewport?.clientWidth || 0;
    const visibleCount = Math.max(1, Math.floor(vpWidth / (step || 1)));
    return { vpWidth, visibleCount };
  };

const indexToScrollLeftByMetrics =
  carouselUtils.indexToScrollLeft ||
  function indexToScrollLeftByMetricsFallback(index, metrics) {
    const { vpWidth = 0, step = 1, cardWidth = 0 } = metrics || {};
    const edgePad = Math.max(0, (vpWidth - cardWidth) / 2);
    return edgePad + index * step + cardWidth / 2 - vpWidth / 2;
  };

const scrollLeftToIndexByMetrics =
  carouselUtils.scrollLeftToIndex ||
  function scrollLeftToIndexByMetricsFallback(scrollLeft, metrics) {
    const { vpWidth = 0, step = 1, cardWidth = 0, totalCount = 0 } = metrics || {};
    if (!totalCount) return 0;
    const edgePad = Math.max(0, (vpWidth - cardWidth) / 2);
    const centerPixel = scrollLeft + vpWidth / 2;
    const index = Math.round((centerPixel - edgePad - cardWidth / 2) / step);
    return Math.max(0, Math.min(totalCount - 1, index));
  };

const getSpacerWidths =
  carouselUtils.getSpacerWidths ||
  function getSpacerWidthsFallback(params) {
    const {
      renderStart = 0,
      renderEnd = 0,
      totalCount = 0,
      vpWidth = 0,
      step = 1,
      cardWidth = 0
    } = params || {};

    const edgePad = Math.max(0, (vpWidth - cardWidth) / 2);
    const leftWidth = edgePad + renderStart * step;
    const rightTokens = totalCount - renderEnd;
    const rightWidth = rightTokens * step + edgePad;

    return {
      leftWidth: Math.max(0, leftWidth),
      rightWidth: Math.max(0, rightWidth)
    };
  };

function indexToScrollLeft(index) {
  const { step, cardWidth } = getCardMetrics();
  const { vpWidth } = getViewportMetrics(ui.carouselViewport, step);
  return indexToScrollLeftByMetrics(index, { step, cardWidth, vpWidth });
}

function scrollLeftToIndex(scrollLeft) {
  const { step, cardWidth } = getCardMetrics();
  const { vpWidth } = getViewportMetrics(ui.carouselViewport, step);
  return scrollLeftToIndexByMetrics(scrollLeft, {
    step,
    cardWidth,
    vpWidth,
    totalCount: carouselTokenIds.length
  });
}

function updateSpacerWidths(renderStart, renderEnd) {
  const { step, cardWidth } = getCardMetrics();
  const { vpWidth } = getViewportMetrics(ui.carouselViewport, step);
  const widths = getSpacerWidths({
    renderStart,
    renderEnd,
    totalCount: carouselTokenIds.length,
    vpWidth,
    step,
    cardWidth
  });

  if (ui.spacerLeft) ui.spacerLeft.style.width = `${widths.leftWidth}px`;
  if (ui.spacerRight) ui.spacerRight.style.width = `${widths.rightWidth}px`;
}

function onCarouselScroll() {
  if (suppressScrollHandler) return;
  carouselScrolling = setInteractionShellField("carouselScrolling", true);
  if (scrollRafPending) return;
  scrollRafPending = updateCarouselQueryFieldFromUtils({
    key: "scrollRafPending",
    value: true,
    appState
  });

  requestAnimationFrame(() => {
    scrollRafPending = updateCarouselQueryFieldFromUtils({
      key: "scrollRafPending",
      value: false,
      appState
    });
    if (!ui.carouselViewport || !ui.slides) return;

    const scrollLeft = ui.carouselViewport.scrollLeft;
    const centerIndex = scrollLeftToIndex(scrollLeft);

    const renderStart = Number(ui.slides.dataset.renderStart || 0);
    const renderEnd = Number(ui.slides.dataset.renderEnd || 0);

    // Re-window if approaching edge of rendered range
    const nearLeft = centerIndex - renderStart < SNAP_BUFFER;
    const nearRight = renderEnd - 1 - centerIndex < SNAP_BUFFER;
    const canExpandLeft = renderStart > 0;
    const canExpandRight = renderEnd < carouselTokenIds.length;

    if ((nearLeft && canExpandLeft) || (nearRight && canExpandRight)) {
      renderCarouselRange(centerIndex);
    }

    // Update active card highlight only - don't trigger 3D model load during scrolling.
    // The actual load happens on scrollend (or fallback timer).
    setActiveCarouselIndex(centerIndex, { loadToken: false });
  });
}

/* ── Shelf open/close ─────────────────────────────────────── */
function setShelfOpen(open) {
  shelfOpen = setInteractionShellField("shelfOpen", !!open);
  if (!ui.shelf) return;
  ui.shelf.classList.toggle("is-closed", !shelfOpen);
  ui.shelf.setAttribute("aria-expanded", String(shelfOpen));
}

/* ── View switching (gear radial) ─────────────────────────── */
function setActiveView(viewName) {
  if (!SHELF_VIEWS.includes(viewName)) return;
  activeView = updateActiveViewStateFromUtils({ view: viewName, appState });
  document.querySelectorAll(".shelfView").forEach((el) => {
    el.classList.toggle("is-active", el.dataset.view === activeView);
  });
  document.querySelectorAll(".radialItem").forEach((el) => {
    el.classList.toggle("is-active", el.dataset.view === activeView);
  });
  if (activeView !== "grid") setSearchExpanded(false);
  setRadialOpen(false);
}

function setRadialOpen(open) {
  radialOpen = updateRadialOpenStateFromUtils({ open, appState });
  if (!ui.shelfRadial) return;
  ui.shelfRadial.classList.toggle("is-open", radialOpen);
  ui.shelfRadial.setAttribute("aria-hidden", String(!radialOpen));
  ui.shelfGear?.classList.toggle("is-active", radialOpen);
  ui.shelfGear?.setAttribute("aria-expanded", String(radialOpen));
}

/* ── Grid search ──────────────────────────────────────────── */
function setSearchExpanded(expanded) {
  searchExpanded = setInteractionShellField("searchExpanded", !!expanded);
  if (!ui.shelfSearchWrap) return;
  ui.shelfSearchWrap.classList.toggle("is-expanded", searchExpanded);
  if (searchExpanded) {
    ui.shelfSearchInput?.focus();
  } else {
    if (ui.shelfSearchInput) ui.shelfSearchInput.value = "";
    ui.shelfSearchInput?.blur();
  }
}

function scheduleIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setInteractionShellField("idleTimer", setTimeout(() => {
    idleActive = setInteractionShellField("idleActive", true);
  }, IDLE_TIMEOUT_MS));
}

function handleUserActivity() {
  if (idleActive) {
    idleActive = setInteractionShellField("idleActive", false);
  }
  scheduleIdleTimer();
}

function showOnboarding(force = false) {
  if (!onboardingEl) return;
  const seen = localStorage.getItem(ONBOARDING_SEEN_KEY) === "1";
  if (!force && seen) return;
  onboardingEl.classList.add("is-open");
  onboardingEl.setAttribute("aria-hidden", "false");

  if (ui.shelfSearchInput?.value && onboardingInput && !onboardingInput.value) {
    onboardingInput.value = ui.shelfSearchInput.value;
  }
}

function submitPrimarySearch(raw) {
  const value = normalizeSearchInput(raw);
  if (!value) return false;

  if (ui.shelfSearchInput && ui.shelfSearchInput.value !== value) ui.shelfSearchInput.value = value;
  if (onboardingInput && onboardingInput.value !== value) onboardingInput.value = value;

  handleSearch(value);
  return true;
}

function submitOnboardingInput() {
  if (!onboardingInput) return false;
  const raw = normalizeSearchInput(onboardingInput.value);
  return submitPrimarySearch(raw);
}

function hideOnboarding(markSeen = true) {
  if (!onboardingEl) return;
  onboardingEl.classList.remove("is-open");
  onboardingEl.setAttribute("aria-hidden", "true");
  if (markSeen) localStorage.setItem(ONBOARDING_SEEN_KEY, "1");
}

function updateResetCollectionVisibility() {
  updateResetCollectionVisibilityFromUtils(
    resetCollectionBtn,
    carouselTokenIds,
    DEFAULT_TOKEN_IDS
  );
}

function renderSearchMessage(message, options = {}) {
  renderSearchMessageFromUtils(searchResults, message, options);
}

function resetToFullCollection() {
  setCarouselTokenIds(DEFAULT_TOKEN_IDS);
  initCarousel(DEFAULT_TOKEN_ID);
  frenRouteActive = false;
  updateFrenMeta(null);
  window.history.pushState({}, "", buildCollectionPath());
  logLine("🔄 Reset to full collection");
  updateResetCollectionVisibility();
}

async function navigateToWallet(owner) {
  renderSearchMessage("Looking up tokens…", {
    tone: "loading",
    hint: "Checking this wallet address or ENS name now."
  });
  try {
    const walletData = await fetchWalletTokenIds(owner);
    if (!walletData.tokenIds.length) {
      renderSearchMessage("No fRiENDSiES tokens found for this wallet address or ENS name yet.", {
        tone: "warn",
        showReset: true,
        hint: "Try another wallet/ENS or jump to a token ID like 8448."
      });
      return;
    }
    frenRouteActive = false;
    updateFrenMeta(null);
    setCarouselTokenIds(walletData.tokenIds);
    initCarousel(walletData.tokenIds[0]);
    if (searchResults) searchResults.innerHTML = "";
    const slug = walletData.ownerInput || owner;
    window.history.pushState({}, "", buildOwnerPath(slug));
    setRadialOpen(false);
    logLine(`🔍 Search: loaded ${walletData.tokenIds.length} tokens for ${slug}`);
  } catch (err) {
    renderSearchMessage(`Lookup failed: ${err?.message || "please try again"}`, {
      tone: "warn",
      showReset: true,
      hint: "Try again in a few seconds, or use a token ID directly."
    });
  } finally {
    updateResetCollectionVisibility();
  }
}

async function handleSearch(query) {
  if (searchResults) searchResults.innerHTML = "";

  const asNum = parseTokenIdInput(query, { min: 1, max: 10000 });
  if (asNum !== null) {
    const index = carouselTokenIds.indexOf(asNum);
    if (index >= 0) {
      scrollToCarouselIndex(index);
      setActiveCarouselIndex(index);
    } else {
      // Token not in current carousel set (e.g. wallet filter active)
      const isFiltered = carouselTokenIds.length < DEFAULT_TOKEN_IDS.length;
      if (isFiltered) {
        renderSearchMessage(`Token #${asNum} is not in this wallet filter. Showing full collection.`, {
          tone: "info",
          showReset: true,
          hint: "You can still load it from the full 1-10000 set."
        });
      }
      resetToFullCollection();
      const fullIndex = carouselTokenIds.indexOf(asNum);
      if (fullIndex >= 0) {
        scrollToCarouselIndex(fullIndex);
        setActiveCarouselIndex(fullIndex);
      } else {
        lastLoadedTokenId = updateCarouselQueryFieldFromUtils({
          key: "lastLoadedTokenId",
          value: asNum,
          appState
        });
        loadToken(asNum);
      }
    }
    setRadialOpen(false);
    return;
  }

  if (isEnsName(query)) {
    await navigateToWallet(query);
    return;
  }

  if (isHexAddress(query)) {
    await navigateToWallet(query);
    return;
  }

  renderSearchMessage("Enter a valid token ID, wallet address, or ENS name.", {
    tone: "warn",
    showReset: true,
    hint: "Examples: 8448, 0xabc...123, or pizzalord.eth"
  });
}

function debounceTokenLoad(tokenId, { force = false } = {}) {
  pendingTokenId = updateCarouselQueryFieldFromUtils({
    key: "pendingTokenId",
    value: tokenId,
    appState
  });
  if (loadDebounceTimer) clearTimeout(loadDebounceTimer);
  loadDebounceTimer = updateCarouselQueryFieldFromUtils({
    key: "loadDebounceTimer",
    value: setTimeout(() => {
      loadDebounceTimer = updateCarouselQueryFieldFromUtils({
        key: "loadDebounceTimer",
        value: null,
        appState
      });
      if (!allFriendsies) return;
      const id = pendingTokenId;
      pendingTokenId = updateCarouselQueryFieldFromUtils({
        key: "pendingTokenId",
        value: null,
        appState
      });
      if (shouldSkipQueuedTokenLoad({ id, tokenIdSet: carouselTokenIdSet, lastLoadedTokenId, force })) return;

      lastLoadedTokenId = updateCarouselQueryFieldFromUtils({
        key: "lastLoadedTokenId",
        value: id,
        appState
      });
      loadToken(id);
    }, 150),
    appState
  });
}

function requestTokenLoad(tokenId, { force = false } = {}) {
  const id = normalizeRequestedTokenId(tokenId);
  if (!canRequestTokenLoad(carouselTokenIdSet, id)) return;
  pendingTokenId = updateCarouselQueryFieldFromUtils({
    key: "pendingTokenId",
    value: id,
    appState
  });
  if (!allFriendsies) return;
  debounceTokenLoad(id, { force });
}

const buildPreviewUrl =
  tokenUtils.buildPreviewUrl ||
  ((baseUrl, tokenId) => `${String(baseUrl || "").replace(/\/$/, "")}/${tokenId}/friendsie.jpg`);
const hydrateImageFromDataset =
  imageLoadUtils.hydrateImageFromDataset ||
  ((img, { markLoaded = true, clearDataset = true } = {}) => {
    if (!img) return false;
    const src = img.dataset?.src;
    if (!src) return false;
    img.src = src;
    if (markLoaded && img.dataset) img.dataset.loaded = "true";
    if (clearDataset) img.removeAttribute("data-src");
    return true;
  });
const createTokenImageObserver =
  imageLoadUtils.createTokenImageObserver ||
  (({ existingObserver = null, canObserve = true, root = null, rootMargin = "60px" } = {}) => {
    if (existingObserver || !canObserve || !("IntersectionObserver" in window)) {
      return existingObserver || null;
    }
    return new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          hydrateImageFromDataset(entry.target);
          observer?.unobserve(entry.target);
        });
      },
      { root, rootMargin }
    );
  });
const observeImageWithFallback =
  imageLoadUtils.observeTokenImage ||
  (({ img, observer }) => {
    if (!img) return false;
    if (!observer) return hydrateImageFromDataset(img, { markLoaded: false, clearDataset: false });
    observer.observe(img);
    return true;
  });

function getPreviewUrl(tokenId) {
  return buildPreviewUrl(PREVIEW_BASE_URL, tokenId);
}

function ensureImageObserver() {
  imageObserver = updateCarouselQueryFieldFromUtils({
    key: "imageObserver",
    value: createTokenImageObserver({
      existingObserver: imageObserver,
      canObserve: "IntersectionObserver" in window,
      root: ui.carouselViewport || null,
      rootMargin: "60px"
    }),
    appState
  });
}

function observeTokenImage(img) {
  if (!img) return;
  ensureImageObserver();
  observeImageWithFallback({ img, observer: imageObserver });
}

function createTokenSlide(id, index) {
  const li = document.createElement("li");
  li.className = "tokenSlide";
  li.dataset.index = String(index);
  li.dataset.tokenId = String(id);

  const card = document.createElement("button");
  card.type = "button";
  card.className = "tokenCard";
  card.setAttribute("aria-label", `Load token ${id}`);

  const imageWrap = document.createElement("div");
  imageWrap.className = "tokenImageWrap is-loading";

  const image = document.createElement("img");
  image.className = "tokenImage";
  image.alt = `Friendsies #${id} preview`;
  image.loading = "lazy";
  image.draggable = false; // prevent native image drag interfering with carousel fling
  image.dataset.src = getPreviewUrl(id);
  image.src = FALLBACK_IMAGE;

  image.addEventListener("load", () => {
    if (image.dataset.src) return;
    imageWrap.classList.add("is-loaded");
    imageWrap.classList.remove("is-loading");
  });

  image.addEventListener("error", () => {
    imageWrap.classList.add("is-error", "is-loaded");
    imageWrap.classList.remove("is-loading");
    image.src = FALLBACK_IMAGE;
  });

  const fallback = document.createElement("span");
  fallback.className = "tokenImageFallback";
  fallback.textContent = "Preview";

  imageWrap.appendChild(image);
  imageWrap.appendChild(fallback);

  const label = document.createElement("span");
  label.className = "tokenLabel";
  label.textContent = `#${id}`;

  card.appendChild(imageWrap);
  card.appendChild(label);
  li.appendChild(card);

  return li;
}

function renderCarouselRange(centerIndex) {
  if (!ui.slides) return;
  if (!carouselTokenIds.length) return;

  centerIndex = Math.max(0, Math.min(carouselTokenIds.length - 1, centerIndex));

  const renderStart = Math.max(0, centerIndex - RENDER_BUFFER);
  const renderEnd = Math.min(
    carouselTokenIds.length,
    centerIndex + RENDER_BUFFER + 1
  );

  const currentStart = Number(ui.slides.dataset.renderStart || -1);
  const currentEnd = Number(ui.slides.dataset.renderEnd || -1);

  if (renderStart === currentStart && renderEnd === currentEnd) return;

  // Check if ranges overlap - if so, do an incremental update to preserve
  // already-loaded images and avoid flicker.
  const hasOverlap =
    currentEnd > 0 &&
    renderStart < currentEnd &&
    renderEnd > currentStart;

  if (hasOverlap) {
    // Remove slides that fell off the front (indices < renderStart)
    while (ui.slides.firstChild) {
      const idx = Number(ui.slides.firstChild.dataset?.index);
      if (!Number.isFinite(idx) || idx >= renderStart) break;
      ui.slides.removeChild(ui.slides.firstChild);
    }

    // Remove slides that fell off the back (indices >= renderEnd)
    while (ui.slides.lastChild) {
      const idx = Number(ui.slides.lastChild.dataset?.index);
      if (!Number.isFinite(idx) || idx < renderEnd) break;
      ui.slides.removeChild(ui.slides.lastChild);
    }

    // Prepend new slides at the front
    const firstRendered = ui.slides.firstChild
      ? Number(ui.slides.firstChild.dataset?.index)
      : renderEnd;
    for (let i = firstRendered - 1; i >= renderStart; i--) {
      const slide = createTokenSlide(carouselTokenIds[i], i);
      ui.slides.insertBefore(slide, ui.slides.firstChild);
      const img = slide.querySelector(".tokenImage");
      if (img) observeTokenImage(img);
    }

    // Append new slides at the back
    const lastRendered = ui.slides.lastChild
      ? Number(ui.slides.lastChild.dataset?.index) + 1
      : renderStart;
    for (let i = lastRendered; i < renderEnd; i++) {
      const slide = createTokenSlide(carouselTokenIds[i], i);
      ui.slides.appendChild(slide);
      const img = slide.querySelector(".tokenImage");
      if (img) observeTokenImage(img);
    }
  } else {
    // No overlap - full rebuild (initial load, search jump, etc.)
    ui.slides.innerHTML = "";

    const fragment = document.createDocumentFragment();
    for (let i = renderStart; i < renderEnd; i++) {
      fragment.appendChild(createTokenSlide(carouselTokenIds[i], i));
    }

    ui.slides.appendChild(fragment);
    ui.slides.querySelectorAll(".tokenImage").forEach((img) => observeTokenImage(img));
  }

  ui.slides.dataset.renderStart = String(renderStart);
  ui.slides.dataset.renderEnd = String(renderEnd);

  // Update spacer widths to maintain correct total scroll width
  updateSpacerWidths(renderStart, renderEnd);

  setActiveCarouselIndex(centerIndex, { loadToken: false });
}

/* ── Pointer-drag with momentum (desktop fling) ── */
function stopMomentum() {
  if (momentumRaf) {
    cancelAnimationFrame(momentumRaf);
    momentumRaf = setDragPhysicsField("momentumRaf", null);
  }
}

function applyMomentum() {
  const vp = ui.carouselViewport;
  if (!vp || Math.abs(dragVelocity) < MOMENTUM_MIN_VEL) {
    stopMomentum();
    // Re-enable snap so browser settles to nearest card
    vp.style.scrollSnapType = "";
    /* shelf stays open until cloud tap */
    return;
  }
  vp.scrollLeft -= dragVelocity;
  dragVelocity = setDragPhysicsField("dragVelocity", dragVelocity * MOMENTUM_FRICTION);
  momentumRaf = setDragPhysicsField("momentumRaf", requestAnimationFrame(applyMomentum));
}

function onDragStart(e) {
  // Skip touch - mobile already has native momentum scrolling
  if (e.pointerType === "touch") return;
  // Only primary button (left click)
  if (e.button && e.button !== 0) return;
  const vp = ui.carouselViewport;
  if (!vp) return;

  // Prevent browser default drag/selection so the gesture stays with our handler
  e.preventDefault();

  stopMomentum();
  isDragging = setDragPhysicsField("isDragging", false); // hasn't moved past threshold yet
  dragStartX = setDragPhysicsField("dragStartX", e.clientX);
  dragStartScroll = setDragPhysicsField("dragStartScroll", vp.scrollLeft);
  dragLastX = setDragPhysicsField("dragLastX", e.clientX);
  dragLastTime = setDragPhysicsField("dragLastTime", performance.now());
  dragVelocity = setDragPhysicsField("dragVelocity", 0);

  // Disable snap during drag so it doesn't fight the user
  vp.style.scrollSnapType = "none";
  vp.style.cursor = "grabbing";
  vp.setPointerCapture(e.pointerId);
}

function onDragMove(e) {
  const vp = ui.carouselViewport;
  if (!vp || !vp.hasPointerCapture(e.pointerId)) return;

  const dx = e.clientX - dragStartX;

  // Once past threshold, commit to dragging (prevents accidental drags on click)
  if (!isDragging && Math.abs(dx) > DRAG_THRESHOLD) {
    isDragging = setDragPhysicsField("isDragging", true);
  }

  if (!isDragging) return;

  // Suppress any residual browser handling once committed to drag
  e.preventDefault();

  // Track velocity from recent movement
  const now = performance.now();
  const dt = now - dragLastTime;
  if (dt > 0) {
    // Exponential smoothing of velocity for stable fling
    const instantVel = (e.clientX - dragLastX) / dt * 16; // px per ~frame
    dragVelocity = setDragPhysicsField("dragVelocity", 0.7 * instantVel + 0.3 * dragVelocity);
  }
  dragLastX = setDragPhysicsField("dragLastX", e.clientX);
  dragLastTime = setDragPhysicsField("dragLastTime", now);

  // Move scroll position opposite to drag direction
  vp.scrollLeft = dragStartScroll - dx;
}

function onDragEnd(e) {
  const vp = ui.carouselViewport;
  if (!vp) return;
  vp.style.cursor = "";

  if (!vp.hasPointerCapture(e.pointerId)) return;
  vp.releasePointerCapture(e.pointerId);

  wasDragging = setDragPhysicsField("wasDragging", isDragging);

  if (isDragging) {
    // Fling: apply momentum if velocity is high enough
    if (Math.abs(dragVelocity) > MOMENTUM_MIN_VEL) {
      momentumRaf = setDragPhysicsField("momentumRaf", requestAnimationFrame(applyMomentum));
    } else {
      // Low velocity - just re-enable snap to settle
      vp.style.scrollSnapType = "";
    }
  } else {
    // Was a click, not a drag - re-enable snap and select the clicked card.
    // Pointer capture prevents the normal click event from reaching the slides,
    // so we handle click-to-select here instead.
    vp.style.scrollSnapType = "";
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const slide = target?.closest?.(".tokenSlide");
    if (slide && ui.slides.contains(slide)) {
      const index = Number(slide.dataset.index || 0);
      if (!Number.isNaN(index)) {
        scrollToCarouselIndex(index);
      }
    }
  }

  isDragging = setDragPhysicsField("isDragging", false);
  /* shelf stays open until cloud tap */

  // Clear wasDragging after the click event has had a chance to check it
  requestAnimationFrame(() => {
    wasDragging = setDragPhysicsField("wasDragging", false);
  });
}

function bindCarouselListeners() {
  if (carouselListenersBound) return;

  // Click-to-select: smooth-scroll to center the clicked card (only if not dragging)
  ui.slides.addEventListener("click", (event) => {
    // If this click was the end of a drag gesture, ignore it
    if (wasDragging || isDragging) return;

    const carouselAction = event.target.closest("[data-carousel-action]");
    if (carouselAction?.dataset.carouselAction === "reset-collection") {
      event.preventDefault();
      resetToFullCollection();
      return;
    }

    const slide = event.target.closest(".tokenSlide");
    if (!slide || !ui.slides.contains(slide)) return;
    const index = Number(slide.dataset.index || 0);
    if (Number.isNaN(index)) return;
    scrollToCarouselIndex(index);
  });

  // Block native drag-and-drop on the carousel so pointer-drag owns the gesture
  ui.carouselViewport.addEventListener("dragstart", (e) => e.preventDefault());

  // Pointer-drag with momentum (desktop fling scrolling)
  ui.carouselViewport.addEventListener("pointerdown", (e) => {
    /* shelf stays open until cloud tap */
    onDragStart(e);
  });
  ui.carouselViewport.addEventListener("pointermove", onDragMove);
  ui.carouselViewport.addEventListener("pointerup", onDragEnd);
  ui.carouselViewport.addEventListener("pointercancel", onDragEnd);

  // Scroll-driven virtual rendering
  ui.carouselViewport.addEventListener("scroll", onCarouselScroll, { passive: true });

  // When scrolling settles, ensure we snap to the nearest card and load its 3D model.
  // We use forceLoad: true because onCarouselScroll may have already set the
  // activeCarouselIndex (visual highlight) without triggering a model load.
  const onScrollSettle = () => {
    if (suppressScrollHandler) return;
    carouselScrolling = setInteractionShellField("carouselScrolling", false);
    const scrollLeft = ui.carouselViewport.scrollLeft;
    const centerIndex = scrollLeftToIndex(scrollLeft);
    setActiveCarouselIndex(centerIndex, { forceLoad: true });
    /* shelf stays open until cloud tap */
  };

  if ("onscrollend" in window) {
    ui.carouselViewport.addEventListener("scrollend", onScrollSettle, { passive: true });
  } else {
    // Fallback for browsers without scrollend: use a timer-based settle detection
    let scrollSettleTimer = null;
    ui.carouselViewport.addEventListener("scroll", () => {
      if (scrollSettleTimer) clearTimeout(scrollSettleTimer);
      scrollSettleTimer = setTimeout(onScrollSettle, 200);
    }, { passive: true });
  }

  carouselListenersBound = updateCarouselQueryFieldFromUtils({
    key: "carouselListenersBound",
    value: true,
    appState
  });
}

function setActiveCarouselIndex(index, { loadToken: shouldLoad = true, forceLoad = false } = {}) {
  if (!Number.isFinite(index) || !ui.slides) return;

  const indexChanged = activeCarouselIndex !== index;

  // Update visual highlight if the index changed
  if (indexChanged) {
    const prev = ui.slides.querySelector(`[data-index=\"${activeCarouselIndex}\"]`);
    if (prev) prev.classList.remove("is-active");
    const next = ui.slides.querySelector(`[data-index=\"${index}\"]`);
    if (next) next.classList.add("is-active");
    activeCarouselIndex = updateCarouselQueryFieldFromUtils({
      key: "activeCarouselIndex",
      value: index,
      appState
    });
  }

  // Trigger 3D model load:
  // - Always load if forceLoad (scrollend settle - ensures model loads even
  //   when the visual index was already set by the last scroll frame)
  // - Load if the index changed AND shouldLoad is true (normal navigation)
  // - Skip if shouldLoad is false (rapid scroll frames - visual only)
  const tokenId = carouselTokenIds[index];
  if (tokenId && (forceLoad || (indexChanged && shouldLoad))) {
    requestTokenLoad(tokenId, { force: forceLoad });
  }
}

function scrollToCarouselIndex(index) {
  if (!ui.carouselViewport) return;
  const n = carouselTokenIds.length;
  if (!n) return;
  index = Math.max(0, Math.min(n - 1, index));
  stopMomentum();

  // Ensure target slides are rendered
  suppressScrollHandler = updateCarouselQueryFieldFromUtils({
    key: "suppressScrollHandler",
    value: true,
    appState
  });
  renderCarouselRange(index);

  const targetLeft = indexToScrollLeft(index);
  const currentLeft = ui.carouselViewport.scrollLeft;
  const { step } = getCardMetrics();
  const distance = Math.abs(targetLeft - currentLeft);

  // Temporarily disable snap so the programmatic scroll isn't fought by the browser
  ui.carouselViewport.style.scrollSnapType = "none";

  const restoreSnap = () => {
    ui.carouselViewport.style.scrollSnapType = "";
    suppressScrollHandler = updateCarouselQueryFieldFromUtils({
      key: "suppressScrollHandler",
      value: false,
      appState
    });
  };

  if (distance > 20 * step) {
    // Large jump: instant
    ui.carouselViewport.scrollLeft = targetLeft;
    restoreSnap();
  } else if (distance < 1) {
    // Already there
    restoreSnap();
  } else {
    // Small jump: smooth scroll, restore snap when done
    ui.carouselViewport.scrollTo({ left: targetLeft, behavior: "smooth" });

    // Use scrollend if supported, else fall back to timeout
    if ("onscrollend" in window) {
      ui.carouselViewport.addEventListener("scrollend", function onEnd() {
        ui.carouselViewport.removeEventListener("scrollend", onEnd);
        restoreSnap();
      }, { once: true });
    } else {
      setTimeout(restoreSnap, 400);
    }
  }

  // Force-load the model: this is an intentional navigation (click, search, etc.)
  setActiveCarouselIndex(index, { forceLoad: true });
}

function setCarouselTokenIds(tokenIds) {
  const nextTokenState = updateCarouselTokenIdsStateFromUtils({
    tokenIds,
    appState,
    fallbackTokenIds: DEFAULT_TOKEN_IDS
  });
  carouselTokenIds = nextTokenState.carouselTokenIds;
  carouselTokenIdSet = nextTokenState.carouselTokenIdSet;
  updateResetCollectionVisibility();
}

function initCarousel(startTokenId = DEFAULT_TOKEN_ID) {
  if (!ui.slides || !ui.carouselViewport) return;
  ui.slides.innerHTML = "";
  ui.slides.dataset.renderStart = "-1";
  ui.slides.dataset.renderEnd = "-1";
  activeCarouselIndex = updateCarouselQueryFieldFromUtils({
    key: "activeCarouselIndex",
    value: null,
    appState
  });

  if (carouselTokenIds.length === 0) {
    const li = document.createElement("li");
    li.className = "tokenSlide tokenSlide--empty";
    li.dataset.index = "0";
    ui.slides.dataset.renderStart = "0";
    ui.slides.dataset.renderEnd = "0";

    const card = document.createElement("div");
    card.className = "tokenCard tokenCard--empty";

    const title = document.createElement("p");
    title.className = "tokenEmptyTitle";
    title.textContent = "No tokens in this filter";

    const hint = document.createElement("p");
    hint.className = "tokenEmptyHint";
    hint.textContent = "Try another wallet/ENS or return to the full collection.";

    const action = document.createElement("button");
    action.type = "button";
    action.className = "tokenEmptyAction";
    action.dataset.carouselAction = "reset-collection";
    action.textContent = "View full collection";

    card.appendChild(title);
    card.appendChild(hint);
    card.appendChild(action);
    li.appendChild(card);
    ui.slides.appendChild(li);
    updateSpacerWidths(0, 0);
  }

  let startIndex = 0;
  if (carouselTokenIds.length) {
    const preferredId = Number(startTokenId);
    const preferredIndex = Number.isFinite(preferredId)
      ? carouselTokenIds.indexOf(preferredId)
      : -1;
    startIndex =
      preferredIndex >= 0
        ? preferredIndex
        : Math.min(Math.max(DEFAULT_TOKEN_ID - 1, 0), carouselTokenIds.length - 1);
  }

  bindCarouselListeners();

  if (carouselTokenIds.length) {
    // Suppress scroll handler during initial positioning
    suppressScrollHandler = updateCarouselQueryFieldFromUtils({
      key: "suppressScrollHandler",
      value: true,
      appState
    });
    renderCarouselRange(startIndex);

    requestAnimationFrame(() => {
      // Set initial scroll position (instant, no smooth)
      ui.carouselViewport.scrollLeft = indexToScrollLeft(startIndex);
      suppressScrollHandler = updateCarouselQueryFieldFromUtils({
        key: "suppressScrollHandler",
        value: false,
        appState
      });
      setActiveCarouselIndex(startIndex, { loadToken: true });
    });
  }

  /* shelf stays open until cloud tap */
}

/* ── Shelf event handlers ───────────────────────────────── */
ui.shelfCloud?.addEventListener("click", () => setShelfOpen(!shelfOpen));

ui.shelfGear?.addEventListener("click", () => setRadialOpen(!radialOpen));

document.querySelectorAll(".radialItem").forEach((btn) => {
  btn.addEventListener("click", () => {
    const view = btn.dataset.view;
    if (view) setActiveView(view);
  });
});

ui.shelfSearchBtn?.addEventListener("click", () => setSearchExpanded(!searchExpanded));

ui.shelfSearchInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitPrimarySearch(ui.shelfSearchInput.value);
  if (e.key === "Escape") setSearchExpanded(false);
});

document.querySelectorAll("[data-control-preset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const name = btn.dataset.controlPreset;
    if (!name) return;
    applyLookPreset(name);
  });
});

controlPlayAnimBtn?.addEventListener("click", async () => {
  animCtrl.setSceneMode(false);
  updateSceneModeUi();
  await playAnimUrl(getSelectedAnimUrl());
});

sceneModeBtn?.addEventListener("click", async () => {
  const enabled = !animCtrl.sceneMode;
  animCtrl.setSceneMode(enabled, { playNext: playNextSceneBeat });
  updateSceneModeUi();
  if (enabled) {
    setStatus("scene mode: watching the character act naturally 🎬");
    await playNextSceneBeat();
  } else {
    setStatus("scene mode off");
  }
});

controlAnimSelect?.addEventListener("change", async () => {
  if (onboardingAnimSelect) onboardingAnimSelect.value = controlAnimSelect.value;
  animCtrl.setSceneMode(false);
  updateSceneModeUi();
  if (!mixer || !bodyRoot) return;
  await playAnimUrl(getSelectedAnimUrl());
});

// ── Custom URL import ─────────────────────────────────────────────────────────
animLoadUrlBtn?.addEventListener("click", async () => {
  const url = animCustomUrl?.value?.trim();
  if (!url) return setStatus("enter a URL first");
  animCtrl.setSceneMode(false);
  updateSceneModeUi();
  await playAnimUrl(url);
});

animCustomUrl?.addEventListener("keydown", async (e) => {
  if (e.key !== "Enter") return;
  const url = animCustomUrl.value.trim();
  if (url) {
    animCtrl.setSceneMode(false);
    updateSceneModeUi();
    await playAnimUrl(url);
  }
});

// ── Local file import ─────────────────────────────────────────────────────────
animFileInput?.addEventListener("change", async () => {
  const files = Array.from(animFileInput.files || []);
  if (!files.length) return;
  const added = registerSessionAnimationFiles(files);
  if (!added.length) {
    animFileInput.value = "";
    return setStatus("no supported animation files selected");
  }
  animCtrl.setSceneMode(false);
  updateSceneModeUi();
  setStatus(`added ${added.length} local animation${added.length === 1 ? "" : "s"} ✅`);
  const firstUrl = added[0][1];
  const ext = added[0]?.[2];
  await playAnimUrl(firstUrl, currentLoadId, ext === "fbx" ? "fbx" : "glb");
  animFileInput.value = "";
});

openConsoleModalBtn?.addEventListener("click", () => {
  consoleModal?.classList.add("is-open");
  consoleModal?.setAttribute("aria-hidden", "false");
  renderConsoleViewer();
});
closeConsoleBtn?.addEventListener("click", () => {
  consoleModal?.classList.remove("is-open");
  consoleModal?.setAttribute("aria-hidden", "true");
});
copyConsoleBtn?.addEventListener("click", async () => {
  const payload = logBuffer.join("\n");
  if (!payload) return;
  await navigator.clipboard.writeText(payload);
});
clearConsoleBtn?.addEventListener("click", () => {
  clearLog();
});
consoleModal?.addEventListener("click", (event) => {
  if (event.target === consoleModal) {
    consoleModal.classList.remove("is-open");
    consoleModal.setAttribute("aria-hidden", "true");
  }
});

copyConsoleModalBtn?.addEventListener("click", async () => {
  const payload = logBuffer.join("\n");
  if (!payload) return;
  await navigator.clipboard.writeText(payload);
});

clearConsoleModalBtn?.addEventListener("click", () => {
  clearLog();
});

resetCollectionBtn?.addEventListener("click", () => {
  resetToFullCollection();
});

searchResults?.addEventListener("click", (event) => {
  const action = event.target.closest("[data-search-action]");
  if (action?.dataset.searchAction !== "reset-collection") return;
  resetToFullCollection();
  searchResults.innerHTML = "";
});

copyLinkBtn?.addEventListener("click", () => {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    if (!copyLinkBtn) return;
    copyLinkBtn.textContent = "Share link copied.";
    setTimeout(() => {
      if (copyLinkBtn) copyLinkBtn.textContent = "Copy link";
    }, 1500);
  });
});

downloadGlbBtn?.addEventListener("click", () => {
  if (exportUiState.pending) {
    setExportStatus("Export is already running…", "warn");
    return;
  }

  const started = downloadRigGlb();
  if (!started) {
    setExportStatus("Export did not start. Open Console for details.", "warn");
    return;
  }

});

// "Enter Studio" — submits input if filled, otherwise just dismisses
onboardingAnimSelect?.addEventListener("change", async () => {
  if (controlAnimSelect) controlAnimSelect.value = onboardingAnimSelect.value;
  animCtrl.setSceneMode(false);
  updateSceneModeUi();
  if (!mixer || !bodyRoot) return;
  await playAnimUrl(getSelectedAnimUrl());
});

onboardingEnterBtn?.addEventListener("click", () => {
  submitOnboardingInput();
  hideOnboarding(true);
});

// "Try a Demo" — loads pizzalord.eth
onboardingDemoBtn?.addEventListener("click", () => {
  hideOnboarding(true);
  submitPrimarySearch("pizzalord.eth");
});

// "Skip for now" — simple dismiss
onboardingSkipBtn?.addEventListener("click", () => {
  hideOnboarding(true);
});

showOnboardingBtn?.addEventListener("click", () => {
  showOnboarding(true);
});

// Enter key on onboarding input submits
onboardingInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  const hadInput = submitOnboardingInput();
  if (hadInput) hideOnboarding(true);
});

// Escape dismisses onboarding guide if it is open.
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!onboardingEl?.classList.contains("is-open")) return;
  hideOnboarding(true);
});

window.addEventListener("pointerdown", (event) => {
  const target = event.target;
  if (radialOpen && !ui.shelfGear?.contains(target) && !ui.shelfRadial?.contains(target)) {
    setRadialOpen(false);
  }
});

["pointerdown", "touchstart", "keydown", "wheel"].forEach((evt) => {
  window.addEventListener(evt, handleUserActivity, { passive: true });
});

window.addEventListener("error", (event) => {
  logLine(`ERROR: ${event.message} @ ${event.filename || "unknown"}:${event.lineno || 0}`, "warn");
});

window.addEventListener("unhandledrejection", (event) => {
  logLine(`PROMISE REJECTION: ${event.reason?.message || event.reason || "unknown"}`, "warn");
});


// ----------------------------
// Dynamic SEO / OG meta helpers
// ----------------------------
function updateFrenMeta(tokenId) {
  if (tokenId != null) {
    document.title = `fRiENEMiES #${tokenId}`;
    setMetaTag("og:title", `fRiENEMiES #${tokenId}`);
    setMetaTag("og:image", `https://storage.googleapis.com/friendsies-rendered-97557c/${tokenId}/friendsie.jpg`);
    setMetaTag("og:url", `${window.location.origin}/fren/${tokenId}`);
    setMetaTag("og:description", `View fRiENEMiES token #${tokenId} in the studio.`);
    setMetaTag("og:type", "website");
  } else {
    document.title = "fRiENEMiES Studio \u2014 View \u2022 Animate \u2022 Export";
    removeMetaTag("og:title");
    removeMetaTag("og:image");
    removeMetaTag("og:url");
    removeMetaTag("og:description");
    removeMetaTag("og:type");
  }
}

function setMetaTag(property, content) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function removeMetaTag(property) {
  const el = document.querySelector(`meta[property="${property}"]`);
  if (el) el.remove();
}

// ----------------------------
// /fren/ route navigation (client-side, no full reload)
// ----------------------------
function navigateToFrenToken(tokenId, { replace = false } = {}) {
  const id = Number(tokenId);
  if (!Number.isFinite(id) || id < FREN_TOKEN_MIN || id > FREN_TOKEN_MAX) {
    logLine(`⚠️ Invalid fren token: ${tokenId}, falling back to #${FREN_DEFAULT_TOKEN_ID}`, "warn");
    navigateToFrenToken(FREN_DEFAULT_TOKEN_ID, { replace: true });
    return;
  }

  frenRouteActive = true;
  const path = `/fren/${id}`;
  if (replace) {
    window.history.replaceState({ frenToken: id }, "", path);
  } else {
    window.history.pushState({ frenToken: id }, "", path);
  }
  updateFrenMeta(id);

  // Ensure full collection carousel is available
  if (carouselTokenIds.length < DEFAULT_TOKEN_IDS.length) {
    setCarouselTokenIds(DEFAULT_TOKEN_IDS);
    initCarousel(id);
  }

  // Scroll carousel to this token and load
  const index = carouselTokenIds.indexOf(id);
  if (index >= 0) {
    scrollToCarouselIndex(index);
    setActiveCarouselIndex(index, { forceLoad: true });
  } else {
    // Token in range but not in carousel (shouldn't happen with full collection)
    lastLoadedTokenId = updateCarouselQueryFieldFromUtils({
      key: "lastLoadedTokenId",
      value: id,
      appState
    });
    loadToken(id);
  }
}

function handleFrenTokenFromMetadata(frenTokenId) {
  // Called after metadata loads when a /fren/ deep-link was detected.
  // frenTokenId is already validated to be in [1..10000].
  const entry = getEntryById(frenTokenId);
  if (!entry) {
    logLine(`⚠️ Token #${frenTokenId} not found in metadata, falling back to #${FREN_DEFAULT_TOKEN_ID}`, "warn");
    setStatus(`token #${frenTokenId} not found`);
    navigateToFrenToken(FREN_DEFAULT_TOKEN_ID, { replace: true });
    return;
  }
  // Load the token via existing pipeline
  const index = carouselTokenIds.indexOf(frenTokenId);
  if (index >= 0) {
    scrollToCarouselIndex(index);
    setActiveCarouselIndex(index, { forceLoad: true });
  } else {
    lastLoadedTokenId = updateCarouselQueryFieldFromUtils({
      key: "lastLoadedTokenId",
      value: frenTokenId,
      appState
    });
    loadToken(frenTokenId);
  }
}

// popstate: handle back/forward between /fren/ routes
window.addEventListener("popstate", (event) => {
  const pathname = window.location.pathname;

  // Check if navigating to a /fren/ route
  const frenToken = parseFrenTokenFromUrl(pathname);
  if (frenToken != null) {
    frenRouteActive = true;
    updateFrenMeta(frenToken);
    if (allFriendsies) {
      handleFrenTokenFromMetadata(frenToken);
    } else {
      pendingTokenId = updateCarouselQueryFieldFromUtils({
        key: "pendingTokenId",
        value: frenToken,
        appState
      });
    }
    return;
  }

  // Check for raw out-of-range fren route
  if (isFrenRoute(pathname)) {
    frenRouteActive = true;
    const raw = parseFrenTokenFromUrlRaw(pathname);
    logLine(`⚠️ Invalid fren token: ${raw}, falling back to #${FREN_DEFAULT_TOKEN_ID}`, "warn");
    navigateToFrenToken(FREN_DEFAULT_TOKEN_ID, { replace: true });
    return;
  }

  // Non-fren route (e.g. back to /)
  frenRouteActive = false;
  updateFrenMeta(null);

  // Check for wallet/ENS owner
  const owner = getWalletOwnerFromUrl();
  if (owner) {
    navigateToWallet(owner);
    return;
  }

  // Default: show full collection
  setCarouselTokenIds(DEFAULT_TOKEN_IDS);
  initCarousel(DEFAULT_TOKEN_ID);
});

// ----------------------------
// Boot sequence
// ----------------------------
(async function boot() {
  const frenTokenValid = parseFrenTokenFromUrl();
  const frenTokenRaw = parseFrenTokenFromUrlRaw();
  const ownerFromUrl = !isFrenRoute() ? getWalletOwnerFromUrl() : null;
  let carouselStartTokenId = DEFAULT_TOKEN_ID;

  if (frenTokenValid != null) {
    // /fren/<valid_token> deep-link
    frenRouteActive = true;
    carouselStartTokenId = frenTokenValid;
    updateFrenMeta(frenTokenValid);
    setCarouselTokenIds(DEFAULT_TOKEN_IDS);
    logLine(`🔗 Fren deep-link: #${frenTokenValid}`, "dim");
  } else if (isFrenRoute() && frenTokenRaw != null) {
    // /fren/<invalid_token> (out of range)
    frenRouteActive = true;
    logLine(`⚠️ Invalid fren token: ${frenTokenRaw}, falling back to #${FREN_DEFAULT_TOKEN_ID}`, "warn");
    carouselStartTokenId = FREN_DEFAULT_TOKEN_ID;
    updateFrenMeta(FREN_DEFAULT_TOKEN_ID);
    window.history.replaceState({ frenToken: FREN_DEFAULT_TOKEN_ID }, "", `/fren/${FREN_DEFAULT_TOKEN_ID}`);
    setCarouselTokenIds(DEFAULT_TOKEN_IDS);
  } else if (isFrenRoute()) {
    // /fren/ with non-numeric or missing token
    frenRouteActive = true;
    logLine(`⚠️ Invalid fren route, falling back to #${FREN_DEFAULT_TOKEN_ID}`, "warn");
    carouselStartTokenId = FREN_DEFAULT_TOKEN_ID;
    updateFrenMeta(FREN_DEFAULT_TOKEN_ID);
    window.history.replaceState({ frenToken: FREN_DEFAULT_TOKEN_ID }, "", `/fren/${FREN_DEFAULT_TOKEN_ID}`);
    setCarouselTokenIds(DEFAULT_TOKEN_IDS);
  } else if (ownerFromUrl) {
    setStatus("fetching wallet tokens…");
    try {
      const walletData = await fetchWalletTokenIds(ownerFromUrl);
      if (walletData.tokenIds.length) {
        setCarouselTokenIds(walletData.tokenIds);
        carouselStartTokenId = walletData.tokenIds[0];
        logLine(
          `🧾 Wallet filter: ${walletData.ownerInput} (${walletData.ownerResolved || "unresolved"})`,
          "dim"
        );
        logLine(`🎟 Tokens found: ${walletData.tokenIds.length}`, "dim");
      } else {
        setCarouselTokenIds([]);
        logLine(`⚠️ No tokens found for ${walletData.ownerInput}`, "warn");
      }
    } catch (err) {
      setCarouselTokenIds(DEFAULT_TOKEN_IDS);
      logLine(`⚠️ Wallet lookup failed: ${err?.message || err}`, "warn");
    }
  } else {
    setCarouselTokenIds(DEFAULT_TOKEN_IDS);
  }

  await loadAnimationManifest();
  populateOnboardingAnimSelect();
  initMascotHook();
  setActiveView("grid");
  setShelfOpen(false);
  initCarousel(carouselStartTokenId);
  scheduleIdleTimer();
  // Skip onboarding when landing on a /fren/ deep-link
  if (!frenRouteActive) {
    showOnboarding(false);
  } else {
    hideOnboarding(true);
  }

  validateLookConfig(LOOK_CONTROLS, "LOOK_CONTROLS", { isDev: IS_DEV, logLine });
  validateLookConfig(
    LOOK_PRESETS[DEFAULT_LOOK_PRESET],
    `Preset: ${DEFAULT_LOOK_PRESET}`,
    { isDev: IS_DEV, logLine }
  );
  setStatus("fetching metadata…");

  fetch(METADATA_URL)
    .then((r) => r.json())
    .then((data) => {
      allFriendsies = setAvatarRuntimeField("allFriendsies", data);
      setStatus("ready ✅");

      if (frenRouteActive && frenTokenValid) {
        // /fren/ deep-link: validate token exists in metadata and load
        handleFrenTokenFromMetadata(frenTokenValid);
      } else if (frenRouteActive) {
        // Invalid fren route already fell back to FREN_DEFAULT_TOKEN_ID
        handleFrenTokenFromMetadata(FREN_DEFAULT_TOKEN_ID);
      } else if (pendingTokenId) {
        debounceTokenLoad(pendingTokenId);
      } else {
        // Load whatever token the carousel was initialized to (wallet deep-link uses first owned).
        const startId = carouselTokenIds?.[activeCarouselIndex] || carouselStartTokenId || DEFAULT_TOKEN_ID;
        requestTokenLoad(startId, { force: true });
      }
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
  controls.enabled = true;
  controls.autoRotate = false;
  if (controls.enabled) controls.update();

  if (MOBILE_CAMERA_FOLLOW_LIGHTS) {
    // Keep lights aimed at the orbit target and positioned relative to camera.
    // This reduces the "bright → pitch black" flip as you rotate on mobile.
    const t = controls.target;

    keyLight.target.position.copy(t);
    rim.target.position.copy(t);

    keyLight.position.copy(camera.position).add(tmpV3.set(-1.2, 1.4, 1.6));
    rim.position.copy(camera.position).add(tmpV3.set(1.8, 0.6, -2.2));
  }

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

  // Recalculate carousel spacers and re-center on active card
  if (activeCarouselIndex != null && carouselTokenIds.length && ui.slides) {
    const renderStart = Number(ui.slides.dataset.renderStart || 0);
    const renderEnd = Number(ui.slides.dataset.renderEnd || 0);
    updateSpacerWidths(renderStart, renderEnd);
    suppressScrollHandler = updateCarouselQueryFieldFromUtils({
      key: "suppressScrollHandler",
      value: true,
      appState
    });
    ui.carouselViewport.scrollLeft = indexToScrollLeft(activeCarouselIndex);
    suppressScrollHandler = updateCarouselQueryFieldFromUtils({
      key: "suppressScrollHandler",
      value: false,
      appState
    });
  }
});



