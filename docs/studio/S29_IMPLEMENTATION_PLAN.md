# S29 Implementation Plan — Layout Constraints & Auto Layout

> **Status:** APPROVED FOR IMPLEMENTATION
> **Order:** Architecture → Plan → Approval (Architect) → Implementation
> **Scope (authorized files only):**
> - `packages/authoring-studio/src/layout/**` (new)
> - `packages/authoring-studio/src/index.ts` (single authorized line)
> - `docs/studio/S29_*`

---

## 1. Real APIs to reuse (API cross-check targets)

| API | Real source | Signature |
|---|---|---|
| `BuilderDocument`, `SectionNode`, `createBuilderDocument`, `createBuilderPage`, `createSectionNode`, `touchDocument` | `packages/builder-core/src/BuilderDocument.ts` | verified |
| `createHistoryStack<T>`, `HistoryStack<T>` | `packages/builder-core/src/HistoryStack.ts` | verified |
| `BreakpointRegistry`, `BUILTIN_BREAKPOINTS` | `packages/authoring-studio/src/responsive/BreakpointRegistry.ts` | verified |
| `BreakpointId`, `ResponsiveValue` | `packages/authoring-studio/src/responsive/ResponsiveValueModel.ts` | verified |
| `NodePropertyOverride`, `getNodeResponsiveOverrides`, `resolveEffectiveNodeProperty`, `updateNodeInDocument` | `packages/authoring-studio/src/responsive/ResponsiveOverrideEngine.ts` | verified |

No new dependencies. All imports above must be confirmed by re-reading the actual source during FAZA 0 (done).

---

## 2. Storage contract (inside existing SSOT)

Keyed under existing `SectionNode.props`:
- `props.layoutStyle` → `LayoutStyle`
- `props.layoutConstraints` → `LayoutConstraints`
- `props.responsiveOverrides` → S28 (unchanged)

Mutation path: `setLayoutStyle/setLayoutConstraint/removeLayoutConstraint` return new `SectionNode`; `updateNodeInDocument(doc, node)` (S28) replaces the node and calls `touchDocument`.

---

## 3. Implementation phases

### Phase 2 — Core Models
- `LayoutModel.ts`: DTOs + `DEFAULT_LAYOUT_STYLE`, `PAGE_DEFAULT_HEIGHT`.
- `ConstraintModel.ts`: `LayoutConstraints`, `LayoutSizing`, `DEFAULT_LAYOUT_CONSTRAINTS`, `parsePercentage`.

### Phase 3 — Sizing & Constraints
- `LayoutSizing.ts`: `resolveSizedLength({ mode, explicit, intrinsic, parentLength, min, max })` — fixed/fill/fit/stretch + clamp + 4-dec normalization.
- `ConstraintResolver.ts`: `resolveConstraintRect({ constraints, intrinsic, parentRect })` → `LayoutRect`. X-pins (`left > centerX > right > 0`), Y-pins (`top > centerY > bottom > 0`), aspect rule, clamp.

### Phase 4 — Auto Layout
- `AutoLayoutEngine.ts`: `layoutChildren({ containerRect, style, children })` → `ResolvedChildRect[]`.
  - content box (padding), main-axis fill pool, wrap (horizontal/vertical), distribution shift, alignment, 4-dec normalize.

### Phase 5 — Layout Tree
- `LayoutTree.ts`: `measureSubtreeIntrinsic(node, bp)` + `resolveLayout(document, viewportWidthPx)` → `LayoutResolution`.

### Phase 6 — S28 Integration
- `ResponsiveLayoutAdapter.ts`: `resolveBreakpointForViewport(viewportWidthPx)`, `buildEffectiveNodeLayout(node, breakpointId)` ⇒ `{ style, constraints, intrinsic, excluded }`.

### Phase 7 — Commands
- `LayoutCommands.ts`: `SetLayoutStyleCommand`, `SetLayoutConstraintCommand`, `RemoveLayoutConstraintCommand` (S28 command pattern).

### Phase 8/9 — Tests (8 suites)
1. `LayoutModel.test.ts`
2. `ConstraintResolver.test.ts`
3. `AutoLayoutEngine.test.ts`
4. `LayoutSizing.test.ts`
5. `LayoutTree.test.ts`
6. `ResponsiveLayoutIntegration.test.ts`
7. `LayoutCommandsHistory.test.ts`
8. `LayoutE2EWorkflow.test.ts` (Golden E2E — real `BuilderDocument`)

### Phase 10 — Execution gates
```
npx tsc --noEmit
npx vitest run packages/authoring-studio/src/layout/__tests__
npm run build
npx vitest run packages/authoring-studio/src/layout/__tests__/LayoutE2EWorkflow.test.ts
```

### Phase 11 — Evidence (self-audit)
- SSOT, duplicate engines, domain boundary, determinism, freeze, test quality, API cross-check, public barrel audit.

---

## 4. Golden E2E lifecycle (real production API)

```
Create BuilderDocument (factories)
  → container section (layoutStyle) + 3 child sections (constraints)
  → SetLayoutStyleCommand → history.push
  → SetLayoutConstraintCommand → history.push
  → SetBreakpointOverrideCommand (S28, gap/flexDirection) → history.push
  → resolveLayout(doc, DESKTOP)  → verify rects
  → resolveLayout(doc, MOBILE)   → verify rects changed by overrides
  → history.undo() ×2 → verify layouts revert
  → history.redo() ×2 → verify layouts reapply
  → SSOT integrity: doc.id, version monotonic, isDirty, sections count, layout data stored on node
```

---

## 5. Definition of Done checklist

- [ ] `layout/**` implemented with real imports only
- [ ] 8 test suites + golden E2E, no false greens
- [ ] `npx tsc --noEmit`: 0 S29-specific errors (pre-existing attributed separately)
- [ ] vitest: 100% PASS
- [ ] `npm run build`: exit 0 (actual)
- [ ] Domain boundary grep clean (React/window/document/rAF/etc.)
- [ ] Freeze: S1–S28 untouched (except authorized `src/index.ts`)
- [ ] Barrel audit: no phantom/duplicate exports