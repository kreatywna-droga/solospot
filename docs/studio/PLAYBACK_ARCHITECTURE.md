# Timeline Playback Architecture — Sprint S12

## Overview

`PlaybackOrchestrator` provides playback transport control for the Authoring Studio. It manages transport state (`Play`, `Pause`, `Stop`, `Seek`, `Loop`, `PlaybackRange`, `FPS`) and maps playhead timing to `RenderingEngine` and `CanvasRenderer`.

---

## Data Flow & Clock Architecture

```
PlaybackOrchestrator
      │
      ├── Session Management (TimelinePlaybackSession: currentTime, duration, fps, status)
      ├── Range Control (rangeStartMs, rangeEndMs)
      │
      ▼
PreviewRendererConnector
      │
      ├── RenderCache lookup (key: frameIndex, timestampMs, docRevision, viewport)
      │      ├─ Cache HIT  -> Render cached commands
      │      └─ Cache MISS -> RenderingEngine.renderFrame(time) -> Compile commands
      │
      ▼
CanvasRenderer
      │
      ▼
Stage Viewport Canvas Output
```

---

## Playback Diagnostics & Performance Metrics

`PlaybackPerformanceDiagnostics` tracks performance metrics during scrubbing and playback:
- **`frameTimingMs`**: Time spent processing each tick step.
- **`renderTimingMs`**: Time spent compiling & executing canvas draw commands.
- **`droppedFrameCount`**: Count of frames exceeding 1.5x target frame interval.
- **`cacheHitRate`**: Cache hit ratio from `RenderCache`.
- **`fpsTarget` vs `fpsActual`**: Target FPS vs measured playback FPS.
- **`jitterMs`**: Standard deviation of frame intervals.
