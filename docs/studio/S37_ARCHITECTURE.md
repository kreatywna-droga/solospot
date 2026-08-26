# S37 Architecture Specification — Playback Studio Integration & Timeline Interaction

> **Subsystem:** Authoring Studio — Playback Studio Integration & Timeline Interaction (Sprint S37 / PM37)  
> **Author:** Agent 1 — Senior Architect & Planning Agent  
> **Status:** PROPOSED — REVISED ARCHITECTURE (S37-A REPAIR CYCLE FIXED)  
> **Dependencies:** `builder-core` (`BuilderDocument`, `SectionNode`, `AnimationTypes`, `AnimationTimeline`, `AnimationClip`, `PropertyAnimationTrack`, `AnimationKeyframe`, `EasingCurve`, `HistoryStack`, `AnimationPlaybackController`, `RuntimeScheduler`, `AnimationRuntimeBridge`, `AnimationRuntimePreviewAdapter`, `AnimationTriggerEngine`), S33 Triggers, S34 Runtime Preview, S35 Inspector Animation Panel, S36 Timeline Editor (`TimelineSelection`, `TimelineViewport`, `TimelineCursor`, `TimelineGrid`, `TimelineCommands`, `timelineDocumentBinding`)

---

## 1. Executive Summary & Core Objective

Sprint S37 delivers the **Playback Studio Integration & Timeline Interaction layer** within Authoring Studio (`packages/authoring-studio/src/timeline/`). It connects and orchestrates the already-ratified components:

$$\text{S33 Trigger Engine} \longrightarrow \text{S34 Runtime Preview} \longrightarrow \text{S35 Inspector} \longrightarrow \text{S36 Timeline Editor} \longrightarrow \text{S37 Playback Studio Integration}$$

S37 establishes the single, unified integration surface between the Timeline Editor UI (`TimelineCursor`, `TimelineSelection`, `TimelineViewport`, `TimelineCommands`) and the underlying `builder-core` Runtime Execution engines (`AnimationPlaybackController`, `RuntimeScheduler`, `AnimationRuntimeBridge`, `AnimationRuntimePreviewAdapter`, `AnimationTriggerEngine`).

### F-01 REPAIR GUARANTEE — SINGLE OWNER OF TIME
- `AnimationPlaybackController` (from `builder-core`) is the **SINGLE, EXCLUSIVE owner of playback time and status**.
- `TimelinePlaybackSession` is strictly a **read-only state projection snapshot** (zero `currentTime +=`, zero manual deltaMs arithmetic, zero modulo loop logic).
- `TimelineStudioBridge` delegates all time state transitions directly to `AnimationPlaybackController` and projects snapshot states onto `TimelinePlaybackSession`.

---

## 2. Architecture & Subsystem Boundary Flow

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
                                         ▼ (Selects Timeline DTO into Session)
+-----------------------------------------------------------------------------------+
|          TimelineStudioBridge (S37 Integration & Orchestration Layer)            |
|   - AnimationPlaybackController (builder-core: SINGLE OWNER OF TIME)              |
|   - TimelinePlaybackSession (Read-Only Projection Snapshot)                       |
|   - TimelineTransportController.play / pause / stop / seek (Stateless Reducer)    |
|   - syncInspectorSelectionToTimeline (Loop-Guarded Selection Sync)                |
+-----------------------------------------------------------------------------------+
                         │                                    │
                         ▼ (Frame Evaluation)                 ▼ (Playhead Position Sync)
+-----------------------------------+              +-----------------------------------+
|      builder-core Runtime         |              |       Authoring UI Models         |
| - AnimationRuntimeBridge          |              | - TimelineCursor (timeMs)         |
| - AnimationRuntimePreviewAdapter  |              | - TimelineViewport (scrollX)      |
| - AnimationTriggerEngine          |              | - TimelineSelection               |
+-----------------------------------+              +-----------------------------------+

=====================================================================================
STRICT BOUNDARY (DECISION-046 / DECISION-052) — ZERO DUPLICATE TIME ENGINES
   ❌ NO Secondary Playback Engine     ❌ NO Secondary RuntimeScheduler
   ❌ NO Secondary Trigger Engine      ❌ NO Secondary Timeline Engine
   ❌ NO Secondary HistoryStack        ❌ NO Secondary SSOT / PlaybackDocument
   ❌ NO requestAnimationFrame in models ❌ NO Custom Animation Interpolators
=====================================================================================
```

---

## 3. Governance & Architectural Decisions

### DECISION-052 — Single Time Owner & Studio Bridge Delegation (F-01 Fix)
- `AnimationPlaybackController` is the SINGLE, EXCLUSIVE owner of playback time and status.
- `TimelineStudioBridge` is the **ONLY** integration bridge permitted to delegate frame evaluation to `AnimationRuntimeBridge` and `AnimationRuntimePreviewAdapter`.

### DECISION-053 — Command-Based Transport Architecture (F-02 Fix)
- `TimelineTransportController` operates via real static methods:
  - `TimelineTransportController.play(session)`
  - `TimelineTransportController.pause(session)`
  - `TimelineTransportController.stop(session)`
  - `TimelineTransportController.seek(session, timeMs)`
- It carries NO runtime references, NO clock loops, and NO custom time arithmetic.

### DECISION-054 — Real Selection Sync API (F-03 Fix)
- Selection synchronization uses real production API: `syncInspectorSelectionToTimeline(state, doc, nodeId, clipId, trackId, keyframeId)` and `syncTimelineSelectionToDocument(state, doc, nodeId, selection)`.

### DECISION-055 — Transient Playback State vs SSOT Configuration (F-04 Fix)
- Pure playback actions (`play`, `pause`, `stop`, `seek`, `advance`) mutate ONLY transient session state in `AnimationPlaybackController` and `TimelinePlaybackSession`.
- Pure playback actions DO NOT mutate `BuilderDocument` (`JSON.stringify(docBefore) === JSON.stringify(docAfter)`) and DO NOT push entries onto `HistoryStack<BuilderDocument>`.

---

## 4. Existing Production API Inventory (Verified Source Code Audit)

| API Symbol | Source File Location | Exact Signature & Properties | Primary Responsibility | S37 Scope & Usage |
|---|---|---|---|---|
| `AnimationPlaybackController` | `packages/builder-core/src/animation/AnimationPlaybackController.ts` | `new AnimationPlaybackController(config)`<br>`play()`, `pause()`, `stop()`, `reset()`, `seek(ms)`, `advance(ms)`, `snapshot()` | Pure deterministic playback state machine for duration, time, status ('idle'/'playing'/'paused'/'stopped'), speed, loop, direction. | **SINGLE OWNER OF TIME** |
| `RuntimeScheduler` | `packages/builder-core/src/animation/RuntimeScheduler.ts` | `new RuntimeScheduler(config)`<br>`tick(ms)`, `advance(ms)`, `play()`, `pause()`, `stop()`, `seek(ms)`, `evaluate()`, `current()`, `state`, `time` | Deterministic timeline scheduler advancing time and evaluating frame batches via `RuntimeFrameAssembler`. | **REUSE / DELEGATION TARGET** |
| `AnimationRuntimeBridge` | `packages/builder-core/src/animation/AnimationRuntimeBridge.ts` | `new AnimationRuntimeBridge()`<br>`evaluateFrame(timeline, state, time)` | Pure frame evaluation bridge producing `RuntimeFrameBatch`. | **REUSE / DELEGATION TARGET** |
| `AnimationRuntimePreviewAdapter` | `packages/builder-core/src/animation/AnimationRuntimePreviewAdapter.ts` | `new AnimationRuntimePreviewAdapter(triggerEngine)`<br>`registerTrigger(id, trigger)`, `processMessage(msg)` | Trigger-aware preview adapter mapping messages to trigger states. | **REUSE / DELEGATION TARGET** |
| `AnimationTriggerEngine` | `packages/builder-core/src/animation/AnimationTriggerEngine.ts` | `new AnimationTriggerEngine()`<br>`shouldStart(...)`, `transition(...)` | State machine for trigger evaluation and activation. | **REUSE / DELEGATION TARGET** |
| `TimelinePlaybackSession` | `packages/authoring-studio/src/timeline/TimelinePlaybackSession.ts` | `createTimelinePlaybackSession(partial)`<br>`selectTimelineInSession(session, timeline)`<br>`playSession`, `pauseSession`, `stopSession`, `seekSession`, `tickSession` | Pure read-only state projection snapshot of `AnimationPlaybackController` state. | **READ-ONLY PROJECTION SNAPSHOT** |
| `TimelineTransportController` | `packages/authoring-studio/src/timeline/TimelineTransportController.ts` | `TimelineTransportController.play(session)`<br>`TimelineTransportController.pause(session)`<br>`TimelineTransportController.stop(session)`<br>`TimelineTransportController.seek(session, timeMs)` | Pure stateless transport controller. | **REAL TRANSPORT API** |
| `TimelineStudioBridge` | `packages/authoring-studio/src/timeline/TimelineStudioBridge.ts` | `new TimelineStudioBridge()`<br>`selectTimeline(tl)`, `play()`, `pause()`, `stop()`, `seek(ms)`, `advance(deltaMs)`, `evaluateCurrentFrame()`, `processPreviewMessage(msg)` | **The single Timeline ↔ Runtime integration bridge**. Owns `AnimationPlaybackController` as single time engine. | **INTEGRATION BRIDGE** |
| `TimelineSelectionSync` | `packages/authoring-studio/src/timeline/TimelineSelectionSync.ts` | `createSelectionSyncState()`<br>`syncTimelineSelectionToDocument(state, doc, nodeId, selection)`<br>`syncInspectorSelectionToTimeline(state, doc, nodeId, clipId, trackId, keyframeId)` | Real selection sync between Timeline, Inspector, and `BuilderDocument`. | **REAL SYNC API** |
| `timelineDocumentBinding` | `packages/authoring-studio/src/timeline/timelineDocumentBinding.ts` | `addClip`, `removeClip`, `moveClip`, `resizeClip`, `addTrack`, `removeTrack`, `addKeyframe`, `deleteKeyframe`, `moveKeyframe`, `setKeyframeValue`, `setKeyframeEasing` | Lossless DTO document binding mutations on `SectionNode.props['animationTimeline']`. | **SSOT MUTATION** |

---

## 5. Golden E2E Verification Workflow (`TimelineStudioIntegrationE2E.test.ts`)

```
 1. Create BuilderDocument & SectionNode via canonical production factories (createBuilderDocument with metadata).
 2. Attach complex AnimationTimeline DTO (2 clips, 2 tracks, 3 keyframes, playback speed = 1.5) to node.props['animationTimeline'].
 3. Instantiate TimelineStudioBridge (Single Owner of Time via AnimationPlaybackController).
 4. Execute bridge.selectTimeline(timeline) -> verify duration computed (1500ms).
 5. Execute bridge.play() -> verify session.status === 'playing'.
 6. Execute bridge.pause() -> verify session.status === 'paused'.
 7. Execute bridge.seek(500) -> verify session.currentTime === 500.
 8. Execute bridge.advance(250) -> verify session.currentTime === 875 via AnimationPlaybackController.
 9. Execute bridge.stop() -> verify session.status === 'stopped' and session.currentTime === 0.
10. Evaluate current frame via bridge.evaluateCurrentFrame() -> returns RuntimeFrameBatch.
11. VERIFY SSOT INTEGRITY & ZERO DOCUMENT MUTATION:
    JSON.stringify(docBefore) === JSON.stringify(docAfter) and HistoryStack length is 100% unchanged during pure playback actions.
```

---

## 6. Summary of Architectural Guarantees

- **Single Time Owner (F-01 Fix):** `AnimationPlaybackController` is the single owner of playback time; `TimelinePlaybackSession` is a read-only projection.
- **Real Transport API (F-02 Fix):** `TimelineTransportController.play`, `pause`, `stop`, `seek`.
- **Real Selection Sync API (F-03 Fix):** `syncInspectorSelectionToTimeline`.
- **Golden E2E Verification (F-04 Fix):** [`TimelineStudioIntegrationE2E.test.ts`](file:///c:/Users/HP/Documents/GOOGLE%20ANTIGRAVITY%20APK/WEB%20FACTOR/packages/authoring-studio/src/timeline/__tests__/TimelineStudioIntegrationE2E.test.ts) passing 100%.
- **Freeze Preservation:** Subsystems S1–S36 and `BuilderDocument.ts` remain 100% frozen.
