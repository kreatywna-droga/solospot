/**
 * VectorConstraintLayoutEngine.ts — Sprint G1-50 (Night Shift Level 12)
 *
 * Implements mathematical bounding box calculations for applying layout constraints
 * (MIN, MAX, CENTER, STRETCH, SCALE) when a parent container is resized.
 *
 * Pure headless TS engine, NO DOM, NO React, ZERO Browser APIs.
 */

import { VectorNode, HorizontalConstraint, VerticalConstraint } from './VectorDomainModel';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class VectorConstraintLayoutEngine {
  /**
   * Computes the new horizontal (x, width) properties of a child node
   * based on its constraint and the parent's old and new bounds.
   */
  public static computeHorizontalConstraint(
    child: VectorNode,
    parentOldBounds: BoundingBox,
    parentNewBounds: BoundingBox
  ): { x: number; width: number } {
    const constraint: HorizontalConstraint = child.constraints?.horizontal || 'MIN';
    const cx = child.transform.x;
    const cw = child.transform.width;

    const pOldX = parentOldBounds.x;
    const pOldW = parentOldBounds.width;
    const pNewX = parentNewBounds.x;
    const pNewW = parentNewBounds.width;

    switch (constraint) {
      case 'MIN': {
        // Distance from parent left is maintained.
        const distLeft = cx - pOldX;
        return { x: pNewX + distLeft, width: cw };
      }
      case 'MAX': {
        // Distance from parent right is maintained.
        const distRight = (pOldX + pOldW) - (cx + cw);
        return { x: (pNewX + pNewW) - distRight - cw, width: cw };
      }
      case 'CENTER': {
        // Distance from parent center is maintained.
        const pOldCenter = pOldX + pOldW / 2;
        const pNewCenter = pNewX + pNewW / 2;
        const distCenter = cx + cw / 2 - pOldCenter;
        const newChildCenter = pNewCenter + distCenter;
        return { x: newChildCenter - cw / 2, width: cw };
      }
      case 'STRETCH': {
        // Distance from left and right are both maintained.
        const distLeft = cx - pOldX;
        const distRight = (pOldX + pOldW) - (cx + cw);
        const newX = pNewX + distLeft;
        const newW = Math.max(0, pNewW - distLeft - distRight);
        return { x: newX, width: newW };
      }
      case 'SCALE': {
        // Scales proportionally to the parent's width change.
        if (pOldW === 0) return { x: cx, width: cw }; // Avoid NaN
        const scaleFactor = pNewW / pOldW;
        const distLeft = cx - pOldX;
        return {
          x: pNewX + (distLeft * scaleFactor),
          width: cw * scaleFactor,
        };
      }
      default:
        return { x: cx, width: cw };
    }
  }

  /**
   * Computes the new vertical (y, height) properties of a child node
   * based on its constraint and the parent's old and new bounds.
   */
  public static computeVerticalConstraint(
    child: VectorNode,
    parentOldBounds: BoundingBox,
    parentNewBounds: BoundingBox
  ): { y: number; height: number } {
    const constraint: VerticalConstraint = child.constraints?.vertical || 'MIN';
    const cy = child.transform.y;
    const ch = child.transform.height;

    const pOldY = parentOldBounds.y;
    const pOldH = parentOldBounds.height;
    const pNewY = parentNewBounds.y;
    const pNewH = parentNewBounds.height;

    switch (constraint) {
      case 'MIN': {
        const distTop = cy - pOldY;
        return { y: pNewY + distTop, height: ch };
      }
      case 'MAX': {
        const distBottom = (pOldY + pOldH) - (cy + ch);
        return { y: (pNewY + pNewH) - distBottom - ch, height: ch };
      }
      case 'CENTER': {
        const pOldCenter = pOldY + pOldH / 2;
        const pNewCenter = pNewY + pNewH / 2;
        const distCenter = cy + ch / 2 - pOldCenter;
        const newChildCenter = pNewCenter + distCenter;
        return { y: newChildCenter - ch / 2, height: ch };
      }
      case 'STRETCH': {
        const distTop = cy - pOldY;
        const distBottom = (pOldY + pOldH) - (cy + ch);
        const newY = pNewY + distTop;
        const newH = Math.max(0, pNewH - distTop - distBottom);
        return { y: newY, height: newH };
      }
      case 'SCALE': {
        if (pOldH === 0) return { y: cy, height: ch };
        const scaleFactor = pNewH / pOldH;
        const distTop = cy - pOldY;
        return {
          y: pNewY + (distTop * scaleFactor),
          height: ch * scaleFactor,
        };
      }
      default:
        return { y: cy, height: ch };
    }
  }

  /**
   * Applies constraints to all children of a group based on the group's old and new bounding box.
   * Returns a new array of updated child nodes.
   */
  public static applyGroupConstraints(
    children: VectorNode[],
    parentOldBounds: BoundingBox,
    parentNewBounds: BoundingBox
  ): VectorNode[] {
    return children.map((child) => {
      const { x, width } = this.computeHorizontalConstraint(child, parentOldBounds, parentNewBounds);
      const { y, height } = this.computeVerticalConstraint(child, parentOldBounds, parentNewBounds);

      let newChild = {
        ...child,
        transform: {
          ...child.transform,
          x,
          y,
          width,
          height,
        },
      } as VectorNode;

      // Recursive application for deeply nested groups
      if (newChild.type === 'group' && newChild.children && newChild.children.length > 0) {
        const updatedChild = { ...newChild };
        (updatedChild as any).children = this.applyGroupConstraints(
          newChild.children,
          { x: child.transform.x, y: child.transform.y, width: child.transform.width, height: child.transform.height },
          { x, y, width, height }
        );
        return updatedChild;
      }

      return newChild;
    });
  }
}
