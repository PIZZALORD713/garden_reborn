(function initFrienemiesControlShellUtils(globalScope) {
  const SHELF_VIEWS = Object.freeze([
    "grid", "animate", "look", "share", "info", "console"
  ]);

  function getInitialControlShellState(options = {}) {
    const appState = options.appState || null;
    const defaults = options.defaults || {};
    const shell = appState && appState.controlShell ? appState.controlShell : {};

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
  }

  function updateActiveViewState(options = {}) {
    const view = typeof options.view === "string" && SHELF_VIEWS.includes(options.view)
      ? options.view
      : "grid";
    const appState = options.appState || null;
    if (appState && appState.controlShell) appState.controlShell.activeView = view;
    return view;
  }

  function updateRadialOpenState(options = {}) {
    const nextOpen = !!options.open;
    const appState = options.appState || null;
    if (appState && appState.controlShell) appState.controlShell.radialOpen = nextOpen;
    return nextOpen;
  }

  function updateStatusTextState(options = {}) {
    const nextStatus = String(options.statusText || "");
    const appState = options.appState || null;
    if (appState && appState.controlShell) appState.controlShell.statusText = nextStatus;
    return nextStatus;
  }

  globalScope.FrienemiesControlShellUtils = {
    SHELF_VIEWS,
    getInitialControlShellState,
    updateActiveViewState,
    updateRadialOpenState,
    updateStatusTextState
  };
})(window);
