# S30 Architecture Specification — Layout Inspector UX

> **Subsystem:** Authoring Studio — Layout Constraints & Auto Layout Inspector UX (Sprint S30)
> **Author:** Agent 1 — Senior Architect & Planning Agent
> **Status:** PROPOSED — WAITING FOR ARCHITECT APPROVAL (no implementation executed)
> **Dependencies:** `builder-core` (`BuilderDocument`, `HistoryStack`), Sprint S28 Responsive Subsystem (`../responsive`), Sprint S29 Layout Subsystem (`../layout`), Sprint 7.1 Inspector Contracts (`../inspector/registry/types`, `../inspector/registry/PropertyRegistry`, `../inspector/panels`)

---

## 1. Executive Summary & Objective

Sprint S30 delivers the **headless Inspector UX domain layer** on top of the frozen S28/S29 layout foundation, exactly as reserved in `S29_ARCHITECTURE.md`:

> "S30 may then add Inspector UX, and S31 a Preview, **without rebuilding the layout foundation**." — `docs/studio/S29_ARCHITECTURE.md:22`

S30 answers the single question:

> "How does the Inspector read, map, and edit S28/S29 layout data — through real, existing APIs?"

S30 **is not** a new editor, renderer, preview, or runtime. It introduces **zero** duplicate engines, **zero** second document models, **zero** new history stacks, and **zero** React/DOM in its domain modules. It is a pure, headless, deterministic layer that:

1. **Derives field catalog** — maps the real S29 `LayoutStyle` / `LayoutConstraints` / `LayoutSizing` DTO keys onto the existing Inspector 2.0 `PropertyFieldDefinition[]` contract (`category: 'layout'`), using real `WidgetType` / `PanelCategory` types.
2. **Reads data** — reads layout state of a node at a breakpoint from the SSOT `BuilderDocument` through the real S29 readers (`readLayoutStyle`, `readLayoutConstraints`) and the real S28 responsive pipeline (`buildEffectiveNodeLayout`, `resolveEffectiveNodeProperty`).
3. **Edits data only** — applies field changes by delegating to real S29 commands (`SetLayoutStyleCommand`, `SetLayoutConstraintCommand`, `RemoveLayoutConstraintCommand`) and real S28 commands (`SetBreakpointOverrideCommand`), pushed onto the caller-provided `createHistoryStack<BuilderDocument>`.
4. **Feeds the existing Inspector registry** — `registerLayoutFields(registry)` injects the S30 catalog into an existing `PropertyRegistry` instance so the already-existing schema-driven `LayoutPanel`/`InspectorPanelFields` can render S29 data. No frozen file is mutated.

Per **DECISION-043 / DECISION-045**: Inspector edits configuration data only; it never invokes `PlaybackController` or any runtime execution. S30 complies: every change produces a new `BuilderDocument`; nothing plays, nothing schedules, nothing steps time.

### Why S30 exists

- S28 answers: "how do property values change across devices".
- S29 answers: "how do elements physically arrange given those values".
- S30 answers: "how does the Inspector surface and edit those values per breakpoint".
- S31 (future) will add the Preview, separately, on top of this same foundation.

---

## 2. Architecture Flow

```
             BuilderDocument (SSOT — node.props)
                     |
        +------------+-------------------------+
        |            |                         |
        v            v                         v
   S29 readers   S29 DTOs                 S28 responsive
 readLayoutStyle  LayoutStyle            buildEffectiveNodeLayout
 readLayoutConstraints LayoutConstraints resolveEffectiveNodeProperty
        +------------+-------------------------+
                     |
                     v
        +------------------------------+
        |  S30 layout-inspector (headless) |
        |  LayoutFieldCatalog   --> PropertyFieldDefinition[] (category 'layout')
        |  LayoutInspectorModel --> fieldValues + effective {style, constraints, excluded}
        |  LayoutFieldRouter    --> fieldId -> {kind: style|constraint|sizing|responsive, key}
        |  LayoutInspectorCommands --> S29/S28 command classes
        |  LayoutInspectorController --> applyFieldChange + history push/undo/redo
        |  registerLayoutFields(registry) --> existing PropertyRegistry
        +--------------+-----------------------+
                       |
                       v
   Existing Inspector UI (LayoutPanel.tsx, InspectorPanelFields.tsx) — NOT modified
   renders registry fields + values, calls back onChange(fieldId, value)
                       |
                       v
   controller.applyFieldChange({ doc, history, nodeId, fieldId, value, breakpointId })
                       |
                       v
   new BuilderDocument via S29/S28 command + history.push(label)   [SSOT preserved]
```

---

## 3. Governance & Architectural Rules

- **SSOT (DECISION-044 lineage):** `BuilderDocument` is the single source of truth. Layout data stays in existing node `props`:
  - `node.props.layoutStyle` → `LayoutStyle` (S29)
  - `node.props.layoutConstraints` → `LayoutConstraints` (S29)
  - `node.props.responsiveOverrides` → S28 breakpoint overrides (unchanged)
  
  Zero second documents: no `LayoutInspectorDocument`, no duplicate model. S30 only reads/writes through S29/S28 APIs.
- **No duplicate engines (DECISION-042 lineage):** 0 renderers, 0 cameras, 0 schedulers, 0 history stacks created by S30. History is always the caller-provided `createHistoryStack<BuilderDocument>`.
- **Inspector edits data only (DECISION-043, DECISION-045):** S30 never invokes `PlaybackController`, `RuntimeScheduler`, `RuntimeBridge`, browser adapters, or `requestAnimationFrame`. No custom playback/time/scheduler logic anywhere.
- **Pure domain:** `packages/authoring-studio/src/layout-inspector/` imports ONLY: `../../../builder-core/src/*` (BuilderDocument, SectionNode, HistoryStack utils used by S29), `../layout` (S29), `../responsive` (S28), `../inspector/registry/types` and `../inspector/registry/PropertyRegistry` (contracts). ZERO `React`, `window`, `document`, `requestAnimationFrame`, DOM/Canvas, WebGL/WebGPU, `PlaybackController`, `RuntimeScheduler`, `RuntimeBridge`, browser adapter.
- **Determinism:** same `doc` + same `fieldId` + same `value` + same `breakpointId` ⇒ byte-identical result. No `Math.random()`, no `Date.now()` in any S30 math or routing.
- **Immutability:** every change returns a new `BuilderDocument` produced by the real S29/S28 commands; node replacement and dirty-tracking reuse S28's `updateNodeInDocument` (which delegates to `touchDocument`).
- **Freeze (S1–S29):** no existing source file is modified. The ONLY authorized edit to a pre-existing file is one appended barrel line in `packages/authoring-studio/src/index.ts` (see §12). All S29 files, S28 files, inspector files, configs, and tests remain byte-identical.

---

## 4. Module Decomposition

```
packages/authoring-studio/src/layout-inspector/
+-- LayoutFieldCatalog.ts        # Pure catalog: LayoutStyle/LayoutConstraints/LayoutSizing keys
|                                #   -> PropertyFieldDefinition[] (category 'layout'); plus
|                                #   FIELD_ROUTE registration for fieldId routing + responsive flags.
+-- LayoutInspectorModel.ts      # Read model: findLayoutNode, readLayoutInspectorState(doc, nodeId,
|                                #   breakpointId) -> { style, constraints, effective, fieldValues }
+-- LayoutFieldRouter.ts         # Pure router: fieldId -> { kind, key, responsive, breakpointKeys }
|                                #   deciding which S29/S28 write API owns a given field.
+-- LayoutInspectorCommands.ts   # applyLayoutStyleField, applyLayoutConstraintField (delegate to S29
|                                #   commands + S28 SetBreakpointOverrideCommand). Returns the real
|                                #   command instance for history.push(doc, cmd.name).
+-- LayoutInspectorController.ts # Orchestrator: getLayoutFieldDefinitions, readLayoutInspectorState,
|                                #   applyFieldChange (router + command + history.push), undo, redo,
|                                #   registerLayoutFields(registry).
+-- index.ts                     # Public barrel
+-- __tests__/
|     +-- LayoutFieldCatalog.test.ts
|     +-- LayoutInspectorModel.test.ts
|     +-- LayoutFieldRouter.test.ts
|     +-- LayoutInspectorCommands.test.ts
|     +-- LayoutInspectorController.test.ts
|     +-- LayoutInspectorE2EWorkflow.test.ts   # Golden E2E — real BuilderDocument + real S28/S29
```

---

## 5. Field Catalog Contract (LayoutFieldCatalog.ts)

Every editable layout property becomes a `PropertyFieldDefinition` (imported from `../inspector/registry/types`). Required fields per the Inspector 2.0 contract: `id, label, description, defaultValue, validation, widget, category`. Optional metadata: `options, min, max, step, unit, responsive`.

Field IDs and routes (REAL keys only — no invented data):

### 5.1 LayoutStyle fields → written to `node.props.layoutStyle` via S29 `SetLayoutStyleCommand`

| fieldId | DTO key | widget | responsive | notes |
|---|---|---|---|---|
| `layout.mode` | `mode` | `select` | no | options: auto, free |
| `layout.direction` | `direction` | `select` | no (layout DTO) | vertical/horizontal; S28 `flexDirection` responsive handled separately |
| `layout.gap` | `gap` | `number` | **yes** (S28 `gap`) | min 0, step 1, unit px |
| `layout.paddingTop` | `paddingTop` | `number` | **yes** (S28 `padding`) | uniform write: all four sides |
| `layout.paddingRight` | `paddingRight` | `number` | **yes** (S28 `padding`) | uniform write: all four sides |
| `layout.paddingBottom` | `paddingBottom` | `number` | **yes** (S28 `padding`) | uniform write: all four sides |
| `layout.paddingLeft` | `paddingLeft` | `number` | **yes** (S28 `padding`) | uniform write: all four sides |
| `layout.alignItems` | `alignItems` | `select` | no | start/center/end/stretch |
| `layout.justifyContent` | `justifyContent` | `select` | no | start/center/end/space-between/space-around/space-evenly |
| `layout.wrap` | `wrap` | `boolean` | no | |

### 5.2 LayoutConstraints fields → written to `node.props.layoutConstraints` via S29 `SetLayoutConstraintCommand`

| fieldId | DTO key | widget | responsive | notes |
|---|---|---|---|---|
| `layout.left` | `left` | `number` | **yes** (S28 `x`) | px |
| `layout.right` | `right` | `number` | no | px |
| `layout.top` | `top` | `number` | **yes** (S28 `y`) | px |
| `layout.bottom` | `bottom` | `number` | no | px |
| `layout.centerX` | `centerX` | `boolean` | no | |
| `layout.centerY` | `centerY` | `boolean` | no | |
| `layout.width` | `width` | `number` | **yes** (S28 `width`) | number or 'NN%' string |
| `layout.height` | `height` | `number` | **yes** (S28 `height`) | number or 'NN%' string |
| `layout.minWidth` | `minWidth` | `number` | no | px |
| `layout.maxWidth` | `maxWidth` | `number` | no | px |
| `layout.minHeight` | `minHeight` | `number` | no | px |
| `layout.maxHeight` | `maxHeight` | `number` | no | px |
| `layout.aspectRatio` | `aspectRatio` | `number` | no | width/height |
| `layout.sizingWidth` | `sizing.width` | `select` | no | fixed/fill/fit/stretch |
| `layout.sizingHeight` | `sizing.height` | `select` | no | fixed/fill/fit/stretch |

Responsive-capable fields are precisely the S28 `NodePropertyOverride` keys exposed for layout (`gap`, `padding`, `flexDirection`, `width`, `height`, `x`, `y`). Any other S29 property is static in the DTO (`min/max`, `aspectRatio`, `alignItems`, `justifyContent`, `wrap`, `distribution`, `sizing`) and is written into `layoutStyle`/`layoutConstraints` per §5 of S29_ARCHITECTURE. This preserves the documented S29 boundary verbatim.

---

## 6. Read Model (LayoutInspectorModel.ts)

```
readLayoutInspectorState(doc: BuilderDocument, nodeId: string, breakpointId: BreakpointId):
  | undefined   // when the node does not exist
  | {
      style: LayoutStyle | undefined            // node.props.layoutStyle
      constraints: LayoutConstraints | undefined // node.props.layoutConstraints
      effective: EffectiveNodeLayout            // buildEffectiveNodeLayout(node, breakpointId) [S29 §S28 adapter]
      fieldValues: Record<string, unknown>      // per §5 fieldId -> DTO value (base) for field widgets
    }
```

- Node lookup uses S29 semantics: search each `doc.pages[].sections[]` recursively by `id`.
- `effective` is computed with the REAL `buildEffectiveNodeLayout` (S29 `ResponsiveLayoutAdapter`), which internally uses `BreakpointRegistry` + `resolveEffectiveNodeProperty` — S30 never re-derives breakpoints.
- `fieldValues` presents the DTO-level value per fieldId so the existing widgets render current configuration; `effective` carries the resolved per-breakpoint view (for read-only display logic the UI may use later; S30 itself only exposes it).

No React, no DOM, no subscriptions. Read is a pure function of `(doc, nodeId, breakpointId)`.

---

## 7. Routing Contract (LayoutFieldRouter.ts)

Pure routing decision for a field edit:

```
routeFieldChange(fieldId): FieldRoute | undefined
FieldRoute = {
  kind: 'style' | 'constraint' | 'sizing',
  key: string,               // real DTO key
  responsive?: {
    breakpointKey: keyof NodePropertyOverride,  // real S28 key: gap|padding|flexDirection|width|height|x|y
    uniformSides?: true,                          // for padding: write all 4 sides from uniform value
  },
}
```

Apply rules (deterministic):

1. `responsive === undefined` → always S29 DTO write:
   - `kind === 'style'` → `new SetLayoutStyleCommand(nodeId, { [key]: value })`
   - `kind === 'constraint'` → `new SetLayoutConstraintCommand(nodeId, { [key]: value })`
   - `kind === 'sizing'` → `new SetLayoutConstraintCommand(nodeId, { sizing: { [key]: value } })`
2. `responsive && breakpointId === 'desktop'` (base) → S29 DTO write (base value lives in the DTO; S28 override layer stays untouched). The S29 `flexDirection` responsive case maps `column → vertical`, `row → horizontal` when writing to `layout.direction` at base.
3. `responsive && breakpointId !== 'desktop'` → S28 override write via the REAL `SetBreakpointOverrideCommand(nodeId, breakpointId, { [breakpointKey]: value })`. For `padding`, the S28 `padding` number is uniform and maps to all four sides through the effective pipeline.

Every apply returns `{ doc, command }` where `command` is the real S29/S28 command instance (its `.name` becomes the history label). No invented execution.

---

## 8. Commands (LayoutInspectorCommands.ts)

Thin, delegation-only wrappers (S30 itself implements no playback/time/undo logic):

```
applyLayoutStyleField(doc, nodeId, fieldId, value)
  -> { doc: BuilderDocument, command: LayoutCommand }
applyLayoutConstraintField(doc, nodeId, fieldId, value)
  -> { doc: BuilderDocument, command: LayoutCommand }
applySizingField(doc, nodeId, fieldId, value)
  -> { doc: BuilderDocument, command: LayoutCommand }
applyResponsiveLayoutField(doc, nodeId, fieldId, value, breakpointId)
  -> { doc: BuilderDocument, command: LayoutCommand }
```

Each:
- imports and instantiates ONLY the real commands listed in §5/§7,
- runs `command.execute(doc)` → returns the new document,
- the caller (Controller) calls `history.push(doc, command.name)`.

---

## 9. Controller (LayoutInspectorController.ts)

Pure orchestration API (no internal state machine; state lives in the caller-provided `doc` + `history`):

```
getLayoutFieldDefinitions(): PropertyFieldDefinition[]          // from catalog, category 'layout'
readLayoutInspectorState(doc, nodeId, breakpointId)             // §6
applyFieldChange({ doc, history, nodeId, fieldId, value, breakpointId })
  -> { doc: BuilderDocument, history: HistoryStack<BuilderDocument>, command }
undo(history, doc)    -> { history, doc } | null                // history.undo() passthrough + reapply
redo(history, doc)    -> { history, doc } | null                // history.redo() passthrough + reapply
registerLayoutFields(registry: PropertyRegistry): number        // registers catalog into injected registry
```

- `applyFieldChange` validates via the field's `validation` fn; a failed validation returns the input unchanged (no doc mutation, no push).
- Undo/redo are pass-throughs of the REAL `HistoryStack.push/undo/redo`; S30 never re-implements them.
- `registerLayoutFields` injects into an existing `PropertyRegistry` (created by the real `createPropertyFieldRegistry()`), so the already-existing `LayoutPanel`/`InspectorPanelFields` consume S29 fields with zero changes to those frozen files.

---

## 10. History Integration

Follows the S28/S29 command pattern exactly (no S30-owned history stack):

```
cmd = new SetLayoutStyleCommand(nodeId, partial)
doc = cmd.execute(doc)
history = history.push(doc, cmd.name)
```

Undo/redo walk the REAL `createHistoryStack<BuilderDocument>`; on `undo()/redo()` the caller passes the popped state back into `readLayoutInspectorState`, keeping the Inspector view consistent with SSOT.

---

## 11. Domain Boundary

`layout-inspector/` stays 100% pure domain TypeScript: no React, no DOM, no browser/runtime APIs, no RenderingEngine, no `timeline/`, no `preview/`, no `runtime` imports. It communicates with the UI strictly through the existing `PropertyFieldDefinition[]` contract + the controller's pure functions. The UI (LayoutPanel etc.) remains untouched.

Intended dependency direction (authoring-studio internals):
```
layout-inspector/ --> ../layout (S29), ../responsive (S28), ../inspector/registry/{types,PropertyRegistry}
layout-inspector/ --> ../../../builder-core (types + HistoryStack generic used by S29 contract)
```

## 12. Public API & Freeze

- `packages/authoring-studio/src/layout-inspector/index.ts` — real named exports only (catalog, model, router, commands, controller, types).
- ONE authorized change to the existing `packages/authoring-studio/src/index.ts`: append `export * from './layout-inspector';` (matches the S28/S29 barrel pattern).
- No phantom exports, no duplicate exports, no `as any`.
- All other files — including every S1–S29 source/test/doc and all Inspector 2.0 (`inspector/`) files — are FROZEN and must not be edited.

## 13. Definition of Done

1. Architecture compliance: SSOT preserved, 0 duplicate engines, 0 S30-owned history stacks.
2. Domain isolation: pure TS, 0 forbidden imports (grep-clean for React/window/document/rAF/PlaybackController/RuntimeScheduler/RuntimeBridge).
3. Test coverage: 6 full suites (catalog + model + router + commands + controller + Golden E2E), green on real Vitest run.
4. TypeScript gate: 0 S30-specific errors in `npx tsc --noEmit` (pre-existing repo errors attributed separately, as in S29).
5. Vitest gate: 100% PASS across `packages/authoring-studio/src/layout-inspector/__tests__`.
6. Build gate: `npm run build` succeeds (reporting actual result).
7. Golden E2E using the real `BuilderDocument`, real S29 commands, real S28 `SetBreakpointOverrideCommand`, real `createHistoryStack` — no mocks replacing production logic.