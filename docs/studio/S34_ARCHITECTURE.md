# S34 Architecture Specification — Runtime Preview Adapter & Execution Integration

> **Subsystem:** Authoring Studio & Builder Core — Runtime Preview Adapter & Execution Integration (Sprint S34)  
> **Author:** Agent 1 — Senior Architect & Planning Agent  
> **Status:** PROPOSED — DOCUMENTATION REVISED (S34-DOC-REPAIR FIXED)  
> **Dependencies:** `builder-core` (`AnimationTypes`, `AnimationTimeline`, `AnimationTriggerState`, `AnimationTriggerContext`, `AnimationTriggerEvaluator`, `AnimationTriggerEngine`, `AnimationPlaybackController`, `RuntimeScheduler`, `AnimationRuntimeBridge`, `AnimationRuntimePreviewBridge`, `BuilderDocument`), S28 Responsive, S29 Layout, S30 Inspector, S31 Live Preview, S32 Components, S33 Triggers

---

## 1. Executive Summary & Core Objective

Sprint S34 delivers the **Runtime Preview Adapter & Execution Integration layer**, bridging browser environment events (`scroll`, `click`, `hover`, `intersection/visibility`) to `builder-core`'s pure animation execution pipeline (`AnimationTriggerEngine`, `AnimationTriggerBridge`, `RuntimeScheduler`, `AnimationRuntimeBridge`).

S34 answers the fundamental architectural question:

> *"How does the Authoring Studio ingest real browser events and viewport state, translate them into pure, serializable AnimationTriggerContext snapshots without polluting builder-core with DOM/Browser APIs, and drive the RuntimeScheduler and AnimationRuntimeBridge frame assembly pipeline without creating duplicate engines or violating SSOT?"*

S34 **is not** a second playback engine, second document store, or custom scheduling loop. It provides a clean, decoupled two-tier architecture:

1. **Serializable Trigger Context Ingestion:** Ingests serializable `AnimationTriggerContext` snapshots (`scrollY`, `viewportWidth`, `viewportHeight`, `isHovered`, `isClicked`, `visibilityRatio`) created from environment events via `createTriggerContext()`.
2. **Core Preview Adapter & Bridges (`packages/builder-core/src/animation/`):** Pure TypeScript glue layer (`AnimationRuntimePreviewAdapter`, `AnimationTriggerBridge`, and `AnimationRuntimePreviewBridge`) that receives trigger context snapshots, evaluates trigger definitions via `AnimationTriggerEngine`, and delegates activations to `AnimationPlaybackController`, `RuntimeScheduler`, and `AnimationRuntimeBridge`.

---

## 2. Subsystem Architecture & Dual Execution Paths

```
+-----------------------------------------------------------------------------------+
|                  Environment / Preview Trigger Context Source                     |
|  Serializable context (scrollY, viewportWidth, isHovered, isClicked, visibility)  |
+-----------------------------------------------------------------------------------+
                                         │
                   =============================================  BOUNDARY (DECISION-039)
                                         │
                                         ▼ (Injects Context Snapshot)
+-----------------------------------------------------------------------------------+
|      AnimationRuntimePreviewAdapter (packages/builder-core/src/animation/)        |
|  - Updates AnimationTriggerContext snapshot                                       |
|  - Evaluates triggers via AnimationTriggerEngine                                  |
|  - Outputs TriggerEvaluationReport (activatedTriggerIds)                         |
+-----------------------------------------------------------------------------------+
                                         │
                    ┌────────────────────┴────────────────────┐
                    │                                         │
                    ▼                                         ▼
           [ PATH A: Trigger → Playback ]            [ PATH B: Scheduler → Runtime ]
+---------------------------------------+   +---------------------------------------+
|        AnimationTriggerBridge         |   |           RuntimeScheduler            |
|  - Binds triggerId -> Controller      |   |  - Manages timeline playhead time     |
|  - handleReport(report)               |   |  - play() / pause() / stop() / tick() |
|  - Calls controller.play()            |   +---------------------------------------+
+---------------------------------------+                       │
                    │                                           ▼
                    ▼                               AnimationRuntimeBridge
+---------------------------------------+   - evaluateFrame(timeline, state, time)  |
|     AnimationPlaybackController       |   - Produces RuntimeFrameBatch            |
|  - play() / pause() / advance(500)    |   +---------------------------------------+
|  - controller.currentTime === 500     |
+---------------------------------------+
```

---

## 3. Independent Execution Paths (S34-01 & S34-02 Fix)

The architecture explicitly maintains two decoupled execution paths without inventing artificial bridging APIs between `AnimationTriggerBridge` and `RuntimeScheduler`:

### 3.1 PATH A — Trigger → Playback Path
Driven by trigger events and `AnimationTriggerBridge`:
```
AnimationTrigger (Definition)
       ↓
AnimationTriggerEngine (Evaluates context -> state WAITING -> ACTIVE)
       ↓
AnimationRuntimePreviewAdapter (Produces TriggerEvaluationReport)
       ↓
AnimationTriggerBridge (handleReport(report) -> activates bound triggerId)
       ↓
AnimationPlaybackController.play()
       ↓
AnimationPlaybackController.advance(500)
       ↓
controller.currentTime === 500
```

### 3.2 PATH B — Scheduler → Runtime Frame Path
Driven by `RuntimeScheduler` and `AnimationRuntimeBridge`:
```
AnimationTimeline (Definition)
       ↓
RuntimeScheduler (Instantiated with timeline & playback config)
       ↓
RuntimeScheduler.play()
       ↓
RuntimeScheduler.tick(500)
       ↓
scheduler.time === 500
       ↓
AnimationRuntimeBridge.evaluateFrame(timeline, runtimeState, currentTime)
       ↓
RuntimeFrameBatch (clipId, time, values)
```

---

## 4. Subsystem Bridges Specification (S34-03 Fix)

S34 clearly distinguishes between the two specialized bridges in `packages/builder-core/src/animation/`:

1. **`AnimationTriggerBridge` (Trigger-to-Playback Bridge):**
   - **Role:** Binds `triggerId` strings to `AnimationPlaybackController` instances.
   - **Method:** `bridge.bind(triggerId, controller)`, `bridge.handleReport(report)`.
   - **Delegation:** When a trigger activates, it calls `controller.play()`.

2. **`AnimationRuntimePreviewBridge` (Trigger-to-Runtime Frame Bridge):**
   - **Role:** Pure stateless orchestrator connecting `AnimationTriggerEngine` and `AnimationRuntimeBridge`.
   - **Method:** `evaluateTriggerFrame(timeline, runtimeState, currentTime, context)`.
   - **Delegation:** Evaluates trigger decision via `AnimationTriggerEngine`; if `shouldStart` is true, delegates frame assembly to `AnimationRuntimeBridge.evaluateFrame()`.

No third intermediate orchestrator is created or required.

---

## 5. Governance & Architectural Decisions

### DECISION-038 — Runtime Preview Adapter Contract
- `builder-core` defines environment-agnostic contracts (`AnimationRuntimePreviewAdapter`, `AnimationRuntimePreviewBridge`, `AnimationPreviewContract`, `AnimationTriggerContext`).
- All preview integration contracts remain 100% environment-agnostic without any DOM or Browser API dependencies in `builder-core`.

### DECISION-039 — Strict Data Boundary Across Runtime Boundary
- `AnimationTriggerContext` is the ONLY object allowed to cross the Browser → `builder-core` boundary.
- **FORBIDDEN IN BUILDER-CORE:** `Event`, `MouseEvent`, `PointerEvent`, `WheelEvent`, `IntersectionObserverEntry`, `DOMRect`, `HTMLElement`, `window`, `document`.

### DECISION-040 — Pure Runtime Preview Bridge Integration
- `AnimationRuntimePreviewBridge` integrates `AnimationTriggerEngine` and `AnimationRuntimeBridge` as a stateless glue layer.
- It contains ZERO custom interpolation logic, ZERO time-stepping loops, and ZERO duplicate playback engines.

### DECISION-041 — Stateless Trigger Context Processing
- `AnimationRuntimePreviewAdapter` holds ZERO domain or business state.
- It acts purely as a stateless orchestrator: incoming `AnimationTriggerContext` snapshots → trigger evaluation via `AnimationTriggerEngine` → `TriggerEvaluationReport` dispatched to `AnimationTriggerBridge`.

### DECISION-042 — Bridge Delegation Constraint
- Bridge components (`AnimationTriggerBridge`, `AnimationRuntimePreviewBridge`) MUST ONLY delegate to underlying controller methods (`play()`, `pause()`, `reset()`, `stop()`, `seek()`, `advance()`).
- Bridge components MUST NEVER implement custom timer loops, `requestAnimationFrame`, or time-stepping logic.

### DECISION-044 — Single Source of Truth (SSOT)
- `BuilderDocument` is the single source of truth for `AnimationTimeline` and `AnimationTrigger` definitions (`node.props['animationTimeline']`).
- Evaluated runtime frames (`RuntimeFrameBatch`) and trigger states (`TriggerStateMap`) remain strictly transient in memory during preview execution and are **never** persisted to `BuilderDocument`.

---

## 6. Subsystem Contracts & APIs for Reuse

Sprint S34 reuses 100% of existing, frozen production APIs without creating duplicate models:

1. **`AnimationTypes` (`packages/builder-core/src/animation/AnimationTypes.ts`):** `AnimationTimeline`, `AnimationTrigger`, `AnimationClip`, `PropertyAnimationTrack`, `AnimationKeyframe`
2. **`AnimationTriggerState` (`packages/builder-core/src/animation/AnimationTriggerState.ts`):** `TriggerState`, `TriggerStateMap`, `isTriggerSatisfied`, `transitionTriggerState`
3. **`AnimationTriggerContext` (`packages/builder-core/src/animation/AnimationTriggerContext.ts`):** `AnimationTriggerContext`, `createTriggerContext`
4. **`AnimationTriggerEvaluator` (`packages/builder-core/src/animation/AnimationTriggerEvaluator.ts`):** `shouldStart`, `evaluateTrigger`, `resolveTriggerType`
5. **`AnimationTriggerEngine` (`packages/builder-core/src/animation/AnimationTriggerEngine.ts`):** `AnimationTriggerEngine`, `TriggerEvaluationResult`
6. **`AnimationRuntimePreviewAdapter` (`packages/builder-core/src/animation/AnimationRuntimePreviewAdapter.ts`):** `AnimationRuntimePreviewAdapter`, `TriggerEvaluationReport`, `AdapterProcessingResult`
7. **`AnimationTriggerBridge` (`packages/builder-core/src/animation/AnimationTriggerBridge.ts`):** `AnimationTriggerBridge` (`bind`, `unbind`, `handleReport`, `resetAll`)
8. **`AnimationPlaybackController` (`packages/builder-core/src/animation/AnimationPlaybackController.ts`):** `AnimationPlaybackController` (`play`, `pause`, `stop`, `reset`, `advance`, `status`, `currentTime`)
9. **`RuntimeScheduler` (`packages/builder-core/src/animation/RuntimeScheduler.ts`):** `RuntimeScheduler` (`tick`, `advance`, `play`, `pause`, `stop`, `reset`)
10. **`AnimationRuntimeBridge` (`packages/builder-core/src/animation/AnimationRuntimeBridge.ts`):** `AnimationRuntimeBridge` (`evaluateFrame`, `evaluateStructure`)
11. **`AnimationRuntimePreviewBridge` (`packages/builder-core/src/animation/AnimationRuntimePreviewBridge.ts`):** `AnimationRuntimePreviewBridge` (`evaluateTriggerFrame`, `evaluateTriggersFrame`)
12. **`BuilderDocument` (`packages/builder-core/src/BuilderDocument.ts`):** `BuilderDocument`, `SectionNode`, `createBuilderDocument`, `createBuilderPage`, `createSectionNode`

---

## 7. Golden E2E Verification Workflows (`RuntimePreviewIntegration.test.ts`)

### 7.1 Path A Verification — Trigger to Playback Bridge
```
 1. Create BuilderDocument, BuilderPage & SectionNode via production factories.
 2. Attach AnimationTimeline + AnimationTrigger ('inView', threshold 0.5) to node.props['animationTimeline'].
 3. Instantiate AnimationTriggerEngine, AnimationRuntimePreviewAdapter, AnimationTriggerBridge, and AnimationPlaybackController.
 4. Register trigger with Adapter and bind triggerId to AnimationPlaybackController via AnimationTriggerBridge.bind(triggerId, controller).
 5. Process low-visibility context (visibilityRatio = 0.2) via Adapter -> bridge.handleReport() returns 0 started IDs -> controller is 'idle'.
 6. Process high-visibility context (visibilityRatio = 0.8) via Adapter -> bridge.handleReport() returns activated triggerId -> controller becomes 'playing'.
 7. Advance controller via controller.advance(500) -> verify controller.currentTime === 500.
```

### 7.2 Path B Verification — Scheduler to Runtime Frame Assembly
```
 1. Instantiate RuntimeScheduler with AnimationTimeline and AnimationRuntimeBridge.
 2. Call scheduler.play() -> verify scheduler state becomes 'playing'.
 3. Call scheduler.tick(500) -> verify scheduler.time === 500.
 4. Call AnimationRuntimeBridge.evaluateFrame(timeline, runtimeState, 500) -> verify resolved RuntimeFrameBatch property values.
 5. Verify BuilderDocument SSOT definition remains 100% untouched.
 6. Verify byte-identical evaluation outputs for identical trigger + context inputs.
```

---

## 8. Summary of Architectural Guarantees

- **0 Phantom APIs:** 100% integration with existing production exports.
- **0 Duplicate Engines:** Reuses `AnimationTriggerEngine`, `RuntimeScheduler`, `AnimationRuntimeBridge`, and `AnimationRuntimePreviewBridge`.
- **0 DOM Leaks into Core:** `builder-core` remains 100% environment-agnostic.
- **SSOT Integrity:** `BuilderDocument` is preserved as single source of truth; runtime states remain transient.
- **Freeze Preservation:** S1–S33 subsystems and `BuilderDocument.ts` remain 100% frozen.
