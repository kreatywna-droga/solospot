/**
 * StorefrontLegacyCartSessionAdapter.ts — Legacy Session Adapter Deprecation Wrapper (Sprint G1-172)
 *
 * @deprecated StorefrontLegacyCartSessionAdapter is deprecated and scheduled for removal.
 * Use StorefrontCustomerActivityStreamEngine directly instead. (G1-172 DEPRECATE)
 */

import { StorefrontCustomerActivityStreamEngine } from './StorefrontCustomerActivityStreamEngine';

export class StorefrontLegacyCartSessionAdapter {
  private engine: StorefrontCustomerActivityStreamEngine;

  constructor(tenantId = 'default_tenant') {
    this.engine = new StorefrontCustomerActivityStreamEngine(tenantId);
  }

  /**
   * @deprecated Use StorefrontCustomerActivityStreamEngine.trackEvent instead.
   */
  public logCartSessionActivity(sessionId: string, path: string): void {
    this.engine.trackEvent({
      eventId: `leg_${Date.now()}_${Math.random()}`,
      sessionId,
      eventType: 'PAGE_VIEW',
      pathOrUrl: path
    });
  }

  public getTenantId(): string {
    return this.engine.getTenantId();
  }
}
