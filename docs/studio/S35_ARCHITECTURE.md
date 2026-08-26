# S35 Architecture Specification — Inspector Animation Panel Integration

> **Subsystem:** Authoring Studio — Inspector Animation Panel Integration (Sprint S35)  
> **Author:** Agent 1 — Senior Architect & Planning Agent  
> **Status:** PROPOSED — DOCUMENTATION REVISED (S35-DOC-REPAIR FIXED)  
> **Dependencies:** `builder-core` (`BuilderDocument`, `SectionNode`, `AnimationTypes`, `AnimationTimeline`, `AnimationTrigger`, `HistoryStack`), S28 Responsive (`../responsive`), S29 Layout (`../layout`), S30 Layout Inspector (`../inspector`), S31 Viewport Preview (`../viewport-preview`), S32 Components (`../components`), S33 Triggers (`builder-core/src/animation/`), S34 Runtime Preview (`../runtime-preview`)

---

## 1. Executive Summary & Core Objective

Sprint S35 formalizes the **Inspector Animation Panel Integration layer** within Authoring Studio (`packages/authoring-studio/src/inspector/`). It bridges the authoring UI Inspector surface with `builder-core`'s Animation Engine DTOs (`AnimationTimeline`, `AnimationTrigger`, `AnimationClip`, `PropertyAnimationTrack`, `AnimationKeyframe`, `PlaybackOptions`).

S35 answers the fundamental architectural question:

> *"How does the Authoring Studio Inspector render animation property fields, manage trigger definitions and playback options, and apply property updates immutably onto BuilderDocument nodes without creating second document stores, without introducing duplicate history stacks, and without violating the strict boundary between Inspector editing and Runtime playback execution?"*

S35 **is not** a runtime playback engine, timeline player, or execution environment. It establishes a strict, decoupled boundary:

1. **Pure Presentation & Editing Surface (`AnimationPanel.tsx` & `animationPropertyFields.ts`):** UI component rendering form controls for trigger type, threshold, duration, delay, easing curve, repeat count, fill mode, and direction.
2. **Single Source of Truth (SSOT) Document Binding (`animationDocumentBinding.ts`):** Declarative, immutable mapper functions reading `AnimationTimeline` DTOs from `node.props['animationTimeline']` on `BuilderDocument` and producing new `BuilderDocument` snapshots pushed onto the canonical `HistoryStack`.
3. **Strict Inspector ≠ Runtime Boundary (DECISION-043 & DECISION-045):** Inspector edits DTO configuration ONLY. Strictly ZERO imports or invocations of `PlaybackController`, `RuntimeScheduler`, `AnimationTriggerEngine` execution, `RuntimeBridge`, `BrowserTriggerAdapter`, or `requestAnimationFrame`.

---

## 2. Architecture & Subsystem Boundary Flow

```
+-----------------------------------------------------------------------------------+
|                           BuilderDocument (SSOT)                                  |
|   node.props['animationTimeline'] -> AnimationTimeline DTO (Immutable Config)     |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (Reads DTO)
+-----------------------------------------------------------------------------------+
|      inspectNodeAnimation(doc, nodeId)  -->  animationTimelineToInspectorValues    |
|      (packages/authoring-studio/src/inspector/animationDocumentBinding.ts)       |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (Provides Flat Values Dictionary)
+-----------------------------------------------------------------------------------+
|           AnimationPanel / AnimationPanelAdapter (Inspector UI Surface)           |
|   Renders form fields via propertyFieldRegistry (select, number, text)            |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (User edits field -> updated values map)
+-----------------------------------------------------------------------------------+
|    1. inspectorValuesToAnimationTimeline(nodeId, values) -> AnimationTimeline     |
|    2. applyAnimationToNode(doc, nodeId, timeline) -> NEW BuilderDocument          |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (Pushes NEW Document Snapshot)
+-----------------------------------------------------------------------------------+
|                    createHistoryStack<BuilderDocument>()                          |
|    Canonical HistoryStack.push(newDoc) -> enables undo / redo                     |
+-----------------------------------------------------------------------------------+

=====================================================================================
STRICT BOUNDARY (DECISION-043 / DECISION-045) — NO RUNTIME EXECUTION IN INSPECTOR
   ❌ NO PlaybackController    ❌ NO RuntimeScheduler        ❌ NO requestAnimationFrame
   ❌ NO Trigger Engine Run    ❌ NO RuntimeBridge           ❌ NO BrowserTriggerAdapter
=====================================================================================
```

---

## 3. Governance & Architectural Decisions

### DECISION-042 — Inspector is Exclusively an Animation DTO Editor
- The Inspector is strictly an authoring tool for creating and modifying `AnimationTimeline`, `AnimationTrigger`, and `PlaybackOptions` DTO data.
- It operates solely on static property definitions and DTO dictionaries.

### DECISION-043 — Animation Panel Does Not Execute Runtime Engines
- `AnimationPanel.tsx` MUST NOT start playback, tick schedulers, or evaluate trigger conditions.
- Animation execution remains exclusively inside `builder-core` and runtime preview layers (S30–S34).

### DECISION-044 — Single Source of Truth (SSOT) & Key Standardization
- `BuilderDocument` is the single source of truth for all `AnimationTimeline` editing.
- **SSOT KEY STANDARDIZATION:** The canonical SSOT property key across both `builder-core` (S33/S34) and `authoring-studio` (S35) is **`animationTimeline`** (`node.props['animationTimeline']`).
- *Governance Resolution (F-02):* The use of `_animationTimeline` in early binding drafts was an inconsistent assumption. `animationTimeline` is the sole canonical key. S35 document bindings read and write `node.props['animationTimeline']`, ensuring 100% cross-subsystem consistency.
- **FORBIDDEN:** `AnimationInspectorStateStore`, `AnimationDocument`, `AnimationTimelineStore`, `AnimationEngineState`, or custom history stacks.

### DECISION-045 — Inspector Never Invokes Playback Controllers
- The Inspector NEVER invokes `PlaybackController`, `AnimationPlaybackController`, or `RuntimeScheduler`.
- Editing an animation field immutably updates `BuilderDocument` and emits standard `UPDATE_PROPS` signals to the Canvas/Preview layer.

### DECISION-046 — Canonical History Stack Integration
- Every animation property mutation produces a NEW `BuilderDocument` snapshot via `inspectorValuesToAnimationTimeline` + `applyAnimationToNode`.
- Document updates are pushed to the caller-provided `createHistoryStack<BuilderDocument>()`.

---

## 4. Subsystem Contracts & Production Flow (F-01 & F-02 Fix)

### 4.1 Production API Mapping Flow

```
1. READ FLOW:
   inspectNodeAnimation(doc, nodeId) -> AnimationTimeline | null
         ↓
   animationTimelineToInspectorValues(timeline) -> Record<string, unknown>

2. WRITE / MUTATION FLOW:
   inspectorValuesToAnimationTimeline(nodeId, updatedValues) -> AnimationTimeline
         ↓
   applyAnimationToNode(doc, nodeId, timeline) -> BuilderDocument (NEW snapshot)
         ↓
   historyStack.push(newDoc)
```

> **Note on Helper APIs:** If a convenience helper `applyAnimationInspectorChange(doc, nodeId, fieldId, value)` is provided during S35 implementation, it is classified as `[NEW] — S35 API` (a thin wrapper around `inspectorValuesToAnimationTimeline` + `applyAnimationToNode`).

### 4.2 Module Inventory (`packages/authoring-studio/src/inspector/`)

| Module File | Role & Responsibilities |
|---|---|
| `registry/animationPropertyFields.ts` | Single source of truth for Inspector animation field definitions (`ANIMATION_PROPERTY_FIELDS`: trigger.type, trigger.threshold, playback.duration, playback.delay, playback.easing, playback.repeatCount, playback.fillMode, playback.direction). |
| `panels/AnimationPanel.tsx` | Pure React presentation component rendering animation fields using widgets resolved via `propertyFieldRegistry`. |
| `panels/AnimationPanelAdapter.ts` | Adapter wrapping `AnimationPanel` for integration into `InspectorShell` / `InspectorShellAdapter`. |
| `animationDocumentBinding.ts` | Immutable document binding functions: `findNodeById`, `updateNodeById`, `inspectNodeAnimation`, `animationTimelineToInspectorValues`, `inspectorValuesToAnimationTimeline`, `applyAnimationToNode`. |

---

## 5. Dependency Graph & Boundary Constraints

### 5.1 Permitted Imports
- `../../../builder-core/src/BuilderDocument`
- `../../../builder-core/src/animation/AnimationTypes`
- `../../../builder-core/src/HistoryStack`
- `../registry/animationPropertyFields`
- `../registry/propertyFieldRegistry`
- `../registry/types`
- `../panels/panelTypes`
- `../widgets/WidgetField`

### 5.2 Strict Prohibitions (Forbidden Imports & Symbols)
- ❌ NO `PlaybackController` / `AnimationPlaybackController`
- ❌ NO `RuntimeScheduler`
- ❌ NO `AnimationTriggerEngine` execution (`shouldStart`, `transition`)
- ❌ NO `AnimationRuntimeBridge` / `AnimationRuntimePreviewBridge`
- ❌ NO `BrowserTriggerAdapter`
- ❌ NO `requestAnimationFrame`, `setTimeout`, `setInterval`
- ❌ NO Secondary document stores or custom history stacks

---

## 6. SSOT & Persistence Model

| Data Element | Storage Location | Persistence | Mutability |
|---|---|---|---|
| `AnimationTimeline` (DTO) | `node.props['animationTimeline']` in `BuilderDocument` | Persistent (Saved to JSON / SSOT) | Immutable (Updated via `applyAnimationToNode`) |
| Flat Inspector Values | Map returned by `animationTimelineToInspectorValues()` | Transient (Lifetime of Inspector render) | Readonly DTO dictionary |
| History Stack Entries | `createHistoryStack<BuilderDocument>()` | Memory stack | Immutable snapshots pushed on mutation |
| Runtime Playback State | N/A (Out of scope for Inspector) | None in Inspector | Forbidden in Inspector |

---

## 7. Golden E2E Verification Workflow (`AnimationPanelIntegration.test.ts`)

The Golden E2E Integration Workflow verifies the full authoring & Inspector binding lifecycle without fake playback:

```
 1. Create BuilderDocument & SectionNode via canonical production factories.
 2. Attach default AnimationTimeline DTO to node.props['animationTimeline'].
 3. Execute inspectNodeAnimation(doc, nodeId) -> verify timeline DTO is retrieved.
 4. Execute animationTimelineToInspectorValues(timeline) -> verify flat inspector values dictionary.
 5. Render AnimationPanel component with inspector values and ANIMATION_PROPERTY_FIELDS.
 6. User edits trigger & playback properties in values map:
    values['animation.trigger.type'] = 'inView';
    values['animation.trigger.threshold'] = 0.75;
 7. Convert updated values:
    timeline2 = inspectorValuesToAnimationTimeline(nodeId, values);
 8. Apply updated timeline to document:
    doc2 = applyAnimationToNode(doc1, nodeId, timeline2);
 9. Push doc1, doc2 onto HistoryStack<BuilderDocument>.
10. Execute history.undo() -> verify document reverts to doc1 state.
11. Execute history.redo() -> verify document restores doc2 state with updated trigger & threshold.
12. Verify BuilderDocument remains 100% SSOT with zero side effects or runtime playback calls.
```

---

## 8. Summary of Architectural Guarantees

- **0 Phantom APIs:** Uses real production binding functions (`inspectorValuesToAnimationTimeline`, `applyAnimationToNode`).
- **0 Duplicate Engines:** 0 playback controllers, 0 schedulers in Inspector.
- **SSOT Standardization:** `animationTimeline` (`node.props['animationTimeline']`) is the sole canonical key across `builder-core` and `authoring-studio`.
- **0 DOM Leaks in Core:** Inspector operates purely on DTO definitions.
- **Freeze Preservation:** S1–S34 subsystems and `BuilderDocument.ts` remain 100% frozen.
