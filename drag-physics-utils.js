(function initFrienemiesDragPhysicsUtils(globalScope) {
  function getInitialDragPhysicsState(options = {}) {
    const appState = options.appState || null;
    const defaults = options.defaults || {};
    const dragPhysics = appState && appState.dragPhysics ? appState.dragPhysics : {};

    return {
      isDragging:
        typeof dragPhysics.isDragging === "boolean"
          ? dragPhysics.isDragging
          : !!defaults.isDragging,
      wasDragging:
        typeof dragPhysics.wasDragging === "boolean"
          ? dragPhysics.wasDragging
          : !!defaults.wasDragging,
      dragStartX:
        Number.isFinite(dragPhysics.dragStartX)
          ? dragPhysics.dragStartX
          : Number(defaults.dragStartX || 0),
      dragStartScroll:
        Number.isFinite(dragPhysics.dragStartScroll)
          ? dragPhysics.dragStartScroll
          : Number(defaults.dragStartScroll || 0),
      dragVelocity:
        Number.isFinite(dragPhysics.dragVelocity)
          ? dragPhysics.dragVelocity
          : Number(defaults.dragVelocity || 0),
      dragLastX:
        Number.isFinite(dragPhysics.dragLastX)
          ? dragPhysics.dragLastX
          : Number(defaults.dragLastX || 0),
      dragLastTime:
        Number.isFinite(dragPhysics.dragLastTime)
          ? dragPhysics.dragLastTime
          : Number(defaults.dragLastTime || 0),
      momentumRaf:
        dragPhysics.momentumRaf != null
          ? dragPhysics.momentumRaf
          : defaults.momentumRaf ?? null
    };
  }

  function updateDragPhysicsField(options = {}) {
    const key = typeof options.key === "string" ? options.key.trim() : "";
    const value = options.value;
    const appState = options.appState || null;
    if (appState && appState.dragPhysics && key && key in appState.dragPhysics) {
      appState.dragPhysics[key] = value;
    }
    return value;
  }

  globalScope.FrienemiesDragPhysicsUtils = {
    getInitialDragPhysicsState,
    updateDragPhysicsField
  };
})(window);
