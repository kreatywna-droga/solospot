# Professional Shapes & Vector Graphics Architecture — Sprint S18

## Overview

Sprint S18 expands the Web Factor Authoring Studio with a **Professional Shapes & Vector Graphics System**. It introduces headless vector DTO models (`Rectangle`, `Ellipse`, `Polygon`, `Line`, `Path`, `ShapeGroup`), vector geometry calculations (bounding box, stroke bounds, path parsing, polygon vertices, aspect ratio locking), shape editing operations (create, duplicate, delete, resize, rotate, move, align, distribute, group, ungroup, reorder, fill, stroke, radius), S13 Motion System vector property keyframe integration, vector rendering bridge compilation, and professional shape UX components—without creating secondary renderers, secondary document models, or duplicate history stacks.

---

## Architectural Principles

1. **Single Source of Truth**: All `VectorNode` instances remain 100% inside `BuilderDocument` as standard document nodes.
2. **Single History Stack**: All shape edits (creation, fill, stroke, radius, transform, grouping, layer reordering) emit standard commands to `BuilderDocument` and tie into the single existing `HistoryStack` (`Ctrl+Z`/`Ctrl+Shift+Z`).
3. **Headless Vector Core**: Bounding boxes, stroke expansion, point transformations, polygon vertices, SVG path parsing, path lengths, and intersection checks are pure headless math without DOM/Canvas API dependencies.
4. **Single Motion System**: Shape property keyframing (fill color/opacity, stroke width/color, corner radius, transform position/rotation/scale, polygon sides, path dashOffset) delegates strictly to the existing S13 Motion System (`AnimationTimeline` / `PlaybackSession`). Zero 2nd animation system.
5. **Vector Rendering Bridge Boundary**: Shape rendering converts `VectorNode` instances into lightweight `RendererCommand[]` DTOs for execution by `RenderingEngine` & `CanvasRenderer`. Zero 2nd renderer, WebGL/WebGPU, or DOM renderer.
6. **Strict Domain Boundary**: Zero imports of `PlaybackController`, `RuntimeScheduler`, `RuntimeBridge`, `Browser Adapter`, or `requestAnimationFrame` in `packages/authoring-studio`.

---

## Architecture Flow

```
User (Shape Tool & Inspector)
       ↓
VectorEditingEngine (Commands)
       ↓
BuilderDocument (SSOT) & HistoryStack
       ↓
VectorGeometry (Headless Geometry & Math)
       ↓
VectorAnimationEngine (S13 Motion System Integration)
       ↓
VectorRenderingBridge (RendererCommand Compiler)
       ↓
RenderingEngine → CanvasRenderer
```
