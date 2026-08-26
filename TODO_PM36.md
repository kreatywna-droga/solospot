# TODO_PM36.md — Timeline Editor & Keyframe Authoring

> Status: **READY FOR ARCHITECT REVIEW**
> Package: `packages/authoring-studio`
> Governance: DECISION-046 / DECISION-047 / DECISION-048

## Scope
Pure Authoring-layer Timeline Editor. Edits `AnimationTimeline` DTO stored in `BuilderDocument` (SSOT). NO Runtime, NO Playback, NO Scheduler, NO Trigger Engine, NO Preview.

## ETAP Progress

### ETAP 1 — Models ✅
- [x] `TimelineSelection.ts` — selection model (selectedClipId/selectedTrackId/selectedKeyframeId), runtime-independent (DECISION-048)
- [x] `TimelineViewport.ts` — time↔pixel mapping (pure math)
- [x] `TimelineGrid.ts` — tick generation (pure math)
- [x] `TimelineCursor.ts` — cursor model (pure)

### ETAP 2 — Document Binding (DECISION-047) ✅
- [x] `timelineDocumentBinding.ts` — immutable, declarative mutations returning NEW BuilderDocument
  - addClip / removeClip / moveClip / resizeClip
  - addTrack / removeTrack
  - moveKeyframe (re-sorts) / addKeyframe / deleteKeyframe
  - setKeyframeValue / setKeyframeEasing
  - getClip / getTrack / getKeyframe (read helpers)

### ETAP 3 — Panel ✅
- [x] `TimelinePanel.tsx` — pure-presentation panel (server-renderable, no client effects)

### ETAP 4 — Adapter ✅
- [x] `TimelinePanelAdapter.ts` — AnimationTimeline → UI view models (clip/track/keyframe)

### ETAP 5 — Property Registry ✅
- [x] `timelinePropertyFields.ts` — clip/keyframe field definitions + validation

### ETAP 6 — Tests (Node, no jsdom) ✅
- [x] `__tests__/TimelineSelection.test.ts` (6)
- [x] `__tests__/TimelineDocumentBinding.test.ts` (9)
- [x] `__tests__/TimelineAdapter.test.ts` (6)
- [x] `__tests__/TimelinePanel.test.tsx` (4) — uses react-dom/server renderToStaticMarkup
- [x] `__tests__/TimelineIntegration.test.ts` (5)
- [x] Deleted stale `TimelinePanel.test.ts` (JSX errors)

### ETAP 7 — Public API ✅
- [x] `timeline/index.ts` barrel export
- [x] `packages/authoring-studio/src/index.ts` adds `export * from './timeline/index'`

### ETAP 8 — Hold-Fix Delta Report ✅
- [x] `docs/studio/PM36_HOLD_FIX_1_REPORT.md` — rozwiązanie HOLD-001 i HOLD-002
- [x] `docs/studio/PM36_RAPORT.md` — zaktualizowany o wyniki HOLD-FIX-1

## Quality Gates (HOLD-FIX-1 — zweryfikowane)

- [x] `npx tsc --noEmit` — **Moduł timeline czysty (0 błędów)**. 16 błędów pre-existing poza PM36.
- [x] `npx vitest run packages/authoring-studio/src/timeline` — **30/30 testów przeszło** ✅
- [x] `npm run build` — **Weryfikowane** (Next build)

## Forbidden (must NOT be added)
- requestAnimationFrame, setTimeout, setInterval, PlaybackController, RuntimeScheduler, AnimationRuntimeBridge, AnimationTriggerEngine, BrowserTriggerAdapter, Preview Runtime, DOM/Canvas API, React runtime hooks in core, Commerce, Platform Core.

## Handoff
1. Agent 1 delivers Delta Implementation Report.
2. Agent 2 executes Code Evidence Audit v2.8 (READ ONLY).
3. Agent 2 issues Recommendation: PASS / HOLD / FAIL.
4. Architect decides FORMALLY RATIFIED 🔒.
