/**
 * RuntimeScheduler.ts — PM32 Deterministic Runtime Scheduler
 *
 * A pure, deterministic scheduler that advances a timeline by discrete
 * delta-time steps. NO requestAnimationFrame, NO setTimeout, NO setInterval,
 * NO browser APIs. The host (later PM33+) is responsible for supplying
 * deltaTime and calling the scheduler.
 */

import { AnimationTimelineEvaluator } from './AnimationTimelineEvaluator';
import { AnimationPlaybackController } from './AnimationPlaybackController';
import { RuntimeFrameAssembler } from './RuntimeFrameAssembler';
import type { AnimationTimeline } from './AnimationTypes';
import type { RuntimeState, RuntimeTick, RuntimeFrameBatch } from './AnimationRuntimeTypes';

export interface RuntimeSchedulerConfig {
  readonly timeline: AnimationTimeline;
  /** Initial playhead time (ms). */
  readonly initialTime?: number;
  readonly speed?: number;
  readonly loop?: boolean;
}

export class RuntimeScheduler {
  private readonly _timeline: AnimationTimeline;
  private readonly _controller: AnimationPlaybackController;
  private _time: number;

  constructor(config: RuntimeSchedulerConfig) {
    this._timeline = config.timeline;
    const duration = this.computeDuration(config.timeline);
    this._controller = new AnimationPlaybackController({
      duration,
      speed: config.speed ?? config.timeline.playback.speed ?? 1,
      loop: config.loop ?? config.timeline.playback.loop,
    });
    this._time = config.initialTime ?? 0;
  }

  private computeDuration(timeline: AnimationTimeline): number {
    if (!timeline.clips || timeline.clips.length === 0) return 0;
    return Math.max(...timeline.clips.map((c) => c.delay + c.duration));
  }

  private toRuntimeState(): RuntimeState {
    const snap = this._controller.snapshot();
    return {
      status: snap.status,
      currentTime: this._time,
      duration: snap.duration,
      speed: snap.speed,
      loop: snap.loop,
      direction: snap.direction,
    };
  }

  /**
   * Advances the playhead by `deltaTime` (ms) and returns the resolved tick.
   * When the controller is not 'playing', only re-evaluates at the current time.
   */
  public tick(deltaTime: number): RuntimeTick {
    this._controller.advance(deltaTime);
    this._time = this._controller.currentTime;
    return this.evaluate();
  }

  /**
   * Advances the playhead by `deltaTime` and returns the raw resolved batch.
   */
  public advance(deltaTime: number): RuntimeFrameBatch {
    this._controller.advance(deltaTime);
    this._time = this._controller.currentTime;
    return this.current();
  }

  /**
   * Resets the scheduler to its initial state (idle, time 0).
   */
  public reset(): void {
    this._controller.reset();
    this._time = 0;
  }

  /** Starts playback from the current playhead. */
  public play(): void {
    this._controller.play();
  }

  /** Pauses playback, freezing the playhead. */
  public pause(): void {
    this._controller.pause();
  }

  /** Stops playback and rewinds to time 0. */
  public stop(): void {
    this._controller.stop();
    this._time = 0;
  }

  /** Jumps to an absolute time (ms). */
  public seek(timeMs: number): void {
    this._controller.seek(timeMs);
    this._time = this._controller.currentTime;
  }

  /** Evaluates the timeline at the current playhead, returning a tick. */
  public evaluate(): RuntimeTick {
    const state = this.toRuntimeState();
    const batch = RuntimeFrameAssembler.assemble(this._timeline, this._time);
    return { batch, state, time: this._time };
  }

  /** Evaluates the timeline at the current playhead, returning only the batch. */
  public current(): RuntimeFrameBatch {
    return RuntimeFrameAssembler.assemble(this._timeline, this._time);
  }

  /** Direct access to the underlying timeline evaluator (pure). */
  public get timelineEvaluator(): typeof AnimationTimelineEvaluator {
    return AnimationTimelineEvaluator;
  }

  public get time(): number {
    return this._time;
  }

  public get state(): RuntimeState {
    return this.toRuntimeState();
  }
}
