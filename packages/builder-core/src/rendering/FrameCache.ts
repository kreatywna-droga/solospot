/**
 * FrameCache.ts — Sprint S10 Rendering Pipeline
 *
 * Cache for previously computed frames to accelerate static and loop playback.
 * Pure in-memory cache. NO Browser API dependencies.
 */

import { RenderFrame } from './RenderFrame';

export interface FrameCacheOptions {
  readonly maxEntries?: number;
}

export class FrameCache {
  private cache: Map<string, RenderFrame>;
  private maxEntries: number;
  private hits: number = 0;
  private misses: number = 0;

  constructor(options?: FrameCacheOptions) {
    this.cache = new Map();
    this.maxEntries = options?.maxEntries ?? 500;
  }

  public get(key: string): RenderFrame | undefined {
    const frame = this.cache.get(key);
    if (frame) {
      this.hits++;
      // Move to end (LRU behavior)
      this.cache.delete(key);
      this.cache.set(key, frame);
      return { ...frame, isCached: true };
    }
    this.misses++;
    return undefined;
  }

  public set(key: string, frame: RenderFrame): void {
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, frame);
  }

  public clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  public getStats(): { size: number; hits: number; misses: number; hitRatio: number } {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRatio: total > 0 ? this.hits / total : 0,
    };
  }
}
