/**
 * TimelineEvaluator.ts — PM30 Keyframe Timeline Evaluation Engine
 *
 * Evaluates PropertyAnimationTrack and AnimationClip at a specific time `t` (ms).
 * Pure calculation logic: returns computed property key-value map.
 */

import type { AnimationClip, PropertyAnimationTrack, AnimationKeyframe } from './AnimationTypes';
import { EasingEngine } from './EasingEngine';

export class TimelineEvaluator {
  /**
   * Evaluates all tracks of an AnimationClip at time `timeMs` and returns computed property values.
   */
  public static evaluateClip(clip: AnimationClip, timeMs: number): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const clampedTime = Math.max(0, Math.min(clip.duration, timeMs - clip.delay));

    clip.tracks.forEach((track) => {
      const val = this.evaluateTrack(track, clampedTime);
      if (val !== undefined) {
        result[track.propertyKey] = val;
      }
    });

    return result;
  }

  /**
   * Evaluates a single PropertyAnimationTrack at specified time `timeMs`.
   */
  public static evaluateTrack(track: PropertyAnimationTrack, timeMs: number): unknown {
    const { keyframes } = track;
    if (!keyframes || keyframes.length === 0) return undefined;

    // Boundary conditions
    if (timeMs <= keyframes[0].timeOffset) {
      return keyframes[0].value;
    }
    const lastKf = keyframes[keyframes.length - 1];
    if (timeMs >= lastKf.timeOffset) {
      return lastKf.value;
    }

    // Find surrounding keyframe segment [kf1, kf2]
    let kf1: AnimationKeyframe = keyframes[0];
    let kf2: AnimationKeyframe = keyframes[1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (timeMs >= keyframes[i].timeOffset && timeMs <= keyframes[i + 1].timeOffset) {
        kf1 = keyframes[i];
        kf2 = keyframes[i + 1];
        break;
      }
    }

    const duration = kf2.timeOffset - kf1.timeOffset;
    if (duration <= 0) return kf2.value;

    const normalizedT = (timeMs - kf1.timeOffset) / duration;
    const easedRatio = EasingEngine.evaluate(normalizedT, kf2.easing);

    // Interpolate numeric values
    if (typeof kf1.value === 'number' && typeof kf2.value === 'number') {
      return EasingEngine.interpolateNumber(kf1.value, kf2.value, easedRatio);
    }

    // Discrete fallback for non-numeric values
    return easedRatio >= 0.5 ? kf2.value : kf1.value;
  }
}
