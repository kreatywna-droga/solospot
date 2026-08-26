# S29 Architecture Specification — Layout Constraints & Auto Layout

> **Subsystem:** Authoring Studio — Layout Constraints & Auto Layout Subsystem (Sprint S29)
> **Author:** Senior Architect & Lead Engineer
> **Status:** APPROVED & FROZEN FOR S29 IMPLEMENTATION
> **Dependencies:** `builder-core` (`BuilderDocument`, `HistoryStack`), Sprint S28 Responsive Subsystem (`../../responsive`)

---

## 1. Executive Summary & Objective

Sprint S29 introduces a **deterministic, pure-domain layout engine** that answers the single question:

> "Gdzie i jak duży powinien być element?"

S29 **does not render**. It produces plain layout data (`LayoutRect[]`) that the existing RenderingEngine (Sprint S19/S20 modules: `src/rendering/`) may consume later. No second Renderer, no second Camera, no second HistoryStack, no second Scheduler.

### Why S29 exists

- S28 answers: "how do property values change across devices".
- S29 answers: "how do elements physically arrange given those values".
- S30 may then add Inspector UX, and S31 a Preview, **without rebuilding the layout foundation**.

---

## 2. Architecture Flow

```
                 BuilderDocument
                       │
                       ▼
              ┌─────────────────┐
              │ S28 Responsive  │   (BreakpointRegistry + resolveEffectiveNodeProperty)
              │ Value Resolution│
              └────────┬────────┘
                       │
                       ▼
             ┌──────────────────┐
             │ S29 Layout Model │
             └────────┬─────────┘
                      │
          ┌───────────┼────────────┐
          ▼           ▼            ▼
     Constraints   Auto Layout   Sizing
          │           │            │
          └───────────┼────────────┘
                      ▼
              Layout Resolution
                      │
                      ▼
             Effective Layout Tree
                      │
                      ▼
        Existing RenderingEngine (S19/S20) — NOT modified, consumes LayoutRect data
```

---

## 3. Governance & Architectural Rules

- **SSOT (DECISION-044 lineage):** `BuilderDocument` remains the single source of truth. Layout data is stored **inside existing node `props`**:
  - `node.props.layoutStyle` → container style (`LayoutStyle`)
  - `node.props.layoutConstraints` → per-node constraints (`LayoutConstraints`)
  - `node.props.responsiveOverrides` → S28 breakpoint overrides (for responsive `gap`, `padding`, `width`, `height`, `flexDirection`, `x`, `y`, `display`)
  
  Zero second documents: no `LayoutDocument`, no `AutoLayoutDocument`, no `ConstraintDocument`.
- **No duplicate engines (DECISION-042 lineage):** 0 renderers, 0 cameras, 0 schedulers, 0 history stacks created.
- **Pure domain:** `packages/authoring-studio/src/layout/` imports ONLY `builder-core` and `../responsive` (S28). ZERO `React`, `window`, `document`, `requestAnimationFrame`, `AudioContext`, `PlaybackController`, `RuntimeScheduler`, DOM/Canvas, WebGL/WebGPU.
- **Determinism:** same `BuilderDocument` + same `viewportWidthPx` ⇒ byte-identical result. Layout math never uses `Math.random()` or `Date.now()`. Values normalized to 4 decimal places.
- **Immutability:** layout mutation helpers return new `SectionNode` instances; document updates go through the canonical `updateNodeInDocument` (which delegates to `touchDocument`).
- **S28 reuse, zero second breakpoint system:** S29 receives **already-resolved** effective values via S28's `resolveEffectiveNodeProperty`. S29 never re-derives breakpoints.

---

## 4. Module Decomposition

```
packages/authoring-studio/src/layout/
├── LayoutModel.ts               # Layout DTOs + defaults (LayoutMode, LayoutDirection, Alignment,
│                                #   Distribution, SizingMode, LayoutRect, LayoutSize, LayoutPosition,
│                                #   LayoutEdgeInsets, LayoutStyle)
├── ConstraintModel.ts           # LayoutConstraints + LayoutSizing DTOs + defaults + percentage helper
├── ConstraintResolver.ts        # Resolves pins/center/fill/min-max/aspect → effective LayoutRect
├── LayoutSizing.ts              # SizingMode length resolution (fixed/fill/fit/stretch + clamp)
├── AutoLayoutEngine.ts          # Flow engine: direction, gap, padding, alignment, distribution, wrap,
│                                #   child sizing → LayoutRect per child
├── LayoutTree.ts                # Recursive whole-document resolution: measureSubtreeIntrinsic +
│                                #   resolveLayout(document, viewportWidthPx)
├── ResponsiveLayoutAdapter.ts   # S28 integration boundary: effective LayoutStyle + LayoutConstraints +
│                                #   exclusion flag from a SectionNode at a given breakpoint
├── LayoutCommands.ts            # SetLayoutStyleCommand / SetLayoutConstraintCommand /
│                                #   RemoveLayoutConstraintCommand (HistoryStack<BuilderDocument>-compatible)
└── index.ts                     # Public barrel
```

---

## 5. Models

### 5.1 `LayoutMode` — how a container places its children

```ts
type LayoutMode = 'auto' | 'free';
```
- `auto` — children flow sequentially (direction/gap/alignment/distribution/wrap).
- `free` — children placed solely by `LayoutConstraints` pins (`left/right/top/bottom/centerX/centerY`).

### 5.2 `LayoutDirection`

```ts
type LayoutDirection = 'horizontal' | 'vertical';
```
- `horizontal` → main axis = X (width), cross axis = Y (height).
- `vertical`   → main axis = Y (height), cross axis = X (width).

### 5.3 `Alignment` (cross axis / alignItems)

```ts
type Alignment = 'start' | 'center' | 'end' | 'stretch';
```

### 5.4 `Distribution` (main axis / justifyContent)

```ts
type Distribution = 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
```

### 5.5 `SizingMode`

```ts
type SizingMode = 'fixed' | 'fill' | 'fit' | 'stretch';
```
- `fixed`   — explicit number/percentage, else intrinsic.
- `fill`    — take the full parent length (free mode) or the allocated pool share (auto mode).
- `fit`     — shrink to intrinsic size.
- `stretch` — fill the parent cross-axis length (main-axis `stretch` behaves as `fit`).

### 5.6 `LayoutStyle`

```ts
interface LayoutStyle {
  mode: LayoutMode;                 // default 'auto'
  direction: LayoutDirection;       // default 'vertical'
  gap: number;                      // px between siblings on main axis (default 0)
  paddingTop/PaddingRight/PaddingBottom/PaddingLeft: number; // default 0
  padding: number;                  // uniform helper; defaults 0
  alignItems: Alignment;            // cross axis, default 'start'
  justifyContent: Distribution;     // main axis, default 'start'
  wrap: boolean;                    // default false
}
```

### 5.7 `LayoutRect` / `LayoutSize` / `LayoutPosition`

```ts
interface LayoutPosition { x: number; y: number }
interface LayoutSize     { width: number; height: number }
interface LayoutRect     { x: number; y: number; width: number; height: number }
```

### 5.8 `LayoutConstraints`

```ts
interface LayoutConstraints {
  left?: number; right?: number;         // absolute pins inside parent
  top?: number; bottom?: number;
  centerX?: boolean; centerY?: boolean;
  width?: number | string;               // px number OR percentage 'NN%'
  height?: number | string;
  minWidth?: number; maxWidth?: number;
  minHeight?: number; maxHeight?: number;
  aspectRatio?: number;                  // width/height
  sizing: { width: SizingMode; height: SizingMode }; // default both 'fixed'
}
```

Constraints are **data**, never layout-executing code.

---

## 6. Resolution Precedence (Determinism Contract)

Fixed canonical order — same input can never yield two outputs.

1. **Size — main/cross axis:** `sizing` mode decides the source:
   - `fixed` → explicit (`width`/`height`, `%` against content box) → intrinsic → `0`
   - `fill`/`stretch` → parent length (content box), or pool share in auto-layout
   - `fit` → intrinsic
2. **Aspect ratio** — applied **only** when both axes are `fixed`: known width ⇒ `height = width / ratio`; known height ⇒ `width = height * ratio`. If both axes have explicit numbers **and** `aspectRatio` is set, explicit sizes win and the ratio is ignored (documented conflict rule).
3. **Min/Max clamp** — `effective = clamp(min ?? -∞, value, max ?? +∞)` per axis.
4. **Position** — pin precedence:
   - X: `left` (+`right` ⇒ anchor-stretch) → `centerX` → `right` → padding-left (free mode) / flow cursor (auto mode)
   - Y: `top` (+`bottom`) → `centerY` → `bottom` → padding-top / flow cursor

---

## 7. Auto Layout Algorithm (auto mode)

Given `containerRect`, `LayoutStyle`, and children `{intrinsic, constraints}`:

1. **Content box** = `containerRect` inset by `padding*`.
2. **Sizing phase (main axis):**
   a. Resolve each child's main length: `fixed/fit`/percent against content box; `fill` children reserved.
   b. `remaining = contentSize - Σ(non-fill) - gap*(n-1)`; each `fill` child gets `remaining / fillCount`.
   c. Clamp every child with min/max; apply aspect ratio (both-`fixed` rule).
3. **Cross axis:** `stretch/fill` → content box length (row length when wrapping); `fixed/fit` → resolved length; clamp.
4. **Positioning (main axis, cursor):**
   - child at `cursor + gap`; if `wrap` and the child exceeds the content-box extent, start a new row (horizontal) / column (vertical); row cross size = max child cross (or content-box length when stretch).
5. **Distribution shift** overrides main-axis start positions when `justifyContent ≠ 'start'`:
   - `center`/`end` shift the whole line into the content box; `space-between/around/evenly` distribute the free space deterministically.
6. **Cross-axis alignment:** `start` → content-box start, `center` → centered, `end` → content-box end, `stretch` → already full length.
7. All rect values normalized to **4 decimal places** before return.

`free` mode bypasses steps 2–6: every child is resolved by `ConstraintResolver` against the content box.

---

## 8. S28 Responsive Integration (ResponsiveLayoutAdapter)

```
viewportWidthPx
   │  BreakpointRegistry.resolveBreakpointForWidth(viewportWidthPx)
   ▼
breakpointId
   │  resolveEffectiveNodeProperty(node, 'gap'|'padding'|'width'|'height'|'flexDirection'|'display'|'x'|'y', breakpointId)
   ▼
effective { style, constraints, excluded }
   │
   ▼  ConstraintResolver / AutoLayoutEngine
```

- Effective values are resolved **once**, in `ResponsiveLayoutAdapter`. S29 layout engines receive plain numbers.
- `flexDirection: 'column'` → `direction: 'vertical'`; `'row'` → `'horizontal'`.
- `display: 'none'` → node marked `excluded` (skipped by `LayoutTree`).
- S28-responsive-capable keys only (`NodePropertyOverride` set). Non-responsive S29 properties (`min/max`, `aspectRatio`, `alignItems`, `justifyContent`, `wrap`, `distribution`, etc.) live statically in `props.layoutStyle` / `props.layoutConstraints`.

---

## 9. Layout Tree (LayoutTree.ts)

```ts
resolveLayout(document, viewportWidthPx): LayoutResolution
```
- Registers a fresh `BreakpointRegistry`, resolves `breakpointId` from the viewport width.
- Page root rect: `{ x: 0, y: 0, width: breakpoint.minWidthPx, height: 900 }` (documented default page height).
- Each page is treated as a **vertical auto-layout container** with default style.
- **Two deterministic passes:**
  1. `measureSubtreeIntrinsic(node, bp)` — bottom-up intrinsic size (explicit numbers only; percentages and unresolved sizes count as `0`; container adds padding + children along direction).
  2. top-down: page → sections → nested children; each container's children laid via `AutoLayoutEngine`.

Result: `ResolvedLayoutNode { nodeId, nodeType, label, rect, children }` per page, immutable, plus metadata (`viewportWidthPx`, `breakpointId`).

---

## 10. History / Commands

S29 creates no history stack. It reuses `createHistoryStack<BuilderDocument>` from `builder-core` and follows the S28 command pattern:

```
cmd.execute(doc) ──▶ new BuilderDocument ── caller.history.push(doc, cmd.name)
```
Commands:
- `SetLayoutStyleCommand(nodeId, stylePartial)`
- `SetLayoutConstraintCommand(nodeId, constraintPartial)`
- `RemoveLayoutConstraintCommand(nodeId, constraintKey)`

Each stores the previous props value on `execute` and restores it on `undo`. Node replacement and dirty-tracking reuse **S28's `updateNodeInDocument`** (canonical recursive update + `touchDocument`).

---

## 11. Domain Boundary

`layout/` must stay 100% pure domain TypeScript: no React, no DOM, no browser/runtime APIs, no RenderingEngine imports. Rendering is out of scope — S29 returns `LayoutRect` data only.

## 12. Public API

- `packages/authoring-studio/src/layout/index.ts` — real named exports only.
- ONE authorized change to `packages/authoring-studio/src/index.ts`: `export * from './layout';`
- No phantom exports, no duplicate exports, no `as any`.

## 13. Definition of Done

1. Architecture compliance: SSOT preserved, 0 duplicate engines.
2. Domain isolation: pure TS, 0 forbidden imports.
3. Test coverage: 8 full suites (units + integration + commands + S28 + E2E).
4. TypeScript gate: 0 S29-specific errors in `npx tsc --noEmit`.
5. Vitest gate: 100% PASS across `packages/authoring-studio/src/layout/__tests__`.
6. Build gate: `npm run build` succeeds with exit 0 (reporting actual result).
7. Golden E2E using the **real** `BuilderDocument` and **real** S28 APIs — no mocks replacing production logic.