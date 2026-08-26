/**
 * RenderProgressTracker.ts — Sprint S27 Render Progress & Throughput Tracker
 *
 * Deterministic progress tracker and ETA estimator for rendering frames.
 * Calculates frame counts, elapsed rendering time, rendering FPS, percentage, and estimated remaining time (ETA).
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { RenderJobProgress } from './RenderQueueEngine';

export interface ProgressTrackerOptions {
  readonly totalFrames: number;
  readonly targetFps?: number;
  readonly startTimeMs?: number;
}

export class RenderProgressTracker {
  private readonly totalFrames: number;
  private readonly targetFps: number;
  private currentFrame: number;
  private startTimeMs: number;
  private lastUpdateTimeMs: number;
  private isRunning: boolean;

  constructor(options: ProgressTrackerOptions) {
    this.totalFrames = Math.max(1, Math.round(options.totalFrames));
    this.targetFps = options.targetFps ?? 30;
    this.currentFrame = 0;
    this.startTimeMs = options.startTimeMs ?? Date.now();
    this.lastUpdateTimeMs = this.startTimeMs;
    this.isRunning = false;
  }

  /**
   * Starts or resumes tracking.
   */
  public start(nowMs: number = Date.now()): RenderJobProgress {
    this.isRunning = true;
    this.startTimeMs = nowMs;
    this.lastUpdateTimeMs = nowMs;
    return this.getProgress(nowMs);
  }

  /**
   * Updates current frame count and calculates current progress DTO.
   */
  public advanceToFrame(frameIndex: number, nowMs: number = Date.now()): RenderJobProgress {
    const clampedFrame = Math.max(0, Math.min(this.totalFrames, Math.round(frameIndex)));
    this.currentFrame = clampedFrame;
    this.lastUpdateTimeMs = nowMs;
    return this.getProgress(nowMs);
  }

  /**
   * Advances frame count by delta frames.
   */
  public step(deltaFrames: number = 1, nowMs: number = Date.now()): RenderJobProgress {
    return this.advanceToFrame(this.currentFrame + deltaFrames, nowMs);
  }

  /**
   * Marks progress as 100% completed.
   */
  public complete(nowMs: number = Date.now()): RenderJobProgress {
    this.currentFrame = this.totalFrames;
    this.isRunning = false;
    this.lastUpdateTimeMs = nowMs;
    return this.getProgress(nowMs);
  }

  /**
   * Returns current snapshot of RenderJobProgress.
   */
  public getProgress(nowMs: number = Date.now()): RenderJobProgress {
    const elapsedTimeMs = Math.max(0, nowMs - this.startTimeMs);
    const progressPercentage = Math.min(100, Math.max(0, (this.currentFrame / this.totalFrames) * 100));

    // Calculate rendering throughput (FPS)
    let renderingFps = 0;
    if (elapsedTimeMs > 0 && this.currentFrame > 0) {
      renderingFps = (this.currentFrame / elapsedTimeMs) * 1000;
    }

    // Estimate remaining time (ETA)
    let estimatedRemainingMs = 0;
    const remainingFrames = this.totalFrames - this.currentFrame;

    if (remainingFrames > 0) {
      if (renderingFps > 0) {
        estimatedRemainingMs = Math.round((remainingFrames / renderingFps) * 1000);
      } else {
        // Fallback estimate based on target FPS
        estimatedRemainingMs = Math.round((remainingFrames / this.targetFps) * 1000);
      }
    }

    return {
      currentFrame: this.currentFrame,
      totalFrames: this.totalFrames,
      progressPercentage: Number(progressPercentage.toFixed(2)),
      elapsedTimeMs: Math.round(elapsedTimeMs),
      renderingFps: Number(renderingFps.toFixed(2)),
      estimatedRemainingMs: Math.round(estimatedRemainingMs),
    };
  }

  /**
   * Resets progress back to 0.
   */
  public reset(nowMs: number = Date.now()): RenderJobProgress {
    this.currentFrame = 0;
    this.startTimeMs = nowMs;
    this.lastUpdateTimeMs = nowMs;
    this.isRunning = false;
    return this.getProgress(nowMs);
  }
}
