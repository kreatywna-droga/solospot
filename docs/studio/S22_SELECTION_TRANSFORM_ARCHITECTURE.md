# S22 — Professional Selection, Transform & Interaction Architecture

## 1. Overview & Vision

Sprint **S22** introduces a high-precision, professional Selection, Transform & Interaction System to Authoring Studio. It enables single selection, multi-selection, marquee selection, moving, resizing, rotating, scaling from center, aspect ratio constraints, alignment, distribution, object/grid/guide snapping, and smart guides.

Crucially, **no secondary transform system or second history stack** has been introduced. All transform operations directly update the single `BuilderDocument` / `SceneGraph` model and push snapshots to the single `HistoryStack<BuilderDocument>` from `builder-core`.

---

## 2. Pipeline Governance & Data Flow

```
+-------------------+
| User Interaction  |
+---------+---------+
          |
          v
+-------------------+
| Selection /       |
| Transform DTO     |
+---------+---------+
          |
          v
+-------------------+
|   HistoryStack    | (Single HistoryStack<BuilderDocument> from builder-core)
+---------+---------+
          |
          v
+-------------------+
|  BuilderDocument  | (Single SSOT)
+---------+---------+
          |
          v
+-------------------+
|    SceneGraph     |
+---------+---------+
          |
          v
+-------------------+
|  SceneCompositor  |
+---------+---------+
          |
          v
+-------------------+
|      Camera       |
+---------+---------+
          |
          v
+-------------------+
|  RenderingEngine  |
+---------+---------+
          |
          v
+-------------------+
|  CanvasRenderer   | (Single Canvas Renderer Backend)
+-------------------+
```

---

## 3. Core Subsystems

### A. Selection Domain Core (`SelectionModel.ts`, `SelectionManager.ts`)
- DTOs for `SelectionState`, `SelectionMode` (`none`, `single`, `multi`, `marquee`), `TransformHandleType`, and `MarqueeBox`.
- Pure state management for selecting single nodes, toggling multi-selection (Shift/Cmd click), clearing selection, and marquee box intersection calculation with scene graph nodes.

### B. Bounding Box & Handles Engine (`BoundingBoxModel.ts`, `TransformHandles.ts`)
- Computes unified bounding boxes for single and multi-selection.
- Calculates 9 key handle point coordinates (`top-left`, `top-center`, `top-right`, `middle-left`, `center`, `middle-right`, `bottom-left`, `bottom-center`, `bottom-right`, `rotate`).
- Aspect ratio constraints, center scaling, and handle hit-testing in world/screen space.

### C. Transform Interaction Engine (`TransformInteractionEngine.ts`)
- Implements pure headless operations for moving, resizing (handle drag, center scale, aspect lock), rotating, and group transforms across selected nodes.

### D. Alignment & Distribution Engines (`AlignmentEngine.ts`, `DistributionEngine.ts`)
- Alignment: align left, horizontal center, right, top, vertical center, and bottom relative to canvas or selection bounding box.
- Distribution: distribute 3+ nodes horizontally or vertically with equal gap spacing.

### E. Snapping & Smart Guides Engines (`SnappingEngine.ts`, `GuidesEngine.ts`)
- Snapping: snaps position delta to grid lines (8/16/32/64px), guide lines, or adjacent scene objects (edges and center lines).
- Smart Guides: calculates alignment lines and gap distance markers during object dragging.

### F. Coordinate Mapper & History Binding (`InteractionCoordinateMapper.ts`, `TransformHistoryBinding.ts`)
- Pointer screen coordinate conversion to world and layer local space.
- Integration pushing transform state snapshots to `HistoryStack<BuilderDocument>`. Zero 2nd history stack created.

### G. Viewport Selection Overlay (`SelectionOverlay.tsx`)
- Renders bounding box outlines, 9 transform handles, alignment quick toolbar, smart guide lines, and marquee selection box.

---

## 4. Test Suite Baseline

Sprint S22 includes 10 unit and integration test suites in `packages/authoring-studio/src/selection/__tests__/`:
1. `SelectionModel.test.ts`
2. `SelectionManager.test.ts`
3. `BoundingBoxModel.test.ts`
4. `TransformInteractionEngine.test.ts`
5. `AlignmentEngine.test.ts`
6. `DistributionEngine.test.ts`
7. `SnappingEngine.test.ts`
8. `GuidesEngine.test.ts`
9. `InteractionCoordinateMapper.test.ts`
10. `TransformHistoryBinding.test.ts`
