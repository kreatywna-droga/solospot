# Visual Rendering Backend Architecture — Sprint S11

## Overview

Sprint S11 introduces the visual rendering backend for the Authoring Studio, connecting the deterministic DTO frame evaluation from Sprint S10 (`RenderingEngine` in `builder-core`) to actual graphical image output via the Canvas 2D backend.

## Architectural Boundaries & Separation of Concerns

```
+-----------------------------------------------------------------------+
|                             BUILDER-CORE                              |
|                                                                       |
|  BuilderDocument + AnimationTimeline[] -> RenderingEngine (S10)       |
|                                               |                       |
|                                               v                       |
|                                     RenderFrame (Immutable DTO)       |
+---------------------------------------------------------------+-------+
                                                                |
                                                                v
+---------------------------------------------------------------+-------+
|                           AUTHORING-STUDIO                            |
|                                                                       |
|                      RenderCommandCompiler (S11)                      |
|                                   |                                   |
|                                   v                                   |
|                      RendererCommand[] (DTO Stack)                    |
|                                   |                                   |
|                                   v                                   |
|                      RenderCache (LRU Frame Cache)                    |
|                                   |                                   |
|                                   v                                   |
|                      RenderCommandExecutor (S11)                      |
|                                   |                                   |
|                                   v                                   |
|                     RendererBackend (CanvasRenderer)                  |
|                                   |                                   |
|                                   v                                   |
|                  RendererSurface (CanvasRenderSurface)                |
|                                   |                                   |
|                                   v                                   |
|                     HTMLCanvasElement / GRAPHIC IMAGE                 |
+-----------------------------------------------------------------------+
```

### Key Guarantees
1. **Zero Browser/Canvas coupling in `builder-core`**: `RenderingEngine` produces purely mathematical `RenderFrame` outputs without referencing `HTMLCanvasElement` or `CanvasRenderingContext2D`.
2. **Encapsulated Canvas Adapter**: Browser Canvas APIs reside exclusively within `CanvasRenderer` and `CanvasRenderSurface` inside `packages/authoring-studio/src/rendering/`.
3. **Pure DTO Command Stack**: `RenderCommandCompiler` translates `RenderFrame` nodes into a serializable array of `RendererCommand` objects (`CLEAR`, `SAVE`, `SET_TRANSFORM`, `SET_OPACITY`, `SET_BLEND_MODE`, `RESTRICT_CLIP`, `DRAW_RECT`, `DRAW_IMAGE`, `DRAW_TEXT`, `RESTORE`).
4. **Deterministic Playhead Integration**: Timeline playhead scrubbing updates `PreviewRendererConnector` which executes frames deterministically through `RenderingEngine` and caches compiled commands.
