export { getWalletOwnerFromUrl } from "./identifier-utils.js";

export function buildCollectionPath() {
  return "/";
}

export function buildOwnerPath(ownerSlug) {
  return `/${encodeURIComponent(String(ownerSlug ?? "").trim())}`;
}
