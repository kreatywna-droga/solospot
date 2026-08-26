/**
 * TimelineEvaluator.ts — Sprint S10 Timeline Evaluation
 *
 * Evaluates AnimationTimeline clips & tracks at target time t (ms).
 * Handles loops, direction, fillMode, delays, and repeatCount.
 * Pure functional DTO generator. NO DOM or React dependencies.
 */

import { AnimationClip, AnimationTimeline } from '../animation/AnimationTypes';
import { KeyframeInterpolator } from './KeyframeInterpolator';

export interface EvaluatedTimelineResult {
  readonly timelineId: string;
  readonly targetNodeId: string;
  readonly timestampMs: number;
  readonly effectiveClipTimeMs: number;
  readonly isFinished: boolean;
  readonly propertyMap: Record<string, unknown>;
}

export class TimelineEvaluator {
  public static evaluateTimeline(
    timeline: AnimationTimeline,
    timestampMs: number
  ): EvaluatedTimelineResult {
    const playback = timeline.playback;
    const speed = playback?.speed ?? 1.0;
    const effectiveTime = Math.max(0, timestampMs * speed);

    const propertyMap: Record<string, unknown> = {};
    let allFinished = true;

    for (const clip of timeline.clips) {
      const clipResult = TimelineEvaluator.evaluateClip(clip, effectiveTime, playback);
      Object.assign(propertyMap, clipResult.propertyMap);
      if (!clipResult.isFinished) {
        allFinished = false;
      }
    }

    return {
      timelineId: timeline.id,
      targetNodeId: timeline.targetNodeId,
      timestampMs,
      effectiveClipTimeMs: effectiveTime,
      isFinished: allFinished,
      propertyMap,
    };
  }

  public static evaluateClip(
    clip: AnimationClip,
    timestampMs: number,
    playbackOptions?: AnimationTimeline['playback']
  ): { propertyMap: Record<string, unknown>; isFinished: boolean } {
    const delay = clip.delay ?? 0;
    const duration = clip.duration;
    const fillMode = playbackOptions?.fillMode ?? 'both';
    const direction = playbackOptions?.direction ?? 'normal';
    const loop = playbackOptions?.loop ?? false;
    const repeatCount = playbackOptions?.repeatCount ?? (loop ? 'infinite' : 1);

    const propertyMap: Record<string, unknown> = {};

    if (duration <= 0) {
      return { propertyMap, isFinished: true };
    }

    // Time before clip start
    if (timestampMs < delay) {
      if (fillMode === 'backwards' || fillMode === 'both') {
        for (const track of clip.tracks) {
          propertyMap[track.propertyKey] = KeyframeInterpolator.interpolateTrack(track, 0);
        }
      }
      return { propertyMap, isFinished: false };
    }

    const elapsed = timestampMs - delay;
    const totalMaxDuration =
      repeatCount === 'infinite'
        ? Infinity
        : duration * (typeof repeatCount === 'number' ? repeatCount : 1);

    let isFinished = false;
    let localTime = elapsed;

    if (elapsed >= totalMaxDuration) {
      isFinished = true;
      if (fillMode === 'forwards' || fillMode === 'both') {
        localTime = duration;
      } else {
        return { propertyMap, isFinished: true };
      }
    } else {
      // Loop wrapping
      const iteration = Math.floor(elapsed / duration);
      const modTime = elapsed % duration;

      let isReverseIteration = false;
      if (direction === 'reverse') {
        isReverseIteration = true;
      } else if (direction === 'alternate') {
        isReverseIteration = iteration % 2 === 1;
      } else if (direction === 'alternate-reverse') {
        isReverseIteration = iteration % 2 === 0;
      }

      localTime = isReverseIteration ? duration - modTime : modTime;
    }

    for (const track of clip.tracks) {
      const val = KeyframeInterpolator.interpolateTrack(track, localTime);
      if (val !== undefined) {
        propertyMap[track.propertyKey] = val;
      }
    }

    return { propertyMap, isFinished };
  }
}
