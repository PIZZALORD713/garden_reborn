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
