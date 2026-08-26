# S21 — Professional Camera, Viewport & Multi-Canvas Architecture

## 1. Overview & Vision

Sprint **S21** introduces a professional Camera, Viewport, and Multi-Canvas System to Authoring Studio, enabling sophisticated pan/zoom/rotation view controls, coordinate space mathematical transformations, and split multi-viewport editing workflows.

Crucially, **no secondary renderer, WebGL/WebGPU backend, separate compositor engine, or second animation engine** has been introduced. All viewports consume the single source of truth `BuilderDocument` / `SceneGraph` model and issue rendering commands to the existing `RenderingEngine` and `CanvasRenderer`.

---

## 2. Architecture Governance & Boundary Enforcement

```
                              +--------------------+
                              |  BuilderDocument   | (Single SSOT)
                              +---------+----------+
                                        |
                                        v
                              +--------------------+
                              |     SceneGraph     |
                              +---------+----------+
                                        |
                   +--------------------+--------------------+
                   |                                         |
                   v                                         v
        +--------------------+                    +--------------------+
        |  Primary Viewport  |                    | Secondary Viewport |
        |  (Camera 1 State)  |                    |  (Camera 2 State)  |
        +----------+---------+                    +----------+---------+
                   |                                         |
                   +--------------------+--------------------+
                                        |
                                        v
                              +--------------------+
                              |  SceneCompositor   |
                              +---------+----------+
                                        |
                                        v
                              +--------------------+
                              |SceneRenderingBridge|
                              +---------+----------+
                                        |
                                        v
                              +--------------------+
                              |  CanvasRenderer    | (Single Canvas Renderer)
                              +--------------------+
```

### Key Architectural Constraints
1. **Decoupled Viewport State**: Transient editor view states (zoom level, pan offset, rotation, active viewport mode) are decoupled from persistent `BuilderDocument` scene data.
2. **Single Compositor & Renderer**: Multiple active viewports share the single `SceneCompositor` and single `CanvasRenderer` backend.
3. **Integrated Motion Engine**: Camera properties (`camera.position.x`, `camera.position.y`, `camera.zoom`, `camera.rotationDeg`) animate directly through S13 `AnimationTimeline` and `PlaybackSession` DTOs.

---

## 3. Core Technical Subsystems

### ETAP 1 — Headless Camera Model (`CameraModel.ts`)
Defines pure DTO data structures:
- `Camera`: Represents a camera entity with `id`, `name`, `transform`, `viewport`, `projection`, and optional `bounds`.
- `CameraTransform`: Combines 2D/3D `position` ({x, y, z}), `zoom` scale factor, and `rotationDeg`.
- `CameraViewport`: Dimensions (`width`, `height`) and `devicePixelRatio`.
- `CameraProjection`: Projection mode (`orthographic` | `perspective`).

### ETAP 2 — Camera Operations Engine (`CameraOperationsEngine.ts`)
Implements pure headless calculations:
- `panCamera(camera, dx, dy)`
- `zoomCamera(camera, factor, pivotPoint)`
- `rotateCamera(camera, deltaDeg)`
- `fitToContent(camera, contentBounds, padding)`
- `fitSelection(camera, selectionBounds, padding)`
- `centerSelection(camera, selectionBounds)`
- `resetView(camera)`
- `zoomTo100(camera)`
- `zoomToFit(camera, containerBounds)`

### ETAP 3 — Coordinate Systems Engine (`CoordinateSystems.ts`)
Calculates 2D affine transformations across coordinate spaces:
$$\text{World Space} \longleftrightarrow \text{Scene Space} \longleftrightarrow \text{Camera Space} \longleftrightarrow \text{Viewport Space} \longleftrightarrow \text{Screen Space}$$
- `computeCameraMatrix(camera)`: Generates 2D affine matrix `[a, b, c, d, e, f]` translating world coordinates relative to camera transform and viewport center.
- `computeInverseCameraMatrix(camera)`: Calculates matrix inverse for converting screen pixels to world coordinates.
- `worldToScreen(point, camera)` & `screenToWorld(point, camera)`: Performs point mappings incorporating `devicePixelRatio`.
- `worldToViewport(bounds, camera)` & `viewportToWorld(bounds, camera)`: Maps bounding boxes between coordinate spaces.

### ETAP 4 — Multi-Canvas / Multi-Viewport Engine (`ViewportModel.ts`)
Structures multi-canvas workspace layouts:
- Viewport Types: `primary`, `secondary`, `preview`, `thumbnail`.
- Layout Modes: `single`, `split-vertical`, `split-horizontal`, `quad`, `pip` (Picture-in-Picture).
- `ViewportConfiguration` and `MultiViewportLayout` pure DTOs.

### ETAP 5 — Rendering Integration (`SceneRenderingBridge.ts`)
Pipeline flow:
$$\text{BuilderDocument} \longrightarrow \text{SceneGraph} \longrightarrow \text{Camera} \longrightarrow \text{SceneCompositor} \longrightarrow \text{RenderingEngine} \longrightarrow \text{RendererCommand[]} \longrightarrow \text{CanvasRenderer}$$
- `SceneRenderingBridge.compileSceneToCommands(scene, camera)` multiplies `cameraMatrix` with node world matrices:
$$\text{renderMatrix} = \mathbf{M}_{\text{camera}} \times \mathbf{M}_{\text{world}}$$
Zero secondary renderer created!

### ETAP 6 — Camera Animation Integration (`CameraAnimationBridge.ts`)
Maps camera parameters to standard animation tracks:
- `CameraAnimatableProperty`: `'camera.position.x'`, `'camera.position.y'`, `'camera.zoom'`, `'camera.rotationDeg'`.
- Integrates with `AnimationTimeline` and `AnimationClip` DTOs. Zero secondary animation engine!

### ETAP 7 — Viewport UI Components (`packages/authoring-studio/src/ui/components/viewport/`)
- `ZoomControls.tsx`: Zoom readouts/dropdowns, pan tool toggle, rotate buttons, fit actions.
- `MultiViewportContainer.tsx`: Multi-viewport layout containers (Split, Quad, PiP).
- `RulersGuides.tsx`: Pixel rulers, grid overlay (8px/16px/32px/64px), snap-to-grid, and safe area guides (16:9, 4:3, 1:1).

---

## 4. Verification & Testing Baseline

Sprint S21 includes 10 unit and integration test suites:
1. `CameraModel.test.ts`
2. `CameraTransform.test.ts`
3. `CoordinateSystems.test.ts`
4. `ViewportState.test.ts`
5. `ZoomPan.test.ts`
6. `FitToContent.test.ts`
7. `MultiViewport.test.ts`
8. `CameraAnimation.test.ts`
9. `CameraRendering.test.ts`
10. `ViewportIntegration.test.ts`
