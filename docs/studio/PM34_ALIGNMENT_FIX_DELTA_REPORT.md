# PM34 — ALIGNMENT FIX DELTA REPORT (Option B)

## Runtime Preview Animation Integration — Flat PM33 API Alignment

> **Status:** COMPLETE — READY FOR ARCHITECT REVIEW
> **Rola:** Lead Implementation Engineer (Agent 1)
> **Package:** `packages/builder-core` + `src/components/builder/runtime-preview`
> **Data:** 2026-08-05
> **Decyzja:** **Option B** — refaktor PM34 impl + testów względem istniejącego flat PM33 API. **PM33 foundation NIE jest modyfikowana.**

---

## 1. Problem Summary

PM34 impl/test files were written against an older/complex trigger API, but the PM33 foundation was implemented with a **simpler flat API**. This caused **~27-30 TypeScript errors** (`tsc_pm34_err.txt`) and failing tests.

Per Architect decision (**Option B**), PM34 files were refactored to match the existing flat PM33 API. The frozen PM33 foundation was **not** modified.

### Flat PM33 API (frozen, reference)
- `AnimationTriggerContext` = `{ scrollY, viewportWidth, viewportHeight, isHovered, isClicked, visibilityRatio }` + `createTriggerContext(partial)`.
- `AnimationTriggerEngine` methods: `evaluate(trigger, context)`, `evaluateTriggers`, `transition`, `stateOf`, `states`, `reset()`.
- `evaluate()` returns `{ shouldStart, satisfied, state }`.
- Trigger shapes: `{ type: 'hover' }`, `{ type: 'inView', threshold }`, `{ type: 'scroll', threshold }`.

---

## 2. File Delta

### Zmodyfikowane pliki

| Plik | Zmiana |
|------|--------|
| `packages/builder-core/src/animation/AnimationRuntimePreviewAdapter.ts` | **Przepisany** na flat PM33 API: `Map<string, AnimationTrigger>` + `registerTrigger(id, trigger)`; mapuje wiadomości na flat context via `createTriggerContext`; produkuje `TriggerEvaluationReport { results, activatedTriggerIds, states, allSatisfied, anySatisfied }` przez `engine.evaluate()` per trigger; `reset()` → `engine.reset()` + `createTriggerContext()`. Usunięty nieużywany import `TriggerEvaluationResult`. |
| `packages/builder-core/src/animation/AnimationTriggerBridge.ts` | Poprawiony import `TriggerEngineEvaluationReport` → `TriggerEvaluationReport` (z adaptera); `handleReport(report: TriggerEvaluationReport)`. |
| `packages/builder-core/src/animation/__tests__/AnimationRuntimePreviewAdapter.test.ts` | **Przepisany** na flat API: `adapter.registerTrigger(id, {...})`; asercje pól flat context (`isHovered`, `isClicked`, `visibilityRatio`, `scrollY`, `viewportWidth/Height`); asercje `evaluationReport.activatedTriggerIds`. |
| `packages/builder-core/src/animation/__tests__/AnimationTriggerBridge.test.ts` | **Przepisany**: `adapter.registerTrigger` + `bridge.handleReport(result.evaluationReport)` (usunięte `engine.evaluateAll`). |
| `src/components/builder/runtime-preview/BrowserTriggerAdapter.ts` | Usunięty `implements AnimationRuntimePreviewAdapter` + nieistniejący import `AnimationRuntimePreviewAdapterOptions`; zdefiniowany lokalny `BrowserTriggerAdapterOptions`; standalone emitter (nie subclass). |
| `packages/builder-core/src/index.ts` | Eksport `TriggerEvaluationReport` obok `AdapterProcessingResult`, `AdapterTriggerEvaluationResult`, `AnimationRuntimePreviewAdapter`, `AnimationTriggerBridge`. |

### Niezmodyfikowane (Repository Freeze)
- PM33 foundation: `AnimationTriggerContext.ts`, `AnimationTriggerEngine.ts`, `AnimationTriggerEvaluator.ts`, `AnimationTriggerState.ts`.
- `AnimationRuntimePreviewBridge.ts` (już poprawny).
- PM31 / PM27 pre-existing errors (out of scope).

---

## 3. Verification

### 3.1 Quality Gates (PM34 tests)

```bash
npx vitest run packages/builder-core/src/animation/__tests__/AnimationRuntimePreviewAdapter.test.ts \
  packages/builder-core/src/animation/__tests__/AnimationTriggerBridge.test.ts
```

```
Test Files  2 passed (2)
     Tests  9 passed (9)
```

- `AnimationRuntimePreviewAdapter.test.ts` — 6 tests PASS
- `AnimationTriggerBridge.test.ts` — 3 tests PASS

### 3.2 TypeScript

`npx tsc --noEmit` — wszystkie błędy TS w plikach PM34 (`AnimationRuntimePreviewAdapter`, `AnimationTriggerBridge`, `BrowserTriggerAdapter`) **rozwiązane**. Jedyny pozostały błąd `index.ts` (duplikat `AnimationInterpolation`) jest **pre-existing** z PM31 (poza zakresem, per dyrektywa).

### 3.3 Branch / Scope
- Zero zmian w PM33 foundation.
- Zero zmian w Commerce / Platform Core / Runtime Pipeline / Animation Engine (domena).
- `BrowserTriggerAdapter` pozostaje w warstwie Preview (jedyna warstwa z dostępem do Browser API).

---

## 4. Public API (index.ts exports)

Poprawne eksporty PM34:
- `AnimationRuntimePreviewAdapter`
- `AdapterProcessingResult`
- `AdapterTriggerEvaluationResult`
- `TriggerEvaluationReport`
- `AnimationTriggerBridge`

---

## 5. Handoff

PM34 (Runtime Preview Animation integration) jest teraz **spójny z flat PM33 API**. Kolejne kroki mogą objąć:
- pełną integrację `BrowserTriggerAdapter` → `AnimationRuntimePreviewAdapter` → `AnimationTriggerBridge` w pętli preview,
- podłączenie `RuntimeScheduler` (PM32) do wyzwalanych playbacków,
- finalny PM34 Architecture Review / Freeze.
