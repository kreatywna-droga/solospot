# TODO — PM30 Animation Runtime Foundation (Agent 1)

> Status: IN PROGRESS — READY FOR ARCHITECT REVIEW (po Quality Gates)
> Decyzja Architekta: 🟢 APPROVED WITH MODIFICATION — AnimationInterpolator przeniesiony do PM31.

## Zakres PM30 (zatwierdzony)

### ETAP 1 — Runtime Types
- [x] `packages/builder-core/src/animation/AnimationRuntimeTypes.ts` (RuntimeFrame, RuntimeTrack, RuntimeEvaluationResult, RuntimeState — bez kodu wykonawczego)

### ETAP 2 — Playback Controller
- [x] `packages/builder-core/src/animation/AnimationPlaybackController.ts` — play/pause/stop/seek/reset + currentTime/duration/speed/loop/direction, BEZ requestAnimationFrame

### ETAP 3 — Timeline Evaluator
- [x] `packages/builder-core/src/animation/AnimationTimelineEvaluator.ts` — wybór Clip, Track, dwóch sąsiednich Keyframe + normalized progress, BEZ interpolacji

### ETAP 4 — Easing
- [x] `packages/builder-core/src/animation/AnimationEasing.ts` — linear, ease-in, ease-out, ease-in-out (BEZ spring/cubic-bezier)

### ETAP 5 — Eksport
- [x] `packages/builder-core/src/index.ts` — eksport modułów PM30

### ETAP 6 — Testy (Node, bez jsdom)
- [x] `animation/__tests__/AnimationPlaybackController.test.ts`
- [x] `animation/__tests__/AnimationTimelineEvaluator.test.ts`
- [x] `animation/__tests__/AnimationEasing.test.ts`

### ETAP 7 — Quality Gates
- [x] `npx tsc --noEmit` — 0 errors w zakresie PM30 (pre-istniejące błędy Inspectora poza zakresem)
- [x] `npx vitest run` — animation **26/26 PASS** (PlaybackController 9, TimelineEvaluator 6, Easing 7, Domain 4)
- [x] `npm run build` — GREEN (✓ Compiled successfully)

## Zakazy
- Brak requestAnimationFrame, Runtime Preview, Runtime Bridge, DOM, CSS Animation Runtime, Inspector UI, Timeline UI, Keyframe Editor, Builder Runtime, Commerce Engine, Platform Core, Runtime Pipeline.
- Brak Interpolatora (przeniesiony do PM31).
- Raport końcowy: wyłącznie PM30 DELTA IMPLEMENTATION REPORT (bez pełnego raportu).
