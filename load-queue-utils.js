(() => {
  function normalizeRequestedTokenId(tokenId) {
    const id = Number(tokenId);
    return Number.isFinite(id) ? id : null;
  }

  function canRequestTokenLoad(tokenIdSet, tokenId) {
    return Number.isFinite(tokenId) && tokenIdSet instanceof Set && tokenIdSet.has(tokenId);
  }

  function shouldSkipQueuedTokenLoad({ id, tokenIdSet, lastLoadedTokenId, force = false } = {}) {
    if (!Number.isFinite(id)) return true;
    if (!(tokenIdSet instanceof Set) || !tokenIdSet.has(id)) return true;
    return !force && id === lastLoadedTokenId;
  }

  window.FrienemiesLoadQueueUtils = {
    normalizeRequestedTokenId,
    canRequestTokenLoad,
    shouldSkipQueuedTokenLoad
  };
})();
