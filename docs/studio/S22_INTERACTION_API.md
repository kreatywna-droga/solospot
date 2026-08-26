# S22 — Selection, Transform & Interaction System API Specification

## 1. Selection State DTOs (`SelectionModel.ts`)

```typescript
export type SelectionMode = 'none' | 'single' | 'multi' | 'marquee';

export type TransformHandleType =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'rotate';

export interface SelectionState {
  readonly selectedNodeIds: ReadonlyArray<string>;
  readonly primarySelectedId: string | null;
  readonly activeHandle: TransformHandleType | null;
  readonly mode: SelectionMode;
  readonly marquee: MarqueeBox | null;
}
```

---

## 2. Selection Manager API (`SelectionManager.ts`)

- `SelectionManager.selectSingle(state, nodeId): SelectionState`
- `SelectionManager.toggleSelect(state, nodeId): SelectionState`
- `SelectionManager.clearSelection(): SelectionState`
- `SelectionManager.selectByMarquee(scene, marquee): SelectionState`

---

## 3. Bounding Box & Handles API (`BoundingBoxModel.ts`, `TransformHandles.ts`)

- `BoundingBoxModel.computeSelectionBounds(scene, selectedNodeIds): BoundingBox | null`
- `BoundingBoxModel.getBoundingBoxPoints(box): BoundingBoxPoints`
- `BoundingBoxModel.constrainAspectRatio(w, h, newW, newH): { width, height }`
- `BoundingBoxModel.scaleFromCenter(box, scaleX, scaleY): BoundingBox`
- `TransformHandles.getHandles(box): HandleDescriptor[]`
- `TransformHandles.hitTestHandle(point, box, tolerance): TransformHandleType | null`

---

## 4. Transform Operations API (`TransformInteractionEngine.ts`)

- `TransformInteractionEngine.moveSelection(scene, ids, dx, dy): Scene`
- `TransformInteractionEngine.resizeSelection(scene, ids, handle, dx, dy, lockAspect, scaleCenter): Scene`
- `TransformInteractionEngine.rotateSelection(scene, ids, deltaDeg): Scene`

---

## 5. Alignment & Distribution API (`AlignmentEngine.ts`, `DistributionEngine.ts`)

- `AlignmentEngine.alignSelection(scene, ids, alignment, canvasBounds): Scene`
- `DistributionEngine.distributeSelection(scene, ids, direction): Scene`

---

## 6. Snapping & Guides API (`SnappingEngine.ts`, `GuidesEngine.ts`)

- `SnappingEngine.snapToGrid(bounds, dx, dy, gridSize, threshold): SnapResult`
- `SnappingEngine.snapToObjects(scene, ids, bounds, dx, dy, threshold): SnapResult`
- `GuidesEngine.computeSmartGuides(scene, ids, activeBounds): SmartGuideResult`

---

## 7. History Binding API (`TransformHistoryBinding.ts`)

- `TransformHistoryBinding.pushTransformState(historyStack, doc, label): HistoryStack<BuilderDocument>`
- `TransformHistoryBinding.undo(historyStack): { stack, state } | null`
- `TransformHistoryBinding.redo(historyStack): { stack, state } | null`
