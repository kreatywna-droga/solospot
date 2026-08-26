# Rendering Engine Architecture — Sprint S10

## Overview

The **Real Rendering Engine** inside `packages/builder-core/src/rendering/` turns the declarative document model (`BuilderDocument`) and property animation timelines (`AnimationTimeline`) into deterministic, frame-by-frame 2D/3D visual render trees.

---

## Architectural Principles

1. **BuilderDocument as SSOT**:
   All render graphs, node dimensions, hierarchy relations, and fallback properties originate from `BuilderDocument`. No local state mutations bypass the document tree.

2. **Zero React & Zero Browser API**:
   The core rendering pipeline is pure TypeScript. It calculates matrices, bounding boxes, frame cache keys, UV coordinates, and opacity levels without DOM, Canvas API, `requestAnimationFrame`, or window references.

3. **Strict Domain Isolation**:
   Authoring studio components interact with the rendering engine solely via public DTOs (`RenderFrame`, `PreviewFrameMessage`, `RenderExportJob`).

4. **Multi-stage Pipeline**:
   ```
   [ BuilderDocument + Timelines ]
                 │
                 ▼
     1. Timeline Evaluation (TimelineEvaluator, KeyframeInterpolator, CurveEvaluator)
                 │
                 ▼
     2. Scene Composition (SceneComposer, TransformResolver, OpacityResolver, VisibilityResolver, LayerComposer)
                 │
                 ▼
     3. Dirty Region Tracking (DirtyRegionTracker)
                 │
                 ▼
     4. Frame Caching & Output (FrameCache, FrameRenderer, RenderPipeline)
                 │
                 ▼
     5. Export & Preview Adapters (ExportPipeline, PreviewRenderingAdapter)
   ```

---

## Subsystem Architecture

### 1. Rendering Core (`RenderingEngine`, `RenderContext`, `RenderFrame`, `RenderGraph`, `RenderSession`)
- **RenderContext**: Immutable DTO defining timestamp, frame index, target FPS, viewport dimensions, and quality settings.
- **RenderFrame**: Evaluated output frame containing computed node states (`RenderNodeState`), layer ordering, bounding boxes, and dirty rect lists.
- **RenderGraph**: Directed Acyclic Graph (DAG) created from `SectionNode` tree.
- **RenderSession**: Stateful controller managing document changes, active context, and frame cache.

### 2. Timeline Evaluation (`TimelineEvaluator`, `KeyframeInterpolator`, `CurveEvaluator`, `AnimationResolver`)
- **CurveEvaluator**: Evaluates linear, ease-in, ease-out, cubic-bezier, step, and spring curves.
- **KeyframeInterpolator**: Finds bounding keyframes for timestamp `t`, calculates eased progression factor `u'`, and interpolates numbers, colors, units, and transforms.
- **TimelineEvaluator**: Evaluates clip delays, durations, fill modes, directions, loops, and repeat counts.
- **AnimationResolver**: Consolidates active property animation tracks per target node ID.

### 3. Scene Composition (`SceneComposer`, `LayerComposer`, `TransformResolver`, `VisibilityResolver`, `OpacityResolver`)
- **SceneComposer**: Merges raw node props with animated properties.
- **TransformResolver**: Calculates 2D/3D affine transformation matrices across parent-child chains.
- **VisibilityResolver**: Resolves spatial visibility, display, clipping, and bounds containment.
- **OpacityResolver**: Computes cumulative opacity (`parentOpacity * nodeOpacity`).
- **LayerComposer**: Sorts nodes into deterministic render order by tree depth, `zIndex`, and sibling `order`.

### 4. Rendering Pipeline (`RenderPipeline`, `FrameRenderer`, `FrameCache`, `DirtyRegionTracker`)
- **FrameRenderer**: Renders individual frames synchronously.
- **FrameCache**: LRU frame cache preventing redundant recalculations.
- **DirtyRegionTracker**: Calculates bounding box diffs (dirty rectangles) between consecutive frames for incremental rendering optimizations.

### 5. Preview & Export Adapters (`PreviewRenderingAdapter`, `ExportPipeline`, `FrameSequence`, `SpriteSheets`, `PreviewFrames`, `ThumbnailRenderer`)
- **PreviewRenderingAdapter**: Serializes `RenderFrame` outputs into preview DTO messages (`PreviewFrameMessage`).
- **ExportPipeline**: Orchestrates full sequence export jobs (discrete frame sequences, sprite sheet UV layouts, preview snapshots, thumbnail poster frames).

### 6. Performance Profiling (`PerformanceProfiler`, `RenderMetrics`, `RenderStatistics`, `FrameTiming`)
- **PerformanceProfiler**: Tracks frame render duration, evaluation vs composition breakdown, node counts, and cache hit ratios.
- **FrameTiming**: Precision delta time and FPS tracker.
