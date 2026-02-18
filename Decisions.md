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
