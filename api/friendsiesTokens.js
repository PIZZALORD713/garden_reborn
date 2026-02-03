// Vercel Serverless Function: /api/friendsiesTokens
//
// Purpose:
// - Resolve ENS (optional) to ETH address
// - Query Moralis for Friendsies NFTs held by that wallet (ETH)
// - Return a JSON payload the UI can also download as a file
//
// ENV:
// - MORALIS_API_KEY (required)
//
// Notes:
// - Keep this dependency-free (no package.json). Use fetch + simple JSON-RPC.

function json(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(obj, null, 2));
}

function isHexAddress(v) {
  return typeof v === "string" && /^0x[0-9a-fA-F]{40}$/.test(v.trim());
}

function isEnsName(v) {
  return typeof v === "string" && v.trim().toLowerCase().endsWith(".eth");
}

async function resolveEnsViaEnsIdeas(name) {
  // Unofficial but widely used public resolver.
  // If you prefer, we can swap this to Moralis' ENS resolution endpoint later.
  const url = `https://api.ensideas.com/ens/resolve/${encodeURIComponent(
    name.trim()
  )}`;
  const r = await fetch(url, {
    headers: { Accept: "application/json" }
  });
  if (!r.ok) return null;
  const data = await r.json().catch(() => null);
  const addr = data && (data.address || data.result);
  return isHexAddress(addr) ? addr : null;
}

async function moralisGetWalletNfts({ owner, chain, contract }) {
  const apiKey = process.env.MORALIS_API_KEY;
  if (!apiKey) {
    throw new Error("Missing MORALIS_API_KEY env var on server");
  }

  const base = "https://deep-index.moralis.io/api/v2.2";

  // Moralis pagination uses cursor.
  let cursor = null;
  const tokenIds = [];
  const seen = new Set();

  for (let page = 0; page < 10; page++) {
    const params = new URLSearchParams();
    params.set("chain", chain);
    params.set("format", "decimal");
    params.set("token_addresses", contract);
    // Keep payload small.
    params.set("normalizeMetadata", "false");
    params.set("media_items", "false");
    if (cursor) params.set("cursor", cursor);

    const url = `${base}/${owner}/nft?${params.toString()}`;

    const r = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-API-Key": apiKey
      }
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      throw new Error(`Moralis error (${r.status}): ${text}`);
    }

    const data = await r.json();
    const results = Array.isArray(data?.result) ? data.result : [];

    for (const item of results) {
      const tid = item?.token_id;
      if (tid === undefined || tid === null) continue;
      const n = Number(tid);
      if (!Number.isFinite(n)) continue;
      if (seen.has(n)) continue;
      seen.add(n);
      tokenIds.push(n);
    }

    cursor = data?.cursor || null;
    if (!cursor) break;
  }

  tokenIds.sort((a, b) => a - b);
  return tokenIds;
}

export default async function handler(req, res) {
  try {
    const ownerInput = String(req.query.owner || "").trim();
    const chain = String(req.query.chain || "eth").trim();
    const contract = String(req.query.contract || "").trim();

    if (!ownerInput) {
      return json(res, 400, { error: "missing_owner" });
    }
    if (!contract || !/^0x[0-9a-fA-F]{40}$/.test(contract)) {
      return json(res, 400, { error: "missing_or_invalid_contract" });
    }
    if (chain !== "eth") {
      return json(res, 400, { error: "unsupported_chain", chain });
    }

    let ownerResolved = null;

    if (isHexAddress(ownerInput)) {
      ownerResolved = ownerInput;
    } else if (isEnsName(ownerInput)) {
      ownerResolved = await resolveEnsViaEnsIdeas(ownerInput);
      if (!ownerResolved) {
        return json(res, 400, {
          error: "ens_resolution_failed",
          ownerInput
        });
      }
    } else {
      return json(res, 400, {
        error: "invalid_owner",
        message: "Expected 0x… address or .eth name"
      });
    }

    const tokenIds = await moralisGetWalletNfts({
      owner: ownerResolved,
      chain,
      contract
    });

    return json(res, 200, {
      ownerInput,
      ownerResolved,
      chain,
      contract,
      tokenIds,
      tokenCount: tokenIds.length,
      fetchedAt: new Date().toISOString()
    });
  } catch (err) {
    return json(res, 500, {
      error: "server_error",
      message: String(err?.message || err)
    });
  }
}
