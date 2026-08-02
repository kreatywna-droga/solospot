# Sprint 6 Step 5 — Finalization TODO (Agent 1)

> Approved plan with 5 architectural decisions:
> 1. Backward-compatible pipeline stages (optional deps, canExecute/skipStage)
> 2. Runtime Preview via iframe (Builder → BuilderCanvas → iframe → Runtime → PreviewChannel → postMessage)
> 3. externalRects for overlay (never querySelector inside iframe)
> 4. Tests limited to logic/protocol/runtime/integration (no jsdom/testing-library)
> 5. **Faza 0**: Runtime Feature Flags (LEGACY / PIPELINE / AUTO) in renderStore()

## Faza 0 — Runtime Feature Flags
- [ ] 0.1 Add `RuntimeBackend = 'LEGACY' | 'PIPELINE' | 'AUTO'` to renderStore.ts
- [ ] 0.2 Add `runtime?: RuntimeBackend` to RenderStoreOptions
- [ ] 0.3 renderStore() branches: LEGACY → legacy only; PIPELINE → pipeline only; AUTO → pipeline + legacy fallback
- [ ] 0.4 Export RuntimeBackend from src/lib/runtime/index.ts

## Faza 1 — Runtime Pipeline Completion
- [ ] 1.1 Extend PipelineDeps with optional: cache, buildCacheKey, validateAccess, compositionEngine, tenantContext, legacyFallback
- [ ] 1.2 Make PipelineContext.runtimeContext mutable
- [ ] 1.3 Add optional stages to DefaultRuntimePipeline: cache-check, validate-access, runtime-composition, cache-write, legacy-fallback
- [ ] 1.4 Fix execute(): set data from metadata.result (fixes pipeline primary path bug); short-circuit on cache-hit; run legacy-fallback on stage error
- [ ] 1.5 Update ExtendedPipeline.execute() with same logic
- [ ] 1.6 Update renderStore.ts resolveViaPipeline to pass cache/validateAccess/compositionEngine/tenantContext/legacyFallback into deps
- [ ] 1.7 Move cache ownership into pipeline; remove top-level cache-first/write duplication
- [ ] 1.8 Clean up renderStore() (remove unused buildTenantContext call)

## Faza 2 — Builder Runtime Preview
- [ ] 2.1 Create src/app/preview-frame/[slug]/page.tsx (iframe client that renders Runtime PREVIEW, postMessage protocol)
- [ ] 2.2 Extend RuntimePreviewChannel with SECTIONS_METRICS message + onMetrics callback
- [ ] 2.3 Update useRuntimePreview with metrics state + re-send on RUNTIME_READY
- [ ] 2.4 Extend useOverlay with externalRects option (metrics from iframe, fallback to querySelector)
- [ ] 2.5 Rebuild BuilderCanvas to render iframe Runtime + overlays (SelectionOverlay, GridOverlay, SmartGuides); wireframe as fallback

## Faza 3 — BuilderTopBar Preview Modes
- [ ] 3.1 Add LIVE/PREVIEW/EXPORT segmented control → SET_RUNTIME_MODE dispatch
- [ ] 3.2 Wire runtimeMode into iframe src + preview fetch

## Faza 4 — Runtime Performance
- [ ] 4.1 Dependency graph in renderStorePartial() (section-type → dependent fields map)
- [ ] 4.2 Incremental rendering metadata (affectedSections)

## Faza 5 — Tests
- [ ] 5.1 runtime-cache.test.ts (TTL, LRU, hit/miss, invalidate)
- [ ] 5.2 pipeline-stages.test.ts (cache-check/write, validate-access, runtime-composition, legacy-fallback, stage order)
- [ ] 5.3 preview-channel.test.ts (postMessage protocol with mocked window)
- [ ] 5.4 partial-rendering.test.ts (renderStoreSection/renderStorePartial with mocked repos)
- [ ] 5.5 builder-runtime-sync.test.ts (BuilderContext selection + preview sync)

## Faza 6 — Closeout
- [ ] 6.1 Update TODO_SPRINT6_STEP5.progress.md
- [ ] 6.2 Update TODO_SPRINT6_STEP5.todo
- [ ] 6.3 Create docs/studio/SPRINT6_STEP5_COMPLETION_REPORT.md
- [ ] 6.4 Run npx tsc --noEmit and fix regressions (pre-existing errors only in unrelated packages)
- [ ] 6.5 Run npx vitest run and fix failures

