# Sprint 6 — Step 4 (Runtime Integration + Commerce Completion)

## Scope
- Runtime Integration (renderStore, pipeline unification)
- Builder Preview (LIVE, PREVIEW, EXPORT modes)
- Commerce Runtime (Payment Flow completion, Runtime ↔ Commerce sync)
- Runtime Optimization (cache, lazy rendering)
- Builder Integration (BuilderCanvas, Runtime Pipeline)
- Tests + Documentation

## Checklist

### 1. Unified `renderStore()` Public API
- [x] Create `src/lib/runtime/renderStore.ts` - unified entry point
- [x] Integrate RuntimeResolver + RuntimeValidator (legacy) with StoreRuntimeEngine (new runtime-core)
- [x] Support LIVE, PREVIEW, EXPORT modes
- [x] Wire RuntimePipeline for section rendering
- [x] Export from `src/lib/runtime/index.ts`

### 2. Migrate Store Page to New Runtime
- [x] Update `src/app/store/[slug]/page.tsx` to use `renderStore()`
- [x] Use SectionRenderer from runtime-core adapters
- [x] Keep backward compatibility with legacy store config

### 3. Commerce Runtime — Event-Driven Payment Flow
- [x] Wire `Payment.Completed` subscription in `OrderProcessingEngine`
- [x] Auto-transition order `PAYMENT_PENDING` → `PAID` on event
- [x] Add `getOrder()` public method for webhook callback
- [x] Ensure webhook route awaits event-driven flow

### 4. Builder Runtime Preview Integration
- [x] Integrate StoreRuntimeEngine with builder preview mode
- [x] Wire PREVIEW mode in renderStore() → RuntimePipeline
- [x] Add builder preview endpoint
- [x] Support PREVIEW marker output for BuilderCanvas

### 5. Runtime Optimization
- [x] Add runtime context caching in StoreRuntimeEngine
- [x] Implement lazy module initialization
- [x] Add request-level cache in renderStore

### 6. Tests
- [x] Integration tests for renderStore()
- [x] Event-driven webhook → order processing pipeline test
- [x] Builder preview pipeline test
- [x] Runtime optimization tests (cache, lazy loading)

### 7. Documentation
- [x] Create TODO_SPRINT6_STEP4.md (this file)
- [x] Update Completion Report
- [x] Define Exit Criteria

## Exit Criteria
- [ ] `renderStore(slug)` works for LIVE, PREVIEW, EXPORT modes
- [ ] Store page renders via new runtime pipeline
- [ ] Payment.Completed → OrderProcessingEngine event subscription works
- [ ] Builder Preview renders sections with PREVIEW markers
- [ ] All tests pass: vitest + tsc --noEmit
- [ ] Old legacy runtime marked as frozen/legacy
- [ ] Documentation complete

