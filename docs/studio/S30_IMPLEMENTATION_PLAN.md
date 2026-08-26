# S30 Implementation Plan — Layout Inspector UX

> **Status:** PROPOSED — WAITING FOR ARCHITECT APPROVAL (no implementation executed)
> **Order:** Architecture → Plan → Approval (Architect) → Implementation
> **Scope (authorized files only):**
> - `packages/authoring-studio/src/layout-inspector/**` (new)
> - `packages/authoring-studio/src/index.ts` (single authorized barrel line)
> - `docs/studio/S30_*`

---

## 1. Real APIs to reuse (API cross-check targets — verified in FAZA 0 by re-reading sources)

| API | Real source | Signature / evidence |
|---|---|---|
| `BuilderDocument`, `SectionNode`, `createBuilderDocument`, `createBuilderPage`, `createSectionNode`, `touchDocument` | `packages/builder-core/src/BuilderDocument.ts` | verified (used by S29 E2E) |
| `createHistoryStack<T>`, `HistoryStack<T>` | `packages/builder-core/src/HistoryStack.ts` | `push(state,label)`, `undo()`, `redo()`, `peek()`, `clear()` verified |
| `LayoutStyle`, `createLayoutStyle`, `DEFAULT_LAYOUT_STYLE`, `LayoutMode`, `LayoutDirection`, `Alignment`, `Distribution`, `SizingMode` | `packages/authoring-studio/src/layout/LayoutModel.ts` | verified |
| `LayoutConstraints`, `LayoutSizing`, `createLayoutConstraints`, `DEFAULT_LAYOUT_CONSTRAINTS` | `packages/authoring-studio/src/layout/ConstraintModel.ts` | verified |
| `readLayoutStyle`, `readLayoutConstraints` | `packages/authoring-studio/src/layout/LayoutCommands.ts` | verified |
| `SetLayoutStyleCommand(nodeId, stylePartial)` | idem | verified |
| `SetLayoutConstraintCommand(nodeId, constraintPartial)` | idem | verified |
| `RemoveLayoutConstraintCommand(nodeId, key)` | idem | verified |
| `LayoutCommand`, `LayoutConstraintKey` | idem | verified |
| `resolveBreakpointForViewport`, `buildEffectiveNodeLayout(node, breakpointId)` | `packages/authoring-studio/src/layout/ResponsiveLayoutAdapter.ts` | returns `{style, constraints, intrinsic, excluded}` verified |
| `BreakpointId`, `DEFAULT_FALLBACK_ORDER` | `packages/authoring-studio/src/responsive/ResponsiveValueModel.ts` | verified |
| `NodePropertyOverride`, `getNodeResponsiveOverrides`, `resolveEffectiveNodeProperty`, `updateNodeInDocument`, `setNodeResponsiveOverride`, `removeNodeResponsiveOverride` | `packages/authoring-studio/src/responsive/ResponsiveOverrideEngine.ts` | verified |
| `SetBreakpointOverrideCommand(nodeId, breakpointId, overridePartial)` | `packages/authoring-studio/src/responsive/ResponsiveCommands.ts` | verified (used in S29 E2E) |
| `BreakpointRegistry` | `packages/authoring-studio/src/responsive/BreakpointRegistry.ts` | verified |
| `PropertyFieldDefinition`, `WidgetType`, `PanelCategory`, `Validate`/`ValidationFn` | `packages/authoring-studio/src/inspector/registry/types.ts` | verified |
| `PropertyRegistry` | `packages/authoring-studio/src/inspector/registry/PropertyRegistry.ts` | verified (`createPropertyFieldRegistry()` returns it) |
| `LayoutPanel` (schema-driven, reads `panelTypes.PanelProps`) | `packages/authoring-studio/src/inspector/panels/LayoutPanel.tsx` | NOT modified; consumer only |

No new dependencies. Every import listed above was confirmed by reading the actual source during FAZA 0.

---

## 2. Storage contract (inside existing SSOT — no duplicate models)

Keyed under existing `SectionNode.props` (identical to S29 contract):
- `props.layoutStyle` → `LayoutStyle` (S29)
- `props.layoutConstraints` → `LayoutConstraints` (S29)
- `props.responsiveOverrides` → S28 (unchanged)

Mutation path: S29 `setLayoutStyle/setLayoutConstraint/removeLayoutConstraint` return new `SectionNode`; S28 `updateNodeInDocument(doc, node)` replaces the node and calls `touchDocument`. S30 writes only through these.

---

## 3. Implementation phases

### Phase 2 — Field Catalog (`LayoutFieldCatalog.ts`)
- Build `LAYOUT_FIELD_DEFINITIONS: PropertyFieldDefinition[]` for all rows in S30_ARCHITECTURE §5 (`category: 'layout'`), using real `WidgetType` values and real DTO keys.
- Define `FIELD_ROUTE` table per §7 with `breakpointKey` restricted to the real S28 `NodePropertyOverride` layout keys (`gap`, `padding`, `flexDirection`, `width`, `height`, `x`, `y`).
- Every field must carry `validation` (numeric bounds / select / boolean guard).

### Phase 3 — Read Model (`LayoutInspectorModel.ts`)
- `findLayoutNode(doc, nodeId)` — recursive search over `doc.pages[].sections[]` (S29 semantics).
- `readLayoutInspectorState(doc, nodeId, breakpointId)` → `{ style, constraints, effective, fieldValues }` using `readLayoutStyle`, `readLayoutConstraints`, `buildEffectiveNodeLayout`.

### Phase 4 — Route (`LayoutFieldRouter.ts`)
- `routeFieldChange(fieldId)` → `{ kind, key, responsive?, breakpointKey? }` pure lookup (no switch on arbitrary strings).

### Phase 5 — Commands (`LayoutInspectorCommands.ts`)
- `applyLayoutStyleField / applyLayoutConstraintField / applySizingField / applyResponsiveLayoutField` — each instantiates the REAL S29/S28 command and returns `{ doc, command }` (never re-implements execution/undo).

### Phase 6 — Controller (`LayoutInspectorController.ts`)
- `getLayoutFieldDefinitions()`, `readLayoutInspectorState`, `applyFieldChange`, `undo`, `redo`, `registerLayoutFields(registry)`.
- `applyFieldChange` validates first; on failure returns inputs unchanged.

### Phase 7 — Barrel
- `layout-inspector/index.ts` exporting only real named symbols.
- Append `export * from './layout-inspector';` to `packages/authoring-studio/src/index.ts`.

### Phase 8 — Tests (6 suites)
1. `LayoutFieldCatalog.test.ts` — every §5 field present, correct widget/category/responsive flags; no phantom exports.
2. `LayoutInspectorModel.test.ts` — reads undefined DTOs vs populated; effective values through real S28 cascade.
3. `LayoutFieldRouter.test.ts` — routing table matches §5/§7 (style/constraint/sizing + responsive mapping).
4. `LayoutInspectorCommands.test.ts` — delegation: each wrapper returns `{doc, command}` from the real commands and mutates SSOT correctly.
5. `LayoutInspectorController.test.ts` — `applyFieldChange` + `history.push`, validation rejection, `undo`/`redo` passthrough, `registerLayoutFields` into real `createPropertyFieldRegistry()`.
6. `LayoutInspectorE2EWorkflow.test.ts` — Golden E2E (real production APIs only, see §4).

### Phase 9 — Execution gates
```
npx tsc --noEmit
npx vitest run packages/authoring-studio/src/layout-inspector/__tests__
npm run build
npx vitest run packages/authoring-studio/src/layout-inspector/__tests__/LayoutInspectorE2EWorkflow.test.ts
```

### Phase 10 — Evidence (self-audit)
- SSOT, duplicate engines, domain boundary grep, determinism, freeze check, test quality, API cross-check, public barrel audit.

---

## 4. Golden E2E lifecycle (real production API)

```
Create BuilderDocument (factories): container (layoutStyle) + 3 child cards
  -> registerLayoutFields(createPropertyFieldRegistry())
       assert getFieldsByCategory('layout') length >= expected S30 field count
  -> readLayoutInspectorState(doc, 'card-row', 'desktop')
       assert effective.style defaults (gap 0, direction vertical) & constraints.sizing
  -> applyFieldChange({ doc, history, 'card-row', 'layout.direction', 'horizontal', 'desktop' })
       -> history.push(doc, command.name)
       -> resolveLayout(doc, 1440) children x == [0, 110, 220]
  -> applyFieldChange({ ... 'layout.gap', 10, 'desktop' }) -> resolveLayout(doc,1440) same
  -> applyFieldChange({ ... 'layout.gap', 4, 'mobile' })
       -> routed to real SetBreakpointOverrideCommand('card-row','mobile',{gap:4})
       -> resolveLayout(doc, 390) children x == [0, 104, 208]
  -> applyFieldChange({ 'c1', 'layout.minWidth', 130, 'desktop' })
       -> resolveLayout(doc,1440) children x == [0, 140, 250]
  -> history.undo() x N -> layouts revert to [0,110,220]
  -> history.redo() x N -> layouts reapply to [0,140,250] / gap override restored
  -> validation: applyFieldChange gap -5 -> rejected, no doc mutation, no history entry
  -> SSOT integrity: doc.id preserved, single page, single section, version monotonic,
       layoutStyle stored on node.props when present, responsiveOverrides.mobile.gap == 4 when set
```

---

## 5. Definition of Done checklist

- [ ] `layout-inspector/**` implemented with real imports only (verified against §1 table)
- [ ] 6 test suites + Golden E2E, no false greens
- [ ] `npx tsc --noEmit`: 0 S30-specific errors (pre-existing attributed separately)
- [ ] vitest: 100% PASS
- [ ] `npm run build`: exit 0 (actual)
- [ ] Domain boundary grep clean (React/window/document/rAF/PlaybackController/RuntimeScheduler/RuntimeBridge)
- [ ] Freeze: S1–S29 untouched (except authorized barrel line in `src/index.ts`)
- [ ] Barrel audit: no phantom/duplicate exports

---

## 6. PASS / HOLD criteria (for Agent 2 audit)

**PASS only if ALL hold:**
1. `layout-inspector/` contains zero React/DOM/runtime imports and zero `requestAnimationFrame` (grep evidence).
2. Zero custom playback/time/scheduler/state-machine logic; every change delegates to real S29/S28 commands + caller-provided `createHistoryStack` (bridge-delegation rule / DECISION-042).
3. No `PlaybackController`, `RuntimeScheduler`, `RuntimeBridge`, or Browser-Adapter import anywhere in the new module (Editor vs Runtime Separation / DECISION-043/045).
4. SSOT: layout data storage keys unchanged (`layoutStyle`, `layoutConstraints`, `responsiveOverrides`); no second document model introduced.
5. Freeze intact: `git diff` of S1–S29 paths empty except the single authorized barrel line.
6. All 6 suites green on real Vitest, Golden E2E uses real production APIs (no mocks replacing logic).

Any violation ⇒ **HOLD** with a focused delta audit scoped to the exact Finding IDs.

---

## 7. Authorized file list (create / change)

**Create (new files):**
- `packages/authoring-studio/src/layout-inspector/LayoutFieldCatalog.ts`
- `packages/authoring-studio/src/layout-inspector/LayoutInspectorModel.ts`
- `packages/authoring-studio/src/layout-inspector/LayoutFieldRouter.ts`
- `packages/authoring-studio/src/layout-inspector/LayoutInspectorCommands.ts`
- `packages/authoring-studio/src/layout-inspector/LayoutInspectorController.ts`
- `packages/authoring-studio/src/layout-inspector/index.ts`
- `packages/authoring-studio/src/layout-inspector/__tests__/LayoutFieldCatalog.test.ts`
- `packages/authoring-studio/src/layout-inspector/__tests__/LayoutInspectorModel.test.ts`
- `packages/authoring-studio/src/layout-inspector/__tests__/LayoutFieldRouter.test.ts`
- `packages/authoring-studio/src/layout-inspector/__tests__/LayoutInspectorCommands.test.ts`
- `packages/authoring-studio/src/layout-inspector/__tests__/LayoutInspectorController.test.ts`
- `packages/authoring-studio/src/layout-inspector/__tests__/LayoutInspectorE2EWorkflow.test.ts`

**Change (single authorized edit):**
- `packages/authoring-studio/src/index.ts` — append `export * from './layout-inspector';`

**Forbidden changes (freeze):**
- Any file under `packages/authoring-studio/src/layout/`, `packages/authoring-studio/src/responsive/`, `packages/authoring-studio/src/inspector/`, `packages/builder-core/`, any other S1–S29 source/test/doc.
- No `package.json` dependency additions, no config changes (vitest/tsconfig/eslint/next).