# TODO

## Active
- [x] slice-056-gpu-disposal-and-cleanup - added `avatar-cleanup-utils.js`, wired safe geometry/material/texture disposal into avatar replacement lifecycle, protected scene/global textures from accidental disposal, and added cleanup stats logging.
- [ ] slice-057-post-slice-056-verification-pass - local static browser smoke passed on 2026-05-03 (rapid token switching + animation + export + mobile sanity), but the required API-backed runtime pass is still blocked by missing Vercel/Moralis credentials and protected deployment access.

## UI Upgrade Slice Queue
- [x] slice-001-copy-unification - unify identifier copy across onboarding + Find surfaces.
- [x] slice-002-empty-loading-states - actionable search empty states + loading shimmer + reset CTAs.
- [x] slice-003-typography-tokens - add shared type-size tokens and migrate high-traffic UI labels to tokenized sizes.
- [x] slice-004-search-entry-unification - add persistent command bar as the primary token/wallet/ENS entry and route all submit paths through one search submit helper.
- [x] slice-005-onboarding-nonblocking - convert onboarding to a dismissible guide card that no longer blocks scene/menu interaction.
- [x] slice-006-verification-pass - local smoke checks completed for upgraded UI surfaces (command bar/onboarding) with no app runtime errors in local host context.
- [x] slice-007-identifier-utils-module - extract wallet/token identifier helpers into `identifier-utils.js` and wire `main.js` to consume shared helpers with fallback.

- [x] slice-008-scene-bootstrap-module - extract scene/bootstrap helpers (`initScene`, `initLighting`, `initEnvironment`) into a dedicated runtime helper file without changing behavior.

## Next up
- [x] slice-009-core-flow-verification-pass - re-run smoke checks after bootstrap extraction (`node --check`, local browser load, command bar + onboarding interactions, console error scan).
- [x] slice-010-look-utils-module - extract look-control normalization/validation/tone mapping helpers into `look-utils.js` with `main.js` fallback wiring.
- [x] slice-011-animation-utils-module - extract animation manifest normalization/select helpers into `anim-utils.js` with `main.js` fallback wiring.
- [x] slice-012-carousel-utils-module - extract carousel geometry math/helpers into `carousel-utils.js` with `main.js` fallback wiring.
- [x] slice-013-export-utils-module - extract GLB export optimization helpers into `export-utils.js` with `main.js` fallback wiring.
- [x] slice-014-human-qa-sweep - full core-flow QA in network-enabled environment completed on `npx vercel dev --yes --token $VERCEL_TOKEN` runtime (`http://127.0.0.1:4175`): token load by ID (`8448`), wallet/ENS lookup (`vitalik.eth` via `/api/friendsiesTokens`), animation trigger (`Wave`), `.glb` export trigger (`Download .glb`), and mobile sanity snapshot (`390x844`) all executed with no runtime console errors (only known `THREE.GLTFExporter` warnings).
- [x] slice-014a-local-core-flow-smoke - local static-host smoke completed for token load by ID + animation play + `.glb` export trigger; wallet/ENS path confirmed blocked by missing local API route (expected in static host).
- [x] slice-015-search-utils-module - extract primary search input normalization/token-ID parsing helpers into `search-utils.js` and wire `main.js` to consume helper exports with fallback behavior.
- [x] slice-016-routing-utils-module - extract URL owner parsing + history path builders into `routing-utils.js` and wire `main.js` to consume helper exports with fallback behavior.
- [x] slice-017-anim-select-utils-module - extract animation select orchestration helpers into `anim-select-utils.js` and wire `main.js` to consume helper exports with fallback behavior.
- [x] slice-018-rig-utils-module - extract rig bone-key normalization/map helpers into `rig-utils.js` and wire `main.js` to consume helper exports with fallback behavior.
- [x] slice-019-token-utils-module - extract Friendsies entry resolution + preview URL builder helpers into `token-utils.js` and wire `main.js` to consume helper exports with fallback behavior.
- [x] slice-020-post-extraction-verification-pass - run syntax + browser smoke checks after slices 015-019 extraction set to confirm command-bar/onboarding UI still renders without runtime errors.

## Next queue candidates
- [x] slice-024-post-slice-023-verification-pass - run syntax + browser smoke checks after console helper extraction to confirm transcript/control surfaces still render without runtime errors.
- [x] slice-021-control-panel-utils-module - extract control panel tab/anchor/visibility helpers into `control-panel-utils.js` and wire `main.js` to consume helper exports with fallback behavior.
- [x] slice-022-post-slice-021-verification-pass - run syntax + browser smoke checks after control-panel helper extraction to confirm UI control surfaces still render and interact without runtime errors.
- [x] slice-023-console-utils-module - extract transcript/console rendering helpers into `console-utils.js` and wire `main.js` to consume helper exports with fallback behavior.
- [x] slice-025-search-ui-utils-module - extract search notice/reset-visibility helpers into `search-ui-utils.js` and wire `main.js` to consume helper exports with fallback behavior.
- [x] slice-026-post-slice-025-verification-pass - run syntax + browser smoke checks after search-ui helper extraction to confirm Find/search surfaces still render without runtime errors.
- [x] slice-027-load-queue-utils-module - extract token-load request/debounce guard helpers into `load-queue-utils.js` and wire `main.js` to consume helper exports with fallback behavior.
- [x] slice-028-post-slice-027-verification-pass - run syntax + browser smoke checks after load-queue helper extraction to confirm token search/load surfaces still render without runtime errors.
- [x] slice-029-image-load-utils-module - extract token preview image hydration/observer helpers into `image-load-utils.js` and wire `main.js` to consume helper exports with fallback behavior.
- [x] slice-030-post-slice-029-verification-pass - run syntax + browser smoke checks after image-load helper extraction to confirm carousel/search surfaces still render without runtime errors.
- [x] slice-031-mascot-utils-module - extract mascot panel bootstrap/emote trigger helpers into `mascot-utils.js` and wire `main.js` to consume helper exports with fallback behavior.

## Upcoming
- [x] slice-032-post-slice-031-verification-pass - run syntax + browser smoke checks after mascot helper extraction to confirm mascot/search/control surfaces still render without runtime errors.

## Next queue candidates
- [x] slice-033-core-flow-verification-pass - run full core-flow checks (token ID load, wallet/ENS search, animation play, `.glb` export, mobile sanity) after mascot helper extraction set.

## Upcoming
- [x] slice-034-app-state-boundary-plan - document current global mutable state boundaries in `ARCHITECTURE.md` and define a no-behavior-change extraction seam (`app-state-store.js`) for centralized app-state follow-up.
- [x] slice-035-app-state-store-module - add `app-state-store.js` grouped state factory and wire `main.js` to consume it with local fallback, no behavior changes.
- [x] slice-036-bottom-surface-mode-fix - add explicit bottom-surface mode state (`carousel`/`settings`) so gear toggles a single shared bottom container (carousel vs settings), and disable Sauce-0x mascot panel by default to remove bottom overlap risk while preserving reversible code paths.
- [x] slice-037-post-slice-036-verification-pass - run syntax + browser smoke checks after bottom-surface/state-store changes to confirm command bar/carousel/settings surfaces still render without runtime errors.

## Next queue candidates
- [x] slice-038-control-shell-state-helpers - extract control-shell state selectors/updaters from `main.js` into a dedicated helper module while preserving behavior through fallback wiring.
- [x] slice-039-post-slice-038-verification-pass - run syntax + browser smoke checks after control-shell helper extraction to confirm command bar/carousel/settings/control panel surfaces still render without runtime errors.
- [x] slice-040-export-download-a11y-hardening - tighten GLB export feedback/fallback UX, suppress noisy normalScale export warnings with a single explanatory log note, and defocus active controls before setting menu/panel `aria-hidden` to prevent focused-descendant accessibility warnings.
- [x] slice-040a-proof-capture - capture local browser smoke evidence for export hardening in `slice-040-export-hardening-smoke.png`.
- [x] slice-041-post-slice-040-verification-pass - run syntax + browser smoke checks after export/a11y hardening to confirm command bar/carousel/settings/export surfaces still render without runtime errors.

## Next queue candidates
- [x] slice-042-core-flow-verification-pass - run full core-flow checks (token ID load, wallet/ENS search, animation play, `.glb` export, mobile sanity) after slice-040 hardening set.

- [x] slice-043-upstream-sync-merge - complete in-progress origin/main merge, resolve conflicts in index/main, and rerun syntax + smoke validation.
- [x] slice-044-carousel-query-state-helpers - extract carousel-query state initialization/update helpers into `carousel-query-utils.js` and wire `main.js` to consume helper exports with fallback behavior.

## Upcoming
- [x] slice-045-post-slice-044-verification-pass - run syntax + browser smoke checks after carousel-query helper extraction to confirm carousel/search/load surfaces still render without runtime errors.
- [x] slice-046-drag-physics-state-helpers - extract drag/momentum state initialization/update helpers into `drag-physics-utils.js` and wire `main.js` to consume helper exports with fallback behavior.

## Next queue candidates
- [x] slice-047-post-slice-046-verification-pass - run syntax + browser smoke checks after drag-physics helper extraction to confirm carousel drag/fling surfaces still render without runtime errors.
- [x] slice-048-interaction-shell-state-helpers - extract interaction-shell state selectors/updaters from `main.js` into a dedicated helper module while preserving behavior through fallback wiring.
- [x] slice-049-post-slice-048-verification-pass - run syntax + browser smoke checks after interaction-shell helper extraction to confirm menu/hamburger/carousel interaction shells still render without runtime errors.
- [x] slice-050-avatar-runtime-state-helpers - extract avatar runtime state initialization/update helpers into `avatar-runtime-utils.js` and wire `main.js` to consume helper exports with fallback behavior.

## Next queue candidates
- [x] slice-051-post-slice-050-verification-pass - run syntax + browser smoke checks after avatar-runtime helper extraction to confirm token load/animation/export surfaces still render without runtime errors.
- [x] slice-052-core-flow-verification-pass - rerun API-backed verification after state-helper extraction set through slice-050 (`node --check`, API route checks incl. wallet token count, desktop/mobile Playwright smoke captures) with no runtime startup errors.
- [x] slice-053-carousel-query-state-sync-hardening - route remaining carousel-query state writes (`loadDebounceTimer`, `imageObserver`, `carouselListenersBound`) through shared update helper so `appState.carouselQuery` stays synchronized.
- [x] slice-054-post-slice-053-verification-pass - run syntax + browser smoke checks after carousel-query sync hardening to confirm carousel/search/load surfaces still render without runtime errors.
- [x] slice-055-post-slice-054-verification-pass - run syntax + browser smoke checks after slice-054 verification before starting the next extraction/hardening task, confirming core UI shells still render without runtime errors.
