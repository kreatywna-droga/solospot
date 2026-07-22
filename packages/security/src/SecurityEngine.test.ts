import { describe, it, expect } from 'vitest';
import { SecurityEngine } from './SecurityEngine';
import { SecurityConfig } from './SecurityDomain';

describe('SecurityEngine', () => {
  const engine = new SecurityEngine();

  it('should apply security config', () => {
    const config: SecurityConfig = {
      id: 'sec-1',
      organizationId: 'org-1',
      policy: {
        csp: "default-src 'self'",
        rateLimit: { requests: 100, windowMs: 60000 },
        cors: { origins: ['https://example.com'], credentials: true }
      },
      enabled: true
    };

    engine.applyConfig('org-1', config);
  });

  it('should enforce rate limiting', () => {
    expect(engine.checkRateLimit('org-1', 2, 60000)).toBe(true);
    expect(engine.checkRateLimit('org-1', 2, 60000)).toBe(true);
    expect(engine.checkRateLimit('org-1', 2, 60000)).toBe(false);
  });

  it('should generate security headers', () => {
    const headers = engine.getSecurityHeaders('org-1');
    expect(headers['Content-Security-Policy']).toBeDefined();
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
  });
});