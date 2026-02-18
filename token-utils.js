(function initFrienemiesTokenUtils(globalScope) {
  const scope = globalScope || (typeof window !== "undefined" ? window : globalThis);

  function resolveFriendsieEntry(allFriendsies, id) {
    if (!allFriendsies) return null;
    const tokenId = Number(id);
    if (!Number.isFinite(tokenId)) return null;

    return (
      allFriendsies[tokenId] ||
      allFriendsies[tokenId - 1] ||
      allFriendsies.find?.((item) => Number(item?.token_id) === tokenId) ||
      allFriendsies.find?.((item) => Number(item?.id) === tokenId) ||
      null
    );
  }

  function buildPreviewUrl(baseUrl, tokenId) {
    return `${String(baseUrl || "").replace(/\/$/, "")}/${tokenId}/friendsie.jpg`;
  }

  scope.FrienemiesTokenUtils = {
    resolveFriendsieEntry,
    buildPreviewUrl
  };
})(typeof window !== "undefined" ? window : globalThis);
