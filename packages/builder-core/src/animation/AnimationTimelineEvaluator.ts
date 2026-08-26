/**
 * AnimationTimelineEvaluator.ts — PM30 Timeline Evaluator
 *
 * Selects the active clip and produces runtime frames (keyframe windows +
 * normalized linear progress) for a given time. Pure calculation — no DOM,
 * no interpolation of values (deferred to PM31).
 */

import type { AnimationTimeline, AnimationClip, PropertyAnimationTrack, AnimationKeyframe } from './AnimationTypes';
import type { RuntimeEvaluationResult, RuntimeTrack, RuntimeFrame } from './AnimationRuntimeTypes';

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

export class AnimationTimelineEvaluator {
  /**
   * Selects the last clip whose window [delay, delay + duration] contains time.
   */
  public static selectActiveClip(timeline: AnimationTimeline, time: number): AnimationClip | null {
    let active: AnimationClip | null = null;
    for (const clip of timeline.clips) {
      if (time >= clip.delay && time <= clip.delay + clip.duration) {
        active = clip;
      }
    }
    return active;
  }

  /**
   * Evaluates a timeline at an absolute time and returns runtime frames.
   */
  public static evaluate(timeline: AnimationTimeline, time: number): RuntimeEvaluationResult {
    const activeClip = this.selectActiveClip(timeline, time);
    if (!activeClip) {
      return { activeClip: null, tracks: [], time };
    }

    const clipTime = time - activeClip.delay;
    const tracks: RuntimeTrack[] = activeClip.tracks.map((track) => ({
      track,
      frames: this.evaluateTrack(track, activeClip.id, clipTime),
    }));

    return { activeClip, tracks, time };
  }

  private static evaluateTrack(
    track: PropertyAnimationTrack,
    clipId: string,
    clipTime: number
  ): RuntimeFrame[] {
    const kfs = track.keyframes;
    if (!kfs || kfs.length === 0) return [];

    if (kfs.length === 1) {
      return [this.makeFrame(clipId, track, clipTime, kfs[0], null, 0)];
    }

    // Find the active segment [a, b] containing clipTime.
    for (let i = 0; i < kfs.length - 1; i++) {
      const a = kfs[i];
      const b = kfs[i + 1];
      if (clipTime >= a.timeOffset && clipTime <= b.timeOffset) {
        const span = b.timeOffset - a.timeOffset;
        const progress = span <= 0 ? 0 : (clipTime - a.timeOffset) / span;
        return [this.makeFrame(clipId, track, clipTime, a, b, clamp01(progress))];
      }
    }

    // Before the first keyframe.
    if (clipTime < kfs[0].timeOffset) {
      return [this.makeFrame(clipId, track, clipTime, kfs[0], kfs[1], 0)];
    }

    // After the last keyframe.
    const last = kfs[kfs.length - 1];
    return [this.makeFrame(clipId, track, clipTime, last, null, 1)];
  }

  private static makeFrame(
    clipId: string,
    track: PropertyAnimationTrack,
    clipTime: number,
    from: AnimationKeyframe,
    to: AnimationKeyframe | null,
    normalizedProgress: number
  ): RuntimeFrame {
    return {
      clipId,
      trackId: track.id,
      propertyKey: track.propertyKey,
      clipTime,
      from,
      to,
      normalizedProgress,
    };
  }
}
