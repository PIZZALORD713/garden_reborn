(function attachRoutingUtils(globalScope) {
  function buildCollectionPath() {
    return "/";
  }

  function buildOwnerPath(ownerSlug) {
    return `/${encodeURIComponent(String(ownerSlug ?? "").trim())}`;
  }

  function getWalletOwnerFromUrl(locationValue, deps = {}) {
    const activeLocation = locationValue || globalScope.location;
    const isHexAddress =
      deps.isHexAddress ||
      globalScope?.FrienemiesIdentifierUtils?.isHexAddress ||
      ((value) => typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value.trim()));
    const isEnsName =
      deps.isEnsName ||
      globalScope?.FrienemiesIdentifierUtils?.isEnsName ||
      ((value) => typeof value === "string" && value.trim().toLowerCase().endsWith(".eth"));

    const params = new URLSearchParams(activeLocation.search || "");
    const queryOwner = params.get("owner");
    const rawPath = decodeURIComponent(activeLocation.pathname || "/");
    const pathOwner =
      rawPath
        .replace(/^\/+/, "")
        .split("/")
        .filter(Boolean)[0] || "";

    const candidate = (queryOwner || pathOwner || "").trim();
    if (!candidate) return null;
    if (isHexAddress(candidate) || isEnsName(candidate)) return candidate;
    return null;
  }

  globalScope.FrienemiesRoutingUtils = {
    buildCollectionPath,
    buildOwnerPath,
    getWalletOwnerFromUrl
  };
})(window);
