/**
 * VectorPenEngine.ts — Sprint G1-34 Path Pen Tool & Node Editing Engine
 *
 * Provides pure, headless functions for:
 * 1. Pen Tool interactive path creation & Bezier curve drawing sessions
 * 2. Path Node Editing (moving anchors/handles, node type conversion, inserting/deleting nodes)
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import {
  PathNode,
  VectorPathAnchor,
  VectorPathData,
  VectorNodeType,
  VectorFill,
  VectorStroke,
  createPathNode,
} from './VectorDomainModel';
import { VectorGeometry, Point2D } from './VectorGeometry';

export interface PenDrawingSession {
  readonly activePathId: string;
  readonly anchors: ReadonlyArray<VectorPathAnchor>;
  readonly closed: boolean;
  readonly previewPoint?: Point2D;
  readonly activeHandleIndex?: number;
}

export class VectorPenEngine {
  /**
   * Starts a new Pen Tool drawing session.
   */
  public static startPenSession(pathId?: string, initialPoint?: Point2D): PenDrawingSession {
    const id = pathId || `path_pen_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const anchors: VectorPathAnchor[] = [];

    if (initialPoint && Number.isFinite(initialPoint.x) && Number.isFinite(initialPoint.y)) {
      anchors.push({
        id: `anchor_0`,
        x: initialPoint.x,
        y: initialPoint.y,
        type: 'corner',
      });
    }

    return {
      activePathId: id,
      anchors,
      closed: false,
    };
  }

  /**
   * Adds an anchor point to an active Pen drawing session.
   */
  public static addAnchor(
    session: PenDrawingSession,
    point: Point2D,
    options?: {
      handleIn?: Point2D;
      handleOut?: Point2D;
      type?: VectorNodeType;
    }
  ): PenDrawingSession {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      return session;
    }

    const nextAnchors = [...session.anchors];
    const newAnchor: VectorPathAnchor = {
      id: `anchor_${nextAnchors.length}`,
      x: point.x,
      y: point.y,
      handleIn: options?.handleIn,
      handleOut: options?.handleOut,
      type: options?.type || 'corner',
    };

    nextAnchors.push(newAnchor);

    return {
      ...session,
      anchors: nextAnchors,
      activeHandleIndex: nextAnchors.length - 1,
    };
  }

  /**
   * Updates the transient mouse hover preview point during active Pen drawing.
   */
  public static updatePreviewPoint(session: PenDrawingSession, point: Point2D): PenDrawingSession {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      return session;
    }

    return {
      ...session,
      previewPoint: point,
    };
  }

  /**
   * Updates an anchor handle position during interactive click-drag creation or node editing.
   */
  public static updateAnchorHandle(
    session: PenDrawingSession,
    anchorIndex: number,
    handleType: 'in' | 'out',
    handlePos: Point2D,
    mode: VectorNodeType = 'smooth'
  ): PenDrawingSession {
    if (anchorIndex < 0 || anchorIndex >= session.anchors.length) {
      return session;
    }

    const anchors = [...session.anchors];
    const target = anchors[anchorIndex];

    let handleIn = target.handleIn;
    let handleOut = target.handleOut;

    if (handleType === 'out') {
      handleOut = handlePos;
      if (mode === 'smooth' || mode === 'symmetric') {
        const dx = handlePos.x - target.x;
        const dy = handlePos.y - target.y;
        if (mode === 'symmetric') {
          handleIn = { x: target.x - dx, y: target.y - dy };
        } else {
          // Smooth mode: mirror angle, preserve handleIn distance if it exists
          const distIn = handleIn ? Math.sqrt(Math.pow(handleIn.x - target.x, 2) + Math.pow(handleIn.y - target.y, 2)) : Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) + Math.PI;
          handleIn = {
            x: target.x + distIn * Math.cos(angle),
            y: target.y + distIn * Math.sin(angle),
          };
        }
      }
    } else {
      handleIn = handlePos;
      if (mode === 'smooth' || mode === 'symmetric') {
        const dx = handlePos.x - target.x;
        const dy = handlePos.y - target.y;
        if (mode === 'symmetric') {
          handleOut = { x: target.x - dx, y: target.y - dy };
        } else {
          const distOut = handleOut ? Math.sqrt(Math.pow(handleOut.x - target.x, 2) + Math.pow(handleOut.y - target.y, 2)) : Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) + Math.PI;
          handleOut = {
            x: target.x + distOut * Math.cos(angle),
            y: target.y + distOut * Math.sin(angle),
          };
        }
      }
    }

    anchors[anchorIndex] = {
      ...target,
      handleIn,
      handleOut,
      type: mode,
    };

    return {
      ...session,
      anchors,
    };
  }

  /**
   * Closes the active Pen drawing session path by connecting the last anchor back to the initial anchor.
   */
  public static closePenPath(session: PenDrawingSession): PenDrawingSession {
    if (session.anchors.length < 2) {
      return session;
    }

    return {
      ...session,
      closed: true,
      previewPoint: undefined,
    };
  }

  /**
   * Finishes an active Pen drawing session and produces a finalized PathNode DTO.
   */
  public static finishPenSession(
    session: PenDrawingSession,
    customFill?: Partial<VectorFill>,
    customStroke?: Partial<VectorStroke>
  ): { session: PenDrawingSession; pathNode: PathNode } {
    const pathData: VectorPathData = {
      anchors: session.anchors,
      closed: session.closed,
    };

    const d = VectorGeometry.pathDataToSvgPath(pathData);
    const bounds = VectorGeometry.computePathDataBounds(pathData);

    const pathNode = createPathNode(
      session.activePathId,
      d,
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
      customFill,
      customStroke,
      pathData
    );

    return {
      session: {
        ...session,
        previewPoint: undefined,
      },
      pathNode,
    };
  }

  // =========================================================================
  // NODE EDITING FUNCTIONS ON COMMITTED PathNode
  // =========================================================================

  /**
   * Moves an anchor point in an existing PathNode.
   */
  public static moveAnchorPoint(
    node: PathNode,
    anchorIndex: number,
    newPos: Point2D,
    moveHandles: boolean = true
  ): PathNode {
    if (node.type !== 'path' || !node.pathData || anchorIndex < 0 || anchorIndex >= node.pathData.anchors.length) {
      return node;
    }

    const anchors = [...node.pathData.anchors];
    const target = anchors[anchorIndex];

    const dx = newPos.x - target.x;
    const dy = newPos.y - target.y;

    let handleIn = target.handleIn;
    let handleOut = target.handleOut;

    if (moveHandles) {
      if (handleIn) {
        handleIn = { x: handleIn.x + dx, y: handleIn.y + dy };
      }
      if (handleOut) {
        handleOut = { x: handleOut.x + dx, y: handleOut.y + dy };
      }
    }

    anchors[anchorIndex] = {
      ...target,
      x: newPos.x,
      y: newPos.y,
      handleIn,
      handleOut,
    };

    const nextPathData: VectorPathData = {
      ...node.pathData,
      anchors,
    };

    const d = VectorGeometry.pathDataToSvgPath(nextPathData);
    const bounds = VectorGeometry.computePathDataBounds(nextPathData);

    return {
      ...node,
      d,
      transform: {
        ...node.transform,
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      },
      pathData: nextPathData,
    };
  }

  /**
   * Moves a control handle (handleIn / handleOut) of an anchor point in an existing PathNode.
   */
  public static moveControlHandle(
    node: PathNode,
    anchorIndex: number,
    handleType: 'in' | 'out',
    handlePos: Point2D,
    mode: VectorNodeType = 'smooth'
  ): PathNode {
    if (node.type !== 'path' || !node.pathData || anchorIndex < 0 || anchorIndex >= node.pathData.anchors.length) {
      return node;
    }

    const anchors = [...node.pathData.anchors];
    const target = anchors[anchorIndex];

    let handleIn = target.handleIn;
    let handleOut = target.handleOut;

    if (handleType === 'out') {
      handleOut = handlePos;
      if (mode === 'smooth' || mode === 'symmetric') {
        const dx = handlePos.x - target.x;
        const dy = handlePos.y - target.y;
        if (mode === 'symmetric') {
          handleIn = { x: target.x - dx, y: target.y - dy };
        } else {
          const distIn = handleIn ? Math.sqrt(Math.pow(handleIn.x - target.x, 2) + Math.pow(handleIn.y - target.y, 2)) : Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) + Math.PI;
          handleIn = {
            x: target.x + distIn * Math.cos(angle),
            y: target.y + distIn * Math.sin(angle),
          };
        }
      }
    } else {
      handleIn = handlePos;
      if (mode === 'smooth' || mode === 'symmetric') {
        const dx = handlePos.x - target.x;
        const dy = handlePos.y - target.y;
        if (mode === 'symmetric') {
          handleOut = { x: target.x - dx, y: target.y - dy };
        } else {
          const distOut = handleOut ? Math.sqrt(Math.pow(handleOut.x - target.x, 2) + Math.pow(handleOut.y - target.y, 2)) : Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) + Math.PI;
          handleOut = {
            x: target.x + distOut * Math.cos(angle),
            y: target.y + distOut * Math.sin(angle),
          };
        }
      }
    }

    anchors[anchorIndex] = {
      ...target,
      handleIn,
      handleOut,
      type: mode,
    };

    const nextPathData: VectorPathData = {
      ...node.pathData,
      anchors,
    };

    const d = VectorGeometry.pathDataToSvgPath(nextPathData);
    const bounds = VectorGeometry.computePathDataBounds(nextPathData);

    return {
      ...node,
      d,
      transform: {
        ...node.transform,
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      },
      pathData: nextPathData,
    };
  }

  /**
   * Converts a node between corner, smooth, and symmetric types.
   */
  public static convertNodeType(
    node: PathNode,
    anchorIndex: number,
    targetType: VectorNodeType
  ): PathNode {
    if (node.type !== 'path' || !node.pathData || anchorIndex < 0 || anchorIndex >= node.pathData.anchors.length) {
      return node;
    }

    const anchors = [...node.pathData.anchors];
    const target = anchors[anchorIndex];

    let handleIn = target.handleIn;
    let handleOut = target.handleOut;

    if (targetType === 'corner') {
      // Clear handles for sharp corner
      handleIn = undefined;
      handleOut = undefined;
    } else if (targetType === 'smooth' || targetType === 'symmetric') {
      // Create default horizontal handles if none exist
      if (!handleIn && !handleOut) {
        handleIn = { x: target.x - 20, y: target.y };
        handleOut = { x: target.x + 20, y: target.y };
      }
    }

    anchors[anchorIndex] = {
      ...target,
      handleIn,
      handleOut,
      type: targetType,
    };

    const nextPathData: VectorPathData = {
      ...node.pathData,
      anchors,
    };

    const d = VectorGeometry.pathDataToSvgPath(nextPathData);
    const bounds = VectorGeometry.computePathDataBounds(nextPathData);

    return {
      ...node,
      d,
      transform: {
        ...node.transform,
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      },
      pathData: nextPathData,
    };
  }

  /**
   * Adds a new anchor node into an existing segment index.
   */
  public static addNodeToSegment(
    node: PathNode,
    segmentIndex: number,
    t: number = 0.5
  ): PathNode {
    if (node.type !== 'path' || !node.pathData || node.pathData.anchors.length < 2) {
      return node;
    }

    const anchors = [...node.pathData.anchors];
    if (segmentIndex < 0 || segmentIndex >= anchors.length) {
      return node;
    }

    const p1 = anchors[segmentIndex];
    const p2 = anchors[(segmentIndex + 1) % anchors.length];

    // Midpoint interpolation
    const newX = p1.x + (p2.x - p1.x) * t;
    const newY = p1.y + (p2.y - p1.y) * t;

    const newAnchor: VectorPathAnchor = {
      id: `anchor_inserted_${Date.now().toString(36)}`,
      x: newX,
      y: newY,
      type: 'corner',
    };

    anchors.splice(segmentIndex + 1, 0, newAnchor);

    const nextPathData: VectorPathData = {
      ...node.pathData,
      anchors,
    };

    const d = VectorGeometry.pathDataToSvgPath(nextPathData);
    const bounds = VectorGeometry.computePathDataBounds(nextPathData);

    return {
      ...node,
      d,
      transform: {
        ...node.transform,
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      },
      pathData: nextPathData,
    };
  }

  /**
   * Removes an anchor node from a PathNode while preserving valid path structure.
   */
  public static deleteNodeFromPath(node: PathNode, anchorIndex: number): PathNode {
    if (node.type !== 'path' || !node.pathData || anchorIndex < 0 || anchorIndex >= node.pathData.anchors.length) {
      return node;
    }

    const anchors = [...node.pathData.anchors];
    anchors.splice(anchorIndex, 1);

    if (anchors.length === 0) {
      return {
        ...node,
        d: '',
        pathData: { anchors: [], closed: false },
      };
    }

    const nextPathData: VectorPathData = {
      ...node.pathData,
      anchors,
      closed: anchors.length < 3 ? false : node.pathData.closed,
    };

    const d = VectorGeometry.pathDataToSvgPath(nextPathData);
    const bounds = VectorGeometry.computePathDataBounds(nextPathData);

    return {
      ...node,
      d,
      transform: {
        ...node.transform,
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      },
      pathData: nextPathData,
    };
  }
}
