# S31 Architecture Specification — Live Preview & Responsive Viewport Canvas UX

> **Subsystem:** Authoring Studio — Live Preview & Responsive Viewport Canvas UX (Sprint S31)  
> **Author:** Agent 1 — Senior Architect & Planning Agent  
> **Status:** PROPOSED — WAITING FOR ARCHITECT APPROVAL (no implementation executed)  
> **Dependencies:** `builder-core` (`BuilderDocument`, `HistoryStack`), S28 Responsive Subsystem (`../responsive`), S29 Layout Subsystem (`../layout`), S30 Layout Inspector (`../layout-inspector`), S21 Camera Model (`../camera`), S22 Selection System (`../selection`)

---

## 1. Executive Summary & Objective

Sprint S31 delivers the **headless Live Preview & Responsive Viewport Canvas UX domain layer** on top of the frozen S28/S29/S30 layout & inspector foundation, exactly as reserved in `docs/studio/S29_ARCHITECTURE.md:22` and `S30_ARCHITECTURE.md:33`:

> "S31 (future) will add the Preview, separately, on top of this same foundation." — `docs/studio/S30_ARCHITECTURE.md:33`

S31 answers the core question:

> "How does the Studio render an interactive, multi-device live preview of a BuilderDocument, allow responsive viewport switching, support pan/zoom/hover/selection canvas interactions, and synchronize bidirectionally with the S30 Layout Inspector — using real, existing APIs without rebuilding any layout or camera engines?"

S31 **is not** a second document store, second layout engine, second camera engine, second selection engine, or second renderer. It introduces **zero** duplicate engines, **zero** second document models, **zero** new history stacks, and **zero** React/DOM in its domain modules. It is a pure, headless, deterministic layer that:

1. **Represents Viewport State** — Bridges active breakpoint selection with S28 `BreakpointRegistry` and S21 `CameraState` / `ViewportConfiguration`.
2. **Resolves Live Preview Layout** — Delegates layout resolution to S29 `resolveLayout(doc, viewportWidthPx)`, producing frame-accurate `ResolvedLayoutNode` trees per breakpoint.
3. **Manages Canvas Interaction & Selection** — Integrates canvas node hover, selection, and highlight rectangles with S22 `SelectionState` / `SelectionManager`.
4. **Synchronizes with S30 Layout Inspector** — Selecting a node in S31 feeds `nodeId` into S30 `readLayoutInspectorState`; editing a field via S30 dispatches commands that update `BuilderDocument` and immediately trigger S31 preview refresh.

Per **DECISION-043 / DECISION-045**: Inspector and Viewport edit & display configuration data only; they never invoke `PlaybackController` or any runtime execution. S30/S31 comply: every change produces a new `BuilderDocument`; nothing plays, nothing schedules, nothing steps time.

---

## 2. Architecture Flow

```
              BuilderDocument (SSOT — node.props)
                      |
        +-------------+------------------------+
        |             |                        |
        v             v                        v
   S28 Responsive   S29 Layout             S30 Inspector
 BreakpointRegistry resolveLayout()     LayoutInspectorController
        +-------------+------------------------+
                      |
                      v
        +--------------------------------------+
        |  S31 viewport-preview (headless)    |
        |  ViewportPreviewModel      --> State |
        |  ViewportPreviewController --> Viewport & Zoom/PanOps
        |  ViewportCanvasAdapter     --> LayoutTree -> Renderable Canvas Nodes
        |  ViewportSelectionModel    --> Hover & Highlight State
        |  ViewportInteractionController --> Selection & S30 Sync
        +--------------+-----------------------+
                       |
                       v
    Existing Selection & Camera Models (S21/S22) — REUSED ONLY
                       |
                       v
    S30 Layout Inspector Field Edit -> Command -> BuilderDocument
                       |
                       v
    S31 Live Preview Refresh (Pristine SSOT integrity preserved)
```

---

## 3. Governance & Architectural Rules

- **SSOT (DECISION-044 Lineage):** `BuilderDocument` is the single source of truth. Layout data stays in existing node `props` (`layoutStyle`, `layoutConstraints`, `responsiveOverrides`). Zero second documents created.
- **No Duplicate Engines (DECISION-042 Lineage):** 0 renderers, 0 cameras, 0 layout engines, 0 responsive engines, 0 history stacks created by S31. History is always the caller-provided `createHistoryStack<BuilderDocument>`. Camera is S21 `Camera`. Breakpoints are S28 `BreakpointRegistry`.
- **Inspector & Preview Edit Data Only (DECISION-043, DECISION-045):** S31 never invokes `PlaybackController`, `RuntimeScheduler`, `RuntimeBridge`, browser adapters, or `requestAnimationFrame`. No custom playback/time/scheduler logic anywhere.
- **Pure Domain Boundary:** `packages/authoring-studio/src/viewport-preview/` imports ONLY: `../../../builder-core/src/*` (BuilderDocument, SectionNode, HistoryStack), `../responsive` (S28), `../layout` (S29), `../layout-inspector` (S30), `../camera` (S21), `../selection` (S22). ZERO `React`, `window`, `document`, `requestAnimationFrame`, DOM/Canvas, WebGL/WebGPU.
- **Determinism:** Same `doc` + same `breakpointId` + same `viewportWidthPx` ⇒ byte-identical preview rect tree. No `Math.random()`, no `Date.now()` in any S31 math.
- **Freeze (S1–S30):** No existing source file is modified. The ONLY authorized edit to a pre-existing file is one appended barrel line in `packages/authoring-studio/src/index.ts`.

---

## 4. Viewport Model & S21 Camera Integration

```ts
export interface ViewportPreviewState {
  readonly activeBreakpointId: BreakpointId;
  readonly activeBreakpoint: Breakpoint;
  readonly viewportWidthPx: number;
  readonly viewportHeightPx: number;
  readonly containerWidthPx: number;
  readonly containerHeightPx: number;
  readonly zoomLevel: number; // 0.1 - 5.0 (1.0 = 100%)
  readonly panPosition: { readonly x: number; readonly y: number };
  readonly fitScaleFactor: number;
  readonly effectiveScale: number; // zoomLevel * fitScaleFactor
  readonly s21Camera: Camera;
  readonly s21ViewportConfig: ViewportConfiguration;
}
```

- **S21 Camera Integration:** `s21Camera` is instantiated via `createCamera({ transform: { position: panPosition, zoom: effectiveScale } })`.
- **Zoom Operations:** `zoomIn`, `zoomOut`, `setZoomLevel`, `resetZoom`, `fitToContainer`.
- **Pan Operations:** `setPanPosition`, `panBy(dx, dy)`.

---

## 5. Preview Resolution Flow

S31 delegates layout resolution to S29 `resolveLayout`:

```
BuilderDocument + ViewportPreviewState
       ↓
1. Extract viewportWidthPx from activeBreakpoint (S28 BreakpointRegistry)
       ↓
2. S29 resolveLayout(doc, viewportWidthPx)
       ↓
3. Returns ResolvedLayoutTree (page-by-page immutable tree of ResolvedLayoutNodes)
       ↓
4. ViewportCanvasAdapter maps ResolvedLayoutNodes into CanvasRenderableNode[]:
   - nodeId, label, type, rect (x, y, width, height)
   - viewportRect (world rect scaled by effectiveScale & offset by panPosition)
   - isSelected, isHovered, isHighlighted
```

---

## 6. Viewport Switching & S28 Integration

- Viewport preset switching (`desktop` 1440, `laptop` 1024, `tablet` 768, `mobile` 375, `mobile_small` 320) uses S28 `BreakpointRegistry`.
- Custom viewport width matching delegates to `registry.resolveBreakpointForWidth(widthPx)`.
- Container bounds updates recalculate `fitScaleFactor = min(1.0, min(containerWidth / viewportWidth, containerHeight / viewportHeight))`.

---

## 7. Canvas Interaction & Selection Integration

```ts
export interface ViewportSelectionState {
  readonly hoveredNodeId: string | null;
  readonly s22SelectionState: SelectionState;
  readonly highlightedNodeRects: ReadonlyArray<{ readonly nodeId: string; readonly rect: LayoutRect }>;
}
```

- **Hover:** `setHoveredNodeId(nodeId | null)`.
- **Select:** `selectNode(nodeId, isMultiSelect?)` delegates to S22 `SelectionManager.selectSingle` / `toggleSelect`.
- **Clear Selection:** `clearSelection()` delegates to S22 `SelectionManager.clearSelection()`.
- **Highlight Rects:** Derived automatically from selected node IDs + `ResolvedLayoutTree`.

---

## 8. S30 Layout Inspector Integration

```
S31 Canvas Interaction (select node 'card-1')
        ↓
ViewportSelectionModel updates s22SelectionState (selectedNodeIds = ['card-1'])
        ↓
S30 readLayoutInspectorState(doc, 'card-1', activeBreakpointId)
        ↓
Inspector UI displays fieldValues & effective layout
        ↓
Inspector Field Edit ('layout.gap', 12)
        ↓
S30 applyFieldChange({ doc, history, nodeId: 'card-1', fieldId: 'layout.gap', value: 12 })
        ↓
Returns new BuilderDocument + updated HistoryStack
        ↓
S31 refreshPreview(newDoc) -> S29 resolveLayout(newDoc) -> updated CanvasRenderableNodes
```

---

## 9. Module Decomposition (`packages/authoring-studio/src/viewport-preview/`)

```
packages/authoring-studio/src/viewport-preview/
├── ViewportPreviewModel.ts          # State DTOs, factories & pure zoom/pan/breakpoint calculations
├── ViewportPreviewController.ts     # Viewport switching, zoom/pan operations, S21 camera sync
├── ViewportCanvasAdapter.ts        # LayoutTree -> CanvasRenderableNode[] mapper with scaled viewportRects
├── ViewportSelectionModel.ts       # Hover & highlight state management bridged with S22 SelectionState
├── ViewportInteractionController.ts # Integrated orchestrator: Viewport + Selection + S30 Inspector Sync
├── index.ts                         # Public barrel
└── __tests__/
    ├── ViewportPreviewModel.test.ts
    ├── ViewportPreviewController.test.ts
    ├── ViewportCanvasAdapter.test.ts
    ├── ViewportSelectionModel.test.ts
    ├── ViewportInteractionController.test.ts
    └── ViewportPreviewE2EWorkflow.test.ts # Golden E2E Test
```

---

## 10. Public API Barrel Definition

`packages/authoring-studio/src/viewport-preview/index.ts`:
Re-exports pure named domain symbols from `ViewportPreviewModel`, `ViewportPreviewController`, `ViewportCanvasAdapter`, `ViewportSelectionModel`, `ViewportInteractionController`.

Authorized single barrel edit in `packages/authoring-studio/src/index.ts`:
```ts
// Sprint S31 — Live Preview & Responsive Viewport Canvas UX
export * from './viewport-preview/index';
```

---

## 11. Definition of Done & Quality Gates

1. **Architecture Compliance:** SSOT preserved, 0 duplicate engines, 0 custom history stacks, 0 custom cameras, 0 custom layout engines.
2. **Domain Isolation:** Pure TS, 0 forbidden imports (React/DOM/rAF/PlaybackController/RuntimeScheduler/WebGL).
3. **Test Suite:** 6 test suites including Golden E2E workflow.
4. **TSC Gate:** 0 S31-specific errors in `npx tsc --noEmit`.
5. **Vitest Gate:** 100% PASS across `packages/authoring-studio/src/viewport-preview/__tests__`.
6. **Build Gate:** `npm run build` succeeds (exit 0).
