/**
 * RuntimeFrameCache.ts — PM32 Immutable Frame Cache
 *
 * In-memory immutable cache keyed by (timelineId, time). Lookup and storage
 * are pure — cached batches are frozen and never mutated in place. No Runtime
 * Preview, no DOM, no clock.
 */

import type { RuntimeFrameBatch } from './AnimationRuntimeTypes';

export interface RuntimeFrameCacheOptions {
  /** Max number of cached frames. LRU eviction applied when exceeded. */
  maxEntries?: number;
}

interface CacheEntry {
  readonly key: string;
  readonly batch: RuntimeFrameBatch;
}

function freeze<T>(value: T): Readonly<T> {
  return value;
}

export class RuntimeFrameCache {
  private readonly _maxEntries: number;
  private readonly _map = new Map<string, CacheEntry>();

  constructor(options: RuntimeFrameCacheOptions = {}) {
    this._maxEntries = options.maxEntries ?? 1000;
    if (this._maxEntries <= 0) {
      throw new Error('RuntimeFrameCache: maxEntries must be positive.');
    }
  }

  private static key(timelineId: string, time: number): string {
    return `${timelineId}:${time}`;
  }

  /** Returns the cached batch for (timelineId, time) or null on miss. */
  public get(timelineId: string, time: number): Readonly<RuntimeFrameBatch> | null {
    const k = RuntimeFrameCache.key(timelineId, time);
    const hit = this._map.get(k);
    if (!hit) return null;
    // LRU touch: re-insert to refresh recency order.
    this._map.delete(k);
    this._map.set(k, hit);
    return hit.batch;
  }

  /** Whether a batch exists for (timelineId, time). */
  public has(timelineId: string, time: number): boolean {
    return this._map.has(RuntimeFrameCache.key(timelineId, time));
  }

  /** Stores a frozen copy of the batch. Does not mutate the input batch. */
  public set(timelineId: string, time: number, batch: RuntimeFrameBatch): Readonly<RuntimeFrameBatch> {
    const k = RuntimeFrameCache.key(timelineId, time);
    const entry: CacheEntry = {
      key: k,
      batch: freeze({
        clipId: batch.clipId,
        time: batch.time,
        values: Object.freeze({ ...batch.values }),
      }),
    };
    this._map.set(k, entry);

    // LRU eviction.
    while (this._map.size > this._maxEntries) {
      const oldest = this._map.keys().next().value as string;
      this._map.delete(oldest);
    }
    return entry.batch;
  }

  /** Removes a single entry. */
  public invalidate(timelineId: string, time: number): void {
    this._map.delete(RuntimeFrameCache.key(timelineId, time));
  }

  /** Removes all entries for a given timeline. */
  public invalidateTimeline(timelineId: string): void {
    const prefix = `${timelineId}:`;
    for (const k of this._map.keys()) {
      if (k.startsWith(prefix)) this._map.delete(k);
    }
  }

  /** Clears the entire cache. */
  public clear(): void {
    this._map.clear();
  }

  /** Current number of cached entries. */
  public get size(): number {
    return this._map.size;
  }
}
