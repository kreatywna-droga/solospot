import { describe, it, expect, beforeEach } from 'vitest';
import { RuntimeCache } from '../RuntimeCache';

describe('RuntimeCache', () => {
  let cache: RuntimeCache;

  beforeEach(() => {
    cache = new RuntimeCache({ maxEntries: 3 });
  });

  describe('buildKey', () => {
    it('builds unique keys for different modes', () => {
      const key1 = RuntimeCache.buildKey({ slug: 'my-store', mode: 'PREVIEW' });
      const key2 = RuntimeCache.buildKey({ slug: 'my-store', mode: 'LIVE' });
      expect(key1).not.toBe(key2);
    });

    it('builds unique keys for different locales', () => {
      const key1 = RuntimeCache.buildKey({ slug: 'my-store', mode: 'PREVIEW', locale: 'pl' });
      const key2 = RuntimeCache.buildKey({ slug: 'my-store', mode: 'PREVIEW', locale: 'en' });
      expect(key1).not.toBe(key2);
    });

    it('uses correct key format: slug:mode:locale:currency:hash', () => {
      const key = RuntimeCache.buildKey({ slug: 'my-store', mode: 'PREVIEW' });
      expect(key).toBe('my-store:PREVIEW:pl:PLN:');
    });
  });

  describe('get / set', () => {
    it('stores and retrieves cached items before TTL expires', () => {
      cache.set('key1', { value: 123 }, 60_000);
      const retrieved = cache.get<{ value: number }>('key1');
      expect(retrieved).toEqual({ value: 123 });
    });

    it('returns undefined for missing keys', () => {
      const retrieved = cache.get('nonexistent');
      expect(retrieved).toBeUndefined();
    });

    it('returns undefined for expired items (ttl=-1 means expired already)', () => {
      // TTL of 0 means expiresAt=0 which means no-expiry (PREVIEW mode pattern)
      // TTL of -1 means Date.now() - 1 which is immediately expired
      cache.set('key1', { value: 123 }, -1);
      const retrieved = cache.get('key1');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('clears all items on clear()', () => {
      cache.set('k1', 'v1', 60_000);
      cache.set('k2', 'v2', 60_000);
      cache.clear();
      expect(cache.get('k1')).toBeUndefined();
      expect(cache.get('k2')).toBeUndefined();
      expect(cache.getStats().size).toBe(0);
    });
  });

  describe('LRU eviction', () => {
    it('evicts oldest item when capacity is exceeded', () => {
      cache.set('item1', 'v1', 60_000);
      cache.set('item2', 'v2', 60_000);
      cache.set('item3', 'v3', 60_000);

      // All 3 at capacity; insert 4th → evicts item1 (oldest)
      cache.set('item4', 'v4', 60_000);

      expect(cache.get('item1')).toBeUndefined(); // evicted
      expect(cache.get('item2')).toBe('v2');
      expect(cache.get('item3')).toBe('v3');
      expect(cache.get('item4')).toBe('v4');
    });
  });

  describe('getTTL', () => {
    it('returns 0 for PREVIEW mode (no cache)', () => {
      expect(cache.getTTL('PREVIEW')).toBe(0);
    });

    it('returns 60_000ms for LIVE mode', () => {
      expect(cache.getTTL('LIVE')).toBe(60_000);
    });

    it('returns 300_000ms for EXPORT mode', () => {
      expect(cache.getTTL('EXPORT')).toBe(300_000);
    });
  });

  describe('invalidate', () => {
    it('removes a specific key', () => {
      cache.set('k1', 'v1', 60_000);
      cache.invalidate('k1');
      expect(cache.get('k1')).toBeUndefined();
    });

    it('removes all keys matching prefix', () => {
      cache.set('store-a:LIVE:pl:PLN:', 'v1', 60_000);
      cache.set('store-a:PREVIEW:pl:PLN:', 'v2', 60_000);
      cache.set('store-b:LIVE:pl:PLN:', 'v3', 60_000);
      cache.invalidatePrefix('store-a:');
      expect(cache.get('store-a:LIVE:pl:PLN:')).toBeUndefined();
      expect(cache.get('store-a:PREVIEW:pl:PLN:')).toBeUndefined();
      expect(cache.get('store-b:LIVE:pl:PLN:')).toBe('v3');
    });
  });
});
