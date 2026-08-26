# Sprint S23 — Canvas Interaction & Navigation API Reference

## 1. CanvasNavigationController

```typescript
export class CanvasNavigationController {
  public static zoom(camera: Camera, factor: number, pivotPoint?: { x: number; y: number }): Camera;
  public static pan(camera: Camera, dx: number, dy: number): Camera;
  public static zoomToCursor(camera: Camera, screenPoint: { x: number; y: number }, factor: number): Camera;
  public static fitToContent(camera: Camera, contentBounds: CameraBounds, padding?: number): Camera;
  public static fitToSelection(camera: Camera, selectionBounds: CameraBounds, padding?: number): Camera;
  public static resetViewport(camera: Camera): Camera;
  public static centerSelection(camera: Camera, selectionBounds: CameraBounds): Camera;
}
```

---

## 2. CanvasSelectionController

```typescript
export class CanvasSelectionController {
  public static startMarquee(startWorldPoint: { x: number; y: number }): SelectionState;
  public static updateMarquee(state: SelectionState, scene: Scene, currentWorldPoint: { x: number; y: number }): SelectionState;
  public static endMarquee(state: SelectionState): SelectionState;
  public static additiveSelect(state: SelectionState, nodeId: string): SelectionState;
  public static subtractiveSelect(state: SelectionState, nodeId: string): SelectionState;
  public static selectAll(scene: Scene): SelectionState;
  public static deselectAll(): SelectionState;
  public static groupSelection(scene: Scene, selectedNodeIds: ReadonlyArray<string>, groupId?: string, groupName?: string): { scene: Scene; groupNodeId: string; selection: SelectionState };
  public static ungroupSelection(scene: Scene, selectedNodeIds: ReadonlyArray<string>): { scene: Scene; selection: SelectionState };
}
```

---

## 3. CanvasSnappingController

```typescript
export class CanvasSnappingController {
  public static snapDelta(
    scene: Scene,
    selectedNodeIds: ReadonlyArray<string>,
    activeBounds: BoundingBox,
    rawDx: number,
    rawDy: number,
    userGuides?: ReadonlyArray<{ position: number; type: 'horizontal' | 'vertical' }>,
    customConfig?: Partial<SnappingConfig>
  ): SnapResult;
}
```

---

## 4. GuidesRulersController

```typescript
export class GuidesRulersController {
  public static createGuide(params: { id?: string; type: 'horizontal' | 'vertical'; position: number; locked?: boolean; color?: string }): UserGuide;
  public static addGuide(guides: ReadonlyArray<UserGuide>, newGuide: UserGuide): ReadonlyArray<UserGuide>;
  public static moveGuide(guides: ReadonlyArray<UserGuide>, guideId: string, newPosition: number): ReadonlyArray<UserGuide>;
  public static removeGuide(guides: ReadonlyArray<UserGuide>, guideId: string): ReadonlyArray<UserGuide>;
  public static toggleLockGuide(guides: ReadonlyArray<UserGuide>, guideId: string): ReadonlyArray<UserGuide>;
  public static clearGuides(): ReadonlyArray<UserGuide>;
  public static computeRulerTicks(viewportLength: number, camera: Camera, orientation: 'horizontal' | 'vertical', config?: RulerConfig): ReadonlyArray<RulerTick>;
  public static computeSmartGuides(scene: Scene, selectedNodeIds: ReadonlyArray<string>, activeBounds: BoundingBox): SmartGuideResult;
}
```

---

## 5. CanvasKeyboardInteractionHandler

```typescript
export class CanvasKeyboardInteractionHandler {
  public static handleKeyDown(event: KeyboardEventParams, scene: Scene, selection: SelectionState): KeyboardActionResult;
}
```

---

## 6. CanvasInteractionPipeline

```typescript
export class CanvasInteractionPipeline {
  public static handlePointerDown(state: CanvasInteractionState, screenPoint: { x: number; y: number }, modifiers: { shiftKey: boolean; altKey: boolean; ctrlKey: boolean }): { state: CanvasInteractionState; interactionType: 'SELECT' | 'HANDLE' | 'MARQUEE' | 'PAN'; activeHandle?: TransformHandleType };
  public static handlePointerMove(state: CanvasInteractionState, screenPoint: { x: number; y: number }, prevScreenPoint: { x: number; y: number }, interactionType: 'SELECT' | 'HANDLE' | 'MARQUEE' | 'PAN', modifiers: { shiftKey: boolean; altKey: boolean }): { state: CanvasInteractionState; guideLines: ReadonlyArray<any> };
  public static handlePointerUp(state: CanvasInteractionState, interactionType: 'SELECT' | 'HANDLE' | 'MARQUEE' | 'PAN', actionLabel?: string): CanvasInteractionState;
  public static handleKeyDown(state: CanvasInteractionState, event: KeyboardEventParams): CanvasInteractionState;
}
```
