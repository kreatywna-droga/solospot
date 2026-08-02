/**
 * RuntimeCache
 *
 * TTL-based cache for runtime render results.
 * Supports LRU eviction when max entries exceeded.
 *
 * Cache key structure: `{slug}:{mode}:{locale}:{currency}:{documentHash}`
 *
 * TTL defaults:
 *   - LIVE: 60s
 *   - PREVIEW: 0s (no cache)
 *   - EXPORT: 300s
 */
export interface CacheEntry<T> {
  readonly value: T;
  readonly expiresAt: number;
  readonly createdAt: number;
  readonly hitCount: number;
}

export interface RuntimeCacheOptions {
  /** Max entries before LRU eviction (default: 100) */
  maxEntries?: number;
  /** Default TTL in ms per mode */
  defaultTTL?: Partial<Record<'LIVE' | 'PREVIEW' | 'EXPORT', number>>;
}

const DEFAULT_TTL: Record<string, number> = {
  LIVE: 60_000,
  PREVIEW: 0,
  EXPORT: 300_000,
};

export class RuntimeCache {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly maxEntries: number;
  private readonly defaultTTL: Record<string, number>;

  constructor(options: RuntimeCacheOptions = {}) {
    this.maxEntries = options.maxEntries ?? 100;
    this.defaultTTL = {
      LIVE: options.defaultTTL?.LIVE ?? DEFAULT_TTL.LIVE,
      PREVIEW: options.defaultTTL?.PREVIEW ?? DEFAULT_TTL.PREVIEW,
      EXPORT: options.defaultTTL?.EXPORT ?? DEFAULT_TTL.EXPORT,
    };
  }

  /**
   * Build a cache key from render parameters.
   */
  static buildKey(params: {
    slug: string;
    mode: string;
    locale?: string;
    currency?: string;
    documentHash?: string;
  }): string {
    const { slug, mode, locale = 'pl', currency = 'PLN', documentHash = '' } = params;
    return `${slug}:${mode}:${locale}:${currency}:${documentHash}`;
  }

  /**
   * Get a value from cache. Returns undefined if not found or expired.
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return undefined;

    // Check expiration
    if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // Update hit count (mutate in-place for performance)
    (entry as { hitCount: number }).hitCount++;
    return entry.value;
  }

  /**
   * Set a value in cache with TTL.
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // Evict if at capacity
    if (this.cache.size >= this.maxEntries) {
      this.evictLRU();
    }

    const expiresAt = ttl !== undefined ? (ttl > 0 ? Date.now() + ttl : 0) : 0;
    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now(),
      hitCount: 0,
    } as CacheEntry<unknown>);
  }

  /**
   * Get TTL for a given mode.
   */
  getTTL(mode: string): number {
    return this.defaultTTL[mode] ?? DEFAULT_TTL.LIVE;
  }

  /**
   * Invalidate a specific cache key.
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching a prefix.
   * E.g., invalidatePrefix('my-store:') clears all modes for that store.
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics.
   */
  getStats(): { size: number; maxEntries: number; keys: string[] } {
    return {
      size: this.cache.size,
      maxEntries: this.maxEntries,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Evict the least recently used entry (oldest creation time).
   */
  private evictLRU(): void {
    let oldestKey: string | undefined;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

/**
 * Singleton instance for global use.
 * Can be replaced with a new instance for testing.
 */
export const globalRuntimeCache = new RuntimeCache();
