(function initFrienemiesCarouselQueryUtils(globalScope) {
  function normalizeTokenIdList(tokenIds, options = {}) {
    const fallbackTokenIds = Array.isArray(options.fallbackTokenIds)
      ? options.fallbackTokenIds
      : [];
    const source = Array.isArray(tokenIds) ? tokenIds : fallbackTokenIds;
    const cleaned = source
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id));
    const unique = Array.from(new Set(cleaned));
    unique.sort((a, b) => a - b);
    return unique;
  }

  function getInitialCarouselQueryState(options = {}) {
    const appState = options.appState || null;
    const fallbackTokenIds = Array.isArray(options.defaultTokenIds)
      ? options.defaultTokenIds
      : [];
    const queryState = appState && appState.carouselQuery ? appState.carouselQuery : {};
    const tokenIds = normalizeTokenIdList(queryState.carouselTokenIds, {
      fallbackTokenIds
    });

    return {
      carouselTokenIds: tokenIds,
      carouselTokenIdSet: new Set(tokenIds),
      activeCarouselIndex:
        Number.isFinite(queryState.activeCarouselIndex)
          ? Number(queryState.activeCarouselIndex)
          : null,
      pendingTokenId:
        Number.isFinite(queryState.pendingTokenId)
          ? Number(queryState.pendingTokenId)
          : null,
      lastLoadedTokenId:
        Number.isFinite(queryState.lastLoadedTokenId)
          ? Number(queryState.lastLoadedTokenId)
          : null,
      loadDebounceTimer: queryState.loadDebounceTimer || null,
      imageObserver: queryState.imageObserver || null,
      carouselListenersBound: !!queryState.carouselListenersBound,
      scrollRafPending: !!queryState.scrollRafPending,
      suppressScrollHandler: !!queryState.suppressScrollHandler
    };
  }

  function updateCarouselTokenIdsState(options = {}) {
    const nextTokenIds = normalizeTokenIdList(options.tokenIds, {
      fallbackTokenIds: options.fallbackTokenIds
    });
    const appState = options.appState || null;
    if (appState && appState.carouselQuery) {
      appState.carouselQuery.carouselTokenIds = nextTokenIds;
      appState.carouselQuery.carouselTokenIdSet = new Set(nextTokenIds);
    }
    return {
      carouselTokenIds: nextTokenIds,
      carouselTokenIdSet: new Set(nextTokenIds)
    };
  }

  function updateCarouselQueryField(options = {}) {
    const key = options.key;
    const value = options.value;
    const appState = options.appState || null;
    if (appState && appState.carouselQuery && typeof key === "string" && key in appState.carouselQuery) {
      appState.carouselQuery[key] = value;
    }
    return value;
  }

  globalScope.FrienemiesCarouselQueryUtils = {
    normalizeTokenIdList,
    getInitialCarouselQueryState,
    updateCarouselTokenIdsState,
    updateCarouselQueryField
  };
})(window);
