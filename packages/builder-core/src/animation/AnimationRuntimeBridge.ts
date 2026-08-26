/**
 * AnimationRuntimeBridge.ts — PM32 Runtime Bridge
 *
 * Connects the PM29 domain layer, the PM30 runtime foundation, and the PM31
 * interpolation engine into a single stateless evaluation entry point.
 *
 *   evaluateFrame(timeline, runtimeState, currentTime) → RuntimeFrameBatch
 *
 * Pure function — NO side effects, NO DOM, NO CSS, NO clocks.
 */

import { RuntimeFrameAssembler } from './RuntimeFrameAssembler';
import { RuntimeFrameCache } from './RuntimeFrameCache';
import type { AnimationTimeline } from './AnimationTypes';
import type {
  RuntimeState,
  RuntimeFrameBatch,
  RuntimeEvaluationResult,
} from './AnimationRuntimeTypes';
import { AnimationTimelineEvaluator } from './AnimationTimelineEvaluator';

export interface AnimationRuntimeBridgeConfig {
  /** Optional cache used to memoize assembled frames by (timelineId, time). */
  cache?: RuntimeFrameCache;
}

export class AnimationRuntimeBridge {
  private readonly _cache: RuntimeFrameCache | null;

  constructor(config: AnimationRuntimeBridgeConfig = {}) {
    this._cache = config.cache ?? null;
  }

  /**
   * Evaluates a timeline at an absolute time and returns a fully resolved
   * RuntimeFrameBatch. Optionally consults/populates the immutable cache.
   *
   * @param timeline      PM29 domain timeline
   * @param runtimeState  PM30 playback state snapshot
   * @param currentTime   absolute evaluation time (ms)
   */
  public evaluateFrame(
    timeline: AnimationTimeline,
    runtimeState: RuntimeState,
    currentTime: number
  ): RuntimeFrameBatch {
    if (this._cache) {
      const cached = this._cache.get(timeline.id, currentTime);
      if (cached) {
        return {
          clipId: cached.clipId,
          time: cached.time,
          values: { ...cached.values },
        };
      }
    }

    const batch = RuntimeFrameAssembler.assemble(timeline, currentTime);

    if (this._cache) {
      this._cache.set(timeline.id, currentTime, batch);
    }

    return batch;
  }

  /**
   * Convenience: returns the raw (uninterpolated) evaluation result from the
   * PM30 Timeline Evaluator. Useful for diagnostics / downstream consumers
   * that need keyframe-window metadata rather than resolved values.
   */
  public evaluateStructure(
    timeline: AnimationTimeline,
    currentTime: number
  ): RuntimeEvaluationResult {
    return AnimationTimelineEvaluator.evaluate(timeline, currentTime);
  }
}
