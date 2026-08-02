# Sprint 6 Step 5 — Plan Finalizacji

## Informacje zebrane

### Stan obecny:
1. **Sprint 6A (Drag & Drop)** — ✅ Zakończony, zamrożony (8/8 Quality Gates)
2. **Sprint 6B (Smart Guides)** — ✅ Zakończony, zamrożony (6/6 Quality Gates)
3. **Step 3.3 (Webhook Runtime)** — ✅ Zakończony (5/5 testów)
4. **Step 4 (Runtime Integration)** — ✅ Zakończony (104/104 testy)
5. **Step 5 (Builder Runtime)** — ⚠️ W trakcie (~40%)

### Pliki już istniejące:
- `packages/runtime-core/src/DefaultRuntimeCompositionEngine.ts` — silnik kompozycji
- `packages/runtime-core/src/RuntimeCache.ts` — cache z TTL + LRU
- `packages/runtime-core/src/DefaultRuntimePipeline.ts` — pipeline z stage'ami
- `src/lib/runtime/renderStore.ts` — główny entry point (ma błędy TS)
- `src/components/builder/canvas/BuilderCanvas.tsx` — renderuje wireframe (nie iframe)
- `src/components/builder/shell/BuilderTopBar.tsx` — brak przełącznika LIVE/PREVIEW/EXPORT

### Pliki do utworzenia:
- `src/components/builder/canvas/RuntimePreviewChannel.ts`
- `src/components/builder/canvas/useRuntimePreview.ts`
- `docs/studio/SPRINT6_STEP5_COMPLETION_REPORT.md`

### Pliki do modyfikacji:
- `src/lib/runtime/renderStore.ts` — naprawa błędów TS, wpięcie pipeline jako primary path
- `src/components/builder/canvas/BuilderCanvas.tsx` — iframe zamiast wireframe
- `src/components/builder/shell/BuilderTopBar.tsx` — dodanie przełącznika trybów
- `TODO_SPRINT6_STEP5.progress.md` — aktualizacja
- `TODO_SPRINT6_STEP5.todo` — aktualizacja

## Plan

### Faza 1 — Runtime Pipeline Completion (PRIORYTET KRYTYCZNY)
1. Naprawić błędy TypeScript w `renderStore.ts` (parse errors, type mismatches)
2. Przebudować `renderStore()` na pipeline-first z legacy fallback
3. Wpiąć `RuntimeCache` do pipeline'u
4. Zapewnić działanie `renderStoreSection()` i `renderStorePartial()` przez pipeline

### Faza 2 — Builder Runtime Preview
1. Utworzyć `RuntimePreviewChannel.ts` (iframe + postMessage)
2. Utworzyć `useRuntimePreview.ts` (hook)
3. Przebudować `BuilderCanvas.tsx` na iframe z overlay

### Faza 3 — Preview Modes
1. Dodać LIVE/PREVIEW/EXPORT do `BuilderTopBar.tsx`

### Faza 4 — Testy
1. Przygotować testy pipeline, cache, preview
2. Uruchomić tsc --noEmit i vitest

### Faza 5 — Dokumentacja
1. Zaktualizować pliki TODO
2. Przygotować Completion Report

## Pliki do edycji
1. `src/lib/runtime/renderStore.ts` — naprawa TS + pipeline primary
2. `src/components/builder/canvas/RuntimePreviewChannel.ts` — NOWY
3. `src/components/builder/canvas/useRuntimePreview.ts` — NOWY
4. `src/components/builder/canvas/BuilderCanvas.tsx` — przebudowa
5. `src/components/builder/shell/BuilderTopBar.tsx` — tryby
6. `TODO_SPRINT6_STEP5.progress.md` — aktualizacja
7. `TODO_SPRINT6_STEP5.todo` — aktualizacja
8. `docs/studio/SPRINT6_STEP5_COMPLETION_REPORT.md` — NOWY

## Kroki następcze
Po zakończeniu Step 5:
- Uruchomić `npx tsc --noEmit` i `npx vitest run`
- Naprawić błędy
- Przejść do Sprint 6 Step 6 (Commerce Integration)
