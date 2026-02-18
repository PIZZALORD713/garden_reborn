(() => {
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

  function normalizeLookControls(controls) {
    if (!controls) return;

    for (const [legacyKey, canonicalKey] of Object.entries(LEGACY_LOOK_KEY_MAP)) {
      if (legacyKey in controls) {
        if (controls[canonicalKey] === undefined) {
          controls[canonicalKey] = controls[legacyKey];
        }
        delete controls[legacyKey];
      }
    }

    if (controls.keyLightIntensity === undefined) {
      controls.keyLightIntensity = 0.75;
    }
    if (controls.rimLightIntensity === undefined) {
      controls.rimLightIntensity = 0.35;
    }
    if (controls.envIntensityMultiplier === undefined) {
      controls.envIntensityMultiplier = 1.0;
    }
    if (controls.emissiveIntensityMultiplier === undefined) {
      controls.emissiveIntensityMultiplier = 1.0;
    }
  }

  function getCanonicalLookSnapshot(controls) {
    if (!controls) return {};
    normalizeLookControls(controls);
    const snapshot = {};
    for (const key of LOOK_ALLOWED_KEYS) {
      if (key in controls) {
        snapshot[key] = controls[key];
      }
    }
    return snapshot;
  }

  function validateLookConfig(config, label, options = {}) {
    const isDev = options.isDev ?? false;
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
    if (typeof options.logLine === "function") {
      options.logLine(warning, "warn");
    }
  }

  window.FrienemiesLookUtils = {
    LOOK_ALLOWED_KEYS,
    LEGACY_LOOK_KEY_MAP,
    resolveToneMapping,
    normalizeLookControls,
    getCanonicalLookSnapshot,
    validateLookConfig
  };
})();
