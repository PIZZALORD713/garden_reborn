(function initFrienemiesInteractionShellUtils(globalScope) {
  function getInitialInteractionShellState(options = {}) {
    const appState = options.appState || null;
    const defaults = options.defaults || {};
    const shell = appState && appState.interactionShell ? appState.interactionShell : {};

    return {
      shelfOpen:
        typeof shell.shelfOpen === "boolean" ? shell.shelfOpen : !!defaults.shelfOpen,
      searchExpanded:
        typeof shell.searchExpanded === "boolean" ? shell.searchExpanded : !!defaults.searchExpanded,
      idleTimer: shell.idleTimer ?? defaults.idleTimer ?? null,
      idleActive:
        typeof shell.idleActive === "boolean"
          ? shell.idleActive
          : !!defaults.idleActive,
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
  }

  function updateInteractionShellField(options = {}) {
    const key = typeof options.key === "string" ? options.key.trim() : "";
    const value = options.value;
    const appState = options.appState || null;
    if (appState && appState.interactionShell && key && key in appState.interactionShell) {
      appState.interactionShell[key] = value;
    }
    return value;
  }

  globalScope.FrienemiesInteractionShellUtils = {
    getInitialInteractionShellState,
    updateInteractionShellField
  };
})(window);
