import { TenantContext, TenantCacheEntry } from './TenantTypes';

/**
 * TenantCache provides in-memory caching of resolved TenantContext objects.
 * Adheres to strict L1/L2 TTL invalidation guidelines and Fail-Closed security.
 */
export class TenantCache {
  private readonly store = new Map<string, TenantCacheEntry>();
  private readonly defaultTtlMs: number;

  constructor(defaultTtlSeconds = 300) {
    this.defaultTtlMs = defaultTtlSeconds * 1000;
  }

  /**
   * Retrieves tenant context from cache. Returns null if missing or expired.
   * Expired cache entries are immediately evicted (Fail-Closed).
   */
  public get(key: string): TenantContext | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now >= entry.expiresAt) {
      this.store.delete(key);
      return null; // Expired context is treated as cache miss (Fail-Closed on database outage)
    }

    return entry.context;
  }

  /**
   * Stores a resolved tenant context in the cache.
   */
  public set(key: string, context: TenantContext, ttlMs = this.defaultTtlMs): void {
    this.store.set(key, {
      context,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Invalidates a specific key in the cache.
   */
  public invalidate(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clears all cached tenant contexts.
   */
  public clear(): void {
    this.store.clear();
  }
}
