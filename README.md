# fRiENDSiES Three.js Viewer + Mixamo Animation Test (Face Overlay)

This project loads a full fRiENDSiES character (body + head + traits) from trait metadata,
re-binds all trait meshes to a single “master” skeleton (the BODY rig), and plays either:

- the body’s default animation clip (if present), or
- an external Mixamo GLB animation (retargeted / sanitized for safety)

It also creates a **face/vibe overlay** mesh using the face PNG trait, intended to stay glued
to the animated head without lag.

---

## Minimalist mode (default)

The UI now boots in a minimalist mode by default so the viewer does not depend on legacy tool surfaces.

- `FEATURE_WALLET_UI = false` keeps wallet lookup UI wiring off (no automatic `/api/friendsiesTokens` call on default boot).
- `FEATURE_ANIM_UI = false` keeps animation control wiring off.
- `FEATURE_DEBUG_LOG = false` keeps transcript/look/export/debug wiring off.

To re-enable those surfaces, flip the flags at the top of `main.js` to `true`.

---

## Features

- ✅ Load fRiENDSiES by token ID (1–10000)
- ✅ Random token loader
- ✅ Load external animation GLB (Mixamo-style)
- ✅ “Safe Mode” animation sanitization (strip risky transforms)
- ✅ Optional “Freeze bone positions (except hips)” stability mode
- ✅ Skinned face overlay (face PNG applied to head mesh targets)
- ✅ Debug tools:
  - Print Trait URLs
  - Print Rig Bones

---

## Versions / Dependencies (important)

This is pinned to **Three.js r128** + matching r128 examples scripts:

- three.min.js r128
- GLTFLoader.js (0.128.0)
- DRACOLoader.js (0.128.0)
- OrbitControls.js (0.128.0)

⚠️ Do not mix Three.js versions (ex: r150 loader with r128 core) or you’ll get subtle skeleton/animation issues.

---

## Local run (Windows)

1) Open **Developer Command Prompt for VS** (or another Windows dev shell).
2) From the repo root, run:
   - `npx serve .`
3) Open: `http://localhost:3000/`

---

## How it works (high-level)

### 1) Metadata → Trait URLs
We fetch a JSON metadata index (`METADATA_URL`) and find the token entry by ID.
Each token has `attributes[]` with `trait_type`, `value`, and `asset_url`.

We treat:
- `body` as the master rig source
- `head` as the main head geometry
- `face` as a PNG texture that becomes the face/vibe overlay

### 2) BODY loads first (master skeleton)
We load the BODY GLB and grab its first `SkinnedMesh` as the skeleton source:

- `bodySkinned = findFirstSkinnedMesh(bodyRoot)`
- `bodySkeleton = bodySkinned.skeleton`

We also record:
- the raw name of the hips bone (`hipsRawName`)
- the rest position of each bone (for “freeze positions” mode)

### 3) Other parts get rebound to the BODY skeleton
Each trait GLB may ship with its own armature. We don’t want multiple rigs.

We traverse each part scene and for every `SkinnedMesh`, we call:

- `o.bind(bodySkeleton, bindMatrix)`

This forces that mesh to deform from the BODY bones.

### 4) Animation pipeline
We create one `AnimationMixer` on the BODY root.

When we load a clip, we run `sanitizeClip()`:
- Always strips `.scale` tracks
- In Safe Mode:
  - strips `.position` tracks for all bones
  - optionally allows hips translation

In “Freeze bone positions” mode we reset bone positions every frame (except hips if allowed).
This reduces drift / collapse for incompatible Mixamo clips.

### 5) Face overlay (intended behavior)
We load the `face` PNG trait and build a transparent material.
Then we find likely head “targets” (names or material names containing: face/vibe/eyes/mask/decal).

For each target mesh we create an overlay mesh with the face material.

Goal: overlay should move with the animated head with no lag.

---

## Common issue: “face/vibe doesn’t follow the head bone”

### Why it happens
Some face/vibe pieces in the head GLB are **not skinned**.
They are simple `Mesh` nodes parented under the head-part’s original bones.

This project rebinds **SkinnedMesh** objects to the BODY skeleton, but plain meshes can remain
attached to the head-part’s old bones — which are no longer animated.

Result:
- head skinned geometry animates ✅
- face/vibe rigid meshes stay behind / don’t follow ❌

### Fix
Retarget rigid attachments to BODY bones:

- find any `Mesh` with a **bone ancestor** in the part scene
- map that ancestor bone name to the BODY skeleton bone
- re-parent while preserving world transform

(Implementation lives in: `retargetRigidAttachmentsToBodyBones(partScene)`)

---

## Debug checklist

1) Click **Print Rig Bones**
   - confirm you have a `head` / `neck` bone key in the output

2) In console, inspect face overlay targets:
   - `🎭 Face overlay targets: [...]`
   - confirm the targets are actually the head meshes you expect

3) For a target that fails, log:
   - `src.isSkinnedMesh`
   - `src.parent?.isBone`
   - `src.geometry.attributes.skinIndex` + `skinWeight`

If:
- `isSkinnedMesh = false` AND `parent.isBone = true`
→ you must retarget rigid attachments (or convert it to SkinnedMesh if it has skin attributes).

---

## UI Controls

- **Safe Mode**: strips bone translation tracks (except hips optionally)
- **Freeze bone positions (except hips)**: resets bone positions each frame for stability
- **Allow hips translation**: lets Mixamo locomotion translate hips
- **Bob (group)**: applies a lightweight idle bob to the whole avatar group
- **OrbitControls + Auto-rotate**: camera debug controls

---

## Notes / Next improvements

- Add `SkeletonUtils.attach()` (Three.js examples) for cleaner re-parenting logic
- Smarter head target selection (use material tags or known node names)
- Clip retargeting by normalized bone names (Mixamo ↔ fRiENDSiES)
- Optional eye/mouth decals as separate overlays (layered renderOrder)

---

## Delivery constraints & UI component map (static DOM/CSS)

### ✅ Chosen path: **A) Vanilla HTML/JS/CSS**

**Why:** the project is already a static site with plain `index.html` + `style.css` + `main.js`, no Node tooling,
and runtime dependencies are delivered via CDN script tags. This makes it a good fit for static hosting and
does not require a build step or bundler. Keeping it vanilla preserves the current deploy model (drop-in files
served by any static host) while still allowing a component-like structure via DOM + CSS class conventions.

### Current delivery constraints (audit)

- **Static host friendly:** No `package.json`, no build output, and `index.html` loads Three.js + loaders from CDN.
- **Assets are file-based:** PNG/EXR assets are referenced by relative URLs in `main.js`.
- **Single entrypoint:** `index.html` + `main.js` are the only runtime entrypoints; everything else is CSS/asset files.
- **Implication:** Introducing a bundler (Vite/React) would require new build scripts, build outputs, and HTML
  adjustments. Since the existing UI is already DOM-driven, a component map can be implemented without changing
  the delivery pipeline.

### DOM-based component map (mirrors existing UI)

The following “components” are DOM sections + CSS classes already in use. This keeps the current structure and
lets you treat each block as a reusable, documented component.

1. **`AppShell`**
   - **DOM:** `#ui` wrapper + `canvas` (appended in `main.js`)
   - **Purpose:** layout root for UI overlay + WebGL canvas.
   - **Key styles:** `#ui`, `html, body`, `canvas`

2. **`UiToggleButton`**
   - **DOM:** `button#uiToggleBtn.uiToggle` + SVG icon
   - **Purpose:** toggles UI visibility (controls + transcript).
   - **Key styles:** `.uiToggle`, `#ui.uiHidden .panel`, `#ui.uiHidden .logPanel`
   - **Behavior:** controlled in `main.js` (UI toggle + hotkey).

3. **`ControlPanel`**
   - **DOM:** `div#panel.panel`
   - **Purpose:** contains header + all main controls.
   - **Key styles:** `.panel`, `.panelHeader`, `.brand`, `.status`

4. **`BrandHeader`**
   - **DOM:** `.panelHeader` → `.brand`, `.logo`, `.brandText`, `.title`, `.subtitle`
   - **Purpose:** brand identity + status label.
   - **Key styles:** `.brand`, `.logo`, `.title`, `.subtitle`, `.status`

5. **`PrimaryControlsRow`**
   - **DOM:** `.row` containing `#friendsiesId`, `#loadBtn`, `#randomBtn`, `#autoRandomOn`
   - **Purpose:** token selection + load/random actions.
   - **Key styles:** `.row`, `.pill`, `.pillLabel`, `.btn`, `.chip`

6. **`AnimationControlsRow`**
   - **DOM:** `.row` containing `#animSelect`, `#playBtn`, `#stopBtn`, `#orbitOn`, `#autoRotateOn`
   - **Purpose:** animation/controls toggles.
   - **Key styles:** `.row`, `.pill.wide`, `.btn.primary`, `.btn.danger`, `.chip`

7. **`LookTuningPanel`**
   - **DOM:** `#lookPanel.lookPanel` with `#lookToggleBtn.panelToggle` and `#lookControls.lookControls`
   - **Purpose:** collapsible look/lighting controls + sliders + copy action.
   - **Key styles:** `.lookPanel`, `.panelToggle`, `.panelChevron`, `.lookControls`, `.sliderRow`, `.lookActions`

8. **`DebugRow`**
   - **DOM:** `.row.tiny` with `#printTraitsBtn`, `#printRigBtn`, and `.hintText`
   - **Purpose:** dev helpers and hotkey hints.
   - **Key styles:** `.row.tiny`, `.btn`, `.hintText`

9. **`TranscriptPanel`**
   - **DOM:** `#logPanel.logPanel` with `.logHeader`, `#logToggleBtn`, `#log`, `.logLine`
   - **Purpose:** console-style transcript output with collapse control.
   - **Key styles:** `.logPanel`, `.logHeader`, `.logTitle`, `.iconBtn`, `.log`
   - **Behavior:** collapse state controlled in `main.js` (`#ui.logCollapsed`).

> If you ever decide to migrate to React/Vite, each item above can become a component with the same class
> names to preserve styling. For now, the DOM map documents the structure without changing the delivery model.
