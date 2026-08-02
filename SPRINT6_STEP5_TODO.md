# Sprint 6 Step 5 — Final Integration TODO

## Faza 1 — Runtime Pipeline (PRIORYTET 1) ✅ JUŻ GOTOWE
- [x] `renderStore()` używa DefaultRuntimePipeline jako głównej ścieżki przez `resolveViaPipeline()`
- [x] RuntimeResolver działa wyłącznie jako fallback w `resolveViaLegacy()`
- [x] DefaultRuntimeCompositionEngine podłączony przez `resolveViaPipeline()`
- [x] RuntimeValidator działa w legacy fallback (można dodać jako stage pipeline)

## Faza 2 — RuntimeCache ✅ JUŻ GOTOWE
- [x] RuntimeCache zintegrowany z pipeline (cache-first przed pipeline, cache-write po)
- [x] Cache hit/miss/ttl/invalidate działają
- [x] LRU eviction w RuntimeCache
- [x] `requestCache` usunięty jako główny mechanizm (zastąpiony przez globalRuntimeCache)

## Faza 3 — Builder Preview 🔴 DO ZROBIENIA
- [x] RuntimePreviewChannel.ts — utworzony
- [x] useRuntimePreview.ts — utworzony
- [ ] BuilderCanvas.tsx — zintegrować iframe Runtime Preview

## Faza 4 — BuilderCanvas 🔴 DO ZROBIENIA
- [ ] BuilderCanvas renderuje iframe Runtime Preview + overlay warstwę
- [ ] Selection overlay na iframe
- [ ] Smart Guides overlay na iframe
- [ ] Ghost element + Drop indicator
- [ ] Wireframe jako fallback

## Faza 5 — Preview Modes 🔴 DO ZROBIENIA
- [ ] BuilderTopBar — dodać przełącznik LIVE / PREVIEW / EXPORT
- [ ] Zmiana trybu przełącza Runtime

## Faza 6 — Partial Rendering ✅ JUŻ GOTOWE
- [x] `renderStoreSection()` istnieje
- [x] `renderStorePartial()` istnieje
- [x] Dependency-aware updates
- [x] RuntimeCache integration

## Faza 7 — Testy 🔴 DO ZROBIENIA
- [ ] Runtime Pipeline tests
- [ ] Runtime Cache tests
- [ ] PreviewChannel tests
- [ ] Builder Preview tests
- [ ] renderStoreSection() tests
- [ ] renderStorePartial() tests
- [ ] Pipeline Stage Order tests
- [ ] Legacy Fallback tests
- [ ] `npx tsc --noEmit` — sprawdzić
- [ ] `npx vitest run` — sprawdzić

## Faza 8 — Dokumentacja 🔴 DO ZROBIENIA
- [ ] Zaktualizować TODO_SPRINT6_STEP5.md
- [ ] Zaktualizować TODO_SPRINT6_STEP5.progress.md
- [ ] Zaktualizować TODO_SPRINT6_STEP5.todo
- [ ] Utworzyć SPRINT6_STEP5_COMPLETION_REPORT.md

## Exit Criteria
- [ ] renderStore() → DefaultRuntimePipeline jako główna ścieżka ✅
- [ ] RuntimeResolver tylko jako fallback ✅
- [ ] RuntimeCache w pełni zintegrowany ✅
- [ ] RuntimePreviewChannel + useRuntimePreview podłączone do BuilderCanvas
- [ ] BuilderCanvas renderuje Runtime Preview przez iframe
- [ ] LIVE / PREVIEW / EXPORT toggle w BuilderTopBar
- [ ] renderStoreSection() + renderStorePartial() przez Pipeline ✅
- [ ] Wszystkie testy przechodzą (tsc i vitest)
- [ ] SPRINT6_STEP5_COMPLETION_REPORT.md gotowy

