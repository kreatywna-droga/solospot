import { RateLimiter } from './RateLimiter';

export class RateLimitException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitException';
  }
}

export class RequestGuard {
  /**
   * Guards a webhook endpoint. Allow max 100 requests per minute per provider.
   */
  public static guardWebhook(provider: string): void {
    const limitInfo = RateLimiter.checkLimit(`webhook:${provider}`, 100, 60000);
    if (!limitInfo.allowed) {
      const waitSeconds = Math.ceil((limitInfo.resetTime - Date.now()) / 1000);
      throw new RateLimitException(
        `Rate Limit Exceeded: Webhook provider '${provider}' blocked. Reset in ${waitSeconds}s.`
      );
    }
  }

  /**
   * Guards Mission Control API routes. Allow max 60 requests per minute per user.
   */
  public static guardMissionControl(userId: string): void {
    const limitInfo = RateLimiter.checkLimit(`mission-control:${userId}`, 60, 60000);
    if (!limitInfo.allowed) {
      const waitSeconds = Math.ceil((limitInfo.resetTime - Date.now()) / 1000);
      throw new RateLimitException(
        `Rate Limit Exceeded: Mission Control access blocked for user '${userId}'. Reset in ${waitSeconds}s.`
      );
    }
  }
}
