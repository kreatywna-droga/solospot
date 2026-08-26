# Professional Layers, Compositing & Scene Graph Architecture — Sprint S19

## Overview

Sprint S19 introduces a **Professional Layers, Compositing & Scene Graph System** to the Web Factor Authoring Studio. It establishes a unified, high-performance scene graph model (`Scene`, `Layer`, `LayerGroup`, `LayerOrder`, `ClippingGroup`) without creating secondary renderers, secondary animation engines, or duplicate history stacks.

---

## Architectural Invariants & Governance

1. **Single Source of Truth (SSOT)**:
   - All layer state, group nesting, and compositing flags are stored inside `BuilderDocument` DTOs.
   - `SceneGraph` acts as a pure headless domain view/model populated from and synced with `BuilderDocument`.
2. **Single History Stack**:
   - Layer operations (create, rename, duplicate, delete, reorder, group, ungroup, move into/out of group, lock, hide, solo, isolate, opacity, blend mode) flow via:
     `Command → HistoryStack → BuilderDocument`
   - Complete `Ctrl+Z` / `Ctrl+Shift+Z` support across all layer mutations.
3. **Headless Domain Core**:
   - `SceneGraphModel`, `LayerOperationsEngine`, and `SceneCompositor` are 100% pure TypeScript logic without DOM, React, Canvas API, or browser schedulers.
4. **Single Motion System**:
   - Layer property keyframing (opacity, transform, blendMode, visibility) maps directly to standard `AnimationTimeline` and `PlaybackSession` in the existing S13 Motion System. Zero secondary animation engine.
5. **Single Rendering Engine Pipeline**:
   - Scene compositing converts scene hierarchy into an ordered array of `RendererCommand` DTOs (`RESTRICT_CLIP`, `SET_OPACITY`, `SET_BLEND_MODE`, `SET_TRANSFORM`, `SAVE`, `RESTORE`) for execution by `RenderingEngine` & `CanvasRenderer`.
6. **Strict Separation of Concerns**:
   - Zero imports of `PlaybackController`, `RuntimeScheduler`, `RuntimeBridge`, `Browser Adapter`, or `requestAnimationFrame` in `packages/authoring-studio`.

---

## Data Flow Architecture

```
User Interaction (Layers Panel / Canvas)
          ↓
LayerOperationsEngine (Pure Operations)
          ↓
SceneHistoryBinding & HistoryStack
          ↓
BuilderDocument (SSOT)
          ↓
SceneCompositor (Inherited Opacity, 2D World Matrices, Solo/Isolate, Clipping)
          ↓
SceneAnimationBridge (S13 Motion System Property Evaluation)
          ↓
SceneRenderingBridge (RendererCommand Compiler)
          ↓
RenderingEngine → CanvasRenderer
```

---

## Core Components

### 1. Scene Graph Model (`SceneGraphModel.ts`)
- `Scene`: Root container managing layers, root z-order, selection, solo set, isolation target.
- `Layer`: Base node representing vector shape, text, media, or container element with transform, opacity, blend mode, visibility, lock, solo, isolate flags.
- `LayerGroup`: Specialized container node managing child IDs and nested hierarchy depth.
- `ClippingGroup`: Defines clipping mask relationships (mask layer ID + target clipped layer IDs).

### 2. Layer Operations (`LayerOperationsEngine.ts`)
- Implements pure functional operations for layer lifecycle, grouping, hierarchy re-parenting, z-ordering, and visibility/lock toggles.

### 3. Compositing Engine (`SceneCompositor.ts`)
- Calculates inherited cumulative opacity down ancestor chains (`parentOpacity * localOpacity`).
- Concatenates 2D affine transformation matrices (`M_world = M_parent * M_local`) for translation, rotation, scale, and skewing.
- Computes effective visibility considering local `visible`, parent `visible`, global `soloSet`, and active `isolatedLayerId`.
- Resolves active clipping groups and clip bounds.

### 4. Rendering Integration (`SceneRenderingBridge.ts`)
- Compiles composited Scene Graph into deterministic `RendererCommand[]` sequence for `RenderingEngine` & `CanvasRenderer`.

### 5. Animation Integration (`SceneAnimationBridge.ts`)
- Binds layer properties (`opacity`, `transform.x`, `transform.y`, `transform.scaleX`, `transform.scaleY`, `transform.rotationDeg`, `blendMode`, `visible`) to `AnimationTimeline` keyframe tracks.

### 6. Professional Layers UX (`LayersPanel.tsx`, `LayerTreeItem.tsx`, `LayerSearchFilter.tsx`)
- Provides visual tree navigation, drag-and-drop reorder capabilities, opacity slider, blend mode selector, and instant search/filtering.
