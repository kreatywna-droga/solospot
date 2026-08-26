/**
 * RenderCache.ts — Sprint S11 Render Cache LRU Implementation
 *
 * Provides deterministic caching of compiled RendererCommand arrays.
 * Invalidates entries on document revision change or capacity overflow.
 * NO DOM, NO React, NO window.
 */

import { RendererCommand } from './RendererCommand';
import { createRenderCacheKey, RenderCacheKeyDTO } from './RenderCacheKey';

export interface RenderCacheEntry {
  readonly key: string;
  readonly docRevision: string;
  readonly commands: ReadonlyArray<RendererCommand>;
  readonly cachedAtMs: number;
}

export interface RenderCacheStats {
  readonly hits: number;
  readonly misses: number;
  readonly totalEntries: number;
  readonly maxCapacity: number;
}

export class RenderCache {
  private cache = new Map<string, RenderCacheEntry>();
  private maxCapacity: number;
  private hits = 0;
  private misses = 0;

  constructor(maxCapacity: number = 200) {
    this.maxCapacity = Math.max(1, maxCapacity);
  }

  public get(keyDto: RenderCacheKeyDTO): ReadonlyArray<RendererCommand> | undefined {
    const key = createRenderCacheKey(keyDto);
    const entry = this.cache.get(key);

    if (entry) {
      this.hits++;
      // Move to back (most recently used)
      this.cache.delete(key);
      this.cache.set(key, entry);
      return entry.commands;
    }

    this.misses++;
    return undefined;
  }

  public set(keyDto: RenderCacheKeyDTO, commands: ReadonlyArray<RendererCommand>): void {
    const key = createRenderCacheKey(keyDto);

    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxCapacity) {
      // LRU eviction of oldest key
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      key,
      docRevision: keyDto.docRevision,
      commands: [...commands],
      cachedAtMs: Date.now(),
    });
  }

  public invalidateRevision(docRevision: string): number {
    let evictedCount = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.docRevision !== docRevision) {
        this.cache.delete(key);
        evictedCount++;
      }
    }
    return evictedCount;
  }

  public clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  public getStats(): RenderCacheStats {
    return {
      hits: this.hits,
      misses: this.misses,
      totalEntries: this.cache.size,
      maxCapacity: this.maxCapacity,
    };
  }
}
