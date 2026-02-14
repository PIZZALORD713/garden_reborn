# ARCHITECTURE.md

## Pipeline
1. Resolve subject (token id, wallet, ENS)
2. Fetch metadata + trait assets
3. Load BODY (master skeleton)
4. Bind HEAD/parts to BODY skeleton
5. Retarget rigid attachments to BODY bones
6. Apply look preset + environment
7. Load animation clip from pack/manifest
8. Preview + emote playback
9. Export GLB with compatibility cleanup

## Runtime components
- `index.html`: shell/UI scaffolding
- `main.js`: scene bootstrap, loading, rig bind, animation, export
- `style.css`: UI skin + responsive behavior
- `api/friendsiesTokens.js`: holder lookup endpoint

## Framework components
- `schemas/`: manifest/pack/skeleton contracts
- `packs/registry.json`: discoverable pack index
- `mcp/`: capability server for model/tooling integrations

## Mascot hook
- Config-driven assistant identity in viewer (`Sauce-0x`, token `8521`)
- Toggleable corner panel
- Emote triggers reuse existing animation playback system
- Fallback 2D sprite from OpenSea image until mascot GLB is ready
