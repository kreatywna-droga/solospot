# DESIGN LANGUAGE COMPOSITION REAL TRANSFORMATION — GATE v2.0

## USER-REPORTED GAP

- CompositionIntelligence produces `BuilderCommand[]` but never dispatches them against a live `BuilderDocument`.
- Hero/Section/Card/CTA/Spacing/Typography transformation logic exists but is not executed from the Design System UI.
- Canvas does not reflect composition changes because no composition commands reach the mutation engine.

## PRODUCTION REPRODUCTION

- Open `DesignSystemCatalog`, select any category.
- Observe that only `UPDATE_THEME` is dispatched.
- No `SET_NODE_STYLES` composition commands are generated or dispatched from visual language selection.

## FIRST BREAK

**Missing wiring between Visual Language selection and Builder dispatch**

`src/lib/design-brain/CompositionIntelligence.ts` and `src/lib/design-brain/VisualLanguageApplication.ts` generate valid `BuilderCommand[]` (`SET_NODE_STYLES`) from `VisualLanguage` + `BuilderDocument`, but there is no UI entry point or dispatch path for them.

## ROOT CAUSE

- Visual languages were isolated in `src/lib/design-brain` with no catalog integration.
- `DesignSystemCatalog.tsx` had no category for visual languages and no apply handler that consumes `buildVisualLanguageCommandPlan`.
- `resolveEffectiveStyles()` in `BuilderCanvas.tsx` already merges `doc.theme` + `node.styles`, so Canvas consumption was ready; only the dispatch path was missing.

## FIX

### 1. Exported composition pipeline

`src/lib/design-brain/index.ts` now exports:
- `buildVisualLanguageCommandPlan`
- `CompositionDecision` type

### 2. Added Visual Languages to Design System catalog

`src/components/builder/design-system/DesignSystemCatalog.tsx`:
- Added `'visual-languages'` category to `CategoryId`, `CATEGORIES`, `CAN_APPLY`, and `CATEGORY_KIND_MAP`.
- Imported `VISUAL_LANGUAGES` and `buildVisualLanguageCommandPlan` from `src/lib/design-brain`.
- Added `applyVisualLanguage(visualLanguageId)` which:
  1. Resolves the selected `VisualLanguage`.
  2. Calls `buildVisualLanguageCommandPlan(language, doc, pageId)` to get `compositionCommands`.
  3. Dispatches `UPDATE_THEME` with visual language tokens (`colors`, `typography`, `radius`, `spacing`, `shadows`, `components`, `composition`).
  4. Dispatches each `SET_NODE_STYLES` command from the composition plan.
- Wired list and preview-modal Apply buttons to call `applyVisualLanguage` for the `visual-languages` category.

## COMMAND FLOW

```
User clicks Apply on Visual Language
  -> applyVisualLanguage(id)
    -> buildVisualLanguageCommandPlan(language, document, pageId)
      -> buildCompositionDecisions({ document, visualLanguage })
        -> heroDecisions / sectionDecisions / cardDecisions / ctaDecisions / globalSpacingDecisions / typographyDecisions
      -> compositionDecisionsToCommands(decisions)
    -> dispatch({ type: 'UPDATE_THEME', theme: { ...tokens, appliedStylePackId: `visual-language:${id}` } })
    -> dispatch({ type: 'SET_NODE_STYLES', nodeId, styles, pageId })  [for each composition command]
      -> BuilderContext.applyCommandToDocument
        -> doc.theme updated
        -> node.styles updated
          -> Canvas re-renders via resolveEffectiveStyles(node, viewport, doc.theme)
```

## VALIDATION

| Check | Result |
|-------|--------|
| `npx vitest run src/lib/design-brain/__tests__/CompositionIntelligence.test.ts` | 19 passed |
| `npx vitest run packages/builder-core/src/__tests__/studio-builder-loop.test.ts` | 28 passed |
| `npx vitest run packages/design-system/src/__tests__/apply-pipeline-forensic.test.ts` | 28 passed |
| `npx vitest run Mini Inspector Gate v6 suite` | 231 passed, 1 known pre-existing failure (`HacpIntentEngine T37` offline CLARIFY in node env) |
| `npx eslint src/components/builder/design-system/DesignSystemCatalog.tsx src/lib/design-brain/*.ts` | Pass |
| `npx tsc --noEmit` | Pre-existing test file errors only; no new errors in changed source files |
| `npm run build` | Pass |

## CANVAS CONSUMPTION VERIFICATION

`src/components/builder/canvas/BuilderCanvas.tsx`:
- `resolveEffectiveStyles(node, viewport, theme)` merges `themeStyles` (from `doc.theme` + `theme.tokens`) with `node.styles`.
- `UPDATE_THEME` updates `doc.theme`, immediately affecting `themeStyles`.
- `SET_NODE_STYLES` updates `node.styles`, immediately affecting the merged result.
- Both paths are consumed by `CanvasNode` and `SectionBlock` renderers.

## FILES CHANGED

- `src/components/builder/design-system/DesignSystemCatalog.tsx`
- `src/lib/design-brain/index.ts`

## FILES ADDED (PREVIOUSLY UNTRACKED, NOW PART OF GATE v2.0)

- `src/lib/design-brain/CompositionIntelligence.ts`
- `src/lib/design-brain/VisualLanguageApplication.ts`
- `src/lib/design-brain/__tests__/CompositionIntelligence.test.ts`

## STATUS

Gate v2.0 complete. CompositionIntelligence is now wired into the Design System apply pipeline. Visual Language selection dispatches both theme updates and node-level composition commands, and the Canvas consumes them via the existing `resolveEffectiveStyles()` merge.
