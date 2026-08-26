/**
 * VectorAnimationEngine.ts — Sprint S18 Vector Animation Integration (ETAP 4)
 *
 * Integrates animatable vector properties (fill opacity/color, stroke width/color, corner radius,
 * transform position/rotation/scale, polygon sides/starRatio, path dashOffset)
 * with the existing S13 Motion System & AnimationTimeline.
 * Pure headless property evaluation. Zero 2nd animation engine.
 */

import { VectorNode, CornerRadius, RectangleNode, PolygonNode } from './VectorDomainModel';

export interface VectorAnimatableProperties {
  readonly x?: number;
  readonly y?: number;
  readonly width?: number;
  readonly height?: number;
  readonly rotationDeg?: number;
  readonly scaleX?: number;
  readonly scaleY?: number;
  readonly skewX?: number;
  readonly skewY?: number;
  readonly opacity?: number;
  readonly fillOpacity?: number;
  readonly fillColor?: string;
  readonly strokeWidth?: number;
  readonly strokeColor?: string;
  readonly strokeDashOffset?: number;
  readonly cornerRadius?: CornerRadius;
  readonly polygonSides?: number;
  readonly starRatio?: number;
}

export class VectorAnimationEngine {
  /**
   * Applies animated property keyframe updates to a VectorNode DTO at playhead time t.
   */
  public static applyAnimatedProperties(
    node: VectorNode,
    animProps: VectorAnimatableProperties
  ): VectorNode {
    const updatedTransform = {
      ...node.transform,
      x: animProps.x ?? node.transform.x,
      y: animProps.y ?? node.transform.y,
      width: animProps.width !== undefined ? Math.max(1, animProps.width) : node.transform.width,
      height: animProps.height !== undefined ? Math.max(1, animProps.height) : node.transform.height,
      rotationDeg: animProps.rotationDeg ?? node.transform.rotationDeg,
      scaleX: animProps.scaleX ?? node.transform.scaleX,
      scaleY: animProps.scaleY ?? node.transform.scaleY,
      skewX: animProps.skewX ?? node.transform.skewX,
      skewY: animProps.skewY ?? node.transform.skewY,
    };

    let updatedFill = node.fill;
    if (updatedFill && (animProps.fillColor !== undefined || animProps.fillOpacity !== undefined)) {
      updatedFill = {
        ...updatedFill,
        color: animProps.fillColor ?? updatedFill.color,
        opacity: animProps.fillOpacity !== undefined
          ? Math.max(0, Math.min(1, animProps.fillOpacity))
          : updatedFill.opacity,
      };
    }

    let updatedStroke = node.stroke;
    if (
      updatedStroke &&
      (animProps.strokeWidth !== undefined ||
        animProps.strokeColor !== undefined ||
        animProps.strokeDashOffset !== undefined)
    ) {
      updatedStroke = {
        ...updatedStroke,
        width: animProps.strokeWidth !== undefined ? Math.max(0, animProps.strokeWidth) : updatedStroke.width,
        color: animProps.strokeColor ?? updatedStroke.color,
        dashOffset: animProps.strokeDashOffset ?? updatedStroke.dashOffset,
      };
    }

    let resultNode: VectorNode = {
      ...node,
      transform: updatedTransform,
      opacity: animProps.opacity !== undefined ? Math.max(0, Math.min(1, animProps.opacity)) : node.opacity,
      fill: updatedFill,
      stroke: updatedStroke,
    };

    if (node.type === 'rectangle' && animProps.cornerRadius !== undefined) {
      resultNode = {
        ...(resultNode as RectangleNode),
        cornerRadius: animProps.cornerRadius,
      };
    }

    if (node.type === 'polygon') {
      const polygonNode = resultNode as PolygonNode;
      resultNode = {
        ...polygonNode,
        sides: animProps.polygonSides !== undefined ? Math.max(3, Math.round(animProps.polygonSides)) : polygonNode.sides,
        starRatio: animProps.starRatio !== undefined ? Math.max(0.1, Math.min(0.9, animProps.starRatio)) : polygonNode.starRatio,
      };
    }

    return resultNode;
  }

  /**
   * Linearly interpolates between two numeric keyframe values.
   */
  public static interpolateProperty(startValue: number, endValue: number, progress: number): number {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    return Number((startValue + (endValue - startValue) * clampedProgress).toFixed(3));
  }
}
