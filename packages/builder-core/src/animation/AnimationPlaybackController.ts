/**
 * AnimationPlaybackController.ts — PM30 Playback Controller
 *
 * Pure, deterministic state machine for animation playback. No
 * requestAnimationFrame, no DOM binding, no clocks.
 */

import type { PlaybackStatus, RuntimePlaybackDirection } from './AnimationRuntimeTypes';

export interface PlaybackControllerConfig {
  duration: number;
  speed?: number;
  loop?: boolean;
  direction?: RuntimePlaybackDirection;
}

export class AnimationPlaybackController {
  private readonly _duration: number;
  private readonly _speed: number;
  private readonly _loop: boolean;
  private readonly _direction: RuntimePlaybackDirection;

  private _status: PlaybackStatus = 'idle';
  private _currentTime = 0;

  constructor(config: PlaybackControllerConfig) {
    if (!config || config.duration <= 0) {
      throw new Error('AnimationPlaybackController: duration must be positive.');
    }
    this._duration = config.duration;
    this._speed = config.speed ?? 1;
    this._loop = config.loop ?? true;
    this._direction = config.direction ?? 'normal';
  }

  get status(): PlaybackStatus {
    return this._status;
  }

  get currentTime(): number {
    return this._currentTime;
  }

  get duration(): number {
    return this._duration;
  }

  get speed(): number {
    return this._speed;
  }

  get loop(): boolean {
    return this._loop;
  }

  get direction(): RuntimePlaybackDirection {
    return this._direction;
  }

  snapshot(): {
    status: PlaybackStatus;
    currentTime: number;
    duration: number;
    speed: number;
    loop: boolean;
    direction: RuntimePlaybackDirection;
  } {
    return {
      status: this._status,
      currentTime: this._currentTime,
      duration: this._duration,
      speed: this._speed,
      loop: this._loop,
      direction: this._direction,
    };
  }

  play(): void {
    if (this._status === 'stopped') {
      this._currentTime = 0;
    }
    this._status = 'playing';
  }

  pause(): void {
    if (this._status === 'playing') {
      this._status = 'paused';
    }
  }

  stop(): void {
    this._status = 'stopped';
    this._currentTime = 0;
  }

  reset(): void {
    this._status = 'idle';
    this._currentTime = 0;
  }

  seek(timeMs: number): void {
    this._currentTime = Math.max(0, Math.min(this._duration, timeMs));
  }

  /**
   * Advance the playhead by `deltaMs` (scaled by speed and direction).
   */
  advance(deltaMs: number): void {
    if (this._status !== 'playing') return;

    const scaled = deltaMs * this._speed;
    const next = this._direction === 'reverse'
      ? this._currentTime - scaled
      : this._currentTime + scaled;

    if (this._direction === 'reverse') {
      if (next <= 0) {
        this._currentTime = 0;
        if (!this._loop) this._status = 'paused';
      } else {
        this._currentTime = next;
      }
      return;
    }

    if (next >= this._duration) {
      if (this._loop) {
        this._currentTime = next % this._duration;
      } else {
        this._currentTime = this._duration;
        this._status = 'paused';
      }
      return;
    }

    this._currentTime = next;
  }
}
