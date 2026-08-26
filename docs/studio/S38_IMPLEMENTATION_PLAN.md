# S38 Implementation Plan — Live Canvas & Real-Time Animation Preview Sync

> **Subsystem:** Authoring Studio — Live Canvas & Real-Time Animation Preview Sync (Sprint S38 / PM38)  
> **Author:** Agent 1 — Senior Architect & Planning Agent  
> **Status:** PROPOSED — WAITING FOR AGENT 2 FOCUSED DELTA AUDIT & ARCHITECT RATIFICATION (NO S38-C IMPLEMENTATION EXECUTED)  
> **Target Package:** `packages/authoring-studio` (`src/preview/`)

---

## 1. Goal & Objectives

Deliver the **Live Canvas & Real-Time Animation Preview Synchronization** layer for Authoring Studio (`packages/authoring-studio/src/preview/`). Connect the ratified Playback & Timeline Editor subsystem with the Live Canvas / Preview rendering surface in real-time. Ensure playhead scrubbing, timeline seeking, playback execution, and keyframe dragging immediately resolve frame batches via `AnimationRuntimeBridge.evaluateFrame()` and dispatch updated properties to host rendering callbacks with 0 DOM/runtime execution, 0 duplicate engines, 0 phantom APIs, 0 hardcoded time parameters (`duration: 0` / `speed: 1`), and 100% SSOT preservation.

---

## 2. Technical Implementation Scope & Production Inventory

### Component 1: Preview Runtime Coordinator (`packages/authoring-studio/src/preview/`)
- **`PreviewRuntimeCoordinator.ts` (Fixed / F-38-03 Fix):** Pure orchestrator coordinating real-time animation preview rendering (`updateDocument`, `syncTimelinePlayhead`, `syncPreviewPlayhead`, `scrubTo`, `dragKeyframe`, `evaluateCurrentFrame`), deriving duration and speed from session and timeline DTOs.

### Component 2: Live Scrubbing & Drag Evaluation (`packages/authoring-studio/src/preview/`)
- **`LiveScrubbingEngine.ts` (Fixed / F-38-03 Fix):** Real-time playhead scrubbing evaluator resolving frame batches via `ScrubbingRuntimeBridge`, deriving `RuntimeState` from Single Time Owner.
- **`KeyframeDragPreview.ts` (Fixed / F-38-03 Fix):** Interactive keyframe drag frame evaluator (`updateKeyframeTime`), deriving duration and speed from timeline DTOs.

### Component 3: Playhead & Selection Synchronization (`packages/authoring-studio/src/preview/`)
- **`PreviewPlayheadSync.ts` (Verified):** Loop-guarded playhead time synchronization between Timeline and Preview surface.
- **`PreviewSelectionSync.ts` (Verified):** Tri-directional selection sync (Timeline $\leftrightarrow$ Inspector $\leftrightarrow$ Preview).

### Component 4: S4 Legacy Connector Fix (`packages/authoring-studio/src/ui/runtime/`)
- **`TimelineRuntimeConnector.ts` (Fixed / F-38-04 Fix):** Updated to invoke `TimelineTransportController.seek(session, targetTimeMs)` static API.

### Component 5: Golden E2E Integration Suite (`packages/authoring-studio/src/preview/__tests__/`)
- **`TimelineLiveCanvasSyncE2E.test.ts` (Implemented / Option B Harness):** Golden E2E integration test verifying real-time live canvas synchronization:
  `BuilderDocument` $\rightarrow$ complex `AnimationTimeline` (2 clips, 2 tracks, 3 keyframes, `speed = 1.5`) $\rightarrow$ `TimelineStudioBridge.selectTimeline()` $\rightarrow$ `play()` $\rightarrow$ `advance(250)` $\rightarrow$ `seek(500)` $\rightarrow$ `LiveScrubbingEngine.scrubTo(750)` $\rightarrow$ `hostRenderFrameCallback()` $\rightarrow$ `pause()` $\rightarrow$ `stop()` $\rightarrow$ `JSON.stringify(docBefore) === JSON.stringify(docAfter)` $\rightarrow$ 0 document mutations during live canvas sync.

---

## 3. Verification Plan & Acceptance Thresholds

### Automated Commands
```bash
# 1. Dedicated S38 TypeScript check
npm run typecheck:s38

# 2. Scope Vitest S38 Golden E2E suite
npx vitest run packages/authoring-studio/src/preview/__tests__/TimelineLiveCanvasSyncE2E.test.ts

# 3. Scope full S38 preview Vitest tests
npx vitest run packages/authoring-studio/src/preview/__tests__/

# 4. Production Build check
npm run build
```

### Acceptance Thresholds
- **Vitest S38 Scope:** ✅ **100% PASS across all S38 preview integration test suites.**
- **TypeScript:** ✅ **0 errors in S38 scope (`npm run typecheck:s38`).**
- **Build:** ✅ **Exit code 0 (`ignoreBuildErrors: false`).**
- **Single Owner of Time:** `AnimationPlaybackController` in `TimelineStudioBridge` is single time owner; 0 `duration: 0` or `speed: 1` hardcoding in `preview/`.
- **SSOT Integrity:** `BuilderDocument.ts` remains 100% FROZEN; `JSON.stringify(docBefore) === JSON.stringify(docAfter)` during live canvas sync.

---

## 4. Governance Workflow

```
[Agent 1 Repo Discovery & Final Repair (Faza S38-A)]
                         │
                         ▼
[Agent 2 Focused Delta Audit F-38-02 + F-38-03 ONLY (Faza S38-B)]
                         │
                  +------+------+
                  │             │
               (PASS)        (HOLD)
                  │             │
                  v             v
       [Architect Approval]   [Architecture Delta]
                  │
                  v
       [Agent 1 Implementation Phase (Faza S38-C)]
```

*Agent 1 does not execute S38-C code implementation until Agent 2 and Architect approve the architecture.*
