# Vector Graphics & Shapes API Specification — Sprint S18

## 1. Domain Models (`VectorDomainModel.ts`)

### Data Structures

```typescript
export type FillType = 'none' | 'solid' | 'linear-gradient' | 'radial-gradient' | 'pattern';

export interface VectorFill {
  readonly type: FillType;
  readonly color?: string;
  readonly gradientStops?: Array<{ offset: number; color: string }>;
  readonly opacity?: number;
}

export interface VectorStroke {
  readonly color: string;
  readonly width: number;
  readonly dashArray?: number[];
  readonly lineCap?: 'butt' | 'round' | 'square';
  readonly lineJoin?: 'miter' | 'round' | 'bevel';
  readonly opacity?: number;
}

export type CornerRadius = number | readonly [number, number, number, number];

export interface VectorTransform {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly rotationDeg: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly skewX: number;
  readonly skewY: number;
}
```

### Factory Functions
- `createRectangleNode(id, x, y, width, height, cornerRadius, customFill, customStroke)`
- `createEllipseNode(id, x, y, width, height, customFill, customStroke)`
- `createPolygonNode(id, sides, x, y, width, height, starRatio, customFill, customStroke)`
- `createLineNode(id, x1, y1, x2, y2, customStroke)`
- `createPathNode(id, d, x, y, width, height, customFill, customStroke)`
- `createShapeGroupNode(id, children, x, y, width, height)`

---

## 2. Vector Geometry (`VectorGeometry.ts`)

- `computeBoundingBox(node: VectorNode): BoundingBox2D`
- `computeStrokeBounds(transform: VectorTransform, stroke?: VectorStroke): BoundingBox2D`
- `applyTransform(point: Point2D, transform: VectorTransform): Point2D`
- `polygonGeometry(sides: number, radius: number, center: Point2D, starRatio?: number): Point2D[]`
- `parsePathGeometry(pathD: string): PathCommandDTO[]`
- `computePathLength(pathD: string): number`
- `pointInShape(point: Point2D, node: VectorNode): boolean`
- `checkShapeIntersection(nodeA: VectorNode, nodeB: VectorNode): boolean`
- `applyShapeConstraints(width: number, height: number, lockAspectRatio: boolean, minSize?: number)`

---

## 3. Shape Editing (`VectorEditingEngine.ts`)

- `createShape(id, type, x, y, width, height, extraProps)`
- `duplicateShape(node, offsetX, offsetY)`
- `resizeShape(node, width, height, lockAspectRatio)`
- `rotateShape(node, rotationDeg)`
- `moveShape(node, dx, dy)`
- `updateFill(node, fill)`
- `updateStroke(node, stroke)`
- `updateCornerRadius(node, radius)`
- `alignShapes(nodes, alignment: 'left'|'center'|'right'|'top'|'middle'|'bottom')`
- `distributeShapes(nodes, axis: 'horizontal'|'vertical')`
- `groupShapes(groupId, nodes)`
- `ungroupShape(group)`
- `reorderShapes(nodes, targetId, action: 'bringToFront'|'sendToBack'|'bringForward'|'sendBackward')`

---

## 4. Vector Animation (`VectorAnimationEngine.ts`)

- `applyAnimatedProperties(node: VectorNode, animProps: VectorAnimatableProperties): VectorNode`
- `interpolateProperty(startValue: number, endValue: number, progress: number): number`

---

## 5. Vector Rendering Bridge (`VectorRenderingBridge.ts`)

- `buildRenderCommands(node: VectorNode): RendererCommand[]`
