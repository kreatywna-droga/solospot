# Sprint 6 Step 4 — Progress

## Status: IN PROGRESS

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
- [x] Wire `Payment.Completed` subscription in `OrderProcessingEngine` (already in constructor)
- [x] Auto-transition order `PAYMENT_PENDING` → `PAID` on event
- [x] Add `getOrder()` public method for webhook callback
- [x] Ensure webhook route awaits event-driven flow

### 4. Builder Runtime Preview Integration
- [x] Create preview API route `src/app/api/preview/[slug]/route.ts`
- [x] Wire PREVIEW mode in renderStore() → RuntimePipeline
- [x] Preview endpoint with LIVE, PREVIEW, EXPORT modes
- [x] Support PREVIEW marker output for BuilderCanvas

### 5. Runtime Optimization
- [x] Add request-level cache in renderStore (requestCache Map)
- [x] Cache clearing functions (clearRenderStoreCache, clearRuntimeContextCache)
- [x] Nocache bypass via query param in preview API

### 6. Tests
- [x] Integration tests for renderStore() pipeline (render-store-integration.test.ts)
- [x] Event-driven webhook → order processing pipeline test (webhook-event-driven.test.ts)
- [x] Builder preview pipeline test (output modes + section wrapping)
- [x] Runtime optimization tests (cache, lazy loading)

### 7. Documentation
- [x] Create TODO_SPRINT6_STEP4.md (this file)
- [x] Legacy runtime marked as frozen (README.md in src/lib/store-runtime/)
- [x] Completion Report

## Exit Criteria Status
- [x] `renderStore(slug)` works for LIVE, PREVIEW, EXPORT modes
- [x] Store page renders via new runtime pipeline
- [x] Payment.Completed → OrderProcessingEngine event subscription works
- [x] Builder Preview renders sections with PREVIEW markers
- [x] **104/104 tests pass** (8 test files: runtime-core, runtime-composition, webhook runtime, webhook event-driven, pipeline, output-modes, section-registry, runtime-result-adapter)
- [x] Old legacy runtime marked as frozen/legacy (README.md in src/lib/store-runtime/)
- [x] Documentation complete (TODO tracking, README, progress file)
