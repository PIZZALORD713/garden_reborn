# Decisions

## 2026-02-17 — Slice 001 copy unification
- **Decision:** Standardize search wording everywhere user enters identifiers to: "token ID, wallet address, or ENS name."
- **Why:** Removes mixed phrasing ("wallet/ENS", "Wallet / ENS", etc.) and makes onboarding/find language consistent.
- **Scope guard:** Copy-only updates in onboarding + Find sheet + one related search empty message; no behavior changes.

## 2026-02-17 — Slice 002 empty/loading states
- **Decision:** Replace plain text search feedback with structured status cards (info/warn/loading), add shimmer on wallet lookup, and include a reset CTA where users can recover quickly.
- **Why:** Search-fail and no-token moments now tell users exactly what to do next instead of dead-ending.
- **Scope guard:** Limited to Find feedback + carousel empty-state card visuals/CTAs; no token-loading logic or route behavior changes.
