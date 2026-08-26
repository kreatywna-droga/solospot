/**
 * RuntimeFrameCache.test.ts — PM32 Immutable Frame Cache Unit Tests
 *
 * Node environment — no jsdom.
 */

import { describe, it, expect } from 'vitest';
import { RuntimeFrameCache } from '../RuntimeFrameCache';
import type { RuntimeFrameBatch } from '../AnimationRuntimeTypes';

function makeBatch(time: number): RuntimeFrameBatch {
  return { clipId: 'clip-1', time, values: { opacity: 1 } };
}

describe('PM32 — RuntimeFrameCache', () => {
  it('returns null on miss and stores/fetches on hit', () => {
    const cache = new RuntimeFrameCache();
    expect(cache.get('tl-1', 100)).toBeNull();
    cache.set('tl-1', 100, makeBatch(100));
    const hit = cache.get('tl-1', 100);
    expect(hit).not.toBeNull();
    expect(hit!.clipId).toBe('clip-1');
    expect(hit!.time).toBe(100);
  });

  it('has() reflects presence', () => {
    const cache = new RuntimeFrameCache();
    expect(cache.has('tl-1', 100)).toBe(false);
    cache.set('tl-1', 100, makeBatch(100));
    expect(cache.has('tl-1', 100)).toBe(true);
  });

it('does not mutate the input batch (immutable copy is stored)', () => {
    const cache = new RuntimeFrameCache();
const batch = makeBatch(100);
    cache.set('tl-1', 100, batch);
    (batch as { values: Record<string, number> }).values.opacity = 999;
    const hit = cache.get('tl-1', 100)!;
    expect(hit.values.opacity).toBe(1);
  });

  it('invalidates a single entry', () => {
    const cache = new RuntimeFrameCache();
    cache.set('tl-1', 100, makeBatch(100));
    cache.set('tl-1', 200, makeBatch(200));
    cache.invalidate('tl-1', 100);
    expect(cache.get('tl-1', 100)).toBeNull();
    expect(cache.get('tl-1', 200)).not.toBeNull();
  });

  it('invalidates all entries for a timeline', () => {
    const cache = new RuntimeFrameCache();
    cache.set('tl-1', 100, makeBatch(100));
    cache.set('tl-1', 200, makeBatch(200));
    cache.set('tl-2', 100, makeBatch(100));
    cache.invalidateTimeline('tl-1');
    expect(cache.get('tl-1', 100)).toBeNull();
    expect(cache.get('tl-1', 200)).toBeNull();
    expect(cache.get('tl-2', 100)).not.toBeNull();
  });

  it('clears all entries', () => {
    const cache = new RuntimeFrameCache();
    cache.set('tl-1', 100, makeBatch(100));
    cache.clear();
    expect(cache.size).toBe(0);
  });

  it('evicts LRU entries beyond maxEntries', () => {
    const cache = new RuntimeFrameCache({ maxEntries: 2 });
    cache.set('tl-1', 100, makeBatch(100));
    cache.set('tl-1', 200, makeBatch(200));
    cache.set('tl-1', 300, makeBatch(300));
    expect(cache.size).toBe(2);
    // The oldest (time 100) was evicted.
    expect(cache.get('tl-1', 100)).toBeNull();
    expect(cache.get('tl-1', 300)).not.toBeNull();
  });

  it('throws when maxEntries is not positive', () => {
    expect(() => new RuntimeFrameCache({ maxEntries: 0 })).toThrow();
  });
});
