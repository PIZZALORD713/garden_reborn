export function isHexAddress(value) {
  return typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value.trim());
}

export function isEnsName(value) {
  return typeof value === "string" && value.trim().toLowerCase().endsWith(".eth");
}

export function getWalletOwnerFromUrl(locationValue) {
  const activeLocation = locationValue || window.location;
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
