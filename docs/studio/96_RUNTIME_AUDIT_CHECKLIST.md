# 96. WEB FACTOR Runtime & Builder Preview Audit Checklist

> Maintained by Agent 2 (Platform Engineering Maintenance)  
> Date: 2026-07-31  
> Status: 🟢 APPROVED

---

## 1. Runtime Pipeline & Core Checklist

- [ ] **RULE-RT-001**: `RuntimePipeline` executes deterministically across all inputs.
- [ ] **RULE-RT-002**: `RuntimeCompositionEngine` contains zero React or DOM UI logic.
- [ ] **RULE-RT-003**: Builder Preview communicates exclusively over `PreviewChannel` postMessage protocol.
- [ ] **RULE-RT-004**: `renderStore()` is the single unified public entry point for Runtime execution.
- [ ] **RULE-RT-005**: `RuntimeCache` operates as a read-only acceleration layer without mutating domain state.

---

## 2. Sprint 6 Step 5 Specific Quality Gates

- [ ] **`RUNTIME_PIPELINE_COMPLETE`**: Unified `renderStore()` pipeline verified for LIVE, PREVIEW, and EXPORT output modes.
- [ ] **`RUNTIME_PREVIEW_COMPLETE`**: Builder Canvas and StoreRuntimeEngine sync seamlessly in PREVIEW mode.
- [ ] **`RUNTIME_CACHE_COMPLETE`**: Render cache acceleration operates cleanly without side-effects.
- [ ] **`PARTIAL_RENDERING_COMPLETE`**: Incremental section updates re-render without full document state resets.
- [ ] **`NO_RUNTIME_REGRESSION`**: Zero breaking changes or regressions in legacy store page routes.

---

## 3. Public API & Monorepo Stability

- [ ] **`NO_PUBLIC_API_BREAKING_CHANGES`**: `@web-factor/builder-sdk` barrel exports preserve 100% backward compatibility.
- [ ] **`NO_REGRESSION_BUILDER`**: 10 frozen Studio Foundation subsystems pass regression checks.
