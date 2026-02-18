(function initFrienemiesAvatarRuntimeUtils(globalScope) {
  function getInitialAvatarRuntimeState(options = {}) {
    const appState = options.appState || null;
    const defaults = options.defaults || {};
    const avatarRuntime = appState && appState.avatarRuntime ? appState.avatarRuntime : {};

    const defaultRestPosByBone =
      defaults.restPosByBone instanceof Map ? defaults.restPosByBone : new Map();

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
          : defaultRestPosByBone,
      faceOverlayMeshes: Array.isArray(avatarRuntime.faceOverlayMeshes)
        ? avatarRuntime.faceOverlayMeshes
        : Array.isArray(defaults.faceOverlayMeshes)
          ? defaults.faceOverlayMeshes
          : [],
      faceAnchor: avatarRuntime.faceAnchor ?? defaults.faceAnchor ?? null,
      lastFaceTexture: avatarRuntime.lastFaceTexture ?? defaults.lastFaceTexture ?? null
    };
  }

  function updateAvatarRuntimeField(options = {}) {
    const key = typeof options.key === "string" ? options.key.trim() : "";
    const value = options.value;
    const appState = options.appState || null;
    if (appState && appState.avatarRuntime && key && key in appState.avatarRuntime) {
      appState.avatarRuntime[key] = value;
    }
    return value;
  }

  globalScope.FrienemiesAvatarRuntimeUtils = {
    getInitialAvatarRuntimeState,
    updateAvatarRuntimeField
  };
})(window);
