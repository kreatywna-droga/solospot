# TODO_PM37.md — Playback Studio Integration & Timeline Interaction

> Status: **IMPLEMENTATION IN PROGRESS**
> Package: `packages/authoring-studio`
> Governance: DECISION-046 / DECISION-047 / DECISION-048 / DECISION-051 / DECISION-052

## Scope
Integration layer that connects PM30 Playback Engine, PM32 Runtime Bridge, PM33 Trigger Engine,
PM34 Preview Adapter, PM35 Inspector, and PM36 Timeline Editor into one coherent Studio architecture.
NO new engine, NO builder-core modification, NO interpolation execution in authoring layer.

## ETAP Progress

### ETAP 1 — Timeline Playback Session ✅
- [ ] `TimelinePlaybackSession.ts` — pure state model (currentTime, selectedTimeline, play/pause/stop/seek)
- [ ] No own clock, no playback loop, no scheduler creation

### ETAP 2 — Timeline Transport Controller ✅
- [ ] `TimelineTransportController.ts` — command-only (Play/Pause/Stop/Seek/FrameStep/JumpToKeyframe)
- [ ] DECISION-051: emits command objects; never calls Runtime/Playback directly

### ETAP 3 — Timeline Cursor ✅
- [ ] `TimelineCursor.ts` — immutable model (currentTime, frameIndex, selectedKeyframe, selectedClip, playheadPosition)

### ETAP 4 — Studio Bridge ✅
- [ ] `TimelineStudioBridge.ts` — Timeline Panel → Playback Session → Preview Adapter → Runtime Bridge
- [ ] DECISION-052: only Studio Bridge delegates to AnimationRuntimeBridge / AnimationRuntimePreviewBridge
- [ ] No DOM, no React, dependency injection only

### ETAP 5 — Selection Synchronization ✅
- [ ] `timelineSelectionSync.ts` — one-directional sync via BuilderDocument, loop-guarded

### ETAP 6 — DTO Synchronization ✅
- [ ] `timelineDtoSync.ts` — BuilderDocument → AnimationTimeline DTO → Session → Preview (SSOT preserved)

### ETAP 7 — Tests (Node, no jsdom) ✅
- [ ] `__tests__/TimelinePlaybackSession.test.ts`
- [ ] `__tests__/TimelineTransportController.test.ts`
- [ ] `__tests__/TimelineCursor.test.ts`
- [ ] `__tests__/TimelineStudioBridge.test.ts`
- [ ] `__tests__/TimelineSelectionSync.test.ts`
- [ ] `__tests__/TimelinePreviewIntegration.test.ts`

### ETAP 8 — Public API ✅
- [ ] `timeline/index.ts` barrel export updated
- [ ] `packages/authoring-studio/src/index.ts` updated

### Deliverables ✅
- [ ] `TODO_PM37.md` (this file)
- [ ] `docs/studio/PM37_DELTA_IMPLEMENTATION_REPORT.md`
- [ ] Architectural Decisions Implemented (DECISION-046/047/048/051/052)
- [ ] File Delta Manifest
- [ ] Quality Gates (tsc / vitest / build)
- [ ] Public API Manifest

## Quality Gates
- [ ] `npx tsc --noEmit`
- [ ] `npx vitest run packages/authoring-studio/src/timeline`
- [ ] `npm run build`

## Forbidden (must NOT be added)
- modifying PM29–PM36, modifying builder-core, PlaybackController in UI, requestAnimationFrame,
  setTimeout, setInterval, Browser API, RuntimeScheduler, interpolation execution in authoring layer,
  CSS generation, Canvas control.

## Handoff
1. Agent 1 delivers Delta Implementation Report.
2. Agent 2 executes Code Evidence Audit v2.8 (READ ONLY).
3. Agent 2 issues Recommendation: PASS / HOLD / FAIL.
4. Architect decides FORMALLY RATIFIED 🔒.
