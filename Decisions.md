# Decisions

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
