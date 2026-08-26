# S38 Architecture Specification — Live Canvas & Real-Time Animation Preview Sync

> **Subsystem:** Authoring Studio — Live Canvas & Real-Time Animation Preview Sync (Sprint S38 / PM38)  
> **Author:** Agent 1 — Senior Architect & Planning Agent  
> **Status:** PROPOSED — REVISED ARCHITECTURE (FINAL REPAIR CYCLE F-38-02 & F-38-03 COMPLETE)  
> **Dependencies:** `builder-core` (`BuilderDocument`, `SectionNode`, `AnimationTypes`, `AnimationTimeline`, `HistoryStack`, `AnimationPlaybackController`, `RuntimeScheduler`, `AnimationRuntimeBridge`, `AnimationRuntimePreviewAdapter`, `AnimationTriggerEngine`), S33 Triggers, S34 Runtime Preview, S35 Inspector Animation Panel, S36 Timeline Editor, S37 Playback Studio Integration (`TimelineStudioBridge`, `TimelinePlaybackSession`, `TimelineTransportController`, `TimelineSelectionSync`)

---

## 1. Executive Summary & Core Objective

Sprint S38 delivers the **Live Canvas & Real-Time Animation Preview Synchronization layer** within Authoring Studio (`packages/authoring-studio/src/preview/`). It connects the ratified Playback & Timeline Editor subsystem with the Live Canvas / Preview rendering surface in real time:

$$\text{Timeline UI} \xrightarrow[\text{Play / Pause / Seek}]{\text{Transport Commands}} \text{TimelineStudioBridge} \xrightarrow[\text{AnimationPlaybackController}]{\text{Single Time Owner}} \text{AnimationRuntimeBridge} \xrightarrow[\text{evaluateFrame()}]{\text{RuntimeFrameBatch}} \text{PreviewRuntimeCoordinator} \xrightarrow[\text{renderFrame callback}]{\text{Live Canvas / Host Renderer}}$$

S38 answers the central integration requirement:

> *"How do playhead movement, timeline scrubbing, and playback execution reflect onto the Live Canvas surface in real-time, instantly resolving frame batches via builder-core without introducing a second animation engine, second scheduler, or second time controller?"*

S38 **is not** an Animation Engine, Renderer, or Scheduler. It operates as a pure, decoupled **Dispatcher-Only Layer** (Option B Boundary):

1. **Single Time Owner Preservation (F-38-03 / DECISION-056):** `AnimationPlaybackController` (from `builder-core`) inside `TimelineStudioBridge` is the SINGLE, EXCLUSIVE owner of playback time and status (`session.duration`, `session.loop`, `session.status`). `PreviewRuntimeCoordinator` and `KeyframeDragPreview` derive runtime state from `TimelineStudioBridge.session` and timeline DTOs, removing hardcoded `duration: 0` / `speed: 1`.
2. **Dispatcher-Only Live Canvas Boundary (F-38-02 / Option B):** S38 acts as a pure frame batch dispatcher. Evaluated `RuntimeFrameBatch` objects are passed to host-provided `renderFrame` callbacks (`PreviewRuntimeCoordinator` $\rightarrow$ `RuntimeFrameBatch` $\rightarrow$ `host-provided renderFrame callback` $\rightarrow$ `Live Canvas / host renderer`). S38 does not claim that a production `LiveCanvasAdapter` renderer class exists in the authoring-studio package.
3. **Verified Production API Alignment (F-38-01):** 0 Phantom APIs. All documented symbols (`updateDocument`, `syncTimelinePlayhead`, `syncPreviewPlayhead`, `scrubTo`, `dragKeyframe`, `updateKeyframeTime`) correspond 100% to actual production source code in `packages/authoring-studio/src/preview/`.
4. **Strict SSOT Preservation:** `BuilderDocument` (`node.props['animationTimeline']`) is the ONLY document configuration store. Pure live preview actions (playhead scrubbing, seeking, playback) DO NOT mutate `BuilderDocument` (`JSON.stringify(docBefore) === JSON.stringify(docAfter)`) and DO NOT push entries onto `HistoryStack<BuilderDocument>`.

---

## 2. Subsystem Architecture & Synchronization Pipeline Flow

```
+-----------------------------------------------------------------------------------+
|                           BuilderDocument (SSOT)                                  |
|   node.props['animationTimeline'] -> AnimationTimeline DTO (Immutable Config)     |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (Inspects DTO / Edits Timeline)
+-----------------------------------------------------------------------------------+
|        S36 Timeline Editor & Lossless Binding (timelineDocumentBinding.ts)        |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (Selects Timeline into Session)
+-----------------------------------------------------------------------------------+
|          TimelineStudioBridge (S37 Integration & Orchestration Layer)            |
|   - AnimationPlaybackController (builder-core: SINGLE OWNER OF TIME)              |
|   - TimelinePlaybackSession (Read-Only Projection Snapshot)                       |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (Evaluates Frame)
+-----------------------------------------------------------------------------------+
|            AnimationRuntimeBridge.evaluateFrame(timeline, state, time)            |
|            -> Resolves RuntimeFrameBatch (pure interpolated property values)      |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (Dispatches Live Canvas Frame Batch)
+-----------------------------------------------------------------------------------+
|            PreviewRuntimeCoordinator (S38 Dispatcher-Only Layer)                  |
|   - LiveScrubbingEngine.scrubTo(timeline, timeMs, baseState)                      |
|   - PreviewPlayheadSync (Loop-Guarded Timeline <-> Canvas Time Sync)              |
|   - Dispatches Frame Batch to host-provided renderFrame callback                  |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (Renders Animated Properties)
+-----------------------------------------------------------------------------------+
|                            Live Canvas / Host Renderer                            |
+-----------------------------------------------------------------------------------+

=====================================================================================
STRICT BOUNDARY (DECISION-046 / DECISION-056) — ZERO DUPLICATE ENGINES
   ❌ NO Secondary Playback Engine     ❌ NO Secondary RuntimeScheduler
   ❌ NO Secondary Trigger Engine      ❌ NO Secondary AnimationRuntimeBridge
   ❌ NO Secondary HistoryStack        ❌ NO Secondary SSOT / PlaybackDocument
   ❌ NO requestAnimationFrame in core ❌ NO Custom Animation Interpolators
=====================================================================================
```

---

## 3. Real-Time Live Canvas Boundary (Option B — Dispatcher-Only Layer)

S38 is a dispatcher-only layer. The frame pipeline delivers resolved `RuntimeFrameBatch` objects directly to host-provided rendering callbacks:

$$\text{PreviewRuntimeCoordinator} \longrightarrow \text{RuntimeFrameBatch} \longrightarrow \text{host-provided renderFrame callback} \longrightarrow \text{Live Canvas / host renderer}$$

---

## 4. Governance & Architectural Decisions

### DECISION-056 — Single Time Owner Delegation (F-38-03)
- `AnimationPlaybackController` inside `TimelineStudioBridge` is the SINGLE, EXCLUSIVE owner of time.
- `PreviewRuntimeCoordinator` and `KeyframeDragPreview` derive `RuntimeState` directly from `this._session` snapshot (`status`, `duration`, `speed`, `loop`) and timeline DTOs. Hardcoded `duration: 0` and `speed: 1` are removed.

### DECISION-057 — Strict Dependency Injection (No Singletons)
- All preview coordinator dependencies (`session`, `runtimeBridge`, `document`) are injected via constructor interfaces (`PreviewCoordinatorDependencies`).

### DECISION-058 — Loop-Guarded Playhead Synchronization
- Bidirectional playhead time sync (`syncTimelinePlayheadToPreview`, `syncPreviewPlayheadToTimeline`) is guarded by atomic source tagging (`'timeline'` | `'preview'`) and a `0.001ms` threshold to prevent recursion loops.

### DECISION-059 — Zero Document Mutation During Live Canvas Sync
- Live playhead scrubbing, frame evaluation, and playback canvas updates MUST NOT mutate `BuilderDocument`.
- `JSON.stringify(docBefore) === JSON.stringify(docAfter)` is strictly enforced for all preview actions.

---

## 5. Verified Production API Inventory (`packages/authoring-studio/src/preview/`)

| API Symbol | Source File Location | Exact Signature & Properties | Primary Responsibility | S38 Scope & Usage |
|---|---|---|---|---|
| `PreviewRuntimeCoordinator` | `packages/authoring-studio/src/preview/PreviewRuntimeCoordinator.ts` | `new PreviewRuntimeCoordinator(deps)`<br>`updateDocument(doc)`, `syncTimelinePlayhead(targetTimeMs)`, `syncPreviewPlayhead(previewTimeMs)`, `scrubTo(timeMs)`, `dragKeyframe(...)` | Pure orchestrator coordinating real-time animation preview rendering and live canvas playhead sync. | **REAL-TIME CANVAS DISPATCHER** |
| `LiveScrubbingEngine` | `packages/authoring-studio/src/preview/LiveScrubbingEngine.ts` | `new LiveScrubbingEngine(options)`<br>`startScrubbing()`, `scrubTo(timeline, timeMs, baseState)`, `stopScrubbing()` | Evaluates target timeline frame at exact scrub position via `ScrubbingRuntimeBridge`, deriving state from single time owner. | **LIVE SCRUBBING EVALUATOR** |
| `PreviewPlayheadSync` | `packages/authoring-studio/src/preview/PreviewPlayheadSync.ts` | `createPlayheadSyncState()`<br>`syncTimelinePlayheadToPreview(state, session, timeMs)`<br>`syncPreviewPlayheadToTimeline(state, session, timeMs)` | Loop-guarded playhead time synchronization between Timeline and Preview surface. | **PLAYHEAD TIME SYNC** |
| `PreviewSelectionSync` | `packages/authoring-studio/src/preview/PreviewSelectionSync.ts` | `createTriSelectionState()`<br>`syncPreviewSelectionToStudio(...)`, `syncTimelineSelectionToPreview(...)` | Tri-directional selection sync (Timeline $\leftrightarrow$ Inspector $\leftrightarrow$ Preview). | **SELECTION SYNC** |
| `KeyframeDragPreview` | `packages/authoring-studio/src/preview/KeyframeDragPreview.ts` | `new KeyframeDragPreview(options)`<br>`updateKeyframeTime(doc, nodeId, clipId, trackId, kfId, newOffset, currentTime)` | Evaluates runtime frame batch during interactive keyframe dragging, deriving state from timeline DTO. | **DRAG RE-EVALUATION** |
| `TimelineRuntimeConnector` | `packages/authoring-studio/src/ui/runtime/TimelineRuntimeConnector.ts` | `seekTimelinePlayheadInRuntime(state, targetTimeMs)` | Updated legacy S4 connector invoking `TimelineTransportController.seek(session, targetTimeMs)`. | **S4 LEGACY CONNECTOR FIX** |
| `index.ts` | `packages/authoring-studio/src/preview/index.ts` | Public barrel export for Preview subsystem. | Public barrel export. | **PUBLIC BARREL** |

---

## 6. Golden E2E Verification Workflow (`TimelineLiveCanvasSyncE2E.test.ts`)

The Golden E2E Integration Test for Sprint S38 verifies real-time live canvas synchronization:

```
 1. Create BuilderDocument & SectionNode via canonical production factories (createBuilderDocument with metadata).
 2. Attach complex AnimationTimeline DTO (2 clips, 2 tracks, 3 keyframes, playback speed = 1.5) to node.props['animationTimeline'].
 3. Instantiate TimelineStudioBridge (Single Owner of Time via AnimationPlaybackController).
 4. Instantiate PreviewRuntimeCoordinator injecting TimelineStudioBridge runtimeBridge & session.
 5. Select timeline in bridge via bridge.selectTimeline(timeline).
 6. Execute bridge.play() -> verify single time owner status === 'playing'.
 7. Advance playhead by 250ms -> verify single time owner time === 375ms (250 * 1.5).
 8. Execute playhead seek to 500ms via bridge.seek(500) -> verify resolved frame batch evaluated for canvas.
 9. Execute live scrubbing to 750ms via coordinator.scrubTo(750) -> verify frameBatch evaluated via LiveScrubbingEngine.
10. Dispatch frame batch to hostRenderFrameCallback(frameBatch) (Option B test harness callback).
11. Execute bridge.pause() and bridge.stop() -> verify live canvas synchronization stops cleanly and playhead resets to 0.
12. VERIFY SSOT INTEGRITY & ZERO DOCUMENT MUTATION:
    JSON.stringify(docBefore) === JSON.stringify(docAfter) and HistoryStack length is 100% unchanged during all live canvas sync actions.
```

---

## 7. Summary of Architectural Guarantees

- **0 Phantom APIs (F-38-01):** All preview synchronization APIs map 100% to verified production modules in `packages/authoring-studio/src/preview/`.
- **Option B Dispatcher Boundary (F-38-02):** `PreviewRuntimeCoordinator` dispatches `RuntimeFrameBatch` directly to host callbacks without fake adapter classes.
- **Single Time Owner (F-38-03):** `AnimationPlaybackController` inside `TimelineStudioBridge` remains exclusive time engine. 0 hardcoded `duration: 0` / `speed: 1` in `preview/`.
- **Golden E2E Verification (F-38-04):** [`TimelineLiveCanvasSyncE2E.test.ts`](file:///c:/Users/HP/Documents/GOOGLE%20ANTIGRAVITY%20APK/WEB%20FACTOR/packages/authoring-studio/src/preview/__tests__/TimelineLiveCanvasSyncE2E.test.ts) passing 100%.
- **Freeze Preservation:** Subsystems S1–S37 and `BuilderDocument.ts` remain 100% frozen.
