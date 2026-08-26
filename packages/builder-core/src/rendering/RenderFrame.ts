/**
 * RenderFrame.ts — Sprint S10 Real Rendering Engine Core
 *
 * Represents an evaluated, computed immutable frame output DTO.
 * NO React, NO Browser API. Deterministic structure.
 */

export interface RenderBoundingBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export type Matrix3D = readonly [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number
];

export const IDENTITY_MATRIX_3D: Matrix3D = [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
];

export interface RenderNodeState {
  readonly nodeId: string;
  readonly parentId?: string;
  readonly type: string;
  readonly order: number;
  readonly computedProps: Record<string, unknown>;
  readonly transformMatrix: Matrix3D;
  readonly opacity: number;
  readonly visible: boolean;
  readonly bounds: RenderBoundingBox;
  readonly isDirty: boolean;
}

export interface RenderFrame {
  readonly id: string;
  readonly contextId: string;
  readonly frameIndex: number;
  readonly timestampMs: number;
  readonly renderTimeMs: number;
  readonly nodes: ReadonlyMap<string, RenderNodeState>;
  readonly nodeOrder: ReadonlyArray<string>;
  readonly dirtyRegions: ReadonlyArray<RenderBoundingBox>;
  readonly isCached: boolean;
}

export function createEmptyRenderFrame(
  contextId: string,
  frameIndex: number,
  timestampMs: number
): RenderFrame {
  return {
    id: `frame_${frameIndex}_${timestampMs}`,
    contextId,
    frameIndex,
    timestampMs,
    renderTimeMs: 0,
    nodes: new Map(),
    nodeOrder: [],
    dirtyRegions: [],
    isCached: false,
  };
}

export function combineBoundingBoxes(boxes: ReadonlyArray<RenderBoundingBox>): RenderBoundingBox {
  if (boxes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const box of boxes) {
    if (box.width === 0 && box.height === 0) continue;
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  }

  if (minX === Infinity) return { x: 0, y: 0, width: 0, height: 0 };

  return {
    x: minX,
    y: minY,
    width: Math.max(0, maxX - minX),
    height: Math.max(0, maxY - minY),
  };
}
