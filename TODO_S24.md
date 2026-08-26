# TODO_S24.md — Professional Timeline & Keyframe Authoring UX

> Status: **IMPLEMENTED & AUDIT-READY**
> Package: `packages/authoring-studio`
> Architecture: Closed Timeline Pipeline (Timeline UI → S24 Keyframe Interaction → AnimationTimeline → HistoryStack → BuilderDocument)

## ETAP Progress

### ETAP 1 — Keyframe Selection UX ✅
- [x] `TimelineSelectionController.ts` — single select, toggle select (Ctrl/Cmd), range select (Shift), select all, deselect all, selection persistence

### ETAP 2 — Keyframe Manipulation ✅
- [x] `TimelineKeyframeController.ts` — single move, batch move, copy payload, paste, duplicate (`Ctrl+D`), delete

### ETAP 3 — Timeline Snapping ✅
- [x] `TimelineSnappingController.ts` — grid, 24/30/60 FPS frames, markers, playhead, clip boundaries snapping

### ETAP 4 — Markers & Loop Regions ✅
- [x] `TimelineMarkersRegionsModel.ts` — DTOs for TimelineMarker and LoopRegion
- [x] `TimelineMarkersRegionsController.ts` — marker CRUD, lock state, loop region bounds and active toggle

### ETAP 5 — Easing Curve Authoring ✅
- [x] `TimelineCurveAuthoringController.ts` — preset easing curves, cubic-bezier control points (x1, y1, x2, y2), tangent handle manipulation (P1/P2), direct keyframe value editing

### ETAP 6 — Timeline Navigation & Viewport ✅
- [x] `TimelineViewController.ts` — timeline zoom, pan, fit animation, fit selection, center playhead

### ETAP 7 — Keyboard Workflow & Closed Pipeline ✅
- [x] `TimelineKeyboardInteractionHandler.ts` — nudging (1ms/10ms), jump prev/next keyframe (J/K), shortcuts (Ctrl+C/V/D/A, Delete)
- [x] `TimelineInteractionPipeline.ts` — closed 5-step transaction pipeline committing all document mutations to `HistoryStack<BuilderDocument>`

### ETAP 8 — UI Adapter Layer ✅
- [x] `TimelineRulerOverlay.tsx` — time ruler ticks, playhead scrubber, loop region highlight, marker flags
- [x] `CurveEditorOverlay.tsx` — interactive SVG cubic-bezier curve authoring popup
- [x] `TimelineKeyframeViewport.tsx` — unified React timeline viewport component

### ETAP 9 — Vitest Test Suites (6/6 PASS) ✅
- [x] `TimelineKeyframeSelectionUX.test.ts`
- [x] `TimelineKeyframeManipulation.test.ts`
- [x] `TimelineSnappingUX.test.ts`
- [x] `TimelineMarkersRegions.test.ts`
- [x] `TimelineCurveAuthoring.test.ts`
- [x] `TimelineKeyboardPipeline.test.ts`

### ETAP 10 — Architecture & API Documentation ✅
- [x] `docs/studio/S24_TIMELINE_KEYFRAME_ARCHITECTURE.md`
- [x] `docs/studio/S24_KEYFRAME_API.md`
