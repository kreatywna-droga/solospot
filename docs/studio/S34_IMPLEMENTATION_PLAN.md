# S34 Implementation Plan — Runtime Preview Adapter & Execution Integration

> **Subsystem:** Authoring Studio & Builder Core — Runtime Preview Adapter & Execution Integration (Sprint S34)  
> **Author:** Agent 1 — Senior Architect & Planning Agent  
> **Status:** PROPOSED — WAITING FOR ARCHITECT APPROVAL (NO IMPLEMENTATION EXECUTED)  
> **Target Package:** `packages/builder-core` (`src/animation/`) & `src/components/builder/runtime-preview/`

---

## 1. Goal & Objectives

Deliver the **Runtime Preview Adapter & Execution Integration** subsystem for Authoring Studio & `builder-core`. Connect browser-level trigger events (`scroll`, `hover`, `click`, `intersection/visibility`) to `builder-core`'s `AnimationTriggerEngine`, `AnimationTriggerBridge`, `RuntimeScheduler`, and `AnimationRuntimeBridge` execution pipeline with 0 DOM pollution in `builder-core`, 0 duplicate engines, 0 phantom APIs, and 100% SSOT compliance with `BuilderDocument`.

---

## 2. Technical Implementation Scope

### Component 1: Host-Side Browser Adapter (`src/components/builder/runtime-preview/`)
- **`BrowserTriggerAdapter.ts` (EXISTING / REUSE / VERIFY):** Environment-dependent class listening to browser events (`scroll`, `pointerenter`, `pointerleave`, `click`, `IntersectionObserver`) and mapping them into pure `AnimationTriggerContext` snapshots (`scrollY`, `viewportWidth`, `viewportHeight`, `isHovered`, `isClicked`, `visibilityRatio`).
- **`BrowserTriggerAdapter.test.ts` (EXISTING / REUSE / VERIFY):** Unit test suite using mock browser environment (`window`, `document`, `IntersectionObserver`) to verify DOM event translation into pure context snapshots.

### Component 2: Core Preview Adapter & Integration (`packages/builder-core/src/animation/`)
- **`AnimationRuntimePreviewAdapter.ts` (Existing):** Serves `AnimationRuntimePreviewAdapter` class receiving context snapshots, evaluating triggers, and producing `TriggerEvaluationReport`.
- **`AnimationRuntimePreviewBridge.ts` (Existing):** Serves `AnimationRuntimePreviewBridge` glue layer connecting Trigger Engine + Runtime Bridge without custom time-stepping or scheduling.

### Component 3: Golden E2E Integration Test (`packages/builder-core/src/animation/__tests__/`)
- **`RuntimePreviewIntegration.test.ts`:** Golden E2E integration test verifying the two independent, disjoint execution paths defined in the architecture (§7), WITHOUT artificial wiring between `AnimationTriggerBridge` and `RuntimeScheduler`:

  **PATH A (Trigger → Playback):** `BuilderDocument` → `AnimationTrigger` → `AnimationTriggerContext` → `AnimationRuntimePreviewAdapter` → `AnimationTriggerEngine` → `AnimationTriggerBridge` → `AnimationPlaybackController` (`handleReport` → `play()` → `advance(500)` → `currentTime === 500`).

  **PATH B (Scheduler → Runtime Frame):** `BuilderDocument` → `AnimationTimeline` → `RuntimeScheduler` (`play()` → `tick(500)` → `time === 500`) → `AnimationRuntimeBridge.evaluateFrame(...)` → `RuntimeFrameBatch`.

  The two paths are verified independently; no single linear bridge→scheduler→runtimeBridge pipeline is asserted.

---

## 3. Implementation Steps Roadmap

### Step 1 — Architecture Verification & Freeze Compliance
- Confirm `S34_ARCHITECTURE.md` approval by Agent 2 & Architect.
- Verify frozen status of S1–S33 modules and `BuilderDocument.ts`.

### Step 2 — Host-Side Browser Adapter Verification
- Verify existing `BrowserTriggerAdapter.ts` in `src/components/builder/runtime-preview/` (EXISTING / REUSE — no re-implementation).
- Ensure zero imports of `builder-core` internals beyond `AnimationTriggerContext` and `createTriggerContext`.

### Step 3 — Golden E2E Integration Test
- Implement `RuntimePreviewIntegration.test.ts` in `packages/builder-core/src/animation/__tests__/`.
- Verify PATH A (Trigger → Playback, §7.1) and PATH B (Scheduler → Runtime Frame, §7.2) independently: from simulated DOM event conversion through `RuntimeScheduler` playhead advancement and `AnimationRuntimeBridge.evaluateFrame()` output.

### Step 4 — Quality Gates & Verification
- Execute Vitest S34 subset and full animation subsystem regression.
- Execute TypeScript check (`npx tsc --noEmit`).
- Execute production build check (`npm run build`).

---

## 4. Verification Plan & Acceptance Thresholds

### Automated Commands
```bash
# 1. Scope Vitest S34 suite
npx vitest run packages/builder-core/src/animation/__tests__/RuntimePreviewIntegration.test.ts

# 2. Full animation subsystem Vitest regression
npx vitest run packages/builder-core/src/animation/__tests__/

# 3. TypeScript compilation check
npx tsc --noEmit

# 4. Production Build check
npm run build
```

### Acceptance Thresholds
- **Vitest S34 Scope:** 100% PASS across S34 adapter and integration test suites.
- **Vitest Subsystem Regression:** 100% PASS (22+ test suites in `packages/builder-core/src/animation/__tests__/`).
- **TypeScript:** 0 new errors in S34 scope.
- **Build:** Exit code 0 (`ignoreBuildErrors: false`).
- **SSOT Integrity:** `BuilderDocument.ts` remains 100% FROZEN and untouched.
- **Domain Boundary:** Clean grep for DOM/React/timers in `builder-core`.

---

## 5. Governance Workflow

```
[Agent 1 Repo Discovery & Architecture (Faza S34-A)]
                         │
                         ▼
[Agent 2 Architecture Audit & Review]
                         │
                  +------+------+
                  │             │
               (PASS)        (HOLD)
                  │             │
                  v             v
       [Architect Approval]   [Architecture Delta]
                  │
                  v
       [Agent 1 Implementation Phase (S34-B)]
```

*Agent 1 does not execute code implementation until Agent 2 and Architect approve the architecture.*
