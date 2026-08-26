# S33 Implementation Plan — Runtime Trigger Engine & Event Integration

> **Subsystem:** Authoring Studio & Builder Core — Runtime Trigger Engine & Event Integration (Sprint S33)  
> **Author:** Agent 1 — Senior Architect & Planning Agent  
> **Status:** PROPOSED — WAITING FOR ARCHITECT RATIFICATION  
> **Target Package:** `packages/builder-core` (`src/animation/`)

---

## 1. Goal & Objectives

Implement and verify the **Runtime Trigger Engine & Event Integration** subsystem for Authoring Studio & `builder-core`. Deliver a pure, stateless evaluation layer answering *"Should the animation start?"* with 0 DOM dependencies, 0 duplicate engines, 0 phantom APIs, and 100% SSOT compliance with `BuilderDocument`.

---

## 2. Technical Implementation Scope

### Component 1: Domain Interfaces & Types (`packages/builder-core/src/animation/`)
- **`AnimationTypes.ts` (Existing):** Serves `AnimationTrigger` and `AnimationTimeline` domain models.
- **`AnimationTriggerState.ts` (Existing):** Serves `TriggerState` (`ACTIVE | WAITING | FINISHED | PAUSED`), `TriggerStateMap`, and pure transition functions (`transitionTriggerState`, `getTriggerState`, `isTriggerSatisfied`).
- **`AnimationTriggerContext.ts` (Existing):** Serves 100% serializable snapshot context (`scrollY`, `viewportWidth`, `viewportHeight`, `isHovered`, `isClicked`, `visibilityRatio`) and safe builder `createTriggerContext`.

### Component 2: Evaluation & Engine Logic (`packages/builder-core/src/animation/`)
- **`AnimationTriggerEvaluator.ts` (Existing):** Serves pure `shouldStart(trigger, context)` evaluator function supporting `onLoad`, `hover`, `click`, `inView`, `scroll` triggers.
- **`AnimationTriggerEngine.ts` (Existing):** Serves `AnimationTriggerEngine` class evaluating triggers and tracking lifecycle state maps immutably without executing playback.
- **`AnimationTriggerBridge.ts` (Existing):** Delegates evaluation decisions to `PlaybackController` interface methods per DECISION-042.

---

## 3. Implementation Steps & Verification Tasks

### Step 1 — Audit Existing Modules & Barrel Re-exports
- Verify exported symbols in `packages/builder-core/src/index.ts`.
- Ensure exports include `TriggerState`, `TriggerStateMap`, `AnimationTriggerContext`, `shouldStart`, `evaluateTrigger`, `AnimationTriggerEngine`, `TriggerEvaluationResult`, `MultiTriggerEvaluationResult`.

### Step 2 — Golden E2E Test Workflow
- Implement/Verify `TriggerE2EWorkflow.test.ts` in `packages/builder-core/src/animation/__tests__/`.
- Validate 12-step real lifecycle:
  1. Construct `BuilderDocument` with `SectionNode`.
  2. Attach `AnimationTimeline` + `AnimationTrigger` (`inView`, threshold 0.5).
  3. Initialize `AnimationTriggerEngine` in state `WAITING`.
  4. Create context with `visibilityRatio = 0.2` → `shouldStart` = false.
  5. Advance context to `visibilityRatio = 0.6` → `shouldStart` = true.
  6. Transition state to `ACTIVE`.
  7. Delegate decision to `AnimationTriggerBridge` → calls `PlaybackController.play()`.
  8. Tick `PlaybackController(100)` → verify evaluated prop state updates.
  9. Confirm `BuilderDocument` SSOT remains unchanged.
  10. Confirm 100% deterministic byte-identical evaluation.

---

## 4. Quality Gates & Verification Plan

### Automated Tests
```bash
# 1. Scope Vitest S33 suite
npx vitest run packages/builder-core/src/animation/__tests__/AnimationTrigger*.test.ts

# 2. Full animation subsystem Vitest regression
npx vitest run packages/builder-core/src/animation/__tests__/

# 3. TypeScript compilation check
npx tsc --noEmit

# 4. Production Build check
npm run build
```

### Acceptance Thresholds
- **Vitest S33 Trigger Scope:** 100% PASS (33/33 tests across 5 test files: `AnimationTriggerState.test.ts` [7], `AnimationTriggerContext.test.ts` [4], `AnimationTriggerEvaluator.test.ts` [13], `AnimationTriggerEngine.test.ts` [8], `TriggerE2EWorkflow.test.ts` [1]).
- **Vitest Full Animation Subsystem Regression:** 100% PASS (22 test suites across `packages/builder-core/src/animation/__tests__/`).
- **TypeScript:** 0 new errors in S33 scope (`AnimationTrigger` fields updated to `readonly`).
- **Build:** Exit code 0 (`ignoreBuildErrors: false`).
- **Production API Compliance (S33-R2):** 100% real production API signatures (`createBuilderDocument({ ... })`, `createSectionNode({ ... })`, `createBuilderPage({ ... })`, `AnimationTriggerBridge.bind()`, `bridge.handleReport()`, `AnimationPlaybackController.advance()`). Zero phantom APIs.
- **SSOT Integrity:** `BuilderDocument.ts` remains 100% FROZEN and untouched. `animationTimeline` persisted via `SectionNode.props: Record<string, unknown>`.
- **Domain Boundary:** Clean grep for DOM/React/timers/WebGL.

---

## 5. Governance Workflow

```
[Agent 1 Implementation & Documentation]
               |
               v
[Agent 2 Independent Audit (Code Evidence Audit Protocol v2.8)]
               |
        +------+------+
        |             |
     (PASS)        (HOLD)
        |             |
        v             v
[Architect]    [Focused Delta Audit]
        |
        v
[FORMALLY RATIFIED 🔒] --> S34 Unlocked
```
