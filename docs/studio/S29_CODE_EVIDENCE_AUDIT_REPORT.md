# S29 Code Evidence Audit Report

> **Subsystem:** Layout Constraints & Auto Layout (Sprint S29)
> **Auditor:** Senior Engineer — Code-Evidence Self-Audit
> **Date:** 2026-08-10
> **Scope:** `packages/authoring-studio/src/layout/**`, public exports, S28 boundary
> **Status:** 🟢 **Recommendation: PASS**

---

## 1. Scope & Freeze Verification

| Check | Method | Result |
|---|---|---|
| Files changed in this sprint | `git status` / diff review | Only `packages/authoring-studio/src/layout/**`, one line in `packages/authoring-studio/src/index.ts`, `docs/studio/S29_*`. |
| S1–S28 frozen | No edits to `responsive/**`, `camera/**`, `selection/**`, `timeline/**`, `motion/**`, `builder-core` (S29), etc. | ✅ PASS |
| Authorized index change | Single `export * from './layout/index';` appended with S29 comment | ✅ PASS |

---

## 2. Source Modules Audited

`packages/authoring-studio/src/layout/`
1. `LayoutModel.ts`
2. `ConstraintModel.ts`
3. `LayoutSizing.ts`
4. `ConstraintResolver.ts`
5. `AutoLayoutEngine.ts`
6. `ResponsiveLayoutAdapter.ts`
7. `LayoutTree.ts`
8. `LayoutCommands.ts`
9. `index.ts`

Test suites: `__tests__/LayoutModel.test.ts`, `ConstraintResolver.test.ts`, `LayoutSizing.test.ts`, `AutoLayoutEngine.test.ts`, `LayoutTree.test.ts`, `ResponsiveLayoutIntegration.test.ts`, `LayoutCommandsHistory.test.ts`, `LayoutE2EWorkflow.test.ts`.

---

## 3. Governance & Architecture Audit

### 3.1 SSOT (DECISION-044) — PASS
- S29 only **reads** `BuilderDocument` and **writes** via `updateNodeInDocument(doc, node)` (S28 boundary, invokes `touchDocument`).
- Layout stored in node `props.layoutStyle` / `props.layoutConstraints`; S28 overrides remain `props.responsiveOverrides`.
- Zero second document model, graph, or history stack.

### 3.2 Bridge/Engine Delegation (DECISION-042/045) — PASS
- `LayoutCommands` follow the S28 command pattern and reuse the real `createHistoryStack<BuilderDocument>`.
- Layout resolution never implements playback/time-stepping/scheduling logic.
- Zero imports of `PlaybackController`, `RuntimeScheduler`, `AnimationRuntimeBridge`, browser adapters.

### 3.3 Duplicate Systems — PASS
- Breakpoints: S29 calls `new BreakpointRegistry().resolveBreakpointForWidth(px)` (S28) — no second registry.
- Overrides: `resolveEffectiveNodeProperty` (S28) — no re-derived cascade.
- History: real `createHistoryStack` proven by `LayoutCommandsHistory.test.ts`.

### 3.4 Domain Boundary — PASS
Scoped grep over `packages/authoring-studio/src/layout/`:
| Forbidden pattern | Hits |
|---|---|
| `from 'react'` / `from "react"` | 0 |
| `window.` / global `document.` | 0 (the single `document` use is the `resolveLayout(document, …)` parameter, matching S28 style) |
| `requestAnimationFrame` | 0 (only in header comments stating its absence) |
| `setTimeout` / `setInterval` | 0 |
| `Math.random` / `Date.now` | 0 |
| `PlaybackController` / `RuntimeScheduler` / `AnimationRuntimeBridge` / `RuntimeBridge` | 0 |
| `HTMLCanvasElement` / `AudioContext` / `WebGL` / `WebGPU` | 0 |
| `as any` | 0 |
| Imports outside `builder-core` + `../responsive` | 0 |

### 3.5 Determinism — PASS
- No temporal/random inputs in layout math; `normalizeNumber` (4 decimals) applied to all emitted rect coords.
- Dedicated tests: `LayoutSizing` determinism, `LayoutTree` determinism, `AutoLayoutEngine` determinism, `ResponsiveLayoutIntegration` run-to-run equality.

### 3.6 API Cross-Check (no phantom APIs) — PASS
| Imported API | Real source (verified) |
|---|---|
| `BuilderDocument`, `SectionNode`, `createBuilderDocument`, `createBuilderPage`, `createSectionNode` | `packages/builder-core/src/BuilderDocument.ts` |
| `createHistoryStack`, `HistoryStack` | `packages/builder-core/src/HistoryStack.ts` |
| `BreakpointRegistry` | `packages/authoring-studio/src/responsive/BreakpointRegistry.ts` |
| `BreakpointId` | `packages/authoring-studio/src/responsive/ResponsiveValueModel.ts` |
| `resolveEffectiveNodeProperty`, `updateNodeInDocument`, `getNodeResponsiveOverrides`, `SetBreakpointOverrideCommand` | `packages/authoring-studio/src/responsive/ResponsiveOverrideEngine.ts` / `ResponsiveCommands.ts` |

---

## 4. Gate Evidence

| Gate | Command | Result |
|---|---|---|
| Vitest (S29) | `npx vitest run packages/authoring-studio/src/layout/__tests__` | ✅ 8/8 files, 52/52 tests |
| Vitest (S28+S29 boundary) | `npx vitest run packages/authoring-studio/src/responsive packages/authoring-studio/src/layout` | ✅ 16/16 files, 80/80 tests |
| Golden E2E | `.../__tests__/LayoutE2EWorkflow.test.ts` | ✅ PASS |
| TSC (S29 scope) | `npx tsc --project packages/authoring-studio/tsconfig.json --noEmit` (filtered `src/layout`) | ✅ 0 errors |
| Build | `npm run build` | ✅ Compiled successfully in 8.5s |

Repo-wide TSC failures exist **pre-existing** outside `src/layout` (S1–S28 domains, e.g. `SceneGraphModel` exports, `AnimationTypes` members, `TimelineViewport` fields). These are attributed to prior sprints and are not introduced by S29.

---

## 5. Findings

- **Finding-001 (closed):** `AutoLayoutEngine` originally mixed axis *length* vs *coordinate* (main/cross cursor started at container length instead of origin) and used swapped cross-axis helpers → children placed at (900,900) with zero size. **Fix:** explicit `axisWidth/axisHeight/axisX/axisY` + `main/cross`/`mainOrigin/crossOrigin` selection; verified by all AutoLayoutEngine + LayoutTree + E2E suites.
- **Finding-002 (closed):** `LayoutTree.resolveSections` hard-coded a page-level default vertical style and ignored the container's own `layoutStyle` (gap/direction). **Fix:** pass effective container style when laying out its children; verified gap 12 → `b.y=112`, tablet gap 6 → `b.y=106`.
- **Finding-003 (closed):** `buildEffectiveNodeLayout` mutated `readonly` DTO fields → TS2540 ×10. **Fix:** `Mutable<T>` draft accumulation; 0 S29 TSC errors.
- **No open findings.**

---

## 6. Final Recommendation

- **S29 Status:** 🟢 **Recommendation: PASS**
- **S29-Specific TS Errors:** **0**
- **Vitest:** **8/8 suites, 52/52 tests PASS** (80/80 with S28 boundary)
- **Build:** **PASS**
- **Formal ratification:** 🔒 reserved for the Architect (per Audit Authority Boundary).