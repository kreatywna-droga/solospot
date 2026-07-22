import { SecurityPolicy, SecurityConfig } from './SecurityDomain';

export class SecurityEngine {
  private configs: Map<string, SecurityConfig> = new Map();
  private requests: Map<string, { count: number; windowStart: number }> = new Map();

  applyConfig(organizationId: string, config: SecurityConfig): void {
    this.configs.set(organizationId, config);
  }

  checkRateLimit(organizationId: string, limit: number, windowMs: number): boolean {
    const key = `rate-${organizationId}`;
    const now = Date.now();

    const current = this.requests.get(key);
    if (!current || now - current.windowStart > windowMs) {
      this.requests.set(key, { count: 1, windowStart: now });
      return true;
    }

    if (current.count >= limit) {
      return false;
    }

    current.count++;
    return true;
  }

  getSecurityHeaders(organizationId: string): Record<string, string> {
    const config = this.configs.get(organizationId);
    if (!config) {
      return {
        'Content-Security-Policy': "default-src 'self'",
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Strict-Transport-Security': 'max-age=31536000'
      };
    }

    return {
      'Content-Security-Policy': config.policy.csp,
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Strict-Transport-Security': 'max-age=31536000',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
  }
}