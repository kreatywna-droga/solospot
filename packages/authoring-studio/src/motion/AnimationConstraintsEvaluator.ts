/**
 * AnimationConstraintsEvaluator.ts — Sprint S13 Declarative Animation Constraints System
 *
 * Evaluates declarative node constraints:
 * - Parent/Child hierarchy offset
 * - Follow target node (with lag)
 * - Align edge/center to target node
 * - Look-at target node (rotate towards target position)
 * - Position boundary clamp (min/max X, min/max Y)
 * - Rotation angle clamp (min/max Deg)
 *
 * NO DOM, NO React, NO window. Pure stateless DTO evaluation.
 */

export type ConstraintType =
  | 'parent-child'
  | 'follow'
  | 'align'
  | 'look-at'
  | 'position-clamp'
  | 'rotation-clamp';

export interface PositionClampRule {
  readonly minX?: number;
  readonly maxX?: number;
  readonly minY?: number;
  readonly maxY?: number;
}

export interface RotationClampRule {
  readonly minDeg?: number;
  readonly maxDeg?: number;
}

export interface AlignRule {
  readonly horizontal?: 'left' | 'center' | 'right';
  readonly vertical?: 'top' | 'middle' | 'bottom';
}

export interface AnimationConstraint {
  readonly id: string;
  readonly type: ConstraintType;
  readonly targetNodeId?: string;
  readonly targetPosition?: { x: number; y: number };
  readonly lagFactor?: number; // 0..1 (0 = instant, 1 = maximum lag)
  readonly positionClamp?: PositionClampRule;
  readonly rotationClamp?: RotationClampRule;
  readonly align?: AlignRule;
}

export interface ConstrainedTransformResult {
  readonly x: number;
  readonly y: number;
  readonly rotationDeg: number;
}

export class AnimationConstraintsEvaluator {
  public static evaluateConstraint(
    currentX: number,
    currentY: number,
    currentRotationDeg: number,
    constraint: AnimationConstraint,
    targetBounds?: { x: number; y: number; width: number; height: number },
    nodeBounds?: { width: number; height: number }
  ): ConstrainedTransformResult {
    let outX = currentX;
    let outY = currentY;
    let outRot = currentRotationDeg;

    switch (constraint.type) {
      case 'follow': {
        const tx = targetBounds ? targetBounds.x : constraint.targetPosition?.x ?? currentX;
        const ty = targetBounds ? targetBounds.y : constraint.targetPosition?.y ?? currentY;
        const factor = Math.max(0, Math.min(1, 1 - (constraint.lagFactor ?? 0)));
        outX = currentX + (tx - currentX) * factor;
        outY = currentY + (ty - currentY) * factor;
        break;
      }

      case 'align': {
        if (targetBounds && nodeBounds && constraint.align) {
          const { align } = constraint;
          if (align.horizontal === 'left') outX = targetBounds.x;
          else if (align.horizontal === 'center') outX = targetBounds.x + targetBounds.width / 2 - nodeBounds.width / 2;
          else if (align.horizontal === 'right') outX = targetBounds.x + targetBounds.width - nodeBounds.width;

          if (align.vertical === 'top') outY = targetBounds.y;
          else if (align.vertical === 'middle') outY = targetBounds.y + targetBounds.height / 2 - nodeBounds.height / 2;
          else if (align.vertical === 'bottom') outY = targetBounds.y + targetBounds.height - nodeBounds.height;
        }
        break;
      }

      case 'look-at': {
        const tx = targetBounds ? targetBounds.x + targetBounds.width / 2 : constraint.targetPosition?.x ?? currentX;
        const ty = targetBounds ? targetBounds.y + targetBounds.height / 2 : constraint.targetPosition?.y ?? currentY;
        const dx = tx - currentX;
        const dy = ty - currentY;
        const angleRad = Math.atan2(dy, dx);
        outRot = (angleRad * 180) / Math.PI;
        break;
      }

      case 'position-clamp': {
        if (constraint.positionClamp) {
          const { minX, maxX, minY, maxY } = constraint.positionClamp;
          if (typeof minX === 'number') outX = Math.max(minX, outX);
          if (typeof maxX === 'number') outX = Math.min(maxX, outX);
          if (typeof minY === 'number') outY = Math.max(minY, outY);
          if (typeof maxY === 'number') outY = Math.min(maxY, outY);
        }
        break;
      }

      case 'rotation-clamp': {
        if (constraint.rotationClamp) {
          const { minDeg, maxDeg } = constraint.rotationClamp;
          if (typeof minDeg === 'number') outRot = Math.max(minDeg, outRot);
          if (typeof maxDeg === 'number') outRot = Math.min(maxDeg, outRot);
        }
        break;
      }
    }

    return {
      x: outX,
      y: outY,
      rotationDeg: outRot,
    };
  }
}
