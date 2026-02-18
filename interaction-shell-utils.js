(function initFrienemiesInteractionShellUtils(globalScope) {
  function getInitialInteractionShellState(options = {}) {
    const appState = options.appState || null;
    const defaults = options.defaults || {};
    const shell = appState && appState.interactionShell ? appState.interactionShell : {};

    return {
      hamburgerTimer: shell.hamburgerTimer ?? defaults.hamburgerTimer ?? null,
      carouselHideTimer: shell.carouselHideTimer ?? defaults.carouselHideTimer ?? null,
      idleTimer: shell.idleTimer ?? defaults.idleTimer ?? null,
      idleActive:
        typeof shell.idleActive === "boolean"
          ? shell.idleActive
          : !!defaults.idleActive,
      activePanel: shell.activePanel ?? defaults.activePanel ?? null,
      menuOpen:
        typeof shell.menuOpen === "boolean"
          ? shell.menuOpen
          : !!defaults.menuOpen,
      orbitReleaseTimer: shell.orbitReleaseTimer ?? defaults.orbitReleaseTimer ?? null,
      carouselHovered:
        typeof shell.carouselHovered === "boolean"
          ? shell.carouselHovered
          : !!defaults.carouselHovered,
      carouselScrolling:
        typeof shell.carouselScrolling === "boolean"
          ? shell.carouselScrolling
          : !!defaults.carouselScrolling,
      hamburgerHovered:
        typeof shell.hamburgerHovered === "boolean"
          ? shell.hamburgerHovered
          : !!defaults.hamburgerHovered,
      carouselPinned:
        typeof shell.carouselPinned === "boolean"
          ? shell.carouselPinned
          : !!defaults.carouselPinned,
      carouselDismissed:
        typeof shell.carouselDismissed === "boolean"
          ? shell.carouselDismissed
          : !!defaults.carouselDismissed,
      toggleHideTimer: shell.toggleHideTimer ?? defaults.toggleHideTimer ?? null
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
