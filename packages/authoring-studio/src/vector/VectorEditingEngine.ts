/**
 * VectorEditingEngine.ts — Sprint S18 Vector Editing Engine (ETAP 2)
 *
 * Handles shape creation, manipulation, alignment, distribution, grouping,
 * layer ordering, fill/stroke styling, and corner radius mutations.
 *
 * All operations return updated VectorNode DTOs for dispatching to BuilderDocument & HistoryStack.
 * Headless model, NO DOM, NO React, ZERO Browser APIs.
 */

import {
  VectorNode,
  VectorFill,
  VectorStroke,
  CornerRadius,
  RectangleNode,
  EllipseNode,
  PolygonNode,
  LineNode,
  PathNode,
  ShapeGroupNode,
  createRectangleNode,
  createEllipseNode,
  createPolygonNode,
  createLineNode,
  createPathNode,
  createShapeGroupNode,
} from './VectorDomainModel';
import { VectorGeometry, BoundingBox2D, ResizeHandle } from './VectorGeometry';

export type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export type DistributionType = 'horizontal' | 'vertical';
export type LayerReorderAction = 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward';

export class VectorEditingEngine {
  /**
   * Creates a new shape of given type.
   */
  public static createShape(
    id: string,
    type: 'rectangle' | 'ellipse' | 'polygon' | 'line' | 'path',
    x: number = 100,
    y: number = 100,
    width: number = 120,
    height: number = 100,
    extraProps?: Record<string, any>
  ): VectorNode {
    switch (type) {
      case 'rectangle':
        return createRectangleNode(id, x, y, width, height, extraProps?.cornerRadius ?? 0);
      case 'ellipse':
        return createEllipseNode(id, x, y, width, height);
      case 'polygon':
        return createPolygonNode(id, extraProps?.sides ?? 5, x, y, width, height, extraProps?.starRatio);
      case 'line':
        return createLineNode(id, x, y, x + width, y + height);
      case 'path':
        return createPathNode(id, extraProps?.d ?? 'M 0 0 L 100 0 L 50 100 Z', x, y, width, height);
    }
  }

  /**
   * Duplicates a vector shape with spatial offset.
   */
  public static duplicateShape(node: VectorNode, offsetX: number = 20, offsetY: number = 20): VectorNode {
    const newId = `shape_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    return {
      ...node,
      id: newId,
      name: `${node.name}_copy`,
      transform: {
        ...node.transform,
        x: node.transform.x + offsetX,
        y: node.transform.y + offsetY,
      },
    };
  }

  /**
   * Resizes a vector shape bounding box.
   */
  public static resizeShape(
    node: VectorNode,
    width: number,
    height: number,
    lockAspectRatio: boolean = false
  ): VectorNode {
    const constrained = VectorGeometry.applyShapeConstraints(width, height, lockAspectRatio);
    return {
      ...node,
      transform: {
        ...node.transform,
        width: constrained.width,
        height: constrained.height,
      },
    };
  }

  /**
   * Resizes a shape based on an active resize handle and mouse delta (dx, dy).
   */
  public static resizeShapeByHandle(
    node: VectorNode,
    handle: ResizeHandle,
    dx: number,
    dy: number,
    lockAspectRatio: boolean = false,
    minSize: number = 10
  ): VectorNode {
    const { x, y, width, height } = node.transform;
    let newX = x;
    let newY = y;
    let newWidth = width;
    let newHeight = height;

    switch (handle) {
      case 'se':
        newWidth = Math.max(minSize, width + dx);
        newHeight = Math.max(minSize, height + dy);
        break;
      case 'e':
        newWidth = Math.max(minSize, width + dx);
        break;
      case 's':
        newHeight = Math.max(minSize, height + dy);
        break;
      case 'nw':
        newWidth = Math.max(minSize, width - dx);
        newHeight = Math.max(minSize, height - dy);
        newX = x + (width - newWidth);
        newY = y + (height - newHeight);
        break;
      case 'n':
        newHeight = Math.max(minSize, height - dy);
        newY = y + (height - newHeight);
        break;
      case 'w':
        newWidth = Math.max(minSize, width - dx);
        newX = x + (width - newWidth);
        break;
      case 'ne':
        newWidth = Math.max(minSize, width + dx);
        newHeight = Math.max(minSize, height - dy);
        newY = y + (height - newHeight);
        break;
      case 'sw':
        newWidth = Math.max(minSize, width - dx);
        newHeight = Math.max(minSize, height + dy);
        newX = x + (width - newWidth);
        break;
    }

    if (lockAspectRatio) {
      const size = Math.max(newWidth, newHeight);
      newWidth = size;
      newHeight = size;
    }

    return {
      ...node,
      transform: {
        ...node.transform,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      },
    };
  }

  /**
   * Flips a vector shape horizontally or vertically by toggling scaleX / scaleY.
   */
  public static flipShape(node: VectorNode, direction: 'horizontal' | 'vertical'): VectorNode {
    const scaleX = direction === 'horizontal' ? node.transform.scaleX * -1 : node.transform.scaleX;
    const scaleY = direction === 'vertical' ? node.transform.scaleY * -1 : node.transform.scaleY;

    return {
      ...node,
      transform: {
        ...node.transform,
        scaleX,
        scaleY,
      },
    };
  }

  /**
   * Rotates a vector shape by rotationDeg.
   */
  public static rotateShape(node: VectorNode, rotationDeg: number): VectorNode {
    return {
      ...node,
      transform: {
        ...node.transform,
        rotationDeg: (rotationDeg % 360 + 360) % 360,
      },
    };
  }

  /**
   * Computes bounding box of 1 or more selected shapes in document space.
   */
  public static computeSelectionBounds(nodes: VectorNode[]): BoundingBox2D | null {
    if (!nodes || nodes.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of nodes) {
      if (!node || typeof node !== 'object' || !node.transform) continue;
      const b = VectorGeometry.computeBoundingBox(node);
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width);
      maxY = Math.max(maxY, b.y + b.height);
    }

    if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
      return null;
    }

    return {
      x: minX,
      y: minY,
      width: Math.max(0, maxX - minX),
      height: Math.max(0, maxY - minY),
    };
  }

  /**
   * Scales shapes relative to selection center or custom transform origin.
   */
  public static scaleShapes(
    nodes: VectorNode[],
    scaleX: number,
    scaleY: number,
    origin?: { x: number; y: number },
    lockAspectRatio: boolean = false
  ): VectorNode[] {
    if (!nodes || nodes.length === 0) return [];

    let sx = Number.isFinite(scaleX) ? scaleX : 1.0;
    let sy = Number.isFinite(scaleY) ? scaleY : 1.0;

    // Safeguard near-zero scaling
    if (Math.abs(sx) < 1e-6) sx = 1e-6 * (sx < 0 ? -1 : 1);
    if (Math.abs(sy) < 1e-6) sy = 1e-6 * (sy < 0 ? -1 : 1);

    if (lockAspectRatio) {
      const maxS = Math.max(Math.abs(sx), Math.abs(sy));
      sx = maxS * (sx < 0 ? -1 : 1);
      sy = maxS * (sy < 0 ? -1 : 1);
    }

    const selBounds = origin ? null : VectorEditingEngine.computeSelectionBounds(nodes);
    const ox = origin ? origin.x : (selBounds ? selBounds.x + selBounds.width / 2 : 0);
    const oy = origin ? origin.y : (selBounds ? selBounds.y + selBounds.height / 2 : 0);

    return nodes.map((node) => {
      if (!node || typeof node !== 'object' || !node.transform) return node;

      const { x, y, width, height } = node.transform;
      const nx = ox + (x - ox) * sx;
      const ny = oy + (y - oy) * sy;
      const nw = Math.max(1e-6, width * Math.abs(sx));
      const nh = Math.max(1e-6, height * Math.abs(sy));

      return {
        ...node,
        transform: {
          ...node.transform,
          x: nx,
          y: ny,
          width: nw,
          height: nh,
        },
      };
    });
  }

  /**
   * Rotates shapes by angleDeg relative to selection center or custom transform origin.
   */
  public static rotateShapes(
    nodes: VectorNode[],
    angleDeg: number,
    origin?: { x: number; y: number }
  ): VectorNode[] {
    if (!nodes || nodes.length === 0) return [];

    const validAngle = Number.isFinite(angleDeg) ? angleDeg : 0;
    if (validAngle === 0) return [...nodes];

    const selBounds = origin ? null : VectorEditingEngine.computeSelectionBounds(nodes);
    const ox = origin ? origin.x : (selBounds ? selBounds.x + selBounds.width / 2 : 0);
    const oy = origin ? origin.y : (selBounds ? selBounds.y + selBounds.height / 2 : 0);

    const rad = validAngle * (Math.PI / 180);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    return nodes.map((node) => {
      if (!node || typeof node !== 'object' || !node.transform) return node;

      const { x, y, width, height, rotationDeg } = node.transform;
      // Center of shape bounding box
      const cx = x + width / 2;
      const cy = y + height / 2;

      // Rotate center point around origin (ox, oy)
      const dx = cx - ox;
      const dy = cy - oy;
      const rcx = ox + dx * cos - dy * sin;
      const rcy = oy + dx * sin + dy * cos;

      const newRot = ((rotationDeg + validAngle) % 360 + 360) % 360;

      return {
        ...node,
        transform: {
          ...node.transform,
          x: rcx - width / 2,
          y: rcy - height / 2,
          rotationDeg: newRot,
        },
      };
    });
  }

  /**
   * Applies composed translation, scaling, and rotation transformations.
   */
  public static transformShapesComposed(
    nodes: VectorNode[],
    delta: {
      dx?: number;
      dy?: number;
      scaleX?: number;
      scaleY?: number;
      rotateDeg?: number;
      origin?: { x: number; y: number };
      lockAspectRatio?: boolean;
    }
  ): VectorNode[] {
    if (!nodes || nodes.length === 0) return [];

    let result = nodes.filter(n => n && typeof n === 'object' && n.transform);

    if (delta.dx || delta.dy) {
      const dx = Number.isFinite(delta.dx) ? delta.dx! : 0;
      const dy = Number.isFinite(delta.dy) ? delta.dy! : 0;
      result = result.map(n => VectorEditingEngine.moveShape(n, dx, dy));
    }

    if (delta.scaleX !== undefined || delta.scaleY !== undefined) {
      const sx = delta.scaleX ?? 1.0;
      const sy = delta.scaleY ?? 1.0;
      result = VectorEditingEngine.scaleShapes(result, sx, sy, delta.origin, delta.lockAspectRatio);
    }

    if (delta.rotateDeg) {
      result = VectorEditingEngine.rotateShapes(result, delta.rotateDeg, delta.origin);
    }

    return result;
  }

  /**
   * Translates a vector shape by dx, dy.
   */
  public static moveShape(node: VectorNode, dx: number, dy: number): VectorNode {
    return {
      ...node,
      transform: {
        ...node.transform,
        x: node.transform.x + dx,
        y: node.transform.y + dy,
      },
    };
  }

  /**
   * Updates fill properties.
   */
  public static updateFill(node: VectorNode, fill: Partial<VectorFill>): VectorNode {
    return {
      ...node,
      fill: {
        ...(node.fill ?? { type: 'solid', color: '#000000', opacity: 1 }),
        ...fill,
      },
    };
  }

  /**
   * Updates stroke properties.
   */
  public static updateStroke(node: VectorNode, stroke: Partial<VectorStroke>): VectorNode {
    return {
      ...node,
      stroke: {
        ...(node.stroke ?? { color: '#000000', width: 1, opacity: 1 }),
        ...stroke,
      },
    };
  }

  /**
   * Updates corner radius for Rectangle shapes.
   */
  public static updateCornerRadius(node: VectorNode, radius: CornerRadius): VectorNode {
    if (node.type !== 'rectangle') return node;
    return {
      ...(node as RectangleNode),
      cornerRadius: radius,
    };
  }

  /**
   * Aligns multiple nodes relative to their overall bounding box.
   */
  public static alignShapes(nodes: VectorNode[], alignment: AlignmentType): VectorNode[] {
    if (nodes.length < 2) return [...nodes];

    // Compute bounding box of selection
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of nodes) {
      const b = VectorGeometry.computeBoundingBox(node);
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width);
      maxY = Math.max(maxY, b.y + b.height);
    }

    const totalWidth = maxX - minX;
    const totalHeight = maxY - minY;

    return nodes.map((node) => {
      const b = VectorGeometry.computeBoundingBox(node);
      let targetX = node.transform.x;
      let targetY = node.transform.y;

      switch (alignment) {
        case 'left':
          targetX = minX;
          break;
        case 'center':
          targetX = minX + (totalWidth - b.width) / 2;
          break;
        case 'right':
          targetX = maxX - b.width;
          break;
        case 'top':
          targetY = minY;
          break;
        case 'middle':
          targetY = minY + (totalHeight - b.height) / 2;
          break;
        case 'bottom':
          targetY = maxY - b.height;
          break;
      }

      return {
        ...node,
        transform: {
          ...node.transform,
          x: targetX,
          y: targetY,
        },
      };
    });
  }

  /**
   * Distributes multiple nodes evenly along axis.
   */
  public static distributeShapes(nodes: VectorNode[], axis: DistributionType): VectorNode[] {
    if (nodes.length < 3) return [...nodes];

    const sorted = [...nodes].sort((a, b) => {
      return axis === 'horizontal'
        ? a.transform.x - b.transform.x
        : a.transform.y - b.transform.y;
    });

    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    if (axis === 'horizontal') {
      const startPos = first.transform.x;
      const endPos = last.transform.x;
      const step = (endPos - startPos) / (sorted.length - 1);

      return sorted.map((node, index) => ({
        ...node,
        transform: {
          ...node.transform,
          x: startPos + index * step,
        },
      }));
    } else {
      const startPos = first.transform.y;
      const endPos = last.transform.y;
      const step = (endPos - startPos) / (sorted.length - 1);

      return sorted.map((node, index) => ({
        ...node,
        transform: {
          ...node.transform,
          y: startPos + index * step,
        },
      }));
    }
  }

  /**
   * Aligns nodes relative to canvas or artboard bounding box.
   */
  public static alignShapesToCanvas(
    nodes: VectorNode[],
    alignment: AlignmentType,
    canvasBounds: BoundingBox2D = { x: 0, y: 0, width: 1920, height: 1080 }
  ): VectorNode[] {
    if (!nodes || nodes.length === 0) return [];
    const cb = canvasBounds && Number.isFinite(canvasBounds.x) && Number.isFinite(canvasBounds.y) && Number.isFinite(canvasBounds.width) && Number.isFinite(canvasBounds.height)
      ? canvasBounds
      : { x: 0, y: 0, width: 1920, height: 1080 };

    return nodes.map((node) => {
      if (!node || typeof node !== 'object' || !node.transform) return node;
      const b = VectorGeometry.computeBoundingBox(node);
      let targetX = node.transform.x;
      let targetY = node.transform.y;

      switch (alignment) {
        case 'left':
          targetX = cb.x;
          break;
        case 'center':
          targetX = cb.x + (cb.width - b.width) / 2;
          break;
        case 'right':
          targetX = cb.x + cb.width - b.width;
          break;
        case 'top':
          targetY = cb.y;
          break;
        case 'middle':
          targetY = cb.y + (cb.height - b.height) / 2;
          break;
        case 'bottom':
          targetY = cb.y + cb.height - b.height;
          break;
      }

      return {
        ...node,
        transform: {
          ...node.transform,
          x: targetX,
          y: targetY,
        },
      };
    });
  }

  /**
   * Distributes multiple nodes sequentially along axis maintaining exact pixel gap spacing.
   */
  public static distributeShapesWithGap(
    nodes: VectorNode[],
    axis: DistributionType,
    gapPx: number = 20
  ): VectorNode[] {
    if (!nodes || nodes.length < 2) return nodes ? [...nodes] : [];
    const validGap = Number.isFinite(gapPx) ? gapPx : 20;

    const sorted = [...nodes].sort((a, b) => {
      const ax = a.transform?.x ?? 0;
      const bx = b.transform?.x ?? 0;
      const ay = a.transform?.y ?? 0;
      const by = b.transform?.y ?? 0;
      return axis === 'horizontal' ? ax - bx : ay - by;
    });

    const result: VectorNode[] = [];
    if (axis === 'horizontal') {
      let currentX = sorted[0].transform.x;
      for (let i = 0; i < sorted.length; i++) {
        const node = sorted[i];
        if (i === 0) {
          result.push(node);
        } else {
          const prevNode = result[i - 1];
          const prevBox = VectorGeometry.computeBoundingBox(prevNode);
          currentX = prevNode.transform.x + prevBox.width + validGap;
          result.push({
            ...node,
            transform: {
              ...node.transform,
              x: currentX,
            },
          });
        }
      }
    } else {
      let currentY = sorted[0].transform.y;
      for (let i = 0; i < sorted.length; i++) {
        const node = sorted[i];
        if (i === 0) {
          result.push(node);
        } else {
          const prevNode = result[i - 1];
          const prevBox = VectorGeometry.computeBoundingBox(prevNode);
          currentY = prevNode.transform.y + prevBox.height + validGap;
          result.push({
            ...node,
            transform: {
              ...node.transform,
              y: currentY,
            },
          });
        }
      }
    }

    return result;
  }

  /**
   * Arranges multiple nodes into a multi-column grid layout with custom column count and gaps.
   */
  public static arrangeShapesInGrid(
    nodes: VectorNode[],
    columns: number = 3,
    gapX: number = 20,
    gapY: number = 20,
    startPoint?: { x: number; y: number }
  ): VectorNode[] {
    if (!nodes || nodes.length === 0) return [];
    const validCols = Math.max(1, Math.floor(Number.isFinite(columns) ? columns : 3));
    const validGapX = Number.isFinite(gapX) ? gapX : 20;
    const validGapY = Number.isFinite(gapY) ? gapY : 20;

    const startX = startPoint && Number.isFinite(startPoint.x) ? startPoint.x : (nodes[0].transform?.x ?? 0);
    const startY = startPoint && Number.isFinite(startPoint.y) ? startPoint.y : (nodes[0].transform?.y ?? 0);

    const result: VectorNode[] = [];
    let currentX = startX;
    let currentY = startY;
    let currentRowMaxHeight = 0;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!node || typeof node !== 'object' || !node.transform) {
        continue;
      }
      const colIndex = i % validCols;

      if (colIndex === 0 && i > 0) {
        currentX = startX;
        currentY += currentRowMaxHeight + validGapY;
        currentRowMaxHeight = 0;
      }

      const box = VectorGeometry.computeBoundingBox(node);
      currentRowMaxHeight = Math.max(currentRowMaxHeight, box.height);

      const arrangedNode: VectorNode = {
        ...node,
        transform: {
          ...node.transform,
          x: currentX,
          y: currentY,
        },
      };
      result.push(arrangedNode);

      currentX += box.width + validGapX;
    }

    return result;
  }

  /**
   * Groups multiple nodes into a single ShapeGroupNode.
   */
  public static groupShapes(groupId: string, nodes: VectorNode[]): ShapeGroupNode {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of nodes) {
      const b = VectorGeometry.computeBoundingBox(node);
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width);
      maxY = Math.max(maxY, b.y + b.height);
    }

    const width = Math.max(10, maxX - minX);
    const height = Math.max(10, maxY - minY);

    return createShapeGroupNode(groupId, nodes, minX, minY, width, height);
  }

  /**
   * Ungroups a ShapeGroupNode into individual child VectorNodes.
   */
  public static ungroupShape(group: ShapeGroupNode): VectorNode[] {
    return group.children.map((child) => ({
      ...child,
      transform: {
        ...child.transform,
        x: child.transform.x + group.transform.x,
        y: child.transform.y + group.transform.y,
      },
    }));
  }

  /**
   * Reorders nodes within a list.
   */
  public static reorderShapes(nodes: VectorNode[], targetId: string, action: LayerReorderAction): VectorNode[] {
    const index = nodes.findIndex((n) => n.id === targetId);
    if (index === -1) return [...nodes];

    const result = [...nodes];
    const [target] = result.splice(index, 1);

    switch (action) {
      case 'bringToFront':
        result.push(target);
        break;
      case 'sendToBack':
        result.unshift(target);
        break;
      case 'bringForward':
        result.splice(Math.min(result.length, index + 1), 0, target);
        break;
      case 'sendBackward':
        result.splice(Math.max(0, index - 1), 0, target);
        break;
    }

    return result;
  }
}
