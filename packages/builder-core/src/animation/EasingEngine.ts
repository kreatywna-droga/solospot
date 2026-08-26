/**
 * EasingEngine.ts — PM30 Animation Easing & Interpolation Math
 *
 * Pure mathematical functions for easing curves and value interpolation.
 * Zero DOM dependencies, zero side effects.
 */

import type { EasingCurve } from './AnimationTypes';

export class EasingEngine {
  /**
   * Calculates the eased progress ratio (0.0 to 1.0) for a normalized time progress `t` (0.0 to 1.0).
   */
  public static evaluate(t: number, easing: EasingCurve): number {
    const clampedT = Math.max(0, Math.min(1, t));

    switch (easing.type) {
      case 'linear':
        return clampedT;
      case 'ease-in':
        return clampedT * clampedT;
      case 'ease-out':
        return clampedT * (2 - clampedT);
      case 'cubic-bezier': {
        const [x1 = 0.25, y1 = 0.1, x2 = 0.25, y2 = 1.0] = easing.controlPoints ?? [];
        return this.cubicBezier(clampedT, x1, y1, x2, y2);
      }
      case 'spring': {
        const stiffness = easing.stiffness ?? 100;
        const damping = easing.damping ?? 10;
        return this.spring(clampedT, stiffness, damping);
      }
      default:
        return clampedT;
    }
  }

  /**
   * Interpolates linearly between startValue and endValue by progress ratio.
   */
  public static interpolateNumber(startValue: number, endValue: number, ratio: number): number {
    return startValue + (endValue - startValue) * ratio;
  }

  /**
   * Cubic Bezier 1D approximation for normalized time t.
   */
  private static cubicBezier(t: number, _p1x: number, p1y: number, _p2x: number, p2y: number): number {
    // 3-point cubic bezier y calculation for ease approximation
    const cx = 3 * p1y;
    const bx = 3 * (p2y - p1y) - cx;
    const ax = 1 - cx - bx;
    return ((ax * t + bx) * t + cx) * t;
  }

  /**
   * Basic damped spring simulation ratio.
   */
  private static spring(t: number, stiffness: number, damping: number): number {
    const w = Math.sqrt(stiffness);
    const decay = Math.exp(-damping * t * 0.1);
    return 1 - decay * Math.cos(w * t * 0.1);
  }
}
