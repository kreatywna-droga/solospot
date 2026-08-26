/**
 * FrameTiming.ts — Sprint S10 Performance Profiling
 *
 * Precision delta time and FPS tracker.
 * Pure math. NO DOM dependencies.
 */

export class FrameTiming {
  private lastTimeMs: number = 0;
  private frameCount: number = 0;
  private accumulatedDeltaMs: number = 0;
  private currentFps: number = 0;

  public tick(nowMs: number): number {
    if (this.lastTimeMs === 0) {
      this.lastTimeMs = nowMs;
      return 0;
    }

    const deltaMs = Math.max(0, nowMs - this.lastTimeMs);
    this.lastTimeMs = nowMs;
    this.frameCount++;
    this.accumulatedDeltaMs += deltaMs;

    if (this.accumulatedDeltaMs >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / this.accumulatedDeltaMs);
      this.frameCount = 0;
      this.accumulatedDeltaMs = 0;
    }

    return deltaMs;
  }

  public getFps(): number {
    return this.currentFps;
  }

  public reset(): void {
    this.lastTimeMs = 0;
    this.frameCount = 0;
    this.accumulatedDeltaMs = 0;
    this.currentFps = 0;
  }
}
