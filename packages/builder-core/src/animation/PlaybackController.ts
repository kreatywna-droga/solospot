/**
 * PlaybackController.ts — PM30 Stateful Playback Controller
 *
 * Manages timeline playback state, playhead position, loop count, and time progression.
 * Pure state machine — NO requestAnimationFrame, NO DOM binding.
 */

import type { AnimationTimeline } from './AnimationTypes';
import { TimelineEvaluator } from './TimelineEvaluator';

export type PlaybackState = 'idle' | 'playing' | 'paused' | 'completed';

export class PlaybackController {
  private timeline: AnimationTimeline;
  private currentTimeMs = 0;
  private state: PlaybackState = 'idle';
  private currentLoopIndex = 0;

  constructor(timeline: AnimationTimeline) {
    this.timeline = timeline;
  }

  public play(): void {
    if (this.state === 'completed') {
      this.currentTimeMs = 0;
      this.currentLoopIndex = 0;
    }
    this.state = 'playing';
  }

  public pause(): void {
    if (this.state === 'playing') {
      this.state = 'paused';
    }
  }

  public stop(): void {
    this.state = 'idle';
    this.currentTimeMs = 0;
    this.currentLoopIndex = 0;
  }

  public seek(timeMs: number): void {
    const totalDuration = this.getTotalDuration();
    this.currentTimeMs = Math.max(0, Math.min(totalDuration, timeMs));
  }

  /**
   * Advances the playback controller state by `deltaTimeMs`.
   * Returns current evaluated properties.
   */
  public tick(deltaTimeMs: number): Record<string, unknown> {
    if (this.state !== 'playing') {
      return this.evaluateCurrentState();
    }

    const speed = this.timeline.playback.speed ?? 1.0;
    this.currentTimeMs += deltaTimeMs * speed;

    const totalDuration = this.getTotalDuration();
    if (this.currentTimeMs >= totalDuration) {
      if (this.timeline.playback.loop) {
        this.currentTimeMs = this.currentTimeMs % totalDuration;
        this.currentLoopIndex++;
      } else {
        this.currentTimeMs = totalDuration;
        this.state = 'completed';
      }
    }

    return this.evaluateCurrentState();
  }

  public getCurrentTime(): number {
    return this.currentTimeMs;
  }

  public getState(): PlaybackState {
    return this.state;
  }

  public evaluateCurrentState(): Record<string, unknown> {
    const mergedProps: Record<string, unknown> = {};
    this.timeline.clips.forEach((clip) => {
      const clipProps = TimelineEvaluator.evaluateClip(clip, this.currentTimeMs);
      Object.assign(mergedProps, clipProps);
    });
    return mergedProps;
  }

  private getTotalDuration(): number {
    if (!this.timeline.clips || this.timeline.clips.length === 0) return 0;
    return Math.max(...this.timeline.clips.map((c) => c.delay + c.duration));
  }
}
