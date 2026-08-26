# S35 Implementation Plan — Inspector Animation Panel Integration

> **Subsystem:** Authoring Studio — Inspector Animation Panel Integration (Sprint S35)  
> **Author:** Agent 1 — Senior Architect & Planning Agent  
> **Status:** PROPOSED — DOCUMENTATION REVISED (S35-DOC-REPAIR FIXED)  
> **Target Package:** `packages/authoring-studio` (`src/inspector/`)

---

## 1. Goal & Objectives

Deliver the **Inspector Animation Panel Integration** subsystem for Authoring Studio (`packages/authoring-studio/src/inspector/`). Provide pure DTO editing for animation configuration (`AnimationTimeline`, `AnimationTrigger`, `PlaybackOptions`) on `BuilderDocument` SSOT (`node.props['animationTimeline']`) with 0 DOM/runtime execution, 0 duplicate engines, 0 phantom APIs, and 100% integration with canonical `HistoryStack`.

---

## 2. Technical Implementation Scope

### Component 1: Property Registry Definitions (`packages/authoring-studio/src/inspector/registry/`)
- **`animationPropertyFields.ts` (Existing / Verify):** Defines `ANIMATION_PROPERTY_FIELDS` for trigger type, threshold, duration, delay, easing curve, repeat count, fill mode, direction.

### Component 2: Animation Panel Surface (`packages/authoring-studio/src/inspector/panels/`)
- **`AnimationPanel.tsx` (Existing / Verify):** Pure presentation React component mapping field definitions to widgets via `propertyFieldRegistry`.
- **`AnimationPanelAdapter.ts` (Existing / Verify):** Adapter exposing `adaptAnimationPanel` for integration with `InspectorShell`.

### Component 3: Document Binding & Serialization (`packages/authoring-studio/src/inspector/`)
- **`animationDocumentBinding.ts` (Existing / Refactor SSOT Key):** Functions `inspectNodeAnimation`, `animationTimelineToInspectorValues`, `inspectorValuesToAnimationTimeline`, `applyAnimationToNode`.
  - *SSOT Standardization (F-02):* Refactor `animationDocumentBinding.ts` to read/write `node.props['animationTimeline']` matching frozen S33/S34 code.
  - *Convenience Helper:* If `applyAnimationInspectorChange(doc, nodeId, fieldId, value)` is provided, it is explicitly classified as `[NEW] — S35 API` (a wrapper over `inspectorValuesToAnimationTimeline` + `applyAnimationToNode`).
- **`AnimationSerialization.test.ts` (Existing / Verify):** Round-trip serialization tests validating zero data loss during document mutations.

### Component 4: Golden E2E Integration Test (`packages/authoring-studio/src/inspector/__tests__/`)
- **`AnimationPanelIntegration.test.ts`:** Golden E2E integration test verifying 10-step authoring lifecycle:
  `BuilderDocument` → `inspectNodeAnimation` → `animationTimelineToInspectorValues` → `AnimationPanel` render → `inspectorValuesToAnimationTimeline` → `applyAnimationToNode` → `HistoryStack.push` → `undo` → `redo` → SSOT verification.

---

## 3. Implementation Steps Roadmap

### Step 1 — Architecture Verification & Freeze Compliance
- Confirm `S35_ARCHITECTURE.md` approval by Agent 2 & Architect.
- Verify frozen status of S1–S34 modules and `BuilderDocument.ts`.

### Step 2 — Property Registry & Document Binding Verification
- Audit `animationPropertyFields.ts` and `animationDocumentBinding.ts`.
- Standardize SSOT key to `node.props['animationTimeline']`.

### Step 3 — Golden E2E Integration Test Implementation
- Implement `AnimationPanelIntegration.test.ts` in `packages/authoring-studio/src/inspector/__tests__/`.
- Validate 10-step authoring workflow with real `HistoryStack<BuilderDocument>` without runtime playback calls.

### Step 4 — Quality Gates & Verification
- Execute Vitest S35 subset and full authoring-studio inspector regression.
- Execute TypeScript check (`npx tsc --noEmit`).
- Execute production build check (`npm run build`).

---

## 4. Verification Plan & Acceptance Thresholds

### Automated Commands
```bash
# 1. Scope Vitest S35 suite
npx vitest run packages/authoring-studio/src/inspector/__tests__/

# 2. TypeScript compilation check
npx tsc --noEmit

# 3. Production Build check
npm run build
```

### Acceptance Thresholds
- **Vitest S35 Scope:** 100% PASS across animation panel, registry, serialization, and integration test suites.
- **TypeScript:** 0 new errors in S35 scope.
- **Build:** Exit code 0 (`ignoreBuildErrors: false`).
- **SSOT Integrity:** `BuilderDocument.ts` remains 100% FROZEN and untouched; SSOT key `animationTimeline` standardized.
- **Domain Boundary:** Clean grep for `PlaybackController`, `RuntimeScheduler`, `requestAnimationFrame` in `packages/authoring-studio/src/inspector/`.

---

## 5. Governance Workflow

```
[Agent 1 Repo Discovery & Architecture (Faza S35-A)]
                         │
                         ▼
[Agent 2 Architecture Audit & Review]
                         │
                  +------+------+
                  │             │
               (PASS)        (HOLD)
                  │             │
                  v             v
       [Architect Approval]   [Architecture Delta]
                  │
                  v
       [Agent 1 Implementation Phase (S35-B)]
```

*Agent 1 does not execute code implementation until Agent 2 and Architect approve the architecture.*
