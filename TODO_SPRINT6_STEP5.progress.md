# Sprint 6 Step 5 — Progress

## Status: COMPLETED

### Zadanie 1 — Runtime Pipeline Completion (priorytet: bardzo wysoki)
- [x] Create DefaultRuntimeCompositionEngine (`packages/runtime-core/src/DefaultRuntimeCompositionEngine.ts`)
- [x] Create RuntimeCache (`packages/runtime-core/src/RuntimeCache.ts`) - TTL-based + LRU eviction
- [x] Update runtime-core index.ts exports
- [x] Add imports for pipeline in renderStore.ts (DefaultRuntimeCompositionEngine, DefaultRuntimePipeline, createDefaultSectionRegistry, RuntimeCache)
- [x] Wire DefaultRuntimePipeline into renderStore() — full pipeline integration
- [x] Add pipeline stages (cache-check, validate-access, runtime-composition, render-sections, build-result, cache-write)
- [x] Add legacy fallback stage
- [x] Remove direct RuntimeResolver dependency from renderStore() (pipeline primary with fallback)

### Zadanie 2 — Builder Preview Runtime (priorytet: bardzo wysoki)
- [x] Create RuntimePreviewChannel (`src/components/builder/canvas/RuntimePreviewChannel.ts`)
- [x] Create useRuntimePreview hook (`src/components/builder/canvas/useRuntimePreview.ts`)
- [x] Create preview-frame iframe page (`src/app/preview-frame/[slug]/page.tsx`)
- [x] Wire BuilderCanvas with real runtime via iframe + metrics reporting
- [x] Add LIVE/PREVIEW/EXPORT mode toggle in BuilderTopBar

### Zadanie 3 — Runtime Performance Foundation (priorytet: średni)
- [x] Create RuntimeCache with TTL-based invalidation
- [x] Implement renderStoreSection() for targeted re-renders
- [x] Implement renderStorePartial() for partial updates
- [x] Support externalRects overlay metrics via postMessage (Architectural Decision #3)

### Zadanie 4 — Testy
- [x] Runtime Pipeline tests (`packages/runtime-core/src/__tests__/render-store-integration.test.ts`)
- [x] Preview channel tests (`src/components/builder/canvas/__tests__/RuntimePreviewChannel.test.ts`)
- [x] Cache tests (`packages/runtime-core/src/__tests__/runtime-cache.test.ts`)
- [x] Partial rendering tests
- [x] Selection overlay rects tests

### Zadanie 5 — Dokumentacja
- [x] TODO Sprint 6 Step 5
- [x] Progress Report (`TODO_SPRINT6_STEP5.progress.md`)
- [x] Completion Report (`docs/studio/114_SPRINT6_STEP5_COMPLETION_REPORT.md`)

## Exit Criteria Status
- [x] Runtime Pipeline integrated with renderStore()
- [x] BuilderCanvas renders real runtime content via iframe
- [x] Cache + partial rendering implemented
- [x] All unit tests pass
- [x] Documentation complete
- [x] Ready for Sprint 6 Step 6 (Commerce Integration)
