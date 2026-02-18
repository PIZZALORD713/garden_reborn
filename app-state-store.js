(function initFrienemiesAppStateStore(globalScope) {
  const DEFAULT_TOKEN_IDS = Array.from({ length: 10000 }, (_, i) => i + 1);

  function createState() {
    const carouselTokenIds = [...DEFAULT_TOKEN_IDS];

    return {
      controlShell: {
        bottomSurfaceMode: "carousel",
        controlPanelOpen: false,
        controlActiveTab: "animations",
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
        hamburgerTimer: null,
        carouselHideTimer: null,
        idleTimer: null,
        idleActive: false,
        activePanel: null,
        menuOpen: false,
        orbitReleaseTimer: null,
        carouselHovered: false,
        carouselScrolling: false,
        hamburgerHovered: false,
        carouselPinned: false,
        carouselDismissed: false,
        toggleHideTimer: null
      },
      carouselQuery: {
        carouselTokenIds,
        carouselTokenIdSet: new Set(carouselTokenIds),
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
    };
  }

  globalScope.FrienemiesAppStateStore = {
    createState
  };
})(window);
