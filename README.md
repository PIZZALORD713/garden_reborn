# fRiENEMiES Studio

View • Animate • Export for fRiENDSiES.

Load by token or wallet/ENS, preview animations, and export rig-ready GLB.
No wallet connect required.

---

## Current State (as-built)

This repo currently ships a **vanilla static Three.js app** (no bundler, no package.json) with:

- Token browsing + direct token load
- Wallet/ENS holder lookup via `/api/friendsiesTokens`
- Route support for holder pages (`/{ens}` or `/0x...`) via `vercel.json`
- Character assembly from trait metadata
- BODY-first skeleton binding for cross-part animation consistency
- Rigid attachment retargeting to BODY bones
- Face overlay/decal handling
- Look presets + mobile-friendly lighting behavior
- Animation support + safer track sanitation
- GLB export path with compatibility post-processing

Tech/runtime:

- Three.js `r128` + matching examples loaders/exporter
- Static frontend: `index.html`, `main.js`, `style.css`
- Serverless API: `api/friendsiesTokens.js` (Moralis-backed holder lookup)

---

## Quickstart (local)

```bash
npx serve .
```

Open:

- `http://localhost:3000/`

Optional route tests:

- `http://localhost:3000/pizzalord.eth`
- `http://localhost:3000/0x28af3356c6aaf449d20c59d2531941ddfb94d713`

---

## Product UX (current)

### Try it in 4 steps

1. Token ID → load avatar
2. Wallet/ENS → resolve holder tokens
3. Select animation / vibe preset
4. Export → `.glb`

### Primary user paths

- **Token mode**: direct token access
- **Wallet/ENS mode**: load a holder collection view
- **Share mode**: copy link
- **Export mode**: download GLB for downstream use

---

## API

### `GET /api/friendsiesTokens`

Query params:

- `owner` (required): `0x...` address or `.eth`
- `chain` (currently `eth`)
- `contract` (Friendsies ERC-721 contract)

Returns:

- `ownerInput`, `ownerResolved`
- `tokenIds[]`, `tokenCount`
- `fetchedAt`

Environment:

- `MORALIS_API_KEY` (required in deployment)

---

## Deploy

Designed for static hosting + serverless API.

- Frontend: static files
- API: `api/friendsiesTokens.js`
- Rewrites: `vercel.json` supports owner routes to `index.html`

---

## Launch Hygiene Pass (next recommended changes)

Based on current direction, this is the next priority sequence:

1. **Rename/copy sweep**
   - Remove remaining “Toy Box” language in UI and code comments
   - Standardize name to **fRiENEMiES Studio**
   - Add concise one-line product descriptor in UI

2. **Idiot-proof first-run flow**
   - Clear token input examples
   - Explicit wallet/ENS labeling
   - Friendly invalid ENS and loading states
   - Visible “share this holder page” affordance

3. **Proof-it’s-real repo polish**
   - Add screenshot/GIF in README
   - Add live demo URL block
   - Add concise roadmap
   - Add CONTRIBUTING + help-wanted issues

4. **Social cards / OG polish**
   - Proper Open Graph title/description/image
   - Product favicon cleanup

5. **Credibility anchors**
   - Add changelog/release notes (`v0.1` style)
   - Pin high-value help-wanted issues

---

## Suggested Short Roadmap

- Viewer polish (loading/error states + UX clarity)
- Wallet/ENS flow hardening
- Export validation pipeline improvements
- Animation library + retarget reliability
- Game-ready skills framework for fRiENEMiES assets

---

## Contributing (quick)

PRs welcome. Best first areas:

- UI copy and interaction polish
- Wallet/ENS edge case handling
- Export validation + test fixtures
- Animation retargeting quality

If you’re opening a PR, include:

- What changed
- Why it matters
- Before/after screenshots or short clip for UI changes
