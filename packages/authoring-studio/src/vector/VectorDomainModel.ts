/**
 * VectorDomainModel.ts — Sprint S18 Vector Domain Model (ETAP 1)
 *
 * Defines pure DTO data structures for Vector Shapes (Rectangle, Ellipse, Polygon, Line, Path, ShapeGroup),
 * Fill, Stroke, CornerRadius, and Vector Transform properties.
 *
 * Headless model, NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

export type FillType = 'none' | 'solid' | 'linear-gradient' | 'radial-gradient' | 'pattern';

export interface GradientStop {
  readonly offset: number; // 0 to 1
  readonly color: string;  // Hex / RGBA
}

export interface VectorFill {
  readonly type: FillType;
  readonly color?: string;          // Used for 'solid'
  readonly gradientStops?: GradientStop[]; // Used for linear & radial gradients
  readonly gradientAngleDeg?: number;      // Used for linear-gradient
  readonly opacity?: number;               // Fill opacity [0, 1]
}

export type LineCap = 'butt' | 'round' | 'square';
export type LineJoin = 'miter' | 'round' | 'bevel';

export interface VectorStroke {
  readonly color: string;
  readonly width: number;
  readonly dashArray?: number[];
  readonly dashOffset?: number;
  readonly lineCap?: LineCap;
  readonly lineJoin?: LineJoin;
  readonly miterLimit?: number;
  readonly opacity?: number;
}

export type CornerRadius = number | readonly [number, number, number, number]; // uniform or [tl, tr, br, bl]

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

export interface BaseVectorNode {
  readonly id: string;
  readonly name: string;
  readonly transform: VectorTransform;
  readonly opacity: number;
  readonly visible: boolean;
  readonly locked: boolean;
  readonly fill?: VectorFill;
  readonly stroke?: VectorStroke;
}

export interface RectangleNode extends BaseVectorNode {
  readonly type: 'rectangle';
  readonly cornerRadius: CornerRadius;
}

export interface EllipseNode extends BaseVectorNode {
  readonly type: 'ellipse';
  readonly startAngleDeg?: number;
  readonly endAngleDeg?: number;
}

export interface PolygonNode extends BaseVectorNode {
  readonly type: 'polygon';
  readonly sides: number;       // e.g. 3 (triangle), 5 (pentagon), 6 (hexagon)
  readonly starRatio?: number;  // optional inner radius ratio for star shapes [0.1, 0.9]
  readonly points?: Array<{ x: number; y: number }>;
}

export interface LineNode extends BaseVectorNode {
  readonly type: 'line';
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

export interface PathCommandDTO {
  readonly type: 'M' | 'L' | 'C' | 'Q' | 'A' | 'Z';
  readonly args: number[];
}

export type VectorNodeType = 'corner' | 'smooth' | 'symmetric';

export interface VectorPathAnchor {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly handleIn?: { readonly x: number; readonly y: number };
  readonly handleOut?: { readonly x: number; readonly y: number };
  readonly type?: VectorNodeType;
}

export interface VectorPathData {
  readonly anchors: ReadonlyArray<VectorPathAnchor>;
  readonly closed: boolean;
}

export interface PathNode extends BaseVectorNode {
  readonly type: 'path';
  readonly d: string; // SVG Path string
  readonly commands?: PathCommandDTO[];
  readonly pathData?: VectorPathData;
}

export interface ShapeGroupNode extends BaseVectorNode {
  readonly type: 'group';
  readonly children: VectorNode[];
}

export type VectorNode =
  | RectangleNode
  | EllipseNode
  | PolygonNode
  | LineNode
  | PathNode
  | ShapeGroupNode;

export const DEFAULT_TRANSFORM: VectorTransform = {
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  rotationDeg: 0,
  scaleX: 1,
  scaleY: 1,
  skewX: 0,
  skewY: 0,
};

export const DEFAULT_FILL: VectorFill = {
  type: 'solid',
  color: '#3B82F6', // Vibrant modern blue
  opacity: 1,
};

export const DEFAULT_STROKE: VectorStroke = {
  color: '#1E40AF',
  width: 2,
  lineCap: 'round',
  lineJoin: 'round',
  opacity: 1,
};

export function createRectangleNode(
  id: string,
  x: number = 0,
  y: number = 0,
  width: number = 150,
  height: number = 100,
  cornerRadius: CornerRadius = 0,
  customFill?: Partial<VectorFill>,
  customStroke?: Partial<VectorStroke>
): RectangleNode {
  return {
    id,
    type: 'rectangle',
    name: `Rectangle_${id}`,
    transform: { ...DEFAULT_TRANSFORM, x, y, width, height },
    opacity: 1,
    visible: true,
    locked: false,
    cornerRadius,
    fill: { ...DEFAULT_FILL, ...customFill },
    stroke: { ...DEFAULT_STROKE, ...customStroke },
  };
}

export function createEllipseNode(
  id: string,
  x: number = 0,
  y: number = 0,
  width: number = 120,
  height: number = 120,
  customFill?: Partial<VectorFill>,
  customStroke?: Partial<VectorStroke>
): EllipseNode {
  return {
    id,
    type: 'ellipse',
    name: `Ellipse_${id}`,
    transform: { ...DEFAULT_TRANSFORM, x, y, width, height },
    opacity: 1,
    visible: true,
    locked: false,
    fill: { ...DEFAULT_FILL, ...customFill },
    stroke: { ...DEFAULT_STROKE, ...customStroke },
  };
}

export function createPolygonNode(
  id: string,
  sides: number = 5,
  x: number = 0,
  y: number = 0,
  width: number = 120,
  height: number = 120,
  starRatio?: number,
  customFill?: Partial<VectorFill>,
  customStroke?: Partial<VectorStroke>
): PolygonNode {
  return {
    id,
    type: 'polygon',
    name: `Polygon_${sides}_${id}`,
    sides,
    starRatio,
    transform: { ...DEFAULT_TRANSFORM, x, y, width, height },
    opacity: 1,
    visible: true,
    locked: false,
    fill: { ...DEFAULT_FILL, ...customFill },
    stroke: { ...DEFAULT_STROKE, ...customStroke },
  };
}

export function createLineNode(
  id: string,
  x1: number = 0,
  y1: number = 0,
  x2: number = 100,
  y2: number = 100,
  customStroke?: Partial<VectorStroke>
): LineNode {
  const minX = Math.min(x1, x2);
  const minY = Math.min(y1, y2);
  const width = Math.max(1, Math.abs(x2 - x1));
  const height = Math.max(1, Math.abs(y2 - y1));

  return {
    id,
    type: 'line',
    name: `Line_${id}`,
    x1,
    y1,
    x2,
    y2,
    transform: { ...DEFAULT_TRANSFORM, x: minX, y: minY, width, height },
    opacity: 1,
    visible: true,
    locked: false,
    fill: { type: 'none' },
    stroke: { ...DEFAULT_STROKE, ...customStroke },
  };
}

export function createPathNode(
  id: string,
  d: string = 'M 0 0 L 100 0 L 50 100 Z',
  x: number = 0,
  y: number = 0,
  width: number = 100,
  height: number = 100,
  customFill?: Partial<VectorFill>,
  customStroke?: Partial<VectorStroke>,
  pathData?: VectorPathData
): PathNode {
  return {
    id,
    type: 'path',
    name: `Path_${id}`,
    d,
    transform: { ...DEFAULT_TRANSFORM, x, y, width, height },
    opacity: 1,
    visible: true,
    locked: false,
    fill: { ...DEFAULT_FILL, ...customFill },
    stroke: { ...DEFAULT_STROKE, ...customStroke },
    pathData,
  };
}

export function createShapeGroupNode(
  id: string,
  children: VectorNode[] = [],
  x: number = 0,
  y: number = 0,
  width: number = 200,
  height: number = 200
): ShapeGroupNode {
  return {
    id,
    type: 'group',
    name: `Group_${id}`,
    children,
    transform: { ...DEFAULT_TRANSFORM, x, y, width, height },
    opacity: 1,
    visible: true,
    locked: false,
  };
}
