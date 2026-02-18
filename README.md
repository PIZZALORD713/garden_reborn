# fRiENEMiES Studio

**View. Animate. Export.** A community-built 3D studio for fRiENDSiES characters.

Load any token by ID or wallet/ENS, preview animations in real time, and export rig-ready `.glb` files -- all in-browser, no wallet connect required.

> Independent and community-led. Not affiliated with the original creators.

---

## Features

- **Character viewer** -- load any of the 10,000 fRiENDSiES tokens by ID, wallet address, or ENS name
- **Multi-part assembly** -- BODY-first skeleton binding with cross-part animation consistency, rigid attachment retargeting, and face texture overlays
- **Animation preview** -- external animation library loaded from a manifest, with clip sanitization for safe playback
- **Lighting presets** -- Cinematic, Punchy Studio, and Soft Pastel looks with mobile-optimized defaults
- **GLB export** -- one-click download with Windows 3D Viewer compatibility (texture transform baking, sampler/skin dedup, material sanitization)
- **Holder pages** -- shareable URLs like `/pizzalord.eth` or `/0x28af...d713` that deep-link to a collector's tokens
- **Carousel browser** -- virtual-rendered token picker with pointer-drag momentum and lazy image loading
- **Onboarding flow** -- first-visit welcome modal with demo mode and animation picker

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| 3D engine | Three.js r128 (CDN, no bundler) |
| Frontend | Vanilla HTML / CSS / JS -- `index.html`, `main.js`, `style.css` |
| API | Vercel serverless function (`api/friendsiesTokens.js`) |
| NFT data | Moralis API (wallet-to-token lookup) |
| ENS resolution | ensideas.com public API |
| Metadata | GitHub Gist (character trait data) |
| Animations | GitHub CDN via jsDelivr (animation manifest + `.glb` clips) |
| Hosting | Vercel (static + serverless) |

No build tools, no `package.json`, no node_modules. Clone and serve.

---

## Quickstart

```bash
npx serve .
```

Open `http://localhost:3000/`

### Route tests

- `http://localhost:3000/pizzalord.eth` -- holder page via ENS
- `http://localhost:3000/0x28af3356c6aaf449d20c59d2531941ddfb94d713` -- holder page via address

> **Note:** Wallet/ENS lookup requires the serverless API (`/api/friendsiesTokens`), which needs `MORALIS_API_KEY` in your environment. Without it, you can still load tokens by ID.

---

## Project Structure

```
garden_reborn/
├── index.html                  # Entry point: HTML structure + CDN script tags
├── main.js                     # Core application (~3,500 lines)
│   ├── Configuration           # Metadata URL, contract address, defaults
│   ├── Scene bootstrap         # Three.js scene, camera, renderer, controls
│   ├── Lighting system         # Presets, mobile detection, material intensity
│   ├── Character assembly      # BODY-first skeleton, part binding, face overlay
│   ├── Animation system        # Clip sanitization, manifest loading, playback
│   ├── GLB export pipeline     # Parse/build GLB, Windows compat post-processing
│   ├── Carousel system         # Virtual rendering, momentum scroll, navigation
│   ├── UI state management     # Menu, panels, onboarding, console viewer
│   ├── Search + wallet flow    # Token/ENS/address lookup and routing
│   ├── Boot sequence           # URL parsing, metadata fetch, carousel init
│   └── Render loop             # Animation mixer, bone stabilization, lights
├── style.css                   # Glassmorphism UI (~1,165 lines)
│   ├── CSS custom properties   # Glass effects, radii, shadows, typography
│   ├── Carousel component      # Token cards, spacers, snap scrolling
│   ├── Menu system             # Hamburger FAB, icon buttons, sheet panels
│   ├── Onboarding modal        # Welcome card, input group, action tiles
│   ├── Control panel           # Gear button, tabs, sections
│   ├── Console modal           # Log viewer overlay
│   └── Responsive breakpoints  # 720px + 780px mobile layouts
├── api/
│   └── friendsiesTokens.js     # Serverless: ENS resolve + Moralis NFT lookup
├── vercel.json                 # URL rewrites for holder routes
├── garden-cotton-clouds.png    # Panorama background (~3.9 MB)
└── friendsies_cloud_overcast_studio_v1.exr  # HDR environment map (~7.6 MB)
```

---

## Architecture

### Character Assembly

```
BODY (master skeleton source)
  ├── SkinnedMesh (body geometry bound to BODY skeleton)
  └── Bones[]
       ├── HEAD
       │   ├── SkinnedMesh (rebound to BODY skeleton)
       │   ├── Face overlay mesh (texture decal on FACE_ANCHOR)
       │   └── Rigid meshes (reparented to matching BODY bones)
       └── Trait parts
           ├── SkinnedMesh (rebound to BODY skeleton)
           └── Rigid meshes (reparented to matching BODY bones)
```

Bone names are normalized (strips `Armature|`, `MixamoRig:` prefixes) and aliased (`pelvis` -> `hips`) for cross-rig consistency.

### GLB Export Pipeline

```
Live scene
  → Clone via SkeletonUtils (preserve skin/skeleton data)
  → Strip viewer-only helpers (FACE_ANCHOR, overlays)
  → Rebind all parts to exported BODY skeleton
  → Add face decal mesh (normal-offset geometry)
  → GLTFExporter → raw ArrayBuffer
  → Post-process for Windows compatibility:
      → Bake KHR_texture_transform (flip-Y only)
      → Deduplicate samplers
      → Deduplicate skins
      → Sanitize materials (clamp PBR factors, strip extras)
  → Download as .glb
```

### Loader Pipeline

```
URL/input → detect wallet/ENS/token ID
  → Wallet: /api/friendsiesTokens → token IDs
  → Token: metadata gist lookup → trait list
  → Parallel load: BODY.glb + HEAD.glb + trait GLBs + face PNG
  → BODY skeleton binding → part attachment → face overlay
  → Material boost (emissive, env map intensity)
  → Apply lighting preset → start animation
```

---

## API Reference

### `GET /api/friendsiesTokens`

Resolves a wallet address or ENS name to fRiENDSiES token IDs.

**Query parameters:**

| Param | Required | Description |
|-------|----------|-------------|
| `owner` | Yes | `0x...` address or `.eth` name |
| `chain` | No | Blockchain (default: `eth`) |
| `contract` | Yes | ERC-721 contract address |

**Response:**

```json
{
  "ownerInput": "pizzalord.eth",
  "ownerResolved": "0x28af3356c6aaf449d20c59d2531941ddfb94d713",
  "chain": "eth",
  "contract": "0xe5af63234f93afd72a8b9114803e33f6d9766956",
  "tokenIds": [42, 1337, 8448],
  "tokenCount": 3,
  "fetchedAt": "2026-02-13T00:00:00.000Z"
}
```

**Environment variables:**

- `MORALIS_API_KEY` (required) -- Moralis Web3 API key for NFT lookups

---

## Deployment

Designed for **Vercel** (static hosting + serverless API).

1. Push the repo to GitHub
2. Import into Vercel
3. Set `MORALIS_API_KEY` in Vercel environment variables
4. Deploy -- Vercel serves static files and runs `api/friendsiesTokens.js` as a serverless function

**URL rewrites** (`vercel.json`): routes like `/pizzalord.eth` and `/0x28af...d713` are rewritten to `/index.html` for client-side handling.

**For other hosts:** the static frontend works anywhere. The `/api/friendsiesTokens` endpoint needs a Node.js serverless environment with the Moralis API key.

---

## User Paths

| Path | How |
|------|-----|
| **Browse by token** | Scroll the carousel or type a token ID in search |
| **Load a wallet** | Enter an ENS name or `0x...` address in the search or onboarding input |
| **Preview animation** | Select from the animation dropdown in the control panel or onboarding |
| **Change lighting** | Open the gear menu > Lighting/Scene tab > pick a preset |
| **Export GLB** | Hamburger menu > Share panel > Download .glb |
| **Share a link** | Hamburger menu > Share panel > Copy link (or share the URL directly) |
| **View console** | Gear menu > Console tab > Open console viewer |

---

## Known Limitations

- **Wallet lookup requires the API** -- local dev without `MORALIS_API_KEY` limits you to token ID browsing
- **Three.js r128** -- current stable is r169+; missing recent performance and feature improvements
- **No GPU resource disposal** -- switching tokens many times may accumulate GPU memory
- **Large assets in repo** -- the EXR environment map (7.6 MB) and panorama PNG (3.9 MB) are committed directly
- **Single-file JS** -- `main.js` at ~3,500 lines works but is approaching the maintainability threshold

---

## Contributing

PRs welcome. No build tools required -- edit the files and test with `npx serve .`

### Good first areas

- UI copy and interaction polish
- Wallet/ENS edge case handling
- Export validation and test fixtures
- Animation retargeting quality
- GPU resource cleanup (geometry/material/texture disposal)

### PR guidelines

- Describe **what** changed and **why** it matters
- Include before/after screenshots or a short clip for UI changes
- Keep changes focused -- one concern per PR

---

## License

Community project. See repository for license details.
