# S32 Implementation Plan — Component Systems, Presets & Slot Composition

> **Status:** PROPOSED — WAITING FOR ARCHITECT APPROVAL (no implementation executed)  
> **Order:** Architecture → Plan → Approval (Architect) → Implementation  
> **Scope (authorized files only):**  
> - `packages/authoring-studio/src/components/**` (new)  
> - `packages/authoring-studio/src/index.ts` (single authorized barrel line)  
> - `docs/studio/S32_*`

---

## 1. Real APIs to Reuse (API Cross-Check Targets)

| API | Real Source | Role in S32 |
|---|---|---|
| `BuilderDocument`, `SectionNode`, `createBuilderDocument`, `createBuilderPage`, `createSectionNode`, `touchDocument` | `packages/builder-core/src/BuilderDocument.ts` | SSOT Document model & node tree |
| `createHistoryStack<T>`, `HistoryStack<T>` | `packages/builder-core/src/HistoryStack.ts` | Undo/Redo history stack |
| `updateNodeInDocument` | `packages/authoring-studio/src/responsive/ResponsiveOverrideEngine.ts` | Immutable node document update with touchDocument |
| `LayoutStyle`, `createLayoutStyle`, `DEFAULT_LAYOUT_STYLE` | `packages/authoring-studio/src/layout/LayoutModel.ts` | Layout DTOs |
| `LayoutConstraints`, `createLayoutConstraints` | `packages/authoring-studio/src/layout/ConstraintModel.ts` | Layout constraints DTOs |
| `SetLayoutStyleCommand`, `SetLayoutConstraintCommand` | `packages/authoring-studio/src/layout/LayoutCommands.ts` | S29 commands |
| `SetBreakpointOverrideCommand` | `packages/authoring-studio/src/responsive/ResponsiveCommands.ts` | S28 responsive commands |
| `readLayoutInspectorState`, `applyFieldChange` | `packages/authoring-studio/src/layout-inspector/LayoutInspectorController.ts` | S30 Inspector integration |
| `resolveLayout` | `packages/authoring-studio/src/layout/LayoutTree.ts` | S29 Layout Engine |
| `createViewportPreviewContext`, `editLayoutFieldAndRefresh` | `packages/authoring-studio/src/viewport-preview/ViewportInteractionController.ts` | S31 Live Preview integration |

Zero new dependencies. Every import listed above has been verified in the codebase.

---

## 2. Storage Contract & SSOT Integrity

- Preset IDs stored in `SectionNode.props.componentId`.
- Active variant stored in `SectionNode.props.variant`.
- Slot names stored in `SectionNode.props.slotName` on child slot nodes.
- Layout configuration remains in `SectionNode.props.layoutStyle` and `SectionNode.props.layoutConstraints` (S29).
- Responsive overrides remain in `SectionNode.props.responsiveOverrides` (S28).
- `BuilderDocument` remains the sole SSOT.

---

## 3. Implementation Phases

### Phase 1 — Discovery & Architecture Verification (COMPLETE)
- Re-read source code for `builder-core`, S28 Responsive, S29 Layout, S30 Layout Inspector, S31 Live Preview.

### Phase 2 — Component Preset Model (`ComponentPresetModel.ts`)
- DTOs: `ComponentVariant`, `ComponentSlotDefinition`, `ComponentPreset`.
- Factory function: `createComponentPreset`.

### Phase 3 — Component Preset Registry (`ComponentPresetRegistry.ts`)
- Catalog of builtin component presets (Hero Card, Feature Grid, Navbar, CallToAction, Testimonial).
- Methods: `getPreset(id)`, `getAllPresets()`, `registerPreset(preset)`.

### Phase 4 — Component Variant Engine (`ComponentVariantEngine.ts`)
- `resolveEffectiveComponentProps(node, registry)`: Merges defaultProps, variant overrides, node props, and responsive overrides.

### Phase 5 — Component Slot Composition (`ComponentSlotComposition.ts`)
- `validateSlotChildInsertion(parent, slotName, childType)`: Validates allowed types & max children limits.
- `validateSlotChildRemoval(parent, slotName)`: Validates min children limits.

### Phase 6 — Component Commands (`ComponentCommands.ts`)
- `ApplyComponentPresetCommand`, `SetComponentVariantCommand`, `InsertSlotNodeCommand`, `RemoveSlotNodeCommand`.
- Execute immutably via `updateNodeInDocument`.

### Phase 7 — Component Controller (`ComponentController.ts`)
- Unified orchestrator: `applyComponentPreset`, `switchComponentVariant`, `insertChildIntoSlot`, `removeChildFromSlot`.

### Phase 8 — Barrel & Integration (`index.ts`)
- Export named symbols in `components/index.ts`.
- Append `export * from './components/index';` to `packages/authoring-studio/src/index.ts`.

### Phase 9 — Test Suites (7 Suites)
1. `ComponentPresetModel.test.ts`
2. `ComponentPresetRegistry.test.ts`
3. `ComponentVariantEngine.test.ts`
4. `ComponentSlotComposition.test.ts`
5. `ComponentCommands.test.ts`
6. `ComponentController.test.ts`
7. `ComponentE2EWorkflow.test.ts` (Golden E2E)

---

## 4. Golden E2E Workflow Trace

```
1. Create BuilderDocument (factories)
2. Instantiate ComponentPresetRegistry with builtin presets (Hero Card, Feature Grid, CallToAction)
3. Apply 'hero-card' preset onto root section node via ApplyComponentPresetCommand + HistoryStack.push
4. Verify node props contains componentId = 'hero-card', default variant = 'primary', default layoutStyle & responsiveOverrides
5. Switch variant to 'compact' via SetComponentVariantCommand + HistoryStack.push -> verify variant property overrides merged
6. Insert child button node into 'action-slot' via InsertSlotNodeCommand + HistoryStack.push -> verify slot validation PASS
7. Attempt invalid child insertion into 'action-slot' (exceeding maxChildren) -> verify insertion REJECTED
8. Resolve live layout via S29 resolveLayout -> verify scaled coordinates in S31 live preview
9. Edit layout field via S30 Inspector -> verify BuilderDocument version incremented & S31 live preview auto-refreshed
10. Perform HistoryStack undo steps -> variant & slot node insertions reverted
11. Perform HistoryStack redo steps -> variant & slot node insertions restored
12. SSOT integrity check -> pristine versioning, isDirty flag, document id preserved.
```

---

## 5. Definition of Done Checklist

- [ ] All authorized files created in `packages/authoring-studio/src/components/`
- [ ] 7 test suites including Golden E2E workflow implemented and passing
- [ ] `npx tsc --noEmit`: 0 S32-specific errors
- [ ] vitest: 100% PASS
- [ ] `npm run build`: exit code 0
- [ ] Domain boundary clean (React/window/document/rAF/PlaybackController/RuntimeScheduler/WebGL)
- [ ] Freeze intact: S1–S31 untouched except single authorized barrel line

---

## 6. Authorized File List

**Create:**
- `packages/authoring-studio/src/components/ComponentPresetModel.ts`
- `packages/authoring-studio/src/components/ComponentPresetRegistry.ts`
- `packages/authoring-studio/src/components/ComponentVariantEngine.ts`
- `packages/authoring-studio/src/components/ComponentSlotComposition.ts`
- `packages/authoring-studio/src/components/ComponentCommands.ts`
- `packages/authoring-studio/src/components/ComponentController.ts`
- `packages/authoring-studio/src/components/index.ts`
- `packages/authoring-studio/src/components/__tests__/ComponentPresetModel.test.ts`
- `packages/authoring-studio/src/components/__tests__/ComponentPresetRegistry.test.ts`
- `packages/authoring-studio/src/components/__tests__/ComponentVariantEngine.test.ts`
- `packages/authoring-studio/src/components/__tests__/ComponentSlotComposition.test.ts`
- `packages/authoring-studio/src/components/__tests__/ComponentCommands.test.ts`
- `packages/authoring-studio/src/components/__tests__/ComponentController.test.ts`
- `packages/authoring-studio/src/components/__tests__/ComponentE2EWorkflow.test.ts`

**Change:**
- `packages/authoring-studio/src/index.ts` — append `export * from './components/index';`
