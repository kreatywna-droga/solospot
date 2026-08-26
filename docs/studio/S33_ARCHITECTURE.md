# S33 Architecture Specification — Runtime Trigger Engine & Event Integration

> **Subsystem:** Authoring Studio & Builder Core — Runtime Trigger Engine & Event Integration (Sprint S33)  
> **Author:** Agent 1 — Senior Architect & Planning Agent  
> **Status:** PROPOSED — WAITING FOR ARCHITECT RATIFICATION  
> **Dependencies:** `builder-core` (`AnimationTypes`, `AnimationTimeline`, `BuilderDocument`, `HistoryStack`), S28 Responsive (`../responsive`), S29 Layout (`../layout`), S30 Layout Inspector (`../layout-inspector`), S31 Live Preview (`../viewport-preview`), S32 Components (`../components`)

---

## 1. Executive Summary & Core Objective

Sprint S33 formalizes and standardizes the **Runtime Trigger Engine & Event Integration layer** in `builder-core` and Authoring Studio. It answers the fundamental architectural question:

> *"How does the system evaluate when an animation should start, transition trigger states, and bridge event conditions to playback controllers without polluting domain models with DOM/Browser APIs, without creating duplicate playback engines, and without compromising BuilderDocument as SSOT?"*

S33 establishes a strict, stateless, pure-functional trigger evaluation boundary:

1. **Trigger Definition (`AnimationTrigger`):** Immutable configuration stored on `AnimationTimeline` inside `BuilderDocument` (`node.props.animationTimeline`).
2. **Trigger State (`AnimationTriggerState`):** Transient runtime-only status (`ACTIVE`, `WAITING`, `FINISHED`, `PAUSED`). Completely separate from the immutable definition (Definition ≠ State).
3. **Trigger Context (`AnimationTriggerContext`):** Plain-data, 100% serializable snapshot of trigger conditions (`scrollY`, `viewportWidth`, `viewportHeight`, `isHovered`, `isClicked`, `visibilityRatio`). Zero DOM/Browser API objects.
4. **Pure Evaluator (`shouldStart`):** Pure, deterministic function returning `boolean`. No side effects, no timers, no playback execution.
5. **Runtime Boundary:** Strict separation where S33 only evaluates conditions and hands boolean decisions to external execution layers (`AnimationTriggerBridge` / `PlaybackController`).

---

## 2. Architecture & Runtime Boundary Flow

```
+-----------------------------------------------------------------------------------+
|                           BuilderDocument (SSOT)                                  |
|   node.props.animationTimeline -> AnimationTrigger (Immutable Definition)         |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                  Browser Adapter / Runtime Host (PM34/PM35)                      |
|   Maps DOM Events / Observers  -->  AnimationTriggerContext (Serializable Data)   |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|               S33 Pure Trigger Evaluator (shouldStart / evaluate)                 |
|   Inputs: AnimationTrigger + AnimationTriggerContext                              |
|   Outputs: boolean (shouldStart) + TriggerState ('ACTIVE'|'WAITING'|'FINISHED')   |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                        AnimationTriggerBridge (DECISION-042)                      |
|   Delegates boolean trigger decisions directly to PlaybackController interface   |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                    PlaybackController (PM30 Execution Engine)                     |
|   play() / pause() / stop() / seek() / tick(deltaTimeMs)                         |
+-----------------------------------------------------------------------------------+
```

---

## 3. Governance & Architectural Decisions

### DECISION-035 — Pure Trigger Evaluation Layer
- `shouldStart(trigger, context): boolean` is a stateless, pure function.
- `AnimationTrigger` (definition) is immutable data stored in `BuilderDocument`.
- `AnimationTriggerState` (runtime state: `ACTIVE | WAITING | FINISHED | PAUSED`) is decoupled from definition, allowing multiple triggers to attach to a single animation timeline independently.

### DECISION-036 — Serializable Runtime Trigger Context
- `AnimationTriggerContext` contains scalar values only (`number`, `boolean`).
- **FORBIDDEN:** `Event`, `MouseEvent`, `PointerEvent`, `DOMRect`, `HTMLElement`, `IntersectionObserverEntry`, `window`, `document`.
- Browser API mapping is performed exclusively by external adapter layers (PM34/PM35).

### DECISION-037 — Trigger Engine Isolation
- `AnimationTriggerEngine` manages state map transitions immutably (`transitionTriggerState`).
- The engine **NEVER** executes animations or invokes timers (0 `start()`, `play()`, `dispatch()`, `requestAnimationFrame`).

### DECISION-042 — Bridge Delegation Rule
- `AnimationTriggerBridge` MUST NOT implement custom playback, time-stepping, or scheduling logic.
- It ONLY delegates to `AnimationPlaybackController` / `PlaybackController` interface methods (`play()`, `pause()`, `reset()`, `stop()`, `seek()`).

### DECISION-043 / DECISION-045 — Inspector & Execution Separation
- Inspector edits trigger configuration on `BuilderDocument` SSOT only.
- Inspector NEVER invokes `PlaybackController` or evaluates triggers directly.

### DECISION-044 — Single Source of Truth (SSOT)
- `BuilderDocument` remains the sole SSOT for `AnimationTimeline` and `AnimationTrigger` configuration.
- Runtime trigger states (`AnimationTriggerStateMap`) exist strictly in transient memory during preview/runtime execution and are **never** persisted to `BuilderDocument`.

---

## 4. Subsystem Contracts & Interface Models

### 4.1 Trigger Definition (`AnimationTrigger`)
Stored in `packages/builder-core/src/animation/AnimationTypes.ts`:

```ts
export type TriggerType = 'onLoad' | 'inView' | 'hover' | 'click' | 'scroll';

export interface AnimationTrigger {
  readonly type: TriggerType;
  readonly threshold?: number; // 0.0 - 1.0 for inView / scroll (px)
  readonly targetElementId?: string;
}
```

### 4.2 Trigger Runtime State (`AnimationTriggerState`)
Defined in `packages/builder-core/src/animation/AnimationTriggerState.ts`:

```ts
export type TriggerState = 'ACTIVE' | 'WAITING' | 'FINISHED' | 'PAUSED';

export type TriggerStateMap = Readonly<Partial<Record<string, TriggerState>>>;
```

### 4.3 Trigger Context (`AnimationTriggerContext`)
Defined in `packages/builder-core/src/animation/AnimationTriggerContext.ts`:

```ts
export interface AnimationTriggerContext {
  readonly scrollY: number;
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly isHovered: boolean;
  readonly isClicked: boolean;
  readonly visibilityRatio: number;
}
```

### 4.4 Pure Evaluator Signature (`AnimationTriggerEvaluator`)
Defined in `packages/builder-core/src/animation/AnimationTriggerEvaluator.ts`:

```ts
export function shouldStart(
  trigger: AnimationTrigger,
  context: AnimationTriggerContext
): boolean;
```

---

## 5. Dependency Graph & Boundary Constraints

### 5.1 Permitted Imports
- `packages/builder-core/src/animation/*` (Internal animation domain models: `AnimationTypes`, `AnimationTriggerContext`, `AnimationTriggerState`, `AnimationTriggerEvaluator`, `AnimationTriggerEngine`)
- `packages/builder-core/src/BuilderDocument` (Node hierarchy & document types)
- `packages/builder-core/src/HistoryStack` (Canonical history stack)

### 5.2 Strict Prohibitions (Forbidden Imports & Symbols)
- ❌ NO `window`, `document`, `HTMLElement`, `DOMRect`, `IntersectionObserver`
- ❌ NO `Event`, `MouseEvent`, `PointerEvent`
- ❌ NO `requestAnimationFrame`, `setTimeout`, `setInterval`
- ❌ NO `React`, `ReactDOM`, JSX
- ❌ NO WebGL / WebGPU / AudioContext
- ❌ NO Direct mutation of `BuilderDocument` nodes outside canonical commands

### 5.3 Dependency Graph Matrix

```
   [S28 Responsive]      [S29 Layout]      [S30 Inspector]      [S31 Preview]      [S32 Components]
          \                   |                   |                  /                  /
           \                  |                   |                 /                  /
            v                 v                   v                v                  v
    +---------------------------------------------------------------------------------------+
    |                               BuilderDocument (SSOT)                                  |
    +---------------------------------------------------------------------------------------+
                                              ^
                                              |
    +---------------------------------------------------------------------------------------+
    |                        S33 Runtime Trigger Engine Layer                               |
    |  - AnimationTrigger (Definition)                                                     |
    |  - AnimationTriggerState (Transient State)                                            |
    |  - AnimationTriggerContext (Serializable Context)                                     |
    |  - AnimationTriggerEvaluator (Pure shouldStart)                                       |
    |  - AnimationTriggerEngine (Stateless Evaluation Pipeline)                             |
    +---------------------------------------------------------------------------------------+
                                              |
                                              v (Delegates via Bridge)
    +---------------------------------------------------------------------------------------+
    |               AnimationTriggerBridge -> PlaybackController (PM30)                     |
    +---------------------------------------------------------------------------------------+
```

---

## 6. SSOT & State Persistence Specification

| Data Element | Location / Storage | Persistence | Mutability |
|---|---|---|---|
| `AnimationTrigger` (Definition) | `node.props.animationTimeline.trigger` in `BuilderDocument` (`SectionNode.props: Record<string, unknown>`) | Persistent (Saved to JSON / SSOT; zero edits to `BuilderDocument.ts`) | Immutable (`readonly` fields, updated via `HistoryStack` commands) |
| `AnimationTriggerContext` | Memory snapshot (Created by Browser Adapter) | Transient (Lifetime of event tick) | Immutable (Readonly snapshot) |
| `AnimationTriggerStateMap` | `AnimationTriggerEngine._states` memory | Transient (Lifetime of runtime session) | Immutable transitions (`transitionTriggerState`) |
| `PlaybackState` | `PlaybackController.state` | Transient (Runtime playback) | Stateful machine (`idle` → `playing` → `completed`) |

> **Architectural Note on F-02 (SSOT Persistence):**  
> `BuilderDocument.ts` remains **100% FROZEN and untouched**. `SectionNode` already defines `props: Record<string, unknown>`. `animationTimeline` is persisted strictly inside the `node.props` dictionary (`node.props['animationTimeline']`) as a generic record entry. No explicit top-level field addition to `SectionNode` or modification to `BuilderDocument.ts` is required.

---

## 7. Golden E2E Verification Workflow

The Golden E2E Workflow (`TriggerE2EWorkflow.test.ts`) verifies the full authoring & trigger evaluation lifecycle against production APIs without mocks:

```
1. Create BuilderDocument & SectionNode via canonical factory.
2. Attach AnimationTimeline with 'inView' trigger (threshold = 0.5) to node.props.
3. Instantiate AnimationTriggerEngine & verify initial state ('WAITING').
4. Create serializable AnimationTriggerContext with visibilityRatio = 0.2.
5. Evaluate trigger via shouldStart(trigger, context) --> returns false.
6. Advance context to visibilityRatio = 0.6.
7. Evaluate trigger via shouldStart(trigger, context) --> returns true.
8. Transition trigger state WAITING -> ACTIVE in AnimationTriggerEngine.
9. Pass boolean decision to AnimationTriggerBridge -> invokes PlaybackController.play().
10. Tick PlaybackController by 100ms -> verify evaluated properties change deterministically.
11. Verify BuilderDocument SSOT definition remains 100% unchanged (SSOT integrity preserved).
12. Verify byte-identical evaluation outputs for identical trigger + context inputs.
```

---

## 8. Summary of Architectural Guarantees

- **0 Phantom APIs:** 100% integration with existing `builder-core` exports.
- **0 Duplicate Engines:** No new playback loops, no duplicate renderers.
- **0 DOM Pollution:** Pure TypeScript calculation layer.
- **SSOT Compliance:** `BuilderDocument` is the single source of truth for definitions; runtime states remain transient.
