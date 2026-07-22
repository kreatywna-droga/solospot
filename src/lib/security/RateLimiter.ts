export interface RateLimitInfo {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

export class RateLimiter {
  private static readonly windows = new Map<string, number[]>();

  /**
   * Checks if the identifier (IP, userId, providerId) has exceeded the limits.
   * Uses a sliding window algorithm.
   */
  public static checkLimit(
    key: string,
    limit: number,
    windowMs = 60000
  ): RateLimitInfo {
    const now = Date.now();
    const timestamps = this.windows.get(key) || [];

    // Filter out timestamps outside of the sliding window
    const windowStart = now - windowMs;
    const activeTimestamps = timestamps.filter(t => t > windowStart);

    if (activeTimestamps.length >= limit) {
      this.windows.set(key, activeTimestamps);
      const oldestActive = activeTimestamps[0] || now;
      const resetTime = oldestActive + windowMs;

      return {
        allowed: false,
        limit,
        remaining: 0,
        resetTime,
      };
    }

    activeTimestamps.push(now);
    this.windows.set(key, activeTimestamps);

    return {
      allowed: true,
      limit,
      remaining: limit - activeTimestamps.length,
      resetTime: now + windowMs,
    };
  }

  public static clear(): void {
    this.windows.clear();
  }
}
