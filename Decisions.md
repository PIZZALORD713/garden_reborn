# Decisions

## 2026-02-20 — Slice 056 GPU disposal and cleanup
- **Decision:** Introduce dedicated avatar cleanup utilities and wire deterministic disposal into avatar replacement flow.
- **Why:** Repeated token switching previously removed nodes but did not reliably dispose GPU resources, risking memory growth in long sessions.
- **Implementation:** Added `avatar-cleanup-utils.js` (`disposeObjectTree`, material/texture collectors), loaded it before `main.js`, and updated `clearAvatar()` + `clearFaceOverlay()` to dispose geometries/materials/textures while protecting shared scene textures (environment/background/panorama).
- **Observability:** `clearAvatar()` now logs one compact cleanup summary (`geom/mat/tex`) per swap when resources are reclaimed.
- **Scope guard:** Runtime cleanup only; no changes to token routing, animation selection semantics, export pipeline behavior, or UI layout.

## 2026-05-03 — Slice 057 partial verification, API runtime still blocked
- **Decision:** Keep slice-057 open and blocked until an API-backed runtime can be accessed, but record the completed local static smoke evidence.
- **Why:** The post-slice-056 browser flow passes locally, yet the required API-backed pass cannot be completed in this session because `VERCEL_TOKEN` and `MORALIS_API_KEY` are not exported, `npx vercel dev --yes --listen 127.0.0.1:4188` starts a device login, and the latest Vercel deployment returns `401 Authentication Required`.
- **Validation evidence:**
  - `node --check` passes for all root runtime JS modules and `api/friendsiesTokens.js`.
  - Local static runtime (`python3 -m http.server 4187 --bind 127.0.0.1`) passed rapid token switching through `1 -> 5 -> 8521 -> 8448`; final console state included `loaded #8448`.
  - Animation playback passed with `Walk Arms Low`; `.glb` export triggered successfully and reported `Download started. If no file appears, use “Open saved export link”.`
  - Mobile sanity passed at `390x844` with `scrollWidth=390` and shelf/search controls visible.
  - Playwright observed no page errors, unexpected console warnings/errors, or unexpected request failures in the static smoke.
  - Evidence screenshots captured as `slice-057-smoke-desktop.png` and `slice-057-smoke-mobile.png`.
- **Scope guard:** Verification/docs/evidence only; no runtime behavior, UX, API contract, or architecture changes.

## 2026-02-17 — Slice 001 copy unification
- **Decision:** Standardize search wording everywhere user enters identifiers to: "token ID, wallet address, or ENS name."
- **Why:** Removes mixed phrasing ("wallet/ENS", "Wallet / ENS", etc.) and makes onboarding/find language consistent.
- **Scope guard:** Copy-only updates in onboarding + Find sheet + one related search empty message; no behavior changes.

## 2026-02-17 — Slice 002 empty/loading states
- **Decision:** Replace plain text search feedback with structured status cards (info/warn/loading), add shimmer on wallet lookup, and include a reset CTA where users can recover quickly.
- **Why:** Search-fail and no-token moments now tell users exactly what to do next instead of dead-ending.
- **Scope guard:** Limited to Find feedback + carousel empty-state card visuals/CTAs; no token-loading logic or route behavior changes.

## 2026-02-17 — Slice 003 typography tokens
- **Decision:** Introduce named typography size tokens (`--text-xs/sm/md/lg/xl`) and swap high-traffic UI labels/inputs/buttons from literal px sizes to token references.
- **Why:** Tightens visual consistency and makes future UI tuning cheaper than touching dozens of one-off declarations.
- **Scope guard:** CSS-only sizing normalization; no layout, copy, or behavior changes.

## 2026-02-17 — Slice 004 search entry unification
- **Decision:** Add a persistent top command bar as the primary search surface and route onboarding/find submissions through one `submitPrimarySearch()` helper.
- **Why:** Creates one obvious place to load token/wallet/ENS while preserving existing Find sheet and onboarding entry points as secondary mirrors.
- **Scope guard:** UI + submission wiring only; no token-loading logic, routing behavior, or carousel mechanics changes.

## 2026-02-17 — Slice 005 onboarding non-blocking
- **Decision:** Reposition onboarding as a floating guide card and remove modal-style focus trapping/backdrop capture.
- **Why:** Returning users can immediately interact with scene and controls while onboarding remains available as contextual help.
- **Scope guard:** Onboarding presentation/interaction only; no changes to search resolution, token routing, animation playback, or export behavior.

## 2026-02-18 — Slice 006 verification pass
- **Decision:** Run a focused local smoke pass before starting any post-queue work.
- **Why:** Confirms slices 001–005 landed coherently and avoids drifting into new scope before evidence-backed handoff.
- **Validation evidence:** `node --check main.js` passes; local browser snapshot confirms command bar + non-blocking onboarding are present; onboarding-visible token-card click succeeds; no app runtime console errors observed (only environment/network resource misses like favicon/external image DNS).
- **Scope guard:** Validation/docs only; no product behavior or architecture changes.

## 2026-02-18 — Slice 007 identifier utils module
- **Decision:** Extract `isHexAddress`, `isEnsName`, and URL owner parsing into a dedicated `identifier-utils.js` runtime helper loaded before `main.js`.
- **Why:** Starts Phase 2 architecture split with a low-risk seam, reducing `main.js` concerns without changing token/search behavior.
- **Implementation guard:** `main.js` now reads from `window.FrienemiesIdentifierUtils` with an internal fallback to preserve behavior if helper loading fails.
- **Scope guard:** Helper extraction + wiring only; no changes to token loading, routing rules, carousel behavior, animation, or export flows.

## 2026-02-18 — Slice 008 scene bootstrap module
- **Decision:** Extract `initScene`, `initLighting`, and `initEnvironment` into `scene-bootstrap.js` and load it before `main.js`.
- **Why:** Continues the Phase 2 modular split with another low-risk seam while keeping bootstrap behavior intact.
- **Implementation guard:** `main.js` consumes `window.FrienemiesSceneBootstrap` with local fallback implementations to prevent runtime breaks if helper script fails to load.
- **Scope guard:** Scene/bootstrap helper extraction + script wiring only; no changes to token search/load, routing, animation playback, carousel behavior, or export pipeline.

## 2026-02-18 — Slice 009 core flow verification pass
- **Decision:** Complete a post-slice smoke verification pass before starting the next architecture split.
- **Why:** Confirms extracted helper modules did not break boot/runtime entry surfaces and keeps drift low.
- **Validation evidence:** `node --check` passes for `main.js`, `identifier-utils.js`, and `scene-bootstrap.js`; local host load via `python -m http.server 4173` + `npx playwright screenshot` succeeds against `index.html` (command bar/onboarding present in captured UI).
- **Scope guard:** Validation + docs only; no functional code-path changes to search/load/animation/export.

## 2026-02-18 — Slice 010 look utils module
- **Decision:** Extract look-control helper primitives (tone mapping resolver + key normalization + config validation + canonical snapshot) into `look-utils.js` and load it before `main.js`.
- **Why:** Continues Phase 2 decomposition by removing another cohesive utility cluster from the monolith while preserving runtime behavior via fallback wiring.
- **Implementation guard:** `main.js` now consumes `window.FrienemiesLookUtils` but keeps local fallback implementations if helper script fails to load.
- **Validation evidence:** `node --check` passes for `main.js`, `look-utils.js`, `identifier-utils.js`, and `scene-bootstrap.js`.
- **Scope guard:** Utility extraction + script wiring only; no changes to token loading/routing, carousel behavior, animation playback, or export logic.

## 2026-02-18 — Slice 011 animation utils module
- **Decision:** Extract animation manifest/selector helper primitives (`normalizeAnimManifestItem`, select population, manifest name lookup) into `anim-utils.js` and load it before `main.js`.
- **Why:** Keeps the Phase 2 modular split moving by peeling another cohesive helper cluster out of `main.js` with minimal behavioral risk.
- **Implementation guard:** `main.js` now consumes `window.FrienemiesAnimUtils` while preserving local fallback implementations if helper script fails to load.
- **Validation evidence:** `node --check` passes for `main.js`, `anim-utils.js`, `look-utils.js`, `identifier-utils.js`, and `scene-bootstrap.js`.
- **Scope guard:** Utility extraction + script wiring only; no changes to token loading/routing, carousel behavior, animation playback semantics, or export logic.

## 2026-02-18 — Slice 012 carousel utils module
- **Decision:** Extract carousel geometry math helpers (card/viewport metrics, index↔scroll conversion, spacer width calculation) into `carousel-utils.js` and load it before `main.js`.
- **Why:** Continues the Phase 2 modular split on a contained UI seam while keeping carousel behavior stable through fallback wiring.
- **Implementation guard:** `main.js` now consumes `window.FrienemiesCarouselUtils` with local fallback implementations for every extracted helper.
- **Validation evidence:** `node --check` passes for `main.js`, `carousel-utils.js`, `anim-utils.js`, `look-utils.js`, `identifier-utils.js`, and `scene-bootstrap.js`.
- **Scope guard:** Geometry/helper extraction + script wiring only; no changes to token loading/routing, drag/momentum behavior, animation playback, or export logic.

## 2026-02-18 — Slice 013 export utils module
- **Decision:** Extract GLB export post-processing helpers (`parseGlb`, dedupe/sanitize steps, and optimizer wrapper) into `export-utils.js` and load it before `main.js`.
- **Why:** Continues Phase 2 decomposition on a cohesive export seam while preserving runtime behavior through fallback wiring.
- **Implementation guard:** `main.js` retains existing helper implementations and overrides to `window.FrienemiesExportUtils` when available.
- **Validation evidence:** `node --check` passes for `main.js`, `export-utils.js`, and all previously extracted utility modules.
- **Scope guard:** Export helper extraction + script wiring only; no changes to token search/routing, carousel behavior, animation playback semantics, or UX flow.

## 2026-02-18 — Slice 014a local core-flow smoke pass (+ blocker evidence for 014)
- **Decision:** Run the next-in-order QA sweep in local host mode and explicitly capture blocker evidence before attempting further slices.
- **Why:** Keeps execution in-order and drift-low; proves which core flows are green locally vs blocked by environment.
- **Validation evidence:**
  - `node --check` passes for `main.js` + all extracted utility modules.
  - Local app served at `http://127.0.0.1:4173/index.html`; command-bar token load for `8448` updates carousel context around `#8448`.
  - Animation play path triggered through `#controlPlayAnimBtn` with no runtime exceptions.
  - `.glb` export path triggered through `#downloadGlbBtn` (GLTFExporter warnings only; no app crash).
  - Wallet/ENS lookup to `vitalik.eth` hits `GET /api/friendsiesTokens...` → `404` under static host (`python -m http.server`), so full network-enabled sweep remains blocked until API-backed dev runtime is used.
- **Scope guard:** Validation/docs only; no product behavior changes.

## 2026-02-18 — Slice 014 blocker confirmation (API runtime access)
- **Decision:** Attempt to start API-backed runtime with `npx vercel dev --listen 127.0.0.1:4174` and treat runtime-auth failure as a P0 blocker for completing slice-014 QA.
- **Why:** Full core-flow verification explicitly requires wallet/ENS path, which depends on `/api/friendsiesTokens` being available under a real serverless runtime.
- **Validation evidence:**
  - `npx vercel dev` exits immediately with `Error: No existing credentials found. Please run \`vercel login\` or pass "--token"`.
  - Without a booted API runtime, wallet/ENS flow cannot be verified end-to-end in this environment.
- **Scope guard:** Blocker capture/docs only; no product behavior changes.

## 2026-02-18 — Slice 014 blocker reconfirmation (API runtime access)
- **Decision:** Re-attempt API-backed runtime startup before touching later slices; keep queue in-order.
- **Why:** Wallet/ENS QA cannot be validated without `/api/friendsiesTokens` route running.
- **Validation evidence:**
  - `npx vercel dev --listen 127.0.0.1:4174` exits with `Error: No existing credentials found. Please run \`vercel login\` or pass "--token"`.
- **Scope guard:** Docs-only blocker reconfirmation; no product behavior changes.

## 2026-02-18 � Slice 014 blocker reconfirmation #2 (autopilot run @ ~04:44 CT)
- **Decision:** Hold execution at slice-014 and do not advance queue while wallet/ENS QA remains unverifiable.
- **Why:** Program quality gates require wallet/ENS search validation in an API-backed runtime.
- **Validation evidence:**
  - `npx vercel dev --listen 127.0.0.1:4174` exits immediately with `No existing credentials found. Please run \`vercel login\` or pass "--token"`.
- **Scope guard:** Blocker capture only; no codepath/UI behavior edits.

## 2026-02-18 — Slice 014 blocker reconfirmation #3 (autopilot run @ ~04:59 CT)
- **Decision:** Keep queue frozen at slice-014; do not start slice-015+ until wallet/ENS QA can run against a live `/api/friendsiesTokens` route.
- **Why:** Advancing without this check would violate the required quality gates and increase regression risk.
- **Validation evidence:**
  - `npx vercel dev --listen 127.0.0.1:4174` still exits with `No existing credentials found. Please run \`vercel login\` or pass "--token"`.
  - Static-host fallback (`python -m http.server`) still cannot serve `/api/friendsiesTokens` (404), so wallet/ENS end-to-end remains blocked.
- **Scope guard:** Blocker evidence only; no app code or UX behavior changes.

## 2026-02-18 — Slice 014 blocker reconfirmation #4 (autopilot run @ ~06:45 CT)
- **Decision:** Continue holding the upgrade queue at slice-014; no downstream slices started.
- **Why:** Required core-flow gate (wallet/ENS lookup under API runtime) remains impossible in current environment.
- **Validation evidence:**
  - `npx vercel dev --listen 127.0.0.1:4174` exits with `No existing credentials found. Please run \`vercel login\` or pass "--token"`.
- **Scope guard:** Docs/status update only; no app code, behavior, or UX changes.

## 2026-02-18 — Slice 014 blocker reconfirmation #5 (autopilot run @ ~07:02 CT)
- **Decision:** Keep execution paused at slice-014 and continue avoiding slice-015+ work.
- **Why:** Wallet/ENS verification gate still cannot run without API-backed dev runtime credentials.
- **Validation evidence:**
  - `npx vercel dev --listen 127.0.0.1:4174` exits with `No existing credentials found. Please run \`vercel login\` or pass "--token"`.
  - Environment check confirms missing Vercel runtime vars: `VERCEL_TOKEN=False VERCEL_ORG_ID=False VERCEL_PROJECT_ID=False`.
- **Scope guard:** Blocker reconfirmation + docs only; no app code, behavior, or UX changes.

## 2026-02-18 — Slice 014 human QA sweep completed (API runtime unblocked)
- **Decision:** Mark slice-014 complete after running full core-flow QA against a live API-backed runtime.
- **Why:** Required quality gate for wallet/ENS flow is now verifiable with `vercel dev` launched via token-auth in this environment.
- **Validation evidence:**
  - API runtime booted with `npx vercel dev --yes --token $VERCEL_TOKEN --listen 127.0.0.1:4174` (`Ready! Available at http://127.0.0.1:4175`).
  - Direct API probe succeeded: `/api/friendsiesTokens?owner=vitalik.eth&contract=0xe5af63234f93afd72a8b9114803e33f6d9766956&chain=eth` returned `200` with resolved owner payload.
  - UI QA on `http://127.0.0.1:4175/index.html`: token-ID load (`8448`) updated carousel neighborhood to `#8438-#8458`; ENS/wallet lookup (`vitalik.eth`) returned expected no-token state copy (flow executed via API, no 404 blocker).
  - Animation path exercised via quick action (`Wave`) and `.glb` export trigger executed via `Download .glb`.
  - Browser console check showed no runtime errors (only existing `THREE.GLTFExporter` warnings).
  - Mobile sanity pass at `390x844` retained reachable primary search + load controls.
- **Scope guard:** QA/docs-only completion step; no app code, behavior, or UX changes.

## 2026-02-18 — Slice 015 search utils module
- **Decision:** Extract primary-search normalization and token-ID parsing primitives into `search-utils.js`, loaded before `main.js`.
- **Why:** Continues the Phase 2 modular split on a low-risk seam shared by command bar + onboarding + Find entry points.
- **Implementation guard:** `main.js` consumes `window.FrienemiesSearchUtils` with local fallback implementations to preserve runtime behavior if helper loading fails.
- **Validation evidence:** `node --check` passes for `main.js`, `search-utils.js`, and previously extracted helper modules.
- **Scope guard:** Helper extraction + wiring only; no changes to token-routing rules, wallet/ENS lookup behavior, animation playback, carousel mechanics, or export pipeline.

## 2026-02-18 — Slice 016 routing utils module
- **Decision:** Extract URL owner parsing + canonical history path builders into `routing-utils.js` and load it before `main.js`.
- **Why:** Continues the Phase 2 modular split by isolating route/deep-link helpers from `main.js` while preserving existing search and wallet entry behavior.
- **Implementation guard:** `main.js` now consumes `window.FrienemiesRoutingUtils` (`getWalletOwnerFromUrl`, `buildCollectionPath`, `buildOwnerPath`) with in-file fallback implementations.
- **Validation evidence:** `node --check` passes for `main.js`, `routing-utils.js`, and all previously extracted helper modules.
- **Scope guard:** Helper extraction + script wiring only; no changes to token routing semantics, wallet/ENS lookup behavior, animation playback, carousel mechanics, or export pipeline.

## 2026-02-18 — Slice 017 animation select utils module
- **Decision:** Extract animation-select orchestration helpers into `anim-select-utils.js` and load it before `main.js`.
- **Why:** Continues Phase 2 decomposition by moving select-specific wiring (`populateOnboardingAnimationSelects`, selected URL fallback resolution) out of `main.js` while preserving behavior.
- **Implementation guard:** `main.js` now consumes `window.FrienemiesAnimSelectUtils` with in-file fallback implementations for both extracted helpers.
- **Validation evidence:** `node --check` passes for `main.js`, `anim-select-utils.js`, and all previously extracted helper modules.
- **Scope guard:** Helper extraction + script wiring only; no changes to token search/load/routing semantics, carousel mechanics, animation playback behavior, or export pipeline.

## 2026-02-18 — Slice 018 rig utils module
- **Decision:** Extract rig bone-key normalization and lookup helpers into `rig-utils.js` and load it before `main.js`.
- **Why:** Continues Phase 2 modularization on a contained avatar-rig seam (`baseKey`/`aliasKey`/`keyForName` + bone map lookups) without altering runtime behavior.
- **Implementation guard:** `main.js` now consumes `window.FrienemiesRigUtils` (`baseKey`, `aliasKey`, `keyForName`, `getBoneByKey`, `buildBoneMap`) with local fallback implementations if helper script fails to load.
- **Validation evidence:** `node --check` passes for `main.js`, `rig-utils.js`, and all previously extracted helper modules.
- **Scope guard:** Helper extraction + script wiring only; no changes to token search/load/routing, carousel behavior, animation playback, onboarding UX, or export pipeline.

## 2026-02-18 — Slice 019 token utils module
- **Decision:** Extract Friendsies metadata entry resolution and preview-image URL builder helpers into `token-utils.js` and load it before `main.js`.
- **Why:** Continues Phase 2 modularization by moving token-data helper logic out of `main.js` while preserving behavior through fallback wiring.
- **Implementation guard:** `main.js` now consumes `window.FrienemiesTokenUtils` (`resolveFriendsieEntry`, `buildPreviewUrl`) with local fallback implementations if helper loading fails.
- **Validation evidence:** `node --check` passes for `main.js`, `token-utils.js`, and all previously extracted helper modules.
- **Scope guard:** Helper extraction + script wiring only; no changes to token search semantics, wallet/ENS lookup behavior, animation playback, carousel mechanics, or export pipeline.

## 2026-02-18 — Slice 020 post-extraction verification pass
- **Decision:** Run a dedicated verification slice immediately after the 015–019 helper extraction run before starting any new module split.
- **Why:** Keeps drift low by proving recent modularization work remains stable before adding more surface area.
- **Validation evidence:**
  - `node --check` passes for `main.js` plus all extracted helper modules (`identifier-utils.js`, `scene-bootstrap.js`, `look-utils.js`, `anim-utils.js`, `carousel-utils.js`, `export-utils.js`, `search-utils.js`, `routing-utils.js`, `anim-select-utils.js`, `rig-utils.js`, `token-utils.js`).
  - Local browser smoke capture succeeds via `python -m http.server 4173` + `npx playwright screenshot --device="Desktop Chrome" http://127.0.0.1:4173/index.html slice-020-smoke.png`.
- **Scope guard:** Verification/docs only; no product behavior, UX, or architecture changes in runtime code paths.

## 2026-02-18 — Slice 021 control panel utils module
- **Decision:** Extract control-panel open/tab/anchor/visibility helper primitives into `control-panel-utils.js` and load it before `main.js`.
- **Why:** Continues Phase 2 modular decomposition with a contained UI-control seam while preserving existing runtime behavior.
- **Implementation guard:** `main.js` now consumes `window.FrienemiesControlPanelUtils` with in-file fallback implementations for each extracted helper.
- **Validation evidence:** `node --check` passes for `main.js`, `control-panel-utils.js`, and all previously extracted helper modules.
- **Scope guard:** Helper extraction + script wiring only; no changes to token search/load/routing semantics, animation/export flows, or carousel mechanics.

## 2026-02-18 — Slice 022 post-slice-021 verification pass
- **Decision:** Run an immediate verification pass after control-panel helper extraction before taking any additional refactor slices.
- **Why:** Keeps drift low and confirms control surfaces still behave correctly after modularization.
- **Validation evidence:**
  - `node --check` passes for `main.js` and all extracted helper modules, including `control-panel-utils.js`.
  - Browser smoke on `http://127.0.0.1:4173/index.html` confirms control panel interaction states: closed→open (`aria-hidden: true→false`, `aria-expanded: false→true`), tab switching works (`animations`/`lighting`/`console`), then open→closed (`aria-hidden: false→true`) with no captured runtime errors.
- **Scope guard:** Verification/docs only; no product behavior, UX, or architecture changes beyond validation artifacts.

## 2026-02-18 — Slice 023 console utils module
- **Decision:** Extract transcript/console rendering helpers into `console-utils.js` and load it before `main.js`.
- **Why:** Continues Phase 2 modular decomposition with a contained logging UI seam while keeping behavior unchanged through fallback wiring.
- **Implementation guard:** `main.js` now consumes `window.FrienemiesConsoleUtils` for console render/append/clear helpers with in-file fallback implementations for each helper.
- **Validation evidence:** `node --check` passes for `main.js`, `console-utils.js`, and all previously extracted utility modules.
- **Scope guard:** Helper extraction + script wiring only; no changes to token search/load/routing, carousel behavior, animation playback, or export pipeline.

## 2026-02-18 � Slice 024 post-slice-023 verification pass
- **Decision:** Run a dedicated verification pass immediately after console helper extraction before starting additional modularization slices.
- **Why:** Confirms transcript/control surfaces remain stable after moving console rendering logic out of `main.js`, keeping drift low.
- **Validation evidence:**
  - `node --check` passes for `main.js` and all extracted utility modules (`identifier-utils.js`, `scene-bootstrap.js`, `look-utils.js`, `anim-utils.js`, `carousel-utils.js`, `export-utils.js`, `search-utils.js`, `routing-utils.js`, `anim-select-utils.js`, `rig-utils.js`, `token-utils.js`, `control-panel-utils.js`, `console-utils.js`).
  - Browser smoke capture succeeds via `python -m http.server 4173` + `npx playwright screenshot --device="Desktop Chrome" http://127.0.0.1:4173/index.html slice-024-smoke.png`.
- **Scope guard:** Verification/docs only; no product behavior, UX, or architecture changes in runtime code paths.

## 2026-02-18 — Slice 025 search UI utils module
- **Decision:** Extract search notice rendering + reset-collection visibility helpers into `search-ui-utils.js` and load it before `main.js`.
- **Why:** Continues Phase 2 modular decomposition on a contained Find-surface seam while preserving behavior through fallback wiring.
- **Implementation guard:** `main.js` now consumes `window.FrienemiesSearchUiUtils` for `renderSearchMessage` and `updateResetCollectionVisibility`, with in-file fallback implementations if helper loading fails.
- **Validation evidence:** `node --check` passes for `main.js`, `search-ui-utils.js`, and all previously extracted utility modules.
- **Scope guard:** Helper extraction + script wiring only; no changes to token search/load/routing semantics, carousel mechanics, animation playback, or export pipeline.

## 2026-02-18 — Slice 026 post-slice-025 verification pass
- **Decision:** Run an immediate verification slice after search-ui helper extraction before taking the next modularization step.
- **Why:** Keeps execution in-order and drift low by proving Find/search surfaces still boot cleanly after helper extraction.
- **Validation evidence:**
  - `node --check` passes for `main.js` and all extracted utility modules, including `search-ui-utils.js`.
  - Browser smoke capture succeeds via `python -m http.server 4173` + `npx playwright screenshot --device="Desktop Chrome" http://127.0.0.1:4173/index.html slice-026-smoke.png`.
- **Scope guard:** Verification/docs only; no product behavior, UX, or architecture changes in runtime code paths.

## 2026-02-18 — Slice 027 load queue utils module
- **Decision:** Extract token-load request/debounce guard helpers into `load-queue-utils.js` and load it before `main.js`.
- **Why:** Continues Phase 2 modular decomposition on a narrow search/load seam while preserving runtime behavior and existing debounce timing.
- **Implementation guard:** `main.js` now consumes `window.FrienemiesLoadQueueUtils` (`normalizeRequestedTokenId`, `canRequestTokenLoad`, `shouldSkipQueuedTokenLoad`) with in-file fallback implementations.
- **Validation evidence:** `node --check` passes for `main.js`, `load-queue-utils.js`, and all previously extracted utility modules.
- **Scope guard:** Helper extraction + script wiring only; no changes to token-routing semantics, wallet/ENS behavior, carousel mechanics, animation playback, or export pipeline.

## 2026-02-18 — Slice 028 post-slice-027 verification pass
- **Decision:** Run a verification-only slice immediately after load-queue helper extraction before continuing modularization.
- **Why:** Maintains low drift by proving the search/load surfaces still boot and render cleanly after request-guard extraction.
- **Validation evidence:**
  - `node --check` passes for `main.js` plus all extracted utility modules (`identifier/scene/look/anim/carousel/export/search/routing/anim-select/rig/token/control-panel/console/search-ui/load-queue`).
  - Browser smoke capture succeeds via `python -m http.server 4173` + `npx playwright screenshot --device="Desktop Chrome" http://127.0.0.1:4173/index.html slice-028-smoke.png`.
- **Scope guard:** Verification/docs only; no runtime behavior or architecture changes.

## 2026-02-18 — Slice 029 image load utils module
- **Decision:** Extract token preview image hydration + observer helpers into `image-load-utils.js` and load it before `main.js`.
- **Why:** Continues Phase 2 helper modularization on a tightly scoped carousel image seam while preserving lazy-load behavior through fallback wiring.
- **Implementation guard:** `main.js` now consumes `window.FrienemiesImageLoadUtils` (`hydrateImageFromDataset`, `createTokenImageObserver`, `observeTokenImage`) with in-file fallback implementations.
- **Validation evidence:** `node --check` passes for `main.js` and `image-load-utils.js` after wiring updates.
- **Scope guard:** Helper extraction + script wiring only; no changes to token search semantics, routing behavior, animation/export flows, or carousel index logic.

## 2026-02-18 — Slice 030 post-slice-029 verification pass
- **Decision:** Run a verification-only slice immediately after image-load helper extraction before any further decomposition.
- **Why:** Keeps drift low by confirming carousel preview hydration and search/load surfaces still boot cleanly after observer helper extraction.
- **Validation evidence:**
  - `node --check` passes for `main.js` and all extracted utility modules, including `image-load-utils.js`.
  - Browser smoke capture succeeds via `python -m http.server 4173` + `npx playwright screenshot --device="Desktop Chrome" http://127.0.0.1:4173/index.html slice-030-smoke.png`.
- **Scope guard:** Verification/docs only; no runtime behavior changes.

## 2026-02-18 — Slice 031 mascot utils module
- **Decision:** Extract mascot panel bootstrap + emote-trigger wiring into `mascot-utils.js` and load it before `main.js`.
- **Why:** Continues Phase 2 modular decomposition on a contained mascot UI seam while preserving existing emote behavior.
- **Implementation guard:** `main.js` now consumes `window.FrienemiesMascotUtils.initMascotHook` with an in-file fallback implementation if helper loading fails.
- **Validation evidence:** `node --check` passes for `main.js`, `mascot-utils.js`, and all previously extracted utility modules.
- **Scope guard:** Helper extraction + script wiring only; no changes to token search/load/routing semantics, carousel mechanics, animation playback behavior, or export pipeline.

## 2026-02-18 — Slice 032 post-slice-031 verification pass
- **Decision:** Run an immediate verification-only slice after mascot helper extraction before starting the next queue item.
- **Why:** Keeps drift low by confirming mascot/search/control surfaces still boot cleanly after the latest module split.
- **Validation evidence:**
  - `node --check` passes for `main.js` and all extracted `*utils.js` modules, including `mascot-utils.js`.
  - Browser smoke capture succeeds via `python -m http.server 4173` + `npx playwright screenshot --device="Desktop Chrome" http://127.0.0.1:4173/index.html slice-032-smoke.png`.
- **Scope guard:** Verification/docs only; no runtime behavior, UX, or architecture changes.

## 2026-02-18 — Slice 033 core-flow verification pass
- **Decision:** Run a full core-flow QA sweep after slice-031/032 before starting additional architecture work.
- **Why:** Confirms the extracted helper set still preserves required user flows and keeps drift low before the next refactor seam.
- **Validation evidence:**
  - `node --check` passes for all runtime JS modules in repo root (`Get-ChildItem -Name *.js | ForEach-Object { node --check $_ }`).
  - API-backed runtime launched with `npx vercel dev --yes --token $VERCEL_TOKEN --listen 127.0.0.1:4174` (served at `http://127.0.0.1:4175`).
  - Primary token-ID flow verified: loading `8448` via command bar re-centered carousel window around `#8438`–`#8458`.
  - Wallet/ENS lookup verified against live API runtime by loading `vitalik.eth` (no static-host 404; search path executed with expected no-token response state).
  - Animation play exercised via mascot quick action (`Wave`) with no runtime failures.
  - `.glb` export path exercised via `Download .glb` control (`Export started — your .glb is downloading.`).
  - Mobile sanity verified by resizing active browser to `390x844` and capturing screenshot evidence (`slice-033-smoke-desktop.png` for desktop + browser mobile capture evidence).
- **Scope guard:** Verification/docs only; no runtime behavior, UX, or architecture changes.

## 2026-02-18 — Slice 034 app-state boundary plan
- **Decision:** Document current mutable state boundaries and choose `app-state-store.js` as the next no-behavior-change extraction seam.
- **Why:** The helper-module split is deep enough that state centralization is now the highest leverage step to reduce drift before any deeper refactor.
- **Validation evidence:**
  - Added `ARCHITECTURE.md` section `App state boundary map (slice-034)` enumerating current top-level mutable state buckets and ownership.
  - Added extraction plan defining Phase A (`window.FrienemiesAppStateStore.createState()` shim) and Phase B follow-up bucket modules while preserving existing function call order.
  - Updated `TODO.md` to mark slice-034 complete and queue slice-035 (`app-state-store-module`).
- **Scope guard:** Docs/planning only; no runtime code, behavior, UX, or API changes.

## 2026-02-18 � Slice 036 bottom-surface mode fix
- **Decision:** Introduce a small bottom-surface state machine (carousel | settings) and route gear interactions through it so settings reuses the carousel container footprint instead of opening as a separate overlay.
- **Why:** Eliminates bottom-surface overlap by ensuring only one bottom UI surface is visible at a time.
- **Implementation notes:** Moved #controlPanel into #carouselRegion; added .carouselRegion.is-settings CSS mode to swap carousel/settings visibility; gear now toggles settings mode on/off via setControlPanelOpen() + setBottomSurfaceMode().
- **Mascot safety:** Sauce-0x panel is now disabled by default behind ENABLE_MASCOT_PANEL = false and .mascotPanel.is-disabled, preserving reversible code paths while preventing bottom overlap.
- **Scope guard:** No animation playback, lighting preset, or console-tab behavior changes; this slice is layout/state orchestration only.

## 2026-02-18 — Slice 035 app-state-store module
- **Decision:** Add `app-state-store.js` with grouped state-bucket factory and wire `main.js` state initialization through `window.FrienemiesAppStateStore.createState()` with in-file fallback factory.
- **Why:** Establishes the no-behavior-change app-state seam defined in slice-034 while keeping runtime logic and call order intact.
- **Implementation guard:** Existing top-level mutable variables remain in `main.js`, but now hydrate from grouped store buckets (`controlShell`, `avatarRuntime`, `interactionShell`, `carouselQuery`, `dragPhysics`) so follow-up selector extraction can proceed with low drift.
- **Validation evidence:** `node --check` passes for `app-state-store.js` and `main.js`; script is loaded in `index.html` before `main.js`.
- **Scope guard:** State-factory seam + wiring only; no token search/load/routing, animation playback, carousel behavior, or export logic changes.

## 2026-02-18 — Slice 037 post-slice-036 verification pass
- **Decision:** Run an immediate verification-only slice after the app-state-store seam + bottom-surface mode fix before taking additional extraction work.
- **Why:** Confirms the latest state/layout orchestration changes did not regress high-traffic UI entry surfaces.
- **Validation evidence:**
  - `Get-ChildItem -Name *.js | ForEach-Object { node --check $_ }` passes for all root runtime modules.
  - Browser smoke capture succeeds against `http://127.0.0.1:4173/index.html` via `npx playwright screenshot --device="Desktop Chrome" ... slice-037-smoke.png`.
- **Scope guard:** Verification/docs only; no runtime behavior, UX, or architecture changes.

## 2026-02-18 — Slice 038 control-shell state helpers
- **Decision:** Extract control-shell state selectors/updaters into `control-shell-utils.js` and wire `main.js` to consume them with local fallbacks.
- **Why:** Continues the low-drift Phase 2 decomposition by isolating bottom-surface/control-panel/tab/status state normalization away from `main.js` while preserving existing UI behavior.
- **Implementation guard:** `main.js` now initializes control-shell runtime state through `getInitialControlShellState(...)` and routes updates through helper wrappers (`updateBottomSurfaceModeState`, `updateControlPanelOpenState`, `updateControlActiveTabState`, `updateStatusTextState`) with in-file fallback implementations.
- **Validation evidence:** `node --check` passes for `main.js`, `control-shell-utils.js`, and all other root `*.js` runtime modules.
- **Scope guard:** State helper extraction + script wiring only; no token search/load/routing, animation playback, carousel interaction rules, or export behavior changes.

## 2026-02-18 — Slice 039 post-slice-038 verification pass
- **Decision:** Run a verification-only slice immediately after control-shell helper extraction before taking the next UI hardening task.
- **Why:** Confirms the new control-shell state helpers did not regress core command-bar/carousel/settings/panel shells and keeps queue drift low.
- **Validation evidence:**
  - `Get-ChildItem -Name *.js | ForEach-Object { node --check $_ }` passes for all root runtime modules.
  - Browser smoke capture succeeds against `http://127.0.0.1:4173/index.html` via `npx playwright screenshot --device="Desktop Chrome" ... slice-039-smoke.png`.
- **Scope guard:** Verification/docs only; no runtime behavior, UX, or architecture changes.

## 2026-02-18 — Slice 040 export download + a11y hardening
- **Decision:** Harden GLB export UX by adding persistent in-panel export status messaging plus a retained fallback blob link (`Open saved export link`) when browser download behavior is blocked/suppressed.
- **Why:** User testing showed Chrome export flows can look like a no-op despite successful generation; explicit status + manual fallback prevents dead ends and lowers support ambiguity.
- **Decision:** Defocus focused descendants before hiding menu/sheets with `aria-hidden="true"`.
- **Why:** Prevents the accessibility warning where a focused button remains inside a hidden share panel.
- **Decision:** Intercept repeated `THREE.GLTFExporter` normalScale warning spam during export and replace it with one explanatory in-app console note after completion.
- **Why:** Warning is known/noisy in this pipeline and can confuse users into thinking export failed; reducing repetition preserves signal without changing model semantics.
- **Validation evidence:** `node --check main.js` passes; browser smoke capture saved as `slice-040-export-hardening-smoke.png`.
- **Execution note:** Smoke screenshot captured from local host `http://127.0.0.1:4180` using Playwright desktop Chrome profile.
- **Scope guard:** Focused hardening only (export feedback/fallback + panel focus stability + warning-noise handling); no token search/load, animation, routing, or bottom-surface behavior changes.

## 2026-02-18 � Slice 041 post-slice-040 verification pass
- **Decision:** Run a verification-only slice immediately after export/a11y hardening before attempting another behavior change.
- **Why:** Keeps drift low by validating that command bar, carousel/settings shell, and export affordances still boot/render cleanly after slice-040 changes.
- **Validation evidence:**
  - `Get-ChildItem -Name *.js | ForEach-Object { node --check $_ }` passes for all root runtime modules.
  - Browser smoke capture succeeds against `http://127.0.0.1:4181/index.html` via `npx playwright screenshot --device="Desktop Chrome" ... slice-041-smoke.png`.
- **Scope guard:** Verification/docs only; no runtime behavior, UX, API, or architecture changes.

## 2026-02-18 - Slice 042 core-flow verification pass
- **Decision:** Execute a full API-backed core-flow verification sweep after slice-040 hardening and subsequent slices, with verification-only scope.
- **Why:** Confirms token load, wallet/ENS lookup, animation trigger, export UX fallback, and mobile rendering remain stable before any further feature work.
- **Validation evidence:**
  - Syntax gate passed for all root runtime JS modules via `Get-ChildItem -File -Filter *.js | ForEach-Object { node --check $_ }`.
  - API runtime verified on Vercel dev using token auth: `npx vercel dev --token $VERCEL_TOKEN --yes --listen 3000` (`http://localhost:3000`).
  - Live `/api/friendsiesTokens` checks succeeded:
    - `owner=vitalik.eth` resolved ENS and returned `200` with empty token set.
    - `owner=pizzalord.eth` resolved ENS and returned `200` with populated token set including `8448`.
  - In-app token-ID load verified: entering `8448` re-centered carousel window to `#8438`-`#8458`.
  - In-app wallet/ENS flow verified: entering `pizzalord.eth` populated owned-token carousel results via live API route.
  - Animation trigger verified via quick action `Wave`.
  - `.glb` export trigger + UX fallback verified: status surfaced `Download started. If no file appears, use �Open saved export link�.` and fallback link became active (`aria-hidden="false"`) with blob URL + filename.
  - Mobile sanity verified at `390x844` after resize.
  - Smoke evidence captured as `slice-042-smoke-desktop.png` and `slice-042-smoke-mobile.png`.
- **Caveats:** Browser console showed only a benign `favicon.ico` 404 under local dev; no runtime flow errors observed.
- **Scope guard:** Verification/docs/evidence only; no feature or runtime code-path changes.

## 2026-02-18 � Slice 043 upstream sync merge
- **Decision:** Complete the in-progress origin/main merge on the UI-upgrade branch and resolve only explicit conflicts.
- **Why:** Unmerged conflicts in index.html + main.js blocked all further slice work.
- **Conflict resolution:**
  - index.html: preserve incoming Open Graph metadata and keep latest stylesheet cache bust (style.css?v=2026-02-18b).
  - main.js: preserve reset behavior that clears /fren route state while keeping shared route builder (uildCollectionPath()).
- **Validation evidence:**
  - Get-ChildItem -File -Filter *.js | ForEach-Object { node --check .Name } passed.
  - Static-host smoke succeeded after merge (python -m http.server 4182 + Playwright screenshot run).
- **Scope guard:** Merge resolution + validation only; no new feature scope.

## 2026-02-18 - Slice 044 carousel-query state helpers
- **Decision:** Extract carousel-query state normalization/update helpers into `carousel-query-utils.js` and wire `main.js` to consume helper exports with fallback implementations.
- **Why:** Continues the app-state modularization plan by isolating carousel/search/load state access paths without changing user-facing behavior.
- **Implementation guard:** `main.js` now initializes carousel-query state via `getInitialCarouselQueryState(...)` and routes token-list + field updates (`pendingTokenId`, `lastLoadedTokenId`, `activeCarouselIndex`, `suppressScrollHandler`, `scrollRafPending`) through helper wrappers that also sync `appState.carouselQuery`.
- **Validation evidence:**
  - `Get-ChildItem -File -Filter *.js | ForEach-Object { node --check $_.Name }` passed for all root runtime modules.
  - Static-host browser smoke succeeded (`python -m http.server 4183` + `npx playwright screenshot --device="Desktop Chrome" http://127.0.0.1:4183/index.html slice-044-smoke.png`).
- **Scope guard:** Helper extraction + wiring + validation only; no changes to token routing semantics, wallet/ENS search behavior, animation playback, or export pipeline.

## 2026-02-18 - Slice 045 post-slice-044 verification pass
- **Decision:** Run a verification-only slice immediately after carousel-query helper extraction before taking the next modularization task.
- **Why:** Confirms carousel/search/load shells still boot and render cleanly after state-helper wiring, keeping execution in-order with low drift.
- **Validation evidence:**
  - `node --check main.js` + `Get-ChildItem -Filter *.js | ForEach-Object { node --check $_.Name }` passed for all root runtime modules.
  - Static-host browser smoke succeeded (`python -m http.server 4173` + `npx playwright screenshot --device="Desktop Chrome" http://127.0.0.1:4173/index.html slice-045-smoke.png`).
- **Scope guard:** Verification/docs/evidence only; no runtime behavior, UX, API, or architecture changes.

## 2026-02-18 - Slice 046 drag-physics state helpers
- **Decision:** Extract drag/momentum state initialization + field update helpers into `drag-physics-utils.js` and wire `main.js` to consume helper exports with local fallbacks.
- **Why:** Continues app-state modularization by isolating pointer-drag state access paths from `main.js` without changing carousel fling behavior.
- **Implementation guard:** `main.js` now initializes drag state through `getInitialDragPhysicsState(...)` and writes drag fields through `setDragPhysicsField(...)`, which keeps `appState.dragPhysics` synchronized.
- **Validation evidence:** `Get-ChildItem -Filter *.js | ForEach-Object { node --check $_.Name }` passes for all root runtime modules, including `drag-physics-utils.js`.
- **Scope guard:** Helper extraction + script wiring only; no changes to token search/load/routing, animation playback, control-panel behavior, or export pipeline.

## 2026-02-18 - Slice 047 post-slice-046 verification pass
- **Decision:** Run a verification-only slice immediately after drag-physics helper extraction before starting the next state-helper seam.
- **Why:** Confirms carousel drag/fling surfaces still boot/render cleanly after drag-state modularization and keeps queue drift low.
- **Validation evidence:**
  - `Get-ChildItem -Filter *.js | ForEach-Object { node --check $_.Name }` passes for all root runtime modules.
  - Browser smoke check succeeds on local host (`python -m http.server 4175`) and screenshot evidence captured in `slice-047-smoke.png`.
  - In-browser drag interaction exercised against token picker surface with no runtime console errors.
- **Scope guard:** Verification/docs/evidence only; no runtime behavior, UX, API, or architecture changes.

## 2026-02-18 - Slice 048 interaction-shell state helpers
- **Decision:** Extract interaction-shell state initialization/update helpers into `interaction-shell-utils.js` and wire `main.js` to consume helper exports with local fallbacks.
- **Why:** Continues app-state modularization by isolating menu/hamburger/carousel interaction-shell state paths from `main.js` without changing user-facing behavior.
- **Implementation guard:** `main.js` now initializes interaction-shell state via `getInitialInteractionShellState(...)` and routes interaction-shell field updates through `setInteractionShellField(...)` (`menuOpen`, `activePanel`, hover flags, timers, carousel pinned/dismissed/scolling state), while preserving fallback behavior if helper loading fails.
- **Validation evidence:**
  - `Get-ChildItem -File -Filter *.js | ForEach-Object { node --check $_.Name }` passes for all root runtime modules including `interaction-shell-utils.js`.
  - Static-host browser smoke succeeded (`python -m http.server 4176` + `npx playwright screenshot --device="Desktop Chrome" http://127.0.0.1:4176/index.html slice-048-smoke.png`).
- **Scope guard:** Helper extraction + script wiring + validation only; no changes to token search/load/routing, animation playback, carousel virtual-window math, or export pipeline behavior.

## 2026-02-18 - Slice 049 post-slice-048 verification pass
- **Decision:** Run an immediate verification-only slice after interaction-shell helper extraction before starting the next state-helper/module seam.
- **Why:** Confirms menu/hamburger/carousel interaction shells still boot and render cleanly after slice-048 while keeping queue drift low.
- **Validation evidence:**
  - `Get-ChildItem -File -Filter *.js | ForEach-Object { node --check $_.Name }` passes for all root runtime modules.
  - Static-host browser smoke succeeded (`python -m http.server 4177` + `npx playwright screenshot --device="Desktop Chrome" http://127.0.0.1:4177/index.html slice-049-smoke.png`).
- **Scope guard:** Verification/docs/evidence only; no runtime behavior, UX, API, or architecture changes.

## 2026-02-18 - Slice 050 avatar-runtime state helpers
- **Decision:** Extract avatar runtime state initialization/update helpers into `avatar-runtime-utils.js` and wire `main.js` to consume helper exports with local fallbacks.
- **Why:** Continues app-state modularization by isolating avatar-load/playback state access paths from `main.js` while preserving runtime behavior.
- **Implementation guard:** `main.js` now initializes avatar runtime state via `getInitialAvatarRuntimeState(...)` and routes avatar runtime field writes (`allFriendsies`, `currentLoadId`, `loadedParts*`, `body*`, `mixer/currentAction`, face/rig fields) through `setAvatarRuntimeField(...)`, which synchronizes `appState.avatarRuntime`.
- **Validation evidence:**
  - `Get-ChildItem -File -Filter *.js | ForEach-Object { node --check $_.Name }` passed for all root runtime modules, including `avatar-runtime-utils.js`.
  - Static-host browser smoke succeeded (`python -m http.server 4178` + `npx playwright screenshot --device="Desktop Chrome" http://127.0.0.1:4178/index.html slice-050-smoke.png`).
- **Scope guard:** Helper extraction + script wiring + validation only; no changes to token routing semantics, wallet/ENS lookup behavior, animation selection semantics, or export pipeline logic.

## 2026-02-18 - Slice 051 post-slice-050 verification pass
- **Decision:** Run a verification-only slice immediately after avatar-runtime helper extraction before starting the next queue item.
- **Why:** Confirms token load/animation/export entry surfaces still boot cleanly after state-helper modularization and keeps execution drift low.
- **Validation evidence:**
  - `Get-ChildItem -File -Filter *.js | ForEach-Object { node --check $_.Name }` passes for all root runtime modules.
  - Static-host browser smoke succeeded (`python -m http.server 4179` + `npx playwright screenshot --device="Desktop Chrome" http://127.0.0.1:4179/index.html slice-051-smoke.png`).
- **Scope guard:** Verification/docs/evidence only; no runtime behavior, UX, API, or architecture changes.

## 2026-02-18 - Slice 052 core-flow verification pass
- **Decision:** Run an API-backed verification sweep after state-helper extraction through slice-050 before continuing new refactor slices.
- **Why:** Confirms token/wallet entry routes, API token resolution, and upgraded desktop/mobile surfaces still boot cleanly after the helper modularization set.
- **Validation evidence:**
  - `node --check main.js` passes.
  - API-backed runtime launched with `npx vercel dev --yes --token $VERCEL_TOKEN --listen 4175`.
  - API route check succeeded: `GET /api/friendsiesTokens?owner=0x28af3356c6aaf449d20c59d2531941ddfb94d713&contract=0xe5af63234f93afd72a8b9114803e33f6d9766956` -> `200`, `tokenCount=62`.
  - Route checks succeeded: `GET /fren/8448` and `GET /fren/vitalik.eth` both return `200` on the API-backed runtime.
  - Desktop/mobile smoke captures succeeded via Playwright CLI (`slice-052-smoke-desktop.png`, `slice-052-smoke-mobile.png`).
- **Scope guard:** Verification/docs/evidence only; no runtime behavior, UX, API contract, or architecture changes.

## 2026-02-18 - Slice 053 carousel-query state sync hardening
- **Decision:** Route the remaining carousel-query state writes (`loadDebounceTimer`, `imageObserver`, `carouselListenersBound`) through `updateCarouselQueryFieldFromUtils`.
- **Why:** Keeps `appState.carouselQuery` synchronized with runtime locals, tightening the state-store seam with no behavior change.
- **Implementation guard:** Existing timer, observer, and listener flow order remains unchanged; only assignment paths now pass through shared helper.
- **Validation evidence:**
  - `Get-ChildItem -File -Filter *.js | ForEach-Object { node --check $_.Name }` passes for all root runtime modules.
  - Static-host browser smoke succeeded (`python -m http.server 4184` + `npx playwright screenshot --device="Desktop Chrome" http://127.0.0.1:4184/index.html slice-053-smoke.png`).
- **Scope guard:** State-write path hardening only; no changes to token routing/search semantics, animation playback behavior, or export pipeline.

## 2026-02-18 - Slice 054 post-slice-053 verification pass
- **Decision:** Run an immediate verification-only slice after carousel-query sync hardening before starting the next extraction/hardening task.
- **Why:** Confirms carousel/search/load surfaces still boot and render cleanly after the state-sync adjustments while keeping execution drift low.
- **Validation evidence:**
  - `Get-ChildItem -File -Filter *.js | ForEach-Object { node --check $_.Name }` passes for all root runtime modules.
  - Static-host browser smoke succeeded (`python -m http.server 4185` + `npx playwright screenshot --device="Desktop Chrome" http://127.0.0.1:4185/index.html slice-054-smoke.png`).
- **Scope guard:** Verification/docs/evidence only; no runtime behavior, UX, API contract, or architecture changes.

## 2026-02-18 - Slice 055 post-slice-054 verification pass
- **Decision:** Run one additional verification-only slice before opening the next extraction/hardening change.
- **Why:** Preserves low-drift cadence and confirms command bar/carousel/menu/control-shell surfaces still boot cleanly after the latest verification/hardening sequence.
- **Validation evidence:**
  - `Get-ChildItem -File -Filter *.js | ForEach-Object { node --check $_.Name }` passes for all root runtime modules.
  - Static-host browser smoke succeeded (`python -m http.server 4186` + `npx playwright screenshot --device="Desktop Chrome" http://127.0.0.1:4186/index.html slice-055-smoke.png`).
- **Scope guard:** Verification/docs/evidence only; no runtime behavior, UX, API contract, or architecture changes.
