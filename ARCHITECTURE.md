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

## App state boundary map (slice-034)
Current mutable state still lives in `main.js`, but it now falls into clear seams that can be extracted without behavior changes:

1. **Control shell state** (UI chrome only)
   - `controlPanelOpen`, `controlActiveTab`
   - `statusText`
   - Owned by: control panel + status rendering helpers

2. **Avatar runtime state** (3D assembly + playback)
   - `allFriendsies`, `currentLoadId`
   - `loadedParts`, `loadedPartsMeta`, `lastTraits`
   - `bodyRoot`, `bodySkeleton`, `bodySkinned`
   - `mixer`, `currentAction`, `hipsRawName`, `restPosByBone`
   - `faceOverlayMeshes`, `faceAnchor`, `lastFaceTexture`

3. **Interaction shell state** (menus + idle/timers)
   - `hamburgerTimer`, `carouselHideTimer`, `idleTimer`, `idleActive`
   - `activePanel`, `menuOpen`, `orbitReleaseTimer`
   - `carouselHovered`, `carouselScrolling`, `hamburgerHovered`
   - `carouselPinned`, `carouselDismissed`, `toggleHideTimer`

4. **Carousel/query state** (search/load + visible token window)
   - `carouselTokenIds`, `carouselTokenIdSet`, `activeCarouselIndex`
   - `pendingTokenId`, `lastLoadedTokenId`, `loadDebounceTimer`
   - `imageObserver`, `carouselListenersBound`
   - `scrollRafPending`, `suppressScrollHandler`

5. **Drag physics state** (pointer + momentum)
   - `isDragging`, `wasDragging`, `dragStartX`, `dragStartScroll`
   - `dragVelocity`, `dragLastX`, `dragLastTime`, `momentumRaf`

### Proposed no-behavior-change extraction seam
Next safest seam is an **`app-state-store.js` read/write shim** loaded before `main.js` that only centralizes state reads/writes while keeping existing runtime logic in place.

Phase A (low-risk):
- Introduce `window.FrienemiesAppStateStore.createState()` returning grouped state buckets above.
- Replace direct top-level `let` declarations with references to this store in `main.js`.
- Keep function boundaries and call order unchanged.

Phase B (follow-up slices):
- Move per-bucket selectors/update helpers into dedicated modules (`control-state`, `carousel-state`, etc.).
- Keep core flows (`token load`, `wallet/ENS`, `animation`, `.glb export`) as required regression gates after each extraction.

## Framework components
- `schemas/`: manifest/pack/skeleton contracts
- `packs/registry.json`: discoverable pack index
- `mcp/`: capability server for model/tooling integrations

## Mascot hook
- Config-driven assistant identity in viewer (`Sauce-0x`, token `8521`)
- Toggleable corner panel
- Emote triggers reuse existing animation playback system
- Fallback 2D sprite from OpenSea image until mascot GLB is ready
