# fRiENEMiES.xyz — UI/UX Upgrade Prep (Synthesized Notes)

Date: 2026-02-17  
Owner: Pizza / fRiENEMiES crew  
Source: Internal synthesis of Claude notes + current live site behavior

---

## 1) Site Snapshot (Current State)

**fRiENEMiES Studio** is a vanilla JS single-page app (no framework/build step) that:
- Loads and renders Friendsies avatars in a Three.js scene
- Lets users browse token cards (virtualized carousel across full collection)
- Supports token lookup by token ID, wallet address, and ENS
- Previews animations
- Applies visual lighting/style presets
- Exports rig-ready `.glb` files
- Uses Vercel + serverless API for wallet token resolution

**Core product promise:** _Load • Preview • Export_ with no wallet connection required.

---

## 2) Functional System Map (High-Level)

The app is currently concentrated in `main.js` (~3.7k lines, ~108 functions), with this architecture:

### A) 3D Scene Foundation
- Scene/camera/renderer/bootstrap
- Lighting rig + environment map pipeline
- Loader setup (GLTF/DRACO/textures)

### B) Routing / URL / Deep-Linking
- `/fren/<token>` parsing and navigation
- Wallet + ENS recognition
- URL/meta updates for shareability + SEO

### C) Look Controls / Rendering Style
- Tone mapping + material defaults
- Preset application (Cinematic / Punchy Studio / Soft Pastel)
- Runtime updates to light/material parameters

### D) UI State / Control Surfaces
- Control panel tabs (Animations, Lighting/Scene, Console)
- Status + console log buffer and viewer
- Panel open/close/visibility orchestration

### E) Avatar Assembly / Rigging / Retargeting
- GLB + texture helpers
- Bone maps, rebind/reparent helpers
- Face overlay generation and cleanup
- Animation clip sanitation

### F) Export / Optimization Pipeline
- GLB parsing/rebuild
- Texture bake + decal workflows
- Sampler/skin dedupe and cleanup
- Windows-viewer optimization pass

### G) Token Search + Loading
- Search handlers (token, wallet, ENS)
- Debounced loading requests
- Wallet token fetch + collection scoping

### H) Carousel System
- Virtual rendering window + spacers
- Drag/momentum/scroll index math
- Active card sync to token load
- Pin/toggle/auto-hide behavior

### I) Menus / Onboarding / Panels
- Hamburger + sheets (Find, Share, Vibe, Info)
- Onboarding modal flow + demo path
- Collection reset + onboarding recall

### J) Boot + Render Loop
- App initialization IIFE
- Animation/render tick loop

---

## 3) UI Inventory (Current Surface)

### Visual hierarchy
1. **Canvas** (full-screen Three.js stage)
2. **Bottom region:** token carousel + pin/toggle controls
3. **Right-side controls:** gear + tabbed control panel
4. **Top-right utility:** hamburger + icon menu + slide-up sheets
5. **Modal layers:** onboarding (z-20), console modal (z-24)

### Primary user actions currently exposed
- Load token by carousel click
- Search token/wallet/ENS
- Choose animation and play
- Pick look preset
- Copy link
- Download `.glb`
- Open onboarding/help/about

### Design language in use
- Glassmorphism-heavy panels
- Soft gradients + translucent cards
- Rounded/pill controls
- Motion-focused easing/spring effects

---

## 4) Friction + Opportunity (Synthesized)

### Structural friction
- `main.js` is very large and multi-concern; changes are harder to isolate and test.
- Global mutable state is spread across many `let` vars, increasing coupling risk.

### UX friction
- Entry points are fragmented (onboarding input vs Find sheet vs carousel interaction).
- Onboarding is blocking; it slows users who already know what they want.
- Carousel visibility model is complex (idle hide + pin + toggle), causing discoverability tax.
- Empty/search-fail states are underdeveloped.

### Visual coherence friction
- Multiple glass intensities and spacing scales create inconsistency.
- Typographic sizing lacks strict token scale.
- Active token context in the main scene could be clearer.

### Performance friction
- Heavy monolithic script loaded up front.
- Export and advanced systems are bundled into initial runtime.

---

## 5) Upgrade Backlog (Prioritized)

## Phase 0 — Fast Wins (1–2 days)
1. **Unify search UX copy + behavior**
   - Make one canonical search language across onboarding/find/input placeholders.
2. **Improve empty states**
   - Add actionable suggestions + reset CTA when no token results.
3. **Loading polish**
   - Add shimmer/skeleton for token thumbnails and key panel states.
4. **Tighten typography tokens**
   - Standardize to named sizes (`--text-xs/sm/md/lg/xl`).

## Phase 1 — UX Cohesion (3–5 days)
1. **Single primary command bar**
   - One obvious place to load token/wallet/ENS.
2. **Simplify carousel behavior**
   - Reduce state complexity (prefer always-on or one explicit toggle model).
3. **Make onboarding non-blocking**
   - Convert modal to guided overlay or first-run coachmarks.
4. **Strengthen active token context**
   - Persist visible token ID + state badge near scene controls.

## Phase 2 — Architecture Refactor (1–2 weeks)
1. **Split `main.js` into ES modules**
   - Suggested boundaries: `scene`, `routing`, `carousel`, `ui`, `export`, `look-controls`, `avatar`.
2. **Centralize app state**
   - Single state object + predictable update paths/events.
3. **Deduplicate duplicate UI actions**
   - One source of truth for lighting preset controls and action handlers.

## Phase 3 — Premium Features (post-stabilization)
1. Trait inspector panel
2. Animation timeline/scrubber controls
3. Side-by-side token comparison mode
4. Shareable full-state URLs (token + anim + camera + look)

---

## 6) Recommended First Build Sprint (What to do next)

**Sprint focus:** _"Cohesive Input + Cleaner Navigation"_

Deliverables:
- Unified search command bar
- Non-blocking onboarding flow
- Simplified carousel visibility model
- Better empty/loading states

Done criteria:
- New users can load first token in <10 seconds
- Returning users can jump directly to token/wallet without modal friction
- Mobile interaction feels reachable and obvious
- Visual style reads as one coherent system (not mixed component eras)

---

## 7) Working Notes for Upcoming Dictation Session

When defining each UI change, specify:
1. **Area** (e.g. onboarding header, search row, mobile nav)
2. **Exact change** (text, spacing, behavior, style token)
3. **Intent** (conversion, clarity, speed, aesthetic)
4. **Acceptance check** (how we know it’s correct)

Template:

```md
- Area:
- Change:
- Intent:
- Acceptance check:
```

This keeps implementation fast and avoids design drift.
