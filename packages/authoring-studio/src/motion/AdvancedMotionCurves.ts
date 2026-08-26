/**
 * AdvancedMotionCurves.ts — Sprint S13 Advanced Motion Curves & Velocity System
 *
 * Provides evaluation for Bézier curves, custom easing (cubic-bezier, spring, bounce, elastic, step),
 * velocity & acceleration numerical derivatives, and temporal modifiers (loop, ping-pong, reverse).
 *
 * Pure mathematical functions. NO DOM, NO React, NO window.
 */

import { EasingCurve } from '../../../builder-core/src/animation/AnimationTypes';
import { evaluateCubicBezier, evaluateSpring } from '../../../builder-core/src/rendering/CurveEvaluator';

export type TemporalMode = 'normal' | 'reverse' | 'ping-pong' | 'loop' | 'hold';

export type ExtendedEasingCurveType = EasingCurve['type'] | 'ease-in-out' | 'bounce' | 'elastic' | 'step';

export interface ExtendedEasingCurve {
  readonly type: ExtendedEasingCurveType;
  readonly controlPoints?: [number, number, number, number];
  readonly stiffness?: number;
  readonly damping?: number;
  readonly steps?: number;
}

export interface MotionCurveConfig {
  readonly curve?: ExtendedEasingCurve | EasingCurve;
  readonly temporalMode?: TemporalMode;
  readonly durationMs?: number;
}

export function evaluateBounce(t: number): number {
  const clampT = Math.max(0, Math.min(1, t));
  const n1 = 7.5625;
  const d1 = 2.75;

  if (clampT < 1 / d1) {
    return n1 * clampT * clampT;
  } else if (clampT < 2 / d1) {
    const u = clampT - 1.5 / d1;
    return n1 * u * u + 0.75;
  } else if (clampT < 2.5 / d1) {
    const u = clampT - 2.25 / d1;
    return n1 * u * u + 0.9375;
  } else {
    const u = clampT - 2.625 / d1;
    return n1 * u * u + 0.984375;
  }
}

export function evaluateElastic(t: number, period = 0.3): number {
  const clampT = Math.max(0, Math.min(1, t));
  if (clampT === 0) return 0;
  if (clampT === 1) return 1;
  const s = period / 4;
  return Math.pow(2, -10 * clampT) * Math.sin(((clampT - s) * (2 * Math.PI)) / period) + 1;
}

export function evaluateStep(t: number, steps = 5): number {
  const clampT = Math.max(0, Math.min(1, t));
  if (steps <= 1) return clampT >= 1 ? 1 : 0;
  return Math.floor(clampT * steps) / steps;
}

export class AdvancedMotionCurves {
  public static evaluateProgression(t: number, curve?: ExtendedEasingCurve | EasingCurve): number {
    const clampT = Math.max(0, Math.min(1, t));
    if (!curve) return clampT;

    switch (curve.type) {
      case 'linear':
        return clampT;
      case 'ease-in':
        return clampT * clampT;
      case 'ease-out':
        return clampT * (2 - clampT);
      case 'ease-in-out':
        return clampT < 0.5 ? 2 * clampT * clampT : -1 + (4 - 2 * clampT) * clampT;
      case 'cubic-bezier': {
        const cp = curve.controlPoints ?? [0.25, 0.1, 0.25, 1.0];
        return evaluateCubicBezier(clampT, cp[0], cp[1], cp[2], cp[3]);
      }
      case 'spring':
        return evaluateSpring(clampT, curve.stiffness ?? 100, curve.damping ?? 10);
      case 'bounce':
        return evaluateBounce(clampT);
      case 'elastic':
        return evaluateElastic(clampT);
      case 'step':
        return evaluateStep(clampT, (curve as ExtendedEasingCurve).steps ?? 5);
      default:
        return clampT;
    }
  }

  public static applyTemporalModifier(
    rawNormalizedTime: number,
    mode: TemporalMode = 'normal'
  ): number {
    switch (mode) {
      case 'normal':
        return Math.max(0, Math.min(1, rawNormalizedTime));

      case 'reverse':
        return Math.max(0, Math.min(1, 1 - rawNormalizedTime));

      case 'loop': {
        const wrapped = rawNormalizedTime % 1.0;
        return wrapped < 0 ? wrapped + 1.0 : wrapped;
      }

      case 'ping-pong': {
        const cycle = Math.floor(Math.abs(rawNormalizedTime));
        const rem = Math.abs(rawNormalizedTime) % 1.0;
        return cycle % 2 === 0 ? rem : 1.0 - rem;
      }

      case 'hold':
        return Math.max(0, Math.min(1, rawNormalizedTime));

      default:
        return Math.max(0, Math.min(1, rawNormalizedTime));
    }
  }

  public static evaluateVelocity(
    t: number,
    curve?: ExtendedEasingCurve | EasingCurve,
    durationMs: number = 1000,
    dt: number = 0.001
  ): number {
    const t1 = Math.max(0, t - dt);
    const t2 = Math.min(1, t + dt);
    const f1 = AdvancedMotionCurves.evaluateProgression(t1, curve);
    const f2 = AdvancedMotionCurves.evaluateProgression(t2, curve);
    const df = f2 - f1;
    const dtNormalized = t2 - t1;

    if (dtNormalized <= 0) return 0;
    // Velocity in units per second (scaled by durationMs)
    return (df / dtNormalized) * (1000 / Math.max(1, durationMs));
  }

  public static evaluateAcceleration(
    t: number,
    curve?: ExtendedEasingCurve | EasingCurve,
    durationMs: number = 1000,
    dt: number = 0.001
  ): number {
    const t1 = Math.max(0, t - dt);
    const t2 = Math.min(1, t + dt);
    const v1 = AdvancedMotionCurves.evaluateVelocity(t1, curve, durationMs, dt);
    const v2 = AdvancedMotionCurves.evaluateVelocity(t2, curve, durationMs, dt);
    const dtNormalized = t2 - t1;

    if (dtNormalized <= 0) return 0;
    // Acceleration in units per second squared
    return ((v2 - v1) / dtNormalized) * (1000 / Math.max(1, durationMs));
  }
}
