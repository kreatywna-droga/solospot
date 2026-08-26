/**
 * TextAnimationEngine.ts — Sprint S17 Text Animation Integration (ETAP 4)
 *
 * Integrates animatable text properties (fontSize, letterSpacing, lineHeight, opacity, color)
 * with the existing S13 Motion System & AnimationTimeline.
 * Pure headless property evaluation. Zero 2nd animation engine.
 */

import { TextNode, TextStyle } from './TextDomainModel';

export interface TextAnimatableProperties {
  readonly fontSize?: number;
  readonly letterSpacing?: number;
  readonly lineHeight?: number;
  readonly opacity?: number;
  readonly x?: number;
  readonly y?: number;
  readonly rotationDeg?: number;
}

export class TextAnimationEngine {
  /**
   * Applies animated property keyframe updates to a TextNode DTO at playhead time t.
   */
  public static applyAnimatedProperties(
    node: TextNode,
    animProps: TextAnimatableProperties
  ): TextNode {
    const updatedStyle: Partial<TextStyle> = {
      ...(animProps.fontSize !== undefined ? { fontSize: Math.max(1, animProps.fontSize) } : {}),
      ...(animProps.letterSpacing !== undefined ? { letterSpacing: animProps.letterSpacing } : {}),
      ...(animProps.lineHeight !== undefined ? { lineHeight: Math.max(0.5, animProps.lineHeight) } : {}),
      ...(animProps.opacity !== undefined ? { opacity: Math.max(0, Math.min(1, animProps.opacity)) } : {}),
    };

    return {
      ...node,
      bounds: {
        ...node.bounds,
        x: animProps.x ?? node.bounds.x,
        y: animProps.y ?? node.bounds.y,
      },
      rotationDeg: animProps.rotationDeg ?? node.rotationDeg,
      style: {
        ...node.style,
        ...updatedStyle,
      },
    };
  }

  /**
   * Interpolates between two text property values for keyframe evaluation.
   */
  public static interpolateTextProperty(
    startValue: number,
    endValue: number,
    progress: number
  ): number {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    return Number((startValue + (endValue - startValue) * clampedProgress).toFixed(2));
  }
}
