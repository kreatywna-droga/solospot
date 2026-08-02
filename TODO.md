# Sprint 6 Step 5 — Finalizacja (TODO tracking)

> Plan zatwierdzony. Kolejność: P0 → P1 → P2 → P3 → P4 → P5
> Status: IN PROGRESS

## P0 — Stabilizacja Runtime 🔄
- [ ] 0.1 Naprawić `useRuntimePreview.ts` (bug viewport `height: vp.width`, indentacja, obsługa `SECTIONS_METRICS`)
- [ ] 0.2 Usunąć martwy kod z `renderStore.ts` (`buildTenantContext(slug)`, `runtimeContextCache`; `clearRuntimeContextCache` → no-op jeżeli API publiczne)
- [ ] 0.3 Przepiąć `src/app/preview/[storeId]/page.tsx` na `renderStore({ slug, mode: 'PREVIEW' })`
- [ ] 0.4 Zweryfikować użycie `clearRuntimeContextCache` / `clearRenderStoreCache` w kodzie

## P1 — Builder Runtime Preview
- [ ] 1.1 NOWY `src/app/preview-frame/[slug]/page.tsx` — cienki adapter iframe (Runtime → SectionRenderer → postMessage → Builder)
- [ ] 1.2 EDYCJA `RuntimePreviewChannel.ts` — dodać `SECTIONS_METRICS` + `onMetrics`
- [ ] 1.3 EDYCJA `useOverlay.ts` — opcja `externalRects` (recty z iframe, fallback `querySelector`)
- [ ] 1.4 EDYCJA `SelectionOverlay.tsx` — przekazać `externalRects`
- [ ] 1.5 PRZEBUDOWA `BuilderCanvas.tsx` — iframe Runtime + overlays (Selection, Grid, SmartGuides, Ghost, Drop) + fallback wireframe
- [ ] 1.6 EDYCJA `useRuntimePreview.ts` — finalizacja (metrics state, re-send na RUNTIME_READY)

## P2 — Runtime Modes
- [ ] 2.1 EDYCJA `BuilderTopBar.tsx` — segmented control LIVE/PREVIEW/EXPORT → `SET_RUNTIME_MODE` (enum `RuntimeMode`, bez stringów)

## P3 — Overlay (zawarte w P1; weryfikacja)
- [ ] 3.1 Upewnić się, że Builder nie wykonuje `querySelector()` wewnątrz iframe (tylko `externalRects`)

## P4 — Testy
- [ ] 4.1 NOWY `packages/runtime-core/src/__tests__/runtime-cache.test.ts` (TTL, LRU, hit/miss, invalidate, clear, stats)
- [ ] 4.2 NOWY `src/components/builder/canvas/__tests__/preview-channel.test.ts` (protokół postMessage, mock window)
- [ ] 4.3 NOWY `src/lib/runtime/__tests__/partial-rendering.test.ts` (`renderStoreSection`/`renderStorePartial`)
- [ ] 4.4 NOWY `packages/builder-core/src/__tests__/builder-runtime-sync.test.ts` (selekcja + sync preview)
- [ ] 4.5 `npx tsc --noEmit` — naprawić nowe błędy (bez jsdom/testing-library)
- [ ] 4.6 `npx vitest run` — naprawić błędy

## P5 — Dokumentacja
- [ ] 5.1 NOWY `docs/studio/106_SPRINT6_STEP5_COMPLETION_REPORT.md` (+ sekcja Known Limitations)
- [ ] 5.2 Aktualizacja `TODO_SPRINT6_STEP5.md`, `.progress.md`, `.todo`, `SPRINT6_STEP5_TODO.md`, `TODO.md`

## Exit Criteria
- [ ] renderStore() działa przez DefaultRuntimePipeline (legacy tylko fallback)
- [ ] BuilderCanvas renderuje Runtime przez iframe
- [ ] Selection/Hover/Overlay działają przez PreviewChannel (externalRects)
- [ ] Przełącznik LIVE/PREVIEW/EXPORT działa
- [ ] `npx tsc --noEmit` bez nowych błędów
- [ ] `npx vitest run` przechodzi
- [ ] Dokumentacja (106 + TODO) zaktualizowana

