# TODO PM38 — Animation Preview Runtime & Live Canvas Synchronization

> Status: **IMPLEMENTATION IN PROGRESS**
> Package: `packages/authoring-studio`
> Governance: DECISION-053 / DECISION-054 / DECISION-055 / DECISION-056 / DECISION-057

## Scope
Integrate all previously built modules (PM29–PM37) into a complete Live Preview
system enabling instant animation preview while editing the Timeline.

PM38 does NOT create a new animation engine. It ONLY integrates:
Timeline, Preview, Inspector, Runtime Bridge, Trigger Engine, Playback Session
into a single communication path.

## Architectural Decisions
- **DECISION-053**: `PreviewRuntimeCoordinator` is the sole coordinator for Timeline ↔ Preview sync.
- **DECISION-054**: Live Scrubbing delegates evaluation exclusively to `AnimationRuntimeBridge`.
- **DECISION-055**: `BuilderDocument` remains the Single Source of Truth (SSOT) for Timeline, Preview, and Inspector sync.
- **DECISION-056**: All module interactions use Dependency Injection (DI); zero singletons or direct dependencies.
- **DECISION-057**: Do NOT create modules solely for naming compatibility when the existing implementation satisfies the same architectural responsibility. Prefer semantic compatibility; do not duplicate modules. Thin wrappers are allowed only when needed for API compatibility. Do NOT create `packages/authoring-studio/src/runtime-preview/`.

## ETAP Progress

### ETAP 1 — Preview Synchronization Layer
- [x] `PreviewPlayheadSync.ts` — bidirectional playhead/time/active-timeline sync with loop prevention
- [x] `PreviewSelectionSync.ts` — tri-directional (Timeline ↔ Inspector ↔ Preview) selection synchronization
- [x] `PreviewRuntimeCoordinator.ts` — pure orchestrator layer (DECISION-053)

### ETAP 2 — Live Scrubbing
- [x] `LiveScrubbingEngine.ts` — real-time frame evaluation via `AnimationRuntimeBridge` (DECISION-054)
- [x] `KeyframeDragPreview.ts` — live keyframe repositioning re-evaluation

### ETAP 3 — Timeline ↔ Preview ↔ Inspector Sync
- [x] Tri-directional selection sync via `BuilderDocument` (SSOT), loop-guarded

### ETAP 4 — Runtime Preview Delegation
- [x] Preview delegates frame evaluation exclusively through `AnimationRuntimeBridge` (no local interpolation)

### ETAP 5 — Live Property Refresh
- [x] Easing / keyframe / duration / delay / trigger changes trigger immediate Preview refresh via coordinator

### ETAP 6 — Tests (Node only, no jsdom)
- [x] `__tests__/PreviewSynchronization.test.ts`
- [x] `__tests__/LiveScrubbing.test.ts`
- [x] `__tests__/TimelinePreviewSelection.test.ts`
- [x] `__tests__/PreviewRuntimeCoordinator.test.ts`
- [x] `__tests__/RuntimeBridgeIntegration.test.ts`

### ETAP 7 — Public API
- [x] `preview/index.ts` barrel export (single barrel — DECISION-057)
- [x] `packages/authoring-studio/src/index.ts` re-exports `./preview/index`
- [x] `timeline/index.ts` unchanged (PM36–PM37 frozen)

### ETAP 8 — Documentation
- [x] `TODO_PM38.md` (this file)
- [x] `docs/studio/PM38_DELTA_IMPLEMENTATION_REPORT.md`

## Forbidden (must NOT be added)
- modifying PM29–PM37, modifying builder-core, requestAnimationFrame, setTimeout,
  setInterval, Browser API, React Runtime in domain layer, new Playback Engine,
  new Runtime Bridge, new `runtime-preview/` barrel.

## Quality Gates
- [ ] `npx tsc --noEmit`
- [ ] `npx vitest run`
- [ ] `npm run build`

## Handoff
1. Agent 1 delivers Delta Implementation Report.
2. Agent 2 executes Code Evidence Audit (READ ONLY).
3. Agent 2 issues Recommendation: PASS / HOLD / FAIL.
4. Architect decides FORMALLY RATIFIED 🔒.
