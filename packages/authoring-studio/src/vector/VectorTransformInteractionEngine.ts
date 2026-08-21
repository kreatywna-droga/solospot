/**
 * VectorTransformInteractionEngine.ts — Sprint G1-41 Transform Interaction Engine (Night Shift Level 3)
 *
 * Implements interactive transform session geometry math, handle dragging (8 resize handles, rotation, origin),
 * viewport coordinate conversion, real-time snapping integration, and transient state isolation.
 *
 * Pure headless TS engine, NO DOM, NO React, ZERO Browser APIs.
 */

import { VectorNode } from './VectorDomainModel';
import { BoundingBox2D, Point2D } from './VectorGeometry';
import { VectorEditingEngine } from './VectorEditingEngine';
import { VectorSnappingEngine, SnappingOptions, GuideLine, SnapResult } from './VectorSnappingEngine';
import { VectorDocumentSnapshot } from './VectorWorkspaceController';
import { VectorViewportState, viewportToCanvasPoint } from './VectorViewportController';

export type TransformHandleType =
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w'
  | 'rot'
  | 'origin';

export interface TransformPointerEvent {
  x: number;
  y: number;
  altKey?: boolean;
  shiftKey?: boolean;
}

export interface TransformSession {
  readonly sessionId: string;
  readonly initialSnapshot: VectorDocumentSnapshot;
  readonly currentSnapshot: VectorDocumentSnapshot;
  readonly handle: TransformHandleType;
  readonly startPointerScreen: Point2D;
  readonly startPointerCanvas: Point2D;
  readonly initialSelectionBounds: BoundingBox2D;
  readonly transformOrigin: Point2D;
  readonly activeGuideLines: ReadonlyArray<GuideLine>;
}

export interface TransformSessionOptions extends SnappingOptions {
  lockAspectRatio?: boolean;
  centerOriginScaling?: boolean;
  shiftKey?: boolean;
}

export class VectorTransformInteractionEngine {
  /**
   * Starts a new interactive transform session.
   */
  public static startSession(
    snapshot: VectorDocumentSnapshot,
    handle: TransformHandleType,
    pointerScreen: Point2D,
    viewport?: VectorViewportState
  ): TransformSession | null {
    if (!snapshot || !Array.isArray(snapshot.selectedIds) || snapshot.selectedIds.length === 0) {
      return null;
    }

    const selectedNodes = snapshot.nodes.filter(n => snapshot.selectedIds.includes(n.id) && !n.locked);
    if (selectedNodes.length === 0) return null;

    const bounds = VectorEditingEngine.computeSelectionBounds(selectedNodes);
    if (!bounds || !Number.isFinite(bounds.x) || !Number.isFinite(bounds.y)) return null;

    const canvasPointer = viewport
      ? viewportToCanvasPoint(pointerScreen, viewport)
      : { x: pointerScreen.x, y: pointerScreen.y };

    const origin: Point2D = {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    };

    return {
      sessionId: `ts_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      initialSnapshot: snapshot,
      currentSnapshot: snapshot,
      handle,
      startPointerScreen: { ...pointerScreen },
      startPointerCanvas: canvasPointer,
      initialSelectionBounds: bounds,
      transformOrigin: origin,
      activeGuideLines: [],
    };
  }

  /**
   * Updates an active transform session with current pointer coordinates and options.
   */
  public static updateSession(
    session: TransformSession,
    pointerScreen: Point2D,
    viewport?: VectorViewportState,
    options: TransformSessionOptions = {}
  ): TransformSession {
    if (!session || !session.initialSnapshot) return session;

    try {
      const currentCanvasPointer = viewport
        ? viewportToCanvasPoint(pointerScreen, viewport)
        : { x: pointerScreen.x, y: pointerScreen.y };

      const deltaX = currentCanvasPointer.x - session.startPointerCanvas.x;
      const deltaY = currentCanvasPointer.y - session.startPointerCanvas.y;

      const { initialSnapshot, handle, initialSelectionBounds, transformOrigin } = session;
      const selectedNodes = initialSnapshot.nodes.filter(n => initialSnapshot.selectedIds.includes(n.id) && !n.locked);

      if (selectedNodes.length === 0) return session;

      let nextNodes: VectorNode[] = [...initialSnapshot.nodes];
      let guides: GuideLine[] = [];

      if (handle === 'rot') {
        // Rotation Handle Calculation
        const startRad = Math.atan2(session.startPointerCanvas.y - transformOrigin.y, session.startPointerCanvas.x - transformOrigin.x);
        const currentRad = Math.atan2(currentCanvasPointer.y - transformOrigin.y, currentCanvasPointer.x - transformOrigin.x);
        let angleDeg = (currentRad - startRad) * (180 / Math.PI);

        if (options.shiftKey) {
          // Snap rotation to 15-degree increments
          angleDeg = Math.round(angleDeg / 15) * 15;
        }

        const rotatedSelected = VectorEditingEngine.rotateShapes(selectedNodes, angleDeg, transformOrigin);
        const rotatedMap = new Map(rotatedSelected.map(n => [n.id, n]));

        nextNodes = initialSnapshot.nodes.map(n => rotatedMap.get(n.id) || n);

      } else if (handle === 'origin') {
        // Custom Transform Origin Handle
        const nextOrigin: Point2D = {
          x: session.transformOrigin.x + deltaX,
          y: session.transformOrigin.y + deltaY,
        };
        return {
          ...session,
          transformOrigin: nextOrigin,
        };

      } else {
        // Resize Handles (nw, n, ne, e, se, s, sw, w)
        const w0 = Math.max(1e-6, initialSelectionBounds.width);
        const h0 = Math.max(1e-6, initialSelectionBounds.height);

        let dw = 0;
        let dh = 0;

        if (handle.includes('e')) dw += deltaX;
        if (handle.includes('w')) dw -= deltaX;
        if (handle.includes('s')) dh += deltaY;
        if (handle.includes('n')) dh -= deltaY;

        let scaleX = (w0 + dw) / w0;
        let scaleY = (h0 + dh) / h0;

        if (options.lockAspectRatio || options.shiftKey) {
          const maxScale = Math.max(Math.abs(scaleX), Math.abs(scaleY));
          scaleX = maxScale * (scaleX < 0 ? -1 : 1);
          scaleY = maxScale * (scaleY < 0 ? -1 : 1);
        }

        const scaledSelected = VectorEditingEngine.scaleShapes(selectedNodes, scaleX, scaleY, transformOrigin);
        const scaledBounds = VectorEditingEngine.computeSelectionBounds(scaledSelected);

        if (scaledBounds && options.snapToNodes !== false) {
          const referenceNodes = initialSnapshot.nodes.filter(n => !initialSnapshot.selectedIds.includes(n.id));
          let snapRes: SnapResult;

          if (options.snapToGrid) {
            const gridRes = VectorSnappingEngine.computeGridSnap(scaledBounds, options.gridSizePx, options.snapThresholdPx);
            snapRes = {
              snappedDeltaX: gridRes.snappedDeltaX,
              snappedDeltaY: gridRes.snappedDeltaY,
              snappedX: gridRes.snappedX,
              snappedY: gridRes.snappedY,
              matches: [],
              guides: gridRes.guides,
            };
          } else {
            snapRes = VectorSnappingEngine.computeSnapDelta(scaledBounds, referenceNodes, options);
          }

          guides = snapRes.guides;
          const snappedSelected = scaledSelected.map((n: VectorNode) => VectorEditingEngine.moveShape(n, snapRes.snappedDeltaX, snapRes.snappedDeltaY));
          const snappedMap = new Map(snappedSelected.map((n: VectorNode) => [n.id, n]));
          nextNodes = initialSnapshot.nodes.map(n => snappedMap.get(n.id) || n);
        } else {
          const scaledMap = new Map(scaledSelected.map(n => [n.id, n]));
          nextNodes = initialSnapshot.nodes.map(n => scaledMap.get(n.id) || n);
        }
      }

      return {
        ...session,
        currentSnapshot: {
          ...initialSnapshot,
          nodes: nextNodes,
        },
        activeGuideLines: guides,
      };
    } catch (_err) {
      return session;
    }
  }
}
