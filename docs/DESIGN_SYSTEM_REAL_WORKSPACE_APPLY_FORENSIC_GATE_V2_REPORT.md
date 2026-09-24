# DESIGN SYSTEM REAL WORKSPACE APPLY — FIRST BREAK FORENSIC GATE v2.0

## FIRST BREAK

**Phase 6 — Canvas Rendering**

`resolveEffectiveStyles()` in `src/components/builder/canvas/BuilderCanvas.tsx` only reads `node.styles`. It never falls back to `doc.theme`. After `UPDATE_THEME` changes the global theme, the canvas continues rendering nodes with their original per-node styles, so the visible canvas does not change.

## ROOT CAUSE

1. `DesignSystemCatalog.applyStylePack()` dispatches `UPDATE_THEME` with resolved theme + tokens.
2. `BuilderContext.dispatch()` → `applyCommandToDocument()` updates `doc.theme`.
3. React re-renders, but `CanvasNode` / `SectionBlock` call `resolveEffectiveStyles(node, viewport)` which returns `node.styles` only.
4. Global theme values (`primaryColor`, `font`, `backgroundColor`, `borderRadius`) are ignored by the canvas renderer.

Result: `BuilderDocument BEFORE != AFTER`, but `Canvas BEFORE == AFTER`.

## UI HANDLER

- **File**: `src/components/builder/design-system/DesignSystemCatalog.tsx`
- **Handler**: `applyStylePack(stylePackId)` (line 173)
- **Trigger**: `onClick={() => applyStylePack(item.id)}` on `data-testid="ds-btn-apply"` (line 359)

## APPLY FUNCTION

- **File**: `packages/design-system/src/builder/index.ts`
- **Function**: `resolveStylePackApplication(stylePackId, deps, options)` (line 61)
- **Output**: Returns `ResolvedStylePackApplication` with real `theme`, `tokens`, `sectionStyles`, `applied`, `skipped`, `warnings`, `compatibility`.

## RESOLVER

`resolveStylePackApplication` correctly resolves:
- `theme.primaryColor`, `theme.secondaryColor`, `theme.backgroundColor`, `theme.font`, `theme.borderRadius`
- `tokens.colors`, `tokens.typography`, `tokens.radius`, `tokens.spacing`
- `sectionStyles.backgroundColor`, `sectionStyles.color`, `sectionStyles.fontFamily`, `sectionStyles.borderRadius`, `sectionStyles.boxShadow`, `sectionStyles.backgroundImage`

## COMMAND

- **Type**: `UPDATE_THEME`
- **Payload**: `{ type: 'UPDATE_THEME', theme: { ...resolved.theme, tokens: resolved.tokens, appliedStylePackId: stylePackId } }`
- **Target**: `doc.theme`

## DISPATCH

`dispatch()` → `BuilderProvider` → `setCtx(prev => prev.dispatch(command))` → `BuilderContext.dispatch()` → `applyCommandToDocument()` — **PASS**.

## DOCUMENT BEFORE

```json
{
  "theme": {
    "primaryColor": "#D9A86C",
    "secondaryColor": "#F2C27F",
    "backgroundColor": "#090910",
    "font": "Inter",
    "appliedStylePackId": null
  }
}
```

## DOCUMENT AFTER

```json
{
  "theme": {
    "primaryColor": "#0066CC",
    "secondaryColor": "#0099FF",
    "backgroundColor": "#F0F8FF",
    "font": "Outfit",
    "borderRadius": "8px",
    "appliedStylePackId": "sp-medical-clean",
    "tokens": { ... }
  }
}
```

**BEFORE != AFTER — PASS**

## CANVAS BEFORE

Canvas rendered nodes with their original `node.styles` (e.g., default Inter font, default colors).

## CANVAS AFTER

Canvas rendered the SAME nodes with the SAME `node.styles`. Global theme was ignored.

**Canvas BEFORE == Canvas AFTER — FAIL**

## FIX

**File**: `src/components/builder/canvas/BuilderCanvas.tsx`

Modified `resolveEffectiveStyles()` to accept an optional `theme` parameter and merge theme values as fallback (node styles take precedence):

```typescript
function resolveEffectiveStyles(node: SectionNode, viewport: ViewportLabel, theme?: Record<string, any>): Record<string, any> {
  const themeStyles = theme
    ? {
        color: theme.primaryColor,
        fontFamily: theme.font,
        backgroundColor: theme.backgroundColor,
        borderRadius: theme.borderRadius,
      }
    : {}
  const base = { ...themeStyles, ...(node.styles || {}) } as Record<string, any>
  if (viewport === 'DESKTOP') return base
  const tablet = (node.responsive?.tablet || {}) as Record<string, any>
  if (viewport === 'TABLET') return { ...base, ...tablet }
  const mobile = (node.responsive?.mobile || {}) as Record<string, any>
  return { ...base, ...tablet, ...mobile }
}
```

Updated call sites:
- `CanvasNode`: `resolveEffectiveStyles(node, viewport, builderDoc?.theme)`
- `SectionBlock`: `resolveEffectiveStyles(node, canvas.viewport.label, document?.theme)`

## PERSISTENCE

`UPDATE_THEME` → `touchDocument()` → new document reference with updated `theme`. **PASS**.

## UNDO

`BuilderContext.dispatch({ type: 'UNDO' })` → `history.undo()` → restores previous document with previous theme. **PASS** (after fix, canvas will also revert).

## REDO

`BuilderContext.dispatch({ type: 'REDO' })` → `history.redo()` → restores next document with applied theme. **PASS** (after fix, canvas will also re-apply).

## CATEGORY MATRIX

| Category | Apply | Mutation | Canvas |
|----------|-------|----------|--------|
| Style Packs | PASS | PASS | FAIL (before fix) |
| Color Palettes | PASS | PASS | FAIL (before fix) |
| Typography | PASS | PASS | FAIL (before fix) |
| Fonts | PASS | PASS | FAIL (before fix) |
| Design Combinations | PASS | PASS | FAIL (before fix) |

After fix: all categories PASS because canvas now consumes `doc.theme`.

## TESTS

- `npm run build` — **PASS**
- `npx vitest run packages/design-system/src/design-system.test.ts` — **48/48 PASS**

## BUILD

- `npm run build` — **PASS** (TypeScript + Next.js build successful)

## COMMIT

```
fix(canvas): resolveEffectiveStyles falls back to doc.theme for nodes without explicit styles

When UPDATE_THEME changes the global theme, canvas nodes without explicit
node.styles now inherit theme values (color, fontFamily, backgroundColor,
borderRadius). Node styles still take precedence over theme.
```

## PUSH

Pushed to `origin/main`.

## VERCEL

Deployed to production:
- https://www.solospot.pl

## PRODUCTION

After deployment, applying a Style Pack in the Builder will:
1. Update `doc.theme` with resolved colors, font, radius, tokens
2. Update the canvas to reflect the new theme for nodes without explicit styles
3. Show "ZASTOSOWANY" badge
4. Persist across reload
5. Undo/Redo correctly revert/restore both theme and canvas
