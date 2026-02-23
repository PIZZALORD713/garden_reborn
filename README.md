# fRiENEMiES Studio

**Better Than Friends. Let’s be fRiENEMiES 😈**

A community-led 3D studio for fRiENDSiES characters: **view, animate, export**.

> **Friends change. Enemies evolve. We ship.**

---

## Why This Exists

The original story paused.  
The community built anyway.

fRiENEMiES Studio keeps characters useful with:
- a working 3D viewer,
- a clean export pipeline,
- and the foundation for interoperable animation packs.

If the official studio went quiet, the community studio didn’t.

---

## Disclaimer

**Independent and community-led. Not affiliated with the original creators.**

---

## Core Features

- Token / wallet / ENS loading (deep-link friendly)
- Multi-part character assembly (BODY-first canonical skeleton binding)
- Animation preview system (registry-based packs)
- Lighting presets (Cinematic / Studio / Soft Pastel)
- One-click GLB export pipeline
- Sauce-0x mascot configuration slot

---

## How It Works (Pipeline)

1. Resolve subject (Token ID, Wallet, or ENS)
2. Fetch token traits + asset URLs
3. Load BODY (canonical skeleton)
4. Bind trait parts to BODY skeleton
5. Retarget rigid attachments
6. Apply lighting preset
7. Load animation packs
8. Preview playback
9. Export GLB with compatibility cleanup

---

## Tech Stack

### Viewer
- Three.js (CDN)
- Vanilla HTML/CSS/JS
- Vercel-friendly static + serverless API

### Data
- Moralis API for wallet → token lookup
- ENS resolution support
- Token trait metadata via GitHub gist

### Framework
- JSON Schemas (contracts)
- Pack registry system
- MCP server (TypeScript tools)

---

## Project Structure

```text
index.html                 # UI shell
style.css                  # UI skin + responsiveness
main.js                    # Orchestration logic
api/                       # Serverless wallet/ENS resolution
schemas/                   # Skeleton + pack contracts
packs/                     # Animation registry + example packs
mcp/                       # MCP server tools
docs/                      # ARCHITECTURE.md, CANON.md, ROADMAP.md, DESIGN_REVIEW.md
```

---

## Quickstart

Run locally:

```bash
npx serve .
```

Then open:

```text
http://localhost:3000/
```

---

## API

### `GET /api/friendsiesTokens`

**Query params**
- `owner` — `0x...` or `.eth`
- `chain` — optional
- `contract` — required

**Environment**
- `MORALIS_API_KEY` — required

---

## Deployment (Vercel)

1. Push repo to GitHub  
2. Import project into Vercel  
3. Set `MORALIS_API_KEY`  
4. Deploy

`vercel.json` handles route rewrites for ENS and wallet paths.

---

## MCP Server

```bash
cd mcp
npm install
npm run build
npm start
```

Exposes tools like:
- `resolve_token`
- `list_animation_packs`
- `validate_asset`
- `generate_template`

---

## Contributing

PRs welcome — especially around:
- Animation quality improvements
- Export compatibility QA
- GPU resource cleanup
- UI polish and slice refinement

Keep PRs focused.  
If contracts change, update relevant schemas and docs in the same PR.

---

## Roadmap (Short)

- Better animation interoperability across packs
- Stronger export compatibility across DCC/game pipelines
- More creator-facing tooling and templates
- Continued community-led iteration

---

**Built by the community. Still shipping.**
