/**
 * CurveEvaluator.ts — Sprint S10 Timeline Evaluation
 *
 * Evaluates easing curves (linear, ease-in, ease-out, cubic-bezier, step, spring)
 * into progression factor u' ∈ [0, 1].
 * Pure mathematical functions. NO DOM, NO Browser API.
 */

import { EasingCurve } from '../animation/AnimationTypes';

export function evaluateCubicBezier(
  t: number,
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number
): number {
  const clampT = Math.max(0, Math.min(1, t));
  if (clampT === 0 || clampT === 1) return clampT;

  // Newton-Raphson approximation for 1D cubic Bezier curve (t -> x -> y)
  let u = clampT;
  for (let i = 0; i < 8; i++) {
    const currentX = 3 * Math.pow(1 - u, 2) * u * p1x + 3 * (1 - u) * Math.pow(u, 2) * p2x + Math.pow(u, 3);
    const dx = 3 * Math.pow(1 - u, 2) * p1x + 6 * (1 - u) * u * (p2x - p1x) + 3 * Math.pow(u, 2) * (1 - p2x);
    if (Math.abs(dx) < 1e-6) break;
    u -= (currentX - clampT) / dx;
  }

  // Calculate y from parameter u
  return 3 * Math.pow(1 - u, 2) * u * p1y + 3 * (1 - u) * Math.pow(u, 2) * p2y + Math.pow(u, 3);
}

export function evaluateSpring(t: number, stiffness = 100, damping = 10): number {
  const clampT = Math.max(0, Math.min(1, t));
  if (clampT === 0) return 0;
  if (clampT === 1) return 1;

  const w0 = Math.sqrt(stiffness);
  const zeta = damping / (2 * Math.sqrt(stiffness));

  if (zeta < 1) {
    // Underdamped
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w0 * clampT) * (Math.cos(wd * clampT) + (zeta * w0 / wd) * Math.sin(wd * clampT));
  } else {
    // Overdamped / critically damped
    return 1 - Math.exp(-w0 * clampT) * (1 + w0 * clampT);
  }
}

export class CurveEvaluator {
  public static evaluate(t: number, curve?: EasingCurve): number {
    const clampT = Math.max(0, Math.min(1, t));
    if (!curve) return clampT;

    switch (curve.type) {
      case 'linear':
        return clampT;
      case 'ease-in':
        return clampT * clampT;
      case 'ease-out':
        return clampT * (2 - clampT);
      case 'cubic-bezier': {
        const cp = curve.controlPoints ?? [0.25, 0.1, 0.25, 1.0];
        return evaluateCubicBezier(clampT, cp[0], cp[1], cp[2], cp[3]);
      }
      case 'spring': {
        return evaluateSpring(clampT, curve.stiffness ?? 100, curve.damping ?? 10);
      }
      default:
        return clampT;
    }
  }
}
