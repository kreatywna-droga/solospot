/**
 * LiveScrubbingEngine.ts — PM38 Live Scrubbing Engine (ETAP 2)
 *
 * Handles real-time playhead scrubbing events across the timeline.
 *
 * DECISION-054: Live Scrubbing delegates evaluation exclusively to AnimationRuntimeBridge.
 *
 * Upon scrubbing to any time:
 *   1. Evaluates target timeline frame via injected RuntimeBridge.
 *   2. Generates updated RuntimeFrameBatch.
 *   3. Dispatches evaluated batch to Preview Target.
 *
 * ZERO requestAnimationFrame in domain layer.
 * Preview adapter/target decides when to render.
 */

import type { AnimationTimeline } from '../../../builder-core/src/animation/AnimationTypes';
import type { RuntimeFrameBatch, RuntimeState } from '../../../builder-core/src/animation/AnimationRuntimeTypes';

export interface ScrubbingRuntimeBridge {
  evaluateFrame(
    timeline: AnimationTimeline,
    runtimeState: RuntimeState,
    currentTime: number
  ): RuntimeFrameBatch;
}

export interface LiveScrubbingResult {
  readonly timeMs: number;
  readonly frameBatch: RuntimeFrameBatch | null;
  readonly isScrubbing: boolean;
}

export interface LiveScrubbingOptions {
  runtimeBridge: ScrubbingRuntimeBridge;
}

export class LiveScrubbingEngine {
  private readonly _runtimeBridge: ScrubbingRuntimeBridge;
  private _isScrubbing = false;

  constructor(options: LiveScrubbingOptions) {
    this._runtimeBridge = options.runtimeBridge;
  }

  get isScrubbing(): boolean {
    return this._isScrubbing;
  }

  /**
   * Signals start of user scrubbing action.
   */
  startScrubbing(): void {
    this._isScrubbing = true;
  }

  /**
   * Evaluates timeline frame at exact scrub position (timeMs) via RuntimeBridge,
   * preserving duration, speed, loop from Single Time Owner (DECISION-056).
   */
  scrubTo(
    timeline: AnimationTimeline | null,
    timeMs: number,
    baseState?: Partial<RuntimeState>
  ): LiveScrubbingResult {
    const time = Math.max(0, timeMs);

    if (!timeline) {
      return {
        timeMs: time,
        frameBatch: null,
        isScrubbing: this._isScrubbing,
      };
    }

    const runtimeState: RuntimeState = {
      status: baseState?.status ?? 'paused',
      currentTime: time,
      duration: baseState?.duration ?? (timeline.clips ? Math.max(0, ...timeline.clips.map(c => c.delay + c.duration)) : 0),
      speed: baseState?.speed ?? timeline.playback?.speed ?? 1,
      loop: baseState?.loop ?? timeline.playback?.loop ?? false,
      direction: baseState?.direction ?? 'normal',
    };

    const frameBatch = this._runtimeBridge.evaluateFrame(timeline, runtimeState, time);

    return {
      timeMs: time,
      frameBatch,
      isScrubbing: this._isScrubbing,
    };
  }

  /**
   * Signals end of user scrubbing action.
   */
  stopScrubbing(): void {
    this._isScrubbing = false;
  }
}
