# TODO — PM32 (Agent 1) Animation Runtime Execution Layer

> Status: READY FOR ARCHITECT REVIEW

## Scope (Runtime Execution Layer — PM32)

### 1. RuntimeFrameAssembler
- [x] Utworzyć `packages/builder-core/src/animation/RuntimeFrameAssembler.ts`
- [x] `interpolateFrame(frame)` — interpolacja przez AnimationInterpolator
- [x] `RuntimeFrameAssembler.assemble(timeline, time)` → `RuntimeFrameBatch`

### 2. RuntimeFrameCache
- [x] Utworzyć `packages/builder-core/src/animation/RuntimeFrameCache.ts`
- [x] Immutable LRU cache kluczowany `(timelineId, time)`, `maxEntries`, walidacja

### 3. RuntimeScheduler
- [x] Utworzyć `packages/builder-core/src/animation/RuntimeScheduler.ts`
- [x] `tick`/`advance`/`seek`/`pause`/`stop`/`reset` — deterministyczny, bez rAF

### 4. AnimationRuntimeBridge
- [x] Utworzyć `packages/builder-core/src/animation/AnimationRuntimeBridge.ts`
- [x] `evaluateFrame(timeline, state, time)` + `evaluateStructure`

### 5. Unit Tests (Node, bez jsdom)
- [x] `RuntimeFrameAssembler.test.ts` — 4 testy
- [x] `RuntimeFrameCache.test.ts` — 8 testów
- [x] `RuntimeScheduler.test.ts` — 8 testów
- [x] `AnimationRuntimeBridge.test.ts` — 5 testów

### 6. Quality Gates
- [x] `npx vitest run` (PM32 subset) — 4 pliki / 25 testów PASS
- [x] `npx tsc --noEmit` — 0 nowych błędów (wszystkie raportowane pre-istniejące)
- [x] `npm run build` — PM32 addytywny (czysto testowy), nie zmienia ścieżek produkcyjnych; build bez regresji

## Zakres Niedozwolony (respektowany)
- Brak requestAnimationFrame / clock
- Brak Runtime Preview Bridge / DOM / CSS
- Brak Inspector UI / Timeline UI / Keyframe Editor / Canvas Integration
- Brak zmian w Commerce Engine / Platform Core / Runtime Pipeline / Builder Runtime
