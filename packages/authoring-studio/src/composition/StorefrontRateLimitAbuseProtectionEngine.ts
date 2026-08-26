/**
 * StorefrontRateLimitAbuseProtectionEngine.ts — Sprint G1-102 Rate Limiting & Abuse Protection Engine (Night Shift Level 64)
 *
 * Provides pure TypeScript, headless rate-limiting policy evaluation, endpoint classification,
 * sliding-window request counting, lockout state management, and recovery boundaries.
 *
 * HONEST SECURITY: Manages policy evaluation and lockout states purely within domain layer without claiming infrastructure-level firewalling.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type EndpointCategory = 'CHECKOUT' | 'AUTH_LOGIN' | 'SEARCH_QUERY' | 'PUBLIC_API' | 'SENSITIVE_ADMIN';

export interface RateLimitPolicyDTO {
  readonly endpointCategory: EndpointCategory;
  readonly maxRequestsPerWindow: number;
  readonly windowMs: number;
  readonly lockoutDurationMs: number;
}

export interface ClientRequestHistoryDTO {
  readonly clientIdentifier: string;
  readonly endpointCategory: EndpointCategory;
  readonly timestampsMs: ReadonlyArray<number>;
  readonly lockedOutUntilMs?: number;
}

export interface RateLimitEvaluationDTO {
  readonly allowed: boolean;
  readonly clientIdentifier: string;
  readonly endpointCategory: EndpointCategory;
  readonly currentCount: number;
  readonly remainingRequests: number;
  readonly windowResetMs: number;
  readonly isLockedOut: boolean;
  readonly lockoutRemainingMs: number;
}

export interface RateLimitAbuseProtectionEngineStateDTO {
  readonly tenantId: string;
  readonly policies: Record<string, RateLimitPolicyDTO>;
  readonly clientHistories: Record<string, ClientRequestHistoryDTO>; // `client:category` -> history
}

export class StorefrontRateLimitAbuseProtectionEngine {
  private readonly tenantId: string;
  private policies: Map<EndpointCategory, RateLimitPolicyDTO> = new Map();
  private clientHistories: Map<string, ClientRequestHistoryDTO> = new Map();

  constructor(tenantId = 'default_tenant') {
    this.tenantId = tenantId;
    this.initializeDefaultPolicies();
  }

  private initializeDefaultPolicies(): void {
    const defaults: RateLimitPolicyDTO[] = [
      { endpointCategory: 'CHECKOUT', maxRequestsPerWindow: 10, windowMs: 60 * 1000, lockoutDurationMs: 15 * 60 * 1000 },
      { endpointCategory: 'AUTH_LOGIN', maxRequestsPerWindow: 5, windowMs: 60 * 1000, lockoutDurationMs: 30 * 60 * 1000 },
      { endpointCategory: 'SEARCH_QUERY', maxRequestsPerWindow: 60, windowMs: 60 * 1000, lockoutDurationMs: 5 * 60 * 1000 },
      { endpointCategory: 'PUBLIC_API', maxRequestsPerWindow: 100, windowMs: 60 * 1000, lockoutDurationMs: 5 * 60 * 1000 },
      { endpointCategory: 'SENSITIVE_ADMIN', maxRequestsPerWindow: 20, windowMs: 60 * 1000, lockoutDurationMs: 15 * 60 * 1000 }
    ];

    defaults.forEach(p => this.policies.set(p.endpointCategory, p));
  }

  /**
   * Configures a custom rate-limiting policy for an endpoint category.
   */
  public setPolicy(policy: RateLimitPolicyDTO): void {
    if (policy.maxRequestsPerWindow <= 0 || policy.windowMs <= 0) {
      throw new Error('maxRequestsPerWindow and windowMs must be positive numbers');
    }
    this.policies.set(policy.endpointCategory, policy);
  }

  /**
   * Evaluates rate-limit availability and records request timestamp for a client.
   */
  public evaluateRequest(clientIdentifier: string, category: EndpointCategory): RateLimitEvaluationDTO {
    if (!clientIdentifier || !category) {
      throw new Error('clientIdentifier and category are required for rate limit evaluation');
    }

    const policy = this.policies.get(category);
    if (!policy) {
      throw new Error(`Unrecognized endpoint category: ${category}`);
    }

    const now = Date.now();
    const historyKey = `${clientIdentifier.trim()}:${category}`;
    const existing = this.clientHistories.get(historyKey) || {
      clientIdentifier: clientIdentifier.trim(),
      endpointCategory: category,
      timestampsMs: []
    };

    // Check existing lockout state
    if (existing.lockedOutUntilMs && existing.lockedOutUntilMs > now) {
      const lockoutRemainingMs = existing.lockedOutUntilMs - now;
      return {
        allowed: false,
        clientIdentifier: clientIdentifier.trim(),
        endpointCategory: category,
        currentCount: policy.maxRequestsPerWindow,
        remainingRequests: 0,
        windowResetMs: existing.lockedOutUntilMs,
        isLockedOut: true,
        lockoutRemainingMs
      };
    }

    // Filter timestamps within sliding window
    const windowStart = now - policy.windowMs;
    const validTimestamps = existing.timestampsMs.filter(t => t >= windowStart);

    if (validTimestamps.length >= policy.maxRequestsPerWindow) {
      const lockedOutUntilMs = now + policy.lockoutDurationMs;
      this.clientHistories.set(historyKey, {
        ...existing,
        timestampsMs: validTimestamps,
        lockedOutUntilMs
      });

      return {
        allowed: false,
        clientIdentifier: clientIdentifier.trim(),
        endpointCategory: category,
        currentCount: validTimestamps.length,
        remainingRequests: 0,
        windowResetMs: lockedOutUntilMs,
        isLockedOut: true,
        lockoutRemainingMs: policy.lockoutDurationMs
      };
    }

    // Record request timestamp
    const updatedTimestamps = [...validTimestamps, now];
    this.clientHistories.set(historyKey, {
      ...existing,
      timestampsMs: updatedTimestamps,
      lockedOutUntilMs: undefined
    });

    const remainingRequests = policy.maxRequestsPerWindow - updatedTimestamps.length;
    const oldestTimestamp = updatedTimestamps[0] || now;

    return {
      allowed: true,
      clientIdentifier: clientIdentifier.trim(),
      endpointCategory: category,
      currentCount: updatedTimestamps.length,
      remainingRequests,
      windowResetMs: oldestTimestamp + policy.windowMs,
      isLockedOut: false,
      lockoutRemainingMs: 0
    };
  }

  /**
   * Manually resets lockout state for a client.
   */
  public resetClientLockout(clientIdentifier: string, category: EndpointCategory): boolean {
    const historyKey = `${clientIdentifier.trim()}:${category}`;
    const existing = this.clientHistories.get(historyKey);
    if (!existing) {
      return false;
    }

    this.clientHistories.set(historyKey, {
      ...existing,
      timestampsMs: [],
      lockedOutUntilMs: undefined
    });

    return true;
  }

  public getPolicy(category: EndpointCategory): RateLimitPolicyDTO | undefined {
    return this.policies.get(category);
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): RateLimitAbuseProtectionEngineStateDTO {
    const policyRecord: Record<string, RateLimitPolicyDTO> = {};
    this.policies.forEach((val, key) => {
      policyRecord[key] = val;
    });

    const historyRecord: Record<string, ClientRequestHistoryDTO> = {};
    this.clientHistories.forEach((val, key) => {
      historyRecord[key] = val;
    });

    return {
      tenantId: this.tenantId,
      policies: policyRecord,
      clientHistories: historyRecord
    };
  }

  public importState(state: RateLimitAbuseProtectionEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.policies.clear();
    this.clientHistories.clear();

    Object.entries(state.policies || {}).forEach(([k, v]) => {
      this.policies.set(k as EndpointCategory, v);
    });
    Object.entries(state.clientHistories || {}).forEach(([k, v]) => {
      this.clientHistories.set(k, v);
    });
  }
}
