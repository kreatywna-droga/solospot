/**
 * CanvasTransformGizmo.ts — Sprint S14 Canvas Transform Gizmo Engine
 *
 * Provides pure mathematical calculations for 2D Canvas Object Manipulation:
 * Translate, Scale, Rotate, Resize, Multi-Selection bounding boxes, Alignment, and Snapping.
 * Reuses S13 Transform2DAnimation matrix structures.
 */

export interface RectBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly rotationDeg: number;
}

export type HandleType =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'rotation';

export interface TransformHandle {
  readonly type: HandleType;
  readonly x: number;
  readonly y: number;
  readonly cursor: string;
}

export interface AlignmentOptions {
  readonly mode: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
}

export class CanvasTransformGizmo {
  /**
   * Computes aggregated bounding box surrounding multiple node bounds.
   */
  public static computeMultiSelectionBounds(boundsList: readonly RectBounds[]): RectBounds {
    if (boundsList.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0, rotationDeg: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const b of boundsList) {
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width);
      maxY = Math.max(maxY, b.y + b.height);
    }

    return {
      x: minX,
      y: minY,
      width: Math.max(0, maxX - minX),
      height: Math.max(0, maxY - minY),
      rotationDeg: 0,
    };
  }

  /**
   * Generates 8 scale handles plus 1 rotation handle for a bounding box.
   */
  public static generateHandles(bounds: RectBounds): TransformHandle[] {
    const { x, y, width, height } = bounds;

    return [
      { type: 'top-left', x, y, cursor: 'nwse-resize' },
      { type: 'top-center', x: x + width / 2, y, cursor: 'ns-resize' },
      { type: 'top-right', x: x + width, y, cursor: 'nesw-resize' },
      { type: 'middle-left', x, y: y + height / 2, cursor: 'ew-resize' },
      { type: 'middle-right', x: x + width, y: y + height / 2, cursor: 'ew-resize' },
      { type: 'bottom-left', x, y: y + height, cursor: 'nesw-resize' },
      { type: 'bottom-center', x: x + width / 2, y: y + height, cursor: 'ns-resize' },
      { type: 'bottom-right', x: x + width, y: y + height, cursor: 'nwse-resize' },
      { type: 'rotation', x: x + width / 2, y: y - 25, cursor: 'grab' },
    ];
  }

  /**
   * Translates bounds by pixel delta (dx, dy) with optional grid snapping.
   */
  public static translate(bounds: RectBounds, dx: number, dy: number, gridSize: number = 0): RectBounds {
    let newX = bounds.x + dx;
    let newY = bounds.y + dy;

    if (gridSize > 0) {
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
    }

    return {
      ...bounds,
      x: newX,
      y: newY,
    };
  }

  /**
   * Scales bounds using a transform handle type and mouse displacement.
   */
  public static scale(bounds: RectBounds, handle: HandleType, dx: number, dy: number): RectBounds {
    let { x, y, width, height } = bounds;

    switch (handle) {
      case 'bottom-right':
        width = Math.max(10, width + dx);
        height = Math.max(10, height + dy);
        break;
      case 'bottom-center':
        height = Math.max(10, height + dy);
        break;
      case 'middle-right':
        width = Math.max(10, width + dx);
        break;
      case 'top-left':
        width = Math.max(10, width - dx);
        height = Math.max(10, height - dy);
        x += dx;
        y += dy;
        break;
      case 'top-center':
        height = Math.max(10, height - dy);
        y += dy;
        break;
    }

    return { ...bounds, x, y, width, height };
  }

  /**
   * Rotates bounds relative to center pivot.
   */
  public static rotate(bounds: RectBounds, mouseX: number, mouseY: number): RectBounds {
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    const rad = Math.atan2(mouseY - centerY, mouseX - centerX);
    let deg = Math.round((rad * 180) / Math.PI);
    if (deg < 0) deg += 360;

    return {
      ...bounds,
      rotationDeg: deg,
    };
  }

  /**
   * Aligns multiple rect bounds according to alignment mode.
   */
  public static alignBounds(boundsList: readonly RectBounds[], mode: AlignmentOptions['mode']): RectBounds[] {
    if (boundsList.length <= 1) return [...boundsList];
    const container = this.computeMultiSelectionBounds(boundsList);

    return boundsList.map((b) => {
      switch (mode) {
        case 'left':
          return { ...b, x: container.x };
        case 'center':
          return { ...b, x: container.x + container.width / 2 - b.width / 2 };
        case 'right':
          return { ...b, x: container.x + container.width - b.width };
        case 'top':
          return { ...b, y: container.y };
        case 'middle':
          return { ...b, y: container.y + container.height / 2 - b.height / 2 };
        case 'bottom':
          return { ...b, y: container.y + container.height - b.height };
        default:
          return b;
      }
    });
  }

  /**
   * Snaps position to grid lines or guide coordinates.
   */
  public static snapToGrid(value: number, gridSize: number = 10, threshold: number = 5): { value: number; snapped: boolean } {
    const remainder = value % gridSize;
    if (remainder < threshold) {
      return { value: value - remainder, snapped: true };
    } else if (gridSize - remainder < threshold) {
      return { value: value + (gridSize - remainder), snapped: true };
    }
    return { value, snapped: false };
  }
}
