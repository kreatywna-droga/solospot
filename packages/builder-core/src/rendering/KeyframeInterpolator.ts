/**
 * KeyframeInterpolator.ts — Sprint S10 Timeline Evaluation
 *
 * Interpolates keyframe pairs for tracks using CurveEvaluator and AnimationInterpolator.
 * Pure logic, no DOM dependencies.
 */

import { AnimationKeyframe, PropertyAnimationTrack } from '../animation/AnimationTypes';
import { AnimationInterpolator } from '../animation/AnimationInterpolator';
import { CurveEvaluator } from './CurveEvaluator';

export class KeyframeInterpolator {
  public static interpolateTrack(track: PropertyAnimationTrack, timeOffsetMs: number): unknown {
    const keyframes = track.keyframes;
    if (!keyframes || keyframes.length === 0) {
      return undefined;
    }

    if (keyframes.length === 1) {
      return keyframes[0].value;
    }

    // Sort keyframes by timeOffset ascending
    const sorted = [...keyframes].sort((a, b) => a.timeOffset - b.timeOffset);

    // Before first keyframe
    if (timeOffsetMs <= sorted[0].timeOffset) {
      return sorted[0].value;
    }

    // After last keyframe
    if (timeOffsetMs >= sorted[sorted.length - 1].timeOffset) {
      return sorted[sorted.length - 1].value;
    }

    // Find bounding keyframes
    let kPrev: AnimationKeyframe = sorted[0];
    let kNext: AnimationKeyframe = sorted[1];

    for (let i = 0; i < sorted.length - 1; i++) {
      if (timeOffsetMs >= sorted[i].timeOffset && timeOffsetMs <= sorted[i + 1].timeOffset) {
        kPrev = sorted[i];
        kNext = sorted[i + 1];
        break;
      }
    }

    const duration = kNext.timeOffset - kPrev.timeOffset;
    if (duration <= 0) {
      return kNext.value;
    }

    const linearRatio = (timeOffsetMs - kPrev.timeOffset) / duration;
    const easedRatio = CurveEvaluator.evaluate(linearRatio, kNext.easing ?? kPrev.easing);

    return KeyframeInterpolator.interpolateValues(kPrev.value, kNext.value, easedRatio);
  }

  public static interpolateValues(startVal: unknown, endVal: unknown, ratio: number): unknown {
    if (startVal === endVal) return startVal;

    if (typeof startVal === 'number' && typeof endVal === 'number') {
      return AnimationInterpolator.interpolateNumber(startVal, endVal, ratio);
    }

    if (typeof startVal === 'string' && typeof endVal === 'string') {
      if (startVal.startsWith('#') || startVal.startsWith('rgb') || startVal.startsWith('hsl')) {
        return AnimationInterpolator.interpolateColor(startVal, endVal, ratio);
      }
      if (startVal.includes('px') || startVal.includes('%') || startVal.includes('rem') || startVal.includes('em') || startVal.includes('vh') || startVal.includes('vw')) {
        return AnimationInterpolator.interpolateUnit(startVal, endVal, ratio);
      }
      if (startVal.includes('translate') || startVal.includes('scale') || startVal.includes('rotate') || startVal.includes('matrix')) {
        return AnimationInterpolator.interpolateTransform(startVal, endVal, ratio);
      }
      return ratio >= 0.5 ? endVal : startVal;
    }

    if (typeof startVal === 'boolean' || typeof endVal === 'boolean') {
      return ratio >= 0.5 ? endVal : startVal;
    }

    return ratio >= 0.5 ? endVal : startVal;
  }
}
