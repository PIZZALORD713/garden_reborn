(function initFrienemiesControlShellUtils(globalScope) {
  const DEFAULT_BOTTOM_SURFACE_MODE = Object.freeze({
    CAROUSEL: "carousel",
    SETTINGS: "settings"
  });

  function resolveBottomSurfaceMode(mode, options = {}) {
    const modeMap = options.modeMap || DEFAULT_BOTTOM_SURFACE_MODE;
    return mode === modeMap.SETTINGS ? modeMap.SETTINGS : modeMap.CAROUSEL;
  }

  function getInitialControlShellState(options = {}) {
    const appState = options.appState || null;
    const defaults = options.defaults || {};
    const modeMap = options.modeMap || DEFAULT_BOTTOM_SURFACE_MODE;
    const shell = appState && appState.controlShell ? appState.controlShell : {};

    return {
      bottomSurfaceMode: resolveBottomSurfaceMode(
        shell.bottomSurfaceMode,
        { modeMap }
      ),
      controlPanelOpen:
        typeof shell.controlPanelOpen === "boolean"
          ? shell.controlPanelOpen
          : !!defaults.controlPanelOpen,
      controlActiveTab:
        typeof shell.controlActiveTab === "string" && shell.controlActiveTab.trim()
          ? shell.controlActiveTab
          : defaults.controlActiveTab || "animations",
      statusText:
        typeof shell.statusText === "string"
          ? shell.statusText
          : defaults.statusText || "booting…"
    };
  }

  function updateBottomSurfaceModeState(options = {}) {
    const modeMap = options.modeMap || DEFAULT_BOTTOM_SURFACE_MODE;
    const nextMode = resolveBottomSurfaceMode(options.mode, { modeMap });
    const appState = options.appState || null;
    if (appState && appState.controlShell) appState.controlShell.bottomSurfaceMode = nextMode;
    return nextMode;
  }

  function updateControlPanelOpenState(options = {}) {
    const nextOpen = !!options.open;
    const appState = options.appState || null;
    if (appState && appState.controlShell) appState.controlShell.controlPanelOpen = nextOpen;
    return nextOpen;
  }

  function updateControlActiveTabState(options = {}) {
    const fallbackTab = options.fallbackTab || "animations";
    const rawTab = typeof options.tab === "string" ? options.tab.trim() : "";
    const nextTab = rawTab || fallbackTab;
    const appState = options.appState || null;
    if (appState && appState.controlShell) appState.controlShell.controlActiveTab = nextTab;
    return nextTab;
  }

  function updateStatusTextState(options = {}) {
    const nextStatus = String(options.statusText || "");
    const appState = options.appState || null;
    if (appState && appState.controlShell) appState.controlShell.statusText = nextStatus;
    return nextStatus;
  }

  globalScope.FrienemiesControlShellUtils = {
    getInitialControlShellState,
    resolveBottomSurfaceMode,
    updateBottomSurfaceModeState,
    updateControlPanelOpenState,
    updateControlActiveTabState,
    updateStatusTextState
  };
})(window);
