import { describe, expect, it } from 'vitest';
import { RenderCache } from '../RenderCache';
import { RenderCacheKeyDTO } from '../RenderCacheKey';
import { RendererCommand } from '../RendererCommand';

describe('RenderCache (S11 ETAP 6)', () => {
  const sampleKey: RenderCacheKeyDTO = {
    frameIndex: 12,
    timestampMs: 200,
    docRevision: 'rev_100',
    width: 1920,
    height: 1080,
    devicePixelRatio: 1.0,
    pageId: 'home',
  };

  const sampleCommands: RendererCommand[] = [
    { type: 'CLEAR' },
    { type: 'DRAW_RECT', nodeId: 'rect1', bounds: { x: 0, y: 0, width: 100, height: 100 } },
  ];

  it('stores and retrieves cached command buffers', () => {
    const cache = new RenderCache(50);
    expect(cache.get(sampleKey)).toBeUndefined();

    cache.set(sampleKey, sampleCommands);
    const retrieved = cache.get(sampleKey);

    expect(retrieved).toBeDefined();
    expect(retrieved?.length).toBe(2);

    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
  });

  it('invalidates cache entries on document revision change', () => {
    const cache = new RenderCache(50);
    cache.set(sampleKey, sampleCommands);

    const evicted = cache.invalidateRevision('rev_101');
    expect(evicted).toBe(1);
    expect(cache.get(sampleKey)).toBeUndefined();
  });

  it('enforces maximum capacity with LRU eviction', () => {
    const cache = new RenderCache(2);

    const key1: RenderCacheKeyDTO = { ...sampleKey, frameIndex: 1 };
    const key2: RenderCacheKeyDTO = { ...sampleKey, frameIndex: 2 };
    const key3: RenderCacheKeyDTO = { ...sampleKey, frameIndex: 3 };

    cache.set(key1, sampleCommands);
    cache.set(key2, sampleCommands);
    expect(cache.getStats().totalEntries).toBe(2);

    cache.set(key3, sampleCommands); // Pushes out key1
    expect(cache.getStats().totalEntries).toBe(2);
    expect(cache.get(key1)).toBeUndefined();
    expect(cache.get(key2)).toBeDefined();
    expect(cache.get(key3)).toBeDefined();
  });
});
