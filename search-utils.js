export function normalizeSearchInput(value) {
  return String(value ?? "").trim();
}

export function parseTokenIdInput(value, options = {}) {
  const min = Number.isInteger(options.min) ? options.min : 1;
  const max = Number.isInteger(options.max) ? options.max : 10000;
  const normalized = normalizeSearchInput(value).replace(/^#/, "");
  if (!normalized) return null;
  const tokenId = Number(normalized);
  if (!Number.isInteger(tokenId)) return null;
  if (tokenId < min || tokenId > max) return null;
  return tokenId;
}
