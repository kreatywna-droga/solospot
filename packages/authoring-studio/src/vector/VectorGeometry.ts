/**
 * VectorGeometry.ts — Sprint S18 Vector Geometry Engine (ETAP 3)
 *
 * Headless geometric calculations:
 * - bounding box computations & stroke bounds expansion
 * - transform matrix & point transformations
 * - regular polygon & star geometry generation
 * - SVG path parsing, command extraction, path length & sampling
 * - point-in-shape and bounding box intersection tests
 * - aspect ratio locking and dimension constraints
 *
 * NO DOM, NO Canvas API, pure TypeScript mathematics.
 */

import {
  VectorNode,
  VectorTransform,
  VectorStroke,
  PathCommandDTO,
  PolygonNode,
  RectangleNode,
  EllipseNode,
  LineNode,
  PathNode,
  ShapeGroupNode,
  VectorPathAnchor,
  VectorPathData,
} from './VectorDomainModel';

export interface Point2D {
  readonly x: number;
  readonly y: number;
}

export interface BoundingBox2D {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export interface HandlePosition2D {
  readonly handle: ResizeHandle;
  readonly x: number;
  readonly y: number;
}

export class VectorGeometry {
  /**
   * Normalizes a VectorTransform DTO, ensuring non-negative dimensions and finite numbers.
   */
  public static normalizeTransform(transform: VectorTransform): VectorTransform {
    const x = typeof transform.x === 'number' && Number.isFinite(transform.x) ? transform.x : 0;
    const y = typeof transform.y === 'number' && Number.isFinite(transform.y) ? transform.y : 0;
    const width = typeof transform.width === 'number' && Number.isFinite(transform.width) ? Math.max(0, transform.width) : 0;
    const height = typeof transform.height === 'number' && Number.isFinite(transform.height) ? Math.max(0, transform.height) : 0;
    const rotationDeg = typeof transform.rotationDeg === 'number' && Number.isFinite(transform.rotationDeg) ? transform.rotationDeg : 0;
    const scaleX = typeof transform.scaleX === 'number' && Number.isFinite(transform.scaleX) ? transform.scaleX : 1;
    const scaleY = typeof transform.scaleY === 'number' && Number.isFinite(transform.scaleY) ? transform.scaleY : 1;
    const skewX = typeof transform.skewX === 'number' && Number.isFinite(transform.skewX) ? transform.skewX : 0;
    const skewY = typeof transform.skewY === 'number' && Number.isFinite(transform.skewY) ? transform.skewY : 0;

    return { x, y, width, height, rotationDeg, scaleX, scaleY, skewX, skewY };
  }

  /**
   * Validates whether a node has finite coordinates and valid non-zero dimensions.
   */
  public static isValidNodeGeometry(node: VectorNode): boolean {
    if (!node || typeof node !== 'object') return false;
    const t = node.transform;
    if (!t) return false;

    return (
      Number.isFinite(t.x) &&
      Number.isFinite(t.y) &&
      Number.isFinite(t.width) &&
      Number.isFinite(t.height) &&
      t.width >= 0 &&
      t.height >= 0
    );
  }

  /**
   * Applies transform (translation, scaling, rotation) to a point in local space.
   */
  public static applyTransform(point: Point2D, transform: VectorTransform): Point2D {
    // 1. Scale
    let px = point.x * transform.scaleX;
    let py = point.y * transform.scaleY;

    // 2. Skew
    if (transform.skewX !== 0 || transform.skewY !== 0) {
      const radX = (transform.skewX * Math.PI) / 180;
      const radY = (transform.skewY * Math.PI) / 180;
      const newPx = px + py * Math.tan(radX);
      const newPy = py + px * Math.tan(radY);
      px = newPx;
      py = newPy;
    }

    // 3. Rotation around origin (0,0) or center
    if (transform.rotationDeg !== 0) {
      const rad = (transform.rotationDeg * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const rx = px * cos - py * sin;
      const ry = px * sin + py * cos;
      px = rx;
      py = ry;
    }

    // 4. Translate
    return {
      x: px + transform.x,
      y: py + transform.y,
    };
  }

  /**
   * Computes outer stroke expansion bounding box.
   */
  public static computeStrokeBounds(transform: VectorTransform, stroke?: VectorStroke): BoundingBox2D {
    const strokePadding = stroke && stroke.width > 0 ? stroke.width / 2 : 0;
    return {
      x: transform.x - strokePadding,
      y: transform.y - strokePadding,
      width: transform.width + strokePadding * 2,
      height: transform.height + strokePadding * 2,
    };
  }

  /**
   * Computes full axis-aligned bounding box for any VectorNode.
   */
  public static computeBoundingBox(node: VectorNode): BoundingBox2D {
    if (node.type === 'group') {
      const groupNode = node as ShapeGroupNode;
      if (groupNode.children.length === 0) {
        return VectorGeometry.computeStrokeBounds(node.transform, node.stroke);
      }
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const child of groupNode.children) {
        const childBounds = VectorGeometry.computeBoundingBox(child);
        minX = Math.min(minX, childBounds.x);
        minY = Math.min(minY, childBounds.y);
        maxX = Math.max(maxX, childBounds.x + childBounds.width);
        maxY = Math.max(maxY, childBounds.y + childBounds.height);
      }

      return {
        x: minX,
        y: minY,
        width: Math.max(1, maxX - minX),
        height: Math.max(1, maxY - minY),
      };
    }

    if (node.type === 'line') {
      const line = node as LineNode;
      const minX = Math.min(line.x1, line.x2);
      const minY = Math.min(line.y1, line.y2);
      const width = Math.max(1, Math.abs(line.x2 - line.x1));
      const height = Math.max(1, Math.abs(line.y2 - line.y1));
      return VectorGeometry.computeStrokeBounds(
        { ...node.transform, x: minX, y: minY, width, height },
        node.stroke
      );
    }

    return VectorGeometry.computeStrokeBounds(node.transform, node.stroke);
  }

  /**
   * Generates vertices for regular polygons or star polygons.
   */
  public static polygonGeometry(
    sides: number,
    radius: number,
    center: Point2D = { x: radius, y: radius },
    starRatio?: number
  ): Point2D[] {
    const points: Point2D[] = [];
    const count = starRatio && starRatio > 0 ? sides * 2 : sides;
    const angleStep = (2 * Math.PI) / count;
    const startAngle = -Math.PI / 2; // Pointing upwards

    for (let i = 0; i < count; i++) {
      const angle = startAngle + i * angleStep;
      const r = starRatio && starRatio > 0 && i % 2 !== 0 ? radius * starRatio : radius;
      points.push({
        x: center.x + r * Math.cos(angle),
        y: center.y + r * Math.sin(angle),
      });
    }

    return points;
  }

  /**
   * Parses SVG Path string into command DTOs.
   */
  public static parsePathGeometry(pathD: string): PathCommandDTO[] {
    const commands: PathCommandDTO[] = [];
    const regex = /([MLCQAZmlcqaz])([^MLCQAZmlcqaz]*)/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(pathD)) !== null) {
      const type = match[1].toUpperCase() as 'M' | 'L' | 'C' | 'Q' | 'A' | 'Z';
      const argsString = match[2].trim();
      const args = argsString.length > 0
        ? argsString.split(/[\s,]+/).map((v) => parseFloat(v)).filter((v) => !isNaN(v))
        : [];
      commands.push({ type, args });
    }

    return commands;
  }

  /**
   * Computes approximate path length from path commands.
   */
  public static computePathLength(pathD: string): number {
    const commands = VectorGeometry.parsePathGeometry(pathD);
    let totalLength = 0;
    let currentPoint: Point2D = { x: 0, y: 0 };
    let startPoint: Point2D = { x: 0, y: 0 };

    for (const cmd of commands) {
      switch (cmd.type) {
        case 'M':
          if (cmd.args.length >= 2) {
            currentPoint = { x: cmd.args[0], y: cmd.args[1] };
            startPoint = { ...currentPoint };
          }
          break;

        case 'L':
          if (cmd.args.length >= 2) {
            const nextPoint = { x: cmd.args[0], y: cmd.args[1] };
            const dx = nextPoint.x - currentPoint.x;
            const dy = nextPoint.y - currentPoint.y;
            totalLength += Math.sqrt(dx * dx + dy * dy);
            currentPoint = nextPoint;
          }
          break;

        case 'C':
          if (cmd.args.length >= 6) {
            // Straight-line chord approximation for cubic bezier
            const endPoint = { x: cmd.args[4], y: cmd.args[5] };
            const dx = endPoint.x - currentPoint.x;
            const dy = endPoint.y - currentPoint.y;
            totalLength += Math.sqrt(dx * dx + dy * dy);
            currentPoint = endPoint;
          }
          break;

        case 'Z':
          const dx = startPoint.x - currentPoint.x;
          const dy = startPoint.y - currentPoint.y;
          totalLength += Math.sqrt(dx * dx + dy * dy);
          currentPoint = { ...startPoint };
          break;
      }
    }

    return Math.max(0, totalLength);
  }

  /**
   * Tests if a point lies inside a shape's bounding area.
   */
  public static pointInShape(point: Point2D, node: VectorNode): boolean {
    const bounds = VectorGeometry.computeBoundingBox(node);
    if (
      point.x < bounds.x ||
      point.x > bounds.x + bounds.width ||
      point.y < bounds.y ||
      point.y > bounds.y + bounds.height
    ) {
      return false;
    }

    // Specialized point-in-ellipse check
    if (node.type === 'ellipse') {
      const cx = node.transform.x + node.transform.width / 2;
      const cy = node.transform.y + node.transform.height / 2;
      const rx = node.transform.width / 2;
      const ry = node.transform.height / 2;
      if (rx <= 0 || ry <= 0) return false;
      const normX = (point.x - cx) / rx;
      const normY = (point.y - cy) / ry;
      return normX * normX + normY * normY <= 1;
    }

    return true;
  }

  /**
   * Tests if two shape bounding boxes intersect.
   */
  public static checkShapeIntersection(nodeA: VectorNode, nodeB: VectorNode): boolean {
    const bA = VectorGeometry.computeBoundingBox(nodeA);
    const bB = VectorGeometry.computeBoundingBox(nodeB);

    return !(
      bA.x + bA.width < bB.x ||
      bB.x + bB.width < bA.x ||
      bA.y + bA.height < bB.y ||
      bB.y + bB.height < bA.y
    );
  }

  /**
   * Applies aspect ratio lock and min/max constraints to width and height.
   */
  public static applyShapeConstraints(
    width: number,
    height: number,
    lockAspectRatio: boolean,
    minSize: number = 10
  ): { width: number; height: number } {
    const clampedW = Math.max(minSize, width);
    const clampedH = Math.max(minSize, height);

    if (lockAspectRatio) {
      const size = Math.max(clampedW, clampedH);
      return { width: size, height: size };
    }

    return { width: clampedW, height: clampedH };
  }

  /**
   * Computes the 8 handle positions for a given bounding box.
   */
  public static getResizeHandlePositions(bounds: BoundingBox2D): HandlePosition2D[] {
    const { x, y, width, height } = bounds;
    const midX = x + width / 2;
    const midY = y + height / 2;

    return [
      { handle: 'nw', x, y },
      { handle: 'n', x: midX, y },
      { handle: 'ne', x: x + width, y },
      { handle: 'e', x: x + width, y: midY },
      { handle: 'se', x: x + width, y: y + height },
      { handle: 's', x: midX, y: y + height },
      { handle: 'sw', x, y: y + height },
      { handle: 'w', x, y: midY },
    ];
  }

  /**
   * Tests if a point hits any of the 8 resize handle square regions.
   */
  public static hitTestResizeHandles(
    point: Point2D,
    bounds: BoundingBox2D,
    handleSize: number = 8
  ): ResizeHandle | null {
    const handles = VectorGeometry.getResizeHandlePositions(bounds);
    const halfSize = handleSize / 2;

    for (const h of handles) {
      if (
        point.x >= h.x - halfSize &&
        point.x <= h.x + halfSize &&
        point.y >= h.y - halfSize &&
        point.y <= h.y + halfSize
      ) {
        return h.handle;
      }
    }

    return null;
  }

  /**
   * Computes a normalized bounding box given two arbitrary points (handles reverse drag).
   */
  public static normalizeRect(p1: Point2D, p2: Point2D): BoundingBox2D {
    const minX = Math.min(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const width = Math.abs(p2.x - p1.x);
    const height = Math.abs(p2.y - p1.y);

    return {
      x: Number.isFinite(minX) ? minX : 0,
      y: Number.isFinite(minY) ? minY : 0,
      width: Number.isFinite(width) ? Math.max(0, width) : 0,
      height: Number.isFinite(height) ? Math.max(0, height) : 0,
    };
  }

  /**
   * Checks if two 2D bounding boxes intersect (partial or full overlap).
   */
  public static rectIntersectsRect(a: BoundingBox2D, b: BoundingBox2D): boolean {
    return !(
      a.x + a.width < b.x ||
      b.x + b.width < a.x ||
      a.y + a.height < b.y ||
      b.y + b.height < a.y
    );
  }

  /**
   * Checks if a container bounding box fully encloses a target bounding box.
   */
  public static rectContainsRect(container: BoundingBox2D, target: BoundingBox2D): boolean {
    return (
      target.x >= container.x &&
      target.y >= container.y &&
      target.x + target.width <= container.x + container.width &&
      target.y + target.height <= container.y + container.height
    );
  }

  /**
   * Tests if a node intersects (or is contained inside) a marquee selection rectangle.
   */
  public static nodeIntersectsMarquee(
    node: VectorNode,
    marqueeBounds: BoundingBox2D,
    mode: 'intersect' | 'contain' = 'intersect'
  ): boolean {
    if (!node || !VectorGeometry.isValidNodeGeometry(node)) {
      return false;
    }

    const nodeBounds = VectorGeometry.computeBoundingBox(node);

    if (mode === 'contain') {
      return VectorGeometry.rectContainsRect(marqueeBounds, nodeBounds);
    }

    return VectorGeometry.rectIntersectsRect(marqueeBounds, nodeBounds);
  }

  /**
   * Converts structured VectorPathData into a deterministic SVG Path string (d).
   */
  public static pathDataToSvgPath(pathData: VectorPathData): string {
    if (!pathData || !pathData.anchors || pathData.anchors.length === 0) {
      return '';
    }

    const parts: string[] = [];
    const anchors = pathData.anchors;

    // First point
    parts.push(`M ${anchors[0].x} ${anchors[0].y}`);

    for (let i = 1; i < anchors.length; i++) {
      const prev = anchors[i - 1];
      const curr = anchors[i];

      const hasPrevOut = !!prev.handleOut && Number.isFinite(prev.handleOut.x) && Number.isFinite(prev.handleOut.y);
      const hasCurrIn = !!curr.handleIn && Number.isFinite(curr.handleIn.x) && Number.isFinite(curr.handleIn.y);

      if (hasPrevOut || hasCurrIn) {
        const cp1x = hasPrevOut ? prev.handleOut!.x : prev.x;
        const cp1y = hasPrevOut ? prev.handleOut!.y : prev.y;
        const cp2x = hasCurrIn ? curr.handleIn!.x : curr.x;
        const cp2y = hasCurrIn ? curr.handleIn!.y : curr.y;
        parts.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${curr.x} ${curr.y}`);
      } else {
        parts.push(`L ${curr.x} ${curr.y}`);
      }
    }

    if (pathData.closed && anchors.length > 1) {
      const last = anchors[anchors.length - 1];
      const first = anchors[0];
      const hasLastOut = !!last.handleOut && Number.isFinite(last.handleOut.x) && Number.isFinite(last.handleOut.y);
      const hasFirstIn = !!first.handleIn && Number.isFinite(first.handleIn.x) && Number.isFinite(first.handleIn.y);

      if (hasLastOut || hasFirstIn) {
        const cp1x = hasLastOut ? last.handleOut!.x : last.x;
        const cp1y = hasLastOut ? last.handleOut!.y : last.y;
        const cp2x = hasFirstIn ? first.handleIn!.x : first.x;
        const cp2y = hasFirstIn ? first.handleIn!.y : first.y;
        parts.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${first.x} ${first.y} Z`);
      } else {
        parts.push('Z');
      }
    }

    return parts.join(' ');
  }

  /**
   * Computes the bounding box of a structured VectorPathData set.
   */
  public static computePathDataBounds(pathData: VectorPathData): BoundingBox2D {
    if (!pathData || !pathData.anchors || pathData.anchors.length === 0) {
      return { x: 0, y: 0, width: 100, height: 100 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const a of pathData.anchors) {
      const pts: Point2D[] = [{ x: a.x, y: a.y }];
      if (a.handleIn) pts.push(a.handleIn);
      if (a.handleOut) pts.push(a.handleOut);

      for (const p of pts) {
        if (Number.isFinite(p.x) && Number.isFinite(p.y)) {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
        }
      }
    }

    if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
      return { x: 0, y: 0, width: 100, height: 100 };
    }

    return {
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
    };
  }

  /**
   * Converts SVG Path string d into structured VectorPathData anchors.
   */
  public static svgPathToPathData(pathD: string): VectorPathData {
    const commands = VectorGeometry.parsePathGeometry(pathD);
    const anchors: VectorPathAnchor[] = [];
    let closed = false;
    let anchorIdx = 0;

    for (const cmd of commands) {
      if (cmd.type === 'M' && cmd.args.length >= 2) {
        anchors.push({
          id: `node_${anchorIdx++}`,
          x: cmd.args[0],
          y: cmd.args[1],
          type: 'corner',
        });
      } else if (cmd.type === 'L' && cmd.args.length >= 2) {
        anchors.push({
          id: `node_${anchorIdx++}`,
          x: cmd.args[0],
          y: cmd.args[1],
          type: 'corner',
        });
      } else if (cmd.type === 'C' && cmd.args.length >= 6) {
        const cp1 = { x: cmd.args[0], y: cmd.args[1] };
        const cp2 = { x: cmd.args[2], y: cmd.args[3] };
        const end = { x: cmd.args[4], y: cmd.args[5] };

        if (anchors.length > 0) {
          const lastIdx = anchors.length - 1;
          anchors[lastIdx] = {
            ...anchors[lastIdx],
            handleOut: cp1,
          };
        }

        anchors.push({
          id: `node_${anchorIdx++}`,
          x: end.x,
          y: end.y,
          handleIn: cp2,
          type: 'smooth',
        });
      } else if (cmd.type === 'Z') {
        closed = true;
      }
    }

    return { anchors, closed };
  }
}

