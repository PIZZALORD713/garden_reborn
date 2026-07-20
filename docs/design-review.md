# Design Consistency Review — fRiENEMiES Studio

**Date:** 2026-02-20
**Scope:** Full visual language audit — `style.css`, `index.html`, component patterns, design tokens

---

## Executive Summary

fRiENEMiES Studio has a **strong visual foundation**: a cohesive glassmorphism language with thoughtful CSS custom properties, consistent state classes, and solid accessibility groundwork. The design already feels premium — layered glass panels, spring-physics easing, gradient borders, and grain textures create a polished, modern aesthetic.

This review identifies **specific consistency gaps** that, once resolved, will elevate the UI from "well-designed" to "airtight design system." Several issues have already been fixed inline (see **Fixes Applied** below); the rest are cataloged as actionable next steps.

---

## What's Working Well

| Strength | Details |
|---|---|
| **Glassmorphism system** | Consistent use of `--glass-bg`, `--glass-bg-elevated`, `--glass-blur`, `--glass-shadow` across panels, cards, and overlays |
| **CSS custom properties** | Well-organized `:root` block with radius, text size, color, and easing tokens |
| **State class convention** | Clean `is-*` prefix pattern: `is-open`, `is-hidden`, `is-active`, `is-loading`, `is-error` |
| **Accessibility groundwork** | `aria-label`, `aria-hidden`, `aria-pressed`, `aria-expanded`, `role="dialog"`, `aria-live="polite"` used throughout |
| **Reduced-motion respect** | `@media (prefers-reduced-motion: reduce)` disables transitions and replaces glass with solid fallback |
| **Safe-area support** | `env(safe-area-inset-*)` for notch devices; `100dvh` for dynamic viewport height |
| **Spring easing** | `--spring` and `--ease-out-expo` give the UI a tactile, premium feel across hover/open/close transitions |
| **Inline SVG icons** | `currentColor`-inheriting, `aria-hidden="true"`, consistent `viewBox="0 0 24 24"` |
| **Onboarding card** | Gradient border ring, grain texture overlay, and dense glass — the visual crown jewel |

---

## Fixes Applied in This Review

These CSS changes have been committed directly:

### 1. Control Panel — undefined CSS variables (CRITICAL)

**Problem:** `.controlPanel` referenced `var(--glass-surface-strong)` and `blur(var(--blur-md))`, which are **not defined** anywhere in `:root`. This means the browser falls back to initial values (transparent / no blur), making the panel appear broken on some browsers.

**Fix:** Aligned to the established token system:
```css
/* Before */
background: var(--glass-surface-strong);
backdrop-filter: blur(var(--blur-md));

/* After */
background: var(--glass-bg-elevated);
backdrop-filter: var(--glass-blur);
```

### 2. Control tabs — hardcoded border-radius + missing interactivity

**Problem:** `.controlTab` used a raw `8px` border-radius (not tokenized), had no hover state, no cursor, and no transition — inconsistent with every other interactive element.

**Fix:** Added `var(--radius-sm)`, `cursor: pointer`, hover state with `background` transition, and `font-weight: 500` base weight for visual hierarchy.

### 3. Console card — hardcoded border-radius

**Problem:** `.consoleCard` used `border-radius: 12px` instead of the design token `var(--radius-sm)`.

**Fix:** Replaced with `var(--radius-sm)` for consistency.

### 4. Focus-visible states — missing entirely (ACCESSIBILITY)

**Problem:** No `:focus-visible` styles for any interactive element. Keyboard users see either the browser default (blue ring) or nothing, which is inconsistent with the premium glass aesthetic.

**Fix:** Added a unified `:focus-visible` rule for all buttons/interactive elements with a subtle dark outline, and a custom focus ring for `.searchInput` matching the onboarding input's existing focus shadow pattern.

### 5. Consolidated backdrop-filter blur values (P0)

**Problem:** Five different hardcoded blur levels used ad-hoc across components (`.fab` blur(20px), `.carouselToggle` blur(16px), `.controlGear` blur(14px), `.mascotPanel` blur(10px), everything else `var(--glass-blur)` blur(12px)).

**Fix:** Defined a two-tier blur system:
```css
--glass-blur: blur(12px) saturate(1.2);        /* default — carousel, menu, sheets, gear, mascot */
--glass-blur-strong: blur(18px) saturate(1.3);  /* elevated — FAB, onboarding card */
```
All five hardcoded `backdrop-filter` declarations migrated to `var(--glass-blur)` or `var(--glass-blur-strong)`. Mobile `blur(8px)` left as a performance-specific override inside the `@media (max-width: 720px)` rule.

### 6. Standardized animation timing tokens (P0)

**Problem:** Transitions used 10+ different durations (150ms, 160ms, 180ms, 200ms, 220ms, 250ms, 260ms, 300ms, 350ms, 400ms), creating subtle visual discord when multiple elements animate together.

**Fix:** Defined three duration tokens:
```css
--duration-fast: 150ms;   /* micro-interactions: hover, focus, bg changes */
--duration-md: 250ms;     /* reveals: menus, panels, cards, onboarding */
--duration-slow: 400ms;   /* major transitions: carousel region, glassCarousel, toggle fade */
```
All transition/animation durations migrated. Menu icon stagger delays (40ms/100ms/160ms) left as-is since they are choreographic offsets, not transition durations.

### 7. Created z-index layer map (P0)

**Problem:** Z-indices scattered as magic numbers with no documented layering system.

**Fix:** Defined named z-index tokens in `:root`:
```css
--z-base: 1;        /* .ui */
--z-carousel: 5;    /* .carouselRegion, .studioBadge */
--z-menu: 6;        /* .menuStack */
--z-sheet: 7;       /* .sheet */
--z-command: 8;     /* .commandBar */
--z-overlay: 14;    /* .onboarding */
--z-gear: 16;       /* .controlGear */
--z-mascot: 18;     /* .mascotPanel */
--z-modal: 24;      /* .consoleModal */
```
All global z-index values migrated. `z-index: 0` (`.ui::before`) and local stacking contexts within the onboarding card (z-index: -1, 1, 2) left as raw numbers since they are component-scoped.

---

## Remaining Action Points

Ranked by impact (visual consistency x user experience):

### P1 — Improve Next

#### 4. Unify the `<select>` element styling
The `<select>` elements (`.searchInput` class on `<select>`) inherit text input styling but lack custom appearance treatment. On different browsers/OS this creates visual inconsistency — native dropdowns break the glass aesthetic.

**Recommendation:** Add a `select.searchInput` override with:
- `appearance: none` + custom chevron via `background-image`
- Matching padding/radius to text inputs
- Consistent font size (currently `--text-xl` for search, `--text-sm` for onboarding anim select)

#### 5. Replace carousel toggle emoji with SVG icon
The carousel toggle uses `&#9729;` (cloud emoji), which renders differently across OS/browser and can't be styled. Every other interactive element uses inline SVGs with `currentColor`.

**Recommendation:** Replace with an inline SVG chevron or grid icon, matching the `.menuIcon` pattern.

#### 6. Normalize box-shadow tiers
Three shadow variables are defined but only `--glass-shadow` is widely used. Many components use ad-hoc shadows:

```css
/* Inconsistent: 7+ unique shadow values */
0 4px 16px rgba(14, 20, 42, 0.08)   /* menuIcon, default */
0 4px 18px rgba(14, 20, 42, 0.10)   /* carouselToggle */
0 4px 18px rgba(14, 20, 42, 0.12)   /* controlGear */
0 6px 22px rgba(14, 20, 42, 0.08)   /* tokenCard */
0 6px 22px rgba(14, 20, 42, 0.14)   /* carouselToggle hover */
0 10px 24px rgba(14, 20, 42, 0.12)  /* mascotPanel */
0 10px 28px rgba(14, 20, 42, 0.15)  /* tokenCard active */
```

**Recommendation:** Consolidate to the 3 existing tiers:
- `--glass-shadow` (resting)
- `--glass-shadow-elevated` (hover/active)
- `--glass-shadow-wide` (modal/onboarding)

#### 7. Add hover/active to mascot action buttons
`.mascotAction` buttons extend `.sheetAction` but the mascot panel itself has no hover state on `.mascotToggle`. This is the only toggle-style button without a hover transition.

**Recommendation:** Add:
```css
.mascotToggle {
  transition: background 150ms ease;
}
.mascotToggle:hover {
  background: rgba(255, 255, 255, 0.85);
}
```

### P2 — Polish

#### 8. Unify mobile breakpoints
Two breakpoints exist: `720px` (main) and `780px` (control panel only). This creates a 60px range where the control panel has different behavior than the rest of the UI.

**Recommendation:** Consolidate to a single `--bp-mobile: 720px` breakpoint (using custom media queries or a single value), or if the 780px breakpoint is intentional for larger controls, document it.

#### 9. Standardize white-opacity glass backgrounds
The glass background opacity values form no clear scale:

```
0.38 (--glass-bg)
0.40 (tokenCard)
0.42 (carouselToggle, quickstart)
0.44 (controlGear)
0.45 (glassCarousel, menuIcon)
0.50 (sheetAction)
0.55 (--glass-bg-elevated, onboardingTile, tokenImageWrap)
0.60 (onboardingSearchInput, tokenCard hover)
0.62 (studioBadge)
0.65 (mascotToggle)
0.72 (commandBar, carouselToggle pinned, mascotPanel, tokenCard active)
0.88 (onboardingCard)
```

**Recommendation:** Define a glass opacity scale:
```css
--glass-opacity-subtle: 0.38;    /* background, resting */
--glass-opacity-medium: 0.55;    /* elevated surfaces */
--glass-opacity-strong: 0.72;    /* interactive surfaces, hover */
--glass-opacity-dense: 0.88;     /* modal cards, overlays */
```

#### 10. Add transition to `.sheetStatus` color changes
Status messages (`.is-warn`, `.is-ok`) snap instantly between colors. A subtle `color 200ms ease` transition would smooth the feedback.

---

## Suggestions for Future Upgrades

### Near-term (Next Sprint)

1. **Dark mode support** — The glassmorphism system is ideal for a dark variant. Add `@media (prefers-color-scheme: dark)` or a `[data-theme="dark"]` toggle that inverts the glass colors to `rgba(0, 0, 0, 0.3-0.7)` with light text.

2. **Skeleton loading states** — The shimmer animation is defined but underutilized. Token cards, the onboarding card, and the control panel could show skeleton placeholders during initial load with the existing `@keyframes shimmer`.

3. **Micro-interaction refinement** — Add subtle `transform: scale(0.97)` press feedback on all buttons (currently only onboarding and carousel toggle have `:active` states). This creates a consistent "touchable" feel.

4. **Toast/notification system** — Currently status feedback is scattered across `.sheetStatus`, `.searchNotice`, and inline text. A unified toast component positioned at the bottom of the viewport would centralize all transient feedback.

### Medium-term (Next Quarter)

5. **Animation choreography** — When opening the menu, stagger the sheet panel reveal to follow the icon cascade (currently icons stagger at 40ms/100ms/160ms but the sheet appears independently). Coordinated motion creates a premium feel.

6. **Scroll-linked effects** — The carousel could benefit from scroll-linked parallax on token cards (slight rotation or scale based on scroll position) using `IntersectionObserver` or scroll-driven animations.

7. **Custom select dropdowns** — Replace native `<select>` with a custom glass dropdown component that matches the sheet panel visual language. This eliminates the last browser-native UI element that breaks the aesthetic.

8. **Touch gesture vocabulary** — The carousel has excellent drag physics. Extending gesture support (swipe-up to pin, swipe-down to dismiss, long-press for preview) would enhance mobile UX.

### Long-term (Next Major)

9. **Design token extraction** — Export the CSS variable system to a `tokens.json` file (following the Design Tokens Community Group format). This enables future consumption by design tools (Figma), documentation generators, or alternative frontends.

10. **CSS Container Queries** — Replace the viewport-based `@media` breakpoints with `@container` queries on `.carouselRegion`, `.menuStack`, and `.controlPanel`. This makes components responsive to their own size rather than the viewport, improving embeddability.

11. **View Transitions API** — For token switching (loading a new character), use the View Transitions API to create a smooth cross-fade between the old and new 3D scene state, tying into the CSS animation system.

12. **Color theming** — Extend the gradient accent system to support user-selectable accent colors (e.g., warm/cool/neon palettes) by swapping the gradient endpoint HSL values via CSS custom properties.

---

## Design System Health Score

| Category | Score | Notes |
|---|---|---|
| Color consistency | 8/10 | Strong token usage; minor opacity sprawl |
| Typography | 9/10 | Well-tokenized; one off-system size (`22px` onboarding title, `15px` onboarding input) |
| Spacing | 7/10 | Consistent patterns but not tokenized into a scale |
| Border radius | 8/10 | Tokens defined and mostly used; a few hardcoded values remain |
| Shadows | 6/10 | 3 tokens defined but 7+ inline overrides |
| Animation/Motion | 9/10 | Easing + duration tokens; 3-tier system covers all transitions |
| Backdrop blur | 9/10 | 2-tier token system; only mobile perf override remains hardcoded |
| Accessibility | 8/10 | ARIA coverage is strong; focus-visible now added; keyboard nav could improve |
| Responsive | 8/10 | Clean mobile breakpoint; safe-area support; dual breakpoint minor issue |
| Component consistency | 7/10 | Strong patterns; a few outliers (emoji toggle, select styling, mascot) |
| **Overall** | **8.0/10** | Strong design system; P1 shadow + select work will push toward 9+ |

---

## Files Changed

- `style.css` — Fixed undefined CSS variables, added focus-visible states, improved control tab interactivity, tokenized console card radius, consolidated blur to 2-tier system, standardized durations to 3 tokens, created z-index layer map
- `docs/design-review.md` — This file (new)
