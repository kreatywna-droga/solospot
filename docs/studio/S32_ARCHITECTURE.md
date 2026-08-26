# S32 Architecture Specification — Component Systems, Component Presets & Slot Composition

> **Subsystem:** Authoring Studio — Component Systems, Component Presets & Slot Composition (Sprint S32)  
> **Author:** Agent 1 — Senior Architect & Planning Agent  
> **Status:** PROPOSED — WAITING FOR ARCHITECT APPROVAL (no implementation executed)  
> **Dependencies:** `builder-core` (`BuilderDocument`, `HistoryStack`), S28 Responsive Subsystem (`../responsive`), S29 Layout Subsystem (`../layout`), S30 Layout Inspector (`../layout-inspector`), S31 Live Preview (`../viewport-preview`), `component-runtime` (`ComponentManifest`, `ComponentCategory`)

---

## 1. Executive Summary & Objective

Sprint S32 delivers the **headless Component Systems, Component Presets & Slot Composition domain layer** on top of the frozen S28/S29/S30/S31 layout, inspector & live preview foundation.

S32 answers the core question:

> "How does the Studio define reusable component presets, manage component variants and prop schemas, enforce slot composition rules, and apply presets immutably onto BuilderDocument nodes — fully integrated with S28-S31 without creating second document stores or duplicate engines?"

S32 **is not** a second document store, second layout engine, second responsive engine, second camera engine, or second renderer. It introduces **zero** duplicate engines, **zero** second document models, **zero** new history stacks, and **zero** React/DOM in its domain modules. It is a pure, headless, deterministic layer that:

1. **Defines Component Presets** (`ComponentPreset`) — pre-configured, reusable node templates (Hero Card, Feature Grid, CallToAction, Testimonial, Navbar) with props schemas, default S29 layout styles/constraints, and default S28 responsive overrides.
2. **Manages Component Variants** (`ComponentVariant`) — variant definitions (`primary`, `secondary`, `compact`, `hero`), variant property overrides, and variant resolution on `node.props.variant`.
3. **Enforces Slot Composition Rules** (`ComponentSlot`, `SlotRule`) — slot definitions (`header`, `body`, `footer`), allowed node types, min/max child constraints, and slot node insertion/removal.
4. **Dispatches Undoable Commands** — `ApplyComponentPresetCommand`, `SetComponentVariantCommand`, `InsertSlotNodeCommand`, `RemoveSlotNodeCommand`, pushed onto caller-provided `createHistoryStack<BuilderDocument>`.
5. **Synchronizes with S28–S31** — preset mutations update `BuilderDocument` SSOT via `touchDocument`, which immediately reflects across S30 Layout Inspector and S31 Live Preview.

---

## 2. Architecture Flow

```
              BuilderDocument (SSOT — node.props)
                      |
        +-------------+------------------------+
        |             |                        |
        v             v                        v
   S28 Responsive   S29 Layout             S30 Inspector
 BreakpointRegistry resolveLayout()     LayoutInspectorController
        +-------------+------------------------+
                      |
                      v
   S31 Live Preview (ViewportPreviewInteractionController)
                      |
                      v
        +--------------------------------------+
        |  S32 components (headless domain)    |
        |  ComponentPresetModel       --> DTOs |
        |  ComponentPresetRegistry    --> Catalog |
        |  ComponentVariantEngine     --> Variant resolution |
        |  ComponentSlotComposition   --> Slot rules & validation |
        |  ComponentCommands          --> Undoable Commands |
        |  ComponentController        --> Orchestrator |
        +--------------+-----------------------+
                       |
                       v
        BuilderDocument.touchDocument(doc)
                       |
                       v
   S28-S31 Auto-Refresh (SSOT integrity preserved)
```

---

## 3. Governance & Architectural Rules

- **SSOT (DECISION-044 Lineage):** `BuilderDocument` is the single source of truth. Component preset data, variants, and slot node references are stored in existing node `props`:
  - `node.props.componentId` → Component preset identifier
  - `node.props.variant` → Active variant identifier
  - `node.props.slotName` → Slot identifier on child nodes
  - `node.props.layoutStyle` / `node.props.layoutConstraints` → S29 layout data
  - `node.props.responsiveOverrides` → S28 breakpoint overrides
- **No Duplicate Engines (DECISION-042 Lineage):** 0 renderers, 0 layout engines, 0 responsive engines, 0 history stacks created by S32. History is always the caller-provided `createHistoryStack<BuilderDocument>`.
- **Pure Domain Boundary:** `packages/authoring-studio/src/components/` imports ONLY: `../../../builder-core/src/*` (BuilderDocument, SectionNode, HistoryStack), `../responsive` (S28), `../layout` (S29), `../layout-inspector` (S30), `../viewport-preview` (S31), `../../component-runtime/src/ComponentTypes` (`ComponentCategory`). ZERO `React`, `window`, `document`, `requestAnimationFrame`, DOM/Canvas, WebGL/WebGPU.
- **Determinism:** Same `doc` + same `presetId` + same `variantId` ⇒ byte-identical node state. No `Math.random()`, no `Date.now()` in component math.
- **Freeze (S1–S31):** No existing source file is modified. The ONLY authorized edit to a pre-existing file is one appended barrel line in `packages/authoring-studio/src/index.ts`.

---

## 4. Component Preset DTO & Registry Model

```ts
export interface ComponentVariant {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly overrideProps: Record<string, unknown>;
  readonly overrideLayoutStyle?: Partial<LayoutStyle>;
  readonly overrideLayoutConstraints?: Partial<LayoutConstraints>;
}

export interface ComponentSlotDefinition {
  readonly name: string;
  readonly label: string;
  readonly allowedTypes: ReadonlyArray<string>;
  readonly minChildren?: number;
  readonly maxChildren?: number;
}

export interface ComponentPreset {
  readonly id: string;
  readonly category: ComponentCategory;
  readonly name: string;
  readonly description?: string;
  readonly defaultProps: Record<string, unknown>;
  readonly defaultLayoutStyle?: Partial<LayoutStyle>;
  readonly defaultLayoutConstraints?: Partial<LayoutConstraints>;
  readonly defaultResponsiveOverrides?: Record<string, unknown>;
  readonly variants: ReadonlyArray<ComponentVariant>;
  readonly defaultVariantId: string;
  readonly slots: ReadonlyArray<ComponentSlotDefinition>;
}
```

---

## 5. Variant Resolution Flow

```
SectionNode (props.componentId, props.variant)
       ↓
1. Lookup ComponentPreset in ComponentPresetRegistry
       ↓
2. Base properties = preset.defaultProps + preset.defaultLayoutStyle + preset.defaultLayoutConstraints
       ↓
3. Lookup active variant (preset.variants.find(v => v.id === node.props.variant) ?? defaultVariant)
       ↓
4. Apply variant.overrideProps + variant.overrideLayoutStyle + variant.overrideLayoutConstraints
       ↓
5. Merge node-specific props & S28 responsiveOverrides
       ↓
6. Effective SectionNode returned immutably
```

---

## 6. Slot Composition Engine & Rules

- **Slot Nodes:** Children of a component section node carrying `props.slotName`.
- **Validation Rules:**
  - `allowedTypes`: Insertion rejected if node type is not permitted in target slot.
  - `maxChildren`: Insertion rejected if slot child limit is reached.
  - `minChildren`: Removal rejected if minimum child count would be violated.

---

## 7. Undoable Commands & HistoryStack Integration

- `ApplyComponentPresetCommand`: Applies a preset template onto a target SectionNode in `BuilderDocument`.
- `SetComponentVariantCommand`: Updates `node.props.variant` and merges variant property overrides.
- `InsertSlotNodeCommand`: Inserts a validated child SectionNode into a target slot.
- `RemoveSlotNodeCommand`: Removes a child node from a slot while enforcing `minChildren` constraints.

All commands execute immutably and update `BuilderDocument` via S28's `updateNodeInDocument` (calling `touchDocument`), returning new document snapshots for `history.push(doc, cmd.name)`.

---

## 8. Module Decomposition (`packages/authoring-studio/src/components/`)

```
packages/authoring-studio/src/components/
├── ComponentPresetModel.ts         # DTOs, interfaces & preset factory functions
├── ComponentPresetRegistry.ts      # Builtin & custom component preset catalog
├── ComponentVariantEngine.ts       # Variant resolution & property override merging
├── ComponentSlotComposition.ts     # Slot definitions, validation & child node composition
├── ComponentCommands.ts            # Undoable commands for HistoryStack<BuilderDocument>
├── ComponentController.ts          # Unified orchestrator API
├── index.ts                        # Public barrel
└── __tests__/
    ├── ComponentPresetModel.test.ts
    ├── ComponentPresetRegistry.test.ts
    ├── ComponentVariantEngine.test.ts
    ├── ComponentSlotComposition.test.ts
    ├── ComponentCommands.test.ts
    ├── ComponentController.test.ts
    └── ComponentE2EWorkflow.test.ts # Golden E2E Test
```

---

## 9. Public API Barrel Definition

`packages/authoring-studio/src/components/index.ts`:
Re-exports pure named domain symbols from `ComponentPresetModel`, `ComponentPresetRegistry`, `ComponentVariantEngine`, `ComponentSlotComposition`, `ComponentCommands`, `ComponentController`.

Authorized single barrel edit in `packages/authoring-studio/src/index.ts`:
```ts
// Sprint S32 — Component Systems, Component Presets & Slot Composition Subsystem
export * from './components/index';
```

---

## 10. Definition of Done & Quality Gates

1. **Architecture Compliance:** SSOT preserved, 0 duplicate engines, 0 custom history stacks, 0 custom layout engines.
2. **Domain Isolation:** Pure TS, 0 forbidden imports (React/DOM/rAF/PlaybackController/RuntimeScheduler/WebGL).
3. **Test Suite:** 7 test suites including Golden E2E workflow.
4. **TSC Gate:** 0 S32-specific errors in `npx tsc --noEmit`.
5. **Vitest Gate:** 100% PASS across `packages/authoring-studio/src/components/__tests__`.
6. **Build Gate:** `npm run build` succeeds (exit 0).
