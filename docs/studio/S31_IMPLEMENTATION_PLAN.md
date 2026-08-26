# S31 Implementation Plan — Live Preview & Responsive Viewport Canvas UX

> **Status:** PROPOSED — WAITING FOR ARCHITECT APPROVAL (no implementation executed)  
> **Order:** Architecture → Plan → Approval (Architect) → Implementation  
> **Scope (authorized files only):**  
> - `packages/authoring-studio/src/viewport-preview/**` (new)  
> - `packages/authoring-studio/src/index.ts` (single authorized barrel line)  
> - `docs/studio/S31_*`

---

## 1. Real APIs to Reuse (API Cross-Check Targets)

| API | Real Source | Role in S31 |
|---|---|---|
| `BuilderDocument`, `SectionNode`, `createBuilderDocument`, `createBuilderPage`, `createSectionNode`, `touchDocument` | `packages/builder-core/src/BuilderDocument.ts` | SSOT Document model & node tree |
| `createHistoryStack<T>`, `HistoryStack<T>` | `packages/builder-core/src/HistoryStack.ts` | Undo/Redo history stack |
| `BreakpointId`, `BreakpointRegistry`, `BUILTIN_BREAKPOINTS` | `packages/authoring-studio/src/responsive/` | Breakpoint registry & viewport width resolution |
| `resolveLayout`, `ResolvedLayoutNode`, `ResolvedLayoutTree` | `packages/authoring-studio/src/layout/LayoutTree.ts` | Layout engine resolution per viewport width |
| `LayoutStyle`, `LayoutConstraints`, `LayoutRect` | `packages/authoring-studio/src/layout/LayoutModel.ts` | Layout DTOs & geometry rects |
| `readLayoutInspectorState`, `applyFieldChange`, `registerLayoutFields` | `packages/authoring-studio/src/layout-inspector/LayoutInspectorController.ts` | S30 Layout Inspector read & edit API |
| `Camera`, `CameraViewport`, `createCamera`, `createCameraViewport` | `packages/authoring-studio/src/camera/CameraModel.ts` | S21 Camera DTOs & state |
| `createViewportConfiguration`, `ViewportConfiguration` | `packages/authoring-studio/src/camera/ViewportModel.ts` | S21 Viewport Configuration |
| `SelectionState`, `DEFAULT_SELECTION_STATE`, `createSelectionState` | `packages/authoring-studio/src/selection/SelectionModel.ts` | S22 Selection DTOs |
| `SelectionManager` | `packages/authoring-studio/src/selection/SelectionManager.ts` | S22 Selection state operations |
| `createPropertyFieldRegistry` | `packages/authoring-studio/src/inspector/registry/PropertyRegistry.ts` | Inspector field registry |

Zero new dependencies. Every import listed above has been verified in the codebase.

---

## 2. Storage Contract & SSOT Integrity

- Layout configuration remains in `SectionNode.props.layoutStyle` and `SectionNode.props.layoutConstraints` (S29).
- Responsive overrides remain in `SectionNode.props.responsiveOverrides` (S28).
- `BuilderDocument` remains the sole SSOT.
- S31 creates NO secondary document stores, NO secondary layout trees, and NO secondary history stacks.

---

## 3. Implementation Phases

### Phase 1 — Discovery & Architecture Verification (COMPLETE)
- Re-read source code for S21 Camera, S22 Selection, S28 Responsive, S29 Layout, S30 Layout Inspector.

### Phase 2 — Viewport Preview Model (`ViewportPreviewModel.ts`)
- DTOs: `ViewportPreviewState`, `CanvasRenderableNode`.
- Pure factory functions: `createViewportPreviewState`, `calculateFitScale`, `calculateEffectiveScale`.

### Phase 3 — Viewport Preview Controller (`ViewportPreviewController.ts`)
- Pure operations: `switchBreakpoint`, `updateContainerBounds`, `setZoomLevel`, `zoomIn`, `zoomOut`, `fitToContainer`, `panBy`, `resetPanZoom`.
- Syncs S21 `Camera` and `ViewportConfiguration`.

### Phase 4 — Viewport Canvas Adapter (`ViewportCanvasAdapter.ts`)
- `adaptLayoutToCanvas(resolvedTree, previewState, selectionState)` → `CanvasRenderableNode[]`.
- Computes `viewportRect` scaled by `effectiveScale` and offset by `panPosition`.

### Phase 5 — Viewport Selection Model (`ViewportSelectionModel.ts`)
- Manages `hoveredNodeId`, integrates with S22 `SelectionState` (`selectSingle`, `toggleSelect`, `clearSelection`).
- Calculates highlight bounding boxes.

### Phase 6 — Viewport Interaction Controller (`ViewportInteractionController.ts`)
- Unified orchestrator: handles breakpoint switching, zoom/pan, canvas selection, and bidirectional synchronization with S30 Layout Inspector (`readLayoutInspectorState` + `applyFieldChange`).

### Phase 7 — Barrel & Integration (`index.ts`)
- Export named symbols in `viewport-preview/index.ts`.
- Append `export * from './viewport-preview/index';` to `packages/authoring-studio/src/index.ts`.

### Phase 8 — Test Suites (6 Suites)
1. `ViewportPreviewModel.test.ts`
2. `ViewportPreviewController.test.ts`
3. `ViewportCanvasAdapter.test.ts`
4. `ViewportSelectionModel.test.ts`
5. `ViewportInteractionController.test.ts`
6. `ViewportPreviewE2EWorkflow.test.ts` (Golden E2E)

---

## 4. Golden E2E Workflow Trace

```
1. Create BuilderDocument (factories): container + 3 child cards
2. Initialize ViewportInteractionController & S22 SelectionState & S30 Inspector
3. Resolve initial desktop live preview (width 1440px) -> verify canvas renderable nodes
4. Select 'c1' on canvas -> verify S22 selection state primarySelectedId == 'c1'
5. Read S30 Layout Inspector state for 'c1' -> verify fieldValues & effective layout
6. Apply Inspector field edit (layout.gap = 12) via S30 applyFieldChange + history.push
7. Verify S31 preview auto-refreshes -> desktop cards layout updated (x == [0, 112, 224])
8. Switch active breakpoint to 'mobile' (width 375px)
9. Apply mobile responsive override (layout.gap = 4) via S30 applyFieldChange + history.push
10. Verify S31 mobile preview layout updated -> cards x == [0, 104, 208]
11. Switch active breakpoint back to 'desktop' -> verify desktop gap == 12 preserved
12. Undo via HistoryStack -> mobile gap & desktop gap reverted
13. Redo via HistoryStack -> mobile gap & desktop gap restored
14. SSOT integrity check -> pristine versioning, isDirty flag, document id preserved.
```

---

## 5. Definition of Done Checklist

- [ ] All authorized files created in `packages/authoring-studio/src/viewport-preview/`
- [ ] 6 test suites including Golden E2E workflow implemented and passing
- [ ] `npx tsc --noEmit`: 0 S31-specific errors
- [ ] vitest: 100% PASS
- [ ] `npm run build`: exit code 0
- [ ] Domain boundary clean (React/window/document/rAF/PlaybackController/RuntimeScheduler/WebGL)
- [ ] Freeze intact: S1–S30 untouched except single authorized barrel line

---

## 6. Authorized File List

**Create:**
- `packages/authoring-studio/src/viewport-preview/ViewportPreviewModel.ts`
- `packages/authoring-studio/src/viewport-preview/ViewportPreviewController.ts`
- `packages/authoring-studio/src/viewport-preview/ViewportCanvasAdapter.ts`
- `packages/authoring-studio/src/viewport-preview/ViewportSelectionModel.ts`
- `packages/authoring-studio/src/viewport-preview/ViewportInteractionController.ts`
- `packages/authoring-studio/src/viewport-preview/index.ts`
- `packages/authoring-studio/src/viewport-preview/__tests__/ViewportPreviewModel.test.ts`
- `packages/authoring-studio/src/viewport-preview/__tests__/ViewportPreviewController.test.ts`
- `packages/authoring-studio/src/viewport-preview/__tests__/ViewportCanvasAdapter.test.ts`
- `packages/authoring-studio/src/viewport-preview/__tests__/ViewportSelectionModel.test.ts`
- `packages/authoring-studio/src/viewport-preview/__tests__/ViewportInteractionController.test.ts`
- `packages/authoring-studio/src/viewport-preview/__tests__/ViewportPreviewE2EWorkflow.test.ts`

**Change:**
- `packages/authoring-studio/src/index.ts` — append `export * from './viewport-preview/index';`
