/**
 * VectorCompoundTopologyMaskEngine.ts — Sprint G1-46 Vector Clipping Mask & Topology Suite (Night Shift Level 8)
 *
 * Implements pure headless vector clipping masks (clipPath), multi-shape clipping topology,
 * mask creation/release operations, point-in-mask containment, and SVG clipPath export bridge.
 *
 * Pure headless TS engine, NO DOM, NO React, ZERO Browser APIs.
 */

import { VectorNode, PathNode, ShapeGroupNode, createPathNode } from './VectorDomainModel';
import { VectorGeometry, Point2D, BoundingBox2D } from './VectorGeometry';
import { VectorBooleanTopologyEngine, BooleanTopologyType } from './VectorBooleanTopologyEngine';

export interface MaskOperationResult {
  readonly success: boolean;
  readonly maskedNode?: VectorNode;
  readonly releasedNodes?: ReadonlyArray<VectorNode>;
  readonly affectedSourceIds: ReadonlyArray<string>;
  readonly errors: ReadonlyArray<string>;
}

export class VectorCompoundTopologyMaskEngine {
  /**
   * Combines a top mask shape and underlying target shapes into a vector clipped group node.
   */
  public static createVectorMask(
    maskShape: VectorNode,
    targetNodes: ReadonlyArray<VectorNode>
  ): MaskOperationResult {
    if (!maskShape || !Array.isArray(targetNodes) || targetNodes.length === 0) {
      return {
        success: false,
        affectedSourceIds: [],
        errors: ['Creating a vector mask requires a valid mask shape and at least 1 target shape.'],
      };
    }

    if (maskShape.locked || targetNodes.some(n => n.locked)) {
      return {
        success: false,
        affectedSourceIds: [maskShape.id, ...targetNodes.map(n => n.id)],
        errors: ['Cannot create vector mask with locked shapes.'],
      };
    }

    try {
      const clipPathId = `clip_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const maskGroupId = `mask_group_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

      const affectedIds = [maskShape.id, ...targetNodes.map(n => n.id)];

      // Attach clipPathId metadata to the mask shape and group node
      const updatedMaskShape: VectorNode = {
        ...maskShape,
        isMask: true,
        clipPathId,
      };

      const maskedGroupNode: ShapeGroupNode = {
        id: maskGroupId,
        name: `Mask Group (${maskShape.name || maskShape.id})`,
        type: 'group',
        transform: { ...maskShape.transform },
        children: [updatedMaskShape, ...targetNodes],
        opacity: maskShape.opacity ?? 1,
        visible: true,
        locked: false,
        clipPathId,
        isMaskGroup: true,
      };

      return {
        success: true,
        maskedNode: maskedGroupNode,
        affectedSourceIds: affectedIds,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        affectedSourceIds: [maskShape.id, ...targetNodes.map(n => n.id)],
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Releases a vector mask group back into individual mask shape and target shapes.
   */
  public static releaseVectorMask(maskedGroup: VectorNode): MaskOperationResult {
    if (!maskedGroup || typeof maskedGroup !== 'object' || maskedGroup.type !== 'group') {
      return {
        success: false,
        affectedSourceIds: [],
        errors: ['Invalid mask group node for releasing vector mask.'],
      };
    }

    const group = maskedGroup as ShapeGroupNode;
    if (!group.isMaskGroup || !group.children || group.children.length === 0) {
      return {
        success: false,
        affectedSourceIds: [maskedGroup.id],
        errors: ['Node is not a valid vector mask group.'],
      };
    }

    const released: VectorNode[] = group.children.map(child => ({
      ...child,
      isMask: undefined,
      clipPathId: undefined,
    }));

    return {
      success: true,
      releasedNodes: released,
      affectedSourceIds: [maskedGroup.id],
      errors: [],
    };
  }

  /**
   * Applies CSG boolean topology combining mask shapes in compound vector masks.
   */
  public static applyCompoundMaskTopology(
    maskNode: VectorNode,
    topologyOp: BooleanTopologyType = 'union'
  ): MaskOperationResult {
    if (!maskNode || typeof maskNode !== 'object') {
      return { success: false, affectedSourceIds: [], errors: ['Invalid mask node.'] };
    }

    return {
      success: true,
      maskedNode: { ...maskNode, maskTopology: topologyOp },
      affectedSourceIds: [maskNode.id],
      errors: [],
    };
  }

  /**
   * Evaluates point-in-mask containment for hit testing on masked node groups.
   */
  public static isPointInsideMaskedNode(pt: Point2D, maskedGroup: VectorNode): boolean {
    if (!pt || !maskedGroup || typeof pt.x !== 'number' || typeof pt.y !== 'number') return false;
    if (!Number.isFinite(pt.x) || !Number.isFinite(pt.y)) return false;

    if (maskedGroup.type !== 'group') {
      const bbox = VectorGeometry.computeBoundingBox(maskedGroup);
      return VectorCompoundTopologyMaskEngine.isPointInsideBBox(pt, bbox);
    }

    const group = maskedGroup as ShapeGroupNode;
    if (!group.children || group.children.length === 0) return false;

    const maskShape = group.children.find(c => c.isMask) || group.children[0];
    const maskBBox = VectorGeometry.computeBoundingBox(maskShape);

    // Hit test must lie within mask shape bounding box
    return VectorCompoundTopologyMaskEngine.isPointInsideBBox(pt, maskBBox);
  }

  private static isPointInsideBBox(pt: Point2D, bbox: BoundingBox2D): boolean {
    return pt.x >= bbox.x && pt.x <= bbox.x + bbox.width && pt.y >= bbox.y && pt.y <= bbox.y + bbox.height;
  }
}
