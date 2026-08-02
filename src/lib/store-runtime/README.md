# LEGACY RUNTIME

This module is frozen.

**Do not add new features.**

## Migration Status

The legacy runtime (`src/lib/store-runtime/`) has been superseded by:

- `src/lib/runtime/renderStore.ts` — Unified `renderStore()` public API
- `packages/runtime-core/` — Runtime Engine, Pipeline, Section Registry, Output Modes
- `packages/runtime-composition/` — StoreRuntimeEngine, RuntimeCompositionEngine

## What to do

- All new development should use the new runtime via `renderStore()` from `@/lib/runtime`
- The store page (`src/app/store/[slug]/page.tsx`) has been migrated to use `renderStore()`
- Legacy adapters (`RuntimeResultAdapter`, `RuntimeSectionAdapter`) remain for backward compatibility
- Scheduled for removal after full migration validation

## Last Updated

Sprint 6 Step 4
