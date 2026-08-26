/**
 * TimelineEasingEditor.ts — PM39 Easing Curve Editor (ETAP 1)
 *
 * DECISION-058: Easing Editor jest wyłącznie edytorem danych.
 *
 * Pure data model for visual easing curve authoring (Cubic-Bezier & Presets).
 *
 * ZERO interpolation execution — interpolation remains strictly inside
 * PM31 AnimationInterpolator (builder-core).
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API.
 */

import type { EasingCurve } from '../../../builder-core/src/animation/AnimationTypes';

export interface BezierControlPoints {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

export type EasingPresetName =
  | 'linear'
  | 'ease'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut';

export const EASING_PRESETS: Record<EasingPresetName, BezierControlPoints> = {
  linear: { x1: 0, y1: 0, x2: 1, y2: 1 },
  ease: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1.0 },
  easeIn: { x1: 0.42, y1: 0, x2: 1.0, y2: 1.0 },
  easeOut: { x1: 0, y1: 0, x2: 0.58, y2: 1.0 },
  easeInOut: { x1: 0.42, y1: 0, x2: 0.58, y2: 1.0 },
};

/**
 * Validates Bezier control points (x1, x2 must be within [0, 1]).
 */
export function validateBezierControlPoints(points: BezierControlPoints): boolean {
  return (
    points.x1 >= 0 &&
    points.x1 <= 1 &&
    points.x2 >= 0 &&
    points.x2 <= 1 &&
    !isNaN(points.y1) &&
    !isNaN(points.y2)
  );
}

/**
 * Clamps Bezier control points to valid bounds (x1, x2 in [0, 1]).
 */
export function clampBezierControlPoints(points: BezierControlPoints): BezierControlPoints {
  return {
    x1: Math.max(0, Math.min(1, points.x1)),
    y1: points.y1,
    x2: Math.max(0, Math.min(1, points.x2)),
    y2: points.y2,
  };
}

/**
 * Creates an EasingCurve DTO from a preset name.
 */
export function createPresetEasingCurve(preset: EasingPresetName): EasingCurve {
  switch (preset) {
    case 'linear':
      return { type: 'linear' };
    case 'ease':
      return { type: 'cubic-bezier', controlPoints: [0.25, 0.1, 0.25, 1.0] };
    case 'easeIn':
      return { type: 'ease-in' };
    case 'easeOut':
      return { type: 'ease-out' };
    case 'easeInOut':
      return { type: 'cubic-bezier', controlPoints: [0.42, 0, 0.58, 1.0] };
  }
}

/**
 * Creates a custom cubic-bezier EasingCurve DTO from control points.
 */
export function createCustomCubicBezierEasingCurve(points: BezierControlPoints): EasingCurve {
  const clamped = clampBezierControlPoints(points);
  return {
    type: 'cubic-bezier',
    controlPoints: [clamped.x1, clamped.y1, clamped.x2, clamped.y2],
  };
}

/**
 * Formats an EasingCurve DTO into a standard CSS cubic-bezier string representation.
 */
export function formatEasingCurveToCSS(easing: EasingCurve): string {
  switch (easing.type) {
    case 'linear':
      return 'linear';
    case 'ease-in':
      return 'ease-in';
    case 'ease-out':
      return 'ease-out';
    case 'cubic-bezier': {
      if (easing.controlPoints) {
        const [x1, y1, x2, y2] = easing.controlPoints;
        return `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
      }
      return 'cubic-bezier(0.25, 0.1, 0.25, 1.0)';
    }
    case 'spring':
      return 'cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    default:
      return 'linear';
  }
}

/**
 * Parses control points from an EasingCurve DTO.
 */
export function extractBezierControlPoints(easing: EasingCurve): BezierControlPoints {
  if (easing.type === 'cubic-bezier' && easing.controlPoints) {
    const [x1, y1, x2, y2] = easing.controlPoints;
    return { x1, y1, x2, y2 };
  }
  switch (easing.type) {
    case 'ease-in':
      return EASING_PRESETS.easeIn;
    case 'ease-out':
      return EASING_PRESETS.easeOut;
    case 'linear':
    default:
      return EASING_PRESETS.linear;
  }
}
