# PM38 — Delta Implementation Report
## Animation Preview Runtime & Live Canvas Synchronization

> Package: `packages/authoring-studio`
> Status: **IMPLEMENTATION COMPLETE**
> Governance: DECISION-053 / DECISION-054 / DECISION-055 / DECISION-056 / DECISION-057

---

## 1. Objective

Integrate all previously built animation modules (PM29–PM37) into a single
Live Preview communication path enabling **instant preview while editing the
Timeline**. PM38 introduces **no new animation engine** — it only integrates
Timeline, Preview, Inspector, Runtime Bridge, Trigger Engine, and Playback
Session through one coherent orchestration layer.

---

## 2. Architectural Decisions Implemented

| Decision | Description |
|----------|-------------|
| **DECISION-053** | `PreviewRuntimeCoordinator` is the **sole coordinator** for Timeline ↔ Preview synchronization. |
| **DECISION-054** | Live Scrubbing delegates frame evaluation **exclusively** to `AnimationRuntimeBridge`. No local interpolation. |
| **DECISION-055** | `BuilderDocument` remains the **Single Source of Truth (SSOT)** for Timeline, Preview, and Inspector synchronization. |
| **DECISION-056** | All module interactions use **Dependency Injection (DI)** — zero singletons, zero direct module coupling. |
| **DECISION-057** | **No modules created solely for naming compatibility** when existing implementation satisfies the same architectural responsibility. Semantic compatibility preferred; no duplication. `packages/authoring-studio/src/runtime-preview/` is **NOT created** (runtime-preview is a UI-layer concern). |

---

## 3. Scope / Non-Goals

### In Scope
- Playhead synchronization (Timeline ↔ Preview) with loop prevention.
- Live playhead scrubbing and keyframe-drag preview re-evaluation.
- Tri-directional selection sync (Timeline ↔ Inspector ↔ Preview).
- Runtime preview delegation to `AnimationRuntimeBridge`.
- Live property refresh on easing/keyframe/duration/delay/trigger changes.

### Out of Scope (Verified — zero modifications)
- ❌ Modifying PM29–PM34 (`builder-core`) — **FROZEN**
- ❌ Modifying PM35 (`inspector`) — **FROZEN**
- ❌ Modifying PM36–PM37 (`timeline`) — **FROZEN**
- ❌ `requestAnimationFrame`, `setTimeout`, `setInterval`
- ❌ Browser API in domain layer
- ❌ React Runtime in domain layer
- ❌ New Playback Engine
- ❌ New Runtime Bridge
- ❌ Interpolation execution in authoring layer

---

## 4. File Delta Manifest

### New Files Created (PM38)
| File | Responsibility |
|------|----------------|
| `packages/authoring-studio/src/preview/PreviewPlayheadSync.ts` | Bidirectional playhead/time/active-timeline sync with atomic source tagging & loop prevention (ETAP 1). |
| `packages/authoring-studio/src/preview/LiveScrubbingEngine.ts` | Real-time scrubbing state + frame evaluation delegated to `AnimationRuntimeBridge` (DECISION-054, ETAP 2). |
| `packages/authoring-studio/src/preview/KeyframeDragPreview.ts` | Live keyframe repositioning with immutable `BuilderDocument` update + re-evaluation (ETAP 3). |
| `packages/authoring-studio/src/preview/PreviewSelectionSync.ts` | Tri-directional (Timeline ↔ Inspector ↔ Preview) selection sync, loop-guarded (ETAP 4). |
| `packages/authoring-studio/src/preview/PreviewRuntimeCoordinator.ts` | Pure orchestrator; sole coordinator (DECISION-053); Strict DI (DECISION-056). |
| `packages/authoring-studio/src/preview/index.ts` | Single barrel export of PM38 preview domain (DECISION-057). |
| `packages/authoring-studio/src/preview/__tests__/PreviewSynchronization.test.ts` | Playhead sync unit tests (loop prevention). |
| `packages/authoring-studio/src/preview/__tests__/LiveScrubbing.test.ts` | Scrubbing state + RuntimeBridge delegation tests. |
| `packages/authoring-studio/src/preview/__tests__/TimelinePreviewSelection.test.ts` | Tri-directional selection sync tests. |
| `packages/authoring-studio/src/preview/__tests__/PreviewRuntimeCoordinator.test.ts` | Coordinator orchestration tests (DI, playhead, scrub, drag). |
| `packages/authoring-studio/src/preview/__tests__/RuntimeBridgeIntegration.test.ts` | Full-stack integration with real PM32 `AnimationRuntimeBridge`. |
| `TODO_PM38.md` | Task tracking checklist. |
| `docs/studio/PM38_DELTA_IMPLEMENTATION_REPORT.md` | This report. |

### Existing Files Modified
| File | Change |
|------|--------|
| `packages/authoring-studio/src/index.ts` | Added `export * from './preview/index';` (PM38 public API). |

### Existing Files Verified Unchanged (Frozen)
- `packages/builder-core/*` (PM29–PM34)
- `packages/authoring-studio/src/inspector/*` (PM35)
- `packages/authoring-studio/src/timeline/*` (PM36–PM37)

---

## 5. ETAP Delivery Summary

| ETAP | Deliverable | Status |
|------|-------------|--------|
| **ETAP 1** | Preview Synchronization Layer (`PreviewPlayheadSync`, `PreviewSelectionSync`) | ✅ |
| **ETAP 2** | Live Scrubbing (`LiveScrubbingEngine`, `KeyframeDragPreview`) | ✅ |
| **ETAP 3** | Timeline ↔ Preview ↔ Inspector Sync (via `BuilderDocument` SSOT) | ✅ |
| **ETAP 4** | Runtime Preview Delegation (exclusively `AnimationRuntimeBridge`) | ✅ |
| **ETAP 5** | Live Property Refresh (coordinator-triggered re-evaluation) | ✅ |
| **ETAP 6** | Tests (Node only, no jsdom) — 5 suites | ✅ |
| **ETAP 7** | Public API (`preview/index.ts` → `authoring-studio/index.ts`) | ✅ |
| **ETAP 8** | Documentation | ✅ |

---

## 6. Runtime Preview Delegation (ETAP 4)

Preview frame evaluation is delegated **exclusively** through
`AnimationRuntimeBridge.evaluateFrame(...)`. The authoring layer performs
**no interpolation**. The `ScrubbingRuntimeBridge` interface is a structural
duck-type of `AnimationRuntimeBridge`, so the frozen PM32 module is injected
directly (DECISION-054, DECISION-056).

```
Timeline Selection
      ↓
BuilderDocument (SSOT)
      ↓
 Inspector → Preview → Timeline
      ↓
PreviewRuntimeCoordinator
      ↓
AnimationRuntimeBridge.evaluateFrame()   ← ONLY evaluation point
```

---

## 7. Public API (ETAP 7)

```
packages/authoring-studio/src/index.ts
  └── export * from './preview/index'          (PM38)
```

Per **DECISION-057**, `preview/index.ts` is the **single** barrel for the PM38
domain. No `packages/authoring-studio/src/runtime-preview/` barrel is created —
the runtime-preview React/UI components live in `src/components/builder/runtime-preview/`
and are out of scope for the domain layer.

---

## 8. Boundary Protection Verification

| Constraint | Status |
|------------|--------|
| No `requestAnimationFrame` in domain layer | ✅ |
| No `setTimeout` / `setInterval` | ✅ |
| No Browser API / DOM in `builder-core` | ✅ |
| No React in domain layer (`builder-core`, `authoring-studio/src/preview`) | ✅ |
| No new Playback Engine | ✅ |
| No new Runtime Bridge | ✅ |
| No interpolation in authoring layer | ✅ |
| `BuilderDocument` immutability preserved (SSOT) | ✅ |

---

## 9. Quality Gates

- [x] `npx tsc --noEmit`
- [x] `npx vitest run`
- [x] `npm run build`

---

## 10. Handoff to Agent 2

PM38 implementation is complete. Agent 2 shall execute the Code Evidence Audit
(READ ONLY) against the frozen PM29–PM37 modules and the new PM38 preview layer,
then issue a Recommendation: **PASS / HOLD / FAIL**.

Upon PASS, the Architect formally ratifies PM38 🔒.
