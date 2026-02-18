# TODO

## UI Upgrade Slice Queue
- [x] slice-001-copy-unification — unify identifier copy across onboarding + Find surfaces.
- [x] slice-002-empty-loading-states — actionable search empty states + loading shimmer + reset CTAs.
- [x] slice-003-typography-tokens — add shared type-size tokens and migrate high-traffic UI labels to tokenized sizes.
- [x] slice-004-search-entry-unification — add persistent command bar as the primary token/wallet/ENS entry and route all submit paths through one search submit helper.
- [x] slice-005-onboarding-nonblocking — convert onboarding to a dismissible guide card that no longer blocks scene/menu interaction.
- [x] slice-006-verification-pass — local smoke checks completed for upgraded UI surfaces (command bar/onboarding) with no app runtime errors in local host context.
- [x] slice-007-identifier-utils-module — extract wallet/token identifier helpers into `identifier-utils.js` and wire `main.js` to consume shared helpers with fallback.

- [x] slice-008-scene-bootstrap-module — extract scene/bootstrap helpers (`initScene`, `initLighting`, `initEnvironment`) into a dedicated runtime helper file without changing behavior.

## Next up
- [x] slice-009-core-flow-verification-pass — re-run smoke checks after bootstrap extraction (`node --check`, local browser load, command bar + onboarding interactions, console error scan).
- [x] slice-010-look-utils-module — extract look-control normalization/validation/tone mapping helpers into `look-utils.js` with `main.js` fallback wiring.
- [x] slice-011-animation-utils-module — extract animation manifest normalization/select helpers into `anim-utils.js` with `main.js` fallback wiring.
- [x] slice-012-carousel-utils-module — extract carousel geometry math/helpers into `carousel-utils.js` with `main.js` fallback wiring.
- [x] slice-013-export-utils-module — extract GLB export optimization helpers into `export-utils.js` with `main.js` fallback wiring.
- [x] slice-014-human-qa-sweep — full core-flow QA in network-enabled environment completed on `npx vercel dev --yes --token $VERCEL_TOKEN` runtime (`http://127.0.0.1:4175`): token load by ID (`8448`), wallet/ENS lookup (`vitalik.eth` via `/api/friendsiesTokens`), animation trigger (`Wave`), `.glb` export trigger (`Download .glb`), and mobile sanity snapshot (`390x844`) all executed with no runtime console errors (only known `THREE.GLTFExporter` warnings).
- [x] slice-014a-local-core-flow-smoke — local static-host smoke completed for token load by ID + animation play + `.glb` export trigger; wallet/ENS path confirmed blocked by missing local API route (expected in static host).
- [x] slice-015-search-utils-module — extract primary search input normalization/token-ID parsing helpers into `search-utils.js` and wire `main.js` to consume helper exports with fallback behavior.
