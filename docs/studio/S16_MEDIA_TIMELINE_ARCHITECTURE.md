# Audio & Video Timeline Architecture — Sprint S16

## Overview

Sprint S16 extends the Web Factor Authoring Studio with a **Professional Audio & Video Timeline Workflow**. It introduces multi-track media clips (audio & video), non-destructive trimming, clip splitting, waveform visualization, volume/gain/mute controls, poster frame extraction, audio/video playhead synchronization, and media timeline editing commands—without creating secondary timeline/playback engines or secondary history stacks.

---

## Architectural Principles

1. **Single Playhead Single Source of Truth**: All audio and video clips remain synchronized to the single existing `PlaybackSession` / `TimelineTransportController` playhead.
2. **Single Command & History Stack**: All media clip edits (trim, split, move, duplicate, volume, mute) emit standard commands to `BuilderDocument` and tie into the single existing `HistoryStack` (`Ctrl+Z`/`Ctrl+Shift+Z`).
3. **Headless Domain Core**: Audio/video clip metadata, waveform calculations, and sync state are pure headless DTOs.
4. **Media Preview Boundary**: Media preview resolution delegates strictly to `MediaPreviewAdapter` without adding WebGL/WebGPU or secondary canvas renderers.

---

## Data & Command Protocol

```
Timeline Playhead
       ↓
Playback Session (Single SSOT Playhead)
       ↓
MediaSyncCoordinator
       ├── AudioPosition (AudioTimelineEngine)
       └── VideoPosition (VideoTimelineEngine)
       ↓
MediaPreviewAdapter
       ↓
RenderingEngine
       ↓
CanvasRenderer
```

---

## Core Components

- **`MediaTimelineModel.ts`**: Pure domain DTO interfaces for `AudioMediaClip`, `VideoMediaClip`, `MediaTrack`, and `ClipTrimRange`.
- **`AudioTimelineEngine.ts`**: Audio duration, in/out points, gain, volume, mute, fade-in/fade-out, and waveform amplitude DTO calculation.
- **`VideoTimelineEngine.ts`**: Video duration, trim range, source offset, poster frame, opacity, transform/crop, and video frame position resolution.
- **`MediaTimelineEditingEngine.ts`**: Non-destructive clip editing (`splitClip`, `trimLeft`, `trimRight`, `moveClip`, `duplicateClip`, `applyRippleEdit`).
- **`MediaSyncCoordinator.ts`**: Coordinates single playhead position across property animation tracks, audio clips, and video tracks.
- **`TimelineMediaTracks.tsx`**: Timeline UI rendering for audio/video tracks, clip cards, SVG waveforms, video thumbnails, trim handles, and mute/solo controls.
- **`MediaPreviewAdapter.ts`**: Adapter connecting media clips to existing `PlaybackSession` and `RenderingEngine` infrastructure.
