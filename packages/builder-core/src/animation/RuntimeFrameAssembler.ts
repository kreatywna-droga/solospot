/**
 * RuntimeFrameAssembler.ts — PM32 Runtime Frame Assembly
 *
 * Collects the interpolation result for every track of the active clip and
 * merges them into a single immutable RuntimeFrameBatch. Pure calculation —
 * NO DOM, NO CSS generation, NO side effects.
 *
 * Pipeline: AnimationTimelineEvaluator (PM30) → AnimationInterpolator (PM31)
 */

import { AnimationInterpolator } from './AnimationInterpolator';
import { AnimationTimelineEvaluator } from './AnimationTimelineEvaluator';
import type { AnimationTimeline } from './AnimationTypes';
import type {
  RuntimeFrameBatch,
  RuntimeFrame,
  InterpolationResult,
  InterpolationType,
} from './AnimationRuntimeTypes';

function clampRatio(ratio: number): number {
  return Math.max(0, Math.min(1, ratio));
}

/**
 * Infers the interpolation type for a property value based on its shape.
 * Conservative inference: falls back to 'number' / discrete for unknown shapes.
 */
function inferType(value: string | number): InterpolationType {
  if (typeof value === 'number') return 'number';
  const v = value.trim().toLowerCase();
  if (v === 'none') return 'number';
  if (v.endsWith('%')) return '%';
  if (v.endsWith('px')) return 'px';
  if (v.endsWith('rem')) return 'rem';
  if (v.endsWith('deg')) return 'deg';
  if (v.startsWith('#') || v.startsWith('rgb') || v.startsWith('rgba')) return 'color';
  if (v.includes('translate') || v.includes('scale') || v.includes('rotate')) return 'transform';
  return 'number';
}

/**
 * Interpolates a single RuntimeFrame producing its resolved value.
 */
export function interpolateFrame(frame: RuntimeFrame): InterpolationResult {
  const from = frame.from.value;
  const to = frame.to ? frame.to.value : from;
  const ratio = clampRatio(frame.normalizedProgress);

  if (typeof from === 'number' && typeof to === 'number') {
    return AnimationInterpolator.interpolateNumber(from, to, ratio);
  }

  const a = typeof from === 'string' ? from : String(from);
  const b = typeof to === 'string' ? to : String(to);
  const type = inferType(a);

  switch (type) {
    case '%':
    case 'px':
    case 'rem':
    case 'deg':
      return AnimationInterpolator.interpolateUnit(a, b, ratio);
    case 'color':
      return AnimationInterpolator.interpolateColor(a, b, ratio);
    case 'transform':
      return AnimationInterpolator.interpolateTransform(a, b, ratio);
    default:
      return ratio >= 0.5 ? b : a;
  }
}

export class RuntimeFrameAssembler {
  /**
   * Assembles a fully resolved RuntimeFrameBatch for a timeline at a given time.
   * Returns an empty batch (clipId: null) when no clip is active at `time`.
   */
  public static assemble(timeline: AnimationTimeline, time: number): RuntimeFrameBatch {
    const evaluation = AnimationTimelineEvaluator.evaluate(timeline, time);
    if (!evaluation.activeClip) {
      return { clipId: null, time, values: {} };
    }

    const values: Record<string, InterpolationResult> = {};
    for (const runtimeTrack of evaluation.tracks) {
      for (const frame of runtimeTrack.frames) {
        values[frame.propertyKey] = interpolateFrame(frame);
      }
    }

    return {
      clipId: evaluation.activeClip.id,
      time,
      values,
    };
  }
}
