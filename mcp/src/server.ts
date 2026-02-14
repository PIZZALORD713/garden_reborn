import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

const FRIENDSIES_CONTRACT = "0xe5af63234f93afd72a8b9114803e33f6d9766956";
const PACK_REGISTRY = {
  version: "1",
  packs: [
    {
      id: "frienemies-core",
      name: "fRiENEMiES Core Motions",
      version: "0.1.0",
      tags: ["core", "starter"],
      skeletonContract: "v1"
    }
  ]
};

function hostAllowed(url: URL): boolean {
  const raw = process.env.FRIENEMIES_ALLOWED_HOSTS?.trim();
  if (!raw) return true;
  const allowed = raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(url.hostname.toLowerCase());
}

function makeText(data: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

const server = new Server(
  { name: "frienemies-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "resolve_token",
      description: "Resolve token or owner/ens into character manifest stub",
      inputSchema: {
        type: "object",
        properties: {
          tokenId: { type: ["string", "number"] },
          owner: { type: "string" },
          ens: { type: "string" }
        }
      }
    },
    {
      name: "list_animation_packs",
      description: "List animation packs from registry",
      inputSchema: {
        type: "object",
        properties: {
          tag: { type: "string" },
          skeletonContract: { type: "string" }
        }
      }
    },
    {
      name: "validate_asset",
      description: "Validate remote GLB URL and return structured checks",
      inputSchema: {
        type: "object",
        required: ["glbUrl"],
        properties: {
          glbUrl: { type: "string" }
        }
      }
    },
    {
      name: "generate_template",
      description: "Generate starter file template suggestions",
      inputSchema: {
        type: "object",
        required: ["target"],
        properties: {
          target: { type: "string", enum: ["pack", "character", "mcp-client"] },
          manifestUrl: { type: "string" }
        }
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "resolve_token") {
    const tokenId = (args as any)?.tokenId ?? null;
    const owner = (args as any)?.owner ?? (args as any)?.ens ?? null;
    return makeText({
      version: "1.0.0",
      tokenId,
      owner,
      collection: {
        name: "fRiENDSiES",
        contract: FRIENDSIES_CONTRACT,
        chain: "eth"
      },
      skeletonContract: "v1",
      traits: [],
      status: "stub"
    });
  }

  if (name === "list_animation_packs") {
    const tag = String((args as any)?.tag || "").toLowerCase();
    const skeleton = String((args as any)?.skeletonContract || "").toLowerCase();
    let packs = PACK_REGISTRY.packs;
    if (tag) packs = packs.filter((p) => p.tags.some((t) => t.toLowerCase() === tag));
    if (skeleton) packs = packs.filter((p) => p.skeletonContract.toLowerCase() === skeleton);
    return makeText({ version: PACK_REGISTRY.version, count: packs.length, packs });
  }

  if (name === "validate_asset") {
    const glbUrlRaw = String((args as any)?.glbUrl || "");
    let url: URL;
    try {
      url = new URL(glbUrlRaw);
    } catch {
      return makeText({ ok: false, errors: ["invalid_url"] });
    }

    if (url.protocol !== "https:") return makeText({ ok: false, errors: ["https_required"] });
    if (!hostAllowed(url)) return makeText({ ok: false, errors: ["host_not_allowlisted"], host: url.hostname });

    const response = await fetch(url, { method: "HEAD" });
    const contentType = response.headers.get("content-type") || "";
    const contentLength = Number(response.headers.get("content-length") || "0");

    const checks = {
      reachable: response.ok,
      contentType,
      contentLength,
      glbLikely: contentType.includes("model/gltf-binary") || glbUrlRaw.toLowerCase().endsWith(".glb")
    };

    return makeText({ ok: checks.reachable && checks.glbLikely, checks });
  }

  if (name === "generate_template") {
    const target = String((args as any)?.target || "");
    const manifestUrl = (args as any)?.manifestUrl ? String((args as any).manifestUrl) : null;

    const templates: Record<string, { files: string[]; instructions: string[] }> = {
      pack: {
        files: ["packs/<id>/pack.json", "packs/registry.json"],
        instructions: ["Create pack.json using animation.pack.schema.json", "Add pack entry to registry"]
      },
      character: {
        files: ["manifests/<tokenId>.json"],
        instructions: ["Create manifest using character.manifest.schema.json", "Set skeletonContract=v1"]
      },
      "mcp-client": {
        files: ["client/config.json", "client/tools.ts"],
        instructions: ["Map MCP tool names to local wrappers", "Validate responses before rendering"]
      }
    };

    return makeText({ target, manifestUrl, ...(templates[target] || { files: [], instructions: [] }) });
  }

  return makeText({ error: `Unknown tool: ${name}` });
});

const transport = new StdioServerTransport();
await server.connect(transport);
