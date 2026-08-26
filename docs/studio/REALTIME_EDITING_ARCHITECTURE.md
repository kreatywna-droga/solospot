# Real-Time Editing Architecture — Sprint S12

## Overview

Sprint S12 establishes the real-time editing architecture for the Authoring Studio. It connects user actions from the **Inspector**, **Timeline**, and **Interactive Stage Controls** to the visual rendering pipeline (`RenderingEngine` S10 & `CanvasRenderer` S11) via `BuilderDocument` as the Single Source of Truth (SSOT).

---

## Architectural Flow & Principles

```
User Action (Inspector / Timeline / Stage Drag)
                      │
                      ▼
        Interactive Edit Command (S12 DTO)
                      │
                      ▼
     EditingHistoryBridge (HistoryStack Transaction S6)
                      │
                      ▼
           BuilderDocument (SSOT)
                      │
                      ▼
      TimelinePlaybackSession (Playhead time)
                      │
                      ▼
     RenderingEngine (S10 Frame Evaluation)
                      │
                      ▼
               RenderFrame DTO
                      │
                      ▼
     RenderCommandCompiler & RenderCache (S11)
                      │
                      ▼
      CanvasRenderer -> Stage Canvas (IMAGE)
```

---

## Key Guarantees & Constraints

1. **Single Source of Truth (SSOT)**: `BuilderDocument` is the ONLY state source. Edits do NOT mutate transient renderer state or maintain parallel document snapshots.
2. **Undo/Redo History Integration**: Edits execute via `EditingHistoryBridge` wrapping `HistoryStack<BuilderDocument>` and `TimelineHistoryBinding`. Calling `undo()` or `redo()` reverts the document and immediately triggers canvas re-rendering.
3. **Decoupled Renderer**: Browser Canvas API operations remain 100% contained within `CanvasRenderer` and `CanvasRenderSurface`.
4. **No Duplicate Engines**: S12 reuses S10 `RenderingEngine`, PM37 `TimelinePlaybackSession`, and S6 `HistoryStack`.
